import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import config from "config";
import logger from "../../../shared/monitor/logger.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import { ROLE_HIERARCHY } from "../../../shared/dtos/role.js";
import type { AnnexCatalog, AnnexCatalogEntry, AnnexCatalogFile, AnnexCatalogOverrides } from "../domain/annexes-services.types.js";
import { ANNEXES_SERVICES_ERRORS } from "./annexes-services.errors.js";

const CATALOG_PATH = resolve(process.cwd(), "config", "annexes-services.json");

let cache: AnnexCatalog | null = null;

/** Parses and validates the catalog file's content. Throws an `AppError` (500) on any defect. */
export function parseAnnexCatalog(raw: string): AnnexCatalogEntry[] {
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
    // A string "false" is truthy: let it through and the annex stays ON.
    if (entry.defaultEnabled !== undefined && typeof entry.defaultEnabled !== "boolean") {
      logger.error(
        { operation: "annexes_services:catalog_validate", feature: entry.feature, defaultEnabled: entry.defaultEnabled },
        "Catalog entry has a non-boolean defaultEnabled",
      );
      throw new AppError(ANNEXES_SERVICES_ERRORS.CATALOG.INVALID_FORMAT, 500);
    }
  }
  return parsed.modules;
}

/**
 * Applies this deployment's overrides to the catalog entries. An entry is
 * enabled when it is not in `disable` and either its `defaultEnabled` is not
 * false or it is in `enable` - disable wins.
 *
 * A name in either list that is not a catalog feature is refused rather than
 * ignored: a typo in DISABLE would otherwise leave the annex on.
 */
export function resolveAnnexCatalog(modules: ReadonlyArray<AnnexCatalogEntry>, overrides: AnnexCatalogOverrides): AnnexCatalog {
  const known = modules.map((m) => m.feature);
  const knownSet = new Set(known);
  const unknown_enable = overrides.enable.filter((feature) => !knownSet.has(feature));
  const unknown_disable = overrides.disable.filter((feature) => !knownSet.has(feature));
  if (unknown_enable.length > 0 || unknown_disable.length > 0) {
    logger.error(
      { operation: "annexes_services:catalog_overrides", unknown_enable, unknown_disable, known },
      "ANNEX_CATALOG_ENABLE / ANNEX_CATALOG_DISABLE name a feature that is not in config/annexes-services.json",
    );
    throw new AppError(ANNEXES_SERVICES_ERRORS.CATALOG.INVALID_FORMAT, 500);
  }
  const enable = new Set(overrides.enable);
  const disable = new Set(overrides.disable);
  const all = Object.freeze(modules.map((m) => Object.freeze({ ...m })));
  const enabled = Object.freeze(all.filter((m) => !disable.has(m.feature) && (m.defaultEnabled !== false || enable.has(m.feature))));
  return Object.freeze({ all, enabled });
}

function readOverrides(): AnnexCatalogOverrides {
  const list = (key: string): string[] => (config.has(key) ? config.get<string[]>(key) : []);
  return { enable: list("annex_catalog.enable"), disable: list("annex_catalog.disable") };
}

/**
 * The catalog this process serves, read from `config/annexes-services.json` and
 * resolved against the `annex_catalog` overrides on first call, then cached.
 * `startServer()` calls it first so a bad file or override refuses the boot,
 * and so the exposed set is logged once (`annexes_services:catalog_loaded`).
 */
export function getAnnexCatalog(): AnnexCatalog {
  if (cache) return cache;
  let raw: string;
  try {
    raw = readFileSync(CATALOG_PATH, "utf-8");
  } catch (err) {
    logger.error({ operation: "annexes_services:catalog_read", error: err, path: CATALOG_PATH }, "Failed to read annexes-services catalog");
    throw new AppError(ANNEXES_SERVICES_ERRORS.CATALOG.LOAD_FAILED, 500);
  }
  const overrides = readOverrides();
  const catalog = resolveAnnexCatalog(parseAnnexCatalog(raw), overrides);
  const enabled = catalog.enabled.map((m) => m.feature);
  logger.info(
    {
      operation: "annexes_services:catalog_loaded",
      enabled,
      disabled: catalog.all.map((m) => m.feature).filter((feature) => !enabled.includes(feature)),
      overrides,
    },
    "Annex services catalog loaded",
  );
  cache = catalog;
  return cache;
}
