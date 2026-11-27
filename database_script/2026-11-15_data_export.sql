-- 2026-11-15 — export_job / export_part: the data export (RGPD art. 15 and 20).
--
-- One export_job per request for "all the data about a user" or "all the data
-- of a community", and one export_part per service that holds some of it. The
-- contract is contracts/export/README.md at the monorepo root.
--
-- crm-backend's API creates the job and its parts in one transaction, then
-- publishes `export.job.requested`. The export worker (same image, its own
-- process) keeps its whole state in these two tables, so it can pick up where
-- it was after a restart.
--
--   * id               = the exportId / partId of the NATS messages, generated
--                        by the API (crypto.randomUUID()).
--   * scope_id,
--     requester_user_id = Keycloak ids, as the contract carries them: the
--                        user's sub (app_user.auth_user_id) or the community's
--                        group id (community.auth_community_id). They are not
--                        always UUIDs: the test seeds use `auth0|admin`, `2`.
--   * id_requester,
--     id_community     = the same two, as internal ids, for the joins (lists,
--                        notifications, audit). id_community is set exactly
--                        when the scope is a community (ck_export_job_scope).
--   * status           = pending -> collecting -> assembling -> ready -> expired,
--                        or failed from any active state. Text, like the
--                        contract, the worker and the API speak it.
--   * uq_export_job_active is the "one active export per requester and scope"
--                        rule (409). The API also takes an advisory lock on
--                        the scope before its 24-hour count (429).
--   * Deleting a user or a community deletes its jobs. The archive, if any,
--                        is then removed by the bucket's lifecycle rule
--                        (archives/ after 8 days) rather than by the worker.
--
-- database_script/init.sql and tests/sql/init.sql carry the same tables.
--
-- There is no migration runner. Apply it by hand:
--
--   psql <conn> -f database_script/2026-11-15_data_export.sql
--
-- In dev:
--
--   docker compose -f docker-compose.dev.yml exec -T postgres \
--     psql -U crm_svc -d crm_db -f - < crm-backend/database_script/2026-11-15_data_export.sql
--
-- Production applies the ported twin instead:
-- optimce-migrator/migrations/optimce-crm/021_data_export.sql.

BEGIN;

CREATE TABLE IF NOT EXISTS export_job (
    id                UUID PRIMARY KEY,
    scope_type        VARCHAR(16) NOT NULL CHECK (scope_type IN ('user', 'community')),
    scope_id          VARCHAR(255) NOT NULL,
    id_community      INT NULL REFERENCES community (id) ON DELETE CASCADE,
    requester_user_id VARCHAR(255) NOT NULL,
    id_requester      INT NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    status            VARCHAR(16) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'collecting', 'assembling', 'ready', 'failed', 'expired')),
    schema_version    VARCHAR(16) NOT NULL,
    locale            VARCHAR(8) NOT NULL CHECK (locale IN ('fr', 'en', 'nl', 'de')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at        TIMESTAMPTZ NULL,
    completed_at      TIMESTAMPTZ NULL,
    expires_at        TIMESTAMPTZ NULL,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    object_key        TEXT NULL,
    size_bytes        BIGINT NULL,
    sha256            CHAR(64) NULL,
    assembly_attempts SMALLINT NOT NULL DEFAULT 0,
    error_code        VARCHAR(64) NULL,
    error_detail      TEXT NULL,
    CONSTRAINT ck_export_job_scope CHECK ((scope_type = 'community') = (id_community IS NOT NULL)),
    CONSTRAINT ck_export_job_ready CHECK (status <> 'ready' OR (object_key IS NOT NULL AND expires_at IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_export_job_active
    ON export_job (requester_user_id, scope_type, scope_id)
    WHERE status IN ('pending', 'collecting', 'assembling');
CREATE INDEX IF NOT EXISTS ix_export_job_scope_created
    ON export_job (scope_type, scope_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_export_job_requester
    ON export_job (id_requester, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_export_job_community
    ON export_job (id_community, created_at DESC) WHERE id_community IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_export_job_open
    ON export_job (created_at) WHERE status IN ('pending', 'collecting', 'assembling');
CREATE INDEX IF NOT EXISTS ix_export_job_expiry
    ON export_job (expires_at) WHERE status = 'ready';

CREATE TABLE IF NOT EXISTS export_part (
    id            UUID PRIMARY KEY,
    export_job_id UUID NOT NULL REFERENCES export_job (id) ON DELETE CASCADE,
    service       VARCHAR(64) NOT NULL CHECK (service ~ '^[a-z][a-z0-9-]{1,62}$'),
    status        VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'failed')),
    attempts      SMALLINT NOT NULL DEFAULT 0,
    requested_at  TIMESTAMPTZ NULL,
    result        JSONB NULL,
    last_error    TEXT NULL,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_export_part_service UNIQUE (export_job_id, service)
);

COMMIT;
