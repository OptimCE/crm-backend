import express from "express";
import { MeterController } from "./meter.controller.js";
import { container } from "../../../container/di-container.js";
import { idChecker } from "../../../shared/middlewares/user.check.middleware.js";
import { communityIdChecker } from "../../../shared/middlewares/community.check.middleware.js";
import { roleChecker } from "../../../shared/middlewares/role.middleware.js";
import { Role } from "../../../shared/dtos/role.js";

export const meter_router = express.Router();
const meter_controller = container.get<MeterController>(MeterController);

// GET (/) : Get a partial list of meters
meter_router.get(
  "/",
  /* #swagger.summary = 'Get a partial list of meters'
       #swagger.tags = ['Meters']
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/MeterPartialQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/MeterListSuccess' }
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
  meter_controller.getMetersList.bind(meter_controller),
);
// GET (/:id) : Get a detailed meter
meter_router.get(
  "/:id",
  /* #swagger.summary = 'Get a detailed meter'
       #swagger.tags = ['Meters']
       #swagger.parameters['id'] = { $ref: '#/components/parameters/MeterId' }
       #swagger.responses[200] = { $ref: '#/components/responses/MeterGetSuccess' }
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
  meter_controller.getMeter.bind(meter_controller),
);
// GET (/:id/consumptions) : Get the consumption of a meter
meter_router.get(
  "/:id/consumptions",
  /* #swagger.summary = 'Get the consumption of a meter'
       #swagger.tags = ['Meters']
       #swagger.parameters['id'] = { $ref: '#/components/parameters/MeterId' }
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/MeterConsumptionQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/MeterConsumptionsGetSuccess' }
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
  meter_controller.getMeterConsumptions.bind(meter_controller),
);
// Get (/:id/consumptions/download): Download the consumption of a meter
meter_router.get(
  "/:id/consumptions/download",
  /* #swagger.summary = 'Download the consumption of a meter'
       #swagger.tags = ['Meters']
       #swagger.parameters['id'] = { $ref: '#/components/parameters/MeterId' }
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/MeterConsumptionQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/MeterConsumptionsDownloadSuccess' }
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
  meter_controller.downloadMeterConsumptions.bind(meter_controller),
);
// POST (/) : Add a new meter
meter_router.post(
  "/",
  /* #swagger.summary = 'Add a new meter'
       #swagger.tags = ['Meters']
       #swagger.requestBody = {
           required: true,
           content: {
               "application/json": {
                   schema: { $ref: "#/components/schemas/CreateMeterDTO" }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/MeterAddSuccess' }
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
  meter_controller.addMeter.bind(meter_controller),
);

// PUT (/): Update meter
meter_router.put(
  "/",
  /* #swagger.summary = 'Update a meter'
   #swagger.tags = ['Meters']
   #swagger.requestBody = {
       required: true,
       content: {
           "application/json": {
               schema: { $ref: "#/components/schemas/UpdateMeterDTO" }
           }
       }
   }
   #swagger.responses[200] = { $ref: '#/components/responses/MeterAddSuccess' }
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
  meter_controller.updateMeter.bind(meter_controller),
);
// Patch (/data): Patch meter data
meter_router.patch(
  "/data",
  /* #swagger.summary = 'Patch meter data'
       #swagger.tags = ['Meters']
       #swagger.requestBody = {
           required: true,
           content: {
               "application/json": {
                   schema: { $ref: "#/components/schemas/PatchMeterDataDTO" }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/MeterDataPatchSuccess' }
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
  meter_controller.patchMeterData.bind(meter_controller),
);
// DELETE (/:id): Delete a meter
meter_router.delete(
  "/:id",
  /* #swagger.summary = 'Delete a meter'
       #swagger.tags = ['Meters']
       #swagger.parameters['id'] = { $ref: '#/components/parameters/MeterId' }
       #swagger.responses[200] = { $ref: '#/components/responses/MeterDeleteSuccess' }
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
  meter_controller.deleteMeter.bind(meter_controller),
);
