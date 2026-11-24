import assert from "node:assert/strict";
import test from "node:test";

import type { Entity } from "../src/domain/entity.js";
import type { EntityLifecycle } from "../src/domain/entity-lifecycle.js";
import type {
  OperationContext,
  VersionedRecord,
} from "../src/domain/primitives.js";
import type { EntityLifecycleReader } from "../src/repositories/entity-lifecycle-reader.js";
import type { EntityRepository } from "../src/repositories/entity-repository.js";
import { DefaultEntityReferenceResolver } from "../src/repositories/default-entity-reference-resolver.js";
import {
  canonicalIdSchema,
  isoDateTimeSchema,
  recordVersionSchema,
} from "../src/validation/common.js";

const entityId = canonicalIdSchema.parse("E-EARTH");
const otherEntityId = canonicalIdSchema.parse("E-MARS");
const version = recordVersionSchema.parse(1);
const recordedAt = isoDateTimeSchema.parse("2026-11-22T12:00:00Z");
const validAt = isoDateTimeSchema.parse("2026-11-20T12:00:00Z");

const context: OperationContext = {
  operationId: "operation-resolver-test",
  correlationId: "correlation-resolver-test",
};

const temporalQuery = {
  validAt,
  recordedAt,
};

const entity: Entity = {
  id: entityId,
  name: "Earth",
  domain: "astronomy",
  type: "planet",
};

function entityRecord(
  value: Entity = entity,
  id = entityId,
): VersionedRecord<Entity> {
  return { id, version, value };
}

function lifecycleRecord(
  value: EntityLifecycle = {
    entityId,
    state: "ACTIVE",
  },
  id = entityId,
): VersionedRecord<EntityLifecycle> {
  return { id, version, value };
}

function createResolver(options: {
  entityCurrent?: VersionedRecord<Entity> | null;
  lifecycleCurrent?: VersionedRecord<EntityLifecycle> | null;
  entityHistorical?: VersionedRecord<Entity> | null;
  lifecycleHistorical?: VersionedRecord<EntityLifecycle> | null;
  entityCurrentError?: unknown;
  lifecycleCurrentError?: unknown;
  entityHistoricalError?: unknown;
  lifecycleHistoricalError?: unknown;
} = {}) {
  const calls = {
    entityCurrent: 0,
    lifecycleCurrent: 0,
    entityHistorical: 0,
    lifecycleHistorical: 0,
    historicalQuery: undefined as unknown,
    historicalContext: undefined as unknown,
  };

  const entities: EntityRepository = {
    async getById() {
      calls.entityCurrent += 1;
      if ("entityCurrentError" in options) {
        throw options.entityCurrentError;
      }
      return options.entityCurrent === undefined
        ? entityRecord()
        : options.entityCurrent;
    },
    async getAt(_id, query, receivedContext) {
      calls.entityHistorical += 1;
      calls.historicalQuery = query;
      calls.historicalContext = receivedContext;
      if ("entityHistoricalError" in options) {
        throw options.entityHistoricalError;
      }
      return options.entityHistorical === undefined
        ? entityRecord()
        : options.entityHistorical;
    },
    async getHistory() {
      return { items: [] };
    },
    async create() {
      throw new Error("Not used by resolver tests");
    },
    async update() {
      throw new Error("Not used by resolver tests");
    },
  };

  const lifecycles: EntityLifecycleReader = {
    async getById() {
      calls.lifecycleCurrent += 1;
      if ("lifecycleCurrentError" in options) {
        throw options.lifecycleCurrentError;
      }
      return options.lifecycleCurrent === undefined
        ? lifecycleRecord()
        : options.lifecycleCurrent;
    },
    async getAt(_id, query, receivedContext) {
      calls.lifecycleHistorical += 1;
      assert.strictEqual(query, temporalQuery);
      assert.strictEqual(receivedContext, context);
      if ("lifecycleHistoricalError" in options) {
        throw options.lifecycleHistoricalError;
      }
      return options.lifecycleHistorical === undefined
        ? lifecycleRecord()
        : options.lifecycleHistorical;
    },
  };

  return {
    resolver: new DefaultEntityReferenceResolver(entities, lifecycles),
    calls,
  };
}

function assertPersistenceError(
  error: unknown,
  expectedCode: string,
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === expectedCode
  );
}

test("resolves an ACTIVE canonical entity for a write", async () => {
  const { resolver, calls } = createResolver();

  const result = await resolver.resolveForWrite(entityId, context);

  assert.deepEqual(result, entity);
  assert.equal(calls.entityCurrent, 1);
  assert.equal(calls.lifecycleCurrent, 1);
});

test("rejects a missing entity for a write", async () => {
  const { resolver } = createResolver({ entityCurrent: null });

  await assert.rejects(
    resolver.resolveForWrite(entityId, context),
    (error: unknown) => assertPersistenceError(error, "REFERENCE_INVALID"),
  );
});

test("rejects a missing lifecycle record for a write", async () => {
  const { resolver } = createResolver({ lifecycleCurrent: null });

  await assert.rejects(
    resolver.resolveForWrite(entityId, context),
    (error: unknown) => assertPersistenceError(error, "REFERENCE_INVALID"),
  );
});

