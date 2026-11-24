import type { EntityLifecycle } from "../domain/entity-lifecycle.js";

import type {
  CanonicalId,
  ISODateTime,
  OperationContext,
  TemporalQuery,
  VersionedRecord,
} from "../domain/primitives.js";

/**
 * Temporal query for resolving an entity lifecycle record.
 *
 * recordedAt is mandatory because lifecycle resolution must identify
 * what the system knew at a particular recorded-time snapshot.
 *
 * validAt is optional and defaults to the current valid-time view.
 */
export type EntityLifecycleTemporalQuery = TemporalQuery & {
  readonly recordedAt: ISODateTime;
};

/**
 * Provider-neutral read contract for canonical entity lifecycle state.
 *
 * This interface does not perform lifecycle transitions, redirect
 * resolution, or persistence mutations.
 */
export interface EntityLifecycleReader {
  /**
   * Retrieves the latest/current lifecycle record for an entity.
   *
   * Returns null when no lifecycle record exists.
   */
  getById(
    entityId: CanonicalId,
    context: OperationContext,
  ): Promise<VersionedRecord<EntityLifecycle> | null>;

  /**
   * Retrieves the lifecycle record visible at the requested
   * bitemporal snapshot.
   *
   * Returns null when no lifecycle record exists at that snapshot.
   */
  getAt(
    entityId: CanonicalId,
    query: EntityLifecycleTemporalQuery,
    context: OperationContext,
  ): Promise<VersionedRecord<EntityLifecycle> | null>;
}
