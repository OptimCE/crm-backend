import type { SimplifyResult } from "../shared/simplify.js";

/**
 * Bounded, process-local memo for simplified commune geometry.
 *
 * Exists because the HTTP response cache is inert in every real deployment:
 * neither config/development.cjs nor config/production.cjs sets
 * `cache_service.name`, so `@Cache` is a no-op there and the simplification
 * would otherwise be recomputed on every request. Keying per NIS code rather
 * than per request also means two communities whose zones overlap share the
 * work instead of each paying for the shared communes.
 *
 * Bounded on purpose. 581 communes x 5 tolerances x tens of kB is well over a
 * hundred megabytes, and InMemoryCacheService has no eviction either — an
 * unbounded map here would be a slow leak in a long-lived process. FIFO at 64
 * entries covers a large zone comfortably.
 */
const MAX_ENTRIES = 64;

const store = new Map<string, SimplifyResult>();

function keyOf(nis_code: number, tolerance: number): string {
  return `${String(nis_code)}:${String(tolerance)}`;
}

export function getCachedGeometry(nis_code: number, tolerance: number): SimplifyResult | undefined {
  return store.get(keyOf(nis_code, tolerance));
}

export function setCachedGeometry(nis_code: number, tolerance: number, value: SimplifyResult): void {
  const key = keyOf(nis_code, tolerance);
  if (store.has(key)) {
    store.delete(key);
  } else if (store.size >= MAX_ENTRIES) {
    // Map preserves insertion order, so the first key is the oldest.
    const oldest = store.keys().next().value;
    if (oldest !== undefined) {
      store.delete(oldest);
    }
  }
  store.set(key, value);
}

/** Test seam. Reference data never changes at runtime, so nothing else clears this. */
export function clearGeometryCache(): void {
  store.clear();
}
