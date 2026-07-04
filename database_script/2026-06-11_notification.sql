-- Migration: 2026-06-11 — notification storage layer.
--
-- Adds the durable `notification` table backing the in-app notification feature.
-- Rows are written when domain events occur (e.g. `simulation.completed`) and
-- read / counted / marked-read by their recipient through the notifications
-- REST endpoints. Real-time delivery (SSE / LISTEN-NOTIFY) is intentionally not
-- part of this layer.
--
-- Notes:
--   * `id_user` is the recipient and the mandatory scope; rows are cascade-deleted
--     with the user.
--   * `id_community` is nullable: a user can receive notifications outside of any
--     community context. When present it scopes the row to a community and is
--     cascade-deleted with it.
--   * `data` is a JSONB payload for type-specific context (e.g. the related
--     generation or simulation id).
--   * Indexes are recipient-centric: `(id_user, id DESC)` for list ordering and
--     cursor, a partial `(id_user) WHERE read_at IS NULL` for the cheap unread
--     badge count, and `(id_community)` for community scoping.
--
-- Idempotent: safe to re-run.
--
-- Apply on existing databases with:
--   psql -d <db> -f database_script/2026-06-11_notification.sql
BEGIN;

CREATE TABLE IF NOT EXISTS notification (
    id            BIGSERIAL PRIMARY KEY,
    id_community  INT REFERENCES community (id) ON DELETE CASCADE,
    id_user       INT NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    type          VARCHAR(128) NOT NULL,
    data          JSONB NOT NULL DEFAULT '{}'::jsonb,
    read_at       TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_user_id
    ON notification (id_user, id DESC);
CREATE INDEX IF NOT EXISTS idx_notification_user_unread
    ON notification (id_user) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notification_community
    ON notification (id_community);

COMMIT;
