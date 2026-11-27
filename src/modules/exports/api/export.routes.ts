import express from "express";
import { lazyController } from "../../../container/lazy-controller.js";
import { freshAuthChecker } from "../../../shared/middlewares/fresh-auth.middleware.js";
import { idChecker } from "../../../shared/middlewares/user.check.middleware.js";
import { EXPORT_ERRORS } from "../shared/export.errors.js";
import { loadExportSettings } from "../shared/export.settings.js";
import { ExportController } from "./export.controller.js";

export const export_routes = express.Router();
const export_controller = lazyController<ExportController>(ExportController);

// The data export (contracts/export/README.md at the monorepo root). Authentication only at the
// route: whether the caller may export, list or download a community's export depends on the
// body or on the job, so the service checks the role. No response cache anywhere: the worker
// changes these rows behind the API's back.

// Post (/) : Requests an export of the caller's data, or of the active community's (ADMIN).
export_routes.post(
  "/",
  /* #swagger.summary = 'Request an export of my data, or of the active community\'s data (ADMIN)'
       #swagger.tags = ['Exports']
       #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/CreateExportDTO' } } } }
       #swagger.responses[202] = { $ref: '#/components/responses/ExportCreated' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/ExportReauthRequired' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.responses[409] = { description: '35002: an export of this scope is already in progress' }
       #swagger.responses[422] = { description: 'Invalid scope or community_id' }
       #swagger.responses[429] = { description: '35003: too many requests for this scope over 24 hours' }
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
  idChecker(),
  freshAuthChecker(loadExportSettings().step_up_max_age_seconds, EXPORT_ERRORS.REAUTH_REQUIRED),
  export_controller.request.bind(export_controller),
);

// Get (/) : My exports, or (view=community) every export of the active community (ADMIN).
export_routes.get(
  "/",
  /* #swagger.summary = 'List my exports, or the active community\'s exports (ADMIN)'
       #swagger.tags = ['Exports']
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/ExportListQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/ExportList' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
  idChecker(),
  export_controller.list.bind(export_controller),
);

// Get (/:id) : One export, with its parts.
export_routes.get(
  "/:id",
  /* #swagger.summary = 'One export, with the status of each part'
       #swagger.tags = ['Exports']
       #swagger.responses[200] = { $ref: '#/components/responses/ExportDetail' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[404] = { description: '35004: no such export, or not one the caller may see' }
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
  idChecker(),
  export_controller.get.bind(export_controller),
);

// Post (/:id/download-url) : A five-minute URL to the archive, for the requester only.
export_routes.post(
  "/:id/download-url",
  /* #swagger.summary = 'A short-lived URL to download the archive (requester only)'
       #swagger.tags = ['Exports']
       #swagger.responses[200] = { $ref: '#/components/responses/ExportDownloadUrl' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[403] = { description: '35005: only the requester can download an export' }
       #swagger.responses[404] = { description: '35004: no such export, or not one the caller may see' }
       #swagger.responses[409] = { description: '35006: the export is not ready' }
       #swagger.responses[410] = { description: '35007: the archive expired' }
       #swagger.responses[503] = { description: '35008: the URL could not be signed' }
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
  idChecker(),
  export_controller.downloadUrl.bind(export_controller),
);
