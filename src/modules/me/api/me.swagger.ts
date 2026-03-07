export const MeParameters = {
  MeDocumentFilters: {
    name: "filters",
    in: "query",
    description: "Pagination and filter options for documents",
    required: false,
    schema: { $ref: "#/components/schemas/MeDocumentPartialQuery" },
    style: "form",
    explode: true,
    example: {
      file_name: "invoice",
      file_type: "application/pdf",
      sort_upload_date: "DESC",
      page: 1,
      limit: 15,
    },
  },
  MeDocumentId: {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "integer" },
    description: "ID of the document",
    example: 7,
  },
  MeMemberFilters: {
    name: "filters",
    in: "query",
    description: "Pagination and filter options for members",
    required: false,
    schema: { $ref: "#/components/schemas/MeMemberPartialQuery" },
    style: "form",
    explode: true,
    example: {
      name: "Dupont",
      member_type: 1,
      status: 1,
      community_name: "Coopérative",
      sort_name: "ASC",
      page: 1,
      limit: 15,
    },
  },
  MeMemberId: {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "integer" },
    description: "ID of the member",
    example: 42,
  },
  MeMeterFilters: {
    name: "filters",
    in: "query",
    description: "Pagination and filter options for meters",
    required: false,
    schema: { $ref: "#/components/schemas/MeMetersPartialQuery" },
    style: "form",
    explode: true,
    example: {
      street: "Rue de la Gare",
      city: "Brussels",
      EAN: "541448820000000000",
      community_name: "Coopérative",
      page: 1,
      limit: 15,
    },
  },
  MeMeterId: {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "string" },
    description: "EAN code of the meter",
    example: "541448820000000000",
  },
};

export const MeResponses = {
  MeDocumentsListSuccess: {
    description: "Successful list of documents for the authenticated user",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/MeDocumentDTO" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
        example: {
          error_code: 0,
          data: [
            {
              id: 7,
              file_name: "invoice_2024.pdf",
              file_size: 204800,
              upload_date: "2024-03-15T10:30:00.000Z",
              file_type: "application/pdf",
              community: { id: 1, name: "Coopérative Energie" },
            },
          ],
          pagination: { page: 1, limit: 15, total: 1 },
        },
      },
    },
  },
  MeDocumentDownloadSuccess: {
    description: "Document file binary content",
    content: {
      "application/octet-stream": {
        schema: {
          type: "string",
          format: "binary",
        },
      },
    },
  },
  MeMembersListSuccess: {
    description: "Successful list of members represented by the authenticated user",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/MeMembersPartialDTO" },
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
              community: { id: 1, name: "Coopérative Energie" },
            },
            {
              id: 43,
              name: "SPRL Immobilière",
              member_type: 2,
              status: 1,
              community: { id: 2, name: "Solar Community" },
            },
          ],
          pagination: { page: 1, limit: 15, total: 2 },
        },
      },
    },
  },
  MeMemberGetSuccess: {
    description: "Successful member details for the authenticated user",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: {
            oneOf: [{ $ref: "#/components/schemas/MeIndividualDTO" }, { $ref: "#/components/schemas/MeCompanyDTO" }],
          },
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
            community: { id: 1, name: "Coopérative Energie" },
          },
        },
      },
    },
  },
  MeMetersListSuccess: {
    description: "Successful list of meters owned by the authenticated user",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/MePartialMeterDTO" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
        example: {
          error_code: 0,
          data: [
            {
              EAN: "541448820000000001",
              meter_number: "MTR-001",
              address: {
                street: "Rue de la Gare",
                number: "10",
                box: null,
                city: "Brussels",
                zip_code: "1000",
                country: "Belgium",
              },
              holder: { id: 42, name: "Jean Dupont", member_type: 1, status: 1 },
              status: 1,
              community: { id: 1, name: "Coopérative Energie" },
            },
          ],
          pagination: { page: 1, limit: 15, total: 1 },
        },
      },
    },
  },
  MeMeterGetSuccess: {
    description: "Successful meter detail for the authenticated user",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: { $ref: "#/components/schemas/MeMeterDTO" },
        },
        example: {
          error_code: 0,
          data: {
            EAN: "541448820000000001",
            meter_number: "MTR-001",
            address: {
              street: "Rue de la Gare",
              number: "10",
              box: null,
              city: "Brussels",
              zip_code: "1000",
              country: "Belgium",
            },
            holder: { id: 42, name: "Jean Dupont", member_type: 1, status: 1 },
            tarif_group: 1,
            phases_number: 3,
            reading_frequency: 1,
            meter_data: {
              id: 10,
              description: "Standard residential",
              sampling_power: 0,
              status: 1,
              amperage: 25,
              rate: 1,
              client_type: 1,
              start_date: "2023-01-01T00:00:00.000Z",
              end_date: null,
              injection_status: 0,
              production_chain: 0,
              totalGenerating_capacity: 0,
              grd: "Sibelga",
            },
            meter_data_history: [],
            futur_meter_data: [],
            community: { id: 1, name: "Coopérative Energie" },
          },
        },
      },
    },
  },
  MemberInvitationsListSuccess: {
    description: "Successful list of pending member invitations for the authenticated user",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/UserMemberInvitationDTO" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
        example: {
          error_code: 0,
          data: [
            {
              id: 5,
              member_id: 42,
              member_name: "Jean Dupont",
              user_email: "jean.dupont@example.com",
              created_at: "2024-03-01T08:00:00.000Z",
              to_be_encoded: false,
              community: { id: 1, name: "Coopérative Energie" },
            },
          ],
          pagination: { page: 1, limit: 15, total: 1 },
        },
      },
    },
  },
  MemberInvitationByIdSuccess: {
    description: "Successful member invitation details linked to the authenticated user",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: { $ref: "#/components/schemas/UserMemberInvitationDTO" },
        },
        example: {
          error_code: 0,
          data: {
            id: 5,
            member_id: 42,
            member_name: "Jean Dupont",
            user_email: "jean.dupont@example.com",
            created_at: "2024-03-01T08:00:00.000Z",
            to_be_encoded: false,
            community: { id: 1, name: "Coopérative Energie" },
          },
        },
      },
    },
  },
  ManagerInvitationsListSuccess: {
    description: "Successful list of pending manager invitations for the authenticated user",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/UserManagerInvitationDTO" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
        example: {
          error_code: 0,
          data: [
            {
              id: 3,
              user_email: "manager@example.com",
              created_at: "2024-03-10T09:00:00.000Z",
              community: { id: 1, name: "Coopérative Energie" },
            },
          ],
          pagination: { page: 1, limit: 15, total: 1 },
        },
      },
    },
  },
  InvitationSuccess: {
    description: "Invitation action completed successfully",
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
