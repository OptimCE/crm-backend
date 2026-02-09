import type {IAuthContextRepository} from "./i-authcontext.repository.js";
import {inject, injectable} from "inversify";
import {AppDataSource} from "../database/database.connector.js";
import type {QueryRunner} from "typeorm";
import {getContext} from "../middlewares/context.js";
import {User} from "../../modules/users/domain/user.models.js";
import {AppError} from "../middlewares/error.middleware.js";
import {GLOBAL_ERRORS} from "../errors/errors.js";
import {Community} from "../../modules/communities/domain/community.models.js";

@injectable()
export class AuthContextRepository implements IAuthContextRepository {
    /**
     * Creates a new AuthContextRepository instance
     *
     * @param dataSource - Data source for database operations
     */
    constructor(@inject("AppDataSource") private readonly dataSource: typeof AppDataSource) {}

    async getInternalCommunityId(query_runner?: QueryRunner): Promise<number> {
        const manager = query_runner? query_runner.manager : this.dataSource.manager;
        const {community_id} = getContext()

        const community = await manager.findOne(Community, {
            where: { auth_community_id: community_id } as any, // Cast if partial type definition issues arise
            select: ['id'], // Select only ID for performance
        });

        if (!community) {
            throw new AppError(GLOBAL_ERRORS.UNAUTHORIZED, 404);
        }
        return community.id;
    }

    async getInternalUserId(query_runner?: QueryRunner): Promise<number> {
        const manager = query_runner? query_runner.manager : this.dataSource.manager;
        const {user_id} = getContext()

        const user = await manager.findOne(User, {
            where: { auth_user_id: user_id } as any, // Cast if partial type definition issues arise
            select: ['id'], // Select only ID for performance
        });

        if (!user) {
            throw new AppError(GLOBAL_ERRORS.UNAUTHENTICATED, 404);
        }
        return user.id;
    }



}