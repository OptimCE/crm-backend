import { beforeEach, describe, expect, it, jest } from "@jest/globals";

/**
 * Payloads below are shaped from real responses of `bosa/opendata-best-webapi`,
 * recorded against the running container. The container starts with the dev
 * stack, but CI does not run the stack at all, so a test that reached for the
 * register would be red there — and would also drift with the weekly dataset.
 * The PARSING is where the bugs live, and that needs no network.
 */
const call = jest.fn<(...args: unknown[]) => Promise<unknown>>();
jest.unstable_mockModule("../../../src/shared/services/api_call.js", () => ({
  call,
  callWithTracingHeaders: jest.fn(),
  callWithTracingHeadersCertificate: jest.fn(),
}));

const { BestAddressClient } = await import("../../../src/modules/geocoding/infra/best-address.client.js");

const BASE = "http://best-address:8080/belgianAddress/v2";
const STREET_HREF = "/belgianAddress/v2/streets/geodata.wallonie.be%2Fid%2FStreetname%2F7753485%2F223";
const MUNI_HREF = "/belgianAddress/v2/municipalities/geodata.wallonie.be%2Fid%2FMunicipality%2F92094%2F7";
const POSTAL_HREF = "/belgianAddress/v2/postalInfos/geodata.wallonie.be%2Fid%2FPostalInfo%2F5000%2F1";

const EMBEDDED = {
  [STREET_HREF]: { href: STREET_HREF, id: "…/Streetname/7753485/223", name: { fr: "Place de la Station" } },
  [MUNI_HREF]: { href: MUNI_HREF, id: "…/Municipality/92094/7", name: { fr: "Namur", nl: "Namen", de: "Namur" }, nisCode: "92094" },
  [POSTAL_HREF]: { href: POSTAL_HREF, id: "…/PostalInfo/5000/1", name: {}, postCode: "5000" },
};

function addressItem(houseNumber: string, wgs84: unknown): unknown {
  return {
    id: `geodata.wallonie.be/id/Address/${houseNumber}/2`,
    houseNumber,
    hasStreetName: { href: STREET_HREF },
    hasMunicipality: { href: MUNI_HREF },
    hasPostalInfo: { href: POSTAL_HREF },
    addressPosition: wgs84,
  };
}

/** Last request the client made, for asserting the query it built. */
function lastRequest(): { url: string; params: Record<string, unknown>; headers: Record<string, string> } {
  const [config, headers] = call.mock.calls[call.mock.calls.length - 1] as [{ url: string; params: Record<string, unknown> }, Record<string, string>];
  return { url: config.url, params: config.params, headers };
}

