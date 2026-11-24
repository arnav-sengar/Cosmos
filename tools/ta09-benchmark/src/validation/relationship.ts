/**
 * Runtime validation for the TA-09 canonical relationship representation.
 *
 * Validation is limited to the four logical relationship fields.
 * Predicate vocabulary and graph integrity rules remain separate concerns.
 */

import { z } from "zod";

import type { Relationship } from "../domain/relationship.js";

import { canonicalIdSchema } from "./common.js";

/** Required non-empty string without surrounding whitespace. */
const relationshipTextSchema = z.string().refine(
  (value) => value.length > 0 && value.trim() === value,
  {
    message: "Value must not be empty or contain surrounding whitespace.",
  },
);

/** Validated canonical relationship record. */
export const relationshipSchema: z.ZodType<Relationship> = z.strictObject({
  id: canonicalIdSchema,
  subjectId: canonicalIdSchema,
  predicate: relationshipTextSchema,
  objectId: canonicalIdSchema,
});
