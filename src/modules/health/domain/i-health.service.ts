export interface HealthCheckResult {
  status: "ok" | "unhealthy";
  latencyMs?: number;
}

export interface HealthReport {
  status: "ok" | "unhealthy";
  timestamp: string;
  checks: {
    db?: HealthCheckResult;
    document?: HealthCheckResult;
    keycloak?: HealthCheckResult;
  };
}

export interface IHealthService {
  checkDb(): Promise<HealthCheckResult>;
  checkDocuments(): Promise<HealthCheckResult>;
  checkKeycloak(): Promise<HealthCheckResult>;
  checkAll(): Promise<HealthReport>;
}
