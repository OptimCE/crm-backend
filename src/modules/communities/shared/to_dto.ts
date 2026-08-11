import type {
  CommunityDTO,
  CommunityDashboardDTO,
  CommunityDetailDTO,
  CommunityLegalField,
  MyCommunityDTO,
  PublicCommunityDTO,
  UsersCommunityDTO,
} from "../api/community.dtos.js";
import type { CommunityDashboardCountsRow } from "../domain/i-community.repository.js";
import type { Community, CommunityUser } from "../domain/community.models.js";
import { toAddressDTO } from "../../../shared/address/to_dto.js";
import { isActiveRegulator } from "./regulator.js";

export function toUsersCommunityDTO(community_user: CommunityUser): UsersCommunityDTO {
  return {
    email: community_user.user.email,
    role: community_user.role,
    id_community: community_user.id_community,
    id_user: community_user.id_user,
    first_name: community_user.user.firstName,
    last_name: community_user.user.lastName,
    phone: community_user.user.phoneNumber,
  };
}

export function toCommunityDTO(community: Community): CommunityDTO {
  return {
    id: community.id,
    name: community.name,
    logo_url: community.logo_url,
  };
}

export function toCommunityPartial(community: Community): CommunityDTO {
  return {
    id: community.id,
    name: community.name,
    logo_url: community.logo_url,
  };
}

export function toPublicCommunityDTO(community: Community, logo_presigned_url: string | null): PublicCommunityDTO {
  return {
    id: community.id,
    name: community.name,
    regulator: community.regulator,
    logo_url: community.logo_url,
    logo_presigned_url,
  };
}

export function toCommunityDetailDTO(community: Community, member_count: number, logo_presigned_url?: string | null): CommunityDetailDTO {
  return {
    id: community.id,
    name: community.name,
    auth_community_id: community.auth_community_id,
    created_at: community.created_at,
    updated_at: community.updated_at,
    member_count,
    regulator: community.regulator,
    description: community.description,
    website_url: community.website_url,
    logo_url: community.logo_url,
    logo_presigned_url: logo_presigned_url ?? null,
    headquarters_address: community.headquarters_address ? toAddressDTO(community.headquarters_address) : null,
    vat_number: community.vat_number,
    legal_name: community.legal_name,
    iban: community.iban,
    account_holder_name: community.account_holder_name,
  };
}

export function toMyCommunityDTO(
  community: CommunityUser,
  logo_presigned_url: string | null = null,
): MyCommunityDTO {
  return {
    id: community.id_community,
    auth_community_id: community.community.auth_community_id,
    role: community.role,
    name: community.community.name,
    logo_presigned_url,
  };
}

/**
 * node-postgres returns `COUNT()` as a string to avoid precision loss. Coercing
 * here rather than at the call sites is what stops the frontend concatenating
 * `"3" + "4"` into `"34"`.
 */
function count(value: string | null | undefined): number {
  return Number(value ?? 0);
}

function isBlank(value: string | null): boolean {
  return !value || value.trim() === "";
}

export function toCommunityDashboardDTO(
  as_of: string,
  row: CommunityDashboardCountsRow,
  operations_without_valid_key: { id: number; name: string }[],
): CommunityDashboardDTO {
  const missing_fields: CommunityLegalField[] = [];
  if (isBlank(row.vat_number)) missing_fields.push("vat_number");
  if (isBlank(row.legal_name)) missing_fields.push("legal_name");
  if (isBlank(row.iban)) missing_fields.push("iban");
  if (isBlank(row.account_holder_name)) missing_fields.push("account_holder_name");
  if (row.headquarters_address_id === null) missing_fields.push("headquarters_address");
  // `regulator` is NOT NULL DEFAULT 'BE-WAL-CWAPE', so it can never be absent.
  // It counts as missing only when blank or no longer assignable — a community
  // notified to a retired regulator needs the same nudge as one with no VAT.
  if (isBlank(row.regulator) || !isActiveRegulator(row.regulator)) missing_fields.push("regulator");

  return {
    as_of,
    members: {
      total: count(row.members_total),
      active: count(row.members_active),
      inactive: count(row.members_inactive),
      pending: count(row.members_pending),
      without_user_account: count(row.members_without_user),
      incomplete: count(row.members_incomplete),
    },
    meters: {
      total: count(row.meters_total),
      active: count(row.meters_active),
      inactive: count(row.meters_inactive),
      waiting_grd: count(row.meters_waiting_grd),
      waiting_manager: count(row.meters_waiting_manager),
      without_active_data: count(row.meters_without_active_data),
      not_in_sharing_operation: count(row.meters_not_in_sharing_operation),
    },
    sharing_operations: {
      total: count(row.operations_total),
      without_valid_key: count(row.operations_without_valid_key),
      with_pending_key: count(row.operations_with_pending_key),
      operations_without_valid_key,
    },
    invitations: {
      member_pending: count(row.member_invitations_pending),
      member_to_be_encoded: count(row.member_invitations_to_be_encoded),
      manager_pending: count(row.manager_invitations_pending),
    },
    legal_info: { missing_fields, complete: missing_fields.length === 0 },
  };
}
