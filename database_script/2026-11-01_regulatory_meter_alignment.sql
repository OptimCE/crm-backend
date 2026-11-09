-- 2026-11-01 — one status for a meter in an operation.
--
-- With the administrative annexe active, a meter in an operation used to show
-- two statuses: the CRM's own (meter_data.status, set by hand: waiting for the
-- GRD, then approved) and the procedure's (regulatory_link_status). The
-- procedure's now drives the CRM's: when the annexe writes an episode ACTIVE
-- (5) from valid_from, this trigger turns the meter's waiting rows of that
-- operation (WAITING_GRD 3, WAITING_MANAGER 4) ACTIVE (1) from that date. So
-- billing, live data, the forms' pre-fill, the dashboard and the member views,
-- which all read meter_data.status, follow the procedure without knowing it.
--
-- What it does, for the meter's rows of that operation that are waiting and
-- overlap [valid_from, valid_to]:
--   - a row starting before valid_from is cut there, the way addMeterData cuts
--     (the row ends valid_from - 1, a copy starts valid_from);
--   - a row reaching past valid_to (when set) is cut after it, the remainder
--     keeping its status;
--   - the part inside turns ACTIVE.
-- It changes the status only, never the operation, so no outbox event follows
-- (a status-only change emits none, as with patchMeterStatus). Removals keep
-- the date the manager typed; refused, withdrawn and ended episodes leave
-- meter_data alone (a refusal deletes nothing in the CRM).
--
-- The annexe's DB role still cannot write meter_data: the trigger function is
-- SECURITY DEFINER (it runs as the table owner) and, returning `trigger`,
-- cannot be called directly. meter_data_split is not exposed to anyone else
-- (EXECUTE revoked from PUBLIC). Columns are copied generically, so a column
-- added to meter_data later is carried by the cut without touching this file.
--
-- database_script/init.sql and tests/sql/init.sql carry the same objects.
--
-- There is no migration runner. Apply it by hand:
--
--   psql <conn> -f database_script/2026-11-01_regulatory_meter_alignment.sql
--
-- In dev:
--
--   docker compose -f docker-compose.dev.yml exec -T postgres --     psql -U crm_svc -d crm_db -f - < crm-backend/database_script/2026-11-01_regulatory_meter_alignment.sql
--
-- Production applies the ported twin instead:
-- optimce-migrator/migrations/optimce-crm/019_regulatory_meter_alignment.sql.

BEGIN;

CREATE OR REPLACE FUNCTION meter_data_split(p_id INT, p_at DATE) RETURNS INT
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_columns TEXT;
    v_new_id  INT;
BEGIN
    SELECT string_agg(quote_ident(attname), ', ' ORDER BY attnum)
      INTO v_columns
      FROM pg_attribute
     WHERE attrelid = 'meter_data'::regclass
       AND attnum > 0
       AND NOT attisdropped
       AND attidentity = ''
       AND attgenerated = ''
       AND attname NOT IN ('id', 'start_date', 'created_at', 'updated_at');
    EXECUTE format(
        'INSERT INTO meter_data (start_date, %1$s) SELECT $2, %1$s FROM meter_data WHERE id = $1 RETURNING id',
        v_columns
    ) INTO v_new_id USING p_id, p_at;
    UPDATE meter_data SET end_date = p_at - 1 WHERE id = p_id;
    RETURN v_new_id;
END;
$$;
REVOKE ALL ON FUNCTION meter_data_split(INT, DATE) FROM PUBLIC;

CREATE OR REPLACE FUNCTION align_meter_data_with_regulatory() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    r        RECORD;
    v_target INT;
BEGIN
    FOR r IN
        SELECT id, start_date, end_date
          FROM meter_data
         WHERE id_community = NEW.id_community
           AND id_sharing_operation = NEW.id_sharing_operation
           AND ean = NEW.subject_ref
           AND status IN (3, 4)
           AND (end_date IS NULL OR end_date >= NEW.valid_from)
           AND (NEW.valid_to IS NULL OR start_date <= NEW.valid_to)
         ORDER BY start_date
         FOR UPDATE
    LOOP
        v_target := r.id;
        IF r.start_date < NEW.valid_from THEN
            v_target := meter_data_split(r.id, NEW.valid_from);
        END IF;
        IF NEW.valid_to IS NOT NULL AND (r.end_date IS NULL OR r.end_date > NEW.valid_to) THEN
            PERFORM meter_data_split(v_target, NEW.valid_to + 1);
        END IF;
        UPDATE meter_data SET status = 1 WHERE id = v_target;
    END LOOP;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS align_meter_data_on_activation ON regulatory_link_status;
CREATE TRIGGER align_meter_data_on_activation
    AFTER INSERT OR UPDATE OF regulatory_status, valid_from, valid_to ON regulatory_link_status
    FOR EACH ROW
    WHEN (NEW.subject_type = 1 AND NEW.regulatory_status = 5 AND NEW.valid_from IS NOT NULL)
    EXECUTE FUNCTION align_meter_data_with_regulatory();

COMMIT;
