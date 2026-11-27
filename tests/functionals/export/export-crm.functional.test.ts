import { beforeEach, describe, expect, it } from "@jest/globals";
import type { jest } from "@jest/globals";
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";
import type { DataSource } from "typeorm";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { runContractCheck, type ContractCheckResult } from "../../../src/shared/export/kit/contract-check.js";
import type { PartDone, PartFailed } from "../../../src/shared/export/kit/contract.js";
import type { IIamService, IamUserExport } from "../../../src/shared/iam/i-iam.service.js";
import type { IStorageService } from "../../../src/shared/storage/i-storage.service.js";

/**
 * The `crm` part on the seed of tests/sql/init.sql, through the kit's contract check (the same
 * check every service runs). Keycloak and the document storage are the tests' mocks.
 *
 *   user 1 demo      ADMIN of community 1
 *   user 2 admin     ADMIN of communities 1, 2, 3, linked to no member
 *   user 4 member    MEMBER of communities 1, 2, linked to member 1 (EAN 123456789012345678, document 1)
 */
const MEMBER_USER = "auth0|member";
const ADMIN_USER = "auth0|admin";
const COMMUNITY_1 = "2c8a0ea5-d597-49d6-ae12-4dceb9e9a018";
const EAN_ONE = "123456789012345678";
const EAN_WIND_ALPHA = "541448200000000001";
const SCHEMAS = join(process.cwd(), "assets/export/schemas");

async function db(): Promise<DataSource> {
  return (await import("../../../src/shared/database/database.connector.js")).AppDataSource;
}
async function sql(query: string, params: unknown[] = []): Promise<unknown> {
  return (await db()).query(query, params);
}

async function run(scope: { type: "user" | "community"; id: string }, requesterId: string): Promise<ContractCheckResult> {
  await import("../../../src/container/binding.js");
  const { container } = await import("../../../src/container/di-container.js");
  const { createCrmExportHandler } = await import("../../../src/modules/exports/crm/crm-export.handler.js");
  return runContractCheck(createCrmExportHandler(container), { service: "crm", scope, requesterId });
}

function done(result: ContractCheckResult): PartDone {
  if (result.outcome !== "done") throw new Error(`expected done, got ${JSON.stringify(result.message)}`);
  return result.message as PartDone;
}

function paths(result: ContractCheckResult): string[] {
  return done(result)
    .files.map((f) => f.path)
    .sort();
}

/** The `items` of `crm/<name>.json`. */
function items(result: ContractCheckResult, name: string): Record<string, unknown>[] {
  const file = done(result).files.find((f) => f.path === `crm/${name}.json`);
  if (!file) throw new Error(`no crm/${name}.json`);
  return JSON.parse(result.store.text(file.key)).items;
}

const addFormats = ((addFormatsModule as unknown as { default?: typeof addFormatsModule }).default ?? addFormatsModule) as unknown as (
  a: Ajv2020,
) => Ajv2020;

/** Validates every JSON file of the part: the envelope, and each item against its schema. */
function validateFiles(result: ContractCheckResult): void {
  const ajv = addFormats(new Ajv2020({ strict: true, allErrors: true }));
  for (const name of readdirSync(SCHEMAS).filter((f) => f.endsWith(".schema.json")))
    ajv.addSchema(JSON.parse(readFileSync(join(SCHEMAS, name), "utf8")));
  for (const name of readdirSync(join(SCHEMAS, "files/crm"))) ajv.addSchema(JSON.parse(readFileSync(join(SCHEMAS, "files/crm", name), "utf8")));
  for (const file of done(result).files.filter((f) => f.path.endsWith(".json"))) {
    const body = JSON.parse(result.store.text(file.key));
    const envelope = ajv.getSchema("https://optimce.be/contracts/export/data-file.schema.json")!;
    expect([file.path, envelope(body), envelope.errors]).toEqual([file.path, true, null]);
    const item = ajv.getSchema(`https://optimce.be/contracts/export/files/crm/${body.entity}.schema.json`);
    if (!item) throw new Error(`no item schema for crm/${body.entity}`);
    for (const value of body.items) {
      const valid = item(value);
      if (!valid) throw new Error(`${file.path}: ${JSON.stringify(item.errors?.slice(0, 3))} in ${JSON.stringify(value).slice(0, 400)}`);
    }
  }
}

