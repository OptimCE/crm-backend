import TraceDecorator from "../../../shared/monitor/traceDecorator.js";
import config from "config";
import { inject, injectable } from "inversify";
import type { IUserService } from "../domain/i-user.service.js";
import type { NextFunction, Request, Response } from "express";
import logger from "../../../shared/monitor/logger.js";
import { ApiResponse } from "../../../shared/dtos/ApiResponses.js";
import { SUCCESS } from "../../../shared/errors/errors.js";
import { UpdateUserDTO, UserDTO } from "./user.dtos.js";
import { validateDto } from "../../../shared/utils/dto.validator.js";

const userControllerTraceDecorator = new TraceDecorator(config.get("microservice_name"));
@injectable()
export class UserController {
  /**
   * Creates a new KeyController instance
   * @param userService - Service for user operations
   */
  constructor(@inject("UserService") private readonly userService: IUserService) {}

  /**
   * Retrieves the profile of the currently authenticated user.
   * @param req - Express request object.
   * @param res - Express response object. Returns UserDTO.
   * @param _next - Express next middleware.
   */
  @userControllerTraceDecorator.traceSpan("getProfile", { url: "/users/", method: "get" })
  async getProfile(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const result = await this.userService.getProfile();
    logger.info("Profile successfully fetched");
    res.status(200).json(new ApiResponse<UserDTO>(result, SUCCESS));
  }

  /**
   * Updates the profile of the currently authenticated user.
   * @param req - Express request object. Body: UpdateUserDTO.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @userControllerTraceDecorator.traceSpan("updateProfile", { url: "/users/", method: "put" })
  async updateProfile(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const updated_user = await validateDto(UpdateUserDTO, req.body);
    await this.userService.updateProfile(updated_user);
    logger.info("Profile successfully updated");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }
}
