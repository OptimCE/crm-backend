/**
 * Represents a standardized application error with code and message
 */
export class LocalError {
  /** Numeric error code for identifying the error type */
  readonly errorCode: number;
  /** Human-readable error message */
  readonly message: string;
  field?: string;
  value?: unknown;

  /**
   * Creates a new LocalError instance
   * @param {number} errorCode - Numeric identifier for the error
   * @param {string} message - Human-readable error message
   * @param {string} field - Dynamic field
   * @param {unknown} value - Dynamic value
   */
  constructor(errorCode: number, message: string, field?: string, value?: unknown) {
    this.errorCode = errorCode;
    this.message = message;
    this.field = field;
    this.value = value;
  }
}
/** Success status code constant */
export const SUCCESS: number = 0;

/**
 * Collection of predefined application errors organized by category
 * Error range: 0 - 9999
 */
export const GLOBAL_ERRORS = {
  SUCCESS: new LocalError(0, "global_error:success"),

  // General Errors
  EXCEPTION: new LocalError(1, "global_error:exception"),
  TIMEOUT: new LocalError(2, "global_error:timeout"),
  // Miscellaneous Errors
  DECORATOR: new LocalError(3, "global_error:decorator"),
  UNAUTHORIZED: new LocalError(4, "global_error:unauthorized"),
  AUTHORIZATION_MISSING: new LocalError(5, "global_error:authorization_missing"),
  UNAUTHENTICATED: new LocalError(6, "global_error:unauthenticated"),

  DATABASE: {
    QUERY_RUNNER_MANDATORY: new LocalError(1000, "global_error:database.query_runner_mandatory"),
  },
  GENERIC_VALIDATION: {
    WRONG_TYPE: {
      STRING: new LocalError(5000, "global_error:validation.generic.wrong_type.string"),
      INTEGER: new LocalError(5001, "global_error:validation.generic.wrong_type.integer"),
      EMAIL: new LocalError(5002, "global_error:validation.generic.wrong_type.email"),
      FILE: new LocalError(5003, "global_error:validation.generic.wrong_type.file"),
      BOOLEAN: new LocalError(5004, "global_error:validation.generic.wrong_type.boolean"),
      DATE: new LocalError(5005, "global_error:validation.generic.wrong_type.date"),
      NUMBER: new LocalError(5006, "global_error:validation.generic.wrong_type.number"),
      ARRAY: new LocalError(5007, "global_error:validation.generic.wrong_type.array"),
    },
    EMPTY: new LocalError(5008, "global_error:validation.generic.empty"),
    SORT: new LocalError(5009, "global_error:validation.generic.sort"),
    WRONG_ROLE: {
      MEMBER_MANAGER_ADMIN: new LocalError(5010, "global_error:validation.generic.wrong_role.member_manager_admin"),
    },
    MIN_1: new LocalError(5011, "global_error:validation.generic.min_1"),
  },
};
