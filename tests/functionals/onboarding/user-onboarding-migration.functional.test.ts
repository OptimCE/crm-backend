import { describe, expect, it } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";

/**
 * The backfill of database_script/2026-10-25_user_onboarding.sql, run against
 * the seed of tests/sql/init.sql (users 1-4, communities 1-3, member 1 linked
 * to user 4):
 *
 *   user 1 demo     ADMIN of community 1
 *   user 2 admin    ADMIN of communities 1, 2, 3
 *   user 3 manager  MANAGER of communities 1, 2
 *   user 4 member   MEMBER of communities 1, 2, linked to member 1
 */
const MIGRATION = "database_script/2026-10-25_user_onboarding.sql";

type Row = { id_user: number; tour_key: string; outcome: string };

async function query<T = unknown>(sql: string, params: unknown[] = []): Promise<T> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  return (await AppDataSource.manager.query(sql, params)) as T;
}

async function runMigration(): Promise<void> {
  await query(await readFile(MIGRATION, "utf8"));
}

async function rows(): Promise<Row[]> {
  return query<Row[]>("SELECT id_user, tour_key, outcome FROM user_onboarding ORDER BY id_user, tour_key");
}

const EXPECTED: Row[] = [
  { id_user: 1, tour_key: "community_admin", outcome: "backfilled" },
  { id_user: 1, tour_key: "welcome", outcome: "backfilled" },
  { id_user: 2, tour_key: "community_admin", outcome: "backfilled" },
  { id_user: 2, tour_key: "welcome", outcome: "backfilled" },
  { id_user: 3, tour_key: "community_manager", outcome: "backfilled" },
  { id_user: 3, tour_key: "welcome", outcome: "backfilled" },
  { id_user: 4, tour_key: "community_member", outcome: "backfilled" },
  { id_user: 4, tour_key: "welcome", outcome: "backfilled" },
];

describe("(Functional) user_onboarding migration", () => {
  useFunctionalTestDb(false);

  it("creates the table and backfills welcome + the role tours each existing user is eligible to", async () => {
    await query("DROP TABLE user_onboarding");

    await runMigration();

    expect(await rows()).toEqual(EXPECTED);
  });

  it("counts an ACTIVE linked member as a member, even without the MEMBER role", async () => {
    await query("DROP TABLE user_onboarding");
    // user 3 is a MANAGER; link them to member 1 (status ACTIVE).
    await query("INSERT INTO user_member_link (id_user, id_member) VALUES (3, 1)");

    await runMigration();

    const keys = (await rows()).filter((r) => r.id_user === 3).map((r) => r.tour_key);
    expect(keys).toEqual(["community_manager", "community_member", "welcome"]);
  });

  it("does not count a link to an inactive member", async () => {
    await query("DROP TABLE user_onboarding");
    await query("UPDATE member SET status = 2 WHERE id = 1");
    await query("INSERT INTO user_member_link (id_user, id_member) VALUES (3, 1)");

    await runMigration();

    const keys = (await rows()).filter((r) => r.id_user === 3).map((r) => r.tour_key);
    expect(keys).toEqual(["community_manager", "welcome"]);
  });

  it("is a no-op on a second run: users created since keep no row", async () => {
    await query("DROP TABLE user_onboarding");
    await runMigration();
    await query("INSERT INTO app_user (email, auth_user_id) VALUES ('new@test.com', 'auth0|new')");

    await runMigration();

    expect(await rows()).toEqual(EXPECTED);
  });

  it("tests/sql/init.sql seeds exactly what the migration produces", async () => {
    const seeded = await rows();
    await query("DROP TABLE user_onboarding");

    await runMigration();

    expect(await rows()).toEqual(seeded);
  });
});
