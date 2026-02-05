/**
 * GameSession Class
 *
 * Core abstraction that encapsulates the game loop, state management,
 * and command handling. All adapters (human, agent, headless) use this
 * as their single source of truth.
 *
 * Key invariant I2: Systems are read-only. GameSession does not expose
 * mutable state directly - only via getView().
 */

import type { HeistPack } from '../pack-types.js';
import type { HeistState, TokenType, Vec2 } from '../types.js';
import type { DirectorStance } from '../rules-types.js';
import type { SimEvent } from '../kernel.js';
import { createHeistKernel, type HeistKernel } from '../heist-kernel.js';
import type {
  GameView,
  CrewView,
  GuardView,
  ObjectiveView,
  Forensics,
  ForensicsEvent,
} from './types.js';

/**
 * Options for creating a GameSession.
 */
export interface SessionOptions {
  /** Directive card IDs to equip */
  cards?: string[];
  /** Module card IDs to equip */
  modules?: string[];
  /** Initial stance */
  stance?: DirectorStance;
}

/**
 * Result of a single tick.
 */
export interface TickResult {
  events: SimEvent[];
  paused: boolean;
  finished: boolean;
}

/**
 * Result of tickUntilPause.
 */
export interface BatchTickResult {
  events: SimEvent[];
  ticksRun: number;
  paused: boolean;
  finished: boolean;
}

/**
 * GameSession encapsulates the heist kernel and state.
 *
 * Usage:
 * ```typescript
 * const session = new GameSession(pack, seed, { cards, modules, stance });
 *
 * while (!session.isFinished()) {
 *   const view = session.getView();
 *   // Render view, get player input
 *
 *   if (playerWantsToken) session.useToken('SMOKE', { x, y });
 *   if (playerWantsStance) session.setStance('ABORT');
 *
 *   const { events, paused } = session.tick();
 * }
 *
 * const forensics = session.getForensics();
 * ```
 */
export class GameSession {
  private readonly kernel: HeistKernel;
  private state: HeistState;
  private readonly allEvents: SimEvent[] = [];
  private readonly moduleIds: string[];

  constructor(pack: HeistPack, seed: string, options?: SessionOptions) {
    this.kernel = createHeistKernel();
    this.state = this.kernel.initState(pack, seed, options?.cards);
    this.moduleIds = options?.modules ?? [];

    // Apply initial stance if provided
    if (options?.stance) {
      this.state.stance = options.stance;
    }

    // Note: modules are stored in moduleIds for view building.
    // Module effects are handled by the modules system based on state.modules
  }

  /**
   * Execute one simulation tick.
   *
   * @returns Events generated, pause status, and finish status
   */
  tick(): TickResult {
    // No-op if game is finished
    if (this.state.result) {
      return { events: [], paused: false, finished: true };
    }

    const { state: newState, events } = this.kernel.step(this.state);
    this.state = newState;
    this.allEvents.push(...events);

    return {
      events,
      paused: !!this.state.shouldPause,
      finished: !!this.state.result,
    };
  }

  /**
   * Run ticks until pause condition or maxTicks reached.
   *
   * @param maxTicks Maximum ticks to run (default: 100)
   * @returns All events, ticks run, pause status, finish status
   */
  tickUntilPause(maxTicks = 100): BatchTickResult {
    const batchEvents: SimEvent[] = [];
    let ticksRun = 0;

    while (!this.state.result && !this.state.shouldPause && ticksRun < maxTicks) {
      const { events } = this.tick();
      batchEvents.push(...events);
      ticksRun++;
    }

    return {
      events: batchEvents,
      ticksRun,
      paused: !!this.state.shouldPause,
      finished: !!this.state.result,
    };
  }

  /**
   * Queue a token use for the next tick.
   *
   * @param tokenType Token type to use
   * @param target Optional target position for cell-targeted tokens (e.g., DECOY)
   */
  useToken(tokenType: TokenType, target?: Vec2): void {
    if (target) {
      // Cell-targeted token (e.g., DECOY)
      this.state.pendingTokenFire = {
        tokenId: tokenType,
        atTick: this.state.tickIndex,
        target: { cell: target },
      };
    } else {
      // Non-targeted token (LIGHTS, RADIO, SMOKE)
      this.state.pendingTokenUse = tokenType;
    }
  }

  /**
   * Change the director stance immediately.
   *
   * @param stance New stance (SAFE, COMMIT, or ABORT)
   */
  setStance(stance: DirectorStance): void {
    this.state.stance = stance;
  }

  /**
   * Handle a veto decision for a pending veto.
   *
   * @param decision ALLOW to fire the rule, VETO to block it
   */
  handleVeto(decision: 'ALLOW' | 'VETO'): void {
    if (this.state.pendingVeto) {
      this.state.pendingVetoDecision = decision;
    }
    // If no pending veto, this is a no-op (EC-3)
  }

  /**
   * Clear an auto-pause so the simulation can continue.
   * Intended for adapters after the player acknowledges a pause.
   */
  clearPause(): void {
    this.state.shouldPause = false;
    this.state.pauseReason = undefined;
  }

  /**
   * Get the current game state as a GameView.
   * This is the only way to observe state - state is kept private.
   */
  getView(): GameView {
    return this.buildGameView();
  }

  /**
   * Check if the game has finished.
   */
  isFinished(): boolean {
    return !!this.state.result;
  }

  /**
   * Get the game result.
   *
   * @returns 'ESCAPED' | 'CAUGHT' | 'TIMEOUT' | null
   */
  getResult(): 'ESCAPED' | 'CAUGHT' | 'TIMEOUT' | null {
    return this.state.result ?? null;
  }

