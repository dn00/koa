/**
 * IndexedDB database schema using Dexie.
 * Task 006: Update Persistence (V5 Migration)
 *
 * Defines the database schema and tables for persisting V5 game state.
 * AC-4: Database version bumped for V5 migration.
 */

import Dexie, { type Table } from 'dexie';
import type { V5Event } from '../stores/gameStore.js';

// Re-export V5Event for consumers
export type { V5Event } from '../stores/gameStore.js';

/**
 * Stored run record (V5).
 * AC-1: Contains V5Event[] as source of truth.
 * Events are replayed by gameStore.loadEvents() to derive GameState.
 */
export interface StoredRun {
  readonly id: string;
  /** V5 events - source of truth for state derivation */
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
 * AC-4: Version 2 for V5 migration.
 */
export class HSHDatabase extends Dexie {
  runs!: Table<StoredRun, string>;
  packs!: Table<StoredPack, string>;
  settings!: Table<StoredSettings, 'settings'>;

  constructor() {
    super('hsh');

    // Version 1: Original MVP schema (deprecated)
    // Version 2: V5 migration - events use V5Event type
    this.version(2).stores({
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
