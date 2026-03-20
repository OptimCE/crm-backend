import { injectable } from "inversify";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import config from "config";
import { call } from "../../../shared/services/api_call.js";
import type { HealthCheckResult, HealthReport, IHealthService } from "../domain/i-health.service.js";

interface StatusCheckResponse {
  status: number;
}

interface CacheEntry {
  result: HealthCheckResult;
  expiresAt: number;
}

const CACHE_TTL_MS = 10_000;
const HTTP_TIMEOUT_MS = 5_000;

@injectable()
export class HealthService implements IHealthService {
  private cache = new Map<string, CacheEntry>();

  private getCached(key: string): HealthCheckResult | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.expiresAt) {
      return entry.result;
    }
    this.cache.delete(key);
    return null;
  }

  private setCached(key: string, result: HealthCheckResult): HealthCheckResult {
    this.cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  }

  async checkDb(): Promise<HealthCheckResult> {
    const cached = this.getCached("checkDb");
    if (cached) return cached;

    const start = Date.now();
    try {
      if (!AppDataSource.isInitialized) {
        return this.setCached("checkDb", { status: "unhealthy", error: "Database not initialized", latencyMs: 0 });
      }
      await AppDataSource.query("SELECT 1");
      return this.setCached("checkDb", { status: "ok", latencyMs: Date.now() - start });
    } catch (err) {
      return this.setCached("checkDb", { status: "unhealthy", error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  async checkDocuments(): Promise<HealthCheckResult> {
    const cached = this.getCached("checkDocuments");
    if (cached) return cached;

    const start = Date.now();
    try {
      const response = await call<StatusCheckResponse>({ url: config.get<string>("services.documents.url") + "/health", timeout: HTTP_TIMEOUT_MS });
      if (response.status === 200) {
        return this.setCached("checkDocuments", { status: "ok", latencyMs: Date.now() - start });
      } else {
        return this.setCached("checkDocuments", { status: "unhealthy", error: `HTTP ${response.status}`, latencyMs: Date.now() - start });
      }
    } catch (err) {
      return this.setCached("checkDocuments", { status: "unhealthy", error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  async checkKeycloak(): Promise<HealthCheckResult> {
    const cached = this.getCached("checkKeycloak");
    if (cached) return cached;

    const start = Date.now();
    try {
      const keycloakUrl = config.get<string>("iam_service.settings.baseUrl");
      const response = await call<StatusCheckResponse>({ url: keycloakUrl + "/health", timeout: HTTP_TIMEOUT_MS });
      if (response.status === 200) {
        return this.setCached("checkKeycloak", { status: "ok", latencyMs: Date.now() - start });
      } else {
        return this.setCached("checkKeycloak", { status: "unhealthy", error: `HTTP ${response.status}`, latencyMs: Date.now() - start });
      }
    } catch (err) {
      return this.setCached("checkKeycloak", { status: "unhealthy", error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

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
