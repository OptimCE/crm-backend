import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { AddressGeoPrecision } from "../../../src/shared/address/address.types.js";
import type { BestAddress, BestAddressClient, BestStreet } from "../../../src/modules/geocoding/infra/best-address.client.js";
import { BestAddressGeocoder } from "../../../src/modules/geocoding/infra/best-address.geocoder.js";
import type { GeocodeRequest } from "../../../src/modules/geocoding/domain/geocoding.types.js";

function street(id: string, fr: string): BestStreet {
  return { id, names: { fr }, nisCode: 21004, municipalityNames: { fr: "Bruxelles" } };
}

function address(houseNumber: string, latitude?: number, longitude?: number): BestAddress {
  return {
    id: `addr:${houseNumber}`,
    houseNumber,
    streetNames: { fr: "Rue de la Loi" },
    municipalityNames: { fr: "Bruxelles" },
    nisCode: 21004,
    postcode: "1000",
    latitude,
    longitude,
  };
}

function request(over: Partial<GeocodeRequest> = {}): GeocodeRequest {
  return {
    street: "Rue de la Loi",
    number: "16",
    postcode: "1000",
    city: "Bruxelles",
    supplement: null,
    latitude: null,
    longitude: null,
    ...over,
  };
}

interface ClientStub {
  searchStreets: jest.Mock<BestAddressClient["searchStreets"]>;
  addressesOfStreet: jest.Mock<BestAddressClient["addressesOfStreet"]>;
}

describe("(Unit) BestAddressGeocoder", () => {
  let client: ClientStub;
  let geocoder: BestAddressGeocoder;

  beforeEach(() => {
    client = {
      searchStreets: jest.fn(async () => []),
      addressesOfStreet: jest.fn(async () => []),
    } as unknown as ClientStub;
    geocoder = new BestAddressGeocoder(client as unknown as BestAddressClient);
  });

  describe("supports", () => {
    it("accepts a Belgian postcode", async () => {
      expect(await geocoder.supports(request({ postcode: "1000" }))).toBe(true);
      expect(await geocoder.supports(request({ postcode: " 5000 " }))).toBe(true);
    });

    it("declines anything else without spending a call", async () => {
      // The register is national, so unlike the two regional adapters there is
      // no region test — but a foreign address must not cost an HTTP round trip
      // to be told no.
      expect(await geocoder.supports(request({ postcode: "75001" }))).toBe(false);
      expect(await geocoder.supports(request({ postcode: "SW1A 1AA" }))).toBe(false);
      expect(client.searchStreets).not.toHaveBeenCalled();
    });
  });

  describe("geocode", () => {
    it("returns a ROOFTOP point for an exact street and house number", async () => {
      client.searchStreets.mockResolvedValue([street("s1", "Rue de la Loi")]);
      client.addressesOfStreet.mockResolvedValue([address("16", 50.846169, 4.366538)]);

      const result = await geocoder.geocode(request());

      expect(result).toEqual({
        latitude: 50.846169,
        longitude: 4.366538,
        // ROOFTOP, not MANUAL: MANUAL means a human placed it and is never
        // overwritten by a later batch. A register hit is the best AUTOMATIC
        // answer, but it is still automatic.
        precision: AddressGeoPrecision.ROOFTOP,
        source: "best_address",
      });
    });

    it("matches the street name ignoring accents and case", async () => {
      client.searchStreets.mockResolvedValue([street("s1", "Chaussée de Liège")]);
      client.addressesOfStreet.mockResolvedValue([address("16", 50.8, 4.3)]);

      const result = await geocoder.geocode(request({ street: "chaussee de liege" }));

      expect(result?.precision).toBe(AddressGeoPrecision.ROOFTOP);
    });

    it("refuses to guess when several streets match and none matches exactly", async () => {
      // A substring search for "Rue Neuve" also returns "Rue Neuve-Haute".
      // Silently geocoding to the wrong street is worse than returning nothing:
      // the chain has a commune centroid behind it.
      client.searchStreets.mockResolvedValue([street("s1", "Rue Neuve-Haute"), street("s2", "Grand Rue Neuve")]);

      expect(await geocoder.geocode(request({ street: "Rue Neuve" }))).toBeNull();
      expect(client.addressesOfStreet).not.toHaveBeenCalled();
    });

    it("accepts a single near match, because there is nothing to confuse it with", async () => {
      client.searchStreets.mockResolvedValue([street("s1", "Rue de la Loi (partie basse)")]);
      client.addressesOfStreet.mockResolvedValue([address("16", 50.846169, 4.366538)]);

      expect(await geocoder.geocode(request())).not.toBeNull();
    });

    it("returns null when the register knows no such street", async () => {
      client.searchStreets.mockResolvedValue([]);

      expect(await geocoder.geocode(request({ street: "Rue Inexistante" }))).toBeNull();
    });

    it("returns null when the house number is not on the street", async () => {
      client.searchStreets.mockResolvedValue([street("s1", "Rue de la Loi")]);
      client.addressesOfStreet.mockResolvedValue([]);

      expect(await geocoder.geocode(request({ number: "999" }))).toBeNull();
    });

    it("returns null when the matched address has no coordinate", async () => {
      // The register genuinely has unpositioned addresses; the chain should fall
      // through to the commune centroid rather than claim a pin.
      client.searchStreets.mockResolvedValue([street("s1", "Rue de la Loi")]);
      client.addressesOfStreet.mockResolvedValue([address("16")]);

      expect(await geocoder.geocode(request())).toBeNull();
    });

    it("rejects a point outside Belgium even if the client let one through", async () => {
      // Belt and braces: the client already drops these, and this is the backstop
      // if that ever changes. The failure class is silent — a valid number pair
      // that plots in the wrong country.
      client.searchStreets.mockResolvedValue([street("s1", "Rue de la Loi")]);
      client.addressesOfStreet.mockResolvedValue([address("16", 49.29391, 2.30551)]);

      expect(await geocoder.geocode(request())).toBeNull();
    });

    it("trims the house number before asking the register", async () => {
      client.searchStreets.mockResolvedValue([street("s1", "Rue de la Loi")]);
      client.addressesOfStreet.mockResolvedValue([address("16", 50.8, 4.3)]);

      await geocoder.geocode(request({ number: "  16  " }));

      expect(client.addressesOfStreet).toHaveBeenCalledWith("s1", "16");
    });

    it("takes the lowest house number when the register returns several", async () => {
      client.searchStreets.mockResolvedValue([street("s1", "Rue de la Loi")]);
      client.addressesOfStreet.mockResolvedValue([address("16B", 50.9, 4.4), address("16", 50.8, 4.3)]);

      const result = await geocoder.geocode(request());

      expect(result?.latitude).toBe(50.8);
    });
  });
});
