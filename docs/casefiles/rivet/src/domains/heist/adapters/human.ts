/**
 * Human Adapter
 *
 * Provides ASCII rendering and keyboard input handling for human players.
 * Extracted from play.ts to work with GameSession.
 *
 * @see Task 003: Human Adapter (game-session-refactor)
 */

import type { GameView, Command } from '../game/types.js';
import type { TokenType } from '../types.js';

// Tile characters for map rendering
const TILE_CHARS: Record<string, string> = {
  '#': '#',
  '.': '.',
  D: 'D',
  E: 'E',
  T: 'T',
  V: 'V',
  v: 'v',
  '~': '~',
  '?': '?',
};

// ANSI color codes
const COLORS = {
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
  DIM: '\x1b[2m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  GRAY: '\x1b[90m',
};

const ALERT_COLORS: Record<string, string> = {
  CALM: COLORS.GREEN,
  SUSPICIOUS: COLORS.YELLOW,
  ALARM: COLORS.RED,
  LOCKDOWN: COLORS.MAGENTA,
};

/**
 * Options for HumanAdapter construction.
 */
export interface HumanAdapterOptions {
  /** Whether stdin is a TTY (default: true) */
  isTTY?: boolean;
}

/**
 * HumanAdapter provides ASCII rendering and keyboard input handling
 * for human players interacting with the game via terminal.
 *
 * Usage:
 * ```typescript
 * const adapter = new HumanAdapter();
 *
 * while (!session.isFinished()) {
 *   const view = session.getView();
 *   adapter.render(view);
 *
 *   const cmd = adapter.getCommand();
 *   if (cmd) handleCommand(cmd);
 *
 *   if (!adapter.isPaused()) session.tick();
 * }
 * ```
 */
export class HumanAdapter {
  private paused = false;
  private pendingCommand: Command | null = null;
  private isTTY: boolean;

  constructor(options: HumanAdapterOptions = {}) {
    this.isTTY = options.isTTY ?? true;
  }

  /**
   * Render the complete game view to terminal.
   * Combines map and status panel side by side.
   */
  render(view: GameView): void {
    this.clearScreen();
    const mapLines = this.renderMap(view);
    const statusLines = this.renderStatus(view);

    const maxLines = Math.max(mapLines.length, statusLines.length);
    for (let i = 0; i < maxLines; i++) {
      const mapLine = mapLines[i] || '';
      const statusLine = statusLines[i] || '';
      console.log(`${mapLine.padEnd(40)}${statusLine}`);
    }
  }

  /**
   * Render the map portion of the view.
   * Returns array of lines with entities overlaid.
   */
  renderMap(view: GameView): string[] {
    const lines: string[] = [];
    const mapLines = view.map.split('\n');
    const height = mapLines.length;
    const width = mapLines[0]?.length || 0;

    // Create grid from map string
    const grid: string[][] = mapLines.map((row) =>
      row.split('').map((char) => TILE_CHARS[char] || char)
    );

    // Overlay crew
    for (const crew of view.crew) {
      const { x, y } = crew.pos;
      if (x >= 0 && x < width && y >= 0 && y < height && grid[y]) {
        const color = crew.isSpotted ? COLORS.RED : COLORS.CYAN;
        grid[y][x] = `${color}@${COLORS.RESET}`;
      }
    }

    // Overlay guards
    for (const guard of view.guards) {
      const { x, y } = guard.pos;
      if (x >= 0 && x < width && y >= 0 && y < height && grid[y]) {
        let char: string;
        let color: string;

        if (guard.state === 'PURSUE') {
          char = '!';
          color = COLORS.RED;
        } else if (guard.state === 'INVESTIGATE') {
          char = '?';
          color = COLORS.YELLOW;
        } else {
          char = 'G';
          color = COLORS.MAGENTA;
        }

        grid[y][x] = `${color}${char}${COLORS.RESET}`;
      }
    }

    // Add border
    const border = '\u2500'.repeat(width + 2);
    lines.push(`\u250C${border}\u2510`);
    for (let y = 0; y < height; y++) {
      lines.push(`\u2502 ${grid[y]?.join('') || ''} \u2502`);
    }
    lines.push(`\u2514${border}\u2518`);

    return lines;
  }

  /**
   * Render the status panel portion of the view.
   * Returns array of lines with game state information.
   */
  renderStatus(view: GameView): string[] {
    const lines: string[] = [];
    const alertColor = ALERT_COLORS[view.alert as string] || COLORS.RESET;

    // Header
    lines.push(`${COLORS.BOLD}${'═'.repeat(38)}${COLORS.RESET}`);
    lines.push(
      `  Tick: ${view.tick.toString().padStart(3)}   Heat: ${view.heat
        .toString()
        .padStart(3)}/${view.maxHeat}`
    );
    lines.push(
      `  Alert: ${alertColor}${String(view.alert).padEnd(10)}${COLORS.RESET}`
    );
    lines.push(`${COLORS.BOLD}${'═'.repeat(38)}${COLORS.RESET}`);

    // Crew status
    for (const crew of view.crew) {
      const spottedIndicator = crew.isSpotted ? ' SPOTTED' : '';
      lines.push(
        `  Crew: (${crew.pos.x},${crew.pos.y}) ${crew.state}${spottedIndicator}`
      );
    }

    // Guard status
    for (const guard of view.guards) {
      const stateIcon =
        guard.state === 'PURSUE'
          ? '[!]'
          : guard.state === 'INVESTIGATE'
            ? '[?]'
            : guard.state === 'RETURN'
              ? '[<]'
              : '[ ]';
      lines.push(
        `  ${guard.id}: (${guard.pos.x},${guard.pos.y}) ${stateIcon} ${guard.state}`
      );
    }

    // Objectives
    lines.push('');
    lines.push(`  ${COLORS.DIM}Objectives:${COLORS.RESET}`);
    for (const obj of view.objectives) {
      const icon =
        obj.state === 'DONE' ? '[x]' : obj.state === 'ACTIVE' ? '[>]' : '[ ]';
      const progress =
        obj.state === 'ACTIVE' && obj.progress > 0 ? ` ${obj.progress}%` : '';
      lines.push(`    ${icon} ${obj.label}${progress}`);
    }

    // Tokens
    lines.push('');
    const cd = view.tokenCooldown > 0 ? ` (CD:${view.tokenCooldown})` : '';
    lines.push(
      `  ${COLORS.DIM}Tokens:${COLORS.RESET} [L]${view.tokens.LIGHTS} [R]${view.tokens.RADIO} [S]${view.tokens.SMOKE}${cd}`
    );

    // Effects
    const effects: string[] = [];
    if (view.effects.lightsOut) effects.push('Lights Out');
    if (view.effects.radioJammed) effects.push('Radio Jammed');
    if (view.effects.smokeCount > 0)
      effects.push(`Smoke x${view.effects.smokeCount}`);
    if (view.effects.decoyCount > 0)
      effects.push(`Decoy x${view.effects.decoyCount}`);
    if (effects.length > 0) {
      lines.push(`  ${COLORS.DIM}Effects:${COLORS.RESET} ${effects.join(', ')}`);
    }

    // Pause status
    lines.push('');
    if (view.paused && view.pauseReason) {
      lines.push(
        `  ${COLORS.BOLD}${COLORS.YELLOW}PAUSED: ${view.pauseReason}${COLORS.RESET}`
      );
    } else if (this.paused) {
      lines.push(
        `  ${COLORS.BOLD}${COLORS.YELLOW}PAUSED (press SPACE to resume)${COLORS.RESET}`
      );
    }

    // Controls
    lines.push('');
    lines.push(
      `  ${COLORS.DIM}[SPACE] pause  [L]ights  [R]adio  [S]moke  [Q]uit${COLORS.RESET}`
    );

    return lines;
  }

  /**
   * Handle a key press from the user.
   * Call this when stdin receives data.
   */
  handleKeyPress(key: string): void {
    const k = key.toLowerCase();

    if (k === 'q' || key === '\u0003') {
      // Q or Ctrl+C
      this.pendingCommand = { type: 'QUIT' };
    } else if (k === ' ') {
      // Space - toggle pause
      this.paused = !this.paused;
    } else if (k === 'l') {
      this.pendingCommand = { type: 'TOKEN', tokenType: 'LIGHTS' as TokenType };
    } else if (k === 'r') {
      this.pendingCommand = { type: 'TOKEN', tokenType: 'RADIO' as TokenType };
    } else if (k === 's') {
      this.pendingCommand = { type: 'TOKEN', tokenType: 'SMOKE' as TokenType };
    }
    // Unknown keys are silently ignored (ERR-1)
  }

  /**
   * Get the pending command and clear it.
   * Returns null if no command is pending.
   */
  getCommand(): Command | null {
    const cmd = this.pendingCommand;
    this.pendingCommand = null;
    return cmd;
  }

  /**
   * Check if the game is manually paused.
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Clear the pause state.
   */
  clearPause(): void {
    this.paused = false;
  }

  /**
   * Clear the terminal screen.
   */
  private clearScreen(): void {
    process.stdout.write('\x1b[2J\x1b[H');
  }
}
