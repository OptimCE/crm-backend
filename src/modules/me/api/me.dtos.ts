import { CompanyDTO, IndividualDTO, MemberPartialQuery, MembersPartialDTO } from "../../members/api/member.dtos.js";
import { IsDate, IsOptional, IsString, Matches } from "class-validator";
import { Expose, Type } from "class-transformer";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";
import { ME_ERRORS } from "../shared/me.errors.js";
import { CommunityDTO } from "../../communities/api/community.dtos.js";
import { MeterPartialQuery, MetersDTO, PartialMeterDTO } from "../../meters/api/meter.dtos.js";
import { DocumentExposedDTO, DocumentQueryDTO } from "../../documents/api/document.dtos.js";
import type { SharingOperationType } from "../../sharing_operations/shared/sharing_operation.types.js";
import type { MemberMissingField } from "../../../shared/member/completeness.js";

export class MeMemberPartialQuery extends MemberPartialQuery {
  @Type(() => String)
  @IsString(withError(ME_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  community_name?: string;
}

export class MeMetersPartialQuery extends MeterPartialQuery {
  @Type(() => String)
  @IsString(withError(ME_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  community_name?: string;
}

export class MeDocumentPartialQuery extends DocumentQueryDTO {}

export class MeMembersPartialDTO extends MembersPartialDTO {
  @Expose()
  community!: CommunityDTO;

  /**
   * Which fields of this member record are still blank, e.g. `["iban"]`.
   *
   * The per-record twin of the manager dashboard's `members_incomplete` count.
   * A member cannot be told "1 record incomplete" and be expected to act on it
   * — they need to know *which* field, which is why this is a list of names and
   * not a boolean. Empty means the record is complete.
   *
   * `sub_type_row` is the one value that does not name a form field: it means
   * the `individual` / `company` row is missing entirely, which is also what
   * makes `GET /me/members/:id` fail. Clients must handle it as "contact your
   * community manager" rather than offering an edit link that cannot load.
   *
   * **Optional, and `undefined` does not mean "complete".** It means "not
   * evaluated": completeness is only answerable when the sub-type row and both
   * addresses are loaded, which `GET /me/members` does and the queries that
   * embed a member as a meter's `holder` do not. A client must render nothing
   * rather than a clean bill of health.
   */
  @Expose()
  missing_fields?: MemberMissingField[];
}

export class MeIndividualDTO extends IndividualDTO {
  @Expose()
  community!: CommunityDTO;
}

export class MeCompanyDTO extends CompanyDTO {
  @Expose()
  community!: CommunityDTO;
}

export class MePartialMeterDTO extends PartialMeterDTO {
  @Expose()
  community!: CommunityDTO;
}

export class MeMeterDTO extends MetersDTO {
  @Expose()
  community!: CommunityDTO;
}

export class MeDocumentDTO extends DocumentExposedDTO {
  @Expose()
  community!: CommunityDTO;
}

export class MeAllocationSharesQuery {
  /**
   * Evaluate the key and meter-ownership windows on this calendar date.
   * Defaults to today.
   */
  @Type(() => Date)
  @IsDate(withError(ME_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.DATE))
  @IsOptional()
  at?: Date;
}

/** Lean operation reference — the full partial DTO would drag in municipalities. */
export class MeAllocationOperationRefDTO {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  type!: SharingOperationType;
}

export class MeAllocationMemberRefDTO {
  @Expose()
  id!: number;

  @Expose()
  name!: string;
}

export class MeAllocationKeyRefDTO {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  /** Validity window of the operation↔key link, not of the key itself. */
  @Expose()
  start_date!: string;

  @Expose()
  end_date!: string | null;
}

export class MeAllocationIterationShareDTO {
  @Expose()
  iteration_id!: number;

  @Expose()
  iteration_number!: number;

  /** Fraction of the key's energy routed through this iteration; iterations sum to 1. */
  @Expose()
  iteration_share!: number;

  /** null when this EAN is not listed as a consumer of this iteration. */
  @Expose()
  consumer_share!: number | null;

  /** True when `consumer_share` carries the PRORATA sentinel (-1). */
  @Expose()
  is_prorata!: boolean;

  /**
   * `iteration_share × consumer_share`. Zero when the EAN is absent from this
   * iteration; null when the iteration allocates it prorata, which is only
   * resolvable at settlement.
   */
  @Expose()
  contribution!: number | null;
}

/**
 * One (community, sharing operation, meter) the caller holds, with their share of
 * the allocation key in force.
 *
 * **`matched` is not decoration.** `consumer.name` is free text with no foreign
 * key to a meter or a member — it is only *conventionally* an EAN (generated keys
 * seed it from the upload's column headers; a hand-made key may say "Maison
 * Dupont"). So the share is resolved by matching that name against the EAN, and
 * `matched: false` means "this key does not identify you", which a UI must render
 * as "not available", never as 0 %.
 */
export class MeAllocationShareDTO {
  @Expose()
  community!: CommunityDTO;

  @Expose()
  sharing_operation!: MeAllocationOperationRefDTO;

  @Expose()
  ean!: string;

  /** Which of the caller's members holds this meter on the evaluation date. */
  @Expose()
  member!: MeAllocationMemberRefDTO;

  @Expose()
  holding_start_date!: string;

  @Expose()
  holding_end_date!: string | null;

  /** null when the operation has no APPROVED key valid on the evaluation date. */
  @Expose()
  key!: MeAllocationKeyRefDTO | null;

  /** False when no consumer of the key in force carries this EAN as its name. */
  @Expose()
  matched!: boolean;

  /** How the match was made. Only the EAN-name convention exists today. */
  @Expose()
  match_basis!: "ean_consumer_name" | null;

  @Expose()
  is_prorata!: boolean;

  /** Σ contributions. null when unmatched, keyless, or any contribution is prorata. */
  @Expose()
  effective_share!: number | null;

  /** Every iteration of the key in force, matched or not. Empty when `key` is null. */
  @Expose()
  iterations!: MeAllocationIterationShareDTO[];
}

export class MeAllocationSharesDTO {
  /** The resolved evaluation date (`YYYY-MM-DD`), echoing `at` or today. */
  @Expose()
  at!: string;

  @Expose()
  shares!: MeAllocationShareDTO[];
}

export class MeEnergySummaryQuery {
  /**
   * Calendar month to summarise, as `YYYY-MM`. Defaults to the last CLOSED
   * month, which is the only window guaranteed to be fully metered.
   *
   * A string rather than a `Date`: the unit here is a month, and accepting a
   * day would invite "why does the 3rd give me a different total than the 4th".
   */
  @Type(() => String)
  @IsString(withError(ME_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, withError(ME_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.MONTH))
  @IsOptional()
  month?: string;
}

/** The four totals, in kWh. Shared here means "exchanged inside the community". */
export class MeEnergyTotalsDTO {
  @Expose()
  gross_kwh!: number;

  @Expose()
  shared_kwh!: number;

  @Expose()
  inj_gross_kwh!: number;

  @Expose()
  inj_shared_kwh!: number;
}

export class MeEnergyMeterDTO {
  @Expose()
  ean!: string;

  @Expose()
  meter_number!: string | null;

  @Expose()
  community!: CommunityDTO;

  @Expose()
  totals!: MeEnergyTotalsDTO;

  /**
   * False when this meter produced NO readings in the window.
   *
   * The same distinction `matched` makes on `/me/allocation-shares`, and it
   * exists for the same reason: `has_data: false` with all-zero totals means
   * "we have no readings", not "you consumed nothing". A client that renders it
   * as `0 kWh` is telling the member something untrue.
   */
  @Expose()
  has_data!: boolean;
}

export class MeEnergyPeriodDTO {
  /** First day of the summarised month (`YYYY-MM-DD`). */
  @Expose()
  start!: string;

  /** Last day of the summarised month (`YYYY-MM-DD`), inclusive. */
  @Expose()
  end!: string;
}

/**
 * One member's energy across EVERY community they belong to.
 *
 * Cross-community by design and needs no active community: like the rest of
 * `/me/*` it is scoped by `user_id` alone. Totals are summed only over the days
 * the caller actually held each meter, so a meter that changed hands mid-month
 * contributes each holder's own slice and nobody else's.
 */
export class MeEnergySummaryDTO {
  @Expose()
  period!: MeEnergyPeriodDTO;

  /** Σ over `meters`. Present even when every meter has `has_data: false`. */
  @Expose()
  totals!: MeEnergyTotalsDTO;

  @Expose()
  meters!: MeEnergyMeterDTO[];
}
