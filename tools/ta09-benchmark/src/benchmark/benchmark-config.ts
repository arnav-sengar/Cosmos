/** Immutable configuration for one reproducible benchmark run. */
export interface BenchmarkConfig {
  readonly runId: string;
  readonly seed: number;
  readonly datasetId: string;
  readonly workloadId: string;
  readonly warmupIterations: number;
  readonly measuredIterations: number;
}
