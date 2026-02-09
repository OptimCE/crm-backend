import {inject, injectable} from "inversify";
import type {IUserRepository} from "../domain/i-user.repository.js";
import {AppDataSource} from "../../../shared/database/database.connector.js";
import type {QueryRunner} from "typeorm";
import {User} from "../domain/user.models.js";
import {getContext} from "../../../shared/middlewares/context.js";
import {GestionnaireInvitation, UserMemberInvitation} from "../../invitations/domain/invitation.models.js";
import logger from "../../../shared/monitor/logger.js";
import {AppError} from "../../../shared/middlewares/error.middleware.js";
import {USER_ERRORS} from "../shared/user.errors.js";

@injectable()
export class UserRepository implements IUserRepository {
    constructor(@inject("AppDataSource") private readonly dataSource: typeof AppDataSource) {}

    async getUser(query_runner?: QueryRunner): Promise<User | null> {
        const manager = query_runner? query_runner.manager : this.dataSource.manager;
        const {user_id} = getContext()
        return manager.findOneBy(User, {
            auth_user_id: user_id
        })
    }

    async createUser(email: string, query_runner: QueryRunner | undefined): Promise<User> {
        const manager = query_runner? query_runner.manager : this.dataSource.manager;
        const {user_id} = getContext()
        const new_user_model = manager.create(User, {
            auth_user_id: user_id,
            email: email,
        })
        return await manager.save(new_user_model)
    }

    async updateUser(user: User, query_runner?: QueryRunner): Promise<User> {
        const manager = query_runner? query_runner.manager : this.dataSource.manager;
        return await manager.save(user)
    }

    async getUserByEmail(email: string, query_runner?: QueryRunner): Promise<User | null> {
        const manager = query_runner? query_runner.manager : this.dataSource.manager;
        return manager.findOneBy(User, {
            email: email
        })
    }

    async updateInvitations(user: User, query_runner?: QueryRunner): Promise<void> {
        const manager = query_runner? query_runner.manager : this.dataSource.manager;
        const manager_invitation = await manager.find(GestionnaireInvitation, {
            where: {userEmail: user.email}
        });
        if(manager_invitation && manager_invitation.length > 0){
            const affected_update_manager = await manager.update(GestionnaireInvitation, {
                where: {userEmail: user.email},
            }, {user: user})
            if(!affected_update_manager || affected_update_manager.affected !== manager_invitation.length){
                logger.error({operation:'updateInvitations'}, 'The invitations links to manager weren\' update properly');
                throw new AppError(USER_ERRORS.UPDATE_INVITATION.INVITATION_NOT_UPDATED, 400);
            }
        }
        const member_invitation = await manager.find(UserMemberInvitation, {
            where: {userEmail: user.email}
        });
        if(member_invitation && member_invitation.length > 0){
            const affected_update_member = await manager.update(UserMemberInvitation, {
                where: {userEmail: user.email},
            }, {user: user})
            if(!affected_update_member || affected_update_member.affected !== member_invitation.length){
                logger.error({operation:'updateInvitations'}, 'The invitations links to member weren\' update properly');
                throw new AppError(USER_ERRORS.UPDATE_INVITATION.INVITATION_NOT_UPDATED, 400);
            }
        }
    }








}