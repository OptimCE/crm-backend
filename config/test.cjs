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
  // The data export (contracts/export/README.md at the monorepo root): POST /exports and its
  // three companions, and the NATS connection that announces a new export to the worker.
  export: {
    nats_url: process.env.NATS_URL || "nats://localhost:4223",
    // The services asked for a part of every export (EXPORT_SERVICES, comma-separated).
    services: (process.env.EXPORT_SERVICES || "crm,signature,administrative-document,billing,news-board,simulation-key,allocation-key-generation,live-data")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== ""),
    // POST /exports wants an interactive login at most this old (the token's auth_time).
    step_up_max_age_seconds: process.env.EXPORT_STEP_UP_MAX_AGE_SECONDS ? parseInt(process.env.EXPORT_STEP_UP_MAX_AGE_SECONDS) : 300,
    // Requests per scope (one user, or one community) over the last 24 hours.
    max_requests_per_day: process.env.EXPORT_MAX_REQUESTS_PER_DAY ? parseInt(process.env.EXPORT_MAX_REQUESTS_PER_DAY) : 3,
    // How long a ready archive can be downloaded.
    retention_days: process.env.EXPORT_RETENTION_DAYS ? parseInt(process.env.EXPORT_RETENTION_DAYS) : 7,
    download_url_ttl_seconds: process.env.EXPORT_DOWNLOAD_URL_TTL_SECONDS ? parseInt(process.env.EXPORT_DOWNLOAD_URL_TTL_SECONDS) : 300,
    bucket: process.env.EXPORT_BUCKET || "exports",
    // Signs the download URLs with the export-download account, which can only read archives/.
    // The endpoint is MinIO as the BROWSER reaches it: signing makes no network call.
    download: {
      public_endpoint: process.env.EXPORT_DOWNLOAD_PUBLIC_ENDPOINT || process.env.STORAGE_PUBLIC_ENDPOINT || "http://localhost:9000",
      region: process.env.EXPORT_STORAGE_REGION || "us-east-1",
      access_key: process.env.EXPORT_DOWNLOAD_ACCESS_KEY || "test-download",
      secret_key: process.env.EXPORT_DOWNLOAD_SECRET_KEY || "test-download-secret",
    },
    // The export worker (src/export-worker.ts), its own process. Its storage account is
    // export-worker (EXPORT_STORAGE_*), which reads everything in `exports` and both document
    // buckets, and writes archives/ only.
    worker: {
      tick_seconds: process.env.EXPORT_WORKER_TICK_SECONDS ? parseInt(process.env.EXPORT_WORKER_TICK_SECONDS) : 60,
      // A job whose export.job.requested got lost is started by the sweep after this.
      pending_grace_seconds: process.env.EXPORT_PENDING_GRACE_SECONDS ? parseInt(process.env.EXPORT_PENDING_GRACE_SECONDS) : 30,
      // No answer this long after a request: published again, at most max_part_attempts times.
      part_timeout_minutes: process.env.EXPORT_PART_TIMEOUT_MINUTES ? parseInt(process.env.EXPORT_PART_TIMEOUT_MINUTES) : 30,
      max_part_attempts: process.env.EXPORT_MAX_PART_ATTEMPTS ? parseInt(process.env.EXPORT_MAX_PART_ATTEMPTS) : 3,
      // An export still active this long after its request fails.
      job_max_age_hours: process.env.EXPORT_JOB_MAX_AGE_HOURS ? parseInt(process.env.EXPORT_JOB_MAX_AGE_HOURS) : 24,
      max_assembly_attempts: process.env.EXPORT_MAX_ASSEMBLY_ATTEMPTS ? parseInt(process.env.EXPORT_MAX_ASSEMBLY_ATTEMPTS) : 3,
      // An assembly not heard of for this long belongs to a dead worker and is taken over.
      assembly_lease_seconds: process.env.EXPORT_ASSEMBLY_LEASE_SECONDS ? parseInt(process.env.EXPORT_ASSEMBLY_LEASE_SECONDS) : 120,
      // Pause before assembly attempt n+1: n times this.
      assembly_retry_seconds: process.env.EXPORT_ASSEMBLY_RETRY_SECONDS ? parseInt(process.env.EXPORT_ASSEMBLY_RETRY_SECONDS) : 30,
      // The buckets a part may reference documents in.
      document_buckets: (process.env.EXPORT_DOCUMENT_BUCKETS || "crm-files optimce-documents").split(/[\s,]+/).filter((b) => b !== ""),
      heartbeat_file: process.env.EXPORT_WORKER_HEARTBEAT_FILE || "/tmp/export-worker.alive",
      // manifest.json's platform.version.
      platform_version: process.env.OPTIMCE_VERSION || "test",
    },
  },
};
