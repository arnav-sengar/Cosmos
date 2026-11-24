import type { PersistenceCapabilities } from "../domain/capabilities.js";
import type { BenchmarkConfig } from "./benchmark-config.js";
import type { JsonValue } from "./benchmark-workload.js";
import type {
  BenchmarkFailure,
  CleanupFailure,
} from "./benchmark-failure.js";

export type BenchmarkRunStatus = "completed" | "failed" | "skipped";

export interface BenchmarkStatistics {
  readonly count: number;
  readonly totalDurationMs: number;
  readonly meanMs: number;
  readonly minMs: number;
  readonly medianMs: number;
  readonly p95Ms: number;
  readonly maxMs: number;
  readonly operationsPerSecond: number;
}

export interface HealthAssessment {
  readonly healthy: boolean;
  readonly summary: string;
}

export interface HealthCheckRecord {
  readonly stage: "before" | "after";
  readonly assessment: HealthAssessment;
}

export interface BenchmarkResult {
  readonly runId: string;
  readonly adapterId: string;
  readonly workloadId: string;
  readonly config: BenchmarkConfig;
  readonly adapterMetadata?: Readonly<Record<string, JsonValue>>;
  readonly status: BenchmarkRunStatus;
  readonly capabilities?: PersistenceCapabilities;
  readonly limitations: Readonly<Record<string, readonly string[]>>;
  readonly healthChecks: readonly HealthCheckRecord[];
  readonly warmupIterationsCompleted: number;
  readonly measuredIterationsCompleted: number;
  readonly samplesMs: readonly number[];
  readonly statistics?: BenchmarkStatistics;
  readonly normalizedResults: readonly JsonValue[];
  readonly preflightConsistent?: boolean;
  readonly skipReason?: string;
  readonly failure?: BenchmarkFailure;
  readonly cleanupFailures: readonly CleanupFailure[];
}

export function calculateStatistics(
  samples: readonly number[],
): BenchmarkStatistics {
  if (samples.length === 0) {
    throw new RangeError("At least one sample is required.");
  }

  const sorted = [...samples].sort((left, right) => left - right);
  const totalDurationMs = samples.reduce((sum, value) => sum + value, 0);
  const percentile = (fraction: number): number => {
    const index = Math.max(0, Math.ceil(sorted.length * fraction) - 1);
    const value = sorted[index];

    if (value === undefined) {
      throw new Error("Unable to calculate a benchmark percentile.");
    }

    return value;
  };

  const minMs = sorted[0];
  const maxMs = sorted[sorted.length - 1];

  if (minMs === undefined || maxMs === undefined) {
    throw new Error("Unable to calculate benchmark statistics.");
  }

  const middle = Math.floor(sorted.length / 2);
  const medianMs =
    sorted.length % 2 === 0
      ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
      : (sorted[middle] ?? 0);

  return {
    count: samples.length,
    totalDurationMs,
    meanMs: totalDurationMs / samples.length,
    minMs,
    medianMs,
    p95Ms: percentile(0.95),
    maxMs,
    operationsPerSecond:
      totalDurationMs === 0 ? 0 : (samples.length * 1000) / totalDurationMs,
  };
}
