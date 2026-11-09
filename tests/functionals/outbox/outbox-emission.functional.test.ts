import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { AUTH_COMMUNITY_1, ORGS_GESTIONNAIRE } from "../../utils/shared.consts.js";
import { addDaysISO, appTodayISO } from "../../../src/shared/utils/date.utils.js";
import { MeterDataStatus } from "../../../src/modules/meters/shared/meter.types.js";
import { SharingKeyStatus, SharingOperationType } from "../../../src/modules/sharing_operations/shared/sharing_operation.types.js";
import { CORE_EVENTS } from "../../../src/shared/outbox/core-events.js";

// Seeded (tests/sql/init.sql), community 1: EAN_OP1 is in Op 1 and EAN_OP2 in Op 2, both since
// 2024-01-01; Key 1 can be proposed on Op 2, which runs Key 2.
const EAN_OP1 = "123456789012345678";
const EAN_OP2 = "987654321098765432";
const OP1 = 1;
const OP2 = 2;

interface OutboxRow {
  id_community: number;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  published_at: Date | null;
}

async function call(method: "get" | "post" | "patch" | "delete", path: string, body?: object): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  const agent = request(appModule.default);
  const req = agent[method](path).set("x-user-id", "auth0|admin").set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", ORGS_GESTIONNAIRE);
  return body ? req.send(body) : req;
}

async function outbox(): Promise<OutboxRow[]> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  return AppDataSource.query(
    "SELECT id_community, aggregate_type, aggregate_id, event_type, payload, published_at FROM outbox_event ORDER BY id",
  ) as Promise<OutboxRow[]>;
}

/**
 * The core writes one outbox row per domain event, in the transaction of the change it
 * describes. These tests drive the real HTTP routes against the real schema, so they also prove
 * that every write path reaches the single writer (MeterRepository.addMeterData) with its runner.
 */
