import type { PredicateDefinitionVersion, PredicateTemporalQuery } from "../../src/domain/predicate.js";
import type {
  OperationContext,
  PageRequest,
  PageResult,
} from "../../src/domain/primitives.js";
import type { PredicateRegistry } from "../../src/repositories/predicate-registry.js";

/** Compile-time fixture ensuring implementations satisfy the registry contract. */
export const predicateRegistryContract: PredicateRegistry = {
  async getActive(
    predicate: string,
    context: OperationContext,
  ): Promise<PredicateDefinitionVersion | null> {
    void predicate;
    void context;
    throw new Error("Compile-time contract fixture only");
  },

  async getAt(
    predicate: string,
    query: PredicateTemporalQuery,
    context: OperationContext,
  ): Promise<PredicateDefinitionVersion | null> {
    void predicate;
    void query;
    void context;
    throw new Error("Compile-time contract fixture only");
  },

  async getHistory(
    predicate: string,
    page: PageRequest,
    context: OperationContext,
  ): Promise<PageResult<PredicateDefinitionVersion>> {
    void predicate;
    void page;
    void context;
    throw new Error("Compile-time contract fixture only");
  },
};
