import assert from "node:assert/strict";
import test from "node:test";

import type { Entity } from "../src/domain/entity.js";
import type {
  PredicateDefinitionVersion,
  PredicateStatus,
} from "../src/domain/predicate.js";
import type {
  CanonicalId,
  OperationContext,
  RecordVersion,
} from "../src/domain/primitives.js";
import type { Relationship } from "../src/domain/relationship.js";
import type { EntityReferenceResolver } from "../src/repositories/entity-reference-resolver.js";
import type { PredicateRegistry } from "../src/repositories/predicate-registry.js";
import type { RelationshipGraphReader } from "../src/repositories/relationship-graph-reader.js";
import { DefaultRelationshipWriteValidator } from "../src/repositories/default-relationship-write-validator.js";
import {
  canonicalIdSchema,
  isoDateTimeSchema,
  recordVersionSchema,
} from "../src/validation/common.js";

const subjectId = canonicalIdSchema.parse("E-EARTH");
const objectId = canonicalIdSchema.parse("E-SUN");
const intermediateId = canonicalIdSchema.parse("E-MARS");
const version = recordVersionSchema.parse(1);

const context: OperationContext = {
  operationId: "operation-predicate-test",
  correlationId: "correlation-predicate-test",
};

const relationship: Relationship = {
  id: canonicalIdSchema.parse("R-001"),
  subjectId,
  predicate: "ORBITS",
  objectId,
};

const subject: Entity = {
  id: subjectId,
  name: "Earth",
  domain: "astronomy",
  type: "planet",
};

const object: Entity = {
  id: objectId,
  name: "Sun",
  domain: "astronomy",
  type: "star",
};

function definitionVersion(options: {
  status?: PredicateStatus;
  allowedSubjectTypes?: readonly string[];
  allowedObjectTypes?: readonly string[];
  acyclic?: boolean;
  predicate?: string;
} = {}): PredicateDefinitionVersion {
  return {
    predicate: options.predicate ?? "ORBITS",
    version,
    definition: {
      predicate: options.predicate ?? "ORBITS",
      status: options.status ?? "ACTIVE",
      constraints: {
        ...(options.allowedSubjectTypes === undefined
          ? {}
          : { allowedSubjectTypes: options.allowedSubjectTypes }),
        ...(options.allowedObjectTypes === undefined
          ? {}
          : { allowedObjectTypes: options.allowedObjectTypes }),
        ...(options.acyclic === undefined ? {} : { acyclic: options.acyclic }),
      },
    },
    validFrom: isoDateTimeSchema.parse("2026-01-01T00:00:00Z"),
    recordedFrom: isoDateTimeSchema.parse("2026-01-01T00:00:00Z"),
  };
}

function edge(
  id: string,
  from: CanonicalId,
  to: CanonicalId,
  predicate = "ORBITS",
): Relationship {
  return {
    id: canonicalIdSchema.parse(id),
    subjectId: from,
    predicate,
    objectId: to,
  };
}

function createValidator(options: {
  definition?: PredicateDefinitionVersion | null;
  subject?: Entity;
  object?: Entity;
  graph?: readonly Relationship[];
  graphError?: unknown;
  unfilteredGraph?: boolean;
} = {}) {
  const calls = {
    predicate: 0,
    subject: 0,
    object: 0,
    graphSubjects: [] as CanonicalId[],
    graphPredicates: [] as string[],
    graphContexts: [] as OperationContext[],
  };

  const predicates: PredicateRegistry = {
    async getActive(predicate, receivedContext) {
      calls.predicate += 1;
      assert.equal(predicate, "ORBITS");
      assert.strictEqual(receivedContext, context);
      return options.definition === undefined
        ? definitionVersion()
        : options.definition;
    },
    async getAt() {
      throw new Error("Not used by write-validator tests");
    },
    async getHistory() {
      throw new Error("Not used by write-validator tests");
    },
  };

  const entities: EntityReferenceResolver = {
    async resolveForWrite(id, receivedContext) {
      assert.strictEqual(receivedContext, context);

      if (id === subjectId) {
        calls.subject += 1;
        return options.subject ?? subject;
      }

      if (id === objectId) {
        calls.object += 1;
        return options.object ?? object;
      }

      throw new Error("Unexpected entity reference");
    },
    async resolveForHistory() {
      throw new Error("Not used by write-validator tests");
    },
  };

  const graph: RelationshipGraphReader = {
    async getOutgoingBySubject(id, predicate, receivedContext) {
      calls.graphSubjects.push(id);
      calls.graphPredicates.push(predicate);
      calls.graphContexts.push(receivedContext);

      if ("graphError" in options) {
        throw options.graphError;
      }

      const results = options.graph ?? [];

        return options.unfilteredGraph
          ? results
          : results.filter(
              (item) => item.subjectId === id && item.predicate === predicate,
            );
    },
  };

  return {
    validator: new DefaultRelationshipWriteValidator(
      predicates,
      entities,
      graph,
    ),
    calls,
  };
}

function hasErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

test("accepts a valid relationship and returns the exact predicate version", async () => {
  const expectedVersion = definitionVersion({
    allowedSubjectTypes: ["planet"],
    allowedObjectTypes: ["star"],
  });
  const { validator, calls } = createValidator({
    definition: expectedVersion,
  });

  const result = await validator.validateForCreate(relationship, context);

  assert.strictEqual(result, expectedVersion);
  assert.equal(calls.predicate, 1);
  assert.equal(calls.subject, 1);
  assert.equal(calls.object, 1);
  assert.equal(calls.graphSubjects.length, 0);
});

test("rejects an unknown predicate with VALIDATION_FAILED", async () => {
  const { validator } = createValidator({ definition: null });

  await assert.rejects(
    validator.validateForCreate(relationship, context),
    (error: unknown) => hasErrorCode(error, "VALIDATION_FAILED"),
  );
});

test("rejects a retired predicate for a new relationship", async () => {
  const { validator } = createValidator({
    definition: definitionVersion({ status: "RETIRED" }),
  });

  await assert.rejects(
    validator.validateForCreate(relationship, context),
    (error: unknown) => hasErrorCode(error, "VALIDATION_FAILED"),
  );
});

test("rejects an inconsistent predicate registry identity", async () => {
  const { validator } = createValidator({
    definition: definitionVersion({ predicate: "ROTATES" }),
  });

  await assert.rejects(
    validator.validateForCreate(relationship, context),
    (error: unknown) => hasErrorCode(error, "INTEGRITY_VIOLATION"),
  );
});

test("rejects a subject type outside the predicate constraint", async () => {
  const { validator } = createValidator({
    definition: definitionVersion({
      allowedSubjectTypes: ["moon"],
    }),
  });

  await assert.rejects(
    validator.validateForCreate(relationship, context),
    (error: unknown) => hasErrorCode(error, "INTEGRITY_VIOLATION"),
  );
});

test("rejects an object type outside the predicate constraint", async () => {
  const { validator } = createValidator({
    definition: definitionVersion({
      allowedObjectTypes: ["planet"],
    }),
  });

  await assert.rejects(
    validator.validateForCreate(relationship, context),
    (error: unknown) => hasErrorCode(error, "INTEGRITY_VIOLATION"),
  );
});

test("treats omitted entity type restrictions as unrestricted", async () => {
  const { validator } = createValidator();

  await assert.doesNotReject(
    validator.validateForCreate(relationship, context),
  );
});

test("rejects a resolved subject whose identity differs from the reference", async () => {
  const { validator } = createValidator({
    subject: { ...subject, id: intermediateId },
  });

  await assert.rejects(
    validator.validateForCreate(relationship, context),
    (error: unknown) => hasErrorCode(error, "INTEGRITY_VIOLATION"),
  );
});

test("rejects a resolved object whose identity differs from the reference", async () => {
  const { validator } = createValidator({
    object: { ...object, id: intermediateId },
  });

  await assert.rejects(
    validator.validateForCreate(relationship, context),
    (error: unknown) => hasErrorCode(error, "INTEGRITY_VIOLATION"),
  );
});

test("rejects a self-loop when the predicate is acyclic", async () => {
  const selfLoop = {
    ...relationship,
    objectId: subjectId,
  };
  const { validator, calls } = createValidator({
    definition: definitionVersion({ acyclic: true }),
  });

  await assert.rejects(
    validator.validateForCreate(selfLoop, context),
    (error: unknown) => hasErrorCode(error, "INTEGRITY_VIOLATION"),
  );

  assert.equal(calls.graphSubjects.length, 0);
});

