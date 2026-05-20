-- Tracks per-feature subscription state for each community.
-- Rows are written by external annex services (e.g. allocation-key-generation)
-- through their /subscribe and /unsubscribe endpoints. The CRM backend reads
-- this table to expose which annex modules a community has active.
CREATE TABLE IF NOT EXISTS community_subscription (
    id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_community INTEGER     NOT NULL,
    feature      VARCHAR(64) NOT NULL,
    is_active    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_community_subscription_community_feature
        UNIQUE (id_community, feature)
);
CREATE INDEX IF NOT EXISTS idx_community_subscription_community
    ON community_subscription (id_community);

CREATE TRIGGER update_community_subscription_modtime
BEFORE UPDATE ON community_subscription
FOR EACH ROW
EXECUTE FUNCTION update_changetimestamp_column();
