import type { IUserService } from "../domain/i-user.service.js";
import { inject, injectable } from "inversify";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import type { IUserRepository } from "../domain/i-user.repository.js";
import { UpdateUserDTO, UserDTO } from "../api/user.dtos.js";
import { Transactional } from "../../../shared/transactional/transaction.uow.js";
import type { QueryRunner } from "typeorm";
import { User } from "../domain/user.models.js";
import { toUserDTO } from "../shared/to_dto.js";
import type { IIamService } from "../../../shared/iam/i-iam.service.js";
import { getContext } from "../../../shared/middlewares/context.js";
import logger from "../../../shared/monitor/logger.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import type { IAddressRepository } from "../../../shared/address/i-address.repository.js";
import { USER_ERRORS } from "../shared/user.errors.js";

@injectable()
export class UserService implements IUserService {
    constructor(@inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
        @inject("IAMService") private iam_service: IIamService,
        @inject("AddressRepository") private readonly addressRepository: IAddressRepository,
        @inject("UserRepository") private readonly userRepository: IUserRepository) { }

    /**
     * Retrieves the current user's profile.
     * If the user doesn't exist in the database (first login), it creates a new user record
     * and checks for any pending invitations.
     * @param query_runner - Optional query runner for transactional consistency.
     * @returns UserDTO containing the user's profile.
     * @throws AppError if user creation fails or profile cannot be fetched.
     */
    @Transactional()
    async getProfile(query_runner?: QueryRunner): Promise<UserDTO> {
        let user: User | null = await this.userRepository.getUser(query_runner);
        if (!user) {
            const { user_id } = getContext()
            // Create a new one if it doesn't already exist (by the external auth id)
            const email = await this.iam_service.getUserEmail(user_id!)
            if (email) {
                try {
                    user = await this.userRepository.createUser(email, query_runner)
                }
                catch (err) {
                    logger.error({ operation: 'getProfile', error: err }, "Error while adding a new user profile")
                    throw new AppError(USER_ERRORS.GET_PROFILE.DATABASE_ADD, 400);
                }
                // Need to update the possible invitation
                try {
                    await this.userRepository.updateInvitations(user, query_runner);
                }
                catch (err: any) {
                    if (err instanceof AppError || err.constructor.name === 'AppError') {
                        throw err;
                    }
                    logger.error({ operation: 'getProfile', error: err }, "Error while adding new invitation")
                    throw new AppError(USER_ERRORS.GET_PROFILE.DATABASE_ADD, 400);
                }
            }
        }
        if (!user) {
            logger.error({ operation: 'getProfile' }, "Error while fetching user profile")
            throw new AppError(USER_ERRORS.GET_PROFILE.USER_NOT_FOUND, 400);
        }
        return toUserDTO(user);
    }

    /**
     * Updates the current user's profile information.
     * Only fields present in the DTO will be updated.
     * Handles address creation/updates via AddressRepository.
     * @param updated_user - DTO containing fields to update.
     * @param query_runner - Optional query runner.
     * @throws AppError if user not found or database update fails.
     */
    @Transactional()
    async updateProfile(updated_user: UpdateUserDTO, query_runner?: QueryRunner): Promise<void> {
        const user = await this.userRepository.getUser(query_runner);
        if (!user) {
            logger.error({ operation: 'updateProfile' }, "Error while fetching user profile")
            throw new AppError(USER_ERRORS.UPDATE_PROFILE.USER_NOT_FOUND, 400);
        }
        if (updated_user.nrn) {
            user.NRN = updated_user.nrn
        }
        if (updated_user.first_name) {
            user.firstName = updated_user.first_name
        }
        if (updated_user.last_name) {
            user.lastName = updated_user.last_name
        }
        if (updated_user.billing_address) {
            user.billingAddress = await this.addressRepository.addAddress(updated_user.billing_address, query_runner)
        }
        if (updated_user.home_address) {
            user.homeAddress = await this.addressRepository.addAddress(updated_user.home_address, query_runner)
        }
        if (updated_user.iban) {
            user.iban = updated_user.iban
        }
        if (updated_user.phone_number) {
            user.phoneNumber = updated_user.phone_number
        }
        try {
            await this.userRepository.updateUser(user, query_runner)
        }
        catch (err) {
            logger.error({ operation: 'updateProfile', error: err }, "Error while updating user profile")
            throw new AppError(USER_ERRORS.UPDATE_PROFILE.DATABASE_UPDATE, 400);
        }
    }
}