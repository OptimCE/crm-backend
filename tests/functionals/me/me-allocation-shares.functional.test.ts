import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { AUTH_COMMUNITY_1, ORGS_MEMBER } from "../../utils/shared.consts.js";
import type { MeAllocationShareDTO, MeAllocationSharesDTO } from "../../../src/modules/me/api/me.dtos.js";

/** Seeded, linked to member 1, which holds EAN_ONE on operation 1 (key 1). */
const AUTH_USER_MEMBER_1 = "auth0|member";
/** Seeded, has no user_member_link row at all. */
const AUTH_USER_UNLINKED = "auth0|admin";
const AUTH_USER_WIND_ALPHA = "auth0|wind-alpha";
const AUTH_USER_WIND_BRAVO = "auth0|wind-bravo";

const EAN_ONE = "123456789012345678"; // member 1, operation 1 (Public Solar), key 1
const EAN_WIND_ALPHA = "541448200000000001"; // member 4, operation 2 (Public Wind), key 2

async function sql(query: string, params: unknown[] = []): Promise<void> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  await AppDataSource.manager.query(query, params);
}

async function linkUserToMember(auth_user_id: string, email: string, id_member: number): Promise<void> {
  await sql(`INSERT INTO app_user (email, first_name, last_name, auth_user_id) VALUES ($1, 'Test', 'User', $2)`, [email, auth_user_id]);
  await sql(`INSERT INTO user_member_link (id_user, id_member) SELECT id, $2 FROM app_user WHERE auth_user_id = $1`, [
    auth_user_id,
    id_member,
  ]);
}

/**
 * Renames the two seeded consumers of key 1 to real EANs, which is the convention
 * the whole endpoint rests on — `consumer.name` has no FK to a meter.
 */
async function nameConsumersAfterEans(): Promise<void> {
  await sql(`UPDATE consumer SET name = $1 WHERE name = 'Consumer 1'`, [EAN_ONE]);
  await sql(`UPDATE consumer SET name = $1 WHERE name = 'Consumer 2'`, [EAN_WIND_ALPHA]);
}

async function getShares(user: string, query: Record<string, string> = {}): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  return request(appModule.default)
    .get("/me/allocation-shares")
    .query(query)
    .set("x-user-id", user)
    .set("x-community-id", AUTH_COMMUNITY_1)
    .set("x-user-orgs", ORGS_MEMBER);
}

function body(response: request.Response): MeAllocationSharesDTO {
  return response.body.data as MeAllocationSharesDTO;
}

function sharesFor(response: request.Response, ean: string): MeAllocationShareDTO[] {
  return body(response).shares.filter((s) => s.ean === ean);
}

function only(response: request.Response): MeAllocationShareDTO {
  const { shares } = body(response);
  expect(shares).toHaveLength(1);
  return shares[0];
}

