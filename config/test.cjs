const path = require("path");

module.exports = {
  microservice_name: process.env.MICROSERVICE_NAME || "CRM",
  regulators: {
    // Self-contained fixture so unit/functional tests don't depend on monorepo layout.
    config_path: process.env.REGULATORS_CONFIG_PATH || path.resolve(__dirname, "..", "tests", "fixtures", "regulators.json"),
  },
  allowed_origin: process.env.ALLOWED_ORIGIN || "http://localhost:5000",
  server: {
    host: process.env.SERVER_HOST || "localhost",
    port: process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT) : 3000,
  },
  database: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5433,
    username: process.env.DB_USERNAME || "testuser",
    password: process.env.DB_PASSWORD || "testpass",
    database: process.env.DB_NAME || "testdb",
    logging: process.env.logging || false,
  },
  iam_service: {
    name: process.env.IAM_SERVICE_NAME || "KEYCLOAK",
    settings: {
      realm: process.env.IAM_REALM || "optimce-realm",
      realmName: process.env.IAM_REALM_NAME || "master",
      baseUrl: process.env.IAM_BASE_URL || "http://localhost:8080",
      clientId: process.env.IAM_CLIENT_ID || "admin-cli",
      grantType: process.env.IAM_GRANT_TYPE || "client_credentials",
      clientSecret: process.env.IAM_CLIENT_SECRET || "my-secret",
    },
  },
  storage_service: {
    name: process.env.STORAGE_SERVICE_NAME || "S3",
    settings: {
      endpoint: process.env.STORAGE_ENDPOINT || "http://localhost:9000",
      region: process.env.STORAGE_REGION || "us-east-1",
      bucket: process.env.STORAGE_BUCKET || "crm-files",
      access_key: process.env.STORAGE_ACCESS_KEY || "minioadmin",
      secret_key: process.env.STORAGE_SECRET_KEY || "minioadmin",
    },
  },
  remote_logging: {
    status: process.env.REMOTE_LOGGING_STATUS || false,
    opentelemetry: {
      exporter_endpoint: process.env.OPENTELEMETRY_EXPORTER_ENDPOINT || "",
    },
  },
  // Hardcoded OFF: binding.ts skips the factory under NODE_ENV=test anyway,
  // and this makes "an unbound geocoder is a silent no-op" an explicit
  // property of the test config rather than an accident of the guard.
  geocoding: {
    mode: "OFF",
    // The backfill's functional tests authenticate as this user; any other ADMIN must be refused.
    backfill_operators: ["auth0|admin"],
  },
  // ---- Realtime SSE fan-out -------------------------------------------
  // HARDCODED off, not env-driven: it makes "the ticket endpoint 503s when the
  // feature is off" a cheap deterministic assertion, and binding.ts skips the
  // factories entirely under NODE_ENV=test anyway. The realtime jest project
  // constructs RedisRealtimeHub directly and hand-binds it (mirroring
  // tests/utils/helper.ts initializeCaching), so it never needs this flag.
  realtime: {
    enabled: false,
    redis_url: process.env.REALTIME_REDIS_URL || "",
    channel_pattern: "notify:v1:*",
    ticket_ttl_seconds: 30,
    heartbeat_seconds: 20,
    max_connection_seconds: 900,
    max_connections_per_user: 4,
    max_connections: 2000,
    mint_per_minute: 30,
  },
  // ---- Annex catalogue ------------------------------------------------
  // HARDCODED, not read from ANNEX_CATALOG_ENABLE / _DISABLE: the
  // functional suite asserts on the real catalogue, so a variable exported in
  // a developer's shell must not reshape it. Unit tests exercise the overrides
  // through resolveAnnexCatalog() directly.
  //
  // live-data and signature ship `"defaultEnabled": false`, and the functional
  // Catalog test asserts they are served, so the suite opts them in the way the
  // dev stack does (ANNEX_CATALOG_ENABLE=live-data,signature in the monorepo
  // .env.dev).
  annex_catalog: {
    enable: ["live-data", "signature"],
    disable: [],
  },
  // ---- Outbox relay ---------------------------------------------------
  // Read only by the crm-outbox-relay entrypoint (src/outbox-relay.ts), not by
  // the API. The relay owns the CORE_EVENTS stream: `stream_max_age_days`
  // bounds how long an annexe can be down and still catch up from the stream
  // (beyond it, the administrative annexe reconciles at reactivation), and
  // `duplicate_window_ms` how late a republished event is still dropped.
  outbox_relay: {
    nats_url: process.env.NATS_URL || "nats://localhost:4223",
    poll_interval_ms: process.env.OUTBOX_RELAY_POLL_INTERVAL_MS ? parseInt(process.env.OUTBOX_RELAY_POLL_INTERVAL_MS) : 500,
    batch_size: process.env.OUTBOX_RELAY_BATCH_SIZE ? parseInt(process.env.OUTBOX_RELAY_BATCH_SIZE) : 100,
    stream_max_age_days: process.env.OUTBOX_STREAM_MAX_AGE_DAYS ? parseInt(process.env.OUTBOX_STREAM_MAX_AGE_DAYS) : 30,
    duplicate_window_ms: process.env.OUTBOX_DUPLICATE_WINDOW_MS ? parseInt(process.env.OUTBOX_DUPLICATE_WINDOW_MS) : 600000,
    retention_days: process.env.OUTBOX_RETENTION_DAYS ? parseInt(process.env.OUTBOX_RETENTION_DAYS) : 30,
    heartbeat_file: process.env.OUTBOX_RELAY_HEARTBEAT_FILE || "/tmp/outbox-relay.alive",
  },
};
