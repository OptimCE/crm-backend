import { AddressGeoPrecision } from "../../../shared/address/address.types.js";
import type { IGeocoder } from "../domain/i-geocoder.js";
import type { GeocodeRequest, GeocodeResult } from "../domain/geocoding.types.js";

/**
 * Honours a coordinate the user placed by hand.
 *
 * First in every chain so a pin drop always wins, and it emits
 * {@link AddressGeoPrecision.MANUAL} (numerically the best value), which is what
 * stops a later backfill from overwriting it.
 */
export class ManualGeocoder implements IGeocoder {
  readonly id = "manual";

  supports(request: GeocodeRequest): Promise<boolean> {
    return Promise.resolve(hasPin(request));
  }

  geocode(request: GeocodeRequest): Promise<GeocodeResult | null> {
    if (!hasPin(request)) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      latitude: request.latitude as number,
      longitude: request.longitude as number,
      precision: AddressGeoPrecision.MANUAL,
      source: this.id,
    });
  }
}

function hasPin(request: GeocodeRequest): boolean {
  return (
    typeof request.latitude === "number" &&
    Number.isFinite(request.latitude) &&
    typeof request.longitude === "number" &&
    Number.isFinite(request.longitude)
  );
}
