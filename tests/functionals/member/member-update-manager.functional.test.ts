import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { MEMBER_ERRORS } from "../../../src/modules/members/shared/member.errors.js";
import { MemberStatus, MemberType } from "../../../src/modules/members/shared/member.types.js";
import { ORGS_ADMIN } from "../../utils/shared.consts.js";
import { AUTH_COMMUNITY_1, existingCommunityId, existingCompanyId, existingIndividualId } from "./member.const.js";

// PUT /members with a `manager` (the guardian of an individual, the legal representative of a
// company) used to drop the member's existing manager: the "update" branch edited the loaded
// Manager in memory, then assigned `null` to the relation, and the relation has no cascade, so
// the edits were never saved either.
// - individual (`id_manager` is nullable): 200, but the guardian was silently unlinked;
// - company (`id_manager` is NOT NULL): 400 DATABASE_SAVE_COMPANY for every update that
//   carries its representative.
// The manager rows are also written inside the request's transaction now: a failed update or
// creation must not leave a half-edited or orphaned manager behind.

// init.sql seeds ONE manager row ('Manager One') shared by members 1, 2 and 4-7. The API itself
// creates one row per member.
const SEED_MANAGER_ID = 1;
const SEED_MANAGER_ROW = {
  id: SEED_MANAGER_ID,
  nrn: "70.01.15-001.56",
  name: "Manager",
  surname: "One",
  email: "mgr1@test.com",
  phone_number: "0470000000",
  id_community: existingCommunityId,
};

const EDITED_MANAGER = {
  NRN: "81.03.27-158.75",
  name: "Marie",
  surname: "Dubois",
  email: "marie.dubois@test.com",
  phone_number: "0470999999",
};

// Passes validation, then fails the write: the columns it is put in are VARCHAR(255).
const TOO_LONG = "x".repeat(256);

type ManagerRow = {
  id: number;
  nrn: string;
  name: string;
  surname: string;
  email: string;
  phone_number: string | null;
  id_community: number;
};

const asManagerRow = (id: number, manager: typeof EDITED_MANAGER): ManagerRow => ({
  id,
  nrn: manager.NRN,
  name: manager.name,
  surname: manager.surname,
  email: manager.email,
  phone_number: manager.phone_number,
  id_community: existingCommunityId,
});

// The seeded addresses, as the wizard sends them back when they are left unchanged.
const SEED_ADDRESS_1 = { id: 1, street: "Main St", number: "1", postcode: "1000", city: "Brussels" };
const SEED_ADDRESS_2 = { id: 2, street: "Second St", number: "2", postcode: "2000", city: "Antwerp" };

// crm-frontend MemberCreationUpdate.onSubmitEnd() sends the WHOLE member on an edit, plus
// `manager` when the guardian box is ticked (ticking it prefills the existing guardian).
const individualFromWizard = (manager: typeof EDITED_MANAGER): Record<string, unknown> => ({
  id: existingIndividualId,
  NRN: "85.06.21-123.07",
  billing_address: SEED_ADDRESS_1,
  email: "john@test.com",
  first_name: "John",
  home_address: SEED_ADDRESS_1,
  iban: "BE1234567890",
  member_type: MemberType.INDIVIDUAL,
  phone_number: "0471111111",
  social_rate: false,
  status: MemberStatus.ACTIVE,
  vat_number: "",
  name: "Member One",
  manager,
});

// For a company the wizard always sends `manager`, sends the individual-only fields EMPTY
// (`email: ""` was refused with a 422), and puts the VAT number in `NRN`.
const companyFromWizard = (manager: typeof EDITED_MANAGER): Record<string, unknown> => ({
  id: existingCompanyId,
  NRN: "BE0000000000",
  billing_address: SEED_ADDRESS_2,
  email: "",
  first_name: "",
  home_address: SEED_ADDRESS_2,
  iban: "BE0987654321",
  member_type: MemberType.COMPANY,
  phone_number: "",
  social_rate: false,
  status: MemberStatus.ACTIVE,
  vat_number: "BE0000000000",
  name: "Member Two",
  manager,
});

async function app(): Promise<unknown> {
  const appModule = await import("../../../src/app.js");
  return appModule.default;
}

async function asAdmin(req: request.Test): Promise<request.Response> {
  return req.set("x-user-id", "auth0|admin").set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", ORGS_ADMIN);
}

async function putMember(body: Record<string, unknown>): Promise<request.Response> {
  return asAdmin(
    request(await app())
      .put("/members/")
      .send(body),
  );
}

