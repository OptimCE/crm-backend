import { randomUUID } from "node:crypto";
import { injectable } from "inversify";
import type { QueryRunner } from "typeorm";
import type { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity.js";
import { OutboxEvent } from "./outbox-event.model.js";
import type { IOutboxWriter, OutboxEventInput } from "./i-outbox.writer.js";

@injectable()
export class OutboxWriter implements IOutboxWriter {
  async append(event: OutboxEventInput, query_runner: QueryRunner | undefined): Promise<void> {
    if (!query_runner?.isTransactionActive) {
      throw new Error(`Outbox event ${event.event_type} must be written inside the transaction of the change it describes`);
    }
    await query_runner.manager
      .createQueryBuilder()
      .insert()
      .into(OutboxEvent)
      .values({
        event_id: randomUUID(),
        id_community: event.id_community,
        aggregate_type: event.aggregate_type,
        aggregate_id: String(event.aggregate_id),
        event_type: event.event_type,
        // The jsonb column is typed as a deep-partial of itself, which no
        // concrete record satisfies; TypeORM serialises the object as-is.
        payload: event.payload as unknown as QueryDeepPartialEntity<OutboxEvent>["payload"],
      })
      .execute();
  }
}
