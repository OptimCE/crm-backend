import express from "express";
import { container } from "../../../container/di-container.js";
import { DocumentController } from "./document.controller.js";
import { idChecker } from "../../../shared/middlewares/user.check.middleware.js";
import { communityIdChecker } from "../../../shared/middlewares/community.check.middleware.js";
import { roleChecker } from "../../../shared/middlewares/role.middleware.js";
import { Role } from "../../../shared/dtos/role.js";
import multer from "multer";

export const document_router = express.Router();
const document_controller = container.get<DocumentController>(DocumentController);
const upload = multer({ storage: multer.memoryStorage() });

// Get (/:member_id) : Get all documents linked to a member
document_router.get("/:member_id",
    /* #swagger.summary = 'Get all documents linked to a member'
       #swagger.tags = ['Documents']
       #swagger.parameters['member_id'] = { $ref: '#/components/parameters/MemberId' }
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/DocumentQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/DocumentListSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": [],
            "MinRoleChecker": []
       }]
    */
    idChecker(), communityIdChecker(), roleChecker(Role.GESTIONNAIRE), document_controller.getDocuments.bind(document_controller));
// Get (/:member_id/:document_id): Download a specific document
document_router.get("/:member_id/:document_id",
    /* #swagger.summary = 'Download a specific document'
       #swagger.tags = ['Documents']
       #swagger.parameters['member_id'] = { $ref: '#/components/parameters/MemberId' }
       #swagger.parameters['document_id'] = { $ref: '#/components/parameters/DocumentId' }
       #swagger.responses[200] = { $ref: '#/components/responses/DocumentDownloadSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": [],
            "MinRoleChecker": []
       }]
    */
    idChecker(), communityIdChecker(), roleChecker(Role.GESTIONNAIRE), document_controller.downloadDocument.bind(document_controller));
// POST (/): Upload a document
document_router.post("/",
    /* #swagger.summary = 'Upload a document'
       #swagger.tags = ['Documents']
       #swagger.consumes = ['multipart/form-data']
       #swagger.requestBody = {
           required: true,
           content: {
               "multipart/form-data": {
                   schema: {
                       type: "object",
                       properties: {
                           file: { type: "string", format: "binary" },
                           id_member: { type: "integer" }
                       },
                       required: ["file", "id_member"]
                   }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/DocumentUploadSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": [],
            "MinRoleChecker": []
       }]
    */
    idChecker(), communityIdChecker(), roleChecker(Role.GESTIONNAIRE), upload.single("file"), document_controller.uploadDocument.bind(document_controller));
// DELETE (/:document_id) : Delete a specific document
document_router.delete("/:document_id",
    /* #swagger.summary = 'Delete a specific document'
       #swagger.tags = ['Documents']
      #swagger.parameters['document_id'] = { $ref: '#/components/parameters/DocumentId' }
      #swagger.responses[200] = { $ref: '#/components/responses/DocumentDeleteSuccess' }
      #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
      #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
      #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
      #swagger.security = [{
           "UserIdChecker": [],
           "CommunityIdChecker": [],
           "MinRoleChecker": []
      }]
   */
    idChecker(), communityIdChecker(), roleChecker(Role.GESTIONNAIRE), document_controller.deleteDocument.bind(document_controller));