async function sqlRows<T>(query: string, params: unknown[] = []): Promise<T[]> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  return (await AppDataSource.manager.query(query, params)) as T[];
}

/** The manager the member's sub-entity row points at, or null when it points at none. */
async function managerOf(table: "individual" | "company", id_member: number): Promise<ManagerRow | null> {
  const rows = await sqlRows<ManagerRow>(
    `SELECT mg.id, mg.nrn, mg.name, mg.surname, mg.email, mg.phone_number, mg.id_community
       FROM ${table} t LEFT JOIN manager mg ON mg.id = t.id_manager
      WHERE t.id = $1`,
    [id_member],
  );
  expect(rows).toHaveLength(1);
  return rows[0].id === null ? null : rows[0];
}

async function managerRowCount(): Promise<number> {
  const rows = await sqlRows<{ n: number }>("SELECT count(*)::int AS n FROM manager");
  return rows[0].n;
}

async function lastUpdateAudit(id_member: number): Promise<string[] | null> {
  const rows = await sqlRows<{ changed_fields: string[] }>(
    `SELECT payload->'changed_fields' AS changed_fields FROM audit_log
      WHERE action = 'crm.member.updated' AND entity_id = $1 ORDER BY id DESC LIMIT 1`,
    [String(id_member)],
  );
  return rows.length ? rows[0].changed_fields : null;
}

function expectSuccess(response: request.Response): Promise<void> {
  return expectWithLog(response, () => {
    expect(response.status).toBe(200);
    expect(response.body.error_code).toBe(SUCCESS);
  });
}

function expectError(response: request.Response, error: { errorCode: number }): Promise<void> {
  return expectWithLog(response, () => {
    expect(response.status).toBe(400);
    expect(response.body.error_code).toBe(error.errorCode);
  });
}

