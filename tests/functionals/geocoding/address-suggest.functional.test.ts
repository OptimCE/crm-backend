import { afterEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { container } from "../../../src/container/di-container.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { AddressGeoPrecision } from "../../../src/shared/address/address.types.js";
import { ADDRESS_SUGGESTER_TOKEN, type IAddressSuggester } from "../../../src/modules/geocoding/domain/i-address-suggester.js";
import type { AddressSuggestion } from "../../../src/modules/geocoding/domain/address-suggestion.types.js";
import { clearSuggestionCache } from "../../../src/modules/geocoding/infra/suggestion.cache.js";
import { AUTH_COMMUNITY_1, ORGS_ADMIN } from "../../utils/shared.consts.js";

const AS_USER = { "x-user-id": "auth0|admin", "x-user-orgs": ORGS_ADMIN };

const ROW: AddressSuggestion = {
  id: "geodata.wallonie.be/id/Address/1948446/2",
  kind: "address",
  label: "Place de la Station 20A, 5000 Namur",
  street: "Place de la Station",
  number: "20A",
  postcode: "5000",
  city: "Namur",
  country: "BE",
  latitude: 50.46822,
  longitude: 4.863607,
  precision: AddressGeoPrecision.ROOFTOP,
  best_address_id: "geodata.wallonie.be/id/Address/1948446/2",
  nis_code: 92094,
};

/**
 * A stub, deliberately.
 *
 * The register lives in an opt-in container that CI does not run, and a test
 * that needs it would be red for everyone who has not started it. What is worth
 * asserting here is the wiring the container cannot break: that the routes are
 * registered, that they are reachable WITHOUT a community context, that the
 * query DTOs validate, and that an unbound suggester degrades to an empty list
 * rather than a 500. The register integration itself is exercised by hand.
 */
async function bindSuggester(suggest: IAddressSuggester["suggest"]): Promise<void> {
  if (container.isBound(ADDRESS_SUGGESTER_TOKEN)) {
    await container.unbind(ADDRESS_SUGGESTER_TOKEN);
  }
  container.bind<IAddressSuggester>(ADDRESS_SUGGESTER_TOKEN).toConstantValue({ id: "stub", suggest });
}

describe("(Functional) Address suggestions", () => {
  useFunctionalTestDb();

  afterEach(async () => {
    if (container.isBound(ADDRESS_SUGGESTER_TOKEN)) {
      await container.unbind(ADDRESS_SUGGESTER_TOKEN);
    }
    clearSuggestionCache();
  });

  it("GET /geocoding/suggest : returns rows for a query", async () => {
    await bindSuggester(jest.fn(async () => [ROW]) as never);
    const { default: app } = await import("../../../src/app.js");

    const res = await request(app).get("/geocoding/suggest?q=place%20de%20la%20station%2020A%205000").set(AS_USER);

    await expectWithLog(res, () => {
      expect(res.status).toBe(200);
      expect(res.body.error_code).toBe(SUCCESS);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].label).toBe("Place de la Station 20A, 5000 Namur");
      expect(res.body.data[0].number).toBe("20A");
      expect(res.body.data[0].precision).toBe(AddressGeoPrecision.ROOFTOP);
    });
  });

  it("GET /geocoding/suggest : needs NO community context", async () => {
    // The invitation self-encoding form runs for a user who has not joined a
    // community yet. A communityIdChecker here would kill the picker on exactly
    // the form where a new user first types an address.
    await bindSuggester(jest.fn(async () => [ROW]) as never);
    const { default: app } = await import("../../../src/app.js");

    const res = await request(app).get("/geocoding/suggest?q=rue%20de%20la%20loi").set({ "x-user-id": "auth0|admin" });

    await expectWithLog(res, () => expect(res.status).toBe(200));
  });

  it("GET /geocoding/suggest : answers [] when the register is not configured", async () => {
    // Unbound == the feature is off. It must NOT be a 503: the picker is
    // advisory, and every form it sits in has to stay usable without it.
    const { default: app } = await import("../../../src/app.js");

    const res = await request(app).get("/geocoding/suggest?q=rue%20de%20la%20loi").set(AS_USER);

    await expectWithLog(res, () => {
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  it("GET /geocoding/suggest : a failing provider degrades to [], never a 500", async () => {
    await bindSuggester(jest.fn(async () => Promise.reject(new Error("register exploded"))) as never);
    const { default: app } = await import("../../../src/app.js");

    const res = await request(app).get("/geocoding/suggest?q=rue%20de%20la%20loi").set(AS_USER);

    await expectWithLog(res, () => {
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  it("GET /geocoding/suggest : rejects a missing query", async () => {
    const { default: app } = await import("../../../src/app.js");

    const res = await request(app).get("/geocoding/suggest").set(AS_USER);

    await expectWithLog(res, () => {
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });
  });

  it("GET /geocoding/suggest : caps limit rather than trusting it", async () => {
    const { default: app } = await import("../../../src/app.js");

    const res = await request(app).get("/geocoding/suggest?q=rue&limit=5000").set(AS_USER);

    await expectWithLog(res, () => {
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });
  });

  it("GET /geocoding/preview : reports an address it cannot locate, WITHOUT failing", async () => {
    // The pre-save warning. `found: false` is a normal answer, not an error —
    // the form shows a warning and the user saves anyway if they want to.
    await bindSuggester(jest.fn(async () => [ROW]) as never);
    const { default: app } = await import("../../../src/app.js");

    const res = await request(app).get("/geocoding/preview?street=Rue%20Inexistante&number=1&postcode=9999&city=Nowhere").set(AS_USER);

    await expectWithLog(res, () => {
      expect(res.status).toBe(200);
      expect(res.body.data.found).toBe(false);
      // A warning with a way out of it, not just a warning.
      expect(res.body.data.suggestions).toHaveLength(1);
    });
  });

  it("GET /geocoding/preview : writes nothing", async () => {
    const { default: app } = await import("../../../src/app.js");

    const before = await request(app)
      .get("/meters/map")
      .set({ ...AS_USER, "x-community-id": AUTH_COMMUNITY_1 });
    await request(app).get("/geocoding/preview?street=Rue%20de%20la%20Loi&number=16&postcode=1000&city=Bruxelles").set(AS_USER);
    const after = await request(app)
      .get("/meters/map")
      .set({ ...AS_USER, "x-community-id": AUTH_COMMUNITY_1 });

    await expectWithLog(after, () => {
      expect(after.body.data.total_plottable).toBe(before.body.data.total_plottable);
    });
  });

  it("GET /geocoding/preview : rejects an incomplete address", async () => {
    const { default: app } = await import("../../../src/app.js");

    const res = await request(app).get("/geocoding/preview?street=Rue%20de%20la%20Loi").set(AS_USER);

    await expectWithLog(res, () => {
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });
  });
});
