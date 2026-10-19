import { describe, expect, it } from "@jest/globals";
import { container } from "../../../src/container/di-container.js";
import { initializeDsoLookup } from "../../../src/container/factory/dso.factory.js";
import { DSO_LOOKUP_CLIENT_TOKEN } from "../../../src/modules/dso/domain/i-dso-lookup.client.js";

describe("(Unit) initializeDsoLookup without a URL", () => {
  it("binds nothing and does not throw — the feature is simply off", () => {
    // config/test.cjs has no dso_lookup key, exactly like a deployment that
    // leaves DSO_LOOKUP_URL empty: GET /dso/resolve then answers "unavailable".
    expect(() => initializeDsoLookup()).not.toThrow();

    expect(container.isBound(DSO_LOOKUP_CLIENT_TOKEN)).toBe(false);
  });
});
