import { beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { AUTH_COMMUNITY_1, ORGS_MEMBER } from "../../utils/shared.consts.js";
import type { OnboardingStateDTO } from "../../../src/modules/onboarding/api/onboarding.dtos.js";

// Two users created for these tests, with no onboarding row. The seeded users
// all carry backfilled rows (tests/sql/init.sql replays the migration's backfill).
const FRESH = "auth0|onboarding-fresh";
const OTHER = "auth0|onboarding-other";
const SEEDED_MEMBER = "auth0|member";
const NO_PROFILE = "auth0|no-crm-row-yet";

async function sql(query: string, params: unknown[] = []): Promise<void> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  await AppDataSource.manager.query(query, params);
}

async function getStates(user: string): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  return request(appModule.default).get("/me/onboarding").set("x-user-id", user).set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", ORGS_MEMBER);
}

async function put(user: string, tour_key: string, body: unknown): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  return request(appModule.default)
    .put(`/me/onboarding/${tour_key}`)
    .send(body as object)
    .set("x-user-id", user)
    .set("x-community-id", AUTH_COMMUNITY_1)
    .set("x-user-orgs", ORGS_MEMBER);
}

function states(response: request.Response): OnboardingStateDTO[] {
  return response.body.data as OnboardingStateDTO[];
}

describe("(Functional) /me/onboarding", () => {
  useFunctionalTestDb();

  beforeEach(async () => {
    await sql(`INSERT INTO app_user (email, auth_user_id) VALUES ('fresh@test.com', $1), ('other@test.com', $2)`, [FRESH, OTHER]);
  });

  describe("GET", () => {
    it("returns an empty list for a user who was never offered anything", async () => {
      const response = await getStates(FRESH);
      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(states(response)).toEqual([]);
      });
    });

    it("returns an empty list, not a 404, before the CRM profile exists", async () => {
      const response = await getStates(NO_PROFILE);
      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(states(response)).toEqual([]);
      });
    });

    it("returns the backfilled rows of a pre-existing user", async () => {
      const response = await getStates(SEEDED_MEMBER);
      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(states(response).map((s) => [s.tour_key, s.outcome])).toEqual([
          ["community_member", "backfilled"],
          ["welcome", "backfilled"],
        ]);
      });
    });
  });

  describe("PUT", () => {
    it("records a first answer and returns it", async () => {
      const response = await put(FRESH, "welcome", { outcome: "started", tour_version: "sha384-v1" });
      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({ tour_key: "welcome", outcome: "started", tour_version: "sha384-v1" });
      });
      expect(states(await getStates(FRESH)).map((s) => s.outcome)).toEqual(["started"]);
    });

    it("is idempotent: the same answer twice leaves one unchanged row", async () => {
      const first = await put(FRESH, "community_admin", { outcome: "dismissed" });
      const second = await put(FRESH, "community_admin", { outcome: "dismissed" });
      await expectWithLog(second, () => {
        expect(second.status).toBe(200);
        expect(second.body.data.updated_at).toBe(first.body.data.updated_at);
      });
      expect(states(await getStates(FRESH))).toHaveLength(1);
    });

    it("moves a started tour to completed and keeps its version", async () => {
      await put(FRESH, "community_member", { outcome: "started", tour_version: "sha384-v1" });
      const response = await put(FRESH, "community_member", { outcome: "completed" });
      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({ outcome: "completed", tour_version: "sha384-v1" });
      });
    });

    it("moves a started tour to abandoned", async () => {
      await put(FRESH, "community_manager", { outcome: "started" });
      const response = await put(FRESH, "community_manager", { outcome: "abandoned" });
      expect(response.status).toBe(200);
      expect(response.body.data.outcome).toBe("abandoned");
    });

    it.each([
      ["no row -> completed", [], "completed"],
      ["no row -> abandoned", [], "abandoned"],
      ["dismissed -> started", ["dismissed"], "started"],
      ["completed -> started", ["started", "completed"], "started"],
      ["abandoned -> completed", ["started", "abandoned"], "completed"],
    ])("refuses %s with 409", async (_label, history, next) => {
      for (const outcome of history as string[]) await put(FRESH, "welcome", { outcome });
      const response = await put(FRESH, "welcome", { outcome: next });
      await expectWithLog(response, () => {
        expect(response.status).toBe(409);
        expect(response.body.error_code).toBe(110003);
      });
    });

    it("refuses to restart a backfilled tour", async () => {
      const response = await put(SEEDED_MEMBER, "welcome", { outcome: "started" });
      expect(response.status).toBe(409);
      expect(states(await getStates(SEEDED_MEMBER)).find((s) => s.tour_key === "welcome")?.outcome).toBe("backfilled");
    });

    it("refuses an unknown tour_key with 422", async () => {
      const response = await put(FRESH, "onboarding-welcome", { outcome: "started" });
      await expectWithLog(response, () => {
        expect(response.status).toBe(422);
        expect(response.body.error_code).toBe(110000);
      });
      expect(states(await getStates(FRESH))).toEqual([]);
    });

    it.each(["backfilled", "seen", ""])("refuses the outcome %p with 422", async (outcome) => {
      const response = await put(FRESH, "welcome", { outcome });
      await expectWithLog(response, () => {
        expect(response.status).toBe(422);
        expect(response.body.error_code).toBe(110001);
      });
    });

    it("refuses an over-long tour_version with 422", async () => {
      const response = await put(FRESH, "welcome", { outcome: "started", tour_version: "x".repeat(129) });
      expect(response.status).toBe(422);
      expect(response.body.error_code).toBe(110002);
    });

    it("answers 404 for a user whose CRM profile does not exist yet", async () => {
      const response = await put(NO_PROFILE, "welcome", { outcome: "dismissed" });
      expect(response.status).toBe(404);
    });
  });

  describe("isolation between users", () => {
    it("never shows or changes another user's rows", async () => {
      await put(FRESH, "welcome", { outcome: "started" });

      expect(states(await getStates(OTHER))).toEqual([]);

      // OTHER answering the same tour writes OTHER's row, not FRESH's.
      const response = await put(OTHER, "welcome", { outcome: "dismissed" });
      expect(response.status).toBe(200);
      expect(states(await getStates(FRESH)).map((s) => s.outcome)).toEqual(["started"]);
      expect(states(await getStates(OTHER)).map((s) => s.outcome)).toEqual(["dismissed"]);
    });
  });
});
