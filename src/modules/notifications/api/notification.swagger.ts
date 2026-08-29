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
  NotificationPreferencesSuccess: {
    description: "The current user's notification channel preferences, plus the type prefixes they may be expressed against",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            data: { $ref: "#/components/schemas/NotificationPreferencesDTO" },
            error_code: { type: "integer", example: 0 },
          },
        },
      },
    },
  },
  NotificationRealtimeTicketSuccess: {
    description: "A single-use, short-lived ticket for opening the realtime SSE stream",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            data: { $ref: "#/components/schemas/RealtimeTicketDTO" },
            error_code: { type: "integer", example: 0 },
          },
        },
      },
    },
  },
};
