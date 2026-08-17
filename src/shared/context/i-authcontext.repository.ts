import type { QueryRunner } from "typeorm";

export interface IAuthContextRepository {
  getInternalCommunityId(query_runner?: QueryRunner): Promise<number>;
  getInternalUserId(query_runner?: QueryRunner): Promise<number>;
  /**
   * Bulk-resolve Keycloak org ids to internal community ids.
   *
   * Deliberately NOT a loop over `getInternalCommunityId()`: that one reads only
   * the ACTIVE community from the context and throws 404 on a miss, whereas this
   * takes an explicit list and simply omits anything with no matching row — an
   * org claimed in a JWT but absent from the database must be skipped, not
   * fatal. Used by the realtime ticket mint to expand `x-user-orgs` into the
   * exact set of channels a connection may subscribe to.
   */
  getInternalCommunityIds(auth_community_ids: string[], query_runner?: QueryRunner): Promise<Map<string, number>>;
}
