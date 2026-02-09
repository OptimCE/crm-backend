import {
    SharingOpConsumption,
    SharingOperation,
    SharingOperationKey
} from "../domain/sharing_operation.models.js";
import {
    SharingOpConsumptionDTO,
    SharingOperationDTO,
    SharingOperationKeyDTO,
    SharingOperationPartialDTO
} from "../api/sharing_operation.dtos.js";
import {toKeyPartialDTO} from "../../keys/shared/to_dto.js";
import {SharingKeyStatus} from "./sharing_operation.types.js";

export function toSharingOperationPartialDTO(value: SharingOperation): SharingOperationPartialDTO {
    return {
        id: value.id,
        type: value.type,
        name: value.name,
    }
}
export function toSharingOperationKeyDTO(entity: SharingOperationKey): SharingOperationKeyDTO {
    const dto = new SharingOperationKeyDTO();
    dto.id = entity.id;
    dto.start_date = new Date(entity.start_date);
    // Handle nullable end_date
    dto.end_date = entity.end_date ? new Date(entity.end_date) : undefined as any;
    dto.status = entity.status;

    if (entity.allocation_key) {
        dto.key = toKeyPartialDTO(entity.allocation_key);
    }

    return dto;
}

export function toSharingOperation(value: SharingOperation): SharingOperationDTO {
    const dto = new SharingOperationDTO();

    // Map parent fields (from SharingOperationPartialDTO)
    dto.id = value.id;
    dto.name = value.name;
    dto.type = value.type;

    // Initialize arrays
    dto.history_keys = [];

    // Safety check if keys are not loaded
    const keys = value.keys || [];

    // Logic to categorize keys
    // Since the Repository sorts keys by start_date DESC (newest first):
    // 1. The first PENDING key found is 'key_waiting_approval'.
    // 2. The first APPROVED key found is the active 'key'.
    // 3. All others go to 'history_keys'.

    let activeKeyFound = false;
    let pendingKeyFound = false;

    for (const keyEntity of keys) {
        const keyDto = toSharingOperationKeyDTO(keyEntity);

        if (keyEntity.status === SharingKeyStatus.PENDING && !pendingKeyFound) {
            dto.key_waiting_approval = keyDto;
            pendingKeyFound = true;
        } else if (keyEntity.status === SharingKeyStatus.APPROVED && !activeKeyFound) {
            dto.key = keyDto;
            activeKeyFound = true;
        } else {
            // Any subsequent Approved/Pending keys, or any Rejected keys, go to history
            dto.history_keys.push(keyDto);
        }
    }

    return dto;
}

export function toSharingOperationConsumptions(values: SharingOpConsumption[]): SharingOpConsumptionDTO {
    const dto = new SharingOpConsumptionDTO();

    if (values.length > 0) {
        // Attempt to extract the ID from the first element if the relation is loaded.
        // Note: Since the repository filter uses 'consumption.sharing_operation = :id',
        // the full relation object might not be loaded. We default to 0 if missing.
        dto.id = (values[0].sharing_operation as any)?.id ?? 0;
    } else {
        dto.id = 0;
    }

    // Map fields to arrays (Structure of Arrays)
    dto.timestamps = values.map(v => v.timestamp.toISOString());
    dto.gross = values.map(v => v.gross ?? 0);
    dto.net = values.map(v => v.net ?? 0);
    dto.shared = values.map(v => v.shared ?? 0);

    // Map camelCase entity fields to snake_case DTO fields
    dto.inj_gross = values.map(v => v.inj_gross ?? 0);
    dto.inj_net = values.map(v => v.inj_net ?? 0);
    dto.inj_shared = values.map(v => v.inj_shared ?? 0);

    return dto;
}