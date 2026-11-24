import type { Entity } from "../../src/domain/entity.js";
import type { EntityLifecycleTemporalQuery } from "../../src/repositories/entity-lifecycle-reader.js";
import type { EntityReferenceResolver } from "../../src/repositories/entity-reference-resolver.js";
import type {
  CanonicalId,
  OperationContext,
} from "../../src/domain/primitives.js";

export const entityReferenceResolverContract: EntityReferenceResolver = {
  async resolveForWrite(
    entityId: CanonicalId,
    context: OperationContext,
  ): Promise<Entity> {
    void entityId;
    void context;

    throw new Error("Compile-time contract fixture only");
  },

  async resolveForHistory(
    entityId: CanonicalId,
    query: EntityLifecycleTemporalQuery,
    context: OperationContext,
  ): Promise<Entity> {
    void entityId;
    void query;
    void context;

    throw new Error("Compile-time contract fixture only");
  },
};
