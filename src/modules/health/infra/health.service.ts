import { injectable } from "inversify";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import config from "config";
import { call } from "../../../shared/services/api_call.js";
import type { HealthCheckResult, HealthReport, IHealthService } from "../domain/i-health.service.js";

interface StatusCheckResponse {
  status: number;
}

/**
 * Health Service - Provides health check functionality for the application.
 * Used by Kubernetes liveness/readiness probes and load balancers.
 * Checks connectivity to external dependencies: database and file storage.
 */
@injectable()
export class HealthService implements IHealthService {
  /**
   * Checks database connectivity by verifying the TypeORM DataSource is initialized
   * and can execute a simple query.
   * @returns HealthCheckResult with status and latency in milliseconds
   */
  async checkDb(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      if (!AppDataSource.isInitialized) {
        return { status: "unhealthy" };
      }
      await AppDataSource.query("SELECT 1");
      return { status: "ok", latencyMs: Date.now() - start };
    } catch {
      return { status: "unhealthy" };
    }
  }

  /**
   * Checks file storage (OpenFiles API) connectivity by calling the health endpoint.
   * @returns HealthCheckResult with status and latency in milliseconds
   */
  async checkDocuments(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const response = await call<StatusCheckResponse>({ url: config.get<string>("services.documents.url") + "/health" });
      if (response.status === 200) {
        return { status: "ok", latencyMs: Date.now() - start };
      } else {
        return { status: "unhealthy" };
      }
    } catch {
      return { status: "unhealthy" };
    }
  }

  /**
   * Checks Keycloak connectivity by calling the health endpoint.
   * @returns HealthCheckResult with status and latency in milliseconds
   */
  async checkKeycloak(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const keycloakUrl = config.get<string>("iam_service.settings.baseUrl");
      const response = await call<StatusCheckResponse>({ url: keycloakUrl + "/health" });
      if (response.status === 200) {
        return { status: "ok", latencyMs: Date.now() - start };
      } else {
        return { status: "unhealthy" };
      }
    } catch {
      return { status: "unhealthy" };
    }
  }

  /**
   * Performs all health checks in parallel and returns an aggregated health report.
   * Overall status is "ok" only if all checks pass.
   * @returns HealthReport with overall status, timestamp, and individual check results
   */
  async checkAll(): Promise<HealthReport> {
    const [dbResult, documentResult, keycloakResult] = await Promise.all([this.checkDb(), this.checkDocuments(), this.checkKeycloak()]);

    const overallStatus: "ok" | "unhealthy" =
      dbResult.status === "ok" && documentResult.status === "ok" && keycloakResult.status === "ok" ? "ok" : "unhealthy";

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: {
        db: dbResult,
        document: documentResult,
        keycloak: keycloakResult,
      },
    };
  }
}
