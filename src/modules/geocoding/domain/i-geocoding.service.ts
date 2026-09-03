import type { QueryRunner } from "typeorm";
import type { AddressPreviewDTO, GeocodeBackfillResultDTO } from "../api/geocoding.dtos.js";
import type { AddressSuggestion } from "./address-suggestion.types.js";
import type { GeocodeRequest, GeocoderChain } from "./geocoding.types.js";

export interface IGeocodingService {
  /**
   * Best-effort: resolve `request` and stamp the result onto the address.
   *
   * NEVER throws and never rethrows — geocoding is a side effect of a business
   * write, and a third party being unreachable must not cost the caller their
   * meter. Callers inside a transaction pass their `query_runner`; the write is
   * wrapped in a SAVEPOINT so a failure here cannot abort it.
   *
   * @returns true when a coordinate was stored.
   */
  geocodeAddress(address_id: number, request: GeocodeRequest, chain: GeocoderChain, query_runner?: QueryRunner): Promise<boolean>;

  /**
   * Process a batch of never-attempted addresses through the full chain.
   * Idempotent and re-runnable; loop until `remaining` is 0.
   */
  runBackfill(limit: number): Promise<GeocodeBackfillResultDTO>;

  /**
   * Address suggestions for free text.
   *
   * NEVER throws, and returns `[]` when the feature is off or the provider is
   * unreachable. This sits behind an autocomplete in six forms that must stay
   * usable without it: the picker is advisory, never a gate.
   */
  suggest(query: string, limit: number, lang: string): Promise<AddressSuggestion[]>;

  /**
   * Can this address be located, WITHOUT writing anything?
   *
   * Powers the pre-save warning: the user is told before they save whether the
   * address they typed will appear on the map, and can save anyway. Runs the
   * inline chain, so it is local-only and safe inside the gateway budget.
   */
  preview(request: GeocodeRequest, lang: string): Promise<AddressPreviewDTO>;
}
