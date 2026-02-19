import type { User } from "./user.models.js";
import type { QueryRunner } from "typeorm";

export interface IUserRepository {
  getUser(query_runner?: QueryRunner): Promise<User | null>;
  createUser(email: string, query_runner: QueryRunner | undefined): Promise<User>;
  updateUser(user: User, query_runner?: QueryRunner): Promise<User>;
  getUserByEmail(email: string, query_runner?: QueryRunner): Promise<User | null>;
  updateInvitations(user: User, query_runner?: QueryRunner): Promise<void>;
}
