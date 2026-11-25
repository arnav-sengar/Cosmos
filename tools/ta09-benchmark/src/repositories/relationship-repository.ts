/**
 * Provider-neutral repository contract for immutable bitemporal relationships.
 *
 * This contract defines persistence semantics without prescribing a database,
 * storage schema, provider API, or transaction implementation.
 *
 * Atomic validation, concurrency checks, and persistence are coordinated by
 * the injected Unit of Work introduced in B4.
 */

import type { Relationship } from "../domain/relationship.js";

import type {
  RelationshipCorrection,
  RelationshipTemporalQuery,
  RelationshipVersion,
} from "../domain/relationship-version.js";

import type {
  CanonicalId,
  ISODateTime,
  OperationContext,
  PageRequest,
  PageResult,
  RecordVersion,
} from "../domain/primitives.js";

/** Input for creating a new logical relationship. */
export interface CreateRelationshipInput {
  readonly relationship: Relationship;
  readonly validFrom: ISODateTime;
  readonly validTo?: ISODateTime;
  readonly recordedAt: ISODateTime;
  readonly correctionReason: string;
  readonly provenanceRef: string;
  readonly createdBy: string;
}

/**
 * Complete replacement of an existing logical relationship.
 *
 * expectedVersion refers to the highest persisted version number in the
 * relationship history observed by the caller. Implementations must check
 * it atomically with the correction.
 */
export type RelationshipUpdateCorrection = Omit<
  RelationshipCorrection,
  "predicateDefinitionVersion"
> & {
  readonly replacement: Relationship;
};

export interface UpdateRelationshipInput {
  readonly correction: RelationshipUpdateCorrection;
  readonly expectedVersion: RecordVersion;
}

/**
 * Retire a relationship from effectiveAt onward in valid time.
 *
 * Retirement is an immutable correction with replacement=null and an
 * open-ended valid-time interval. Existing historical records are retained.
 */
export interface RetireRelationshipInput {
  readonly relationshipId: CanonicalId;
  readonly effectiveAt: ISODateTime;
  readonly recordedAt: ISODateTime;
  readonly expectedVersion: RecordVersion;
  readonly correctionReason: string;
  readonly provenanceRef: string;
  readonly createdBy: string;
}

/** Persisted result of an immutable relationship correction. */
export interface RelationshipCorrectionResult {
  /** Superseded versions with recordedTo set to the correction timestamp. */
  readonly closedVersions: readonly RelationshipVersion[];

  /** Newly persisted replacement and/or preserved segments. */
  readonly createdVersions: readonly RelationshipVersion[];
}

/** Supported directions for graph traversal. */
export type RelationshipTraversalDirection =
  | "OUTGOING"
  | "INCOMING"
  | "BIDIRECTIONAL";

/**
 * Explicit global work limits for one complete relationship traversal.
 *
 * maxDepth is an inclusive edge-depth boundary. The other limits bound
 * visited entities, examined adjacency rows, and adjacency page requests.
 */
export interface RelationshipTraversalLimits {
  readonly maxDepth: number;
  readonly maxVisitedEntities: number;
  readonly maxExaminedRelationships: number;
  readonly maxAdjacencyPages: number;
}

/**
 * Bitemporal graph traversal request.
 *
 * When direction is omitted, OUTGOING is used.
 * When validAt is omitted, the implementation uses its captured operation
 * time as the valid-time reference. recordedAt is always explicit.
 */
export interface RelationshipTraversalQuery
  extends RelationshipTemporalQuery {
  readonly startEntityId: CanonicalId;
  readonly direction?: RelationshipTraversalDirection;
  readonly predicate?: string;
  readonly limits: RelationshipTraversalLimits;
}

/** One versioned edge encountered during graph traversal. */
export interface RelationshipTraversalItem {
  readonly relationship: RelationshipVersion;
  readonly depth: number;
  readonly traversedDirection: "OUTGOING" | "INCOMING";
}

