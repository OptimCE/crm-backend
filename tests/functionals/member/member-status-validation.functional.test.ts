import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { MEMBER_ERRORS } from "../../../src/modules/members/shared/member.errors.js";
import { MemberStatus, MemberType } from "../../../src/modules/members/shared/member.types.js";
import { ORGS_ADMIN } from "../../utils/shared.consts.js";
import { AUTH_COMMUNITY_1, existingCompanyId, existingIndividualId } from "./member.const.js";

// The four member `status` fields used to be validated against MemberType
// {INDIVIDUAL=1, COMPANY=2} instead of MemberStatus {ACTIVE=1, INACTIVE=2, PENDING=3}:
// PENDING was refused with 422 / MEMBER_TYPE, and ACTIVE/INACTIVE passed only
// because the numbers happen to coincide.
//
// Product decision (2026-10-03): a manager may set PENDING ("Put on hold")
// through PATCH /members/status, and PENDING is NOT blocked by active meters —
// only INACTIVE is (MEMBER_ERRORS.INTEGRITY.MEMBER_HAS_ACTIVE_METERS).

const NOT_A_STATUS = 9;
const WRONG_STATUS_MESSAGE = "The field 'status' must be of type 'MemberStatus'";

async function app(): Promise<unknown> {
  const appModule = await import("../../../src/app.js");
  return appModule.default;
}

async function asAdmin(req: request.Test): Promise<request.Response> {
  return req.set("x-user-id", "auth0|admin").set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", ORGS_ADMIN);
}

async function sqlRows<T>(query: string, params: unknown[] = []): Promise<T[]> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  return (await AppDataSource.manager.query(query, params)) as T[];
}

async function statusOf(id_member: number): Promise<number> {
  const rows = await sqlRows<{ status: number }>("SELECT status FROM member WHERE id = $1", [id_member]);
  return rows[0].status;
}

function expectWrongStatus(response: request.Response): void {
  expect(response.status).toBe(422);
  expect(response.body.error_code).toBe(MEMBER_ERRORS.VALIDATION.WRONG_TYPE.MEMBER_STATUS.errorCode);
  expect(response.body.data).toBe(WRONG_STATUS_MESSAGE);
}

const newIndividual = (status: number): Record<string, unknown> => ({
  name: "Status Func Member",
  member_type: MemberType.INDIVIDUAL,
  status,
  iban: "BE7777777777",
  first_name: "Status",
  NRN: "77777777777",
  email: "status_func@test.com",
  social_rate: false,
  home_address: { street: "Rue", number: "1", city: "Bruxelles", postcode: "1000" },
  billing_address: { street: "Rue", number: "1", city: "Bruxelles", postcode: "1000" },
});

describe("(Functional) Member status is validated as MemberStatus", () => {
  useFunctionalTestDb();

  describe("PATCH /members/status", () => {
    it("accepts PENDING, even for a member with active meters", async () => {
      // existingIndividualId holds an ACTIVE meter in the seed: INACTIVE would be a 409.
      const response = await asAdmin(
        request(await app())
          .patch("/members/status")
          .send({ id_member: existingIndividualId, status: MemberStatus.PENDING }),
      );

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.error_code).toBe(SUCCESS);
      });
      expect(await statusOf(existingIndividualId)).toBe(MemberStatus.PENDING);
    });

    it("rejects a value outside MemberStatus with the status-specific error", async () => {
      const response = await asAdmin(
        request(await app())
          .patch("/members/status")
          .send({ id_member: existingIndividualId, status: NOT_A_STATUS }),
      );

      await expectWithLog(response, () => expectWrongStatus(response));
      expect(await statusOf(existingIndividualId)).toBe(MemberStatus.ACTIVE);
    });
  });

  describe("POST /members", () => {
    it("creates a PENDING member", async () => {
      const response = await asAdmin(
        request(await app())
          .post("/members/")
          .send(newIndividual(MemberStatus.PENDING)),
      );

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.error_code).toBe(SUCCESS);
      });
      const rows = await sqlRows<{ status: number }>("SELECT status FROM member WHERE name = $1", ["Status Func Member"]);
      expect(rows).toEqual([{ status: MemberStatus.PENDING }]);
    });

    it("rejects a value outside MemberStatus with the status-specific error", async () => {
      const response = await asAdmin(
        request(await app())
          .post("/members/")
          .send(newIndividual(NOT_A_STATUS)),
      );

      await expectWithLog(response, () => expectWrongStatus(response));
      expect(await sqlRows("SELECT id FROM member WHERE name = $1", ["Status Func Member"])).toEqual([]);
    });
  });

  describe("PUT /members", () => {
    // The edit dialog re-sends the member's current status, so a PENDING member
    // could not be edited at all while PENDING was refused here.
    it("accepts PENDING", async () => {
      const response = await asAdmin(
        request(await app())
          .put("/members/")
          .send({ id: existingCompanyId, name: "Company On Hold", status: MemberStatus.PENDING }),
      );

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.error_code).toBe(SUCCESS);
      });
      expect(await statusOf(existingCompanyId)).toBe(MemberStatus.PENDING);
    });

    it("rejects a value outside MemberStatus with the status-specific error", async () => {
      const response = await asAdmin(
        request(await app())
          .put("/members/")
          .send({ id: existingCompanyId, status: NOT_A_STATUS }),
      );

      await expectWithLog(response, () => expectWrongStatus(response));
      expect(await statusOf(existingCompanyId)).toBe(MemberStatus.ACTIVE);
    });
  });

  describe("GET /members?status=", () => {
    it("filters on PENDING", async () => {
      await sqlRows("UPDATE member SET status = $1 WHERE id = $2", [MemberStatus.PENDING, existingCompanyId]);

      const response = await asAdmin(
        request(await app())
          .get("/members/")
          .query({ status: MemberStatus.PENDING }),
      );

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect((response.body.data as Array<{ id: number; status: number }>).map((m) => [m.id, m.status])).toEqual([
          [existingCompanyId, MemberStatus.PENDING],
        ]);
      });
    });

    it("rejects a value outside MemberStatus with the status-specific error", async () => {
      const response = await asAdmin(
        request(await app())
          .get("/members/")
          .query({ status: NOT_A_STATUS }),
      );

      await expectWithLog(response, () => expectWrongStatus(response));
    });
  });
});
