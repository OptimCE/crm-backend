import type { Member } from "../../members/domain/member.models.js";
import type { MeDocumentPartialQuery, MeMemberPartialQuery, MeMetersPartialQuery } from "../api/me.dtos.js";
import type { DeleteResult, QueryRunner } from "typeorm";
import type { Document } from "../../documents/domain/document.models.js";
import type { UserMemberLink } from "../../users/domain/user.models.js";
import type { Meter, MeterConsumption } from "../../meters/domain/meter.models.js";
import type { MeterConsumptionQuery } from "../../meters/api/meter.dtos.js";
import type { GestionnaireInvitation, UserMemberInvitation } from "../../invitations/domain/invitation.models.js";
import type { UserManagerInvitationQuery, UserMemberInvitationQuery } from "../../invitations/api/invitation.dtos.js";

/**
 * A `date` column as it comes back from `getRawMany`.
 *
 * Raw reads bypass TypeORM's entity transform, so node-postgres hands back a JS
 * `Date` at LOCAL midnight rather than the `YYYY-MM-DD` string the entity
 * declares. Serialising that straight to JSON shifts the calendar day (Brussels
 * midnight is 22:00 UTC the day before), so every one of these must go through
 * `toDateOnly` in the mapper.
 */
export type RawDate = string | Date;

/** One meter the caller's members hold on the evaluation date, with its operation. */
export interface MeMeterHoldingRow {
  ean: string;
  member_id: number;
  member_name: string;
  operation_id: number;
  operation_name: string;
  operation_type: number;
  community_id: number;
  community_name: string;
  community_logo_url: string | null;
  holding_start_date: RawDate;
  holding_end_date: RawDate | null;
}

/** The single APPROVED key valid on the evaluation date, per sharing operation. */
export interface MeKeyInForceRow {
  operation_id: number;
  key_id: number;
  key_name: string;
  key_start_date: RawDate;
  key_end_date: RawDate | null;
}

export interface MeKeyIterationRow {
  key_id: number;
  iteration_id: number;
  iteration_number: number;
  iteration_share: number;
}

export interface MeKeyConsumerRow {
  iteration_id: number;
  consumer_id: number;
  consumer_name: string;
  consumer_share: number;
}

/**
 * One meter's consumption totals over a calendar window, summed only over the
 * days the caller actually held it.
 *
 * The numeric columns are typed `string | number` on purpose. node-postgres
 * parses `double precision` to a JS number but hands back `bigint` — which is
 * what `COUNT()` returns — as a **string**, and the aggregate's storage type is
 * not something a caller should have to know. Coerce every one of them in the
 * mapper, or the frontend concatenates instead of adding.
 *
 * `reading_count` is what distinguishes "we have readings and they total zero"
 * from "we have no readings at all" — the same distinction `matched` makes on
 * `/me/allocation-shares`, and it must never be rendered as `0 kWh`.
 */
export interface MeEnergyMeterRow {
  ean: string;
  meter_number: string | null;
  community_id: number;
  community_name: string;
  community_logo_url: string | null;
  reading_count: string | number;
  gross: string | number | null;
  shared: string | number | null;
  inj_gross: string | number | null;
  inj_shared: string | number | null;
}

export interface IMeRepository {
  /**
   * Meters attached to a sharing operation that one of the caller's members holds
   * on `at`, scoped to THAT holding — never "any member of mine ever held this
   * EAN", which would show a former holder the current holder's share.
   */
  getOwnMeterHoldings(at: string, limit: number, query_runner?: QueryRunner): Promise<MeMeterHoldingRow[]>;
  getOwnEnergyTotals(
    period_start: string,
    period_end: string,
    limit: number,
    query_runner?: QueryRunner,
  ): Promise<MeEnergyMeterRow[]>;
  getKeysInForce(operation_ids: number[], at: string, query_runner?: QueryRunner): Promise<MeKeyInForceRow[]>;
  getKeyIterations(key_ids: number[], query_runner?: QueryRunner): Promise<MeKeyIterationRow[]>;
  /** Consumers of the given keys whose (trimmed) name is one of `eans`. */
  getKeyConsumersForEans(key_ids: number[], eans: string[], query_runner?: QueryRunner): Promise<MeKeyConsumerRow[]>;
  getMemberById(id: number, query_runner?: QueryRunner): Promise<Member | null>;
  getMembersList(query: MeMemberPartialQuery, query_runner?: QueryRunner): Promise<[Member[], number]>;
  getDocumentById(document_id: number, query_runner?: QueryRunner): Promise<Document | null>;
  getDocuments(query: MeDocumentPartialQuery, query_runner?: QueryRunner): Promise<[Document[], number]>;
  getMeterById(id: string, query_runner?: QueryRunner): Promise<Meter | null>;
  getMeters(query: MeMetersPartialQuery, query_runner?: QueryRunner): Promise<[Meter[], number]>;

  /**
   * Member-scoped mirror of the meters map. Same access rule as getMeters.
   * @returns [rows, total_plottable, total_matching]
   */
  getMetersMap(query: MeMetersPartialQuery, take: number, query_runner?: QueryRunner): Promise<[Meter[], number, number]>;
  getMeterConsumptions(ean: string, query: MeterConsumptionQuery, query_runner?: QueryRunner): Promise<MeterConsumption[]>;
  getOwnManagersPendingInvitation(query: UserManagerInvitationQuery, query_runner?: QueryRunner): Promise<[GestionnaireInvitation[], number]>;
  getOwnMembersPendingInvitation(query: UserMemberInvitationQuery, query_runner?: QueryRunner): Promise<[UserMemberInvitation[], number]>;
  getOwnMembersPendingInvitationById(id: number, query_runner?: QueryRunner): Promise<Member | null>;
  getInvitationManagerById(invitation_id: number, query_runner?: QueryRunner): Promise<GestionnaireInvitation | null>;
  getInvitationMemberById(invitation_id: number, query_runner?: QueryRunner): Promise<UserMemberInvitation | null>;
  saveUserMemberLink(internal_user_id: number, id_member: number, query_runner?: QueryRunner): Promise<UserMemberLink>;
  deleteUserMemberInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult>;
  deleteGestionnaireInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult>;
  refuseManagerInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult>;
  refuseMemberInvitation(id_invitation: number, query_runner?: QueryRunner): Promise<DeleteResult>;
}
