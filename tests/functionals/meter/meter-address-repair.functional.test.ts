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

const EAN = "541448820000000901";

const NEW_METER = {
  EAN,
  meter_number: "M-REPAIR",
  phases_number: 1,
  tarif_group: 1,
  reading_frequency: 1,
  address: { street: "Rue Mal Encodee", number: "1", postcode: "1000", city: "Bruxelles" },
  initial_data: { start_date: "2024-06-01", status: 1, rate: 1, client_type: 1 },
};

/**
 * The repair flow's backend half.
 *
 * Geocoding is OFF under NODE_ENV=test, so anything created here has no
 * coordinate — which is exactly the population the repair dialog lists.
 */
describe("(Functional) Repairing a meter address", () => {
  useFunctionalTestDb();

  it("GET /meters/?located=false : lists a meter that is not usably on the map", async () => {
    const { default: app } = await import("../../../src/app.js");

    const created = await request(app).post("/meters/").send(NEW_METER).set(AS_ADMIN);
    await expectWithLog(created, () => expect(created.status).toBe(200));

    const unlocated = await request(app).get("/meters/?located=false&limit=100").set(AS_ADMIN);

    await expectWithLog(unlocated, () => {
      expect(unlocated.status).toBe(200);
      const eans = (unlocated.body.data as { EAN: string }[]).map((m) => m.EAN);
      expect(eans).toContain(EAN);
    });
  });

  it("GET /meters/?located=true : excludes it", async () => {
    // The two filters must partition the list — otherwise the strip's count and
    // the rows the repair dialog shows would drift apart.
    const { default: app } = await import("../../../src/app.js");
    await request(app).post("/meters/").send(NEW_METER).set(AS_ADMIN);

    const located = await request(app).get("/meters/?located=true&limit=100").set(AS_ADMIN);

    await expectWithLog(located, () => {
      const eans = (located.body.data as { EAN: string }[]).map((m) => m.EAN);
      expect(eans).not.toContain(EAN);
    });
  });

  it("PATCH /meters/address : repairs the address and leaves the configuration alone", async () => {
    // The reason this endpoint exists rather than reusing PUT /meters/: the
    // repair dialog is fed by the meters LIST, which carries no meter_number,
    // tarif_group, phases_number or reading_frequency. Echoing guessed values
    // back through a full replace would silently overwrite real configuration.
    const { default: app } = await import("../../../src/app.js");
    await request(app).post("/meters/").send(NEW_METER).set(AS_ADMIN);

    const before = await request(app).get(`/meters/${EAN}`).set(AS_ADMIN);

    const repaired = await request(app)
      .patch("/meters/address")
      .send({
        EAN,
        address: { street: "Rue de la Loi", number: "16", postcode: "1000", city: "Bruxelles" },
      })
      .set(AS_ADMIN);

    await expectWithLog(repaired, () => {
      expect(repaired.status).toBe(200);
      expect(repaired.body.error_code).toBe(SUCCESS);
    });

    const after = await request(app).get(`/meters/${EAN}`).set(AS_ADMIN);
    await expectWithLog(after, () => {
      expect(after.body.data.address.street).toBe("Rue de la Loi");
      expect(after.body.data.address.number).toBe("16");
      // Untouched — the whole point of a narrow endpoint.
      expect(after.body.data.meter_number).toBe(before.body.data.meter_number);
      expect(after.body.data.tarif_group).toBe(before.body.data.tarif_group);
      expect(after.body.data.phases_number).toBe(before.body.data.phases_number);
      expect(after.body.data.reading_frequency).toBe(before.body.data.reading_frequency);
    });
  });

  it("PATCH /meters/address : stores a coordinate supplied with the repair", async () => {
    // A picked suggestion carries its own rooftop coordinate, so a repair lands
    // on the map immediately rather than waiting for the next admin backfill —
    // which matters because geocoding is OFF here, as it is on a fresh install.
    const { default: app } = await import("../../../src/app.js");
    await request(app).post("/meters/").send(NEW_METER).set(AS_ADMIN);

    await request(app)
      .patch("/meters/address")
      .send({
        EAN,
        address: {
          street: "Rue de la Loi",
          number: "16",
          postcode: "1000",
          city: "Bruxelles",
          latitude: 50.846169,
          longitude: 4.366538,
        },
      })
      .set(AS_ADMIN);

    const after = await request(app).get(`/meters/${EAN}`).set(AS_ADMIN);
    await expectWithLog(after, () => {
      expect(after.body.data.address.latitude).toBeCloseTo(50.846169, 5);
      expect(after.body.data.address.longitude).toBeCloseTo(4.366538, 5);
    });

    // And it is now on the map rather than in the repair queue.
    const unlocated = await request(app).get("/meters/?located=false&limit=100").set(AS_ADMIN);
    await expectWithLog(unlocated, () => {
      const eans = (unlocated.body.data as { EAN: string }[]).map((m) => m.EAN);
      expect(eans).not.toContain(EAN);
    });
  });

  it("PATCH /meters/address : rejects an unknown EAN rather than silently succeeding", async () => {
    const { default: app } = await import("../../../src/app.js");

    const res = await request(app)
      .patch("/meters/address")
      .send({
        EAN: "541448820000009999",
        address: { street: "Rue X", number: "1", postcode: "1000", city: "Bruxelles" },
      })
      .set(AS_ADMIN);

    await expectWithLog(res, () => {
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });
  });
});
