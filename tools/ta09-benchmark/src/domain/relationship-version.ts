/**
 * Immutable bitemporal relationship-version contracts.
 *
 * The logical Relationship remains the minimal four-field record.
 * All temporal and provenance metadata belongs here.
 */

import type {
  CanonicalId,
  ISODateTime,
  RecordVersion,
  TemporalQuery,
} from "./primitives.js";
import type { Relationship } from "./relationship.js";

/**
 * One immutable segment of a logical relationship.
 *
 * Both temporal intervals are half-open:
 * valid time:    [validFrom, validTo)
 * recorded time: [recordedFrom, recordedTo)
 *
 * An omitted end means the interval is open-ended.
 */
export interface RelationshipVersion {
  readonly relationship: Relationship;
  readonly version: RecordVersion;

  readonly validFrom: ISODateTime;
  readonly validTo?: ISODateTime;

  readonly recordedFrom: ISODateTime;
  readonly recordedTo?: ISODateTime;

  /** Exact predicate-definition version used when this segment was written. */
  readonly predicateDefinitionVersion: RecordVersion;

  readonly correctionReason: string;
  readonly provenanceRef: string;
  readonly createdAt: ISODateTime;
  readonly createdBy: string;
}

/** A relationship lookup at a specific recorded-time snapshot. */
export type RelationshipTemporalQuery = TemporalQuery & {
  readonly recordedAt: ISODateTime;
};

/**
 * A correction applies to one valid-time interval.
 *
 * replacement=null means the relationship is no longer considered valid
 * during that interval. A non-null replacement must retain relationshipId.
 *
 * predicateDefinitionVersion is required when replacement is non-null.
 */
export interface RelationshipCorrection {
  readonly relationshipId: CanonicalId;
  readonly replacement: Relationship | null;

  readonly validFrom: ISODateTime;
  readonly validTo?: ISODateTime;

  /** One captured timestamp shared by every record created by this correction. */
  readonly recordedAt: ISODateTime;

  readonly predicateDefinitionVersion?: RecordVersion;

  readonly correctionReason: string;
  readonly provenanceRef: string;
  readonly createdBy: string;
}

/**
 * Persistence instructions produced by the pure correction planner.
 *
 * closeVersions replace the corresponding currently-open records with
 * copies whose recordedTo equals the correction timestamp.
 * createVersions are new immutable segments.
 *
 * Applying these changes atomically is B4's responsibility.
 */
export interface RelationshipCorrectionPlan {
  readonly closeVersions: readonly RelationshipVersion[];
  readonly createVersions: readonly RelationshipVersion[];
}
