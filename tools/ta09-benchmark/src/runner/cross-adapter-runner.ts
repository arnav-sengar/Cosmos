import type { BenchmarkAdapter } from "../adapters/benchmark-adapter.js";
import type { PersistenceCapabilityName } from "../domain/capabilities.js";
import type { BenchmarkConfig } from "../benchmark/benchmark-config.js";
import type { BenchmarkResult, HealthAssessment } from "../benchmark/benchmark-result.js";
import { runBenchmark, type BenchmarkRunnerOptions } from "../benchmark/benchmark-runner.js";
import type { BenchmarkWorkload, JsonValue } from "../benchmark/benchmark-workload.js";
import { normalizedResultsEqual } from "../benchmark/benchmark-measurement.js";

export interface NamedBenchmarkAdapter<
  TSeedInput,
  TSeedResult,
  TQuery,
  TResult,
  THealth,
> {
  readonly id: string;
  readonly metadata?: Readonly<Record<string, JsonValue>>;
  readonly adapter: BenchmarkAdapter<
    TSeedInput,
    TSeedResult,
    TQuery,
    TResult,
    THealth
  >;
  readonly assessHealth: (health: THealth) => HealthAssessment;
}

export type CrossAdapterComparisonStatus =
  | "matched"
  | "mismatched"
  | "incomplete";

export interface AdapterComparison {
  readonly adapterId: string;
  readonly status: BenchmarkResult["status"];
  readonly comparedWithBaseline: boolean;
  readonly mismatchIndexes: readonly number[];
  readonly reason?: string;
}

export interface CapabilityMatrixRow {
  readonly capability: PersistenceCapabilityName;
  readonly adapters: Readonly<Record<string, {
    readonly support: "supported" | "limited" | "unsupported";
    readonly limitations: readonly string[];
  }>>;
}

export interface CrossAdapterBenchmarkReport {
  readonly runId: string;
  readonly config: BenchmarkConfig;
  readonly workloadId: string;
  readonly status: CrossAdapterComparisonStatus;
  readonly baselineAdapterId?: string;
  readonly results: readonly BenchmarkResult[];
  readonly comparisons: readonly AdapterComparison[];
  readonly capabilityMatrix: readonly CapabilityMatrixRow[];
}

/**
 * Execute the exact same deterministic workload/configuration against each
 * adapter sequentially, then compare normalized semantic results.
 *
 * Sequential execution avoids cross-provider resource contention and keeps
 * the benchmark's execution model explicit. Adapters that cannot satisfy a
 * required capability are reported as skipped rather than compared.
 */
export async function runCrossAdapterBenchmark<
  TSeedInput,
  TSeedResult,
  TQuery,
  TResult,
  THealth,
>(
  adapters: readonly NamedBenchmarkAdapter<
    TSeedInput,
    TSeedResult,
    TQuery,
    TResult,
    THealth
  >[],
  workload: BenchmarkWorkload<TSeedInput, TQuery, TResult>,
  config: BenchmarkConfig,
  options: { readonly now?: () => number } = {},
): Promise<CrossAdapterBenchmarkReport> {
  if (adapters.length < 2) {
    throw new RangeError("At least two adapters are required for cross-adapter validation.");
  }

  const ids = new Set<string>();

  for (const entry of adapters) {
    if (entry.id.length === 0 || entry.id.trim() !== entry.id) {
      throw new TypeError("Adapter IDs must be non-empty and have no surrounding whitespace.");
    }

    if (ids.has(entry.id)) {
      throw new TypeError(`Duplicate adapter ID "${entry.id}".`);
    }

    ids.add(entry.id);
  }

  const results: BenchmarkResult[] = [];

  for (const entry of adapters) {
    const runnerOptions: BenchmarkRunnerOptions<THealth> = {
      adapterId: entry.id,
      ...(entry.metadata === undefined ? {} : { adapterMetadata: entry.metadata }),
      assessHealth: entry.assessHealth,
      ...(options.now === undefined ? {} : { now: options.now }),
    };

    results.push(
      await runBenchmark(entry.adapter, workload, config, runnerOptions),
    );
  }

  const baseline = results.find((result) => result.status === "completed");
  const comparisons: AdapterComparison[] = results.map((result) => {
    if (result.status !== "completed") {
      return {
        adapterId: result.adapterId,
        status: result.status,
        comparedWithBaseline: false,
        mismatchIndexes: [],
        reason:
          result.skipReason ??
          result.failure?.message ??
          "Adapter did not complete the benchmark.",
      };
    }

    if (baseline === undefined || result.adapterId === baseline.adapterId) {
      return {
        adapterId: result.adapterId,
        status: result.status,
        comparedWithBaseline: false,
        mismatchIndexes: [],
        ...(baseline === undefined
          ? { reason: "No completed adapter is available as a comparison baseline." }
          : {}),
      };
    }

    const mismatchIndexes: number[] = [];
    const sharedLength = Math.min(
      baseline.normalizedResults.length,
      result.normalizedResults.length,
    );

    for (let index = 0; index < sharedLength; index += 1) {
      const baselineValue = baseline.normalizedResults[index];
      const adapterValue = result.normalizedResults[index];

      if (
        baselineValue === undefined ||
        adapterValue === undefined ||
        !normalizedResultsEqual([baselineValue], [adapterValue])
      ) {
        mismatchIndexes.push(index);
      }
    }

    if (baseline.normalizedResults.length !== result.normalizedResults.length) {
      for (
        let index = sharedLength;
        index < Math.max(
          baseline.normalizedResults.length,
          result.normalizedResults.length,
        );
        index += 1
      ) {
        mismatchIndexes.push(index);
      }
    }

    return {
      adapterId: result.adapterId,
      status: result.status,
      comparedWithBaseline: true,
      mismatchIndexes,
      ...(mismatchIndexes.length === 0
        ? {}
        : { reason: "Normalized measured results differ from the baseline adapter." }),
    };
  });

  const allCompleted = results.every((result) => result.status === "completed");
  const hasMismatch = comparisons.some(
    (comparison) => comparison.mismatchIndexes.length > 0,
  );

  const status: CrossAdapterComparisonStatus = hasMismatch
    ? "mismatched"
    : allCompleted
      ? "matched"
      : "incomplete";

  const capabilityNames: readonly PersistenceCapabilityName[] = [
    "transactions",
    "isolationLevels",
    "optimisticVersioning",
    "conditionalWrites",
    "cursorPagination",
    "historicalQueries",
    "relationshipTraversal",
    "idempotentOperations",
    "backupRecovery",
    "readAfterWrite",
    "crossStoreConsistency",
  ];

  const capabilityMatrix: CapabilityMatrixRow[] = capabilityNames.map(
    (capability) => {
      const adapterCapabilities = Object.create(null) as Record<string, {
        support: "supported" | "limited" | "unsupported";
        limitations: readonly string[];
      }>;

      for (const result of results) {
        const declaration = result.capabilities?.[capability];

        if (declaration === undefined) {
          continue;
        }

        adapterCapabilities[result.adapterId] = {
          support: declaration.support,
          limitations:
            declaration.support === "limited"
              ? declaration.limitations
              : declaration.support === "unsupported"
                ? (declaration.limitations ?? [])
                : [],
        };
      }

      return {
        capability,
        adapters: Object.freeze(adapterCapabilities),
      };
    },
  );

  return {
    runId: config.runId,
    config: { ...config },
    workloadId: workload.id,
    status,
    ...(baseline === undefined ? {} : { baselineAdapterId: baseline.adapterId }),
    results,
    comparisons,
    capabilityMatrix,
  };
}
