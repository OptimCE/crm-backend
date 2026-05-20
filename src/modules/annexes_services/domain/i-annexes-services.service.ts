import type { QueryRunner } from "typeorm";
import type { CommunityAnnexDTO } from "../api/annexes-services.dtos.js";

export interface IAnnexesServicesService {
  /**
   * Catalog filtered by the current user's role, joined with the active
   * community's subscription state.
   */
  getCommunityServices(): Promise<CommunityAnnexDTO[]>;

  /** Activate a feature subscription for the current community. */
  subscribe(feature: string, query_runner?: QueryRunner): Promise<void>;

  /** Deactivate a feature subscription for the current community. */
  unsubscribe(feature: string, query_runner?: QueryRunner): Promise<void>;
}
