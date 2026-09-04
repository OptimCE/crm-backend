import type { AddressGeoPrecision } from "../../../shared/address/address.types.js";

/**
 * One row in the address picker.
 *
 * Two kinds, because the register is searched in two stages and both stages are
 * useful to a person typing:
 *
 *  - `street` — "Place de la Station, 5000 Namur". No coordinate: the register
 *    stores geometry per address, not per street. Picking one fills the street,
 *    postcode and city, and the user then types the house number.
 *  - `address` — "Place de la Station 20A, 5000 Namur", with a rooftop
 *    coordinate straight from the register.
 *
 * The split is not cosmetic. Querying `/addresses` with a wildcard street name
 * is unbounded — measured at 9.6 s nationwide for `*Chauss*`, against a 3 s
 * gateway timeout — while `/streets` is bounded (0.47 s for a pattern matching
 * 142 346 streets) because there are ~200k streets and ~6.4M addresses.
 */
export type AddressSuggestionKind = "street" | "address";

export interface AddressSuggestion {
  /**
   * Opaque, stable, and unique within one response. This is the picker's
   * `dataKey` — deliberately NOT `best_address_id`, which is absent on
   * street-level rows and on anything the fallback provider returns.
   */
  id: string;
  kind: AddressSuggestionKind;
  /** Ready to render. The backend owns formatting so the picker stays dumb. */
  label: string;
  street: string;
  /** Absent on a street-level suggestion. */
  number?: string;
  postcode: string;
  city: string;
  /** ISO-3166-1 alpha-2. Always BE from the register. */
  country: string;
  latitude?: number;
  longitude?: number;
  precision?: AddressGeoPrecision;
  /** The register's stable object id, when this came from the register. */
  best_address_id?: string;
  /**
   * NIS code of the municipality. The register carries it natively and it is
   * the same key the local `municipality` table is built on, so a suggestion
   * joins to existing reference data with no name matching.
   */
  nis_code?: number;
}

/** What a query was understood to mean. */
export interface ParsedAddressQuery {
  /** The part treated as a street name. Empty when the query was only a postcode. */
  street: string;
  /** A four-digit Belgian postal code, if one was typed. */
  postcode?: string;
  /** A house number, if the query ended in something that looks like one. */
  number?: string;
}
