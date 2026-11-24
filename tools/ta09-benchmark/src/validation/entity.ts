/**
 * Runtime validation for the approved TA-09 canonical entity representation.
 *
 * Validation is intentionally limited to the four approved logical fields.
 * Domain and type vocabularies remain extensible.
 */

import { z } from "zod";

import type { Entity } from "../domain/entity.js";

import { canonicalIdSchema } from "./common.js";

/** Required non-empty string without surrounding whitespace. */
const entityTextSchema = z.string().refine(
  (value) => value.length > 0 && value.trim() === value,
  {
    message: "Value must not be empty or contain surrounding whitespace.",
  },
);

/** Validated canonical entity record. */
export const entitySchema: z.ZodType<Entity> = z.strictObject({
  id: canonicalIdSchema,
  name: entityTextSchema,
  domain: entityTextSchema,
  type: entityTextSchema,
});