-- Migration: 2026-05-27 — audit_log foundation.
--
-- Adds the append-only `audit_log` table that records significant actions
-- across the CRM and shared annex services. Rows are written via the
-- AuditLogService helper; the application layer never updates or deletes
-- entries (append-only by convention, not enforced by triggers in v1).
--
-- Notes:
--   * `id_community` is nullable so background jobs / system events that run
--     outside a request context can still emit entries.
--   * `user_id` is intentionally NOT a foreign key: `user_email` is denormalized
--     at write time so the log remains readable if a user is later deleted or
--     anonymized.
--   * Action codes follow the `domain.entity.verb` convention (e.g.
--     `crm.member.invited`). They are stored as VARCHAR and managed as a
--     TypeScript constant at the application layer.
--
-- Idempotent: safe to re-run.
--
-- Apply on existing databases with:
--   psql -d <db> -f database_script/2026-05-27_audit_log.sql
BEGIN;

CREATE TABLE IF NOT EXISTS audit_log (
    id              BIGSERIAL PRIMARY KEY,
    id_community    INT REFERENCES community (id) ON DELETE CASCADE,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action          VARCHAR(128) NOT NULL,
    source          VARCHAR(32)  NOT NULL,
    entity_type     VARCHAR(64)  NOT NULL,
    entity_id       VARCHAR(64),
    user_id         INT,
    user_email      VARCHAR(256),
    payload         JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_log_community_timestamp
    ON audit_log (id_community, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_community_entity
    ON audit_log (id_community, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_community_action
    ON audit_log (id_community, action);

COMMIT;
