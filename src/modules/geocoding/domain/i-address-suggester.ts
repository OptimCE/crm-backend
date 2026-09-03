import type { AddressSuggestion } from "./address-suggestion.types.js";

/** Container token. Unbound means the feature is off — see the factory. */
export const ADDRESS_SUGGESTER_TOKEN = "AddressSuggester";

/**
 * Turns free text into pickable addresses.
 *
 * Implementations must never throw for "nothing matched" — that is an empty
 * array. Throwing is reserved for genuine faults, and the service turns those
 * into an empty list too: an address picker that is merely advisory must never
 * be able to break the form it sits in.
 */
export interface IAddressSuggester {
  readonly id: string;
  /**
   * @param query free text as typed
   * @param limit maximum rows to return
   * @param lang  `fr` | `nl` | `de` — which of the register's names to show
   */
  suggest(query: string, limit: number, lang: string): Promise<AddressSuggestion[]>;
}
