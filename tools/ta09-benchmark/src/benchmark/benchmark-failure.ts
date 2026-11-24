/** Failure categories deliberately separate adapter faults from bad results. */
export type BenchmarkFailureKind =
  | "configuration"
  | "workload"
  | "adapter-lifecycle"
  | "adapter-operation"
  | "correctness"
  | "health"
  | "measurement";

export interface BenchmarkFailure {
  readonly kind: BenchmarkFailureKind;
  readonly phase: string;
  readonly message: string;
}

export interface CleanupFailure {
  readonly phase: "dispose";
  readonly message: string;
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  try {
    return String(error);
  } catch {
    return "An unknown non-Error value was thrown.";
  }
}
