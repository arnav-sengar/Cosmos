import assert from "node:assert/strict";
import test from "node:test";

import type { OperationContext } from "../src/domain/primitives.js";
import type {
  UnitOfWorkLifecycle,
  UnitOfWorkRepositories,
  UnitOfWorkScope,
  UnitOfWorkScopeFactory,
  UnitOfWorkTransactionDriver,
} from "../src/transactions/unit-of-work.js";

import { DefaultUnitOfWork } from "../src/transactions/unit-of-work.js";

const context: OperationContext = {
  operationId: "operation-001",
  correlationId: "correlation-001",
};

interface HarnessOverrides {
  readonly begin?: (
    context: OperationContext,
  ) => Promise<number>;

  readonly commit?: (
    transaction: number,
    context: OperationContext,
  ) => Promise<void>;

  readonly rollback?: (
    transaction: number,
    context: OperationContext,
  ) => Promise<void>;

  readonly createRepositories?: (
    transaction: number,
    context: OperationContext,
    lifecycle: UnitOfWorkLifecycle,
  ) => Promise<UnitOfWorkRepositories>;
}

function createHarness(overrides: HarnessOverrides = {}) {
  const events: string[] = [];

  const driver: UnitOfWorkTransactionDriver<number> = {
    async begin(operationContext) {
      events.push("begin");

      if (overrides.begin !== undefined) {
        return overrides.begin(operationContext);
      }

      return 1;
    },

    async commit(transaction, operationContext) {
      events.push("commit");

      if (overrides.commit !== undefined) {
        await overrides.commit(transaction, operationContext);
      }
    },

    async rollback(transaction, operationContext) {
      events.push("rollback");

      if (overrides.rollback !== undefined) {
        await overrides.rollback(transaction, operationContext);
      }
    },
  };

  const scopeFactory: UnitOfWorkScopeFactory<number> = {
    async create(transaction, operationContext, lifecycle) {
      events.push("create-scope");

      if (overrides.createRepositories !== undefined) {
        return overrides.createRepositories(
          transaction,
          operationContext,
          lifecycle,
        );
      }

      return {} as UnitOfWorkRepositories;
    },
  };

  return {
    unitOfWork: new DefaultUnitOfWork(driver, scopeFactory),
    events,
  };
}

function hasUnsupportedOperationCode(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "UNSUPPORTED_OPERATION"
  );
}

test("commits after successful work and returns the work result", async () => {
  const { unitOfWork, events } = createHarness();

  let capturedScope: UnitOfWorkScope | undefined;

  const result = await unitOfWork.execute(context, async (scope) => {
    capturedScope = scope;

    assert.equal(scope.context, context);
    assert.equal(scope.lifecycle.state, "ACTIVE");

    scope.lifecycle.assertActive();

    return "persisted";
  });

  assert.equal(result, "persisted");
  assert.deepEqual(events, [
    "begin",
    "create-scope",
    "commit",
  ]);

  assert.ok(capturedScope);

  const completedScope = capturedScope;
  assert.equal(completedScope.lifecycle.state, "COMMITTED");

  assert.throws(
    () => completedScope.lifecycle.assertActive(),
    hasUnsupportedOperationCode,
  );
});

test("rolls back when application work fails and preserves the original error", async () => {
  const { unitOfWork, events } = createHarness();
  const failure = new Error("Validation failed");

  let capturedScope: UnitOfWorkScope | undefined;

  await assert.rejects(
    unitOfWork.execute(context, async (scope) => {
      capturedScope = scope;
      throw failure;
    }),
    (error: unknown) => error === failure,
  );

  assert.deepEqual(events, [
    "begin",
    "create-scope",
    "rollback",
  ]);

  assert.ok(capturedScope);
  assert.equal(capturedScope.lifecycle.state, "ROLLED_BACK");
});

test("attempts rollback when commit fails and preserves the commit error", async () => {
  const failure = new Error("Commit failed");

  const { unitOfWork, events } = createHarness({
    commit: async () => {
      throw failure;
    },
  });

  let capturedScope: UnitOfWorkScope | undefined;

  await assert.rejects(
    unitOfWork.execute(context, async (scope) => {
      capturedScope = scope;
      return "result";
    }),
    (error: unknown) => error === failure,
  );

  assert.deepEqual(events, [
    "begin",
    "create-scope",
    "commit",
    "rollback",
  ]);

  assert.ok(capturedScope);
  assert.equal(capturedScope.lifecycle.state, "ROLLED_BACK");
});

test("preserves the original failure when rollback also fails", async () => {
  const originalFailure = new Error("Write failed");
  const rollbackFailure = new Error("Rollback failed");

  const { unitOfWork, events } = createHarness({
    rollback: async () => {
      throw rollbackFailure;
    },
  });

  let capturedScope: UnitOfWorkScope | undefined;

  await assert.rejects(
    unitOfWork.execute(context, async (scope) => {
      capturedScope = scope;
      throw originalFailure;
    }),
    (error: unknown) => error === originalFailure,
  );

  assert.deepEqual(events, [
    "begin",
    "create-scope",
    "rollback",
  ]);

  assert.ok(capturedScope);
  assert.equal(capturedScope.lifecycle.state, "FAILED");
});

test("rolls back when transaction-scoped repository creation fails", async () => {
  const failure = new Error("Could not create transaction-scoped repositories");

  const { unitOfWork, events } = createHarness({
    createRepositories: async () => {
      throw failure;
    },
  });

  await assert.rejects(
    unitOfWork.execute(context, async () => "unreachable"),
    (error: unknown) => error === failure,
  );

  assert.deepEqual(events, [
    "begin",
    "create-scope",
    "rollback",
  ]);
});

test("does not attempt rollback when beginning the transaction fails", async () => {
  const failure = new Error("Transaction could not begin");

  const { unitOfWork, events } = createHarness({
    begin: async () => {
      throw failure;
    },
  });

  await assert.rejects(
    unitOfWork.execute(context, async () => "unreachable"),
    (error: unknown) => error === failure,
  );

  assert.deepEqual(events, ["begin"]);
});

test("independent concurrent executions receive independent transactions", async () => {
  let nextTransaction = 0;
  const committedTransactions: number[] = [];

  const { unitOfWork } = createHarness({
    begin: async () => {
      nextTransaction += 1;
      return nextTransaction;
    },

    commit: async (transaction) => {
      committedTransactions.push(transaction);
    },
  });

  const results = await Promise.all([
    unitOfWork.execute(context, async () => "first"),
    unitOfWork.execute(
      {
        operationId: "operation-002",
        correlationId: "correlation-002",
      },
      async () => "second",
    ),
  ]);

  assert.deepEqual(results, ["first", "second"]);
  assert.equal(committedTransactions.length, 2);
  assert.deepEqual(
    [...committedTransactions].sort((left, right) => left - right),
    [1, 2],
  );
});
