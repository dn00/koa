/**
 * IndexedDB database schema using Dexie.
 * Task 013: IndexedDB Persistence
 *
 * Defines the database schema and tables for persisting game state.
 */

import Dexie, { type Table } from 'dexie';
import type { GameEvent } from '@hsh/engine-core';

/**
 * Stored run record.
 * Contains the event log and metadata for a game run.
 */
export interface StoredRun {
  readonly id: string;
  readonly events: readonly GameEvent[];
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
