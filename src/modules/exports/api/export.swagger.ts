const exportJobExample = {
  id: "6f1c2a7e-3b9d-4c1e-9a52-0d8e4f7b1a23",
  scope: "community",
  community: { auth_community_id: "2c8a0ea5-d597-49d6-ae12-4dceb9e9a018", name: "Test Community" },
  status: "ready",
  locale: "fr",
  requester: { first_name: "Demo", last_name: "User", email: "demo@example.com" },
  is_mine: true,
  can_download: true,
  created_at: "2026-11-15T10:00:00.000Z",
  started_at: "2026-11-15T10:00:01.000Z",
  completed_at: "2026-11-15T10:03:12.000Z",
  expires_at: "2026-11-22T10:03:12.000Z",
  size_bytes: 1834221,
  error_code: null,
};

export const ExportParameters = {
  ExportListQuery: {
    in: "query",
    name: "filters",
    schema: {
      type: "object",
      properties: {
        view: {
          type: "string",
          enum: ["mine", "community"],
          example: "mine",
          description: "mine (default): the caller's own exports. community: every export of the active community, ADMIN only.",
        },
        page: { type: "integer", minimum: 1, example: 1 },
        limit: { type: "integer", minimum: 1, example: 10 },
      },
    },
  },
};

export const ExportResponses = {
  ExportCreated: {
    description: "The export is created (pending) and announced to the worker.",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: { data: { $ref: "#/components/schemas/ExportCreatedDTO" }, error_code: { type: "integer", example: 0 } },
        },
        example: { error_code: 0, data: { export_id: exportJobExample.id, status: "pending" } },
      },
    },
  },
  ExportList: {
    description: "Exports, newest first.",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            data: { type: "array", items: { $ref: "#/components/schemas/ExportJobDTO" } },
            pagination: { $ref: "#/components/schemas/Pagination" },
            error_code: { type: "integer", example: 0 },
          },
        },
        example: { error_code: 0, data: [exportJobExample], pagination: { page: 1, limit: 10, total: 1, total_pages: 1 } },
      },
    },
  },
  ExportDetail: {
    description: "One export, with its parts.",
    content: {
      "application/json": {
        schema: { type: "object", properties: { data: { $ref: "#/components/schemas/ExportJobDTO" }, error_code: { type: "integer", example: 0 } } },
        example: {
          error_code: 0,
          data: { ...exportJobExample, parts: [{ service: "crm", status: "done", updated_at: "2026-11-15T10:02:40.000Z" }] },
        },
      },
    },
  },
  ExportDownloadUrl: {
    description: "A URL to the archive, straight from storage. It works for `expires_in` seconds.",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: { data: { $ref: "#/components/schemas/ExportDownloadUrlDTO" }, error_code: { type: "integer", example: 0 } },
        },
        example: { error_code: 0, data: { url: "https://files.example/exports/archives/...", expires_in: 300 } },
      },
    },
  },
  ExportReauthRequired: {
    description: "35000: the last interactive login is too old. Log in again (Keycloak max_age) and replay the request.",
  },
};
