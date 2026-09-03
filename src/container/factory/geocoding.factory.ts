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
import { BestAddressClient } from "../../modules/geocoding/infra/best-address.client.js";
import { BestAddressGeocoder } from "../../modules/geocoding/infra/best-address.geocoder.js";
import { BestAddressSuggester } from "../../modules/geocoding/infra/best-address.suggester.js";
import { ADDRESS_SUGGESTER_TOKEN, type IAddressSuggester } from "../../modules/geocoding/domain/i-address-suggester.js";

const DEFAULT_TIMEOUT_MS = 2000;
const DEFAULT_BEST_TIMEOUT_MS = 1500;

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

  // The BeSt Address register, if a box is configured. It is the ONE network
  // adapter allowed on the inline chain: it is a container we own on the
  // `backend` network answering an indexed lookup in tens of milliseconds, not
  // a third party over the internet. Everything else about the inline chain's
  // 3000 ms budget still holds.
  const bestUrl: string = config.has("geocoding.best.base_url") ? config.get<string>("geocoding.best.base_url") : "";
  const bestTimeout: number = config.has("geocoding.best.timeout_ms") ? config.get<number>("geocoding.best.timeout_ms") : DEFAULT_BEST_TIMEOUT_MS;
  const bestClient = bestUrl ? new BestAddressClient(bestUrl, bestTimeout) : null;
  const best = bestClient ? new BestAddressGeocoder(bestClient) : null;

  // Ordered best-first. `manual` is a hand-placed pin and outranks everything;
  // the register is the best automatic answer; the centroid is the floor.
  const inlineChain: IGeocoder[] = best ? [manual, best, centroid] : [manual, centroid];

  // Stops at ROOFTOP now rather than MUNICIPALITY: with the register present
  // there is a real rooftop answer worth waiting for on the write path, which
  // is what upgrades write-time pins from a commune centre to a building.
  container.bind<IGeocoder>(GEOCODER_TOKENS.inline).toConstantValue(new CompositeGeocoder(inlineChain, AddressGeoPrecision.ROOFTOP));

  const remote = mode.toUpperCase() === "REMOTE";
  const fullChain: IGeocoder[] = remote
    ? [
        manual,
        ...(best ? [best] : []),
        new WalloniaIcarGeocoder(municipalityRepository, config.get<string>("geocoding.wallonia.base_url"), timeout),
        new FlandersBrusselsGeocoder(municipalityRepository, config.get<string>("geocoding.flanders.base_url"), timeout),
        centroid,
      ]
    : best
      ? [manual, best, centroid]
      : [manual, centroid];

  // Stops at ROOFTOP: a street-level hit is still worth trying the next adapter
  // for, a rooftop hit is not.
  container.bind<IGeocoder>(GEOCODER_TOKENS.full).toConstantValue(new CompositeGeocoder(fullChain, AddressGeoPrecision.ROOFTOP));

  // The picker. Bound only when a register is configured; unbound means the
  // suggest endpoint answers with an empty list and every form keeps working
  // exactly as it does today.
  if (bestClient) {
    container.bind<IAddressSuggester>(ADDRESS_SUGGESTER_TOKEN).toConstantValue(new BestAddressSuggester(bestClient, municipalityRepository));

    // The first /addresses read after the container starts took 56 SECONDS on a
    // cold box, and 0.09 s thereafter — Postgres paging the address table in.
    // With KrakenD's 3000 ms cap, an un-warmed box means the first person to
    // type an address gets a 504. Pay it at boot instead, in the background:
    // nothing here may delay or fail startup.
    void bestClient
      .warm()
      .then(() => {
        logger.info({ operation: "bestAddress:warm" }, "BeSt Address register warmed");
      })
      .catch((err: unknown) => {
        logger.warn(
          { operation: "bestAddress:warm", error: err },
          "BeSt Address register not reachable at boot - suggestions will retry per request",
        );
      });
  }

  logger.info({ mode: mode.toUpperCase(), remote, best_address: bestClient !== null }, "Geocoding adapters registered");
}
