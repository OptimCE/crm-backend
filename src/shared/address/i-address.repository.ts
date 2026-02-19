import type { CreateAddressDTO } from "./address.dtos.js";
import type { QueryRunner } from "typeorm";
import type { Address } from "./address.models.js";

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
}
