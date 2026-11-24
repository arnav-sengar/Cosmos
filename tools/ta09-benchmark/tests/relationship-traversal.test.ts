import assert from "node:assert/strict";
import test from "node:test";

import type {
  CanonicalId,
  ISODateTime,
  OperationContext,
  PageRequest,
} from "../src/domain/primitives.js";

import type { RelationshipTemporalQuery, RelationshipVersion } from "../src/domain/relationship-version.js";

import type {
  RelationshipRepository,
  RelationshipTraversalQuery,
} from "../src/repositories/relationship-repository.js";

import { isoDateTimeSchema } from "../src/validation/common.js";
import { relationshipVersionSchema } from "../src/validation/relationship-version.js";

import {
  collectRelationshipTraversalItems,
} from "../src/services/relationship-traversal.js";

const at = (value: string): ISODateTime =>
  isoDateTimeSchema.parse(value);

const id = (value: string): CanonicalId =>
  value as CanonicalId;

const context: OperationContext = {
  operationId: "operation-1",
  correlationId: "correlation-1",
};

const timestamp = at("2026-01-01T00:00:00.000Z");

function makeVersion(
  relationshipId: string,
  subjectId: string,
  predicate: string,
  objectId: string,
  overrides: Record<string, unknown> = {},
): RelationshipVersion {
  return relationshipVersionSchema.parse({
    relationship: {
      id: relationshipId,
      subjectId,
      predicate,
      objectId,
    },
    version: 1,
    validFrom: "2020-01-01T00:00:00.000Z",
    recordedFrom: "2020-01-01T00:00:00.000Z",
    predicateDefinitionVersion: 1,
    correctionReason: "Test relationship",
    provenanceRef: "test:source",
    createdAt: "2020-01-01T00:00:00.000Z",
    createdBy: "test",
    ...overrides,
  });
}

interface RepositoryOptions {
  readonly pageSize?: number;
  readonly repeatedCursor?: boolean;
  readonly invalidCursor?: boolean;
  readonly returnIneligibleTemporalRows?: boolean;
}

function createRepository(
  versions: readonly RelationshipVersion[],
  options: RepositoryOptions = {},
): RelationshipRepository {
  const pageSize = options.pageSize ?? Number.MAX_SAFE_INTEGER;

  const matchesTemporalQuery = (
    version: RelationshipVersion,
    query: RelationshipTemporalQuery,
  ): boolean => {
    if (options.returnIneligibleTemporalRows) {
      return true;
    }

    const validAt = query.validAt ?? timestamp;
    const recordedAt = query.recordedAt;

    return (
      version.validFrom <= validAt &&
      (version.validTo === undefined || validAt < version.validTo) &&
      version.recordedFrom <= recordedAt &&
      (version.recordedTo === undefined ||
        recordedAt < version.recordedTo)
    );
  };

  const paginate = (
    matching: readonly RelationshipVersion[],
    page: PageRequest,
  ) => {
    if (options.invalidCursor && page.cursor === undefined) {
      return {
        items: matching.slice(0, pageSize),
        nextCursor: " ",
      };
    }

    const offset =
      page.cursor === undefined ? 0 : Number(page.cursor);

    const items = matching.slice(offset, offset + pageSize);
    const nextOffset = offset + items.length;

    if (nextOffset >= matching.length) {
      return { items };
    }

    return {
      items,
      nextCursor: options.repeatedCursor
        ? "0"
        : String(nextOffset),
    };
  };

  return {
    create: async () => {
      throw new Error("Not implemented in traversal test repository.");
    },
    update: async () => {
      throw new Error("Not implemented in traversal test repository.");
    },
    retire: async () => {
      throw new Error("Not implemented in traversal test repository.");
    },
    getOutgoing: async (
      subjectId: CanonicalId,
      query: RelationshipTemporalQuery,
      page: PageRequest,
    ) =>
      paginate(
        versions.filter(
          (item) =>
            item.relationship.subjectId === subjectId &&
            matchesTemporalQuery(item, query),
        ),
        page,
      ),
    getIncoming: async (
      objectId: CanonicalId,
      query: RelationshipTemporalQuery,
      page: PageRequest,
    ) =>
      paginate(
        versions.filter(
          (item) =>
            item.relationship.objectId === objectId &&
            matchesTemporalQuery(item, query),
        ),
        page,
      ),
    getByPredicate: async () => ({ items: [] }),
    getHistory: async () => ({ items: [] }),
    traverse: async () => ({ items: [] }),
  } as unknown as RelationshipRepository;
}

