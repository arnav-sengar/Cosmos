/**
 * Standardized provider-neutral persistence errors for TA-09.
 *
 * Adapters must map provider-specific failures into this contract without
 * hiding unsupported capabilities or weakening consistency semantics.
 */

export const PERSISTENCE_ERROR_CODES = [
  "NOT_FOUND",
  "ALREADY_EXISTS",
  "VALIDATION_FAILED",
  "REFERENCE_INVALID",
  "VERSION_CONFLICT",
  "AUTHORIZATION_DENIED",
  "INTEGRITY_VIOLATION",
  "RESOURCE_LIMIT_EXCEEDED",
  "TEMPORARY_FAILURE",
  "RESOURCE_UNAVAILABLE",
  "UNSUPPORTED_OPERATION",
] as const;

export type PersistenceErrorCode =
  (typeof PERSISTENCE_ERROR_CODES)[number];

/**
 * Stable error envelope shared by repositories, adapters, and the runner.
 *
 * retryable describes whether retrying the same operation may reasonably
 * succeed; it does not itself authorize automatic retries.
 */
export interface PersistenceError {
  readonly code: PersistenceErrorCode;
  readonly message: string;
  readonly retryable: boolean;
  readonly operationId: string;
  readonly correlationId: string;
  readonly details?: Readonly<Record<string, unknown>>;
}
