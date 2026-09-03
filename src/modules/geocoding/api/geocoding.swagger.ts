export const GeocodingParameters = {
  AddressSuggestQuery: {
    in: "query",
    name: "filters",
    schema: {
      type: "object",
      properties: {
        q: { type: "string", example: "rue de la station 20A 5000" },
        limit: { type: "integer", minimum: 1, maximum: 20, example: 8 },
      },
      required: ["q"],
    },
    description: "Free text as typed. Fewer than 3 usable characters returns an empty list.",
  },
  AddressPreviewQuery: {
    in: "query",
    name: "filters",
    schema: {
      type: "object",
      properties: {
        street: { type: "string", example: "Place de la Station" },
        number: { type: "string", example: "20A" },
        postcode: { type: "string", example: "5000" },
        city: { type: "string", example: "Namur" },
        supplement: { type: "string", example: "B3" },
      },
      required: ["street", "number", "postcode", "city"],
    },
  },
};

export const GeocodingResponses = {
  AddressSuggestSuccess: {
    description: "Pickable addresses, best first",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: { type: "array", items: { $ref: "#/components/schemas/AddressSuggestionDTO" } },
        },
        example: {
          error_code: 0,
          data: [
            {
              id: "geodata.wallonie.be/id/Address/1948446/2",
              kind: "address",
              label: "Place de la Station 20A, 5000 Namur",
              street: "Place de la Station",
              number: "20A",
              postcode: "5000",
              city: "Namur",
              country: "BE",
              latitude: 50.46822,
              longitude: 4.863607,
              precision: 2,
              best_address_id: "geodata.wallonie.be/id/Address/1948446/2",
              nis_code: 92094,
            },
          ],
        },
      },
    },
  },
  AddressPreviewSuccess: {
    description: "Whether the address can be placed on the map",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: { $ref: "#/components/schemas/AddressPreviewDTO" },
        },
        example: {
          error_code: 0,
          data: {
            found: true,
            latitude: 50.46822,
            longitude: 4.863607,
            precision: 2,
            source: "best_address",
            suggestions: [],
          },
        },
      },
    },
  },
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
