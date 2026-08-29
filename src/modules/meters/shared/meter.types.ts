export enum TarifGroup {
  LOW_TENSION = 1,
  HIGH_TENSION = 2,
}

export enum ReadingFrequency {
  MONTHLY = 1,
  YEARLY = 2,
}

export enum MeterDataStatus {
  ACTIVE = 1,
  INACTIVE = 2,
  WAITING_GRD = 3,
  WAITING_MANAGER = 4,
}

export enum MeterRate {
  SIMPLE = 1,
  BI_HORAIRE = 2,
  EXCLUSIF_NUIT = 3,
}

export enum ClientType {
  RESIDENTIAL = 1,
  PROFESSIONAL = 2,
  INDUSTRIAL = 3,
}

export enum InjectionStatus {
  AUTOPROD_OWNER = 1,
  AUTOPROD_RIGHTS = 2,
  INJECTION_OWNER = 3,
  INJECTION_RIGHTS = 4,
}

export enum ProductionChain {
  PHOTOVOLTAIC = 1,
  WIND = 2,
  HYDRO = 3,
  BIOMASS = 4,
  BIOGAS = 5,
  COGEN_FOSSIL = 6,
  OTHER = 7,
}

/**
 * Hard cap on how many points `GET /meters/map` will return.
 *
 * MapLibre renders far more than this happily; the constraint is the response
 * body crossing KrakenD, which parses and re-serialises it inside a 3000ms
 * global timeout. Exceeding the cap is reported in the body (`truncated`, with
 * `total_matching`) rather than as a 4xx, so the UI can tell the user which
 * filter to tighten instead of showing them an empty map.
 */
export const METER_MAP_MAX_POINTS = 2000;
