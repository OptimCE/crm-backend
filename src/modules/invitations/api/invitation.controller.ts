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
  AcceptInvitationDTO,
  AcceptInvitationWEncodedDTO,
  InviteUser,
  UserManagerInvitationDTO,
  UserManagerInvitationQuery,
  UserMemberInvitationDTO,
  UserMemberInvitationQuery,
} from "./invitation.dtos.js";
import { CompanyDTO, IndividualDTO } from "../../members/api/member.dtos.js";
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
  async getManagersPendingInvitation(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject: UserManagerInvitationQuery = await validateDto(UserManagerInvitationQuery, req.query);
    const [result, pagination]: [UserManagerInvitationDTO[], Pagination] = await this.invitationService.getManagersPendingInvitation(queryObject);
    logger.info("Managers pending invitations successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<UserManagerInvitationDTO[]>(result, pagination, SUCCESS));
  }

  /**
   * Retrieves the current user's own pending member invitations.
   * @param req - Express request object. Query: UserMemberInvitationQuery.
   * @param res - Express response object. Returns list of UserMemberInvitationDTO.
   * @param _next - Express next middleware.
   */
  @invitationControllerTraceDecorator.traceSpan("getOwnMemberPendingInvitation", { url: "/invitations/own", method: "get" })
  async getOwnMemberPendingInvitation(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject: UserMemberInvitationQuery = await validateDto(UserMemberInvitationQuery, req.query);
    const [result, pagination]: [UserMemberInvitationDTO[], Pagination] = await this.invitationService.getOwnMemberPendingInvitation(queryObject);
    logger.info("Members pending invitations successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<UserMemberInvitationDTO[]>(result, pagination, SUCCESS));
  }

  /**
   * Retrieves the current user's own pending member invitations.
   * @param req - Express request object. Query: UserMemberInvitationQuery.
   * @param res - Express response object. Returns list of UserMemberInvitationDTO.
   * @param _next - Express next middleware.
   */
  @invitationControllerTraceDecorator.traceSpan("getOwnMemberPendingInvitation", { url: "/invitations/own/member/:id", method: "get" })
  async getOwnMemberPendingInvitationById(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const result = await this.invitationService.getOwnMemberPendingInvitationById(+req.params.id);
    logger.info("Members pending invitations successfully retrieved");
    res.status(200).json(new ApiResponse<IndividualDTO | CompanyDTO>(result, SUCCESS));
  }

  /**
   * Retrieves the current user's own pending manager invitations.
   * @param req - Express request object. Query: UserManagerInvitationQuery.
   * @param res - Express response object. Returns list of UserManagerInvitationDTO.
   * @param _next - Express next middleware.
   */
  @invitationControllerTraceDecorator.traceSpan("getOwnManagerPendingInvitation", { url: "/invitations/own/managers", method: "get" })
  async getOwnManagerPendingInvitation(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject: UserManagerInvitationQuery = await validateDto(UserManagerInvitationQuery, req.query);
    const [result, pagination]: [UserManagerInvitationDTO[], Pagination] = await this.invitationService.getOwnManagerPendingInvitation(queryObject);
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
  async inviteUserToBecomeManager(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const invitation: InviteUser = await validateDto(InviteUser, req.body);
    await this.invitationService.inviteUserToBecomeManager(invitation);
    logger.info("User invited successfully to become a manager");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Accepts a member invitation.
   * @param req - Express request object. Body: AcceptInvitationDTO.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @invitationControllerTraceDecorator.traceSpan("acceptInvitationMember", { url: "/invitations/accept", method: "post" })
  async acceptInvitationMember(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const accept_invitation: AcceptInvitationDTO = await validateDto(AcceptInvitationDTO, req.body);
    await this.invitationService.acceptInvitationMember(accept_invitation);
    logger.info("Invitation successfully accepted");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Accepts a member invitation and encodes member details.
   * @param req - Express request object. Body: AcceptInvitationWEncodedDTO.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @invitationControllerTraceDecorator.traceSpan("acceptInvitationMemberWEncoded", { url: "/invitations/accept/encoded", method: "post" })
  async acceptInvitationMemberWEncoded(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const accept_invitation: AcceptInvitationWEncodedDTO = await validateDto(AcceptInvitationWEncodedDTO, req.body);
    await this.invitationService.acceptInvitationMemberWEncoded(accept_invitation);
    logger.info("Invitation successfully accepted with encoded");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Accepts a manager invitation.
   * @param req - Express request object. Body: AcceptInvitationDTO.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @invitationControllerTraceDecorator.traceSpan("acceptInvitationManager", { url: "/invitations/accept/manager", method: "post" })
  async acceptInvitationManager(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const accept_invitation: AcceptInvitationDTO = await validateDto(AcceptInvitationDTO, req.body);
    await this.invitationService.acceptInvitationManager(accept_invitation);
    logger.info("Invitation successfully accepted");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Cancels a member invitation (by community admin/manager).
   * @param req - Express request object. Params: id_invitation.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @invitationControllerTraceDecorator.traceSpan("cancelMemberInvitation", { url: "/invitations/:id_invitation/member", method: "delete" })
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
  async cancelManagerInvitation(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.invitationService.cancelManagerInvitation(+req.params.id_invitation);
    logger.info("Invitation successfully cancelled");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Refuses a member invitation (by the user invited).
   * @param req - Express request object. Params: id_invitation.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @invitationControllerTraceDecorator.traceSpan("cancelMemberInvitation", { url: "/invitations/:id_invitation/own/member", method: "delete" })
  async refuseMemberInvitation(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.invitationService.refuseMemberInvitation(+req.params.id_invitation);
    logger.info("Invitation successfully refused");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Refuses a manager invitation (by the user invited).
   * @param req - Express request object. Params: id_invitation.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @invitationControllerTraceDecorator.traceSpan("cancelMemberInvitation", { url: "/invitations/:id_invitation/own/manager", method: "delete" })
  async refuseManagerInvitation(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.invitationService.refuseManagerInvitation(+req.params.id_invitation);
    logger.info("Invitation successfully refused");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }
}
