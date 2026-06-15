export const NotificationResponses = {
  NotificationListSuccess: {
    description: "Paginated list of the current user's notifications (newest-first)",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/NotificationDTO" },
            },
            pagination: { $ref: "#/components/schemas/Pagination" },
            error_code: { type: "integer", example: 0 },
          },
        },
      },
    },
  },
  NotificationUnreadCountSuccess: {
    description: "Unread notification count for the current scope",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            data: { $ref: "#/components/schemas/UnreadCountDTO" },
            error_code: { type: "integer", example: 0 },
          },
        },
      },
    },
  },
  NotificationMarkReadSuccess: {
    description: "Notification(s) marked read",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            data: { type: "string", example: "success" },
            error_code: { type: "integer", example: 0 },
          },
        },
      },
    },
  },
};
