import { EventEmitter } from "node:events";
import type { Request, Response } from "express";
import type Redis from "ioredis";

/**
 * A Redis stand-in good enough to exercise the hub's whole surface: pub/sub
 * delivery, the ticket store's GETDEL atomicity, and the mint rate limit.
 *
 * Fakes rather than a live broker for the unit project, because what these tests
 * check is the hub's own logic — the caps, the fan-out routing, the cross-tenant
 * boundary. The two primitives a fake CANNOT prove (that `PUBLISH` reaches
 * `pmessage`, and that `GETDEL` is genuinely atomic) are exactly what the
 * end-to-end recipe in the runbook covers against real Redis.
 */
export class FakeRedis extends EventEmitter {
  readonly store = new Map<string, string>();
  readonly counters = new Map<string, number>();
  readonly published: { channel: string; payload: string }[] = [];
  readonly patterns: string[] = [];

  /** Set to make the next command reject, simulating an unreachable broker. */
  failNext = false;

  psubscribe(pattern: string): Promise<number> {
    if (this.failNext) {
      this.failNext = false;
      return Promise.reject(new Error("psubscribe failed"));
    }
    this.patterns.push(pattern);
    return Promise.resolve(this.patterns.length);
  }

  publish(channel: string, payload: string): Promise<number> {
    if (this.failNext) {
      this.failNext = false;
      return Promise.reject(new Error("publish failed"));
    }
    this.published.push({ channel, payload });
    return Promise.resolve(1);
  }

  set(key: string, value: string, _ex: string, _ttl: number, nx: string): Promise<string | null> {
    if (this.failNext) {
      this.failNext = false;
      return Promise.reject(new Error("set failed"));
    }
    if (nx === "NX" && this.store.has(key)) return Promise.resolve(null);
    this.store.set(key, value);
    return Promise.resolve("OK");
  }

  getdel(key: string): Promise<string | null> {
    if (this.failNext) {
      this.failNext = false;
      return Promise.reject(new Error("getdel failed"));
    }
    const value = this.store.get(key) ?? null;
    this.store.delete(key);
    return Promise.resolve(value);
  }

  incr(key: string): Promise<number> {
    const next = (this.counters.get(key) ?? 0) + 1;
    this.counters.set(key, next);
    return Promise.resolve(next);
  }

  expire(): Promise<number> {
    return Promise.resolve(1);
  }

  quit(): Promise<"OK"> {
    return Promise.resolve("OK");
  }

  get status(): string {
    return "ready";
  }

  /** Drive the hub's fan-out as if Redis delivered a pattern message. */
  deliver(channel: string, payload: string): void {
    this.emit("pmessage", "notify:v1:*", channel, payload);
  }

  asRedis(): Redis {
    return this as unknown as Redis;
  }
}

/** Records everything written to an SSE response and whether it was ended. */
export class FakeResponse {
  readonly frames: string[] = [];
  ended = false;
  /** Set to make write() throw, simulating a socket that died mid-fan-out. */
  throwOnWrite = false;

  write(chunk: string): boolean {
    if (this.throwOnWrite) throw new Error("EPIPE");
    this.frames.push(chunk);
    return true;
  }

  end(): void {
    this.ended = true;
  }

  /** Only the `data:` payloads, i.e. topic frames — no comments, no control events. */
  dataFrames(): string[] {
    return this.frames.filter((frame) => frame.startsWith("id: ")).map((frame) => frame.split("\ndata: ")[1]?.replace(/\n\n$/, "") ?? "");
  }

  controlEvents(): string[] {
    return this.frames.filter((frame) => frame.startsWith("event: ")).map((frame) => frame.slice("event: ".length).split("\n")[0]);
  }

  asResponse(): Response {
    return this as unknown as Response;
  }
}

/** An Express request stand-in that can fire its lifecycle events. */
export class FakeRequest extends EventEmitter {
  constructor(readonly headers: Record<string, string> = {}) {
    super();
  }

  asRequest(): Request {
    return this as unknown as Request;
  }
}