test("rejects a cycle formed by a direct reverse edge", async () => {
  const { validator } = createValidator({
    definition: definitionVersion({ acyclic: true }),
    graph: [edge("R-EXISTING", objectId, subjectId)],
  });

  await assert.rejects(
    validator.validateForCreate(relationship, context),
    (error: unknown) => hasErrorCode(error, "INTEGRITY_VIOLATION"),
  );
});

test("rejects a cycle formed by a multi-edge directed path", async () => {
  const { validator } = createValidator({
    definition: definitionVersion({ acyclic: true }),
    graph: [
      edge("R-1", objectId, intermediateId),
      edge("R-2", intermediateId, subjectId),
    ],
  });

  await assert.rejects(
    validator.validateForCreate(relationship, context),
    (error: unknown) => hasErrorCode(error, "INTEGRITY_VIOLATION"),
  );
});

test("does not treat reverse-direction reachability as a cycle", async () => {
  const { validator } = createValidator({
    definition: definitionVersion({ acyclic: true }),
    graph: [edge("R-1", subjectId, intermediateId)],
  });

  await assert.doesNotReject(
    validator.validateForCreate(relationship, context),
  );
});

test("ignores edges belonging to other predicates", async () => {
  const { validator } = createValidator({
    definition: definitionVersion({ acyclic: true }),
    graph: [
      edge("R-OTHER", objectId, subjectId, "ROTATES"),
    ],
  });

  await assert.doesNotReject(
    validator.validateForCreate(relationship, context),
  );
});

test("does not run graph traversal when acyclic is omitted or false", async () => {
  for (const acyclic of [undefined, false]) {
    const { validator, calls } = createValidator({
      definition: definitionVersion(acyclic === undefined ? {} : { acyclic }),
    });

    await validator.validateForCreate(relationship, context);

    assert.equal(calls.graphSubjects.length, 0);
  }
});

test("passes the same operation context to graph reads", async () => {
  const { validator, calls } = createValidator({
    definition: definitionVersion({ acyclic: true }),
    graph: [edge("R-1", objectId, intermediateId)],
  });

  await validator.validateForCreate(relationship, context);

  assert.ok(calls.graphContexts.length > 0);
  assert.ok(calls.graphContexts.every((received) => received === context));
  assert.ok(calls.graphPredicates.every((predicate) => predicate === "ORBITS"));
});

test("rejects graph-reader results outside the requested subject and predicate", async () => {
  const malformedGraph: Relationship[] = [
    edge("R-MISMATCH", intermediateId, subjectId),
  ];

  const { validator } = createValidator({
    definition: definitionVersion({ acyclic: true }),
    graph: malformedGraph,
    unfilteredGraph: true,
  });

  await assert.rejects(
    validator.validateForCreate(relationship, context),
    (error: unknown) => hasErrorCode(error, "INTEGRITY_VIOLATION"),
  );
});

test("preserves graph-reader failures", async () => {
  const failure = new Error("Graph storage unavailable");
  const { validator } = createValidator({
    definition: definitionVersion({ acyclic: true }),
    graphError: failure,
  });

  await assert.rejects(
    validator.validateForCreate(relationship, context),
    (error: unknown) => error === failure,
  );
});

test("preserves entity-reference resolver failures", async () => {
  const failure = new Error("Entity storage unavailable");
  const entities: EntityReferenceResolver = {
    async resolveForWrite() {
      throw failure;
    },
    async resolveForHistory() {
      throw new Error("Not used");
    },
  };

  const base = createValidator();
  const validator = new DefaultRelationshipWriteValidator(
    {
      async getActive() {
        return definitionVersion();
      },
      async getAt() {
        return null;
      },
      async getHistory() {
        return { items: [] };
      },
    },
    entities,
    {
      async getOutgoingBySubject() {
        return [];
      },
    },
  );

  void base;

  await assert.rejects(
    validator.validateForCreate(relationship, context),
    (error: unknown) => error === failure,
  );
});

test("uses the expected branded version type in the predicate result", () => {
  const receivedVersion: RecordVersion = version;
  assert.equal(receivedVersion, 1);
});
