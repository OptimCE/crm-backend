import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { AddressGeoPrecision } from "../../../src/shared/address/address.types.js";
import type { BestAddress, BestAddressClient, BestStreet } from "../../../src/modules/geocoding/infra/best-address.client.js";
import { BestAddressSuggester } from "../../../src/modules/geocoding/infra/best-address.suggester.js";
import type { IMunicipalityRepository } from "../../../src/modules/municipalities/domain/i-municipality.repository.js";
import type { Municipality } from "../../../src/modules/municipalities/domain/municipality.models.js";

function street(id: string, fr: string, city = "Namur", nis = 92094): BestStreet {
  return { id, names: { fr }, nisCode: nis, municipalityNames: { fr: city, nl: city } };
}

function address(houseNumber: string, located = true): BestAddress {
  return {
    id: `addr:${houseNumber}`,
    houseNumber,
    streetNames: { fr: "Place de la Station" },
    municipalityNames: { fr: "Namur", nl: "Namen" },
    nisCode: 92094,
    postcode: "5000",
    latitude: located ? 50.468219 : undefined,
    longitude: located ? 4.863607 : undefined,
  };
}

/** Only the two methods the suggester uses. */
interface ClientStub {
  searchStreets: jest.Mock<BestAddressClient["searchStreets"]>;
  addressesOfStreet: jest.Mock<BestAddressClient["addressesOfStreet"]>;
}

function municipalityRepo(matches: Partial<Municipality>[] = []): IMunicipalityRepository {
  return {
    searchMunicipalities: jest.fn(async () => [matches as Municipality[], matches.length] as [Municipality[], number]),
    findManyByNisCodes: jest.fn(async () => []),
    findByPostalCode: jest.fn(async () => []),
  } as unknown as IMunicipalityRepository;
}

