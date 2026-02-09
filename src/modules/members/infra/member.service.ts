import { inject, injectable } from "inversify";
import type { IMemberService } from "../domain/i-member.service.js";
import type { IMemberRepository } from "../domain/i-member.repository.js";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import {
    CompanyDTO,
    CreateMemberDTO,
    IndividualDTO,
    MemberLinkDTO, MemberLinkQueryDTO,
    MemberPartialQuery,
    MembersPartialDTO,
    PatchMemberInviteUserDTO,
    PatchMemberStatusDTO,
    UpdateMemberDTO
} from "../api/member.dtos.js";
import { Pagination } from "../../../shared/dtos/ApiResponses.js";
import { Transactional } from "../../../shared/transactional/transaction.uow.js";
import { DeleteResult, type QueryRunner } from "typeorm";
import {Company, Individual, Manager, Member} from "../domain/member.models.js";
import logger from "../../../shared/monitor/logger.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import type { IAddressRepository } from "../../../shared/address/i-address.repository.js";
import { toMemberDTO, toMemberPartialDTO } from "../shared/to_dto.js";
import { UserMemberInvitation } from "../../invitations/domain/invitation.models.js";
import type { IAuthContextRepository } from "../../../shared/context/i-authcontext.repository.js";
import { MEMBER_ERRORS } from "../shared/member.errors.js";
import { MemberStatus, MemberType } from "../shared/member.types.js";

/**
 * Service implementation for managing members.
 * Handles creation, update, deletion, and retrieval of members (Individuals/Companies)
 * and their address/user linkages.
 */
@injectable()
export class MemberService implements IMemberService {

    constructor(@inject("MemberRepository") private member_repository: IMemberRepository,
        @inject("AddressRepository") private address_repository: IAddressRepository,
        @inject("AuthContext") private authContext: IAuthContextRepository,
        @inject("AppDataSource") private readonly dataSource: typeof AppDataSource) {
    }

    /**
     * Internal shared logic to add a member.
     * Handles address creation and polymorphic entity creation (Individual vs Company).
     * @param new_member - DTO with member details.
     * @param query_runner - Database transaction runner.
     * @returns The created specific entity (Individual | Company) or undefined.
     */
    async sharedAddMember(new_member: CreateMemberDTO, query_runner: QueryRunner): Promise<Individual | Company | undefined> {
        const internal_community_id = await this.authContext.getInternalCommunityId(query_runner);
        const home_address = await this.address_repository.addAddress(new_member.home_address, query_runner);
        const billing_address = await this.address_repository.addAddress(new_member.billing_address, query_runner);
        const member_model = query_runner.manager.create(Member, {
            name: new_member.name,
            member_type: new_member.member_type,
            status: new_member.status,
            IBAN: new_member.iban,
            home_address: home_address,       // Link the saved address entity
            billing_address: billing_address, // Link the saved address entity
            community: { id: internal_community_id } as any
        });
        const saved_member = await this.member_repository.saveMember(member_model, query_runner)
        let manager: Manager|undefined = undefined;
        if(new_member.manager){
            const new_manager = query_runner.manager.create(Manager, {
                NRN: new_member.manager.NRN,
                email: new_member.manager.email,
                name: new_member.manager.name,
                surname: new_member.manager.surname,
                phone_number: new_member.manager.phone_number,
            });
            manager = await this.member_repository.saveManager(new_manager);
            if(!manager){
                logger.error({operation: 'sharedAddMember'},
                    "Error while saving new guardian to the database")
                throw new AppError(MEMBER_ERRORS.ADD_MEMBER.DATABASE_ADD, 400);
            }
        }
        // 4. Create Sub-Entity (Individual or Company)
        if (new_member.member_type === MemberType.INDIVIDUAL) {
            const individual_model = query_runner.manager.create(Individual, {
                id: saved_member.id, // Shared Primary Key
                first_name: new_member.first_name,
                NRN: new_member.NRN,
                email: new_member.email,
                phone_number: new_member.phone_number,
                social_rate: new_member.social_rate,
                manager: manager ? manager : null
            });

            return await this.member_repository.saveIndividual(individual_model, query_runner);
        }
        else if (new_member.member_type === MemberType.COMPANY) {
            const company_model = query_runner.manager.create(Company, {
                id: saved_member.id, // Shared Primary Key
                vat_number: new_member.vat_number,
                manager: manager
            });

            return await this.member_repository.saveCompany(company_model, query_runner);
        }
    }


