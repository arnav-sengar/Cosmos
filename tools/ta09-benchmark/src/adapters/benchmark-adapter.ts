/**
 * Provider-neutral lifecycle contract for TA-09 benchmark adapters.
 *
 * This interface defines the responsibilities shared by PostgreSQL,
 * Firestore, and Hybrid adapters. It does not define provider-specific
 * configuration, seed formats, query payloads, or health-report formats.
 *
 * Those contracts will be introduced separately and supplied through
 * the generic type parameters below.
 */

import type { PersistenceCapabilities } from "../domain/capabilities.js";

/**
 * Common lifecycle and execution boundary for a benchmark adapter.
 *
 * @typeParam TSeedInput Provider-neutral seed input, defined separately.
 * @typeParam TSeedResult Structured result of the seed operation.
 * @typeParam TQuery Provider-neutral benchmark query, defined separately.
 * @typeParam TResult Result returned by executing a benchmark query.
 * @typeParam THealth Structured adapter health report.
 */
export interface BenchmarkAdapter<
  TSeedInput,
  TSeedResult,
  TQuery,
  TResult,
  THealth,
> {
  /** Prepare the adapter and its provider resources. */
  initialize(): Promise<void>;

  /** Restore the adapter to a clean benchmark state. */
  reset(): Promise<void>;

  /** Load the supplied benchmark dataset. */
  seed(input: TSeedInput): Promise<TSeedResult>;

  /** Execute one provider-neutral benchmark query. */
  executeQuery(query: TQuery): Promise<TResult>;

  /** Report the adapter's declared persistence capabilities. */
  getCapabilities(): PersistenceCapabilities;

  /** Report the adapter's current operational health. */
  healthCheck(): Promise<THealth>;

  /** Release resources owned by the adapter. */
  dispose(): Promise<void>;
}