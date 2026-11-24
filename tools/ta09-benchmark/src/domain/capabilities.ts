/**
 * Provider-neutral capability declarations for TA-09 persistence adapters.
 *
 * Declarations make provider differences observable. They describe adapter
 * guarantees; they do not replace behavioral conformance tests.
 */

/** Support level reported by a persistence adapter. */
export type CapabilitySupport =
  | "supported"
  | "limited"
  | "unsupported";

/**
 * Declaration for one persistence capability.
 *
 * A limited capability must include at least one explicit limitation.
 * Unsupported capabilities must not be silently emulated by an adapter.
 */
export type CapabilityDeclaration =
  | {
      readonly support: "supported";
    }
  | {
      readonly support: "limited";
      readonly limitations: readonly [string, ...string[]];
    }
  | {
      readonly support: "unsupported";
      readonly limitations?: readonly string[];
    };

/**
 * Observable persistence capabilities required by the approved TA-09
 * provider-neutral contract.
 *
 * Capability names intentionally remain aligned with the approved
 * specification. Provider-specific details will be added only when their
 * semantics and conformance expectations have been defined.
 */
export interface PersistenceCapabilities {
  readonly transactions: CapabilityDeclaration;
  readonly isolationLevels: CapabilityDeclaration;
  readonly optimisticVersioning: CapabilityDeclaration;
  readonly conditionalWrites: CapabilityDeclaration;
  readonly cursorPagination: CapabilityDeclaration;
  readonly historicalQueries: CapabilityDeclaration;
  readonly relationshipTraversal: CapabilityDeclaration;
  readonly idempotentOperations: CapabilityDeclaration;
  readonly backupRecovery: CapabilityDeclaration;
  readonly readAfterWrite: CapabilityDeclaration;
  readonly crossStoreConsistency: CapabilityDeclaration;
}

/** Names of all capabilities required by the TA-09 contract. */
export type PersistenceCapabilityName =
  keyof PersistenceCapabilities;