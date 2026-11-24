/**
 * Small deterministic PRNG for reproducible benchmark workloads.
 *
 * This is not a cryptographic random generator. It exists only to make
 * generated benchmark data and query sequences repeatable.
 */

export interface SeededRandom {
  /** Return a deterministic floating-point value in [0, 1). */
  next(): number;
  /** Return a deterministic integer in [0, maxExclusive). */
  nextInt(maxExclusive: number): number;
}

const UINT32_RANGE = 0x1_0000_0000;

/** Create a reproducible xorshift32 generator from an unsigned 32-bit seed. */
export function createSeededRandom(seed: number): SeededRandom {
  if (
    !Number.isInteger(seed) ||
    seed < 0 ||
    seed >= UINT32_RANGE
  ) {
    throw new RangeError("Seed must be an unsigned 32-bit integer.");
  }

  // xorshift32 has an absorbing zero state, so map zero to a fixed non-zero seed.
  let state = seed === 0 ? 0x6d2b79f5 : seed >>> 0;

  const next = (): number => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / UINT32_RANGE;
  };

  return Object.freeze({
    next,

    nextInt(maxExclusive: number): number {
      if (
        !Number.isSafeInteger(maxExclusive) ||
        maxExclusive <= 0 ||
        maxExclusive > UINT32_RANGE
      ) {
        throw new RangeError(
          "maxExclusive must be a positive integer no greater than 2^32.",
        );
      }

      return Math.floor(next() * maxExclusive);
    },
  });
}

/** Derive independent deterministic streams without relying on Math.random. */
export function deriveSeed(seed: number, stream: number): number {
  if (
    !Number.isInteger(seed) ||
    seed < 0 ||
    seed >= UINT32_RANGE ||
    !Number.isInteger(stream) ||
    stream < 0 ||
    stream >= UINT32_RANGE
  ) {
    throw new RangeError("Seed and stream must be unsigned 32-bit integers.");
  }

  let value = (seed ^ stream) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return (value ^ (value >>> 16)) >>> 0;
}
