// shared/cache/cache-key.builder.ts
import type { Request } from "express";
import { getContext } from "../../middlewares/context.js";

type Scope = "community" | "user" | "both" | "none";

/**
 * Builds a tenant-aware cache key.
 *
 * Usage:
 *   cacheKey("keys:list", "community", (req) => JSON.stringify(req.query))
 *   cacheKey("keys:detail", "both", (req) => req.params.id)
 *   cacheKey("user:profile", "user")
 */
export function cacheKey(prefix: string, scope: Scope, suffix?: (req: Request) => string): (req: Request) => string {
  return (req: Request) => {
    const { community_id, user_id } = getContext();
    const parts = [prefix];

    if ((scope === "community" || scope === "both") && community_id) {
      parts.push(`c:${community_id}`);
    }
    if ((scope === "user" || scope === "both") && user_id) {
      parts.push(`u:${user_id}`);
    }

    if (suffix) {
      parts.push(suffix(req));
    }

    return parts.join(":");
  };
}

/**
 * Builds a wildcard pattern for invalidation.
 *
 * Usage:
 *   cachePattern("keys", "community")  → "keys:c:<community_id>:*"
 */
export function cachePattern(prefix: string, scope: Scope): (req: Request) => string {
  return (_req: Request) => {
    const { community_id, user_id } = getContext();
    const parts = [prefix];

    if ((scope === "community" || scope === "both") && community_id) {
      parts.push(`c:${community_id}`);
    }
    if ((scope === "user" || scope === "both") && user_id) {
      parts.push(`u:${user_id}`);
    }

    parts.push("*");
    return parts.join(":");
  };
}
