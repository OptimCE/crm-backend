import { describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog, mockIAMServiceModule, mockStorageServiceModule } from "../../utils/helper.js";
import { AUTH_COMMUNITY_1, ORGS_ADMIN } from "../../utils/shared.consts.js";
import { COMMUNITY_ERRORS } from "../../../src/modules/communities/shared/community.errors.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";

// Seed: community 1 ("Test Community") has two PUBLIC sharing operations and a logo;
// community 2 ("Other Community") only a private one; community 3 none at all.
const PUBLIC_COMMUNITY = 1;
const PRIVATE_COMMUNITY = 2;
const COMMUNITY_WITHOUT_OPERATIONS = 3;

// Someone who belongs to community 2 only: the directory is for people outside a community.
const OUTSIDER = "auth0|outsider";
const OUTSIDER_ORGS = "[orgId:2 orgPath:/org2 roles:[MEMBER]]";

const PUBLIC_KEYS = [
  "contact_email",
  "contact_phone",
  "description",
  "headquarters_address",
  "id",
  "logo_presigned_url",
  "name",
  "regulator",
  "website_url",
];

async function put(body: object): Promise<request.Response> {
  await mockIAMServiceModule({ updateCommunity: jest.fn(() => Promise.resolve()) });
  const appModule = await import("../../../src/app.js");
  return request(appModule.default)
    .put("/communities/")
    .send(body)
    .set("x-user-id", "auth0|admin")
    .set("x-community-id", AUTH_COMMUNITY_1)
    .set("x-user-orgs", ORGS_ADMIN);
}

async function getPublic(id: number): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  return request(appModule.default)
    .get(`/communities/${id}/public`)
    .set("x-user-id", OUTSIDER)
    .set("x-community-id", "2")
    .set("x-user-orgs", OUTSIDER_ORGS);
}

async function sql<T>(query: string, params: unknown[] = []): Promise<T[]> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  return AppDataSource.query(query, params) as Promise<T[]>;
}

async function storedContact(): Promise<{ contact_email: string | null; contact_phone: string | null }> {
  const [row] = await sql<{ contact_email: string | null; contact_phone: string | null }>(
    "SELECT contact_email, contact_phone FROM community WHERE id = 1",
  );
  return row;
}

async function lastUpdateChangedFields(): Promise<string[]> {
  const [row] = await sql<{ changed_fields: string[] }>(
    "SELECT payload->'changed_fields' AS changed_fields FROM audit_log WHERE action = 'crm.community.updated' ORDER BY id DESC LIMIT 1",
  );
  return row.changed_fields;
}

describe("(Functional) Community public contact", () => {
  useFunctionalTestDb();

  it("an admin records the public contact; it is audited by field name only", async () => {
    const response = await put({ contact_email: "contact@test-community.be", contact_phone: "+32 470 12 34 56" });

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect(await storedContact()).toEqual({ contact_email: "contact@test-community.be", contact_phone: "+32 470 12 34 56" });
    const changed_fields = await lastUpdateChangedFields();
    expect(changed_fields).toEqual(expect.arrayContaining(["contact_email", "contact_phone"]));
    expect(JSON.stringify(changed_fields)).not.toContain("470");
  });

  it("null clears it", async () => {
    await put({ contact_email: "contact@test-community.be", contact_phone: "04/123.45.67" });

    const response = await put({ contact_email: null, contact_phone: null });

    await expectWithLog(response, () => expect(response.status).toBe(200));
    expect(await storedContact()).toEqual({ contact_email: null, contact_phone: null });
  });

  it.each([
    [{ contact_email: "pas-un-email" }, COMMUNITY_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.EMAIL.errorCode],
    [{ contact_phone: "1234" }, COMMUNITY_ERRORS.VALIDATION.INVALID_PHONE.errorCode],
    [{ contact_phone: "appelez-nous" }, COMMUNITY_ERRORS.VALIDATION.INVALID_PHONE.errorCode],
    [{ contact_phone: "+32 470 12 34 56 78 90 12" }, COMMUNITY_ERRORS.VALIDATION.INVALID_PHONE.errorCode],
  ])("refuses %o", async (body, error_code) => {
    const response = await put(body);

    await expectWithLog(response, () => {
      expect(response.status).toBe(422);
      expect(response.body.error_code).toBe(error_code);
    });
    expect(await storedContact()).toEqual({ contact_email: null, contact_phone: null });
  });

  it("the members-only detail returns it", async () => {
    await put({ contact_email: "contact@test-community.be", contact_phone: "+32 470 12 34 56" });
    const appModule = await import("../../../src/app.js");

    const response = await request(appModule.default)
      .get("/communities/1")
      .set("x-user-id", "auth0|admin")
      .set("x-community-id", AUTH_COMMUNITY_1)
      .set("x-user-orgs", ORGS_ADMIN);

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({ contact_email: "contact@test-community.be", contact_phone: "+32 470 12 34 56" });
    });
  });
});

