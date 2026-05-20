-- Migration: 2026-05-03 — public sharing operation improvement.
--
-- Adds:
--   * `municipality`               — Belgian municipalities reference (PK = NIS code).
--   * `municipality_postal_code`   — postal code <-> NIS code lookup.
--   * `sharing_operation_municipality` — many-to-many join between sharing operations
--     and the municipalities they cover.
--
-- The municipality reference data is loaded separately (source: opendata.brussels.be,
-- "codes-ins-nis-postaux-belgique"). This script only creates the structure.
--
-- Idempotent: safe to re-run.
--
-- Apply on existing databases with:
--   psql -d <db> -f database_script/2026-05-03_sharing_operation_municipality.sql

BEGIN;

-- 1. Reference table for municipalities.
CREATE TABLE IF NOT EXISTS municipality (
    nis_code   INT PRIMARY KEY,
    fr_name    VARCHAR(255) NOT NULL,
    nl_name    VARCHAR(255),
    de_name    VARCHAR(255),
    region_fr  VARCHAR(64),
    region_nl  VARCHAR(64),
    geo_point  JSONB,
    geo_shape  JSONB,
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp
);
CREATE INDEX IF NOT EXISTS idx_municipality_fr_name ON municipality (fr_name);
CREATE INDEX IF NOT EXISTS idx_municipality_nl_name ON municipality (nl_name);

DROP TRIGGER IF EXISTS update_municipality_modtime ON municipality;
CREATE TRIGGER update_municipality_modtime
BEFORE UPDATE ON municipality
FOR EACH ROW
EXECUTE FUNCTION update_changetimestamp_column();

-- 2. Postal-code lookup (a municipality may have several postcodes; a postcode may
--    span several municipalities — e.g., Bruxelles).
CREATE TABLE IF NOT EXISTS municipality_postal_code (
    postal_code VARCHAR(10) NOT NULL,
    nis_code    INT NOT NULL REFERENCES municipality (nis_code) ON DELETE CASCADE,
    PRIMARY KEY (postal_code, nis_code)
);
CREATE INDEX IF NOT EXISTS idx_municipality_postal_code_nis
    ON municipality_postal_code (nis_code);

-- 3. Many-to-many: sharing operations <-> municipalities they cover.
CREATE TABLE IF NOT EXISTS sharing_operation_municipality (
    id_sharing_operation INT NOT NULL REFERENCES sharing_operation (
        id
    ) ON DELETE CASCADE,
    nis_code             INT NOT NULL REFERENCES municipality (
        nis_code
    ) ON DELETE RESTRICT,
    created_at           TIMESTAMP DEFAULT current_timestamp,
    PRIMARY KEY (id_sharing_operation, nis_code)
);
CREATE INDEX IF NOT EXISTS idx_sharing_op_muni_nis
    ON sharing_operation_municipality (nis_code);

COMMIT;
