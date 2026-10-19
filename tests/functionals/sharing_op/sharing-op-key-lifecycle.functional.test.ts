import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { AUTH_COMMUNITY_1, ORGS_GESTIONNAIRE } from "../../utils/shared.consts.js";
import { SharingKeyStatus } from "../../../src/modules/sharing_operations/shared/sharing_operation.types.js";
import { addDaysISO, appTodayISO } from "../../../src/shared/utils/date.utils.js";
import { existingKeyId1, existingKeyId2, existingSharingOpId2 } from "./sharing_op.const.js";

// Seeded: Op 2 has run Key 2 (APPROVED, open-ended) since 2024-01-01. Key 1 belongs to the same
// community, so it can be proposed on Op 2.
const OP = existingSharingOpId2;
const RUNNING_KEY = existingKeyId2;
const PROPOSED_KEY = existingKeyId1;

interface OperationKey {
  id: number;
  key: { id: number };
  start_date: string;
  end_date?: string;
  status: SharingKeyStatus;
}

interface OperationDetail {
  key?: OperationKey;
  key_waiting_approval?: OperationKey;
}

async function call(method: "get" | "post" | "patch", path: string, body?: object): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  const agent = request(appModule.default);
  const req = agent[method](path).set("x-user-id", "auth0|admin").set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", ORGS_GESTIONNAIRE);
  return body ? req.send(body) : req;
}

async function propose(id_key: number): Promise<void> {
  const response = await call("post", "/sharing_operations/key", { id_sharing: OP, id_key });
  await expectWithLog(response, () => expect(response.status).toBe(200));
}

async function decide(id_key: number, status: SharingKeyStatus, date: string): Promise<void> {
  const response = await call("patch", "/sharing_operations/key", { id_sharing: OP, id_key, status, date });
  await expectWithLog(response, () => expect(response.status).toBe(200));
}

async function detail(): Promise<OperationDetail> {
  const response = await call("get", `/sharing_operations/${OP}`);
  await expectWithLog(response, () => {
    expect(response.status).toBe(200);
    expect(response.body.error_code).toBe(SUCCESS);
  });
  return response.body.data as OperationDetail;
}

async function history(): Promise<OperationKey[]> {
  const response = await call("get", `/sharing_operations/${OP}/keys?page=1&limit=50`);
  await expectWithLog(response, () => expect(response.status).toBe(200));
  return response.body.data as OperationKey[];
}

/**
 * GET /sharing_operations/:id reports the key in force and the proposal awaiting a decision.
 *
 * Approving a proposal does not update its row: patchKeyStatus closes it (end_date set, status
 * still PENDING) and inserts a new APPROVED row. The detail mapper used to report every PENDING
 * row as waiting and the most recent APPROVED row as current, whatever their dates — so after a
 * plain propose -> approve the page kept offering Approve/Reject on a key it had already approved.
 */
describe("(Functional) Sharing operation key lifecycle, as seen by GET /sharing_operations/:id", () => {
  useFunctionalTestDb();

  it("reports a fresh proposal as waiting, next to the key still in force", async () => {
    await propose(PROPOSED_KEY);

    const op = await detail();
    expect(op.key?.key.id).toBe(RUNNING_KEY);
    expect(op.key_waiting_approval?.key.id).toBe(PROPOSED_KEY);
    expect(op.key_waiting_approval?.status).toBe(SharingKeyStatus.PENDING);
  });

  it("after approval effective today, reports the approved key as current and nothing as waiting", async () => {
    const today = appTodayISO();
    await propose(PROPOSED_KEY);
    await decide(PROPOSED_KEY, SharingKeyStatus.APPROVED, today);

    const op = await detail();
    expect(op.key?.key.id).toBe(PROPOSED_KEY);
    expect(op.key?.status).toBe(SharingKeyStatus.APPROVED);
    expect(op.key?.start_date.slice(0, 10)).toBe(today);
    expect(op.key_waiting_approval).toBeUndefined();
  });

  it("after approval effective in the future, keeps the running key current until the day before", async () => {
    const effective = addDaysISO(appTodayISO(), 30);
    await propose(PROPOSED_KEY);
    await decide(PROPOSED_KEY, SharingKeyStatus.APPROVED, effective);

    const op = await detail();
    // The running key now ends the day before the approved one takes over, so it is still in force.
    expect(op.key?.key.id).toBe(RUNNING_KEY);
    expect(op.key?.end_date?.slice(0, 10)).toBe(addDaysISO(effective, -1));
    // The proposal was decided: it is scheduled, not waiting.
    expect(op.key_waiting_approval).toBeUndefined();
  });

  it("after rejection, reports nothing as waiting and keeps the running key", async () => {
    await propose(PROPOSED_KEY);
    await decide(PROPOSED_KEY, SharingKeyStatus.REJECTED, appTodayISO());

    const op = await detail();
    expect(op.key?.key.id).toBe(RUNNING_KEY);
    expect(op.key_waiting_approval).toBeUndefined();
  });

  it("a reject sent after the approval (the stale proposal's Reject button) does not revoke the approved key", async () => {
    const today = appTodayISO();
    await propose(PROPOSED_KEY);
    await decide(PROPOSED_KEY, SharingKeyStatus.APPROVED, today);
    await decide(PROPOSED_KEY, SharingKeyStatus.REJECTED, today);

    const op = await detail();
    expect(op.key?.key.id).toBe(PROPOSED_KEY);
    expect(op.key?.status).toBe(SharingKeyStatus.APPROVED);
    expect(op.key_waiting_approval).toBeUndefined();
  });

  it("rejecting a re-proposal of the running key rejects only the proposal", async () => {
    await propose(RUNNING_KEY);
    await decide(RUNNING_KEY, SharingKeyStatus.REJECTED, appTodayISO());

    const op = await detail();
    expect(op.key?.key.id).toBe(RUNNING_KEY);
    expect(op.key?.status).toBe(SharingKeyStatus.APPROVED);
    expect(op.key_waiting_approval).toBeUndefined();

    const rows = await history();
    const approvedRows = rows.filter((row) => row.status === SharingKeyStatus.APPROVED);
    expect(approvedRows).toHaveLength(1);
    expect(approvedRows[0].end_date).toBeUndefined();
    expect(rows.filter((row) => row.status === SharingKeyStatus.REJECTED)).toHaveLength(1);
  });
});
