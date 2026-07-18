const path = require("path");

module.exports = {
    microservice_name: process.env.MICROSERVICE_NAME || "CRM",
    regulators: {
        // Self-contained fixture so unit/functional tests don't depend on monorepo layout.
        config_path: process.env.REGULATORS_CONFIG_PATH || path.resolve(__dirname, "..", "tests", "fixtures", "regulators.json")
    },
    allowed_origin: process.env.ALLOWED_ORIGIN || "http://localhost:5000",
    server: {
        host: process.env.SERVER_HOST || "localhost",
        port: process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT) : 3000
    },
    database: {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5433,
        username: process.env.DB_USERNAME || "testuser",
        password: process.env.DB_PASSWORD || "testpass",
        database: process.env.DB_NAME || "testdb",
        logging: process.env.logging || false
    },
    iam_service: {
        name: process.env.IAM_SERVICE_NAME || "KEYCLOAK",
        settings: {
            realm: process.env.IAM_REALM || "optimce-realm",
            realmName: process.env.IAM_REALM_NAME || "master",
            baseUrl: process.env.IAM_BASE_URL || "http://localhost:8080",
            clientId: process.env.IAM_CLIENT_ID || "admin-cli",
            grantType: process.env.IAM_GRANT_TYPE || "client_credentials",
            clientSecret: process.env.IAM_CLIENT_SECRET || "my-secret"
        }
    },
    storage_service: {
        name: process.env.STORAGE_SERVICE_NAME || "S3",
        settings: {
            endpoint: process.env.STORAGE_ENDPOINT || "http://localhost:9000",
            region: process.env.STORAGE_REGION || "us-east-1",
            bucket: process.env.STORAGE_BUCKET || "crm-files",
            access_key: process.env.STORAGE_ACCESS_KEY || "minioadmin",
            secret_key: process.env.STORAGE_SECRET_KEY || "minioadmin"
        }
    },
    remote_logging:{
        status: process.env.REMOTE_LOGGING_STATUS || false,
        opentelemetry: {
            exporter_endpoint: process.env.OPENTELEMETRY_EXPORTER_ENDPOINT ||''
        }
    }
};