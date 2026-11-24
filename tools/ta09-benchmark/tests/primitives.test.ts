import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canonicalIdSchema,
  isoDateTimeSchema,
  operationContextSchema,
  pageRequestSchema,
  recordVersionSchema,
  temporalQuerySchema,
} from "../src/validation/common.js";

describe("canonicalIdSchema", () => {
  it("accepts a non-empty canonical identifier", () => {
    assert.equal(canonicalIdSchema.safeParse("earth").success, true);
  });

  it("does not impose a UUID or ULID encoding", () => {
    assert.equal(
      canonicalIdSchema.safeParse("urn:cosmos:entity:earth").success,
      true,
    );
  });

  it("rejects empty and whitespace-padded identifiers", () => {
    assert.equal(canonicalIdSchema.safeParse("").success, false);
    assert.equal(canonicalIdSchema.safeParse(" earth").success, false);
    assert.equal(canonicalIdSchema.safeParse("earth ").success, false);
    assert.equal(canonicalIdSchema.safeParse("   ").success, false);
  });

  it("rejects identifiers longer than 256 characters", () => {
    assert.equal(canonicalIdSchema.safeParse("a".repeat(257)).success, false);
  });

  it("accepts identifiers at the maximum length", () => {
    assert.equal(canonicalIdSchema.safeParse("a".repeat(256)).success, true);
  });
});

describe("recordVersionSchema", () => {
  it("accepts positive integer versions", () => {
    assert.equal(recordVersionSchema.safeParse(1).success, true);
    assert.equal(recordVersionSchema.safeParse(42).success, true);
  });

  it("rejects zero and negative versions", () => {
    assert.equal(recordVersionSchema.safeParse(0).success, false);
    assert.equal(recordVersionSchema.safeParse(-1).success, false);
  });

  it("rejects fractional and non-finite versions", () => {
    assert.equal(recordVersionSchema.safeParse(1.5).success, false);
    assert.equal(recordVersionSchema.safeParse(Number.NaN).success, false);
    assert.equal(recordVersionSchema.safeParse(Number.POSITIVE_INFINITY).success, false);
  });
});

describe("isoDateTimeSchema", () => {
  it("accepts UTC ISO date-time strings", () => {
    assert.equal(
      isoDateTimeSchema.safeParse("2026-11-22T12:30:45Z").success,
      true,
    );
    assert.equal(
      isoDateTimeSchema.safeParse("2026-11-22T12:30:45.123Z").success,
      true,
    );
  });

  it("rejects offset-based date-times", () => {
    assert.equal(
      isoDateTimeSchema.safeParse("2026-11-22T12:30:45+05:30").success,
      false,
    );
  });

  it("rejects local date-times without a timezone", () => {
    assert.equal(
      isoDateTimeSchema.safeParse("2026-11-22T12:30:45").success,
      false,
    );
  });

  it("rejects date-only values", () => {
    assert.equal(
      isoDateTimeSchema.safeParse("2026-11-22").success,
      false,
    );
  });
});

describe("pageRequestSchema", () => {
  it("accepts a page request without a cursor", () => {
    assert.deepEqual(pageRequestSchema.parse({ limit: 25 }), { limit: 25 });
  });

  it("accepts a page request with a cursor", () => {
    assert.deepEqual(
      pageRequestSchema.parse({ limit: 25, cursor: "cursor-1" }),
      { limit: 25, cursor: "cursor-1" },
    );
  });

  it("rejects zero, negative, and fractional limits", () => {
    assert.equal(pageRequestSchema.safeParse({ limit: 0 }).success, false);
    assert.equal(pageRequestSchema.safeParse({ limit: -1 }).success, false);
    assert.equal(pageRequestSchema.safeParse({ limit: 1.5 }).success, false);
  });

  it("rejects page sizes above 500", () => {
    assert.equal(pageRequestSchema.safeParse({ limit: 501 }).success, false);
  });

  it("accepts the maximum page size", () => {
    assert.equal(pageRequestSchema.safeParse({ limit: 500 }).success, true);
  });

  it("rejects empty or whitespace-padded cursors", () => {
    assert.equal(
      pageRequestSchema.safeParse({ limit: 10, cursor: "" }).success,
      false,
    );
    assert.equal(
      pageRequestSchema.safeParse({ limit: 10, cursor: " cursor" }).success,
      false,
    );
  });

  it("rejects cursors longer than 2048 characters", () => {
    assert.equal(
      pageRequestSchema.safeParse({
        limit: 10,
        cursor: "a".repeat(2049),
      }).success,
      false,
    );
  });

  it("rejects unknown properties", () => {
    assert.equal(
      pageRequestSchema.safeParse({ limit: 10, unexpected: true }).success,
      false,
    );
  });
});

describe("temporalQuerySchema", () => {
  it("accepts a valid-time constraint independently", () => {
    assert.equal(
      temporalQuerySchema.safeParse({
        validAt: "2026-11-22T12:00:00Z",
      }).success,
      true,
    );
  });

  it("accepts a recorded-time constraint independently", () => {
    assert.equal(
      temporalQuerySchema.safeParse({
        recordedAt: "2026-11-22T12:00:00Z",
      }).success,
      true,
    );
  });

  it("accepts both independent temporal constraints", () => {
    assert.equal(
      temporalQuerySchema.safeParse({
        validAt: "2026-11-20T12:00:00Z",
        recordedAt: "2026-11-22T12:00:00Z",
      }).success,
      true,
    );
  });

  it("accepts an empty temporal query", () => {
    assert.deepEqual(temporalQuerySchema.parse({}), {});
  });

  it("rejects unknown temporal properties", () => {
    assert.equal(
      temporalQuerySchema.safeParse({
        validAt: "2026-11-22T12:00:00Z",
        systemTime: "2026-11-22T12:00:00Z",
      }).success,
      false,
    );
  });
});

describe("operationContextSchema", () => {
  it("accepts operation and correlation identifiers", () => {
    assert.deepEqual(
      operationContextSchema.parse({
        operationId: "operation-123",
        correlationId: "correlation-456",
      }),
      {
        operationId: "operation-123",
        correlationId: "correlation-456",
      },
    );
  });

  it("rejects missing identifiers", () => {
    assert.equal(
      operationContextSchema.safeParse({
        operationId: "operation-123",
      }).success,
      false,
    );
  });

  it("rejects empty and whitespace-padded identifiers", () => {
    assert.equal(
      operationContextSchema.safeParse({
        operationId: "",
        correlationId: "correlation-456",
      }).success,
      false,
    );

    assert.equal(
      operationContextSchema.safeParse({
        operationId: " operation-123",
        correlationId: "correlation-456",
      }).success,
      false,
    );
  });

  it("rejects identifiers longer than 128 characters", () => {
    assert.equal(
      operationContextSchema.safeParse({
        operationId: "a".repeat(129),
        correlationId: "correlation-456",
      }).success,
      false,
    );
  });

  it("rejects unknown properties", () => {
    assert.equal(
      operationContextSchema.safeParse({
        operationId: "operation-123",
        correlationId: "correlation-456",
        extra: true,
      }).success,
      false,
    );
  });
});
