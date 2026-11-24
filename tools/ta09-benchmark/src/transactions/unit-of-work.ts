/**
 * Provider-neutral Unit of Work contracts and transaction coordinator.
 *
 * A Unit of Work binds all participating repositories and validation
 * services to one provider transaction and one consistent snapshot.
 *
 * Provider-specific transaction creation, isolation, commit, and rollback
 * remain behind UnitOfWorkTransactionDriver.
 */

import type { EntityLifecycleReader } from "../repositories/entity-lifecycle-reader.js";
import type { EntityRepository } from "../repositories/entity-repository.js";
import type { EntityReferenceResolver } from "../repositories/entity-reference-resolver.js";
import type { PredicateRegistry } from "../repositories/predicate-registry.js";
import type { RelationshipGraphReader } from "../repositories/relationship-graph-reader.js";
import type { RelationshipRepository } from "../repositories/relationship-repository.js";
import type { RelationshipWriteValidator } from "../repositories/relationship-write-validator.js";

import type { OperationContext } from "../domain/primitives.js";

import { createPersistenceError } from "../validation/persistence-error.js";

/** Observable lifecycle states for one Unit of Work scope. */
export type UnitOfWorkState =
  | "ACTIVE"
  | "COMMITTING"
  | "COMMITTED"
  | "ROLLING_BACK"
  | "ROLLED_BACK"
  | "FAILED";

/**
 * Lifecycle guard shared by every object exposed inside a transaction scope.
 *
 * Repository and service implementations must call assertActive before
 * executing an operation. A scope must never remain usable after completion.
 */
export interface UnitOfWorkLifecycle {
  readonly state: UnitOfWorkState;

  /** Rejects operations when the transaction scope is no longer active. */
  assertActive(): void;
}

/**
 * Repository and validation-service set bound to one provider transaction.
 *
 * Implementations must ensure that every member reads from and writes to
 * the same transaction and consistent snapshot.
 *
 * The resolver and validator must be constructed from the scoped
 * repositories, not from application-wide repository instances.
 */
export interface UnitOfWorkRepositories {
  readonly entities: EntityRepository;
  readonly entityLifecycles: EntityLifecycleReader;
  readonly predicates: PredicateRegistry;
  readonly relationships: RelationshipRepository;
  readonly relationshipGraph: RelationshipGraphReader;
  readonly entityReferences: EntityReferenceResolver;
  readonly relationshipWriteValidator: RelationshipWriteValidator;
}

/** Complete dependency scope supplied to application work. */
export interface UnitOfWorkScope extends UnitOfWorkRepositories {
  readonly context: OperationContext;
  readonly lifecycle: UnitOfWorkLifecycle;
}

/**
 * Provider-specific transaction lifecycle.
 *
 * begin must establish the transaction and its consistency snapshot.
 * commit must atomically publish every staged write.
 * rollback must abandon every staged write.
 *
 * Implementations must map provider failures into PersistenceError values.
 */
export interface UnitOfWorkTransactionDriver<TTransaction> {
  begin(context: OperationContext): Promise<TTransaction>;

  commit(
    transaction: TTransaction,
    context: OperationContext,
  ): Promise<void>;

  rollback(
    transaction: TTransaction,
    context: OperationContext,
  ): Promise<void>;
}

/**
 * Creates repository and service instances bound to the supplied transaction.
 *
 * The factory must:
 * - Bind every repository to the same transaction and snapshot.
 * - Construct resolvers and validators from those scoped repositories.
 * - Ensure operations reject after lifecycle.assertActive() starts failing.
 * - Avoid returning application-wide, unscoped repository instances.
 */
export interface UnitOfWorkScopeFactory<TTransaction> {
  create(
    transaction: TTransaction,
    context: OperationContext,
    lifecycle: UnitOfWorkLifecycle,
  ): Promise<UnitOfWorkRepositories>;
}

/** Executes application work inside one atomic persistence boundary. */
export interface UnitOfWork {
  /**
   * Starts a transaction, executes work, and commits on success.
   *
   * If scope creation, application work, or commit fails, rollback is
   * attempted. The original failure is always rethrown.
   *
   * Callers must await all repository operations before returning from work.
   * Nested transaction semantics are deliberately not implied.
   */
  execute<T>(
    context: OperationContext,
    work: (scope: UnitOfWorkScope) => Promise<T>,
  ): Promise<T>;
}

function createLifecycle(
  context: OperationContext,
): {
  readonly lifecycle: UnitOfWorkLifecycle;
  setState(state: UnitOfWorkState): void;
} {
  let state: UnitOfWorkState = "ACTIVE";

  const lifecycle: UnitOfWorkLifecycle = Object.freeze({
    get state(): UnitOfWorkState {
      return state;
    },

    assertActive(): void {
      if (state !== "ACTIVE") {
        throw createPersistenceError({
          code: "UNSUPPORTED_OPERATION",
          message: "The Unit of Work scope is no longer active.",
          retryable: false,
          operationId: context.operationId,
          correlationId: context.correlationId,
          details: { state },
        });
      }
    },
  });

  return {
    lifecycle,
    setState(nextState: UnitOfWorkState): void {
      state = nextState;
    },
  };
}

/**
 * Default provider-neutral Unit of Work coordinator.
 *
 * This class controls orchestration only. It does not implement database
 * transactions, isolation levels, locking, or provider-specific persistence.
 */
export class DefaultUnitOfWork<TTransaction> implements UnitOfWork {
  constructor(
    private readonly driver: UnitOfWorkTransactionDriver<TTransaction>,
    private readonly scopeFactory: UnitOfWorkScopeFactory<TTransaction>,
  ) {}

  async execute<T>(
    context: OperationContext,
    work: (scope: UnitOfWorkScope) => Promise<T>,
  ): Promise<T> {
    // If begin fails, no transaction has been acquired and rollback is not run.
    const transaction = await this.driver.begin(context);

    const { lifecycle, setState } = createLifecycle(context);

    try {
      const repositories = await this.scopeFactory.create(
        transaction,
        context,
        lifecycle,
      );

      const scope: UnitOfWorkScope = Object.freeze({
        ...repositories,
        context,
        lifecycle,
      });

      const result = await work(scope);

      setState("COMMITTING");
      await this.driver.commit(transaction, context);
      setState("COMMITTED");

      return result;
    } catch (originalError: unknown) {
      if (
        lifecycle.state === "ACTIVE" ||
        lifecycle.state === "COMMITTING"
      ) {
        setState("ROLLING_BACK");

        try {
          await this.driver.rollback(transaction, context);
          setState("ROLLED_BACK");
        } catch {
          // Preserve the original operation/commit failure.
          // The FAILED state records that transaction cleanup was uncertain.
          setState("FAILED");
        }
      }

      throw originalError;
    }
  }
}
