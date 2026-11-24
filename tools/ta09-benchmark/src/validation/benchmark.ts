/** Runtime validation for benchmark run configuration. */

import { z } from "zod";

const identifierSchema = z
  .string()
  .min(1)
  .max(128)
  .refine((value: string) => value.trim() === value, {
    message: "Identifiers must not contain surrounding whitespace.",
  });

export const benchmarkConfigSchema = z.strictObject({
  runId: identifierSchema,
  seed: z.number().int().min(0).max(0xffff_ffff),
  datasetId: identifierSchema,
  workloadId: identifierSchema,
  warmupIterations: z.number().int().min(0).max(100_000),
  measuredIterations: z.number().int().min(1).max(100_000),
});
