import { GLOBAL_ERRORS, LocalError } from "../../../shared/errors/errors.js";
// Errors range: 60000 - 69999
export const METER_ERRORS = {
  ...GLOBAL_ERRORS,

  ADD_METER: {
    ALREADY_EXIST: new LocalError(60000, "meter.add_meter.already_exist"),
    DATABASE_ADD: new LocalError(60001, "meter.add_meter.database_add"),
  },
  DELETE_METER: {
    DATABASE_DELETE: new LocalError(60002, "meter:delete_meter.database_delete"),
  },
  DOWNLOAD_METER_CONSUMPTIONS: {
    NO_CONSUMPTIONS: new LocalError(60003, "meter:download_meter_consumptions:no_consumptions"),
  },
  PATCH_METER_DATA: {
    METER_NOT_FOUND: new LocalError(60004, "meter:patch_meter_data.meter_not_found"),
    DATABASE_UPDATE: new LocalError(60005, "meter:patch_meter_data.database_update"),
  },
  ADD_METER_DATA: {
    CONFLICT_CONFIG_ALREADY_EXISTING: new LocalError(60006, "meter:add_meter_data.conflict_config_already_existing"),
  },
  GET_METER: {
    METER_NOT_FOUND: new LocalError(60007, "meter:get_meter.meter_not_found"),
  },
  UPDATE_METER: {
    DATABASE_UPDATE: new LocalError(60008, "meter:update_meter.database_update"),
  },
  DELETE_METER_DATA: {
    NOT_FOUND: new LocalError(60009, "meter:delete_meter_data.not_found"),
    DELETE_DATABASE: new LocalError(600010, "meter:delete_meter_data.delete_database"),
    UPDATE_DATABASE: new LocalError(600011, "meter:delete_meter_data.update_database"),
  },
  VALIDATION: {
    WRONG_TYPE: {
      METER_DATA_STATUS: new LocalError(65000, "meter:validation.wrong_type.meter_data_status"),
      METER_RATE: new LocalError(65001, "meter:validation.wrong_type.meter_rate"),
      CLIENT_TYPE: new LocalError(65002, "meter:validation.wrong_type.client_type"),
      INJECTION_STATUS: new LocalError(65003, "meter:validation.wrong_type.injection_status"),
      PRODUCTION_CHAIN: new LocalError(65004, "meter:validation.wrong_type.production_chain"),
      TARIF_GROUP: new LocalError(65005, "meter:validation.wrong_type.tarif_group"),
      READING_FREQUENCY: new LocalError(65006, "meter:validation.wrong_type.reading_frequency"),
      SHARING_OPERATION_METER_QUERY_TYPE: new LocalError(65007, "meter:validation.wrong_type.sharing_operation_meter_query_type"),
    },
    CREATE_METER: {
      PHASE_NUMBER_MIN_1: new LocalError(65007, "meter:validation.create_meter.phase_number_min_1"),
    },
  },
};
