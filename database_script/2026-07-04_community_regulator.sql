-- Migration: 2026-07-04 — add the `regulator` coded field to community.
--
-- Each Belgian energy community is notified to exactly one regulator
-- (Wallonia -> CWaPE, Brussels -> Brugel, Flanders -> VREG). This adds a
-- non-nullable coded `regulator` column. The valid set is the shared registry
-- reference/regulators.json; the CHECK below is an optional DB guard and must be
-- extended only when a genuinely new code goes live.
--
-- Backfill: the platform is Wallonia-only today, so the column is added with a
-- DEFAULT of 'BE-WAL-CWAPE', which backfills every existing row, then kept NOT
-- NULL. Idempotent: safe to re-run.

BEGIN;

ALTER TABLE community
    ADD COLUMN IF NOT EXISTS regulator VARCHAR(32) NOT NULL DEFAULT 'BE-WAL-CWAPE';

ALTER TABLE community DROP CONSTRAINT IF EXISTS chk_community_regulator;
ALTER TABLE community
    ADD CONSTRAINT chk_community_regulator
    CHECK (regulator IN ('BE-WAL-CWAPE', 'BE-BRU-BRUGEL', 'BE-VLA-VREG'));

CREATE INDEX IF NOT EXISTS idx_community_regulator ON community (regulator);

COMMIT;
