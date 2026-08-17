import { Role } from "../dtos/role.js";

/**
 * THE ONLY PLACE A REALTIME CHANNEL STRING IS BUILT.
 *
 * This is a security control, not a style rule. A producer that accidentally
 * publishes a per-user thing onto a community tier is a cross-tenant leak, and
 * `tier` below is a required argument with no default precisely so that mistake
 * cannot be made by omission. A test greps the repository for the literal
 * `notify:v1:` outside this module (and its Python twin, `core/realtime/
 * channels.py`) and fails on a hit.
 *
 * Grammar (fixed arity, so Redis 6 ACLs can later be granted per prefix without
 * a redesign):
 *
 *     notify:v1:u:{internal_app_user_id}
 *     notify:v1:c:{internal_community_id}:{MEMBER|MANAGER}
 *
 * Ids are the INTERNAL integer keys (`app_user.id`, `community.id`) — what every
 * Python producer already holds and what `notification.id_user` is. They are NOT
 * Keycloak subs or org uuids; the ticket mint resolves those once, at mint time.
 *
 * The community family exists so a worker with no user attribution at all (the
 * generation and simulation jobs carry only `id_community`) can still address
 * exactly the right audience with zero database lookups. Its safety comes from
 * the subscribe side: a connection is only ever subscribed to the tiers the
 * ticket mint proved the user holds, from KrakenD-verified claims.
 */
const PREFIX = "notify:v1";

/** Channel tiers. Deliberately coarser than `Role`: there is no ADMIN bucket. */
export enum Tier {
  /** Everyone in the community, managers included. */
  MEMBER = "MEMBER",
  /** ADMIN and MANAGER only. */
  MANAGER = "MANAGER",
}

/** The pattern the hub PSUBSCRIBEs. Matches every channel this module can build. */
export const CHANNEL_PATTERN = `${PREFIX}:*`;

/** Channel for one user, in every community and outside all of them. */
export function userChannel(internal_user_id: number): string {
  return `${PREFIX}:u:${internal_user_id}`;
}

/** Channel for one tier of one community. */
export function communityChannel(internal_community_id: number, tier: Tier): string {
  return `${PREFIX}:c:${internal_community_id}:${tier}`;
}

/**
 * The tiers a role grants inside its own community.
 *
 * MANAGER is a superset of MEMBER, so a manager subscribes to both — a producer
 * addressing "everyone in the community" publishes once, to the MEMBER tier, and
 * still reaches managers.
 */
export function tiersForRole(role: Role): Tier[] {
  return role === Role.ADMIN || role === Role.GESTIONNAIRE ? [Tier.MEMBER, Tier.MANAGER] : [Tier.MEMBER];
}
