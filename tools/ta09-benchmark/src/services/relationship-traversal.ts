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

import type {
  RelationshipTemporalQuery,
  RelationshipVersion,
} from "../domain/relationship-version.js";

import {
  type RelationshipRepository,
  type RelationshipTraversalDirection,
  type RelationshipTraversalItem,
  type RelationshipTraversalLimits,
  type RelationshipTraversalQuery,
} from "../repositories/relationship-repository.js";

import { compareUtf8Bytewise } from "../domain/temporal.js";
import { relationshipVersionContains } from "./relationship-temporal.js";
import { relationshipTraversalQuerySchema } from "../validation/relationship-repository.js";
import { createPersistenceError } from "../validation/persistence-error.js";

const INTERNAL_PAGE_SIZE = 500;

interface QueuedEntity {
  readonly entityId: CanonicalId;
  readonly depth: number;
}

interface AdjacencyCandidate {
  readonly version: RelationshipVersion;
  readonly direction: "OUTGOING" | "INCOMING";
}

interface TraversalBudget {
  visitedEntities: number;
  examinedRelationships: number;
  adjacencyPages: number;
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

function throwResourceLimit(
  context: OperationContext,
  limit: keyof RelationshipTraversalLimits,
  configuredLimit: number,
  observedCount: number,
): never {
  throw createPersistenceError({
    code: "RESOURCE_LIMIT_EXCEEDED",
    message: `Relationship traversal exceeded the configured ${limit} limit.`,
    retryable: false,
    operationId: context.operationId,
    correlationId: context.correlationId,
    details: {
      limit,
      configuredLimit,
      observedCount,
    },
  });
}

function throwIntegrityViolation(
  context: OperationContext,
  message: string,
  details: Record<string, string | number | boolean>,
): never {
  throw createPersistenceError({
    code: "INTEGRITY_VIOLATION",
    message,
    retryable: false,
    operationId: context.operationId,
    correlationId: context.correlationId,
    details,
  });
}

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
  limits: RelationshipTraversalLimits,
  budget: TraversalBudget,
): Promise<RelationshipVersion[]> {
  const items: RelationshipVersion[] = [];
  const observedCursors = new Set<string>();

  let cursor: string | undefined;

  while (true) {
    const nextPageCount = budget.adjacencyPages + 1;

    if (nextPageCount > limits.maxAdjacencyPages) {
      throwResourceLimit(
        context,
        "maxAdjacencyPages",
        limits.maxAdjacencyPages,
        nextPageCount,
      );
    }

    budget.adjacencyPages = nextPageCount;

    const page: PageRequest =
      cursor === undefined
        ? { limit: INTERNAL_PAGE_SIZE }
        : { limit: INTERNAL_PAGE_SIZE, cursor };

    const result = await reader(entityId, query, page, context);

    if (!result || !Array.isArray(result.items)) {
      throwIntegrityViolation(
        context,
        "Repository returned an invalid adjacency page.",
        { entityId },
      );
    }

    const observedRelationshipCount =
      budget.examinedRelationships + result.items.length;

    if (observedRelationshipCount > limits.maxExaminedRelationships) {
      throwResourceLimit(
        context,
        "maxExaminedRelationships",
        limits.maxExaminedRelationships,
        observedRelationshipCount,
      );
    }

    budget.examinedRelationships = observedRelationshipCount;

    if (result.items.length > page.limit) {
      throwIntegrityViolation(
        context,
        "Repository returned more adjacency rows than the requested page limit.",
        {
          entityId,
          requestedLimit: page.limit,
          returnedCount: result.items.length,
        },
      );
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
      throwIntegrityViolation(
        context,
        "Repository returned a malformed adjacency cursor.",
        { entityId },
      );
    }

    if (observedCursors.has(nextCursor)) {
      throwIntegrityViolation(
        context,
        "Repository repeated an adjacency cursor.",
        { entityId },
      );
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
  context: OperationContext,
): void {
  const relationship = candidate.version.relationship;

  const expectedEndpoint =
    candidate.direction === "OUTGOING"
      ? relationship.subjectId
      : relationship.objectId;

  if (expectedEndpoint !== entityId) {
    throwIntegrityViolation(
      context,
      `Repository returned relationship ${relationship.id} under the wrong ${candidate.direction.toLowerCase()} endpoint.`,
      {
        entityId,
        relationshipId: relationship.id,
        direction: candidate.direction,
      },
    );
  }

  if (
    !relationshipVersionContains(
      candidate.version,
      validAt,
      recordedAt,
    )
  ) {
    throwIntegrityViolation(
      context,
      `Repository returned temporally ineligible relationship version ${relationship.id}:${candidate.version.version}.`,
      {
        relationshipId: relationship.id,
        version: candidate.version.version,
      },
    );
  }
}

/**
 * Collect every eligible edge reachable from the start entity.
 *
 * defaultValidAt must be the operation's captured time. Callers should
 * provide a repository whose reads share one consistent transaction snapshot.
 */
export async function collectRelationshipTraversalItems(
  repository: RelationshipRepository,
  query: RelationshipTraversalQuery,
  context: OperationContext,
  defaultValidAt: ISODateTime,
): Promise<readonly RelationshipTraversalItem[]> {
  const validatedQuery = relationshipTraversalQuerySchema.parse(query);
  const limits = validatedQuery.limits;

  const direction: RelationshipTraversalDirection =
    validatedQuery.direction ?? "OUTGOING";

  const effectiveValidAt = validatedQuery.validAt ?? defaultValidAt;

  const temporalQuery: RelationshipTemporalQuery = {
    validAt: effectiveValidAt,
    recordedAt: validatedQuery.recordedAt,
  };

  if (limits.maxDepth === 0) {
    return [];
  }

  const queue: QueuedEntity[] = [
    {
      entityId: validatedQuery.startEntityId,
      depth: 0,
    },
  ];

  const visitedEntities = new Set<CanonicalId>([
    validatedQuery.startEntityId,
  ]);

  const budget: TraversalBudget = {
    visitedEntities: 1,
    examinedRelationships: 0,
    adjacencyPages: 0,
  };

  if (budget.visitedEntities > limits.maxVisitedEntities) {
    throwResourceLimit(
      context,
      "maxVisitedEntities",
      limits.maxVisitedEntities,
      budget.visitedEntities,
    );
  }

  const bestItems = new Map<
    string,
    Map<number, RelationshipTraversalItem>
  >();

  let queueIndex = 0;

  while (queueIndex < queue.length) {
    const current = queue[queueIndex];

    if (!current) {
      throwIntegrityViolation(
        context,
        "Traversal queue contained an invalid entry.",
        { queueIndex },
      );
    }

    queueIndex += 1;

    if (current.depth >= limits.maxDepth) {
      continue;
    }

    const candidates: AdjacencyCandidate[] = [];

    if (direction === "OUTGOING" || direction === "BIDIRECTIONAL") {
      const outgoing = await readAllAdjacencyPages(
        repository.getOutgoing.bind(repository),
        current.entityId,
        temporalQuery,
        context,
        limits,
        budget,
      );

      for (const version of outgoing) {
        candidates.push({ version, direction: "OUTGOING" });
      }
    }

    if (direction === "INCOMING" || direction === "BIDIRECTIONAL") {
      const incoming = await readAllAdjacencyPages(
        repository.getIncoming.bind(repository),
        current.entityId,
        temporalQuery,
        context,
        limits,
        budget,
      );

      for (const version of incoming) {
        candidates.push({ version, direction: "INCOMING" });
      }
    }

    candidates.sort(compareCandidates);

    for (const candidate of candidates) {
      validateAdjacencyCandidate(
        candidate,
        current.entityId,
        effectiveValidAt,
        validatedQuery.recordedAt,
        context,
      );

      const relationship = candidate.version.relationship;

      if (
        validatedQuery.predicate !== undefined &&
        relationship.predicate !== validatedQuery.predicate
      ) {
        continue;
      }

      const nextDepth = current.depth + 1;

      const item: RelationshipTraversalItem = {
        relationship: candidate.version,
        depth: nextDepth,
        traversedDirection: candidate.direction,
      };

      let versionsForRelationship = bestItems.get(relationship.id);

      if (versionsForRelationship === undefined) {
        versionsForRelationship = new Map();
        bestItems.set(relationship.id, versionsForRelationship);
      }

      const existing = versionsForRelationship.get(
        candidate.version.version,
      );

      if (
        existing === undefined ||
        traversalItemIsPreferred(item, existing)
      ) {
        versionsForRelationship.set(candidate.version.version, item);
      }

      const nextEntity =
        candidate.direction === "OUTGOING"
          ? relationship.objectId
          : relationship.subjectId;

      if (!visitedEntities.has(nextEntity)) {
        const observedEntityCount = budget.visitedEntities + 1;

        if (observedEntityCount > limits.maxVisitedEntities) {
          throwResourceLimit(
            context,
            "maxVisitedEntities",
            limits.maxVisitedEntities,
            observedEntityCount,
          );
        }

        visitedEntities.add(nextEntity);
        budget.visitedEntities = observedEntityCount;

        if (nextDepth < limits.maxDepth) {
          queue.push({
            entityId: nextEntity,
            depth: nextDepth,
          });
        }
      }
    }
  }

  const result: RelationshipTraversalItem[] = [];

  for (const versions of bestItems.values()) {
    result.push(...versions.values());
  }

  return result.sort(compareTraversalItems);
}
