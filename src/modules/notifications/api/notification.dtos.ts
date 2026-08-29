import { Expose, Type } from "class-transformer";
import { IsArray, IsEnum, IsInt, IsOptional, IsString, ValidateNested } from "class-validator";
import { PaginationQuery } from "../../../shared/dtos/query.dtos.js";
import { GLOBAL_ERRORS } from "../../../shared/errors/errors.js";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";
import type { Role } from "../../../shared/dtos/role.js";
import type { NotificationTypeKey } from "../domain/notification.taxonomy.js";
// Value import, not `import type`: `IsEnum` needs the runtime enum objects.
import { NotificationChannel, PreferenceMode } from "../shared/notification.types.js";
import { NOTIFICATION_ERRORS } from "../shared/notification.errors.js";
import type { NotificationCategory } from "../shared/notification.types.js";

/**
 * Recipient targeting for {@link NotificationPublishInput}. Ids are INTERNAL
 * database ids (callers resolve auth → internal via AuthContextRepository if
 * needed). Publishing fans out to one notification row per resolved user.
 *
 *  - `user`      → a single user, optionally tagged with a source community.
 *  - `users`     → an explicit set of users (de-duplicated), optionally tagged
 *                  with a source community.
 *  - `community` → every member of the community, optionally narrowed to the
 *                  given community roles (e.g. [Role.GESTIONNAIRE, Role.ADMIN]).
 */
export type NotificationTarget =
  | { kind: "user"; userId: number; communityId?: number }
  | { kind: "users"; userIds: number[]; communityId?: number }
  | { kind: "community"; communityId: number; roles?: Role[] };

/**
 * Internal contract used by backend callers of `NotificationService.publish()`.
 * Not validated via class-validator — this is a code-level interface, not a
 * request body (there is no public publish endpoint).
 *
 * This is the producer-facing signature from IMPLEMENTATION_PLAN §1.3, and it is
 * the shape that survives Phase 2's extraction into a standalone service. The
 * Python annexes speak the same contract via `core/notifications/contract.py`.
 */
export interface NotificationPublishInput {
  /** `<feature>.<event>` taxonomy key. See {@link NOTIFICATION_TYPES}. */
  type: NotificationTypeKey;
  data?: Record<string, unknown>;
  target: NotificationTarget;
  /**
   * The producer's statement of KIND, which decides opt-out policy. Required on
   * purpose: there is no safe default. TRANSACTIONAL would silently make
   * everything unsuppressable; INFORMATIONAL would silently make invitations
   * opt-out-able.
   */
  category: NotificationCategory;
  /**
   * The channels the producer REQUESTS, not the ones it gets. Effective delivery
   * is this set intersected with each recipient's preference, except for
   * TRANSACTIONAL which overrides preference. Required so a producer can never
   * silently lose its email intent to a default.
   */
  channels: NotificationChannel[];
  /**
   * Overrides the derived idempotency key for the queued email.
   *
   * By default the key is `<channel>:<type>:u<id_user>:<hash of data>`, so
   * `data` decides — for all time — whether two publishes are the same message.
   * That is right for anything driven by a status transition, which is every
   * producer today. Set this ONLY when a recurring sweep can re-emit the same
   * payload for a genuinely new occurrence, and include the occurrence date:
   * `admin_deadline.due_soon:{deadline_id}:{as_of}`.
   */
  dedupe_key?: string;
}

/**
 * Optional community filter shared by the read endpoints. `community_id` is the
 * INTERNAL community id (matches `NotificationDTO.community.id`). Recipient scope
 * (current user) is always applied from request context — never via this DTO.
 */
