import { injectable } from "inversify";
import type { IStorageService } from "../i-storage.service.js";
import config from "config";
import { call } from "../../services/api_call.js";
import logger from "../../monitor/logger.js";
import { AppError } from "../../middlewares/error.middleware.js";
import { GLOBAL_ERRORS } from "../../errors/errors.js";
import FormData from "form-data";
import { UploadedDocument } from "../storage.dtos.js";
interface OpenFilesUploadResponse {
  url: string;
  type: string;
}
interface OpenFilesDeleteResponse {
  success: boolean;
}
@injectable()
export class OpenfileStorageService implements IStorageService {
  private token!: string;
  private db_name!: string;
  private target!: string;
  constructor() {
    this.token = config.get("storage_service.settings.token");
    this.db_name = config.get("storage_service.settings.db_name");
    this.target = config.get("storage_service.settings.target");
  }

  async getDocument(url: string): Promise<Buffer> {
    const response = await call<ArrayBuffer>({
      method: "GET",
      url: url,
      responseType: "arraybuffer",
      params: {
        token: this.token,
      },
    });
    if (response) {
      return Buffer.from(response);
    } else {
      logger.error({ operation: "getDocument" }, "An error occurred while trying to fetch document");
      throw new AppError(GLOBAL_ERRORS.EXCEPTION, 400);
    }
  }

  async uploadDocument(file: Express.Multer.File): Promise<UploadedDocument> {
    const url = this.target + "/upload/" + this.db_name + "/?token=" + this.token + "&hostname=1";
    const form = new FormData();
    form.append("file", file.buffer, file.originalname);
    const response = await call<OpenFilesUploadResponse>(
      {
        method: "POST",
        url: url,
        data: form,
      },
      { "Content-Type": "multipart/form-data" },
    );
    if (response && response.url) {
      return { url: response.url, file_type: response.type };
    }
    logger.error({ operation: "uploadDocument" }, "An error occurred while trying to upload a document on Openfiles");
    throw new AppError(GLOBAL_ERRORS.EXCEPTION, 400);
  }

  async deleteDocument(url: string): Promise<void> {
    const response = await call<OpenFilesDeleteResponse>({
      method: "DELETE",
      url: url,
      params: {
        token: this.token,
      },
    });
    if (!response.success) {
      logger.error({ operation: "deleteDocument" }, "An error occurred while trying to delete a document on Openfile");
      throw new AppError(GLOBAL_ERRORS.EXCEPTION, 400);
    }
  }
}
