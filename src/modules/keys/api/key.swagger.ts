export const KeyParameters = {
  KeyId: {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "integer" },
    description: "ID of the key",
    example: 10,
  },
  KeyQuery: {
    name: "filters",
    in: "query",
    description: "Pagination and filter options for keys",
    required: false,
    schema: { $ref: "#/components/schemas/KeyPartialQuery" },
    style: "form",
    explode: true,
    example: {
      name: "Clef",
      description: "Distribution",
      sort_name: "ASC",
      page: 1,
      limit: 20,
    },
  },
};

export const KeyResponses = {
  KeyListSuccess: {
    description: "Successful list of keys",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/KeyPartialDTO" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
        example: {
          error_code: 0,
          data: [
            {
              id: 10,
              name: "Clef de répartition 2023",
              description: "Répartition pour l'année 2023",
            },
            {
              id: 11,
              name: "Clef par défaut",
              description: "Répartition standard",
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
          },
        },
      },
    },
  },
  KeyGetSuccess: {
    description: "Successful key retrieval",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: { $ref: "#/components/schemas/KeyDTO" },
        },
        example: {
          error_code: 0,
          data: {
            id: 10,
            name: "Clef de répartition 2023",
            description: "Répartition pour l'année 2023",
            iterations: [
              {
                id: 100,
                number: 0,
                energy_allocated_percentage: 1.0,
                consumers: [
                  {
                    id: 1001,
                    name: "Appartement 1",
                    energy_allocated_percentage: 0.5,
                  },
                  {
                    id: 1002,
                    name: "Appartement 2",
                    energy_allocated_percentage: 0.5,
                  },
                ],
              },
            ],
          },
        },
      },
    },
  },
  KeyDownloadSuccess: {
    description: "Successful key download retrieval",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: { $ref: "#/components/schemas/KeyDTO" },
        },
        example: {
          error_code: 0,
          data: {
            id: 10,
            name: "Clef de répartition 2023",
            description: "Répartition pour l'année 2023",
            iterations: [
              {
                id: 100,
                number: 0,
                energy_allocated_percentage: 1.0,
                consumers: [
                  {
                    id: 1001,
                    name: "Appartement 1",
                    energy_allocated_percentage: 0.5,
                  },
                ],
              },
            ],
          },
        },
      },
    },
  },
  KeyCreateSuccess: {
    description: "Key successfully created",
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
  KeyUpdateSuccess: {
    description: "Key successfully updated",
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
  KeyDeleteSuccess: {
    description: "Key successfully deleted",
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