function makeQuery(
  overrides: Partial<RelationshipTraversalQuery> = {},
): RelationshipTraversalQuery {
  return {
    startEntityId: id("A"),
    recordedAt: timestamp,
    ...overrides,
  };
}

async function traverse(
  versions: readonly RelationshipVersion[],
  query: RelationshipTraversalQuery = makeQuery(),
  options: RepositoryOptions = {},
) {
  return collectRelationshipTraversalItems(
    createRepository(versions, options),
    query,
    context,
    timestamp,
  );
}

test("performs outgoing breadth-first traversal", async () => {
  const versions = [
    makeVersion("R-1", "A", "LINKS", "B"),
    makeVersion("R-2", "B", "LINKS", "C"),
    makeVersion("R-3", "C", "LINKS", "D"),
  ];

  const result = await traverse(versions);

  assert.deepEqual(
    result.map((item) => [
      item.relationship.relationship.id,
      item.depth,
      item.traversedDirection,
    ]),
    [
      ["R-1", 1, "OUTGOING"],
      ["R-2", 2, "OUTGOING"],
      ["R-3", 3, "OUTGOING"],
    ],
  );
});

test("performs incoming traversal in reverse graph direction", async () => {
  const versions = [
    makeVersion("R-1", "B", "LINKS", "A"),
    makeVersion("R-2", "C", "LINKS", "B"),
  ];

  const result = await traverse(
    versions,
    makeQuery({ direction: "INCOMING" }),
  );

  assert.deepEqual(
    result.map((item) => [
      item.relationship.relationship.id,
      item.depth,
      item.traversedDirection,
    ]),
    [
      ["R-1", 1, "INCOMING"],
      ["R-2", 2, "INCOMING"],
    ],
  );
});

test("supports bidirectional traversal", async () => {
  const versions = [
    makeVersion("R-1", "A", "LINKS", "B"),
    makeVersion("R-2", "C", "LINKS", "A"),
    makeVersion("R-3", "B", "LINKS", "D"),
  ];

  const result = await traverse(
    versions,
    makeQuery({ direction: "BIDIRECTIONAL" }),
  );

  assert.deepEqual(
    result.map((item) => [
      item.relationship.relationship.id,
      item.depth,
      item.traversedDirection,
    ]),
    [
      ["R-1", 1, "OUTGOING"],
      ["R-2", 1, "INCOMING"],
      ["R-3", 2, "OUTGOING"],
    ],
  );
});

test("filters by predicate before following non-matching edges", async () => {
  const versions = [
    makeVersion("R-1", "A", "ALLOWS", "B"),
    makeVersion("R-2", "B", "BLOCKED", "C"),
    makeVersion("R-3", "A", "ALLOWS", "D"),
    makeVersion("R-4", "D", "ALLOWS", "E"),
  ];

  const result = await traverse(
    versions,
    makeQuery({ predicate: "ALLOWS" }),
  );

  assert.deepEqual(
    result.map((item) => item.relationship.relationship.id),
    ["R-1", "R-3", "R-4"],
  );

  assert.equal(
    result.some(
      (item) => item.relationship.relationship.objectId === "C",
    ),
    false,
  );
});

test("uses both valid-time and recorded-time eligibility", async () => {
  const versions = [
    makeVersion("R-VALID", "A", "LINKS", "B", {
      validFrom: "2020-01-01T00:00:00.000Z",
      validTo: "2025-01-01T00:00:00.000Z",
    }),
    makeVersion("R-RECORDED", "A", "LINKS", "C", {
      recordedFrom: "2020-01-01T00:00:00.000Z",
      recordedTo: "2023-01-01T00:00:00.000Z",
    }),
  ];

  const result = await traverse(
    versions,
    makeQuery({
      validAt: at("2024-01-01T00:00:00.000Z"),
      recordedAt: at("2024-01-01T00:00:00.000Z"),
    }),
  );

  assert.deepEqual(
    result.map((item) => item.relationship.relationship.id),
    ["R-VALID"],
  );
});

