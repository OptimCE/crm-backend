import { inject, injectable } from "inversify";
import type { QueryRunner } from "typeorm";

import { container } from "../../../container/di-container.js";
import type { ICacheService } from "../../../shared/cache/i-cache.service.js";
import { AddressGeocodeStatus } from "../../../shared/address/address.types.js";
import type { IAddressRepository } from "../../../shared/address/i-address.repository.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import { isAppErrorLike } from "../../../shared/errors/isAppError.js";
import logger from "../../../shared/monitor/logger.js";
import { withSavepoint } from "../../../shared/transactional/savepoint.js";
import type { IGeocodingService } from "../domain/i-geocoding.service.js";
import type { IGeocoder } from "../domain/i-geocoder.js";
import type { AddressSuggestion } from "../domain/address-suggestion.types.js";
import { ADDRESS_SUGGESTER_TOKEN, type IAddressSuggester } from "../domain/i-address-suggester.js";
import { getCachedSuggestions, setCachedSuggestions, suggestionCacheKey } from "./suggestion.cache.js";
import { GEOCODER_TOKENS, type GeocodeRequest, type GeocoderChain } from "../domain/geocoding.types.js";
import { GEOCODING_ERRORS } from "../shared/geocoding.errors.js";
import type { AddressPreviewDTO, GeocodeBackfillResultDTO } from "../api/geocoding.dtos.js";

@injectable()
export class GeocodingService implements IGeocodingService {
  constructor(@inject("AddressRepository") private readonly address_repository: IAddressRepository) {}

  /**
   * Resolves a chain lazily instead of taking it in the constructor.
   *
   * Inversify resolves constructor dependencies eagerly, and the geocoding
   * factory is skipped under NODE_ENV=test like every other network adapter. A
   * constructor injection would therefore make container.get(MeterController)
   * throw "no matching bindings" and break every existing meter and member test
   * at once. Unbound simply means geocoding is off, which is exactly the
   * behaviour those tests want. Same shape as getCacheService() in
   * shared/cache/decorator/cache.decorators.ts.
   */
  private geocoder(chain: GeocoderChain): IGeocoder | null {
    const token = GEOCODER_TOKENS[chain];
    try {
      return container.isBound(token) ? container.get<IGeocoder>(token) : null;
    } catch {
      return null;
    }
  }

  /** Same lazy resolution as {@link geocoder}, for the same reason. */
  private suggester(): IAddressSuggester | null {
    try {
      return container.isBound(ADDRESS_SUGGESTER_TOKEN) ? container.get<IAddressSuggester>(ADDRESS_SUGGESTER_TOKEN) : null;
    } catch {
      return null;
    }
  }

  private cache(): ICacheService | null {
    try {
      return container.isBound("CacheService") ? container.get<ICacheService>("CacheService") : null;
    } catch {
      return null;
    }
  }

  /**
   * Drop every tenant's meters-map cache.
   *
   * By pattern rather than through @InvalidateCache: the batch endpoints run as
   * one admin with one community in context, so the decorator could only ever
   * reach that tenant's keys — and a batch changes coordinates across all of
   * them.
   */
  private async sweepMapCache(): Promise<void> {
    try {
      await this.cache()?.delByPattern("meters:map*");
    } catch (err) {
      logger.warn({ operation: "sweepMapCache", error: err }, "Could not invalidate the meters map cache");
    }
  }

  async geocodeAddress(address_id: number, request: GeocodeRequest, chain: GeocoderChain, query_runner?: QueryRunner): Promise<boolean> {
    const status = await this.attempt(address_id, request, chain, query_runner);
    return status === AddressGeocodeStatus.OK;
  }

  /**
   * One geocoding attempt, reporting the status it recorded.
   *
   * Returns null when no chain is bound. "Geocoding is off" is distinct from
   * "we tried and found nothing", and conflating them would make the backfill
   * report every address as NOT_FOUND while `remaining` never moved.
   */
  private async attempt(
    address_id: number,
    request: GeocodeRequest,
    chain: GeocoderChain,
    query_runner?: QueryRunner,
  ): Promise<AddressGeocodeStatus | null> {
    const geocoder = this.geocoder(chain);
    if (!geocoder) {
      return null;
    }

    try {
      // The lookup is outside the savepoint on purpose: it has touched no
      // Postgres state, so it cannot have aborted the caller transaction.
      const result = await geocoder.geocode(request);
      const status = result ? AddressGeocodeStatus.OK : AddressGeocodeStatus.NOT_FOUND;

      // The write is NOT. A failing UPDATE inside an open transaction aborts it
      // with 25P02, and the later COMMIT is silently downgraded to a ROLLBACK,
      // so the meter would vanish behind a 200. A try/catch cannot un-abort a
      // Postgres transaction; only a SAVEPOINT can.
      await withSavepoint(query_runner, () => this.address_repository.setGeolocation(address_id, result, status, query_runner));

      return status;
    } catch (err) {
      logger.warn({ operation: "geocodeAddress", address_id, chain, error: err }, "Geocoding failed - address left unplotted");
      try {
        await withSavepoint(query_runner, () => this.address_repository.setGeolocation(address_id, null, AddressGeocodeStatus.ERROR, query_runner));
      } catch (stamp_err) {
        logger.error({ operation: "geocodeAddress:stamp", address_id, error: stamp_err }, "Could not record the geocoding failure");
      }
      return AddressGeocodeStatus.ERROR;
    }
  }

