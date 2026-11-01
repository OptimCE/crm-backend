-- 2026-11-01 — notification_preference: mode 4, weekly.
--
-- The administrative annexe now sends its deadline emails as ONE summary per
-- manager per day (admin_digest.summary), across communities. Each manager
-- chooses its rhythm on the admin_digest prefix, email channel: daily (no row,
-- the default), weekly (mode 4: Mondays only) or none (mode 3, OFF).
--
--   mode  1 IMMEDIATE, 3 OFF, 4 WEEKLY (a summary type only; crm-backend
--         refuses it on any other prefix). 2, DAILY_DIGEST, stays reserved:
--         nothing batches immediate emails into a digest.
--
-- The column's CHECK was inline, so Postgres named it
-- notification_preference_mode_check; it becomes the named
-- ck_notification_preference_mode, as in database_script/init.sql and
-- tests/sql/init.sql. Re-running the script changes nothing.
--
-- There is no migration runner. Apply it by hand:
--
--   psql <conn> -f database_script/2026-11-01_notification_preference_weekly.sql
--
-- In dev:
--
--   docker compose -f docker-compose.dev.yml exec -T postgres --     psql -U crm_svc -d crm_db -f - < crm-backend/database_script/2026-11-01_notification_preference_weekly.sql
--
-- Production applies the ported twin instead:
-- optimce-migrator/migrations/optimce-crm/020_notification_preference_weekly.sql.

BEGIN;

ALTER TABLE notification_preference
    DROP CONSTRAINT IF EXISTS notification_preference_mode_check,
    DROP CONSTRAINT IF EXISTS ck_notification_preference_mode,
    ADD CONSTRAINT ck_notification_preference_mode CHECK (mode IN (1, 3, 4));

COMMIT;
