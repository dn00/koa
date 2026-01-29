/**
 * Task 006: Update Persistence (V5 Migration)
 *
 * Tests for V5 persistence layer with V5Event[] storage.
 * Total tests required: 6 (4 AC + 1 EC + 1 ERR)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  db,
  saveGame,
  loadGame,
  createRun,
  getRunEvents,
} from '../../src/services/index.js';
import type { V5Event } from '../../src/stores/gameStore.js';

/**
 * Create a test GAME_STARTED event.
 */
function createGameStartedEvent(puzzleSlug: string, seed: number): V5Event {
  return {
    type: 'GAME_STARTED',
    puzzleSlug,
    seed,
    configKey: 'default',
    timestamp: Date.now(),
  } as V5Event;
}

/**
 * Create a test CARD_PLAYED event.
 */
function createCardPlayedEvent(cardId: string): V5Event {
  return {
    type: 'CARD_PLAYED',
    cardId,
    timestamp: Date.now(),
  } as V5Event;
}

describe('Task 006: Update Persistence (V5 Migration)', () => {
  // Clear database before each test
  beforeEach(async () => {
    await db.runs.clear();
    await db.packs.clear();
    await db.settings.clear();
  });

  // ==========================================================================
  // AC-1: StoredRun uses V5Event[]
  // ==========================================================================
  describe('AC-1: StoredRun uses V5Event[]', () => {
    it('should store and retrieve V5Event[] with correct structure', async () => {
      const startEvent = createGameStartedEvent('case-123', 12345);
      const playEvent = createCardPlayedEvent('card_1');
      const events: V5Event[] = [startEvent, playEvent];

      await saveGame('run_1', events);
      const loaded = await loadGame('run_1');

      expect(loaded).not.toBeNull();
      expect(loaded).toHaveLength(2);

      // Verify GAME_STARTED event structure
      const loadedStart = loaded![0] as { type: string; puzzleSlug: string; seed: number };
      expect(loadedStart.type).toBe('GAME_STARTED');
      expect(loadedStart.puzzleSlug).toBe('case-123');
      expect(loadedStart.seed).toBe(12345);

      // Verify CARD_PLAYED event structure
      const loadedPlay = loaded![1] as { type: string; cardId: string };
      expect(loadedPlay.type).toBe('CARD_PLAYED');
      expect(loadedPlay.cardId).toBe('card_1');
    });
  });

  // ==========================================================================
  // AC-2: saveGame persists V5 events
  // ==========================================================================
  describe('AC-2: saveGame persists V5 events', () => {
    it('should persist V5Event[] to IndexedDB', async () => {
      const events: V5Event[] = [
        createGameStartedEvent('puzzle-1', 999),
        createCardPlayedEvent('card_a'),
        createCardPlayedEvent('card_b'),
      ];

      await saveGame('run_test', events);

      // Verify directly via Dexie
      const storedRun = await db.runs.get('run_test');
      expect(storedRun).not.toBeUndefined();
      expect(storedRun!.events).toHaveLength(3);
      expect(storedRun!.status).toBe('IN_PROGRESS');
      expect(storedRun!.updatedAt).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // AC-3: loadGame restores events
  // ==========================================================================
  describe('AC-3: loadGame restores events', () => {
    it('should return stored V5Event[] for state derivation', async () => {
      const events: V5Event[] = [
        createGameStartedEvent('mystery-case', 42),
        createCardPlayedEvent('card_1'),
        createCardPlayedEvent('card_2'),
        createCardPlayedEvent('card_3'),
      ];

      await saveGame('run_restore', events);
      const restored = await loadGame('run_restore');

      expect(restored).not.toBeNull();
      expect(restored).toHaveLength(4);

      // Events should be in correct order for replay
      expect(restored![0]!.type).toBe('GAME_STARTED');
      expect(restored![1]!.type).toBe('CARD_PLAYED');
      expect(restored![2]!.type).toBe('CARD_PLAYED');
      expect(restored![3]!.type).toBe('CARD_PLAYED');
    });
  });

  // ==========================================================================
  // AC-4: Database version bumped
  // ==========================================================================
  describe('AC-4: Database version bumped', () => {
    it('should use database version 2 for V5 migration', () => {
      // Dexie version is set in constructor
      // We can verify by checking the database works with V5 event types
      expect(db.verno).toBe(2);
    });
  });

  // ==========================================================================
  // EC-1: Load non-existent game
  // ==========================================================================
  describe('EC-1: Load non-existent game', () => {
    it('should return null for unknown runId', async () => {
      const result = await loadGame('nonexistent_run');
      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // ERR-1: Corrupted state in DB
  // ==========================================================================
  describe('ERR-1: Corrupted state in DB', () => {
    it('should return null and log error for corrupted events', async () => {
      // Store a run with invalid event structure
      const corruptedRun = {
        id: 'corrupted_run',
        events: [
          { notType: 'invalid' }, // Missing 'type' field
        ],
        status: 'IN_PROGRESS' as const,
        updatedAt: Date.now(),
      };

      // Bypass type checking to store corrupted data
      await db.runs.put(corruptedRun as any);

      // loadGame should detect corruption and return null
      const result = await loadGame('corrupted_run');
      expect(result).toBeNull();
    });

    it('should return null for non-array events', async () => {
      // Store a run with events as non-array
      const corruptedRun = {
        id: 'bad_events_run',
        events: 'not an array',
        status: 'IN_PROGRESS' as const,
        updatedAt: Date.now(),
      };

      await db.runs.put(corruptedRun as any);

      const result = await loadGame('bad_events_run');
      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // Integration: createRun and getRunEvents still work with V5Event
  // ==========================================================================
  describe('Integration: Legacy functions work with V5Event', () => {
    it('should create and retrieve V5 events via legacy functions', async () => {
      const events: V5Event[] = [createGameStartedEvent('test-puzzle', 123)];

      await createRun('legacy_test', events);
      const retrieved = await getRunEvents('legacy_test');

      expect(retrieved).not.toBeNull();
      expect(retrieved).toHaveLength(1);
      expect(retrieved![0]!.type).toBe('GAME_STARTED');
    });
  });
});
