import type { EntityManager } from "typeorm";

/**
 * Rows per UPDATE / INSERT statement when an import is written. The values
 * travel as one array parameter per column (`unnest`), so this bounds the
 * statement size, not the bind-parameter count.
 */
export const CONSUMPTION_WRITE_CHUNK_SIZE = 5000;

/**
 * First key of the advisory lock below; the second is the community id. Any
 * constant that no other advisory lock in crm_db uses would do ("cons").
 */
const CONSUMPTION_IMPORT_LOCK_NAMESPACE = 0x636f6e73;

/**
 * Serialise consumption imports within one community, until the end of the
 * current transaction.
 *
 * `meter_consumption` and `sharing_op_consumption` have no unique constraint on
 * their natural keys, so an upsert is "look up what exists, update it, insert
 * the rest". Two overlapping imports would both see nothing and both insert,
 * and a duplicated reading is not harmless: billing refuses a period that holds
 * one. Overlap is exactly what a gateway timeout invites (the import carries on
 * server-side while the user uploads the file again), so the lookup and the
 * writes run under this lock. The second import waits, then sees the first
 * one's rows and updates them.
 *
 * Per community, because that is the whole conflict domain: an operation
 * imports only the EANs of meters in its own community.
 *
 * Only meaningful inside a transaction: outside one, Postgres releases an
 * `_xact_` lock at the end of the statement that took it.
 */
export async function lockConsumptionImport(manager: EntityManager, internal_community_id: number): Promise<void> {
  await manager.query("SELECT pg_advisory_xact_lock($1::int, $2::int)", [CONSUMPTION_IMPORT_LOCK_NAMESPACE, internal_community_id]);
}

/**
 * Earliest and latest instant of an import, as ISO strings, so the lookup of
 * already-stored rows can be bounded to the file's time window. A loop rather
 * than `Math.min(...times)`: spreading a year of readings overflows the call stack.
 */
export function timeWindow(times: number[]): [string, string] {
  let min = Infinity;
  let max = -Infinity;
  for (const time of times) {
    if (time < min) min = time;
    if (time > max) max = time;
  }
  return [new Date(min).toISOString(), new Date(max).toISOString()];
}

export interface ConsumptionReadings {
  gross?: number | null;
  net?: number | null;
  shared?: number | null;
  inj_gross?: number | null;
  inj_net?: number | null;
  inj_shared?: number | null;
}

/**
 * The six reading columns as one array per column, in the order every
 * consumption UPDATE / INSERT lists them: gross, net, shared, inj_gross,
 * inj_net, inj_shared.
 */
export function readingColumns(rows: ConsumptionReadings[]): (number | null)[][] {
  return [
    rows.map((row) => row.gross ?? null),
    rows.map((row) => row.net ?? null),
    rows.map((row) => row.shared ?? null),
    rows.map((row) => row.inj_gross ?? null),
    rows.map((row) => row.inj_net ?? null),
    rows.map((row) => row.inj_shared ?? null),
  ];
}
