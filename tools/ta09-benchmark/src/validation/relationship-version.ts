import { compareIsoDateTimes } from "../domain/temporal.js";
/**
 * Runtime validation for immutable bitemporal relationship versions.
 */

import { z } from "zod";

import type {
  RelationshipCorrection,
  RelationshipTemporalQuery,
  RelationshipVersion,
} from "../domain/relationship-version.js";

import {
  canonicalIdSchema,
  isoDateTimeSchema,
  recordVersionSchema,
} from "./common.js";

import { relationshipSchema } from "./relationship.js";

const requiredTextSchema = z.string().refine(
  (value) => value.length > 0 && value.trim() === value,
  {
    message: "Value must not be empty or contain surrounding whitespace.",
  },
);

/** Validated immutable relationship-version record. */
export const relationshipVersionSchema: z.ZodType<RelationshipVersion> = z
  .strictObject({
    relationship: relationshipSchema,
    version: recordVersionSchema,

    validFrom: isoDateTimeSchema,
    validTo: isoDateTimeSchema.optional(),

    recordedFrom: isoDateTimeSchema,
    recordedTo: isoDateTimeSchema.optional(),

    predicateDefinitionVersion: recordVersionSchema,

    correctionReason: requiredTextSchema,
    provenanceRef: requiredTextSchema,
    createdAt: isoDateTimeSchema,
    createdBy: requiredTextSchema,
  })
  .superRefine((value, context) => {
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

/** Validated bitemporal relationship lookup. */
export const relationshipTemporalQuerySchema: z.ZodType<RelationshipTemporalQuery> =
  z
    .strictObject({
      validAt: isoDateTimeSchema.optional(),
      recordedAt: isoDateTimeSchema,
    })
    .transform(({ validAt, recordedAt }) => ({
      ...(validAt === undefined ? {} : { validAt }),
      recordedAt,
    }));

/** Validated correction request. */
export const relationshipCorrectionSchema: z.ZodType<RelationshipCorrection> =
  z
    .strictObject({
      relationshipId: canonicalIdSchema,
      replacement: relationshipSchema.nullable(),

      validFrom: isoDateTimeSchema,
      validTo: isoDateTimeSchema.optional(),

      recordedAt: isoDateTimeSchema,
      predicateDefinitionVersion: recordVersionSchema.optional(),

      correctionReason: requiredTextSchema,
      provenanceRef: requiredTextSchema,
      createdBy: requiredTextSchema,
    })
    .superRefine((value, context) => {
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
        value.replacement !== null &&
        value.replacement.id !== value.relationshipId
      ) {
        context.addIssue({
          code: "custom",
          path: ["replacement", "id"],
          message: "Replacement must retain the logical relationship ID.",
        });
      }

      if (
        value.replacement !== null &&
        value.predicateDefinitionVersion === undefined
      ) {
        context.addIssue({
          code: "custom",
          path: ["predicateDefinitionVersion"],
          message:
            "A replacement requires the predicate-definition version used for validation.",
        });
      }
    })
    .transform(({ validTo, predicateDefinitionVersion, ...value }) => ({
      ...value,
      ...(validTo === undefined ? {} : { validTo }),
      ...(predicateDefinitionVersion === undefined
        ? {}
        : { predicateDefinitionVersion }),
    }));
