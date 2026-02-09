import express from "express";
import { idChecker } from "../../../shared/middlewares/user.check.middleware.js";
import { roleChecker } from "../../../shared/middlewares/role.middleware.js";
import { Role } from "../../../shared/dtos/role.js";
import { container } from "../../../container/di-container.js";
import { CommunityController } from "./community.controller.js";
import { communityIdChecker } from "../../../shared/middlewares/community.check.middleware.js";

export const community_routes = express.Router();
const community_controller = container.get<CommunityController>(CommunityController);

// Get (/) : Get my communities
community_routes.get("/my-communities",
    /* #swagger.summary = 'Get my communities'
       #swagger.tags = ['Communities']
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/CommunityQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/MyCommunitiesGetSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
    idChecker(), community_controller.getMyCommunities.bind(community_controller))
// Get (/users) : Get users of a community
community_routes.get("/users",
    /* #swagger.summary = 'Get users of a community'
       #swagger.tags = ['Communities']
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/CommunityUsersQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/CommunityUsersGetSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": [],
            "MinRoleChecker": []
       }]
    */
    idChecker(), communityIdChecker(), roleChecker(Role.GESTIONNAIRE), community_controller.getUsers.bind(community_controller))
// Get (/admins) : Get admins of a community
community_routes.get("/admins",
    /* #swagger.summary = 'Get admins of a community'
       #swagger.tags = ['Communities']
       #swagger.parameters['filters'] = { $ref: '#/components/parameters/CommunityUsersQuery' }
       #swagger.responses[200] = { $ref: '#/components/responses/CommunityAdminsGetSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": []
       }]
    */
    idChecker(), communityIdChecker(), community_controller.getAdmins.bind(community_controller))
// Post (/) : Create a new community
community_routes.post("/",
    /* #swagger.summary = 'Create a new community'
       #swagger.tags = ['Communities']
       #swagger.requestBody = {
           required: true,
           content: {
               "application/json": {
                   schema: { $ref: "#/components/schemas/CreateCommunityDTO" }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/CommunityCreateSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
    idChecker(), community_controller.createCommunity.bind(community_controller))
// Put (/) : Update a community
community_routes.put("/",
    /* #swagger.summary = 'Update a community'
       #swagger.tags = ['Communities']
       #swagger.requestBody = {
           required: true,
           content: {
               "application/json": {
                   schema: { $ref: "#/components/schemas/CreateCommunityDTO" }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/CommunityUpdateSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": [],
            "MinRoleChecker": []
       }]
    */
    idChecker(), communityIdChecker(), roleChecker(Role.GESTIONNAIRE), community_controller.updateCommunity.bind(community_controller))
// PATCH / : Patch the role of a user
community_routes.patch("/",
    /* #swagger.summary = 'Patch the role of a user'
       #swagger.tags = ['Communities']
       #swagger.requestBody = {
           required: true,
           content: {
               "application/json": {
                   schema: { $ref: "#/components/schemas/PatchRoleUserDTO" }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/CommunityRolePatchSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": [],
            "MinRoleChecker": []
       }]
    */
    idChecker(), communityIdChecker(), roleChecker(Role.GESTIONNAIRE), community_controller.patchRoleUser.bind(community_controller))
// DELETE /leave/:id_community : Leave a community
community_routes.delete("/leave/:id_community",
    /* #swagger.summary = 'Leave a community'
       #swagger.tags = ['Communities']
       #swagger.parameters['id_community'] = { $ref: '#/components/parameters/CommunityId' }
       #swagger.responses[200] = { $ref: '#/components/responses/CommunityLeaveSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "MinRoleChecker": []
       }]
    */
    idChecker(), community_controller.leave.bind(community_controller))
// DELETE /kick/:id_user : Kick a user from a community
community_routes.delete("/kick/:id_user",
    /* #swagger.summary = 'Kick a user from a community'
       #swagger.tags = ['Communities']
       #swagger.parameters['id_user'] = { $ref: '#/components/parameters/UserId' }
       #swagger.responses[200] = { $ref: '#/components/responses/CommunityKickSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": [],
            "MinRoleChecker": []
       }]
    */
    idChecker(), communityIdChecker(), roleChecker(Role.ADMIN), community_controller.kickUser.bind(community_controller))
// DELETE /delete/:id_community : Delete an entire community
community_routes.delete("/delete/:id_community",
    /* #swagger.summary = 'Delete an entire community'
       #swagger.tags = ['Communities']
       #swagger.parameters['id_community'] = { $ref: '#/components/parameters/CommunityId' }
       #swagger.responses[200] = { $ref: '#/components/responses/CommunityDeleteSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
       #swagger.security = [{
            "UserIdChecker": [],
            "CommunityIdChecker": [],
            "MinRoleChecker": []
       }]
    */
    idChecker(), communityIdChecker(), roleChecker(Role.ADMIN), community_controller.deleteCommunity.bind(community_controller));
