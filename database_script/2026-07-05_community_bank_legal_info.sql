-- Migration: 2026-07-05 — add bank & legal identity fields to community.
--
-- A community needs a legal/financial identity for billing, invoicing and
-- administrative documents: VAT number, official legal (registered) name, and
-- bank details (IBAN + optional account holder name). All four are optional
-- (nullable) free-text columns; the registered/legal address reuses the
-- existing headquarters_address, so no address change is needed here.
--
-- `account_holder_name` is only populated when it differs from `legal_name`
-- (an account held under the legal name is not stored separately) — this is
-- enforced at the application layer, not by a DB constraint.
--
-- Idempotent: safe to re-run.

BEGIN;

ALTER TABLE community
    ADD COLUMN IF NOT EXISTS vat_number VARCHAR(32) NULL;

ALTER TABLE community
    ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255) NULL;

ALTER TABLE community
    ADD COLUMN IF NOT EXISTS iban VARCHAR(34) NULL;

ALTER TABLE community
    ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(255) NULL;

COMMIT;
