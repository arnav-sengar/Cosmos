import assert from "node:assert/strict";
import test from "node:test";

import type { RelationshipVersion } from "../src/domain/relationship-version.js";
import { isoDateTimeSchema } from "../src/validation/common.js";
import { compareUtf8Bytewise } from "../src/domain/temporal.js";

const at = (value: string) => isoDateTimeSchema.parse(value);

import {
  findBitemporalConflicts,
  planRelationshipCorrection,
  relationshipVersionContains,
  selectRelationshipVersionsAt,
  sortRelationshipHistory,
  temporalIntervalsOverlap,
} from "../src/services/relationship-temporal.js";

import {
  relationshipCorrectionSchema,
  relationshipVersionSchema,
} from "../src/validation/relationship-version.js";

const relationship = {
  id: "R-001",
  subjectId: "E-EARTH",
  predicate: "ORBITS",
  objectId: "E-SUN",
} as const;

const replacement = {
  ...relationship,
  objectId: "E-STAR-2",
} as const;

const versionInput = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  relationship,
  version: 1,
  validFrom: "2020-01-01T00:00:00Z",
  recordedFrom: "2020-01-01T00:00:00Z",
  predicateDefinitionVersion: 1,
  correctionReason: "Initial record",
  provenanceRef: "source:initial",
  createdAt: "2020-01-01T00:00:00Z",
  createdBy: "system",
  ...overrides,
});

const version = (
  overrides: Record<string, unknown> = {},
): RelationshipVersion =>
  relationshipVersionSchema.parse(versionInput(overrides));

const correctionInput = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  relationshipId: "R-001",
  replacement,
  validFrom: "2022-01-01T00:00:00Z",
  validTo: "2024-01-01T00:00:00Z",
  recordedAt: "2026-01-01T00:00:00Z",
  predicateDefinitionVersion: 2,
  correctionReason: "Corrected astronomical relationship",
  provenanceRef: "source:correction-001",
  createdBy: "researcher-001",
  ...overrides,
});

const correction = (
  overrides: Record<string, unknown> = {},
) => relationshipCorrectionSchema.parse(correctionInput(overrides));

test("accepts a valid immutable relationship version", () => {
  const result = version();

  assert.equal(result.relationship.id, "R-001");
  assert.equal(result.version, 1);
  assert.equal("validTo" in result, false);
  assert.equal("recordedTo" in result, false);
});

test("rejects invalid valid-time and recorded-time intervals", () => {
  assert.equal(
    relationshipVersionSchema.safeParse(
      versionInput({
        validTo: "2020-01-01T00:00:00Z",
      }),
    ).success,
    false,
  );

  assert.equal(
    relationshipVersionSchema.safeParse(
      versionInput({
        recordedTo: "2020-01-01T00:00:00Z",
      }),
    ).success,
    false,
  );
});

test("rejects unknown relationship-version properties", () => {
  assert.equal(
    relationshipVersionSchema.safeParse({
      ...version(),
      transactionTime: "2026-01-01T00:00:00Z",
    }).success,
    false,
  );
});

test("correction requires replacement to retain the logical relationship ID", () => {
  assert.equal(
    relationshipCorrectionSchema.safeParse(
      correctionInput({
        replacement: {
          ...replacement,
          id: "R-DIFFERENT",
        },
      }),
    ).success,
    false,
  );
});

test("replacement correction requires a predicate-definition version", () => {
  assert.equal(
    relationshipCorrectionSchema.safeParse(
      correctionInput({
        predicateDefinitionVersion: undefined,
      }),
    ).success,
    false,
  );
});

test("correction-away may omit a replacement and predicate-definition version", () => {
  const result = relationshipCorrectionSchema.parse(
    correction({
      replacement: null,
      predicateDefinitionVersion: undefined,
    }),
  );

  assert.equal(result.replacement, null);
  assert.equal("predicateDefinitionVersion" in result, false);
});

test("half-open intervals do not overlap when one ends where another begins", () => {
  assert.equal(
    temporalIntervalsOverlap(
      at("2020-01-01T00:00:00Z"),
      at("2021-01-01T00:00:00Z"),
      at("2021-01-01T00:00:00Z"),
      undefined,
    ),
    false,
  );
});

