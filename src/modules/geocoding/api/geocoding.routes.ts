import express from "express";
import { lazyController } from "../../../container/lazy-controller.js";
import { idChecker } from "../../../shared/middlewares/user.check.middleware.js";
import { communityIdChecker } from "../../../shared/middlewares/community.check.middleware.js";
import { roleChecker } from "../../../shared/middlewares/role.middleware.js";
import { Role } from "../../../shared/dtos/role.js";
import { GeocodingController } from "./geocoding.controller.js";

export const geocoding_routes = express.Router();
const geocoding_controller = lazyController<GeocodingController>(GeocodingController);

// Post (/backfill) : Resolve a batch of never-geocoded addresses.
geocoding_routes.post(
  "/backfill",
  /* #swagger.summary = 'Geocode a batch of addresses that have never been attempted'
       #swagger.tags = ['Geocoding']
       #swagger.requestBody = {
            required: false,
            content: {
                "application/json": {
                    schema: { $ref: '#/components/schemas/GeocodeBackfillDTO' },
                    example: { limit: 100 }
                }
            }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/GeocodeBackfillSuccess' }
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
  geocoding_controller.runBackfill.bind(geocoding_controller),
);
