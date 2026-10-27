import { inject, injectable } from "inversify";
import type { QueryRunner } from "typeorm";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import { Transactional } from "../../../shared/transactional/transaction.uow.js";
import type { IAuthContextRepository } from "../../../shared/context/i-authcontext.repository.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import logger from "../../../shared/monitor/logger.js";
import { isAppErrorLike } from "../../../shared/errors/isAppError.js";
import type { IOnboardingService } from "../domain/i-onboarding.service.js";
import type { IOnboardingRepository } from "../domain/i-onboarding.repository.js";
import type { UserOnboarding } from "../domain/onboarding.models.js";
import type { OnboardingStateDTO, UpdateOnboardingStateDTO } from "../api/onboarding.dtos.js";
import { ONBOARDING_ERRORS } from "../shared/onboarding.errors.js";
import { isOnboardingTourKey, onboardingTransition } from "../shared/onboarding.tours.js";
import { toOnboardingStateDTO } from "../shared/to_dto.js";

@injectable()
export class OnboardingService implements IOnboardingService {
  constructor(
    @inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
    @inject("AuthContext") private readonly authContext: IAuthContextRepository,
    @inject("OnboardingRepository") private readonly onboardingRepository: IOnboardingRepository,
  ) {}

  async getStates(): Promise<OnboardingStateDTO[]> {
    const rows = await this.onboardingRepository.list();
    return rows.map(toOnboardingStateDTO);
  }

  /**
   * Records an answer for the authenticated user.
   * @param tour_key - Must be one of ONBOARDING_TOUR_KEYS.
   * @param update - The outcome, and the tour's content hash when known.
   * @param query_runner - Optional query runner.
   * @returns The state after the write.
   * @throws AppError 422 on an unknown tour, 409 on a forbidden transition.
   */
  @Transactional()
  async setState(tour_key: string, update: UpdateOnboardingStateDTO, query_runner?: QueryRunner): Promise<OnboardingStateDTO> {
    if (!isOnboardingTourKey(tour_key)) {
      throw new AppError(ONBOARDING_ERRORS.VALIDATION.TOUR_KEY, 422);
    }
    const id_user = await this.authContext.getInternalUserId(query_runner);
    try {
      let current = await this.onboardingRepository.findForUpdate(id_user, tour_key, query_runner);
      let decision = onboardingTransition(current?.outcome ?? null, update.outcome);

      if (decision === "insert") {
        const inserted = await this.onboardingRepository.insertIfAbsent(id_user, tour_key, update.outcome, update.tour_version ?? null, query_runner);
        current = await this.onboardingRepository.findForUpdate(id_user, tour_key, query_runner);
        // A concurrent request created the row first: judge this one against it.
        decision = inserted ? "noop" : onboardingTransition(current?.outcome ?? null, update.outcome);
      }
      if (decision === "forbidden") {
        logger.warn({ operation: "onboarding:set_state", tour_key, from: current?.outcome, to: update.outcome }, "Onboarding transition refused");
        throw new AppError(ONBOARDING_ERRORS.TRANSITION_FORBIDDEN, 409);
      }
      if (decision === "update") {
        const row = current as UserOnboarding;
        row.outcome = update.outcome;
        if (update.tour_version !== undefined) row.tour_version = update.tour_version;
        current = await this.onboardingRepository.update(row, query_runner);
      }
      return toOnboardingStateDTO(current as UserOnboarding);
    } catch (err) {
      if (isAppErrorLike(err)) throw err;
      logger.error({ operation: "onboarding:set_state", tour_key, error: err }, "Error while recording an onboarding state");
      throw new AppError(ONBOARDING_ERRORS.DATABASE, 500);
    }
  }
}
