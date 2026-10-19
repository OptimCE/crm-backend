import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { container } from "../../../src/container/di-container.js";
import { DsoService } from "../../../src/modules/dso/infra/dso.service.js";
import { DSO_LOOKUP_CLIENT_TOKEN, type IDsoLookupClient } from "../../../src/modules/dso/domain/i-dso-lookup.client.js";
import type { DsoCommune, DsoEanCheck, DsoResolveResponse, DsoResult, DsoSection } from "../../../src/modules/dso/domain/dso.types.js";
import { DsoUnavailableError } from "../../../src/modules/dso/shared/dso-unavailable.error.js";
import type { Community } from "../../../src/modules/communities/domain/community.models.js";
import { createMockAuthContextRepository } from "../../repository_mocked/authcontext.repository.mock.js";
import { createMockCommunityRepository } from "../../repository_mocked/community.repository.mock.js";

const VERSION = "2026.10.0";

const NAMUR: DsoCommune = { ins: "92094", names: { fr: "Namur", nl: "Namen", de: "Namür" }, region: "WAL", province: "BE-WNA" };
const ETTERBEEK: DsoCommune = { ins: "21005", names: { fr: "Etterbeek", nl: "Etterbeek", de: "Etterbeek" }, region: "BRU", province: "" };
const BRUXELLES: DsoCommune = { ins: "21004", names: { fr: "Bruxelles", nl: "Brussel", de: "Brüssel" }, region: "BRU", province: "" };

const FLAWINNE: DsoSection = {
  section_key: "flawinne",
  names: { fr: "Flawinne", nl: "Flawinne", de: "Flawinne" },
  postcodes: ["5020"],
  elec_operator: "ores",
};

function result(over: Partial<DsoResult> = {}): DsoResult {
  return {
    ins: "92094",
    commune: NAMUR.names,
    section: null,
    region: "WAL",
    regulator: "BE-WAL-CWAPE",
    elec: { operator: "ores", designated: "ores" },
    gas: { status: "designated", operator: "ores" },
    flags: [],
    note: null,
    source_ids: ["cwape-ores"],
    valid_from: null,
    data_version: VERSION,
    ...over,
  };
}

const OK: DsoResolveResponse = { status: "ok", result: result(), data_version: VERSION };
const OK_FLAWINNE: DsoResolveResponse = { status: "ok", result: result({ section: FLAWINNE }), data_version: VERSION };
const CHOOSE_SECTION: DsoResolveResponse = { status: "choose_section", communes: [NAMUR], sections: [FLAWINNE], data_version: VERSION };
const CHOOSE_COMMUNE: DsoResolveResponse = { status: "choose_commune", communes: [ETTERBEEK, BRUXELLES], data_version: VERSION };
const NOT_FOUND: DsoResolveResponse = { status: "not_found", communes: null, sections: null, result: null, data_version: VERSION };

const PLAIN_EAN: DsoEanCheck = { format: true, belgian_prefix: true, gs1_check: true, known_operator: null };
const SIBELGA_EAN: DsoEanCheck = { format: true, belgian_prefix: true, gs1_check: false, known_operator: "sibelga" };

interface ClientStub {
  resolve: jest.Mock<IDsoLookupClient["resolve"]>;
  resolveAddress: jest.Mock<IDsoLookupClient["resolveAddress"]>;
  operators: jest.Mock<IDsoLookupClient["operators"]>;
  eanCheck: jest.Mock<IDsoLookupClient["eanCheck"]>;
  meta: jest.Mock<IDsoLookupClient["meta"]>;
}

function stubClient(): ClientStub {
  return {
    resolve: jest.fn(async () => OK),
    resolveAddress: jest.fn(async () => OK),
    operators: jest.fn(async () => []),
    eanCheck: jest.fn(async () => PLAIN_EAN),
    meta: jest.fn(),
  } as unknown as ClientStub;
}

async function bindClient(client: ClientStub): Promise<void> {
  if (container.isBound(DSO_LOOKUP_CLIENT_TOKEN)) {
    await container.unbind(DSO_LOOKUP_CLIENT_TOKEN);
  }
  container.bind<IDsoLookupClient>(DSO_LOOKUP_CLIENT_TOKEN).toConstantValue(client as unknown as IDsoLookupClient);
}

