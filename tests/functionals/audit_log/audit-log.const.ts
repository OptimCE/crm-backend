import { AUTH_COMMUNITY_1, ORGS_ADMIN, ORGS_GESTIONNAIRE, ORGS_MEMBER } from "../../utils/shared.consts.js";

export { AUTH_COMMUNITY_1, ORGS_ADMIN, ORGS_GESTIONNAIRE, ORGS_MEMBER };

export const AUTH_COMMUNITY_2 = "2";
export const ORGS_ADMIN_COMMUNITY_2 = `[orgId:${AUTH_COMMUNITY_2} orgPath:/org2 roles:[ADMIN]]`;

// Internal community IDs seeded by tests/sql/init.sql.
// Community auth ID 2c8a0ea5-... → internal id 1; auth ID "2" → internal id 2.
export const INTERNAL_COMMUNITY_1 = 1;
export const INTERNAL_COMMUNITY_2 = 2;

// app_user ids and emails seeded by tests/sql/init.sql.
export const ADMIN_USER_ID = 2;
export const ADMIN_USER_EMAIL = "admin@test.com";
