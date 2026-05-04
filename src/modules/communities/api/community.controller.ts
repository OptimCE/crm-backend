import TraceDecorator from "../../../shared/monitor/traceDecorator.js";
import config from "config";
import { inject, injectable } from "inversify";
import type { ICommunityService } from "../domain/i-community.service.js";
import type { ISharingOperationService } from "../../sharing_operations/domain/i-sharing_operation.service.js";
import type { NextFunction, Request, Response } from "express";
import { validateDto } from "../../../shared/utils/dto.validator.js";
import logger from "../../../shared/monitor/logger.js";
import { ApiResponse, ApiResponsePaginated } from "../../../shared/dtos/ApiResponses.js";
import { GLOBAL_ERRORS, SUCCESS } from "../../../shared/errors/errors.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import {
  CommunityDetailDTO,
  CommunityDTO,
  CommunityQueryDTO,
  CommunityUsersQueryDTO,
  CreateCommunityDTO,
  MyCommunityDTO,
  PatchRoleUserDTO,
  UpdateCommunityDTO,
  UsersCommunityDTO,
} from "./community.dtos.js";
import { SharingOperationPartialDTO, SharingOperationPartialQuery } from "../../sharing_operations/api/sharing_operation.dtos.js";
import { cacheKey, cachePattern } from "../../../shared/cache/decorator/cache-key.builder.js";
import { InvalidateCache, Cache } from "../../../shared/cache/decorator/cache.decorators.js";

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
  constructor(
    @inject("CommunityService") private readonly communityService: ICommunityService,
    @inject("SharingOperationService") private readonly sharingOperationService: ISharingOperationService,
  ) {}

  @communityControllerTraceDecorator.traceSpan("getAllPublicCommunities", { url: "/communities", method: "get" })
  // @Cache(cacheKey("communities:all-list", "none", () => ""), 60)
  async getAllPublicCommunities(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject = await validateDto(CommunityQueryDTO, req.query);
    const [result, pagination] = await this.communityService.getAllPublicCommunities(queryObject);
    logger.info("All communities list successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<CommunityDTO[]>(result, pagination, SUCCESS));
  }

  @communityControllerTraceDecorator.traceSpan("getCommunityById", { url: "/communities/:id", method: "get" })
  // @Cache(cacheKey("communities:detail", "none", (req) => req.params.id), 60)
  async getCommunityById(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const result = await this.communityService.getCommunityById(+req.params.id);
    logger.info("Community detail successfully retrieved");
    res.status(200).json(new ApiResponse<CommunityDetailDTO>(result, SUCCESS));
  }

  @communityControllerTraceDecorator.traceSpan("getCommunitySharingOperations", { url: "/communities/:id/sharing_operations", method: "get" })
  @Cache(cacheKey("communities:sharing-operations", "community", (req) => JSON.stringify(req.query)), 60)
  async getCommunitySharingOperations(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject = await validateDto(SharingOperationPartialQuery, req.query);
    const [result, pagination] = await this.sharingOperationService.getSharingOperationList(queryObject);
    logger.info("Community sharing operations list successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<SharingOperationPartialDTO[]>(result, pagination, SUCCESS));
  }

  /**
   * Public list of a community's sharing operations.
   * Returns only operations flagged `is_public = true`. Visible to any
   * authenticated user — no GESTIONNAIRE check.
   */
  @communityControllerTraceDecorator.traceSpan("getCommunityPublicSharingOperations", {
    url: "/communities/:id/sharing_operations/public",
    method: "get",
  })
  @Cache(cacheKey("communities:public-sharing-operations", "none", (req) => `${req.params.id}:${JSON.stringify(req.query)}`), 60)
  async getCommunityPublicSharingOperations(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject = await validateDto(SharingOperationPartialQuery, req.query);
    const [result, pagination] = await this.sharingOperationService.getPublicCommunitySharingOperations(+req.params.id, queryObject);
    logger.info("Community public sharing operations list successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<SharingOperationPartialDTO[]>(result, pagination, SUCCESS));
  }

  /**
   * Retrieves the communities where the current user is a member.
   * @param req - Express request object. Query parameters are validated against CommunityQueryDTO.
   * http://localhost:3000/communities/my-communities?page=1&limit=10&name=foo&sort_name=ASC
   * @param res - Express response object. Returns a paginated list of MyCommunityDTO.
   * @param _next - Express next middleware function.
   */
  @communityControllerTraceDecorator.traceSpan("getMyCommunities", { url: "/communities/my-communities", method: "get" })
  @Cache(cacheKey("communities:user-list", "user", (req) => JSON.stringify(req.query)), 60)
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
  @Cache(cacheKey("communities:users", "community", (req) => JSON.stringify(req.query)), 60)
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
  @Cache(cacheKey("communities:admins", "community", (req) => JSON.stringify(req.query)), 60)
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
  @InvalidateCache([cachePattern("communities:user-list", "user"), cachePattern("communities:all-list", "none")])
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
  @InvalidateCache([
    cachePattern("communities:users", "community"),
    cachePattern("communities:admins", "community"),
    cachePattern("communities:user-list", "user"),
    cachePattern("communities:all-list", "none"),
    cachePattern("communities:detail", "none"),
    cachePattern("communities:sharing-operations", "community"),
  ])
  async updateCommunity(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const updated_community = await validateDto(UpdateCommunityDTO, req.body);
    await this.communityService.updateCommunity(updated_community);
    logger.info("Community successfully updated");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Uploads a new logo for the active community.
   * Stores the file in MinIO/S3 and updates `logo_url` on the community row.
   * @param req - Express request. File arrives as multipart/form-data on `req.file`.
   * @param res - Express response. Returns the new presigned URL.
   * @param _next - Express next middleware function.
   */
  @communityControllerTraceDecorator.traceSpan("uploadLogo", { url: "/communities/logo", method: "post" })
  @InvalidateCache([
    cachePattern("communities:user-list", "user"),
    cachePattern("communities:all-list", "none"),
    cachePattern("communities:detail", "none"),
  ])
  async uploadLogo(req: Request, res: Response, _next: NextFunction): Promise<void> {
    if (!req.file) {
      throw new AppError(GLOBAL_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.FILE, 422);
    }
    const result = await this.communityService.uploadLogo(req.file);
    logger.info("Community logo successfully uploaded");
    res.status(200).json(new ApiResponse<{ logo_url: string; logo_presigned_url: string }>(result, SUCCESS));
  }

  /**
   * Deletes the active community's logo from storage and clears `logo_url`.
   */
  @communityControllerTraceDecorator.traceSpan("deleteLogo", { url: "/communities/logo", method: "delete" })
  @InvalidateCache([
    cachePattern("communities:user-list", "user"),
    cachePattern("communities:all-list", "none"),
    cachePattern("communities:detail", "none"),
  ])
  async deleteLogo(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.communityService.deleteLogo();
    logger.info("Community logo successfully deleted");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Updates the role of a user in a community.
   * @param req - Express request object. Body is validated against PatchRoleUserDTO.
   * @param res - Express response object. Returns a success message.
   * @param _next - Express next middleware function.
   */
  @communityControllerTraceDecorator.traceSpan("patchRoleUser", { url: "/communities/", method: "patch" })
  @InvalidateCache([cachePattern("communities:users", "community"), cachePattern("communities:admins", "community")])
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
  @InvalidateCache([
    cachePattern("communities:user-list", "user"),
    cachePattern("communities:users", "community"),
    cachePattern("communities:admins", "community"),
    cachePattern("communities:detail", "none"),
  ])
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
  @InvalidateCache([cachePattern("communities", "none")])
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
  @InvalidateCache([cachePattern("communities", "none")])
  async deleteCommunity(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.communityService.deleteCommunity(+req.params.id_community);
    logger.info("Community successfully deleted");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }
}
