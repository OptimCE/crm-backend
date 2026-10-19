import express from "express";
import { lazyController } from "../../../container/lazy-controller.js";
import { idChecker } from "../../../shared/middlewares/user.check.middleware.js";
import { communityIdChecker } from "../../../shared/middlewares/community.check.middleware.js";
import { DsoController } from "./dso.controller.js";

export const dso_routes = express.Router();
const dso_controller = lazyController<DsoController>(DsoController);

// Get (/operators) : The DSO catalogue of the internal dso-lookup service, for the meter form's GRD select.
//
// `idChecker()` ONLY, like /geocoding/suggest: national reference data, the same
// for every tenant, so there is nothing to scope.
dso_routes.get(
  "/operators",
  /* #swagger.summary = 'Belgian electricity DSOs (and Elia, last), for the meter GRD select'
       #swagger.tags = ['Dso']
       #swagger.responses[200] = { $ref: '#/components/responses/DsoOperatorsSuccess' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
  idChecker(),
  dso_controller.getOperators.bind(dso_controller),
);

// Get (/resolve) : Which DSO runs the network at an address — prefills a meter's GRD. Reads only.
//
// communityIdChecker() on top of idChecker(), unlike /operators: the answer carries a
// warning computed from the ACTIVE community's regulator. Always a 200 — an unreachable
// dso-lookup is `status: "unavailable"`, and the form simply keeps the user's choice.
// POST /meters never calls this, so meter creation never waits on it.
dso_routes.get(
  "/resolve",
  /* #swagger.summary = 'Resolve the DSO of an address, to prefill a meter GRD (advisory, never blocking)'
       #swagger.tags = ['Dso']
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/DsoResolveQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/DsoResolveSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": []
       }]
    */
  idChecker(),
  communityIdChecker(),
  dso_controller.resolve.bind(dso_controller),
);