/** EXPORT_DUMP=<dir> writes every file of the part there, to look at. */
function dump(result: ContractCheckResult, label: string): void {
  const dir = process.env.EXPORT_DUMP;
  if (!dir || result.outcome !== "done") return;
  for (const file of done(result).files) {
    const out = join(dir, label, file.path);
    mkdirSync(join(out, ".."), { recursive: true });
    writeFileSync(out, result.store.text(file.key));
  }
  writeFileSync(join(dir, label, "done.json"), JSON.stringify(result.message, null, 2));
}

const identity: IamUserExport = {
  id: MEMBER_USER,
  username: "member",
  email: "member@test.com",
  email_verified: true,
  first_name: "Member",
  last_name: "User",
  enabled: true,
  created_at: "2024-01-01T00:00:00.000Z",
  attributes: { locale: ["fr"] },
  identity_providers: [],
  realm_roles: ["default-roles-optimce-realm"],
  groups: [{ name: "MEMBER", path: "/Test Community/MEMBER" }],
};

describe("(Functional) export, crm part", () => {
  useFunctionalTestDb();

  let iam: jest.Mocked<IIamService>;
  let storage: jest.Mocked<IStorageService>;

  beforeEach(async () => {
    const { container } = await import("../../../src/container/di-container.js");
    iam = container.get<jest.Mocked<IIamService>>("IAMService");
    storage = container.get<jest.Mocked<IStorageService>>("StorageService");
    iam.getUserExport.mockResolvedValue(identity);
    storage.stat.mockResolvedValue({ size: 100, contentType: "application/pdf" });
  });

  describe("user export", () => {
    it("holds the account, identity, members, meters, readings and documents, in valid files", async () => {
      const result = await run({ type: "user", id: MEMBER_USER }, MEMBER_USER);
      dump(result, "user-member");

      expect(paths(result)).toEqual([
        "crm/account.json",
        "crm/activity-log.json",
        "crm/allocation-shares.json",
        `crm/consumptions/${EAN_ONE}/2024.csv`,
        "crm/documents.json",
        "crm/email-messages.json",
        "crm/email-suppression.json",
        "crm/identity.json",
        "crm/invitations.json",
        "crm/members.json",
        "crm/meters.json",
        "crm/notifications.json",
        "crm/sharing-participations.json",
      ]);
      expect(iam.getUserExport).toHaveBeenCalledWith(MEMBER_USER);
      expect(items(result, "identity")).toEqual([identity]);
      expect(items(result, "account")).toEqual([expect.objectContaining({ email: "member@test.com", communities: expect.any(Array) })]);
      expect(items(result, "members").map((m) => m.id)).toEqual([1]);
      expect(items(result, "meters").map((m) => m.ean)).toEqual([EAN_ONE]);
      const csv = result.store.text(done(result).files.find((f) => f.path.endsWith("2024.csv"))!.key);
      expect(csv).toBe(
        "timestamp_utc,gross_kwh,net_kwh,shared_kwh,inj_gross_kwh,inj_shared_kwh,inj_net_kwh\r\n2024-01-01T12:00:00.000Z,1,0.8,0.2,,,\r\n",
      );
      expect(done(result).references).toEqual([
        { bucket: "crm-files", key: "http://url", targetPath: "crm/documents/files/1-doc.pdf", size: 100, contentType: "application/pdf" },
      ]);
      expect(items(result, "documents")).toEqual([expect.objectContaining({ id: 1, file: "crm/documents/files/1-doc.pdf", file_missing: false })]);
      validateFiles(result);
    });

    it("gives an ADMIN who is no member their account and actions, nothing of the community's members", async () => {
      await sql(
        `INSERT INTO audit_log (id_community, action, source, entity_type, entity_id, user_id, user_email) VALUES (1, 'crm.member.created', 'crm-backend', 'member', '1', 2, 'admin@test.com')`,
      );
      await sql(
        `INSERT INTO audit_log (id_community, action, source, entity_type, entity_id, user_id, user_email) VALUES (NULL, 'crm.member_invitation.accepted', 'crm-backend', 'member', '1', 2, 'admin@test.com')`,
      );
      await sql(
        `INSERT INTO audit_log (id_community, action, source, entity_type, entity_id, user_id, user_email) VALUES (1, 'crm.member.deleted', 'crm-backend', 'member', '1', 1, 'demo@example.com')`,
      );

      const result = await run({ type: "user", id: ADMIN_USER }, ADMIN_USER);
      dump(result, "user-admin");

      for (const empty of ["members", "meters", "documents", "sharing-participations", "allocation-shares", "invitations"]) {
        expect([empty, items(result, empty)]).toEqual([empty, []]);
      }
      expect(paths(result).filter((p) => p.endsWith(".csv"))).toEqual([]);
      expect(done(result).references).toEqual([]);
      expect(items(result, "account")).toEqual([expect.objectContaining({ email: "admin@test.com" })]);
      expect(items(result, "activity-log").map((a) => [a.action, a.community_id])).toEqual([
        ["crm.member.created", 1],
        ["crm.member_invitation.accepted", null],
      ]);
      validateFiles(result);
    });

    it("leaves out a community document of a member who is not the user's", async () => {
      await sql(
        `INSERT INTO document (id_member, file_name, file_url, file_size, file_type, upload_date, id_community) VALUES (2, 'other.pdf', 'documents/x-other.pdf', 10, 'application/pdf', '2024-02-01', 1)`,
      );

      const result = await run({ type: "user", id: MEMBER_USER }, MEMBER_USER);

      expect(items(result, "documents").map((d) => d.file_name)).toEqual(["doc.pdf"]);
      expect(done(result).references.map((r) => r.key)).toEqual(["http://url"]);
    });

    it("shows only the share of the user's own members in an allocation key", async () => {
      await sql(`UPDATE consumer SET name = $1 WHERE name = 'Consumer 1'`, [EAN_ONE]);
      await sql(`UPDATE consumer SET name = $1 WHERE name = 'Consumer 2'`, [EAN_WIND_ALPHA]);
      await sql(`UPDATE meter_data SET id_sharing_operation = 1 WHERE ean = $1`, [EAN_WIND_ALPHA]);

      const result = await run({ type: "user", id: MEMBER_USER }, MEMBER_USER);

      const shares = items(result, "allocation-shares");
      expect(shares.map((s) => s.ean)).toEqual([EAN_ONE]);
      expect(JSON.stringify(items(result, "allocation-shares"))).not.toContain(EAN_WIND_ALPHA);
    });

    it("lists a document whose file is missing, flagged, without a reference", async () => {
      storage.stat.mockResolvedValue(null);

      const result = await run({ type: "user", id: MEMBER_USER }, MEMBER_USER);

      expect(items(result, "documents")).toEqual([expect.objectContaining({ id: 1, file: null, file_missing: true })]);
      expect(done(result).references).toEqual([]);
      expect(done(result).summary).toContainEqual({ labelKey: "export.crm.documents_missing", count: 1 });
    });

    it("refuses an export of another user's data", async () => {
      const result = await run({ type: "user", id: MEMBER_USER }, ADMIN_USER);
      expect([result.outcome, (result.message as PartFailed).errorCode]).toEqual(["failed", "forbidden"]);
    });
  });

  describe("community export", () => {
    it("holds the community, its users, members, meters, operations, keys and documents, never a notification", async () => {
      await sql(`INSERT INTO notification (id_user, id_community, type, data) VALUES (4, 1, 'member.updated', '{"member_id": 1}')`);

      const result = await run({ type: "community", id: COMMUNITY_1 }, ADMIN_USER);
      dump(result, "community");

      const files = paths(result);
      for (const name of [
        "community",
        "users",
        "members",
        "meters",
        "sharing-operations",
        "allocation-keys",
        "documents",
        "invitations",
        "regulatory-status",
        "activity-log",
      ]) {
        expect(files).toContain(`crm/${name}.json`);
      }
      // No individual notification, no mail, no identity: those are user files.
      for (const userFile of ["notifications", "email-messages", "email-suppression", "identity", "account"])
        expect(files).not.toContain(`crm/${userFile}.json`);
      for (const file of done(result).files) expect(result.store.text(file.key)).not.toContain("member.updated");
      expect(items(result, "community")).toEqual([expect.objectContaining({ id: 1, name: "Test Community" })]);
      expect(items(result, "users").map((u) => u.email)).toEqual(expect.arrayContaining(["demo@example.com", "admin@test.com", "member@test.com"]));
      expect(items(result, "members").length).toBeGreaterThan(1);
      validateFiles(result);
    });

    it("fails `forbidden` once the requester is no longer an ADMIN of the community", async () => {
      await sql(`UPDATE community_user SET role = 'MEMBER' WHERE id_community = 1 AND id_user = 2`);

      const result = await run({ type: "community", id: COMMUNITY_1 }, ADMIN_USER);

      expect([result.outcome, (result.message as PartFailed).errorCode]).toEqual(["failed", "forbidden"]);
    });

    it("fails `scope_not_found` for a community that does not exist", async () => {
      const result = await run({ type: "community", id: "no-such-community" }, ADMIN_USER);
      expect([result.outcome, (result.message as PartFailed).errorCode]).toEqual(["failed", "scope_not_found"]);
    });
  });
});
