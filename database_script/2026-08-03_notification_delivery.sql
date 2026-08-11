-- Migration: 2026-08-03 — notification delivery layer (email).
--
-- Adds the channel-agnostic outbound queue that turns an in-app notification
-- into a delivered email, the suppression list that protects the sending
-- reputation, and the per-recipient channel preferences that decide what is
-- deliverable at all. Producers keep calling `publish(...)` unchanged; the
-- enqueue happens inside that call, on the caller's transaction, so "the
-- business write committed => the message is queued" is an invariant rather
-- than a hope. Sending is done out-of-process by the `notification-dispatch`
-- worker, which polls this table.
--
-- Notes:
--   * `outbound_message.id_notification` is NULLABLE on purpose: an invitation
--     to an address with no account has no notification row to hang off,
--     because `notification.id_user` is NOT NULL. That is the case this whole
--     workstream exists for. ON DELETE SET NULL rather than CASCADE — a
--     notification purge must not silently delete queued-but-unsent email, and
--     `recipient` is a literal address so the row stays meaningful without it.
--   * `recipient` and `recipient_name` are resolved at enqueue time and stored
--     literally, so a later change of address never silently redirects an
--     already-queued message. This is also why the dispatch worker needs no
--     join to `app_user` (there is no `id_user` column here, by design).
--   * `category` is persisted because the dispatcher has to decide whether to
--     render an unsubscribe/preferences footer, and deriving that from `type`
--     would duplicate the producer's policy declaration in a second place —
--     exactly what the orthogonal (category, channels) contract exists to
--     prevent. TRANSACTIONAL mail must never offer an opt-out.
--   * Coded columns are SMALLINT with CHECK constraints. The values are the
--     on-disk encoding shared with both languages' `Channel` /
--     `NotificationCategory` enums and must never be renumbered.
--   * `status = 5 CLAIMED` plus `claimed_at` is what makes the worker
--     crash-safe: `attempts` is incremented when a row is CLAIMED, not when a
--     send is caught failing, so a message that kills the process still exhausts
--     its attempts instead of looping forever. A reaper returns rows whose
--     `claimed_at` is older than the transport timeout to PENDING.
--   * `dedupe_key` is the whole idempotency defence: a redelivered event, a
--     re-run sweep and a retried request must all collapse to one row. Format:
--         <channel>:<type>:u<id_user>:<h>                  (account-ful)
--         <channel>:<type>:a<sha256(lower(address))[:16]>:<h>  (account-less)
--         h = sha256(canonical_json(data))[:32]
--     CAUTION: there is no time bucket, so `data` IS the idempotency key FOR
--     ALL TIME. Two genuinely distinct occurrences of the same type to the same
--     recipient with identical `data` collapse to a single message. A producer
--     whose sweep can re-emit without mutating its source row must pass an
--     explicit `dedupe_key` including the occurrence date (see
--     `admin_deadline.due_soon`).
--   * `email_suppression.email` stores LOWER-CASED addresses. `app_user.email`
--     is a case-sensitive TEXT UNIQUE and providers report bounces with
--     arbitrary case, so every write path must normalise or the list silently
--     misses.
--   * `notification_preference.mode` allows only 1 IMMEDIATE and 3 OFF.
--     2 DAILY_DIGEST is reserved in the encoding but has no runner; a value the
--     database accepts and the code silently treats as IMMEDIATE is a value
--     somebody eventually writes by hand. Relax the CHECK with the digest.
--   * `app_user.locale` has no source of truth today — the frontend picks a
--     language client-side and never persists it. Email has no other source, so
--     the column is added here and written by the profile update path.
--
-- Idempotent: safe to re-run.
--
-- Apply on existing databases with:
--   psql -d <db> -f database_script/2026-08-03_notification_delivery.sql

BEGIN;

-- Channel-agnostic outbound queue. One row per (message, channel, recipient).
CREATE TABLE IF NOT EXISTS outbound_message (
    id              BIGSERIAL PRIMARY KEY,
    id_notification BIGINT NULL REFERENCES notification (id) ON DELETE SET NULL,
    id_community    INT NULL REFERENCES community (id) ON DELETE CASCADE,
    -- Channel: 1 INAPP, 2 EMAIL
    channel         SMALLINT NOT NULL CHECK (channel IN (1, 2)),
    recipient       VARCHAR(320) NOT NULL,
    recipient_name  VARCHAR(255) NULL,
    -- '' means "unknown"; the dispatcher applies its own default locale.
    locale          VARCHAR(8) NOT NULL DEFAULT '',
    -- Same taxonomy as notification.type.
    type            VARCHAR(128) NOT NULL,
    -- NotificationCategory: 1 TRANSACTIONAL, 2 INFORMATIONAL
    category        SMALLINT NOT NULL CHECK (category IN (1, 2)),
    data            JSONB NOT NULL DEFAULT '{}'::jsonb,
    dedupe_key      VARCHAR(200) NOT NULL,
    -- 1 PENDING, 2 SENT, 3 FAILED, 4 SUPPRESSED, 5 CLAIMED
    status          SMALLINT NOT NULL DEFAULT 1 CHECK (status IN (1, 2, 3, 4, 5)),
    attempts        SMALLINT NOT NULL DEFAULT 0,
    last_error      TEXT NULL,
    scheduled_for   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    claimed_at      TIMESTAMPTZ NULL,
    sent_at         TIMESTAMPTZ NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotency: ON CONFLICT DO NOTHING at enqueue.
CREATE UNIQUE INDEX IF NOT EXISTS uq_outbound_message_dedupe
    ON outbound_message (dedupe_key);

-- The claim query. Partial so the index stays the size of the backlog.
CREATE INDEX IF NOT EXISTS ix_outbound_message_due
    ON outbound_message (scheduled_for) WHERE status = 1;

-- The reaper query: rows a worker claimed and then died holding.
CREATE INDEX IF NOT EXISTS ix_outbound_message_stale
    ON outbound_message (claimed_at) WHERE status = 5;

-- Addresses that must never be emailed again. Stored lower-cased.
CREATE TABLE IF NOT EXISTS email_suppression (
    email      VARCHAR(320) PRIMARY KEY,
    -- 1 HARD_BOUNCE, 2 COMPLAINT, 3 UNSUBSCRIBED, 4 MANUAL
    reason     SMALLINT NOT NULL CHECK (reason IN (1, 2, 3, 4)),
    detail     TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-recipient channel policy. Consulted only for INFORMATIONAL notifications:
-- TRANSACTIONAL (an invoice, an invitation, a missed regulatory deadline)
-- overrides preference entirely and is not opt-out-able.
CREATE TABLE IF NOT EXISTS notification_preference (
    id_user     INT NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    -- '' = the default for every type; else the first dot-segment of the type
    -- key ('invoice', 'admin_deadline', …). Most specific wins.
    type_prefix VARCHAR(128) NOT NULL,
    -- Channel: 1 INAPP, 2 EMAIL
    channel     SMALLINT NOT NULL CHECK (channel IN (1, 2)),
    -- 1 IMMEDIATE, 3 OFF (2 DAILY_DIGEST reserved, no runner yet)
    mode        SMALLINT NOT NULL CHECK (mode IN (1, 3)),

    PRIMARY KEY (id_user, type_prefix, channel)
);

-- No user locale is stored anywhere today: the frontend picks a language
-- client-side and never persists it. Email has no other source of truth.
ALTER TABLE app_user
    ADD COLUMN IF NOT EXISTS locale VARCHAR(8) NULL;

COMMIT;
