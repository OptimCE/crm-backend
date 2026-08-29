/**
 * How good an address's stored coordinate is.
 *
 * Ordered best-to-worst on purpose: the geocoder chain short-circuits with
 * `precision <= threshold`, and the backfill only overwrites a row when it can
 * produce a numerically LOWER value. That ordering is why MANUAL is 1 — a pin a
 * human dropped outranks anything a service returns and must never be
 * overwritten by a later batch.
 */
export enum AddressGeoPrecision {
  /** Placed by hand (pin drop or explicit lat/lon). Never overwritten. */
  MANUAL = 1,
  /** Matched to the building. */
  ROOFTOP = 2,
  /** Matched to the street, not the house number. */
  STREET = 3,
  /** Municipality centroid — the whole commune shares one point. */
  MUNICIPALITY = 4,
}

/**
 * Outcome of the last geocoding attempt on an address.
 *
 * This column is the backfill work queue, not decoration: `NEVER` is what
 * `findPendingGeocode` selects, and the partial index
 * `idx_address_geocode_queue` covers exactly that predicate.
 */
export enum AddressGeocodeStatus {
  /** Never attempted. */
  NEVER = 0,
  /** Coordinates are set. */
  OK = 1,
  /** The geocoders ran and matched nothing. */
  NOT_FOUND = 2,
  /** The geocoders ran and failed. Retryable. */
  ERROR = 3,
}
