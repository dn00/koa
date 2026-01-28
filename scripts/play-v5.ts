#!/usr/bin/env npx tsx
/**
 * V5 Play Engine — Micro-Daily Puzzle
 *
 * Home AI theme: KOA is your smart home assistant, not a judge.
 * Hidden truthiness: player can't see which cards are lies.
 * Type tax: repeat evidence type = -2 on next play.
 * Objection: after T2, KOA challenges last card.
 *
 * Usage:
 *   Interactive:   npx tsx scripts/play-v5.ts --puzzle midnight-print
 *   Turn-by-turn:  npx tsx scripts/play-v5.ts --puzzle midnight-print --state /tmp/game.json --pick browser_history
 *   With objection: npx tsx scripts/play-v5.ts --state /tmp/game.json --objection stand
 *   Hard mode:     npx tsx scripts/play-v5.ts --puzzle midnight-print --difficulty hard
 *   Agent mode:    npx tsx scripts/play-v5.ts --puzzle midnight-print --state /tmp/game.json --pick browser_history --seed 12345 --json
 *
 * Flags:
 *   --puzzle [slug]       Select puzzle (default: midnight-print)
 *   --difficulty [level]  easy|standard|hard (default: standard)
 *   --state [path]        Turn-by-turn state file
 *   --pick [card_id]      Play this card
 *   --objection [choice]  stand|withdraw
 *   --seed [number]       Deterministic seed for reproducibility
 *   --json                JSON output for agent testing
 *   --log [path]          Write transcript to file
 *   --no-objection        Disable objection mechanic
 *   --no-type-tax         Disable type tax mechanic
 *   --verbose             Show extra debug info
 */

import * as readline from 'readline';
import * as fs from 'fs';
import type { Card, GameState, TurnResult, Tier, V5Puzzle, ObjectionState, GameConfig } from './v5-types.js';
import { DEFAULT_CONFIG, EASY_CONFIG, HARD_CONFIG } from './v5-types.js';
import { V5_PUZZLES_BY_SLUG } from './v5-puzzles.js';
import { stitchNarration, pickKoaLine, pickPuzzleBark } from './v5-dialogue.js';
import { scoreCard, checkTypeTax, getTier, resolveObjection, shouldTriggerObjection, detectAxis } from './v5-rules.js';

// ============================================================================
// CLI Args
// ============================================================================