  async runBackfill(limit: number): Promise<GeocodeBackfillResultDTO> {
    // Fail loudly rather than reporting a batch of phantom NOT_FOUNDs that
    // would leave `remaining` unchanged and an operator looping forever.
    if (!this.geocoder("full")) {
      throw new AppError(GEOCODING_ERRORS.BACKFILL.DISABLED, 503);
    }

    let pending;
    try {
      pending = await this.address_repository.findPendingGeocode(limit);
    } catch (err) {
      logger.error({ operation: "runBackfill", error: err }, "Could not read the geocoding queue");
      throw new AppError(GEOCODING_ERRORS.BACKFILL.DATABASE, 400);
    }

    let succeeded = 0;
    let not_found = 0;
    let errored = 0;

    // Sequential, not Promise.all: both upstream services are free and public,
    // and a parallel burst from a batch endpoint is how an IP gets blocked. Each
    // row is its own unit with no shared transaction, so one bad address cannot
    // poison the batch.
    for (const address of pending) {
      const status = await this.attempt(
        address.id,
        {
          street: address.street,
          number: address.number,
          postcode: address.postcode,
          city: address.city,
          supplement: address.supplement ?? null,
          // Deliberately NOT passing the stored coordinate: a MANUAL pin is
          // already OK status and never reaches this queue, and re-feeding a
          // stored point would make ManualGeocoder echo it back forever.
        },
        "full",
      );

      if (status === AddressGeocodeStatus.OK) {
        succeeded += 1;
      } else if (status === AddressGeocodeStatus.ERROR) {
        errored += 1;
      } else {
        not_found += 1;
      }
    }

    // The map endpoints are cached per community, but this runs as one admin
    // with one community in context, so cachePattern() could only ever reach
    // that tenant keys. Sweeping by pattern directly is the only correct option
    // here, and it is why the controller carries no @InvalidateCache.
    if (succeeded > 0) {
      await this.sweepMapCache();
    }

    let remaining: number;
    try {
      remaining = await this.address_repository.countPendingGeocode();
    } catch (err) {
      if (isAppErrorLike(err)) throw err;
      logger.error({ operation: "runBackfill:count", error: err }, "Could not count the remaining geocoding queue");
      throw new AppError(GEOCODING_ERRORS.BACKFILL.DATABASE, 400);
    }

    return { attempted: pending.length, succeeded, not_found, errored, remaining };
  }

  async suggest(query: string, limit: number, lang: string): Promise<AddressSuggestion[]> {
    const suggester = this.suggester();
    if (!suggester) {
      // Unbound == the feature is off. An empty list, not a 503: the picker is
      // advisory and the six forms it sits in stay usable without it.
      return [];
    }

    const key = suggestionCacheKey(query, limit, lang);
    const hit = getCachedSuggestions(key);
    if (hit) {
      return hit;
    }

    try {
      const results = await suggester.suggest(query, limit, lang);
      setCachedSuggestions(key, results);
      return results;
    } catch (err) {
      // Never propagate. This runs on every keystroke behind a 250 ms debounce,
      // so a provider having a bad minute must degrade to "no suggestions" —
      // which is exactly how the form behaves with the feature switched off.
      logger.warn({ operation: "suggestAddress", suggester: suggester.id, error: err }, "Address suggestion failed - returning none");
      return [];
    }
  }

  async preview(request: GeocodeRequest, lang: string): Promise<AddressPreviewDTO> {
    const geocoder = this.geocoder("inline");
    let result = null;
    if (geocoder) {
      try {
        result = await geocoder.geocode(request);
      } catch (err) {
        // Same posture as the rest of this service: a failure means "we cannot
        // say", and the form must still be submittable.
        logger.warn({ operation: "previewAddress", error: err }, "Address preview failed");
      }
    }

    // Offer a way out of the warning, not just the warning. Only worth the
    // round trip when nothing was found - a located address needs no rescue.
    const suggestions = result
      ? []
      : await this.suggest([request.street, request.number, request.postcode, request.city].filter(Boolean).join(" "), 5, lang);

    return {
      found: result !== null,
      latitude: result?.latitude,
      longitude: result?.longitude,
      precision: result?.precision,
      source: result?.source,
      suggestions,
    };
  }
}

/** Builds the geocoder input from a stored or submitted address. */
export function toGeocodeRequest(address: {
  street: string;
  number: string;
  postcode: string;
  city: string;
  supplement?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): GeocodeRequest {
  return {
    street: address.street,
    number: address.number,
    postcode: address.postcode,
    city: address.city,
    supplement: address.supplement ?? null,
    latitude: address.latitude ?? null,
    longitude: address.longitude ?? null,
  };
}
