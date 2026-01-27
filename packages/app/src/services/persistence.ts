/**
 * Persistence service for game state.
 * Task 013: IndexedDB Persistence
 *
 * CRUD operations for runs, packs, and settings.
 */

import type { GameEvent, RunStatus } from '@hsh/engine-core';
import { db, type StoredRun, type StoredPack, type StoredSettings } from './db.js';

// ============================================================================
// Run Operations
// ============================================================================

/**
 * Status type for stored runs.
 */
type RunStatusString = 'IN_PROGRESS' | 'WON' | 'LOST';

/**
 * Convert RunStatus enum to string.
 */
function statusToString(status: RunStatus | string): RunStatusString {
  if (typeof status === 'string') {
    return status as RunStatusString;
  }
  // Handle enum values
  return status as unknown as RunStatusString;
}

/**
 * Create a new run record.
 *
 * @param runId - Unique run identifier
 * @param initialEvents - Initial events (typically just RUN_STARTED)
 */
export async function createRun(
  runId: string,
  initialEvents: readonly GameEvent[]
): Promise<void> {
  const run: StoredRun = {
    id: runId,
    events: initialEvents,
    status: 'IN_PROGRESS',
    updatedAt: Date.now(),
  };
  await db.runs.put(run);
}

/**
 * Append an event to a run's event log.
 *
 * AC-1: Append/retrieve events - Events persist across page loads
 * EC-2: Event ordering preserved - Events in append order
 *
 * @param runId - Run identifier
 * @param event - Event to append
 */
export async function appendEvent(runId: string, event: GameEvent): Promise<void> {
  const run = await db.runs.get(runId);
  if (!run) {
    // Create new run if it doesn't exist
    await createRun(runId, [event]);
    return;
  }

  const updatedRun: StoredRun = {
    ...run,
    events: [...run.events, event],
    updatedAt: Date.now(),
  };

  await db.runs.put(updatedRun);
}

/**
 * Get all events for a run.
 *
 * AC-1: Append/retrieve events
 * EC-1: Missing run → null
 *
 * @param runId - Run identifier
 * @returns Events array or null if run doesn't exist
 */
export async function getRunEvents(runId: string): Promise<GameEvent[] | null> {
  const run = await db.runs.get(runId);
  if (!run) {
    return null;
  }
  return [...run.events];
}

/**
 * Get a stored run by ID.
 *
 * @param runId - Run identifier
 * @returns StoredRun or null if not found
 */
export async function getRun(runId: string): Promise<StoredRun | null> {
  const run = await db.runs.get(runId);
  return run ?? null;
}

/**
 * Update run status.
 *
 * @param runId - Run identifier
 * @param status - New status
 */
export async function updateRunStatus(
  runId: string,
  status: RunStatus | RunStatusString
): Promise<void> {
  const run = await db.runs.get(runId);
  if (!run) return;

  const updatedRun: StoredRun = {
    ...run,
    status: statusToString(status),
    updatedAt: Date.now(),
  };

  await db.runs.put(updatedRun);
}

/**
 * Get all in-progress runs.
 *
 * @returns Array of in-progress runs
 */
export async function getInProgressRuns(): Promise<StoredRun[]> {
  return await db.runs.where('status').equals('IN_PROGRESS').toArray();
}

/**
 * Delete a run.
 *
 * @param runId - Run identifier
 */
export async function deleteRun(runId: string): Promise<void> {
  await db.runs.delete(runId);
}

// ============================================================================
// Pack Operations
// ============================================================================

/**
 * Cache a puzzle pack.
 *
 * AC-2: Cache packs - Pack retrieved by ID
 *
 * @param packId - Pack identifier
 * @param data - Pack data
 */
export async function cachePack(packId: string, data: unknown): Promise<void> {
  const pack: StoredPack = {
    id: packId,
    data,
    cachedAt: Date.now(),
  };
  await db.packs.put(pack);
}

/**
 * Get a cached pack.
 *
 * @param packId - Pack identifier
 * @returns Pack data or null if not cached
 */
export async function getCachedPack(packId: string): Promise<unknown | null> {
  const pack = await db.packs.get(packId);
  return pack?.data ?? null;
}

/**
 * Check if a pack is cached.
 *
 * @param packId - Pack identifier
 * @returns True if pack is cached
 */
export async function isPackCached(packId: string): Promise<boolean> {
  const pack = await db.packs.get(packId);
  return pack !== undefined;
}

/**
 * Delete a cached pack.
 *
 * @param packId - Pack identifier
 */
export async function deleteCachedPack(packId: string): Promise<void> {
  await db.packs.delete(packId);
}

// ============================================================================
// Settings Operations
// ============================================================================

/**
 * Default settings values.
 */
const DEFAULT_SETTINGS: StoredSettings = {
  id: 'settings',
  counterVisibility: 'hover',
  telemetryOptOut: false,
};

/**
 * Get user settings.
 *
 * AC-3: Settings singleton - Defaults + updates work
 *
 * @returns Settings object (defaults if not set)
 */
export async function getSettings(): Promise<StoredSettings> {
  const settings = await db.settings.get('settings');
  return settings ?? DEFAULT_SETTINGS;
}

/**
 * Update user settings.
 *
 * AC-3: Settings singleton
 *
 * @param updates - Partial settings to update
 */
export async function updateSettings(
  updates: Partial<Omit<StoredSettings, 'id'>>
): Promise<void> {
  const current = await getSettings();
  const updated: StoredSettings = {
    ...current,
    ...updates,
    id: 'settings', // Ensure ID is always 'settings'
  };
  await db.settings.put(updated);
}

/**
 * Reset settings to defaults.
 */
export async function resetSettings(): Promise<void> {
  await db.settings.put(DEFAULT_SETTINGS);
}
