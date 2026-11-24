import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizedResultsEqual,
  stableSerialize,
} from "../src/benchmark/benchmark-measurement.js";
import { calculateStatistics } from "../src/benchmark/benchmark-result.js";

test("stable serialization sorts object keys and preserves array order", () => {
  assert.equal(
    stableSerialize({ z: 1, a: { y: true, b: null } }),
    '{"a":{"b":null,"y":true},"z":1}',
  );
  assert.notEqual(stableSerialize([1, 2]), stableSerialize([2, 1]));
});

test("rejects non-finite and circular normalized results", () => {
  assert.throws(() => stableSerialize(Number.POSITIVE_INFINITY));
  const circular: { self?: unknown } = {};
  circular.self = circular;
  assert.throws(() => stableSerialize(circular as never));
  assert.throws(() => stableSerialize({ missing: undefined } as never));
  assert.throws(() => stableSerialize(new Date() as never));
  assert.throws(() => stableSerialize([, 1] as never));
});

test("compares normalized results independent of object key order", () => {
  assert.equal(
    normalizedResultsEqual([{ a: 1, b: 2 }], [{ b: 2, a: 1 }]),
    true,
  );
  assert.equal(normalizedResultsEqual([{ a: 1 }], [{ a: 2 }]), false);
});

test("calculates deterministic latency and throughput statistics", () => {
  assert.deepEqual(calculateStatistics([4, 1, 3, 2]), {
    count: 4,
    totalDurationMs: 10,
    meanMs: 2.5,
    minMs: 1,
    medianMs: 2.5,
    p95Ms: 4,
    maxMs: 4,
    operationsPerSecond: 400,
  });
  assert.throws(() => calculateStatistics([]), RangeError);
});
