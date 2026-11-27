import type { Address } from "../../../shared/address/address.models.js";
import type { Member } from "../../members/domain/member.models.js";
import type { Meter, MeterData } from "../../meters/domain/meter.models.js";
import type { Document } from "../../documents/domain/document.models.js";
import type { SharingOperation } from "../../sharing_operations/domain/sharing_operation.models.js";
import type { AllocationKey } from "../../keys/domain/key.models.js";
import type { User } from "../../users/domain/user.models.js";

/**
 * The items of the `crm` part's JSON files, built field by field from the entities the API's
 * reads return: what a file holds is decided here, never by what an entity happens to carry.
 * Keys are snake_case, timestamps ISO 8601 UTC, calendar dates `YYYY-MM-DD`, ids the internal
 * ones (stable across exports). Item schemas: contracts/export/schemas/files/crm/.
 */

/** A timestamp as ISO 8601 UTC; a `YYYY-MM-DD` date (TypeORM reads DATE columns as strings) unchanged. */
export function iso(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

type Ref = { id: number; name: string };

function ref(value: { id: number; name: string } | null | undefined): Ref | null {
  return value ? { id: value.id, name: value.name } : null;
}

export function address(a: Address | null | undefined): Record<string, unknown> | null {
  if (!a) return null;
  return {
    id: a.id,
    street: a.street,
    number: a.number,
    supplement: a.supplement ?? null,
    postcode: a.postcode,
    city: a.city,
    country: a.country,
    best_address_id: a.best_address_id ?? null,
    latitude: a.latitude ?? null,
    longitude: a.longitude ?? null,
    created_at: iso(a.created_at),
    updated_at: iso(a.updated_at),
  };
}

function manager(
  m: { id: number; NRN: string; name: string; surname: string; email: string; phone_number: string } | null | undefined,
): Record<string, unknown> | null {
  if (!m) return null;
  return { id: m.id, name: m.name, surname: m.surname, nrn: m.NRN ?? null, email: m.email ?? null, phone_number: m.phone_number ?? null };
}

/** A member with its addresses and its individual or company details (and their manager). */
export function member(m: Member): Record<string, unknown> {
  const individual = m.individual_details as Member["individual_details"] & { manager?: Parameters<typeof manager>[0] };
  const company = m.company_details as Member["company_details"] & { manager?: Parameters<typeof manager>[0] };
  return {
    id: m.id,
    community: ref(m.community as unknown as Ref),
    name: m.name,
    member_type: m.member_type,
    status: m.status,
    iban: m.IBAN ?? null,
    home_address: address(m.home_address),
    billing_address: address(m.billing_address),
    individual: individual
      ? {
          first_name: individual.first_name,
          nrn: individual.NRN ?? null,
          email: individual.email ?? null,
          phone_number: individual.phone_number ?? null,
          social_rate: individual.social_rate ?? null,
          manager: manager(individual.manager),
        }
      : null,
    company: company ? { vat_number: company.vat_number ?? null, manager: manager(company.manager) } : null,
    created_at: iso(m.created_at),
    updated_at: iso(m.updated_at),
  };
}

export function meterData(d: MeterData): Record<string, unknown> {
  return {
    id: d.id,
    start_date: iso(d.start_date),
    end_date: iso(d.end_date),
    status: d.status,
    description: d.description ?? null,
    sampling_power: d.sampling_power ?? null,
    amperage: d.amperage ?? null,
    rate: d.rate,
    client_type: d.client_type,
    injection_status: d.injection_status ?? null,
    production_chain: d.production_chain ?? null,
    total_generating_capacity: d.total_generating_capacity ?? null,
    grd: d.grd ?? null,
    grd_source: d.grd_source ?? null,
    member: ref(d.member as unknown as Ref),
    sharing_operation: d.sharing_operation ? { id: d.sharing_operation.id, name: d.sharing_operation.name, type: d.sharing_operation.type } : null,
    created_at: iso(d.created_at),
    updated_at: iso(d.updated_at),
  };
}

/** A meter and its history (`meter_data`), newest first, as the read that loaded it ordered it. */
export function meter(m: Meter): Record<string, unknown> {
  return {
    ean: m.EAN,
    meter_number: m.meter_number ?? null,
    community: ref(m.community as unknown as Ref),
    tarif_group: m.tarif_group,
    phases_number: m.phases_number,
    reading_frequency: m.reading_frequency,
    address: address(m.address),
    history: (m.meter_data ?? []).map(meterData),
    created_at: iso(m.created_at),
    updated_at: iso(m.updated_at),
  };
}

/** `file` is the document's path in the archive, or null when its object is missing from storage. */
export function documentItem(d: Document, file: string | null): Record<string, unknown> {
  return {
    id: d.id,
    community: ref(d.community as unknown as Ref),
    member: ref(d.member as unknown as Ref),
    file_name: d.file_name,
    file_type: d.file_type,
    file_size: d.file_size,
    upload_date: iso(d.upload_date),
    file,
    file_missing: file === null,
    created_at: iso(d.created_at),
    updated_at: iso(d.updated_at),
  };
}

/** An operation with its municipalities and the keys it applied, as the operation screen shows it. */
export function sharingOperation(o: SharingOperation): Record<string, unknown> {
  return {
    id: o.id,
    name: o.name,
    type: o.type,
    is_public: o.is_public,
    municipalities: (o.municipalities ?? []).map((m) => m.nis_code).sort((a, b) => a - b),
    keys: (o.keys ?? []).map((k) => ({
      id: k.id,
      allocation_key: ref(k.allocation_key as unknown as Ref),
      start_date: iso(k.start_date),
      end_date: iso(k.end_date),
      status: k.status,
    })),
    created_at: iso(o.created_at),
    updated_at: iso(o.updated_at),
  };
}

export function allocationKey(k: AllocationKey): Record<string, unknown> {
  return {
    id: k.id,
    name: k.name,
    description: k.description ?? null,
    iterations: (k.iterations ?? [])
      .slice()
      .sort((a, b) => a.number - b.number)
      .map((i) => ({
        id: i.id,
        number: i.number,
        energy_allocated_percentage: i.energy_allocated_percentage,
        consumers: (i.consumers ?? [])
          .slice()
          .sort((a, b) => a.id - b.id)
          .map((c) => ({ id: c.id, name: c.name, energy_allocated_percentage: c.energy_allocated_percentage })),
      })),
    created_at: iso(k.created_at),
    updated_at: iso(k.updated_at),
  };
}

export function profile(u: User): Record<string, unknown> {
  return {
    id: u.id,
    email: u.email,
    first_name: u.firstName ?? null,
    last_name: u.lastName ?? null,
    nrn: u.NRN ?? null,
    phone_number: u.phoneNumber ?? null,
    iban: u.iban ?? null,
    locale: u.locale ?? null,
    home_address: address(u.homeAddress as unknown as Address),
    billing_address: address(u.billingAddress as unknown as Address),
    created_at: iso(u.created_at),
    updated_at: iso(u.updated_at),
  };
}

/** The consumption CSV header: the stored readings, in kWh, at the reading's timestamp (UTC). */
export const CONSUMPTION_HEADER = ["timestamp_utc", "gross_kwh", "net_kwh", "shared_kwh", "inj_gross_kwh", "inj_shared_kwh", "inj_net_kwh"] as const;

export function consumptionRow(r: {
  timestamp: Date;
  gross: number | null;
  net: number | null;
  shared: number | null;
  inj_gross: number | null;
  inj_shared: number | null;
  inj_net: number | null;
}): (string | number | null)[] {
  return [iso(r.timestamp), r.gross, r.net, r.shared, r.inj_gross, r.inj_shared, r.inj_net];
}

/** The calendar years a set of date windows covers, `end` null meaning still open (until today). */
export function yearsCovered(windows: { start: string | null; end: string | null }[], today = new Date()): number[] {
  const years = new Set<number>();
  const currentYear = today.getUTCFullYear();
  for (const w of windows) {
    if (!w.start) continue;
    const from = Number(w.start.slice(0, 4));
    const to = w.end ? Math.min(Number(w.end.slice(0, 4)), currentYear) : currentYear;
    for (let y = from; y <= to; y++) years.add(y);
  }
  return [...years].sort((a, b) => a - b);
}
