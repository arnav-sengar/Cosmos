import assert from "node:assert/strict";
import test from "node:test";

import { benchmarkConfigSchema } from "../src/validation/benchmark.js";

const validConfig = {
  runId: "run-001",
  seed: 1234,
  datasetId: "fixture-small",
  workloadId: "entity-read",
  warmupIterations: 5,
  measuredIterations: 20,
};

test("accepts a valid reproducible benchmark configuration", () => {
  assert.deepEqual(benchmarkConfigSchema.parse(validConfig), validConfig);
});

test("rejects invalid identifiers, seeds and iteration counts", () => {
  const invalid = [
    { ...validConfig, runId: " " },
    { ...validConfig, workloadId: " workload " },
    { ...validConfig, seed: -1 },
    { ...validConfig, seed: 0x1_0000_0000 },
    { ...validConfig, warmupIterations: -1 },
    { ...validConfig, measuredIterations: 0 },
    { ...validConfig, measuredIterations: 100_001 },
  ];

  for (const config of invalid) {
    assert.equal(benchmarkConfigSchema.safeParse(config).success, false);
  }
});

test("rejects unknown configuration properties", () => {
  assert.equal(
    benchmarkConfigSchema.safeParse({
      ...validConfig,
      timeoutMs: 5000,
    }).success,
    false,
  );
});
