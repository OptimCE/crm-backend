import type { IAuthContextRepository } from "./i-authcontext.repository.js";
import { inject, injectable } from "inversify";
import { AppDataSource } from "../database/database.connector.js";
import { In, type QueryRunner } from "typeorm";
import { getContext } from "../middlewares/context.js";
import { User } from "../../modules/users/domain/user.models.js";
import { AppError } from "../middlewares/error.middleware.js";
import { GLOBAL_ERRORS } from "../errors/errors.js";
import { Community } from "../../modules/communities/domain/community.models.js";

@injectable()
export class AuthContextRepository implements IAuthContextRepository {
  /**
   * Creates a new AuthContextRepository instance
   *
   * @param dataSource - Data source for database operations
   */
  constructor(@inject("AppDataSource") private readonly dataSource: typeof AppDataSource) {}

  async getInternalCommunityId(query_runner?: QueryRunner): Promise<number> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const { community_id } = getContext();
    if (!community_id) {
      throw new AppError(GLOBAL_ERRORS.UNAUTHORIZED, 401);
    }
    const community = await manager.findOne(Community, {
      where: { auth_community_id: community_id }, // Cast if partial type definition issues arise
      select: ["id"], // Select only ID for performance
    });

    if (!community) {
      throw new AppError(GLOBAL_ERRORS.UNAUTHORIZED, 404);
    }
    return community.id;
  }

  async getInternalCommunityIds(auth_community_ids: string[], query_runner?: QueryRunner): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (auth_community_ids.length === 0) return result;

    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const communities = await manager.find(Community, {
      where: { auth_community_id: In(auth_community_ids) },
      select: ["id", "auth_community_id"],
    });
    for (const community of communities) {
      // A claimed org with no community row is skipped, not an error: the JWT
      // and the database can legitimately disagree while an org is being
      // provisioned or after one is removed.
      if (community.auth_community_id) result.set(community.auth_community_id, community.id);
    }
    return result;
  }

  async getInternalUserId(query_runner?: QueryRunner): Promise<number> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    const { user_id } = getContext();
    if (!user_id) {
      throw new AppError(GLOBAL_ERRORS.UNAUTHENTICATED, 401);
    }

    const user = await manager.findOne(User, {
      where: { auth_user_id: user_id }, // Cast if partial type definition issues arise
      select: ["id"], // Select only ID for performance
    });

    if (!user) {
      throw new AppError(GLOBAL_ERRORS.UNAUTHENTICATED, 404);
    }
    return user.id;
  }
}
