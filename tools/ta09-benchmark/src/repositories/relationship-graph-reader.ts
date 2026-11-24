import type { CanonicalId, OperationContext } from "../domain/primitives.js";
import type { Relationship } from "../domain/relationship.js";

/**
 * Read contract for directed relationship edges used by graph validation.
 *
 * Each call must return every outgoing edge for the supplied subject and
 * predicate within the caller's operation snapshot. B4 is responsible for
 * coordinating a consistent snapshot across repeated calls.
 */
export interface RelationshipGraphReader {
  /**
   * Retrieves all outgoing relationships for one subject and predicate.
   *
   * Results must not be truncated or silently paginated.
   */
  getOutgoingBySubject(
    subjectId: CanonicalId,
    predicate: string,
    context: OperationContext,
  ): Promise<readonly Relationship[]>;
}
