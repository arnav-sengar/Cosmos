/**
 * Runtime validation for TA-09 entity lifecycle records.
 */

import { z } from "zod";

import type { EntityLifecycle } from "../domain/entity-lifecycle.js";

import { canonicalIdSchema } from "./common.js";

const mergeLineageSchema = z.strictObject({
  successorIds: z.array(canonicalIdSchema).length(1),
});

const splitLineageSchema = z.strictObject({
  successorIds: z.array(canonicalIdSchema).min(2),
});

export const entityLifecycleSchema: z.ZodType<EntityLifecycle> =
  z.discriminatedUnion("state", [
    z.strictObject({
      entityId: canonicalIdSchema,
      state: z.literal("ACTIVE"),
    }),

    z.strictObject({
      entityId: canonicalIdSchema,
      state: z.literal("RETIRED"),
    }),

    z.strictObject({
      entityId: canonicalIdSchema,
      state: z.literal("MERGED_SOURCE"),
      lineage: mergeLineageSchema,
    }),

    z.strictObject({
      entityId: canonicalIdSchema,
      state: z.literal("SPLIT_SOURCE"),
      lineage: splitLineageSchema,
    }),
  ]);
