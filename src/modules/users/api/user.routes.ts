import express from "express";
import { container } from "../../../container/di-container.js";
import { UserController } from "./user.controller.js";
import { idChecker } from "../../../shared/middlewares/user.check.middleware.js";

export const user_router = express.Router();
const user_controller = container.get<UserController>(UserController);

// GET (/) : Get the user profile
user_router.get(
  "/",
  /* #swagger.summary = 'Get the user profile'
       #swagger.tags = ['Users']
       #swagger.responses[200] = { $ref: '#/components/responses/UserGetSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
  idChecker(),
  user_controller.getProfile.bind(user_controller),
);
// PUT (/): Update the user profile
user_router.put(
  "/",
  /* #swagger.summary = 'Update the user profile'
       #swagger.tags = ['Users']
       #swagger.requestBody = {
           required: true,
           content: {
               "application/json": {
                   schema: { $ref: "#/components/schemas/UpdateUserDTO" }
               }
           }
       }
       #swagger.responses[200] = { $ref: '#/components/responses/UserUpdateSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
  idChecker(),
  user_controller.updateProfile.bind(user_controller),
);
