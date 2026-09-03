import { call } from "../../../shared/services/api_call.js";
import { asRecord, isPlausibleBelgianPoint, round6 } from "./geocode.parsing.js";

/**
 * Thin client for BeSt-in-a-Box (`bosa/opendata-best-webapi`), FPS BOSA's
 * self-contained image of the federal BeSt Address register.
 *
 * Three things about this API are load-bearing, all measured against the real
 * container rather than read off the spec:
 *
 *  1. **Never wildcard `streetName` on `/addresses`.** Latency there is
 *     cardinality-dependent and unbounded: `*Station*` answers in 0.20 s but
 *     `*Chauss*` — an ordinary French street prefix — takes 9.59 s, three times
 *     the KrakenD gateway cap. `/streets` is bounded (0.47 s for a pattern
 *     matching 142 346 rows) because the register holds ~200k streets against
 *     ~6.4M addresses. Hence {@link searchStreets} then {@link addressesOfStreet}.
 *  2. **`*` is a prefix wildcard, anchored at the start.** `Rue de la Station*`
 *     returns nothing in postcode 5000, which has *Place* de la Station.
 *     `*Station*` is the substring form, and `~text` is fuzzy — it matched
 *     "Place de la Station" for "Rue de la Station".
 *  3. **The first `/addresses` query after a container start took 56 s**, and
 *     0.09 s thereafter: Postgres paging the address table in. {@link warm}
 *     exists to pay that cost at boot instead of charging it to whoever types
 *     first — with a 3 s gateway cap, an un-warmed box is a 504.
 *
 * `BelGov-Trace-Id` is required by the spec and sent on every call. The box
 * needs no OAuth; the hosted federal API does, which is one reason this runs
 * the box.
 */

/** A street as the register returns it. */
export interface BestStreet {
  id: string;
  names: Record<string, string>;
  nisCode?: number;
  municipalityNames: Record<string, string>;
}

/** An address as the register returns it, already resolved against `embedded`. */
export interface BestAddress {
  id: string;
  houseNumber: string;
  boxNumber?: string;
  streetNames: Record<string, string>;
  municipalityNames: Record<string, string>;
  nisCode?: number;
  postcode: string;
  latitude?: number;
  longitude?: number;
}

interface Page {
  items?: unknown[];
  embedded?: Record<string, unknown>;
  total?: number;
}

export class BestAddressClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {}

  /** True when the box is up. Used to pick BEST vs REMOTE under `AUTO`. */
  async isHealthy(): Promise<boolean> {
    try {
      const payload = await this.get<unknown>("/health", {}, 2000);
      return asRecord(payload)?.["status"] === "UP";
    } catch {
      return false;
    }
  }

  /**
   * One cheap `/addresses` read, to fault the address table into memory.
   *
   * Deliberately narrow (`streetId` is an indexed lookup) — the point is to
   * touch the table, not to scan it.
   */
  async warm(): Promise<void> {
    await this.get<unknown>("/addresses", { postCode: "1000", page: 1 }, 90_000);
  }

  /**
   * Streets whose name contains `text`, optionally narrowed by postcode or NIS.
   *
   * `fuzzy` switches `*text*` for `~text`. Used as a second attempt when the
   * substring form finds nothing, which is what makes a typo or the wrong
   * street type ("rue" for "place") still land.
   */
  async searchStreets(text: string, options: { postcode?: string; nisCode?: number; fuzzy?: boolean } = {}): Promise<BestStreet[]> {
    const name = options.fuzzy ? `~${text}` : `*${text}*`;
    const params: Record<string, string | number> = { name, embed: "municipalities" };
    if (options.postcode) {
      params["postCode"] = options.postcode;
    }
    if (options.nisCode !== undefined) {
      params["nisCode"] = String(options.nisCode).padStart(5, "0");
    }

    const page = await this.get<Page>("/streets", params);
    const embedded = page.embedded ?? {};
    return (page.items ?? []).flatMap((raw) => {
      const item = asRecord(raw);
      const id = typeof item?.["id"] === "string" ? item["id"] : null;
      if (!id) {
        return [];
      }
      const assignedBy = asRecord(item?.["isAssignedBy"]);
      const municipality = resolve(embedded, assignedBy) ?? assignedBy;
      return [
        {
          id,
          names: names(item?.["name"]),
          nisCode: toNis(municipality?.["nisCode"]),
          municipalityNames: names(municipality?.["name"]),
        },
      ];
    });
  }

  /**
   * Every address on one street, by the street's own id.
   *
   * An indexed lookup rather than a search — this is the half of the two-stage
   * strategy that is allowed to touch `/addresses`.
   */
  async addressesOfStreet(streetId: string, houseNumber?: string): Promise<BestAddress[]> {
    const params: Record<string, string> = {
      streetId,
      embed: "streets,municipalities,postalInfos",
      firstOfBuilding: "true",
    };
    if (houseNumber) {
      params["houseNumber"] = houseNumber;
    }

    const page = await this.get<Page>("/addresses", params);
    const embedded = page.embedded ?? {};
    return (page.items ?? []).flatMap((raw) => {
      const item = asRecord(raw);
      const id = typeof item?.["id"] === "string" ? item["id"] : null;
      const houseNo = item?.["houseNumber"];
      if (!id || typeof houseNo !== "string") {
        return [];
      }
      const street = resolve(embedded, asRecord(item?.["hasStreetName"]));
      const municipality = resolve(embedded, asRecord(item?.["hasMunicipality"]));
      const postal = resolve(embedded, asRecord(item?.["hasPostalInfo"]));
      const point = readWgs84(item?.["addressPosition"]);

      return [
        {
          id,
          houseNumber: houseNo,
          boxNumber: typeof item?.["boxNumber"] === "string" ? item["boxNumber"] : undefined,
          streetNames: names(street?.["name"]),
          municipalityNames: names(municipality?.["name"]),
          nisCode: toNis(municipality?.["nisCode"]),
          // Wallonia leaves postalInfo.name empty, so the CITY comes from the
          // municipality and only the CODE from here.
          postcode: typeof postal?.["postCode"] === "string" ? postal["postCode"] : "",
          latitude: point?.latitude,
          longitude: point?.longitude,
        },
      ];
    });
  }

  private async get<T>(path: string, params: Record<string, string | number>, timeoutMs?: number): Promise<T> {
    return call<T>(
      {
        method: "GET",
        url: `${this.baseUrl.replace(/\/+$/, "")}${path}`,
        timeout: timeoutMs ?? this.timeoutMs,
        params,
      },
      // Required by the BeSt spec on every path. The box does not enforce it,
      // but the hosted federal API does, so sending it keeps the two swappable.
      { "BelGov-Trace-Id": "optimce-crm" },
    );
  }
}

