import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Ajv2020, type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";

/**
 * Runtime validation against the vendored contract schemas (assets/export/schemas, a byte copy of
 * contracts/export/schemas checked by scripts/check-export-parity.sh).
 *
 * The directory is resolved relative to this module, so it works from src/ (tsx, jest) and from
 * dist/src/ (the image, where `copy-assets` puts assets/ under dist/).
 */

export type ExportSchemaName = "export-job-requested" | "export-request" | "export-part-done" | "export-part-failed" | "manifest" | "data-file";

const SCHEMA_BASE = "https://optimce.be/contracts/export/";
const SCHEMA_DIR = fileURLToPath(new URL("../../../../assets/export/schemas/", import.meta.url));

// ajv-formats is CommonJS: under NodeNext its default export is the module object.
const addFormats = ((addFormatsModule as unknown as { default?: typeof addFormatsModule }).default ?? addFormatsModule) as unknown as (
  ajv: Ajv2020,
) => Ajv2020;

let ajv: Ajv2020 | undefined;

function instance(): Ajv2020 {
  if (!ajv) {
    const created = new Ajv2020({ strict: true, allErrors: true });
    addFormats(created);
    for (const file of readdirSync(SCHEMA_DIR).filter((f) => f.endsWith(".schema.json"))) {
      created.addSchema(JSON.parse(readFileSync(`${SCHEMA_DIR}${file}`, "utf8")) as object);
    }
    ajv = created;
  }
  return ajv;
}

function validator(name: ExportSchemaName): ValidateFunction {
  const fn = instance().getSchema(`${SCHEMA_BASE}${name}.schema.json`);
  if (!fn) throw new Error(`export schema ${name} is not loaded from ${SCHEMA_DIR}`);
  return fn;
}

export interface SchemaCheck {
  valid: boolean;
  /** Short, content-free description: JSON pointers and keywords only, never the values. */
  errors: string[];
}

export function checkAgainst(name: ExportSchemaName, value: unknown): SchemaCheck {
  const fn = validator(name);
  const valid = fn(value) === true;
  return { valid, errors: valid ? [] : describe(fn.errors ?? []) };
}

function describe(errors: ErrorObject[]): string[] {
  return errors.slice(0, 10).map((e) => `${e.instancePath || "/"} ${e.keyword}`);
}
