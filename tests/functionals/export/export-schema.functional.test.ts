import { describe, expect, it } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";

/**
 * database_script/2026-11-15_data_export.sql against the test schema: it builds the same tables
 * as tests/sql/init.sql, runs twice without harm, and its constraints hold the rules the API and
 * the worker rely on.
 */
const MIGRATION = "database_script/2026-11-15_data_export.sql";

async function query<T = unknown>(sql: string, params: unknown[] = []): Promise<T> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  return (await AppDataSource.manager.query(sql, params)) as T;
}

async function shape(): Promise<unknown> {
  return {
    columns: await query(
      `SELECT table_name, column_name, data_type, character_maximum_length, is_nullable, column_default
         FROM information_schema.columns WHERE table_name IN ('export_job', 'export_part') ORDER BY 1, 2`,
    ),
    indexes: await query(`SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('export_job', 'export_part') ORDER BY 1`),
    constraints: await query(
      `SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint
        WHERE conrelid IN ('export_job'::regclass, 'export_part'::regclass) ORDER BY 1`,
    ),
  };
}

const JOB = `INSERT INTO export_job (id, scope_type, scope_id, id_community, requester_user_id, id_requester, status, schema_version, locale, object_key, expires_at)`;

describe("(Functional) data export schema", () => {
  useFunctionalTestDb(false);

  it("builds the tables of tests/sql/init.sql, and can run twice", async () => {
    const expected = await shape();
    await query(`DROP TABLE export_part; DROP TABLE export_job;`);

    await query(await readFile(MIGRATION, "utf8"));
    await query(await readFile(MIGRATION, "utf8"));

    expect(await shape()).toEqual(expected);
  });

  it("allows one active export per requester and scope, any number of finished ones", async () => {
    const insert = (status: string): Promise<unknown> =>
      query(`${JOB} VALUES (gen_random_uuid(), 'user', 'u', NULL, 'u', 1, $1, '1.0', 'fr', NULL, NULL)`, [status]);
    await insert("failed");
    await insert("expired");
    await insert("pending");

    await expect(insert("collecting")).rejects.toThrow(/uq_export_job_active/u);
  });

  it("ties a community scope to a community, and a ready job to its archive", async () => {
    await expect(query(`${JOB} VALUES (gen_random_uuid(), 'community', '2', NULL, 'u', 1, 'pending', '1.0', 'fr', NULL, NULL)`)).rejects.toThrow(
      /ck_export_job_scope/u,
    );
    await expect(query(`${JOB} VALUES (gen_random_uuid(), 'user', 'u', 1, 'u', 1, 'pending', '1.0', 'fr', NULL, NULL)`)).rejects.toThrow(
      /ck_export_job_scope/u,
    );
    await expect(query(`${JOB} VALUES (gen_random_uuid(), 'user', 'u', NULL, 'u', 1, 'ready', '1.0', 'fr', NULL, NOW())`)).rejects.toThrow(
      /ck_export_job_ready/u,
    );
  });

  it("deletes a user's jobs and their parts with the user", async () => {
    const [{ id }] = await query<{ id: string }[]>(
      `${JOB} VALUES (gen_random_uuid(), 'user', 'auth0|member', NULL, 'auth0|member', 4, 'pending', '1.0', 'fr', NULL, NULL) RETURNING id`,
    );
    await query(`INSERT INTO export_part (id, export_job_id, service) VALUES (gen_random_uuid(), $1, 'crm')`, [id]);

    await query(`DELETE FROM app_user WHERE id = 4`);

    expect(await query(`SELECT count(*)::int AS n FROM export_part`)).toEqual([{ n: 0 }]);
  });
});
