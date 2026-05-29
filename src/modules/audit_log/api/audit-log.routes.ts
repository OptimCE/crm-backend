import express from "express";
import { lazyController } from "../../../container/lazy-controller.js";
import { Role } from "../../../shared/dtos/role.js";
import { communityIdChecker } from "../../../shared/middlewares/community.check.middleware.js";
import { roleChecker } from "../../../shared/middlewares/role.middleware.js";
import { idChecker } from "../../../shared/middlewares/user.check.middleware.js";
import { AuditLogController } from "./audit-log.controller.js";

export const audit_log_routes = express.Router();
const audit_log_controller = lazyController<AuditLogController>(AuditLogController);

// GET /export must be declared before "/" so that the literal /export route
// wins over any future parametric match.
audit_log_routes.get(
  "/export",
  /* #swagger.summary = 'Export the current community\'s audit log as CSV'
       #swagger.tags = ['AuditLog']
       #swagger.responses[200] = { $ref: '#/components/responses/AuditLogExportSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": []
       }]
    */
  idChecker(),
  communityIdChecker(),
  roleChecker(Role.GESTIONNAIRE),
  audit_log_controller.exportCsv.bind(audit_log_controller),
);

audit_log_routes.get(
  "/",
  /* #swagger.summary = 'List audit-log entries for the current community'
       #swagger.tags = ['AuditLog']
       #swagger.responses[200] = { $ref: '#/components/responses/AuditLogListSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": []
       }]
    */
  idChecker(),
  communityIdChecker(),
  roleChecker(Role.GESTIONNAIRE),
  audit_log_controller.list.bind(audit_log_controller),
);
