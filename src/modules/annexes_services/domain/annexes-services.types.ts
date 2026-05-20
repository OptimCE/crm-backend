import type { Role } from "../../../shared/dtos/role.js";

/**
 * Shape of a single entry in the annexes-services catalog config.
 * Loaded from `config/annexes-services.json` at startup.
 */
export interface AnnexCatalogEntry {
  feature: string;
  displayKey: string;
  descriptionKey: string;
  icon: string;
  minRole: Role;
  frontendRoute: string;
  subscribePath: string;
  unsubscribePath: string;
}

export interface AnnexCatalogFile {
  modules: AnnexCatalogEntry[];
}
