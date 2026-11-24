/**
 * Runtime validation for provider-neutral TA-09 primitives.
 *
 * These schemas validate inputs at system boundaries. They do not define
 * provider-specific storage formats or select a canonical ID encoding.
 */

import { z } from "zod";

import type {
  CanonicalId,
  ISODateTime,
  OperationContext,
  PageRequest,
  RecordVersion,
  TemporalQuery,
} from "../domain/primitives.js";

/** Non-empty strings without leading, trailing, or whitespace-only values. */
const nonBlankStringSchema = z.string().refine(
  (value) => value.length > 0 && value.trim() === value,
  {
    message: "Value must not be empty or contain surrounding whitespace.",
  },
);

/**
 * Canonical ID encoding remains intentionally unspecified.
 * UUIDv7 versus ULID has not been decided.
 * The 256-character limit is a provisional contract boundary.
 */
export const canonicalIdSchema = nonBlankStringSchema
  .refine((value) => value.length <= 256, {
    message: "Canonical ID must not exceed 256 characters.",
  })
  .transform((value) => value as CanonicalId);

/** Positive integer record version. */
export const recordVersionSchema = z
  .number()
  .int()
  .positive()
  .transform((value) => value as RecordVersion);

/**
 * Validated UTC ISO 8601 date-time.
 * Offset-based and local date-times are not accepted.
 */
export const isoDateTimeSchema = z
  .iso.datetime()
  .transform((value) => value as ISODateTime);

/** Validated cursor-based pagination request. */
export const pageRequestSchema: z.ZodType<PageRequest> = z
  .strictObject({
    limit: z.number().int().positive().max(500),
    cursor: nonBlankStringSchema
      .refine((value) => value.length <= 2048, {
        message: "Cursor must not exceed 2048 characters.",
      })
      .optional(),
  })
  .transform(({ limit, cursor }) =>
    cursor === undefined ? { limit } : { limit, cursor },
  );

/** Validated bitemporal query constraints. */
export const temporalQuerySchema: z.ZodType<TemporalQuery> = z
  .strictObject({
    validAt: isoDateTimeSchema.optional(),
    recordedAt: isoDateTimeSchema.optional(),
  })
  .transform(({ validAt, recordedAt }) => ({
    ...(validAt === undefined ? {} : { validAt }),
    ...(recordedAt === undefined ? {} : { recordedAt }),
  }));

/** Validated operation and correlation identifiers. */
export const operationIdentifierSchema = nonBlankStringSchema.refine(
  (value) => value.length <= 128,
  {
    message: "Operation identifiers must not exceed 128 characters.",
  },
);

export const operationContextSchema: z.ZodType<OperationContext> =
  z.strictObject({
    operationId: operationIdentifierSchema,
    correlationId: operationIdentifierSchema,
  });