import { UpdateUserDTO, UserDTO } from "../api/user.dtos.js";

/**
 * Interface for User Service.
 * Defines operations for managing user profiles.
 */
export interface IUserService {
    /**
     * Retrieves the profile of the current user.
     * @returns UserDTO containing profile details.
     */
    getProfile(): Promise<UserDTO>;

    /**
     * Updates the profile of the current user.
     * @param updated_user - DTO containing updated profile fields.
     */
    updateProfile(updated_user: UpdateUserDTO): Promise<void>;
}