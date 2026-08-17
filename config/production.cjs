module.exports = {
    microservice_name: process.env.MICROSERVICE_NAME,
    regulators: {
        // Must be provided in production (mounted shared JSON). No default: fail fast if unset.
        config_path: process.env.REGULATORS_CONFIG_PATH
    },
    allowed_origin: process.env.ALLOWED_ORIGIN,
    server: {
        host: process.env.SERVER_HOST,
        port: process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT) : undefined
    },
    database: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        logging: process.env.logging || false
    },
    iam_service: {
        name: process.env.IAM_SERVICE_NAME,
        settings: {
            realm: process.env.IAM_REALM,
            realmName: process.env.IAM_REALM_NAME,
            baseUrl: process.env.IAM_BASE_URL,
            clientId: process.env.IAM_CLIENT_ID,
            grantType: process.env.IAM_GRANT_TYPE,
            clientSecret: process.env.IAM_CLIENT_SECRET
        }
    },
    storage_service: {
        name: process.env.STORAGE_SERVICE_NAME,
        settings: {
            endpoint: process.env.STORAGE_ENDPOINT,
            public_endpoint: process.env.STORAGE_PUBLIC_ENDPOINT,
            region: process.env.STORAGE_REGION,
            bucket: process.env.STORAGE_BUCKET,
            access_key: process.env.STORAGE_ACCESS_KEY,
            secret_key: process.env.STORAGE_SECRET_KEY
        }
    },
    remote_logging: {
        status: process.env.REMOTE_LOGGING,
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
