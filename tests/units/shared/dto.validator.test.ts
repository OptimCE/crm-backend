import { describe, expect, it } from "@jest/globals";
import { Expose, Type } from "class-transformer";
import { ArrayMinSize, IsEmail, IsNotEmpty, IsOptional, ValidateNested } from "class-validator";
import { AcceptInvitationWEncodedDTO } from "../../../src/modules/invitations/api/invitation.dtos.js";
import { CreateMemberDTO } from "../../../src/modules/members/api/member.dtos.js";
import { MEMBER_ERRORS } from "../../../src/modules/members/shared/member.errors.js";
import { MemberStatus, MemberType } from "../../../src/modules/members/shared/member.types.js";
import { withError } from "../../../src/shared/errors/dtos.errors.validation.js";
import { GLOBAL_ERRORS, LocalError } from "../../../src/shared/errors/errors.js";
import { AppError } from "../../../src/shared/middlewares/error.middleware.js";
import { validateDto } from "../../../src/shared/utils/dto.validator.js";

// Codes no registry uses, so each assertion names exactly which constraint fired.
const TITLE_EMPTY = new LocalError(99001, "test:title_empty");
const NAME_EMPTY = new LocalError(99002, "test:name_empty");
const CONTACTS_MIN_2 = new LocalError(99003, "test:contacts_min_2");

class ContactDTO {
  @Expose()
  @IsNotEmpty(withError(NAME_EMPTY))
  name!: string;

  /** No `withError`: class-validator's own message, which takes the fallback branch. */
  @Expose()
  @IsEmail()
  email!: string;
}

class AddressBookDTO {
  @Expose()
  @ValidateNested()
  @Type(() => ContactDTO)
  owner!: ContactDTO;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => ContactDTO)
  @ArrayMinSize(2, withError(CONTACTS_MIN_2))
  contacts!: ContactDTO[];
}

class ParentDTO {
  @Expose()
  @IsNotEmpty(withError(TITLE_EMPTY))
  title!: string;

  @Expose()
  @ValidateNested()
  @Type(() => ContactDTO)
  contact!: ContactDTO;

  @Expose()
  @IsEmail()
  @IsOptional()
  reply_to?: string;

  @Expose()
  @ValidateNested()
  @Type(() => AddressBookDTO)
  book?: AddressBookDTO;
}

const ADA = { name: "Ada", email: "ada@example.com" };

interface Thrown {
  statusCode: number;
  errorCode: number;
  message: string;
  field?: string;
  value?: unknown;
}

/** What validateDto threw, flattened so that `toEqual` diffs every field at once. */
const thrownBy = async (DtoClass: new () => object, body: unknown): Promise<Thrown> => {
  let error: unknown;
  try {
    await validateDto(DtoClass, body);
  } catch (e) {
    error = e;
  }
  expect(error).toBeInstanceOf(AppError);
  const { statusCode, errorCode, message, field, value } = error as AppError;
  return { statusCode, errorCode, message, field, value };
};

