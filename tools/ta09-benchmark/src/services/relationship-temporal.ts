import { compareIsoDateTimes, compareUtf8Bytewise } from "../domain/temporal.js";
/**
 * Provider-neutral bitemporal relationship operations.
 *
 * This module contains deterministic temporal logic only.
 * It performs no persistence and makes no transaction guarantees.
 */

import type {
  ISODateTime,
  RecordVersion,
} from "../domain/primitives.js";

import type {
  RelationshipCorrection,
  RelationshipCorrectionPlan,
  RelationshipTemporalQuery,
  RelationshipVersion,
} from "../domain/relationship-version.js";

import {
  relationshipCorrectionSchema,
  relationshipVersionSchema,
} from "../validation/relationship-version.js";

function isBeforeEnd(
  start: ISODateTime,
  end: ISODateTime | undefined,
): boolean {
  return end === undefined || compareIsoDateTimes(start, end) < 0;
}

/** Whether two half-open intervals overlap. */
export function temporalIntervalsOverlap(
  leftFrom: ISODateTime,
  leftTo: ISODateTime | undefined,
  rightFrom: ISODateTime,
  rightTo: ISODateTime | undefined,
): boolean {
  return (
    isBeforeEnd(leftFrom, rightTo) &&
    isBeforeEnd(rightFrom, leftTo)
  );
}

/**
 * Returns pairs that conflict in both temporal dimensions.
 *
 * Versions are compared only when they belong to the same logical
 * relationship. Overlap in just one temporal dimension is permitted.
 */
export function findBitemporalConflicts(
  versions: readonly RelationshipVersion[],
): readonly (readonly [RelationshipVersion, RelationshipVersion])[] {
  const conflicts: (readonly [
    RelationshipVersion,
    RelationshipVersion,
  ])[] = [];

  for (let leftIndex = 0; leftIndex < versions.length; leftIndex += 1) {
    const left = versions[leftIndex];

    if (left === undefined) {
      continue;
    }

    for (
      let rightIndex = leftIndex + 1;
      rightIndex < versions.length;
      rightIndex += 1
    ) {
      const right = versions[rightIndex];

      if (right === undefined) {
        continue;
      }

      if (left.relationship.id !== right.relationship.id) {
        continue;
      }

      const validOverlap = temporalIntervalsOverlap(
        left.validFrom,
        left.validTo,
        right.validFrom,
        right.validTo,
      );

      const recordedOverlap = temporalIntervalsOverlap(
        left.recordedFrom,
        left.recordedTo,
        right.recordedFrom,
        right.recordedTo,
      );

      if (validOverlap && recordedOverlap) {
        conflicts.push([left, right]);
      }
    }
  }

  return conflicts;
}

/** Throws when two versions conflict in both temporal dimensions. */
export function assertNoBitemporalConflicts(
  versions: readonly RelationshipVersion[],
): void {
  if (findBitemporalConflicts(versions).length > 0) {
    throw new RangeError(
      "Relationship versions overlap in both valid time and recorded time.",
    );
  }
}

/** Whether a version contains a point in both temporal dimensions. */
export function relationshipVersionContains(
  version: RelationshipVersion,
  validAt: ISODateTime,
  recordedAt: ISODateTime,
): boolean {
  const validContains =
    compareIsoDateTimes(version.validFrom, validAt) <= 0 &&
    (version.validTo === undefined ||
      compareIsoDateTimes(validAt, version.validTo) < 0);

  const recordedContains =
    compareIsoDateTimes(version.recordedFrom, recordedAt) <= 0 &&
    (version.recordedTo === undefined ||
      compareIsoDateTimes(recordedAt, version.recordedTo) < 0);

  return validContains && recordedContains;
}

/**
 * Reconstructs the relationship state at a bitemporal point.
 *
 * The caller supplies defaultValidAt to make the "current valid time"
 * reference explicit and deterministic when query.validAt is omitted.
 */
export function selectRelationshipVersionsAt(
  versions: readonly RelationshipVersion[],
  query: RelationshipTemporalQuery,
  defaultValidAt: ISODateTime,
): readonly RelationshipVersion[] {
  const validAt = query.validAt ?? defaultValidAt;

  const selected = versions.filter((version) =>
    relationshipVersionContains(version, validAt, query.recordedAt),
  );

  return [...selected].sort((left, right) => {
    if (left.relationship.id !== right.relationship.id) {
      return compareUtf8Bytewise(left.relationship.id, right.relationship.id);
    }

    return right.version - left.version;
  });
}

/** Newest recorded version first, then highest version first. */
export function sortRelationshipHistory(
  versions: readonly RelationshipVersion[],
): readonly RelationshipVersion[] {
  return [...versions].sort((left, right) => {
    const recordedOrder = compareIsoDateTimes(
      right.recordedFrom,
      left.recordedFrom,
    );

    if (recordedOrder !== 0) {
      return recordedOrder;
    }

    return right.version - left.version;
  });
}

function overlapsCorrection(
  version: RelationshipVersion,
  correction: RelationshipCorrection,
): boolean {
  return temporalIntervalsOverlap(
    version.validFrom,
    version.validTo,
    correction.validFrom,
    correction.validTo,
  );
}

function nextVersion(value: number): RecordVersion {
  if (!Number.isSafeInteger(value + 1)) {
    throw new RangeError("Relationship version counter exceeded safe integer range.");
  }

  return (value + 1) as RecordVersion;
}

