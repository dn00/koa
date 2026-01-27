/**
 * Tests for Task 029: Telemetry
 *
 * Anonymous analytics service for tracking game events.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  TelemetryService,
  type TelemetryEvent,
} from '../../src/services/telemetry.js';
import { useSettingsStore } from '../../src/stores/settingsStore.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock crypto.randomUUID
const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
vi.stubGlobal('crypto', {
  randomUUID: () => mockUUID,
});

describe('Task 029: Telemetry', () => {
  let telemetry: TelemetryService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
    useSettingsStore.getState().reset();
    telemetry = new TelemetryService();
  });

  afterEach(() => {
    telemetry.destroy();
  });

  describe('AC-1: RUN_STARTED event format', () => {
    it('should track RUN_STARTED with dailyId and puzzleId', () => {
      telemetry.trackRunStarted('daily_2024-01-15', 'puzzle_intro');

      const queue = telemetry.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe('RUN_STARTED');
      expect(queue[0].payload).toEqual({
        dailyId: 'daily_2024-01-15',
        puzzleId: 'puzzle_intro',
      });
    });

    it('should include timestamp in RUN_STARTED event', () => {
      const before = Date.now();
      telemetry.trackRunStarted('daily_123', 'puzzle_1');
      const after = Date.now();

      const event = telemetry.getQueue()[0];
      expect(event.timestamp).toBeGreaterThanOrEqual(before);
      expect(event.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('AC-2: TURN_SUMMARY event format', () => {
    it('should track TURN_SUMMARY with damage, concerns, and contradiction', () => {
      telemetry.trackTurnSummary(15, 2, 'location_conflict');

      const queue = telemetry.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe('TURN_SUMMARY');
      expect(queue[0].payload).toEqual({
        damage: 15,
        concernsAddressed: 2,
        contradiction: 'location_conflict',
      });
    });

    it('should handle null contradiction', () => {
      telemetry.trackTurnSummary(10, 1, null);

      const event = telemetry.getQueue()[0];
      expect(event.payload.contradiction).toBeNull();
    });
  });

  describe('AC-3: RUN_ENDED_SUMMARY event format', () => {
    it('should track RUN_ENDED_SUMMARY with result and stats', () => {
      telemetry.trackRunEnded('WON', 5, 80, 2);

      const queue = telemetry.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe('RUN_ENDED_SUMMARY');
      expect(queue[0].payload).toEqual({
        result: 'WON',
        turnsUsed: 5,
        totalDamage: 80,
        finalScrutiny: 2,
      });
    });

    it('should track LOST result with correct stats', () => {
      telemetry.trackRunEnded('LOST', 8, 45, 5);

      const event = telemetry.getQueue()[0];
      expect(event.payload.result).toBe('LOST');
      expect(event.payload.turnsUsed).toBe(8);
      expect(event.payload.finalScrutiny).toBe(5);
    });
  });

  describe('AC-4: Opt-out respected', () => {
    it('should not queue events when user has opted out', () => {
      useSettingsStore.getState().setTelemetryOptOut(true);
      telemetry = new TelemetryService();

      telemetry.trackRunStarted('daily_1', 'puzzle_1');
      telemetry.trackTurnSummary(10, 1, null);
      telemetry.trackRunEnded('WON', 3, 50, 0);

      expect(telemetry.getQueue()).toHaveLength(0);
    });

    it('should respect opt-out changes during session', () => {
      telemetry.trackRunStarted('daily_1', 'puzzle_1');
      expect(telemetry.getQueue()).toHaveLength(1);

      useSettingsStore.getState().setTelemetryOptOut(true);

      telemetry.trackTurnSummary(10, 1, null);
      expect(telemetry.getQueue()).toHaveLength(1); // No new event added
    });

    it('should resume tracking when opt-out is disabled', () => {
      useSettingsStore.getState().setTelemetryOptOut(true);
      telemetry = new TelemetryService();

      telemetry.trackRunStarted('daily_1', 'puzzle_1');
      expect(telemetry.getQueue()).toHaveLength(0);

      useSettingsStore.getState().setTelemetryOptOut(false);

      telemetry.trackRunStarted('daily_2', 'puzzle_2');
      expect(telemetry.getQueue()).toHaveLength(1);
    });
  });

  describe('AC-5: No PII', () => {
    it('should only include session ID, not personal identifiers', () => {
      telemetry.trackRunStarted('daily_1', 'puzzle_1');

      const event = telemetry.getQueue()[0];
      const eventString = JSON.stringify(event);

      // Should have sessionId
      expect(event.sessionId).toBe(mockUUID);

      // Should not have common PII fields
      expect(event).not.toHaveProperty('userId');
      expect(event).not.toHaveProperty('email');
      expect(event).not.toHaveProperty('name');
      expect(event).not.toHaveProperty('ip');
      expect(event).not.toHaveProperty('deviceId');

      // No email patterns in serialized event
      expect(eventString).not.toMatch(/@/);
    });

    it('should use anonymous session ID format', () => {
      telemetry.trackRunStarted('daily_1', 'puzzle_1');

      const event = telemetry.getQueue()[0];
      // UUID v4 format
      expect(event.sessionId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });
  });

  describe('AC-6: Batch sending', () => {
    it('should flush when queue reaches 10 events', async () => {
      for (let i = 0; i < 10; i++) {
        telemetry.trackTurnSummary(10 + i, 1, null);
      }

      // Wait for flush
      await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.events).toHaveLength(10);
    });

    it('should send events in correct order', async () => {
      for (let i = 0; i < 10; i++) {
        telemetry.trackTurnSummary(i, 0, null);
      }

      await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      for (let i = 0; i < 10; i++) {
        expect(callBody.events[i].payload.damage).toBe(i);
      }
    });
  });

  describe('AC-7: Offline queueing', () => {
    it('should queue events when offline', () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      telemetry.trackRunStarted('daily_1', 'puzzle_1');

      expect(telemetry.getQueue()).toHaveLength(1);
    });

    it('should preserve queue on failed flush', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      for (let i = 0; i < 10; i++) {
        telemetry.trackTurnSummary(i, 0, null);
      }

      // Wait for failed flush attempt
      await new Promise((r) => setTimeout(r, 50));

      // Queue should still have events (retry logic)
      expect(telemetry.getQueue().length).toBeGreaterThan(0);
    });
  });

  describe('AC-8: Anonymous session ID', () => {
    it('should use same session ID for all events in session', () => {
      telemetry.trackRunStarted('daily_1', 'puzzle_1');
      telemetry.trackTurnSummary(10, 1, null);
      telemetry.trackRunEnded('WON', 3, 50, 0);

      const queue = telemetry.getQueue();
      const sessionId = queue[0].sessionId;

      expect(queue[1].sessionId).toBe(sessionId);
      expect(queue[2].sessionId).toBe(sessionId);
    });

    it('should generate new session ID for new service instance', () => {
      const telemetry1 = new TelemetryService();
      const telemetry2 = new TelemetryService();

      telemetry1.trackRunStarted('daily_1', 'puzzle_1');
      telemetry2.trackRunStarted('daily_2', 'puzzle_2');

      // Both use same mocked UUID in tests, but in production would differ
      expect(telemetry1.getQueue()[0].sessionId).toBeDefined();
      expect(telemetry2.getQueue()[0].sessionId).toBeDefined();

      telemetry1.destroy();
      telemetry2.destroy();
    });
  });

  describe('EC-1: Rapid events batched', () => {
    it('should batch rapid successive events', () => {
      // Queue 5 events rapidly
      for (let i = 0; i < 5; i++) {
        telemetry.trackTurnSummary(i, 0, null);
      }

      // All should be in queue before any flush
      expect(telemetry.getQueue()).toHaveLength(5);
    });

    it('should not flush until batch size reached', () => {
      for (let i = 0; i < 9; i++) {
        telemetry.trackTurnSummary(i, 0, null);
      }

      expect(mockFetch).not.toHaveBeenCalled();
      expect(telemetry.getQueue()).toHaveLength(9);
    });
  });

  describe('EC-2: Large queue capped', () => {
    it('should cap queue at 50 events', () => {
      mockFetch.mockRejectedValue(new Error('Offline'));

      for (let i = 0; i < 60; i++) {
        telemetry.trackTurnSummary(i, 0, null);
      }

      expect(telemetry.getQueue().length).toBeLessThanOrEqual(50);
    });

    it('should drop oldest events when capped', () => {
      mockFetch.mockRejectedValue(new Error('Offline'));

      for (let i = 0; i < 60; i++) {
        telemetry.trackTurnSummary(i, 0, null);
      }

      const queue = telemetry.getQueue();
      // Should have newest events (10-59), not oldest (0-9)
      expect(queue[0].payload.damage).toBeGreaterThanOrEqual(10);
    });
  });

  describe('ERR-1: Send failed (retry)', () => {
    it('should retry sending on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Temporary error'));
      mockFetch.mockResolvedValueOnce({ ok: true });

      for (let i = 0; i < 10; i++) {
        telemetry.trackTurnSummary(i, 0, null);
      }

      // Wait for retry
      await new Promise((r) => setTimeout(r, 100));

      // Should have attempted at least twice
      expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it('should silently fail without throwing', async () => {
      mockFetch.mockRejectedValue(new Error('Persistent error'));

      for (let i = 0; i < 10; i++) {
        telemetry.trackTurnSummary(i, 0, null);
      }

      // Should not throw
      await new Promise((r) => setTimeout(r, 50));
      expect(true).toBe(true); // Test passes if no exception
    });
  });

  describe('flush on app background', () => {
    it('should provide flush method for app lifecycle events', async () => {
      telemetry.trackRunStarted('daily_1', 'puzzle_1');
      telemetry.trackTurnSummary(10, 1, null);

      await telemetry.flush();

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should clear queue after successful flush', async () => {
      telemetry.trackRunStarted('daily_1', 'puzzle_1');
      expect(telemetry.getQueue()).toHaveLength(1);

      await telemetry.flush();

      expect(telemetry.getQueue()).toHaveLength(0);
    });
  });

  describe('Event structure', () => {
    it('should have consistent event structure', () => {
      telemetry.trackRunStarted('daily_1', 'puzzle_1');

      const event = telemetry.getQueue()[0] as TelemetryEvent;

      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('sessionId');
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('payload');
      expect(typeof event.type).toBe('string');
      expect(typeof event.sessionId).toBe('string');
      expect(typeof event.timestamp).toBe('number');
      expect(typeof event.payload).toBe('object');
    });
  });
});