describe("(Unit) BestAddressClient", () => {
  let client: InstanceType<typeof BestAddressClient>;

  beforeEach(() => {
    call.mockReset();
    client = new BestAddressClient(BASE, 1500);
  });

  describe("searchStreets", () => {
    beforeEach(() => {
      call.mockResolvedValue({
        items: [
          {
            id: "…/Streetname/7753485/223",
            name: { fr: "Place de la Station" },
            isAssignedBy: { href: MUNI_HREF },
          },
        ],
        embedded: EMBEDDED,
      });
    });

    it("wraps the term in * — the anchored wildcard is not a substring match", async () => {
      // `Rue de la Station*` returns NOTHING in postcode 5000, which has *Place*
      // de la Station: `*` only appends. `*text*` is the substring form.
      await client.searchStreets("de la Station", { postcode: "5000" });

      expect(lastRequest().params["name"]).toBe("*de la Station*");
      expect(lastRequest().params["postCode"]).toBe("5000");
    });

    it("switches to the ~ fuzzy form when asked", async () => {
      await client.searchStreets("Rue de la Station", { fuzzy: true });

      expect(lastRequest().params["name"]).toBe("~Rue de la Station");
    });

    it("zero-pads a NIS code, because the register sends it as a 5-char string", async () => {
      await client.searchStreets("Station", { nisCode: 92094 });
      expect(lastRequest().params["nisCode"]).toBe("92094");

      await client.searchStreets("Station", { nisCode: 1000 });
      expect(lastRequest().params["nisCode"]).toBe("01000");
    });

    it("resolves the municipality through the embedded map, keyed by href", async () => {
      const streets = await client.searchStreets("Station");

      expect(streets[0].names["fr"]).toBe("Place de la Station");
      expect(streets[0].municipalityNames["nl"]).toBe("Namen");
      // "92094" -> 92094: the local `municipality` table keys on an int.
      expect(streets[0].nisCode).toBe(92094);
    });

    it("falls back to the inline reference when embed was not requested", async () => {
      call.mockResolvedValue({
        items: [
          {
            id: "…/Streetname/1/1",
            name: { fr: "Rue Test" },
            isAssignedBy: { id: "…/Municipality/92094/7", name: { fr: "Namur" }, nisCode: "92094" },
          },
        ],
      });

      const streets = await client.searchStreets("Test");

      expect(streets[0].nisCode).toBe(92094);
      expect(streets[0].municipalityNames["fr"]).toBe("Namur");
    });

    it("skips an item with no id rather than emitting a broken row", async () => {
      call.mockResolvedValue({ items: [{ name: { fr: "Nameless" } }], embedded: {} });

      expect(await client.searchStreets("Nameless")).toEqual([]);
    });

    it("sends BelGov-Trace-Id, which the hosted federal API requires", async () => {
      await client.searchStreets("Station");

      expect(lastRequest().headers["BelGov-Trace-Id"]).toBe("optimce-crm");
    });
  });

  describe("addressesOfStreet", () => {
    it("queries by streetId and NEVER by a wildcard street name", async () => {
      // The rule this client exists to enforce. `/addresses?streetName=*Chauss*`
      // took 9.59 s nationwide against a 3000 ms gateway cap; the same lookup by
      // exact streetId is ~0.08 s.
      call.mockResolvedValue({ items: [], embedded: {} });

      await client.addressesOfStreet("…/Streetname/7753485/223", "20A");

      const { url, params } = lastRequest();
      expect(url).toBe(`${BASE}/addresses`);
      expect(params["streetId"]).toBe("…/Streetname/7753485/223");
      expect(params["houseNumber"]).toBe("20A");
      expect(params["streetName"]).toBeUndefined();
    });

    it("reads the WGS84 pair and the postcode, with the CITY from the municipality", async () => {
      // Wallonia leaves postalInfo.name empty, so only the CODE comes from there.
      call.mockResolvedValue({
        items: [addressItem("16", { wgs84: { lat: 50.846169319921074, long: 4.366537635141211 } })],
        embedded: EMBEDDED,
      });

      const [address] = await client.addressesOfStreet("street-id");

      expect(address.houseNumber).toBe("16");
      expect(address.postcode).toBe("5000");
      expect(address.municipalityNames["fr"]).toBe("Namur");
      expect(address.streetNames["fr"]).toBe("Place de la Station");
    });

    it("rounds the coordinate to the column's own scale", async () => {
      // `address.latitude` is numeric(9,6) — about 11 cm. The register's 15
      // significant digits are noise that only shows up as a suspiciously
      // precise number in the UI.
      call.mockResolvedValue({
        items: [addressItem("16", { wgs84: { lat: 50.846169319921074, long: 4.366537635141211 } })],
        embedded: EMBEDDED,
      });

      const [address] = await client.addressesOfStreet("street-id");

      expect(address.latitude).toBe(50.846169);
      expect(address.longitude).toBe(4.366538);
    });

    it("DROPS a coordinate the register places outside Belgium, keeping the address", async () => {
      // Not defensive coding — this is real register data. An address the
      // regions have not positioned comes back as lambert72 (0,0), which the
      // box faithfully reprojects into a perfectly well-formed point near
      // Compiègne, in FRANCE. Nothing downstream would notice: it is a valid
      // pair, it plots, the pin is simply in the wrong country.
      // Measured at 1 address in 35 on one Namur street.
      call.mockResolvedValue({
        items: [
          addressItem("20A", {
            lambert72: { x: 0.0, y: 0.0 },
            wgs84: { lat: 49.29391796858917, long: 2.3055104309814025 },
          }),
        ],
        embedded: EMBEDDED,
      });

      const [address] = await client.addressesOfStreet("street-id", "20A");

      // The address is REAL and still offered — it just has no position yet.
      expect(address.houseNumber).toBe("20A");
      expect(address.latitude).toBeUndefined();
      expect(address.longitude).toBeUndefined();
    });

    it("tolerates an address with no addressPosition at all", async () => {
      call.mockResolvedValue({ items: [addressItem("5", undefined)], embedded: EMBEDDED });

      const [address] = await client.addressesOfStreet("street-id");

      expect(address.latitude).toBeUndefined();
    });

    it("keeps a box number when the register has one", async () => {
      const item = { ...(addressItem("16", { wgs84: { lat: 50.8, long: 4.3 } }) as object), boxNumber: "B3" };
      call.mockResolvedValue({ items: [item], embedded: EMBEDDED });

      const [address] = await client.addressesOfStreet("street-id");

      expect(address.boxNumber).toBe("B3");
    });

    it("skips an item whose houseNumber is not a string", async () => {
      call.mockResolvedValue({ items: [addressItem("16", { wgs84: { lat: 50.8, long: 4.3 } })], embedded: EMBEDDED });
      const [ok] = await client.addressesOfStreet("street-id");
      expect(ok).toBeDefined();

      call.mockResolvedValue({ items: [{ id: "x", houseNumber: 16 }], embedded: {} });
      expect(await client.addressesOfStreet("street-id")).toEqual([]);
    });
  });

  describe("isHealthy", () => {
    it("is true only for status UP", async () => {
      call.mockResolvedValue({ groups: ["liveness", "readiness"], status: "UP" });
      expect(await client.isHealthy()).toBe(true);

      call.mockResolvedValue({ status: "DOWN" });
      expect(await client.isHealthy()).toBe(false);
    });

    it("is false rather than throwing when the box is unreachable", async () => {
      // Used to decide whether the picker is available at all; an exception here
      // would take down whatever asked.
      call.mockRejectedValue(new Error("ECONNREFUSED"));

      expect(await client.isHealthy()).toBe(false);
    });
  });

  describe("warm", () => {
    it("issues a real /addresses read with a long timeout", async () => {
      // The first /addresses query after a container start took 46-56 SECONDS
      // (Postgres paging the address table in) against 0.09 s once warm. With a
      // 3000 ms gateway cap, an un-warmed box is a 504 for whoever types first,
      // so this deliberately does NOT use the normal timeout.
      call.mockResolvedValue({ items: [] });

      await client.warm();

      const [config] = call.mock.calls[0] as [{ url: string; timeout: number }];
      expect(config.url).toBe(`${BASE}/addresses`);
      expect(config.timeout).toBeGreaterThan(30_000);
    });
  });

  it("does not double a trailing slash in the base URL", async () => {
    call.mockResolvedValue({ items: [] });

    await new BestAddressClient(`${BASE}/`, 1500).searchStreets("Test");

    expect(lastRequest().url).toBe(`${BASE}/streets`);
  });
});
