export const AUTH_COMMUNITY_1 = "2c8a0ea5-d597-49d6-ae12-4dceb9e9a018";

export const ORGS_ADMIN = `[orgId:${AUTH_COMMUNITY_1} orgPath:/org1 roles:[ADMIN]],map[orgId:100 orgPath:/org100 roles:[ADMIN]]`;
export const ORGS_GESTIONNAIRE = `[orgId:${AUTH_COMMUNITY_1} orgPath:/org1 roles:[MANAGER]],map[orgId:100 orgPath:/org100 roles:[MANAGER]]`;
export const ORGS_MEMBER = `[orgId:${AUTH_COMMUNITY_1} orgPath:/org1 roles:[MEMBER]],map[orgId:100 orgPath:/org100 roles:[MEMBER]]`;
export type HttpMethod = "get" | "post" | "put" | "patch" | "delete" | "head" | "options";

export interface TestHookOverrides {
  beforeEach?: () => Promise<void>;
  afterEach?: () => Promise<void>;
}