    /**
     * Adds a new member to the community (Public API).
     * Wraps shared logic in a transaction.
     * @param new_member - DTO for creation.
     * @param query_runner - Database transaction runner.
     * @throws AppError if database operation fails.
     */
    @Transactional()
    async addMember(new_member: CreateMemberDTO, query_runner?: QueryRunner): Promise<void> {
        if (!query_runner) {
            logger.error({ operation: "addMember" }, "Query runner undefined")
            throw new AppError(MEMBER_ERRORS.DATABASE.QUERY_RUNNER_MANDATORY, 400);
        }
        try {
            await this.sharedAddMember(new_member, query_runner);
        }
        catch (err) {
            logger.error({ operation: "addMember", error: err }, "An error happened during adding a new member")
            throw new AppError(MEMBER_ERRORS.ADD_MEMBER.DATABASE_ADD, 400);
        }

    }
    /**
     * Deletes a member.
     * @param id_member - ID of the member.
     * @param query_runner - Database transaction runner.
     * @throws AppError if deletion fails or affects != 1 row.
     */
    @Transactional()
    async deleteMember(id_member: number, query_runner?: QueryRunner): Promise<void> {
        try {
            const deleted_result: DeleteResult = await this.member_repository.deleteMember(id_member, query_runner);
            if (deleted_result.affected !== 1) {
                logger.error({ operation: 'deleteMemberLink' }, "The deletion of member failed, affected is not equal to one");
                throw new AppError(MEMBER_ERRORS.DELETE_MEMBER.DATABASE_DELETE, 400);
            }
        }
        catch (err: any) {
            if (err instanceof AppError || err.constructor.name === 'AppError') {
                throw err;
            }
            logger.error({ operation: 'deleteMemberLink', error: err }, "The deletion of member failed, exception");
            throw new AppError(MEMBER_ERRORS.DELETE_MEMBER.DATABASE_DELETE, 400);
        }
    }
    /**
     * Deletes the link between a member and a user account.
     * @param id_member - ID of the member.
     * @param query_runner - Database transaction runner.
     * @throws AppError if deletion fails.
     */
    @Transactional()
    async deleteMemberLink(id_member: number, query_runner?: QueryRunner): Promise<void> {
        try {
            const deleted_result: DeleteResult = await this.member_repository.deleteMemberLink(id_member, query_runner);
            if (deleted_result.affected !== 1) {
                logger.error({ operation: 'deleteMemberLink' }, "The deletion of member link failed, affected is not equal to one");
                throw new AppError(MEMBER_ERRORS.DELETE_MEMBER_LINK.DATABASE_DELETE, 400);
            }
        }
        catch (err: any) {
            if (err instanceof AppError || err.constructor.name === 'AppError') {
                throw err;
            }
            logger.error({ operation: 'deleteMemberLink', error: err }, "The deletion of member link failed, exception");
            throw new AppError(MEMBER_ERRORS.DELETE_MEMBER_LINK.DATABASE_DELETE, 400);
        }
    }

    /**
     * Retrieves full details of a specific member.
     * @param id_member - ID of the member.
     * @returns Full DTO (Individual or Company).
     * @throws AppError if member not found.
     */
    async getMember(id_member: number): Promise<IndividualDTO | CompanyDTO> {
        const value: Member | null = await this.member_repository.getFullMember(id_member);
        if (!value) {
            logger.error({ operation: 'getMember' }, `No member found with id ${id_member} found`);
            throw new AppError(MEMBER_ERRORS.GET_MEMBER.NOT_FOUND, 400);
        }
        return toMemberDTO(value);
    }

