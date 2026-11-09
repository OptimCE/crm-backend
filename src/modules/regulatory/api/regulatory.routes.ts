import express from "express";
import { lazyController } from "../../../container/lazy-controller.js";
import { Role } from "../../../shared/dtos/role.js";
import { communityIdChecker } from "../../../shared/middlewares/community.check.middleware.js";
import { roleChecker } from "../../../shared/middlewares/role.middleware.js";
import { idChecker } from "../../../shared/middlewares/user.check.middleware.js";
import { RegulatoryController } from "./regulatory.controller.js";

export const regulatory_routes = express.Router();
const regulatory_controller = lazyController<RegulatoryController>(RegulatoryController);

// Get (/status) : The regulatory status of an operation's (or the community's) meters and keys, for the badges.
//
// Managers only, like the procedures it links to. No response cache, on purpose:
// the administrative annexe writes regulatory_link_status straight into the
// database, so nothing in the core could ever invalidate one.
regulatory_routes.get(
  "/status",
  /* #swagger.summary = 'Regulatory status of the meters and keys of an operation (the CRM badges)'
       #swagger.tags = ['Regulatory']
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/RegulatoryStatusQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/RegulatoryStatusSuccess' }
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
  regulatory_controller.getStatus.bind(regulatory_controller),
);
