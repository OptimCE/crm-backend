import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { ANNEXES_SERVICES_ERRORS } from "../../../src/modules/annexes_services/shared/annexes-services.errors.js";
import {
  AUTH_COMMUNITY_1,
  AUTH_COMMUNITY_2,
  KNOWN_FEATURE,
  ORGS_ADMIN,
  ORGS_ADMIN_COMMUNITY_2,
  ORGS_GESTIONNAIRE,
  testCasesSubscribe,
} from "./annexes-services.const.js";

interface CatalogEntry {
  feature: string;
  subscribed: boolean;
}

describe("(Functional) Annexes Services Module", () => {
  useFunctionalTestDb();

  describe("(Functional) Subscribe", () => {
    it.each(testCasesSubscribe)(
      "POST /annexes-services/:feature/subscribe : $description",
      async ({ feature, auth_community_id, orgs, status_code, expected_error_code, expected_data }) => {
        const appModule = await import("../../../src/app.js");
        const app = appModule.default;

        const response = await request(app)
          .post(`/annexes-services/${feature}/subscribe`)
          .set("x-user-id", "auth0|admin")
          .set("x-community-id", auth_community_id)
          .set("x-user-orgs", orgs);

        await expectWithLog(response, () => {
          expect(response.status).toBe(status_code);
          expect(response.body.error_code).toBe(expected_error_code);
          if (expected_data !== undefined) expect(response.body.data).toBe(expected_data);
        });
      },
    );

    it("subscribe twice returns ALREADY_SUBSCRIBED", async () => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      const first = await request(app)
        .post(`/annexes-services/${KNOWN_FEATURE}/subscribe`)
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(first.status).toBe(200);
      expect(first.body.error_code).toBe(SUCCESS);

      const second = await request(app)
        .post(`/annexes-services/${KNOWN_FEATURE}/subscribe`)
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      await expectWithLog(second, () => {
        expect(second.status).toBe(409);
        expect(second.body.error_code).toBe(ANNEXES_SERVICES_ERRORS.SUBSCRIPTION.ALREADY_SUBSCRIBED.errorCode);
      });
    });

    it("subscribe reactivates a previously deactivated subscription", async () => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      await request(app)
        .post(`/annexes-services/${KNOWN_FEATURE}/subscribe`)
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN)
        .expect(200);
      await request(app)
        .post(`/annexes-services/${KNOWN_FEATURE}/unsubscribe`)
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN)
        .expect(200);

      const reactivate = await request(app)
        .post(`/annexes-services/${KNOWN_FEATURE}/subscribe`)
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      await expectWithLog(reactivate, () => {
        expect(reactivate.status).toBe(200);
        expect(reactivate.body.error_code).toBe(SUCCESS);
      });
    });
  });

  describe("(Functional) Unsubscribe", () => {
    it("unsubscribe without an active subscription returns NOT_SUBSCRIBED", async () => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      const response = await request(app)
        .post(`/annexes-services/${KNOWN_FEATURE}/unsubscribe`)
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);

      await expectWithLog(response, () => {
        expect(response.status).toBe(403);
        expect(response.body.error_code).toBe(ANNEXES_SERVICES_ERRORS.SUBSCRIPTION.NOT_SUBSCRIBED.errorCode);
      });
    });

    it("manager cannot unsubscribe", async () => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      const response = await request(app)
        .post(`/annexes-services/${KNOWN_FEATURE}/unsubscribe`)
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_GESTIONNAIRE);

      await expectWithLog(response, () => {
        expect(response.status).toBe(403);
      });
    });

    it("unsubscribe of an active subscription succeeds and flips catalog state", async () => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      await request(app)
        .post(`/annexes-services/${KNOWN_FEATURE}/subscribe`)
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN)
        .expect(200);

      const beforeUnsub = await request(app)
        .get("/annexes-services/")
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(beforeUnsub.status).toBe(200);
      const beforeEntry = (beforeUnsub.body.data as CatalogEntry[]).find((e) => e.feature === KNOWN_FEATURE);
      expect(beforeEntry?.subscribed).toBe(true);

      const unsub = await request(app)
        .post(`/annexes-services/${KNOWN_FEATURE}/unsubscribe`)
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      expect(unsub.status).toBe(200);

      const afterUnsub = await request(app)
        .get("/annexes-services/")
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN);
      const afterEntry = (afterUnsub.body.data as CatalogEntry[]).find((e) => e.feature === KNOWN_FEATURE);
      expect(afterEntry?.subscribed).toBe(false);
    });
  });

  describe("(Functional) Multi-tenant isolation", () => {
    it("subscription in community 1 does not leak to community 2", async () => {
      const appModule = await import("../../../src/app.js");
      const app = appModule.default;

      await request(app)
        .post(`/annexes-services/${KNOWN_FEATURE}/subscribe`)
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_1)
        .set("x-user-orgs", ORGS_ADMIN)
        .expect(200);

      const otherCommunity = await request(app)
        .get("/annexes-services/")
        .set("x-user-id", "auth0|admin")
        .set("x-community-id", AUTH_COMMUNITY_2)
        .set("x-user-orgs", ORGS_ADMIN_COMMUNITY_2);
      expect(otherCommunity.status).toBe(200);
      const entry = (otherCommunity.body.data as CatalogEntry[]).find((e) => e.feature === KNOWN_FEATURE);
      expect(entry?.subscribed).toBe(false);
    });
  });
});
