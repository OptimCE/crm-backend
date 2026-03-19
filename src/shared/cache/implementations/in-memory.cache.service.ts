import { ICacheService } from "../i-cache.service.js";
import { injectable } from "inversify";

@injectable()
export class InMemoryCacheService implements ICacheService {
  private readonly store = new Map<string, { value: string; expiresAt: number }>();
  private readonly defaultTtl: number;

  constructor(defaultTtl = 300) {
    this.defaultTtl = defaultTtl;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return JSON.parse(entry.value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value: JSON.stringify(value),
      expiresAt: Date.now() + (ttlSeconds ?? this.defaultTtl) * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    const regex = new RegExp("^" + pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, ".*") + "$");
    for (const key of this.store.keys()) {
      if (regex.test(key)) this.store.delete(key);
    }
  }

  clear(): void {
    this.store.clear();
  }

  keys(): string[] {
    const now = Date.now();
    const result: string[] = [];
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt >= now) {
        result.push(key);
      }
    }
    return result;
  }
}
