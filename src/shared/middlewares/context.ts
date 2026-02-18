// context.js
import { AsyncLocalStorage } from "node:async_hooks";
import type { Request, Response, NextFunction } from "express";
import { Role, ROLE_HIERARCHY } from "../dtos/role.js";
interface Context {
  user_id?: string;
  community_id?: string;
  role?: Role;
  source_ip?: string;
}

interface OrgToken {
  orgId: string;
  orgPath: string;
  role: Role;
}

const requestContext = new AsyncLocalStorage<Context>();

function parseUserOrgs(user_orgs: string) {
  // Example:[orgId:2c8a0ea5-d597-49d6-ae12-4dceb9e9a018 orgPath:/aaaa roles:[ADMIN]],map[orgId:a221664e-866e-46f6-9f7b-1087447c579e orgPath:/bbbb roles:[ADMIN]],map[orgId:585cded0-219e-43ff-8bee-774ddca28d7a orgPath:/cccc roles:[ADMIN]]
  const matches = user_orgs.match(/(?<=\[)[^\]]+]/gm);
  const orgToken: OrgToken[] = [];
  if (matches && matches.length > 0) {
    for (const match of matches) {
      const splitted = match.split(" ");
      let roles = splitted[2].split(":")[1];
      // Parse role that contain an array
      roles = roles.substring(1, roles.length - 1);
      const roleList = roles.split(",");
      const higherRole = resolveHighestRole(roleList);
      orgToken.push({
        orgId: splitted[0].split(":")[1],
        orgPath: splitted[1].split(":")[1],
        role: higherRole!,
      });
    }
  }
  return orgToken;
}

/**
 * Middleware that extracts context information from request headers.
 * Populates AsyncLocalStorage with user_id, community_id, role, and source_ip.
 */
export function contextMiddleware() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const extractHeader = (key: string): string | undefined => {
      const header = req.headers[key];
      const returnedHeader = Array.isArray(header) ? header[0] : header;
      if (returnedHeader) {
        if (returnedHeader.length > 0) {
          return returnedHeader;
        }
      }
    };
    const userId = extractHeader("x-user-id");
    let targetCommunityId = extractHeader("x-community-id");
    const userGroupsHeader = extractHeader("x-user-orgs");
    const sourceIp = extractHeader("x-source-ip");
    let groups: OrgToken[] = [];
    let effectiveRole: Role | undefined = undefined;
    if (targetCommunityId && userGroupsHeader) {
      groups = parseUserOrgs(userGroupsHeader);
      // Find group
      const finded = groups.find((x) => x.orgId === targetCommunityId);
      if (finded) {
        effectiveRole = finded.role;
      }
    } else {
      targetCommunityId = undefined;
    }

    const store: Context = {
      user_id: userId,
      community_id: targetCommunityId,
      role: effectiveRole,
      source_ip: sourceIp,
    };

    requestContext.run(store, () => {
      next();
    });
  };
}
function resolveHighestRole(roles: string[] = []): Role | undefined {
  if (!roles || roles.length === 0) return undefined;

  let highestRole: Role | undefined = undefined;
  let maxHierarchy = -1;

  for (const r of roles) {
    // Ensure the string from Keycloak matches our Enum
    if (Object.values(Role).includes(r as Role)) {
      const currentRole = r as Role;
      const currentHierarchy = ROLE_HIERARCHY[currentRole] || 0;

      if (currentHierarchy > maxHierarchy) {
        maxHierarchy = currentHierarchy;
        highestRole = currentRole;
      }
    }
  }
  return highestRole;
}
// Utilitaire pour récupérer le contexte complet
/**
 * Retrieves the current request context from AsyncLocalStorage.
 * @returns Context object containing user_id, community_id, role, etc.
 */
export function getContext(): Context {
  const store = requestContext.getStore();
  return store || { user_id: undefined, community_id: undefined, role: undefined };
}
