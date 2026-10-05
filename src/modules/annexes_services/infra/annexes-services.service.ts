import { inject, injectable } from "inversify";
import { plainToInstance } from "class-transformer";
import type { QueryRunner } from "typeorm";
import logger from "../../../shared/monitor/logger.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import { getContext } from "../../../shared/middlewares/context.js";
import { Role, ROLE_HIERARCHY } from "../../../shared/dtos/role.js";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import { Transactional } from "../../../shared/transactional/transaction.uow.js";
import type { IAuthContextRepository } from "../../../shared/context/i-authcontext.repository.js";
import type { IAnnexesServicesRepository } from "../domain/i-annexes-services.repository.js";
import type { IAnnexesServicesService } from "../domain/i-annexes-services.service.js";
import type { AnnexCatalog, AnnexCatalogEntry } from "../domain/annexes-services.types.js";
import { CommunityAnnexDTO } from "../api/annexes-services.dtos.js";
import { ANNEXES_SERVICES_ERRORS } from "../shared/annexes-services.errors.js";
import type { IAuditLogService } from "../../audit_log/domain/i-audit-log.service.js";
import { AUDIT_ACTIONS } from "../../audit_log/domain/audit-log.actions.js";

/**
 * Serves the annex catalog as this deployment resolved it, injected as
 * "AnnexCatalog" (see `shared/annexes-catalog.ts`): the listing and new
 * subscriptions see only the ENABLED entries, unsubscribe sees every entry in
 * the file. The catalog is process-static; reload requires a service restart.
 *
 * Disabling an annex does not revoke existing subscribers - the annex services
 * gate on the `community_subscription` row, not on this catalog.
 */
@injectable()
export class AnnexesServicesService implements IAnnexesServicesService {
  constructor(
    @inject("AnnexesServicesRepository") private readonly annexesRepository: IAnnexesServicesRepository,
    @inject("AuthContext") private readonly authContext: IAuthContextRepository,
    @inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
    @inject("AuditLogService") private readonly auditLogService: IAuditLogService,
    @inject("AnnexCatalog") private readonly catalog: AnnexCatalog,
  ) {}

  async getCommunityServices(): Promise<CommunityAnnexDTO[]> {
    const role = this.requireRole();
    const internal_community_id = await this.authContext.getInternalCommunityId();
    const active = await this.annexesRepository.findActiveByCommunity(internal_community_id);
    const subscribedFeatures = new Set(active.map((sub) => sub.feature));
    return this.filterByRole(role).map((entry) =>
      plainToInstance(CommunityAnnexDTO, { ...entry, subscribed: subscribedFeatures.has(entry.feature) }, { excludeExtraneousValues: true }),
    );
  }

  @Transactional()
  async subscribe(feature: string, query_runner?: QueryRunner): Promise<void> {
    if (this.isDisabled(feature)) {
      // Same 404 as an unknown name on the wire; the log is what tells them apart.
      logger.info({ operation: "annexes_services:subscribe", feature, reason: "hidden" }, "Feature is disabled in this deployment");
    }
    this.requireFeatureInCatalog(this.catalog.enabled, feature);
    const internal_community_id = await this.authContext.getInternalCommunityId();
    const existing = await this.annexesRepository.findByCommunityAndFeature(internal_community_id, feature, query_runner);
    if (existing !== null) {
      if (existing.is_active) {
        logger.info(
          { operation: "annexes_services:subscribe", feature, id_community: internal_community_id },
          "Community already subscribed to feature",
        );
        throw new AppError(ANNEXES_SERVICES_ERRORS.SUBSCRIPTION.ALREADY_SUBSCRIBED, 409);
      }
      await this.annexesRepository.setActive(existing.id, true, query_runner);
      await this.auditLogService.log(
        {
          action: AUDIT_ACTIONS.COMMUNITY_SUBSCRIPTION_REACTIVATED,
          entity_type: "community_subscription",
          entity_id: String(existing.id),
          payload: { feature, changed_fields: ["is_active"] },
        },
        query_runner,
      );
    } else {
      const created = await this.annexesRepository.createSubscription(internal_community_id, feature, true, query_runner);
      await this.auditLogService.log(
        {
          action: AUDIT_ACTIONS.COMMUNITY_SUBSCRIPTION_CREATED,
          entity_type: "community_subscription",
          entity_id: String(created.id),
          payload: { feature, is_active: true },
        },
        query_runner,
      );
    }
    logger.info({ operation: "annexes_services:subscribe", feature, id_community: internal_community_id }, "Community subscribed to feature");
  }

  @Transactional()
  async unsubscribe(feature: string, query_runner?: QueryRunner): Promise<void> {
    // Every entry in the file, enabled or not: a community that subscribed before
    // the annex was disabled must still be able to leave, and leaving is what ends
    // its access (the annex keeps serving an active subscription row).
    this.requireFeatureInCatalog(this.catalog.all, feature);
    const internal_community_id = await this.authContext.getInternalCommunityId();
    const existing = await this.annexesRepository.findByCommunityAndFeature(internal_community_id, feature, query_runner);
    if (existing === null || !existing.is_active) {
      logger.info({ operation: "annexes_services:unsubscribe", feature, id_community: internal_community_id }, "Community not subscribed to feature");
      throw new AppError(ANNEXES_SERVICES_ERRORS.SUBSCRIPTION.NOT_SUBSCRIBED, 403);
    }
    await this.annexesRepository.setActive(existing.id, false, query_runner);
    await this.auditLogService.log(
      {
        action: AUDIT_ACTIONS.COMMUNITY_SUBSCRIPTION_UNSUBSCRIBED,
        entity_type: "community_subscription",
        entity_id: String(existing.id),
        payload: { feature, changed_fields: ["is_active"] },
      },
      query_runner,
    );
    logger.info({ operation: "annexes_services:unsubscribe", feature, id_community: internal_community_id }, "Community unsubscribed from feature");
  }

  private requireFeatureInCatalog(entries: ReadonlyArray<AnnexCatalogEntry>, feature: string): void {
    if (!entries.some((entry) => entry.feature === feature)) {
      throw new AppError(ANNEXES_SERVICES_ERRORS.SUBSCRIPTION.FEATURE_NOT_FOUND, 404);
    }
  }

  /** In the catalog file, but switched off for this deployment. */
  private isDisabled(feature: string): boolean {
    return this.catalog.all.some((entry) => entry.feature === feature) && !this.catalog.enabled.some((entry) => entry.feature === feature);
  }

  private requireRole(): Role {
    const { role } = getContext();
    if (!role) {
      throw new AppError(ANNEXES_SERVICES_ERRORS.AUTHORIZATION_MISSING, 401);
    }
    return role;
  }

  private filterByRole(role: Role): AnnexCatalogEntry[] {
    const userLevel = ROLE_HIERARCHY[role];
    return this.catalog.enabled.filter((entry) => userLevel >= ROLE_HIERARCHY[entry.minRole]);
  }
}
