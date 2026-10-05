import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalCacheTestDb } from "../../utils/test.functional.cached.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import type { ICacheService } from "../../../src/shared/cache/i-cache.service.js";
import { AUTH_COMMUNITY_1, ORGS_GESTIONNAIRE } from "../../utils/shared.consts.js";
import { SharingOperationMetersQueryType } from "../../../src/modules/sharing_operations/api/sharing_operation.dtos.js";
import { MemberStatus } from "../../../src/modules/members/shared/member.types.js";

// Seeded: member 1 ("Member One") holds this meter in sharing operation 1 since 2024-01-01, and its
// address is geocoded, so it is on the map too.
const HOLDER_ID = 1;
const HOLDER_EAN = "123456789012345678";
const OPERATION_ID = 1;

const METER_VIEW_PREFIXES = ["meters:list", "meters:map", "meters:detail", "sharing-op:meters"];

interface PartialMember {
  id: number;
  name: string;
  status: number;
}

async function send(method: "get" | "put" | "patch" | "delete", url: string, body?: object, query?: object): Promise<request.Response> {
  const { default: app } = await import("../../../src/app.js");
  let req = request(app)[method](url).set("x-user-id", "auth0|admin").set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", ORGS_GESTIONNAIRE);
  if (query) req = req.query(query);
  return body ? req.send(body) : req;
}

/** The holder each of the four meter views names for HOLDER_EAN; `type` picks the operation's tab. */
async function holderSeenBy(type: SharingOperationMetersQueryType): Promise<Record<string, PartialMember | undefined>> {
  const list = await send("get", "/meters/", undefined, { EAN: HOLDER_EAN });
  const map = await send("get", "/meters/map");
  const detail = await send("get", `/meters/${HOLDER_EAN}`);
  const operation = await send("get", `/sharing_operations/${OPERATION_ID}/meters`, undefined, { type });
  for (const response of [list, map, detail, operation]) {
    expect(response.status).toBe(200);
  }

  const point = (map.body.data.points as Array<{ EAN: string; holder_name?: string }>).find((p) => p.EAN === HOLDER_EAN);
  const history = detail.body.data.meter_data_history as Array<{ member?: PartialMember }> | undefined;
  return {
    list: (list.body.data as Array<{ holder?: PartialMember }>)[0]?.holder,
    // The map point carries the name only.
    map: point?.holder_name === undefined ? undefined : ({ name: point.holder_name } as PartialMember),
    detail: detail.body.data.holder ?? history?.[0]?.member,
    operation: (operation.body.data as Array<{ holder?: PartialMember }>)[0]?.holder,
  };
}

/**
 * Every meter view names the meter's holder, and caches it per community for 60 s. A member
 * mutation used to clear only the member caches, so a renamed, re-statused or deleted holder kept
 * showing on the meter views until the TTL ran out.
 */
describe("(Cache Integration) Member mutations refresh the meter views that name the holder", () => {
  useFunctionalCacheTestDb();

  async function meterViewKeys(): Promise<string[]> {
    const { container } = await import("../../../src/container/di-container.js");
    const keys = container.get<ICacheService>("CacheService").keys() as string[];
    return keys.filter((k) => METER_VIEW_PREFIXES.some((prefix) => k.startsWith(prefix + ":")));
  }

  /** Lets the fire-and-forget invalidation settle, as the member cache suite does. */
  const settle = (): Promise<void> => new Promise((r) => setTimeout(r, 50));

  it("PUT /members: the new name shows on every meter view at once", async () => {
    const before = await holderSeenBy(SharingOperationMetersQueryType.NOW);
    expect(Object.values(before).map((h) => h?.name)).toEqual(["Member One", "Member One", "Member One", "Member One"]);
    expect(await meterViewKeys()).toHaveLength(4);

    const update = await send("put", "/members/", { id: HOLDER_ID, name: "Renamed Holder" });
    await expectWithLog(update, () => expect(update.status).toBe(200));
    await settle();

    expect(await meterViewKeys()).toEqual([]);
    const after = await holderSeenBy(SharingOperationMetersQueryType.NOW);
    expect(Object.values(after).map((h) => h?.name)).toEqual(["Renamed Holder", "Renamed Holder", "Renamed Holder", "Renamed Holder"]);
  });

  it("PATCH /members/status: the new status shows on the meter views at once", async () => {
    // From PENDING to ACTIVE: deactivating is blocked while the holder has an active meter. PENDING
    // is seeded directly so the views cache it before the PATCH under test.
    const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
    await AppDataSource.manager.query("UPDATE member SET status = $1 WHERE id = $2", [MemberStatus.PENDING, HOLDER_ID]);

    const before = await holderSeenBy(SharingOperationMetersQueryType.NOW);
    expect([before.list?.status, before.detail?.status, before.operation?.status]).toEqual([
      MemberStatus.PENDING,
      MemberStatus.PENDING,
      MemberStatus.PENDING,
    ]);

    const patch = await send("patch", "/members/status", { id_member: HOLDER_ID, status: MemberStatus.ACTIVE });
    await expectWithLog(patch, () => expect(patch.status).toBe(200));
    await settle();

    expect(await meterViewKeys()).toEqual([]);
    const after = await holderSeenBy(SharingOperationMetersQueryType.NOW);
    expect([after.list?.status, after.detail?.status, after.operation?.status]).toEqual([
      MemberStatus.ACTIVE,
      MemberStatus.ACTIVE,
      MemberStatus.ACTIVE,
    ]);
  });

  it("DELETE /members/:id: the deleted holder disappears from the meter views at once", async () => {
    // A member with an active meter cannot be deleted, so the holding ends before the test.
    const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
    await AppDataSource.manager.query("UPDATE meter_data SET end_date = '2025-06-30' WHERE ean = $1", [HOLDER_EAN]);

    // The holding is now history: the detail's history and the operation's PAST tab still name it.
    const before = await holderSeenBy(SharingOperationMetersQueryType.PAST);
    expect([before.detail?.id, before.operation?.id]).toEqual([HOLDER_ID, HOLDER_ID]);

    const deletion = await send("delete", `/members/${HOLDER_ID}`);
    await expectWithLog(deletion, () => expect(deletion.status).toBe(200));
    await settle();

    expect(await meterViewKeys()).toEqual([]);
    // meter_data.id_member is ON DELETE SET NULL: the record stays, without a holder.
    const after = await holderSeenBy(SharingOperationMetersQueryType.PAST);
    expect([after.detail, after.operation]).toEqual([undefined, undefined]);
  });
});
