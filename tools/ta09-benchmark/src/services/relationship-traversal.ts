/**
 * Provider-neutral breadth-first relationship graph traversal.
 *
 * The repository supplies transaction/snapshot-scoped reads. This service
 * collects every adjacency page and produces a complete deterministic result.
 * Public cursor pagination remains the repository implementation's concern.
 */

import type {
  CanonicalId,
  ISODateTime,
  OperationContext,
  PageRequest,
} from "../domain/primitives.js";

import type { RelationshipTemporalQuery, RelationshipVersion } from "../domain/relationship-version.js";

import {
  type RelationshipRepository,
  type RelationshipTraversalDirection,
  type RelationshipTraversalItem,
  type RelationshipTraversalQuery,
} from "../repositories/relationship-repository.js";

import { compareUtf8Bytewise } from "../domain/temporal.js";
import { relationshipVersionContains } from "./relationship-temporal.js";
import { relationshipTraversalQuerySchema } from "../validation/relationship-repository.js";

const INTERNAL_PAGE_SIZE = 500;

interface QueuedEntity {
  readonly entityId: CanonicalId;
  readonly depth: number;
}

interface AdjacencyCandidate {
  readonly version: RelationshipVersion;
  readonly direction: "OUTGOING" | "INCOMING";
}

type AdjacencyReader = (
  entityId: CanonicalId,
  query: RelationshipTemporalQuery,
  page: PageRequest,
  context: OperationContext,
) => Promise<{
  readonly items: readonly RelationshipVersion[];
  readonly nextCursor?: string;
}>;

function compareDirection(
  left: "OUTGOING" | "INCOMING",
  right: "OUTGOING" | "INCOMING",
): number {
  return compareUtf8Bytewise(left, right);
}

function compareCandidates(
  left: AdjacencyCandidate,
  right: AdjacencyCandidate,
): number {
  return (
    compareUtf8Bytewise(
      left.version.relationship.id,
      right.version.relationship.id,
    ) ||
    right.version.version - left.version.version ||
    compareDirection(left.direction, right.direction)
  );
}

function compareTraversalItems(
  left: RelationshipTraversalItem,
  right: RelationshipTraversalItem,
): number {
  return (
    left.depth - right.depth ||
    compareUtf8Bytewise(
      left.relationship.relationship.id,
      right.relationship.relationship.id,
    ) ||
    right.relationship.version - left.relationship.version ||
    compareDirection(left.traversedDirection, right.traversedDirection)
  );
}

function traversalItemIsPreferred(
  candidate: RelationshipTraversalItem,
  existing: RelationshipTraversalItem,
): boolean {
  return compareTraversalItems(candidate, existing) < 0;
}

async function readAllAdjacencyPages(
  reader: AdjacencyReader,
  entityId: CanonicalId,
  query: RelationshipTemporalQuery,
  context: OperationContext,
): Promise<RelationshipVersion[]> {
  const items: RelationshipVersion[] = [];
  const observedCursors = new Set<string>();

  let cursor: string | undefined;

  while (true) {
    const page: PageRequest =
      cursor === undefined
        ? { limit: INTERNAL_PAGE_SIZE }
        : { limit: INTERNAL_PAGE_SIZE, cursor };

    const result = await reader(entityId, query, page, context);

    if (!result || !Array.isArray(result.items)) {
      throw new Error("Repository returned an invalid adjacency page.");
    }

    items.push(...result.items);

    const nextCursor = result.nextCursor;

    if (nextCursor === undefined) {
      break;
    }

    if (
      typeof nextCursor !== "string" ||
      nextCursor.length === 0 ||
      nextCursor.trim() !== nextCursor
    ) {
      throw new Error("Repository returned a malformed adjacency cursor.");
    }

    if (observedCursors.has(nextCursor)) {
      throw new Error("Repository repeated an adjacency cursor.");
    }

    observedCursors.add(nextCursor);
    cursor = nextCursor;
  }

  return items;
}

