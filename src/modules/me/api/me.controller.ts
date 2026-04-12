import { inject, injectable } from "inversify";
import type { IMeService } from "../domain/i-me.service.js";
import TraceDecorator from "../../../shared/monitor/traceDecorator.js";
import config from "config";
import type { NextFunction, Request, Response } from "express";
import {
  MeCompanyDTO,
  MeDocumentDTO,
  MeDocumentPartialQuery,
  MeIndividualDTO,
  MeMemberPartialQuery,
  MeMembersPartialDTO,
  MeMeterDTO,
  MeMetersPartialQuery,
  MePartialMeterDTO,
} from "./me.dtos.js";
import { validateDto } from "../../../shared/utils/dto.validator.js";
import logger from "../../../shared/monitor/logger.js";
import { ApiResponse, ApiResponsePaginated } from "../../../shared/dtos/ApiResponses.js";
import { SUCCESS } from "../../../shared/errors/errors.js";
import { DownloadDocument } from "../../documents/api/document.dtos.js";
import { Cache, InvalidateCache } from "../../../shared/cache/decorator/cache.decorators.js";
import { cacheKey, cachePattern } from "../../../shared/cache/decorator/cache-key.builder.js";
import {
  AcceptInvitationDTO,
  AcceptInvitationWEncodedDTO,
  UserManagerInvitationDTO,
  UserManagerInvitationQuery,
  UserMemberInvitationDTO,
  UserMemberInvitationQuery,
} from "../../invitations/api/invitation.dtos.js";
import { CompanyDTO, IndividualDTO } from "../../members/api/member.dtos.js";
import { Pagination } from "../../../shared/dtos/ApiResponses.js";
const userControllerTraceDecorator = new TraceDecorator(config.get("microservice_name"));

@injectable()
export class MeController {
  constructor(@inject("MeService") private readonly meService: IMeService) {}

