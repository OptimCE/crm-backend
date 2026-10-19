import { afterAll, afterEach, describe, expect, it, jest } from "@jest/globals";

/**
 * config/test.cjs has no `dso_lookup` key — the factory never runs under
 * NODE_ENV=test in the app — so the configured case is fed through NODE_CONFIG,
 * which node-config reads when this file's own module registry first loads it.
 * Every src import below is therefore dynamic, and the variable is restored
 * before any other suite could see it.
 */
const previousNodeConfig = process.env.NODE_CONFIG;
process.env.NODE_CONFIG = JSON.stringify({ dso_lookup: { base_url: "http://dso-lookup:8000/", timeout_ms: 1234 } });

const callForResponse = jest.fn<(...args: unknown[]) => Promise<{ status: number; data: unknown }>>();
jest.unstable_mockModule("../../../src/shared/services/api_call.js", () => ({
  call: jest.fn(),
  callForStatus: jest.fn(),
  callForResponse,
  callWithTracingHeaders: jest.fn(),
  callWithTracingHeadersCertificate: jest.fn(),
}));

const { default: config } = await import("config");
const { container } = await import("../../../src/container/di-container.js");
const { initializeDsoLookup } = await import("../../../src/container/factory/dso.factory.js");
const { DSO_LOOKUP_CLIENT_TOKEN } = await import("../../../src/modules/dso/domain/i-dso-lookup.client.js");
const { DsoLookupClient } = await import("../../../src/modules/dso/infra/dso-lookup.client.js");

afterEach(async () => {
  if (container.isBound(DSO_LOOKUP_CLIENT_TOKEN)) {
    await container.unbind(DSO_LOOKUP_CLIENT_TOKEN);
  }
});

afterAll(() => {
  if (previousNodeConfig === undefined) {
    delete process.env.NODE_CONFIG;
  } else {
    process.env.NODE_CONFIG = previousNodeConfig;
  }
});

/** Lets the fire-and-forget /dso/meta call settle. */
async function flush(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

describe("(Unit) initializeDsoLookup", () => {
  it("reads the configured URL (sanity check of the NODE_CONFIG override)", () => {
    expect(config.get("dso_lookup.base_url")).toBe("http://dso-lookup:8000/");
  });

  it("binds a client and logs the data release in the background", async () => {
    callForResponse.mockResolvedValue({
      status: 200,
      data: { data: { data_version: "2026.10.0", version_date: "2026-10-12", communes: 565 }, error_code: 0 },
    });

    initializeDsoLookup();
    await flush();

    expect(container.isBound(DSO_LOOKUP_CLIENT_TOKEN)).toBe(true);
    expect(container.get(DSO_LOOKUP_CLIENT_TOKEN)).toBeInstanceOf(DsoLookupClient);
    const [request] = callForResponse.mock.calls[0] as [{ url: string; timeout: number }];
    expect(request.url).toBe("http://dso-lookup:8000/dso/meta");
    expect(request.timeout).toBe(1234);
  });

  it("still binds, and does not throw, when dso-lookup is not up at boot", async () => {
    // There is no depends_on: dso-lookup may start after crm-backend.
    callForResponse.mockRejectedValue(Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" }));

    expect(() => initializeDsoLookup()).not.toThrow();
    await flush();

    expect(container.isBound(DSO_LOOKUP_CLIENT_TOKEN)).toBe(true);
  });

  it("does not throw when dso-lookup answers garbage at boot", async () => {
    callForResponse.mockResolvedValue({ status: 503, data: "" });

    expect(() => initializeDsoLookup()).not.toThrow();
    await flush();

    expect(container.isBound(DSO_LOOKUP_CLIENT_TOKEN)).toBe(true);
  });
});
