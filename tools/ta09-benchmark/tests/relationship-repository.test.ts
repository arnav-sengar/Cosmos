import assert from "node:assert/strict";
import test from "node:test";

import {
  createRelationshipInputSchema,
  retireRelationshipInputSchema,
  relationshipTraversalQuerySchema,
  relationshipUpdateCorrectionSchema,
  updateRelationshipInputSchema,
} from "../src/validation/relationship-repository.js";

const relationship = {
  id: "relationship-1",
  subjectId: "entity-1",
  predicate: "orbits",
  objectId: "entity-2",
};

const timestamp = "2026-01-01T00:00:00.000Z";

const createInput = {
  relationship,
  validFrom: timestamp,
  recordedAt: timestamp,
  correctionReason: "Initial creation",
  provenanceRef: "source-1",
  createdBy: "system",
};

const updateCorrection = {
  relationshipId: relationship.id,
  replacement: relationship,
  validFrom: timestamp,
  recordedAt: timestamp,
  correctionReason: "Corrected relationship",
  provenanceRef: "source-2",
  createdBy: "system",
};

test("accepts a valid relationship creation input", () => {
  assert.equal(createRelationshipInputSchema.safeParse(createInput).success, true);
});

test("rejects a creation interval whose end is not later than its start", () => {
  assert.equal(
    createRelationshipInputSchema.safeParse({
      ...createInput,
      validTo: timestamp,
    }).success,
    false,
  );
});

test("accepts an update without caller-supplied predicate definition version", () => {
  assert.equal(
    updateRelationshipInputSchema.safeParse({
      correction: updateCorrection,
      expectedVersion: 1,
    }).success,
    true,
  );
});

test("rejects a caller-supplied predicate definition version on update", () => {
  assert.equal(
    relationshipUpdateCorrectionSchema.safeParse({
      ...updateCorrection,
      predicateDefinitionVersion: 1,
    }).success,
    false,
  );
});

test("rejects an update that changes the logical relationship ID", () => {
  assert.equal(
    relationshipUpdateCorrectionSchema.safeParse({
      ...updateCorrection,
      replacement: { ...relationship, id: "different-id" },
    }).success,
    false,
  );
});

test("rejects an invalid update interval", () => {
  assert.equal(
    relationshipUpdateCorrectionSchema.safeParse({
      ...updateCorrection,
      validTo: timestamp,
    }).success,
    false,
  );
});

test("accepts a valid retirement input", () => {
  assert.equal(
    retireRelationshipInputSchema.safeParse({
      relationshipId: relationship.id,
      effectiveAt: timestamp,
      recordedAt: timestamp,
      expectedVersion: 1,
      correctionReason: "Retired",
      provenanceRef: "source-3",
      createdBy: "system",
    }).success,
    true,
  );
});

test("allows traversal direction to be omitted", () => {
  const result = relationshipTraversalQuerySchema.safeParse({
    startEntityId: "entity-1",
    recordedAt: timestamp,
    limits: {
      maxDepth: 5,
      maxVisitedEntities: 100,
      maxExaminedRelationships: 500,
      maxAdjacencyPages: 20,
    },
  });

  assert.equal(result.success, true);

  if (result.success) {
    assert.equal(result.data.direction, undefined);
  }
});

test("rejects an unsupported traversal direction", () => {
  assert.equal(
    relationshipTraversalQuerySchema.safeParse({
      startEntityId: "entity-1",
      recordedAt: timestamp,
      direction: "SIDEWAYS",
      limits: {
        maxDepth: 5,
        maxVisitedEntities: 100,
        maxExaminedRelationships: 500,
        maxAdjacencyPages: 20,
      },
    }).success,
    false,
  );
});

test("rejects unknown repository input properties", () => {
  assert.equal(
    createRelationshipInputSchema.safeParse({
      ...createInput,
      unexpected: true,
    }).success,
    false,
  );
});

test("requires explicit traversal limits", () => {
  assert.equal(
    relationshipTraversalQuerySchema.safeParse({
      startEntityId: "entity-1",
      recordedAt: timestamp,
    }).success,
    false,
  );
});

test("accepts zero maxDepth and positive work budgets", () => {
  assert.equal(
    relationshipTraversalQuerySchema.safeParse({
      startEntityId: "entity-1",
      recordedAt: timestamp,
      limits: {
        maxDepth: 0,
        maxVisitedEntities: 1,
        maxExaminedRelationships: 1,
        maxAdjacencyPages: 1,
      },
    }).success,
    true,
  );
});

test("rejects zero for non-depth traversal budgets", () => {
  for (const key of [
    "maxVisitedEntities",
    "maxExaminedRelationships",
    "maxAdjacencyPages",
  ] as const) {
    const limits = {
      maxDepth: 1,
      maxVisitedEntities: 1,
      maxExaminedRelationships: 1,
      maxAdjacencyPages: 1,
      [key]: 0,
    };

    assert.equal(
      relationshipTraversalQuerySchema.safeParse({
        startEntityId: "entity-1",
        recordedAt: timestamp,
        limits,
      }).success,
      false,
      `${key} should reject zero`,
    );
  }
});

test("rejects unknown traversal limit properties", () => {
  assert.equal(
    relationshipTraversalQuerySchema.safeParse({
      startEntityId: "entity-1",
      recordedAt: timestamp,
      limits: {
        maxDepth: 1,
        maxVisitedEntities: 1,
        maxExaminedRelationships: 1,
        maxAdjacencyPages: 1,
        unexpected: true,
      },
    }).success,
    false,
  );
});

test("rejects fractional traversal limits", () => {
  assert.equal(
    relationshipTraversalQuerySchema.safeParse({
      startEntityId: "entity-1",
      recordedAt: timestamp,
      limits: {
        maxDepth: 1.5,
        maxVisitedEntities: 1,
        maxExaminedRelationships: 1,
        maxAdjacencyPages: 1,
      },
    }).success,
    false,
  );
});

test("compares sub-millisecond valid-time interval boundaries precisely", () => {
  assert.equal(
    createRelationshipInputSchema.safeParse({
      ...createInput,
      validFrom: "2026-01-01T00:00:00.0000001Z",
      validTo: "2026-01-01T00:00:00.0000002Z",
    }).success,
    true,
  );
});
