import type { PredicateDefinitionVersion } from "../domain/predicate.js";
import type { OperationContext } from "../domain/primitives.js";
import type { Relationship } from "../domain/relationship.js";

/**
 * Validates a proposed relationship against its active predicate
 * definition, canonical entity references, and graph constraints.
 */
export interface RelationshipWriteValidator {
  /**
   * Validates a new relationship and returns the exact predicate
   * definition version used for the decision.
   *
   * The caller must preserve this version when persisting the
   * relationship. Atomicity is provided by the B4 unit of work.
   */
  validateForCreate(
    relationship: Relationship,
    context: OperationContext,
  ): Promise<PredicateDefinitionVersion>;
}
