/**
 * Services - Persistence and external integrations
 */

// Task 013: IndexedDB Persistence
export { db, HSHDatabase, type StoredRun, type StoredPack, type StoredSettings } from './db.js';
export {
  // Run operations
  createRun,
  appendEvent,
  getRunEvents,
  getRun,
  updateRunStatus,
  getInProgressRuns,
  deleteRun,
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