/**
 * Repository operations for logical relationship records and their
 * immutable bitemporal versions.
 *
 * Read methods return versions eligible at the supplied temporal snapshot.
 * Implementations must provide stable cursor pagination and deterministic
 * ordering. Cursors must be opaque, query-bound, and snapshot-bound.
 *
 * All failures use the provider-neutral PersistenceError contract.
 */
export interface RelationshipRepository {
  /**
   * Create a new logical relationship and its first immutable version.
   *
   * The active predicate definition must be resolved during the write
   * operation. Its exact version must be recorded on the new relationship.
   * Duplicate logical IDs produce ALREADY_EXISTS.
   */
  create(
    input: CreateRelationshipInput,
    context: OperationContext,
  ): Promise<RelationshipVersion>;

  /**
   * Apply a complete replacement under the same logical relationship ID.
   *
   * The expected version must be checked atomically. Corrections may split
   * existing valid-time intervals into multiple immutable segments.
   * Stale versions produce VERSION_CONFLICT.
   */
  update(
    input: UpdateRelationshipInput,
    context: OperationContext,
  ): Promise<RelationshipCorrectionResult>;

  /**
   * Retire a relationship from the supplied valid-time instant onward.
   *
   * Retirement creates immutable temporal records; it never deletes history.
   * The expected version must be checked atomically.
   */
  retire(
    input: RetireRelationshipInput,
    context: OperationContext,
  ): Promise<RelationshipCorrectionResult>;

  /** Retrieve eligible relationship versions by subject entity. */
  getOutgoing(
    subjectId: CanonicalId,
    query: RelationshipTemporalQuery,
    page: PageRequest,
    context: OperationContext,
  ): Promise<PageResult<RelationshipVersion>>;

  /** Retrieve eligible relationship versions by object entity. */
  getIncoming(
    objectId: CanonicalId,
    query: RelationshipTemporalQuery,
    page: PageRequest,
    context: OperationContext,
  ): Promise<PageResult<RelationshipVersion>>;

  /** Retrieve eligible relationship versions by predicate. */
  getByPredicate(
    predicate: string,
    query: RelationshipTemporalQuery,
    page: PageRequest,
    context: OperationContext,
  ): Promise<PageResult<RelationshipVersion>>;

  /**
   * Retrieve the complete immutable version history for one logical ID.
   *
   * Ordering is recordedFrom descending, then version descending.
   */
  getHistory(
    relationshipId: CanonicalId,
    page: PageRequest,
    context: OperationContext,
  ): Promise<PageResult<RelationshipVersion>>;

  /**
   * Traverse eligible graph edges from a starting entity.
   *
   * Traversal uses breadth-first depth ordering and one consistent bitemporal
   * snapshot. The query must provide explicit global limits. Exceeding any
   * work budget fails with RESOURCE_LIMIT_EXCEEDED; partial results must
   * never be returned as a successful traversal.
   *
   * maxDepth is an inclusive edge boundary: edges at that depth are included,
   * but their endpoint entities are not expanded. A depth of zero returns
   * no edges and performs no adjacency reads.
   *
   * maxVisitedEntities counts the start entity and each unique discovered
   * endpoint. maxExaminedRelationships counts every row returned by adjacency
   * reads before predicate filtering. maxAdjacencyPages counts every
   * outgoing and incoming page request across the complete traversal.
   *
   * Results are ordered by depth, then case-sensitive UTF-8 bytewise
   * relationship ID, then version descending, then traversal direction.
   * A logical relationship version is returned at most once per traversal.
   *
   * Pagination cursors are bound to the complete traversal query—including
   *   all four limits—and snapshot.
   */
  traverse(
    query: RelationshipTraversalQuery,
    page: PageRequest,
    context: OperationContext,
  ): Promise<PageResult<RelationshipTraversalItem>>;
}