describe("(Unit) validateDto", () => {
  describe("top-level errors", () => {
    it("throws the withError payload of a failing field", async () => {
      expect(await thrownBy(ParentDTO, { title: "", contact: ADA })).toEqual({
        statusCode: 422,
        errorCode: TITLE_EMPTY.errorCode,
        message: TITLE_EMPTY.message,
        field: "title",
        value: "",
      });
    });

    it("falls back to class-validator's message and the field name without withError", async () => {
      expect(await thrownBy(ParentDTO, { title: "T", contact: ADA, reply_to: "nope" })).toEqual({
        statusCode: 422,
        errorCode: GLOBAL_ERRORS.EXCEPTION.errorCode,
        message: "reply_to must be an email",
        field: "reply_to",
        value: "nope",
      });
    });

    it("still wins over a nested failure declared after it", async () => {
      expect(await thrownBy(ParentDTO, { title: "", contact: { ...ADA, name: "" } })).toMatchObject({
        errorCode: TITLE_EMPTY.errorCode,
        field: "title",
      });
    });
  });

  describe("errors inside a @ValidateNested() child", () => {
    it("throws the child field's own withError payload, not GLOBAL_ERRORS.EXCEPTION", async () => {
      expect(await thrownBy(ParentDTO, { title: "T", contact: { ...ADA, name: "" } })).toEqual({
        statusCode: 422,
        errorCode: NAME_EMPTY.errorCode,
        message: NAME_EMPTY.message,
        field: "name",
        value: "",
      });
    });

    it("names the child field by its path when it falls back to class-validator's message", async () => {
      expect(await thrownBy(ParentDTO, { title: "T", contact: { ...ADA, email: "nope" } })).toEqual({
        statusCode: 422,
        errorCode: GLOBAL_ERRORS.EXCEPTION.errorCode,
        message: "email must be an email",
        field: "contact.email",
        value: "nope",
      });
    });

    it("takes the first failing field in declaration order", async () => {
      expect(await thrownBy(ParentDTO, { title: "T", contact: { name: "", email: "nope" } })).toMatchObject({
        errorCode: NAME_EMPTY.errorCode,
        field: "name",
      });
    });

    it("descends through several levels and into array elements", async () => {
      const book = { owner: ADA, contacts: [ADA, { name: "Bob", email: "nope" }] };
      expect(await thrownBy(ParentDTO, { title: "T", contact: ADA, book })).toEqual({
        statusCode: 422,
        errorCode: GLOBAL_ERRORS.EXCEPTION.errorCode,
        message: "email must be an email",
        field: "book.contacts[1].email",
        value: "nope",
      });

      const bookWithNamelessContact = { owner: ADA, contacts: [ADA, { name: "", email: "bob@example.com" }] };
      expect(await thrownBy(ParentDTO, { title: "T", contact: ADA, book: bookWithNamelessContact })).toMatchObject({
        statusCode: 422,
        errorCode: NAME_EMPTY.errorCode,
        message: NAME_EMPTY.message,
        field: "name",
        value: "",
      });
    });

    it("reports a nested property's own constraint before its children's", async () => {
      // `contacts` fails ArrayMinSize AND its only element fails `name`: the property itself comes first.
      const book = { owner: ADA, contacts: [{ ...ADA, name: "" }] };
      expect(await thrownBy(ParentDTO, { title: "T", contact: ADA, book })).toMatchObject({
        errorCode: CONTACTS_MIN_2.errorCode,
        field: "contacts",
      });
    });

    it("resolves a valid body to nested class instances", async () => {
      const dto = await validateDto(ParentDTO, { title: "T", contact: ADA, book: { owner: ADA, contacts: [ADA, ADA] } });
      expect(dto.contact).toBeInstanceOf(ContactDTO);
      expect(dto.book?.contacts[1]).toBeInstanceOf(ContactDTO);
    });
  });

  // Seen live on 2026-10-06: the invitation self-registration wizard sent a company with
  // `name: ''` (its name went into `first_name`) and the client got 422 "An unexpected
  // error occurred" (error_code 1) instead of the member EMPTY error for `name`.
  describe("POST /me/invitations/accept/encoded body (AcceptInvitationWEncodedDTO)", () => {
    const companyMember = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
      name: "TestCorp",
      first_name: "",
      member_type: MemberType.COMPANY,
      status: MemberStatus.ACTIVE,
      iban: "BE68539007547034",
      home_address: { street: "Rue de Fer", number: "12", city: "Namur", postcode: "5000" },
      billing_address: { street: "Rue de Fer", number: "12", city: "Namur", postcode: "5000" },
      vat_number: "BE0123456789",
      manager: { NRN: "85073003328", name: "Ada", surname: "Lovelace", email: "ada@testcorp.be", phone_number: "+32470000000" },
      ...overrides,
    });

    it("answers the member EMPTY error for a company whose name is ''", async () => {
      const body = { invitation_id: 2147480000, member: companyMember({ name: "", first_name: "TestCorp" }) };
      expect(await thrownBy(AcceptInvitationWEncodedDTO, body)).toEqual({
        statusCode: 422,
        errorCode: MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY.errorCode,
        message: MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY.message,
        field: "name",
        value: "",
      });
    });

    it("accepts the same body once the company name is in `name`", async () => {
      const dto = await validateDto(AcceptInvitationWEncodedDTO, { invitation_id: 2147480000, member: companyMember() });
      expect(dto.member).toBeInstanceOf(CreateMemberDTO);
    });
  });
});
