import config from "config";
import { container } from "../di-container.js";
import logger from "../../shared/monitor/logger.js";
import { AddressGeoPrecision } from "../../shared/address/address.types.js";
import type { IMunicipalityRepository } from "../../modules/municipalities/domain/i-municipality.repository.js";
import type { IGeocoder } from "../../modules/geocoding/domain/i-geocoder.js";
import { GEOCODER_TOKENS } from "../../modules/geocoding/domain/geocoding.types.js";
import { ManualGeocoder } from "../../modules/geocoding/infra/manual.geocoder.js";
import { MunicipalityCentroidGeocoder } from "../../modules/geocoding/infra/municipality-centroid.geocoder.js";
import { WalloniaIcarGeocoder } from "../../modules/geocoding/infra/wallonia-icar.geocoder.js";
import { FlandersBrusselsGeocoder } from "../../modules/geocoding/infra/flanders-brussels.geocoder.js";
import { CompositeGeocoder } from "../../modules/geocoding/infra/composite.geocoder.js";

const DEFAULT_TIMEOUT_MS = 2000;

/**
 * Binds the two geocoder chains.
 *
 * Binds nothing and logs when disabled, rather than throwing — geocoding is a
 * best-effort enrichment and must never stop the service booting. Same posture
 * as cache.factory.ts, deliberately not storage.factory.ts.
 *
 * Two chains, because they run in places with very different latency budgets:
 *
 *  - `GeocoderInline` is local-only (a pin, or one indexed read against
 *    `municipality`). It runs on every address write, and KrakenD's global
 *    gateway timeout is 3000 ms with no per-endpoint override — putting a third
 *    party between the user and `POST /meters` buys a 504 the first time the
 *    SPW has a slow morning.
 *  - `GeocoderFull` may call out, and only ever runs from the backfill, where
 *    nothing is waiting on it. Its job is upgrading MUNICIPALITY pins to
 *    ROOFTOP.
 */
export function initializeGeocodingService(): void {
  const mode: string = (config.has("geocoding.mode") ? config.get<string>("geocoding.mode") : "LOCAL") || "LOCAL";

  if (mode.toUpperCase() === "OFF") {
    logger.info("geocoding.mode=OFF — address geocoding disabled");
    return; // No binding, no error. GeocodingService treats unbound as a no-op.
  }

  const municipalityRepository = container.get<IMunicipalityRepository>("MunicipalityRepository");
  const timeout: number = config.has("geocoding.timeout_ms") ? config.get<number>("geocoding.timeout_ms") : DEFAULT_TIMEOUT_MS;

  const manual = new ManualGeocoder();
  const centroid = new MunicipalityCentroidGeocoder(municipalityRepository);

  // Stops as soon as it has a MUNICIPALITY-or-better point, i.e. immediately.
  container
    .bind<IGeocoder>(GEOCODER_TOKENS.inline)
    .toConstantValue(new CompositeGeocoder([manual, centroid], AddressGeoPrecision.MUNICIPALITY));

  const remote = mode.toUpperCase() === "REMOTE";
  const fullChain: IGeocoder[] = remote
    ? [
        manual,
        new WalloniaIcarGeocoder(municipalityRepository, config.get<string>("geocoding.wallonia.base_url"), timeout),
        new FlandersBrusselsGeocoder(municipalityRepository, config.get<string>("geocoding.flanders.base_url"), timeout),
        centroid,
      ]
    : [manual, centroid];

  // Stops at ROOFTOP: a street-level hit is still worth trying the next adapter
  // for, a rooftop hit is not.
  container.bind<IGeocoder>(GEOCODER_TOKENS.full).toConstantValue(new CompositeGeocoder(fullChain, AddressGeoPrecision.ROOFTOP));

  logger.info({ mode: mode.toUpperCase(), remote }, "Geocoding adapters registered");
}
