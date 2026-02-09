import "reflect-metadata";
import "./container/binding.js";
import express from "express";
import bodyParser from "body-parser";
import config from "config";

import cors from "cors";
import { xss_middleware } from "./shared/middlewares/xss.middleware.js";
import init from "./shared/monitor/tracer.js";
import { errorHandler } from "./shared/middlewares/error.middleware.js";
import {AppDataSource} from "./shared/database/database.connector.js";
import {contextMiddleware} from "./shared/middlewares/context.js";
import {router} from "./index.routes.js";
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import * as middleware from 'i18next-http-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Recreate __filename and __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { sdk } = init(config.get("microservice_name")); // pr

const app = express();
const port: number = config.get("server.port");
const host: string = config.get("server.host");
const origin: string = config.get("allowed_origin");

const corsOptions = {
    origin: origin,
    credentials: true,
};


const startServer = async () => {
    try {
        console.log("Loading translations from:", path.join(__dirname, '../assets/{{lng}}/{{ns}}.json'));

        // Await the initialization of i18next

        await i18next
            .use(Backend)
            .use(middleware.LanguageDetector)
            .init({
                backend: {
                    loadPath: path.join(__dirname, '../assets/{{lng}}/{{ns}}.json'),
                },
                ns: ['global_error', 'community', 'document','invitation','key','member','meter','sharing_operation','user'],
                defaultNS: 'translation',
                fallbackLng: 'en',
                preload: ['en', 'fr', 'nl'],
                saveMissing: true
            });

        console.log("Translations loaded successfully.");

        app.use(cors(corsOptions));
        app.use(middleware.handle(i18next));
        app.use(bodyParser.json());
        app.use(contextMiddleware());
        app.use(xss_middleware);
        app.use("/",router);
        app.use(errorHandler);

        // 4. Start Server only after translations are ready
        if (process.env.NODE_ENV !== "test") {
            app.listen(port, host, async () => {
                await AppDataSource.initialize();
                console.log(`Express is listening at http://${host}:${port}`);
            });
        }

    } catch (error) {
        console.error("Failed to initialize app:", error);
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
