import { beforeEach, describe, expect, it, jest } from "@jest/globals";

/**
 * No network: dso-lookup runs in the dev stack only, and CI does not start it.
 * What can go wrong here is the envelope and status handling, which needs none.
 */
const callForResponse = jest.fn<(...args: unknown[]) => Promise<{ status: number; data: unknown }>>();
jest.unstable_mockModule("../../../src/shared/services/api_call.js", () => ({
  call: jest.fn(),
  callForStatus: jest.fn(),
  callForResponse,
  callWithTracingHeaders: jest.fn(),
  callWithTracingHeadersCertificate: jest.fn(),
}));

const { DsoLookupClient } = await import("../../../src/modules/dso/infra/dso-lookup.client.js");
const { DsoUnavailableError } = await import("../../../src/modules/dso/shared/dso-unavailable.error.js");

const BASE = "http://dso-lookup:8000";

const RESOLVED = { status: "ok", result: { ins: "57093" }, data_version: "2026.10.0" };

function ok(data: unknown): { status: number; data: unknown } {
  return { status: 200, data: { data, error_code: 0 } };
}

/** Last request the client made, for asserting the query it built. */
function lastRequest(): { url: string; params: Record<string, unknown>; timeout: number } {
  const [config] = callForResponse.mock.calls[callForResponse.mock.calls.length - 1] as [
    { url: string; params: Record<string, unknown>; timeout: number },
  ];
  return config;
}

async function rejection(promise: Promise<unknown>): Promise<InstanceType<typeof DsoUnavailableError>> {
  try {
    await promise;
  } catch (err) {
    return err as InstanceType<typeof DsoUnavailableError>;
  }
  throw new Error("expected a rejection");
}

