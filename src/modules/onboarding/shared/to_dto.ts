import type { UserOnboarding } from "../domain/onboarding.models.js";
import type { OnboardingStateDTO } from "../api/onboarding.dtos.js";

export function toOnboardingStateDTO(row: UserOnboarding): OnboardingStateDTO {
  return {
    tour_key: row.tour_key,
    outcome: row.outcome,
    tour_version: row.tour_version ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
