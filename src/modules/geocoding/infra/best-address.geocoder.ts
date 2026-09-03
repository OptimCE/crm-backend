import { AddressGeoPrecision } from "../../../shared/address/address.types.js";
import type { IGeocoder } from "../domain/i-geocoder.js";
import type { GeocodeRequest, GeocodeResult } from "../domain/geocoding.types.js";
import type { BestAddressClient } from "./best-address.client.js";
import { isPlausibleBelgianPoint, round6 } from "./geocode.parsing.js";
import { compareHouseNumbers, foldForCompare } from "./suggest.parsing.js";

/**
 * Rooftop coordinates from the federal BeSt Address register, via the local box.
 *
 * The one adapter in this module that is safe on the INLINE chain. The others
 * are third parties reached over the internet, and `geocoding.factory.ts`
 * explains why those cannot sit between a user and `POST /meters`: KrakenD's
 * global timeout is 3000 ms with no per-endpoint override. This one runs on the
 * `backend` Docker network against a container we own, answers an indexed
 * lookup in tens of milliseconds, and is capped well below that budget. If the
 * box is not running, `supports()` says no and the chain falls through to the
 * commune centroid exactly as it does today.
 *
 * That is what upgrades write-time pins from MUNICIPALITY to ROOFTOP.
 */
export class BestAddressGeocoder implements IGeocoder {
  readonly id = "best_address";

  constructor(private readonly client: BestAddressClient) {}

  /**
   * Belgium only, decided locally.
   *
   * The register is national, so unlike the two regional adapters there is no
   * region test to make — but a non-Belgian address must not spend a call to be
   * told no.
   */
  async supports(request: GeocodeRequest): Promise<boolean> {
    return Promise.resolve(/^\d{4}$/.test(request.postcode.trim()));
  }

  async geocode(request: GeocodeRequest): Promise<GeocodeResult | null> {
    const streets = await this.client.searchStreets(request.street, { postcode: request.postcode.trim() });
    if (streets.length === 0) {
      return null;
    }

    // Exact street name first. A substring search for "Rue Neuve" also returns
    // "Rue Neuve-Haute", and silently geocoding to the wrong street is worse
    // than returning nothing — the chain has a commune centroid behind it.
    const wanted = foldForCompare(request.street);
    const street =
      streets.find((s) => Object.values(s.names).some((n) => foldForCompare(n) === wanted)) ?? (streets.length === 1 ? streets[0] : null);
    if (!street) {
      return null;
    }

    const addresses = await this.client.addressesOfStreet(street.id, request.number.trim());
    const located = addresses
      .filter((a) => a.latitude !== undefined && a.longitude !== undefined)
      .sort((a, b) => compareHouseNumbers(a.houseNumber, b.houseNumber));
    const match = located[0];
    if (!match?.latitude || !match.longitude) {
      return null;
    }

    // The register is Belgian, so a point outside Belgium means the payload was
    // misread rather than that the address is foreign. Same backstop the two
    // regional adapters carry, for the same reason: the failure is silent.
    if (!isPlausibleBelgianPoint(match.latitude, match.longitude)) {
      return null;
    }

    return {
      latitude: round6(match.latitude),
      longitude: round6(match.longitude),
      precision: AddressGeoPrecision.ROOFTOP,
      source: this.id,
    };
  }
}