test("bitemporal conflicts require overlap in both dimensions", () => {
  const validOverlapRecordedDisjoint = [
    version({
      version: 1,
      validFrom: "2020-01-01T00:00:00Z",
      validTo: "2025-01-01T00:00:00Z",
      recordedFrom: "2020-01-01T00:00:00Z",
      recordedTo: "2022-01-01T00:00:00Z",
    }),
    version({
      version: 2,
      validFrom: "2021-01-01T00:00:00Z",
      recordedFrom: "2022-01-01T00:00:00Z",
    }),
  ];

  assert.equal(
    findBitemporalConflicts(validOverlapRecordedDisjoint).length,
    0,
  );

  const recordedOverlapValidDisjoint = [
    version({
      version: 1,
      validFrom: "2020-01-01T00:00:00Z",
      validTo: "2021-01-01T00:00:00Z",
      recordedFrom: "2020-01-01T00:00:00Z",
    }),
    version({
      version: 2,
      validFrom: "2021-01-01T00:00:00Z",
      recordedFrom: "2020-06-01T00:00:00Z",
    }),
  ];

  assert.equal(
    findBitemporalConflicts(recordedOverlapValidDisjoint).length,
    0,
  );
});

test("detects conflicts when both temporal dimensions overlap", () => {
  const conflicting = [
    version({
      version: 1,
      validFrom: "2020-01-01T00:00:00Z",
      recordedFrom: "2020-01-01T00:00:00Z",
    }),
    version({
      version: 2,
      validFrom: "2021-01-01T00:00:00Z",
      recordedFrom: "2021-01-01T00:00:00Z",
    }),
  ];

  assert.equal(findBitemporalConflicts(conflicting).length, 1);
});

test("correction closes the old record and creates left, corrected, and right segments", () => {
  const original = version({
    validFrom: "2020-01-01T00:00:00Z",
    validTo: "2030-01-01T00:00:00Z",
  });

  const plan = planRelationshipCorrection(
    [original],
    correction(),
  );

  assert.equal(plan.closeVersions.length, 1);
  assert.equal(plan.closeVersions[0]?.recordedTo, "2026-01-01T00:00:00Z");

  assert.equal(plan.createVersions.length, 3);

  const [left, corrected, right] = plan.createVersions;

  assert.equal(left?.validFrom, "2020-01-01T00:00:00Z");
  assert.equal(left?.validTo, "2022-01-01T00:00:00Z");
  assert.equal(left?.relationship.objectId, "E-SUN");

  assert.equal(corrected?.validFrom, "2022-01-01T00:00:00Z");
  assert.equal(corrected?.validTo, "2024-01-01T00:00:00Z");
  assert.equal(corrected?.relationship.objectId, "E-STAR-2");
  assert.equal(corrected?.predicateDefinitionVersion, 2);

  assert.equal(right?.validFrom, "2024-01-01T00:00:00Z");
  assert.equal(right?.validTo, "2030-01-01T00:00:00Z");
  assert.equal(right?.relationship.objectId, "E-SUN");

  assert.deepEqual(
    plan.createVersions.map((item) => item.version),
    [2, 3, 4],
  );
});

test("correction preserves prior recorded history without mutating input", () => {
  const original = version({
    validFrom: "2020-01-01T00:00:00Z",
    validTo: "2030-01-01T00:00:00Z",
  });

  const plan = planRelationshipCorrection([original], correction());

  assert.equal(original.recordedTo, undefined);
  assert.equal(plan.closeVersions[0]?.recordedTo, "2026-01-01T00:00:00Z");
  assert.equal(plan.closeVersions[0]?.version, original.version);
});

