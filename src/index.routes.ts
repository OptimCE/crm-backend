import express from "express";
import {key_router} from "./modules/keys/api/key.routes.js";
import {community_routes} from "./modules/communities/api/community.routes.js";
import {member_routes} from "./modules/members/api/member.routes.js";
import {document_router} from "./modules/documents/api/document.routes.js";
import {invitation_routes} from "./modules/invitations/api/invitation.routes.js";
import {meter_router} from "./modules/meters/api/meter.routes.js";
import {sharing_operation_routes} from "./modules/sharing_operations/api/sharing_operation.routes.js";
import {user_router} from "./modules/users/api/user.routes.js";

export const router = express.Router()
router.use("/communities", community_routes);
router.use("/documents", document_router);
router.use("/invitations", invitation_routes);
router.use("/keys", key_router);
router.use("/members", member_routes);
router.use("/meters", meter_router);
router.use("/sharing_operations", sharing_operation_routes);
router.use("/users", user_router);

