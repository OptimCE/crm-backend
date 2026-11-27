-- Migration: 2026-11-21 — the community's public contact.
--
-- The public communities directory lets any signed-in user see a public
-- community's description, website and headquarters, and now contact it in one
-- click (mailto: / tel: links). The CRM had no contact meant for publication:
-- representative_email is the representative's own address towards the GRD and
-- the regulator, personal data that was never meant for the directory.
--
--   * contact_email, contact_phone: the community's public contact, set by an
--     ADMIN in "Infos de la communauté" and shown in the directory. Nothing is
--     published while they are empty.
--
-- All optional (nullable). Idempotent: safe to re-run.
--
-- Production applies the ported twin instead:
-- optimce-migrator/migrations/optimce-crm/022_community_public_contact.sql.

BEGIN;

ALTER TABLE community
    ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255) NULL;

ALTER TABLE community
    ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(32) NULL;

COMMIT;