/**
 * Plans an immutable correction to one logical relationship.
 *
 * Existing overlapping recorded intervals are closed at recordedAt.
 * Their unaffected valid-time portions are re-created as new segments.
 * The corrected interval is inserted only when replacement is non-null.
 *
 * This function does not persist anything. B4 must apply the returned
 * close/create operations atomically.
 */
export function planRelationshipCorrection(
  existingHistory: readonly RelationshipVersion[],
  correctionInput: RelationshipCorrection,
): RelationshipCorrectionPlan {
  const correction = relationshipCorrectionSchema.parse(correctionInput);

  const history = existingHistory.map((version) =>
    relationshipVersionSchema.parse(version),
  );

  for (const version of history) {
    if (version.relationship.id !== correction.relationshipId) {
      throw new RangeError(
        "Correction history contains a different logical relationship ID.",
      );
    }
  }

  const seenVersions = new Set<number>();

  for (const version of history) {
    if (seenVersions.has(version.version)) {
      throw new RangeError("Relationship version numbers must be unique.");
    }

    seenVersions.add(version.version);
  }

  assertNoBitemporalConflicts(history);

  const currentVersions = history.filter(
    (version) => version.recordedTo === undefined,
  );

  let highestVersion = history.reduce(
    (highest, version) => Math.max(highest, version.version),
    0,
  );

  const closeVersions: RelationshipVersion[] = [];
  const createVersions: RelationshipVersion[] = [];

  for (const current of currentVersions) {
    if (!overlapsCorrection(current, correction)) {
      continue;
    }

    if (
      compareIsoDateTimes(correction.recordedAt, current.recordedFrom) <= 0
    ) {
      throw new RangeError(
        "Correction recordedAt must be later than every superseded recordedFrom.",
      );
    }

    closeVersions.push(
      relationshipVersionSchema.parse({
        ...current,
        recordedTo: correction.recordedAt,
      }),
    );

    const createPreservedSegment = (
      validFrom: ISODateTime,
      validTo: ISODateTime | undefined,
    ): void => {
      highestVersion = nextVersion(highestVersion);

      createVersions.push(
        relationshipVersionSchema.parse({
          relationship: current.relationship,
          version: highestVersion,
          validFrom,
          ...(validTo === undefined ? {} : { validTo }),
          recordedFrom: correction.recordedAt,
          predicateDefinitionVersion:
            current.predicateDefinitionVersion,
          correctionReason: correction.correctionReason,
          provenanceRef: correction.provenanceRef,
          createdAt: correction.recordedAt,
          createdBy: correction.createdBy,
        }),
      );
    };

    // Preserve the portion before the corrected interval.
    if (
      compareIsoDateTimes(current.validFrom, correction.validFrom) < 0
    ) {
      createPreservedSegment(
        current.validFrom,
        correction.validFrom,
      );
    }

    // Preserve the portion after the corrected interval.
    if (
      correction.validTo !== undefined &&
      (current.validTo === undefined ||
        compareIsoDateTimes(correction.validTo, current.validTo) < 0)
    ) {
      createPreservedSegment(
        correction.validTo,
        current.validTo,
      );
    }
  }

  // A non-null replacement establishes the corrected segment.
  if (correction.replacement !== null) {
    const predicateDefinitionVersion =
      correction.predicateDefinitionVersion;

    if (predicateDefinitionVersion === undefined) {
      // The correction schema already rejects this case.
      throw new RangeError(
        "Replacement requires a predicate-definition version.",
      );
    }

    highestVersion = nextVersion(highestVersion);

    createVersions.push(
      relationshipVersionSchema.parse({
        relationship: correction.replacement,
        version: highestVersion,
        validFrom: correction.validFrom,
        ...(correction.validTo === undefined
          ? {}
          : { validTo: correction.validTo }),
        recordedFrom: correction.recordedAt,
        predicateDefinitionVersion,
        correctionReason: correction.correctionReason,
        provenanceRef: correction.provenanceRef,
        createdAt: correction.recordedAt,
        createdBy: correction.createdBy,
      }),
    );
  }

  const closedHistory = history.map((version) => {
    const closed = closeVersions.find(
      (candidate) =>
        candidate.relationship.id === version.relationship.id &&
        candidate.version === version.version,
    );

    return closed ?? version;
  });

  // Version numbers follow the chronological order of the resulting segments.
  // This keeps history deterministic even when preserved segments were
  // discovered before the corrected segment.
  let assignedVersion = history.reduce(
    (highest, version) => Math.max(highest, version.version),
    0,
  );

  const orderedCreateVersions = [...createVersions]
    .sort((left, right) => {
      const validTimeOrder = compareIsoDateTimes(
        left.validFrom,
        right.validFrom,
      );

      return validTimeOrder !== 0
        ? validTimeOrder
        : left.version - right.version;
    })
    .map((version) => {
      assignedVersion = nextVersion(assignedVersion);

      return relationshipVersionSchema.parse({
        ...version,
        version: assignedVersion,
      });
    });

  const resultingHistory = [...closedHistory, ...orderedCreateVersions];

  assertNoBitemporalConflicts(resultingHistory);

  return {
    closeVersions,
    createVersions: orderedCreateVersions,
  };
}
