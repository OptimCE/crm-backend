import { Expose, Type } from "class-transformer";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";
import { ONBOARDING_ERRORS } from "../shared/onboarding.errors.js";
import { ONBOARDING_API_OUTCOMES, type OnboardingApiOutcome, type OnboardingOutcome } from "../shared/onboarding.tours.js";

/**
 * The answer a user gave to one onboarding tour offer.
 */
export class OnboardingStateDTO {
  /** `welcome`, `community_member`, `community_manager` or `community_admin`. */
  @Expose()
  tour_key!: string;

  /** `dismissed`, `started`, `completed`, `abandoned` or `backfilled` (users who existed before the feature). */
  @Expose()
  outcome!: OnboardingOutcome;

  /** The tour's content hash when known. */
  @Expose()
  tour_version!: string | null;

  @Expose()
  created_at!: Date;

  @Expose()
  updated_at!: Date;
}

/**
 * Body of `PUT /me/onboarding/:tour_key`.
 */
export class UpdateOnboardingStateDTO {
  /** `dismissed` or `started` for a first answer; `completed` or `abandoned` once started. */
  @Expose()
  @Type(() => String)
  @IsIn(ONBOARDING_API_OUTCOMES, withError(ONBOARDING_ERRORS.VALIDATION.OUTCOME))
  outcome!: OnboardingApiOutcome;

  /** `MaxLength(128)` matches `user_onboarding.tour_version VARCHAR(128)`. */
  @Expose()
  @Type(() => String)
  @IsString(withError(ONBOARDING_ERRORS.VALIDATION.TOUR_VERSION))
  @MaxLength(128, withError(ONBOARDING_ERRORS.VALIDATION.TOUR_VERSION))
  @IsOptional()
  tour_version?: string;
}
