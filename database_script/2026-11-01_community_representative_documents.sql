-- Migration: 2026-11-01 — the community's representative and its founding documents.
--
-- Espace administratif, phase 4: the CWaPE must be told when a community's
-- representative, statutes or internal rules (ROI) change (CE_ACTUALISATION, and
-- a PARTAGE_MODIF per operation for the representative). The CRM had none of
-- them, so the core events community.representative_changed, statutes_changed
-- and roi_changed had no emitter.
--
--   * representative_first_name, representative_last_name, representative_email:
--     who represents the community towards the GRD and the CWaPE;
--   * statutes_date, internal_rules_date: the date of the statutes and of the
--     internal rules in force.
--
-- updateCommunity emits the event when a recorded value changes; recording one
-- for the first time is not a change the regulator must hear about.
--
-- All optional (nullable). Idempotent: safe to re-run.

BEGIN;

ALTER TABLE community
    ADD COLUMN IF NOT EXISTS representative_first_name VARCHAR(255) NULL;

ALTER TABLE community
    ADD COLUMN IF NOT EXISTS representative_last_name VARCHAR(255) NULL;

ALTER TABLE community
    ADD COLUMN IF NOT EXISTS representative_email VARCHAR(255) NULL;

ALTER TABLE community
    ADD COLUMN IF NOT EXISTS statutes_date DATE NULL;

ALTER TABLE community
    ADD COLUMN IF NOT EXISTS internal_rules_date DATE NULL;

COMMIT;
