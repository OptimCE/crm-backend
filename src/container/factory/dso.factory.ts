import config from "config";
import { container } from "../di-container.js";
import logger from "../../shared/monitor/logger.js";
import { DSO_LOOKUP_CLIENT_TOKEN, type IDsoLookupClient } from "../../modules/dso/domain/i-dso-lookup.client.js";
import { DsoLookupClient } from "../../modules/dso/infra/dso-lookup.client.js";
import { DsoUnavailableError } from "../../modules/dso/shared/dso-unavailable.error.js";

/**
 * Per call. Two sequential calls (a postcode lookup, then one retry by address)
 * must fit inside KrakenD's 3000 ms gateway cap next to the regulator read.
 */
const DEFAULT_TIMEOUT_MS = 1000;

/**
 * Binds the client of the internal `dso-lookup` service, which prefills a
 * meter's GRD.
 *
 * Binds nothing and logs when no URL is configured, rather than throwing — the
 * prefill is advisory and must never stop the service booting. Same posture as
 * geocoding.factory.ts, and deliberately NOT called from
 * initializeGeocodingService(): that one returns early when geocoding.mode=OFF,
 * which has nothing to do with this feature.
 *
 * dso-lookup is internal: never an annex, never in ANNEX_CATALOG_*, never
 * exposed through KrakenD or nginx. Only this service calls it, over the Docker
 * network, the way it calls the BeSt Address box.
 */
export function initializeDsoLookup(): void {
  try {
    const baseUrl: string = config.has("dso_lookup.base_url") ? config.get<string>("dso_lookup.base_url") : "";
    if (!baseUrl) {
      logger.info("dso_lookup.base_url is empty - GRD prefill disabled");
      return; // No binding, no error. DsoService treats unbound as "unavailable".
    }

    const configured: number = config.has("dso_lookup.timeout_ms") ? Number(config.get<number>("dso_lookup.timeout_ms")) : DEFAULT_TIMEOUT_MS;
    const timeout = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TIMEOUT_MS;

    const client = new DsoLookupClient(baseUrl, timeout);
    container.bind<IDsoLookupClient>(DSO_LOOKUP_CLIENT_TOKEN).toConstantValue(client);

    // Which data release is live, in the boot log, so "why did it prefill X" has
    // an answer. In the background and fire-and-forget: there is no depends_on on
    // dso-lookup, so it may well not be up yet, and nothing here may delay or
    // fail startup.
    void client
      .meta()
      .then((meta) => {
        logger.info(
          { operation: "dsoLookup:meta", data_version: meta.data_version, version_date: meta.version_date, communes: meta.communes },
          "dso-lookup reachable",
        );
      })
      .catch((err: unknown) => {
        logger.warn(
          { operation: "dsoLookup:meta", reason: err instanceof DsoUnavailableError ? err.reason : "unexpected" },
          "dso-lookup not reachable at boot - the GRD prefill will retry per request",
        );
      });

    logger.info({ timeout_ms: timeout }, "dso-lookup client registered");
  } catch (err) {
    logger.warn({ operation: "initializeDsoLookup", error: err }, "dso-lookup client not registered - GRD prefill disabled");
  }
}
