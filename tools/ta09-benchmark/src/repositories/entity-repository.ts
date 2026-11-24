/**
 * Provider-neutral repository contract for canonical entities.
 *
 * This interface defines logical persistence operations only. It does not
 * prescribe a database schema, provider API, or lifecycle state machine.
 *
 * Lifecycle transitions are intentionally deferred until their semantics
 * are explicitly defined.
 */

import type { Entity } from "../domain/entity.js";

import type {
  CanonicalId,
  ISODateTime,
  OperationContext,
  PageRequest,
  PageResult,
  RecordVersion,
  TemporalQuery,
  VersionedRecord,
} from "../domain/primitives.js";

/**
 * Temporal lookup for an entity snapshot.
 *
 * recordedAt is required because historical entity retrieval must be
 * anchored to the time at which the system recorded the entity state.
 * validAt is optional and represents the independent valid-time dimension.
 */
export type EntityTemporalQuery = TemporalQuery & {
  readonly recordedAt: ISODateTime;
};

/** Input for an optimistic, version-checked entity update. */
export interface UpdateEntityInput {
  /** Complete entity representation to persist. */
  readonly entity: Entity;

  /** Version the caller expects to replace. */
  readonly expectedVersion: RecordVersion;
}

/**
 * Repository operations for canonical entity records.
 *
 * Implementations must preserve the provider-neutral semantics documented
 * here and report persistence failures using the common PersistenceError
 * contract.
 */
export interface EntityRepository {
  /**
   * Retrieve the current entity by canonical ID.
   *
   * Returns null when no current entity exists for the supplied ID.
   */
  getById(
    id: CanonicalId,
    context: OperationContext,
  ): Promise<VersionedRecord<Entity> | null>;

  /**
   * Retrieve the entity state recorded at the requested point in time.
   *
   * The valid-time and recorded-time dimensions must remain independent.
   * Returns null when no entity state matches the temporal query.
   */
  getAt(
    id: CanonicalId,
    query: EntityTemporalQuery,
    context: OperationContext,
  ): Promise<VersionedRecord<Entity> | null>;

  /**
   * Retrieve persisted versions of an entity using cursor pagination.
   *
   * Results must be ordered by version descending (newest version first).
   *
   * Cursors must be opaque and scoped to this entity-history query and its
   * ordering. Pagination must remain stable within the same history snapshot;
   * a cursor must not silently continue against a different snapshot.
   */
  getHistory(
    id: CanonicalId,
    page: PageRequest,
    context: OperationContext,
  ): Promise<PageResult<VersionedRecord<Entity>>>;

  /**
   * Create a canonical entity.
   *
   * A duplicate canonical ID must be reported as ALREADY_EXISTS.
   */
  create(
    entity: Entity,
    context: OperationContext,
  ): Promise<VersionedRecord<Entity>>;

  /**
   * Update an entity only if its current version matches expectedVersion.
   *
   * A stale expected version must be reported as VERSION_CONFLICT.
   * Concurrent updates must not silently overwrite one another.
   */
  update(
    input: UpdateEntityInput,
    context: OperationContext,
  ): Promise<VersionedRecord<Entity>>;
}
