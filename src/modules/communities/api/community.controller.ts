import TraceDecorator from "../../../shared/monitor/traceDecorator.js";
import config from "config";
import { inject, injectable } from "inversify";
import type { ICommunityService } from "../domain/i-community.service.js";
import type { NextFunction, Request, Response } from "express";
import { validateDto } from "../../../shared/utils/dto.validator.js";
import logger from "../../../shared/monitor/logger.js";
import { ApiResponse, ApiResponsePaginated } from "../../../shared/dtos/ApiResponses.js";
import { SUCCESS } from "../../../shared/errors/errors.js";
import {
  CreateCommunityDTO,
  CommunityQueryDTO,
  CommunityUsersQueryDTO,
  MyCommunityDTO,
  PatchRoleUserDTO,
  UsersCommunityDTO,
} from "./community.dtos.js";

const communityControllerTraceDecorator = new TraceDecorator(config.get("microservice_name"));

/**
 * Controller responsible for handling community-related HTTP requests
 * Provides endpoints for managing keys and key simulations
 */
@injectable()
export class CommunityController {
  /**
   * Creates a new CommunityController instance
   * @param communityService - Service for community operations
   */
  constructor(@inject("CommunityService") private readonly communityService: ICommunityService) {}

  /**
   * Retrieves the communities where the current user is a member.
   * @param req - Express request object. Query parameters are validated against CommunityQueryDTO.
   * http://localhost:3000/communities/my-communities?page=1&limit=10&name=foo&sort_name=ASC
   * @param res - Express response object. Returns a paginated list of MyCommunityDTO.
   * @param _next - Express next middleware function.
   */
  @communityControllerTraceDecorator.traceSpan("getMyCommunities", { url: "/communities/my-communities", method: "get" })
  async getMyCommunities(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject = await validateDto(CommunityQueryDTO, req.query);
    const [result, pagination] = await this.communityService.getMyCommunities(queryObject);
    logger.info("Communities list successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<MyCommunityDTO[]>(result, pagination, SUCCESS));
  }

  /**
   * Retrieves users of a community.
   * @param req - Express request object. Query parameters are validated against CommunityUsersQueryDTO.
   * @param res - Express response object. Returns a paginated list of UsersCommunityDTO.
   * @param _next - Express next middleware function.
   */
  @communityControllerTraceDecorator.traceSpan("getUsers", { url: "/communities/users", method: "get" })
  async getUsers(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject = await validateDto(CommunityUsersQueryDTO, req.query);
    const [result, pagination] = await this.communityService.getUsers(queryObject);
    logger.info("Users community list successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<UsersCommunityDTO[]>(result, pagination, SUCCESS));
  }

  /**
   * Retrieves admins and managers of a community.
   * @param req - Express request object. Query parameters are validated against CommunityUsersQueryDTO.
   * @param res - Express response object. Returns a paginated list of UsersCommunityDTO.
   * @param _next - Express next middleware function.
   */
  @communityControllerTraceDecorator.traceSpan("getAdmins", { url: "/communities/admins", method: "get" })
  async getAdmins(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject = await validateDto(CommunityUsersQueryDTO, req.query);
    const [result, pagination] = await this.communityService.getAdmins(queryObject);
    logger.info("Admin & manager list successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<UsersCommunityDTO[]>(result, pagination, SUCCESS));
  }

  /**
   * Creates a new community.
   * @param req - Express request object. Body is validated against CreateCommunityDTO.
   * @param res - Express response object. Returns a success message.
   * @param _next - Express next middleware function.
   */
  @communityControllerTraceDecorator.traceSpan("createCommunity", { url: "/communities/", method: "post" })
  async createCommunity(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const new_community = await validateDto(CreateCommunityDTO, req.body);
    await this.communityService.addCommunity(new_community);
    logger.info("Community successfully created");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }
  /**
   * Updates an existing community.
   * @param req - Express request object. Body is validated against CreateCommunityDTO.
   * @param res - Express response object. Returns a success message.
   * @param _next - Express next middleware function.
   */
  @communityControllerTraceDecorator.traceSpan("updateCommunity", { url: "/communities/", method: "put" })
  async updateCommunity(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const updated_community = await validateDto(CreateCommunityDTO, req.body);
    await this.communityService.updateCommunity(updated_community);
    logger.info("Community successfully created");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Updates the role of a user in a community.
   * @param req - Express request object. Body is validated against PatchRoleUserDTO.
   * @param res - Express response object. Returns a success message.
   * @param _next - Express next middleware function.
   */
  @communityControllerTraceDecorator.traceSpan("patchRoleUser", { url: "/communities/", method: "patch" })
  async patchRoleUser(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const patched_role = await validateDto(PatchRoleUserDTO, req.body);
    await this.communityService.patchRoleUser(patched_role);
    logger.info("User role patched successfully patched");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Leaves a community.
   * @param req - Express request object. Requires 'id_community' in params.
   * @param res - Express response object. Returns a success message.
   * @param _next - Express next middleware function.
   */
  @communityControllerTraceDecorator.traceSpan("leave", { url: "/communities/leave/:id_community", method: "delete" })
  async leave(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.communityService.leave(+req.params.id_community);
    logger.info("Community successfully leaved");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Kicks a user from a community.
   * @param req - Express request object. Requires 'id_user' in params.
   * @param res - Express response object. Returns a success message.
   * @param _next - Express next middleware function.
   */
  @communityControllerTraceDecorator.traceSpan("kickUser", { url: "/communities/kick/:id_user", method: "delete" })
  async kickUser(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.communityService.kickUser(+req.params.id_user);
    logger.info("User successfully kicked out of the community");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }
  /**
   * Deletes a community.
   * @param req - Express request object. Requires 'id_community' in params.
   * @param res - Express response object. Returns a success message.
   * @param _next - Express next middleware function.
   */
  @communityControllerTraceDecorator.traceSpan("deleteCommunity", { url: "/communities/delete/:id_community", method: "delete" })
  async deleteCommunity(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.communityService.deleteCommunity(+req.params.id_community);
    logger.info("Community successfully deleted");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }
}
