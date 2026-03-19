import type { ObjectLiteral, SelectQueryBuilder } from "typeorm";
import { getContext } from "../middlewares/context.js";

/**
 * Automatically applies the community filter based on the current request context.
 * @param qb The QueryBuilder instance
 * @param alias The alias of the main entity in the query (e.g., "key")
 */
export function withUserScope<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, alias: string): SelectQueryBuilder<T> {
  const { user_id } = getContext(); // This is the Auth0/Keycloak String ID

  if (user_id) {
    qb.innerJoin(`${alias}.user`, "scope_user").andWhere("scope_user.auth_user_id = :contextAuthId", {
      contextAuthId: user_id,
    });
  } else {
    // Security Fallback: No ID in context = No results
    qb.andWhere("1=0");
  }

  return qb;
}