test("correction-away closes the old segment without creating a replacement in the corrected interval", () => {
  const original = version({
    validFrom: "2020-01-01T00:00:00Z",
    validTo: "2030-01-01T00:00:00Z",
  });

  const plan = planRelationshipCorrection(
    [original],
    correction({
      replacement: null,
      predicateDefinitionVersion: undefined,
    }),
  );

  assert.equal(plan.closeVersions.length, 1);
  assert.equal(plan.createVersions.length, 2);

  assert.deepEqual(
    plan.createVersions.map((item) => [
      item.validFrom,
      item.validTo,
    ]),
    [
      ["2020-01-01T00:00:00Z", "2022-01-01T00:00:00Z"],
      ["2024-01-01T00:00:00Z", "2030-01-01T00:00:00Z"],
    ],
  );
});

test("retroactive correction uses valid time independently of recorded time", () => {
  const original = version({
    validFrom: "2020-01-01T00:00:00Z",
    recordedFrom: "2025-01-01T00:00:00Z",
  });

  const plan = planRelationshipCorrection(
    [original],
    correction({
      validFrom: "2021-01-01T00:00:00Z",
      validTo: "2022-01-01T00:00:00Z",
      recordedAt: "2026-01-01T00:00:00Z",
    }),
  );

  assert.equal(plan.closeVersions[0]?.recordedTo, "2026-01-01T00:00:00Z");
  assert.equal(plan.createVersions[0]?.validFrom, "2020-01-01T00:00:00Z");
  assert.equal(plan.createVersions[0]?.validTo, "2021-01-01T00:00:00Z");
  assert.equal(plan.createVersions[0]?.recordedFrom, "2026-01-01T00:00:00Z");
});

test("correction does not close unrelated valid-time segments", () => {
  const first = version({
    version: 1,
    validFrom: "2010-01-01T00:00:00Z",
    validTo: "2015-01-01T00:00:00Z",
  });

  const second = version({
    version: 2,
    validFrom: "2020-01-01T00:00:00Z",
    validTo: "2030-01-01T00:00:00Z",
    recordedFrom: "2021-01-01T00:00:00Z",
  });

  const plan = planRelationshipCorrection(
    [first, second],
    correction(),
  );

  assert.equal(plan.closeVersions.length, 1);
  assert.equal(plan.closeVersions[0]?.version, 2);
});

test("rejects correction timestamps that do not follow superseded recorded versions", () => {
  const original = version({
    recordedFrom: "2026-01-01T00:00:00Z",
  });

  assert.throws(
    () =>
      planRelationshipCorrection(
        [original],
        correction({
          recordedAt: "2026-01-01T00:00:00Z",
        }),
      ),
    /recordedAt must be later/,
  );
});

test("rejects history containing a different logical relationship ID", () => {
  const other = version({
    relationship: {
      ...relationship,
      id: "R-OTHER",
    },
  });

  assert.throws(
    () => planRelationshipCorrection([other], correction()),
    /different logical relationship ID/,
  );
});

test("reconstructs a relationship at an explicit bitemporal point", () => {
  const oldVersion = version({
    version: 1,
    validFrom: "2020-01-01T00:00:00Z",
    validTo: "2030-01-01T00:00:00Z",
    recordedFrom: "2020-01-01T00:00:00Z",
    recordedTo: "2026-01-01T00:00:00Z",
  });

  const newVersion = version({
    version: 2,
    relationship: replacement,
    validFrom: "2022-01-01T00:00:00Z",
    validTo: "2024-01-01T00:00:00Z",
    recordedFrom: "2026-01-01T00:00:00Z",
  });

  assert.equal(
    relationshipVersionContains(
      oldVersion,
      at("2023-01-01T00:00:00Z"),
      at("2025-01-01T00:00:00Z"),
    ),
    true,
  );

  const historical = selectRelationshipVersionsAt(
    [oldVersion, newVersion],
    {
      validAt: at("2023-01-01T00:00:00Z"),
      recordedAt: at("2025-01-01T00:00:00Z"),
    },
    at("2026-01-01T00:00:00Z"),
  );

  assert.equal(historical.length, 1);
  assert.equal(historical[0]?.relationship.objectId, "E-SUN");
});

