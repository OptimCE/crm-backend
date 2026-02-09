import express from "express";
import { InvitationController } from "./invitation.controller.js";
import { container } from "../../../container/di-container.js";
import { idChecker } from "../../../shared/middlewares/user.check.middleware.js";
import { communityIdChecker } from "../../../shared/middlewares/community.check.middleware.js";
import { roleChecker } from "../../../shared/middlewares/role.middleware.js";
import { Role } from "../../../shared/dtos/role.js";

export const invitation_routes = express.Router();
const invitation_controller = container.get<InvitationController>(InvitationController);
// GET (/) : Get all member pending invitations (admin/manager view within community)
invitation_routes.get("/",
    /* #swagger.summary = 'Get all member pending invitations'
       #swagger.tags = ['Invitations']
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/UserMemberInvitationQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/MemberInvitationsListSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": [],
            "MinRoleChecker": []
       }]
    */
    idChecker(), communityIdChecker(), roleChecker(Role.GESTIONNAIRE), invitation_controller.getMembersPendingInvitation.bind(invitation_controller));
// GET (/managers): Get all managers pending invitations (admin/manager view within community)
invitation_routes.get("/managers",
    /* #swagger.summary = 'Get all managers pending invitations'
       #swagger.tags = ['Invitations']
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/UserManagerInvitationQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/ManagerInvitationsListSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": [],
            "MinRoleChecker": []
       }]
    */
    idChecker(), communityIdChecker(), roleChecker(Role.GESTIONNAIRE), invitation_controller.getManagersPendingInvitation.bind(invitation_controller));
// GET (/own): Get all own member pending invitations
invitation_routes.get("/own",
    /* #swagger.summary = 'Get all own member pending invitations'
       #swagger.tags = ['Invitations']
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/UserMemberInvitationQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/MemberInvitationsListSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
    idChecker(), invitation_controller.getOwnMemberPendingInvitation.bind(invitation_controller));
// GET (/own/managers): Get all own managers pending invitations
invitation_routes.get("/own/managers",
    /* #swagger.summary = 'Get all own managers pending invitations'
       #swagger.tags = ['Invitations']
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/UserManagerInvitationQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/ManagerInvitationsListSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
    idChecker(), invitation_controller.getOwnManagerPendingInvitation.bind(invitation_controller));
// POST (/): Invite a user to become a member with encoding
invitation_routes.post("/member",
    /* #swagger.summary = 'Invite a user to become a member'
       #swagger.tags = ['Invitations']
       #swagger.requestBody = {
           required: true,
           content: {
               "application/json": {
                   schema: { $ref: "#/components/schemas/InviteUser" }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/InvitationSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": [],
            "MinRoleChecker": []
       }]
    */
    idChecker(), communityIdChecker(), roleChecker(Role.GESTIONNAIRE), invitation_controller.inviteUserToBecomeMember.bind(invitation_controller));
// POST (/): Invite a user to become a manager
invitation_routes.post("/manager",
    /* #swagger.summary = 'Invite a user to become a manager'
       #swagger.tags = ['Invitations']
       #swagger.requestBody = {
           required: true,
           content: {
               "application/json": {
                   schema: { $ref: "#/components/schemas/InviteUser" }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/InvitationSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": [],
            "MinRoleChecker": []
       }]
    */
    idChecker(), communityIdChecker(), roleChecker(Role.ADMIN), invitation_controller.inviteUserToBecomeManager.bind(invitation_controller));
// POST (/accept): Accept an invitation member
invitation_routes.post("/accept",
    /* #swagger.summary = 'Accept an invitation member'
       #swagger.tags = ['Invitations']
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
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
    idChecker(), invitation_controller.acceptInvitationMember.bind(invitation_controller));
// POST (/accept/encoded): Accept an invitation with encoded member
invitation_routes.post("/accept/encoded",
    /* #swagger.summary = 'Accept an invitation with encoded member'
       #swagger.tags = ['Invitations']
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
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
    idChecker(), invitation_controller.acceptInvitationMemberWEncoded.bind(invitation_controller));
// POST (/accept/manager): Accept an invitation for manager
invitation_routes.post("/accept/manager",
    /* #swagger.summary = 'Accept an invitation for manager'
       #swagger.tags = ['Invitations']
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
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
    idChecker(), invitation_controller.acceptInvitationManager.bind(invitation_controller));
// DELETE (/:id_invitation/member): Cancel a member invitation
invitation_routes.delete("/:id_invitation/member",
    /* #swagger.summary = 'Cancel a member invitation'
      #swagger.tags = ['Invitations']
      #swagger.parameters['id_invitation'] = { $ref: '#/components/parameters/InvitationId' }
      #swagger.responses[200] = { $ref: '#/components/responses/InvitationSuccess' }
      #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
      #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
      #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
      #swagger.security = [{
           "UserIdChecker": [],
           "CommunityIdChecker": [],
           "MinRoleChecker": []
      }]
   */
    idChecker(), communityIdChecker(), roleChecker(Role.GESTIONNAIRE), invitation_controller.cancelMemberInvitation.bind(invitation_controller));
// DELETE (/:id_invitation/manager): Cancel a manager invitation
invitation_routes.delete("/:id_invitation/manager",
    /* #swagger.summary = 'Cancel a manager invitation'
       #swagger.tags = ['Invitations']
       #swagger.parameters['id_invitation'] = { $ref: '#/components/parameters/InvitationId' }
       #swagger.responses[200] = { $ref: '#/components/responses/InvitationSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": [],
            "MinRoleChecker": []
       }]
    */
    idChecker(), communityIdChecker(), roleChecker(Role.ADMIN), invitation_controller.cancelManagerInvitation.bind(invitation_controller));
// DELETE (/:id_invitation/own/member): Cancel a member own invitation
invitation_routes.delete("/:id_invitation/own/member",
    /* #swagger.summary = 'Cancel a member own invitation'
       #swagger.tags = ['Invitations']
       #swagger.parameters['id_invitation'] = { $ref: '#/components/parameters/InvitationId' }
       #swagger.responses[200] = { $ref: '#/components/responses/InvitationSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
    idChecker(), invitation_controller.refuseMemberInvitation.bind(invitation_controller));
// DELETE (/:id_invitation/own/manager): Cancel a manager own invitation
invitation_routes.delete("/:id_invitation/own/manager",
    /* #swagger.summary = 'Cancel a manager own invitation'
       #swagger.tags = ['Invitations']
       #swagger.parameters['id_invitation'] = { $ref: '#/components/parameters/InvitationId' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
    idChecker(), invitation_controller.refuseManagerInvitation.bind(invitation_controller));


