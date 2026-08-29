import type { GeocodeRequest, GeocodeResult } from "./geocoding.types.js";

/**
 * One way of turning an address into a point.
 *
 * Implementations must be side-effect free and must never throw for a "no
 * match" — that is `null`. Throwing is reserved for genuine faults (network,
 * malformed upstream response), and the composite treats it as "skip me".
 */
export interface IGeocoder {
  /** Stable id, stored in `address.geo_source`. Keep it under 32 characters. */
  readonly id: string;

  /**
   * Whether this geocoder can handle the request at all.
   *
   * Exists so region-scoped adapters can decline without spending an HTTP call:
   * the Walloon service has nothing to say about a Flemish postcode. Cheap,
   * local checks only.
   */
  supports(request: GeocodeRequest): Promise<boolean>;

  /**
   * Resolve the address, or `null` when nothing matched.
   */
  geocode(request: GeocodeRequest): Promise<GeocodeResult | null>;
}
