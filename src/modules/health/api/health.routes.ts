import express from "express";
import { container } from "../../../container/di-container.js";
import { HealthController } from "./health.controller.js";

export const health_routes = express.Router();
const health_controller = container.get<HealthController>(HealthController);

health_routes.get("/", health_controller.getHealth.bind(health_controller));
health_routes.get("/db", health_controller.getDbHealth.bind(health_controller));
health_routes.get("/document", health_controller.getDocumentHealth.bind(health_controller));
health_routes.get("/keycloak", health_controller.getKeycloakHealth.bind(health_controller));