test("rejects every non-ACTIVE lifecycle state for a write", async () => {
  const inactiveStates: EntityLifecycle[] = [
    { entityId, state: "RETIRED" },
    {
      entityId,
      state: "MERGED_SOURCE",
      lineage: { successorIds: [otherEntityId] },
    },
    {
      entityId,
      state: "SPLIT_SOURCE",
      lineage: { successorIds: [otherEntityId, canonicalIdSchema.parse("E-VENUS")] },
    },
  ];

  for (const lifecycle of inactiveStates) {
    const { resolver } = createResolver({
      lifecycleCurrent: lifecycleRecord(lifecycle),
    });

    await assert.rejects(
      resolver.resolveForWrite(entityId, context),
      (error: unknown) => assertPersistenceError(error, "REFERENCE_INVALID"),
    );
  }
});

test("rejects inconsistent entity record identity for a write", async () => {
  const { resolver } = createResolver({
    entityCurrent: entityRecord(entity, otherEntityId),
  });

  await assert.rejects(
    resolver.resolveForWrite(entityId, context),
    (error: unknown) => assertPersistenceError(error, "INTEGRITY_VIOLATION"),
  );
});

test("rejects inconsistent lifecycle record identity for a write", async () => {
  const { resolver } = createResolver({
    lifecycleCurrent: lifecycleRecord(
      { entityId, state: "ACTIVE" },
      otherEntityId,
    ),
  });

  await assert.rejects(
    resolver.resolveForWrite(entityId, context),
    (error: unknown) => assertPersistenceError(error, "INTEGRITY_VIOLATION"),
  );
});

test("preserves repository failures during write resolution", async () => {
  const repositoryFailure = new Error("Repository unavailable");
  const { resolver } = createResolver({
    entityCurrentError: repositoryFailure,
  });

  await assert.rejects(
    resolver.resolveForWrite(entityId, context),
    (error: unknown) => error === repositoryFailure,
  );
});

test("resolves historical entity state when lifecycle is ACTIVE", async () => {
  const { resolver } = createResolver({
    lifecycleHistorical: lifecycleRecord({ entityId, state: "ACTIVE" }),
  });

  const result = await resolver.resolveForHistory(
    entityId,
    temporalQuery,
    context,
  );

  assert.deepEqual(result, entity);
});

test("preserves historical entity identity for every lifecycle state", async () => {
  const historicalStates: EntityLifecycle[] = [
    { entityId, state: "ACTIVE" },
    { entityId, state: "RETIRED" },
    {
      entityId,
      state: "MERGED_SOURCE",
      lineage: { successorIds: [otherEntityId] },
    },
    {
      entityId,
      state: "SPLIT_SOURCE",
      lineage: {
        successorIds: [otherEntityId, canonicalIdSchema.parse("E-VENUS")],
      },
    },
  ];

  for (const lifecycle of historicalStates) {
    const { resolver } = createResolver({
      lifecycleHistorical: lifecycleRecord(lifecycle),
    });

    const result = await resolver.resolveForHistory(
      entityId,
      temporalQuery,
      context,
    );

    assert.deepEqual(result, entity);
  }
});

test("reports a missing historical entity as an integrity violation", async () => {
  const { resolver } = createResolver({ entityHistorical: null });

  await assert.rejects(
    resolver.resolveForHistory(entityId, temporalQuery, context),
    (error: unknown) => assertPersistenceError(error, "INTEGRITY_VIOLATION"),
  );
});

test("reports a missing historical lifecycle as an integrity violation", async () => {
  const { resolver } = createResolver({ lifecycleHistorical: null });

  await assert.rejects(
    resolver.resolveForHistory(entityId, temporalQuery, context),
    (error: unknown) => assertPersistenceError(error, "INTEGRITY_VIOLATION"),
  );
});

test("reports inconsistent historical entity identity as an integrity violation", async () => {
  const { resolver } = createResolver({
    entityHistorical: entityRecord(entity, otherEntityId),
  });

  await assert.rejects(
    resolver.resolveForHistory(entityId, temporalQuery, context),
    (error: unknown) => assertPersistenceError(error, "INTEGRITY_VIOLATION"),
  );
});

test("reports inconsistent historical lifecycle identity as an integrity violation", async () => {
  const { resolver } = createResolver({
    lifecycleHistorical: lifecycleRecord(
      { entityId, state: "ACTIVE" },
      otherEntityId,
    ),
  });

  await assert.rejects(
    resolver.resolveForHistory(entityId, temporalQuery, context),
    (error: unknown) => assertPersistenceError(error, "INTEGRITY_VIOLATION"),
  );
});

test("passes the same temporal query and operation context to both historical readers", async () => {
  const { resolver, calls } = createResolver();

  await resolver.resolveForHistory(entityId, temporalQuery, context);

  assert.equal(calls.entityHistorical, 1);
  assert.equal(calls.lifecycleHistorical, 1);
  assert.strictEqual(calls.historicalQuery, temporalQuery);
  assert.strictEqual(calls.historicalContext, context);
});

test("preserves repository failures during historical resolution", async () => {
  const repositoryFailure = new Error("Historical storage unavailable");
  const { resolver } = createResolver({
    lifecycleHistoricalError: repositoryFailure,
  });

  await assert.rejects(
    resolver.resolveForHistory(entityId, temporalQuery, context),
    (error: unknown) => error === repositoryFailure,
  );
});
