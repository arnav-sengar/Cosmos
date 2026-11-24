/**
 * Provider-neutral primitives shared by the TA-09 persistence contract.
 *
 * These types define semantics only. Runtime validation belongs in the
 * validation module, not in domain contracts.
 */

declare const canonicalIdBrand: unique symbol;
declare const recordVersionBrand: unique symbol;
declare const isoDateTimeBrand: unique symbol;

/** Stable identifier for a canonical knowledge record. */
export type CanonicalId = string & {
  readonly [canonicalIdBrand]: "CanonicalId";
};

/** Monotonically increasing version for a versioned record. */
export type RecordVersion = number & {
  readonly [recordVersionBrand]: "RecordVersion";
};

/** Validated ISO 8601 date-time string in UTC. */
export type ISODateTime = string & {
  readonly [isoDateTimeBrand]: "ISODateTime";
};

/** Cursor-based pagination request. */
export interface PageRequest {
  readonly limit: number;
  readonly cursor?: string;
}

/** Cursor-based pagination result. */
export interface PageResult<T> {
  readonly items: readonly T[];
  readonly nextCursor?: string;
}

/**
 * Bitemporal query constraints.
 * validAt and recordedAt are independent dimensions.
 */
export interface TemporalQuery {
  readonly validAt?: ISODateTime;
  readonly recordedAt?: ISODateTime;
}

/** A record with an explicit persistence version. */
export interface VersionedRecord<T> {
  readonly id: CanonicalId;
  readonly version: RecordVersion;
  readonly value: T;
}

/** Identifiers that correlate one persistence operation across system layers. */
export interface OperationContext {
  readonly operationId: string;
  readonly correlationId: string;
}
