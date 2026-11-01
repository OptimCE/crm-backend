import { CORE_EVENTS, type CoreEventType } from "../../../shared/outbox/core-events.js";
import type { Community } from "../domain/community.models.js";

/**
 * Who represents the community, and the dates of its statutes and internal rules: the
 * community data a regulator must be told about when it changes (espace administratif,
 * phase 4; CWaPE: CE_ACTUALISATION, and a PARTAGE_MODIF per operation for the
 * representative).
 */
export const REPRESENTATIVE_FIELDS = ["representative_first_name", "representative_last_name", "representative_email"] as const;
export const REGULATORY_IDENTITY_FIELDS = [...REPRESENTATIVE_FIELDS, "statutes_date", "internal_rules_date"] as const;

type RegulatoryIdentity = Pick<Community, (typeof REGULATORY_IDENTITY_FIELDS)[number]>;

export interface RegulatoryIdentityEvent {
  event_type: CoreEventType;
  payload: Record<string, unknown>;
}

function text(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

/** A `date` column comes back as `YYYY-MM-DD`; a Date is tolerated all the same. */
function day(value: string | Date | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

function representativeValue(identity: RegulatoryIdentity, field: (typeof REPRESENTATIVE_FIELDS)[number]): string | null {
  const value = text(identity[field]);
  return field === "representative_email" && value !== null ? value.toLowerCase() : value;
}

/**
 * The core events an update of these fields means, from the row before to the row after.
 *
 * Only a CHANGE of a recorded value is an event: recording a representative or a date for
 * the first time is the CRM catching up with what the regulator already knows, and clearing
 * one gives the regulator nothing new to hear. The representative's names and email are
 * personal data, so its event names the fields that changed, never their values.
 */
export function regulatoryIdentityEvents(before: RegulatoryIdentity, after: RegulatoryIdentity): RegulatoryIdentityEvent[] {
  const events: RegulatoryIdentityEvent[] = [];

  const recorded = REPRESENTATIVE_FIELDS.some((field) => representativeValue(before, field) !== null);
  const present = REPRESENTATIVE_FIELDS.some((field) => representativeValue(after, field) !== null);
  const changed = REPRESENTATIVE_FIELDS.filter((field) => representativeValue(before, field) !== representativeValue(after, field));
  if (recorded && present && changed.length > 0) {
    events.push({ event_type: CORE_EVENTS.COMMUNITY_REPRESENTATIVE_CHANGED, payload: { fields: changed } });
  }

  const dated: [keyof RegulatoryIdentity, CoreEventType][] = [
    ["statutes_date", CORE_EVENTS.COMMUNITY_STATUTES_CHANGED],
    ["internal_rules_date", CORE_EVENTS.COMMUNITY_ROI_CHANGED],
  ];
  for (const [field, event_type] of dated) {
    const was = day(before[field]);
    const now = day(after[field]);
    if (was !== null && now !== null && was !== now) {
      events.push({ event_type, payload: { [field]: now, [`previous_${field}`]: was } });
    }
  }
  return events;
}
