import type { AddressGeoPrecision } from "../../../shared/address/address.types.js";
import logger from "../../../shared/monitor/logger.js";
import type { IGeocoder } from "../domain/i-geocoder.js";
import type { GeocodeRequest, GeocodeResult } from "../domain/geocoding.types.js";

/**
 * Runs an ordered list of geocoders and keeps the best answer.
 *
 * "Best" is the numerically lowest {@link AddressGeoPrecision} — MANUAL beats
 * ROOFTOP beats STREET beats MUNICIPALITY — so the chain can be ordered by
 * expected quality and stop early via `stopAtPrecision` without ever settling
 * for a worse result than one it already has.
 *
 * A geocoder that throws is logged and skipped, never propagated. This runs on
 * the request path and on the backfill; in both places a third party being down
 * must degrade to a coarser pin, not fail the caller's write or abort a batch.
 */
export class CompositeGeocoder implements IGeocoder {
  readonly id = "composite";

  constructor(
    private readonly geocoders: readonly IGeocoder[],
    private readonly stopAtPrecision: AddressGeoPrecision,
  ) {}

  async supports(request: GeocodeRequest): Promise<boolean> {
    for (const geocoder of this.geocoders) {
      if (await this.safeSupports(geocoder, request)) {
        return true;
      }
    }
    return false;
  }

  async geocode(request: GeocodeRequest): Promise<GeocodeResult | null> {
    let best: GeocodeResult | null = null;

    for (const geocoder of this.geocoders) {
      if (!(await this.safeSupports(geocoder, request))) {
        continue;
      }

      let result: GeocodeResult | null = null;
      try {
        result = await geocoder.geocode(request);
      } catch (err) {
        logger.warn({ operation: "CompositeGeocoder", geocoder: geocoder.id, error: err }, "Geocoder failed — skipping");
        continue;
      }

      if (result && (best === null || result.precision < best.precision)) {
        best = result;
      }
      if (best !== null && best.precision <= this.stopAtPrecision) {
        return best;
      }
    }

    return best;
  }

  /** `supports` is local and cheap, but it can still touch the DB — never let it break the chain. */
  private async safeSupports(geocoder: IGeocoder, request: GeocodeRequest): Promise<boolean> {
    try {
      return await geocoder.supports(request);
    } catch (err) {
      logger.warn({ operation: "CompositeGeocoder:supports", geocoder: geocoder.id, error: err }, "supports() failed — skipping");
      return false;
    }
  }
}
