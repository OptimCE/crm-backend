import config from "config";
import { container } from "../di-container.js";
import type { ICacheService } from "../../shared/cache/i-cache.service.js";
import logger from "../../shared/monitor/logger.js";
import { RedisCacheService } from "../../shared/cache/implementations/redis.cache.service.js";
import { InMemoryCacheService } from "../../shared/cache/implementations/in-memory.cache.service.js";

export function initializeCacheService(): void {
  const cacheName: string | null = config.has("cache_service.name") ? config.get("cache_service.name") : null;

  if (!cacheName) {
    logger.info("No cache_service.name configured — caching disabled");
    return; // No binding, no error
  }

  switch (cacheName.toUpperCase()) {
    case "REDIS": {
      const settings: { url: string; defaultTtl?: number } = config.get("cache_service.settings");
      if (!settings?.url) {
        throw new Error("Missing cache_service.settings.url for Redis");
      }
      container.bind<ICacheService>("CacheService").to(RedisCacheService);
      break;
    }
    case "MEMORY": {
      container.bind<ICacheService>("CacheService").to(InMemoryCacheService);
      break;
    }
    default:
      throw new Error(`Unknown cache service name: ${cacheName}`);
  }
}
