import type { OnboardingStateDTO, UpdateOnboardingStateDTO } from "../api/onboarding.dtos.js";

/**
 * Stores the answers to onboarding tour offers, for the authenticated user only.
 */
export interface IOnboardingService {
  /** The current user's recorded states. */
  getStates(): Promise<OnboardingStateDTO[]>;

  /**
   * Records an answer. Idempotent; refuses an unknown tour or a forbidden transition.
   * @returns The state after the write.
   */
  setState(tour_key: string, update: UpdateOnboardingStateDTO): Promise<OnboardingStateDTO>;
}
