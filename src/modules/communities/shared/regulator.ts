import { readFileSync } from "node:fs";
import config from "config";

/**
 * A single energy-market regulator entry from the shared registry.
 *
 * The registry is the canonical `reference/regulators.json` file at the monorepo
 * root, distributed to every service via the `REGULATORS_CONFIG_PATH` env var
 * (resolved through the `config` layer — see `config/*.cjs` `regulators.config_path`).
 * Core is the sole writer of a community's regulator; annexe services read the
 * per-community value from the CRM DB and this file for label metadata.
 */
export interface RegulatorDef {
  code: string;
  label: string;
  region: string;
  country: string;
  active: boolean;
}

/** Default regulator for the Wallonia-only phase (v1). */
export const DEFAULT_REGULATOR = "BE-WAL-CWAPE";

let cache: RegulatorDef[] | null = null;

function resolveConfigPath(): string {
  const configured = config.has("regulators.config_path") ? config.get<string>("regulators.config_path") : "";
  if (!configured) {
    throw new Error("Regulator registry path is not configured. Set REGULATORS_CONFIG_PATH to the shared regulators.json file.");
  }
  return configured;
}

function isValidEntry(value: unknown): value is RegulatorDef {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.code === "string" &&
    typeof v.label === "string" &&
    typeof v.region === "string" &&
    typeof v.country === "string" &&
    typeof v.active === "boolean"
  );
}

/**
 * Loads, validates and caches the regulator registry from disk. Read once on
 * first access; subsequent calls return the cached list. Throws (fail-fast) if
 * the path is unset, the file is unreadable, or the shape is invalid.
 */
export function getRegulators(): RegulatorDef[] {
  if (cache) return cache;
  const path = resolveConfigPath();
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf-8"));
  } catch (err) {
    throw new Error(`Failed to load the regulator registry from "${path}": ${(err as Error).message}`);
  }
  if (!Array.isArray(parsed) || !parsed.every(isValidEntry)) {
    throw new Error(`Regulator registry at "${path}" is malformed: expected an array of { code, label, region, country, active }.`);
  }
  cache = parsed;
  return cache;
}

/** All codes that may be assigned to a community (only currently-active regulators). */
export function getActiveRegulatorCodes(): string[] {
  return getRegulators()
    .filter((r) => r.active)
    .map((r) => r.code);
}

/** True when `code` is a defined, currently-active regulator (assignable on create/update). */
export function isActiveRegulator(code: unknown): boolean {
  return typeof code === "string" && getRegulators().some((r) => r.active && r.code === code);
}

/** True when `code` is any defined regulator, active or not (e.g. for list filtering). */
export function isKnownRegulator(code: unknown): boolean {
  return typeof code === "string" && getRegulators().some((r) => r.code === code);
}
