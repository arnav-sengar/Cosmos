import { performance } from "node:perf_hooks";

import type {
  BenchmarkAdapter,
} from "../adapters/benchmark-adapter.js";
import type {
  PersistenceCapabilities,
  PersistenceCapabilityName,
} from "../domain/capabilities.js";
import { persistenceCapabilitiesSchema } from "../validation/capabilities.js";
import { benchmarkConfigSchema } from "../validation/benchmark.js";
import {
  createSeededRandom,
  deriveSeed,
} from "../generators/seeded-random.js";
import type { BenchmarkConfig } from "./benchmark-config.js";
import {
  errorMessage,
  type BenchmarkFailure,
  type CleanupFailure,
} from "./benchmark-failure.js";
import {
  calculateStatistics,
  type BenchmarkResult,
  type HealthAssessment,
  type HealthCheckRecord,
} from "./benchmark-result.js";
import type {
  BenchmarkWorkload,
  JsonValue,
} from "./benchmark-workload.js";
import { stableSerialize } from "./benchmark-measurement.js";

const SEED_STREAM = 0x13579bdf;
const PREFLIGHT_STREAM = 0x2468ace0;
const WARMUP_STREAM = 0x0badc0de;
const MEASUREMENT_STREAM = 0x5eed1234;

export interface BenchmarkRunnerOptions<THealth> {
  readonly adapterId: string;
  /** Sanitized, non-secret adapter identity/configuration metadata for reports. */
  readonly adapterMetadata?: Readonly<Record<string, JsonValue>>;
  /** Interpret the adapter-specific health payload without changing its contract. */
  readonly assessHealth: (health: THealth) => HealthAssessment;
  /** Injectable monotonic clock for deterministic tests. */
  readonly now?: () => number;
}

function collectLimitations(
  capabilities: PersistenceCapabilities,
): Readonly<Record<string, readonly string[]>> {
  const limitations: Record<string, readonly string[]> = {};

  for (const [name, declaration] of Object.entries(capabilities)) {
    if (declaration.support === "limited") {
      limitations[name] = declaration.limitations;
    } else if (
      declaration.support === "unsupported" &&
      declaration.limitations !== undefined
    ) {
      limitations[name] = declaration.limitations;
    }
  }

  return Object.freeze(limitations);
}

function findUnsupportedCapability(
  capabilities: PersistenceCapabilities,
  required: readonly PersistenceCapabilityName[],
): string | undefined {
  for (const name of required) {
    const declaration = capabilities[name];

    if (declaration.support === "unsupported") {
      return `Required capability "${name}" is unsupported.`;
    }
  }

  return undefined;
}

function createSeedInput<TSeedInput, TQuery, TResult>(
  workload: BenchmarkWorkload<TSeedInput, TQuery, TResult>,
  config: BenchmarkConfig,
): TSeedInput {
  return workload.createSeedInput({
    datasetId: config.datasetId,
    random: createSeededRandom(deriveSeed(config.seed, SEED_STREAM)),
  });
}

function createFailure(
  kind: BenchmarkFailure["kind"],
  phase: string,
  error: unknown,
): BenchmarkFailure {
  return {
    kind,
    phase,
    message: errorMessage(error),
  };
}

/**
 * Execute one workload against one adapter.
 *
 * Correctness checks run before performance is accepted. Warm-up data is
 * discarded, the adapter is reset and reseeded, and the same preflight query
 * is replayed to verify reset/seed reproducibility before measurements begin.
 */
export async function runBenchmark<
  TSeedInput,
  TSeedResult,
  TQuery,
  TResult,
  THealth,