describe("(Functional) PUT /members keeps and saves the member's manager", () => {
  useFunctionalTestDb();

  describe("individual with a guardian", () => {
    it("edited in the wizard: keeps the same guardian row and saves its new values", async () => {
      const response = await putMember(individualFromWizard(EDITED_MANAGER));

      await expectSuccess(response);
      expect(await managerOf("individual", existingIndividualId)).toEqual(asManagerRow(SEED_MANAGER_ID, EDITED_MANAGER));
      expect(await managerRowCount()).toBe(1);
      expect(await lastUpdateAudit(existingIndividualId)).toContain("manager");
    });

    it("without `manager` in the body: leaves the guardian alone", async () => {
      const response = await putMember({ id: existingIndividualId, name: "Renamed Member One" });

      await expectSuccess(response);
      expect(await managerOf("individual", existingIndividualId)).toEqual(SEED_MANAGER_ROW);
      expect(await lastUpdateAudit(existingIndividualId)).toEqual(["name"]);
    });

    it("a failed update rolls the guardian's edits back", async () => {
      const response = await putMember({ ...individualFromWizard(EDITED_MANAGER), first_name: TOO_LONG });

      await expectError(response, MEMBER_ERRORS.UPDATE_MEMBER.DATABASE_SAVE_INDIVIDUAL);
      expect(await managerOf("individual", existingIndividualId)).toEqual(SEED_MANAGER_ROW);
      expect(await lastUpdateAudit(existingIndividualId)).toBeNull();
    });

    it("a guardian that cannot be saved answers 400, not 500", async () => {
      const response = await putMember(individualFromWizard({ ...EDITED_MANAGER, name: TOO_LONG }));

      await expectError(response, MEMBER_ERRORS.UPDATE_MEMBER.DATABASE_SAVE_MEMBER);
      expect(await managerOf("individual", existingIndividualId)).toEqual(SEED_MANAGER_ROW);
    });
  });

  describe("individual without a guardian", () => {
    const unlinkSeedGuardian = (): Promise<unknown[]> => sqlRows("UPDATE individual SET id_manager = NULL WHERE id = $1", [existingIndividualId]);

    it("edited with a guardian: creates one, in the member's community, and links it", async () => {
      await unlinkSeedGuardian();

      const response = await putMember(individualFromWizard(EDITED_MANAGER));

      await expectSuccess(response);
      const guardian = await managerOf("individual", existingIndividualId);
      expect(guardian).toEqual(asManagerRow(guardian?.id ?? -1, EDITED_MANAGER));
      expect(guardian?.id).not.toBe(SEED_MANAGER_ID);
      expect(await managerRowCount()).toBe(2);
    });

    it("a failed update leaves no orphaned guardian row behind", async () => {
      await unlinkSeedGuardian();

      const response = await putMember({ ...individualFromWizard(EDITED_MANAGER), first_name: TOO_LONG });

      await expectError(response, MEMBER_ERRORS.UPDATE_MEMBER.DATABASE_SAVE_INDIVIDUAL);
      expect(await managerOf("individual", existingIndividualId)).toBeNull();
      expect(await managerRowCount()).toBe(1);
    });
  });

  describe("company with its legal representative", () => {
    it("edited through the API: 200, keeps the same row and saves its new values", async () => {
      const response = await putMember({
        id: existingCompanyId,
        name: "Renamed Member Two",
        vat_number: "BE0000000001",
        manager: EDITED_MANAGER,
      });

      await expectSuccess(response);
      expect(await managerOf("company", existingCompanyId)).toEqual(asManagerRow(SEED_MANAGER_ID, EDITED_MANAGER));
      const company = await sqlRows("SELECT m.name, c.vat_number FROM member m JOIN company c ON c.id = m.id WHERE m.id = $1", [existingCompanyId]);
      expect(company).toEqual([{ name: "Renamed Member Two", vat_number: "BE0000000001" }]);
      expect(await lastUpdateAudit(existingCompanyId)).toEqual(["name", "vat_number", "manager"]);
    });

    it("edited in the wizard: 200, keeps the same row and saves its new values", async () => {
      const response = await putMember(companyFromWizard(EDITED_MANAGER));

      await expectSuccess(response);
      expect(await managerOf("company", existingCompanyId)).toEqual(asManagerRow(SEED_MANAGER_ID, EDITED_MANAGER));
      expect(await managerRowCount()).toBe(1);
    });

    it("a failed update rolls the representative's edits back", async () => {
      const response = await putMember({ id: existingCompanyId, vat_number: TOO_LONG, manager: EDITED_MANAGER });

      await expectError(response, MEMBER_ERRORS.UPDATE_MEMBER.DATABASE_SAVE_COMPANY);
      expect(await managerOf("company", existingCompanyId)).toEqual(SEED_MANAGER_ROW);
      expect(await lastUpdateAudit(existingCompanyId)).toBeNull();
    });

    it("a representative that cannot be saved answers 400, not 500", async () => {
      const response = await putMember({ id: existingCompanyId, manager: { ...EDITED_MANAGER, surname: TOO_LONG } });

      await expectError(response, MEMBER_ERRORS.UPDATE_MEMBER.DATABASE_SAVE_COMPANY);
      expect(await managerOf("company", existingCompanyId)).toEqual(SEED_MANAGER_ROW);
    });
  });

  describe("email", () => {
    const emailOfIndividual = (): Promise<unknown[]> => sqlRows("SELECT email FROM individual WHERE id = $1", [existingIndividualId]);

    it("an empty email means 'not sent': the individual's email is left unchanged", async () => {
      const response = await putMember({ id: existingIndividualId, email: "" });

      await expectSuccess(response);
      expect(await emailOfIndividual()).toEqual([{ email: "john@test.com" }]);
    });

    it("a malformed email is still refused", async () => {
      const response = await putMember({ id: existingIndividualId, email: "not-an-email" });

      await expectWithLog(response, () => {
        expect(response.status).toBe(422);
        expect(response.body.error_code).toBe(MEMBER_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.EMAIL.errorCode);
      });
      expect(await emailOfIndividual()).toEqual([{ email: "john@test.com" }]);
    });
  });
});

describe("(Functional) POST /members writes the manager inside its transaction", () => {
  useFunctionalTestDb();

  it("a failed creation leaves no orphaned guardian row behind", async () => {
    const response = await asAdmin(
      request(await app())
        .post("/members/")
        .send({
          name: "Orphan Guardian Member",
          member_type: MemberType.INDIVIDUAL,
          status: MemberStatus.ACTIVE,
          iban: "BE6666666666",
          first_name: TOO_LONG,
          NRN: "76.09.12-243.86",
          email: "orphan_guardian@test.com",
          social_rate: false,
          home_address: { street: "Rue", number: "1", city: "Bruxelles", postcode: "1000" },
          billing_address: { street: "Rue", number: "1", city: "Bruxelles", postcode: "1000" },
          manager: EDITED_MANAGER,
        }),
    );

    await expectError(response, MEMBER_ERRORS.ADD_MEMBER.DATABASE_ADD);
    expect(await sqlRows("SELECT id FROM member WHERE name = $1", ["Orphan Guardian Member"])).toEqual([]);
    expect(await managerRowCount()).toBe(1);
  });
});
