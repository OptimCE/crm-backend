import { call } from "../../../shared/services/api_call.js";
import logger from "../../../shared/monitor/logger.js";
import type { IMunicipalityRepository } from "../../municipalities/domain/i-municipality.repository.js";
import type { IGeocoder } from "../domain/i-geocoder.js";
import type { GeocodeRequest, GeocodeResult } from "../domain/geocoding.types.js";
import { asRecord, isPlausibleBelgianPoint, precisionFromLabel, round6 } from "./geocode.parsing.js";

/**
 * Flemish and Brussels addresses, via the Vlaanderen Geolocation API
 * (Basisregisters + UrbIS). Free and public, no key.
 *
 * Unlike ICAR this one answers in WGS84 natively — the fields are literally
 * named `Lat_WGS84` / `Lon_WGS84` — so there is no projection parameter to get
 * wrong. The bounds check stays anyway, because it costs nothing and the class
 * of bug it catches is silent.
 */
export class FlandersBrusselsGeocoder implements IGeocoder {
  readonly id = "flanders_brussels";

  constructor(
    private readonly municipalityRepository: IMunicipalityRepository,
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {}

  async supports(request: GeocodeRequest): Promise<boolean> {
    const candidates = await this.municipalityRepository.findByPostalCode(request.postcode);
    return candidates.some((m) => {
      const region = (m.region_fr ?? "").toLowerCase();
      return region.includes("flamande") || region.includes("bruxelles") || region.includes("vlaams") || region.includes("brussel");
    });
  }

  async geocode(request: GeocodeRequest): Promise<GeocodeResult | null> {
    const payload = await call<unknown>({
      method: "GET",
      url: `${this.baseUrl.replace(/\/+$/, "")}/Location`,
      timeout: this.timeoutMs,
      params: {
        q: `${request.street} ${request.number}, ${request.postcode} ${request.city}`,
        c: 1,
      },
    });

    const first = firstLocationResult(payload);
    if (!first) {
      return null;
    }

    const location = asRecord(first["Location"]);
    const latitude = Number(location?.["Lat_WGS84"]);
    const longitude = Number(location?.["Lon_WGS84"]);

    if (!isPlausibleBelgianPoint(latitude, longitude)) {
      logger.debug({ operation: "FlandersBrusselsGeocoder", latitude, longitude }, "Geolocation API returned no usable point inside Belgium");
      return null;
    }

    const locationType = first["LocationType"];
    return {
      latitude: round6(latitude),
      longitude: round6(longitude),
      precision: precisionFromLabel(typeof locationType === "string" ? locationType : null),
      source: this.id,
    };
  }
}

function firstLocationResult(payload: unknown): Record<string, unknown> | null {
  const results = asRecord(payload)?.["LocationResult"];
  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }
  return asRecord(results[0]);
}
