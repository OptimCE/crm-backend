/**
 * The i18next namespaces the API loads, one `assets/<lang>/<ns>.json` file each.
 *
 * An error key's prefix (`meter:` in "meter:get_meter.meter_not_found") must be in
 * this list: a namespace that is not loaded renders every message in it as the
 * raw key, with nothing in the logs. "municipality" was missing even though
 * MUNICIPALITY_ERRORS has used the "municipality:" prefix since it was
 * introduced, and annexes_services, audit_log and notification had neither an
 * entry here nor a file. tests/units/shared/error-translations.test.ts checks
 * every LocalError against this list and the four locales.
 */
export const I18N_NAMESPACES = [
  "global_error",
  "annexes_services",
  "audit_log",
  "community",
  "document",
  "geocoding",
  "invitation",
  "key",
  "member",
  "meter",
  "municipality",
  "notification",
  "sharing_operation",
  "user",
] as const;
