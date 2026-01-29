/**
 * Services - Persistence and external integrations
 */

// Task 013: IndexedDB Persistence + Task 006: V5 Migration
export { db, HSHDatabase, type StoredRun, type StoredPack, type StoredSettings, type V5Event } from './db.js';
export {
  // Run operations
  createRun,
  appendEvent,
  getRunEvents,
  getRun,
  updateRunStatus,
  getInProgressRuns,
  deleteRun,
  // V5 Game operations (Task 006)
  saveGame,
  loadGame,
  // Pack operations
  cachePack,
  getCachedPack,
  isPackCached,
  deleteCachedPack,
  // Settings operations
  getSettings,
  updateSettings,
  resetSettings,
} from './persistence.js';
