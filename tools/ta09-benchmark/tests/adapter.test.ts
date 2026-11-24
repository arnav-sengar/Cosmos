import assert from "node:assert/strict";
import test from "node:test";

import type { BenchmarkAdapter } from "../src/adapters/benchmark-adapter.js";

const capabilities = {
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
} as const;

interface SeedInput {
  readonly datasetId: string;
}

interface SeedResult {
  readonly recordsLoaded: number;
}

interface BenchmarkQuery {
  readonly queryId: string;
}

interface QueryResult {
  readonly matchedRecords: number;
}

interface HealthReport {
  readonly status: "healthy" | "unhealthy";
}

function createMockAdapter(
  calls: string[],
): BenchmarkAdapter<
  SeedInput,
  SeedResult,
  BenchmarkQuery,
  QueryResult,
  HealthReport
> {
  return {
    async initialize() {
      calls.push("initialize");
    },

    async reset() {
      calls.push("reset");
    },

    async seed(input) {
      calls.push(`seed:${input.datasetId}`);
      return { recordsLoaded: 10 };
    },

    async executeQuery(query) {
      calls.push(`executeQuery:${query.queryId}`);
      return { matchedRecords: 5 };
    },

    getCapabilities() {
      calls.push("getCapabilities");
      return capabilities;
    },

    async healthCheck() {
      calls.push("healthCheck");
      return { status: "healthy" };
    },

    async dispose() {
      calls.push("dispose");
    },
  };
}

test("a concrete adapter satisfies the complete lifecycle contract", async () => {
  const calls: string[] = [];
  const adapter = createMockAdapter(calls);

  await adapter.initialize();
  await adapter.reset();

  const seedResult = await adapter.seed({
    datasetId: "fixture-small",
  });

  const queryResult = await adapter.executeQuery({
    queryId: "Q01",
  });

  const reportedCapabilities = adapter.getCapabilities();
  const health = await adapter.healthCheck();

  await adapter.dispose();

  assert.deepEqual(seedResult, { recordsLoaded: 10 });
  assert.deepEqual(queryResult, { matchedRecords: 5 });
  assert.equal(health.status, "healthy");
  assert.deepEqual(reportedCapabilities, capabilities);

  assert.deepEqual(calls, [
    "initialize",
    "reset",
    "seed:fixture-small",
    "executeQuery:Q01",
    "getCapabilities",
    "healthCheck",
    "dispose",
  ]);
});

test("capability reporting does not require asynchronous execution", () => {
  const adapter = createMockAdapter([]);

  assert.equal(
    adapter.getCapabilities().crossStoreConsistency.support,
    "unsupported",
  );
});