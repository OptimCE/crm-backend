import express from "express";
import { container } from "../../../container/di-container.js";
import { idChecker } from "../../../shared/middlewares/user.check.middleware.js";
import { MunicipalityController } from "./municipality.controller.js";

export const municipality_routes = express.Router();
const municipality_controller = container.get<MunicipalityController>(MunicipalityController);

// Get (/) : Search municipalities (paginated, name + postal code filters)
municipality_routes.get(
  "/",
  /* #swagger.summary = 'Search Belgian municipalities (paginated)'
       #swagger.tags = ['Municipalities']
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/MunicipalitySearchQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/MunicipalitySearchSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
  idChecker(),
  municipality_controller.searchMunicipalities.bind(municipality_controller),
);
