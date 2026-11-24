import type { Entity } from "../domain/entity.js";

import type {
  CanonicalId,
  OperationContext,
} from "../domain/primitives.js";

import type { EntityLifecycleTemporalQuery } from "./entity-lifecycle-reader.js";

/**
 * Resolves canonical entity references for relationship operations.
 *
 * This contract separates write-time eligibility from historical
 * identity resolution.
 *
 * Implementations must not follow redirects or substitute successor IDs.
 */
export interface EntityReferenceResolver {
  /**
   * Resolves an entity for a new relationship write.
   *
   * Requirements:
   * - The canonical entity must exist.
   * - Its lifecycle record must exist.
   * - Its lifecycle state must be ACTIVE.
   *
   * Missing entities, missing lifecycle records, retired entities,
   * merged sources, split sources, and redirected legacy IDs must
   * reject with REFERENCE_INVALID.
   */
  resolveForWrite(
    entityId: CanonicalId,
    context: OperationContext,
  ): Promise<Entity>;

  /**
   * Resolves the original canonical entity referenced by a historical
   * relationship at the supplied bitemporal snapshot.
   *
   * Requirements:
   * - Entity and lifecycle records must both exist at the same snapshot.
   * - Current ACTIVE status is not required.
   * - Original canonical identity must be preserved.
   * - Successor substitution and redirect following are forbidden.
   *
   * Missing or inconsistent historical records must reject with
   * INTEGRITY_VIOLATION.
   */
  resolveForHistory(
    entityId: CanonicalId,
    query: EntityLifecycleTemporalQuery,
    context: OperationContext,
  ): Promise<Entity>;
}
