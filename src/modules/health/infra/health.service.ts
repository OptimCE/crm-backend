import { inject, injectable } from "inversify";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import config from "config";
import { callForStatus } from "../../../shared/services/api_call.js";
import type { IStorageService } from "../../../shared/storage/i-storage.service.js";
import type { HealthCheckResult, HealthReport, IHealthService } from "../domain/i-health.service.js";

interface CacheEntry {
  result: HealthCheckResult;
  expiresAt: number;
}

const CACHE_TTL_MS = 10_000;
const HTTP_TIMEOUT_MS = 5_000;

@injectable()
export class HealthService implements IHealthService {
  private cache = new Map<string, CacheEntry>();

  constructor(@inject("StorageService") private readonly storageService: IStorageService) {}

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

  /**
   * The document store is the storage adapter (S3/MinIO, OpenFiles until 2026-04-12), asked
   * through the same client, credentials and bucket that uploads use.
   */
  async checkDocuments(): Promise<HealthCheckResult> {
    const cached = this.getCached("checkDocuments");
    if (cached) return cached;

    const start = Date.now();
    try {
      await this.storageService.ping(HTTP_TIMEOUT_MS);
      return this.setCached("checkDocuments", { status: "ok", latencyMs: Date.now() - start });
    } catch (err) {
      return this.setCached("checkDocuments", { status: "unhealthy", error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  /**
   * Fetches the realm's OIDC discovery document from the interface crm-backend talks to.
   * Keycloak 26 serves /health only on its management port (9000), and only with
   * KC_HEALTH_ENABLED, which the dev stack does not set; this needs neither, and it answers
   * 404 for a realm that does not exist.
   */
  async checkKeycloak(): Promise<HealthCheckResult> {
    const cached = this.getCached("checkKeycloak");
    if (cached) return cached;

    const start = Date.now();
    try {
      const keycloakUrl = config.get<string>("iam_service.settings.baseUrl");
      const realm = config.get<string>("iam_service.settings.realm");
      const status = await callForStatus({
        url: `${keycloakUrl}/realms/${encodeURIComponent(realm)}/.well-known/openid-configuration`,
        timeout: HTTP_TIMEOUT_MS,
      });
      if (status === 200) {
        return this.setCached("checkKeycloak", { status: "ok", latencyMs: Date.now() - start });
      } else {
        return this.setCached("checkKeycloak", { status: "unhealthy", error: `HTTP ${status}`, latencyMs: Date.now() - start });
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
