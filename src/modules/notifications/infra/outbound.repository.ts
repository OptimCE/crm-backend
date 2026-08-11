import { inject, injectable } from "inversify";
import type { QueryRunner } from "typeorm";
import type { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity.js";

import { AppDataSource } from "../../../shared/database/database.connector.js";
import { User } from "../../users/domain/user.models.js";
import { OutboundMessage } from "../domain/notification.models.js";
import type { IOutboundRepository, OutboundRowInput, RecipientContact } from "../domain/i-outbound.repository.js";

/** Matches the notification fan-out chunking. */
const INSERT_CHUNK_SIZE = 1000;

@injectable()
export class OutboundRepository implements IOutboundRepository {
  constructor(@inject("AppDataSource") private readonly dataSource: typeof AppDataSource) {}

  async findRecipientContacts(user_ids: number[], query_runner?: QueryRunner): Promise<RecipientContact[]> {
    if (user_ids.length === 0) {
      return [];
    }
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    return manager
      .createQueryBuilder(User, "app_user")
      .select("app_user.id", "id_user")
      .addSelect("app_user.email", "email")
      .addSelect("app_user.locale", "locale")
      .addSelect("app_user.firstName", "first_name")
      .addSelect("app_user.lastName", "last_name")
      .where("app_user.id IN (:...user_ids)", { user_ids })
      .getRawMany<RecipientContact>();
  }

  async insertMany(rows: OutboundRowInput[], query_runner?: QueryRunner): Promise<number> {
    if (rows.length === 0) {
      return 0;
    }
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    let inserted = 0;
    for (let offset = 0; offset < rows.length; offset += INSERT_CHUNK_SIZE) {
      const chunk = rows.slice(offset, offset + INSERT_CHUNK_SIZE);
      const result = await manager
        .createQueryBuilder()
        .insert()
        .into(OutboundMessage)
        // `QueryDeepPartialEntity` maps an index-signature column onto a
        // deep-partial of itself, which no concrete `Record<string, unknown>`
        // satisfies. The cast is confined to the jsonb column and changes
        // nothing at runtime — TypeORM serialises the object as-is.
        .values(chunk as unknown as QueryDeepPartialEntity<OutboundMessage>[])
        // Targeted on purpose. `.orIgnore("...")` accepts its argument and then
        // DISCARDS it, emitting a bare `ON CONFLICT DO NOTHING` that would
        // swallow a violation of any future unique index on this table. This
        // overload is the only one in TypeORM 0.3 that names the constraint.
        .onConflict('("dedupe_key") DO NOTHING')
        .execute();
      inserted += result.identifiers.filter((identifier) => identifier !== undefined).length;
    }
    return inserted;
  }
}
