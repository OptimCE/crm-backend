import { Expose, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";
import { GLOBAL_ERRORS } from "../../../shared/errors/errors.js";
import type { DsoRegion, DsoResolutionStatus, DsoWarningCode } from "../domain/dso.types.js";

/**
 * Query of `GET /dso/resolve`.
 *
 * Every field is optional and none is format-checked beyond its length: a
 * malformed postcode is a `not_found` answer from dso-lookup, not a 422. The
 * one exception is `ins`, which only ever comes back from a previous answer.
 *
 * A GET, like `/geocoding/preview`, because the frontend's `ServiceBase` only has
 * `cachedGet`. Validation errors reuse the global messages, so this module adds
 * no i18n namespace.
 */
export class DsoResolveQueryDTO {
  /** NIS code of the address picked in the BeSt picker. Passed through, never stored. */
  @Expose()
  @Type(() => Number)
  @IsInt(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @Min(1, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @Max(99999, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.INTEGER))
  @IsOptional()
  nis_code?: number;

  @Expose()
  @Type(() => String)
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @MaxLength(8, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  postcode?: string;

  /** The city as typed or picked. Used only to settle a `choose_*` answer, never sent as a postal name. */
  @Expose()
  @Type(() => String)
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @MaxLength(128, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  city?: string;

  /** The picker's postal name (Flanders) or part-of-municipality name (Wallonia). */
  @Expose()
  @Type(() => String)
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @MaxLength(128, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  post_name?: string;

  /** A commune chosen from a previous `choose_commune` answer. */
  @Expose()
  @Type(() => String)
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @Matches(/^[0-9]{5}$/, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  ins?: string;

  /** A section chosen from a previous `choose_section` answer. */
  @Expose()
  @Type(() => String)
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @MaxLength(64, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  section?: string;

  /** Checked in parallel, for an informative warning only. */
  @Expose()
  @Type(() => String)
  @IsString(withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @MaxLength(32, withError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  ean?: string;
}

/** Names of a commune or section in the three national languages. */
export class DsoNamesDTO {
  @Expose()
  fr!: string;
  @Expose()
  nl!: string;
  @Expose()
  de!: string;
}

export class DsoCommuneDTO {
  /** 5-digit NIS code, as a string. */
  @Expose()
  ins!: string;
  @Expose()
  names!: DsoNamesDTO;
  @Expose()
  region!: DsoRegion;
  /** ISO 3166-2 province code, empty in Brussels. */
  @Expose()
  province!: string;
}

export class DsoSectionDTO {
  @Expose()
  section_key!: string;
  @Expose()
  names!: DsoNamesDTO;
  @Expose()
  postcodes!: string[];
  /** Operator id of this section. When every candidate agrees, the form can prefill without asking. */
  @Expose()
  elec_operator!: string;
}

export class DsoElecDTO {
  /** Who runs the network: the value the meter form prefills. */
  @Expose()
  operator!: string;
  /** Who holds the licence, when it differs (shown as a note). */
  @Expose()
  designated!: string;
}

export class DsoGasDTO {
  @Expose()
  status!: "designated" | "none" | "foreign";
  @Expose()
  operator!: string | null;
}

export class DsoNoteDTO {
  @Expose()
  key!: string;
  @Expose()
  fr!: string;
  @Expose()
  nl!: string;
  @Expose()
  de!: string;
  @Expose()
  en!: string;
}

export class DsoResultDTO {
  @Expose()
  ins!: string;
  @Expose()
  commune!: DsoNamesDTO;
  @Expose()
  section!: DsoSectionDTO | null;
  @Expose()
  region!: DsoRegion;
  @Expose()
  regulator!: string;
  @Expose()
  elec!: DsoElecDTO;
  @Expose()
  gas!: DsoGasDTO;
  @Expose()
  flags!: string[];
  @Expose()
  note!: DsoNoteDTO | null;
  @Expose()
  source_ids!: string[];
  @Expose()
  valid_from!: string | null;
  @Expose()
  data_version!: string;
}

/** A non-blocking remark; the frontend writes the sentence from `code` and `params`. */
export class DsoWarningDTO {
  @Expose()
  code!: DsoWarningCode;
  @Expose()
  params!: Record<string, string>;
}

/** Informative EAN checks. Nothing is refused on these grounds. */
export class DsoEanCheckDTO {
  @Expose()
  format!: boolean;
  @Expose()
  belgian_prefix!: boolean;
  @Expose()
  gs1_check!: boolean | null;
  @Expose()
  known_operator!: "sibelga" | null;
}

/**
 * Answer of `GET /dso/resolve`. Always a 200.
 *
 * `available: false` / `status: "unavailable"` means dso-lookup could not be
 * asked; the form then leaves the GRD to the user, exactly as before the feature.
 */
export class DsoResolutionDTO {
  @Expose()
  available!: boolean;
  @Expose()
  status!: DsoResolutionStatus;
  /** Set on `choose_commune`, and (one entry) on `choose_section`. */
  @Expose()
  communes?: DsoCommuneDTO[];
  /** Set on `choose_section`. */
  @Expose()
  sections?: DsoSectionDTO[];
  /** Set on `ok`. */
  @Expose()
  result?: DsoResultDTO;
  @Expose()
  warnings!: DsoWarningDTO[];
  /** Data release the answer comes from (`2026.10.0`); sent back as the meter's `grd_data_version`. */
  @Expose()
  data_version?: string;
  /** Set when an `ean` was given and could be checked. */
  @Expose()
  ean_check?: DsoEanCheckDTO;
}

/** One row of `GET /dso/operators`. */
export class DsoOperatorDTO {
  /** Stable id, the value `meter_data.grd` stores (`ores`, `fluvius-imewo`, `elia`). */
  @Expose()
  id!: string;
  @Expose()
  kind!: "grd" | "grtl" | "gas_foreign";
  /** Display name, byte-identical to the frontend's static list ("ORES", "Fluvius Imewo"). */
  @Expose()
  name!: string;
  @Expose()
  legal_name!: string;
  @Expose()
  region!: string;
  @Expose()
  elec!: boolean;
  @Expose()
  gas!: boolean;
  @Expose()
  website!: string;
  @Expose()
  regulator!: string;
  @Expose()
  tariffs_url!: string;
  /** False for an operator no address resolves to (Elia). */
  @Expose()
  lookup!: boolean;
  @Expose()
  replaced_by!: string | null;
}
