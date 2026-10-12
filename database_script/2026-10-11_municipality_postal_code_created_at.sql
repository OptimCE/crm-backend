-- 2026-10-11 — municipality_postal_code.created_at.
--
-- The `MunicipalityPostalCode` entity
-- (src/modules/municipalities/domain/municipality.models.ts) declares
-- `@CreateDateColumn created_at`, and TypeORM selects every entity column by
-- name, so loading a municipality with its postal codes fails on
-- `column ... created_at does not exist` wherever the column is missing.
--
-- tests/sql/init.sql (what the dev stack mounts) always had it. This
-- directory's init.sql — the base schema production vendors as
-- `schemas/crm_db.sql` — and 2026-05-03_sharing_operation_municipality.sql did
-- not, until this release fixed both. Both use `CREATE TABLE IF NOT EXISTS`, so
-- a database stood up from the old init.sql keeps the old table; this adds the
-- column there and is a no-op everywhere else.
--
-- `current_timestamp` is not volatile, so existing rows take the value of this
-- ALTER without a table rewrite.
--
-- Idempotent: safe to re-run.
--
-- There is no migration runner (src/shared/database/database.connector.ts sets
-- `synchronize: false` and declares no migrations). Apply it by hand:
--
--   psql <conn> -f database_script/2026-10-11_municipality_postal_code_created_at.sql
--
-- Production applies the ported twin instead:
-- optimce-migrator/migrations/optimce-crm/013_municipality_postal_code_created_at.sql.

BEGIN;

ALTER TABLE municipality_postal_code
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT current_timestamp;

COMMIT;
