import { describe, expect, it, jest } from "@jest/globals";
import { AddressGeoPrecision } from "../../../src/shared/address/address.types.js";
import { CompositeGeocoder } from "../../../src/modules/geocoding/infra/composite.geocoder.js";
import { ManualGeocoder } from "../../../src/modules/geocoding/infra/manual.geocoder.js";
import type { IGeocoder } from "../../../src/modules/geocoding/domain/i-geocoder.js";
import type { GeocodeRequest, GeocodeResult } from "../../../src/modules/geocoding/domain/geocoding.types.js";

const request: GeocodeRequest = { street: "Main St", number: 1, postcode: "1000", city: "Bruxelles" };

function stub(id: string, result: GeocodeResult | null, options: { supports?: boolean; throws?: boolean } = {}): IGeocoder {
  return {
    id,
    supports: jest.fn(async () => options.supports ?? true),
    geocode: jest.fn(async () => {
      if (options.throws) throw new Error(`${id} exploded`);
      return result;
    }),
  } as unknown as IGeocoder;
}

const point = (precision: AddressGeoPrecision, source: string): GeocodeResult => ({
  latitude: 50.85,
  longitude: 4.35,
  precision,
  source,
});

describe("(Unit) CompositeGeocoder", () => {
  it("returns the first result good enough to stop at", async () => {
    const rooftop = stub("a", point(AddressGeoPrecision.ROOFTOP, "a"));
    const centroid = stub("b", point(AddressGeoPrecision.MUNICIPALITY, "b"));

    const result = await new CompositeGeocoder([rooftop, centroid], AddressGeoPrecision.ROOFTOP).geocode(request);

    expect(result?.source).toBe("a");
    expect(centroid.geocode).not.toHaveBeenCalled();
  });

  it("keeps the best precision when no adapter meets the threshold", async () => {
    const street = stub("a", point(AddressGeoPrecision.STREET, "a"));
    const centroid = stub("b", point(AddressGeoPrecision.MUNICIPALITY, "b"));

    // ROOFTOP is never reached, so both run and the better (lower) wins.
    const result = await new CompositeGeocoder([centroid, street], AddressGeoPrecision.ROOFTOP).geocode(request);

    expect(result?.precision).toBe(AddressGeoPrecision.STREET);
    expect(result?.source).toBe("a");
  });

  it("skips an adapter that throws instead of failing the chain", async () => {
    const broken = stub("boom", null, { throws: true });
    const centroid = stub("b", point(AddressGeoPrecision.MUNICIPALITY, "b"));

    const result = await new CompositeGeocoder([broken, centroid], AddressGeoPrecision.MUNICIPALITY).geocode(request);

    expect(result?.source).toBe("b");
  });

  it("does not call geocode on an adapter that declines to support the request", async () => {
    const wrongRegion = stub("wallonia", point(AddressGeoPrecision.ROOFTOP, "wallonia"), { supports: false });
    const centroid = stub("b", point(AddressGeoPrecision.MUNICIPALITY, "b"));

    const result = await new CompositeGeocoder([wrongRegion, centroid], AddressGeoPrecision.MUNICIPALITY).geocode(request);

    expect(wrongRegion.geocode).not.toHaveBeenCalled();
    expect(result?.source).toBe("b");
  });

  it("survives an adapter whose supports() throws", async () => {
    const broken = {
      id: "broken",
      supports: jest.fn(async () => {
        throw new Error("db down");
      }),
      geocode: jest.fn(),
    } as unknown as IGeocoder;
    const centroid = stub("b", point(AddressGeoPrecision.MUNICIPALITY, "b"));

    const result = await new CompositeGeocoder([broken, centroid], AddressGeoPrecision.MUNICIPALITY).geocode(request);

    expect(result?.source).toBe("b");
  });

  it("returns null when nothing matches", async () => {
    const result = await new CompositeGeocoder([stub("a", null), stub("b", null)], AddressGeoPrecision.ROOFTOP).geocode(request);

    expect(result).toBeNull();
  });

  it("lets a hand-placed pin win outright", async () => {
    const rooftop = stub("service", point(AddressGeoPrecision.ROOFTOP, "service"));
    const chain = new CompositeGeocoder([new ManualGeocoder(), rooftop], AddressGeoPrecision.MUNICIPALITY);

    const result = await chain.geocode({ ...request, latitude: 50.1234, longitude: 4.1234 });

    expect(result).toEqual({
      latitude: 50.1234,
      longitude: 4.1234,
      precision: AddressGeoPrecision.MANUAL,
      source: "manual",
    });
    expect(rooftop.geocode).not.toHaveBeenCalled();
  });

  it("ignores a half-set pin", async () => {
    const chain = new CompositeGeocoder([new ManualGeocoder()], AddressGeoPrecision.MUNICIPALITY);

    expect(await chain.geocode({ ...request, latitude: 50.1234 })).toBeNull();
    expect(await chain.geocode({ ...request, latitude: Number.NaN, longitude: 4.12 })).toBeNull();
  });
});
