import type {
  CompanyDTO,
  CreateMemberDTO,
  IndividualDTO,
  MemberLinkDTO,
  MemberLinkQueryDTO,
  MemberPartialQuery,
  MembersPartialDTO,
  PatchMemberInviteUserDTO,
  PatchMemberStatusDTO,
  UpdateMemberDTO,
} from "../api/member.dtos.js";
import type { Pagination } from "../../../shared/dtos/ApiResponses.js";
import type { QueryRunner } from "typeorm";
import type { Company, Individual } from "./member.models.js";

/**
 * Interface for Member Service.
 * Defines contract for managing community members (Individuals and Companies).
 */
export interface IMemberService {
  /**
   * Retrieves a paginated list of members.
   * @param query - filtering/paging parameters.
   * @returns Tuple: [List of partial member DTOs, Pagination metadata].
   */
  getMembersList(query: MemberPartialQuery): Promise<[MembersPartialDTO[], Pagination]>;
  /**
   * Retrieves full details of a specific member.
   * @param id_member - ID of the member.
   * @returns Full member DTO (Individual or Company).
   */
  getMember(id_member: number): Promise<IndividualDTO | CompanyDTO>;
  /**
   * Retrieves the link status between a member and a user.
   * @param id_member - ID of the member.
   * @param query - Email of the user target by the query
   * @returns Link status DTO.
   */
  getMemberLink(id_member: number, query: MemberLinkQueryDTO): Promise<MemberLinkDTO>;

  /**
   * Adds a new member to the community.
   * @param new_member - DTO for creation.
   */
  addMember(new_member: CreateMemberDTO): Promise<void>;
  /**
   * Updates an existing member.
   * @param updated_member - DTO for update.
   */
  updateMember(updated_member: UpdateMemberDTO): Promise<void>;
  /**
   * Updates the status of a member.
   * @param patched_member_status - DTO with new status.
   */
  patchMemberStatus(patched_member_status: PatchMemberStatusDTO): Promise<void>;
  /**
   * Invites a user to become a member (links account).
   * @param patched_member_invite_user - DTO with user email.
   */
  patchMemberLink(patched_member_invite_user: PatchMemberInviteUserDTO): Promise<void>;
  /**
   * Deletes a member.
   * @param id_member - ID of the member.
   */
  deleteMember(id_member: number): Promise<void>;
  /**
   * Deletes the link between a member and a user.
   * @param id_member - ID of the member.
   */
  deleteMemberLink(id_member: number): Promise<void>;
  /**
   * Internal method to add a member within a transaction (shared logic).
   * @param new_member - DTO for creation.
   * @param query_runner - Transaction runner.
   * @returns Created entity instance.
   */
  sharedAddMember(new_member: CreateMemberDTO, query_runner: QueryRunner): Promise<Individual | Company | undefined>;
}
