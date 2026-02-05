/**
 * Detection Accumulator Pattern
 *
 * A 0-100 (or 0-1000) accumulator that tracks gradual detection/awareness.
 * Used for guard vision, camera detection, suspicion levels, etc.
 *
 * Key features:
 * - Gain rate when condition is met (e.g., target visible)
 * - Decay rate when condition is not met
 * - Threshold crossings emit events
 * - Hysteresis prevents flapping (different thresholds for up/down)
 *
 * From: Auto-Heist detection system
 */

// === TYPES ===

export interface AccumulatorState {
  value: number;           // Current value (0-100 or 0-1000)
  lastUpdateTick: number;  // Tick of last update
  crossedUp?: string;      // Threshold crossed upward (e.g., 'NOTICED', 'SPOTTED')
  crossedDown?: string;    // Threshold crossed downward (e.g., 'LOST')
}

export interface AccumulatorConfig {
  maxValue: number;        // Maximum value (100 or 1000)
  gainRate: number;        // Per-tick gain when active
  decayRate: number;       // Per-tick decay when inactive
  thresholds: AccumulatorThreshold[];
}

export interface AccumulatorThreshold {
  name: string;            // e.g., 'NOTICED', 'SPOTTED', 'CRITICAL'
  upValue: number;         // Value to cross going up
  downValue: number;       // Value to cross going down (hysteresis)
}

// === DEFAULT CONFIGS ===

/**
 * Detection config (0-100 scale)
 * From Auto-Heist guard vision system
 */
export const DETECTION_CONFIG: AccumulatorConfig = {
  maxValue: 100,
  gainRate: 15,            // Per tick when visible
  decayRate: 5,            // Per tick when not visible
  thresholds: [
    { name: 'NOTICED', upValue: 35, downValue: 20 },
    { name: 'SPOTTED', upValue: 70, downValue: 50 },
  ],
};

/**
 * Suspicion config (0-1000 scale, finer granularity)
 * For more gradual awareness systems
 */
export const SUSPICION_CONFIG: AccumulatorConfig = {
  maxValue: 1000,
  gainRate: 50,
  decayRate: 20,
  thresholds: [
    { name: 'CURIOUS', upValue: 200, downValue: 100 },
    { name: 'SUSPICIOUS', upValue: 500, downValue: 350 },
    { name: 'ALARMED', upValue: 800, downValue: 600 },
  ],
};

// === FUNCTIONS ===

/**
 * Create a new accumulator state
 */
export function createAccumulator(tick: number): AccumulatorState {
  return {
    value: 0,
    lastUpdateTick: tick,
  };
}

/**
 * Update accumulator with gain (condition active)
 * Returns new state and any threshold crossings
 */
export function accumulatorGain(
  state: AccumulatorState,
  config: AccumulatorConfig,
  tick: number,
  gainMultiplier: number = 1.0
): { state: AccumulatorState; crossed?: string } {
  const dt = tick - state.lastUpdateTick;
  if (dt <= 0) return { state };

  const gain = Math.floor(config.gainRate * gainMultiplier * dt);
  const newValue = Math.min(config.maxValue, state.value + gain);

  // Check threshold crossings (upward)
  let crossed: string | undefined;
  for (const threshold of config.thresholds) {
    if (state.value < threshold.upValue && newValue >= threshold.upValue) {
      crossed = threshold.name;
    }
  }

  return {
    state: {
      value: newValue,
      lastUpdateTick: tick,
      crossedUp: crossed,
      crossedDown: undefined,
    },
    crossed,
  };
}

/**
 * Update accumulator with decay (condition inactive)
 * Returns new state and any threshold crossings
 */
export function accumulatorDecay(
  state: AccumulatorState,
  config: AccumulatorConfig,
  tick: number,
  decayMultiplier: number = 1.0
): { state: AccumulatorState; crossed?: string } {
  const dt = tick - state.lastUpdateTick;
  if (dt <= 0) return { state };

  const decay = Math.floor(config.decayRate * decayMultiplier * dt);
  const newValue = Math.max(0, state.value - decay);

  // Check threshold crossings (downward)
  let crossed: string | undefined;
  for (const threshold of [...config.thresholds].reverse()) {
    if (state.value >= threshold.downValue && newValue < threshold.downValue) {
      crossed = `${threshold.name}_LOST`;
    }
  }

  return {
    state: {
      value: newValue,
      lastUpdateTick: tick,
      crossedUp: undefined,
      crossedDown: crossed,
    },
    crossed,
  };
}

/**
 * Get the current threshold level name
 */
export function getAccumulatorLevel(
  state: AccumulatorState,
  config: AccumulatorConfig
): string {
  // Find highest threshold we're at or above
  for (const threshold of [...config.thresholds].reverse()) {
    if (state.value >= threshold.upValue) {
      return threshold.name;
    }
  }
  return 'NONE';
}

/**
 * Check if accumulator is at or above a specific threshold
 */
export function isAtThreshold(
  state: AccumulatorState,
  config: AccumulatorConfig,
  thresholdName: string
): boolean {
  const threshold = config.thresholds.find(t => t.name === thresholdName);
  if (!threshold) return false;
  return state.value >= threshold.upValue;
}
