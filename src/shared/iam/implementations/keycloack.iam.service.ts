import KcAdminClient from "@keycloak/keycloak-admin-client";
import type { IIamService } from "../i-iam.service.js";
import { injectable } from "inversify";
import { CreateCommunityDTO } from "../../../modules/communities/api/community.dtos.js";
import { Role } from "../../dtos/role.js";
import config from "config";
import { GrantTypes } from "@keycloak/keycloak-admin-client/lib/utils/auth.js";
import logger from "../../monitor/logger.js";
import { isHttpError } from "../../errors/isHttpError.js";
// Configuration for the Keycloak Client
@injectable()
export class KeycloakIamService implements IIamService {
  private realm; // The specific realm for your app
  private kcAdminClient: KcAdminClient;
  constructor() {
    this.realm = config.get<string>("iam_service.settings.realm");
    this.kcAdminClient = new KcAdminClient({
      baseUrl: config.get<string>("iam_service.settings.baseUrl"),
      realmName: config.get<string>("iam_service.settings.realmName"), // Usually initialized with master to perform admin ops
    });
    this.authenticate()
      .then(() => {
        logger.info({ operation: "Keycloak constructor" }, "Authentication succesfull");
      })
      .catch((err) => {
        logger.error({ operation: "Keycloak constructor", error: err }, "Authentication failed");
      });
  }

  private async authenticate(): Promise<void> {
    await this.kcAdminClient.auth({
      clientId: config.get<string>("iam_service.settings.clientId"),
      grantType: config.get<GrantTypes>("iam_service.settings.grantType"),
      clientSecret: config.get<string>("iam_service.settings.clientSecret"),
    });
  }

  async createCommunity(new_community: CreateCommunityDTO): Promise<string> {
    // 1. Create the Root Group (Community)
    const groupRep = await this.kcAdminClient.groups.create({
      realm: this.realm,
      name: new_community.name,
    });

    if (!groupRep.id) {
      logger.error({ operation: "createCommunity" }, "Fail to create community on keycloack service");
      throw new Error(`Failed to create community: ${new_community.name}`);
    }

    const communityId = groupRep.id;

    // 2. Create Sub-Groups for each Role
    const roles = Object.values(Role);

    for (const roleName of roles) {
      try {
        // FIXED: Using createChildGroup per your definition
        await this.kcAdminClient.groups.createChildGroup(
          { id: communityId, realm: this.realm }, // Parent ID in query
          { name: roleName.toString() }, // Payload
        );
      } catch (error) {
        // Ignore 409 Conflict (group already exists), rethrow others
        logger.error({ operation: "createCommunity", error: error }, "Error while trying to add child group into keycloack");
        if (!isHttpError(error) || error.response.status !== 409) {
          throw error;
        }
      }
    }

    return communityId;
  }

  async addUserToCommunity(user_id: string, community_id: string, role: Role): Promise<void> {
    // TODO: Check, if the user is already within the community, check if the present role is higher or not than the new one
    const roleGroupId = await this.getRoleGroupId(community_id, role);

    await this.kcAdminClient.users.addToGroup({
      id: user_id,
      groupId: roleGroupId,
      realm: this.realm,
    });
  }

  async updateUserRole(user_id: string, community_id: string, role: Role): Promise<void> {
    // 1. Remove from all existing roles in this community
    await this.deleteUserFromCommunity(user_id, community_id);
    // 2. Add to new role
    await this.addUserToCommunity(user_id, community_id, role);
  }

  async deleteUserFromCommunity(user_id: string, community_id: string): Promise<void> {
    const roles = Object.values(Role);

    for (const roleName of roles) {
      try {
        // We find the sub-group ID for this role
        const roleGroupId = await this.getRoleGroupId(community_id, roleName as Role);

        // Attempt to remove user from it
        await this.kcAdminClient.users
          .delFromGroup({
            id: user_id,
            groupId: roleGroupId,
            realm: this.realm,
          })
          .catch(() => {
            /* Ignore if user wasn't in this specific role group */
          });
      } catch (e) {
        // Handle case where role group might not exist (optional)
        logger.warn(
          {
            operation: "deleteUserFromCommunity",
            error: e,
          },
          `Failed to remove user from role group '${roleName}' in community '${community_id}': ${(e as Error).message}`,
        );
      }
    }
  }

  private async getRoleGroupId(community_id: string, role: Role): Promise<string> {
    // OPTIMIZATION: Using listSubGroups from your definition is cleaner
    // than fetching the parent and parsing arrays.
    const subGroups = await this.kcAdminClient.groups.listSubGroups({
      parentId: community_id,
      realm: this.realm,
    });

    const roleGroup = subGroups.find((g) => g.name === role.toString());

    if (!roleGroup || !roleGroup.id) {
      throw new Error(`Role group '${role}' not found in community '${community_id}'`);
    }

    return roleGroup.id;
  }

  async updateCommunity(community_id: string, new_name: string): Promise<void> {
    try {
      await this.kcAdminClient.groups.update(
        {
          id: community_id,
          realm: this.realm,
        },
        {
          name: new_name,
        },
      );
    } catch (error) {
      logger.error({ operation: "updateCommunity" }, "Update community Keycloak IAM service fail");
      // Handle cases like "Name already taken" (409) or "Group not found" (404)
      throw error;
    }
  }

  async deleteCommunity(community_id: string): Promise<void> {
    try {
      await this.kcAdminClient.groups.del({
        id: community_id,
        realm: this.realm,
      });
    } catch (error) {
      logger.error({ operation: "deleteCommunity", error: error }, "An error happen while deleting a community to Keycloak");
      if (isHttpError(error) && error.response.status === 404) {
        return;
      }
      throw error;
    }
  }

  async getUserEmail(user_id: string): Promise<string> {
    const user = await this.kcAdminClient.users.findOne({
      id: user_id,
      realm: this.realm,
    });

    if (!user) {
      throw new Error(`User with ID ${user_id} not found in IAM.`);
    }

    return user.email || "";
  }
}