test("history sorts by recorded time descending and then version descending", () => {
  const history = [
    version({
      version: 1,
      recordedFrom: "2020-01-01T00:00:00Z",
    }),
    version({
      version: 3,
      recordedFrom: "2022-01-01T00:00:00Z",
    }),
    version({
      version: 2,
      recordedFrom: "2022-01-01T00:00:00Z",
    }),
  ];

  const sorted = sortRelationshipHistory(history);

  assert.deepEqual(
    sorted.map((item) => item.version),
    [3, 2, 1],
  );
});






test("correction can span and replace multiple existing valid-time segments", () => {
  const first = version({
    version: 1,
    validFrom: "2020-01-01T00:00:00Z",
    validTo: "2022-01-01T00:00:00Z",
  });

  const second = version({
    version: 2,
    validFrom: "2024-01-01T00:00:00Z",
    validTo: "2030-01-01T00:00:00Z",
  });

  const plan = planRelationshipCorrection(
    [first, second],
    correction({
      validFrom: "2021-01-01T00:00:00Z",
      validTo: "2025-01-01T00:00:00Z",
    }),
  );

  assert.equal(plan.closeVersions.length, 2);
  assert.equal(plan.createVersions.length, 3);

  assert.deepEqual(
    plan.createVersions.map((item) => [
      item.validFrom,
      item.validTo,
      item.relationship.objectId,
    ]),
    [
      ["2020-01-01T00:00:00Z", "2021-01-01T00:00:00Z", "E-SUN"],
      ["2021-01-01T00:00:00Z", "2025-01-01T00:00:00Z", "E-STAR-2"],
      ["2025-01-01T00:00:00Z", "2030-01-01T00:00:00Z", "E-SUN"],
    ],
  );
});

test("open-ended correction preserves the earlier valid-time segment", () => {
  const original = version({
    validFrom: "2020-01-01T00:00:00Z",
  });

  const plan = planRelationshipCorrection(
    [original],
    correction({
      validFrom: "2025-01-01T00:00:00Z",
      validTo: undefined,
      replacement: null,
      predicateDefinitionVersion: undefined,
    }),
  );

  assert.equal(plan.closeVersions.length, 1);
  assert.equal(plan.createVersions.length, 1);
  assert.equal(plan.createVersions[0]?.validFrom, "2020-01-01T00:00:00Z");
  assert.equal(plan.createVersions[0]?.validTo, "2025-01-01T00:00:00Z");
});

test("correction inside a valid-time gap does not close unrelated segments", () => {
  const first = version({
    version: 1,
    validFrom: "2020-01-01T00:00:00Z",
    validTo: "2022-01-01T00:00:00Z",
  });

  const second = version({
    version: 2,
    validFrom: "2024-01-01T00:00:00Z",
    validTo: "2030-01-01T00:00:00Z",
  });

  const plan = planRelationshipCorrection(
    [first, second],
    correction({
      validFrom: "2022-01-01T00:00:00Z",
      validTo: "2024-01-01T00:00:00Z",
    }),
  );

  assert.equal(plan.closeVersions.length, 0);
  assert.equal(plan.createVersions.length, 1);
  assert.equal(plan.createVersions[0]?.validFrom, "2022-01-01T00:00:00Z");
  assert.equal(plan.createVersions[0]?.validTo, "2024-01-01T00:00:00Z");
});

test("UTF-8 bytewise ordering differs correctly from UTF-16 ordering", () => {
  const supplementary = "\u{10000}";
  const privateUse = "\uE000";

  assert.equal(supplementary < privateUse, true);
  assert.equal(compareUtf8Bytewise(privateUse, supplementary), -1);
  assert.equal(compareUtf8Bytewise("A", "a"), -1);
  assert.equal(compareUtf8Bytewise("same", "same"), 0);
});

test("correction rejects version counter overflow", () => {
  const highestVersion = version({
    version: Number.MAX_SAFE_INTEGER,
    validFrom: "2020-01-01T00:00:00Z",
  });

  assert.throws(
    () =>
      planRelationshipCorrection(
        [highestVersion],
        correction({
          validFrom: "2022-01-01T00:00:00Z",
          validTo: "2024-01-01T00:00:00Z",
        }),
      ),
    /version counter exceeded safe integer range/,
  );
});
