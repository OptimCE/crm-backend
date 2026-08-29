import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { container } from "../../../src/container/di-container.js";
import { AddressGeocodeStatus, AddressGeoPrecision } from "../../../src/shared/address/address.types.js";
import { GeocodingService } from "../../../src/modules/geocoding/infra/geocoding.service.js";
import { GEOCODER_TOKENS } from "../../../src/modules/geocoding/domain/geocoding.types.js";
import type { IGeocoder } from "../../../src/modules/geocoding/domain/i-geocoder.js";
import type { GeocodeResult } from "../../../src/modules/geocoding/domain/geocoding.types.js";
import { createMockAddressRepository } from "../../repository_mocked/address.repository.mock.js";

const REQUEST = { street: "Main St", number: 1, postcode: "1000", city: "Bruxelles" };

const POINT: GeocodeResult = { latitude: 50.85, longitude: 4.35, precision: AddressGeoPrecision.ROOFTOP, source: "stub" };

async function bindChain(token: string, geocoder: IGeocoder): Promise<void> {
  if (container.isBound(token)) {
    await container.unbind(token);
  }
  container.bind<IGeocoder>(token).toConstantValue(geocoder);
}

/** A runner that reports an open transaction, so withSavepoint takes its real path. */
function fakeRunner(): { isTransactionActive: boolean; startTransaction: jest.Mock; commitTransaction: jest.Mock; rollbackTransaction: jest.Mock } {
  return {
    isTransactionActive: true,
    startTransaction: jest.fn(async () => undefined),
    commitTransaction: jest.fn(async () => undefined),
    rollbackTransaction: jest.fn(async () => undefined),
  } as never;
}

afterEach(async () => {
  for (const token of Object.values(GEOCODER_TOKENS)) {
    if (container.isBound(token)) {
      await container.unbind(token);
    }
  }
});

describe("(Unit) GeocodingService.geocodeAddress", () => {
  it("is a silent no-op when no chain is bound", async () => {
    // This is the behaviour every existing meter and member test relies on:
    // binding.ts skips the geocoding factory under NODE_ENV=test, so an unbound
    // chain must mean "geocoding off", not an exception.
    const repo = createMockAddressRepository();

    const ok = await new GeocodingService(repo).geocodeAddress(1, REQUEST, "inline");

    expect(ok).toBe(false);
    expect(repo.setGeolocation).not.toHaveBeenCalled();
  });

  it("stores the coordinate and stamps OK on a hit", async () => {
    const repo = createMockAddressRepository();
    await bindChain(GEOCODER_TOKENS.inline, { id: "stub", supports: jest.fn(), geocode: jest.fn(async () => POINT) } as never);

    const ok = await new GeocodingService(repo).geocodeAddress(7, REQUEST, "inline");

    expect(ok).toBe(true);
    expect(repo.setGeolocation).toHaveBeenCalledWith(7, POINT, AddressGeocodeStatus.OK, undefined);
  });

  it("stamps NOT_FOUND when the chain matches nothing", async () => {
    const repo = createMockAddressRepository();
    await bindChain(GEOCODER_TOKENS.inline, { id: "stub", supports: jest.fn(), geocode: jest.fn(async () => null) } as never);

    const ok = await new GeocodingService(repo).geocodeAddress(7, REQUEST, "inline");

    expect(ok).toBe(false);
    expect(repo.setGeolocation).toHaveBeenCalledWith(7, null, AddressGeocodeStatus.NOT_FOUND, undefined);
  });

  it("stamps ERROR and does not rethrow when the chain throws", async () => {
    const repo = createMockAddressRepository();
    await bindChain(GEOCODER_TOKENS.inline, {
      id: "stub",
      supports: jest.fn(),
      geocode: jest.fn(async () => {
        throw new Error("upstream down");
      }),
    } as never);

    const ok = await new GeocodingService(repo).geocodeAddress(7, REQUEST, "inline");

    expect(ok).toBe(false);
    expect(repo.setGeolocation).toHaveBeenCalledWith(7, null, AddressGeocodeStatus.ERROR, undefined);
  });

  it("swallows a failure to even record the failure", async () => {
    const repo = createMockAddressRepository();
    repo.setGeolocation.mockRejectedValue(new Error("db gone") as never);
    await bindChain(GEOCODER_TOKENS.inline, { id: "stub", supports: jest.fn(), geocode: jest.fn(async () => POINT) } as never);

    // The caller is mid-transaction on their own business write; nothing here
    // may propagate.
    await expect(new GeocodingService(repo).geocodeAddress(7, REQUEST, "inline")).resolves.toBe(false);
  });

  it("wraps the coordinate write in a SAVEPOINT on the caller's runner", async () => {
    const repo = createMockAddressRepository();
    const runner = fakeRunner();
    await bindChain(GEOCODER_TOKENS.inline, { id: "stub", supports: jest.fn(), geocode: jest.fn(async () => POINT) } as never);

    await new GeocodingService(repo).geocodeAddress(7, REQUEST, "inline", runner as never);

    // TypeORM emits SAVEPOINT / RELEASE SAVEPOINT for a nested
    // startTransaction/commitTransaction. Without this the caller's own COMMIT
    // would be silently downgraded to a ROLLBACK by a failed UPDATE here, and
    // their meter would vanish behind a 200.
    expect(runner.startTransaction).toHaveBeenCalled();
    expect(runner.commitTransaction).toHaveBeenCalled();
  });

  it("rolls the SAVEPOINT back, not the caller's transaction, when the write fails", async () => {
    const repo = createMockAddressRepository();
    repo.setGeolocation.mockRejectedValueOnce(new Error("constraint violation") as never);
    const runner = fakeRunner();
    await bindChain(GEOCODER_TOKENS.inline, { id: "stub", supports: jest.fn(), geocode: jest.fn(async () => POINT) } as never);

    await new GeocodingService(repo).geocodeAddress(7, REQUEST, "inline", runner as never);

    expect(runner.rollbackTransaction).toHaveBeenCalled();
  });

  it("resolves the chain named by the caller", async () => {
    const repo = createMockAddressRepository();
    const inline = jest.fn(async () => POINT);
    const full = jest.fn(async () => ({ ...POINT, source: "full" }));
    await bindChain(GEOCODER_TOKENS.inline, { id: "inline", supports: jest.fn(), geocode: inline } as never);
    await bindChain(GEOCODER_TOKENS.full, { id: "full", supports: jest.fn(), geocode: full } as never);

    await new GeocodingService(repo).geocodeAddress(7, REQUEST, "full");

    expect(full).toHaveBeenCalled();
    expect(inline).not.toHaveBeenCalled();
  });
});
