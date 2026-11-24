/**
 * Provider-neutral canonical relationship contract for TA-09.
 *
 * A relationship is a directed, typed connection between two canonical
 * entities. Subject and object preserve the direction of the relationship.
 *
 * Predicate values remain extensible strings and are resolved through the
 * versioned predicate registry.
 *
 * Temporal validity and relationship history are intentionally handled
 * separately from this minimal logical representation.
 */

import type { CanonicalId } from "./primitives.js";

/**
 * Minimal canonical relationship representation.
 *
 * Example:
 * {
 *   id: "R-001",
 *   subjectId: "E-EARTH",
 *   predicate: "ORBITS",
 *   objectId: "E-SUN"
 * }
 */
export interface Relationship {
  /** Stable identity of this relationship record. */
  readonly id: CanonicalId;

  /** Canonical ID of the subject entity. */
  readonly subjectId: CanonicalId;

  /** Extensible relationship predicate. */
  readonly predicate: string;

  /** Canonical ID of the object entity. */
  readonly objectId: CanonicalId;
}
