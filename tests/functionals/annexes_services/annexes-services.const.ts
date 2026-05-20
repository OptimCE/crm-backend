import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { ANNEXES_SERVICES_ERRORS } from "../../../src/modules/annexes_services/shared/annexes-services.errors.js";
import { ORGS_ADMIN, ORGS_GESTIONNAIRE, ORGS_MEMBER, AUTH_COMMUNITY_1 } from "../../utils/shared.consts.js";

export { ORGS_ADMIN, ORGS_GESTIONNAIRE, ORGS_MEMBER, AUTH_COMMUNITY_1 };

export const AUTH_COMMUNITY_2 = "2";
export const ORGS_ADMIN_COMMUNITY_2 = `[orgId:${AUTH_COMMUNITY_2} orgPath:/org2 roles:[ADMIN]]`;

export const KNOWN_FEATURE = "algorithm";
export const UNKNOWN_FEATURE = "bogus-feature";

export const testCasesSubscribe = [
  {
    description: "Success - admin subscribes to algorithm",
    feature: KNOWN_FEATURE,
    auth_community_id: AUTH_COMMUNITY_1,
    orgs: ORGS_ADMIN,
    status_code: 200,
    expected_error_code: SUCCESS,
    expected_data: "success",
  },
  {
    description: "Fail - manager cannot subscribe",
    feature: KNOWN_FEATURE,
    auth_community_id: AUTH_COMMUNITY_1,
    orgs: ORGS_GESTIONNAIRE,
    status_code: 403,
    expected_error_code: ANNEXES_SERVICES_ERRORS.UNAUTHORIZED.errorCode,
  },
  {
    description: "Fail - member cannot subscribe",
    feature: KNOWN_FEATURE,
    auth_community_id: AUTH_COMMUNITY_1,
    orgs: ORGS_MEMBER,
    status_code: 403,
    expected_error_code: ANNEXES_SERVICES_ERRORS.UNAUTHORIZED.errorCode,
  },
  {
    description: "Fail - unknown feature returns 404",
    feature: UNKNOWN_FEATURE,
    auth_community_id: AUTH_COMMUNITY_1,
    orgs: ORGS_ADMIN,
    status_code: 404,
    expected_error_code: ANNEXES_SERVICES_ERRORS.SUBSCRIPTION.FEATURE_NOT_FOUND.errorCode,
  },
];
