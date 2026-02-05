/**
 * Finite State Machine Pattern
 *
 * A deterministic FSM for entity behavior (guards, NPCs, etc.).
 * Supports transitions, timers, and state-specific behavior.
 *
 * Key features:
 * - Named states with entry/exit hooks
 * - Transition conditions with guards
 * - State timers (min duration, timeout)
 * - Deterministic transition ordering
 *
 * From: Auto-Heist guard movement system
 */

import type { TickIndex } from '../types/core.js';

// === TYPES ===

export interface FSMState<TContext> {
  name: string;
  onEnter?: (ctx: TContext, tick: TickIndex) => void;
  onExit?: (ctx: TContext, tick: TickIndex) => void;
  onTick?: (ctx: TContext, tick: TickIndex) => void;
  minDurationTicks?: number;  // Minimum time in state before transition
  timeoutTicks?: number;      // Auto-transition after this many ticks
  timeoutTarget?: string;     // State to transition to on timeout
}

export interface FSMTransition<TContext> {
  from: string | string[];    // Source state(s), or '*' for any
  to: string;                 // Target state
  condition: (ctx: TContext, tick: TickIndex) => boolean;
  priority?: number;          // Lower = checked first (default 0)
}

export interface FSMConfig<TContext> {
  states: Record<string, FSMState<TContext>>;
  transitions: FSMTransition<TContext>[];
  initialState: string;
}

export interface FSMInstance {
  currentState: string;
  enteredTick: TickIndex;
  previousState?: string;
}

// === FUNCTIONS ===

/**
 * Create a new FSM instance
 */
export function createFSM(config: FSMConfig<unknown>, tick: TickIndex): FSMInstance {
  return {
    currentState: config.initialState,
    enteredTick: tick,
  };
}

/**
 * Process one tick of the FSM
 * Returns the new state name if a transition occurred, undefined otherwise
 */
export function tickFSM<TContext>(
  instance: FSMInstance,
  config: FSMConfig<TContext>,
  ctx: TContext,
  tick: TickIndex
): string | undefined {
  const currentStateDef = config.states[instance.currentState];
  if (!currentStateDef) return undefined;

  const ticksInState = tick - instance.enteredTick;

  // Check timeout first
  if (currentStateDef.timeoutTicks !== undefined &&
      ticksInState >= currentStateDef.timeoutTicks &&
      currentStateDef.timeoutTarget) {
    return transitionTo(instance, config, ctx, currentStateDef.timeoutTarget, tick);
  }

  // Check min duration
  const canTransition = currentStateDef.minDurationTicks === undefined ||
                        ticksInState >= currentStateDef.minDurationTicks;

  if (canTransition) {
    // Sort transitions by priority
    const sortedTransitions = [...config.transitions]
      .filter(t => {
        if (t.from === '*') return true;
        if (Array.isArray(t.from)) return t.from.includes(instance.currentState);
        return t.from === instance.currentState;
      })
      .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

    // Check transitions in priority order
    for (const transition of sortedTransitions) {
      if (transition.condition(ctx, tick)) {
        return transitionTo(instance, config, ctx, transition.to, tick);
      }
    }
  }

  // Run onTick for current state
  if (currentStateDef.onTick) {
    currentStateDef.onTick(ctx, tick);
  }

  return undefined;
}

/**
 * Force a transition to a specific state
 */
export function transitionTo<TContext>(
  instance: FSMInstance,
  config: FSMConfig<TContext>,
  ctx: TContext,
  targetState: string,
  tick: TickIndex
): string {
  const currentStateDef = config.states[instance.currentState];
  const targetStateDef = config.states[targetState];

  // Call onExit for current state
  if (currentStateDef?.onExit) {
    currentStateDef.onExit(ctx, tick);
  }

  // Update instance
  instance.previousState = instance.currentState;
  instance.currentState = targetState;
  instance.enteredTick = tick;

  // Call onEnter for new state
  if (targetStateDef?.onEnter) {
    targetStateDef.onEnter(ctx, tick);
  }

  return targetState;
}

/**
 * Get time spent in current state
 */
export function ticksInState(instance: FSMInstance, tick: TickIndex): number {
  return tick - instance.enteredTick;
}

// === EXAMPLE: Guard FSM ===

/**
 * Example guard context (adapt for your game)
 */
export interface GuardContext {
  hasTarget: boolean;
  targetVisible: boolean;
  hasEvidence: boolean;
  evidenceAge: number;
  atPatrolWaypoint: boolean;
}

/**
 * Example guard states from Auto-Heist
 */
export const GUARD_STATES: Record<string, FSMState<GuardContext>> = {
  PATROL: {
    name: 'PATROL',
    minDurationTicks: 3,
  },
  INVESTIGATE: {
    name: 'INVESTIGATE',
    minDurationTicks: 5,
    timeoutTicks: 30,
    timeoutTarget: 'PATROL',
  },
  PURSUE: {
    name: 'PURSUE',
    minDurationTicks: 2,
  },
  SWEEP: {
    name: 'SWEEP',
    minDurationTicks: 10,
    timeoutTicks: 50,
    timeoutTarget: 'PATROL',
  },
  HOLD: {
    name: 'HOLD',
    minDurationTicks: 5,
  },
};

/**
 * Example guard transitions from Auto-Heist
 */
export const GUARD_TRANSITIONS: FSMTransition<GuardContext>[] = [
  // PATROL -> INVESTIGATE: has evidence
  {
    from: 'PATROL',
    to: 'INVESTIGATE',
    condition: (ctx) => ctx.hasEvidence,
    priority: 0,
  },
  // PATROL -> PURSUE: target visible
  {
    from: 'PATROL',
    to: 'PURSUE',
    condition: (ctx) => ctx.targetVisible,
    priority: -1, // Higher priority than investigate
  },
  // INVESTIGATE -> PURSUE: target visible
  {
    from: 'INVESTIGATE',
    to: 'PURSUE',
    condition: (ctx) => ctx.targetVisible,
    priority: 0,
  },
  // INVESTIGATE -> PATROL: no evidence
  {
    from: 'INVESTIGATE',
    to: 'PATROL',
    condition: (ctx) => !ctx.hasEvidence && ctx.evidenceAge > 20,
    priority: 1,
  },
  // PURSUE -> SWEEP: lost target
  {
    from: 'PURSUE',
    to: 'SWEEP',
    condition: (ctx) => !ctx.targetVisible && !ctx.hasTarget,
    priority: 0,
  },
  // SWEEP -> PATROL: no evidence
  {
    from: 'SWEEP',
    to: 'PATROL',
    condition: (ctx) => !ctx.hasEvidence && ctx.evidenceAge > 30,
    priority: 0,
  },
];

/**
 * Create a guard FSM config
 */
export function createGuardFSMConfig(): FSMConfig<GuardContext> {
  return {
    states: GUARD_STATES,
    transitions: GUARD_TRANSITIONS,
    initialState: 'PATROL',
  };
}
