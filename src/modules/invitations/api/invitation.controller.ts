import { inject, injectable } from "inversify";
import TraceDecorator from "../../../shared/monitor/traceDecorator.js";
import config from "config";
import type { IInvitationService } from "../domain/i-invitation.service.js";
import type { NextFunction, Request, Response } from "express";
import { validateDto } from "../../../shared/utils/dto.validator.js";
import { ApiResponse, ApiResponsePaginated, Pagination } from "../../../shared/dtos/ApiResponses.js";
import logger from "../../../shared/monitor/logger.js";
import { SUCCESS } from "../../../shared/errors/errors.js";
import {
  InviteUser,
  UserManagerInvitationDTO,
  UserManagerInvitationQuery,
  UserMemberInvitationDTO,
  UserMemberInvitationQuery,
} from "./invitation.dtos.js";
import { Cache, InvalidateCache } from "../../../shared/cache/decorator/cache.decorators.js";
import { cacheKey, cachePattern } from "../../../shared/cache/decorator/cache-key.builder.js";
const invitationControllerTraceDecorator = new TraceDecorator(config.get("microservice_name"));

/**
 * Controller responsible for managing invitations.
 * Handles inviting users to be members or managers, and accepting/rejecting invitations.
 */
@injectable()
export class InvitationController {
  constructor(@inject("InvitationService") private invitationService: IInvitationService) {}

  /**
   * Retrieves pending invitations for members.
   * @param req - Express request object. Query: UserMemberInvitationQuery.
   * @param res - Express response object. Returns list of UserMemberInvitationDTO.
   * @param _next - Express next middleware.
   */
  @invitationControllerTraceDecorator.traceSpan("getMembersPendingInvitation", { url: "/invitations/", method: "get" })
  @Cache(cacheKey("invitations:member-list", "community", (req) => JSON.stringify(req.query)), 60)
  async getMembersPendingInvitation(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject: UserMemberInvitationQuery = await validateDto(UserMemberInvitationQuery, req.query);
    const [result, pagination]: [UserMemberInvitationDTO[], Pagination] = await this.invitationService.getMembersPendingInvitation(queryObject);
    logger.info("Members pending invitations successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<UserMemberInvitationDTO[]>(result, pagination, SUCCESS));
  }

  /**
   * Retrieves pending invitations for managers.
   * @param req - Express request object. Query: UserManagerInvitationQuery.
   * @param res - Express response object. Returns list of UserManagerInvitationDTO.
   * @param _next - Express next middleware.
   */
  @invitationControllerTraceDecorator.traceSpan("getManagersPendingInvitation", { url: "/invitations/managers", method: "get" })
  @Cache(cacheKey("invitations:manager-list", "community", (req) => JSON.stringify(req.query)), 60)
  async getManagersPendingInvitation(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject: UserManagerInvitationQuery = await validateDto(UserManagerInvitationQuery, req.query);
    const [result, pagination]: [UserManagerInvitationDTO[], Pagination] = await this.invitationService.getManagersPendingInvitation(queryObject);
    logger.info("Managers pending invitations successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<UserManagerInvitationDTO[]>(result, pagination, SUCCESS));
  }

  /**
   * Invites a user to become a member of the community.
   * @param req - Express request object. Body: InviteUser.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @invitationControllerTraceDecorator.traceSpan("inviteUserToBecomeMember", { url: "/invitations/member", method: "post" })
  @InvalidateCache([cachePattern("invitations:member-list", "community"), cachePattern("me-invitations:member", "none")])
  async inviteUserToBecomeMember(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const invitation: InviteUser = await validateDto(InviteUser, req.body);
    await this.invitationService.inviteUserToBecomeMember(invitation);
    logger.info("User invited successfully to become a member");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Invites a user to become a manager of the community.
   * @param req - Express request object. Body: InviteUser.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @invitationControllerTraceDecorator.traceSpan("inviteUserToBecomeManager", { url: "/invitations/manager", method: "post" })
  @InvalidateCache([cachePattern("invitations:manager-list", "community"), cachePattern("me-invitations:manager", "none")])
  async inviteUserToBecomeManager(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const invitation: InviteUser = await validateDto(InviteUser, req.body);
    await this.invitationService.inviteUserToBecomeManager(invitation);
    logger.info("User invited successfully to become a manager");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Cancels a member invitation (by community admin/manager).
   * @param req - Express request object. Params: id_invitation.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @invitationControllerTraceDecorator.traceSpan("cancelMemberInvitation", { url: "/invitations/:id_invitation/member", method: "delete" })
  @InvalidateCache([
    cachePattern("me-invitations:member-list", "none"),
    cachePattern("me-invitations:member", "none"),
    cachePattern("invitations:member-list", "none"),
  ])
  async cancelMemberInvitation(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.invitationService.cancelMemberInvitation(+req.params.id_invitation);
    logger.info("Invitation successfully cancelled");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Cancels a manager invitation (by community admin).
   * @param req - Express request object. Params: id_invitation.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @invitationControllerTraceDecorator.traceSpan("cancelMemberInvitation", { url: "/invitations/:id_invitation/manager", method: "delete" })
  @InvalidateCache([
    cachePattern("me-invitations:manager-list", "none"),
    cachePattern("me-invitations:manager", "none"),
    cachePattern("invitations:manager-list", "none"),
  ])
  async cancelManagerInvitation(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.invitationService.cancelManagerInvitation(+req.params.id_invitation);
    logger.info("Invitation successfully cancelled");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }
}
