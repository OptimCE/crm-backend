import express from "express";
import { idChecker } from "../../../shared/middlewares/user.check.middleware.js";
import { container } from "../../../container/di-container.js";
import { MeController } from "./me.controller.js";

export const me_routes = express.Router();
const me_controller = container.get<MeController>(MeController);

// GET /documents -> Fetch all documents related to this user
me_routes.get(
  "/documents",
  /* #swagger.summary = 'Retrieve all documents related to this user'
       #swagger.tags = ['Me']
       #swagger.description = 'Retrieve documents with optional filters defined in MeDocumentPartialQuery.'
       #swagger.security = [{
            "UserIdChecker": []
       }]
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/MeDocumentFilters' }
       #swagger.responses[200] = { $ref: '#/components/responses/MeDocumentsListSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
    */
  idChecker(),
  me_controller.getDocuments.bind(me_controller),
);

// GET /documents/:id -> Download a document
me_routes.get(
  "/documents/:id",
  /* #swagger.summary = 'Download a document by ID'
       #swagger.tags = ['Me']
       #swagger.security = [{
            "UserIdChecker": []
       }]
       #swagger.parameters['id'] = { $ref: '#/components/parameters/MeDocumentId' }
       #swagger.responses[200] = { $ref: '#/components/responses/MeDocumentDownloadSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
    */
  idChecker(),
  me_controller.downloadDocument.bind(me_controller),
);

// GET /members -> Fetch all members represented by this user
me_routes.get(
  "/members",
  /* #swagger.summary = 'Retrieve all members represented by this user'
       #swagger.tags = ['Me']
       #swagger.description = 'Retrieve members with optional filters defined in MeMemberPartialQuery.'
       #swagger.security = [{
            "UserIdChecker": []
       }]
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/MeMemberFilters' }
       #swagger.responses[200] = { $ref: '#/components/responses/MeMembersListSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
    */
  idChecker(),
  me_controller.getMembers.bind(me_controller),
);

// Get /members/:id -> Fetch detail about a member
me_routes.get(
  "/members/:id",
  /* #swagger.summary = 'Retrieve a specific member by ID'
       #swagger.tags = ['Me']
       #swagger.security = [{
            "UserIdChecker": []
       }]
       #swagger.parameters['id'] = { $ref: '#/components/parameters/MeMemberId' }
       #swagger.responses[200] = { $ref: '#/components/responses/MeMemberGetSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
    */
  idChecker(),
  me_controller.getMemberById.bind(me_controller),
);

// GET /meters -> Fetch all meters owned by this user
me_routes.get(
  "/meters",
  /* #swagger.summary = 'Retrieve all meters owned by this user'
       #swagger.tags = ['Me']
       #swagger.description = 'Retrieve meters with optional filters defined in MeMetersPartialQuery.'
       #swagger.security = [{
            "UserIdChecker": []
       }]
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/MeMeterFilters' }
       #swagger.responses[200] = { $ref: '#/components/responses/MeMetersListSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
    */
  idChecker(),
  me_controller.getMeters.bind(me_controller),
);

// GET /meters/:id -> Fetch detail about a meter
me_routes.get(
  "/meters/:id",
  /* #swagger.summary = 'Retrieve a specific meter by EAN'
       #swagger.tags = ['Me']
       #swagger.security = [{
            "UserIdChecker": []
       }]
       #swagger.parameters['id'] = { $ref: '#/components/parameters/MeMeterId' }
       #swagger.responses[200] = { $ref: '#/components/responses/MeMeterGetSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
    */
  idChecker(),
  me_controller.getMeterById.bind(me_controller),
);

// GET /invitations -> Fetch all own member pending invitations
me_routes.get(
  "/invitations",
  /* #swagger.summary = 'Get all own member pending invitations'
     #swagger.tags = ['Me']
     #swagger.security = [{
          "UserIdChecker": []
     }]
     #swagger.parameters['filters'] = { $ref: '#/components/parameters/UserMemberInvitationQuery' }
     #swagger.responses[200] = { $ref: '#/components/responses/MemberInvitationsListSuccess' }
     #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
     #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
     #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
    */
  idChecker(),
  me_controller.getOwnMemberPendingInvitation.bind(me_controller),
);

