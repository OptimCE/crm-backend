module.exports = {
    microservice_name: process.env.MICROSERVICE_NAME,
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
            target: process.env.STORAGE_TARGET,
            db_name: process.env.STORAGE_DB_NAME,
            token: process.env.STORAGE_TOKEN
        }
    },
    remote_logging: {
        status: process.env.REMOTE_LOGGING,
        opentelemetry: {
            exporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
            exporterProtocol: process.env.OTEL_EXPORTER_OTLP_PROTOCOL
        }
    }
};