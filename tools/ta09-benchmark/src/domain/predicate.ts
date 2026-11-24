/**
 * Provider-neutral predicate registry domain contracts for TA-09.
 *
 * Predicate definitions describe the semantics and constraints of
 * directed relationships. Their version history is represented
 * separately from the minimal logical Relationship model.
 */

import type {
  ISODateTime,
  RecordVersion,
  TemporalQuery,
} from "./primitives.js";

/** Lifecycle status of a predicate definition. */
export type PredicateStatus = "ACTIVE" | "RETIRED";

/**
 * Constraints governing which relationships may use a predicate.
 *
 * Missing entity-type restrictions mean unrestricted.
 * Acyclicity, when enabled, applies only to directed edges using
 * this predicate. Self-loops are cycles.
 */
export interface PredicateConstraints {
  /** Permitted subject Entity.type values. */
  readonly allowedSubjectTypes?: readonly string[];

  /** Permitted object Entity.type values. */
  readonly allowedObjectTypes?: readonly string[];

  /** Whether directed relationships using this predicate must be acyclic. */
  readonly acyclic?: boolean;
}

/** Logical predicate definition. */
export interface PredicateDefinition {
  /** Extensible predicate identifier; not restricted to a fixed vocabulary. */
  readonly predicate: string;

  /** Constraints applied when creating relationships using this predicate. */
  readonly constraints: PredicateConstraints;

  /** Retired predicates cannot be used for new relationships. */
  readonly status: PredicateStatus;
}

/**
 * Immutable, versioned predicate definition with bitemporal metadata.
 *
 * Both valid-time and recorded-time intervals are half-open:
 * [from, to).
 *
 * An omitted ending timestamp represents an open-ended interval.
 */
export interface PredicateDefinitionVersion {
  /** Predicate identifier associated with this version. */
  readonly predicate: string;

  /** Monotonically increasing version for this predicate. */
  readonly version: RecordVersion;

  /** Complete definition captured by this immutable version. */
  readonly definition: PredicateDefinition;

  /** Beginning of the interval during which this definition is valid. */
  readonly validFrom: ISODateTime;

  /** Exclusive end of the valid-time interval. */
  readonly validTo?: ISODateTime;

  /** Beginning of the interval during which this version was recorded. */
  readonly recordedFrom: ISODateTime;

  /** Exclusive end of the recorded-time interval. */
  readonly recordedTo?: ISODateTime;
}

/**
 * Bitemporal lookup for a predicate definition.
 *
 * recordedAt is mandatory so historical knowledge is always explicit.
 * validAt is optional and defaults to the current valid-time view.
 */
export type PredicateTemporalQuery = TemporalQuery & {
  readonly recordedAt: ISODateTime;
};
