import type { QueryRunner } from "typeorm";
import type { CoreEventType, OutboxAggregateType } from "./core-events.js";

export interface OutboxEventInput {
  id_community: number;
  aggregate_type: OutboxAggregateType;
  aggregate_id: string | number;
  event_type: CoreEventType;
  payload: Record<string, unknown>;
}

export interface IOutboxWriter {
  /**
   * Appends an event to the outbox on the caller's transaction. Refuses to run
   * without one: an event written outside the change it describes is either
   * published for a change that rolled back, or lost for one that committed.
   * Unlike the audit log, a failure is NOT swallowed — it fails the change.
   */
  append(event: OutboxEventInput, query_runner: QueryRunner | undefined): Promise<void>;
}
