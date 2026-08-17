const path = require("path");

module.exports = {
    microservice_name: process.env.MICROSERVICE_NAME || "BackEndCRM",
    regulators: {
        // Canonical regulator code list (shared JSON at the monorepo root).
        // REGULATORS_CONFIG_PATH overrides; otherwise resolve the monorepo-root file.
        config_path: process.env.REGULATORS_CONFIG_PATH || path.resolve(__dirname, "..", "..", "reference", "regulators.json")
    },
    allowed_origin: process.env.ALLOWED_ORIGIN || "http://localhost:8080",
    server: {
        host: process.env.SERVER_HOST || "0.0.0.0",
        port: process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT) : 3000
    },
    database: {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
        username: process.env.DB_USERNAME || 'gestionnaire',
        password: process.env.DB_PASSWORD || 'root',
        database: process.env.DB_NAME || 'optimce_crm',
        logging: process.env.logging || false
    },
    iam_service: {
        name: process.env.IAM_SERVICE_NAME || 'KEYCLOACK',
        settings: {
            realm: process.env.IAM_REALM || 'optimce-realm',
            realmName: process.env.IAM_REALM_NAME || 'optimce-realm',
            baseUrl: process.env.IAM_BASE_URL || "http://localhost:8081",
            clientId: process.env.IAM_CLIENT_ID || "optimce-backend",
            grantType: process.env.IAM_GRANT_TYPE || "client_credentials",
            clientSecret: process.env.IAM_CLIENT_SECRET || 'bsLbpKsIznMSaUkA8i2IguQCVt2bTxOQ'
        }
    },
    storage_service: {
        name: process.env.STORAGE_SERVICE_NAME || 'S3',
        settings: {
            endpoint: process.env.STORAGE_ENDPOINT || "http://localhost:9000",
            public_endpoint: process.env.STORAGE_PUBLIC_ENDPOINT || "http://localhost:9000",
            region: process.env.STORAGE_REGION || "us-east-1",
            bucket: process.env.STORAGE_BUCKET || "crm-files",
            access_key: process.env.STORAGE_ACCESS_KEY || "minioadmin",
            secret_key: process.env.STORAGE_SECRET_KEY || "minioadmin"
        }
    },
    remote_logging: {
        status: process.env.REMOTE_LOGGING || false,
        opentelemetry: {
            exporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
            exporterProtocol: process.env.OTEL_EXPORTER_OTLP_PROTOCOL
        }
    },
    // ---- Realtime SSE fan-out -------------------------------------------
    // A SEPARATE key from cache_service, deliberately. Pointing cache_service at
    // this Redis would ALSO switch on the dormant HTTP response cache across
    // every @Cache site (~30 of them, never exercised in any deployment), and
    // cache-key.builder.ts silently omits the community/user segment when the
    // header is absent — so a realtime rollout would carry a cross-tenant cache
    // change with it. cache.factory.ts also THROWS on a missing settings.url,
    // whereas realtime must always degrade to polling rather than break boot.
    //
    // Realtime uses Redis logical db 1, keys prefixed `rt:`. Absent or
    // unparseable config = feature off = today's polling behaviour.
    realtime: {
        enabled: process.env.REALTIME_ENABLED === "true",
        redis_url: process.env.REALTIME_REDIS_URL || "",
        channel_pattern: "notify:v1:*",
        ticket_ttl_seconds: process.env.REALTIME_TICKET_TTL_SECONDS ? parseInt(process.env.REALTIME_TICKET_TTL_SECONDS) : 30,
        // Must stay well under nginx's 60s proxy_read_timeout default and under
        // mobile-carrier idle timeouts. 20s gives 3x margin.
        heartbeat_seconds: process.env.REALTIME_HEARTBEAT_SECONDS ? parseInt(process.env.REALTIME_HEARTBEAT_SECONDS) : 20,
        // Absolute stream lifetime: the revocation window, and the bound on what
        // a leaked single-use ticket buys. The client re-mints, which re-verifies
        // the JWT and re-reads roles.
        max_connection_seconds: process.env.REALTIME_MAX_CONNECTION_SECONDS ? parseInt(process.env.REALTIME_MAX_CONNECTION_SECONDS) : 900,
        max_connections_per_user: process.env.REALTIME_MAX_CONNECTIONS_PER_USER ? parseInt(process.env.REALTIME_MAX_CONNECTIONS_PER_USER) : 4,
        max_connections: process.env.REALTIME_MAX_CONNECTIONS ? parseInt(process.env.REALTIME_MAX_CONNECTIONS) : 2000,
        mint_per_minute: process.env.REALTIME_MINT_PER_MINUTE ? parseInt(process.env.REALTIME_MINT_PER_MINUTE) : 30
    }
};
