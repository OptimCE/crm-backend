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
  MeAllocationSharesFilters: {
    name: "filters",
    in: "query",
    required: false,
    description: "Evaluation date for the key-validity and meter-ownership windows",
    schema: { $ref: "#/components/schemas/MeAllocationSharesQuery" },
    style: "form",
    explode: true,
    example: { at: "2026-06-15" },
  },
  MeEnergySummaryFilters: {
    name: "filters",
    in: "query",
    required: false,
    description: "Calendar month to summarise (`YYYY-MM`). Defaults to the last closed month.",
    schema: { $ref: "#/components/schemas/MeEnergySummaryQuery" },
    style: "form",
    explode: true,
    example: { month: "2026-07" },
  },
};

export const MeResponses = {
  MeMetersMapSuccess: {
    description: "Plottable meters owned by this user, plus the coverage counters",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: { $ref: "#/components/schemas/MeterMapDTO" },
        },
        example: {
          error_code: 0,
          data: {
            points: [
              {
                EAN: "541448800000000000",
                latitude: 50.8467,
                longitude: 4.3525,
                geo_precision: 2,
                status: 1,
                injection_status: null,
                holder_name: "Dupont SPRL",
                sharing_operation_id: 1,
                sharing_operation_name: "Partage Nord",
                community_name: "Communaute Test",
              },
            ],
            total_matching: 3,
            total_plottable: 2,
            missing_coordinates: 1,
            truncated: false,
            cap: 2000,
          },
        },
      },
    },
  },
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
              supplement: "A",
              city: "Brussels",
              postcode: "1000",
              country: "BE",
            },
            billing_address: {
              street: "Rue de la Gare",
              number: "10",
              supplement: "A",
              city: "Brussels",
              postcode: "1000",
              country: "BE",
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
                supplement: null,
                city: "Brussels",
                postcode: "1000",
                country: "BE",
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
              supplement: null,
              city: "Brussels",
              postcode: "1000",
              country: "BE",
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
  MeAllocationSharesSuccess: {
    description: "Successful own allocation-shares response",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: { $ref: "#/components/schemas/MeAllocationSharesDTO" },
        },
        // All three outcomes side by side: matched, prorata, and unmatched.
        // The last one is the contract the client must not render as "0 %".
        example: {
          error_code: 0,
          data: {
            at: "2026-06-15",
            shares: [
              {
                community: { id: 1, name: "Test Community", logo_url: null },
                sharing_operation: { id: 1, name: "Private Local Sharing", type: 1 },
                ean: "541448200000000001",
                member: { id: 4, name: "Member Four" },
                holding_start_date: "2024-01-01",
                holding_end_date: null,
                key: { id: 1, name: "Key A", start_date: "2024-01-01", end_date: null },
                matched: true,
                match_basis: "ean_consumer_name",
                is_prorata: false,
                effective_share: 0.4,
                iterations: [
                  { iteration_id: 1, iteration_number: 0, iteration_share: 0.6, consumer_share: 0.5, is_prorata: false, contribution: 0.3 },
                  { iteration_id: 2, iteration_number: 1, iteration_share: 0.4, consumer_share: 0.25, is_prorata: false, contribution: 0.1 },
                ],
              },
              {
                community: { id: 1, name: "Test Community", logo_url: null },
                sharing_operation: { id: 2, name: "Public Wind Sharing", type: 2 },
                ean: "541448200000000002",
                member: { id: 5, name: "Member Five" },
                holding_start_date: "2024-01-01",
                holding_end_date: null,
                key: { id: 2, name: "Key B", start_date: "2024-01-01", end_date: null },
                matched: true,
                match_basis: "ean_consumer_name",
                is_prorata: true,
                effective_share: null,
                iterations: [{ iteration_id: 3, iteration_number: 0, iteration_share: 1, consumer_share: -1, is_prorata: true, contribution: null }],
              },
              {
                community: { id: 2, name: "Second Community", logo_url: null },
                sharing_operation: { id: 3, name: "Neighbourhood Sharing", type: 1 },
                ean: "541448200000000003",
                member: { id: 3, name: "Member Three" },
                holding_start_date: "2024-01-01",
                holding_end_date: null,
                key: { id: 3, name: "Key C", start_date: "2024-01-01", end_date: null },
                matched: false,
                match_basis: null,
                is_prorata: false,
                effective_share: null,
                iterations: [{ iteration_id: 4, iteration_number: 0, iteration_share: 1, consumer_share: null, is_prorata: false, contribution: 0 }],
              },
            ],
          },
        },
      },
    },
  },
  MeEnergySummarySuccess: {
    description: "Successful own energy-summary response",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: { $ref: "#/components/schemas/MeEnergySummaryDTO" },
        },
        // Two meters in two different communities, which is the shape the user
        // dashboard renders. A meter with no readings in the window is ABSENT
        // from `meters` rather than present with zeroes.
        example: {
          error_code: 0,
          data: {
            period: { start: "2026-07-01", end: "2026-07-31" },
            totals: { gross_kwh: 312.4, shared_kwh: 96.15, inj_gross_kwh: 0, inj_shared_kwh: 0 },
            meters: [
              {
                ean: "541448200000000001",
                meter_number: "M-0001",
                community: { id: 1, name: "Test Community", logo_url: null },
                totals: { gross_kwh: 208.2, shared_kwh: 61.4, inj_gross_kwh: 0, inj_shared_kwh: 0 },
                has_data: true,
              },
              {
                ean: "541448200000000003",
                meter_number: "M-0003",
                community: { id: 2, name: "Second Community", logo_url: null },
                totals: { gross_kwh: 104.2, shared_kwh: 34.75, inj_gross_kwh: 0, inj_shared_kwh: 0 },
                has_data: true,
              },
            ],
          },
        },
      },
    },
  },
};
