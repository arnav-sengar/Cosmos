import type { PersistenceCapabilityName } from "../domain/capabilities.js";
import type { SeededRandom } from "../generators/seeded-random.js";

export type BenchmarkPhase = "preflight" | "warmup" | "measurement";

export interface SeedInputContext {
  readonly datasetId: string;
  readonly random: SeededRandom;
}

export interface QueryGenerationContext {
  readonly random: SeededRandom;
  readonly iteration: number;
  readonly phase: BenchmarkPhase;
}

export interface ResultValidationContext {
  readonly iteration: number;
  readonly phase: BenchmarkPhase;
}

/** JSON-compatible semantic result used for cross-adapter comparison. */
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

/**
 * One provider-neutral benchmark scenario.
 *
 * The workload owns deterministic seed/query generation and correctness
 * assertions. Adapters own persistence and provider-specific execution.
 */
export interface BenchmarkWorkload<TSeedInput, TQuery, TResult> {
  readonly id: string;
  readonly description: string;
  readonly requiredCapabilities: readonly PersistenceCapabilityName[];

  createSeedInput(context: SeedInputContext): TSeedInput;
  createQuery(context: QueryGenerationContext): TQuery;
  validateResult(
    result: TResult,
    query: TQuery,
    context: ResultValidationContext,
  ): void | Promise<void>;
  normalizeResult(result: TResult, query: TQuery): JsonValue;
}