describe("(Functional) Outbox emission", () => {
  useFunctionalTestDb();

  it("adding a meter to an operation records exactly one meter_added", async () => {
    const today = appTodayISO();
    // Leave first, so the add is a pure addition and not a move.
    const leave = await call("delete", `/sharing_operations/${OP1}/meter`, { id_sharing: OP1, id_meter: EAN_OP1, date: addDaysISO(today, -1) });
    await expectWithLog(leave, () => expect(leave.status).toBe(200));
    const before = (await outbox()).length;

    const response = await call("post", "/sharing_operations/meter", { id_sharing: OP2, date: today, ean_list: [EAN_OP1] });
    await expectWithLog(response, () => expect(response.status).toBe(200));

    const rows = (await outbox()).slice(before);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id_community: 1,
      aggregate_type: "operation",
      aggregate_id: String(OP2),
      event_type: CORE_EVENTS.OPERATION_METER_ADDED,
      published_at: null,
    });
    expect(rows[0].payload).toMatchObject({ ean: EAN_OP1, id_sharing_operation: OP2, effective_date: today, reason: "configuration" });
  });

  it("moving a meter between operations records the exit, then the entry", async () => {
    const today = appTodayISO();
    const response = await call("post", "/sharing_operations/meter", { id_sharing: OP2, date: today, ean_list: [EAN_OP1] });
    await expectWithLog(response, () => expect(response.status).toBe(200));

    const rows = await outbox();
    expect(rows.map((r) => [r.event_type, r.aggregate_id])).toEqual([
      [CORE_EVENTS.OPERATION_METER_REMOVED, String(OP1)],
      [CORE_EVENTS.OPERATION_METER_ADDED, String(OP2)],
    ]);
  });

  it("removing a meter from its operation records meter_removed with the date", async () => {
    const date = addDaysISO(appTodayISO(), 5);
    const response = await call("delete", `/sharing_operations/${OP1}/meter`, { id_sharing: OP1, id_meter: EAN_OP1, date });
    await expectWithLog(response, () => expect(response.status).toBe(200));

    const rows = await outbox();
    expect(rows).toHaveLength(1);
    expect(rows[0].event_type).toBe(CORE_EVENTS.OPERATION_METER_REMOVED);
    expect(rows[0].payload).toMatchObject({ ean: EAN_OP1, id_sharing_operation: OP1, effective_date: date });
  });

  it("undoing a scheduled removal records the meter coming back", async () => {
    const date = addDaysISO(appTodayISO(), 5);
    const removal = await call("delete", `/sharing_operations/${OP1}/meter`, { id_sharing: OP1, id_meter: EAN_OP1, date });
    await expectWithLog(removal, () => expect(removal.status).toBe(200));
    // The scheduled row is no longer in Op 1, so deleting it goes through the meters endpoint.
    const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
    const [future] = (await AppDataSource.query("SELECT id FROM meter_data WHERE ean = $1 AND start_date = $2", [EAN_OP1, date])) as { id: number }[];

    const undo = await call("patch", "/meters/data/delete", { id_meter_data: future.id, active_previous_meter_data: true });
    await expectWithLog(undo, () => expect(undo.status).toBe(200));

    const rows = await outbox();
    expect(rows.map((r) => r.event_type)).toEqual([CORE_EVENTS.OPERATION_METER_REMOVED, CORE_EVENTS.OPERATION_METER_ADDED]);
    expect(rows[1].payload).toMatchObject({ ean: EAN_OP1, id_sharing_operation: OP1, reason: "configuration_deleted" });
  });

  it("a status change inside the same operation records nothing", async () => {
    const response = await call("patch", "/sharing_operations/meter", {
      id_sharing: OP1,
      id_meter: EAN_OP1,
      status: MeterDataStatus.WAITING_GRD,
      date: appTodayISO(),
    });
    await expectWithLog(response, () => expect(response.status).toBe(200));

    expect(await outbox()).toHaveLength(0);
  });

  it("a change that rolls back leaves no event behind", async () => {
    const today = appTodayISO();
    // EAN_OP2 gets a configuration in the future, so adding it today conflicts — AFTER EAN_OP1's
    // move has already written its two events in the same transaction.
    const future = await call("patch", "/sharing_operations/meter", {
      id_sharing: OP2,
      id_meter: EAN_OP2,
      status: MeterDataStatus.ACTIVE,
      date: addDaysISO(today, 30),
    });
    await expectWithLog(future, () => expect(future.status).toBe(200));

    const response = await call("post", "/sharing_operations/meter", { id_sharing: OP2, date: today, ean_list: [EAN_OP1, EAN_OP2] });
    expect(response.status).toBe(400);

    expect(await outbox()).toHaveLength(0);
  });

  it("approving a key records key_assigned; proposing it does not", async () => {
    const proposal = await call("post", "/sharing_operations/key", { id_sharing: OP2, id_key: 1 });
    await expectWithLog(proposal, () => expect(proposal.status).toBe(200));
    expect(await outbox()).toHaveLength(0);

    const today = appTodayISO();
    const approval = await call("patch", "/sharing_operations/key", { id_sharing: OP2, id_key: 1, status: SharingKeyStatus.APPROVED, date: today });
    await expectWithLog(approval, () => expect(approval.status).toBe(200));

    const rows = await outbox();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ event_type: CORE_EVENTS.OPERATION_KEY_ASSIGNED, aggregate_id: String(OP2) });
    expect(rows[0].payload).toMatchObject({ id_sharing_operation: OP2, id_key: 1, start_date: today });
  });

  it("creating an operation records operation.created", async () => {
    const response = await call("post", "/sharing_operations/", { name: "Outbox Op", type: SharingOperationType.CER });
    await expectWithLog(response, () => expect(response.status).toBe(200));

    const rows = await outbox();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id_community: 1, event_type: CORE_EVENTS.OPERATION_CREATED });
    expect(rows[0].payload).toMatchObject({ name: "Outbox Op" });
  });
});
