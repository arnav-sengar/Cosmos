import assert from "node:assert/strict";
import test from "node:test";

import {
  predicateConstraintsSchema,
  predicateDefinitionSchema,
  predicateDefinitionVersionSchema,
  predicateStatusSchema,
  predicateTemporalQuerySchema,
} from "../src/validation/predicate.js";

const validDefinition = {
  predicate: "ORBITS",
  constraints: {
    allowedSubjectTypes: ["planet", "moon"],
    allowedObjectTypes: ["star"],
    acyclic: true,
  },
  status: "ACTIVE",
} as const;

const validVersion = {
  predicate: "ORBITS",
  version: 1,
  definition: validDefinition,
  validFrom: "2026-01-01T00:00:00Z",
  recordedFrom: "2026-01-01T00:00:00Z",
} as const;

test("accepts ACTIVE and RETIRED predicate statuses", () => {
  assert.equal(predicateStatusSchema.parse("ACTIVE"), "ACTIVE");
  assert.equal(predicateStatusSchema.parse("RETIRED"), "RETIRED");
});

test("rejects unsupported predicate status values", () => {
  assert.equal(predicateStatusSchema.safeParse("DISABLED").success, false);
});

test("accepts extensible predicate definitions and constraints", () => {
  const result = predicateDefinitionSchema.parse({
    ...validDefinition,
    predicate: "A_FUTURE_SCIENTIFIC_PREDICATE",
    constraints: {},
  });

  assert.deepEqual(result.constraints, {});
});

test("rejects empty or whitespace-padded predicate identifiers", () => {
  for (const predicate of ["", " ", " ORBITS "]) {
    assert.equal(
      predicateDefinitionSchema.safeParse({
        ...validDefinition,
        predicate,
      }).success,
      false,
    );
  }
});

test("rejects empty entity-type constraint arrays", () => {
  for (const field of ["allowedSubjectTypes", "allowedObjectTypes"] as const) {
    assert.equal(
      predicateConstraintsSchema.safeParse({ [field]: [] }).success,
      false,
    );
  }
});

test("rejects empty or whitespace-padded entity type values", () => {
  for (const value of ["", " ", " planet "]) {
    assert.equal(
      predicateConstraintsSchema.safeParse({
        allowedSubjectTypes: [value],
      }).success,
      false,
    );
  }
});

test("rejects unknown predicate definition and constraint properties", () => {
  assert.equal(
    predicateDefinitionSchema.safeParse({
      ...validDefinition,
      inversePredicate: "ORBITED_BY",
    }).success,
    false,
  );

  assert.equal(
    predicateConstraintsSchema.safeParse({
      transitive: true,
    }).success,
    false,
  );
});

test("accepts a valid bitemporal predicate definition version", () => {
  const result = predicateDefinitionVersionSchema.parse(validVersion);

  assert.equal(result.predicate, "ORBITS");
  assert.equal(result.version, 1);
  assert.equal("validTo" in result, false);
  assert.equal("recordedTo" in result, false);
});

test("rejects a version whose definition has a different predicate", () => {
  assert.equal(
    predicateDefinitionVersionSchema.safeParse({
      ...validVersion,
      definition: {
        ...validDefinition,
        predicate: "ROTATES",
      },
    }).success,
    false,
  );
});

test("requires valid-time and recorded-time end points to be later than their starts", () => {
  for (const [field, value] of [
    ["validTo", "2026-01-01T00:00:00Z"],
    ["recordedTo", "2026-01-01T00:00:00Z"],
  ] as const) {
    assert.equal(
      predicateDefinitionVersionSchema.safeParse({
        ...validVersion,
        [field]: value,
      }).success,
      false,
    );
  }
});

test("compares fractional seconds without losing sub-millisecond precision", () => {
  assert.equal(
    predicateDefinitionVersionSchema.safeParse({
      ...validVersion,
      validTo: "2026-01-01T00:00:00.123456788Z",
      validFrom: "2026-01-01T00:00:00.123456789Z",
    }).success,
    false,
  );
});

test("treats equivalent fractional-second representations as equal", () => {
  assert.equal(
    predicateDefinitionVersionSchema.safeParse({
      ...validVersion,
      validFrom: "2026-01-01T00:00:00.1200Z",
      validTo: "2026-01-01T00:00:00.12Z",
    }).success,
    false,
  );
});

test("requires recordedAt for bitemporal predicate queries", () => {
  assert.equal(
    predicateTemporalQuerySchema.safeParse({}).success,
    false,
  );

  assert.deepEqual(
    predicateTemporalQuerySchema.parse({
      recordedAt: "2026-01-01T00:00:00Z",
    }),
    {
      recordedAt: "2026-01-01T00:00:00Z",
    },
  );
});

test("accepts independent validAt and recordedAt query dimensions", () => {
  const result = predicateTemporalQuerySchema.parse({
    validAt: "2025-12-01T00:00:00Z",
    recordedAt: "2026-01-01T00:00:00Z",
  });

  assert.equal(result.validAt, "2025-12-01T00:00:00Z");
  assert.equal(result.recordedAt, "2026-01-01T00:00:00Z");
});

test("rejects unknown temporal query properties", () => {
  assert.equal(
    predicateTemporalQuerySchema.safeParse({
      recordedAt: "2026-01-01T00:00:00Z",
      transactionTime: "2026-01-01T00:00:00Z",
    }).success,
    false,
  );
});
