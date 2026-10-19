import { describe, expect, it } from "@jest/globals";
import { selectOperationKeys, toSharingOperation } from "../../../src/modules/sharing_operations/shared/to_dto.js";
import type { SharingOperation, SharingOperationKey } from "../../../src/modules/sharing_operations/domain/sharing_operation.models.js";
import { SharingKeyStatus } from "../../../src/modules/sharing_operations/shared/sharing_operation.types.js";
import { mockSharingOperationEntity } from "./sharing_op.const.js";

const TODAY = "2026-08-21";
const YESTERDAY = "2026-08-20";
const TOMORROW = "2026-08-22";

const { APPROVED, PENDING, REJECTED } = SharingKeyStatus;

/** The selection reads only id, status and the two dates. */
const row = (id: number, status: SharingKeyStatus, start_date: string, end_date: string | null = null): SharingOperationKey =>
  ({ id, status, start_date, end_date, allocation_key: { id: 100 + id, name: `Key ${id}` } }) as unknown as SharingOperationKey;

const select = (keys: SharingOperationKey[]): { current?: number; waiting?: number } => {
  const { current, waiting } = selectOperationKeys(keys, TODAY);
  return { current: current?.id, waiting: waiting?.id };
};

describe("(Unit) selectOperationKeys", () => {
  it("after a propose -> approve, the closed PENDING row is not waiting and the new APPROVED row is current", () => {
    // What patchKeyStatus leaves behind: the old key closed, the proposal closed (status untouched), a new row.
    const keys = [row(1, APPROVED, "2024-01-01", YESTERDAY), row(2, PENDING, "2026-08-10", YESTERDAY), row(3, APPROVED, TODAY)];

    expect(select(keys)).toEqual({ current: 3, waiting: undefined });
  });

  it("reports an open PENDING row as waiting, next to the key in force", () => {
    expect(select([row(1, APPROVED, "2024-01-01"), row(2, PENDING, "2026-08-10")])).toEqual({ current: 1, waiting: 2 });
  });

  it("never reports a REJECTED row, open or closed", () => {
    expect(select([row(1, REJECTED, "2026-08-10", YESTERDAY), row(2, REJECTED, "2026-08-10")])).toEqual({});
  });

  it("an APPROVED row starting TODAY is current", () => {
    expect(select([row(1, APPROVED, TODAY)]).current).toBe(1);
  });

  it("an APPROVED row whose end_date IS today is still current (inclusive upper bound)", () => {
    expect(select([row(1, APPROVED, "2024-01-01", TODAY)]).current).toBe(1);
  });

  it("an APPROVED row that ended yesterday is not current, even when it is the only one", () => {
    expect(select([row(1, APPROVED, "2024-01-01", YESTERDAY)]).current).toBeUndefined();
  });

  it("an APPROVED row starting tomorrow is not current yet; the key it replaces is", () => {
    const keys = [row(1, APPROVED, "2024-01-01", TODAY), row(2, PENDING, "2026-08-10", TODAY), row(3, APPROVED, TOMORROW)];

    expect(select(keys)).toEqual({ current: 1, waiting: undefined });
  });

  it("does not depend on the order the rows arrive in", () => {
    const keys = [row(1, APPROVED, "2024-01-01", YESTERDAY), row(2, APPROVED, TODAY), row(3, PENDING, "2026-08-15"), row(4, PENDING, "2026-08-18")];

    expect(select(keys)).toEqual({ current: 2, waiting: 4 });
    expect(select([...keys].reverse())).toEqual({ current: 2, waiting: 4 });
  });

  it("breaks a same-day tie by the highest id", () => {
    expect(select([row(7, APPROVED, TODAY), row(9, APPROVED, TODAY), row(8, APPROVED, TODAY)]).current).toBe(9);
    expect(select([row(5, PENDING, TODAY), row(4, PENDING, TODAY)]).waiting).toBe(5);
  });
});

describe("(Unit) toSharingOperation key fields", () => {
  it("maps the selected rows and omits the fields when nothing qualifies", () => {
    const operation = {
      ...mockSharingOperationEntity,
      keys: [row(1, APPROVED, "2024-01-01", YESTERDAY), row(2, PENDING, "2026-08-10", YESTERDAY), row(3, APPROVED, TODAY)],
    } as SharingOperation;

    const dto = toSharingOperation(operation, TODAY);
    expect(dto.key?.id).toBe(3);
    expect(dto.key?.key.id).toBe(103);
    expect(dto.key_waiting_approval).toBeUndefined();

    const json = JSON.parse(JSON.stringify(toSharingOperation({ ...mockSharingOperationEntity, keys: [] } as SharingOperation, TODAY)));
    expect(json).not.toHaveProperty("key");
    expect(json).not.toHaveProperty("key_waiting_approval");
  });
});
