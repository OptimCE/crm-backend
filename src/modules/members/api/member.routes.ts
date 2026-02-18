import express from "express";
import { idChecker } from "../../../shared/middlewares/user.check.middleware.js";
import { communityIdChecker } from "../../../shared/middlewares/community.check.middleware.js";
import { roleChecker } from "../../../shared/middlewares/role.middleware.js";
import { Role } from "../../../shared/dtos/role.js";
import { container } from "../../../container/di-container.js";
import { MemberController } from "./member.controller.js";

export const member_routes = express.Router();
const member_controller = container.get<MemberController>(MemberController);
// Get (/) : Retrieve all members
member_routes.get(
  "/",
  /* #swagger.summary = 'Retrieve a paginated list of members'
       #swagger.tags = ['Members']
       #swagger.description = 'Retrieve members with optional filters defined in MemberPartialQuery.'
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": [],
            "MinRoleChecker": []
       }]
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/MemberFilters' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.responses[200] = { $ref: '#/components/responses/PaginatedMembers' }
    */
  idChecker(),
  communityIdChecker(),
  roleChecker(Role.GESTIONNAIRE),
  member_controller.getMembersList.bind(member_controller),
);
// Get (/:id_member): Retrieve a specific member
member_routes.get(
  "/:id_member",
  /* #swagger.summary = 'Retrieve a specific member'
       #swagger.tags = ['Members']
       #swagger.parameters['id_member'] = { $ref: '#/components/parameters/MemberId' }
       #swagger.responses[200] = { $ref: '#/components/responses/MemberGetSuccess' }
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
  member_controller.getMember.bind(member_controller),
);
// Get (/:id_member/link) : Retrieve the member link status
member_routes.get(
  "/:id_member/link",
  /* #swagger.summary = 'Retrieve the member link status'
       #swagger.tags = ['Members']
       #swagger.parameters['id_member'] = { $ref: '#/components/parameters/MemberId' }
       #swagger.responses[200] = { $ref: '#/components/responses/MemberLinkGetSuccess' }
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
  member_controller.getMemberLink.bind(member_controller),
);
// Post (/) : Create a new member
member_routes.post(
  "/",
  /* #swagger.summary = 'Create a new member'
       #swagger.tags = ['Members']
       #swagger.requestBody = {
           required: true,
           content: {
               "application/json": {
                   schema: { $ref: "#/components/schemas/CreateMemberDTO" }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/MemberCreateSuccess' }
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
  member_controller.addMember.bind(member_controller),
);
// Put (/) : Update a member
member_routes.put(
  "/",
  /* #swagger.summary = 'Update a member'
       #swagger.tags = ['Members']
       #swagger.requestBody = {
           required: true,
           content: {
               "application/json": {
                   schema: { $ref: "#/components/schemas/UpdateMemberDTO" }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/MemberUpdateSuccess' }
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
  member_controller.updateMember.bind(member_controller),
);
// Patch (/status) : Update a member status
member_routes.patch(
  "/status",
  /* #swagger.summary = 'Update a member status'
       #swagger.tags = ['Members']
       #swagger.requestBody = {
           required: true,
           content: {
               "application/json": {
                   schema: { $ref: "#/components/schemas/PatchMemberStatusDTO" }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/MemberStatusPatchSuccess' }
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
  member_controller.patchMemberStatus.bind(member_controller),
);
// Patch (/invite): Invite an user to create a link with this member
member_routes.patch(
  "/invite",
  /* #swagger.summary = 'Invite an user to create a link with this member'
       #swagger.tags = ['Members']
       #swagger.requestBody = {
           required: true,
           content: {
               "application/json": {
                   schema: { $ref: "#/components/schemas/PatchMemberInviteUserDTO" }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/MemberInvitePatchSuccess' }
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
  member_controller.patchMemberLink.bind(member_controller),
);
// Delete (/:id_member) : Delete a member
member_routes.delete(
  "/:id_member",
  /* #swagger.summary = 'Delete a member'
      #swagger.tags = ['Members']
      #swagger.parameters['id_member'] = { $ref: '#/components/parameters/MemberId' }
      #swagger.responses[200] = { $ref: '#/components/responses/MemberDeleteSuccess' }
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
  member_controller.deleteMember.bind(member_controller),
);
// Delete (/:id_member/link) : Delete a link between member and user
member_routes.delete(
  "/:id_member/link",
  /* #swagger.summary = 'Delete a link between member and user'
       #swagger.tags = ['Members']
       #swagger.parameters['id_member'] = { $ref: '#/components/parameters/MemberId' }
       #swagger.responses[200] = { $ref: '#/components/responses/MemberLinkDeleteSuccess' }
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
  member_controller.deleteMemberLink.bind(member_controller),
);
