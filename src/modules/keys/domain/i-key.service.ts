import { CreateKeyDTO, KeyDTO, KeyPartialDTO, KeyPartialQuery, UpdateKeyDTO } from "../api/key.dtos.js";
import { Pagination } from "../../../shared/dtos/ApiResponses.js";

/**
 * Interface for Key Service.
 * Defines contract for management of allocation keys and simulations.
 */
export interface IKeyService {
    /**
     * Retrieves valid keys as a partial list.
     * @param query - Query parameters for filtering/paging.
     * @returns Tuple of [KeyPartialDTO[], Pagination].
     */
    getPartialKeyList(query: KeyPartialQuery): Promise<[KeyPartialDTO[], Pagination]>
    /**
     * Retrieves details of a specific key.
     * @param key_id - ID of the key.
     * @returns KeyDTO with full details (iterations/consumers).
     */
    getKey(key_id: number): Promise<KeyDTO>
    /**
     * Generates a download (e.g. Excel) for a key.
     * @param key_id - ID of the key.
     * @returns Exportable file/blob (typed as any currently).
     */
    downloadKey(key_id: number): Promise<any>
    /**
     * Creates a new key definition.
     * @param new_key - DTO containing key details.
     */
    addKey(new_key: CreateKeyDTO): Promise<void>
    /**
     * Updates an existing key definition.
     * @param updated_key - DTO with updated details.
     */
    updateKey(updated_key: UpdateKeyDTO): Promise<void>
    /**
     * Deletes a key.
     * @param key_id - ID of the key to delete.
     */
    deleteKey(key_id: number): Promise<void>
}