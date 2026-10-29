import "reflect-metadata";
import config from "config";
import { AppDataSource } from "./shared/database/database.connector.js";
import logger from "./shared/monitor/logger.js";
import { runRelay, type RelaySettings } from "./shared/outbox/relay.js";

/**
 * crm-outbox-relay: a second entrypoint of the crm-backend image, run as its own container.
 * It publishes the outbox to NATS JetStream (see shared/outbox/relay.ts). Kept out of the API
 * process so an API restart, scale-out or crash never stalls or doubles the relay, and the relay
 * never competes with requests.
 */
const settings = config.get<RelaySettings>("outbox_relay");
const controller = new AbortController();

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    logger.info({ operation: "outbox_relay:stop", signal }, "Outbox relay stopping");
    controller.abort();
  });
}

await AppDataSource.initialize();
try {
  await runRelay(AppDataSource, settings, logger, controller.signal);
} finally {
  await AppDataSource.destroy();
}
process.exit(0);
