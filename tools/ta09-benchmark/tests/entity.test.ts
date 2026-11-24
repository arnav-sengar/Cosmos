import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalIdSchema,
} from "../src/validation/common.js";

import { entitySchema } from "../src/validation/entity.js";

const validEntity = {
  id: "E-EARTH",
  name: "Earth",
  domain: "Celestial Entities",
  type: "PLANET",
} as const;

test("accepts the approved four-field entity representation", () => {
  const result = entitySchema.parse(validEntity);

  assert.deepEqual(result, validEntity);
});

test("validates the entity ID using the shared canonical ID contract", () => {
  assert.equal(
    entitySchema.parse(validEntity).id,
    canonicalIdSchema.parse("E-EARTH"),
  );
});

test("accepts extensible domain and type values", () => {
  const result = entitySchema.parse({
    ...validEntity,
    domain: "A future scientific domain",
    type: "FUTURE_ENTITY_SUBTYPE",
  });

  assert.equal(result.domain, "A future scientific domain");
  assert.equal(result.type, "FUTURE_ENTITY_SUBTYPE");
});

test("rejects an empty or whitespace-padded entity name", () => {
  for (const name of ["", "   ", " Earth "]) {
    assert.equal(
      entitySchema.safeParse({
        ...validEntity,
        name,
      }).success,
      false,
    );
  }
});

test("rejects an empty or whitespace-padded domain", () => {
  for (const domain of ["", "   ", " Celestial Entities "]) {
    assert.equal(
      entitySchema.safeParse({
        ...validEntity,
        domain,
      }).success,
      false,
    );
  }
});

test("rejects an empty or whitespace-padded entity type", () => {
  for (const type of ["", "   ", " PLANET "]) {
    assert.equal(
      entitySchema.safeParse({
        ...validEntity,
        type,
      }).success,
      false,
    );
  }
});

test("rejects an invalid canonical entity ID", () => {
  assert.equal(
    entitySchema.safeParse({
      ...validEntity,
      id: " ",
    }).success,
    false,
  );
});

test("rejects missing required entity fields", () => {
  for (const field of ["id", "name", "domain", "type"] as const) {
    const incomplete = { ...validEntity };
    delete (incomplete as Record<string, unknown>)[field];

    assert.equal(entitySchema.safeParse(incomplete).success, false);
  }
});

test("rejects unknown entity properties", () => {
  assert.equal(
    entitySchema.safeParse({
      ...validEntity,
      description: "An unapproved field",
    }).success,
    false,
  );
});

test("does not silently accept null entity fields", () => {
  for (const field of ["id", "name", "domain", "type"] as const) {
    assert.equal(
      entitySchema.safeParse({
        ...validEntity,
        [field]: null,
      }).success,
      false,
    );
  }
});