import type { Request, Response } from "express";
import type { IHealthService } from "../domain/i-health.service.js";
import { inject, injectable } from "inversify";

@injectable()
export class HealthController {
  constructor(@inject("HealthService") private readonly healthService: IHealthService) {}

  async getHealth(req: Request, res: Response): Promise<void> {
    const report = await this.healthService.checkAll();
    const statusCode = report.status === "ok" ? 200 : 503;
    res.status(statusCode).json(report);
  }

  async getDbHealth(req: Request, res: Response): Promise<void> {
    const result = await this.healthService.checkDb();
    const statusCode = result.status === "ok" ? 200 : 503;
    res.status(statusCode).json(result);
  }

  async getDocumentHealth(req: Request, res: Response): Promise<void> {
    const result = await this.healthService.checkDocuments();
    const statusCode = result.status === "ok" ? 200 : 503;
    res.status(statusCode).json(result);
  }
}
