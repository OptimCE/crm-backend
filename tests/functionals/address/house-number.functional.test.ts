import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { AUTH_COMMUNITY_1, ORGS_ADMIN } from "../../utils/shared.consts.js";

const AS_ADMIN = {
  "x-user-id": "auth0|admin",
  "x-community-id": AUTH_COMMUNITY_1,
  "x-user-orgs": ORGS_ADMIN,
};

function meterPayload(ean: string, address: Record<string, unknown>): Record<string, unknown> {
  return {
    EAN: ean,
    meter_number: `M-${ean.slice(-4)}`,
    phases_number: 1,
    tarif_group: 1,
    reading_frequency: 1,
    address,
    initial_data: { start_date: "2024-06-01", status: 1, rate: 1, client_type: 1 },
  };
}

function post(app: unknown, body: unknown): request.Test {
  return request(app as never)
    .post("/meters/")
    .send(body as never)
    .set(AS_ADMIN);
}

/**
 * The end-to-end proof for the 2026-08-30 widening.
 *
 * `address.number` was an INT, so the schema could not store what the federal
 * BeSt Address register returns — and an address picker fed by that register
 * would have had to mangle or reject real addresses. `20A` and `2B` are both
 * real values on one street in Namur.
 */
describe("(Functional) House numbers are text", () => {
  useFunctionalTestDb();

  it("POST /meters/ : accepts and stores an alphanumeric house number", async () => {
    const { default: app } = await import("../../../src/app.js");
    const ean = "541448820000000801";

    const created = await post(app, meterPayload(ean, { street: "Rue de la Station", number: "20A", postcode: "5000", city: "Namur" }));
    await expectWithLog(created, () => {
      expect(created.status).toBe(200);
      expect(created.body.error_code).toBe(SUCCESS);
    });

    const fetched = await request(app).get(`/meters/${ean}`).set(AS_ADMIN);
    await expectWithLog(fetched, () => {
      expect(fetched.body.data.address.number).toBe("20A");
    });
  });

  it("POST /meters/ : stores the box number, which addAddress used to drop", async () => {
    // Regression. The dedup in addAddress compared `supplement`, but the INSERT
    // omitted it — so an address with a box number never matched itself on the
    // next write, and a duplicate row was inserted every single time while the
    // box was silently lost.
    const { default: app } = await import("../../../src/app.js");
    const ean = "541448820000000802";

    const created = await post(
      app,
      meterPayload(ean, {
        street: "Rue du Commerce",
        number: "12",
        supplement: "B3",
        postcode: "1000",
        city: "Bruxelles",
      }),
    );
    await expectWithLog(created, () => expect(created.status).toBe(200));

    const fetched = await request(app).get(`/meters/${ean}`).set(AS_ADMIN);
    await expectWithLog(fetched, () => {
      expect(fetched.body.data.address.supplement).toBe("B3");
    });
  });

  it("POST /meters/ : normalises a padded house number on the way in", async () => {
    // As an INT, `  40  ` and `40` were the same value. As text they are two
    // different strings, so without normalisation they stop comparing equal —
    // which breaks the dedup in AddressRepository and shows a padded number in
    // every rendered address line.
    //
    // The normalisation lives on the DTO rather than only in AddressRepository
    // precisely so this path is covered: meter.repository.ts:382-385 builds its
    // Address with manager.create() and never reaches that repository.
    const { default: app } = await import("../../../src/app.js");
    const ean = "541448820000000803";

    const created = await post(
      app,
      meterPayload(ean, {
        street: "Rue Neuve",
        number: "  40  ",
        postcode: "1000",
        city: "Bruxelles",
      }),
    );
    await expectWithLog(created, () => expect(created.status).toBe(200));

    const fetched = await request(app).get(`/meters/${ean}`).set(AS_ADMIN);
    await expectWithLog(fetched, () => {
      expect(fetched.body.data.address.number).toBe("40");
    });
  });

  it("POST /meters/ : rejects a house number that is only separators", async () => {
    const { default: app } = await import("../../../src/app.js");

    const created = await post(
      app,
      meterPayload("541448820000000805", {
        street: "Rue Vide",
        number: "  ",
        postcode: "1000",
        city: "Bruxelles",
      }),
    );
    await expectWithLog(created, () => {
      // A 4xx, not the 500 an unguarded value would produce at the database.
      expect(created.status).toBeGreaterThanOrEqual(400);
      expect(created.status).toBeLessThan(500);
    });
  });

  it("POST /meters/ : defaults country to BE", async () => {
    const { default: app } = await import("../../../src/app.js");
    const ean = "541448820000000806";

    await post(app, meterPayload(ean, { street: "Rue Test", number: "1", postcode: "1000", city: "Bruxelles" }));

    const fetched = await request(app).get(`/meters/${ean}`).set(AS_ADMIN);
    await expectWithLog(fetched, () => {
      expect(fetched.body.data.address.country).toBe("BE");
    });
  });
});
