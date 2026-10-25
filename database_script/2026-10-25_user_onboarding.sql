-- 2026-10-25 — user_onboarding: which in-app onboarding tours a user was offered.
--
-- The frontend offers a Steppy tour at a few key moments (first login, first
-- time as member / manager / admin of a community). This table only stores the
-- answer, one row per (user, tour): the frontend decides when to offer.
--
--   * No row        = never offered. ANY row, whatever its outcome, means
--                     "already offered": the tour is never offered again.
--   * tour_key      = deliberately NOT constrained here, so a future tour needs
--                     no migration. The API validates it against
--                     ONBOARDING_TOUR_KEYS (src/modules/onboarding/shared).
--   * outcome       = dismissed | started | completed | abandoned | backfilled.
--                     The API only allows started -> completed | abandoned once
--                     a row exists; `backfilled` is written by this script only.
--   * tour_version  = the tour's content hash when the frontend knows it, so a
--                     later release can re-offer a tour after a major rewrite.
--
-- Backfill — the policy Eric chose on 2026-10-25: every EXISTING user is marked
-- `backfilled` for `welcome`, and for each role tour they are already eligible
-- to. Without it, every current user would get the welcome dialog on their next
-- login. Each tour has its own INSERT below, so the policy is easy to change.
--
-- The backfill runs ONLY when this script creates the table. Re-running it is
-- safe, and does NOT mark the users who signed up since as having seen the
-- tours (a plain re-run of the INSERTs would).
--
-- tests/sql/init.sql mirrors the table and the four INSERTs (after its seed
-- data); tests/functionals/onboarding/user-onboarding-migration.functional.test.ts
-- runs this file and checks that both agree.
--
-- There is no migration runner. Apply it by hand:
--
--   psql <conn> -f database_script/2026-10-25_user_onboarding.sql
--
-- In dev:
--
--   docker compose -f docker-compose.dev.yml exec -T postgres \
--     psql -U crm_svc -d crm_db -f - < crm-backend/database_script/2026-10-25_user_onboarding.sql
--
-- Production applies the ported twin instead:
-- optimce-migrator/migrations/optimce-crm/015_user_onboarding.sql.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.user_onboarding') IS NOT NULL THEN
    RAISE NOTICE 'user_onboarding already exists: nothing to do, backfill skipped';
    RETURN;
  END IF;

  CREATE TABLE user_onboarding (
      id_user      INT NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
      tour_key     VARCHAR(64) NOT NULL,
      outcome      VARCHAR(16) NOT NULL
                   CHECK (outcome IN ('dismissed', 'started', 'completed', 'abandoned', 'backfilled')),
      tour_version VARCHAR(128),
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (id_user, tour_key)
  );

  -- welcome: every existing user.
  INSERT INTO user_onboarding (id_user, tour_key, outcome)
  SELECT u.id, 'welcome', 'backfilled' FROM app_user u
  ON CONFLICT DO NOTHING;

  -- community_admin: admin of at least one community (member or not).
  INSERT INTO user_onboarding (id_user, tour_key, outcome)
  SELECT DISTINCT cu.id_user, 'community_admin', 'backfilled'
  FROM community_user cu WHERE cu.role = 'ADMIN'
  ON CONFLICT DO NOTHING;

  -- community_manager: manager of at least one community.
  INSERT INTO user_onboarding (id_user, tour_key, outcome)
  SELECT DISTINCT cu.id_user, 'community_manager', 'backfilled'
  FROM community_user cu WHERE cu.role = 'MANAGER'
  ON CONFLICT DO NOTHING;

  -- community_member: MEMBER role somewhere, or linked to an ACTIVE member
  -- (status 1) — the same definition the frontend applies when it offers it.
  INSERT INTO user_onboarding (id_user, tour_key, outcome)
  SELECT cu.id_user, 'community_member', 'backfilled'
  FROM community_user cu WHERE cu.role = 'MEMBER'
  UNION
  SELECT uml.id_user, 'community_member', 'backfilled'
  FROM user_member_link uml JOIN member m ON m.id = uml.id_member
  WHERE m.status = 1
  ON CONFLICT DO NOTHING;
END
$$;

COMMIT;
