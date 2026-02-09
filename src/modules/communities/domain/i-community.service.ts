import {
    CommunityQueryDTO,
    CommunityUsersQueryDTO,
    CreateCommunityDTO,
    MyCommunityDTO, PatchRoleUserDTO,
    UsersCommunityDTO
} from "../api/community.dtos.js";
import { Pagination } from "../../../shared/dtos/ApiResponses.js";

/**
 * Interface for the Community Service.
 * Defines the contract for managing communities regarding business logic.
 */
export interface ICommunityService {
    /**
     * Retrieves a paginated list of communities where the current user is a member.
     * @param query - Query parameters for filtering and pagination.
     * @returns A tuple containing the list of MyCommunityDTO and pagination info.
     */
    getMyCommunities(query: CommunityQueryDTO): Promise<[MyCommunityDTO[], Pagination]>;
    /**
     * Retrieves a paginated list of users within a community.
     * @param query - Query parameters including community context and filters.
     * @returns A tuple containing the list of UsersCommunityDTO and pagination info.
     */
    getUsers(query: CommunityUsersQueryDTO): Promise<[UsersCommunityDTO[], Pagination]>;
    /**
     * Retrieves a paginated list of admins and managers for a community.
     * @param query - Query parameters including community context.
     * @returns A tuple containing the list of UsersCommunityDTO and pagination info.
     */
    getAdmins(query: CommunityUsersQueryDTO): Promise<[UsersCommunityDTO[], Pagination]>;
    /**
     * Adds a new community.
     * Creates the community in IAM and local database.
     * @param new_community - DTO containing the new community details.
     */
    addCommunity(new_community: CreateCommunityDTO): Promise<void>;
    /**
     * Updates a community.
     * Updates the community name in IAM and local database.
     * @param updated_community - DTO containing the updated details.
     */
    updateCommunity(updated_community: CreateCommunityDTO): Promise<void>;
    /**
     * Updates a user's role in a community.
     * Handles role changes and logic like downgrading admins.
     * @param patched_role - DTO containing user ID and new role.
     */
    patchRoleUser(patched_role: PatchRoleUserDTO): Promise<void>;
    /**
     * Removes the current user from a community (Leave).
     * @param id_community - The ID of the community to leave.
     */
    leave(id_community: number): Promise<void>;
    /**
     * Kicks a user from a community.
     * @param id_user - The ID of the user to kick.
     */
    kickUser(id_user: number): Promise<void>;
    /**
     * Deletes a community entirely.
     * Removes from DB and IAM.
     * @param id_community - The ID of the community to delete.
     */
    deleteCommunity(id_community: number): Promise<void>;
}