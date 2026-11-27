import type { DataSource } from "typeorm";
import { Role } from "../../../shared/dtos/role.js";
import { ExportPartError } from "../../../shared/export/kit/errors.js";
import type { ExportRequest } from "../../../shared/export/kit/contract.js";
import type { Context } from "../../../shared/middlewares/context.js";

/** Who asked, and for what, as the CRM knows it at the moment the part is written. */
export interface CrmExportScope {
  /** The requester's account. */
  user: { id: number; auth_user_id: string; email: string };
  /** The community, for a community export. */
  community: { id: number; auth_community_id: string; name: string } | null;
  /** The request context the API's reads run under. */
  context: Context;
}

/**
 * Re-reads the requester's rights in crm_db, at processing time rather than at request time
 * (contracts/export/README.md §8): a community export needs the requester to still be an ADMIN
 * of it, else the part fails `forbidden` and the whole export with it.
 *
 * Same rules as the Python kit's `resolve_requester` (contracts/export/python/core/export).
 */
export async function resolveCrmExportScope(dataSource: DataSource, request: ExportRequest): Promise<CrmExportScope> {
  const users: { id: number; auth_user_id: string; email: string }[] = await dataSource.query(
    `SELECT id, auth_user_id, email FROM app_user WHERE auth_user_id = $1`,
    [request.requester.userId],
  );
  const user = users[0];

  if (request.scope.type === "user") {
    if (request.scope.id !== request.requester.userId) throw new ExportPartError("forbidden", "a user export is for the requester only");
    if (!user) throw new ExportPartError("scope_not_found", "the user has no account");
    return { user, community: null, context: { user_id: user.auth_user_id } };
  }

  const communities: { id: number; auth_community_id: string; name: string }[] = await dataSource.query(
    `SELECT id, auth_community_id, name FROM community WHERE auth_community_id = $1`,
    [request.scope.id],
  );
  const community = communities[0];
  if (!community) throw new ExportPartError("scope_not_found", "no such community");
  if (!user) throw new ExportPartError("forbidden", "the requester has no account");
  const roles: { role: string }[] = await dataSource.query(`SELECT role FROM community_user WHERE id_community = $1 AND id_user = $2`, [
    community.id,
    user.id,
  ]);
  if (roles[0]?.role !== Role.ADMIN) throw new ExportPartError("forbidden", "the requester is not an ADMIN of the community");
  return {
    user,
    community,
    context: {
      user_id: user.auth_user_id,
      community_id: community.auth_community_id,
      role: Role.ADMIN,
      orgs: [{ orgId: community.auth_community_id, orgPath: `/${community.name}`, role: Role.ADMIN }],
    },
  };
}
