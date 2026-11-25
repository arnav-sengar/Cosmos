/**
 * Runtime validation for relationship repository inputs.
 */

import { z } from "zod";

import type {
  CreateRelationshipInput,
  RetireRelationshipInput,
  RelationshipTraversalQuery,
  RelationshipUpdateCorrection,
  UpdateRelationshipInput,
} from "../repositories/relationship-repository.js";

import {
  canonicalIdSchema,
  isoDateTimeSchema,
  pageRequestSchema,
  recordVersionSchema,
} from "./common.js";

import { relationshipSchema } from "./relationship.js";
import { compareIsoDateTimes } from "../domain/temporal.js";

const requiredTextSchema = z.string().refine(
  (value) => value.length > 0 && value.trim() === value,
  {
    message: "Value must not be empty or contain surrounding whitespace.",
  },
);

const validInterval = (
  value: { validFrom: string; validTo?: string | undefined },
  context: z.RefinementCtx,
) => {
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
};

/** Validated relationship creation input. */
export const createRelationshipInputSchema: z.ZodType<CreateRelationshipInput> =
  z
    .strictObject({
      relationship: relationshipSchema,
      validFrom: isoDateTimeSchema,
      validTo: isoDateTimeSchema.optional(),
      recordedAt: isoDateTimeSchema,
      correctionReason: requiredTextSchema,
      provenanceRef: requiredTextSchema,
      createdBy: requiredTextSchema,
    })
    .superRefine(validInterval)
    .transform(({ validTo, ...value }) => ({
      ...value,
      ...(validTo === undefined ? {} : { validTo }),
    }));

/**
 * Update correction input intentionally excludes
 * predicateDefinitionVersion. The write validator resolves it internally.
 */
export const relationshipUpdateCorrectionSchema: z.ZodType<RelationshipUpdateCorrection> =
  z
    .strictObject({
      relationshipId: canonicalIdSchema,
      replacement: relationshipSchema,
      validFrom: isoDateTimeSchema,
      validTo: isoDateTimeSchema.optional(),
      recordedAt: isoDateTimeSchema,
      correctionReason: requiredTextSchema,
      provenanceRef: requiredTextSchema,
      createdBy: requiredTextSchema,
    })
    .superRefine((value, context) => {
      validInterval(value, context);

      if (value.replacement.id !== value.relationshipId) {
        context.addIssue({
          code: "custom",
          path: ["replacement", "id"],
          message: "Replacement must retain the logical relationship ID.",
        });
      }
    })
    .transform(({ validTo, ...value }) => ({
      ...value,
      ...(validTo === undefined ? {} : { validTo }),
    }));

/** Validated relationship update input. */
export const updateRelationshipInputSchema: z.ZodType<UpdateRelationshipInput> =
  z.strictObject({
    correction: relationshipUpdateCorrectionSchema,
    expectedVersion: recordVersionSchema,
  });

/** Validated relationship retirement input. */
export const retireRelationshipInputSchema: z.ZodType<RetireRelationshipInput> =
  z.strictObject({
    relationshipId: canonicalIdSchema,
    effectiveAt: isoDateTimeSchema,
    recordedAt: isoDateTimeSchema,
    expectedVersion: recordVersionSchema,
    correctionReason: requiredTextSchema,
    provenanceRef: requiredTextSchema,
    createdBy: requiredTextSchema,
  });

export const relationshipTraversalDirectionSchema = z.enum([
  "OUTGOING",
  "INCOMING",
  "BIDIRECTIONAL",
]);

/** Strict, explicit resource limits for one complete traversal. */
export const relationshipTraversalLimitsSchema = z.strictObject({
  maxDepth: z.number().int().nonnegative().safe(),
  maxVisitedEntities: z.number().int().positive().safe(),
  maxExaminedRelationships: z.number().int().positive().safe(),
  maxAdjacencyPages: z.number().int().positive().safe(),
});

/** Validated bitemporal graph traversal query. */
export const relationshipTraversalQuerySchema: z.ZodType<RelationshipTraversalQuery> =
  z
    .strictObject({
      startEntityId: canonicalIdSchema,
      validAt: isoDateTimeSchema.optional(),
      recordedAt: isoDateTimeSchema,
      direction: relationshipTraversalDirectionSchema.optional(),
      predicate: requiredTextSchema.optional(),
      limits: relationshipTraversalLimitsSchema,
    })
    .transform(({ validAt, direction, predicate, limits, ...value }) => ({
      ...value,
      limits,
      ...(validAt === undefined ? {} : { validAt }),
      ...(direction === undefined ? {} : { direction }),
      ...(predicate === undefined ? {} : { predicate }),
    }));

/** Repository page request uses the shared cursor contract. */
export const relationshipPageRequestSchema = pageRequestSchema;
