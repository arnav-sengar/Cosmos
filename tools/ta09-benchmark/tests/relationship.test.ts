import assert from "node:assert/strict";
import test from "node:test";

import { canonicalIdSchema } from "../src/validation/common.js";

import { relationshipSchema } from "../src/validation/relationship.js";

const validRelationship = {
  id: "R-001",
  subjectId: "E-EARTH",
  predicate: "ORBITS",
  objectId: "E-SUN",
} as const;

test("accepts the four-field canonical relationship representation", () => {
  const result = relationshipSchema.parse(validRelationship);

  assert.deepEqual(result, validRelationship);
});

test("validates all relationship IDs using the shared canonical ID contract", () => {
  const result = relationshipSchema.parse(validRelationship);

  assert.equal(result.id, canonicalIdSchema.parse("R-001"));
  assert.equal(result.subjectId, canonicalIdSchema.parse("E-EARTH"));
  assert.equal(result.objectId, canonicalIdSchema.parse("E-SUN"));
});

test("accepts extensible predicate values", () => {
  const result = relationshipSchema.parse({
    ...validRelationship,
    predicate: "A_FUTURE_SCIENTIFIC_RELATIONSHIP",
  });

  assert.equal(result.predicate, "A_FUTURE_SCIENTIFIC_RELATIONSHIP");
});

test("rejects an empty or whitespace-padded predicate", () => {
  for (const predicate of ["", "   ", " ORBITS "]) {
    assert.equal(
      relationshipSchema.safeParse({
        ...validRelationship,
        predicate,
      }).success,
      false,
    );
  }
});

test("rejects invalid relationship identifiers", () => {
  for (const field of ["id", "subjectId", "objectId"] as const) {
    assert.equal(
      relationshipSchema.safeParse({
        ...validRelationship,
        [field]: " ",
      }).success,
      false,
    );
  }
});

test("rejects missing required relationship fields", () => {
  for (const field of [
    "id",
    "subjectId",
    "predicate",
    "objectId",
  ] as const) {
    const incomplete = { ...validRelationship };
    delete (incomplete as Record<string, unknown>)[field];

    assert.equal(relationshipSchema.safeParse(incomplete).success, false);
  }
});

test("rejects unknown relationship properties", () => {
  assert.equal(
    relationshipSchema.safeParse({
      ...validRelationship,
      inversePredicate: "ORBITED_BY",
    }).success,
    false,
  );
});

test("does not silently accept null relationship fields", () => {
  for (const field of [
    "id",
    "subjectId",
    "predicate",
    "objectId",
  ] as const) {
    assert.equal(
      relationshipSchema.safeParse({
        ...validRelationship,
        [field]: null,
      }).success,
      false,
    );
  }
});
