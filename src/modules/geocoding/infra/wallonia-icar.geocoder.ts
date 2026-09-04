import type { AddressGeoPrecision } from "../../../shared/address/address.types.js";
import { call } from "../../../shared/services/api_call.js";
import logger from "../../../shared/monitor/logger.js";
import type { IMunicipalityRepository } from "../../municipalities/domain/i-municipality.repository.js";
import type { IGeocoder } from "../domain/i-geocoder.js";
import type { GeocodeRequest, GeocodeResult } from "../domain/geocoding.types.js";
import { asRecord, extractGeoJsonPoint, isPlausibleBelgianPoint, precisionFromLabel, round6 } from "./geocode.parsing.js";

/**
 * Walloon addresses, via the SPW's public ICAR/PICC geocoder.
 *
 * Free and public, no key. Two things about it are load-bearing:
 *
 *  - `crs=EPSG:4326` is MANDATORY. The service defaults to Lambert 72
 *    (EPSG:31370), whose coordinates are valid numbers that plot nowhere near
 *    Belgium. {@link isPlausibleBelgianPoint} is the backstop if the parameter
 *    is ever ignored.
 *  - It only knows Wallonia, so {@link supports} declines anything else from the
 *    local municipality table instead of spending an HTTP call to be told no.
 */
export class WalloniaIcarGeocoder implements IGeocoder {
  readonly id = "wallonia_icar";

  constructor(
    private readonly municipalityRepository: IMunicipalityRepository,
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {}

  async supports(request: GeocodeRequest): Promise<boolean> {
    const candidates = await this.municipalityRepository.findByPostalCode(request.postcode);
    return candidates.some((m) => (m.region_fr ?? "").toLowerCase().includes("wallon"));
  }

  async geocode(request: GeocodeRequest): Promise<GeocodeResult | null> {
    const payload = await call<unknown>({
      method: "GET",
      url: `${this.baseUrl.replace(/\/+$/, "")}/geocode`,
      timeout: this.timeoutMs,
      params: {
        street: request.street,
        house: request.number,
        zone: request.postcode,
        city: request.city,
        crs: "EPSG:4326",
      },
    });

    const point = extractGeoJsonPoint(payload);
    if (!point) {
      return null;
    }

    if (!isPlausibleBelgianPoint(point.latitude, point.longitude)) {
      // Almost certainly a projection mismatch rather than a genuinely foreign
      // address — worth a warning, because it means `crs` stopped working.
      logger.warn(
        { operation: "WalloniaIcarGeocoder", latitude: point.latitude, longitude: point.longitude },
        "ICAR returned a point outside Belgium — check the crs parameter",
      );
      return null;
    }

    return {
      latitude: round6(point.latitude),
      longitude: round6(point.longitude),
      precision: this.precisionOf(payload),
      source: this.id,
    };
  }

  /** ICAR grades a match; without a readable grade we understate to STREET. */
  private precisionOf(payload: unknown): AddressGeoPrecision {
    const record = asRecord(payload);
    const features = record?.["features"];
    const first = Array.isArray(features) && features.length > 0 ? asRecord(features[0]) : record;
    const properties = asRecord(first?.["properties"]) ?? first;
    const label = properties?.["scoreLabel"] ?? properties?.["score"] ?? properties?.["matchType"];
    return precisionFromLabel(typeof label === "string" ? label : null);
  }
}
