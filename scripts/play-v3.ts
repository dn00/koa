#!/usr/bin/env npx tsx
/**
 * V3 "The Statement" — Interactive CLI Game
 *
 * Play 1 card per turn for 3 turns. Truths add strength, Lies subtract.
 * KOA reveals verdict after each play. Reach the target to be cleared.
 *
 * Usage: npx tsx scripts/play-v3.ts --puzzle power-outage
 */

import * as readline from 'readline';
import * as fs from 'fs';
import type { Puzzle, Tier, GameState, TurnResult } from './v3-types.js';
import { PUZZLES_BY_SLUG } from './v3-puzzles.js';

// ============================================================================
// Game Engine
// ============================================================================

function playCard(cardId: string, state: GameState, puzzle: Puzzle): TurnResult {
  const card = state.hand.find(c => c.id === cardId)!;
  const isLie = card.isLie;
  const delta = isLie ? -(card.strength - 1) : +card.strength;
  state.score += delta;
  state.hand = state.hand.filter(c => c.id !== cardId);
  state.played.push(card);
  state.turnsPlayed++;

  if (state.turnsPlayed === 1 && puzzle.reactiveHints[cardId]) {
    state.activeHint = puzzle.reactiveHints[cardId]!.text;
  }

  return { card, isLie, delta, score: state.score };
}

function getTier(score: number, target: number, liesPlayed: number): Tier {
  if (liesPlayed === 0 && score >= target) return 'FLAWLESS';
  if (score >= target) return 'CLEARED';
  if (score >= target - 2) return 'CLOSE';
  return 'BUSTED';
}

// ============================================================================
// Logging
// ============================================================================

const logPath = process.argv.find((_, i, a) => a[i - 1] === '--log');
let logStream: fs.WriteStream | null = null;
if (logPath) {
  logStream = fs.createWriteStream(logPath, { flags: 'a' });
}

function log(msg: string) {
  console.log(msg);
  if (logStream) logStream.write(msg + '\n');
}

// ============================================================================
// Display
// ============================================================================

function printOpening(puzzle: Puzzle) {
  log(`
╔═══════════════════════════════════════════════════════════════╗
║  HOME SMART HOME — "${puzzle.name}"${' '.repeat(Math.max(0, 39 - puzzle.name.length))}║
╚═══════════════════════════════════════════════════════════════╝

  ${puzzle.scenario.split('\n').join('\n  ')}

  KOA: ${puzzle.hint}

  Target score: ${puzzle.target}
  Cards in hand: ${puzzle.cards.length} (2 are lies)
  Turns: 3
`);
}

function printHand(state: GameState) {
  log('  YOUR HAND:');
  log('  ──────────');
  for (const card of state.hand) {
    log(`  ${card.id.padEnd(16)} str:${card.strength}  loc:${card.location.padEnd(12)} time:${card.time.padEnd(10)} src:${card.source}`);
    log(`  ${''.padEnd(16)} "${card.claim}"`);
  }
}

function printStatus(state: GameState, puzzle: Puzzle) {
  const bar = (val: number, max: number, width: number) => {
    const filled = Math.max(0, Math.round((val / max) * width));
    return '█'.repeat(filled) + '░'.repeat(width - filled);
  };
  log(`\n  Score:      [${bar(Math.max(0, state.score), puzzle.target, 20)}] ${state.score}/${puzzle.target}`);
  log(`  Turns left: ${3 - state.turnsPlayed}`);
}

function printTurnResult(result: TurnResult, turnNum: number, puzzle: Puzzle) {
  const verdict = result.isLie ? 'LIE' : 'TRUTH';
  const sign = result.delta > 0 ? '+' : '';
  log(`\n  ── Turn ${turnNum} ──`);
  log(`  YOU: "${result.card.narration}"`);
  log(`\n  [${result.card.id}] → ${verdict}`);
  log(`  Score: ${sign}${result.delta} → ${result.score}`);

  const quip = puzzle.verdictQuips[result.card.id];
  if (quip) {
    log(`\n  KOA: ${result.isLie ? quip.lie : quip.truth}`);
  } else if (result.isLie) {
    log(`\n  KOA: "That was a lie. Strength ${result.card.strength} deducted."`);
  } else {
    log(`\n  KOA: "That checks out. Strength ${result.card.strength} added."`);
  }
}

