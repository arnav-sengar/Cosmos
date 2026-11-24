import assert from "node:assert/strict";
import test from "node:test";

import {
  capabilityDeclarationSchema,
  persistenceCapabilitiesSchema,
} from "../src/validation/capabilities.js";

const validCapabilities = {
  transactions: { support: "supported" },
  isolationLevels: { support: "limited", limitations: ["Serializable is unavailable."] },
  optimisticVersioning: { support: "supported" },
  conditionalWrites: { support: "supported" },
  cursorPagination: { support: "supported" },
  historicalQueries: { support: "unsupported" },
  relationshipTraversal: { support: "limited", limitations: ["Maximum traversal depth is provider-defined."] },
  idempotentOperations: { support: "supported" },
  backupRecovery: { support: "unsupported", limitations: ["Managed externally."] },
  readAfterWrite: { support: "supported" },
  crossStoreConsistency: { support: "unsupported" },
} as const;

test("accepts all eleven required capability dimensions", () => {
  const result = persistenceCapabilitiesSchema.parse(validCapabilities);

  assert.deepEqual(result, validCapabilities);
  assert.equal(Object.keys(result).length, 11);
});

test("accepts supported declarations without limitations", () => {
  assert.deepEqual(
    capabilityDeclarationSchema.parse({ support: "supported" }),
    { support: "supported" },
  );
});

test("accepts limited declarations with one or more limitations", () => {
  assert.deepEqual(
    capabilityDeclarationSchema.parse({
      support: "limited",
      limitations: ["Only single-store transactions are supported."],
    }),
    {
      support: "limited",
      limitations: ["Only single-store transactions are supported."],
    },
  );
});

test("rejects limited declarations without limitations", () => {
  assert.equal(
    capabilityDeclarationSchema.safeParse({ support: "limited" }).success,
    false,
  );
});

test("rejects limited declarations with an empty limitations array", () => {
  assert.equal(
    capabilityDeclarationSchema.safeParse({
      support: "limited",
      limitations: [],
    }).success,
    false,
  );
});

test("rejects blank or whitespace-padded limitation descriptions", () => {
  for (const limitation of ["", "   ", " limitation "]) {
    assert.equal(
      capabilityDeclarationSchema.safeParse({
        support: "limited",
        limitations: [limitation],
      }).success,
      false,
    );
  }
});

test("accepts unsupported declarations without limitations", () => {
  assert.deepEqual(
    capabilityDeclarationSchema.parse({ support: "unsupported" }),
    { support: "unsupported" },
  );
});

test("accepts unsupported declarations with explanatory limitations", () => {
  assert.deepEqual(
    capabilityDeclarationSchema.parse({
      support: "unsupported",
      limitations: ["Not provided by this adapter."],
    }),
    {
      support: "unsupported",
      limitations: ["Not provided by this adapter."],
    },
  );
});

test("rejects unknown support states", () => {
  assert.equal(
    capabilityDeclarationSchema.safeParse({ support: "partial" }).success,
    false,
  );
});

test("rejects unknown declaration properties", () => {
  assert.equal(
    capabilityDeclarationSchema.safeParse({
      support: "supported",
      providerGuarantee: "strong",
    }).success,
    false,
  );
});

test("rejects missing capability dimensions", () => {
  const incomplete = { ...validCapabilities };
  delete (incomplete as { backupRecovery?: unknown }).backupRecovery;

  assert.equal(
    persistenceCapabilitiesSchema.safeParse(incomplete).success,
    false,
  );
});

test("rejects unknown capability dimensions", () => {
  assert.equal(
    persistenceCapabilitiesSchema.safeParse({
      ...validCapabilities,
      arbitraryCapability: { support: "supported" },
    }).success,
    false,
  );
});