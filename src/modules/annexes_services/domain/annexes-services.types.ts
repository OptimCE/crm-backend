import type { Role } from "../../../shared/dtos/role.js";

/**
 * Shape of a single entry in the annexes-services catalog config.
 * Loaded from `config/annexes-services.json` once per process, at startup.
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
  /**
   * Frontend i18n key appended to the generic unsubscribe confirmation, for a
   * module whose switch-off has consequences the generic sentence does not say.
   * Absent = generic sentence only.
   */
  unsubscribeWarningKey?: string;
  /**
   * Whether this deployment serves the module when no override names it.
   * Absent = true, so an entry without the field behaves as it always did.
   *
   * Ship a module whose service is not deployed everywhere yet with `false`,
   * and switch it on where it is deployed with `ANNEX_CATALOG_ENABLE`.
   * `ANNEX_CATALOG_DISABLE` hides a module that is on, and wins over ENABLE.
   * Both are comma-separated feature names (config key `annex_catalog`); a
   * name that is not a `feature` of this file refuses the boot.
   *
   * A disabled module is not listed and cannot be subscribed to, but this does
   * NOT revoke communities already subscribed: the annex services check the
   * `community_subscription` row, never this catalog. They can still
   * unsubscribe. Never sent to the frontend (no `@Expose()` on the DTO).
   */
  defaultEnabled?: boolean;
}

export interface AnnexCatalogFile {
  modules: AnnexCatalogEntry[];
}

/**
 * Per-deployment switches over the catalog file, from `ANNEX_CATALOG_ENABLE`
 * and `ANNEX_CATALOG_DISABLE` (config key `annex_catalog`).
 */
export interface AnnexCatalogOverrides {
  /** Features to serve even though their entry says `defaultEnabled: false`. */
  enable: readonly string[];
  /** Features to hide. Wins over `enable`. */
  disable: readonly string[];
}

/**
 * The catalog as this deployment serves it, resolved once per process.
 * Both lists keep the file's order.
 */
export interface AnnexCatalog {
  /** Every entry in the file, enabled or not. `unsubscribe` accepts any of them. */
  readonly all: ReadonlyArray<AnnexCatalogEntry>;
  /** The entries this deployment exposes: listed by the API and open to `subscribe`. */
  readonly enabled: ReadonlyArray<AnnexCatalogEntry>;
}
