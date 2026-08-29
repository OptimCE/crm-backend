import { expect, it, jest } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { container } from "../../../src/container/di-container.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { AddressGeoPrecision } from "../../../src/shared/address/address.types.js";
import { GEOCODER_TOKENS } from "../../../src/modules/geocoding/domain/geocoding.types.js";
import type { IGeocoder } from "../../../src/modules/geocoding/domain/i-geocoder.js";
import { AUTH_COMMUNITY_1, ORGS_ADMIN, ORGS_GESTIONNAIRE, ORGS_MEMBER } from "../../utils/shared.consts.js";

const AUTH_USER = "auth0|admin";

/**
 * Binds a stand-in for the full chain.
 *
 * NODE_ENV=test skips the geocoding factory entirely, exactly as it skips every
 * other network adapter — so these tests bind their own rather than reaching a
 * public service from CI.
 */
async function bindFullChain(geocode: () => Promise<unknown>): Promise<void> {
  if (container.isBound(GEOCODER_TOKENS.full)) {
    await container.unbind(GEOCODER_TOKENS.full);
  }
  container.bind<IGeocoder>(GEOCODER_TOKENS.full).toConstantValue({
    id: "test_chain",
    supports: jest.fn(async () => true),
    geocode,
  } as never);
}

async function unbindFullChain(): Promise<void> {
  if (container.isBound(GEOCODER_TOKENS.full)) {
    await container.unbind(GEOCODER_TOKENS.full);
  }
}

function post(body: Record<string, unknown>, orgs: string = ORGS_ADMIN, user: string | null = AUTH_USER): Promise<request.Test> {
  return import("../../../src/app.js").then(({ default: app }) => {
    const req = request(app).post("/geocoding/backfill").send(body).set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", orgs);
    return user ? req.set("x-user-id", user) : req;
  });
}

describe("(Functional) Geocoding Backfill", () => {
  useFunctionalTestDb();

  afterEach(async () => {
    await unbindFullChain();
  });

  it("POST /geocoding/backfill : 503s when no chain is configured", async () => {
    // Better than reporting a batch of phantom NOT_FOUNDs, which would leave
    // `remaining` unchanged and an operator looping forever.
    const response = await post({ limit: 5 });

    expect(response.status).toBe(503);
  });

  it("POST /geocoding/backfill : resolves queued addresses and drains the queue", async () => {
    await bindFullChain(async () => ({
      latitude: 50.85,
      longitude: 4.35,
      precision: AddressGeoPrecision.ROOFTOP,
      source: "test_chain",
    }));

    const first = await post({ limit: 50 });

    await expectWithLog(first, () => {
      expect(first.status).toBe(200);
      expect(first.body.error_code).toBe(SUCCESS);
      expect(first.body.data.attempted).toBeGreaterThan(0);
      expect(first.body.data.succeeded).toBe(first.body.data.attempted);
      expect(first.body.data.remaining).toBe(0);
    });

    // Idempotent: a second run finds nothing left to do.
    const second = await post({ limit: 50 });
    expect(second.body.data.attempted).toBe(0);
    expect(second.body.data.remaining).toBe(0);
  });

  it("POST /geocoding/backfill : records a no-match without retrying it forever", async () => {
    await bindFullChain(async () => null);

    const first = await post({ limit: 50 });
    expect(first.body.data.not_found).toBeGreaterThan(0);
    expect(first.body.data.succeeded).toBe(0);

    // NOT_FOUND leaves the queue, so a second pass does not re-attempt it.
    const second = await post({ limit: 50 });
    expect(second.body.data.attempted).toBe(0);
  });

  it("POST /geocoding/backfill : an upstream failure is counted, not thrown", async () => {
    await bindFullChain(async () => {
      throw new Error("upstream down");
    });

    const response = await post({ limit: 50 });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.data.errored).toBeGreaterThan(0);
    });
  });

  describe("(Functional) Geocoding Backfill — authorisation", () => {
    it("rejects a request with no user", async () => {
      await bindFullChain(async () => null);
      const response = await post({}, ORGS_ADMIN, null);

      expect(response.status).toBe(400);
    });

    it("rejects a GESTIONNAIRE", async () => {
      await bindFullChain(async () => null);
      const response = await post({}, ORGS_GESTIONNAIRE);

      expect(response.status).toBe(403);
    });

    it("rejects a MEMBER", async () => {
      await bindFullChain(async () => null);
      const response = await post({}, ORGS_MEMBER);

      expect(response.status).toBe(403);
    });
  });
});