describe("(Unit) DsoLookupClient", () => {
  let client: InstanceType<typeof DsoLookupClient>;

  beforeEach(() => {
    callForResponse.mockReset();
    client = new DsoLookupClient(BASE, 1000);
  });

  describe("requests", () => {
    beforeEach(() => {
      callForResponse.mockResolvedValue(ok(RESOLVED));
    });

    it("resolve() sends postcode, ins and section to /dso/resolve with the configured timeout", async () => {
      await client.resolve("5020", "92094", "flawinne");

      expect(lastRequest().url).toBe(`${BASE}/dso/resolve`);
      expect(lastRequest().params).toEqual({ postcode: "5020", ins: "92094", section: "flawinne" });
      expect(lastRequest().timeout).toBe(1000);
    });

    it("leaves absent and empty parameters out of the query", async () => {
      await client.resolve("5020", undefined, "");

      expect(lastRequest().params).toEqual({ postcode: "5020" });
    });

    it("resolveAddress() maps to /dso/resolve-address with nis_code and post_name", async () => {
      await client.resolveAddress("92094", "5020", "Flawinne");

      expect(lastRequest().url).toBe(`${BASE}/dso/resolve-address`);
      expect(lastRequest().params).toEqual({ nis_code: "92094", postcode: "5020", post_name: "Flawinne" });
    });

    it("eanCheck() puts the EAN in the path, encoded", async () => {
      callForResponse.mockResolvedValue(ok({ format: false, belgian_prefix: false, gs1_check: null, known_operator: null }));

      await client.eanCheck("54 1448/2");

      expect(lastRequest().url).toBe(`${BASE}/dso/ean/54%201448%2F2/check`);
    });

    it.each([".", ".."])("eanCheck(%j) answers format_invalid without a request", async (ean) => {
      // A dot segment cannot travel in a path: the URL parser (axios's too) collapses
      // `/dso/ean/./check` to `/dso/ean/check` and `/dso/ean/../check` to `/dso/check`,
      // both 404, and the check was silently dropped. Neither is 18 digits, so
      // dso-lookup's answer is known.
      expect(await client.eanCheck(ean)).toEqual({ format: false, belgian_prefix: false, gs1_check: null, known_operator: null });
      expect(callForResponse).not.toHaveBeenCalled();
    });

    it.each(["...", " .", ".5"])("eanCheck(%j) is sent: it is not a dot segment", async (ean) => {
      callForResponse.mockResolvedValue(ok({ format: false, belgian_prefix: false, gs1_check: null, known_operator: null }));

      await client.eanCheck(ean);

      expect(lastRequest().url).toBe(`${BASE}/dso/ean/${encodeURIComponent(ean)}/check`);
      expect(new URL(lastRequest().url).pathname).toMatch(/^\/dso\/ean\/[^/]+\/check$/);
    });

    it("does not double a trailing slash in the base URL", async () => {
      await new DsoLookupClient(`${BASE}/`, 1000).meta();

      expect(lastRequest().url).toBe(`${BASE}/dso/meta`);
    });
  });

  describe("envelope", () => {
    it("unwraps { data, error_code } and returns the payload", async () => {
      callForResponse.mockResolvedValue(ok(RESOLVED));

      expect(await client.resolve("5020")).toEqual(RESOLVED);
    });

    it("returns the operator list as is, order included", async () => {
      const operators = [{ id: "ores" }, { id: "elia" }];
      callForResponse.mockResolvedValue(ok(operators));

      expect(await client.operators()).toEqual(operators);
    });

    it("refuses an operator payload that is not a list", async () => {
      callForResponse.mockResolvedValue(ok({ id: "ores" }));

      const err = await rejection(client.operators());
      expect(err).toBeInstanceOf(DsoUnavailableError);
      expect(err.reason).toBe("body");
    });
  });

  describe("failures are DsoUnavailableError, never an answer", () => {
    it("a non-200 status, even with a plausible body", async () => {
      // `call()` would hand this body back as data; that is exactly the bug the
      // status check exists to prevent — a 503 must never prefill a meter.
      callForResponse.mockResolvedValue({ status: 503, data: { data: RESOLVED, error_code: 0 } });

      const err = await rejection(client.resolve("5020"));
      expect(err).toBeInstanceOf(DsoUnavailableError);
      expect(err.reason).toBe("status");
      expect(err.status).toBe(503);
    });

    it.each([
      { label: "a body without data", body: { error_code: 0 } },
      { label: "data: null", body: { data: null, error_code: 0 } },
      { label: "a bare string (an HTML error page)", body: "<html>Bad Gateway</html>" },
      { label: "no body at all", body: undefined },
    ])("$label", async ({ body }) => {
      callForResponse.mockResolvedValue({ status: 200, data: body });

      const err = await rejection(client.resolve("5020"));
      expect(err).toBeInstanceOf(DsoUnavailableError);
      expect(err.reason).toBe("body");
    });

    it("a timeout", async () => {
      callForResponse.mockRejectedValue(Object.assign(new Error("timeout of 1000ms exceeded"), { code: "ECONNABORTED" }));

      const err = await rejection(client.resolve("5020"));
      expect(err).toBeInstanceOf(DsoUnavailableError);
      expect(err.reason).toBe("timeout");
    });

    it("a refused connection", async () => {
      callForResponse.mockRejectedValue(Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" }));

      const err = await rejection(client.resolve("5020"));
      expect(err.reason).toBe("network");
    });

    it("carries neither the query nor the upstream error", async () => {
      // An axios error serialises its whole request config — params included —
      // into whatever log line catches it. The postcode, address name and EAN
      // must not reach a log through this error.
      callForResponse.mockRejectedValue(
        Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED", config: { params: { postcode: "5020", post_name: "Flawinne" } } }),
      );

      const err = await rejection(client.resolveAddress("92094", "5020", "Flawinne"));
      const serialised = JSON.stringify({ ...err, message: err.message });
      expect(serialised).not.toContain("5020");
      expect(serialised).not.toContain("Flawinne");
      expect(err.cause).toBeUndefined();
    });
  });
});