function service(regulator: string | Error = "BE-WAL-CWAPE"): {
  dso: DsoService;
  authContext: ReturnType<typeof createMockAuthContextRepository>;
  communityRepo: ReturnType<typeof createMockCommunityRepository>;
} {
  const authContext = createMockAuthContextRepository();
  const communityRepo = createMockCommunityRepository();
  authContext.getInternalCommunityId.mockResolvedValue(1);
  if (regulator instanceof Error) {
    communityRepo.getCommunityById.mockRejectedValue(regulator);
  } else {
    communityRepo.getCommunityById.mockResolvedValue({ community: { id: 1, regulator } as Community, member_count: 0 });
  }
  return { dso: new DsoService(authContext, communityRepo), authContext, communityRepo };
}

afterEach(async () => {
  if (container.isBound(DSO_LOOKUP_CLIENT_TOKEN)) {
    await container.unbind(DSO_LOOKUP_CLIENT_TOKEN);
  }
});

describe("(Unit) DsoService.resolve", () => {
  let client: ClientStub;

  beforeEach(async () => {
    client = stubClient();
    await bindClient(client);
  });

  describe("unavailable", () => {
    it("answers unavailable, without a database read, when no client is bound", async () => {
      // binding.ts skips the factory under NODE_ENV=test and binds nothing
      // without a URL: unbound must mean "feature off", not an exception.
      await container.unbind(DSO_LOOKUP_CLIENT_TOKEN);
      const { dso, communityRepo } = service();

      expect(await dso.resolve({ postcode: "5020" })).toEqual({ available: false, status: "unavailable", warnings: [] });
      expect(communityRepo.getCommunityById).not.toHaveBeenCalled();
    });

    it.each([
      { label: "a timeout", error: new DsoUnavailableError("timeout") },
      { label: "a 503", error: new DsoUnavailableError("status", 503) },
      { label: "an unexpected exception", error: new TypeError("boom") },
    ])("answers unavailable on $label, never throwing", async ({ error }) => {
      client.resolve.mockRejectedValue(error);
      const { dso } = service();

      expect(await dso.resolve({ postcode: "5020" })).toEqual({ available: false, status: "unavailable", warnings: [] });
    });

    it("answers unavailable when the follow-up call fails", async () => {
      client.resolve.mockResolvedValue(CHOOSE_SECTION);
      client.resolveAddress.mockRejectedValue(new DsoUnavailableError("timeout"));
      const { dso } = service();

      expect((await dso.resolve({ postcode: "5020", city: "Flawinne" })).status).toBe("unavailable");
    });
  });

  describe("route selection", () => {
    it("by postcode alone: one /resolve call, the answer passed through", async () => {
      const { dso } = service();

      const answer = await dso.resolve({ postcode: "7500" });

      expect(client.resolve).toHaveBeenCalledWith("7500", undefined);
      expect(client.resolveAddress).not.toHaveBeenCalled();
      expect(answer).toEqual({ available: true, status: "ok", result: result(), warnings: [], data_version: VERSION });
    });

    it("with a picker NIS code: the address route, zero-padded, with the picker's post_name", async () => {
      client.resolveAddress.mockResolvedValue(OK_FLAWINNE);
      const { dso } = service();

      const answer = await dso.resolve({ nis_code: 1000, postcode: "5020", post_name: "Flawinne", city: "Namur" });

      // NEVER the city as post_name: the register fills it with the commune name.
      expect(client.resolveAddress).toHaveBeenCalledWith("01000", "5020", "Flawinne");
      expect(client.resolve).not.toHaveBeenCalled();
      expect(answer.result?.section).toEqual(FLAWINNE);
    });

    it("with a picker NIS code and no post_name: no post_name at all, not the city", async () => {
      client.resolveAddress.mockResolvedValue(CHOOSE_SECTION);
      const { dso } = service();

      const answer = await dso.resolve({ nis_code: 92094, postcode: "5020", city: "Namur" });

      expect(client.resolveAddress).toHaveBeenCalledWith("92094", "5020", undefined);
      expect(answer.status).toBe("choose_section");
      expect(answer.sections).toEqual([FLAWINNE]);
    });

    it("with an explicit section: the postcode route, even when a NIS code is also sent", async () => {
      // The user's choice from a previous choose_section must win, or the
      // address route would answer choose_section again, forever.
      client.resolve.mockResolvedValue(OK_FLAWINNE);
      const { dso } = service();

      await dso.resolve({ nis_code: 92094, postcode: "5020", post_name: "Namur", section: "flawinne" });

      expect(client.resolve).toHaveBeenCalledWith("5020", "92094", "flawinne");
      expect(client.resolveAddress).not.toHaveBeenCalled();
    });

    it("with an explicit commune and section: both forwarded as chosen", async () => {
      const { dso } = service();

      await dso.resolve({ postcode: "5020", ins: "92094", section: "flawinne" });

      expect(client.resolve).toHaveBeenCalledWith("5020", "92094", "flawinne");
    });
  });

  describe("choose_section retry by city", () => {
    it("retries the address route once with the commune and the typed city", async () => {
      client.resolve.mockResolvedValue(CHOOSE_SECTION);
      client.resolveAddress.mockResolvedValue(OK_FLAWINNE);
      const { dso } = service();

      const answer = await dso.resolve({ postcode: "5020", city: "Flawinne" });

      expect(client.resolveAddress).toHaveBeenCalledWith("92094", "5020", "Flawinne");
      expect(answer.status).toBe("ok");
      expect(answer.result?.section?.section_key).toBe("flawinne");
    });

    it("skips the retry when the city is the commune's own name", async () => {
      // "5020 Namur" cannot pick a section: dso-lookup answers choose_section to
      // it by contract, so the second call would only spend the budget.
      client.resolve.mockResolvedValue(CHOOSE_SECTION);
      const { dso } = service();

      const answer = await dso.resolve({ postcode: "5020", city: "NAMUR " });

      expect(client.resolveAddress).not.toHaveBeenCalled();
      expect(answer.status).toBe("choose_section");
      expect(answer.communes).toEqual([NAMUR]);
    });

    it("skips the retry without a city", async () => {
      client.resolve.mockResolvedValue(CHOOSE_SECTION);
      const { dso } = service();

      await dso.resolve({ postcode: "5020", city: " - " });

      expect(client.resolveAddress).not.toHaveBeenCalled();
    });

    it("keeps the first answer when the retry finds nothing", async () => {
      client.resolve.mockResolvedValue(CHOOSE_SECTION);
      client.resolveAddress.mockResolvedValue(NOT_FOUND);
      const { dso } = service();

      const answer = await dso.resolve({ postcode: "5020", city: "Flawine" });

      expect(answer.status).toBe("choose_section");
      expect(answer.sections).toEqual([FLAWINNE]);
    });

    it("keeps a choose_section second answer: still the better question", async () => {
      client.resolve.mockResolvedValue(CHOOSE_SECTION);
      client.resolveAddress.mockResolvedValue(CHOOSE_SECTION);
      const { dso } = service();

      expect((await dso.resolve({ postcode: "5020", city: "Somewhere" })).status).toBe("choose_section");
      expect(client.resolveAddress).toHaveBeenCalledTimes(1);
    });
  });

  describe("choose_commune retry by city", () => {
    it("retries with the one commune the city names, accents and case aside", async () => {
      client.resolve.mockResolvedValue(CHOOSE_COMMUNE);
      client.resolveAddress.mockResolvedValue({
        status: "ok",
        result: result({ ins: "21004", region: "BRU", regulator: "BE-BRU-BRUGEL" }),
        data_version: VERSION,
      });
      const { dso } = service("BE-BRU-BRUGEL");

      const answer = await dso.resolve({ postcode: "1040", city: "BRÜSSEL" });

      expect(client.resolveAddress).toHaveBeenCalledWith("21004", "1040", "BRÜSSEL");
      expect(answer.status).toBe("ok");
    });

    it("leaves the choice to the user when the city names no candidate", async () => {
      client.resolve.mockResolvedValue(CHOOSE_COMMUNE);
      const { dso } = service();

      const answer = await dso.resolve({ postcode: "1040", city: "Ixelles" });

      expect(client.resolveAddress).not.toHaveBeenCalled();
      expect(answer.status).toBe("choose_commune");
      expect(answer.communes).toEqual([ETTERBEEK, BRUXELLES]);
    });

    it("leaves the choice to the user when the city names several candidates", async () => {
      const twin = { ...BRUXELLES, ins: "99999", names: { fr: "Etterbeek", nl: "X", de: "Y" } };
      client.resolve.mockResolvedValue({ ...CHOOSE_COMMUNE, communes: [ETTERBEEK, twin] });
      const { dso } = service();

      expect((await dso.resolve({ postcode: "1040", city: "Etterbeek" })).status).toBe("choose_commune");
      expect(client.resolveAddress).not.toHaveBeenCalled();
    });

    it("does not retry from a plain ok or not_found", async () => {
      client.resolve.mockResolvedValue(NOT_FOUND);
      const { dso } = service();

      const answer = await dso.resolve({ postcode: "9999", city: "Nowhere" });

      expect(client.resolveAddress).not.toHaveBeenCalled();
      // dso-lookup's nulls are dropped rather than echoed.
      expect(answer).toEqual({ available: true, status: "not_found", warnings: [], data_version: VERSION });
    });
  });

  describe("EAN check and warnings", () => {
    it("checks the EAN in parallel and returns it", async () => {
      const { dso } = service();

      const answer = await dso.resolve({ postcode: "7500", ean: "541448200000000008" });

      expect(client.eanCheck).toHaveBeenCalledWith("541448200000000008");
      expect(answer.ean_check).toEqual(PLAIN_EAN);
      expect(answer.warnings).toEqual([]);
    });

    it("does not check an EAN that was not sent", async () => {
      const { dso } = service();

      const answer = await dso.resolve({ postcode: "7500" });

      expect(client.eanCheck).not.toHaveBeenCalled();
      expect(answer.ean_check).toBeUndefined();
    });

    it("drops a failed EAN check and keeps the resolution", async () => {
      client.eanCheck.mockRejectedValue(new DsoUnavailableError("timeout"));
      const { dso } = service();

      const answer = await dso.resolve({ postcode: "7500", ean: "541448200000000008" });

      expect(answer.status).toBe("ok");
      expect(answer.ean_check).toBeUndefined();
    });

    it("warns about a Sibelga EAN outside Brussels", async () => {
      client.eanCheck.mockResolvedValue(SIBELGA_EAN);
      const { dso } = service();

      const answer = await dso.resolve({ postcode: "4000", ean: "541448920000000001" });

      expect(answer.warnings).toEqual([{ code: "EAN_SIBELGA_OUTSIDE_BRUSSELS", params: { region: "WAL" } }]);
    });

    it("warns when the address is outside the community's regulator", async () => {
      client.resolve.mockResolvedValue({ status: "ok", result: result({ region: "VLA", regulator: "BE-VLA-VREG" }), data_version: VERSION });
      const { dso } = service("BE-WAL-CWAPE");

      const answer = await dso.resolve({ postcode: "3790" });

      expect(answer.warnings).toEqual([
        { code: "REGION_OUTSIDE_COMMUNITY_REGULATOR", params: { address_regulator: "BE-VLA-VREG", community_regulator: "BE-WAL-CWAPE" } },
      ]);
    });

    it("skips the regulator warning, and keeps the answer, when the community cannot be read", async () => {
      client.resolve.mockResolvedValue({ status: "ok", result: result({ region: "VLA", regulator: "BE-VLA-VREG" }), data_version: VERSION });
      const { dso } = service(new Error("db down"));

      const answer = await dso.resolve({ postcode: "3790" });

      expect(answer.status).toBe("ok");
      expect(answer.warnings).toEqual([]);
    });
  });
});

describe("(Unit) DsoService.getOperators", () => {
  it("is [] when no client is bound", async () => {
    expect(await service().dso.getOperators()).toEqual([]);
  });

  it("passes the catalogue through, in dso-lookup's order", async () => {
    const client = stubClient();
    client.operators.mockResolvedValue([{ id: "ores" }, { id: "elia" }] as never);
    await bindClient(client);

    expect((await service().dso.getOperators()).map((o) => o.id)).toEqual(["ores", "elia"]);
  });

  it("is [] rather than an error when dso-lookup is down", async () => {
    const client = stubClient();
    client.operators.mockRejectedValue(new DsoUnavailableError("network"));
    await bindClient(client);

    expect(await service().dso.getOperators()).toEqual([]);
  });
});
