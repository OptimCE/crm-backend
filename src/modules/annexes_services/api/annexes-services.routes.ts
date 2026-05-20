import express from "express";
import { idChecker } from "../../../shared/middlewares/user.check.middleware.js";
import { communityIdChecker } from "../../../shared/middlewares/community.check.middleware.js";
import { roleChecker } from "../../../shared/middlewares/role.middleware.js";
import { Role } from "../../../shared/dtos/role.js";
import { lazyController } from "../../../container/lazy-controller.js";
import { AnnexesServicesController } from "./annexes-services.controller.js";

export const annexes_services_routes = express.Router();
const annexes_services_controller = lazyController<AnnexesServicesController>(AnnexesServicesController);

// GET / : List of annex services for the current community (catalog joined with active subscriptions, filtered by user role)
annexes_services_routes.get(
  "/",
  /* #swagger.summary = 'List annex services available to the current community, with subscription state'
       #swagger.tags = ['AnnexesServices']
       #swagger.responses[200] = { $ref: '#/components/responses/CommunityAnnexesListSuccess' }
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
  annexes_services_controller.getCommunityServices.bind(annexes_services_controller),
);

// POST /:feature/subscribe : Activate the feature subscription for the current community (ADMIN only).
annexes_services_routes.post(
  "/:feature/subscribe",
  /* #swagger.summary = 'Subscribe the current community to an annex feature'
       #swagger.tags = ['AnnexesServices']
       #swagger.parameters['feature'] = { in: 'path', required: true, type: 'string' }
       #swagger.responses[200] = { $ref: '#/components/responses/SuccessResponse' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.responses[404] = { $ref: '#/components/responses/NotFound' }
       #swagger.responses[409] = { $ref: '#/components/responses/Conflict' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": []
       }]
    */
  idChecker(),
  communityIdChecker(),
  roleChecker(Role.ADMIN),
  annexes_services_controller.subscribe.bind(annexes_services_controller),
);

// POST /:feature/unsubscribe : Deactivate the feature subscription for the current community (ADMIN only).
annexes_services_routes.post(
  "/:feature/unsubscribe",
  /* #swagger.summary = 'Unsubscribe the current community from an annex feature'
       #swagger.tags = ['AnnexesServices']
       #swagger.parameters['feature'] = { in: 'path', required: true, type: 'string' }
       #swagger.responses[200] = { $ref: '#/components/responses/SuccessResponse' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.responses[404] = { $ref: '#/components/responses/NotFound' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": []
       }]
    */
  idChecker(),
  communityIdChecker(),
  roleChecker(Role.ADMIN),
  annexes_services_controller.unsubscribe.bind(annexes_services_controller),
);