  @userControllerTraceDecorator.traceSpan("getDocuments", { url: "/me/documents", method: "get" })
  @Cache(cacheKey("me-documents:list", "user", (req) => JSON.stringify(req.query)), 60)
  async getDocuments(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject = await validateDto(MeDocumentPartialQuery, req.query);
    const [results, pagination] = await this.meService.getDocuments(queryObject);
    logger.info("Own documents list successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<MeDocumentDTO[]>(results, pagination, SUCCESS));
  }

  @userControllerTraceDecorator.traceSpan("downloadDocument", { url: "/me/documents/:id", method: "get" })
  async downloadDocument(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const result: DownloadDocument = await this.meService.downloadDocument(+req.params.id);
    logger.info("Document successfully retrieved");
    res.status(200).json(new ApiResponse<DownloadDocument>(result, SUCCESS));
  }

  @userControllerTraceDecorator.traceSpan("getMembers", { url: "/me/members", method: "get" })
  @Cache(cacheKey("me-members:list", "user", (req) => JSON.stringify(req.query)), 60)
  async getMembers(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject = await validateDto(MeMemberPartialQuery, req.query);
    const [results, pagination] = await this.meService.getMembers(queryObject);
    logger.info("Own members list successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<MeMembersPartialDTO[]>(results, pagination, SUCCESS));
  }

  @userControllerTraceDecorator.traceSpan("getMemberById", { url: "/me/members/:id", method: "get" })
  @Cache(cacheKey("me-members:id", "user", (req) => req.params.id), 60)
  async getMemberById(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const result: MeIndividualDTO | MeCompanyDTO = await this.meService.getMemberById(+req.params.id);
    logger.info("Own member successfully retrieved");
    res.status(200).json(new ApiResponse<MeIndividualDTO | MeCompanyDTO>(result, SUCCESS));
  }

  @userControllerTraceDecorator.traceSpan("getMeters", { url: "/me/meters", method: "get" })
  @Cache(cacheKey("me-meters:list", "user", (req) => JSON.stringify(req.query)), 60)
  async getMeters(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject = await validateDto(MeMetersPartialQuery, req.query);
    const [results, pagination] = await this.meService.getMeters(queryObject);
    logger.info("Own meters list successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<MePartialMeterDTO[]>(results, pagination, SUCCESS));
  }

  @userControllerTraceDecorator.traceSpan("getMeterById", { url: "/me/meters/:id", method: "get" })
  @Cache(cacheKey("me-meters:id", "user", (req) => req.params.id), 60)
  async getMeterById(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const result: MeMeterDTO = await this.meService.getMeterById(req.params.id);
    logger.info("Own meter successfully retrieved");
    res.status(200).json(new ApiResponse<MeMeterDTO>(result, SUCCESS));
  }

  @userControllerTraceDecorator.traceSpan("getOwnMemberPendingInvitation", { url: "/me/invitations", method: "get" })
  @Cache(cacheKey("me-invitations:member-list", "user", (req) => JSON.stringify(req.query)), 60)
  async getOwnMemberPendingInvitation(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject: UserMemberInvitationQuery = await validateDto(UserMemberInvitationQuery, req.query);
    const [result, pagination]: [UserMemberInvitationDTO[], Pagination] = await this.meService.getOwnMemberPendingInvitation(queryObject);
    logger.info("Members pending invitations successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<UserMemberInvitationDTO[]>(result, pagination, SUCCESS));
  }

  @userControllerTraceDecorator.traceSpan("getOwnMemberPendingInvitationById", { url: "/me/invitations/member/:id", method: "get" })
  @Cache(cacheKey("me-invitations:member", "user", (req) => req.params.id), 60)
  async getOwnMemberPendingInvitationById(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const result = await this.meService.getOwnMemberPendingInvitationById(+req.params.id);
    logger.info("Members pending invitations successfully retrieved");
    res.status(200).json(new ApiResponse<IndividualDTO | CompanyDTO>(result, SUCCESS));
  }

  @userControllerTraceDecorator.traceSpan("getOwnManagerPendingInvitation", { url: "/me/invitations/managers", method: "get" })
  @Cache(cacheKey("me-invitations:manager-list", "user", (req) => JSON.stringify(req.query)), 60)
  async getOwnManagerPendingInvitation(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const queryObject: UserManagerInvitationQuery = await validateDto(UserManagerInvitationQuery, req.query);
    const [result, pagination]: [UserManagerInvitationDTO[], Pagination] = await this.meService.getOwnManagerPendingInvitation(queryObject);
    logger.info("Managers pending invitations successfully retrieved");
    res.status(200).json(new ApiResponsePaginated<UserManagerInvitationDTO[]>(result, pagination, SUCCESS));
  }

  @userControllerTraceDecorator.traceSpan("acceptInvitationMember", { url: "/me/invitations/accept", method: "post" })
  @InvalidateCache([
    cachePattern("me-invitations:member-list", "user"),
    cachePattern("me-invitations:member", "user"),
    cachePattern("invitations:member-list", "none"),
  ])
  async acceptInvitationMember(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const accept_invitation: AcceptInvitationDTO = await validateDto(AcceptInvitationDTO, req.body);
    await this.meService.acceptInvitationMember(accept_invitation);
    logger.info("Invitation successfully accepted");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  @userControllerTraceDecorator.traceSpan("acceptInvitationMemberWEncoded", { url: "/me/invitations/accept/encoded", method: "post" })
  @InvalidateCache([
    cachePattern("me-invitations:member-list", "user"),
    cachePattern("me-invitations:member", "user"),
    cachePattern("invitations:member-list", "none"),
  ])
  async acceptInvitationMemberWEncoded(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const accept_invitation: AcceptInvitationWEncodedDTO = await validateDto(AcceptInvitationWEncodedDTO, req.body);
    await this.meService.acceptInvitationMemberWEncoded(accept_invitation);
    logger.info("Invitation successfully accepted with encoded");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  @userControllerTraceDecorator.traceSpan("acceptInvitationManager", { url: "/me/invitations/accept/manager", method: "post" })
  @InvalidateCache([
    cachePattern("me-invitations:manager-list", "user"),
    cachePattern("me-invitations:manager", "user"),
    cachePattern("invitations:manager-list", "none"),
  ])
  async acceptInvitationManager(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const accept_invitation: AcceptInvitationDTO = await validateDto(AcceptInvitationDTO, req.body);
    await this.meService.acceptInvitationManager(accept_invitation);
    logger.info("Invitation successfully accepted");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  @userControllerTraceDecorator.traceSpan("refuseMemberInvitation", { url: "/me/invitations/:id_invitation/member", method: "delete" })
  @InvalidateCache([cachePattern("me-invitations:member-list", "user"), cachePattern("me-invitations:member", "user")])
  async refuseMemberInvitation(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.meService.refuseMemberInvitation(+req.params.id_invitation);
    logger.info("Invitation successfully refused");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }

  @userControllerTraceDecorator.traceSpan("refuseManagerInvitation", { url: "/me/invitations/:id_invitation/manager", method: "delete" })
  @InvalidateCache([cachePattern("me-invitations:manager-list", "user"), cachePattern("me-invitations:manager", "user")])
  async refuseManagerInvitation(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.meService.refuseManagerInvitation(+req.params.id_invitation);
    logger.info("Invitation successfully refused");
    res.status(200).json(new ApiResponse<string>("success", SUCCESS));
  }
}
