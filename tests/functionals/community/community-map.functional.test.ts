import { expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";

const AUTH_USER = "auth0|tester";

interface MapRow {
  id: number;
  name: string;
  regulator: string;
  nis_codes: number[];
  public_operations_count: number;
}

function get(query: Record<string, string> = {}, user: string | null = AUTH_USER): Promise<request.Test> {
  return import("../../../src/app.js").then(({ default: app }) => {
    const req = request(app).get("/communities/map").query(query);
    return user ? req.set("x-user-id", user) : req;
  });
}

describe("(Functional) Public Communities Map", () => {
  useFunctionalTestDb();

  it("GET /communities/map : returns public communities with the NIS codes they cover", async () => {
    const response = await get();

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.error_code).toBe(SUCCESS);

      const rows = response.body.data as MapRow[];
      expect(rows.length).toBeGreaterThan(0);

      const withZone = rows.find((row) => row.nis_codes.length > 0);
      expect(withZone).toBeDefined();
      for (const code of withZone?.nis_codes ?? []) {
        expect(typeof code).toBe("number");
      }
    });
  });

  it("GET /communities/map : coerces the bigint count to a number", async () => {
    const response = await get();

    await expectWithLog(response, () => {
      const [row] = response.body.data as MapRow[];
      // node-postgres returns COUNT() as a string; concatenating instead of
      // adding is the silent bug this guards.
      expect(typeof row.public_operations_count).toBe("number");
      expect(row.public_operations_count).toBeGreaterThan(0);
    });
  });

  it("GET /communities/map : never returns a null inside nis_codes", async () => {
    const response = await get();

    await expectWithLog(response, () => {
      // array_agg over a LEFT JOIN miss yields [null], not [].
      for (const row of response.body.data as MapRow[]) {
        expect(row.nis_codes.every((code) => code !== null)).toBe(true);
      }
    });
  });

  it("GET /communities/map : filters by regulator", async () => {
    const response = await get({ regulator: "BE-WAL-CWAPE" });

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      for (const row of response.body.data as MapRow[]) {
        expect(row.regulator).toBe("BE-WAL-CWAPE");
      }
    });
  });

  it("GET /communities/map : is reachable by any authenticated user, with no active community", async () => {
    const response = await get();

    expect(response.status).toBe(200);
  });

  it("GET /communities/map : requires an authenticated user", async () => {
    const response = await get({}, null);

    expect(response.status).toBe(400);
  });
});
