import { inject, injectable } from "inversify";
import { plainToInstance } from "class-transformer";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
import type { AnnexCatalogEntry, AnnexCatalogFile } from "../domain/annexes-services.types.js";
import { CommunityAnnexDTO } from "../api/annexes-services.dtos.js";
import { ANNEXES_SERVICES_ERRORS } from "../shared/annexes-services.errors.js";
import type { IAuditLogService } from "../../audit_log/domain/i-audit-log.service.js";
import { AUDIT_ACTIONS } from "../../audit_log/domain/audit-log.actions.js";

const CATALOG_PATH = resolve(process.cwd(), "config", "annexes-services.json");

/**
 * Loads `config/annexes-services.json` once, freezes the result, and serves
 * read-only views of the catalog. The catalog is process-static; reload requires
 * a service restart.
 */
@injectable()
export class AnnexesServicesService implements IAnnexesServicesService {
  private readonly catalog: ReadonlyArray<AnnexCatalogEntry>;

  constructor(
    @inject("AnnexesServicesRepository") private readonly annexesRepository: IAnnexesServicesRepository,
    @inject("AuthContext") private readonly authContext: IAuthContextRepository,
    @inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
    @inject("AuditLogService") private readonly auditLogService: IAuditLogService,
  ) {
    this.catalog = AnnexesServicesService.loadCatalog();
    logger.info({ operation: "annexes_services:catalog_loaded", count: this.catalog.length }, "Annex services catalog loaded");
  }

  private static loadCatalog(): ReadonlyArray<AnnexCatalogEntry> {
    let raw: string;
    try {
      raw = readFileSync(CATALOG_PATH, "utf-8");
    } catch (err) {
      logger.error({ operation: "annexes_services:catalog_read", error: err, path: CATALOG_PATH }, "Failed to read annexes-services catalog");
      throw new AppError(ANNEXES_SERVICES_ERRORS.CATALOG.LOAD_FAILED, 500);
    }
    let parsed: AnnexCatalogFile;
    try {
      parsed = JSON.parse(raw) as AnnexCatalogFile;
    } catch (err) {
      logger.error({ operation: "annexes_services:catalog_parse", error: err }, "Failed to parse annexes-services catalog JSON");
      throw new AppError(ANNEXES_SERVICES_ERRORS.CATALOG.LOAD_FAILED, 500);
    }
    if (!parsed || !Array.isArray(parsed.modules)) {
      logger.error({ operation: "annexes_services:catalog_validate" }, "annexes-services catalog must define a `modules` array");
      throw new AppError(ANNEXES_SERVICES_ERRORS.CATALOG.INVALID_FORMAT, 500);
    }
    const knownRoles = new Set<string>(Object.keys(ROLE_HIERARCHY));
    for (const entry of parsed.modules) {
      if (!knownRoles.has(entry.minRole)) {
        logger.error(
          { operation: "annexes_services:catalog_validate", feature: entry.feature, minRole: entry.minRole },
          "Catalog entry has unknown minRole",
        );
        throw new AppError(ANNEXES_SERVICES_ERRORS.CATALOG.INVALID_FORMAT, 500);
      }
    }
    return Object.freeze(parsed.modules.map((m) => Object.freeze({ ...m })));
  }

  async getCommunityServices(): Promise<CommunityAnnexDTO[]> {
    const role = this.requireRole();
    const internal_community_id = await this.authContext.getInternalCommunityId();
    const active = await this.annexesRepository.findActiveByCommunity(internal_community_id);
    const subscribedFeatures = new Set(active.map((sub) => sub.feature));
    return this.filterByRole(role).map((entry) =>
      plainToInstance(
        CommunityAnnexDTO,
        { ...entry, subscribed: subscribedFeatures.has(entry.feature) },
        { excludeExtraneousValues: true },
      ),
    );
  }

  @Transactional()
  async subscribe(feature: string, query_runner?: QueryRunner): Promise<void> {
    this.requireFeatureInCatalog(feature);
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
    logger.info(
      { operation: "annexes_services:subscribe", feature, id_community: internal_community_id },
      "Community subscribed to feature",
    );
  }

  @Transactional()
  async unsubscribe(feature: string, query_runner?: QueryRunner): Promise<void> {
    this.requireFeatureInCatalog(feature);
    const internal_community_id = await this.authContext.getInternalCommunityId();
    const existing = await this.annexesRepository.findByCommunityAndFeature(internal_community_id, feature, query_runner);
    if (existing === null || !existing.is_active) {
      logger.info(
        { operation: "annexes_services:unsubscribe", feature, id_community: internal_community_id },
        "Community not subscribed to feature",
      );
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
    logger.info(
      { operation: "annexes_services:unsubscribe", feature, id_community: internal_community_id },
      "Community unsubscribed from feature",
    );
  }

  private requireFeatureInCatalog(feature: string): void {
    if (!this.catalog.some((entry) => entry.feature === feature)) {
      throw new AppError(ANNEXES_SERVICES_ERRORS.SUBSCRIPTION.FEATURE_NOT_FOUND, 404);
    }
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
    return this.catalog.filter((entry) => userLevel >= ROLE_HIERARCHY[entry.minRole]);
  }
}
