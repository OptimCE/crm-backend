export const MemberParameters = {
  MemberFilters: {
    name: "filters",
    in: "query",
    description: "Pagination and Filter options",
    required: false,
    schema: { $ref: "#/components/schemas/MemberPartialQuery" },
    style: "form",
    explode: true,
    example: {
      name: "Dupont",
      member_type: 1,
      status: 1,
      sort_name: "ASC",
      page: 1,
      limit: 15,
    },
  },
  MemberId: {
    name: "id_member",
    in: "path",
    required: true,
    schema: { type: "integer" },
    description: "ID of the member",
    example: 42,
  },
};

export const MemberResponses = {
  PaginatedMembers: {
    description: "Successful list of members",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/MembersPartialDTO" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
        example: {
          error_code: 0,
          data: [
            {
              id: 42,
              name: "Jean Dupont",
              member_type: 1,
              status: 1,
            },
            {
              id: 43,
              name: "SPRL Immobilière",
              member_type: 2,
              status: 1,
            },
          ],
          pagination: {
            page: 1,
            limit: 15,
            total: 2,
          },
        },
      },
    },
  },
  MemberGetSuccess: {
    description: "Successful member details",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: { $ref: "#/components/schemas/MemberDTO" },
        },
        example: {
          error_code: 0,
          data: {
            id: 42,
            name: "Jean Dupont",
            member_type: 1,
            status: 1,
            iban: "BE12345678901234",
            NRN: "80010112345",
            first_name: "Jean",
            email: "jean.dupont@example.com",
            phone_number: "+32470123456",
            social_rate: false,
            home_address: {
              street: "Rue de la Gare",
              number: "10",
              box: "A",
              city: "Brussels",
              zip_code: "1000",
              country: "Belgium",
            },
            billing_address: {
              street: "Rue de la Gare",
              number: "10",
              box: "A",
              city: "Brussels",
              zip_code: "1000",
              country: "Belgium",
            },
          },
        },
      },
    },
  },
  MemberLinkGetSuccess: {
    description: "Successful member link status",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: { $ref: "#/components/schemas/MemberLinkDTO" },
        },
        example: {
          error_code: 0,
          data: {
            user_email: "jean.dupont@example.com",
            user_id: 101,
            status: 1,
          },
        },
      },
    },
  },
  MemberCreateSuccess: {
    description: "Member successfully created",
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
  MemberUpdateSuccess: {
    description: "Member successfully updated",
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
  MemberStatusPatchSuccess: {
    description: "Member status successfully patched",
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
  MemberInvitePatchSuccess: {
    description: "Member invite user successfully done",
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
  MemberDeleteSuccess: {
    description: "Member successfully deleted",
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
  MemberLinkDeleteSuccess: {
    description: "Member link successfully deleted",
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
