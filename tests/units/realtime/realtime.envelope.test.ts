import { describe, expect, it } from "@jest/globals";
import {
  buildEnvelope,
  MAX_ENVELOPE_BYTES,
  parseEnvelope,
} from "../../../src/shared/realtime/realtime.envelope.js";
import { REALTIME_TOPICS } from "../../../src/shared/realtime/realtime.topics.js";

const valid = {
  topic: REALTIME_TOPICS.GENERATION_FINISHED,
  ref: { kind: "generation", id: "418" },
  scope: { community_id: 12 },
  hint: { status: "success" },
};

describe("(Unit) buildEnvelope", () => {
  it("stamps v/id/at and normalises ref ids to strings", () => {
    const envelope = buildEnvelope(valid);
    expect(envelope).not.toBeNull();
    expect(envelope?.v).toBe(1);
    expect(envelope?.id).toMatch(/^[0-9a-f]{16}$/);
    expect(envelope?.ref.id).toBe("418");
    expect(Date.parse(envelope?.at ?? "")).not.toBeNaN();
  });

  it("returns null instead of throwing on a bad input", () => {
    // Every caller is a fire-and-forget side effect running after a commit. An
    // exception here would travel up through a commit path, which is exactly
    // what the whole after-commit design exists to prevent.
    expect(buildEnvelope({ ...valid, topic: "not.a.topic" as never })).toBeNull();
    expect(buildEnvelope({ ...valid, ref: { kind: "", id: "1" } })).toBeNull();
    expect(buildEnvelope({ ...valid, hint: { nested: { a: 1 } } as never })).toBeNull();
  });

  it("rejects an oversize envelope rather than truncating it", () => {
    expect(buildEnvelope({ ...valid, hint: { blob: "x".repeat(MAX_ENVELOPE_BYTES) } })).toBeNull();
  });
});

describe("(Unit) parseEnvelope", () => {
  const serialize = (over: Record<string, unknown> = {}): string =>
    JSON.stringify({ ...buildEnvelope(valid), ...over });

  it("accepts what buildEnvelope produced", () => {
    expect(parseEnvelope(serialize())).not.toBeNull();
  });

  it("rejects anything a compromised publisher could inject", () => {
    // These bytes come from ANY process holding the Redis password and are
    // forwarded verbatim into a browser, so this is the only thing standing
    // between a compromised annexe and every connected SSE client.
    expect(parseEnvelope("not json")).toBeNull();
    expect(parseEnvelope("null")).toBeNull();
    expect(parseEnvelope(serialize({ v: 2 }))).toBeNull();
    expect(parseEnvelope(serialize({ topic: "arbitrary.topic" }))).toBeNull();
    expect(parseEnvelope(serialize({ hint: { nested: { a: 1 } } }))).toBeNull();
    expect(parseEnvelope(serialize({ hint: ["not", "a", "map"] }))).toBeNull();
    expect(parseEnvelope(serialize({ ref: { kind: "x" } }))).toBeNull();
    expect(parseEnvelope(serialize({ scope: { community_id: "12" } }))).toBeNull();
  });

  it("measures the size cap in BYTES, not UTF-16 code units", () => {
    // A multi-byte payload under the character limit but over the byte limit is
    // the exact hole `.length` would leave: roughly 4x the intended ceiling.
    const wide = "\u{1F600}".repeat(300); // 4 bytes each, 2 code units each
    const oversize = JSON.stringify({ ...buildEnvelope(valid), hint: { blob: wide } });
    expect(oversize.length).toBeLessThan(MAX_ENVELOPE_BYTES * 2);
    expect(Buffer.byteLength(oversize, "utf8")).toBeGreaterThan(MAX_ENVELOPE_BYTES);
    expect(parseEnvelope(oversize)).toBeNull();
  });
});
