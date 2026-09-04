import type { Member } from "../../modules/members/domain/member.models.js";
import { MemberType } from "../../modules/members/shared/member.types.js";

/**
 * A field of a member record that must be filled in for the member to be usable
 * by billing and by regulator filings.
 *
 * These are the string values a client renders, so they are part of the API
 * contract: each one needs a label key in all four locale files.
 */
export type MemberMissingField = "name" | "iban" | "nrn" | "email" | "vat_number" | "home_address" | "billing_address" | "sub_type_row";

/**
 * Which fields of `member` are blank.
 *
 * **This is the per-record twin of `members_incomplete`** — the manager-side
 * `COUNT(*)` in `community.repository.ts` that feeds the community dashboard's
 * readiness tile. The two must agree on what "complete" means, or a manager is
 * told three members are incomplete while each of those members is told they
 * are fine. `me.functional.test.ts` pins the agreement with a seeded community.
 *
 * The predicates mirror that SQL one for one:
 *  - every column is NOT NULL in the DDL, so "missing" can only be an
 *    empty/whitespace string;
 *  - `phone_number` and `id_manager` are `@IsOptional` by design and are NOT
 *    counted;
 *  - an absent sub-type row (`individual` / `company`) counts, because it is
 *    the state that makes `toMemberDTO` throw "Data inconsistency" — i.e. the
 *    member's own detail page 500s on exactly the record they need to fix.
 *
 * Reads only relations the caller already loaded. `getMembersList` and
 * `getMemberById` both `leftJoinAndSelect` the sub-type rows and
 * `innerJoinAndSelect` both addresses, so this costs no extra query.
 */
export function memberMissingFields(member: Member): MemberMissingField[] {
  const missing: MemberMissingField[] = [];

  if (isBlank(member.name)) missing.push("name");
  if (isBlank(member.IBAN)) missing.push("iban");

  if (member.member_type === MemberType.INDIVIDUAL) {
    const individual = member.individual_details;
    if (!individual) {
      missing.push("sub_type_row");
    } else {
      if (isBlank(individual.NRN)) missing.push("nrn");
      if (isBlank(individual.email)) missing.push("email");
    }
  } else if (member.member_type === MemberType.COMPANY) {
    const company = member.company_details;
    if (!company) {
      missing.push("sub_type_row");
    } else if (isBlank(company.vat_number)) {
      missing.push("vat_number");
    }
  }

  if (isAddressBlank(member.home_address)) missing.push("home_address");
  if (isAddressBlank(member.billing_address)) missing.push("billing_address");

  return missing;
}

function isBlank(value: string | null | undefined): boolean {
  return (value ?? "").trim() === "";
}

/**
 * An address is incomplete when any of street / postcode / city is blank —
 * the same three columns the SQL checks. `number` and `supplement` are not
 * counted: a rural address legitimately has no house number.
 */
function isAddressBlank(address: { street?: string | null; postcode?: string | null; city?: string | null } | null | undefined): boolean {
  if (!address) return true;
  return isBlank(address.street) || isBlank(address.postcode) || isBlank(address.city);
}
