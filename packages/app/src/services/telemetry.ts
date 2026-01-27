/**
 * Telemetry service for anonymous analytics.
 * Task 029: Telemetry
 *
 * Tracks game events for analytics while respecting user privacy.
 * - No PII collected (only anonymous session ID)
 * - Respects telemetryOptOut setting
 * - Batches events for efficient sending
 * - Handles offline scenarios gracefully
 */

import { useSettingsStore } from '../stores/settingsStore.js';

/**
 * Event types for telemetry.
 */
export type TelemetryEventType = 'RUN_STARTED' | 'TURN_SUMMARY' | 'RUN_ENDED_SUMMARY';

/**
 * Payload for RUN_STARTED event.
 */
export interface RunStartedPayload {
  dailyId: string;
  puzzleId: string;
}

/**
 * Payload for TURN_SUMMARY event.
 */
export interface TurnSummaryPayload {
  damage: number;
  concernsAddressed: number;
  contradiction: string | null;
}

/**
 * Payload for RUN_ENDED_SUMMARY event.
 */
export interface RunEndedPayload {
  result: 'WON' | 'LOST';
  turnsUsed: number;
  totalDamage: number;
  finalScrutiny: number;
}

/**
 * Union type for all payloads.
 */
export type TelemetryPayload = RunStartedPayload | TurnSummaryPayload | RunEndedPayload;

/**
 * A telemetry event.
 */
export interface TelemetryEvent {
  type: TelemetryEventType;
  sessionId: string;
  timestamp: number;
  payload: TelemetryPayload;
}

/**
 * Configuration constants.
 */
const BATCH_SIZE = 10;
const MAX_QUEUE_SIZE = 50;
const TELEMETRY_ENDPOINT = '/api/telemetry';
const RETRY_DELAY_MS = 1000;

/**
 * Telemetry service class.
 *
 * Usage:
 * ```ts
 * const telemetry = new TelemetryService();
 * telemetry.trackRunStarted('daily_2024-01-15', 'puzzle_intro');
 * telemetry.trackTurnSummary(15, 2, 'location_conflict');
 * telemetry.trackRunEnded('WON', 5, 80, 2);
 *
 * // On app background
 * await telemetry.flush();
 * ```
 */
export class TelemetryService {
  private queue: TelemetryEvent[] = [];
  private sessionId: string;
  private isFlushing: boolean = false;
  private retryTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.sessionId = crypto.randomUUID();
  }

  /**
   * Check if telemetry is opted out.
   */
  private isOptedOut(): boolean {
    return useSettingsStore.getState().telemetryOptOut;
  }

  /**
   * Add an event to the queue.
   */
  private queueEvent(type: TelemetryEventType, payload: TelemetryPayload): void {
    // AC-4: Respect opt-out
    if (this.isOptedOut()) {
      return;
    }

    const event: TelemetryEvent = {
      type,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      payload,
    };

    this.queue.push(event);

    // EC-2: Cap queue at MAX_QUEUE_SIZE (drop oldest)
    if (this.queue.length > MAX_QUEUE_SIZE) {
      this.queue = this.queue.slice(-MAX_QUEUE_SIZE);
    }

    // AC-6: Batch sending at BATCH_SIZE
    if (this.queue.length >= BATCH_SIZE) {
      this.flush().catch(() => {
        // Silently ignore - will retry later
      });
    }
  }

  /**
   * Track when a run starts.
   *
   * AC-1: RUN_STARTED event format
   */
  trackRunStarted(dailyId: string, puzzleId: string): void {
    this.queueEvent('RUN_STARTED', {
      dailyId,
      puzzleId,
    });
  }

  /**
   * Track turn summary after each turn.
   *
   * AC-2: TURN_SUMMARY event format
   */
  trackTurnSummary(damage: number, concernsAddressed: number, contradiction: string | null): void {
    this.queueEvent('TURN_SUMMARY', {
      damage,
      concernsAddressed,
      contradiction,
    });
  }

  /**
   * Track when a run ends.
   *
   * AC-3: RUN_ENDED_SUMMARY event format
   */
  trackRunEnded(result: 'WON' | 'LOST', turnsUsed: number, totalDamage: number, finalScrutiny: number): void {
    this.queueEvent('RUN_ENDED_SUMMARY', {
      result,
      turnsUsed,
      totalDamage,
      finalScrutiny,
    });
  }

  /**
   * Get current queue (for testing).
   */
  getQueue(): readonly TelemetryEvent[] {
    return [...this.queue];
  }

  /**
   * Flush events to server.
   *
   * AC-6: Batch sending
   * AC-7: Offline queueing (preserves on failure)
   * ERR-1: Retry on failure
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0 || this.isFlushing) {
      return;
    }

    this.isFlushing = true;
    const eventsToSend = [...this.queue];

    try {
      const response = await fetch(TELEMETRY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToSend }),
      });

      if (response.ok) {
        // Clear sent events from queue
        this.queue = this.queue.slice(eventsToSend.length);
      } else {
        // ERR-1: Schedule retry on failure
        this.scheduleRetry();
      }
    } catch {
      // AC-7: Preserve queue on network failure
      // ERR-1: Schedule retry
      this.scheduleRetry();
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Schedule a retry after failure.
   */
  private scheduleRetry(): void {
    if (this.retryTimeoutId) {
      return; // Already scheduled
    }

    this.retryTimeoutId = setTimeout(() => {
      this.retryTimeoutId = null;
      this.flush().catch(() => {
        // Silently ignore
      });
    }, RETRY_DELAY_MS);
  }

  /**
   * Cleanup service (cancel pending retries).
   */
  destroy(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  }
}

/**
 * Singleton telemetry service instance.
 */
let telemetryInstance: TelemetryService | null = null;

/**
 * Get the telemetry service singleton.
 */
export function getTelemetryService(): TelemetryService {
  if (!telemetryInstance) {
    telemetryInstance = new TelemetryService();
  }
  return telemetryInstance;
}

/**
 * Reset telemetry service (for testing).
 */
export function resetTelemetryService(): void {
  if (telemetryInstance) {
    telemetryInstance.destroy();
    telemetryInstance = null;
  }
}