  /**
   * Get post-game forensics for analysis.
   */
  getForensics(): Forensics {
    return this.buildForensics();
  }

  // === Private Helpers ===

  private buildGameView(): GameView {
    const state = this.state;

    // Sort entities by ID for deterministic iteration order
    const sortedEntities = Object.values(state.entities).sort((a, b) =>
      a.id.localeCompare(b.id)
    );

    // Build crew views
    const crew: CrewView[] = [];
    for (const entity of sortedEntities) {
      if (entity.type === 'crew') {
        const pos = entity.components['heist.position'] as { pos: Vec2 };
        const crewComp = entity.components['heist.crew'] as {
          state: string;
          isSpotted: boolean;
          health: number;
        };
        crew.push({
          id: entity.id,
          pos: pos.pos,
          state: crewComp.state,
          isSpotted: crewComp.isSpotted,
          health: crewComp.health,
        });
      }
    }

    // Build guard views
    const guards: GuardView[] = [];
    for (const entity of sortedEntities) {
      if (entity.type === 'guard') {
        const pos = entity.components['heist.position'] as { pos: Vec2 };
        const guardComp = entity.components['heist.guard'] as {
          state: string;
          lastSeen?: { pos: Vec2; tick: number };
          detectionAccum: Record<string, number>;
        };

        // Sum detection accumulators for all crew targets
        const totalDetection = Object.values(guardComp.detectionAccum || {}).reduce(
          (sum, val) => sum + val,
          0
        );

        const guardView: GuardView = {
          id: entity.id,
          pos: pos.pos,
          state: guardComp.state,
          detectionAccum: totalDetection,
        };
        if (guardComp.lastSeen) {
          guardView.lastSeen = guardComp.lastSeen.pos;
        }
        guards.push(guardView);
      }
    }

    // Build objective views
    const objectives: ObjectiveView[] = [];
    for (const entity of sortedEntities) {
      if (entity.type === 'objective') {
        const objComp = entity.components['heist.objective'] as {
          label: string;
          state: string;
          progress: number;
        };
        objectives.push({
          id: entity.id,
          label: objComp.label,
          state: objComp.state,
          progress: objComp.progress,
        });
      }
    }

    // Build map string
    const mapLines: string[] = [];
    for (let y = 0; y < state.map.height; y++) {
      let line = '';
      const row = state.map.tiles[y];
      if (!row) continue;
      for (let x = 0; x < state.map.width; x++) {
        const tile = row[x];
        switch (tile) {
          case 'WALL':
            line += '#';
            break;
          case 'FLOOR':
            line += '.';
            break;
          case 'DOOR':
            line += 'D';
            break;
          case 'EXIT':
            line += 'E';
            break;
          case 'TERMINAL':
            line += 'T';
            break;
          case 'VAULT':
            line += 'V';
            break;
          case 'VENT':
            line += 'v';
            break;
          case 'SHADOW':
            line += '~';
            break;
          default:
            line += '?';
        }
      }
      mapLines.push(line);
    }

    return {
      tick: state.tickIndex,
      heat: state.heat,
      maxHeat: state.config.maxHeat,
      alert: state.alert.level,
      stance: state.stance,
      result: state.result ?? null,
      paused: !!state.shouldPause,
      pauseReason: state.pauseReason ?? null,
      pendingVeto: state.pendingVeto ?? null,
      crew,
      guards,
      objectives,
      tokens: {
        LIGHTS: state.tokens.available.LIGHTS,
        RADIO: state.tokens.available.RADIO,
        SMOKE: state.tokens.available.SMOKE,
        DECOY: state.tokens.available.DECOY,
      },
      tokenCooldown: Math.max(0, state.tokens.cooldownUntil - state.tickIndex),
      effects: {
        lightsOut: state.effects.lightsOut,
        radioJammed: state.effects.radioJammed,
        smokeCount: state.effects.smokeZones.length,
        decoyCount: state.effects.decoyZones?.length ?? 0,
      },
      equippedModules: this.moduleIds,
      map: mapLines.join('\n'),
    };
  }

  private buildForensics(): Forensics {
    const totalTicks = this.state.tickIndex;
    const totalEvents = this.allEvents.length;

    // Last 15 events
    const lastEvents: ForensicsEvent[] = this.allEvents.slice(-15).map((e) => ({
      tick: e.tickIndex,
      type: e.type,
      payload: e.payload,
    }));

    // Count spot events
    const spotCount = this.allEvents.filter(
      (e) => e.type.includes('spotted') || e.type.includes('SPOTTED')
    ).length;

    // Count alert escalations
    const alertEscalations = this.allEvents.filter(
      (e) => e.type.includes('alert') || e.type.includes('ALERT')
    ).length;

    // Determine loss reason
    let lossReason: string | null = null;
    let suggestion: string | null = null;

    if (this.state.result === 'TIMEOUT') {
      lossReason = `Heat reached maximum (${this.state.heat}/${this.state.config.maxHeat})`;
      suggestion = 'Try faster objective completion or fewer detours';
    } else if (this.state.result === 'CAUGHT') {
      lossReason = 'Crew was caught by guards';
      suggestion = 'Use defensive cards (duck-cover, shadow-step) or tokens when spotted';
    }
    // For ESCAPED or still running, lossReason and suggestion are null

    return {
      totalTicks,
      totalEvents,
      lastEvents,
      spotCount,
      alertEscalations,
      lossReason,
      suggestion,
    };
  }
}
