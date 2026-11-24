/**
 * Provider-neutral lifecycle contract for TA-09 canonical entities.
 *
 * Lifecycle is separate from the logical Entity representation.
 * Successor references are historical lineage metadata, not instructions
 * to replace or redirect canonical identity.
 */

import type { CanonicalId } from "./primitives.js";

/** Historical lineage information associated with an entity lifecycle. */
export interface EntityLineage {
  readonly successorIds: readonly CanonicalId[];
}

/**
 * Lifecycle state of a canonical entity.
 */
export type EntityLifecycle =
  | {
      readonly entityId: CanonicalId;
      readonly state: "ACTIVE";
    }
  | {
      readonly entityId: CanonicalId;
      readonly state: "RETIRED";
    }
  | {
      readonly entityId: CanonicalId;
      readonly state: "MERGED_SOURCE";
      readonly lineage: EntityLineage;
    }
  | {
      readonly entityId: CanonicalId;
      readonly state: "SPLIT_SOURCE";
      readonly lineage: EntityLineage;
    };
