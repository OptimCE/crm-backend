export const GeocodingParameters = {};

export const GeocodingResponses = {
  GeocodeBackfillSuccess: {
    description: "Backfill batch processed",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: { $ref: "#/components/schemas/GeocodeBackfillResultDTO" },
        },
        example: {
          error_code: 0,
          data: {
            attempted: 100,
            succeeded: 92,
            not_found: 6,
            errored: 2,
            remaining: 418,
          },
        },
      },
    },
  },
};
