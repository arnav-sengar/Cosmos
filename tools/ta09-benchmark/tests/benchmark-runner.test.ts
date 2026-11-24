import assert from "node:assert/strict";
import test from "node:test";

import type { BenchmarkAdapter } from "../src/adapters/benchmark-adapter.js";
import type { PersistenceCapabilities } from "../src/domain/capabilities.js";
import type { BenchmarkConfig } from "../src/benchmark/benchmark-config.js";
import { runBenchmark } from "../src/benchmark/benchmark-runner.js";
import type { BenchmarkWorkload } from "../src/benchmark/benchmark-workload.js";

interface SeedInput {
  readonly datasetId: string;
}

interface Query {
  readonly value: number;
}

interface Result {
  readonly value: number;
}

interface Health {
  readonly status: "healthy" | "unhealthy";
}

const config: BenchmarkConfig = {
  runId: "runner-test",
  seed: 123,
  datasetId: "small",
  workloadId: "value-read",
  warmupIterations: 2,
  measuredIterations: 4,
};

const capabilities: PersistenceCapabilities = {
  transactions: { support: "supported" },
  isolationLevels: { support: "supported" },
  optimisticVersioning: { support: "supported" },
  conditionalWrites: { support: "supported" },
  cursorPagination: { support: "supported" },
  historicalQueries: { support: "supported" },
  relationshipTraversal: { support: "supported" },
  idempotentOperations: { support: "supported" },
  backupRecovery: { support: "supported" },
  readAfterWrite: { support: "supported" },
  crossStoreConsistency: { support: "unsupported" },
};

const workload: BenchmarkWorkload<SeedInput, Query, Result> = {
  id: "value-read",
  description: "Read a deterministic integer value.",
  requiredCapabilities: ["readAfterWrite"],

  createSeedInput({ datasetId }) {
    return { datasetId };
  },

  createQuery({ random }) {
    return { value: random.nextInt(1000) };
  },

  validateResult(result, query) {
    assert.equal(result.value, query.value);
  },

  normalizeResult(result) {
    return { value: result.value };
  },
};

function createAdapter(
  calls: string[],
  options: {
    readonly initializeError?: Error;
    readonly seedOffset?: (seedCount: number) => number;
    readonly executeError?: Error;
    readonly disposeError?: Error;
    readonly reportedCapabilities?: PersistenceCapabilities;
  } = {},
): BenchmarkAdapter<SeedInput, { readonly loaded: number }, Query, Result, Health> {
  let seedCount = 0;
  let offset = 0;

  return {
    async initialize() {
      calls.push("initialize");
      if (options.initializeError) throw options.initializeError;
    },

    async reset() {
      calls.push("reset");
      offset = 0;
    },

    async seed(input) {
      calls.push(`seed:${input.datasetId}`);
      seedCount += 1;
      offset = options.seedOffset?.(seedCount) ?? 0;
      return { loaded: 1 };
    },

    async executeQuery(query) {
      calls.push(`execute:${query.value}`);
      if (options.executeError) throw options.executeError;
      return { value: query.value + offset };
    },

    getCapabilities() {
      calls.push("capabilities");
      return options.reportedCapabilities ?? capabilities;
    },

    async healthCheck() {
      calls.push("health");
      return { status: "healthy" };
    },

    async dispose() {
      calls.push("dispose");
      if (options.disposeError) throw options.disposeError;
    },
  };
}

const runnerOptions = {
  adapterId: "mock",
  assessHealth: (health: Health) => ({
    healthy: health.status === "healthy",
    summary: health.status,
  }),
  now: (() => {
    let time = 0;
    return () => {
      time += 1;
      return time;
    };
  })(),
};

test("runs initialize, preflight, warm-up, reset/reseed, measurement and disposal", async () => {
  const calls: string[] = [];
  const result = await runBenchmark(
    createAdapter(calls),
    workload,
    config,
    runnerOptions,
  );

  assert.equal(result.status, "completed");
  assert.deepEqual(result.config, config);
  assert.equal(result.preflightConsistent, true);
  assert.equal(result.warmupIterationsCompleted, 2);
  assert.equal(result.measuredIterationsCompleted, 4);
  assert.equal(result.samplesMs.length, 4);
  assert.equal(result.statistics?.count, 4);
  assert.equal(result.capabilities?.crossStoreConsistency.support, "unsupported");
  assert.deepEqual(calls.slice(0, 4), [
    "initialize",
    "health",
    "capabilities",
    "reset",
  ]);
  assert.equal(calls.filter((call) => call === "reset").length, 2);
  assert.equal(calls.filter((call) => call.startsWith("seed:")).length, 2);
  assert.equal(calls.at(-1), "dispose");
});

