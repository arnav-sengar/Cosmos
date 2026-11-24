/**
 * Runtime validation and construction for provider-neutral TA-09 errors.
 *
 * Retryability is explicit for each error instance. It is not inferred
 * automatically from the error code.
 */

import { z } from "zod";

import {
  PERSISTENCE_ERROR_CODES,
  type PersistenceError,
} from "../errors/persistence-error.js";

import { operationIdentifierSchema } from "./common.js";

/** Validated provider-neutral persistence error envelope. */
export const persistenceErrorSchema = z
  .strictObject({
    code: z.enum(PERSISTENCE_ERROR_CODES),
    message: z.string().refine(
      (value) => value.length > 0 && value.trim() === value,
      {
        message:
          "Error message must not be empty or contain surrounding whitespace.",
      },
    ),
    retryable: z.boolean(),
    operationId: operationIdentifierSchema,
    correlationId: operationIdentifierSchema,
    details: z.record(z.string(), z.unknown()).optional(),
  })
  .transform(({ details, ...error }) =>
    details === undefined ? error : { ...error, details },
  );

/** Input accepted by the standardized error factory. */
export type PersistenceErrorInput = z.input<
  typeof persistenceErrorSchema
>;

/**
 * Construct a validated persistence error.
 *
 * Invalid envelopes throw a ZodError. The factory does not infer retryability,
 * rewrite provider messages, or silently discard unknown fields.
 */
export function createPersistenceError(
  input: PersistenceErrorInput,
): PersistenceError {
  return persistenceErrorSchema.parse(input);
}