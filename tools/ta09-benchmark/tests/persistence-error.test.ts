import assert from "node:assert/strict";
import test from "node:test";
import { ZodError } from "zod";

import { PERSISTENCE_ERROR_CODES } from "../src/errors/persistence-error.js";
import {
  createPersistenceError,
  persistenceErrorSchema,
} from "../src/validation/persistence-error.js";
import type { PersistenceErrorInput } from "../src/validation/persistence-error.js";

function validError(
  overrides: Partial<PersistenceErrorInput> = {},
): PersistenceErrorInput {
  return {
    code: "NOT_FOUND",
    message: "Entity was not found.",
    retryable: false,
    operationId: "operation-001",
    correlationId: "correlation-001",
    ...overrides,
  };
}

test("accepts all ten standardized persistence error codes", () => {
  for (const code of PERSISTENCE_ERROR_CODES) {
    const result = persistenceErrorSchema.parse(validError({ code }));
    assert.equal(result.code, code);
  }

  assert.equal(PERSISTENCE_ERROR_CODES.length, 10);
});

test("requires a non-empty error message", () => {
  assert.throws(
    () => persistenceErrorSchema.parse(validError({ message: "" })),
    ZodError,
  );
});

test("rejects error messages with surrounding whitespace", () => {
  assert.throws(
    () => persistenceErrorSchema.parse(
      validError({ message: " Entity was not found. " }),
    ),
    ZodError,
  );
});

test("requires retryability to be an explicit boolean", () => {
  assert.throws(
    () => persistenceErrorSchema.parse({
      ...validError(),
      retryable: undefined,
    }),
    ZodError,
  );

  assert.throws(
    () => persistenceErrorSchema.parse({
      ...validError(),
      retryable: "yes",
    }),
    ZodError,
  );
});

test("preserves explicit retryability without inferring it from the code", () => {
  const nonRetryable = createPersistenceError(
    validError({ code: "TEMPORARY_FAILURE", retryable: false }),
  );

  const retryable = createPersistenceError(
    validError({ code: "VALIDATION_FAILED", retryable: true }),
  );

  assert.equal(nonRetryable.retryable, false);
  assert.equal(retryable.retryable, true);
});

test("requires operation and correlation identifiers", () => {
  assert.throws(
    () => persistenceErrorSchema.parse({
      ...validError(),
      operationId: "",
    }),
    ZodError,
  );

  assert.throws(
    () => persistenceErrorSchema.parse({
      ...validError(),
      correlationId: "",
    }),
    ZodError,
  );
});

test("rejects operation identifiers longer than 128 characters", () => {
  assert.throws(
    () => persistenceErrorSchema.parse(
      validError({ operationId: "a".repeat(129) }),
    ),
    ZodError,
  );

  assert.throws(
    () => persistenceErrorSchema.parse(
      validError({ correlationId: "a".repeat(129) }),
    ),
    ZodError,
  );
});

test("accepts an error without optional details", () => {
  const result = persistenceErrorSchema.parse(validError());
  assert.equal("details" in result, false);
});

test("preserves structured optional details", () => {
  const details = {
    provider: "test-adapter",
    expectedVersion: 2,
    actualVersion: 3,
    metadata: {
      resource: "entity",
      affectedCount: 1,
    },
  };

  const result = createPersistenceError(validError({ details }));
  assert.deepEqual(result.details, details);
});

test("rejects unknown top-level error fields", () => {
  assert.throws(
    () => persistenceErrorSchema.parse({
      ...validError(),
      providerError: "unexpected",
    }),
    ZodError,
  );
});

test("rejects missing required error fields", () => {
  const { operationId: _operationId, ...missingOperationId } = validError();
  void _operationId;

  assert.throws(
    () => persistenceErrorSchema.parse(missingOperationId),
    ZodError,
  );
});

test("factory returns a validated standardized error", () => {
  const input = validError({
    code: "VERSION_CONFLICT",
    message: "Record version does not match.",
    retryable: false,
  });

  const result = createPersistenceError(input);
  assert.deepEqual(result, input);
});