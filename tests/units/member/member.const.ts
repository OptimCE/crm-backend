import { jest } from "@jest/globals";
import { SUCCESS } from "../../../src/shared/errors/errors.js";
import { Member, Individual, Company } from "../../../src/modules/members/domain/member.models.js";
import { toMemberDTO, toMemberPartialDTO } from "../../../src/modules/members/shared/to_dto.js";
import {MEMBER_ERRORS} from "../../../src/modules/members/shared/member.errors.js";
import {MemberStatus, MemberType} from "../../../src/modules/members/shared/member.types.js";
import {ORGS_ADMIN} from "../../utils/shared.consts.js";

// --- Mock Data ---
export const mockDate = new Date("2024-01-01T12:00:00.000Z");

const mockAddress = {
    id: 1,
    street: "Main St",
    number: "1",
    city: "Brussels",
    postcode: "1000",
    created_at: mockDate,
    updated_at: mockDate,
};

const mockCommunity = { id: 1 };

export const mockIndividualEntity: Member = {
    id: 1,
    name: "John Doe",
    IBAN: "BE1234567890",
    status: MemberStatus.ACTIVE,
    member_type: MemberType.INDIVIDUAL,
    created_at: mockDate,
    updated_at: mockDate,
    home_address: mockAddress as any,
    billing_address: mockAddress as any,
    community: mockCommunity as any,
    individual_details: {
        id: 1,
        first_name: "John",
        NRN: "12345678901",
        email: "john@example.com",
        phone_number: "0470123456",
        social_rate: false,
        manager: null,
        member: {} as any
    },
    company_details: undefined as any
};

export const mockCompanyEntity: Member = {
    id: 2,
    name: "Acme Corp",
    IBAN: "BE0987654321",
    status: MemberStatus.ACTIVE,
    member_type: MemberType.COMPANY,
    created_at: mockDate,
    updated_at: mockDate,
    home_address: mockAddress as any,
    billing_address: mockAddress as any,
    community: mockCommunity as any,
    company_details: {
        id: 2,
        vat_number: "BE0123456789",
        manager: { id: 10, name: "Manager", surname: "One", email: "mgr@test.com", NRN: "1" } as any,
        member: {} as any
    },
    individual_details: undefined as any
};

export const mockMemberDTO = toMemberDTO(mockIndividualEntity);
export const mockMemberPartialDTO = toMemberPartialDTO(mockIndividualEntity);

// JSON compatible
export const mockMemberDTOJSON = JSON.parse(JSON.stringify(mockMemberDTO));
export const mockMemberPartialDTOJSON = JSON.parse(JSON.stringify(mockMemberPartialDTO));

// --- Test Cases ---

// 1. Get Members List
export const testCasesGetMembersList = [
    {
        description: "Success",
        query: {},
        status_code: 200,
        orgs: ORGS_ADMIN,
        expected_error_code: SUCCESS,
        expected_data: [mockMemberPartialDTOJSON],
        expected_pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
        mocks: {
            memberRepo: {
                getMembersList: jest.fn(() => Promise.resolve([[mockIndividualEntity], 1]))
            }
        }
    },
    {
        description: "Fail (DB Error)",
        query: {},
        status_code: 500,
        orgs: ORGS_ADMIN,
        expected_error_code: MEMBER_ERRORS.EXCEPTION.errorCode,
        expected_data: MEMBER_ERRORS.EXCEPTION.message,
        mocks: {
            memberRepo: {
                getMembersList: jest.fn(() => Promise.reject(new Error("DB Error")))
            }
        }
    }
];

// 2. Get Member
export const testCasesGetMember = [
    {
        description: "Success (Individual)",
        id: 1,
        status_code: 200,
        orgs: ORGS_ADMIN,
        expected_error_code: SUCCESS,
        expected_data: mockMemberDTOJSON,
        mocks: {
            memberRepo: {
                getFullMember: jest.fn(() => Promise.resolve(mockIndividualEntity))
            }
        }
    },
    {
        description: "Fail (Not Found)",
        id: 999,
        status_code: 400,
        orgs: ORGS_ADMIN,
        expected_error_code: MEMBER_ERRORS.GET_MEMBER.NOT_FOUND.errorCode,
        expected_data: MEMBER_ERRORS.GET_MEMBER.NOT_FOUND.message,
        mocks: {
            memberRepo: {
                getFullMember: jest.fn(() => Promise.resolve(null))
            }
        }
    },
    {
        description: "Fail (DB Error)",
        id: 1,
        status_code: 500,
        orgs: ORGS_ADMIN,
        expected_error_code: MEMBER_ERRORS.EXCEPTION.errorCode,
        expected_data: MEMBER_ERRORS.EXCEPTION.message,
        mocks: {
            memberRepo: {
                getFullMember: jest.fn(() => Promise.reject(new Error("DB Fail")))
            }
        }
    }
];

