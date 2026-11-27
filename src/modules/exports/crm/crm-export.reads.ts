import type { DataSource } from "typeorm";
import { iso } from "./crm-export.mappers.js";

/**
 * The reads the `crm` part needs and the API does not have. Everything else replays the API's
 * own repositories under the requester's context; these four have no screen to copy, so they are
 * written here, each narrowed to the requester's own rows:
 *
 *  - email-messages: outbound_message has no reader (notification-dispatch sends it). The user's
 *    rows are the ones linked to their notifications, or addressed to their current email.
 *    Type, channel, status and dates only: no body, no data.
 *  - email-suppression: only notification-dispatch reads it; the row for the user's address.
 *  - user activity log: AuditLogRepository always filters on the active community, so it cannot
 *    give a user's own actions across communities, nor those logged outside any community.
 *  - regulatory status: RegulatoryRepository answers nothing while the administrative module is
 *    off, but the export includes what a disabled module still stores (contract §8).
 *
 * Paged by id (keyset), so no read holds a whole table.
 */
export class CrmExportReads {
  constructor(
    private readonly dataSource: DataSource,
    private readonly pageSize = 1000,
  ) {}

  async *emailMessages(id_user: number, email: string): AsyncGenerator<Record<string, unknown>> {
    yield* this.keyset(
      `SELECT o.id, o.type, o.channel, o.category, o.status, o.locale, o.id_community, o.created_at, o.sent_at
         FROM outbound_message o
        WHERE (o.id_notification IN (SELECT n.id FROM notification n WHERE n.id_user = $1) OR lower(o.recipient) = lower($2))
          AND o.id > $3
        ORDER BY o.id LIMIT $4`,
      [id_user, email],
      (r) => ({
        id: String(r.id),
        type: r.type,
        channel: r.channel,
        category: r.category,
        status: r.status,
        locale: r.locale === "" ? null : r.locale,
        community_id: r.id_community,
        created_at: iso(r.created_at as Date),
        sent_at: iso(r.sent_at as Date | null),
      }),
    );
  }

  async emailSuppression(email: string): Promise<Record<string, unknown>[]> {
    const rows: { email: string; reason: number; detail: string | null; created_at: Date }[] = await this.dataSource.query(
      `SELECT email, reason, detail, created_at FROM email_suppression WHERE lower(email) = lower($1)`,
      [email],
    );
    return rows.map((r) => ({ email: r.email, reason: r.reason, detail: r.detail, created_at: iso(r.created_at) }));
  }

  /** The user's own actions, in every community and outside any, oldest first. */
  async *userActivity(id_user: number): AsyncGenerator<Record<string, unknown>> {
    yield* this.keyset(
      `SELECT a.id, a.timestamp, a.action, a.source, a.entity_type, a.entity_id, a.id_community, a.user_id, a.user_email, a.payload
         FROM audit_log a WHERE a.user_id = $1 AND a.id > $2 ORDER BY a.id LIMIT $3`,
      [id_user],
      activityItem,
    );
  }

  /** Every regulatory episode of the community, whatever the state of the module that wrote it. */
  async *regulatoryStatus(id_community: number): AsyncGenerator<Record<string, unknown>> {
    yield* this.keyset(
      `SELECT r.id, r.id_sharing_operation, r.subject_type, r.subject_ref, r.id_dossier_origin, r.regulatory_status,
              to_char(r.valid_from, 'YYYY-MM-DD') AS valid_from, to_char(r.valid_to, 'YYYY-MM-DD') AS valid_to,
              r.regulatory_ref, r.created_at, r.updated_at
         FROM regulatory_link_status r WHERE r.id_community = $1 AND r.id > $2 ORDER BY r.id LIMIT $3`,
      [id_community],
      (r) => ({
        id: String(r.id),
        sharing_operation_id: r.id_sharing_operation,
        subject_type: r.subject_type,
        subject_ref: r.subject_ref,
        dossier_id: String(r.id_dossier_origin),
        regulatory_status: r.regulatory_status,
        valid_from: r.valid_from,
        valid_to: r.valid_to,
        regulatory_ref: r.regulatory_ref,
        created_at: iso(r.created_at as Date),
        updated_at: iso(r.updated_at as Date),
      }),
    );
  }

  /** `sql` takes `params`, then the last id seen and the page size as its two last parameters. */
  private async *keyset(
    sql: string,
    params: unknown[],
    map: (row: Record<string, unknown>) => Record<string, unknown>,
  ): AsyncGenerator<Record<string, unknown>> {
    let after = "0";
    for (;;) {
      const rows: Record<string, unknown>[] = await this.dataSource.query(sql, [...params, after, this.pageSize]);
      for (const row of rows) yield map(row);
      if (rows.length < this.pageSize) return;
      after = String(rows[rows.length - 1].id);
    }
  }
}

/** One audit entry, as the activity log shows it. */
export function activityItem(r: Record<string, unknown>): Record<string, unknown> {
  return {
    id: String(r.id),
    timestamp: iso(r.timestamp as Date),
    action: r.action,
    source: r.source,
    entity_type: r.entity_type,
    entity_id: r.entity_id ?? null,
    community_id: r.id_community ?? null,
    user_id: r.user_id ?? null,
    user_email: r.user_email ?? null,
    payload: r.payload ?? {},
  };
}
