import { afterEach, describe, expect, it, jest } from "@jest/globals";
import type { AddressSuggestion } from "../../../src/modules/geocoding/domain/address-suggestion.types.js";
import {
  clearSuggestionCache,
  getCachedSuggestions,
  setCachedSuggestions,
  suggestionCacheKey,
} from "../../../src/modules/geocoding/infra/suggestion.cache.js";

function row(id: string): AddressSuggestion {
  return { id, kind: "street", label: id, street: id, postcode: "1000", city: "Bruxelles", country: "BE" };
}

describe("(Unit) suggestion cache", () => {
  afterEach(() => {
    clearSuggestionCache();
    jest.useRealTimers();
  });

  it("keys on query, limit and language together", () => {
    // Language changes the label ("Anvers" vs "Antwerpen"), so it cannot share
    // an entry; limit changes how many rows are in it.
    const a = suggestionCacheKey("meir", 8, "fr");
    expect(a).not.toBe(suggestionCacheKey("meir", 8, "nl"));
    expect(a).not.toBe(suggestionCacheKey("meir", 5, "fr"));
  });

  it("ignores case and surrounding whitespace in the query", () => {
    // Typing produces a burst of near-identical prefixes; backspacing replays
    // them exactly. Folding these together is most of the value.
    expect(suggestionCacheKey("  Rue De La Loi ", 8, "fr")).toBe(suggestionCacheKey("rue de la loi", 8, "fr"));
  });

  it("returns what was stored", () => {
    const key = suggestionCacheKey("rue", 8, "fr");
    setCachedSuggestions(key, [row("a")]);
    expect(getCachedSuggestions(key)).toEqual([row("a")]);
  });

  it("misses on an unknown key", () => {
    expect(getCachedSuggestions(suggestionCacheKey("nope", 8, "fr"))).toBeUndefined();
  });

  it("expires an entry rather than serving it forever", () => {
    // The register only changes when the image is re-pulled, but an empty
    // result cached while a provider was briefly down must not outlive the
    // outage.
    jest.useFakeTimers();
    const key = suggestionCacheKey("rue", 8, "fr");
    setCachedSuggestions(key, [row("a")]);
    expect(getCachedSuggestions(key)).toHaveLength(1);

    jest.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(getCachedSuggestions(key)).toBeUndefined();
  });

  it("evicts oldest-first and stays bounded", () => {
    // InMemoryCacheService has no eviction either, so an unbounded map here
    // would be a slow leak in a long-lived process.
    for (let i = 0; i < 300; i++) {
      setCachedSuggestions(suggestionCacheKey(`q${String(i)}`, 8, "fr"), [row(String(i))]);
    }
    // The first 44 are gone (300 inserts, 256 kept); the last is still there.
    expect(getCachedSuggestions(suggestionCacheKey("q0", 8, "fr"))).toBeUndefined();
    expect(getCachedSuggestions(suggestionCacheKey("q299", 8, "fr"))).toHaveLength(1);
  });

  it("re-setting a key refreshes its position instead of duplicating it", () => {
    const key = suggestionCacheKey("keep", 8, "fr");
    setCachedSuggestions(key, [row("first")]);
    for (let i = 0; i < 255; i++) {
      setCachedSuggestions(suggestionCacheKey(`filler${String(i)}`, 8, "fr"), [row(String(i))]);
    }
    // Touching it again moves it to the newest slot, so the next inserts evict
    // the fillers rather than this entry.
    setCachedSuggestions(key, [row("second")]);
    for (let i = 0; i < 10; i++) {
      setCachedSuggestions(suggestionCacheKey(`more${String(i)}`, 8, "fr"), [row(String(i))]);
    }
    expect(getCachedSuggestions(key)).toEqual([row("second")]);
  });
});
