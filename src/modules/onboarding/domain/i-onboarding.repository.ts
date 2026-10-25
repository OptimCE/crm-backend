import type { QueryRunner } from "typeorm";
import type { UserOnboarding } from "./onboarding.models.js";
import type { OnboardingOutcome } from "../shared/onboarding.tours.js";

export interface IOnboardingRepository {
  /** The current user's rows; empty when the user has no CRM row yet. */
  list(query_runner?: QueryRunner): Promise<UserOnboarding[]>;
  /** One row of the given user, locked for the rest of the transaction. */
  findForUpdate(id_user: number, tour_key: string, query_runner?: QueryRunner): Promise<UserOnboarding | null>;
  /** Inserts the row unless one exists; false when another request created it first. */
  insertIfAbsent(id_user: number, tour_key: string, outcome: OnboardingOutcome, tour_version: string | null, query_runner?: QueryRunner): Promise<boolean>;
  update(row: UserOnboarding, query_runner?: QueryRunner): Promise<UserOnboarding>;
}
