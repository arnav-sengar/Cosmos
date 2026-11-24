import type { Entity } from "../domain/entity.js";
import type { PredicateDefinitionVersion } from "../domain/predicate.js";
import type { CanonicalId, OperationContext } from "../domain/primitives.js";
import type { Relationship } from "../domain/relationship.js";
import { createPersistenceError } from "../validation/persistence-error.js";
import type { EntityReferenceResolver } from "./entity-reference-resolver.js";
import type { PredicateRegistry } from "./predicate-registry.js";
import type { RelationshipGraphReader } from "./relationship-graph-reader.js";
import type { RelationshipWriteValidator } from "./relationship-write-validator.js";

/**
 * Default provider-neutral relationship write validator.
 *
 * This class performs semantic validation only. It does not persist
 * relationships or claim transaction isolation. The caller's unit of
 * work must coordinate predicate reads, entity resolution, graph reads,
 * and persistence atomically.
 */
export class DefaultRelationshipWriteValidator
  implements RelationshipWriteValidator
{
  constructor(
    private readonly predicates: PredicateRegistry,
    private readonly entities: EntityReferenceResolver,
    private readonly graph: RelationshipGraphReader,
  ) {}

  async validateForCreate(
    relationship: Relationship,
    context: OperationContext,
  ): Promise<PredicateDefinitionVersion> {
    const predicateVersion = await this.predicates.getActive(
      relationship.predicate,
      context,
    );

    if (predicateVersion === null) {
      throw createPersistenceError({
        code: "VALIDATION_FAILED",
        message: "No active definition exists for the relationship predicate.",
        retryable: false,
        operationId: context.operationId,
        correlationId: context.correlationId,
        details: { predicate: relationship.predicate },
      });
    }

    if (
      predicateVersion.predicate !== relationship.predicate ||
      predicateVersion.definition.predicate !== relationship.predicate
    ) {
      throw createPersistenceError({
        code: "INTEGRITY_VIOLATION",
        message: "Predicate registry returned an inconsistent definition identity.",
        retryable: false,
        operationId: context.operationId,
        correlationId: context.correlationId,
        details: { predicate: relationship.predicate },
      });
    }

    if (predicateVersion.definition.status !== "ACTIVE") {
      throw createPersistenceError({
        code: "VALIDATION_FAILED",
        message: "Retired predicates cannot be used for new relationships.",
        retryable: false,
        operationId: context.operationId,
        correlationId: context.correlationId,
        details: {
          predicate: relationship.predicate,
          status: predicateVersion.definition.status,
        },
      });
    }

    const [subject, object] = await Promise.all([
      this.entities.resolveForWrite(relationship.subjectId, context),
      this.entities.resolveForWrite(relationship.objectId, context),
    ]);

    this.validateEntityIdentity(
      subject,
      relationship.subjectId,
      "subject",
      context,
    );

    this.validateEntityIdentity(
      object,
      relationship.objectId,
      "object",
      context,
    );

    this.validateEntityTypes(
      subject,
      object,
      predicateVersion,
      context,
    );

    if (predicateVersion.definition.constraints.acyclic === true) {
      await this.validateAcyclicity(relationship, context);
    }

    return predicateVersion;
  }

  private validateEntityIdentity(
    entity: Entity,
    expectedId: CanonicalId,
    role: "subject" | "object",
    context: OperationContext,
  ): void {
    if (entity.id !== expectedId) {
      throw createPersistenceError({
        code: "INTEGRITY_VIOLATION",
        message: `Resolved ${role} entity identity does not match the relationship reference.`,
        retryable: false,
        operationId: context.operationId,
        correlationId: context.correlationId,
        details: {
          role,
          expectedId,
          actualId: entity.id,
        },
      });
    }
  }

  private validateEntityTypes(
    subject: Entity,
    object: Entity,
    predicateVersion: PredicateDefinitionVersion,
    context: OperationContext,
  ): void {
    const { predicate, constraints } = predicateVersion.definition;

    if (
      constraints.allowedSubjectTypes !== undefined &&
      !constraints.allowedSubjectTypes.includes(subject.type)
    ) {
      throw createPersistenceError({
        code: "INTEGRITY_VIOLATION",
        message: "Subject entity type is not permitted by the predicate definition.",
        retryable: false,
        operationId: context.operationId,
        correlationId: context.correlationId,
        details: {
          predicate,
          entityId: subject.id,
          entityType: subject.type,
          allowedTypes: constraints.allowedSubjectTypes,
        },
      });
    }

    if (
      constraints.allowedObjectTypes !== undefined &&
      !constraints.allowedObjectTypes.includes(object.type)
    ) {
      throw createPersistenceError({
        code: "INTEGRITY_VIOLATION",
        message: "Object entity type is not permitted by the predicate definition.",
        retryable: false,
        operationId: context.operationId,
        correlationId: context.correlationId,
        details: {
          predicate,
          entityId: object.id,
          entityType: object.type,
          allowedTypes: constraints.allowedObjectTypes,
        },
      });
    }
  }

  private async validateAcyclicity(
    relationship: Relationship,
    context: OperationContext,
  ): Promise<void> {
    if (relationship.subjectId === relationship.objectId) {
      this.throwCycleError(relationship, context);
    }

    if (
      await this.pathExists(
        relationship.objectId,
        relationship.subjectId,
        relationship.predicate,
        context,
      )
    ) {
      this.throwCycleError(relationship, context);
    }
  }

  /**
   * A proposed edge subject -> object creates a cycle exactly when
   * an existing directed path object -> subject already exists.
   */
  private async pathExists(
    startId: CanonicalId,
    targetId: CanonicalId,
    predicate: string,
    context: OperationContext,
  ): Promise<boolean> {
    const queue: CanonicalId[] = [startId];
    const visited = new Set<string>([startId]);

    for (let index = 0; index < queue.length; index += 1) {
      const currentId = queue[index];

      if (currentId === undefined) {
        continue;
      }

      if (currentId === targetId) {
        return true;
      }

      const outgoing = await this.graph.getOutgoingBySubject(
        currentId,
        predicate,
        context,
      );

      for (const edge of outgoing) {
        if (
          edge.predicate !== predicate ||
          edge.subjectId !== currentId
        ) {
          throw createPersistenceError({
            code: "INTEGRITY_VIOLATION",
            message: "Graph reader returned an edge outside the requested subject and predicate.",
            retryable: false,
            operationId: context.operationId,
            correlationId: context.correlationId,
            details: {
              requestedSubjectId: currentId,
              requestedPredicate: predicate,
              relationshipId: edge.id,
              actualSubjectId: edge.subjectId,
              actualPredicate: edge.predicate,
            },
          });
        }

        if (edge.objectId === targetId) {
          return true;
        }

        if (!visited.has(edge.objectId)) {
          visited.add(edge.objectId);
          queue.push(edge.objectId);
        }
      }
    }

    return false;
  }

  private throwCycleError(
    relationship: Relationship,
    context: OperationContext,
  ): never {
    throw createPersistenceError({
      code: "INTEGRITY_VIOLATION",
      message: "The relationship would create a directed cycle for its predicate.",
      retryable: false,
      operationId: context.operationId,
      correlationId: context.correlationId,
      details: {
        predicate: relationship.predicate,
        subjectId: relationship.subjectId,
        objectId: relationship.objectId,
      },
    });
  }
}
