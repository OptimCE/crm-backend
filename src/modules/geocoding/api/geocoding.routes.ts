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

// Get (/suggest) : Address suggestions from the BeSt Address register.
//
// `idChecker()` ONLY — no communityIdChecker, no roleChecker. This mirrors
// municipality.routes.ts, which guards its two reference-data endpoints the same
// way, and it is not cosmetic: communityIdChecker demands an X-Community-ID
// header, and the invitation self-encoding form runs for a user who has no
// community context yet. Requiring one would silently kill the picker on exactly
// the form where a new user first types an address.
geocoding_routes.get(
  "/suggest",
  /* #swagger.summary = 'Address suggestions from the Belgian BeSt Address register'
       #swagger.tags = ['Geocoding']
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/AddressSuggestQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/AddressSuggestSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
  idChecker(),
  geocoding_controller.suggestAddresses.bind(geocoding_controller),
);

// Get (/preview) : Can this address be located? Reads only, writes nothing.
//
// A GET rather than a POST because it is idempotent and side-effect free, and
// the frontend's ServiceBase only has cachedGet — as a POST it would forfeit
// in-flight dedup, the response cache, the timeout and the retry policy.
geocoding_routes.get(
  "/preview",
  /* #swagger.summary = 'Check whether an address can be placed on the map, without storing anything'
       #swagger.tags = ['Geocoding']
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/AddressPreviewQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/AddressPreviewSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
  idChecker(),
  geocoding_controller.previewAddress.bind(geocoding_controller),
);