// GET /invitations/member/:id -> Get member linked to pending invitation by id
me_routes.get(
  "/invitations/member/:id",
  /* #swagger.summary = 'Get member linked to a pending invitation by ID'
       #swagger.tags = ['Me']
       #swagger.security = [{
            "UserIdChecker": []
       }]
       #swagger.parameters['id'] = { $ref: '#/components/parameters/MeDocumentId' }
       #swagger.responses[200] = { $ref: '#/components/responses/MemberInvitationByIdSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
    */
  idChecker(),
  me_controller.getOwnMemberPendingInvitationById.bind(me_controller),
);

// GET /invitations/managers -> Fetch all own managers pending invitations
me_routes.get(
  "/invitations/managers",
  /* #swagger.summary = 'Get all own managers pending invitations'
         #swagger.tags = ['Me']
         #swagger.security = [{
              "UserIdChecker": []
         }]
         #swagger.parameters['filters'] = { $ref: '#/components/parameters/UserManagerInvitationQuery' }
         #swagger.responses[200] = { $ref: '#/components/responses/ManagerInvitationsListSuccess' }
         #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
         #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
         #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
      */
  idChecker(),
  me_controller.getOwnManagerPendingInvitation.bind(me_controller),
);

// POST /invitations/accept -> Accept a member invitation
me_routes.post(
  "/invitations/accept",
  /* #swagger.summary = 'Accept an invitation member'
         #swagger.tags = ['Me']
         #swagger.security = [{
              "UserIdChecker": []
         }]
         #swagger.requestBody = {
             required: true,
             content: {
                 "application/json": {
                     schema: { $ref: "#/components/schemas/AcceptInvitationDTO" }
                 }
             }
         }
         #swagger.responses[200] = { $ref: '#/components/responses/InvitationSuccess' }
         #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
         #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
         #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
      */
  idChecker(),
  me_controller.acceptInvitationMember.bind(me_controller),
);

// POST /invitations/accept/encoded -> Accept a member invitation with encoded member
me_routes.post(
  "/invitations/accept/encoded",
  /* #swagger.summary = 'Accept an invitation with encoded member'
         #swagger.tags = ['Me']
         #swagger.security = [{
              "UserIdChecker": []
         }]
         #swagger.requestBody = {
             required: true,
             content: {
                 "application/json": {
                     schema: { $ref: "#/components/schemas/AcceptInvitationWEncodedDTO" }
                 }
             }
         }
         #swagger.responses[200] = { $ref: '#/components/responses/InvitationSuccess' }
         #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
         #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
         #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
      */
  idChecker(),
  me_controller.acceptInvitationMemberWEncoded.bind(me_controller),
);

// POST /invitations/accept/manager -> Accept a manager invitation
me_routes.post(
  "/invitations/accept/manager",
  /* #swagger.summary = 'Accept an invitation for manager'
         #swagger.tags = ['Me']
         #swagger.security = [{
              "UserIdChecker": []
         }]
         #swagger.requestBody = {
             required: true,
             content: {
                 "application/json": {
                     schema: { $ref: "#/components/schemas/AcceptInvitationDTO" }
                 }
             }
         }
         #swagger.responses[200] = { $ref: '#/components/responses/InvitationSuccess' }
         #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
         #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
         #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
      */
  idChecker(),
  me_controller.acceptInvitationManager.bind(me_controller),
);

// DELETE /invitations/:id_invitation/member -> Refuse a member invitation
me_routes.delete(
  "/invitations/:id_invitation/member",
  /* #swagger.summary = 'Refuse a member own invitation'
         #swagger.tags = ['Me']
         #swagger.security = [{
              "UserIdChecker": []
         }]
         #swagger.parameters['id_invitation'] = { $ref: '#/components/parameters/InvitationId' }
         #swagger.responses[200] = { $ref: '#/components/responses/InvitationSuccess' }
         #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
         #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
         #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
      */
  idChecker(),
  me_controller.refuseMemberInvitation.bind(me_controller),
);

// DELETE /invitations/:id_invitation/manager -> Refuse a manager invitation
me_routes.delete(
  "/invitations/:id_invitation/manager",
  /* #swagger.summary = 'Refuse a manager own invitation'
         #swagger.tags = ['Me']
         #swagger.security = [{
              "UserIdChecker": []
         }]
         #swagger.parameters['id_invitation'] = { $ref: '#/components/parameters/InvitationId' }
         #swagger.responses[200] = { $ref: '#/components/responses/InvitationSuccess' }
         #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
         #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
         #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
      */
  idChecker(),
  me_controller.refuseManagerInvitation.bind(me_controller),
);