describe("(Functional) GET /me/allocation-shares", () => {
  useFunctionalTestDb();

  describe("authorization", () => {
    it("returns only the caller's own meter, not every meter on the same key", async () => {
      await nameConsumersAfterEans();
      // Both EANs are consumers of key 1 now, but this user represents member 1.
      await sql(`UPDATE meter_data SET id_sharing_operation = 1 WHERE ean = $1`, [EAN_WIND_ALPHA]);

      const response = await getShares(AUTH_USER_MEMBER_1);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        expect(response.body.error_code).toBe(SUCCESS);
        const { shares } = body(response);
        // Asserting the LENGTH, not just the absence: a broken row predicate
        // would return both and still satisfy a `not.toContain`.
        expect(shares).toHaveLength(1);
        expect(shares[0].ean).toBe(EAN_ONE);
      });
    });

    it("hides the current holder's share from a former holder", async () => {
      await nameConsumersAfterEans();
      await linkUserToMember(AUTH_USER_WIND_BRAVO, "bravo@test.com", 5);
      // Hand EAN_ONE over from member 1 to member 5 mid-June.
      await sql(`UPDATE meter_data SET end_date = '2026-06-15' WHERE ean = $1 AND id_member = 1`, [EAN_ONE]);
      await sql(
        `INSERT INTO meter_data (ean, status, rate, client_type, start_date, id_sharing_operation, id_community, id_member)
         VALUES ($1, 1, 1, 1, '2026-06-16', 1, 1, 5)`,
        [EAN_ONE],
      );

      const formerHolder = await getShares(AUTH_USER_MEMBER_1, { at: "2026-06-16" });
      const newHolder = await getShares(AUTH_USER_WIND_BRAVO, { at: "2026-06-16" });

      await expectWithLog(formerHolder, () => {
        // The looser "any member of mine ever held this EAN" predicate used by
        // getMeters would leak the new holder's share here. Member 5 keeps their
        // own seeded wind meter either way, so scope the assertion to the EAN
        // that actually changed hands.
        expect(sharesFor(formerHolder, EAN_ONE)).toEqual([]);
        expect(sharesFor(newHolder, EAN_ONE)).toHaveLength(1);
        expect(sharesFor(newHolder, EAN_ONE)[0].member.id).toBe(5);
      });
    });

    it("shows each side of a hand-over only their own day", async () => {
      await nameConsumersAfterEans();
      await linkUserToMember(AUTH_USER_WIND_BRAVO, "bravo@test.com", 5);
      await sql(`UPDATE meter_data SET end_date = '2026-06-15' WHERE ean = $1 AND id_member = 1`, [EAN_ONE]);
      await sql(
        `INSERT INTO meter_data (ean, status, rate, client_type, start_date, id_sharing_operation, id_community, id_member)
         VALUES ($1, 1, 1, 1, '2026-06-16', 1, 1, 5)`,
        [EAN_ONE],
      );

      // end_date is the LAST day held, so June 15 still belongs to member 1.
      expect(sharesFor(await getShares(AUTH_USER_MEMBER_1, { at: "2026-06-15" }), EAN_ONE)).toHaveLength(1);
      expect(sharesFor(await getShares(AUTH_USER_WIND_BRAVO, { at: "2026-06-15" }), EAN_ONE)).toEqual([]);
      expect(sharesFor(await getShares(AUTH_USER_MEMBER_1, { at: "2026-06-16" }), EAN_ONE)).toEqual([]);
      expect(sharesFor(await getShares(AUTH_USER_WIND_BRAVO, { at: "2026-06-16" }), EAN_ONE)).toHaveLength(1);
    });

    it("returns an empty list, not a 403, for a user with no member link", async () => {
      const response = await getShares(AUTH_USER_UNLINKED);

      await expectWithLog(response, () => {
        // Same convention as getMeterConsumptions: no membership existence oracle.
        expect(response.status).toBe(200);
        expect(body(response).shares).toEqual([]);
      });
    });

    it("refuses a request with no user id", async () => {
      const appModule = await import("../../../src/app.js");
      const response = await request(appModule.default).get("/me/allocation-shares").set("x-user-orgs", ORGS_MEMBER);
      await expectWithLog(response, () => expect(response.status).toBe(400));
    });
  });

  describe("share composition", () => {
    it("reports an unmatched consumer as unavailable, never as zero", async () => {
      // The seed names its consumers "Consumer 1"/"Consumer 2" — labels, not EANs.
      // This is the default state of every hand-made key, and rendering it as
      // "0 %" would tell the member they receive nothing, which is false.
      const share = only(await getShares(AUTH_USER_MEMBER_1));

      expect(share.matched).toBe(false);
      expect(share.match_basis).toBeNull();
      expect(share.effective_share).toBeNull();
      expect(share.effective_share).not.toBe(0);
      expect(share.is_prorata).toBe(false);
      // The key is still reported — the member can see WHICH key does not name them.
      expect(share.key?.id).toBe(1);
      expect(share.iterations).toEqual([
        { iteration_id: 1, iteration_number: 1, iteration_share: 1, consumer_share: null, is_prorata: false, contribution: 0 },
      ]);
    });

    it("computes the share when a consumer carries the EAN", async () => {
      await nameConsumersAfterEans();

      const share = only(await getShares(AUTH_USER_MEMBER_1));

      expect(share.matched).toBe(true);
      expect(share.match_basis).toBe("ean_consumer_name");
      expect(share.is_prorata).toBe(false);
      expect(share.effective_share).toBe(0.5);
    });

    it("matches on a padded consumer name", async () => {
      await sql(`UPDATE consumer SET name = $1 WHERE name = 'Consumer 1'`, [`  ${EAN_ONE}  `]);

      const share = only(await getShares(AUTH_USER_MEMBER_1));
      expect(share.matched).toBe(true);
      expect(share.effective_share).toBe(0.5);
    });

    it("surfaces the PRORATA sentinel as null, never as -1", async () => {
      await nameConsumersAfterEans();
      await sql(`UPDATE consumer SET energy_allocated_percentage = -1 WHERE name = $1`, [EAN_ONE]);

      const share = only(await getShares(AUTH_USER_MEMBER_1));

      expect(share.matched).toBe(true);
      expect(share.is_prorata).toBe(true);
      expect(share.effective_share).toBeNull();
      expect(share.effective_share).not.toBe(-1);
      expect(share.iterations[0].contribution).toBeNull();
      expect(share.iterations[0].is_prorata).toBe(true);
    });

    it("composes across iterations and rounds the float sum", async () => {
      // Key 1 gets three iterations: 0.6 / 0.4 (the EAN appears in both) and one
      // more the EAN is absent from. 0.6*0.5 + 0.4*0.25 is 0.4000000000000001 in
      // IEEE-754; the mapper must return exactly 0.4.
      await sql(`UPDATE iteration SET energy_allocated_percentage = 0.6 WHERE id = 1`);
      await sql(`DELETE FROM consumer WHERE name = 'Consumer 2'`);
      await sql(`UPDATE consumer SET name = $1, energy_allocated_percentage = 0.5 WHERE id_iteration = 1`, [EAN_ONE]);
      await sql(
        `INSERT INTO iteration (number, energy_allocated_percentage, id_key, id_community) VALUES (2, 0.4, 1, 1)`,
      );
      await sql(
        `INSERT INTO consumer (name, energy_allocated_percentage, id_iteration, id_community)
         SELECT $1, 0.25, id, 1 FROM iteration WHERE id_key = 1 AND number = 2`,
        [EAN_ONE],
      );
      await sql(
        `INSERT INTO iteration (number, energy_allocated_percentage, id_key, id_community) VALUES (3, 0, 1, 1)`,
      );

      const share = only(await getShares(AUTH_USER_MEMBER_1));

      expect(share.effective_share).toBe(0.4);
      expect(share.iterations).toHaveLength(3);
      // The iteration the EAN is absent from contributes 0 — present in the
      // breakdown rather than silently dropped, so the member can see why.
      const absent = share.iterations.find((i) => i.iteration_number === 3);
      expect(absent).toMatchObject({ consumer_share: null, contribution: 0 });
    });

    it("sums duplicate consumers carrying the same EAN in one iteration", async () => {
      // `consumer.name` has no uniqueness constraint, so this is representable.
      await sql(`UPDATE consumer SET name = $1 WHERE id_iteration = 1`, [EAN_ONE]);

      const share = only(await getShares(AUTH_USER_MEMBER_1));
      expect(share.effective_share).toBe(1);
    });
  });

  describe("key validity window", () => {
    it("reports no key once the link has been closed", async () => {
      await nameConsumersAfterEans();
      await sql(`UPDATE sharing_operation_key SET end_date = '2024-06-30' WHERE id_sharing_operation = 1`);

      const share = only(await getShares(AUTH_USER_MEMBER_1));

      expect(share.key).toBeNull();
      expect(share.matched).toBe(false);
      expect(share.effective_share).toBeNull();
      expect(share.iterations).toEqual([]);
    });

    it("still finds the key on its last valid day", async () => {
      await nameConsumersAfterEans();
      await sql(`UPDATE sharing_operation_key SET end_date = '2024-06-30' WHERE id_sharing_operation = 1`);

      const onLastDay = only(await getShares(AUTH_USER_MEMBER_1, { at: "2024-06-30" }));
      expect(onLastDay.key?.id).toBe(1);
      expect(onLastDay.effective_share).toBe(0.5);

      const dayAfter = only(await getShares(AUTH_USER_MEMBER_1, { at: "2024-07-01" }));
      expect(dayAfter.key).toBeNull();
    });

    it("ignores a key that is not APPROVED", async () => {
      await nameConsumersAfterEans();
      await sql(`UPDATE sharing_operation_key SET status = 2 WHERE id_sharing_operation = 1`);

      expect(only(await getShares(AUTH_USER_MEMBER_1)).key).toBeNull();
    });
  });

  describe("cross-community", () => {
    it("spans communities with no active-community header at all", async () => {
      // Member 1 is in community 1; member 3 is in community 2. One user, both.
      await sql(`UPDATE meter_data SET id_member = 3, id_sharing_operation = 3, id_community = 2 WHERE ean = $1`, [EAN_WIND_ALPHA]);
      await sql(`UPDATE meter SET id_community = 2 WHERE ean = $1`, [EAN_WIND_ALPHA]);
      await sql(`INSERT INTO user_member_link (id_user, id_member) SELECT id, 3 FROM app_user WHERE auth_user_id = $1`, [
        AUTH_USER_MEMBER_1,
      ]);

      const appModule = await import("../../../src/app.js");
      const response = await request(appModule.default).get("/me/allocation-shares").set("x-user-id", AUTH_USER_MEMBER_1);

      await expectWithLog(response, () => {
        // No x-community-id and no roleChecker: the whole /me surface is
        // user-scoped, so one call answers for every community at once.
        expect(response.status).toBe(200);
        const communities = new Set(body(response).shares.map((s) => s.community.id));
        expect(communities).toEqual(new Set([1, 2]));
      });
    });

    it("excludes a meter that belongs to no sharing operation", async () => {
      await linkUserToMember(AUTH_USER_WIND_ALPHA, "alpha@test.com", 4);
      await sql(`UPDATE meter_data SET id_sharing_operation = NULL WHERE ean = $1`, [EAN_WIND_ALPHA]);

      // No operation means no key and therefore no share to report.
      expect(body(await getShares(AUTH_USER_WIND_ALPHA)).shares).toEqual([]);
    });
  });

  it("returns bare calendar dates, not timezone-shifted instants", async () => {
    await nameConsumersAfterEans();
    await linkUserToMember(AUTH_USER_WIND_BRAVO, "bravo@test.com", 5);
    await sql(`UPDATE meter_data SET end_date = '2026-06-15' WHERE ean = $1 AND id_member = 1`, [EAN_ONE]);
    await sql(
      `INSERT INTO meter_data (ean, status, rate, client_type, start_date, id_sharing_operation, id_community, id_member)
       VALUES ($1, 1, 1, 1, '2026-06-16', 1, 1, 5)`,
      [EAN_ONE],
    );

    const share = sharesFor(await getShares(AUTH_USER_WIND_BRAVO, { at: "2026-06-16" }), EAN_ONE)[0];

    // getRawMany bypasses TypeORM's date transform, so pg hands back a JS Date at
    // LOCAL midnight. Serialised straight to JSON that becomes
    // "2026-06-15T22:00:00.000Z" in Brussels summer time, and any client slicing
    // the first ten characters reads the day BEFORE the one stored.
    expect(share.holding_start_date).toBe("2026-06-16");
    expect(share.key?.start_date).toBe("2024-01-01");
    expect(share.key?.end_date).toBeNull();
  });

  it("echoes the evaluation date and rejects a malformed one", async () => {
    const defaulted = await getShares(AUTH_USER_MEMBER_1);
    expect(body(defaulted).at).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const explicit = await getShares(AUTH_USER_MEMBER_1, { at: "2026-06-15" });
    expect(body(explicit).at).toBe("2026-06-15");

    const bad = await getShares(AUTH_USER_MEMBER_1, { at: "not-a-date" });
    // validateDto answers 422 for a malformed DTO; 400 is the missing-header case.
    await expectWithLog(bad, () => expect(bad.status).toBe(422));
  });
});
