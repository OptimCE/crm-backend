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
   * House number as text — `12A`, `12-14`, `1/3` are all real BeSt entries.
   *
   * This closes IMPLEMENTATION_PLAN.md Appendix A.2 #4. The old TODO here
   * predicted that only this field and the adapters' `String(...)` calls would
   * change; it was wrong by one — `toGeocodeRequest` in geocoding.service.ts
   * declares the shape a second time and had to move with it.
   */
  number: string;
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
