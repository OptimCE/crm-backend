import { describe, expect, it } from "@jest/globals";
import { buildDedupeKey, canonicalJson, typePrefixOf } from "../../../src/modules/notifications/shared/notification.dedupe.js";
import { NotificationChannel } from "../../../src/modules/notifications/shared/notification.types.js";

describe("(Unit) canonicalJson", () => {
  it("sorts object keys recursively so key order cannot change the digest", () => {
    // The whole idempotency scheme hashes this string. If key order leaked
    // through, the same logical message would enqueue twice depending on how a
    // producer happened to build its payload literal.
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
    expect(canonicalJson({ a: { c: 3, d: 2 }, b: 1 })).toBe('{"a":{"c":3,"d":2},"b":1}');
  });

  it("preserves array order, which is part of the value", () => {
    expect(canonicalJson({ xs: [2, 1] })).toBe('{"xs":[2,1]}');
    expect(canonicalJson({ xs: [1, 2] })).not.toBe(canonicalJson({ xs: [2, 1] }));
  });

  it("emits no whitespace", () => {
    expect(canonicalJson({ a: 1, b: "x" })).not.toMatch(/\s/);
  });
});

describe("(Unit) buildDedupeKey", () => {
  const base = { channel: NotificationChannel.EMAIL, type: "invoice.issued", data: { invoice_id: 1 } };

  it("is stable for the same (channel, type, recipient, data)", () => {
    expect(buildDedupeKey({ ...base, userId: 4 })).toBe(buildDedupeKey({ ...base, userId: 4 }));
  });

  it("separates recipients, payloads and channels", () => {
    const forUser4 = buildDedupeKey({ ...base, userId: 4 });
    expect(forUser4).not.toBe(buildDedupeKey({ ...base, userId: 5 }));
    expect(forUser4).not.toBe(buildDedupeKey({ ...base, userId: 4, data: { invoice_id: 2 } }));
    // The table's grain is (message, channel, recipient), so the same
    // notification delivered over two channels must be two rows.
    expect(forUser4).not.toBe(buildDedupeKey({ ...base, channel: NotificationChannel.INAPP, userId: 4 }));
  });

  it("namespaces account-less recipients apart from user ids", () => {
    const byAddress = buildDedupeKey({ ...base, recipient: "nobody@nowhere.test" });
    expect(byAddress).toMatch(/^2:invoice\.issued:a[0-9a-f]{16}:[0-9a-f]{32}$/);
    // `u` vs `a` is what stops user 4 and some address from ever colliding.
    expect(byAddress).not.toBe(buildDedupeKey({ ...base, userId: 4 }));
  });

  it("normalises the address case, because providers report bounces in any case", () => {
    expect(buildDedupeKey({ ...base, recipient: "Nobody@Nowhere.test" })).toBe(buildDedupeKey({ ...base, recipient: "nobody@nowhere.test " }));
  });

  it("fits VARCHAR(200) at the maximum type length", () => {
    // type varchar(128) + channel + "u" + a 10-digit id + separators + 32 hex.
    const key = buildDedupeKey({ ...base, type: "x".repeat(128), userId: 2147483647 });
    expect(key.length).toBeLessThanOrEqual(200);
  });

  it("lets an explicit key win, so a re-running sweep can express an occurrence", () => {
    const key = buildDedupeKey({ ...base, userId: 4, override: "admin_deadline.due_soon:deadline-91:2026-08-14" });
    expect(key).toBe("admin_deadline.due_soon:deadline-91:2026-08-14");
  });
});

describe("(Unit) typePrefixOf", () => {
  it("returns the first dot-segment", () => {
    expect(typePrefixOf("invoice.issued")).toBe("invoice");
    expect(typePrefixOf("admin_deadline.due_soon")).toBe("admin_deadline");
  });

  it("degrades to the whole string on a malformed key, matching no preference row", () => {
    expect(typePrefixOf("malformed")).toBe("malformed");
  });
});