test("uses the same seed and measured query sequence for the same configuration", async () => {
  const firstCalls: string[] = [];
  const secondCalls: string[] = [];

  const first = await runBenchmark(
    createAdapter(firstCalls),
    workload,
    config,
    runnerOptions,
  );
  const second = await runBenchmark(
    createAdapter(secondCalls),
    workload,
    config,
    runnerOptions,
  );

  assert.deepEqual(first.normalizedResults, second.normalizedResults);
});

test("skips workloads requiring unsupported capabilities without seeding", async () => {
  const calls: string[] = [];
  const unsupportedWorkload = {
    ...workload,
    requiredCapabilities: ["crossStoreConsistency"] as const,
  };

  const result = await runBenchmark(
    createAdapter(calls),
    unsupportedWorkload,
    config,
    runnerOptions,
  );

  assert.equal(result.status, "skipped");
  assert.match(result.skipReason ?? "", /crossStoreConsistency/);
  assert.equal(calls.some((call) => call.startsWith("seed:")), false);
  assert.equal(calls.at(-1), "dispose");
});

test("reports limited capabilities and their declared limitations", async () => {
  const calls: string[] = [];
  const limited = {
    ...capabilities,
    transactions: {
      support: "limited" as const,
      limitations: ["Single-store transactions only."] as const,
    },
  };

  const result = await runBenchmark(
    createAdapter(calls, { reportedCapabilities: limited }),
    workload,
    config,
    runnerOptions,
  );

  assert.equal(result.status, "completed");
  assert.deepEqual(result.limitations.transactions, [
    "Single-store transactions only.",
  ]);
});

test("detects a non-reproducible reset and seed cycle", async () => {
  const calls: string[] = [];
  const result = await runBenchmark(
    createAdapter(calls, {
      seedOffset: (seedCount) => seedCount - 1,
    }),
    { ...workload, validateResult: () => undefined },
    config,
    runnerOptions,
  );

  assert.equal(result.status, "failed");
  assert.equal(result.failure?.kind, "correctness");
  assert.equal(result.failure?.phase, "reset-reproducibility");
  assert.equal(result.preflightConsistent, false);
  assert.equal(calls.at(-1), "dispose");
});

test("attempts disposal after partial initialization failure", async () => {
  const calls: string[] = [];
  const result = await runBenchmark(
    createAdapter(calls, {
      initializeError: new Error("initialization failed"),
    }),
    workload,
    config,
    runnerOptions,
  );

  assert.equal(result.status, "failed");
  assert.equal(result.failure?.kind, "adapter-lifecycle");
  assert.equal(result.failure?.phase, "initialize");
  assert.equal(calls.at(-1), "dispose");
});

test("preserves the primary failure and records disposal failure separately", async () => {
  const calls: string[] = [];
  const result = await runBenchmark(
    createAdapter(calls, {
      executeError: new Error("query failed"),
      disposeError: new Error("cleanup failed"),
    }),
    workload,
    config,
    runnerOptions,
  );

  assert.equal(result.status, "failed");
  assert.equal(result.failure?.message, "query failed");
  assert.equal(result.failure?.kind, "adapter-operation");
  assert.equal(result.failure?.phase, "preflight-execution");
  assert.equal(result.cleanupFailures.length, 1);
  assert.equal(result.cleanupFailures[0]?.message, "cleanup failed");
});

test("records adapter metadata and rejects an unhealthy adapter before seeding", async () => {
  const calls: string[] = [];
  const result = await runBenchmark(createAdapter(calls), workload, config, {
    ...runnerOptions,
    adapterMetadata: { engine: "mock", version: "1" },
    assessHealth: () => ({ healthy: false, summary: "maintenance mode" }),
  });

  assert.equal(result.status, "failed");
  assert.equal(result.failure?.kind, "health");
  assert.deepEqual(result.adapterMetadata, { engine: "mock", version: "1" });
  assert.equal(calls.some((call) => call.startsWith("seed:")), false);
  assert.equal(calls.at(-1), "dispose");
});

test("rejects a workload/configuration ID mismatch before initialization", async () => {
  const calls: string[] = [];
  const result = await runBenchmark(
    createAdapter(calls),
    workload,
    { ...config, workloadId: "different" },
    runnerOptions,
  );

  assert.equal(result.status, "failed");
  assert.equal(calls.length, 0);
});