describe("(Functional) GET /communities/:id/public", () => {
  useFunctionalTestDb();

  it("serves a public community to someone who is not a member, and nothing beyond the public fields", async () => {
    await put({ contact_email: "contact@test-community.be", contact_phone: "+32 470 12 34 56" });
    await mockStorageServiceModule({ getDocumentUrl: jest.fn(() => Promise.resolve("https://storage.example/logo.png?sig=1")) });

    const response = await getPublic(PUBLIC_COMMUNITY);

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.error_code).toBe(SUCCESS);
      expect(Object.keys(response.body.data).sort()).toEqual(PUBLIC_KEYS);
      expect(response.body.data).toMatchObject({
        id: 1,
        name: "Test Community",
        regulator: "BE-WAL-CWAPE",
        logo_presigned_url: "https://storage.example/logo.png?sig=1",
        description: "A test community",
        website_url: "https://test-community.example.com",
        // Seeded headquarters of community 1 (address 1).
        headquarters_address: { street: "Main St", number: "1", postcode: "1000", city: "Brussels" },
        contact_email: "contact@test-community.be",
        contact_phone: "+32 470 12 34 56",
      });
    });
    // The seed gives community 1 an IBAN and a VAT number: neither may leak.
    expect(JSON.stringify(response.body)).not.toContain("BE71096123456769");
    expect(JSON.stringify(response.body)).not.toContain("BE0762031208");
  });

  it("returns a null headquarters address when there is none", async () => {
    await sql("UPDATE community SET headquarters_address_id = NULL WHERE id = 1");
    await mockStorageServiceModule({ getDocumentUrl: jest.fn(() => Promise.resolve("https://storage.example/logo.png")) });

    const response = await getPublic(PUBLIC_COMMUNITY);

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.data.headquarters_address).toBeNull();
    });
  });

  it("still answers when the logo cannot be presigned", async () => {
    await mockStorageServiceModule({ getDocumentUrl: jest.fn(() => Promise.reject(new Error("storage down"))) });

    const response = await getPublic(PUBLIC_COMMUNITY);

    await expectWithLog(response, () => {
      expect(response.status).toBe(200);
      expect(response.body.data.logo_presigned_url).toBeNull();
      expect(response.body.data.contact_email).toBeNull();
    });
  });

  it.each([
    ["a community with only private sharing operations", PRIVATE_COMMUNITY],
    ["a community with no sharing operation", COMMUNITY_WITHOUT_OPERATIONS],
    ["a community that does not exist", 9999],
  ])("answers 404 for %s", async (_label, id) => {
    const response = await getPublic(id);

    await expectWithLog(response, () => {
      expect(response.status).toBe(404);
      expect(response.body.error_code).toBe(COMMUNITY_ERRORS.GET_COMMUNITY.COMMUNITY_NOT_FOUND.errorCode);
    });
  });
});
