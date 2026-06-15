import express from "express";
import { lazyController } from "../../../container/lazy-controller.js";
import { idChecker } from "../../../shared/middlewares/user.check.middleware.js";
import { NotificationController } from "./notification.controller.js";

export const notification_routes = express.Router();
const notification_controller = lazyController<NotificationController>(NotificationController);

// Notifications are recipient-scoped: only authentication is required. There is
// deliberately no community or role gate — a user can have notifications outside
// any community. Literal routes are declared before the parametric "/:id/read"
// so they win the match.

notification_routes.get(
  "/unread-count",
  /* #swagger.summary = 'Unread notification count for the current user'
       #swagger.tags = ['Notifications']
       #swagger.responses[200] = { $ref: '#/components/responses/NotificationUnreadCountSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
  idChecker(),
  notification_controller.unreadCount.bind(notification_controller),
);

notification_routes.patch(
  "/read-all",
  /* #swagger.summary = 'Mark all of the current user\'s notifications read'
       #swagger.tags = ['Notifications']
       #swagger.responses[200] = { $ref: '#/components/responses/NotificationMarkReadSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
  idChecker(),
  notification_controller.markAllRead.bind(notification_controller),
);

notification_routes.patch(
  "/:id/read",
  /* #swagger.summary = 'Mark a single notification read'
       #swagger.tags = ['Notifications']
       #swagger.parameters['id'] = { in: 'path', required: true, schema: { type: 'integer' } }
       #swagger.responses[200] = { $ref: '#/components/responses/NotificationMarkReadSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
  idChecker(),
  notification_controller.markRead.bind(notification_controller),
);

notification_routes.get(
  "/",
  /* #swagger.summary = 'List the current user\'s notifications (paginated, newest-first)'
       #swagger.tags = ['Notifications']
       #swagger.responses[200] = { $ref: '#/components/responses/NotificationListSuccess' }
       #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
       #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
       #swagger.security = [{
            "UserIdChecker": []
       }]
    */
  idChecker(),
  notification_controller.list.bind(notification_controller),
);
