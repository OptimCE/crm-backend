export const MunicipalityParameters = {
  MunicipalitySearchQuery: {
    name: "filters",
    in: "query",
    description: "Pagination and filter options for the municipality reference table",
    required: false,
    schema: { $ref: "#/components/schemas/MunicipalitySearchQuery" },
    style: "form",
    explode: true,
    example: {
      name: "Bruxelles",
      postal_code: "1000",
      page: 1,
      limit: 20,
    },
  },
  MunicipalityGeometryQuery: {
    name: "filters",
    in: "query",
    description: "NIS codes to return geometry for, plus the simplification tolerance",
    required: true,
    schema: { $ref: "#/components/schemas/MunicipalityGeometryQuery" },
    style: "form",
    explode: true,
    example: {
      nis_codes: "21004,21009,25112",
      tolerance: 0.0005,
    },
  },
};

export const MunicipalityResponses = {
  MunicipalitySearchSuccess: {
    description: "Successful municipality search",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/MunicipalityPartialDTO" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
        example: {
          error_code: 0,
          data: [
            {
              nis_code: 21004,
              fr_name: "Bruxelles",
              nl_name: "Brussel",
              de_name: null,
              region_fr: "Région de Bruxelles-Capitale",
              postal_codes: ["1000", "1020", "1040", "1050"],
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
        },
      },
    },
  },
  MunicipalityGeometrySuccess: {
    description: "Simplified GeoJSON geometry for the requested municipalities",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/MunicipalityGeometryDTO" },
          },
        },
        example: {
          error_code: 0,
          data: [
            {
              nis_code: 21004,
              fr_name: "Bruxelles",
              geo_point: { type: "Point", coordinates: [4.375236, 50.872973] },
              geo_shape: {
                type: "Polygon",
                coordinates: [
                  [
                    [4.368121, 50.814865],
                    [4.369141, 50.810554],
                    [4.368121, 50.814865],
                  ],
                ],
              },
              tolerance: 0.0005,
              original_points: 4821,
              simplified_points: 312,
            },
          ],
        },
      },
    },
  },
};
