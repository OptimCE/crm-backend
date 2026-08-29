import type { AddressGeoPrecision } from "../../../shared/address/address.types.js";

/**
 * The address to resolve, decoupled from `CreateAddressDTO` on purpose.
 *
 * Keeping a dedicated request type means the geocoders do not inherit the DTO's
 * validation decorators, and it isolates them from the pending change to the
 * address shape.
 */
export interface GeocodeRequest {
  street: string;
  /**
   * TODO(IMPLEMENTATION_PLAN.md Appendix A.2 #4): `address.number` is an INT and
   * cannot hold "12A". When it widens to a string, only this field and the
   * adapters' `String(request.number)` calls change — they already stringify.
   */
  number: number;
  postcode: string;
  city: string;
  supplement?: string | null;
  /** A hand-placed pin. When both are set, {@link ManualGeocoder} wins outright. */
  latitude?: number | null;
  longitude?: number | null;
}

/** A resolved point plus how good it is and who produced it. */
export interface GeocodeResult {
  latitude: number;
  longitude: number;
  precision: AddressGeoPrecision;
  /** Stored verbatim in `address.geo_source`. Max 32 chars. */
  source: string;
}

/**
 * Which chain to run.
 *
 * `inline` is local-only and runs on the request path; `full` may make network
 * calls and only ever runs from the backfill. See the factory for why the split
 * exists.
 */
export type GeocoderChain = "inline" | "full";

/** Container token for the chain. */
export const GEOCODER_TOKENS: Record<GeocoderChain, string> = {
  inline: "GeocoderInline",
  full: "GeocoderFull",
};
