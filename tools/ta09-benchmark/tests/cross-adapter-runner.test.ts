import assert from "node:assert/strict";
import test from "node:test";

import type { BenchmarkAdapter } from "../src/adapters/benchmark-adapter.js";
import type { PersistenceCapabilities } from "../src/domain/capabilities.js";
import type { BenchmarkConfig } from "../src/benchmark/benchmark-config.js";
import type { BenchmarkWorkload } from "../src/benchmark/benchmark-workload.js";
import { runCrossAdapterBenchmark } from "../src/runner/cross-adapter-runner.js";

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
  readonly healthy: boolean;
}

const config: BenchmarkConfig = {
  runId: "cross-run",
  seed: 456,
  datasetId: "fixture",
  workloadId: "cross-read",
  warmupIterations: 1,
  measuredIterations: 3,
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
  id: "cross-read",
  description: "Compare a deterministic semantic read.",
  requiredCapabilities: ["readAfterWrite"],
  createSeedInput: ({ datasetId }) => ({ datasetId }),
  createQuery: ({ random }) => ({ value: random.nextInt(100) }),
  validateResult: () => undefined,
  normalizeResult: (result) => ({ value: result.value }),
};

function adapter(offset: number): BenchmarkAdapter<
  SeedInput,
  { readonly loaded: number },
  Query,
  Result,
  Health
> {
  let currentOffset = offset;

  return {
    async initialize() {},
    async reset() {
      currentOffset = offset;
    },
    async seed() {
      return { loaded: 1 };
    },
    async executeQuery(query) {
      return { value: query.value + currentOffset };
    },
    getCapabilities() {
      return capabilities;
    },
    async healthCheck() {
      return { healthy: true };
    },
    async dispose() {},
  };
}

const assessHealth = (health: Health) => ({
  healthy: health.healthy,
  summary: health.healthy ? "healthy" : "unhealthy",
});

test("reports matching semantic results for equivalent adapters", async () => {
  const report = await runCrossAdapterBenchmark(
    [
      { id: "adapter-a", metadata: { engine: "memory" }, adapter: adapter(0), assessHealth },
      { id: "adapter-b", adapter: adapter(0), assessHealth },
    ],
    workload,
    config,
  );

  assert.equal(report.status, "matched");
  assert.equal(report.baselineAdapterId, "adapter-a");
  assert.equal(report.results.length, 2);
  assert.deepEqual(report.config, config);
  assert.deepEqual(report.results[0]?.adapterMetadata, { engine: "memory" });
  assert.equal(report.comparisons[1]?.comparedWithBaseline, true);
  assert.deepEqual(report.comparisons[1]?.mismatchIndexes, []);
  assert.equal(report.capabilityMatrix.length, 11);
  assert.equal(
    report.capabilityMatrix.find((row) => row.capability === "readAfterWrite")
      ?.adapters["adapter-a"]?.support,
    "supported",
  );
});

test("detects semantic mismatches between adapters", async () => {
  const report = await runCrossAdapterBenchmark(
    [
      { id: "baseline", adapter: adapter(0), assessHealth },
      { id: "different", adapter: adapter(1), assessHealth },
    ],
    workload,
    config,
  );

  assert.equal(report.status, "mismatched");
  assert.deepEqual(report.comparisons[1]?.mismatchIndexes, [0, 1, 2]);
});

test("marks comparison incomplete when an adapter cannot support the workload", async () => {
  const limitedCapabilities = {
    ...capabilities,
    readAfterWrite: {
      support: "unsupported" as const,
      limitations: ["Not guaranteed by this adapter."],
    },
  };

  const unsupportedAdapter = {
    ...adapter(0),
    getCapabilities() {
      return limitedCapabilities;
    },
  };

  const report = await runCrossAdapterBenchmark(
    [
      { id: "supported", adapter: adapter(0), assessHealth },
      {
        id: "unsupported",
        adapter: unsupportedAdapter,
        assessHealth,
      },
    ],
    workload,
    config,
  );

  assert.equal(report.status, "incomplete");
  assert.equal(report.results[1]?.status, "skipped");
  assert.equal(report.comparisons[1]?.comparedWithBaseline, false);
});

test("rejects fewer than two adapters and duplicate adapter IDs", async () => {
  await assert.rejects(
    runCrossAdapterBenchmark([], workload, config),
    RangeError,
  );
  await assert.rejects(
    runCrossAdapterBenchmark(
      [{ id: "only", adapter: adapter(0), assessHealth }],
      workload,
      config,
    ),
    RangeError,
  );

  await assert.rejects(
    runCrossAdapterBenchmark(
      [
        { id: "same", adapter: adapter(0), assessHealth },
        { id: "same", adapter: adapter(0), assessHealth },
      ],
      workload,
      config,
    ),
    /Duplicate adapter ID/,
  );
});
