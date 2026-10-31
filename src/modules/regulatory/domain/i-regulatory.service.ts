import type { RegulatoryStatusDTO, RegulatoryStatusQueryDTO } from "../api/regulatory.dtos.js";

export interface IRegulatoryService {
  /** The regulatory status of an operation's subjects, for the CRM's badges. */
  status(query: RegulatoryStatusQueryDTO): Promise<RegulatoryStatusDTO[]>;
}
