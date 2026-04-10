export const CommunityParameters = {
  CommunityId: {
    name: "id_community",
    in: "path",
    required: true,
    schema: { type: "integer" },
    description: "ID of the community",
    example: 1,
  },
  UserId: {
    name: "id_user",
    in: "path",
    required: true,
    schema: { type: "integer" },
    description: "ID of the user",
    example: 42,
  },
  CommunityQuery: {
    name: "filters",
    in: "query",
    description: "Pagination and sort options for communities",
    required: false,
    schema: { $ref: "#/components/schemas/CommunityQueryDTO" },
    style: "form",
    explode: true,
    example: {
      name: "Résidence",
      sort_name: "ASC",
      page: 1,
      limit: 10,
    },
  },
  CommunityUsersQuery: {
    name: "filters",
    in: "query",
    description: "Pagination and filter options for community users",
    required: false,
    schema: { $ref: "#/components/schemas/CommunityUsersQueryDTO" },
    style: "form",
    explode: true,
    example: {
      email: "john.doe",
      role: "member",
      sort_email: "ASC",
    },
  },
  SharingOperationPartialQuery: {
    name: "filters",
    in: "query",
    description: "Pagination and sort options for sharing operations",
    required: false,
    schema: { $ref: "#/components/schemas/SharingOperationPartialQuery" },
    style: "form",
    explode: true,
    example: {
      page: 1,
      limit: 10,
    },
  },
};

export const CommunityResponses = {
  CommunitiesListSuccess: {
    description: "Successful list of all communities with public sharing operations",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/CommunityDTO" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
        example: {
          error_code: 0,
          data: [
            {
              id: 1,
              name: "Test Community",
              logo_url: "https://example.com/logo.png",
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            total_pages: 1,
          },
        },
      },
    },
  },
  CommunityDetailSuccess: {
    description: "Successful community detail response",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: { $ref: "#/components/schemas/CommunityDetailDTO" },
        },
        example: {
          error_code: 0,
          data: {
            id: 1,
            name: "Test Community",
            auth_community_id: "aaaa",
            created_at: "2024-01-01T00:00:00.000Z",
            updated_at: "2024-01-01T00:00:00.000Z",
            member_count: 4,
            description: "A test community description",
          },
        },
      },
    },
  },
  CommunitySharingOperationsSuccess: {
    description: "Successful list of sharing operations for a community",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/SharingOperationPartialDTO" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
        example: {
          error_code: 0,
          data: [
            {
              id: 1,
              name: "Public Solar Sharing",
              type: 1,
              is_public: true,
              created_at: "2024-01-01T00:00:00.000Z",
              updated_at: "2024-01-01T00:00:00.000Z",
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            total_pages: 1,
          },
        },
      },
    },
  },
  MyCommunitiesGetSuccess: {
    description: "Successful list of my communities",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/MyCommunityDTO" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
        example: {
          error_code: 0,
          data: [
            {
              id: 1,
              auth_community_id: "auth0|123456",
              name: "Résidence Les Lilas",
              role: "admin",
            },
            {
              id: 2,
              auth_community_id: "auth0|789012",
              name: "Immeuble Central",
              role: "member",
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
          },
        },
      },
    },
  },
  CommunityUsersGetSuccess: {
    description: "Successful list of community users",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/UsersCommunityDTO" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
        example: {
          error_code: 0,
          data: [
            {
              id_user: 101,
              id_community: 1,
              email: "jane.doe@example.com",
              role: "gestionnaire",
            },
            {
              id_user: 102,
              id_community: 1,
              email: "bob.smith@example.com",
              role: "member",
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
          },
        },
      },
    },
  },
  CommunityAdminsGetSuccess: {
    description: "Successful list of community admins & managers",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/UsersCommunityDTO" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
        example: {
          error_code: 0,
          data: [
            {
              id_user: 101,
              id_community: 1,
              email: "jane.doe@example.com",
              role: "gestionnaire",
            },
            {
              id_user: 105,
              id_community: 1,
              email: "admin.user@example.com",
              role: "admin",
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
          },
        },
      },
    },
  },
  CommunityCreateSuccess: {
    description: "Community successfully created",
    content: {
      "application/json": {
        schema: {
          data: { type: "string", example: "success" },
        },
        example: {
          data: "success",
        },
      },
    },
  },
  CommunityUpdateSuccess: {
    description: "Community successfully updated",
    content: {
      "application/json": {
        schema: {
          data: { type: "string", example: "success" },
        },
        example: {
          data: "success",
        },
      },
    },
  },
  CommunityRolePatchSuccess: {
    description: "User role in community successfully patched",
    content: {
      "application/json": {
        schema: {
          data: { type: "string", example: "success" },
        },
        example: {
          data: "success",
        },
      },
    },
  },
  CommunityLeaveSuccess: {
    description: "Successfully left the community",
    content: {
      "application/json": {
        schema: {
          data: { type: "string", example: "success" },
        },
        example: {
          data: "success",
        },
      },
    },
  },
  CommunityKickSuccess: {
    description: "User successfully kicked from the community",
    content: {
      "application/json": {
        schema: {
          data: { type: "string", example: "success" },
        },
        example: {
          data: "success",
        },
      },
    },
  },
  CommunityDeleteSuccess: {
    description: "Community successfully deleted",
    content: {
      "application/json": {
        schema: {
          data: { type: "string", example: "success" },
        },
        example: {
          data: "success",
        },
      },
    },
  },
};
