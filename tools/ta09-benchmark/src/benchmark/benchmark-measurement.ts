import type { JsonValue } from "./benchmark-workload.js";

/**
 * Convert a normalized result into deterministic JSON text.
 * Object keys are sorted; array order is preserved.
 */
export function stableSerialize(value: JsonValue): string {
  const ancestors = new Set<object>();

  const visit = (current: JsonValue): string => {
    if (
      current === null ||
      typeof current === "string" ||
      typeof current === "boolean"
    ) {
      return JSON.stringify(current);
    }

    if (typeof current === "number") {
      if (!Number.isFinite(current)) {
        throw new TypeError("Normalized results cannot contain non-finite numbers.");
      }

      return JSON.stringify(current);
    }

    if (Array.isArray(current)) {
      if (ancestors.has(current)) {
        throw new TypeError("Normalized results cannot contain circular references.");
      }

      ancestors.add(current);
      const entries: string[] = [];

      for (let index = 0; index < current.length; index += 1) {
        if (!(index in current)) {
          throw new TypeError("Normalized result arrays cannot contain sparse entries.");
        }

        entries.push(visit(current[index] as JsonValue));
      }

      ancestors.delete(current);
      return `[${entries.join(",")}]`;
    }

    if (typeof current === "object") {
      if (ancestors.has(current)) {
        throw new TypeError("Normalized results cannot contain circular references.");
      }

      const prototype = Object.getPrototypeOf(current);
      if (prototype !== Object.prototype && prototype !== null) {
        throw new TypeError("Normalized result objects must be plain JSON objects.");
      }

      if (Object.getOwnPropertySymbols(current).length > 0) {
        throw new TypeError("Normalized results cannot contain symbol keys.");
      }

      ancestors.add(current);
      const record = current as Readonly<Record<string, JsonValue>>;
      const keys = Object.keys(record).sort();
      const serialized = `{${keys
        .map((key) => {
          const entry = record[key];
          if (entry === undefined) {
            throw new TypeError("Normalized results cannot contain undefined object values.");
          }
          return `${JSON.stringify(key)}:${visit(entry)}`;
        })
        .join(",")}}`;
      ancestors.delete(current);
      return serialized;
    }

    throw new TypeError("Normalized results must be JSON-compatible values.");
  };

  return visit(value);
}

export function normalizedResultsEqual(
  left: readonly JsonValue[],
  right: readonly JsonValue[],
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => {
      const other = right[index];
      return other !== undefined && stableSerialize(value) === stableSerialize(other);
    })
  );
}
