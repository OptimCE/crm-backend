import { inject, injectable } from "inversify";
import { AppDataSource } from "../database/database.connector.js";
import type { IAddressRepository } from "./i-address.repository.js";
import { CreateAddressDTO } from "./address.dtos.js";
import type { QueryRunner } from "typeorm";
import { Address } from "./address.models.js";
//TODO: When an address in an entity is updated, I prefer add a new one. Add a cron job later on to fetch all the address linked to no one and delete them
@injectable()
export class AddressRepository implements IAddressRepository {
  constructor(@inject("AppDataSource") private readonly dataSource: typeof AppDataSource) {}

  /**
   * Adds a new address if it doesn't exist, otherwise returns the existing one.
   * Matches against street, number, city, postcode, and supplement.
   * @param new_address - DTO with address details.
   * @param query_runner - Optional transaction runner.
   * @returns Address entity (new or existing).
   */
  async addAddress(new_address: CreateAddressDTO, query_runner?: QueryRunner): Promise<Address> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    // Check if address already exist
    let qb = manager.createQueryBuilder(Address, "address");
    qb = qb
      .where("address.street = :street", { street: new_address.street })
      .andWhere("address.number = :number", { number: new_address.number })
      .andWhere("address.city = :city", { city: new_address.city })
      .andWhere("address.postcode = :postcode", { postcode: new_address.postcode });

    // Handle 'supplement' explicitly because strict equality with NULL works differently in SQL
    if (new_address.supplement) {
      qb = qb.andWhere("address.supplement = :supplement", { supplement: new_address.supplement });
    } else {
      qb = qb.andWhere("address.supplement IS NULL");
    }
    const existing_address = await qb.getOne();

    // 2. Return existing if found
    if (existing_address) {
      return existing_address;
    }
    const new_address_model = manager.create(Address, {
      street: new_address.street,
      number: new_address.number,
      city: new_address.city,
      postcode: new_address.postcode,
    });

    return await manager.save(new_address_model);
  }

  async getAddress(address_id: number, query_runner?: QueryRunner): Promise<Address | null> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    let qb = manager.createQueryBuilder(Address, "address");
    qb = qb.where("address.id = :id", { id: address_id });

    return qb.getOne();
  }

  async deleteAddress(address: Address, query_runner?: QueryRunner): Promise<Address> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    return await manager.remove(address);
  }
}
