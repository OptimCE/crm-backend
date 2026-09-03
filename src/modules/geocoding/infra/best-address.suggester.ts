import { AddressGeoPrecision } from "../../../shared/address/address.types.js";
import type { IMunicipalityRepository } from "../../municipalities/domain/i-municipality.repository.js";
import type { AddressSuggestion } from "../domain/address-suggestion.types.js";
import type { IAddressSuggester } from "../domain/i-address-suggester.js";
import type { BestAddress, BestAddressClient, BestStreet } from "./best-address.client.js";
import {
  MIN_SUGGEST_QUERY_LENGTH,
  compareHouseNumbers,
  foldForCompare,
  formatSuggestionLabel,
  parseAddressQuery,
  scoreStreetName,
} from "./suggest.parsing.js";

/**
 * How many ranked streets are expanded into addresses when a house number was
 * typed. Each expansion is one indexed `/addresses` call (~20-80 ms), so this
 * is the knob that trades breadth for latency inside the 3 s gateway budget.
 */
const STREETS_TO_EXPAND = 3;

/**
 * Suggestions from the federal BeSt Address register, via BeSt-in-a-Box.
 *
 * Two stages, and the split is a hard requirement rather than a preference —
 * see {@link BestAddressClient} for the measurements. Stage one searches
 * `/streets`, which is bounded; stage two expands the best few streets through
 * `/addresses?streetId=`, which is an indexed lookup.
 */
export class BestAddressSuggester implements IAddressSuggester {
  readonly id = "best_address";

  constructor(
    private readonly client: BestAddressClient,
    private readonly municipalityRepository: IMunicipalityRepository,
  ) {}

  async suggest(query: string, limit: number, lang: string): Promise<AddressSuggestion[]> {
    const parsed = parseAddressQuery(query);

    // A bare postcode is not enough to search on: `/streets` needs a name, and
    // listing every street in a commune is not a suggestion.
    if (parsed.street.length < MIN_SUGGEST_QUERY_LENGTH) {
      return [];
    }

    const streets = await this.findStreets(parsed.street, parsed.postcode);
    if (streets.length === 0) {
      return [];
    }

    const ranked = streets
      .map((street) => ({ street, score: scoreStreetName(pickName(street.names, lang), parsed.street) }))
      .sort((a, b) => b.score - a.score || pickName(a.street.names, lang).localeCompare(pickName(b.street.names, lang)))
      .map((entry) => entry.street);

    if (parsed.number) {
      const addresses = await this.expand(ranked.slice(0, STREETS_TO_EXPAND), parsed.number, lang);
      // Falling back to street rows rather than returning nothing: the house
      // number may simply not exist yet (a new build), and the street is still
      // the useful half of the answer.
      if (addresses.length > 0) {
        return addresses.slice(0, limit);
      }
    }

    return ranked.slice(0, limit).map((street) => this.toStreetSuggestion(street, lang, parsed.postcode));
  }

  /**
   * Substring first, then fuzzy, then commune-aware.
   *
   * Each step only runs when the previous found nothing, so the common case
   * costs exactly one call.
   */
  private async findStreets(text: string, postcode?: string): Promise<BestStreet[]> {
    const exact = await this.client.searchStreets(text, { postcode });
    if (exact.length > 0) {
      return exact;
    }

    // `*` is anchored, so "rue de la station" misses "Place de la Station".
    // `~` is what makes the wrong street type — or a typo — still land.
    const fuzzy = await this.client.searchStreets(text, { postcode, fuzzy: true });
    if (fuzzy.length > 0) {
      return fuzzy;
    }

    // Last resort: the trailing word may be a commune rather than part of the
    // street ("rue de la loi bruxelles"). The local `municipality` table is the
    // authority for that, and the register indexes on the same NIS code, so
    // this is an exact join rather than a name guess.
    return this.retryWithCommune(text);
  }

  private async retryWithCommune(text: string): Promise<BestStreet[]> {
    const tokens = text.split(/\s+/).filter(Boolean);
    if (tokens.length < 2) {
      return [];
    }
    const candidate = tokens[tokens.length - 1];
    const remainder = tokens.slice(0, -1).join(" ");
    if (remainder.length < MIN_SUGGEST_QUERY_LENGTH) {
      return [];
    }

    const [matches] = await this.municipalityRepository.searchMunicipalities({ page: 1, limit: 5, name: candidate });
    const commune = matches.find((m) => [m.fr_name, m.nl_name, m.de_name].some((name) => foldForCompare(name) === foldForCompare(candidate)));
    if (!commune) {
      return [];
    }

    return this.client.searchStreets(remainder, { nisCode: commune.nis_code });
  }

  private async expand(streets: BestStreet[], houseNumber: string, lang: string): Promise<AddressSuggestion[]> {
    const pages = await Promise.all(
      streets.map(async (street) => {
        try {
          return await this.client.addressesOfStreet(street.id, houseNumber);
        } catch {
          // One street failing must not lose the others. The service above
          // turns a total failure into an empty list.
          return [];
        }
      }),
    );

    return pages
      .flat()
      .sort((a, b) => compareHouseNumbers(a.houseNumber, b.houseNumber))
      .map((address) => this.toAddressSuggestion(address, lang));
  }

  private toStreetSuggestion(street: BestStreet, lang: string, postcode?: string): AddressSuggestion {
    const name = pickName(street.names, lang);
    const city = pickName(street.municipalityNames, lang);
    return {
      id: street.id,
      kind: "street",
      label: formatSuggestionLabel({ street: name, postcode: postcode ?? "", city }),
      street: name,
      postcode: postcode ?? "",
      city,
      country: "BE",
      nis_code: street.nisCode,
    };
  }

  private toAddressSuggestion(address: BestAddress, lang: string): AddressSuggestion {
    const street = pickName(address.streetNames, lang);
    const city = pickName(address.municipalityNames, lang);
    const located = address.latitude !== undefined && address.longitude !== undefined;
    return {
      id: address.id,
      kind: "address",
      label: formatSuggestionLabel({
        street,
        number: address.houseNumber,
        postcode: address.postcode,
        city,
      }),
      street,
      number: address.houseNumber,
      postcode: address.postcode,
      city,
      country: "BE",
      latitude: address.latitude,
      longitude: address.longitude,
      // ROOFTOP, not MANUAL. MANUAL means "a human placed this pin" and is
      // never overwritten by a later batch; a register coordinate is the best
      // automatic answer there is, but it is still an automatic answer.
      precision: located ? AddressGeoPrecision.ROOFTOP : undefined,
      best_address_id: address.id,
      nis_code: address.nisCode,
    };
  }
}

/**
 * The register carries `{ fr, nl, de }` and fills only what the region uses —
 * a Walloon street has `fr` alone. Fall back rather than render an empty label.
 */
function pickName(names: Record<string, string>, lang: string): string {
  return names[lang] ?? names["fr"] ?? names["nl"] ?? names["de"] ?? Object.values(names)[0] ?? "";
}
