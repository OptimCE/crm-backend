import { inject, injectable } from "inversify";
import { AppDataSource } from "../database/database.connector.js";
import type { AddressGeolocation, IAddressRepository } from "./i-address.repository.js";
import { CreateAddressDTO } from "./address.dtos.js";
import type { QueryRunner } from "typeorm";
import { Address } from "./address.models.js";
import { AddressGeocodeStatus, AddressGeoPrecision } from "./address.types.js";
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
    // A caller-supplied pin is stored straight away with MANUAL precision, so a
    // pin-drop survives even when no geocoder is configured. Note the dedup
    // above runs on the postal fields only: a pin offered for an address that
    // already exists is ignored here on purpose, because silently moving a
    // shared address would move every meter and member pointing at it.
    const has_pin = new_address.latitude !== undefined && new_address.longitude !== undefined;
    const new_address_model = manager.create(Address, {
      street: new_address.street,
      number: new_address.number,
      city: new_address.city,
      postcode: new_address.postcode,
      latitude: has_pin ? new_address.latitude : null,
      longitude: has_pin ? new_address.longitude : null,
      geo_precision: has_pin ? AddressGeoPrecision.MANUAL : null,
      geo_source: has_pin ? "manual" : null,
      geocoded_at: has_pin ? new Date() : null,
      geocode_status: has_pin ? AddressGeocodeStatus.OK : AddressGeocodeStatus.NEVER,
    });

    return await manager.save(new_address_model);
  }

  async setGeolocation(address_id: number, geo: AddressGeolocation | null, status: AddressGeocodeStatus, query_runner?: QueryRunner): Promise<void> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    // A failed attempt stamps the status and the timestamp but leaves any
    // previously resolved coordinate alone — a transient outage must not blank
    // a good point off the map.
    const patch = geo
      ? {
          latitude: geo.latitude,
          longitude: geo.longitude,
          geo_precision: geo.precision,
          geo_source: geo.source,
          geocoded_at: new Date(),
          geocode_status: status,
        }
      : { geocoded_at: new Date(), geocode_status: status };

    await manager.update(Address, { id: address_id }, patch);
  }

  async findPendingGeocode(limit: number, query_runner?: QueryRunner): Promise<Address[]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    return manager.find(Address, {
      where: { geocode_status: AddressGeocodeStatus.NEVER },
      order: { id: "ASC" },
      take: limit,
    });
  }

  async countPendingGeocode(query_runner?: QueryRunner): Promise<number> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    return manager.count(Address, { where: { geocode_status: AddressGeocodeStatus.NEVER } });
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
