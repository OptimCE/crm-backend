-- 2026-10-29 — regulatory_link_status: what the GRD and the regulator have
-- authorised for an operation's meters and keys.
--
-- meter_data and sharing_operation_key say what the CRM WANTS; this table says
-- what is AUTHORISED, one row per episode of a subject (EAN or key id) in an
-- operation, opened by one dossier of the administrative annexe. It is a table
-- of its own rather than columns on meter_data because meter_data is a
-- configuration history that addMeterData splits and copies forward on every
-- meter change (rate, holder, GRD), and its dates describe the wanted state.
--
-- WRITTEN BY THE ANNEXE ONLY, through the four effect columns
-- (regulatory_status, valid_from, valid_to, regulatory_ref). Its DB role gets
-- INSERT on the table and UPDATE on those four columns in
-- postgres/provision/30-crm-grants.sql; crm-backend only reads it. Nothing in
-- the core emits an outbox event for this table.
--
--   subject_type       1 meter (subject_ref = EAN), 2 key (subject_ref = key id)
--   regulatory_status  1 to_notify, 2 pending_grd, 3 pending_regulator,
--                      4 authorized, 5 active, 6 leaving, 7 ended, 8 refused
--
-- ex_regulatory_link_one_operation: an EAN is pending, authorised or active in
-- a single operation on a given date, whoever writes. Needs btree_gist (a
-- trusted extension: the database owner may create it).
--
-- database_script/init.sql and tests/sql/init.sql carry the same objects.
--
-- There is no migration runner. Apply it by hand:
--
--   psql <conn> -f database_script/2026-10-29_regulatory_link_status.sql
--
-- In dev:
--
--   docker compose -f docker-compose.dev.yml exec -T postgres --     psql -U crm_svc -d crm_db -f - < crm-backend/database_script/2026-10-29_regulatory_link_status.sql
--
-- Production applies the ported twin instead:
-- optimce-migrator/migrations/optimce-crm/017_regulatory_link_status.sql.

BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS regulatory_link_status (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_community         INT NOT NULL REFERENCES community (id) ON DELETE CASCADE,
    id_sharing_operation INT NOT NULL REFERENCES sharing_operation (id) ON DELETE CASCADE,
    subject_type         SMALLINT NOT NULL CHECK (subject_type IN (1, 2)),
    subject_ref          VARCHAR(64) NOT NULL,
    id_dossier_origin    BIGINT NOT NULL,
    regulatory_status    SMALLINT NOT NULL CHECK (regulatory_status BETWEEN 1 AND 8),
    valid_from           DATE,
    valid_to             DATE,
    regulatory_ref       VARCHAR(64),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_regulatory_link_episode UNIQUE (id_dossier_origin, subject_type, subject_ref),
    CONSTRAINT ck_regulatory_link_validity CHECK (valid_from IS NULL OR valid_to IS NULL OR valid_from <= valid_to),
    CONSTRAINT ex_regulatory_link_one_operation EXCLUDE USING gist (
        subject_ref WITH =,
        daterange(valid_from, valid_to, '[]') WITH &&
    ) WHERE (subject_type = 1 AND regulatory_status IN (2, 3, 4, 5))
);
CREATE INDEX IF NOT EXISTS ix_regulatory_link_operation ON regulatory_link_status (id_community, id_sharing_operation);
DROP TRIGGER IF EXISTS update_regulatory_link_status_modtime ON regulatory_link_status;
CREATE TRIGGER update_regulatory_link_status_modtime BEFORE UPDATE ON regulatory_link_status FOR EACH ROW EXECUTE PROCEDURE update_changetimestamp_column();

COMMIT;
