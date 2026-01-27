#!/usr/bin/env npx tsx
/**
 * Puzzle Emulator CLI
 *
 * Usage: npx tsx scripts/emulate-puzzle.ts
 *
 * Commands:
 *   submit card_x card_y [card_z]  — Submit 1-3 cards
 *   hand                            — Show remaining cards
 *   state                           — Show current state
 *   help                            — Show help
 *   quit                            — Exit
 */

import * as readline from 'node:readline';
import {
  processTurn,
  TrustTier,
} from '@hsh/engine-core';
import type {
  RunState,
  Submission,
  EvidenceCard,
  CardId,
  Scrutiny,
} from '@hsh/engine-core';
import { THE_LAST_SLICE } from '../packages/engine-core/tests/fixtures/the-last-slice.js';

// ============================================================================
// State
// ============================================================================

const { puzzle, cards } = THE_LAST_SLICE;

let state: RunState = {
  puzzle,
  committedStory: [],
  resistance: puzzle.resistance,
  scrutiny: 0 as Scrutiny,
  turnsRemaining: puzzle.turns,
  concernsAddressed: [],
};

let turnCount = 0;
let totalDamage = 0;
let hadContradictions = false;
let refutationCount = 0;

// ============================================================================
// Display helpers
// ============================================================================

function printHeader(): void {
  console.log('\n====================================');
  console.log(`  PUZZLE: "The Last Slice"`);
  console.log(`  Target: ${puzzle.targetName}`);
  console.log(`  Resistance: ${puzzle.resistance} | Turns: ${puzzle.turns}`);
  console.log('====================================\n');
}

function printCards(): void {
  console.log('CARDS IN HAND:');
  const committedIds = new Set(state.committedStory.map(c => c.id));
  for (const id of puzzle.dealtHand) {
    const card = cards.get(id);
    if (!card) continue;
    const committed = committedIds.has(id);
    const status = committed ? ' [COMMITTED]' : '';
    const trust = card.trustTier ? ` (${card.trustTier})` : '';
    const refutes = card.refutes ? ` refutes:${card.refutes}` : '';
    console.log(`  ${card.id}: power=${card.power}${trust} proves=[${card.proves.join(',')}]${refutes}${status}`);
    if (card.claims.location) console.log(`    location: ${card.claims.location}`);
    if (card.claims.state) console.log(`    state: ${card.claims.state}`);
    if (card.claims.activity) console.log(`    activity: ${card.claims.activity}`);
    if (card.claims.timeRange) console.log(`    time: ${card.claims.timeRange}`);
  }
}

function printCounters(): void {
  console.log('\nCOUNTERS:');
  for (const counter of state.puzzle.counters) {
    const status = counter.refuted ? 'REFUTED' : 'ACTIVE';
    console.log(`  ${counter.id}: targets=[${counter.targets.join(',')}] [${status}]`);
  }
}

function printConcerns(): void {
  console.log('\nCONCERNS:');
  for (const concern of puzzle.concerns) {
    const addressed = state.concernsAddressed.includes(concern.id);
    const status = addressed ? 'ADDRESSED' : 'OPEN';
    console.log(`  ${concern.id}: ${concern.type} → needs ${concern.requiredProof} [${status}]`);
  }
}

function printState(): void {
  console.log(`\nSTATE: resistance=${state.resistance} scrutiny=${state.scrutiny} turns=${state.turnsRemaining}`);
  console.log(`  Committed: ${state.committedStory.length} cards`);
  printCounters();
  printConcerns();
}