test("uses the captured operation time when validAt is omitted", async () => {
  const versions = [
    makeVersion("R-1", "A", "LINKS", "B", {
      validFrom: "2025-01-01T00:00:00.000Z",
    }),
  ];

  const result = await traverse(versions);

  assert.equal(result.length, 1);
});

test("terminates on cycles and retains cycle-closing edges and self-loops", async () => {
  const versions = [
    makeVersion("R-1", "A", "LINKS", "B"),
    makeVersion("R-2", "B", "LINKS", "A"),
    makeVersion("R-3", "B", "LINKS", "B"),
    makeVersion("R-4", "B", "LINKS", "C"),
  ];

  const result = await traverse(versions);

  assert.deepEqual(
    result.map((item) => item.relationship.relationship.id),
    ["R-1", "R-2", "R-3", "R-4"],
  );

  assert.equal(result.length, 4);
});

test("deduplicates the same relationship version in bidirectional traversal", async () => {
  const versions = [
    makeVersion("R-1", "A", "LINKS", "A"),
  ];

  const result = await traverse(
    versions,
    makeQuery({ direction: "BIDIRECTIONAL" }),
  );

  assert.equal(result.length, 1);
  assert.equal(result[0]?.relationship.relationship.id, "R-1");
});

test("reads every adjacency page instead of silently truncating", async () => {
  const versions = [
    makeVersion("R-1", "A", "LINKS", "B"),
    makeVersion("R-2", "A", "LINKS", "C"),
    makeVersion("R-3", "A", "LINKS", "D"),
  ];

  const result = await traverse(
    versions,
    makeQuery(),
    { pageSize: 1 },
  );

  assert.equal(result.length, 3);
});

test("orders results deterministically by depth, UTF-8 ID, version, and direction", async () => {
  const versions = [
    makeVersion("R-z", "A", "LINKS", "B"),
    makeVersion("R-a", "A", "LINKS", "C"),
    makeVersion("\uE000", "A", "LINKS", "D"),
    makeVersion("\u{10000}", "A", "LINKS", "E"),
  ];

  const result = await traverse(versions);

  assert.deepEqual(
    result.map((item) => item.relationship.relationship.id),
    ["R-a", "R-z", "\uE000", "\u{10000}"],
  );
});

test("rejects an adjacency row returned under the wrong endpoint", async () => {
  const invalidRepository = {
    ...createRepository([]),
    getOutgoing: async () => ({
      items: [makeVersion("R-1", "WRONG", "LINKS", "B")],
    }),
  } as unknown as RelationshipRepository;

  await assert.rejects(
    collectRelationshipTraversalItems(
      invalidRepository,
      makeQuery(),
      context,
      timestamp,
    ),
    /wrong outgoing endpoint/,
  );
});

test("rejects a temporally ineligible version returned by the repository", async () => {
  const invalidRepository = createRepository(
    [
      makeVersion("R-1", "A", "LINKS", "B", {
        validFrom: "2030-01-01T00:00:00.000Z",
      }),
    ],
    { returnIneligibleTemporalRows: true },
  );

  await assert.rejects(
    collectRelationshipTraversalItems(
      invalidRepository,
      makeQuery(),
      context,
      timestamp,
    ),
    /temporally ineligible/,
  );
});

test("rejects a repeated adjacency cursor", async () => {
  const versions = [
    makeVersion("R-1", "A", "LINKS", "B"),
    makeVersion("R-2", "A", "LINKS", "C"),
  ];

  await assert.rejects(
    traverse(versions, makeQuery(), {
      pageSize: 1,
      repeatedCursor: true,
    }),
    /repeated an adjacency cursor/,
  );
});

test("rejects malformed adjacency cursors", async () => {
  const versions = [
    makeVersion("R-1", "A", "LINKS", "B"),
    makeVersion("R-2", "A", "LINKS", "C"),
  ];

  await assert.rejects(
    traverse(versions, makeQuery(), {
      pageSize: 1,
      invalidCursor: true,
    }),
    /malformed adjacency cursor/,
  );
});

test("rejects an invalid traversal query", async () => {
  await assert.rejects(
    collectRelationshipTraversalItems(
      createRepository([]),
      {
        startEntityId: id("A"),
        recordedAt: "not-a-date" as ISODateTime,
      },
      context,
      timestamp,
    ),
  );
});
