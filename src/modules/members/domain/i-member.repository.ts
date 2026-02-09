import {MemberLinkQueryDTO, MemberPartialQuery} from "../api/member.dtos.js";
import {Company, Individual, Manager, Member} from "./member.models.js";
import {DeleteResult, type QueryRunner} from "typeorm";
import {UserMemberLink} from "../../users/domain/user.models.js";
import {UserMemberInvitation} from "../../invitations/domain/invitation.models.js";

export interface IMemberRepository{
    getMembersList(query: MemberPartialQuery, query_runner?: QueryRunner): Promise<[Member[], number]>;
    getMember(id_member: number, query_runner?: QueryRunner): Promise<Member|null>;
    saveMember(member: Member, query_runner?: QueryRunner): Promise<Member>;
    saveIndividual(individual: Individual, query_runner?: QueryRunner): Promise<Individual>;
    saveCompany(company: Company, query_runner?: QueryRunner): Promise<Company>;
    getFullMember(id_member: number, query_runner?: QueryRunner): Promise<Member|null>;
    deleteMemberLink(id_member: number, query_runner?: QueryRunner): Promise<DeleteResult>;
    deleteMember(id_member: number, query_runner?: QueryRunner): Promise<DeleteResult>;
    getMemberLink(member_id: number, query: MemberLinkQueryDTO, query_runner?: QueryRunner): Promise<UserMemberLink|null>;
    addInvitationToMember(id_member: number, user_email: string, query_runner?: QueryRunner): Promise<void>;
    getMemberInvitation(id_member: number, query: MemberLinkQueryDTO, query_runner?: QueryRunner): Promise<UserMemberInvitation | null>;
    saveManager(manager: Manager, query_runner?: QueryRunner): Promise<Manager>;
}