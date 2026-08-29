import "reflect-metadata";
import "./container/binding.js";
import express from "express";
import bodyParser from "body-parser";
import config from "config";

import { xss_middleware } from "./shared/middlewares/xss.middleware.js";
import init from "./shared/monitor/tracer.js";
import { errorHandler } from "./shared/middlewares/error.middleware.js";
import { AppDataSource } from "./shared/database/database.connector.js";
import { contextMiddleware } from "./shared/middlewares/context.js";
import { router } from "./index.routes.js";
import { realtime_stream_routes } from "./modules/realtime/api/realtime.stream.routes.js";
import { container } from "./container/di-container.js";
import type { IRealtimeHub } from "./shared/realtime/i-realtime.hub.js";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import * as middleware from "i18next-http-middleware";
import path from "path";
import { fileURLToPath } from "url";
import logger from "./shared/monitor/logger.js";
import { getRegulators } from "./modules/communities/shared/regulator.js";

// 1. Recreate __filename and __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
init(config.get("microservice_name"));

const app = express();
const port: number = config.get("server.port");
const host: string = config.get("server.host");
// const origin: string = config.get("allowed_origin");

const startServer = async (): Promise<void> => {
  try {
    // Fail fast if the shared regulator registry is missing/misconfigured.
    getRegulators();

    // Await the initialization of i18next

    await i18next
      .use(Backend)
      .use(middleware.LanguageDetector)
      .init({
        backend: {
          loadPath: path.join(__dirname, "../assets/{{lng}}/{{ns}}.json"),
        },
        // "municipality" was missing even though MUNICIPALITY_ERRORS has used the
        // "municipality:" prefix since it was introduced — its messages were
        // silently rendering as raw keys.
        ns: ["global_error", "community", "document", "geocoding", "invitation", "key", "member", "meter", "municipality", "sharing_operation", "user"],
        defaultNS: "translation",
        fallbackLng: "en",
        preload: ["en", "fr", "nl"],
        saveMissing: true,
      });

    // app.use(cors(corsOptions));

    // MOUNTED FIRST, before every global middleware. This is the one route that
    // is reachable WITHOUT passing through KrakenD, so on this leg `x-user-id`
    // is client-controlled: running contextMiddleware() here would build an
    // authoritative-looking Context out of a forged header — the authentication
    // bypass, exactly. The handler needs no i18n, no body parsing, no ALS store
    // and no XSS sanitising, and each of those is one more chance for a
    // middleware to touch req/res in a way that breaks a stream.
    // See modules/realtime/api/realtime.stream.routes.ts.
    app.use("/realtime", realtime_stream_routes);

    app.use(middleware.handle(i18next));
    app.use(bodyParser.json());
    app.use(contextMiddleware());
    app.use(xss_middleware);
    app.use("/", router);
    app.use(errorHandler);

    // 4. Start Server only after translations are ready
    if (process.env.NODE_ENV !== "test") {
      await AppDataSource.initialize();
      const server = app.listen(port, host, () => {
        logger.info({ operation: "startServer" }, `Express is listening at http://${host}:${port}`);
      });
      // Node's requestTimeout defaults to 300s and headersTimeout to 60s, and
      // BOTH are enforced by the server's connection-checking interval, which
      // destroys the socket — not by the socket's own inactivity timer. So the
      // `req.socket.setTimeout(0)` in the SSE handler does NOT disable them, and
      // a stream intended to live 900s would die at ~5 minutes. The heartbeat
      // plus the client's re-mint loop would hide that as an unexplained
      // five-minute reconnect cycle rather than an error.
      server.requestTimeout = 0;
      server.headersTimeout = 60_000;

      // Open SSE streams hold a response object, two timers and a slot in the
      // hub's fan-out maps each. Without this, `docker compose stop` waits out
      // the grace period and every client sees a TCP reset instead of a clean
      // close-then-remint.
      const shutdown = (signal: string): void => {
        logger.info({ operation: "shutdown", signal }, "Shutting down");
        const hub = container.isBound("RealtimeHub") ? container.get<IRealtimeHub>("RealtimeHub") : null;
        void Promise.resolve(hub?.dispose()).finally(() => server.close(() => process.exit(0)));
      };
      process.once("SIGTERM", () => shutdown("SIGTERM"));
      process.once("SIGINT", () => shutdown("SIGINT"));
    }
  } catch (error) {
    logger.error({ operation: "startServer", err: error }, "Failed to initialize app");
    process.exit(1);
  }
};

// Execute the start function
await startServer();
export { i18next };
/**
 * Express application instance configured with middleware and routes
 * @module app
 * @exports Express application
 */
export default app;
