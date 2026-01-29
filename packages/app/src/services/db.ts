/**
 * IndexedDB database schema using Dexie.
 * Task 013: IndexedDB Persistence
 *
 * Defines the database schema and tables for persisting game state.
 */

import Dexie, { type Table } from 'dexie';

// TODO: V5 migration - GameEvent removed from engine-core
// V5 uses a different event system defined in Task 002
// For now, use a placeholder type for storage compatibility
export type V5Event = {
  readonly type: string;
  readonly timestamp: number;
  readonly payload?: unknown;
};

/**
 * Stored run record.
 * Contains the event log and metadata for a game run.
 */
export interface StoredRun {
  readonly id: string;
  // TODO: V5 migration - events will use V5Event type from Task 002
  readonly events: readonly V5Event[];
  readonly status: 'IN_PROGRESS' | 'WON' | 'LOST';
  readonly updatedAt: number;
}

/**
 * Stored pack record.
 * Caches puzzle packs for offline access.
 */
export interface StoredPack {
  readonly id: string;
  readonly data: unknown;
  readonly cachedAt: number;
}

/**
 * Stored settings record.
 * User preferences and configuration.
 */
export interface StoredSettings {
  readonly id: 'settings';
  readonly counterVisibility: 'always' | 'hover' | 'never';
  readonly telemetryOptOut: boolean;
}

/**
 * HSH Database using Dexie for IndexedDB access.
 */
export class HSHDatabase extends Dexie {
  runs!: Table<StoredRun, string>;
  packs!: Table<StoredPack, string>;
  settings!: Table<StoredSettings, 'settings'>;

  constructor() {
    super('hsh');

    this.version(1).stores({
      runs: 'id, status, updatedAt',
      packs: 'id, cachedAt',
      settings: 'id',
    });
  }
}

/**
 * Singleton database instance.
 */
export const db = new HSHDatabase();
