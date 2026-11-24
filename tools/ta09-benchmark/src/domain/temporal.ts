/**
 * Shared deterministic temporal and identifier comparison utilities.
 */

export function compareIsoDateTimes(left: string, right: string): number {
  const wholeSeconds = (value: string): number =>
    Date.parse(value.replace(/\.\d+Z$/, "Z"));

  const leftBase = wholeSeconds(left);
  const rightBase = wholeSeconds(right);

  if (leftBase !== rightBase) {
    return leftBase < rightBase ? -1 : 1;
  }

  const fraction = (value: string): string =>
    (value.match(/\.(\d+)Z$/)?.[1] ?? "").replace(/0+$/, "");

  const leftFraction = fraction(left);
  const rightFraction = fraction(right);
  const precision = Math.max(leftFraction.length, rightFraction.length);

  const normalizedLeft = leftFraction.padEnd(precision, "0");
  const normalizedRight = rightFraction.padEnd(precision, "0");

  if (normalizedLeft === normalizedRight) {
    return 0;
  }

  return normalizedLeft < normalizedRight ? -1 : 1;
}

/**
 * Case-sensitive UTF-8 bytewise string ordering.
 *
 * This deliberately differs from JavaScript's UTF-16 code-unit ordering
 * for some supplementary Unicode characters.
 */
export function compareUtf8Bytewise(left: string, right: string): number {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const sharedLength = Math.min(leftBytes.length, rightBytes.length);

  for (let index = 0; index < sharedLength; index += 1) {
    const leftByte = leftBytes[index];
    const rightByte = rightBytes[index];

    if (leftByte === undefined || rightByte === undefined) {
      continue;
    }

    if (leftByte !== rightByte) {
      return leftByte < rightByte ? -1 : 1;
    }
  }

  if (leftBytes.length === rightBytes.length) {
    return 0;
  }

  return leftBytes.length < rightBytes.length ? -1 : 1;
}