>(
  adapter: BenchmarkAdapter<TSeedInput, TSeedResult, TQuery, TResult, THealth>,
  workload: BenchmarkWorkload<TSeedInput, TQuery, TResult>,
  config: BenchmarkConfig,
  options: BenchmarkRunnerOptions<THealth>,
): Promise<BenchmarkResult> {
  let reportConfig = config;
  let reportMetadata: Readonly<Record<string, JsonValue>> | undefined;
  let status: BenchmarkResult["status"] = "failed";
  let capabilities: PersistenceCapabilities | undefined;
  let skipReason: string | undefined;
  let failure: BenchmarkFailure | undefined;
  let preflightConsistent: boolean | undefined;
  let initializedAttempted = false;
  let warmupIterationsCompleted = 0;
  let measuredIterationsCompleted = 0;
  const samplesMs: number[] = [];
  const normalizedResults: JsonValue[] = [];
  let limitations: Readonly<Record<string, readonly string[]>> = {};
  const healthChecks: HealthCheckRecord[] = [];
  const cleanupFailures: CleanupFailure[] = [];
  const now = options.now ?? (() => performance.now());

  try {
    const validatedConfig = benchmarkConfigSchema.parse(config);
    reportConfig = validatedConfig;

    if (validatedConfig.workloadId !== workload.id) {
      throw new Error(
        `Configured workload "${validatedConfig.workloadId}" does not match workload "${workload.id}".`,
      );
    }

    if (!options.adapterId || options.adapterId.trim() !== options.adapterId) {
      throw new Error("Adapter ID must be non-empty and have no surrounding whitespace.");
    }

    if (options.adapterMetadata !== undefined) {
      reportMetadata = JSON.parse(
        stableSerialize(options.adapterMetadata),
      ) as Readonly<Record<string, JsonValue>>;
    }

    initializedAttempted = true;
    try {
      await adapter.initialize();
    } catch (error) {
      failure = createFailure("adapter-lifecycle", "initialize", error);
      throw error;
    }

    let health: THealth;
    try {
      health = await adapter.healthCheck();
      const assessment = options.assessHealth(health);

      if (
        !assessment ||
        typeof assessment.healthy !== "boolean" ||
        typeof assessment.summary !== "string"
      ) {
        throw new TypeError("Health assessor returned an invalid assessment.");
      }

      healthChecks.push({ stage: "before", assessment });

      if (!assessment.healthy) {
        failure = {
          kind: "health",
          phase: "before",
          message: assessment.summary || "Adapter is unhealthy before execution.",
        };
        throw new Error(failure.message);
      }
    } catch (error) {
      failure ??= createFailure("health", "before", error);
      throw error;
    }

    try {
      // Zod infers optional object keys as possibly `undefined`; the domain
      // contract models an absent key as an omitted property under
      // exactOptionalPropertyTypes. Runtime validation guarantees this shape.
      capabilities = persistenceCapabilitiesSchema.parse(
        adapter.getCapabilities(),
      ) as PersistenceCapabilities;
    } catch (error) {
      failure = createFailure("adapter-lifecycle", "capabilities", error);
      throw error;
    }

    if (capabilities === undefined) {
      throw new Error("Adapter capabilities were not available after validation.");
    }

    limitations = collectLimitations(capabilities);

    const unsupported = findUnsupportedCapability(
      capabilities,
      workload.requiredCapabilities,
    );

    if (unsupported !== undefined) {
      skipReason = unsupported;
      status = "skipped";
    } else {
      let seedInput: TSeedInput;
      let preflightQuery: TQuery;
      const createPreflightQuery = (): TQuery =>
        workload.createQuery({
          random: createSeededRandom(
            deriveSeed(validatedConfig.seed, PREFLIGHT_STREAM),
          ),
          iteration: 0,
          phase: "preflight",
        });

      try {
        seedInput = createSeedInput(workload, validatedConfig);
        preflightQuery = createPreflightQuery();
      } catch (error) {
        failure = createFailure("workload", "input-generation", error);
        throw error;
      }

      try {
        await adapter.reset();
        await adapter.seed(seedInput);
      } catch (error) {
        failure = createFailure("adapter-operation", "prepare", error);
        throw error;
      }

      let preflightResult: TResult;
      try {
        preflightResult = await adapter.executeQuery(preflightQuery);
      } catch (error) {
        failure = createFailure("adapter-operation", "preflight-execution", error);
        throw error;
      }

      let firstPreflight: JsonValue;
      try {
        await workload.validateResult(preflightResult, preflightQuery, {
          iteration: 0,
          phase: "preflight",
        });
        firstPreflight = workload.normalizeResult(preflightResult, preflightQuery);
        stableSerialize(firstPreflight);
      } catch (error) {
        failure = createFailure("correctness", "preflight-validation", error);
        throw error;
      }

      const warmupRandom = createSeededRandom(
        deriveSeed(validatedConfig.seed, WARMUP_STREAM),
      );

      for (
        let iteration = 0;
        iteration < validatedConfig.warmupIterations;
        iteration += 1
      ) {
        let query: TQuery;
        try {
          query = workload.createQuery({
            random: warmupRandom,
            iteration,
            phase: "warmup",
          });
        } catch (error) {
          failure = createFailure("workload", `warmup-query:${iteration}`, error);
          throw error;
        }

        let result: TResult;
        try {
          result = await adapter.executeQuery(query);
        } catch (error) {
          failure = createFailure("adapter-operation", `warmup-execution:${iteration}`, error);
          throw error;
        }

        try {
          await workload.validateResult(result, query, {
            iteration,
            phase: "warmup",
          });
          stableSerialize(workload.normalizeResult(result, query));
          warmupIterationsCompleted += 1;
        } catch (error) {
          failure = createFailure("correctness", `warmup-validation:${iteration}`, error);
          throw error;
        }
      }

      // Recreate exactly the same logical dataset before the measured phase.
      let reseedInput: TSeedInput;
      let repeatedPreflightQuery: TQuery;
      try {
        reseedInput = createSeedInput(workload, validatedConfig);
        repeatedPreflightQuery = createPreflightQuery();
      } catch (error) {
        failure = createFailure("workload", "measurement-input-generation", error);
        throw error;
      }

      try {
        await adapter.reset();
        await adapter.seed(reseedInput);
      } catch (error) {
        failure = createFailure("adapter-operation", "measurement-prepare", error);
        throw error;
      }

      let repeatedResult: TResult;
      try {
        repeatedResult = await adapter.executeQuery(repeatedPreflightQuery);
      } catch (error) {
        failure = createFailure("adapter-operation", "reset-reproducibility-execution", error);
        throw error;
      }

      try {
        await workload.validateResult(repeatedResult, repeatedPreflightQuery, {
          iteration: 0,
          phase: "preflight",
        });
        const repeatedNormalized = workload.normalizeResult(
          repeatedResult,
          repeatedPreflightQuery,
        );
        stableSerialize(repeatedNormalized);
        preflightConsistent =
          stableSerialize(firstPreflight) === stableSerialize(repeatedNormalized);

        if (!preflightConsistent) {
          failure = {
            kind: "correctness",
            phase: "reset-reproducibility",
            message:
              "The same preflight query returned a different normalized result after reset and reseed.",
          };
          throw new Error(failure.message);
        }
      } catch (error) {
        failure ??= createFailure("correctness", "reset-reproducibility", error);
        throw error;
      }

      const measurementRandom = createSeededRandom(
        deriveSeed(validatedConfig.seed, MEASUREMENT_STREAM),
      );

      for (
        let iteration = 0;
        iteration < validatedConfig.measuredIterations;
        iteration += 1
      ) {
        let query: TQuery;
        try {
          query = workload.createQuery({
            random: measurementRandom,
            iteration,
            phase: "measurement",
          });
        } catch (error) {
          failure = createFailure("workload", `measurement-query:${iteration}`, error);
          throw error;
        }

        let result: TResult;
        let elapsed: number;

        try {
          const startedAt = now();
          result = await adapter.executeQuery(query);
          const endedAt = now();
          elapsed = endedAt - startedAt;

          if (!Number.isFinite(elapsed) || elapsed < 0) {
            throw new RangeError("Monotonic clock returned an invalid duration.");
          }
        } catch (error) {
          failure = createFailure("adapter-operation", `measurement:${iteration}`, error);
          throw error;
        }

        try {
          await workload.validateResult(result, query, {
            iteration,
            phase: "measurement",
          });
          const normalized = workload.normalizeResult(result, query);
          stableSerialize(normalized);
          normalizedResults.push(normalized);
          samplesMs.push(elapsed);
          measuredIterationsCompleted += 1;
        } catch (error) {
          failure = createFailure("correctness", `measurement-validation:${iteration}`, error);
          throw error;
        }
      }

      try {
        health = await adapter.healthCheck();
        const assessment = options.assessHealth(health);

        if (
          !assessment ||
          typeof assessment.healthy !== "boolean" ||
          typeof assessment.summary !== "string"
        ) {
          throw new TypeError("Health assessor returned an invalid assessment.");
        }

        healthChecks.push({ stage: "after", assessment });

        if (!assessment.healthy) {
          failure = {
            kind: "health",
            phase: "after",
            message: assessment.summary || "Adapter is unhealthy after execution.",
          };
          throw new Error(failure.message);
        }
      } catch (error) {
        failure ??= createFailure("health", "after", error);
        throw error;
      }

      status = "completed";
    }
  } catch (error) {
    failure ??= createFailure("configuration", "configuration-or-run", error);
    status = "failed";
  } finally {
    if (initializedAttempted) {
      try {
        await adapter.dispose();
      } catch (error) {
        cleanupFailures.push({
          phase: "dispose",
          message: errorMessage(error),
        });

        if (status !== "failed") {
          status = "failed";
          failure = {
            kind: "adapter-lifecycle",
            phase: "dispose",
            message: "Adapter disposal failed after the benchmark run.",
          };
        }
      }
    }
  }

  const result: BenchmarkResult = {
    runId: reportConfig.runId,
    adapterId: options.adapterId,
    workloadId: workload.id,
    config: reportConfig,
    ...(reportMetadata === undefined
      ? {}
      : { adapterMetadata: reportMetadata }),
    status,
    limitations,
    healthChecks,
    warmupIterationsCompleted,
    measuredIterationsCompleted,
    samplesMs,
    normalizedResults,
    cleanupFailures,
    ...(capabilities === undefined ? {} : { capabilities }),
    ...(status === "completed" && samplesMs.length > 0
      ? { statistics: calculateStatistics(samplesMs) }
      : {}),
    ...(preflightConsistent === undefined ? {} : { preflightConsistent }),
    ...(skipReason === undefined ? {} : { skipReason }),
    ...(failure === undefined ? {} : { failure }),
  };

  return result;
}
