import type { Request, Response, NextFunction } from "express";
import type { ICacheService } from "../i-cache.service.js";
import { container } from "../../../container/di-container.js";
import logger from "../../monitor/logger.js";

type CacheKeyBuilder = (req: Request) => string;

function getCacheService(): ICacheService | null {
  try {
    return container.isBound("CacheService") ? container.get<ICacheService>("CacheService") : null;
  } catch {
    return null;
  }
}

export function Cache(keyBuilder: CacheKeyBuilder, ttlSeconds?: number) {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
      const cache = getCacheService();
      if (!cache) {
        return originalMethod.call(this, req, res, next);
      }

      const key = keyBuilder(req);

      try {
        const cached = await cache.get<{ status: number; body: unknown }>(key);
        if (cached) {
          logger.info({ operation: "cache_hit" }, `Cache hit for ${key}`);
          res.status(cached.status).json(cached.body);
          return;
        }
      } catch {
        // Cache read failed — proceed without cache
        return originalMethod.call(this, req, res, next);
      }

      const originalJson = res.json.bind(res);
      res.json = (body: unknown): Response => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(key, { status: res.statusCode, body }, ttlSeconds).catch(() => {});
          logger.info({ operation: "cache_set" }, `Cache set for ${key}`);
        }
        return originalJson(body);
      };

      return originalMethod.call(this, req, res, next);
    };

    return descriptor;
  };
}

export function InvalidateCache(keyBuilders: CacheKeyBuilder[]) {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
      const cache = getCacheService();
      if (!cache) {
        return originalMethod.call(this, req, res, next);
      }

      const originalJson = res.json.bind(res);
      res.json = (body: unknown): Response => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          Promise.all(
            keyBuilders.map((kb) => {
              const pattern = kb(req);
              return pattern.includes("*") ? cache.delByPattern(pattern) : cache.del(pattern);
            }),
          ).catch(() => {});
          logger.info({ operation: "invalidate_cache" }, `Cache has been invalidated`);
        }
        return originalJson(body);
      };

      return originalMethod.call(this, req, res, next);
    };

    return descriptor;
  };
}