// 3. Get Member Link
export const testCasesGetMemberLink = [
    {
        description: "Success (Active Link)",
        id: 1,
        status_code: 200,
        orgs: ORGS_ADMIN,
        expected_error_code: SUCCESS,
        expected_data: { user_email: "test@test.com", status: 1, user_id: 5, id: 1 }, // 1=ACTIVE
        mocks: {
            memberRepo: {
                getMemberLink: jest.fn(() => Promise.resolve({ user: { email: "test@test.com", id: 5 }, id: 1 }))
            }
        }
    },
    {
        description: "Success (Pending Invitation)",
        id: 1,
        status_code: 200,
        orgs: ORGS_ADMIN,
        expected_error_code: SUCCESS,
        expected_data: { user_email: "invite@test.com", status: 3, user_id: undefined, id: 1 }, // 3=PENDING
        mocks: {
            memberRepo: {
                getMemberLink: jest.fn(() => Promise.resolve(null)),
                getMemberInvitation: jest.fn(() => Promise.resolve({ userEmail: "invite@test.com", user: null, id: 1 }))
            }
        }
    },
    {
        description: "Success (Inactive/No Link)",
        id: 1,
        status_code: 200,
        orgs: ORGS_ADMIN,
        expected_error_code: SUCCESS,
        expected_data: { status: 2 }, // 2=INACTIVE
        mocks: {
            memberRepo: {
                getMemberLink: jest.fn(() => Promise.resolve(null)),
                getMemberInvitation: jest.fn(() => Promise.resolve(null))
            }
        }
    },
    {
        description: "Fail (DB Error)",
        id: 1,
        status_code: 500,
        orgs: ORGS_ADMIN,
        expected_error_code: MEMBER_ERRORS.EXCEPTION.errorCode,
        expected_data: MEMBER_ERRORS.EXCEPTION.message,
        mocks: {
            memberRepo: {
                getMemberLink: jest.fn(() => Promise.reject(new Error("DB Error")))
            }
        }
    }
];

// 4. Add Member
export const testCasesAddMember = [
    {
        description: "Success (Individual)",
        body: {
            name: "New Member",
            member_type: MemberType.INDIVIDUAL,
            status: MemberStatus.ACTIVE,
            iban: "BE123",
            home_address: { street: "S", number: "1", city: "C", postcode: "1000" },
            billing_address: { street: "S", number: "1", city: "C", postcode: "1000" },
            first_name: "John",
            NRN: "123",
            email: "j@t.com",
            social_rate: false
        },
        status_code: 200,
        orgs: ORGS_ADMIN,
        expected_error_code: SUCCESS,
        expected_data: "success",
        mocks: {
            authContext: { getInternalCommunityId: jest.fn(() => Promise.resolve(1)) },
            addressRepo: {
                addAddress: jest.fn(() => Promise.resolve(mockAddress))
            },
            memberRepo: {
                saveMember: jest.fn(() => Promise.resolve({ id: 1 })),
                saveIndividual: jest.fn(() => Promise.resolve({}))
            }
        }
    },
    {
        description: "Fail (Validation - Individual Missing NRN)",
        body: {
            name: "New Member",
            member_type: MemberType.INDIVIDUAL,
            status: MemberStatus.ACTIVE,
            iban: "BE123",
            home_address: { street: "S", number: "1", city: "C", postcode: "1000" },
            billing_address: { street: "S", number: "1", city: "C", postcode: "1000" },
            first_name: "John",
            // NRN missing
            email: "j@t.com",
            social_rate: false
        },
        status_code: 422,
        translation_field: {field: 'NRN'},
        orgs: ORGS_ADMIN,
        expected_error_code: MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY.errorCode,
        expected_data:  MEMBER_ERRORS.GENERIC_VALIDATION.EMPTY.message,
        mocks: {}
    },
    {
        description: "Fail (Service Error)",
        body: {
            name: "New Member",
            member_type: MemberType.INDIVIDUAL,
            status: MemberStatus.ACTIVE,
            iban: "BE123",
            home_address: { street: "S", number: "1", city: "C", postcode: "1000" },
            billing_address: { street: "S", number: "1", city: "C", postcode: "1000" },
            first_name: "John",
            NRN: "123",
            email: "j@t.com",
            social_rate: false
        },
        status_code: 400,
        orgs: ORGS_ADMIN,
        expected_error_code: MEMBER_ERRORS.ADD_MEMBER.DATABASE_ADD.errorCode,
        expected_data: MEMBER_ERRORS.ADD_MEMBER.DATABASE_ADD.message,
        mocks: {
            authContext: { getInternalCommunityId: jest.fn(() => Promise.resolve(1)) },
            addressRepo: { addAddress: jest.fn(() => Promise.reject(new Error("Fail"))) }
        }
    }
];

