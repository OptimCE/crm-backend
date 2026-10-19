import { afterEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import { useUnitTestDb } from "../../utils/test.unit.wrapper.js";
import { expectWithLog, mockAuthContextRepositoryModule, mockCommunityRepositoryModule } from "../../utils/helper.js";
import { AUTH_COMMUNITY_1, ORGS_ADMIN } from "../../utils/shared.consts.js";
import { GLOBAL_ERRORS } from "../../../src/shared/errors/errors.js";
import { DSO_LOOKUP_CLIENT_TOKEN, type IDsoLookupClient } from "../../../src/modules/dso/domain/i-dso-lookup.client.js";
import type { Community } from "../../../src/modules/communities/domain/community.models.js";

async function get(path: string, query: Record<string, string> = {}, withCommunity = true): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  const req = request(appModule.default).get(path).query(query).set("x-user-id", "1").set("x-user-orgs", ORGS_ADMIN);
  return withCommunity ? req.set("x-community-id", AUTH_COMMUNITY_1) : req;
}

// The container is imported lazily, like in health.test.ts: a static import ahead of
// the app's own top-level-await import leaves `app.default` uninitialised.
async function bindClient(client: Partial<IDsoLookupClient>): Promise<void> {
  const { container } = await import("../../../src/container/di-container.js");
  if (container.isBound(DSO_LOOKUP_CLIENT_TOKEN)) {
    await container.unbind(DSO_LOOKUP_CLIENT_TOKEN);
  }
  container.bind<IDsoLookupClient>(DSO_LOOKUP_CLIENT_TOKEN).toConstantValue(client as IDsoLookupClient);
}

afterEach(async () => {
  const { container } = await import("../../../src/container/di-container.js");
  if (container.isBound(DSO_LOOKUP_CLIENT_TOKEN)) {
    await container.unbind(DSO_LOOKUP_CLIENT_TOKEN);
  }
});

describe("(Unit) DSO routes", () => {
  useUnitTestDb();

  describe("GET /dso/resolve", () => {
    it("answers 200 unavailable when dso-lookup is not configured", async () => {
      // NODE_ENV=test never runs the factory, exactly like a deployment with an
      // empty DSO_LOOKUP_URL: the form must get a normal answer, not an error.
      const response = await get("/dso/resolve", { postcode: "5020", city: "Namur" });

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.error_code).toBe(0);
        expect(response.body.data).toEqual({ available: false, status: "unavailable", warnings: [] });
      });
    });

    it("forwards the picker's NIS code and post_name, and returns dso-lookup's answer", async () => {
      const resolveAddress = jest.fn(async () => ({
        status: "choose_section" as const,
        communes: [{ ins: "92094", names: { fr: "Namur", nl: "Namen", de: "Namur" }, region: "WAL" as const, province: "BE-WNA" }],
        sections: [],
        data_version: "2026.10.0",
      }));
      await bindClient({ resolveAddress, resolve: jest.fn(), eanCheck: jest.fn() } as never);
      await mockAuthContextRepositoryModule({ getInternalCommunityId: jest.fn(async () => 1) });
      await mockCommunityRepositoryModule({
        getCommunityById: jest.fn(async () => ({ community: { id: 1, regulator: "BE-WAL-CWAPE" } as Community, member_count: 0 })),
      });

      const response = await get("/dso/resolve", { nis_code: "92094", postcode: "5020", post_name: "Flawinne" });

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({ available: true, status: "choose_section", data_version: "2026.10.0", warnings: [] });
      });
      expect(resolveAddress).toHaveBeenCalledWith("92094", "5020", "Flawinne");
    });

    it("requires the community header: the warnings depend on the community's regulator", async () => {
      const response = await get("/dso/resolve", { postcode: "5020" }, false);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it.each([
      { label: "a non-numeric nis_code", query: { nis_code: "abc" }, error: GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER },
      { label: "a six-digit nis_code", query: { nis_code: "100000" }, error: GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER },
      { label: "an ins that is not 5 digits", query: { postcode: "5020", ins: "9209" }, error: GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING },
      { label: "an over-long postcode", query: { postcode: "123456789" }, error: GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING },
    ])("rejects $label with a 422", async ({ query, error }) => {
      const response = await get("/dso/resolve", query);

      await expectWithLog(response, () => {
        expect(response.status).toBe(422);
        expect(response.body.error_code).toBe(error.errorCode);
      });
    });

    it("accepts a malformed but short postcode: that is a not_found, not a 422", async () => {
      const response = await get("/dso/resolve", { postcode: "5O20" });

      expect(response.status).toBe(200);
    });
  });

  describe("GET /dso/operators", () => {
    it("answers [] when dso-lookup is not configured, so the form keeps its static list", async () => {
      const response = await get("/dso/operators", {}, false);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
      });
    });

    it("needs no community: national reference data", async () => {
      await bindClient({ operators: jest.fn(async () => [{ id: "ores" }, { id: "elia" }]) } as never);

      const response = await get("/dso/operators", {}, false);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.data.map((o: { id: string }) => o.id)).toEqual(["ores", "elia"]);
      });
    });
  });
});
