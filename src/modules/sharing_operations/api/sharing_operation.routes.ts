import express from "express";
import { container } from "../../../container/di-container.js";
import { SharingOperationController } from "./sharing_operation.controller.js";
import { idChecker } from "../../../shared/middlewares/user.check.middleware.js";
import { communityIdChecker } from "../../../shared/middlewares/community.check.middleware.js";
import { roleChecker } from "../../../shared/middlewares/role.middleware.js";
import { Role } from "../../../shared/dtos/role.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export const sharing_operation_routes = express.Router();
const sharing_operation_controller = container.get<SharingOperationController>(SharingOperationController);

// Get (/) : Get partial list of sharing operations
sharing_operation_routes.get(
  "/",
  /* #swagger.summary = 'Get partial list of sharing operations'
       #swagger.tags = ['SharingOperations']
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/SharingOperationPartialQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/SharingOperationListSuccess' }
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
  sharing_operation_controller.getSharingOperationList.bind(sharing_operation_controller),
);
// Get (/:id): Get a detailed sharing operations
sharing_operation_routes.get(
  "/:id",
  /* #swagger.summary = 'Get a detailed sharing operations'
       #swagger.tags = ['SharingOperations']
       #swagger.parameters['id'] = { $ref: '#/components/parameters/SharingOperationId' }
       #swagger.responses[200] = { $ref: '#/components/responses/SharingOperationGetSuccess' }
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
  sharing_operation_controller.getSharingOperation.bind(sharing_operation_controller),
);
// GET (:id/meters): Get paginated meters list of meters in the sharing operation (past, now or future)
sharing_operation_routes.get(
  "/:id/meters",
  /* #swagger.summary = 'Get paginated meters list of meters in the sharing operation (past, now or future)'
     #swagger.tags = ['SharingOperations']
     #swagger.parameters['filters'] = { $ref: '#/components/parameters/SharingOperationMetersQuery' }
     #swagger.parameters['filters'] = { $ref: '#/components/parameters/SharingOperationConsumptionQuery' }
     #swagger.responses[200] = { $ref: '#/components/responses/SharingOperationConsumptionsGetSuccess' }
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
  sharing_operation_controller.getSharingOperationMetersList.bind(sharing_operation_controller),
);
// GET (:id/meters): Get paginated meters list of meters in the sharing operation (past, now or future)
sharing_operation_routes.get(
  "/:id/keys",
  /* #swagger.summary = 'Get paginated historical keys list'
     #swagger.tags = ['SharingOperations']
     #swagger.parameters['filters'] = { $ref: '#/components/parameters/SharingOperationConsumptionQuery' }
     #swagger.responses[200] = { $ref: '#/components/responses/SharingOperationConsumptionsGetSuccess' }
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
  sharing_operation_controller.getSharingOperationKeysList.bind(sharing_operation_controller),
);
// Get (/:id/consumptions): Get consumptions information about a sharing operation
sharing_operation_routes.get(
  "/:id/consumptions",
  /* #swagger.summary = 'Get consumptions information about a sharing operation'
       #swagger.tags = ['SharingOperations']
       #swagger.parameters['id'] = { $ref: '#/components/parameters/SharingOperationId' }
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/SharingOperationConsumptionQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/SharingOperationConsumptionsGetSuccess' }
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
  sharing_operation_controller.getSharingOperationConsumptions.bind(sharing_operation_controller),
);
// Get (/:id/consumptions/download): Download consumptions information about a sharing operation
sharing_operation_routes.get(
  "/:id/consumptions/download",
  /* #swagger.summary = 'Download consumptions information about a sharing operation'
       #swagger.tags = ['SharingOperations']
       #swagger.parameters['id'] = { $ref: '#/components/parameters/SharingOperationId' }
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/SharingOperationConsumptionQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/SharingOperationConsumptionsDownloadSuccess' }
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
  sharing_operation_controller.downloadSharingOperationConsumptions.bind(sharing_operation_controller),
);
// Post (/) : Create a new sharing operation
sharing_operation_routes.post(
  "/",
  /* #swagger.summary = 'Create a new sharing operation'
       #swagger.tags = ['SharingOperations']
       #swagger.requestBody = {
           required: true,
           content: {
               "application/json": {
                   schema: { $ref: "#/components/schemas/CreateSharingOperationDTO" }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/SharingOperationCreateSuccess' }
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
  sharing_operation_controller.createSharingOperation.bind(sharing_operation_controller),
);
// Post (/key): Add a new key to the sharing operation
sharing_operation_routes.post(
  "/key",
  /* #swagger.summary = 'Add a new key to the sharing operation'
       #swagger.tags = ['SharingOperations']
       #swagger.requestBody = {
           required: true,
           content: {
               "application/json": {
                   schema: { $ref: "#/components/schemas/AddKeyToSharingOperationDTO" }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/SharingOperationAddKeySuccess' }
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
  sharing_operation_controller.addKeyToSharing.bind(sharing_operation_controller),
);
// Post (/meter): Add a new meter to the sharing operation
sharing_operation_routes.post(
  "/meter",
  /* #swagger.summary = 'Add a new meter to the sharing operation'
       #swagger.tags = ['SharingOperations']
       #swagger.requestBody = {
           required: true,
           content: {
               "application/json": {
                   schema: { $ref: "#/components/schemas/AddMeterToSharingOperationDTO" }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/SharingOperationAddMeterSuccess' }
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
  sharing_operation_controller.addMeterToSharing.bind(sharing_operation_controller),
);
// Post (/consumptions): Upload external consumptions data
sharing_operation_routes.post(
  "/consumptions",
  /* #swagger.summary = 'Upload external consumptions data'
       #swagger.tags = ['SharingOperations']
       #swagger.requestBody = {
           required: true,
           content: {
               "multipart/form-data": {
                   schema: {
                        type: 'object',
                        properties: {
                            file: {
                                type: 'string',
                                format: 'binary',
                                description: 'Consumption file (CSV, Excel). Max size 5MB.'
                            },
                            id_sharing_operation: {
                                type: 'integer',
                                description: 'ID of the sharing operation'
                            }
                        },
                        required: ['file', 'id_sharing_operation']
                   }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/SharingOperationAddConsumptionsSuccess' }
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
  upload.single("file"),
  sharing_operation_controller.addConsumptionDataToSharing.bind(sharing_operation_controller),
);
// Patch (/key): Change the status of a key in the sharing operation
sharing_operation_routes.patch(
  "/key",
  /* #swagger.summary = 'Change the status of a key in the sharing operation'
       #swagger.tags = ['SharingOperations']
       #swagger.requestBody = {
           required: true,
           content: {
               "application/json": {
                   schema: { $ref: "#/components/schemas/PatchKeyToSharingOperationDTO" }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/SharingOperationPatchKeySuccess' }
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
  sharing_operation_controller.patchKeyStatus.bind(sharing_operation_controller),
);
// Patch (/meter): Change the status of a meter in the sharing operation
sharing_operation_routes.patch(
  "/meter",
  /* #swagger.summary = 'Change the status of a meter in the sharing operation'
       #swagger.tags = ['SharingOperations']
       #swagger.requestBody = {
           required: true,
           content: {
               "application/json": {
                   schema: { $ref: "#/components/schemas/PatchMeterToSharingOperationDTO" }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/SharingOperationPatchMeterSuccess' }
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
  sharing_operation_controller.patchMeterStatus.bind(sharing_operation_controller),
);
// DELETE (/:id) : Delete a sharing operation
sharing_operation_routes.delete(
  "/:id",
  /* #swagger.summary = 'Delete a sharing operation'
       #swagger.tags = ['SharingOperations']
       #swagger.parameters['id'] = { $ref: '#/components/parameters/SharingOperationId' }
       #swagger.responses[200] = { $ref: '#/components/responses/SharingOperationDeleteSuccess' }
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
  roleChecker(Role.ADMIN),
  sharing_operation_controller.deleteSharingOperation.bind(sharing_operation_controller),
);
// Delete (/:id/meter): Delete a meter from a sharing operation
sharing_operation_routes.delete(
  "/:id/meter",
  /* #swagger.summary = 'Delete a meter from a sharing operation'
       #swagger.tags = ['SharingOperations']
       #swagger.requestBody = {
           required: true,
           content: {
               "application/json": {
                   schema: { $ref: "#/components/schemas/RemoveMeterFromSharingOperationDTO" }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/SharingOperationRemoveMeterSuccess' }
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
  sharing_operation_controller.deleteMeterFromSharingOperation.bind(sharing_operation_controller),
);
