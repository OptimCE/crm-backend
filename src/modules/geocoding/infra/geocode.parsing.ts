import { AddressGeoPrecision } from "../../../shared/address/address.types.js";

/**
 * Belgium's bounding box, generously padded.
 *
 * Every adapter runs its candidate through {@link isPlausibleBelgianPoint}
 * before returning it. The failure this catches is silent and expensive: a
 * service that ignores an unsupported CRS parameter answers in Lambert 72,
 * whose values (roughly x 20 000-300 000, y 20 000-250 000) are perfectly
 * valid numbers that place the point in the Arctic. There is no error to catch,
 * only a map full of pins in the wrong hemisphere.
 */
const BELGIUM_BOUNDS = { min_lat: 49.4, max_lat: 51.6, min_lng: 2.4, max_lng: 6.5 };

export function isPlausibleBelgianPoint(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= BELGIUM_BOUNDS.min_lat &&
    latitude <= BELGIUM_BOUNDS.max_lat &&
    longitude >= BELGIUM_BOUNDS.min_lng &&
    longitude <= BELGIUM_BOUNDS.max_lng
  );
}

export function round6(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

/**
 * Pulls `[longitude, latitude]` out of a GeoJSON-shaped response.
 *
 * Written defensively on purpose. Both upstream services are documented as
 * returning GeoJSON, but neither contract is pinned by a test we control, and a
 * shape change upstream must degrade to "no match" rather than throw on the
 * backfill path.
 */
export function extractGeoJsonPoint(payload: unknown): { latitude: number; longitude: number } | null {
  const feature = firstFeature(payload);
  const coordinates = asRecord(feature)?.["geometry"];
  const pair = asRecord(coordinates)?.["coordinates"];

  if (!Array.isArray(pair) || pair.length < 2) {
    return null;
  }
  const longitude = Number(pair[0]);
  const latitude = Number(pair[1]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return { latitude, longitude };
}

/** Unwraps the common envelopes: FeatureCollection, `{ result: [] }`, bare Feature. */
function firstFeature(payload: unknown): unknown {
  const record = asRecord(payload);
  if (!record) {
    return null;
  }
  for (const key of ["features", "result", "results", "items"]) {
    const collection = record[key];
    if (Array.isArray(collection)) {
      return collection.length > 0 ? collection[0] : null;
    }
  }
  return record["geometry"] ? record : null;
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

/**
 * Maps an upstream match-quality label onto our precision scale.
 *
 * Defaults to {@link AddressGeoPrecision.STREET} when the label is missing or
 * unrecognised. Understating precision is the safe direction: it leaves the row
 * eligible for a later, better match and renders the pin as approximate, where
 * overstating would freeze a street-level guess as a rooftop.
 */
export function precisionFromLabel(label: string | null | undefined): AddressGeoPrecision {
  if (!label) {
    return AddressGeoPrecision.STREET;
  }
  const normalized = label.toLowerCase();
  if (normalized.includes("house") || normalized.includes("number") || normalized.includes("nummer") || normalized.includes("numero")) {
    return AddressGeoPrecision.ROOFTOP;
  }
  if (normalized.includes("street") || normalized.includes("straat") || normalized.includes("rue")) {
    return AddressGeoPrecision.STREET;
  }
  if (normalized.includes("municipal") || normalized.includes("gemeente") || normalized.includes("commune")) {
    return AddressGeoPrecision.MUNICIPALITY;
  }
  return AddressGeoPrecision.STREET;
}
