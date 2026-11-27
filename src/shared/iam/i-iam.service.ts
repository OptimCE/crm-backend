import type { CreateCommunityDTO } from "../../modules/communities/api/community.dtos.js";
import type { Role } from "../dtos/role.js";

/**
 * Interface for Identity and Access Management (IAM) Service.
 * Absobs the complexity of external IAM providers (e.g., Keycloak).
 */
export interface IIamService {
  /**
   * Creates a new community group in the IAM provider.
   * @param new_community - DTO containing community details.
   * @returns The ID of the created community group.
   */
  createCommunity(new_community: CreateCommunityDTO): Promise<string>;

  /**
   * Adds a user to a community with a specific role.
   * @param user_id - The IAM user ID.
   * @param community_id - The IAM community group ID.
   * @param role - The role to assign.
   */
  addUserToCommunity(user_id: string, community_id: string, role: Role): Promise<void>;

  /**
   * Updates a user's role within a community.
   * @param user_id - The IAM user ID.
   * @param community_id - The IAM community group ID.
   * @param role - The new role.
   */
  updateUserRole(user_id: string, community_id: string, role: Role): Promise<void>;

  /**
   * Removes a user from a community.
   * @param user_id - The IAM user ID.
   * @param community_id - The IAM community group ID.
   */
  deleteUserFromCommunity(user_id: string, community_id: string): Promise<void>;

  /**
   * Updates a community's name.
   * @param community_id - The IAM community group ID.
   * @param new_name - The new name.
   */
  updateCommunity(community_id: string, new_name: string): Promise<void>;

  /**
   * Deletes a community group.
   * @param community_id - The IAM community group ID.
   */
  deleteCommunity(community_id: string): Promise<void>;

  /**
   * Retrieves a user's email address by their IAM ID.
   * @param user_id - The IAM user ID.
   * @returns The user's email address.
   */
  getUserEmail(user_id: string): Promise<string>;

  /**
   * What the identity provider holds about a user, for the data export (`crm/identity.json`):
   * profile, attributes, linked identity providers, roles, groups and creation date. Never a
   * password hash, a credential, an OTP setting or a secret. Null when the user does not exist.
   */
  getUserExport(user_id: string): Promise<IamUserExport | null>;
}

export interface IamUserExport {
  id: string;
  username: string | null;
  email: string | null;
  email_verified: boolean | null;
  first_name: string | null;
  last_name: string | null;
  enabled: boolean | null;
  created_at: string | null;
  attributes: Record<string, string[]>;
  identity_providers: { provider: string; user_id: string | null; user_name: string | null }[];
  realm_roles: string[];
  groups: { name: string | null; path: string | null }[];
}