export class NotificationFilterDTO {
  @Type(() => Number)
  @IsInt(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsOptional()
  community_id?: number;
}

/**
 * Query parameters for listing notifications: pagination + the optional
 * community filter.
 */
export class NotificationQueryDTO extends PaginationQuery {
  @Type(() => Number)
  @IsInt(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsOptional()
  community_id?: number;
}

/** Source community of a notification, surfaced for display. */
export class NotificationCommunityDTO {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  /**
   * The Keycloak org id, i.e. what `X-Community-ID` carries.
   *
   * Notifications are cross-community by design, so the client has to decide
   * whether a row belongs to the community the user is currently in before
   * following its link. `id` is the internal integer and the frontend only ever
   * holds the org id, and it has no synchronous way to map between them — so
   * without this field "is this my active community?" is unanswerable and a
   * notification from community B opens community A's page.
   *
   * Free to add: the repository already `leftJoinAndSelect`s the whole Community
   * entity, so this needs no query change.
   */
  @Expose()
  auth_community_id!: string;
}

/**
 * Output shape returned by the list endpoint.
 * `id` stays a string to avoid silent precision loss on bigint PKs.
 */
export class NotificationDTO {
  @Expose()
  id!: string;

  /** Source community (id + name), or null for user-only notifications. */
  @Expose()
  @Type(() => NotificationCommunityDTO)
  community!: NotificationCommunityDTO | null;

  @Expose()
  type!: string;

  @Expose()
  data!: Record<string, unknown>;

  @Expose()
  read_at!: Date | null;

  @Expose()
  created_at!: Date;
}

/**
 * Output shape for the unread-count endpoint. Kept tiny — this is polled for a
 * badge.
 */
export class UnreadCountDTO {
  @Expose()
  count!: number;
}

/**
 * One stored preference. `type_prefix` is `''` (the default that applies to
 * every type) or a value from `NOTIFICATION_TYPE_PREFIXES`.
 */
export class NotificationPreferenceDTO {
  @Expose()
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  type_prefix!: string;

  @Expose()
  @Type(() => Number)
  @IsEnum(NotificationChannel, withError(NOTIFICATION_ERRORS.PREFERENCE_INVALID))
  channel!: NotificationChannel;

  /**
   * `PreferenceMode` — IMMEDIATE (1) or OFF (3). `2 DAILY_DIGEST` is rejected:
   * the encoding reserves it but no digest runner exists, and accepting a value
   * that silently behaves as IMMEDIATE is worse than refusing it.
   */
  @Expose()
  @Type(() => Number)
  @IsEnum(PreferenceMode, withError(NOTIFICATION_ERRORS.PREFERENCE_INVALID))
  mode!: PreferenceMode;
}

/**
 * Request body for replacing the current user's preferences wholesale. Rows
 * absent from `preferences` are deleted, which is how a reset to default is
 * expressed.
 */
export class NotificationPreferenceUpdateDTO {
  @Type(() => NotificationPreferenceDTO)
  @ValidateNested({ each: true })
  @IsArray(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.ARRAY))
  preferences!: NotificationPreferenceDTO[];
}

/**
 * Output of the preferences endpoint.
 *
 * `type_prefixes` is served by the backend so the client never hardcodes a list
 * that could drift from the taxonomy. It excludes `''`, which the UI presents
 * separately as the catch-all default.
 */
export class NotificationPreferencesDTO {
  @Expose()
  type_prefixes!: string[];

  @Expose()
  @Type(() => NotificationPreferenceDTO)
  preferences!: NotificationPreferenceDTO[];
}

/**
 * Response of `POST /notifications/realtime/ticket`.
 *
 * `ticket` is opaque to the client: 256 bits of base64url that only exists as a
 * Redis key. Everything the SSE leg needs — the internal user id and the exact
 * list of channels this connection may subscribe to — is stored SERVER-SIDE
 * against that key, deliberately. A self-describing token would put internal
 * community ids and role tiers into the client's hands and would widen forgery
 * from "steal a live ticket" to "obtain the signing key".
 *
 * Single-use and short-lived: the stream endpoint redeems it with GETDEL, so the
 * client must mint a fresh one on every (re)connect.
 */
export class RealtimeTicketDTO {
  @Expose()
  ticket!: string;

  /** Seconds until the ticket expires unused. */
  @Expose()
  expires_in!: number;
}
