import {Document} from "../domain/document.models.js";
import {DocumentExposedDTO} from "../api/document.dtos.js";

export function toDocumentExposed(document: Document): DocumentExposedDTO{
    return {
        file_name: document.file_name,
        file_size: document.file_size,
        file_type: document.file_type,
        upload_date: document.upload_date,
        id: document.id
    }
}