// 5. Update Member
export const testCasesUpdateMember = [
    {
        description: "Success",
        body: { id: 1, name: "Updated Name" },
        status_code: 200,
        orgs: ORGS_ADMIN,
        expected_error_code: SUCCESS,
        expected_data: "success",
        mocks: {
            memberRepo: {
                getFullMember: jest.fn(() => Promise.resolve(mockIndividualEntity)),
                saveMember: jest.fn(() => Promise.resolve(mockIndividualEntity)),
                saveIndividual: jest.fn(() => Promise.resolve({}))
            },
            addressRepo: {}
        }
    },
    {
        description: "Fail (Not Found)",
        body: { id: 999, name: "Updated Name" },
        status_code: 400,
        orgs: ORGS_ADMIN,
        expected_error_code: MEMBER_ERRORS.UPDATE_MEMBER.MEMBER_NOT_FOUND.errorCode,
        expected_data: MEMBER_ERRORS.UPDATE_MEMBER.MEMBER_NOT_FOUND.message,
        mocks: {
            memberRepo: {
                getFullMember: jest.fn(() => Promise.resolve(null))
            }
        }
    }
];

// 6. Patch Status
export const testCasesPatchMemberStatus = [
    {
        description: "Success",
        body: { id_member: 1, status: MemberStatus.INACTIVE },
        status_code: 200,
        orgs: ORGS_ADMIN,
        expected_error_code: SUCCESS,
        expected_data: "success",
        mocks: {
            memberRepo: {
                getMember: jest.fn(() => Promise.resolve(mockIndividualEntity)),
                saveMember: jest.fn(() => Promise.resolve(mockIndividualEntity))
            }
        }
    },
    {
        description: "Fail (Not Found)",
        body: { id_member: 999, status: MemberStatus.INACTIVE },
        status_code: 400,
        orgs: ORGS_ADMIN,
        expected_error_code: MEMBER_ERRORS.PATCH_MEMBER_STATUS.MEMBER_NOT_FOUND.errorCode,
        expected_data: MEMBER_ERRORS.PATCH_MEMBER_STATUS.MEMBER_NOT_FOUND.message,
        mocks: {
            memberRepo: {
                getMember: jest.fn(() => Promise.resolve(null))
            }
        }
    },
    {
        description: "Fail (Db fail)",
        body: { id_member: 1, status: MemberStatus.INACTIVE },
        status_code: 400,
        orgs: ORGS_ADMIN,
        expected_error_code: MEMBER_ERRORS.PATCH_MEMBER_STATUS.DATABASE_UPDATE.errorCode,
        expected_data: MEMBER_ERRORS.PATCH_MEMBER_STATUS.DATABASE_UPDATE.message,
        mocks: {
            memberRepo: {
                getMember: jest.fn(() => Promise.resolve(mockIndividualEntity)),
                saveMember: jest.fn(() => Promise.reject(new Error("Fail")))
            }
        }
    },
];

