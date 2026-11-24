/**
 * Compile-time conformance fixture for EntityRepository.
 *
 * This fixture verifies that a representative implementation satisfies
 * every repository method and return type. It is not a behavioral test
 * and does not represent a database adapter.
 */

import type { EntityRepository } from "../../src/repositories/entity-repository.js";
import type { Entity } from "../../src/domain/entity.js";
import type {
  RecordVersion,
  VersionedRecord,
} from "../../src/domain/primitives.js";

/**
 * Ambient declarations provide the branded values needed for type checking
 * without constructing runtime fixtures or selecting identifier formats.
 */
declare const fixtureVersion: RecordVersion;

const toVersionedRecord = (entity: Entity): VersionedRecord<Entity> => ({
  id: entity.id,
  version: fixtureVersion,
  value: entity,
});

/**
 * If any required repository method, parameter, or return type changes,
 * this assignment must continue to compile.
 */
const entityRepositoryContractFixture: EntityRepository = {
  async getById(_id, _context) {
    return null;
  },

  async getAt(_id, _query, _context) {
    return null;
  },

  async getHistory(_id, _page, _context) {
    return {
      items: [],
    };
  },

  async create(entity, _context) {
    return toVersionedRecord(entity);
  },

  async update(input, _context) {
    return toVersionedRecord(input.entity);
  },
};

// Keep the fixture referenced without executing repository operations.
void entityRepositoryContractFixture;