function getArg(name: string): string | null {
  const idx = process.argv.findIndex(a => a === `--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

// ============================================================================
// Config Selection
// ============================================================================

function buildConfig(): GameConfig {
  const difficultyArg = getArg('difficulty') || 'standard';
  let config: GameConfig;

  switch (difficultyArg) {
    case 'easy':
      config = { ...EASY_CONFIG };
      break;
    case 'hard':
      config = { ...HARD_CONFIG };
      break;
    default:
      config = { ...DEFAULT_CONFIG };
  }

  // Optional flag overrides
  if (hasFlag('no-objection')) {
    config = { ...config, objection: { ...config.objection, enabled: false } };
  }
  if (hasFlag('no-type-tax')) {
    config = { ...config, typeTax: { ...config.typeTax, enabled: false } };
  }

  return config;
}

const CONFIG = buildConfig();

// Deterministic seed for reproducible runs
const seedArg = getArg('seed');
const SEED = seedArg ? parseInt(seedArg, 10) : Date.now();
let seedCounter = 0;
function nextSeed(): number {
  return SEED + (seedCounter++);
}

// JSON output mode for agent testing
const JSON_MODE = hasFlag('json');
const VERBOSE = hasFlag('verbose');

// ============================================================================
// Logging
// ============================================================================

const logPath = getArg('log');
let logStream: fs.WriteStream | null = null;
if (logPath) {
  logStream = fs.createWriteStream(logPath, { flags: 'a' });
}

function log(msg: string) {
  if (!JSON_MODE) console.log(msg);
  if (logStream) logStream.write(msg + '\n');
}

// ============================================================================
// Agent JSON Output
// ============================================================================

interface AgentOutput {
  seed: number;
  puzzle: string;
  turn: number;
  belief: number;
  tier: Tier;
  target: number;
  gameOver: boolean;
  objectionPending: boolean;
  // Puzzle context (shown on first turn)
  scenario?: string;
  knownFacts?: string[];
  openingLine?: string;
  lastAction?: {
    type: 'play' | 'objection';
    cardId?: string;
    beliefChange: number;
    wasLie?: boolean;
    typeTaxApplied?: boolean;
    objectionResult?: string;
    koaResponse: string;
  };
  hand: { id: string; strength: number; type: string; location: string; time: string; claim: string }[];
  played: string[];
  config: {
    difficulty: string;
    objectionEnabled: boolean;
    typeTaxEnabled: boolean;
  };
  // Only shown at game end
  liesRevealed?: string[];
}

function emitJson(output: AgentOutput) {
  if (JSON_MODE) {
    console.log(JSON.stringify(output));
  }
}

// ============================================================================
// Display Helpers — Home AI Theme
// ============================================================================

function printOpening(puzzle: V5Puzzle) {
  log(`
╔═══════════════════════════════════════════════════════════════╗
║  HOME SMART HOME — "${puzzle.name}"${' '.repeat(Math.max(0, 40 - puzzle.name.length))}║
╚═══════════════════════════════════════════════════════════════╝

  ${puzzle.scenario.split('\n').join('\n  ')}

  ┌─ KOA ─┐
  │ "${puzzle.openingLine}"
  └───────┘

  KNOWN FACTS:
${puzzle.knownFacts.map(f => `    • ${f}`).join('\n')}

  Target Belief: ${puzzle.target}
  Cards: ${puzzle.cards.length} (play 3, leave 3)
  Turns: 3
`);

  if (CONFIG.typeTax.enabled) {
    log(`  Type Tax: Repeat evidence type = ${CONFIG.typeTax.penalty} on next play`);
  }
  if (CONFIG.objection.enabled) {
    log(`  Objection: After Turn 2, KOA challenges your last card`);
  }
  log('');
}

function printHand(hand: Card[]) {
  log('  YOUR EVIDENCE:');
  log('  ──────────────');
  for (const card of hand) {
    log(`  [${card.id}] str:${card.strength}`);
    log(`    ${card.evidenceType} | ${card.location} | ${card.time}`);
    log(`    "${card.claim}"`);
  }
}

function printStatus(state: GameState, puzzle: V5Puzzle) {
  const bar = (val: number, max: number, width: number) => {
    const filled = Math.min(width, Math.max(0, Math.round((Math.max(0, val) / max) * width)));
    return '█'.repeat(filled) + '░'.repeat(width - filled);
  };
  const tier = getTier(state.belief, puzzle.target, CONFIG);

  log(`\n  Belief: [${bar(state.belief, 100, 20)}] ${state.belief}/100 (${tier})`);
  log(`  Target: ${puzzle.target} | Turn: ${state.turnsPlayed + 1}/${CONFIG.turnsPerGame}`);
}

function printTurnResult(result: TurnResult, turnNum: number) {
  log(`\n  ── Turn ${turnNum} ──`);

  log(`\n  YOU: "${result.narration}"`);

  const outcome = result.wasLie ? 'CONTRADICTION' : 'SOLID';
  const changeStr = result.beliefChange >= 0 ? `+${result.beliefChange}` : `${result.beliefChange}`;
  const taxNote = result.typeTaxApplied ? ' (includes type tax)' : '';

  log(`\n  [${result.card.id}] → ${outcome} (${changeStr} Belief${taxNote})`);

  log(`\n  ┌─ KOA ─┐`);
  log(`  │ "${result.koaResponse}"`);
  log(`  └───────┘`);
}

function printOutcome(state: GameState, puzzle: V5Puzzle) {
  const tier = getTier(state.belief, puzzle.target, CONFIG);
  const tierLine = tier === 'FLAWLESS' || tier === 'CLEARED' ? 'ACCESS GRANTED' : 'ACCESS DENIED';

  log(`
╔═══════════════════════════════════════════════════════════════╗
║  ${tierLine}${' '.repeat(Math.max(0, 60 - tierLine.length))}║
╚═══════════════════════════════════════════════════════════════╝

  ${tier} — Belief: ${state.belief}/${puzzle.target}

  ┌─ KOA ─┐
  │ "${puzzle.verdicts[tier.toLowerCase() as keyof typeof puzzle.verdicts]}"
  └───────┘

  ── Summary ──`);

  for (let i = 0; i < state.turnResults.length; i++) {
    const tr = state.turnResults[i]!;
    const outcome = tr.wasLie ? 'LIE' : 'TRUTH';
    const change = tr.beliefChange >= 0 ? `+${tr.beliefChange}` : `${tr.beliefChange}`;
    const tax = tr.typeTaxApplied ? ' [tax]' : '';
    log(`  T${i + 1}: ${tr.card.id} (${outcome}) → ${change}${tax}`);
  }

  if (state.objection?.resolved) {
    const obj = state.objection;
    const action = obj.result === 'stood_by' ? 'STOOD BY' : 'WITHDREW';
    const change = obj.beliefChange >= 0 ? `+${obj.beliefChange}` : `${obj.beliefChange}`;
    log(`  Objection: ${obj.challengedCard?.id} — ${action} → ${change}`);
  }

  log(`\n  ── Unplayed ──`);
  for (const card of state.hand) {
    const isLie = card.isLie;
    const note = isLie ? '← LIE (good dodge!)' : '';
    log(`  [${card.id}] ${note}`);
  }

  // Share card
  const emojis = state.turnResults.map(tr => tr.wasLie ? '✗' : '✓').join('');

  log(`
  ── Share ──
  HOME SMART HOME: "${puzzle.name}"
  ${emojis} — ${tier} (${state.belief}/${puzzle.target})
`);
}

// ============================================================================
// Objection Handler
// ============================================================================

async function handleObjection(
  state: GameState,
  puzzle: V5Puzzle,
  rl: readline.Interface
): Promise<void> {
  const lastCard = state.turnResults[state.turnResults.length - 1]?.card;
  if (!lastCard) return;

  log(`\n╔═══════════════════════════════════════════════════════════════╗`);
  log(`║  KOA CHALLENGES                                                ║`);
  log(`╚═══════════════════════════════════════════════════════════════╝`);

  const promptLine = pickPuzzleBark(puzzle, 'OBJECTION_PROMPT', lastCard.id, nextSeed())
    || pickKoaLine('OBJECTION_PROMPT', 'coherence', 'suspicion', 2, nextSeed());
  log(`\n  KOA: "${promptLine}"`);
  log(`\n  Challenging: [${lastCard.id}] — "${lastCard.claim}"`);
  log(`\n  [STAND BY] If solid: +${CONFIG.objection.stoodByTruth} | If contradiction: ${CONFIG.objection.stoodByLie}`);
  log(`  [WITHDRAW] ${CONFIG.objection.withdrew} regardless`);

  let choice: 'stood_by' | 'withdrawn' | null = null;
  while (!choice) {
    const input = await prompt(rl, `\n  Your choice (stand/withdraw): `);
    const norm = input.trim().toLowerCase();
    if (norm === 'stand' || norm === 's') choice = 'stood_by';
    else if (norm === 'withdraw' || norm === 'w') choice = 'withdrawn';
    else log(`  Enter "stand" or "withdraw".`);
  }

  const wasLie = lastCard.isLie;
  const beliefChange = resolveObjection(wasLie, choice, CONFIG);

  let koaLine: string;
  if (choice === 'stood_by') {
    const slot = wasLie ? 'OBJECTION_STOOD_LIE' : 'OBJECTION_STOOD_TRUTH';
    koaLine = pickPuzzleBark(puzzle, slot, lastCard.id, nextSeed())
      || pickKoaLine(slot, wasLie ? 'contradiction' : 'coherence', wasLie ? 'warning' : 'praise', 2, nextSeed());
  } else {
    koaLine = pickPuzzleBark(puzzle, 'OBJECTION_WITHDREW', lastCard.id, nextSeed())
      || pickKoaLine('OBJECTION_WITHDREW', 'coherence', 'neutral', 2, nextSeed());
  }

  state.belief += beliefChange;
  state.objection = { challengedCard: lastCard, resolved: true, result: choice, beliefChange };

  const changeStr = beliefChange >= 0 ? `+${beliefChange}` : `${beliefChange}`;
  log(`\n  KOA: "${koaLine}"`);
  log(`  → ${changeStr} Belief (now ${state.belief})`);
}

// ============================================================================
// CLI Input Helpers
// ============================================================================

const isPiped = !process.stdin.isTTY;
let pipedLines: string[] = [];
let pipedReady: Promise<void> | null = null;

if (isPiped) {
  pipedReady = new Promise<void>(resolve => {
    let buf = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { buf += chunk; });
    process.stdin.on('end', () => {
      pipedLines = buf.split('\n').filter(l => l.length > 0);
      resolve();
    });
    process.stdin.resume();
  });
}

async function prompt(rl: readline.Interface, question: string): Promise<string> {
  process.stdout.write(question);
  if (isPiped) {
    if (pipedReady) await pipedReady;
    const line = pipedLines.shift() || '';
    console.log(line);
    return line;
  }
  return new Promise(resolve => rl.question('', resolve));
}

// ============================================================================
// Interactive Play
// ============================================================================

async function play(puzzle: V5Puzzle) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: !isPiped });
  const state: GameState = {
    belief: CONFIG.startingBelief,
    hand: [...puzzle.cards],
    played: [],
    turnResults: [],
    turnsPlayed: 0,
    objection: null,
  };

  printOpening(puzzle);

  while (state.turnsPlayed < CONFIG.turnsPerGame) {
    printStatus(state, puzzle);
    printHand(state.hand);

    const turnNum = state.turnsPlayed + 1;

    // Pick card
    let card: Card | undefined;
    while (!card) {
      const input = await prompt(rl, `\n  Turn ${turnNum} — submit evidence: `);
      card = state.hand.find(c => c.id === input.trim());
      if (!card) {
        log(`  Unknown card. Available: ${state.hand.map(c => c.id).join(', ')}`);
      }
    }

    // Check type tax
    const prevCard = state.played.length > 0 ? state.played[state.played.length - 1]! : null;
    const typeTaxApplied = checkTypeTax(card, prevCard, CONFIG);

    // Score
    const { beliefChange, wasLie } = scoreCard(card, CONFIG, typeTaxApplied);

    state.belief += beliefChange;
    state.hand = state.hand.filter(c => c.id !== card!.id);
    state.played.push(card);
    state.turnsPlayed++;

    // Build narration
    const narration = stitchNarration(card, prevCard, state.turnsPlayed, nextSeed());

    // KOA response
    const { axis, valence, intensity } = detectAxis(card, state.played.slice(0, -1), wasLie, typeTaxApplied);
    const koaResponse = pickPuzzleBark(puzzle, 'AFTER_PLAY', card.id, nextSeed())
      || pickKoaLine('AFTER_PLAY', axis, valence, intensity, nextSeed(), { location: card.location });

    const result: TurnResult = { card, beliefChange, wasLie, typeTaxApplied, narration, koaResponse };
    state.turnResults.push(result);

    printTurnResult(result, state.turnsPlayed);

    // Objection after T2
    if (shouldTriggerObjection(state.turnsPlayed, CONFIG)) {
      await handleObjection(state, puzzle, rl);
    }
  }

  printOutcome(state, puzzle);
  if (logStream) logStream.end();
  rl.close();
}

// ============================================================================
// Turn-by-Turn State Mode (for agents)
// ============================================================================

interface SavedState {
  puzzleSlug: string;
  seed: number;
  belief: number;
  turnsPlayed: number;
  handIds: string[];
  playedIds: string[];
  turnResults: {
    cardId: string;
    beliefChange: number;
    wasLie: boolean;
    typeTaxApplied: boolean;
    narration: string;
    koaResponse: string;
  }[];
  objectionPending: boolean;
  objection: {
    challengedCardId: string;
    resolved: boolean;
    result: string | null;
    beliefChange: number;
  } | null;
}

function playTurn(
  puzzle: V5Puzzle,
  statePath: string,
  pickArg: string | null,
  objectionArg: string | null
) {
  let state: GameState;
  let savedState: SavedState | null = null;
  let isFirstTurn = false;

  if (fs.existsSync(statePath)) {
    savedState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    if (savedState!.puzzleSlug !== puzzle.slug) {
      console.error(`State file puzzle mismatch`);
      process.exit(1);
    }

    state = {
      belief: savedState!.belief,
      hand: savedState!.handIds.map(id => puzzle.cards.find(c => c.id === id)!),
      played: savedState!.playedIds.map(id => puzzle.cards.find(c => c.id === id)!),
      turnResults: savedState!.turnResults.map(tr => ({
        card: puzzle.cards.find(c => c.id === tr.cardId)!,
        beliefChange: tr.beliefChange,
        wasLie: tr.wasLie,
        typeTaxApplied: tr.typeTaxApplied,
        narration: tr.narration,
        koaResponse: tr.koaResponse,
      })),
      turnsPlayed: savedState!.turnsPlayed,
      objection: savedState!.objection ? {
        challengedCard: puzzle.cards.find(c => c.id === savedState!.objection!.challengedCardId) || null,
        resolved: savedState!.objection.resolved,
        result: savedState!.objection.result as 'stood_by' | 'withdrawn' | null,
        beliefChange: savedState!.objection.beliefChange,
      } : null,
    };
  } else {
    isFirstTurn = true;
    state = {
      belief: CONFIG.startingBelief,
      hand: [...puzzle.cards],
      played: [],
      turnResults: [],
      turnsPlayed: 0,
      objection: null,
    };
  }

  // Handle pending objection
  if (savedState?.objectionPending && objectionArg) {
    const choice = objectionArg.toLowerCase();
    if (choice !== 'stand' && choice !== 'withdraw') {
      console.error('--objection must be "stand" or "withdraw"');
      process.exit(1);
    }

    const lastCard = state.turnResults[state.turnResults.length - 1]?.card;
    if (!lastCard) process.exit(1);

    const wasLie = lastCard.isLie;
    const beliefChange = resolveObjection(wasLie, choice === 'stand' ? 'stood_by' : 'withdrawn', CONFIG);

    let koaLine: string;
    if (choice === 'stand') {
      const slot = wasLie ? 'OBJECTION_STOOD_LIE' : 'OBJECTION_STOOD_TRUTH';
      koaLine = pickPuzzleBark(puzzle, slot, lastCard.id, nextSeed())
        || pickKoaLine(slot, wasLie ? 'contradiction' : 'coherence', wasLie ? 'warning' : 'praise', 2, nextSeed());
    } else {
      koaLine = pickPuzzleBark(puzzle, 'OBJECTION_WITHDREW', lastCard.id, nextSeed())
        || pickKoaLine('OBJECTION_WITHDREW', 'coherence', 'neutral', 2, nextSeed());
    }

    state.belief += beliefChange;
    state.objection = {
      challengedCard: lastCard,
      resolved: true,
      result: choice === 'stand' ? 'stood_by' : 'withdrawn',
      beliefChange,
    };

    const changeStr = beliefChange >= 0 ? `+${beliefChange}` : `${beliefChange}`;
    log(`\n  KOA: "${koaLine}"`);
    log(`  → ${changeStr} Belief (now ${state.belief})`);

    // JSON output for objection resolution
    const tier = getTier(state.belief, puzzle.target, CONFIG);
    emitJson({
      seed: SEED,
      puzzle: puzzle.slug,
      turn: state.turnsPlayed,
      belief: state.belief,
      tier,
      target: puzzle.target,
      gameOver: false,
      objectionPending: false,
      lastAction: {
        type: 'objection',
        cardId: lastCard.id,
        beliefChange,
        wasLie,
        objectionResult: choice === 'stand' ? 'stood_by' : 'withdrawn',
        koaResponse: koaLine,
      },
      hand: state.hand.map(c => ({ id: c.id, strength: c.strength, type: c.evidenceType, location: c.location, time: c.time, claim: c.claim })),
      played: state.played.map(c => c.id),
      config: {
        difficulty: getArg('difficulty') || 'standard',
        objectionEnabled: CONFIG.objection.enabled,
        typeTaxEnabled: CONFIG.typeTax.enabled,
      },
    });

    // Save and exit if no pick
    if (!pickArg) {
      saveState(state, puzzle, statePath, false);
      return;
    }
  }

  // Check pending objection
  if (savedState?.objectionPending && !objectionArg) {
    const lastCard = state.turnResults[state.turnResults.length - 1]?.card;
    log(`\n  KOA CHALLENGES — Pending`);
    log(`  Challenging: [${lastCard?.id}]`);
    log(`  Use --objection stand OR --objection withdraw`);

    emitJson({
      seed: SEED,
      puzzle: puzzle.slug,
      turn: state.turnsPlayed,
      belief: state.belief,
      tier: getTier(state.belief, puzzle.target, CONFIG),
      target: puzzle.target,
      gameOver: false,
      objectionPending: true,
      hand: state.hand.map(c => ({ id: c.id, strength: c.strength, type: c.evidenceType, location: c.location, time: c.time, claim: c.claim })),
      played: state.played.map(c => c.id),
      config: {
        difficulty: getArg('difficulty') || 'standard',
        objectionEnabled: CONFIG.objection.enabled,
        typeTaxEnabled: CONFIG.typeTax.enabled,
      },
    });
    process.exit(0);
  }

  if (isFirstTurn) {
    printOpening(puzzle);
  }

  // Handle pick
  if (!pickArg) {
    printStatus(state, puzzle);
    printHand(state.hand);
    console.error('Use --pick [card_id] to submit evidence');

    emitJson({
      seed: SEED,
      puzzle: puzzle.slug,
      turn: state.turnsPlayed,
      belief: state.belief,
      tier: getTier(state.belief, puzzle.target, CONFIG),
      target: puzzle.target,
      gameOver: false,
      objectionPending: false,
      // Include puzzle context on first turn
      ...(isFirstTurn && {
        scenario: puzzle.scenario,
        knownFacts: puzzle.knownFacts,
        openingLine: puzzle.openingLine,
      }),
      hand: state.hand.map(c => ({ id: c.id, strength: c.strength, type: c.evidenceType, location: c.location, time: c.time, claim: c.claim })),
      played: state.played.map(c => c.id),
      config: {
        difficulty: getArg('difficulty') || 'standard',
        objectionEnabled: CONFIG.objection.enabled,
        typeTaxEnabled: CONFIG.typeTax.enabled,
      },
    });
    process.exit(1);
  }

  const card = state.hand.find(c => c.id === pickArg);
  if (!card) {
    console.error(`Card "${pickArg}" not in hand. Available: ${state.hand.map(c => c.id).join(', ')}`);
    process.exit(1);
  }

  if (state.turnsPlayed >= CONFIG.turnsPerGame) {
    console.error('Game complete. Delete state file to restart.');
    process.exit(1);
  }

  printStatus(state, puzzle);
  printHand(state.hand);

  // Check type tax
  const prevCard = state.played.length > 0 ? state.played[state.played.length - 1]! : null;
  const typeTaxApplied = checkTypeTax(card, prevCard, CONFIG);

  // Score
  const { beliefChange, wasLie } = scoreCard(card, CONFIG, typeTaxApplied);

  state.belief += beliefChange;
  state.hand = state.hand.filter(c => c.id !== card.id);
  state.played.push(card);
  state.turnsPlayed++;

  // Build narration
  const narration = stitchNarration(card, prevCard, state.turnsPlayed, nextSeed());

  // KOA response
  const { axis, valence, intensity } = detectAxis(card, state.played.slice(0, -1), wasLie, typeTaxApplied);
  const koaResponse = pickPuzzleBark(puzzle, 'AFTER_PLAY', card.id, nextSeed())
    || pickKoaLine('AFTER_PLAY', axis, valence, intensity, nextSeed(), { location: card.location });

  const result: TurnResult = { card, beliefChange, wasLie, typeTaxApplied, narration, koaResponse };
  state.turnResults.push(result);

  printTurnResult(result, state.turnsPlayed);

  // Objection after T2
  const objectionPending = shouldTriggerObjection(state.turnsPlayed, CONFIG);
  if (objectionPending) {
    const promptLine = pickPuzzleBark(puzzle, 'OBJECTION_PROMPT', card.id, nextSeed())
      || pickKoaLine('OBJECTION_PROMPT', 'coherence', 'suspicion', 2, nextSeed());
    log(`\n╔═══════════════════════════════════════════════════════════════╗`);
    log(`║  KOA CHALLENGES                                                ║`);
    log(`╚═══════════════════════════════════════════════════════════════╝`);
    log(`\n  KOA: "${promptLine}"`);
    log(`  Challenging: [${card.id}]`);
    log(`\n  Use --objection stand OR --objection withdraw`);
  }

  const gameOver = state.turnsPlayed >= CONFIG.turnsPerGame && !objectionPending;
  const tier = getTier(state.belief, puzzle.target, CONFIG);

  // JSON output for agents
  // NOTE: wasLie is hidden when objectionPending to preserve tension in stand/withdraw decision
  emitJson({
    seed: SEED,
    puzzle: puzzle.slug,
    turn: state.turnsPlayed,
    belief: state.belief,
    tier,
    target: puzzle.target,
    gameOver,
    objectionPending,
    // Include puzzle context on first turn
    ...(state.turnsPlayed === 1 && {
      scenario: puzzle.scenario,
      knownFacts: puzzle.knownFacts,
      openingLine: puzzle.openingLine,
    }),
    lastAction: {
      type: 'play',
      cardId: card.id,
      beliefChange,
      // Only reveal wasLie AFTER objection decision is made (or if no objection)
      ...(objectionPending ? {} : { wasLie }),
      typeTaxApplied,
      koaResponse,
    },
    hand: state.hand.map(c => ({ id: c.id, strength: c.strength, type: c.evidenceType, location: c.location, time: c.time, claim: c.claim })),
    played: state.played.map(c => c.id),
    config: {
      difficulty: getArg('difficulty') || 'standard',
      objectionEnabled: CONFIG.objection.enabled,
      typeTaxEnabled: CONFIG.typeTax.enabled,
    },
    liesRevealed: gameOver ? puzzle.lies.map(l => l.cardId) : undefined,
  });

  // Save or finish
  if (!gameOver) {
    saveState(state, puzzle, statePath, objectionPending);
  } else {
    printOutcome(state, puzzle);
    try { fs.unlinkSync(statePath); } catch {}
  }

  if (logStream) logStream.end();
}

function saveState(state: GameState, puzzle: V5Puzzle, path: string, objectionPending: boolean) {
  const saved: SavedState = {
    puzzleSlug: puzzle.slug,
    seed: SEED,
    belief: state.belief,
    turnsPlayed: state.turnsPlayed,
    handIds: state.hand.map(c => c.id),
    playedIds: state.played.map(c => c.id),
    turnResults: state.turnResults.map(tr => ({
      cardId: tr.card.id,
      beliefChange: tr.beliefChange,
      wasLie: tr.wasLie,
      typeTaxApplied: tr.typeTaxApplied,
      narration: tr.narration,
      koaResponse: tr.koaResponse,
    })),
    objectionPending,
    objection: state.objection ? {
      challengedCardId: state.objection.challengedCard?.id || '',
      resolved: state.objection.resolved,
      result: state.objection.result,
      beliefChange: state.objection.beliefChange,
    } : null,
  };
  fs.writeFileSync(path, JSON.stringify(saved, null, 2));
}

// ============================================================================
// Entry Point
// ============================================================================

const puzzleArg = getArg('puzzle') || 'midnight-print';
const selectedPuzzle = V5_PUZZLES_BY_SLUG[puzzleArg];
if (!selectedPuzzle) {
  console.error(`Unknown puzzle: ${puzzleArg}. Available: ${Object.keys(V5_PUZZLES_BY_SLUG).join(', ')}`);
  process.exit(1);
}

const stateArg = getArg('state');
const pickArg = getArg('pick');
const objectionArg = getArg('objection');

if (stateArg) {
  playTurn(selectedPuzzle, stateArg, pickArg || null, objectionArg || null);
} else {
  play(selectedPuzzle);
}
