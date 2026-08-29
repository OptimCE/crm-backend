import type { CreateAddressDTO } from "./address.dtos.js";
import type { QueryRunner } from "typeorm";
import type { Address } from "./address.models.js";
import type { AddressGeocodeStatus, AddressGeoPrecision } from "./address.types.js";

/** A resolved coordinate ready to be written back onto an address. */
export interface AddressGeolocation {
  latitude: number;
  longitude: number;
  precision: AddressGeoPrecision;
  source: string;
}

/**
 * Interface for Address Repository.
 * Handles persistence of address data.
 */
export interface IAddressRepository {
  /**
   * Creates a new address or retrieves an existing one with the same properties.
   * Prevents duplication of addresses.
   * @param new_address - DTO containing address details.
   * @param query_runner - Optional query runner.
   * @returns The created or existing Address entity.
   */
  addAddress(new_address: CreateAddressDTO, query_runner?: QueryRunner): Promise<Address>;

  /**
   * Deletes an address entity.
   * @param address - The address entity to delete.
   * @param query_runner - Optional query runner.
   * @returns The deleted address entity.
   */
  deleteAddress(address: Address, query_runner?: QueryRunner): Promise<Address>;

  /**
   * Retrieves an address by its ID.
   * @param address_id - The ID of the address.
   * @param query_runner - Optional query runner.
   * @returns Address entity or null if not found.
   */
  getAddress(address_id: number, query_runner?: QueryRunner): Promise<Address | null>;

  /**
   * Records the outcome of a geocoding attempt on one address.
   *
   * Always stamps `geocoded_at` and `geocode_status`, even for a failure —
   * that is what stops the backfill from retrying the same dead address on
   * every run. Pass `geo = null` to record a failure without touching the
   * previously stored coordinate.
   *
   * @param address_id - The address to stamp.
   * @param geo - The resolved coordinate, or null for a failed attempt.
   * @param status - The outcome to record.
   * @param query_runner - Optional query runner. Callers inside a transaction
   *   MUST wrap this in `withSavepoint`: a failure here would otherwise abort
   *   their business write.
   */
  setGeolocation(address_id: number, geo: AddressGeolocation | null, status: AddressGeocodeStatus, query_runner?: QueryRunner): Promise<void>;

  /**
   * Addresses awaiting a first geocoding attempt (`geocode_status = NEVER`),
   * oldest first. Backed by the partial index `idx_address_geocode_queue`.
   *
   * @param limit - Maximum rows to return.
   * @param query_runner - Optional query runner.
   */
  findPendingGeocode(limit: number, query_runner?: QueryRunner): Promise<Address[]>;

  /**
   * How many addresses are still queued. Drives the backfill's `remaining`, so
   * an operator can loop until it reaches zero.
   */
  countPendingGeocode(query_runner?: QueryRunner): Promise<number>;
}
