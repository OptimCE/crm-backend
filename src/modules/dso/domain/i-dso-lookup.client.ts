import type { DsoEanCheck, DsoMeta, DsoOperator, DsoResolveResponse } from "./dso.types.js";

/** Container token. Unbound means the feature is off — see container/factory/dso.factory.ts. */
export const DSO_LOOKUP_CLIENT_TOKEN = "DsoLookupClient";

/**
 * The internal `dso-lookup` service.
 *
 * Every method throws `DsoUnavailableError` (../shared/dso-unavailable.error.ts)
 * — and nothing else — when it
 * cannot produce a well-formed answer: a timeout, a refused connection, a non-200
 * status or a body without `data`. "Nothing matched" is NOT an error; it is a
 * `not_found` status.
 */
export interface IDsoLookupClient {
  /** By postcode, optionally narrowed by commune (`ins`) and section. */
  resolve(postcode?: string, ins?: string, section?: string): Promise<DsoResolveResponse>;
  /** By the address the picker returned: NIS code (5 digits), postcode, postal or part-of-municipality name. */
  resolveAddress(nisCode: string, postcode?: string, postName?: string): Promise<DsoResolveResponse>;
  operators(): Promise<DsoOperator[]>;
  eanCheck(ean: string): Promise<DsoEanCheck>;
  meta(): Promise<DsoMeta>;
}
