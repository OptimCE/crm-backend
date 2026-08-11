import { inject, injectable } from "inversify";
import type { QueryRunner } from "typeorm";

import logger from "../../../shared/monitor/logger.js";
import { withSavepoint } from "../../../shared/transactional/savepoint.js";
import { buildDedupeKey } from "../shared/notification.dedupe.js";
// Value import, not `import type`: a runtime enum, used as a value below.
import { NotificationChannel } from "../shared/notification.types.js";
import type { IOutboundRepository, OutboundRowInput, RecipientContact } from "../domain/i-outbound.repository.js";
import type { IOutboundService, OutboundDirectInput, OutboundRecipient } from "../domain/i-outbound.service.js";
import type { NotificationCategory } from "../shared/notification.types.js";

/** `outbound_message.recipient` is VARCHAR(320) — the RFC 5321 maximum. */
const MAX_ADDRESS_LENGTH = 320;
/** `outbound_message.recipient_name` is VARCHAR(255). */
const MAX_NAME_LENGTH = 255;

@injectable()
export class OutboundService implements IOutboundService {
  constructor(@inject("OutboundRepository") private readonly outbound_repository: IOutboundRepository) {}

  async enqueueForRecipients(
    input: {
      type: string;
      category: NotificationCategory;
      data: Record<string, unknown>;
      id_community: number | null;
      dedupe_key?: string;
    },
    recipients: OutboundRecipient[],
    query_runner?: QueryRunner,
  ): Promise<number> {
    if (recipients.length === 0) {
      return 0;
    }
    // No SAVEPOINT here: this is called from inside `publish`'s, which already
    // covers the notification rows and these together — they must land or vanish
    // as one. Opening a nested one would only widen the failure surface.
    const contacts = await this.outbound_repository.findRecipientContacts(
      recipients.map((recipient) => recipient.id_user),
      query_runner,
    );
    const byUser = new Map<number, RecipientContact>(contacts.map((contact) => [contact.id_user, contact]));

    const rows: OutboundRowInput[] = [];
    for (const recipient of recipients) {
      const contact = byUser.get(recipient.id_user);
      // A recipient with no app_user row cannot be emailed. Not an error: the
      // in-app notification (if any) still stands on its own.
      if (!contact) {
        continue;
      }
      const row = this.buildRow({
        id_notification: recipient.id_notification,
        id_community: input.id_community,
        recipient: contact.email,
        recipient_name: displayName(contact),
        locale: contact.locale,
        type: input.type,
        category: input.category,
        data: input.data,
        user_id: recipient.id_user,
        dedupe_key: input.dedupe_key,
      });
      if (row) {
        rows.push(row);
      }
    }
    return this.outbound_repository.insertMany(rows, query_runner);
  }

  async enqueueDirect(input: OutboundDirectInput, query_runner?: QueryRunner): Promise<number> {
    try {
      return await withSavepoint(query_runner, async () => {
        const row = this.buildRow({
          id_notification: null,
          id_community: input.id_community ?? null,
          recipient: input.recipient,
          recipient_name: null,
          locale: input.locale ?? null,
          type: input.type,
          category: input.category,
          data: input.data ?? {},
          user_id: null,
          dedupe_key: input.dedupe_key,
        });
        if (!row) {
          return 0;
        }
        return await this.outbound_repository.insertMany([row], query_runner);
      });
    } catch (err) {
      // Never raises, for the same reason `publish` never raises: an invitation
      // must not fail because its email could not be queued. The SAVEPOINT above
      // is what keeps the caller's transaction committable — swallowing alone
      // would not (a failed statement poisons the whole Postgres transaction).
      logger.error({ operation: "outbound:enqueueDirect", type: input.type, error: err }, "Outbound enqueue failed");
      return 0;
    }
  }

  /**
   * The single row builder. Returns null when the address is unusable.
   *
   * The CR/LF guard is a security control, not tidiness: `recipient` reaches an
   * SMTP envelope and a header, so an embedded newline from producer-controlled
   * data would split the header block and let a third party inject headers or
   * extra recipients. Reject at enqueue — the queue must never contain one.
   */
  private buildRow(params: {
    id_notification: string | null;
    id_community: number | null;
    recipient: string;
    recipient_name: string | null;
    locale: string | null;
    type: string;
    category: NotificationCategory;
    data: Record<string, unknown>;
    user_id: number | null;
    dedupe_key?: string;
  }): OutboundRowInput | null {
    const recipient = params.recipient.trim();
    if (recipient.length === 0 || recipient.length > MAX_ADDRESS_LENGTH || /[\r\n]/.test(recipient)) {
      logger.warn({ operation: "outbound:buildRow", type: params.type }, "Rejected an unusable outbound recipient address");
      return null;
    }
    return {
      id_notification: params.id_notification,
      id_community: params.id_community,
      channel: NotificationChannel.EMAIL,
      recipient,
      recipient_name: params.recipient_name?.slice(0, MAX_NAME_LENGTH) ?? null,
      // '' means "unknown" — the dispatcher owns the fallback chain, because it
      // is the only component that knows which locales it has templates for.
      locale: params.locale ?? "",
      type: params.type,
      category: params.category,
      data: params.data,
      dedupe_key: buildDedupeKey({
        channel: NotificationChannel.EMAIL,
        type: params.type,
        data: params.data,
        userId: params.user_id,
        recipient,
        override: params.dedupe_key,
      }),
    };
  }
}

function displayName(contact: RecipientContact): string | null {
  const name = [contact.first_name, contact.last_name].filter((part) => part && part.trim().length > 0).join(" ");
  return name.length > 0 ? name : null;
}
