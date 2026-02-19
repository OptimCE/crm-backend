import { inject, injectable } from "inversify";
import type { IMemberService } from "../domain/i-member.service.js";
import TraceDecorator from "../../../shared/monitor/traceDecorator.js";
import config from "config";
import type { Request, Response, NextFunction } from "express";
import { validateDto } from "../../../shared/utils/dto.validator.js";
import logger from "../../../shared/monitor/logger.js";
import { ApiResponse, ApiResponsePaginated, Pagination } from "../../../shared/dtos/ApiResponses.js";
import { SUCCESS } from "../../../shared/errors/errors.js";
import {
  CompanyDTO,
  CreateMemberDTO,
  IndividualDTO,
  MemberLinkDTO,
  MemberLinkQueryDTO,
  MemberPartialQuery,
  MembersPartialDTO,
  PatchMemberInviteUserDTO,
  PatchMemberStatusDTO,
  UpdateMemberDTO,
} from "./member.dtos.js";
const memberControllerTraceDecorator = new TraceDecorator(config.get("microservice_name"));

@injectable()
export class MemberController {
  constructor(@inject("MemberService") private member_service: IMemberService) {}

  /**
   * Retrieves a paginated list of members (partial view).
   * @param req - Express request object. Query: MemberPartialQuery.
   * @param res - Express response object. Returns list of MembersPartialDTO.
   * @param _next - Express next middleware.
   */
  @memberControllerTraceDecorator.traceSpan("getMembersList", { url: "/members/", method: "get" })
  async getMembersList(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject: MemberPartialQuery = await validateDto(MemberPartialQuery, req.query);
    const [result, pagination]: [MembersPartialDTO[], Pagination] = await this.member_service.getMembersList(queryObject);
    logger.info("Members list successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<MembersPartialDTO[]>(result, pagination, SUCCESS));
  }

  /**
   * Retrieves details of a specific member (Individual or Company).
   * @param req - Express request object. Params: id_member.
   * @param res - Express response object. Returns IndividualDTO or CompanyDTO.
   * @param _next - Express next middleware.
   */
  @memberControllerTraceDecorator.traceSpan("getMember", { url: "/members/:id_member", method: "get" })
  async getMember(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const result: IndividualDTO | CompanyDTO = await this.member_service.getMember(+req.params.id_member);
    logger.info("Member successfully retrieved");
    res.status(200).json(new ApiResponse<IndividualDTO | CompanyDTO>(result, SUCCESS));
  }

  /**
   * Retrieves the link status of a member to a user account.
   * @param req - Express request object. Params: id_member.
   * @param res - Express response object. Returns MemberLinkDTO.
   * @param _next - Express next middleware.
   */
  @memberControllerTraceDecorator.traceSpan("getMemberLink", { url: "/members/:id_member/link", method: "get" })
  async getMemberLink(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const query = await validateDto(MemberLinkQueryDTO, req.query);
    const result: MemberLinkDTO = await this.member_service.getMemberLink(+req.params.id_member, query);
    logger.info("Member link status successfully retrieved");
    res.status(200).json(new ApiResponse<MemberLinkDTO>(result, SUCCESS));
  }

  /**
   * Creates a new member.
   * @param req - Express request object. Body: CreateMemberDTO.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @memberControllerTraceDecorator.traceSpan("addMember", { url: "/members/", method: "post" })
  async addMember(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const new_member: CreateMemberDTO = await validateDto(CreateMemberDTO, req.body);
    await this.member_service.addMember(new_member);
    logger.info("Member successfully created");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Updates an existing member.
   * @param req - Express request object. Body: UpdateMemberDTO.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @memberControllerTraceDecorator.traceSpan("addMember", { url: "/members/", method: "put" })
  async updateMember(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const updated_member: UpdateMemberDTO = await validateDto(UpdateMemberDTO, req.body);
    await this.member_service.updateMember(updated_member);
    logger.info("Member successfully updated");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Updates the status of a member (e.g., ACTIVE, INACTIVE).
   * @param req - Express request object. Body: PatchMemberStatusDTO.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @memberControllerTraceDecorator.traceSpan("patchMemberStatus", { url: "/members/status", method: "patch" })
  async patchMemberStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const patched_member_status: PatchMemberStatusDTO = await validateDto(PatchMemberStatusDTO, req.body);
    await this.member_service.patchMemberStatus(patched_member_status);
    logger.info("Member status successfully patched");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Invites a user to link to a member account.
   * @param req - Express request object. Body: PatchMemberInviteUserDTO.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @memberControllerTraceDecorator.traceSpan("patchMemberLink", { url: "/members/invite", method: "patch" })
  async patchMemberLink(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const patched_member_invite_user: PatchMemberInviteUserDTO = await validateDto(PatchMemberInviteUserDTO, req.body);
    await this.member_service.patchMemberLink(patched_member_invite_user);
    logger.info("Member invite user successfully done");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Deletes a member.
   * @param req - Express request object. Params: id_member.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @memberControllerTraceDecorator.traceSpan("deleteMember", { url: "/members/:id_member", method: "delete" })
  async deleteMember(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.member_service.deleteMember(+req.params.id_member);
    logger.info("Member successfully deleted");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  /**
   * Deletes the link between a member and a user account.
   * @param req - Express request object. Params: id_member.
   * @param res - Express response object. Returns success message.
   * @param _next - Express next middleware.
   */
  @memberControllerTraceDecorator.traceSpan("deleteMemberLink", { url: "/members/:id_member/link", method: "delete" })
  async deleteMemberLink(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.member_service.deleteMemberLink(+req.params.id_member);
    logger.info("Member link successfully deleted");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }
}
