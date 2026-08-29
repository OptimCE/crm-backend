import { describe, expect, it, jest } from "@jest/globals";
import { AddressGeoPrecision } from "../../../src/shared/address/address.types.js";
import { MunicipalityCentroidGeocoder } from "../../../src/modules/geocoding/infra/municipality-centroid.geocoder.js";
import type { IMunicipalityRepository } from "../../../src/modules/municipalities/domain/i-municipality.repository.js";
import type { Municipality } from "../../../src/modules/municipalities/domain/municipality.models.js";
import type { GeocodeRequest } from "../../../src/modules/geocoding/domain/geocoding.types.js";

function municipality(nis_code: number, fr_name: string, lng: number, lat: number, nl_name: string | null = null): Municipality {
  return {
    nis_code,
    fr_name,
    nl_name,
    de_name: null,
    region_fr: "Region de Bruxelles-Capitale",
    region_nl: null,
    geo_point: { type: "Point", coordinates: [lng, lat] },
    geo_shape: null,
    created_at: new Date(),
    updated_at: new Date(),
    postal_codes: [],
  } as unknown as Municipality;
}

function repoReturning(rows: Municipality[]): IMunicipalityRepository {
  return {
    searchMunicipalities: jest.fn(),
    findManyByNisCodes: jest.fn(),
    findByPostalCode: jest.fn(async () => rows),
  } as unknown as IMunicipalityRepository;
}

const request = (overrides: Partial<GeocodeRequest> = {}): GeocodeRequest => ({
  street: "Main St",
  number: 1,
  postcode: "1000",
  city: "Bruxelles",
  ...overrides,
});

describe("(Unit) MunicipalityCentroidGeocoder", () => {
  it("returns the commune centroid for an unambiguous postcode", async () => {
    const geocoder = new MunicipalityCentroidGeocoder(repoReturning([municipality(21004, "Bruxelles", 4.375236, 50.872973)]));

    const result = await geocoder.geocode(request());

    expect(result).toEqual({
      latitude: 50.872973,
      longitude: 4.375236,
      precision: AddressGeoPrecision.MUNICIPALITY,
      source: "municipality_centroid",
    });
  });

  it("reads GeoJSON as [longitude, latitude]", async () => {
    const geocoder = new MunicipalityCentroidGeocoder(repoReturning([municipality(21004, "Bruxelles", 4.375236, 50.872973)]));

    const result = await geocoder.geocode(request());

    // Getting this backwards puts Belgium in Somalia, and nothing downstream
    // would complain.
    expect(result?.latitude).toBeGreaterThan(result?.longitude ?? 0);
  });

  it("uses `city` to break a tie when a postcode spans several communes", async () => {
    // 1050 covers both Bruxelles (21004) and Ixelles (21009) in the seed data.
    const geocoder = new MunicipalityCentroidGeocoder(
      repoReturning([municipality(21004, "Bruxelles", 4.375236, 50.872973), municipality(21009, "Ixelles", 4.377092, 50.822321)]),
    );

    const result = await geocoder.geocode(request({ postcode: "1050", city: "Ixelles" }));

    expect(result?.latitude).toBeCloseTo(50.822321, 6);
  });

  it("matches the city across languages and accents", async () => {
    const geocoder = new MunicipalityCentroidGeocoder(
      repoReturning([
        municipality(21004, "Bruxelles", 4.375236, 50.872973, "Brussel"),
        municipality(21009, "Ixelles", 4.377092, 50.822321, "Elsene"),
      ]),
    );

    const dutch = await geocoder.geocode(request({ postcode: "1050", city: "elsene" }));
    expect(dutch?.latitude).toBeCloseTo(50.822321, 6);

    const accented = await geocoder.geocode(request({ postcode: "1050", city: "BRUXELLES" }));
    expect(accented?.latitude).toBeCloseTo(50.872973, 6);
  });

  it("declines rather than averaging when the tie cannot be broken", async () => {
    const geocoder = new MunicipalityCentroidGeocoder(
      repoReturning([municipality(21004, "Bruxelles", 4.375236, 50.872973), municipality(21009, "Ixelles", 4.377092, 50.822321)]),
    );

    const result = await geocoder.geocode(request({ postcode: "1050", city: "Nowhere" }));

    // A point midway between two communes is in neither, and it would look
    // every bit as authoritative as a real one.
    expect(result).toBeNull();
  });

  it("returns null for an unknown postcode", async () => {
    const geocoder = new MunicipalityCentroidGeocoder(repoReturning([]));

    expect(await geocoder.geocode(request({ postcode: "9999" }))).toBeNull();
    expect(await geocoder.supports(request({ postcode: "9999" }))).toBe(false);
  });

  it("returns null when the commune has no stored centroid", async () => {
    const without = municipality(21004, "Bruxelles", 0, 0);
    (without as { geo_point: unknown }).geo_point = null;

    const geocoder = new MunicipalityCentroidGeocoder(repoReturning([without]));

    expect(await geocoder.geocode(request())).toBeNull();
  });
});
