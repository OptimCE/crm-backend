import {ObjectLiteral, SelectQueryBuilder} from "typeorm";
import {getContext} from "../middlewares/context.js";

/**
 * Automatically applies the community filter based on the current request context.
 * @param qb The QueryBuilder instance
 * @param alias The alias of the main entity in the query (e.g., "key")
 */
export function withCommunityScope<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    alias: string
): SelectQueryBuilder<T> {
    const { community_id } = getContext(); // This is the Auth0/Keycloak String ID

    if (community_id) {
        // We must JOIN the community table to check the auth_community_id
        // We use innerJoin because an AllocationKey MUST belong to a community
        // preventing "orphan" data from showing up.
        qb.innerJoin(`${alias}.community`, 'scope_community')
            .andWhere('scope_community.auth_community_id = :contextAuthId', {
                contextAuthId: community_id
            });
    } else {
        // Security Fallback: No ID in context = No results
        qb.andWhere("1=0");
    }

    return qb;
}