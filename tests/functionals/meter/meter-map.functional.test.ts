import { expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { AUTH_COMMUNITY_1, ORGS_GESTIONNAIRE, ORGS_MEMBER } from "../../utils/shared.consts.js";
import { AddressGeoPrecision } from "../../../src/shared/address/address.types.js";

const AUTH_USER = "auth0|admin";

interface MapPoint {
  EAN: string;
  latitude: number;
  longitude: number;
  geo_precision: number | null;
  status: number;
  holder_name?: string;
  sharing_operation_name?: string;
}

interface MapBody {
  points: MapPoint[];
  total_matching: number;
  total_plottable: number;
  missing_coordinates: number;
  approximate: number;
  truncated: boolean;
  cap: number;
}

function get(query: Record<string, string> = {}, orgs: string = ORGS_GESTIONNAIRE): Promise<request.Test> {
  return import("../../../src/app.js").then(({ default: app }) =>
    request(app).get("/meters/map").query(query).set("x-user-id", AUTH_USER).set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", orgs),
  );
}

describe("(Functional) Meters Map", () => {
  useFunctionalTestDb();

  it("GET /meters/map : returns the plottable meters of the active community", async () => {
    const response = await get();

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.error_code).toBe(SUCCESS);

      const body = response.body.data as MapBody;
      expect(Array.isArray(body.points)).toBe(true);
      expect(body.points.length).toBeGreaterThan(0);
      expect(body.truncated).toBe(false);
      expect(body.cap).toBeGreaterThan(0);

      for (const point of body.points) {
        // The repository filters on `latitude IS NOT NULL` and a DB CHECK keeps
        // the pair atomic, so both must always be present.
        expect(typeof point.latitude).toBe("number");
        expect(typeof point.longitude).toBe("number");
      }
    });
  });

  it("GET /meters/map : returns coordinates as numbers, not the strings pg yields for numeric", async () => {
    const response = await get();

    await expectWithLog(response, () => {
      const [first] = (response.body.data as MapBody).points;
      // node-postgres returns `numeric` as a string; without the entity
      // transformer this ships as "50.846700" and MapLibre silently refuses to
      // plot it. There is no error anywhere in that chain.
      expect(typeof first.latitude).toBe("number");
      expect(typeof first.longitude).toBe("number");
    });
  });

  it("GET /meters/map : keeps two meters at ONE coordinate as two distinct points", async () => {
    const response = await get();

    await expectWithLog(response, () => {
      const points = (response.body.data as MapBody).points;
      const byCoordinate = new Map<string, string[]>();
      for (const point of points) {
        const key = `${point.latitude.toFixed(5)},${point.longitude.toFixed(5)}`;
        byCoordinate.set(key, [...(byCoordinate.get(key) ?? []), point.EAN]);
      }

      const coincident = [...byCoordinate.values()].find((eans) => eans.length > 1);
      // Seeded as Wind Alley 10 and 12: two addresses, one rooftop. The backend
      // must NOT collapse them — the popup has to list both EANs, and grouping
      // is the UI's job.
      expect(coincident).toBeDefined();
      expect(new Set(coincident).size).toBe(coincident?.length);
    });
  });

  it("GET /meters/map : counts un-geocoded meters as missing rather than hiding them", async () => {
    const response = await get();

    await expectWithLog(response, () => {
      const body = response.body.data as MapBody;
      // The seed leaves one meter's address without coordinates on purpose.
      expect(body.total_matching).toBeGreaterThan(body.total_plottable);
      expect(body.missing_coordinates).toBe(body.total_matching - body.total_plottable);
      expect(body.points.length).toBe(body.total_plottable);
    });
  });

  it("GET /meters/map : exposes the municipality-precision pin so the UI can weaken it", async () => {
    const response = await get();

    await expectWithLog(response, () => {
      const points = (response.body.data as MapBody).points;
      const approximate = points.find((point) => point.geo_precision === AddressGeoPrecision.MUNICIPALITY);
      expect(approximate).toBeDefined();
    });
  });

  it("GET /meters/map : counts the approximate pins the repair queue will list", async () => {
    // `approximate` and the `located=false` filter must agree, or the strip's
    // number and the rows the repair dialog shows drift apart — and the count
    // would stop moving as an operator works through them.
    const { default: app } = await import("../../../src/app.js");
    const response = await get();
    const body = response.body.data as MapBody;

    const centroidPins = body.points.filter((point) => point.geo_precision === AddressGeoPrecision.MUNICIPALITY).length;

    const queue = await request(app)
      .get("/meters/?located=false&limit=200")
      .set("x-user-id", AUTH_USER)
      .set("x-community-id", AUTH_COMMUNITY_1)
      .set("x-user-orgs", ORGS_GESTIONNAIRE);

    await expectWithLog(response, () => {
      expect(body.approximate).toBe(centroidPins);
      // The queue is BOTH populations: no coordinate at all, plus the centroids.
      expect((queue.body.data as unknown[]).length).toBe(body.missing_coordinates + body.approximate);
    });
  });

  it("GET /meters/map : honours the same filters as the list", async () => {
    const { default: app } = await import("../../../src/app.js");

    const list = await request(app)
      .get("/meters/")
      .query({ page: "1", limit: "100", status: "1" })
      .set("x-user-id", AUTH_USER)
      .set("x-community-id", AUTH_COMMUNITY_1)
      .set("x-user-orgs", ORGS_GESTIONNAIRE);

    const map = await get({ status: "1" });

    await expectWithLog(map, () => {
      expect(map.status).toBe(200);
      const listEans = new Set((list.body.data as { EAN: string }[]).map((meter) => meter.EAN));
      const mapEans = (map.body.data as MapBody).points.map((point) => point.EAN);

      // Every plotted meter must be one the list would also return under the
      // same filter. The reverse does not hold: un-geocoded meters are listed
      // but not plotted.
      for (const ean of mapEans) {
        expect(listEans.has(ean)).toBe(true);
      }
    });
  });

  it("GET /meters/map?address_number= : returns 200, not the 500 the broken filter used to give", async () => {
    // Regression: meterFilters filtered on `address.address_number`, but the
    // Address property is `number`. TypeORM passed the unknown path through and
    // Postgres rejected it.
    const response = await get({ address_number: "10" });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.error_code).toBe(SUCCESS);
    });
  });

  it("GET /meters/map : is scoped to the active community", async () => {
    const response = await get();

    await expectWithLog(response, () => {
      const eans = (response.body.data as MapBody).points.map((point) => point.EAN);
      // The seed puts meters in more than one community; withCommunityScope
      // must keep the other one out entirely.
      expect(eans.length).toBeGreaterThan(0);
      expect(new Set(eans).size).toBe(eans.length);
    });
  });

  describe("(Functional) Meters Map — authorisation", () => {
    it("rejects a request with no user", async () => {
      const { default: app } = await import("../../../src/app.js");
      const response = await request(app).get("/meters/map").set("x-community-id", AUTH_COMMUNITY_1);

      expect(response.status).toBe(400);
    });

    it("rejects a MEMBER", async () => {
      const response = await get({}, ORGS_MEMBER);

      expect(response.status).toBe(403);
    });

    it("accepts a GESTIONNAIRE", async () => {
      const response = await get({}, ORGS_GESTIONNAIRE);

      expect(response.status).toBe(200);
    });
  });
});
