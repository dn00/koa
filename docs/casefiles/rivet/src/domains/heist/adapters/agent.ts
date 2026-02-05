/**
 * Agent Adapter
 *
 * Provides JSON output and stdin command parsing for LLM agents.
 * Extracted from agent-play.ts to work with GameSession.
 *
 * Protocol: Line-based JSON messages. Each line is one message.
 *
 * Message Types:
 * - INIT: Sent at game start with session info
 * - STATE: Current game state view
 * - VETO_PROMPT: Pending veto decision required
 * - CARD_SELECT: Card selection prompt
 * - END: Game finished with forensics
 * - ERROR: Error message
 *
 * Commands:
 * - WAIT: Continue simulation without action
 * - TOKEN:LIGHTS/RADIO/SMOKE: Use token
 * - TOKEN:DECOY x y: Use decoy at coordinates
 * - ALLOW/VETO: Veto decision
 * - STANCE:SAFE/COMMIT/ABORT: Change stance
 * - QUIT: End game
 *
 * @see Task 004: Agent Adapter (game-session-refactor)
 */

import type { GameView, Command, Forensics } from '../game/types.js';
import type { TokenType } from '../types.js';
import type { DirectorStance } from '../rules-types.js';

/**
 * Card information for selection.
 */
export interface CardInfo {
  id: string;
  name: string;
  trigger?: string;
  action?: string;
  cooldown?: number;
  charges?: number;
  tags?: string[];
}

/**
 * Session start information.
 */
export interface SessionStartInfo {
  seed: string;
  availableCards: CardInfo[];
  equippedCards: string[];
  equippedModules?: string[];
  view?: GameView;
}

/**
 * Options for AgentAdapter construction.
 */
export interface AgentAdapterOptions {
  /** Custom output function (default: console.log) */
  output?: (line: string) => void;
}

/**
 * AgentAdapter provides JSON-based communication for LLM agents.
 *
 * Usage:
 * ```typescript
 * const adapter = new AgentAdapter();
 *
 * adapter.onStart({ seed, availableCards, equippedCards });
 *
 * while (!session.isFinished()) {
 *   const view = session.getView();
 *   adapter.render(view);
 *
 *   const line = await readLine();
 *   const cmd = adapter.parseCommand(line);
 *   handleCommand(cmd);
 * }
 *
 * adapter.onEnd(result, forensics);
 * ```
 */
export class AgentAdapter {
  private output: (line: string) => void;

  constructor(options: AgentAdapterOptions = {}) {
    this.output = options.output ?? ((line: string) => console.log(line));
  }

  /**
   * Output the INIT message at game start.
   */
  onStart(info: SessionStartInfo): void {
    this.outputJSON({
      type: 'INIT',
      seed: info.seed,
      availableCards: info.availableCards,
      equippedCards: info.equippedCards,
      equippedModules: info.equippedModules ?? [],
      stances: ['SAFE', 'COMMIT', 'ABORT'],
      commands: [
        'WAIT',
        'TOKEN:LIGHTS',
        'TOKEN:RADIO',
        'TOKEN:SMOKE',
        'TOKEN:DECOY x y',
        'ALLOW',
        'VETO',
        'STANCE:SAFE',
        'STANCE:COMMIT',
        'STANCE:ABORT',
        'QUIT',
      ],
      view: info.view,
    });
  }

  /**
   * Render the game view as JSON STATE message.
   * Also outputs VETO_PROMPT if there's a pending veto.
   */
  render(view: GameView): void {
    this.outputJSON({
      type: 'STATE',
      view,
    });

    // Output VETO_PROMPT if there's a pending veto
    if (view.pendingVeto) {
      this.outputJSON({
        type: 'VETO_PROMPT',
        rule: view.pendingVeto.ruleName,
        ruleId: view.pendingVeto.ruleId,
        trigger: view.pendingVeto.triggerEvent,
        intent: view.pendingVeto.predictedIntent,
        agentId: view.pendingVeto.agentId,
        hint: 'Respond with ALLOW to fire the rule, or VETO to block it (10 tick lockout)',
      });
    }
  }

  /**
   * Output CARD_SELECT prompt.
   */
  promptCardSelection(available: CardInfo[], pick: number): void {
    this.outputJSON({
      type: 'CARD_SELECT',
      available,
      pick,
    });
  }

  /**
   * Parse card selection response.
   * Returns card IDs or null if invalid.
   */
  parseCardSelection(line: string): string[] | null {
    try {
      const parsed = JSON.parse(line);
      if (!parsed.cards || !Array.isArray(parsed.cards)) {
        this.outputJSON({
          type: 'ERROR',
          message: 'Invalid card selection JSON: missing cards array',
        });
        return null;
      }
      return parsed.cards;
    } catch {
      this.outputJSON({
        type: 'ERROR',
        message: 'Invalid card selection JSON',
      });
      return null;
    }
  }

  /**
   * Parse a command string from stdin.
   * Returns Command object. Malformed commands return WAIT.
   */
  parseCommand(line: string): Command {
    const trimmed = line.trim().toUpperCase();

    if (!trimmed || trimmed === 'WAIT') {
      return { type: 'WAIT' };
    }

    if (trimmed === 'QUIT') {
      return { type: 'QUIT' };
    }

    if (trimmed === 'ALLOW') {
      return { type: 'VETO_DECISION', decision: 'ALLOW' };
    }

    if (trimmed === 'VETO') {
      return { type: 'VETO_DECISION', decision: 'VETO' };
    }

    if (trimmed.startsWith('STANCE:')) {
      const stance = trimmed.split(':')[1] as DirectorStance;
      if (['SAFE', 'COMMIT', 'ABORT'].includes(stance)) {
        return { type: 'STANCE', value: stance };
      }
      return { type: 'WAIT' };
    }

    if (trimmed.startsWith('TOKEN:')) {
      const parts = trimmed.split(/[:\s]+/);
      const tokenType = parts[1] as TokenType;

      if (['LIGHTS', 'RADIO', 'SMOKE'].includes(tokenType)) {
        return { type: 'TOKEN', tokenType };
      }

      if (tokenType === 'DECOY') {
        const x = parseInt(parts[2], 10);
        const y = parseInt(parts[3], 10);

        if (isNaN(x) || isNaN(y)) {
          this.outputJSON({
            type: 'ERROR',
            message: 'DECOY requires coordinates: TOKEN:DECOY x y',
          });
          return { type: 'WAIT' };
        }

        return {
          type: 'TOKEN',
          tokenType: 'DECOY',
          target: { x, y },
        };
      }
    }

    // Unknown command - treat as WAIT (EC-1)
    return { type: 'WAIT' };
  }

  /**
   * Handle EOF on stdin.
   * Returns QUIT command.
   */
  handleEOF(): Command {
    return { type: 'QUIT' };
  }

  /**
   * Output the END message with forensics.
   */
  onEnd(result: string, forensics: Forensics): void {
    this.outputJSON({
      type: 'END',
      result,
      forensics,
    });
  }

  /**
   * Output a JSON message.
   */
  private outputJSON(obj: object): void {
    this.output(JSON.stringify(obj));
  }
}
