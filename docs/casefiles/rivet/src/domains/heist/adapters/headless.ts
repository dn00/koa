/**
 * Headless Adapter
 *
 * Provides programmatic control for playtest policies.
 * No I/O - takes a callback that receives views and returns commands.
 *
 * @see Task 005: Headless Adapter (game-session-refactor)
 */

import type { GameView, Command } from '../game/types.js';
import type { TokenType } from '../types.js';

/**
 * Policy callback signature.
 * Receives current view and history, returns command or null (equivalent to WAIT).
 */
export type PolicyCallback = (
  view: GameView,
  history: GameView[]
) => Command | null;

/**
 * AgentObservation type from playtest (for compatibility).
 */
export interface AgentObservation {
  tick: number;
  heat: number;
  alert: string;
  crewPos?: { x: number; y: number };
  crewState?: string;
  crewSpotted: boolean;
  guards: Array<{ id: string; pos: { x: number; y: number }; state: string }>;
  objectives: Array<{ id: string; state: string; progress: number }>;
  tokens: { LIGHTS: number; RADIO: number; SMOKE: number };
  effects: { lightsOut: boolean; radioJammed: boolean; smokeCount: number };
}

/**
 * TokenPolicy type from playtest (for compatibility).
 */
export type TokenPolicy = (
  obs: AgentObservation,
  history: AgentObservation[]
) => { action: 'LIGHTS' | 'RADIO' | 'SMOKE' | 'WAIT'; reason: string };

/**
 * HeadlessAdapter provides programmatic control for automated playtesting.
 * No I/O - policy callback makes all decisions.
 *
 * Usage:
 * ```typescript
 * const policy: PolicyCallback = (view, history) => {
 *   if (view.crew[0]?.isSpotted) {
 *     return { type: 'TOKEN', tokenType: 'SMOKE' };
 *   }
 *   return null; // WAIT
 * };
 *
 * const adapter = new HeadlessAdapter(policy);
 *
 * while (!session.isFinished()) {
 *   const view = session.getView();
 *   adapter.render(view); // No-op
 *
 *   const cmd = adapter.getCommand(view);
 *   if (cmd) handleCommand(cmd);
 *
 *   session.tick();
 * }
 * ```
 */
export class HeadlessAdapter {
  private policy: PolicyCallback;
  private history: GameView[] = [];

  constructor(policy: PolicyCallback) {
    if (!policy) {
      throw new Error('HeadlessAdapter requires a policy callback');
    }
    this.policy = policy;
  }

  /**
   * Render is a no-op for headless adapter.
   * Optionally used for debugging.
   */
  render(_view: GameView): void {
    // No-op for headless mode
  }

  /**
   * Get command from policy callback.
   * Adds view to history after callback.
   */
  getCommand(view: GameView): Command | null {
    const cmd = this.policy(view, this.history);
    this.history.push(view);
    return cmd;
  }

  /**
   * Get the accumulated history of views.
   */
  getHistory(): GameView[] {
    return this.history;
  }

  /**
   * Clear the history (for reset/replay).
   */
  clearHistory(): void {
    this.history = [];
  }
}

/**
 * Convert GameView to AgentObservation for compatibility with existing policies.
 */
export function viewToObservation(view: GameView): AgentObservation {
  const crew = view.crew[0];
  const result: AgentObservation = {
    tick: view.tick,
    heat: view.heat,
    alert: String(view.alert),
    crewSpotted: crew?.isSpotted ?? false,
    guards: view.guards.map((g) => ({
      id: g.id,
      pos: g.pos,
      state: g.state,
    })),
    objectives: view.objectives.map((o) => ({
      id: o.id,
      state: o.state,
      progress: o.progress,
    })),
    tokens: {
      LIGHTS: view.tokens.LIGHTS,
      RADIO: view.tokens.RADIO,
      SMOKE: view.tokens.SMOKE,
    },
    effects: {
      lightsOut: view.effects.lightsOut,
      radioJammed: view.effects.radioJammed,
      smokeCount: view.effects.smokeCount,
    },
  };
  // Only set optional properties if crew exists
  if (crew) {
    result.crewPos = crew.pos;
    result.crewState = crew.state;
  }
  return result;
}

/**
 * Wrap a TokenPolicy (from playtest) as a PolicyCallback.
 * Enables using existing policies with HeadlessAdapter.
 *
 * Usage:
 * ```typescript
 * const tokenPolicy: TokenPolicy = (obs, history) => {
 *   if (obs.crewSpotted && obs.tokens.SMOKE > 0) {
 *     return { action: 'SMOKE', reason: 'Break LOS' };
 *   }
 *   return { action: 'WAIT', reason: 'No action' };
 * };
 *
 * const wrapped = wrapTokenPolicy(tokenPolicy);
 * const adapter = new HeadlessAdapter(wrapped);
 * ```
 */
export function wrapTokenPolicy(policy: TokenPolicy): PolicyCallback {
  return (view: GameView, history: GameView[]): Command | null => {
    const obs = viewToObservation(view);
    const historyObs = history.map(viewToObservation);
    const { action } = policy(obs, historyObs);

    // Treat undefined or WAIT as null (EC-1: undefined action treated as WAIT)
    if (!action || action === 'WAIT') {
      return null;
    }

    return { type: 'TOKEN', tokenType: action as TokenType };
  };
}
