import express from "express";
import { KeyController } from "./key.controller.js";
import { container } from "../../../container/di-container.js";
import { idChecker } from "../../../shared/middlewares/user.check.middleware.js";
import { roleChecker } from "../../../shared/middlewares/role.middleware.js";
import { Role } from "../../../shared/dtos/role.js";
import { communityIdChecker } from "../../../shared/middlewares/community.check.middleware.js";

export const key_router = express.Router();
const key_controller = container.get<KeyController>(KeyController);

// Get partial list of keys (/)
key_router.get(
  "/",
  /* #swagger.summary = 'Get partial list of keys'
       #swagger.tags = ['Keys']
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/KeyQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/KeyListSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": [],
            "MinRoleChecker": []
       }]
    */
  idChecker(),
  communityIdChecker(),
  roleChecker(Role.GESTIONNAIRE),
  key_controller.getKeysList.bind(key_controller),
);
// Get a detailed key (/:id)
key_router.get(
  "/:id",
  /* #swagger.summary = 'Get a detailed key'
       #swagger.tags = ['Keys']
       #swagger.parameters['id'] = { $ref: '#/components/parameters/KeyId' }
       #swagger.responses[200] = { $ref: '#/components/responses/KeyGetSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": [],
            "MinRoleChecker": []
       }]
    */
  idChecker(),
  communityIdChecker(),
  roleChecker(Role.GESTIONNAIRE),
  key_controller.getKey.bind(key_controller),
);
// Get download a detailled key (/:id/download)
key_router.get(
  "/:id/download",
  /* #swagger.summary = 'Get download a detailled key'
       #swagger.tags = ['Keys']
       #swagger.parameters['id'] = { $ref: '#/components/parameters/KeyId' }
       #swagger.responses[200] = { $ref: '#/components/responses/KeyDownloadSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": [],
            "MinRoleChecker": []
       }]
    */
  idChecker(),
  communityIdChecker(),
  roleChecker(Role.GESTIONNAIRE),
  key_controller.downloadKey.bind(key_controller),
);
// Post add a key (/)
key_router.post(
  "/",
  /* #swagger.summary = 'Add a key'
       #swagger.tags = ['Keys']
       #swagger.requestBody = {
           required: true,
           content: {
               "application/json": {
                   schema: { $ref: "#/components/schemas/CreateKeyDTO" }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/KeyCreateSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": [],
            "MinRoleChecker": []
       }]
    */
  idChecker(),
  communityIdChecker(),
  roleChecker(Role.GESTIONNAIRE),
  key_controller.addKey.bind(key_controller),
);
// Put update a key (/)
key_router.put(
  "/",
  /* #swagger.summary = 'Update a key'
       #swagger.tags = ['Keys']
       #swagger.requestBody = {
           required: true,
           content: {
               "application/json": {
                   schema: { $ref: "#/components/schemas/UpdateKeyDTO" }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/KeyUpdateSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": [],
            "MinRoleChecker": []
       }]
    */
  idChecker(),
  communityIdChecker(),
  roleChecker(Role.GESTIONNAIRE),
  key_controller.updateKey.bind(key_controller),
);
// Delete a key (/:id)
key_router.delete(
  "/:id",
  /* #swagger.summary = 'Delete a key'
       #swagger.tags = ['Keys']
       #swagger.parameters['id'] = { $ref: '#/components/parameters/KeyId' }
       #swagger.responses[200] = { $ref: '#/components/responses/KeyDeleteSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": [],
            "MinRoleChecker": []
       }]
    */
  idChecker(),
  communityIdChecker(),
  roleChecker(Role.GESTIONNAIRE),
  key_controller.deleteKey.bind(key_controller),
);
