-- Migration: 2026-08-20 — add geolocation columns to address.
--
-- The map views (meters as pins, communities as commune zones) need a point per
-- address. `address` is the shared entity behind meters, members, users and the
-- community headquarters, so the columns live here rather than on `meter`: one
-- change plots all four.
--
-- `geocode_status` is the work queue, not decoration:
--   0 NEVER      — never attempted; picked up by POST /geocoding/backfill
--   1 OK         — latitude/longitude are set
--   2 NOT_FOUND  — the geocoders ran and matched nothing
--   3 ERROR      — the geocoders ran and failed (retryable)
-- `geo_precision` records HOW good the point is (1 MANUAL, 2 ROOFTOP, 3 STREET,
-- 4 MUNICIPALITY) so the UI can render an approximate pin differently and the
-- backfill knows which rows are worth upgrading.
--
-- The closing UPDATE seeds a municipality centroid for every address whose
-- postcode maps to exactly ONE commune. That makes the map non-empty the moment
-- this lands, with no network call. Postcodes spanning several communes (1000,
-- 1040, 1050 ...) are deliberately left at status 0: averaging two centroids
-- would produce a point that is between both communes and in neither, which
-- looks authoritative and is wrong. The geocoder resolves those from `city`.
--
-- Idempotent: safe to re-run.
--
-- There is no migration runner, and postgres/provision/provision.sh applies a
-- schema only to a database with no relations — so an existing local database
-- does NOT pick this up from tests/sql/init.sql. Apply it by hand:
--   psql <conn> -f database_script/2026-08-20_address_geolocation.sql

BEGIN;

ALTER TABLE address ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6);
ALTER TABLE address ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6);
ALTER TABLE address ADD COLUMN IF NOT EXISTS geo_precision SMALLINT;
ALTER TABLE address ADD COLUMN IF NOT EXISTS geo_source VARCHAR(32);
ALTER TABLE address ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMP;
ALTER TABLE address
ADD COLUMN IF NOT EXISTS geocode_status SMALLINT NOT NULL DEFAULT 0;

-- A half-set coordinate is worse than none: it plots on the equator or the
-- prime meridian. Keep the pair atomic.
ALTER TABLE address DROP CONSTRAINT IF EXISTS chk_address_geo_pair;
ALTER TABLE address ADD CONSTRAINT chk_address_geo_pair
CHECK ((latitude IS NULL) = (longitude IS NULL));

ALTER TABLE address DROP CONSTRAINT IF EXISTS chk_address_geo_range;
ALTER TABLE address ADD CONSTRAINT chk_address_geo_range
CHECK (
    latitude IS NULL
    OR (
        latitude BETWEEN -90 AND 90
        AND longitude BETWEEN -180 AND 180
    )
);

-- Partial index: the backfill only ever scans for status 0, and once the queue
-- is drained the index is empty and free.
CREATE INDEX IF NOT EXISTS idx_address_geocode_queue
ON address (geocode_status) WHERE geocode_status = 0;

-- Deterministic centroid seed. Only unambiguous postcodes; see the header.
UPDATE address AS a
SET
    latitude = round((m.geo_point -> 'coordinates' ->> 1)::NUMERIC, 6),
    longitude = round((m.geo_point -> 'coordinates' ->> 0)::NUMERIC, 6),
    geo_precision = 4,
    geo_source = 'municipality_centroid',
    geocoded_at = now(),
    geocode_status = 1
FROM (
    SELECT
        pc.postal_code,
        min(pc.nis_code) AS nis_code
    FROM municipality_postal_code AS pc
    GROUP BY pc.postal_code
    HAVING count(*) = 1
) AS uniq
INNER JOIN municipality AS m ON uniq.nis_code = m.nis_code
WHERE
    a.postcode = uniq.postal_code
    AND a.geocode_status = 0
    AND m.geo_point IS NOT NULL;

COMMIT;
