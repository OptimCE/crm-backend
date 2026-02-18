import { GLOBAL_ERRORS, LocalError } from "../../../shared/errors/errors.js";
// Errors range: 40000 - 49999
export const KEY_ERRORS = {
  ...GLOBAL_ERRORS,
  GET_KEY: {
    KEY_NOT_FOUND: new LocalError(40000, "key:get_key.key_not_found"),
  },
  DOWNLOAD_KEY: {
    DOWNLOAD_KEY: new LocalError(40001, "key:download_key.download_key"),
    ADD_CREDIT_EXCEL: new LocalError(40002, "key:download_key.add_credit"),
  },
  ADD_KEY: {
    ADD_KEY_DATABASE: new LocalError(40003, "key:add_key.add_key_database"),
    ADD_CHILDREN_DATABASE: new LocalError(40004, "key:add_key.add_children_database"),
  },
  UPDATE_KEY: {
    KEY_NOT_FOUND: new LocalError(40005, "key:update_key.key_not_found"),
    UPDATE_KEY_DATABASE: new LocalError(40006, "key:update_key.update_key_database"),
    DELETE_CHILDREN_DATABASE: new LocalError(40007, "key:update_key.delete_children_database"),
    ADD_CHILDREN_DATABASE: new LocalError(40008, "key:update_key.add_children_database"),
  },
  DELETE_KEY: {
    DATABASE_DELETE: new LocalError(40009, "key:delete_key.database_delete"),
  },
  VALIDATION: {
    CREATE_CONSUMER: {
      ENERGY_ALLOCATED_PERCENTAGE_MIN_MINUS_1: new LocalError(45000, "key:validation.create_consumer.energy_allocated_percentage_min_minus_1"),
      ENERGY_ALLOCATED_PERCENTAGE_MAX_1: new LocalError(45001, "key:validation.create_consumer.energy_allocated_percentage_max_1"),
    },
    CREATE_ITERATION: {
      NUMBER_WRONG_MIN_0: new LocalError(45002, "key:validation.create_iteration.number_min_0"),
      NUMBER_WRONG_MAX_2: new LocalError(45003, "key:validation.create_iteration.number_max_2"),
      ENERGY_ALLOCATED_PERCENTAGE_MIN_0: new LocalError(45004, "key:validation.create_iteration.energy_allocated_percentage_min_0"),
      CONSUMER_SUM_1: new LocalError(45005, "key:validation.create_iteration.consumer_sum_1"),
    },
    CREATE_KEY: {
      ITERATION_SUM_1: new LocalError(45006, "key:validation.create_key.iteration_sum_1"),
    },
    UPDATE_KEY: {
      ITERATION_SUM_1: new LocalError(45007, "key:validation.update_key.iteration_sum_1"),
    },
  },
};
