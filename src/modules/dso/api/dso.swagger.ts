export const DsoParameters = {
  DsoResolveQuery: {
    in: "query",
    name: "filters",
    schema: {
      type: "object",
      properties: {
        nis_code: { type: "integer", minimum: 1, maximum: 99999, example: 92094 },
        postcode: { type: "string", maxLength: 8, example: "5020" },
        city: { type: "string", maxLength: 128, example: "Namur" },
        post_name: { type: "string", maxLength: 128, example: "Flawinne" },
        ins: { type: "string", pattern: "^[0-9]{5}$", example: "92094" },
        section: { type: "string", maxLength: 64, example: "flawinne" },
        ean: { type: "string", maxLength: 32, example: "541448200000000008" },
      },
    },
    description:
      "nis_code + post_name come from the address picker and win over postcode + city. ins + section come back from a previous choose_commune / choose_section answer.",
  },
};

export const DsoResponses = {
  DsoOperatorsSuccess: {
    description: "The DSO catalogue, DSOs first and Elia last. Empty when the lookup service is off.",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: { type: "array", items: { $ref: "#/components/schemas/DsoOperatorDTO" } },
        },
        example: {
          error_code: 0,
          data: [
            {
              id: "ores",
              kind: "grd",
              name: "ORES",
              legal_name: "ORES Assets",
              region: "WAL",
              elec: true,
              gas: true,
              website: "https://www.ores.be",
              regulator: "BE-WAL-CWAPE",
              tariffs_url: "https://www.ores.be/tarifs",
              lookup: true,
              replaced_by: null,
            },
          ],
        },
      },
    },
  },
  DsoResolveSuccess: {
    description: "The DSO at the address, a choice to make, or `unavailable` when the lookup service could not be asked",
    content: {
      "application/json": {
        schema: {
          error_code: 0,
          data: { $ref: "#/components/schemas/DsoResolutionDTO" },
        },
        example: {
          error_code: 0,
          data: {
            available: true,
            status: "ok",
            result: {
              ins: "57093",
              commune: { fr: "Tournai", nl: "Doornik", de: "Tournai" },
              section: null,
              region: "WAL",
              regulator: "BE-WAL-CWAPE",
              elec: { operator: "ores", designated: "ores" },
              gas: { status: "designated", operator: "ores" },
              flags: [],
              note: null,
              source_ids: ["cwape-ores-2024"],
              valid_from: null,
              data_version: "2026.10.0",
            },
            warnings: [],
            data_version: "2026.10.0",
            ean_check: { format: true, belgian_prefix: true, gs1_check: true, known_operator: null },
          },
        },
      },
    },
  },
};
