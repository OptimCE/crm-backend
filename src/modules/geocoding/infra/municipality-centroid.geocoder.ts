import { AddressGeoPrecision } from "../../../shared/address/address.types.js";
import logger from "../../../shared/monitor/logger.js";
import type { IMunicipalityRepository } from "../../municipalities/domain/i-municipality.repository.js";
import type { Municipality } from "../../municipalities/domain/municipality.models.js";
import type { IGeocoder } from "../domain/i-geocoder.js";
import type { GeocodeRequest, GeocodeResult } from "../domain/geocoding.types.js";

/** Minimal shape of the GeoJSON Point stored in `municipality.geo_point`. */
interface GeoJsonPoint {
  type: string;
  coordinates: [number, number];
}

/**
 * The floor of every chain: the centroid of the address's commune.
 *
 * Never makes a network call — the geometry is already in `municipality`. It
 * always resolves for a known Belgian postcode, which is what makes a map
 * useful on day one, before any rooftop geocoding has run.
 */
export class MunicipalityCentroidGeocoder implements IGeocoder {
  readonly id = "municipality_centroid";

  constructor(private readonly municipalityRepository: IMunicipalityRepository) {}

  async supports(request: GeocodeRequest): Promise<boolean> {
    return (await this.resolveMunicipality(request)) !== null;
  }

  async geocode(request: GeocodeRequest): Promise<GeocodeResult | null> {
    const municipality = await this.resolveMunicipality(request);
    if (!municipality) {
      return null;
    }

    const point = municipality.geo_point as GeoJsonPoint | null;
    if (!point?.coordinates || point.coordinates.length < 2) {
      return null;
    }

    // GeoJSON is [longitude, latitude]. Getting this backwards puts Belgium in
    // Somalia, and nothing downstream would complain.
    const [longitude, latitude] = point.coordinates;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      latitude: round6(latitude),
      longitude: round6(longitude),
      precision: AddressGeoPrecision.MUNICIPALITY,
      source: this.id,
    };
  }

  /**
   * Resolve the address's commune from its postcode.
   *
   * A Belgian postcode can span several communes (1050 covers both Bruxelles and
   * Ixelles), so an exact-one match is used when available and `city` breaks the
   * tie otherwise. When the tie cannot be broken this returns null rather than
   * averaging the candidates: a point halfway between two communes is in
   * neither, and it would look every bit as authoritative as a real one.
   */
  private async resolveMunicipality(request: GeocodeRequest): Promise<Municipality | null> {
    const candidates = await this.municipalityRepository.findByPostalCode(request.postcode);
    if (candidates.length === 0) {
      return null;
    }
    if (candidates.length === 1) {
      return candidates[0];
    }

    const city = normalize(request.city);
    const matches = candidates.filter((m) => normalize(m.fr_name) === city || normalize(m.nl_name) === city || normalize(m.de_name) === city);

    if (matches.length === 1) {
      return matches[0];
    }

    logger.debug(
      { operation: "MunicipalityCentroidGeocoder", postcode: request.postcode, candidates: candidates.length },
      "Ambiguous postcode and city did not disambiguate — declining rather than averaging centroids",
    );
    return null;
  }
}

function normalize(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  // Strip diacritics so "Liege" matches "Liège" — free-text city fields are
  // typed by humans and rarely carry accents.
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function round6(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
