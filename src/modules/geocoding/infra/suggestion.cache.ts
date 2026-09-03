import type { AddressSuggestion } from "../domain/address-suggestion.types.js";

/**
 * Bounded, process-local memo for address suggestions.
 *
 * Same reasoning as `municipalities/infra/municipality.geometry.cache.ts`: the
 * HTTP response cache is inert in every real deployment (neither
 * config/development.cjs nor config/production.cjs sets `cache_service.name`,
 * so `@Cache` is a no-op), and an unbounded map in a long-lived process is a
 * slow leak because InMemoryCacheService has no eviction either.
 *
 * It matters more here than there. A picker fires one request per keystroke
 * after a 250 ms debounce, so typing an address produces a burst of queries
 * whose prefixes repeat constantly — and backspacing replays them exactly. On
 * the REMOTE path those are calls to free public services, which is precisely
 * the traffic pattern the geocoding backfill was made sequential to avoid.
 *
 * A TTL is deliberately short rather than absent: the register only changes
 * when the image is re-pulled, but a stale entry from a provider that was
 * briefly down should not outlive the outage.
 */
const MAX_ENTRIES = 256;
const TTL_MS = 5 * 60 * 1000;

interface Entry {
  value: AddressSuggestion[];
  expires: number;
}

const store = new Map<string, Entry>();

export function suggestionCacheKey(query: string, limit: number, lang: string): string {
  return `${lang}:${String(limit)}:${query.trim().toLowerCase()}`;
}

export function getCachedSuggestions(key: string): AddressSuggestion[] | undefined {
  const hit = store.get(key);
  if (!hit) {
    return undefined;
  }
  if (hit.expires <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return hit.value;
}

export function setCachedSuggestions(key: string, value: AddressSuggestion[]): void {
  if (store.has(key)) {
    store.delete(key);
  } else if (store.size >= MAX_ENTRIES) {
    // Map preserves insertion order, so the first key is the oldest.
    const oldest = store.keys().next().value;
    if (oldest !== undefined) {
      store.delete(oldest);
    }
  }
  store.set(key, { value, expires: Date.now() + TTL_MS });
}

/** Test seam. */
export function clearSuggestionCache(): void {
  store.clear();
}
