import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { container } from "../../../src/container/di-container.js";
import { AddressGeoPrecision } from "../../../src/shared/address/address.types.js";
import type { Address } from "../../../src/shared/address/address.models.js";
import { GeocodingService } from "../../../src/modules/geocoding/infra/geocoding.service.js";
import { GEOCODER_TOKENS } from "../../../src/modules/geocoding/domain/geocoding.types.js";
import type { IGeocoder } from "../../../src/modules/geocoding/domain/i-geocoder.js";
import { createMockAddressRepository } from "../../repository_mocked/address.repository.mock.js";

function address(id: number): Address {
  return { id, street: "Main St", number: id, postcode: "1000", city: "Bruxelles", supplement: null } as unknown as Address;
}

async function bindFull(geocode: () => Promise<unknown>): Promise<void> {
  if (container.isBound(GEOCODER_TOKENS.full)) {
    await container.unbind(GEOCODER_TOKENS.full);
  }
  container.bind<IGeocoder>(GEOCODER_TOKENS.full).toConstantValue({ id: "full", supports: jest.fn(), geocode } as never);
}

afterEach(async () => {
  if (container.isBound(GEOCODER_TOKENS.full)) {
    await container.unbind(GEOCODER_TOKENS.full);
  }
});

describe("(Unit) GeocodingService.runBackfill", () => {
  it("refuses with 503 when no chain is configured", async () => {
    // Reporting a batch of phantom NOT_FOUNDs instead would leave `remaining`
    // unchanged and an operator looping forever.
    const repo = createMockAddressRepository();

    await expect(new GeocodingService(repo).runBackfill(10)).rejects.toMatchObject({ statusCode: 503 });
    expect(repo.findPendingGeocode).not.toHaveBeenCalled();
  });

  it("classifies each row and reports what is left", async () => {
    const repo = createMockAddressRepository();
    repo.findPendingGeocode.mockResolvedValue([address(1), address(2), address(3)] as never);
    repo.countPendingGeocode.mockResolvedValue(7 as never);

    let call = 0;
    await bindFull(async () => {
      call += 1;
      if (call === 1) return { latitude: 50.85, longitude: 4.35, precision: AddressGeoPrecision.ROOFTOP, source: "full" };
      if (call === 2) return null;
      throw new Error("upstream down");
    });

    const result = await new GeocodingService(repo).runBackfill(3);

    expect(result).toEqual({ attempted: 3, succeeded: 1, not_found: 1, errored: 1, remaining: 7 });
  });

  it("processes rows one at a time rather than in a burst", async () => {
    const repo = createMockAddressRepository();
    repo.findPendingGeocode.mockResolvedValue([address(1), address(2), address(3)] as never);
    repo.countPendingGeocode.mockResolvedValue(0 as never);

    let inFlight = 0;
    let maxInFlight = 0;
    await bindFull(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight -= 1;
      return null;
    });

    await new GeocodingService(repo).runBackfill(3);

    // Both upstream services are free and public; a parallel burst from a batch
    // endpoint is how an IP gets blocked.
    expect(maxInFlight).toBe(1);
  });

  it("reports an empty batch honestly", async () => {
    const repo = createMockAddressRepository();
    repo.findPendingGeocode.mockResolvedValue([] as never);
    repo.countPendingGeocode.mockResolvedValue(0 as never);
    await bindFull(async () => null);

    const result = await new GeocodingService(repo).runBackfill(50);

    expect(result).toEqual({ attempted: 0, succeeded: 0, not_found: 0, errored: 0, remaining: 0 });
  });

  it("surfaces a queue read failure as a 400 rather than a raw exception", async () => {
    const repo = createMockAddressRepository();
    repo.findPendingGeocode.mockRejectedValue(new Error("db down") as never);
    await bindFull(async () => null);

    await expect(new GeocodingService(repo).runBackfill(10)).rejects.toMatchObject({ statusCode: 400 });
  });
});
