# TA-09 Benchmark Runner (B7–B8)

This package contains provider-neutral persistence contracts and the
benchmark orchestration/reporting layer. It deliberately does not ship
PostgreSQL, Firestore, or hybrid database implementations.

## B7 — Benchmark runner and adapter integration

`src/benchmark/benchmark-runner.ts` runs one registered workload against one
`BenchmarkAdapter`.

A workload supplies:

- A deterministic seed-input factory.
- A deterministic query factory.
- A correctness validator.
- A JSON-compatible result normalizer for cross-adapter comparison.
- The persistence capabilities it requires.

The runner performs the following lifecycle:

1. Validate the run configuration and workload identity.
2. Initialize the adapter and assess its health.
3. Validate its declared capability envelope.
4. Skip cleanly when a required capability is unsupported.
5. Reset and seed the adapter.
6. Execute a correctness preflight.
7. Execute warm-up operations (not included in latency samples).
8. Reset and seed again.
9. Replay the same preflight query and verify deterministic reset/reseed behavior.
10. Execute and validate measured operations, timing only `executeQuery`.
11. Assess final health and dispose the adapter.

A limited capability is allowed, but its declared limitations are retained
in the result. Unsupported required capabilities cause a skipped result,
not a misleading performance number. A correctness failure invalidates the
run. Disposal is attempted whenever initialization was attempted; cleanup
failures are reported separately from the primary failure.

The runner uses a seeded xorshift32 generator and a monotonic clock. The same
configuration, workload implementation and seed produce the same generated
seed input and query sequence. The PRNG is for reproducibility, not security.

## B8 — Cross-adapter validation and reporting

`src/runner/cross-adapter-runner.ts` executes one workload sequentially
against a set of named adapters using the same run configuration. Sequential
execution avoids intentional contention between adapters.

At least two uniquely named adapters are required. The report includes:

- Each adapter's complete B7 result.
- A capability matrix for all eleven declared persistence dimensions.
- A semantic comparison against the first successfully completed adapter.
- Per-adapter mismatch indexes for measured normalized results.
- `matched`, `mismatched`, or `incomplete` overall status.

Comparisons use the workload's normalized JSON values, with object keys
canonicalized and array order preserved. Provider-specific result metadata
should be removed by the normalizer when it is not part of the semantic
contract. An adapter that skips or fails makes the comparison incomplete;
it is never treated as a successful match.

## Registering a workload

Create a `BenchmarkWorkload<TSeedInput, TQuery, TResult>` with stable IDs and
explicit semantics. Its `validateResult` should assert the expected logical
behavior, not merely that a provider returned a value. Its
`normalizeResult` should retain every field whose semantic equivalence
matters across adapters.

Adapter metadata in reports is a caller-supplied, JSON-safe snapshot; do not include credentials or secrets. The package currently contains contract tests and mock adapters only.
Actual PostgreSQL, Firestore, and hybrid comparisons remain unverified until
those concrete adapters and their provider environments are implemented.
