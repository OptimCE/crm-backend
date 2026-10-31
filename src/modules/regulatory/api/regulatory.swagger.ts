export const RegulatoryParameters = {
  RegulatoryStatusQuery: {
    in: "query",
    name: "filters",
    schema: {
      type: "object",
      required: ["id_sharing_operation"],
      properties: {
        id_sharing_operation: { type: "integer", minimum: 1, example: 12 },
        subject_type: { type: "integer", enum: [1, 2], example: 1, description: "1 meter, 2 key" },
        subject_ref: { type: "string", maxLength: 64, example: "541448200000000008" },
        date: { type: "string", format: "date", example: "2026-11-02" },
      },
    },
    description: "The subjects of one operation (or one of them). With `date`, a subject's episode covering that day wins over its newest.",
  },
};

export const RegulatoryResponses = {
  RegulatoryStatusSuccess: {
    description:
      "One row per subject of the operation the administrative annexe tracks: its latest episode. Empty when the module is not active for the community.",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: { type: "array", items: { $ref: "#/components/schemas/RegulatoryStatusDTO" } },
        },
        example: {
          error_code: 0,
          data: [
            {
              id: "41",
              id_sharing_operation: 12,
              subject_type: 1,
              subject_ref: "541448200000000008",
              regulatory_status: 5,
              valid_from: "2026-11-02",
              valid_to: null,
              regulatory_ref: "17",
              updated_at: "2026-11-02T05:00:12.000Z",
            },
          ],
        },
      },
    },
  },
};
