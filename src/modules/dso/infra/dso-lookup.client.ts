import { callForResponse } from "../../../shared/services/api_call.js";
import type { IDsoLookupClient } from "../domain/i-dso-lookup.client.js";
import type { DsoEanCheck, DsoMeta, DsoOperator, DsoResolveResponse } from "../domain/dso.types.js";
import { DsoUnavailableError } from "../shared/dso-unavailable.error.js";

/**
 * Thin client for `dso-lookup`, the internal service that answers "which DSO
 * runs the network here" from the `belgian-dso-map` data release.
 *
 * Modelled on geocoding/infra/best-address.client.ts, with one
 * difference that matters: `call()` hands a 4xx/5xx body back as if it were
 * data, which for the address register quietly becomes "no suggestions". Here a
 * 503 page parsed as an answer would prefill a meter from garbage, so the status
 * is checked ({@link callForResponse}) and so is the `{ data, error_code }`
 * envelope every dso-lookup route wraps its payload in.
 *
 * Privacy: the query carries a postcode, an address name and an EAN. Nothing
 * here logs, and every failure is re-thrown as a {@link DsoUnavailableError}
 * that carries no request — an axios error would serialise its whole config,
 * params included, into whatever log line caught it.
 */
export class DsoLookupClient implements IDsoLookupClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {}

  async resolve(postcode?: string, ins?: string, section?: string): Promise<DsoResolveResponse> {
    return this.get<DsoResolveResponse>("/dso/resolve", { postcode, ins, section });
  }

  async resolveAddress(nisCode: string, postcode?: string, postName?: string): Promise<DsoResolveResponse> {
    return this.get<DsoResolveResponse>("/dso/resolve-address", { nis_code: nisCode, postcode, post_name: postName });
  }

  async operators(): Promise<DsoOperator[]> {
    const operators = await this.get<DsoOperator[]>("/dso/operators", {});
    if (!Array.isArray(operators)) {
      throw new DsoUnavailableError("body");
    }
    return operators;
  }

  async eanCheck(ean: string): Promise<DsoEanCheck> {
    // "." and ".." cannot travel as a path segment: the URL parser (axios's too)
    // collapses `/dso/ean/./check` to `/dso/ean/check` and `/dso/ean/../check` to
    // `/dso/check`, both 404, and the check would be dropped. encodeURIComponent
    // leaves dots alone, and `%2e` is a dot segment too. Neither is 18 digits, so
    // dso-lookup's answer is known: format_invalid.
    if (ean === "." || ean === "..") {
      return { format: false, belgian_prefix: false, gs1_check: null, known_operator: null };
    }
    return this.get<DsoEanCheck>(`/dso/ean/${encodeURIComponent(ean)}/check`, {});
  }

  async meta(): Promise<DsoMeta> {
    return this.get<DsoMeta>("/dso/meta", {});
  }

  private async get<T>(path: string, params: Record<string, string | undefined>): Promise<T> {
    // Absent parameters are left out rather than sent empty: dso-lookup treats
    // `?ins=` as a filter that matches nothing, which it ignores anyway, but an
    // empty value still has to be parsed and the URL stays honest without it.
    const query = Object.fromEntries(Object.entries(params).filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== ""));

    let response: { status: number; data: unknown };
    try {
      response = await callForResponse<unknown>({
        method: "GET",
        url: `${this.baseUrl.replace(/\/+$/, "")}${path}`,
        timeout: this.timeoutMs,
        params: query,
      });
    } catch (err) {
      // Rethrown WITHOUT the cause, on purpose — see the class comment.
      throw new DsoUnavailableError(isTimeout(err) ? "timeout" : "network");
    }

    if (response.status !== 200) {
      throw new DsoUnavailableError("status", response.status);
    }
    const body = response.data;
    if (
      typeof body !== "object" ||
      body === null ||
      !("data" in body) ||
      (body as { data: unknown }).data === undefined ||
      (body as { data: unknown }).data === null
    ) {
      throw new DsoUnavailableError("body");
    }
    return (body as { data: T }).data;
  }
}

function isTimeout(err: unknown): boolean {
  const code = typeof err === "object" && err !== null ? (err as { code?: unknown }).code : undefined;
  return code === "ECONNABORTED" || code === "ETIMEDOUT";
}