function validateAdjacencyCandidate(
  candidate: AdjacencyCandidate,
  entityId: CanonicalId,
  validAt: ISODateTime,
  recordedAt: ISODateTime,
): void {
  const relationship = candidate.version.relationship;

  const expectedEndpoint =
    candidate.direction === "OUTGOING"
      ? relationship.subjectId
      : relationship.objectId;

  if (expectedEndpoint !== entityId) {
    throw new Error(
      `Repository returned relationship ${relationship.id} under the wrong ${candidate.direction.toLowerCase()} endpoint.`,
    );
  }

  if (
    !relationshipVersionContains(
      candidate.version,
      validAt,
      recordedAt,
    )
  ) {
    throw new Error(
      `Repository returned temporally ineligible relationship version ${relationship.id}:${candidate.version.version}.`,
    );
  }
}

/**
 * Collect every eligible edge reachable from the start entity.
 *
 * `defaultValidAt` must be the operation's captured time. Callers should
 * provide a repository whose reads share one consistent transaction snapshot.
 */
export async function collectRelationshipTraversalItems(
  repository: RelationshipRepository,
  query: RelationshipTraversalQuery,
  context: OperationContext,
  defaultValidAt: ISODateTime,
): Promise<readonly RelationshipTraversalItem[]> {
  const validatedQuery = relationshipTraversalQuerySchema.parse(query);

  const direction: RelationshipTraversalDirection =
    validatedQuery.direction ?? "OUTGOING";

  const effectiveValidAt = validatedQuery.validAt ?? defaultValidAt;

  const temporalQuery: RelationshipTemporalQuery = {
    validAt: effectiveValidAt,
    recordedAt: validatedQuery.recordedAt,
  };

  const queue: QueuedEntity[] = [
    {
      entityId: validatedQuery.startEntityId,
      depth: 0,
    },
  ];

  const visitedEntities = new Set<CanonicalId>([
    validatedQuery.startEntityId,
  ]);

  const bestItems = new Map<string, RelationshipTraversalItem>();

  let queueIndex = 0;

  while (queueIndex < queue.length) {
    const current = queue[queueIndex];

    if (!current) {
      throw new Error("Traversal queue contained an invalid entry.");
    }

    queueIndex += 1;

    const candidates: AdjacencyCandidate[] = [];

    if (direction === "OUTGOING" || direction === "BIDIRECTIONAL") {
      const outgoing = await readAllAdjacencyPages(
        repository.getOutgoing.bind(repository),
        current.entityId,
        temporalQuery,
        context,
      );

      for (const version of outgoing) {
        candidates.push({
          version,
          direction: "OUTGOING",
        });
      }
    }

    if (direction === "INCOMING" || direction === "BIDIRECTIONAL") {
      const incoming = await readAllAdjacencyPages(
        repository.getIncoming.bind(repository),
        current.entityId,
        temporalQuery,
        context,
      );

      for (const version of incoming) {
        candidates.push({
          version,
          direction: "INCOMING",
        });
      }
    }

    candidates.sort(compareCandidates);

    for (const candidate of candidates) {
      validateAdjacencyCandidate(
        candidate,
        current.entityId,
        effectiveValidAt,
        validatedQuery.recordedAt,
      );

      const relationship = candidate.version.relationship;

      if (
        validatedQuery.predicate !== undefined &&
        relationship.predicate !== validatedQuery.predicate
      ) {
        continue;
      }

      const item: RelationshipTraversalItem = {
        relationship: candidate.version,
        depth: current.depth + 1,
        traversedDirection: candidate.direction,
      };

      const key = `${relationship.id}\u0000${candidate.version.version}`;
      const existing = bestItems.get(key);

      if (
        existing === undefined ||
        traversalItemIsPreferred(item, existing)
      ) {
        bestItems.set(key, item);
      }

      const nextEntity =
        candidate.direction === "OUTGOING"
          ? relationship.objectId
          : relationship.subjectId;

      if (!visitedEntities.has(nextEntity)) {
        visitedEntities.add(nextEntity);

        queue.push({
          entityId: nextEntity,
          depth: current.depth + 1,
        });
      }
    }
  }

  return [...bestItems.values()].sort(compareTraversalItems);
}
