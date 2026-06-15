import { Expose, Type } from "class-transformer";
import { IsInt, IsOptional } from "class-validator";
import { PaginationQuery } from "../../../shared/dtos/query.dtos.js";
import { GLOBAL_ERRORS } from "../../../shared/errors/errors.js";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";
import type { Role } from "../../../shared/dtos/role.js";

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
 */
export interface NotificationPublishInput {
  type: string;
  data?: Record<string, unknown>;
  target: NotificationTarget;
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