// 7. Patch Invite
export const testCasesPatchMemberInvite = [
    {
        description: "Success",
        body: { id_member: 1, user_email: "new@test.com" },
        status_code: 200,
        orgs: ORGS_ADMIN,
        expected_error_code: SUCCESS,
        expected_data: "success",
        mocks: {
            memberRepo: {
                getMember: jest.fn(() => Promise.resolve(mockIndividualEntity)),
                addInvitationToMember: jest.fn(() => Promise.resolve())
            }
        }
    },
    {
        description: "Fail (user not found)",
        body: { id_member: 1, user_email: "new@test.com" },
        status_code: 400,
        orgs: ORGS_ADMIN,
        expected_error_code: MEMBER_ERRORS.PATCH_MEMBER_LINK.MEMBER_NOT_FOUND.errorCode,
        expected_data: MEMBER_ERRORS.PATCH_MEMBER_LINK.MEMBER_NOT_FOUND.message,
        mocks: {
            memberRepo: {
                getMember: jest.fn(() => Promise.resolve(null)),
            }
        }
    },
    {
        description: "Fail (db exception)",
        body: { id_member: 1, user_email: "new@test.com" },
        status_code: 400,
        orgs: ORGS_ADMIN,
        expected_error_code: MEMBER_ERRORS.PATCH_MEMBER_LINK.DATABASE_ADD.errorCode,
        expected_data: MEMBER_ERRORS.PATCH_MEMBER_LINK.DATABASE_ADD.message,
        mocks: {
            memberRepo: {
                getMember: jest.fn(() => Promise.resolve(mockIndividualEntity)),
                addInvitationToMember: jest.fn(() => Promise.reject(new Error("Fail")))
            }
        }
    },
];

// 8. Delete Member
export const testCasesDeleteMember = [
    {
        description: "Success",
        id: 1,
        status_code: 200,
        orgs: ORGS_ADMIN,
        expected_error_code: SUCCESS,
        expected_data: "success",
        mocks: {
            memberRepo: {
                deleteMember: jest.fn(() => Promise.resolve({ affected: 1 }))
            }
        }
    },
    {
        description: "Fail (Not Found/Affected != 1)",
        id: 1,
        status_code: 400,
        orgs: ORGS_ADMIN,
        expected_error_code: MEMBER_ERRORS.DELETE_MEMBER.DATABASE_DELETE.errorCode,
        expected_data: MEMBER_ERRORS.DELETE_MEMBER.DATABASE_DELETE.message,
        mocks: {
            memberRepo: {
                deleteMember: jest.fn(() => Promise.resolve({ affected: 0 }))
            }
        }
    },
    {
        description: "Fail (Db error)",
        id: 1,
        status_code: 400,
        orgs: ORGS_ADMIN,
        expected_error_code: MEMBER_ERRORS.DELETE_MEMBER.DATABASE_DELETE.errorCode,
        expected_data: MEMBER_ERRORS.DELETE_MEMBER.DATABASE_DELETE.message,
        mocks: {
            memberRepo: {
                deleteMember: jest.fn(() => Promise.reject(new Error("Fail")))
            }
        }
    }
];

// 9. Delete Member Link
export const testCasesDeleteMemberLink = [
    {
        description: "Success",
        id: 1,
        status_code: 200,
        orgs: ORGS_ADMIN,
        expected_error_code: SUCCESS,
        expected_data: "success",
        mocks: {
            memberRepo: {
                deleteMemberLink: jest.fn(() => Promise.resolve({ affected: 1 }))
            }
        }
    },
    {
        description: "Fail (Error)",
        id: 1,
        status_code: 400,
        orgs: ORGS_ADMIN,
        expected_error_code: MEMBER_ERRORS.DELETE_MEMBER_LINK.DATABASE_DELETE.errorCode,
        expected_data: MEMBER_ERRORS.DELETE_MEMBER_LINK.DATABASE_DELETE.message,
        mocks: {
            memberRepo: {
                deleteMemberLink: jest.fn(() => Promise.resolve({ affected: 0 }))
            }
        }
    },
    {
        description: "Fail (Db Error)",
        id: 1,
        status_code: 400,
        orgs: ORGS_ADMIN,
        expected_error_code: MEMBER_ERRORS.DELETE_MEMBER_LINK.DATABASE_DELETE.errorCode,
        expected_data: MEMBER_ERRORS.DELETE_MEMBER_LINK.DATABASE_DELETE.message,
        mocks: {
            memberRepo: {
                deleteMemberLink: jest.fn(() => Promise.reject(new Error("Fail")))
            }
        }
    }
];
