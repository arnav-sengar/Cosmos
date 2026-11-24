import assert from "node:assert/strict";
import test from "node:test";

import {
  createSeededRandom,
  deriveSeed,
} from "../src/generators/seeded-random.js";

test("same seed produces the same deterministic sequence", () => {
  const left = createSeededRandom(42);
  const right = createSeededRandom(42);

  assert.deepEqual(
    Array.from({ length: 20 }, () => left.next()),
    Array.from({ length: 20 }, () => right.next()),
  );
});

test("different seeds produce different sequences", () => {
  const left = createSeededRandom(42);
  const right = createSeededRandom(43);

  assert.notDeepEqual(
    Array.from({ length: 5 }, () => left.next()),
    Array.from({ length: 5 }, () => right.next()),
  );
});

test("nextInt stays within the requested exclusive bound", () => {
  const random = createSeededRandom(0);

  for (let index = 0; index < 100; index += 1) {
    const value = random.nextInt(7);
    assert.ok(Number.isInteger(value));
    assert.ok(value >= 0 && value < 7);
  }
});

test("rejects invalid seeds and integer bounds", () => {
  for (const seed of [-1, 1.5, 0x1_0000_0000, Number.NaN]) {
    assert.throws(() => createSeededRandom(seed), RangeError);
  }

  const random = createSeededRandom(1);
  for (const bound of [0, -1, 1.5, Number.NaN, 0x1_0000_0001]) {
    assert.throws(() => random.nextInt(bound), RangeError);
  }
});

test("derived streams are deterministic and separated", () => {
  assert.equal(deriveSeed(10, 20), deriveSeed(10, 20));
  assert.notEqual(deriveSeed(10, 20), deriveSeed(10, 21));
});
