import { compareIsoDateTimes } from "../domain/temporal.js";
/**
 * Runtime validation for TA-09 predicate registry contracts.
 *
 * These schemas validate logical predicate definitions and their
 * bitemporal version metadata. They do not prescribe physical storage.
 */

import { z } from "zod";

import type {
  PredicateConstraints,
  PredicateDefinition,
  PredicateDefinitionVersion,
  PredicateStatus,
  PredicateTemporalQuery,
} from "../domain/predicate.js";

import {
  isoDateTimeSchema,
  recordVersionSchema,
} from "./common.js";

/** Required non-empty string without surrounding whitespace. */
const predicateTextSchema = z.string().refine(
  (value) => value.length > 0 && value.trim() === value,
  {
    message: "Value must not be empty or contain surrounding whitespace.",
  },
);

/**
 * Compare validated UTC ISO timestamps without losing fractional
 * second precision through JavaScript Date's millisecond resolution.
 */
/** Validated predicate lifecycle status. */
export const predicateStatusSchema: z.ZodType<PredicateStatus> =
  z.enum(["ACTIVE", "RETIRED"]);

/** Validated predicate-specific relationship constraints. */
export const predicateConstraintsSchema: z.ZodType<PredicateConstraints> =
  z
    .strictObject({
      allowedSubjectTypes: z
        .array(predicateTextSchema)
        .min(1)
        .optional(),

      allowedObjectTypes: z
        .array(predicateTextSchema)
        .min(1)
        .optional(),

      acyclic: z.boolean().optional(),
    })
    .transform(({ allowedSubjectTypes, allowedObjectTypes, acyclic }) => ({
      ...(allowedSubjectTypes === undefined
        ? {}
        : { allowedSubjectTypes }),
      ...(allowedObjectTypes === undefined
        ? {}
        : { allowedObjectTypes }),
      ...(acyclic === undefined ? {} : { acyclic }),
    }));

/** Validated logical predicate definition. */
export const predicateDefinitionSchema: z.ZodType<PredicateDefinition> =
  z.strictObject({
    predicate: predicateTextSchema,
    constraints: predicateConstraintsSchema,
    status: predicateStatusSchema,
  });

/** Validated immutable predicate definition version. */
export const predicateDefinitionVersionSchema: z.ZodType<PredicateDefinitionVersion> =
  z
    .strictObject({
      predicate: predicateTextSchema,
      version: recordVersionSchema,
      definition: predicateDefinitionSchema,
      validFrom: isoDateTimeSchema,
      validTo: isoDateTimeSchema.optional(),
      recordedFrom: isoDateTimeSchema,
      recordedTo: isoDateTimeSchema.optional(),
    })
    .superRefine((value, context) => {
      if (value.predicate !== value.definition.predicate) {
        context.addIssue({
          code: "custom",
          path: ["definition", "predicate"],
          message: "Definition predicate must match the version predicate.",
        });
      }

      if (
        value.validTo !== undefined &&
        compareIsoDateTimes(value.validTo, value.validFrom) <= 0
      ) {
        context.addIssue({
          code: "custom",
          path: ["validTo"],
          message: "validTo must be later than validFrom.",
        });
      }

      if (
        value.recordedTo !== undefined &&
        compareIsoDateTimes(value.recordedTo, value.recordedFrom) <= 0
      ) {
        context.addIssue({
          code: "custom",
          path: ["recordedTo"],
          message: "recordedTo must be later than recordedFrom.",
        });
      }
    })
    .transform(({ validTo, recordedTo, ...value }) => ({
      ...value,
      ...(validTo === undefined ? {} : { validTo }),
      ...(recordedTo === undefined ? {} : { recordedTo }),
    }));

/** Validated bitemporal predicate-definition lookup. */
export const predicateTemporalQuerySchema: z.ZodType<PredicateTemporalQuery> =
  z
    .strictObject({
      validAt: isoDateTimeSchema.optional(),
      recordedAt: isoDateTimeSchema,
    })
    .transform(({ validAt, recordedAt }) => ({
      ...(validAt === undefined ? {} : { validAt }),
      recordedAt,
    }));
