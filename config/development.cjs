module.exports = {
    microservice_name: process.env.MICROSERVICE_NAME || "BackEndCRM",
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
        name: process.env.STORAGE_SERVICE_NAME || 'OPENFILES',
        settings: {
            target: process.env.STORAGE_TARGET || "http://localhost:8001/",
            db_name: process.env.STORAGE_DB_NAME || "test",
            token: process.env.STORAGE_TOKEN || "3bv0rtgyeayftqjtt2kpq2popojybq"
        }
    },
    remote_logging: {
        status: process.env.REMOTE_LOGGING || false,
        opentelemetry: {
            exporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
            exporterProtocol: process.env.OTEL_EXPORTER_OTLP_PROTOCOL
        }
    }
};