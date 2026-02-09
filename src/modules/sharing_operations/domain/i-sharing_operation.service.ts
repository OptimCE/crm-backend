import {
    AddConsumptionDataDTO,
    AddKeyToSharingOperationDTO,
    AddMeterToSharingOperationDTO,
    CreateSharingOperationDTO,
    PatchKeyToSharingOperationDTO,
    PatchMeterToSharingOperationDTO,
    RemoveMeterFromSharingOperationDTO,
    SharingOpConsumptionDTO,
    SharingOperationConsumptionQuery,
    SharingOperationDTO,
    SharingOperationPartialDTO,
    SharingOperationPartialQuery
} from "../api/sharing_operation.dtos.js";
import { Pagination } from "../../../shared/dtos/ApiResponses.js";

/**
 * Interface for Sharing Operation Service.
 * Defines contract for managing sharing operations, allocations, and consumption.
 */
export interface ISharingOperationService {
    /**
     * Retrieves a paginated list of sharing operations.
     * @param query - Filtering and paging parameters.
     * @returns Tuple [List, Pagination].
     */
    getSharingOperationList(query: SharingOperationPartialQuery): Promise<[SharingOperationPartialDTO[], Pagination]>;

    /**
     * Retrieves full details of a sharing operation.
     * @param id_sharing - Sharing operation ID.
     * @returns Full SharingOperationDTO.
     */
    getSharingOperation(id_sharing: number): Promise<SharingOperationDTO>;

    /**
     * Retrieves consumption data for a sharing operation.
     * @param id_sharing - Sharing operation ID.
     * @param query - Date range.
     * @returns Consumption DTO.
     */
    getSharingOperationConsumption(id_sharing: number, query: SharingOperationConsumptionQuery): Promise<SharingOpConsumptionDTO>;

    /**
     * Generates an Excel file buffer with consumption data.
     * @param id_sharing - Sharing operation ID.
     * @param query - Date range.
     * @returns Excel file buffer.
     */
    downloadSharingOperationConsumptions(id_sharing: number, query: SharingOperationConsumptionQuery): Promise<Buffer>;

    /**
     * Creates a new sharing operation.
     * @param new_sharing_operations - DTO for creation.
     */
    createSharingOperation(new_sharing_operations: CreateSharingOperationDTO): Promise<void>;

    /**
     * Adds an allocation key to a sharing operation (request status).
     * @param new_key_to_operation - DTO with key ID and sharing ID.
     */
    addKeyToSharing(new_key_to_operation: AddKeyToSharingOperationDTO): Promise<void>;

    /**
     * Adds meters to a sharing operation.
     * @param new_meters_to_operation - DTO with meter EANs and sharing ID.
     */
    addMeterToSharing(new_meters_to_operation: AddMeterToSharingOperationDTO): Promise<void>;

    /**
     * Uploads consumption data file.
     * @param upload_consumption_data - DTO containing file and sharing ID.
     */
    addConsumptionDataToSharing(upload_consumption_data: AddConsumptionDataDTO): Promise<void>;

    /**
     * Updates key status (approve/reject).
     * @param patched_key_status - DTO with key status updates.
     */
    patchKeyStatus(patched_key_status: PatchKeyToSharingOperationDTO): Promise<void>;

    /**
     * Updates meter status in operation.
     * @param patched_meter_status - DTO with meter status updates.
     */
    patchMeterStatus(patched_meter_status: PatchMeterToSharingOperationDTO): Promise<void>;

    /**
     * Deletes a sharing operation.
     * @param id_sharing - Sharing operation ID.
     */
    deleteSharingOperation(id_sharing: number): Promise<void>;

    /**
     * Removes a meter from a sharing operation.
     * @param removed_meter_status - DTO identifying meter and sharing operation.
     */
    deleteMeterFromSharingOperation(removed_meter_status: RemoveMeterFromSharingOperationDTO): Promise<void>;
}