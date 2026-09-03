import { describe, expect, it } from "@jest/globals";
import { AddressGeoPrecision } from "../../../src/shared/address/address.types.js";
import { extractGeoJsonPoint, isPlausibleBelgianPoint, precisionFromLabel, round6 } from "../../../src/modules/geocoding/infra/geocode.parsing.js";

describe("(Unit) isPlausibleBelgianPoint", () => {
  it("accepts a point in Brussels", () => {
    expect(isPlausibleBelgianPoint(50.8467, 4.3525)).toBe(true);
  });

  it("rejects Lambert 72 coordinates", () => {
    // The failure this guard exists for: geoservices.wallonie.be defaults to
    // EPSG:31370, whose values are perfectly valid numbers that plot in the
    // Arctic. Nothing downstream would raise.
    expect(isPlausibleBelgianPoint(148000, 170000)).toBe(false);
  });

  it("rejects a swapped lat/lng pair", () => {
    expect(isPlausibleBelgianPoint(4.3525, 50.8467)).toBe(false);
  });

  it("rejects NaN", () => {
    expect(isPlausibleBelgianPoint(Number.NaN, 4.35)).toBe(false);
  });
});

describe("(Unit) extractGeoJsonPoint", () => {
  it("reads a FeatureCollection", () => {
    const payload = { features: [{ geometry: { type: "Point", coordinates: [4.3525, 50.8467] } }] };

    expect(extractGeoJsonPoint(payload)).toEqual({ latitude: 50.8467, longitude: 4.3525 });
  });

  it("reads a bare Feature", () => {
    const payload = { geometry: { type: "Point", coordinates: [4.3525, 50.8467] } };

    expect(extractGeoJsonPoint(payload)).toEqual({ latitude: 50.8467, longitude: 4.3525 });
  });

  it("reads a `result` envelope", () => {
    const payload = { result: [{ geometry: { coordinates: [4.3525, 50.8467] } }] };

    expect(extractGeoJsonPoint(payload)).toEqual({ latitude: 50.8467, longitude: 4.3525 });
  });

  it("takes coordinates as [longitude, latitude], not the reverse", () => {
    const point = extractGeoJsonPoint({ geometry: { coordinates: [4.3525, 50.8467] } });

    expect(point?.latitude).toBeGreaterThan(point?.longitude ?? 0);
  });

  it("returns null rather than throwing on an empty or malformed payload", () => {
    expect(extractGeoJsonPoint({ features: [] })).toBeNull();
    expect(extractGeoJsonPoint({ geometry: { coordinates: [4.35] } })).toBeNull();
    expect(extractGeoJsonPoint({ geometry: { coordinates: ["a", "b"] } })).toBeNull();
    expect(extractGeoJsonPoint(null)).toBeNull();
    expect(extractGeoJsonPoint("not json")).toBeNull();
  });
});

describe("(Unit) precisionFromLabel", () => {
  it("recognises house-number matches as ROOFTOP", () => {
    expect(precisionFromLabel("HouseNumber")).toBe(AddressGeoPrecision.ROOFTOP);
    expect(precisionFromLabel("huisnummer")).toBe(AddressGeoPrecision.ROOFTOP);
  });

  it("recognises municipality matches", () => {
    expect(precisionFromLabel("gemeente")).toBe(AddressGeoPrecision.MUNICIPALITY);
  });

  it("understates to STREET when the label is missing or unknown", () => {
    // Understating is the safe direction: it leaves the row eligible for a
    // better match and renders the pin as approximate. Overstating would freeze
    // a street-level guess as a rooftop.
    expect(precisionFromLabel(null)).toBe(AddressGeoPrecision.STREET);
    expect(precisionFromLabel("")).toBe(AddressGeoPrecision.STREET);
    expect(precisionFromLabel("score-7")).toBe(AddressGeoPrecision.STREET);
  });
});

describe("(Unit) round6", () => {
  it("keeps six decimals, which is about 11 cm", () => {
    expect(round6(50.82897835425936)).toBe(50.828978);
  });
});