function printSummary(): void {
  console.log('\n====================================');
  console.log('  GAME OVER');
  console.log('====================================');
  console.log(`  Turns used: ${turnCount}`);
  console.log(`  Total damage: ${totalDamage}`);
  console.log(`  Final resistance: ${state.resistance}`);
  console.log(`  Final scrutiny: ${state.scrutiny}`);
  console.log(`  Concerns addressed: ${state.concernsAddressed.length}/${puzzle.concerns.length}`);

  // Achievements
  const achievements: string[] = [];
  const won = state.resistance <= 0;
  const totalCounters = puzzle.counters.length;
  const allRefuted = totalCounters > 0 && refutationCount >= totalCounters;
  if (won) {
    // FLAWLESS: ≤3 turns + 0 scrutiny + all counters refuted
    if (turnCount <= 3 && state.scrutiny === 0 && allRefuted) achievements.push('FLAWLESS');
    // CLUTCH: won on final turn OR resistance was ≤3 before last damage
    if (state.turnsRemaining === 0) achievements.push('CLUTCH');
    // PERFECT: 0 scrutiny
    if (state.scrutiny === 0) achievements.push('PERFECT');
  }
  // REFUTATION MASTER: all counters refuted + 0 contradictions (win or lose)
  if (allRefuted && !hadContradictions) achievements.push('REFUTATION_MASTER');

  if (achievements.length > 0) {
    console.log(`  Achievements: ${achievements.join(', ')}`);
  }
  console.log('');
}

function printHelp(): void {
  console.log('\nCOMMANDS:');
  console.log('  submit <card_id> [card_id] [card_id]  — Submit 1-3 cards');
  console.log('  hand                                    — Show all cards');
  console.log('  state                                   — Show game state');
  console.log('  help                                    — Show this help');
  console.log('  quit                                    — Exit');
}

// ============================================================================
// Command handler
// ============================================================================

function handleSubmit(args: string[]): boolean {
  if (args.length < 1 || args.length > 3) {
    console.log('ERROR: Submit 1-3 card IDs');
    return false;
  }

  const cardIds = args as CardId[];
  const submission: Submission = { cardIds: cardIds as Submission['cardIds'] };

  const result = processTurn(state, submission, cards);

  if (!result.ok) {
    console.log(`\nBLOCKED: ${result.error.message}`);
    return false;
  }

  const r = result.value;
  turnCount++;
  totalDamage += r.damageDealt;
  refutationCount += r.refutationsApplied.length;
  if (r.contradictions.length > 0) hadContradictions = true;

  console.log('\n--- Turn Result ---');
  console.log(`Damage: ${r.damageDealt} (base: ${r.damageBreakdown.base}, corroboration: +${r.damageBreakdown.corroborationBonus})`);
  for (const cp of r.damageBreakdown.cardPowers) {
    const adj = cp.original !== cp.adjusted ? ` → ${cp.adjusted} (contested)` : '';
    console.log(`  ${cp.id}: ${cp.original}${adj}`);
  }

  if (r.refutationsApplied.length > 0) {
    console.log(`Refuted: ${r.refutationsApplied.join(', ')}`);
  }
  if (r.contradictions.length > 0) {
    for (const c of r.contradictions) {
      console.log(`Contradiction [${c.severity}]: ${c.description}`);
    }
  }
  if (r.scrutinyChange !== 0) {
    console.log(`Scrutiny: +${r.scrutinyChange}`);
  }
  if (r.concernsAddressed.length > 0) {
    console.log(`Concerns addressed: ${r.concernsAddressed.join(', ')}`);
  }

  state = r.newState;
  console.log(`\nResistance: ${state.resistance} | Scrutiny: ${state.scrutiny} | Turns: ${state.turnsRemaining}`);

  if (r.outcome !== 'CONTINUE') {
    const labels: Record<string, string> = {
      WIN: 'YOU WIN!',
      LOSS_SCRUTINY: 'LOSS — Scrutiny reached 5',
      LOSS_TURNS: 'LOSS — Out of turns',
    };
    console.log(`\n>>> ${labels[r.outcome]} <<<`);
    printSummary();
    return true; // game over
  }

  return false;
}

// ============================================================================
// Main loop
// ============================================================================

printHeader();
printCards();
printCounters();
printConcerns();
console.log('');
printHelp();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '\n> ',
});

rl.prompt();

rl.on('line', (line: string) => {
  const parts = line.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase();

  switch (cmd) {
    case 'submit': {
      const gameOver = handleSubmit(parts.slice(1));
      if (gameOver) {
        rl.close();
        return;
      }
      break;
    }
    case 'hand':
      printCards();
      break;
    case 'state':
      printState();
      break;
    case 'help':
      printHelp();
      break;
    case 'quit':
    case 'exit':
      console.log('Goodbye.');
      rl.close();
      return;
    default:
      if (cmd) console.log(`Unknown command: ${cmd}. Type "help" for commands.`);
      break;
  }

  rl.prompt();
});