    /**
     * Retrieves a paginated list of members (partial view).
     * @param query - Filtering/paging parameters.
     * @returns Tuple [List, Pagination].
     */
    async getMembersList(query: MemberPartialQuery): Promise<[MembersPartialDTO[], Pagination]> {
        const [values, total]: [Member[], number] = await this.member_repository.getMembersList(query);
        const return_values = values.map((value) => toMemberPartialDTO(value))
        const total_pages = Math.ceil(total / query.limit);
        return [return_values, { page: query.page, limit: query.limit, total: total, total_pages: total_pages }]
    }
    /**
     * Invites a user to become a member (creates association).
     * @param patched_member_invite_user - DTO containing user email.
     * @param query_runner - Database transaction runner.
     * @throws AppError if member not found or DB error.
     */
    @Transactional()
    async patchMemberLink(patched_member_invite_user: PatchMemberInviteUserDTO, query_runner?: QueryRunner): Promise<void> {
        const value: Member | null = await this.member_repository.getMember(patched_member_invite_user.id_member, query_runner);
        if (!value) {
            logger.error({ operation: 'patchMemberLink' }, `No member found with id ${patched_member_invite_user.id_member} found`);
            throw new AppError(MEMBER_ERRORS.PATCH_MEMBER_LINK.MEMBER_NOT_FOUND, 400);
        }
        try {
            await this.member_repository.addInvitationToMember(patched_member_invite_user.id_member, patched_member_invite_user.user_email, query_runner)
        }
        catch (err: any) {
            logger.error({ operation: "patchMemberLink", error: err }, "An exception occurred while inviting a user to become member");
            throw new AppError(MEMBER_ERRORS.PATCH_MEMBER_LINK.DATABASE_ADD, 400)
        }
    }
    /**
     * Updates the status of a member.
     * @param patched_member_status - DTO with new status.
     * @param query_runner - Database transaction runner.
     * @throws AppError if member not found or DB error.
     */
    @Transactional()
    async patchMemberStatus(patched_member_status: PatchMemberStatusDTO, query_runner?: QueryRunner): Promise<void> {
        const value: Member | null = await this.member_repository.getMember(patched_member_status.id_member, query_runner);
        if (!value) {
            logger.error({ operation: 'patchMemberStatus' }, `No member found with id ${patched_member_status.id_member} found`);
            throw new AppError(MEMBER_ERRORS.PATCH_MEMBER_STATUS.MEMBER_NOT_FOUND, 400);
        }
        value.status = patched_member_status.status
        try {
            await this.member_repository.saveMember(value, query_runner);
        }
        catch (err) {
            logger.error({ operation: "patchMemberStatus", error: err }, "An exception occurred while patching the member status");
            throw new AppError(MEMBER_ERRORS.PATCH_MEMBER_STATUS.DATABASE_UPDATE, 400)
        }
    }
    /**
     * Updates an existing member's details.
     * Handles address updates (create new/link) and type-specific details.
     * @param update_dto - DTO with updated fields.
     * @param query_runner - Database transaction runner.
     * @throws AppError if member not found or DB error.
     */
    @Transactional()
    async updateMember(update_dto: UpdateMemberDTO, query_runner?: QueryRunner): Promise<void> {
        if (!query_runner) {
            logger.error({ operation: "updateMember" }, "Query runner undefined");
            throw new AppError(MEMBER_ERRORS.DATABASE.QUERY_RUNNER_MANDATORY, 400);
        }

        // 1. Fetch existing member with details
        const member = await this.member_repository.getFullMember(update_dto.id, query_runner);

        if (!member) {
            logger.error({ operation: "updateMember" }, `No member found with id ${update_dto.id}`);
            throw new AppError(MEMBER_ERRORS.UPDATE_MEMBER.MEMBER_NOT_FOUND, 400);
        }

        if (update_dto.name) member.name = update_dto.name;
        if (update_dto.status) member.status = update_dto.status;
        if (update_dto.iban) member.IBAN = update_dto.iban;

        // 3. Handle Home Address Change (Create/Link New)
        if (update_dto.home_address) {
            // Construct the "Effective" new address by merging existing + updates
            const next_home_address = {
                street: update_dto.home_address.street ?? member.home_address.street,
                number: update_dto.home_address.number ?? member.home_address.number,
                city: update_dto.home_address.city ?? member.home_address.city,
                postcode: update_dto.home_address.postcode ?? member.home_address.postcode, // Ensure this matches your DTO field name (zip_code vs postcode)
                // Assuming 'supplement' is in your models/DTOs
                supplement: update_dto.home_address.supplement ?? (member.home_address as any).supplement,
            };

            // This will either find an existing matching address ID or create a new one
            try {
                member.home_address = await this.address_repository.addAddress(next_home_address, query_runner);
            }
            catch (err) {
                logger.error({ operation: "updateMember", error: err }, `An error occured while saving/fetching the address`);
                throw new AppError(MEMBER_ERRORS.UPDATE_MEMBER.DATABASE_SAVE_ADDRESS, 400);
            }
        }

        // 4. Handle Billing Address Change (Create/Link New)
        if (update_dto.billing_address) {
            const next_billing_address = {
                street: update_dto.billing_address.street ?? member.billing_address.street,
                number: update_dto.billing_address.number ?? member.billing_address.number,
                city: update_dto.billing_address.city ?? member.billing_address.city,
                postcode: update_dto.billing_address.postcode ?? member.billing_address.postcode,
                supplement: update_dto.billing_address.supplement ?? (member.billing_address as any).supplement
            };
            try {
                member.billing_address = await this.address_repository.addAddress(next_billing_address, query_runner);
            }
            catch (err) {
                logger.error({ operation: "updateMember", error: err }, `An error occured while saving/fetching the address`);
                throw new AppError(MEMBER_ERRORS.UPDATE_MEMBER.DATABASE_SAVE_ADDRESS, 400);
            }
        }

        // 5. Save Base Member (Update links to addresses and base fields)
        try {
            await this.member_repository.saveMember(member, query_runner);
        }
        catch (err) {
            logger.error({ operation: "updateMember", error: err }, `An error occured while saving/updating the member`);
            throw new AppError(MEMBER_ERRORS.UPDATE_MEMBER.DATABASE_SAVE_MEMBER, 400);
        }

        // 6. Update Sub-Entity (Polymorphic Logic)
        // We strictly respect the EXISTING member.member_type

        if (member.member_type === MemberType.INDIVIDUAL && member.individual_details) {
            const ind = member.individual_details;

            if (update_dto.first_name) ind.first_name = update_dto.first_name;
            if (update_dto.NRN) ind.NRN = update_dto.NRN;
            if (update_dto.email) ind.email = update_dto.email;

            // Handle boolean update (check strictly for undefined)
            if (update_dto.social_rate !== undefined) ind.social_rate = update_dto.social_rate;

            // Handle nullable phone
            if (update_dto.phone_number !== undefined) ind.phone_number = update_dto.phone_number || null;

            if (update_dto.manager) {
                let manager: Manager | null = null;
                if(ind.manager){
                    // Update
                    if(update_dto.manager.email) {
                        ind.manager.email = update_dto.manager.email;
                    }
                    if(update_dto.manager.NRN){
                        ind.manager.NRN = update_dto.manager.NRN;
                    }
                    if(update_dto.manager.name){
                        ind.manager.name = update_dto.manager.name;
                    }
                    if(update_dto.manager.surname){
                        ind.manager.surname = update_dto.manager.surname;
                    }
                    if(update_dto.manager.phone_number){
                        ind.manager.phone_number = update_dto.manager.phone_number;
                    }
                }
                else{
                    // Create
                    const new_manager = query_runner.manager.create(Manager, {
                        NRN: update_dto.manager.NRN,
                        email: update_dto.manager.email,
                        name: update_dto.manager.name,
                        surname: update_dto.manager.surname,
                        phone_number: update_dto.manager.phone_number,
                    });
                    manager = await this.member_repository.saveManager(new_manager);
                    if(!manager){
                        logger.error({operation: 'updateMember'},
                            "Error while updating guardian to the database")
                        throw new AppError(MEMBER_ERRORS.UPDATE_MEMBER.DATABASE_SAVE_MEMBER, 400);
                    }
                }
                ind.manager = manager;
            }
            try {
                await this.member_repository.saveIndividual(ind, query_runner);
            }
            catch (err) {
                logger.error({ operation: "updateMember", error: err }, `An error occured while saving/updating the individual`);
                throw new AppError(MEMBER_ERRORS.UPDATE_MEMBER.DATABASE_SAVE_INDIVIDUAL, 400);
            }
        }
        else if (member.member_type === MemberType.COMPANY && member.company_details) {
            const comp = member.company_details;

            if (update_dto.vat_number) comp.vat_number = update_dto.vat_number;

            if (update_dto.manager) {
                let manager: Manager | null = null;
                if(comp.manager){
                    // Update
                    if(update_dto.manager.email) {
                        comp.manager.email = update_dto.manager.email;
                    }
                    if(update_dto.manager.NRN){
                        comp.manager.NRN = update_dto.manager.NRN;
                    }
                    if(update_dto.manager.name){
                        comp.manager.name = update_dto.manager.name;
                    }
                    if(update_dto.manager.surname){
                        comp.manager.surname = update_dto.manager.surname;
                    }
                    if(update_dto.manager.phone_number){
                        comp.manager.phone_number = update_dto.manager.phone_number;
                    }
                }
                else{
                    // Create
                    const new_manager = query_runner.manager.create(Manager, {
                        NRN: update_dto.manager.NRN,
                        email: update_dto.manager.email,
                        name: update_dto.manager.name,
                        surname: update_dto.manager.surname,
                        phone_number: update_dto.manager.phone_number,
                    });
                    manager = await this.member_repository.saveManager(new_manager);
                    if(!manager){
                        logger.error({operation: 'updateMember'},
                            "Error while updating guardian to the database")
                        throw new AppError(MEMBER_ERRORS.UPDATE_MEMBER.DATABASE_SAVE_COMPANY, 400);
                    }
                }
                comp.manager = manager!;
            }

            try {
                await this.member_repository.saveCompany(comp, query_runner);
            }
            catch (err) {
                logger.error({ operation: "updateMember", error: err }, `An error occured while saving/updating the company`);
                throw new AppError(MEMBER_ERRORS.UPDATE_MEMBER.DATABASE_SAVE_COMPANY, 400);
            }
        }
    }

    /**
     * Retrieves the link status between a member and a user.
     * Checks for active link or pending invitation.
     * @param id_member - ID of the member.
     * @param query - Email of the user targetted by the query
     * @returns MemberLinkDTO struct.
     */
    async getMemberLink(id_member: number, query: MemberLinkQueryDTO): Promise<MemberLinkDTO> {
        // Check if member link exist
        const member_link = await this.member_repository.getMemberLink(id_member, query);
        if (member_link) {
            return {
                user_email: member_link.user?.email,
                status: MemberStatus.ACTIVE,
                user_id: member_link.user?.id,
                id: member_link.id,
            }
        }
        // Otherwise, check if an invitation exist
        const member_invitation: UserMemberInvitation | null = await this.member_repository.getMemberInvitation(id_member, query);
        if (member_invitation) {
            return {
                user_email: member_invitation.userEmail,
                status: MemberStatus.PENDING,
                user_id: member_invitation.user ? member_invitation.user.id : undefined,
                id: member_invitation.id
            }
        }
        return {
            status: MemberStatus.INACTIVE
        }
    }
}