/**
 * What the internal `dso-lookup` service answers, as it answers it.
 *
 * dso-lookup is the one reader of the `belgian-dso-map` data release (which DSO
 * operates the electricity and gas network of each Belgian commune). It runs on
 * the Docker network next to this service, is never exposed through KrakenD or
 * nginx, and wraps every body as `{ data, error_code: 0 }` — the client unwraps
 * that, so the types below are the `data` payloads.
 *
 * Operator ids are the stable ids `meter_data.grd` stores (`ores`,
 * `fluvius-imewo`, …), never display names.
 */

/** Region code of the data release. Brussels has no province. */
export type DsoRegion = "WAL" | "VLA" | "BRU";

/** Every status dso-lookup itself can answer. `unavailable` is ours — see {@link DsoResolutionStatus}. */
export type DsoLookupStatus = "ok" | "choose_commune" | "choose_section" | "not_found";

export interface DsoNames {
  fr: string;
  nl: string;
  de: string;
}

/** One candidate commune, offered when a postcode spans several (1040, 1050, 1804). */
export interface DsoCommune {
  /** 5-digit REFNIS / NIS code, as a string ("01000" never loses its zero). */
  ins: string;
  names: DsoNames;
  region: DsoRegion;
  /** ISO 3166-2 (`BE-WNA`), empty in Brussels. */
  province: string;
}

/** One candidate section of a commune whose sections have different operators. */
export interface DsoSection {
  section_key: string;
  names: DsoNames;
  postcodes: string[];
  /** Operator id of this section, so a caller can prefill when every candidate agrees. */
  elec_operator: string;
}

export interface DsoNote {
  key: string;
  fr: string;
  nl: string;
  de: string;
  en: string;
}

/** A resolved commune (or section). */
export interface DsoResult {
  ins: string;
  commune: DsoNames;
  section: DsoSection | null;
  region: DsoRegion;
  /** Regulator code derived from the region (`BE-WAL-CWAPE`, `BE-VLA-VREG`, `BE-BRU-BRUGEL`). */
  regulator: string;
  /**
   * `operator` is who runs the network, `designated` who holds the licence. They
   * differ where one DSO operates another's sections; the meter form prefills
   * `operator` and shows the difference as a note.
   */
  elec: { operator: string; designated: string };
  gas: { status: "designated" | "none" | "foreign"; operator: string | null };
  flags: string[];
  note: DsoNote | null;
  source_ids: string[];
  valid_from: string | null;
  data_version: string;
}

/** Body of `GET /dso/resolve` and `GET /dso/resolve-address`. */
export interface DsoResolveResponse {
  status: DsoLookupStatus;
  communes?: DsoCommune[] | null;
  sections?: DsoSection[] | null;
  result?: DsoResult | null;
  data_version: string;
}

/** One row of `GET /dso/operators`. DSOs first, Elia (the local transmission grid) last. */
export interface DsoOperator {
  id: string;
  kind: "grd" | "grtl" | "gas_foreign";
  name: string;
  legal_name: string;
  region: string;
  elec: boolean;
  gas: boolean;
  website: string;
  regulator: string;
  tariffs_url: string;
  /** False for operators no commune resolves to (Elia). */
  lookup: boolean;
  replaced_by: string | null;
}

/**
 * Body of `GET /dso/ean/{ean}/check`. Informative only — nothing in the platform
 * refuses an EAN on these grounds (see meters/shared/ean.ts).
 */
export interface DsoEanCheck {
  format: boolean;
  belgian_prefix: boolean;
  /** Null when the format is wrong, so there is no check digit to verify. */
  gs1_check: boolean | null;
  known_operator: "sibelga" | null;
}

/** Body of `GET /dso/meta`. */
export interface DsoMeta {
  data_version: string;
  version_date: string;
  communes: number;
  communes_by_region: Record<DsoRegion, number>;
  rows: number;
  operators: number;
}

/** What `GET /dso/resolve` reports: dso-lookup's own statuses, plus "we could not ask". */
export type DsoResolutionStatus = DsoLookupStatus | "unavailable";

export type DsoWarningCode = "REGION_OUTSIDE_COMMUNITY_REGULATOR" | "EAN_SIBELGA_OUTSIDE_BRUSSELS";

/** A non-blocking remark. The frontend owns the sentence; this carries the code and its values. */
export interface DsoWarning {
  code: DsoWarningCode;
  params: Record<string, string>;
}

/** The query `GET /dso/resolve` accepts, already validated. */
export interface DsoResolveQuery {
  /** NIS code of the address the picker returned. Never stored. */
  nis_code?: number;
  postcode?: string;
  city?: string;
  /** The picker's postal / part-of-municipality name. Never the city. */
  post_name?: string;
  ins?: string;
  section?: string;
  ean?: string;
}

/** The answer of `GET /dso/resolve`. */
export interface DsoResolution {
  /** False only when dso-lookup could not be asked (unbound, down, slow, or answering garbage). */
  available: boolean;
  status: DsoResolutionStatus;
  communes?: DsoCommune[];
  sections?: DsoSection[];
  result?: DsoResult;
  warnings: DsoWarning[];
  data_version?: string;
  ean_check?: DsoEanCheck;
}
