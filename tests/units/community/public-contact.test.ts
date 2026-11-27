import { describe, expect, it } from "@jest/globals";
import { PUBLIC_PHONE_PATTERN } from "../../../src/modules/communities/shared/public-contact.js";
import { toPublicCommunityDetailDTO } from "../../../src/modules/communities/shared/to_dto.js";
import type { Community } from "../../../src/modules/communities/domain/community.models.js";

describe("(Unit) PUBLIC_PHONE_PATTERN", () => {
  it.each(["+32 470 12 34 56", "0470 12 34 56", "04/123.45.67", "+32 (0)2 123 45 67", "081-22-33-44", "+3247012345678", " 02 123 45 67 "])(
    "accepts %s",
    (phone) => {
      expect(PUBLIC_PHONE_PATTERN.test(phone)).toBe(true);
    },
  );

  it.each([
    ["too few digits", "1234567"],
    ["more than 15 digits", "+32 470 12 34 56 78 90 12"],
    ["letters", "appelez-nous"],
    ["an extension in words", "02 123 45 67 ext 12"],
    ["a plus sign inside", "02+123 45 67"],
    ["empty", ""],
  ])("refuses %s", (_label, phone) => {
    expect(PUBLIC_PHONE_PATTERN.test(phone)).toBe(false);
  });
});

describe("(Unit) toPublicCommunityDetailDTO", () => {
  // Every sensitive column filled in, to prove none of them comes out.
  const community = {
    id: 7,
    name: "CE des Coteaux",
    auth_community_id: "kc-group-id",
    website_url: "https://coteaux.example",
    logo_url: "documents/logo.png",
    description: "Une communauté",
    regulator: "BE-WAL-CWAPE",
    vat_number: "BE0762031208",
    legal_name: "CE des Coteaux ASBL",
    iban: "BE71096123456769",
    account_holder_name: "Trésorier",
    representative_first_name: "Anne",
    representative_last_name: "Dupont",
    representative_email: "anne.dupont@private.example",
    statutes_date: "2024-03-01",
    internal_rules_date: "2024-03-01",
    contact_email: "contact@coteaux.example",
    contact_phone: "+32 81 22 33 44",
    headquarters_address_id: null,
    headquarters_address: null,
    created_at: new Date("2024-01-01T00:00:00Z"),
    updated_at: new Date("2024-01-01T00:00:00Z"),
    users: [],
  } as unknown as Community;

  it("carries the presentation and the public contact only", () => {
    expect(toPublicCommunityDetailDTO(community, "https://signed.example/logo")).toEqual({
      id: 7,
      name: "CE des Coteaux",
      regulator: "BE-WAL-CWAPE",
      logo_presigned_url: "https://signed.example/logo",
      description: "Une communauté",
      website_url: "https://coteaux.example",
      headquarters_address: null,
      contact_email: "contact@coteaux.example",
      contact_phone: "+32 81 22 33 44",
    });
  });

  it("turns missing optional fields into null", () => {
    const bare = {
      ...community,
      description: undefined,
      website_url: undefined,
      contact_email: undefined,
      contact_phone: undefined,
    } as unknown as Community;

    expect(toPublicCommunityDetailDTO(bare, null)).toMatchObject({
      description: null,
      website_url: null,
      contact_email: null,
      contact_phone: null,
      logo_presigned_url: null,
    });
  });
});
