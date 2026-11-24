import assert from "node:assert/strict";
import test from "node:test";

import { entityLifecycleSchema } from "../src/validation/entity-lifecycle.js";

const validActive = {
  entityId: "E-EARTH",
  state: "ACTIVE",
} as const;

const validRetired = {
  entityId: "E-OLD-PLANET",
  state: "RETIRED",
} as const;

const validMergedSource = {
  entityId: "E-OLD-ENTITY-A",
  state: "MERGED_SOURCE",
  lineage: {
    successorIds: ["E-NEW-ENTITY"],
  },
} as const;

const validSplitSource = {
  entityId: "E-ORIGINAL",
  state: "SPLIT_SOURCE",
  lineage: {
    successorIds: ["E-RESULT-A", "E-RESULT-B"],
  },
} as const;

test("accepts an ACTIVE lifecycle record", () => {
  assert.deepEqual(entityLifecycleSchema.parse(validActive), validActive);
});

test("accepts a RETIRED lifecycle record", () => {
  assert.deepEqual(entityLifecycleSchema.parse(validRetired), validRetired);
});

test("accepts a MERGED_SOURCE with exactly one successor", () => {
  assert.deepEqual(
    entityLifecycleSchema.parse(validMergedSource),
    validMergedSource,
  );
});

test("accepts a SPLIT_SOURCE with multiple successors", () => {
  assert.deepEqual(
    entityLifecycleSchema.parse(validSplitSource),
    validSplitSource,
  );
});

test("rejects an unknown lifecycle state", () => {
  assert.equal(
    entityLifecycleSchema.safeParse({
      entityId: "E-EARTH",
      state: "REDIRECTED",
    }).success,
    false,
  );
});

test("rejects an invalid canonical entity ID", () => {
  assert.equal(
    entityLifecycleSchema.safeParse({
      ...validActive,
      entityId: " ",
    }).success,
    false,
  );
});

test("rejects a missing entity ID", () => {
  assert.equal(
    entityLifecycleSchema.safeParse({ state: "ACTIVE" }).success,
    false,
  );
});

test("rejects a missing lineage record for a merge source", () => {
  assert.equal(
    entityLifecycleSchema.safeParse({
      entityId: "E-OLD",
      state: "MERGED_SOURCE",
    }).success,
    false,
  );
});

test("rejects a merge source without exactly one successor", () => {
  for (const successorIds of [
    [],
    ["E-RESULT-A", "E-RESULT-B"],
  ]) {
    assert.equal(
      entityLifecycleSchema.safeParse({
        entityId: "E-OLD",
        state: "MERGED_SOURCE",
        lineage: { successorIds },
      }).success,
      false,
    );
  }
});

test("rejects a split source with fewer than two successors", () => {
  for (const successorIds of [
    [],
    ["E-RESULT-A"],
  ]) {
    assert.equal(
      entityLifecycleSchema.safeParse({
        entityId: "E-OLD",
        state: "SPLIT_SOURCE",
        lineage: { successorIds },
      }).success,
      false,
    );
  }
});

test("rejects invalid successor canonical IDs", () => {
  assert.equal(
    entityLifecycleSchema.safeParse({
      entityId: "E-OLD",
      state: "MERGED_SOURCE",
      lineage: { successorIds: [" "] },
    }).success,
    false,
  );
});

test("rejects lineage on an ACTIVE entity", () => {
  assert.equal(
    entityLifecycleSchema.safeParse({
      ...validActive,
      lineage: { successorIds: ["E-OTHER"] },
    }).success,
    false,
  );
});

test("rejects unknown lifecycle properties", () => {
  assert.equal(
    entityLifecycleSchema.safeParse({
      ...validActive,
      description: "Unapproved lifecycle property",
    }).success,
    false,
  );
});

test("rejects unknown lineage properties", () => {
  assert.equal(
    entityLifecycleSchema.safeParse({
      ...validMergedSource,
      lineage: {
        successorIds: ["E-NEW-ENTITY"],
        reason: "Unapproved property",
      },
    }).success,
    false,
  );
});

test("does not accept null lifecycle fields", () => {
  assert.equal(
    entityLifecycleSchema.safeParse({
      entityId: null,
      state: "ACTIVE",
    }).success,
    false,
  );
});
