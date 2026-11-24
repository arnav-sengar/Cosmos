/**
 * Runtime validation for TA-09 persistence capability declarations.
 *
 * These schemas validate adapter claims structurally. They do not prove
 * that an adapter provides the declared behavior; conformance tests do that.
 */

import { z } from "zod";

const nonBlankStringSchema = z.string().refine(
  (value) => value.length > 0 && value.trim() === value,
  {
    message: "Limitation must not be empty or contain surrounding whitespace.",
  },
);

const supportedCapabilitySchema = z.strictObject({
  support: z.literal("supported"),
});

const limitedCapabilitySchema = z.strictObject({
  support: z.literal("limited"),
  limitations: z
    .array(nonBlankStringSchema)
    .min(1, "A limited capability must declare at least one limitation.")
    .transform((values) => values as [string, ...string[]]),
});

const unsupportedCapabilitySchema = z.strictObject({
  support: z.literal("unsupported"),
  limitations: z.array(nonBlankStringSchema).optional(),
});

/** Validated declaration for one persistence capability. */
export const capabilityDeclarationSchema = z.discriminatedUnion("support", [
  supportedCapabilitySchema,
  limitedCapabilitySchema,
  unsupportedCapabilitySchema,
]);

/** All capability dimensions required by the TA-09 contract. */
export const persistenceCapabilitiesSchema = z.strictObject({
  transactions: capabilityDeclarationSchema,
  isolationLevels: capabilityDeclarationSchema,
  optimisticVersioning: capabilityDeclarationSchema,
  conditionalWrites: capabilityDeclarationSchema,
  cursorPagination: capabilityDeclarationSchema,
  historicalQueries: capabilityDeclarationSchema,
  relationshipTraversal: capabilityDeclarationSchema,
  idempotentOperations: capabilityDeclarationSchema,
  backupRecovery: capabilityDeclarationSchema,
  readAfterWrite: capabilityDeclarationSchema,
  crossStoreConsistency: capabilityDeclarationSchema,
});