/**
 * `embedded` is keyed by href, and every reference carries the href that indexes
 * it. Falls back to the reference itself so a caller that forgot `embed` still
 * gets ids rather than a crash.
 */
function resolve(embedded: Record<string, unknown>, reference: Record<string, unknown> | null): Record<string, unknown> | null {
  const href = reference?.["href"];
  if (typeof href !== "string") {
    return reference;
  }
  return asRecord(embedded[href]) ?? reference;
}

/** `{ fr, nl, de }` — which one is shown depends on the caller's language. */
function names(value: unknown): Record<string, string> {
  const record = asRecord(value);
  if (!record) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [lang, name] of Object.entries(record)) {
    if (typeof name === "string" && name.length > 0) {
      out[lang] = name;
    }
  }
  return out;
}

/** The register sends NIS as a zero-padded string; the local table keys on int. */
function toNis(value: unknown): number | undefined {
  const parsed = typeof value === "string" ? parseInt(value, 10) : typeof value === "number" ? value : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Read `addressPosition.wgs84`, and DROP a point that is not in Belgium.
 *
 * Not defensive coding — this fires on real register data. An address the
 * regions have not positioned comes back with `lambert72: {x: 0, y: 0}`, and
 * the box faithfully reprojects that origin into
 * `{lat: 49.2939, long: 2.3055}` — a perfectly well-formed coordinate near
 * Compiègne, in France. Measured at 1 address out of 35 on one Namur street.
 *
 * Nothing downstream would notice: it is a valid number pair, it plots, and the
 * pin simply appears in the wrong country. So the check happens here, once, and
 * the address is still returned — it is a real address, it just has no position
 * yet, and the caller renders it without a coordinate rather than hiding it.
 */
function readWgs84(value: unknown): { latitude: number; longitude: number } | null {
  const wgs84 = asRecord(asRecord(value)?.["wgs84"]);
  const latitude = toNumber(wgs84?.["lat"]);
  const longitude = toNumber(wgs84?.["long"]);
  if (latitude === undefined || longitude === undefined) {
    return null;
  }
  if (!isPlausibleBelgianPoint(latitude, longitude)) {
    return null;
  }
  // Round to the column's own scale. `address.latitude` is numeric(9,6) — about
  // 11 cm — so the register's 15 significant digits are noise that would only
  // show up as a suspiciously precise number in the UI.
  return { latitude: round6(latitude), longitude: round6(longitude) };
}

function toNumber(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}
