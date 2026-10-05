import { describe, expect, it } from "@jest/globals";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { GLOBAL_ERRORS, LocalError } from "../../../src/shared/errors/errors.js";
import { I18N_NAMESPACES } from "../../../src/shared/utils/i18n-namespaces.js";
import { ANNEXES_SERVICES_ERRORS } from "../../../src/modules/annexes_services/shared/annexes-services.errors.js";
import { AUDIT_LOG_ERRORS } from "../../../src/modules/audit_log/shared/audit-log.errors.js";
import { COMMUNITY_ERRORS } from "../../../src/modules/communities/shared/community.errors.js";
import { DOCUMENT_ERRORS } from "../../../src/modules/documents/shared/document.errors.js";
import { GEOCODING_ERRORS } from "../../../src/modules/geocoding/shared/geocoding.errors.js";
import { INVITATION_ERRORS } from "../../../src/modules/invitations/shared/invitation.errors.js";
import { KEY_ERRORS } from "../../../src/modules/keys/shared/key.errors.js";
import { ME_ERRORS } from "../../../src/modules/me/shared/me.errors.js";
import { MEMBER_ERRORS } from "../../../src/modules/members/shared/member.errors.js";
import { METER_ERRORS } from "../../../src/modules/meters/shared/meter.errors.js";
import { MUNICIPALITY_ERRORS } from "../../../src/modules/municipalities/shared/municipality.errors.js";
import { NOTIFICATION_ERRORS } from "../../../src/modules/notifications/shared/notification.errors.js";
import { REALTIME_ERRORS } from "../../../src/modules/realtime/shared/realtime.errors.js";
import { SHARING_OPERATION_ERRORS } from "../../../src/modules/sharing_operations/shared/sharing_operation.errors.js";
import { USER_ERRORS } from "../../../src/modules/users/shared/user.errors.js";

/**
 * Every error the API can answer with is translated in every language.
 *
 * The error middleware answers with `req.t(error.message)`, and a key that does
 * not resolve comes back as the key itself: the user reads
 * "meter:validation.create_meter.ean_format" in a toast, and nothing fails - no
 * log line, no test, a normal 4xx. That is how 28 untranslated keys, three keys
 * whose namespace separator was wrong ("meter.add_meter..." and a second ":"),
 * and three namespaces with no file at all accumulated unnoticed.
 */

const LANGUAGES = ["en", "fr", "nl", "de"] as const;
const SRC = resolve(process.cwd(), "src");
const ASSETS = resolve(process.cwd(), "assets");

// Registry file, relative to src/, to what it exports. Keyed by path so the first
// test can prove nothing is left out when a module adds its own registry.
const REGISTRIES: Record<string, object> = {
  "shared/errors/errors.ts": GLOBAL_ERRORS,
  "modules/annexes_services/shared/annexes-services.errors.ts": ANNEXES_SERVICES_ERRORS,
  "modules/audit_log/shared/audit-log.errors.ts": AUDIT_LOG_ERRORS,
  "modules/communities/shared/community.errors.ts": COMMUNITY_ERRORS,
  "modules/documents/shared/document.errors.ts": DOCUMENT_ERRORS,
  "modules/geocoding/shared/geocoding.errors.ts": GEOCODING_ERRORS,
  "modules/invitations/shared/invitation.errors.ts": INVITATION_ERRORS,
  "modules/keys/shared/key.errors.ts": KEY_ERRORS,
  "modules/me/shared/me.errors.ts": ME_ERRORS,
  "modules/members/shared/member.errors.ts": MEMBER_ERRORS,
  "modules/meters/shared/meter.errors.ts": METER_ERRORS,
  "modules/municipalities/shared/municipality.errors.ts": MUNICIPALITY_ERRORS,
  "modules/notifications/shared/notification.errors.ts": NOTIFICATION_ERRORS,
  "modules/realtime/shared/realtime.errors.ts": REALTIME_ERRORS,
  "modules/sharing_operations/shared/sharing_operation.errors.ts": SHARING_OPERATION_ERRORS,
  "modules/users/shared/user.errors.ts": USER_ERRORS,
};

function collectKeys(node: unknown, keys: Set<string>): Set<string> {
  if (node instanceof LocalError) {
    keys.add(node.message);
  } else if (node !== null && typeof node === "object") {
    for (const child of Object.values(node)) collectKeys(child, keys);
  }
  return keys;
}

const ERROR_KEYS = [...collectKeys(Object.values(REGISTRIES), new Set<string>())].sort();

const localeCache = new Map<string, unknown>();
function localeFile(lang: string, ns: string): unknown {
  const file = join(ASSETS, lang, `${ns}.json`);
  if (!localeCache.has(file)) {
    localeCache.set(file, existsSync(file) ? JSON.parse(readFileSync(file, "utf-8")) : undefined);
  }
  return localeCache.get(file);
}

function translate(lang: string, key: string): unknown {
  const separator = key.indexOf(":");
  let node: unknown = localeFile(lang, key.slice(0, separator));
  for (const part of key.slice(separator + 1).split(".")) {
    node = node !== null && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined;
  }
  return node;
}

describe("(Unit) error translations", () => {
  it("covers every *.errors.ts registry", () => {
    const onDisk = readdirSync(join(SRC, "modules"), { recursive: true, encoding: "utf-8" })
      .filter((file) => file.endsWith(".errors.ts"))
      .map((file) => `modules/${file.replaceAll("\\", "/")}`);
    expect(Object.keys(REGISTRIES).sort()).toEqual(["shared/errors/errors.ts", ...onDisk].sort());
  });

  it("finds the errors it is meant to check", () => {
    expect(ERROR_KEYS.length).toBeGreaterThan(150);
  });

  it("gives every error key exactly one namespace, and one that i18next loads", () => {
    const loaded = new Set<string>(I18N_NAMESPACES);
    const malformed = ERROR_KEYS.filter((key) => key.split(":").length !== 2 || !loaded.has(key.split(":")[0]));
    expect(malformed).toEqual([]);
  });

  it.each(LANGUAGES)("translates every error key in %s", (lang) => {
    const untranslated = ERROR_KEYS.filter((key) => typeof translate(lang, key) !== "string");
    expect(untranslated).toEqual([]);
  });

  it.each(LANGUAGES)("has exactly one %s file per loaded namespace", (lang) => {
    const files = readdirSync(join(ASSETS, lang))
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.slice(0, -".json".length));
    expect(files.sort()).toEqual([...I18N_NAMESPACES].sort());
  });
});
