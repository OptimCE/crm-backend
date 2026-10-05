-- 2026-09-22 — meter.ean is exactly 18 digits.
--
-- A Belgian EAN — the DSO's connection identifier and this table's primary key
-- — is 18 digits, starting 54144x. `meter.ean` is an unbounded VARCHAR with no
-- CHECK, and until the release this ships with, `POST /meters {"EAN":"123"}`
-- was accepted: the only format rule in the platform lived in the browser.
-- crm-backend now rejects anything but 18 digits on the one path that mints an
-- EAN (`CreateMeterDTO`, src/modules/meters/shared/ean.ts). This closes direct
-- SQL.
--
-- 18 digits, and nothing more. No `54` prefix requirement: that is a convention
-- of the issuing DSOs, and this repo's own functional fixtures
-- (`123456789012345678`, `999999999999999999`) are deliberately outside it. No
-- GS1 mod-10 check digit either — `541448200000000001`, the EAN every seed, e2e
-- spec and RESA test workbook is built on, FAILS mod-10 (its check digit would
-- be 8), so a checksum here would reject the platform's own data.
--
-- SCOPE — `meter.ean` ONLY. `meter_data.ean` and `meter_consumption.ean` are
-- foreign keys to it and so already constrained transitively; a CHECK on either
-- would additionally make THEIR rows read-only, and `meter_data` IS updated.
-- `consumer.name` holds an EAN by convention only and is free text by design.
--
-- VALIDATED, NOT `NOT VALID`, deliberately. Postgres re-evaluates a CHECK on
-- every UPDATE of the row whether or not the checked column changed, NOT VALID
-- included (the skip-if-unchanged optimisation is FK-only). So NOT VALID would
-- buy nothing but a hidden trap: every legacy non-conforming meter would become
-- READ-ONLY, its address never repairable. And nothing in the platform can
-- rewrite an EAN — `updateMeter` and `updateMeterAddress` use it only in the
-- WHERE clause — so the only remedy would be DELETE, which cascades
-- `meter_data` and `meter_consumption` away.
--
-- Hence the guard below: this script REFUSES to apply to a database it would
-- trap, and the RAISE aborts the transaction so nothing is left half-done.
--
-- RUN `postgres/verify/ean-survey.sh` FIRST (read-only; exits 0 clean /
-- 1 dirty / 2 could-not-look). Expect production to need a real look: the
-- deployed crm-frontend image enforced a THIRTEEN-digit rule from 2026-06-08
-- until this release, so the old form accepted exactly 13 digits and rows
-- created through it will fail this constraint.
--
-- ORDERING — SAFE ONLINE, unlike 2026-08-30. No column type change, no rewrite,
-- no backfill. ADD CONSTRAINT takes ACCESS EXCLUSIVE on `meter` for one
-- sequential scan, milliseconds at this volume; crm-backend may stay up.
-- `SET LOCAL lock_timeout` matters because the default of 0 turns a lock wait
-- into an outage: a live backend holding an open transaction would otherwise
-- make this wait forever with every later query queued behind it.
--
-- REVERSIBLE: `ALTER TABLE meter DROP CONSTRAINT chk_meter_ean_18_digits;`
--
-- Idempotent: safe to re-run.
--
-- There is no migration runner (src/shared/database/database.connector.ts sets
-- `synchronize: false` and declares no migrations), and
-- postgres/provision/provision.sh applies a schema only to a database with no
-- relations — so an existing database does NOT pick this up from
-- tests/sql/init.sql. Apply it by hand:
--
--   psql <conn> -f database_script/2026-09-22_meter_ean_18_digits.sql
--
-- In the dev stack:
--
--   docker compose -f docker-compose.dev.yml exec -T postgres \
--     psql -U crm_svc -d crm_db -f - < crm-backend/database_script/2026-09-22_meter_ean_18_digits.sql
--
-- Production applies the ported twin instead:
-- optimce-migrator/migrations/optimce-crm/012_meter_ean_18_digits.sql.

BEGIN;

SET LOCAL lock_timeout = '5s';

-- Refuse rather than trap. See the VALIDATED note above.
DO $$
DECLARE
    offending bigint;
    sample    text;
BEGIN
    SELECT count(*) INTO offending FROM meter WHERE ean !~ '^[0-9]{18}$';

    IF offending > 0 THEN
        SELECT string_agg(ean, ', ') INTO sample
        FROM (
            SELECT ean FROM meter WHERE ean !~ '^[0-9]{18}$' ORDER BY ean LIMIT 5
        ) s;

        RAISE EXCEPTION
            'meter.ean: % row(s) are not 18 digits (e.g. %). This constraint '
            'would make them read-only, and nothing in the platform can rewrite '
            'a meter EAN, so the only remedy left would be DELETE — which '
            'cascades meter_data and meter_consumption away. Run '
            'postgres/verify/ean-survey.sh, re-encode or retire those meters, '
            'then re-run this script.',
            offending, sample;
    END IF;
END
$$;

ALTER TABLE meter DROP CONSTRAINT IF EXISTS chk_meter_ean_18_digits;
ALTER TABLE meter ADD CONSTRAINT chk_meter_ean_18_digits
CHECK (ean ~ '^[0-9]{18}$');

COMMIT;
