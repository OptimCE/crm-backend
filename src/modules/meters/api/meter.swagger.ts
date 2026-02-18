export const MeterParameters = {
  MeterId: {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "string" },
    description: "ID (EAN or Meter Number) of the meter",
    example: "541448800000000000",
  },
  MeterPartialQuery: {
    name: "filters",
    in: "query",
    description: "Pagination and filter options for meters",
    required: false,
    schema: { $ref: "#/components/schemas/MeterPartialQuery" },
    style: "form",
    explode: true,
    example: {
      street: "Rue de la Gare",
      city: "Bruxelles",
      postcode: 1000,
      status: 1, // Active
      page: 1,
      limit: 20,
    },
  },
  MeterConsumptionQuery: {
    name: "filters",
    in: "query",
    description: "Date range filters for meter consumptions",
    required: false,
    schema: { $ref: "#/components/schemas/MeterConsumptionQuery" },
    style: "form",
    explode: true,
    example: {
      date_start: "2023-01-01T00:00:00Z",
      date_end: "2023-01-31T23:59:59Z",
    },
  },
};

export const MeterResponses = {
  MeterListSuccess: {
    description: "Successful list of meters",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/PartialMeterDTO" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
        example: {
          error_code: 0,
          data: [
            {
              EAN: "541448800000000000",
              meter_number: "12345678",
              status: 1, // Active
              address: {
                street: "Rue de la Gare",
                number: "10",
                city: "Bruxelles",
                zip_code: "1000",
                country: "Belgium",
              },
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
          },
        },
      },
    },
  },
  MeterGetSuccess: {
    description: "Successful meter retrieval",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: { $ref: "#/components/schemas/MetersDTO" },
        },
        example: {
          error_code: 0,
          data: {
            EAN: "541448800000000000",
            meter_number: "12345678",
            phases_number: 3,
            reading_frequency: 1, // Yearly
            tarif_group: 0,
            address: {
              street: "Rue de la Gare",
              number: "10",
              city: "Bruxelles",
              zip_code: "1000",
              country: "Belgium",
            },
            meter_data: {
              id: 1,
              description: "Compteur principal",
              status: 1, // Active
              client_type: 1, // Residential
              rate: 1, // Simple
              start_date: "2023-01-01T00:00:00Z",
            },
          },
        },
      },
    },
  },
  MeterConsumptionsGetSuccess: {
    description: "Successful meter consumptions retrieval",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: { $ref: "#/components/schemas/MeterConsumptionDTO" },
        },
        example: {
          error_code: 0,
          data: {
            EAN: "541448800000000000",
            timestamps: ["2023-01-01T00:00:00Z", "2023-01-01T00:15:00Z"],
            gross: [0.5, 0.6],
            net: [0.5, 0.6],
            shared: [0.0, 0.0],
            inj_gross: [0.0, 0.0],
            inj_net: [0.0, 0.0],
            inj_shared: [0.0, 0.0],
          },
        },
      },
    },
  },
  MeterConsumptionsDownloadSuccess: {
    description: "Successful meter consumptions download",
    content: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
        schema: {
          type: "string",
          format: "binary",
        },
      },
    },
  },
  MeterAddSuccess: {
    description: "Meter successfully added",
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
  MeterDataPatchSuccess: {
    description: "Meter data successfully patched",
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
  MeterDeleteSuccess: {
    description: "Meter successfully deleted",
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