function printReactiveHint(state: GameState) {
  if (state.activeHint) {
    log(`\n  KOA: ${state.activeHint}`);
  }
}

function printOutcome(state: GameState, puzzle: Puzzle) {
  const liesPlayed = state.played.filter(c => c.isLie).length;
  const tier = getTier(state.score, puzzle.target, liesPlayed);

  const tierLine = tier === 'FLAWLESS' || tier === 'CLEARED' ? 'ACCESS GRANTED' : 'ACCESS DENIED';
  const emoji = state.played.map(c => c.isLie ? '❌' : '✅').join(' ');

  log(`
╔═══════════════════════════════════════════════════════════════╗
║  ${tierLine}${' '.repeat(Math.max(0, 60 - tierLine.length))}║
╚═══════════════════════════════════════════════════════════════╝

  ${emoji} — ${tier} (${state.score}/${puzzle.target})

  KOA: "${puzzle.dialogue[tier.toLowerCase() as keyof typeof puzzle.dialogue]}"

  ── Play Summary ──`);
  for (let i = 0; i < state.played.length; i++) {
    const c = state.played[i]!;
    const verdict = c.isLie ? 'LIE' : 'TRUTH';
    const delta = c.isLie ? -(c.strength - 1) : +c.strength;
    const sign = delta > 0 ? '+' : '';
    log(`  Turn ${i + 1}: ${c.id} → ${verdict} (${sign}${delta})`);
  }
  log(`  Final score: ${state.score}`);

  // Reveal lies
  const lies = puzzle.cards.filter(c => c.isLie);
  log(`\n  ── The Lies Were ──`);
  for (const lie of lies) {
    const played = state.played.some(c => c.id === lie.id);
    log(`  ${lie.id}: "${lie.claim}" ${played ? '(you played this)' : '(avoided)'}`);
  }

  // Share card
  log(`
  ── Share ──
  HOME SMART HOME
  "${puzzle.name}"
  ${emoji} — ${tier} (${state.score}/${puzzle.target})
  KOA: "${puzzle.dialogue[tier.toLowerCase() as keyof typeof puzzle.dialogue]}"
`);
}

// ============================================================================
// Interactive CLI
// ============================================================================

async function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve));
}

async function play(puzzle: Puzzle) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const state: GameState = {
    score: 0,
    played: [],
    hand: [...puzzle.cards],
    turnsPlayed: 0,
    activeHint: null,
  };

  printOpening(puzzle);

  while (state.turnsPlayed < 3) {
    printStatus(state, puzzle);
    printHand(state);

    const turnNum = state.turnsPlayed + 1;
    const input = await prompt(rl, `\n  Turn ${turnNum} — play a card (enter ID): `);
    log(`\n  Turn ${turnNum} input: ${input.trim()}`);
    const cardId = input.trim();

    if (!cardId) {
      log('  Enter a card ID.');
      continue;
    }

    const card = state.hand.find(c => c.id === cardId);
    if (!card) {
      const available = state.hand.map(c => c.id).join(', ');
      log(`  Unknown or already played card: ${cardId}. Available: ${available}`);
      continue;
    }

    const result = playCard(cardId, state, puzzle);
    printTurnResult(result, turnNum, puzzle);

    // Show reactive hint after Turn 1
    if (state.turnsPlayed === 1) {
      printReactiveHint(state);
    }
  }

  printOutcome(state, puzzle);
  if (logStream) logStream.end();
  rl.close();
}

// ============================================================================
// Entry Point
// ============================================================================

const puzzleArg = process.argv.find((_, i, a) => a[i - 1] === '--puzzle') || 'power-outage';
const selectedPuzzle = PUZZLES_BY_SLUG[puzzleArg];
if (!selectedPuzzle) {
  console.error(`Unknown puzzle: ${puzzleArg}. Available: ${Object.keys(PUZZLES_BY_SLUG).join(', ')}`);
  process.exit(1);
}
play(selectedPuzzle);
