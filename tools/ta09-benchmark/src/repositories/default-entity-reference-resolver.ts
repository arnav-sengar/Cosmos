import type { Entity } from "../domain/entity.js";
import type {
  CanonicalId,
  OperationContext,
} from "../domain/primitives.js";
import { createPersistenceError } from "../validation/persistence-error.js";
import type { EntityLifecycleReader, EntityLifecycleTemporalQuery } from "./entity-lifecycle-reader.js";
import type { EntityRepository } from "./entity-repository.js";
import type { EntityReferenceResolver } from "./entity-reference-resolver.js";

/**
 * Default read-only implementation of canonical entity reference resolution.
 *
 * This class validates entity identity and lifecycle eligibility. It does
 * not perform lifecycle transitions, redirect resolution, or persistence
 * mutations.
 *
 * Atomic consistency with concurrent lifecycle changes is provided by the
 * calling unit of work, not by this resolver.
 */
export class DefaultEntityReferenceResolver
  implements EntityReferenceResolver
{
  constructor(
    private readonly entities: EntityRepository,
    private readonly lifecycles: EntityLifecycleReader,
  ) {}

  async resolveForWrite(
    entityId: CanonicalId,
    context: OperationContext,
  ): Promise<Entity> {
    const [entityRecord, lifecycleRecord] = await Promise.all([
      this.entities.getById(entityId, context),
      this.lifecycles.getById(entityId, context),
    ]);

    if (entityRecord === null || lifecycleRecord === null) {
      throw createPersistenceError({
        code: "REFERENCE_INVALID",
        message: "Entity reference does not identify an active canonical entity.",
        retryable: false,
        operationId: context.operationId,
        correlationId: context.correlationId,
        details: { entityId },
      });
    }

    const identityIsConsistent =
      entityRecord.id === entityId &&
      entityRecord.value.id === entityId &&
      lifecycleRecord.id === entityId &&
      lifecycleRecord.value.entityId === entityId;

    if (!identityIsConsistent) {
      throw createPersistenceError({
        code: "INTEGRITY_VIOLATION",
        message: "Entity or lifecycle record identity is inconsistent.",
        retryable: false,
        operationId: context.operationId,
        correlationId: context.correlationId,
        details: { entityId },
      });
    }

    if (lifecycleRecord.value.state !== "ACTIVE") {
      throw createPersistenceError({
        code: "REFERENCE_INVALID",
        message: "Entity reference does not identify an active canonical entity.",
        retryable: false,
        operationId: context.operationId,
        correlationId: context.correlationId,
        details: {
          entityId,
          lifecycleState: lifecycleRecord.value.state,
        },
      });
    }

    return entityRecord.value;
  }

  async resolveForHistory(
    entityId: CanonicalId,
    query: EntityLifecycleTemporalQuery,
    context: OperationContext,
  ): Promise<Entity> {
    const [entityRecord, lifecycleRecord] = await Promise.all([
      this.entities.getAt(entityId, query, context),
      this.lifecycles.getAt(entityId, query, context),
    ]);

    if (entityRecord === null || lifecycleRecord === null) {
      throw createPersistenceError({
        code: "INTEGRITY_VIOLATION",
        message: "Historical entity or lifecycle record is missing at the requested snapshot.",
        retryable: false,
        operationId: context.operationId,
        correlationId: context.correlationId,
        details: { entityId },
      });
    }

    const identityIsConsistent =
      entityRecord.id === entityId &&
      entityRecord.value.id === entityId &&
      lifecycleRecord.id === entityId &&
      lifecycleRecord.value.entityId === entityId;

    if (!identityIsConsistent) {
      throw createPersistenceError({
        code: "INTEGRITY_VIOLATION",
        message: "Historical entity or lifecycle record identity is inconsistent.",
        retryable: false,
        operationId: context.operationId,
        correlationId: context.correlationId,
        details: { entityId },
      });
    }

    // Historical identity is preserved regardless of current lifecycle state.
    // Successor IDs and redirects are never followed.
    return entityRecord.value;
  }
}
