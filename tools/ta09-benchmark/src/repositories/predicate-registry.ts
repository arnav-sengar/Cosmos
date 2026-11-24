import type {
  PredicateDefinitionVersion,
  PredicateTemporalQuery,
} from "../domain/predicate.js";

import type {
  OperationContext,
  PageRequest,
  PageResult,
} from "../domain/primitives.js";

/**
 * Read-only, provider-neutral access to immutable predicate definitions.
 *
 * Mutations and atomic coordination are intentionally owned by the
 * unit-of-work boundary introduced in B4.
 */
export interface PredicateRegistry {
  /**
   * Retrieves the definition active at the current valid-time and
   * current recorded-time view.
   *
   * Returns null when no active definition exists.
   */
  getActive(
    predicate: string,
    context: OperationContext,
  ): Promise<PredicateDefinitionVersion | null>;

  /**
   * Retrieves the definition visible at an explicit bitemporal point.
   *
   * recordedAt is mandatory. validAt defaults to the current
   * valid-time view when omitted.
   */
  getAt(
    predicate: string,
    query: PredicateTemporalQuery,
    context: OperationContext,
  ): Promise<PredicateDefinitionVersion | null>;

  /**
   * Retrieves predicate definition history ordered by recordedFrom
   * descending, then version descending.
   *
   * Cursors must be opaque and scoped to this predicate-history query and
   * its ordering. Pagination must remain stable within the same history
   * snapshot; a cursor must not silently continue against a different
   * snapshot.
   */
  getHistory(
    predicate: string,
    page: PageRequest,
    context: OperationContext,
  ): Promise<PageResult<PredicateDefinitionVersion>>;
}
