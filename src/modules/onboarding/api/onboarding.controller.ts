import TraceDecorator from "../../../shared/monitor/traceDecorator.js";
import config from "config";
import { inject, injectable } from "inversify";
import type { NextFunction, Request, Response } from "express";
import logger from "../../../shared/monitor/logger.js";
import { ApiResponse } from "../../../shared/dtos/ApiResponses.js";
import { SUCCESS } from "../../../shared/errors/errors.js";
import { validateDto } from "../../../shared/utils/dto.validator.js";
import type { IOnboardingService } from "../domain/i-onboarding.service.js";
import { type OnboardingStateDTO, UpdateOnboardingStateDTO } from "./onboarding.dtos.js";

const onboardingTraceDecorator = new TraceDecorator(config.get("microservice_name"));

@injectable()
export class OnboardingController {
  constructor(@inject("OnboardingService") private readonly onboardingService: IOnboardingService) {}

  /**
   * Lists the current user's onboarding states.
   * @param req - Express request object.
   * @param res - Express response object. Returns OnboardingStateDTO[].
   * @param _next - Express next middleware.
   */
  @onboardingTraceDecorator.traceSpan("getOnboardingStates", { url: "/me/onboarding", method: "get" })
  async getStates(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const states = await this.onboardingService.getStates();
    logger.info({ operation: "onboarding:get_states", count: states.length }, "Onboarding states fetched");
    res.status(200).json(new ApiResponse<OnboardingStateDTO[]>(states, SUCCESS));
  }

  /**
   * Records the current user's answer to one onboarding tour offer.
   * @param req - Express request object. Params: tour_key. Body: UpdateOnboardingStateDTO.
   * @param res - Express response object. Returns the resulting OnboardingStateDTO.
   * @param _next - Express next middleware.
   */
  @onboardingTraceDecorator.traceSpan("setOnboardingState", { url: "/me/onboarding/:tour_key", method: "put" })
  async setState(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const update = await validateDto(UpdateOnboardingStateDTO, req.body);
    const state = await this.onboardingService.setState(String(req.params.tour_key), update);
    logger.info({ operation: "onboarding:set_state", tour_key: state.tour_key, outcome: state.outcome }, "Onboarding state recorded");
    res.status(200).json(new ApiResponse<OnboardingStateDTO>(state, SUCCESS));
  }
}
