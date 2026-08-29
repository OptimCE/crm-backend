import { expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";

const AUTH_USER = "auth0|tester";

interface GeometryRow {
  nis_code: number;
  fr_name: string;
  geo_point: { type: string; coordinates: [number, number] } | null;
  geo_shape: { type: string; coordinates: unknown } | null;
  tolerance: number;
  original_points: number;
  simplified_points: number;
}

function get(query: Record<string, string>, user: string | null = AUTH_USER): Promise<request.Test> {
  return import("../../../src/app.js").then(({ default: app }) => {
    const req = request(app).get("/municipalities/geometry").query(query);
    return user ? req.set("x-user-id", user) : req;
  });
}

describe("(Functional) Municipality Geometry", () => {
  useFunctionalTestDb();

  it("GET /municipalities/geometry : returns GeoJSON for the requested NIS codes", async () => {
    const response = await get({ nis_codes: "21004,21009" });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.error_code).toBe(SUCCESS);

      const rows = response.body.data as GeometryRow[];
      expect(rows).toHaveLength(2);
      for (const row of rows) {
        expect(row.geo_shape).not.toBeNull();
        expect(["Polygon", "MultiPolygon"]).toContain(row.geo_shape?.type);
        // [longitude, latitude] — Belgium is around 4-6 E, 49-52 N.
        expect(row.geo_point?.coordinates[0]).toBeGreaterThan(2);
        expect(row.geo_point?.coordinates[0]).toBeLessThan(7);
        expect(row.geo_point?.coordinates[1]).toBeGreaterThan(49);
        expect(row.geo_point?.coordinates[1]).toBeLessThan(52);
      }
    });
  });

  it("GET /municipalities/geometry : simplification actually removes vertices", async () => {
    const response = await get({ nis_codes: "21004", tolerance: "0.0005" });

    await expectWithLog(response, () => {
      const [row] = response.body.data as GeometryRow[];
      // A commune ring is thousands of points at full resolution; without this
      // the payload for a whole zone is measured in megabytes, against a 3s
      // gateway timeout.
      expect(row.original_points).toBeGreaterThan(100);
      expect(row.simplified_points).toBeLessThan(row.original_points);
      expect(row.tolerance).toBe(0.0005);
    });
  });

  it("GET /municipalities/geometry : tolerance 0 is a pass-through", async () => {
    const response = await get({ nis_codes: "21004", tolerance: "0" });

    await expectWithLog(response, () => {
      const [row] = response.body.data as GeometryRow[];
      expect(row.simplified_points).toBe(row.original_points);
    });
  });

  it("GET /municipalities/geometry : simplified rings stay closed", async () => {
    const response = await get({ nis_codes: "21004", tolerance: "0.005" });

    await expectWithLog(response, () => {
      const [row] = response.body.data as GeometryRow[];
      const shape = row.geo_shape as { type: string; coordinates: number[][][] | number[][][][] };
      const rings = shape.type === "Polygon" ? (shape.coordinates as number[][][]) : (shape.coordinates as number[][][][]).flat();

      for (const ring of rings) {
        // An unclosed ring renders as a wedge-shaped hole, which is why the
        // simplifier re-appends the first point rather than trusting RDP.
        expect(ring[0]).toEqual(ring[ring.length - 1]);
        expect(ring.length).toBeGreaterThanOrEqual(4);
      }
    });
  });

  it("GET /municipalities/geometry : unknown NIS codes are simply absent", async () => {
    const response = await get({ nis_codes: "21004,99999" });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      const rows = response.body.data as GeometryRow[];
      expect(rows.map((row) => row.nis_code)).toEqual([21004]);
    });
  });

  it("GET /municipalities/geometry : rejects a tolerance outside the allowlist", async () => {
    // A free-form float lands in the cache key, so one client could mint
    // unlimited distinct keys and defeat the cache entirely.
    const response = await get({ nis_codes: "21004", tolerance: "0.12345" });

    expect(response.status).toBe(422);
  });

  it("GET /municipalities/geometry : rejects an empty or oversized code list", async () => {
    expect((await get({ nis_codes: "" })).status).toBe(422);

    const tooMany = Array.from({ length: 61 }, (_, i) => String(21000 + i)).join(",");
    expect((await get({ nis_codes: tooMany })).status).toBe(422);
  });

  it("GET /municipalities/geometry : requires an authenticated user", async () => {
    const response = await get({ nis_codes: "21004" }, null);

    expect(response.status).toBe(400);
  });
});
