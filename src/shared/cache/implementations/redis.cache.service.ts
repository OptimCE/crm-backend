import { Redis } from "ioredis";
import { ICacheService } from "../i-cache.service.js";
import config from "config";
import { injectable } from "inversify";

@injectable()
export class RedisCacheService implements ICacheService {
  private readonly redis: Redis;
  private readonly defaultTtl: number;

  constructor() {
    const settings: { url: string; defaultTtl?: number } = config.get("cache_service.settings");
    this.redis = new Redis(settings.url);
    this.defaultTtl = settings.defaultTtl ?? 300;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds ?? this.defaultTtl);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;
      if (keys.length > 0) await this.redis.del(...keys);
    } while (cursor !== "0");
  }

  async clear(): Promise<void> {
    await this.redis.flushall();
  }

  async keys(pattern = "*"): Promise<string[]> {
    const result: string[] = [];
    let cursor = "0";
    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;
      result.push(...keys);
    } while (cursor !== "0");
    return result;
  }
}