describe("(Unit) BestAddressSuggester", () => {
  let client: ClientStub;
  let suggester: BestAddressSuggester;

  beforeEach(() => {
    client = {
      searchStreets: jest.fn(async () => []),
      addressesOfStreet: jest.fn(async () => []),
    } as unknown as ClientStub;
    suggester = new BestAddressSuggester(client as unknown as BestAddressClient, municipalityRepo());
  });

  it("returns nothing for a query too short to be a search", async () => {
    // `*ru*` matches an enormous slice of a 200k-street register.
    expect(await suggester.suggest("ru", 5, "fr")).toEqual([]);
    expect(client.searchStreets).not.toHaveBeenCalled();
  });

  it("returns nothing for a bare postcode", async () => {
    // /streets needs a name, and listing every street in a commune is not a
    // suggestion.
    expect(await suggester.suggest("5000", 5, "fr")).toEqual([]);
    expect(client.searchStreets).not.toHaveBeenCalled();
  });

  it("returns STREET rows when no house number was typed", async () => {
    client.searchStreets.mockResolvedValue([street("s1", "Place de la Station")]);

    const rows = await suggester.suggest("place de la station 5000", 5, "fr");

    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe("street");
    expect(rows[0].label).toBe("Place de la Station, 5000 Namur");
    // A street has no coordinate: the register stores geometry per ADDRESS.
    expect(rows[0].latitude).toBeUndefined();
    expect(client.addressesOfStreet).not.toHaveBeenCalled();
  });

  it("expands to ADDRESS rows, with coordinates, once a house number is typed", async () => {
    client.searchStreets.mockResolvedValue([street("s1", "Place de la Station")]);
    client.addressesOfStreet.mockResolvedValue([address("20A")]);

    const rows = await suggester.suggest("place de la station 20A 5000", 5, "fr");

    expect(rows[0].kind).toBe("address");
    expect(rows[0].number).toBe("20A");
    expect(rows[0].latitude).toBe(50.468219);
    expect(rows[0].precision).toBe(AddressGeoPrecision.ROOFTOP);
    expect(rows[0].best_address_id).toBe("addr:20A");
    expect(client.addressesOfStreet).toHaveBeenCalledWith("s1", "20A");
  });

  it("marks an address the register has not positioned as having NO precision", async () => {
    // ROOFTOP would claim a pin that does not exist.
    client.searchStreets.mockResolvedValue([street("s1", "Place de la Station")]);
    client.addressesOfStreet.mockResolvedValue([address("20A", false)]);

    const rows = await suggester.suggest("place de la station 20A 5000", 5, "fr");

    expect(rows[0].kind).toBe("address");
    expect(rows[0].precision).toBeUndefined();
  });

  it("falls back to the street rows when the house number does not exist", async () => {
    // A new build the register has not published yet. The street is still the
    // useful half of the answer, so returning nothing would be worse.
    client.searchStreets.mockResolvedValue([street("s1", "Place de la Station")]);
    client.addressesOfStreet.mockResolvedValue([]);

    const rows = await suggester.suggest("place de la station 999 5000", 5, "fr");

    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe("street");
  });

  it("retries with the ~ fuzzy form only when the substring form found nothing", async () => {
    // `*` is anchored, so "rue de la station" misses "Place de la Station".
    client.searchStreets.mockResolvedValueOnce([]).mockResolvedValueOnce([street("s1", "Place de la Station")]);

    const rows = await suggester.suggest("rue de la station 5000", 5, "fr");

    expect(client.searchStreets).toHaveBeenCalledTimes(2);
    expect(client.searchStreets.mock.calls[1][1]).toMatchObject({ fuzzy: true });
    expect(rows[0].street).toBe("Place de la Station");
  });

  it("does NOT spend a fuzzy call when the substring form already matched", async () => {
    client.searchStreets.mockResolvedValue([street("s1", "Place de la Station")]);

    await suggester.suggest("place de la station 5000", 5, "fr");

    expect(client.searchStreets).toHaveBeenCalledTimes(1);
  });

  it("recognises a trailing COMMUNE and retries on its NIS code", async () => {
    // "rue de la loi bruxelles" matches no street name; the last word is a
    // commune. The local municipality table is the authority, and the register
    // indexes on the same NIS code — an exact join, not a name guess.
    const repo = municipalityRepo([{ nis_code: 21004, fr_name: "Bruxelles", nl_name: "Brussel", de_name: null }]);
    suggester = new BestAddressSuggester(client as unknown as BestAddressClient, repo);
    client.searchStreets
      .mockResolvedValueOnce([]) // substring
      .mockResolvedValueOnce([]) // fuzzy
      .mockResolvedValueOnce([street("s2", "Rue de la Loi", "Bruxelles", 21004)]);

    const rows = await suggester.suggest("rue de la loi bruxelles", 5, "fr");

    expect(client.searchStreets).toHaveBeenCalledTimes(3);
    expect(client.searchStreets.mock.calls[2][0]).toBe("rue de la loi");
    expect(client.searchStreets.mock.calls[2][1]).toMatchObject({ nisCode: 21004 });
    expect(rows[0].street).toBe("Rue de la Loi");
  });

  it("gives up rather than guessing when the trailing word is not a commune", async () => {
    client.searchStreets.mockResolvedValue([]);

    expect(await suggester.suggest("rue inexistante quelquepart", 5, "fr")).toEqual([]);
  });

  it("ranks an exact street-name match above a mere substring", async () => {
    // The register returns up to 400 rows in no particular order, so ranking has
    // to happen here.
    client.searchStreets.mockResolvedValue([street("s1", "Grand Rue Neuve"), street("s2", "Rue Neuve"), street("s3", "Rue Neuve-Haute")]);

    const rows = await suggester.suggest("rue neuve 1000", 5, "fr");

    expect(rows.map((r) => r.street)).toEqual(["Rue Neuve", "Rue Neuve-Haute", "Grand Rue Neuve"]);
  });

  it("honours the limit", async () => {
    client.searchStreets.mockResolvedValue([street("s1", "Rue A"), street("s2", "Rue B"), street("s3", "Rue C")]);

    expect(await suggester.suggest("rue 1000", 2, "fr")).toHaveLength(2);
  });

  it("shows the caller's language, falling back when the region has no name in it", async () => {
    client.searchStreets.mockResolvedValue([street("s1", "Meir", "Anvers")]);

    const fr = await suggester.suggest("meir 2000", 1, "fr");
    expect(fr[0].city).toBe("Anvers");

    // A Walloon street carries only `fr`; asking for `nl` must not render blank.
    client.searchStreets.mockResolvedValue([{ id: "s2", names: { fr: "Place Saint-Aubain" }, nisCode: 92094, municipalityNames: { fr: "Namur" } }]);
    const nl = await suggester.suggest("saint aubain 5000", 1, "nl");
    expect(nl[0].street).toBe("Place Saint-Aubain");
  });

  it("survives one street failing while expanding several", async () => {
    client.searchStreets.mockResolvedValue([street("s1", "Rue A"), street("s2", "Rue B")]);
    client.addressesOfStreet.mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce([address("12")]);

    const rows = await suggester.suggest("rue 12 5000", 5, "fr");

    expect(rows).toHaveLength(1);
    expect(rows[0].number).toBe("12");
  });

  it("orders expanded house numbers numerically, not lexicographically", async () => {
    client.searchStreets.mockResolvedValue([street("s1", "Rue A")]);
    client.addressesOfStreet.mockResolvedValue([address("10"), address("2"), address("1")]);

    const rows = await suggester.suggest("rue a 2 5000", 5, "fr");

    expect(rows.map((r) => r.number)).toEqual(["1", "2", "10"]);
  });
});
