import { inject, injectable } from "inversify";
import { plainToInstance } from "class-transformer";
import { RegulatoryStatusDTO, type RegulatoryStatusQueryDTO } from "../api/regulatory.dtos.js";
import type { IRegulatoryRepository } from "../domain/i-regulatory.repository.js";
import type { IRegulatoryService } from "../domain/i-regulatory.service.js";

@injectable()
export class RegulatoryService implements IRegulatoryService {
  constructor(@inject("RegulatoryRepository") private readonly regulatory_repository: IRegulatoryRepository) {}

  async status(query: RegulatoryStatusQueryDTO): Promise<RegulatoryStatusDTO[]> {
    const rows = await this.regulatory_repository.latestBySubject({
      id_sharing_operation: query.id_sharing_operation,
      subject_type: query.subject_type,
      subject_ref: query.subject_ref,
      date: query.date,
    });
    return rows.map((row) => plainToInstance(RegulatoryStatusDTO, row, { excludeExtraneousValues: true }));
  }
}
