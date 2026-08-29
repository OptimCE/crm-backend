import { expect, it, jest } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { container } from "../../../src/container/di-container.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { AddressGeoPrecision } from "../../../src/shared/address/address.types.js";
import { GEOCODER_TOKENS } from "../../../src/modules/geocoding/domain/geocoding.types.js";
import type { IGeocoder } from "../../../src/modules/geocoding/domain/i-geocoder.js";
import { AUTH_COMMUNITY_1, ORGS_ADMIN } from "../../utils/shared.consts.js";

const NEW_EAN = "541448820000000777";

const NEW_METER = {
  EAN: NEW_EAN,
  meter_number: "M-SAVEPOINT",
  phases_number: 1,
  tarif_group: 1,
  reading_frequency: 1,
  address: { street: "Savepoint St", number: 7, postcode: "1000", city: "Bruxelles" },
  initial_data: {
    start_date: "2024-06-01",
    status: 1,
    rate: 1,
    client_type: 1,
  },
};

/**
 * A chain that returns a coordinate Postgres will REJECT.
 *
 * Deliberately a real constraint violation rather than a JS throw: only a
 * failing statement puts the transaction into the aborted 25P02 state, which is
 * the exact condition a try/catch cannot undo and a SAVEPOINT can. Latitude 999
 * violates chk_address_geo_range.
 */
async function bindPoisonedInlineChain(): Promise<void> {
  if (container.isBound(GEOCODER_TOKENS.inline)) {
    await container.unbind(GEOCODER_TOKENS.inline);
  }
  container.bind<IGeocoder>(GEOCODER_TOKENS.inline).toConstantValue({
    id: "poisoned",
    supports: jest.fn(async () => true),
    geocode: jest.fn(async () => ({
      latitude: 999,
      longitude: 999,
      precision: AddressGeoPrecision.ROOFTOP,
      source: "poisoned",
    })),
  } as never);
}

describe("(Functional) Address geocoding is isolated by a SAVEPOINT", () => {
  useFunctionalTestDb();

  afterEach(async () => {
    if (container.isBound(GEOCODER_TOKENS.inline)) {
      await container.unbind(GEOCODER_TOKENS.inline);
    }
  });

  it("POST /meters/ : commits the meter even when the coordinate write is rejected", async () => {
    await bindPoisonedInlineChain();
    const { default: app } = await import("../../../src/app.js");

    const created = await request(app)
      .post("/meters/")
      .send(NEW_METER)
      .set("x-user-id", "auth0|admin")
      .set("x-community-id", AUTH_COMMUNITY_1)
      .set("x-user-orgs", ORGS_ADMIN);

    await expectWithLog(created, () => {
      expect(created.status).toBe(200);
      expect(created.body.error_code).toBe(SUCCESS);
    });

    // The real assertion. Without the SAVEPOINT the failed UPDATE aborts the
    // whole transaction, the later COMMIT is silently downgraded to a ROLLBACK,
    // and this read comes back empty behind that very same 200.
    const fetched = await request(app)
      .get(`/meters/${NEW_EAN}`)
      .set("x-user-id", "auth0|admin")
      .set("x-community-id", AUTH_COMMUNITY_1)
      .set("x-user-orgs", ORGS_ADMIN);

    await expectWithLog(fetched, () => {
      expect(fetched.status).toBe(200);
      expect(fetched.body.data.EAN).toBe(NEW_EAN);
    });
  });

  it("POST /meters/ : the meter is created without coordinates rather than with bad ones", async () => {
    await bindPoisonedInlineChain();
    const { default: app } = await import("../../../src/app.js");

    await request(app)
      .post("/meters/")
      .send(NEW_METER)
      .set("x-user-id", "auth0|admin")
      .set("x-community-id", AUTH_COMMUNITY_1)
      .set("x-user-orgs", ORGS_ADMIN);

    const fetched = await request(app)
      .get(`/meters/${NEW_EAN}`)
      .set("x-user-id", "auth0|admin")
      .set("x-community-id", AUTH_COMMUNITY_1)
      .set("x-user-orgs", ORGS_ADMIN);

    await expectWithLog(fetched, () => {
      const address = fetched.body.data.address as { latitude: number | null; longitude: number | null };
      expect(address.latitude).toBeNull();
      expect(address.longitude).toBeNull();
    });
  });
});
