/**
 * Provider-neutral canonical entity contract for TA-09.
 *
 * This contract reflects the approved logical seed representation:
 * canonical ID, name, scientific domain, and entity type.
 *
 * Domain and type remain extensible strings. This contract does not
 * introduce unapproved physical fields or freeze proposed vocabularies.
 */

import type { CanonicalId } from "./primitives.js";

/** Minimal approved canonical entity representation. */
export interface Entity {
  readonly id: CanonicalId;
  readonly name: string;
  readonly domain: string;
  readonly type: string;
}