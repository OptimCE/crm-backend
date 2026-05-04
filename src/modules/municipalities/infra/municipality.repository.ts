import { inject, injectable } from "inversify";
import { In, type QueryRunner } from "typeorm";
import { AppDataSource } from "../../../shared/database/database.connector.js";
import type { IMunicipalityRepository } from "../domain/i-municipality.repository.js";
import { Municipality } from "../domain/municipality.models.js";
import type { MunicipalitySearchQuery } from "../api/municipality.dtos.js";

@injectable()
export class MunicipalityRepository implements IMunicipalityRepository {
  constructor(@inject("AppDataSource") private readonly dataSource: typeof AppDataSource) {}

  async searchMunicipalities(query: MunicipalitySearchQuery, query_runner?: QueryRunner): Promise<[Municipality[], number]> {
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;

    // Two-step: first match the NIS codes that satisfy the filter (joining postal codes
    // only when needed), then reload the matched municipalities with ALL their postal
    // codes. This keeps the response complete even when a single postal_code filter is
    // used.
    const idsQb = manager
      .createQueryBuilder(Municipality, "muni")
      .select("muni.nis_code", "nis_code")
      .orderBy("muni.fr_name", "ASC");

    if (query.postal_code) {
      idsQb.innerJoin("muni.postal_codes", "pc_filter", "pc_filter.postal_code = :pc", { pc: query.postal_code });
    }
    if (query.name) {
      const like = `%${query.name}%`;
      idsQb.andWhere("(muni.fr_name ILIKE :like OR muni.nl_name ILIKE :like OR muni.de_name ILIKE :like)", { like });
    }

    const take = query.limit;
    const skip = (query.page - 1) * take;
    idsQb.offset(skip).limit(take);

    // Total count without pagination — clone and count distinct nis_codes.
    const countQb = manager.createQueryBuilder(Municipality, "muni").select("COUNT(DISTINCT muni.nis_code)", "cnt");
    if (query.postal_code) {
      countQb.innerJoin("muni.postal_codes", "pc_filter", "pc_filter.postal_code = :pc", { pc: query.postal_code });
    }
    if (query.name) {
      const like = `%${query.name}%`;
      countQb.andWhere("(muni.fr_name ILIKE :like OR muni.nl_name ILIKE :like OR muni.de_name ILIKE :like)", { like });
    }

    const [idsRows, countRow] = await Promise.all([idsQb.getRawMany<{ nis_code: number }>(), countQb.getRawOne<{ cnt: string }>()]);
    const total = countRow ? Number(countRow.cnt) : 0;
    const ids = idsRows.map((r) => Number(r.nis_code));

    if (ids.length === 0) {
      return [[], total];
    }

    const items = await manager.find(Municipality, {
      where: { nis_code: In(ids) },
      relations: ["postal_codes"],
      order: { fr_name: "ASC" },
    });

    return [items, total];
  }

  async findManyByNisCodes(nis_codes: number[], query_runner?: QueryRunner): Promise<Municipality[]> {
    if (nis_codes.length === 0) {
      return [];
    }
    const manager = query_runner ? query_runner.manager : this.dataSource.manager;
    return manager.find(Municipality, {
      where: { nis_code: In(nis_codes) },
      relations: ["postal_codes"],
    });
  }
}
