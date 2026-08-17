import config from "config";
import { container } from "../di-container.js";
import type { IRealtimeHub } from "../../shared/realtime/i-realtime.hub.js";
import { RedisRealtimeHub } from "../../shared/realtime/redis.realtime.hub.js";
import logger from "../../shared/monitor/logger.js";

/**
 * Bind the realtime hub, or bind nothing at all.
 *
 * Shaped like `cache.factory.ts` — including its "no binding, no error" contract
 * — with one deliberate divergence: this NEVER throws. `initializeCacheService`
 * throws on a missing url, which is defensible for a cache; realtime must always
 * degrade to polling rather than break boot, so a misconfiguration here is a log
 * line and nothing more.
 *
 * A SEPARATE config key from `cache_service` on purpose. Pointing `cache_service`
 * at this same Redis would also switch on the dormant HTTP response cache across
 * every `@Cache` site — none of which has ever run in a deployment, and several
 * of whose keys collapse across tenants when the scope header is absent
 * (`cache-key.builder.ts`). A realtime rollout must not carry a cache change
 * with it: they would fail together and be indistinguishable.
 *
 * MUST be called at the END of `binding.ts`. The eager `container.get()` below
 * opens the Redis subscription before the first client can attach, and resolving
 * a class early is only safe because `RedisRealtimeHub` has no `@inject`ed
 * dependencies — if it ever gains one that is bound further down, this call
 * becomes a hard boot failure with no `try` around it.
 */
export function initializeRealtimeHub(): void {
  const enabled: boolean = config.has("realtime.enabled") ? config.get("realtime.enabled") : false;
  const url: string = config.has("realtime.redis_url") ? config.get("realtime.redis_url") : "";

  if (!enabled || !url) {
    logger.info({ operation: "initializeRealtimeHub" }, "Realtime disabled — clients stay on polling");
    return; // No binding, no error. Consumers isBound-guard.
  }

  // inSingletonScope is NOT optional. Inversify's default transient scope would
  // open a fresh pair of Redis connections and a fresh fan-out map per
  // injection, and the bug would present as "events arrive sometimes".
  container.bind<IRealtimeHub>("RealtimeHub").to(RedisRealtimeHub).inSingletonScope();
  container.get<IRealtimeHub>("RealtimeHub");
}
