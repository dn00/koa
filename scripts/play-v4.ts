#!/usr/bin/env npx tsx
/**
 * V4 Pair Play — Interactive CLI Game
 *
 * Play 3 pairs of 2 cards. Truths add strength, lies subtract.
 * Combo bonuses fire only if both cards in a pair are truths.
 * 8 cards, 3 lies — you must play at least 1 lie.
 *
 * Usage: npx tsx scripts/play-v4.ts [--puzzle midnight-print-job] [--log path]
 *
 * Training mode flags (disable advanced mechanics for learning):
 *   --no-pressure      Disable pressure penalties (order won't matter)
 *   --no-objection     Skip The Objection after T2
 *   --training         Shortcut for --no-pressure --no-objection
 *
 * Turn-by-turn mode (for agent use):
 *   npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/game.json --pick card1,card2
 */

import * as readline from 'readline';
import * as fs from 'fs';
import type { Card, ComboResult, PairResult, Tier, GameState, V4Puzzle, StanceConfig, PressureState, ObjectionState } from './v4-types.js';
import { STANCES } from './v4-types.js';

// ============================================================================
// Pressure System
// ============================================================================
// KOA applies pressure based on patterns in your play. Pressure creates penalties
// on subsequent turns, making ORDER matter.
//
// RULES:
// 1. HIGH STRENGTH: If previous pair had combined strength > 10, -1 this turn.
//    "Leading with your strongest evidence? What are you saving?"
//
// 2. TYPE ECHO: If you play a type you've already played before, -1 per card.
//    "You keep leaning on digital evidence. I'm skeptical."
//
// 3. SAME-LOCATION CHAIN: If previous pair shared a location AND current pair
//    has a card from that same location, -1.
//    "Everything keeps coming back to the kitchen."
//
// These compound. Strategic order reduces total pressure.

function initPressure(): PressureState {
  return {
    previousPairStrength: 0,
    typesPlayedBefore: new Set(),
    lastPairLocation: null,
  };
}

function calculatePressurePenalty(pair: [Card, Card], pressure: PressureState): { penalty: number; reasons: string[] } {
  let penalty = 0;
  const reasons: string[] = [];

  // HIGH STRENGTH: previous pair > 10 combined strength
  if (pressure.previousPairStrength > 10) {
    penalty -= 1;
    reasons.push('HIGH STRENGTH (-1)');
  }

  // TYPE ECHO and LOCATION CHAIN removed - too much cognitive load for marginal strategic depth

  return { penalty, reasons };
}

function updatePressure(pair: [Card, Card], oldPressure: PressureState): PressureState {
  const [a, b] = pair;
  const newTypesPlayed = new Set(oldPressure.typesPlayedBefore);
  newTypesPlayed.add(a.evidenceType);
  newTypesPlayed.add(b.evidenceType);

  return {
    previousPairStrength: a.strength + b.strength,
    typesPlayedBefore: newTypesPlayed,
    lastPairLocation: a.location === b.location ? a.location : null,
  };
}
import { V4_PUZZLES_BY_SLUG } from './v4-puzzles.js';

// ============================================================================
// Combo Scoring
// ============================================================================

function getCombos(a: Card, b: Card, stance: StanceConfig): ComboResult[] {
  const combos: ComboResult[] = [];
  if (a.location === b.location && stance.corroboration > 0) {
    combos.push({ name: 'Corroboration', bonus: stance.corroboration, description: `Same location: ${a.location}` });
  }
  // Adjacent time — parse hours for simplicity
  const timeToMinutes = (t: string): number => {
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let h = parseInt(match[1]!);
    const m = parseInt(match[2]!);
    const ampm = match[3]!.toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };
  const diff = Math.abs(timeToMinutes(a.time) - timeToMinutes(b.time));
  if (diff > 0 && diff <= 90 && stance.timeline > 0) {
    combos.push({ name: 'Timeline', bonus: stance.timeline, description: `Adjacent times: ${a.time} & ${b.time}` });
  }
  if (a.evidenceType !== b.evidenceType && stance.coverage > 0) {
    combos.push({ name: 'Coverage', bonus: stance.coverage, description: `Different types: ${a.evidenceType} + ${b.evidenceType}` });
  }
  if (a.evidenceType === b.evidenceType && stance.reinforcement > 0) {
    combos.push({ name: 'Reinforcement', bonus: stance.reinforcement, description: `Same type: ${a.evidenceType}` });
  }
  return combos;
}

function scorePair(a: Card, b: Card, stance: StanceConfig, pressurePenalty: number = 0): PairResult {
  const aScore = a.isLie ? -(a.strength - 1) : a.strength;
  const bScore = b.isLie ? -(b.strength - 1) : b.strength;
  const baseScore = aScore + bScore;

  const bothTruth = !a.isLie && !b.isLie;
  const combos = bothTruth ? getCombos(a, b, stance) : [];
  const comboTotal = combos.reduce((s, c) => s + c.bonus, 0);

  // Add pressure penalty to total (not to base, so display is clear)
  const totalScore = baseScore + comboTotal + pressurePenalty;

  return {
    cards: [a, b],
    baseScore,
    combos,
    comboTotal,
    totalScore,
    liesInPair: (a.isLie ? 1 : 0) + (b.isLie ? 1 : 0),
  };
}

// ============================================================================
// Tier
// ============================================================================

function getTier(score: number, target: number): Tier {
  if (score >= target + 5) return 'FLAWLESS';
  if (score >= target) return 'CLEARED';
  if (score >= target - 3) return 'CLOSE';
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

function printOpening(puzzle: V4Puzzle) {
  const stance = STANCES[puzzle.stance];
  const modeLabel = trainingMode ? ' [TRAINING MODE]' : (noPressure || noObjection ? ' [MODIFIED]' : '');
  log(`
╔═══════════════════════════════════════════════════════════════╗
║  HOME SMART HOME — "${puzzle.name}"${' '.repeat(Math.max(0, 39 - puzzle.name.length - modeLabel.length))}${modeLabel}║
╚═══════════════════════════════════════════════════════════════╝

  ${puzzle.scenario.split('\n').join('\n  ')}

  KOA: ${puzzle.hint}
  KOA: "${stance.hint}"

  Target score: ${puzzle.target}
  Cards in hand: ${puzzle.cards.length} (3 are lies)
  Turns: 3 (play 2 cards per turn as a pair)
  Combo bonuses: Corroboration(+${stance.corroboration}), Timeline(+${stance.timeline}), Coverage(+${stance.coverage}), Reinforcement(+${stance.reinforcement})
  Note: Combos only fire if BOTH cards in the pair are truths.${noPressure ? '\n  Pressure: DISABLED (order won\'t affect scoring)' : '\n  Pressure: ACTIVE (order matters!)'}${noObjection ? '\n  The Objection: DISABLED' : '\n  The Objection: ACTIVE (after T2, KOA will challenge a card)'}
`);
}

function printHand(state: GameState) {
  log('  YOUR HAND:');
  log('  ──────────');
  for (const card of state.hand) {
    log(`  [${card.id}]`);
    log(`    str:${card.strength}  type:${card.evidenceType.padEnd(10)} loc:${card.location.padEnd(12)} time:${card.time}`);
    log(`    "${card.claim}"`);
  }
}

function printStatus(state: GameState, puzzle: V4Puzzle) {
  const bar = (val: number, max: number, width: number) => {
    const filled = Math.min(width, Math.max(0, Math.round((Math.max(0, val) / max) * width)));
    return '█'.repeat(filled) + '░'.repeat(width - filled);
  };
  log(`\n  Score:      [${bar(state.score, puzzle.target + 5, 20)}] ${state.score}/${puzzle.target}`);
  log(`  Turns left: ${3 - state.turnsPlayed}`);
  log(`  Cards left: ${state.hand.length}`);
}

function printPairResult(
  result: PairResult,
  turnNum: number,
  puzzle: V4Puzzle,
  pressureResult?: { penalty: number; reasons: string[] }
) {
  const [a, b] = result.cards;
  log(`\n  ── Turn ${turnNum}: Pair Played ──`);

  // Combined pair narration (player's excuse weaving both cards)
  const key = pairKey(a.id, b.id);
  const narration = puzzle.pairNarrations[key];
  if (narration) {
    log(`\n  YOU: "${narration.playerStatement}"`);
    log(`\n  KOA: "${narration.koaResponse}"`);
  } else {
    // Fallback to individual narrations if pair narration missing
    log(`\n  YOU: "${a.narration}"`);
    log(`  YOU: "${b.narration}"`);
  }

  // Reveal truth/lie and scores
  log(`\n  [${a.id}] → ${a.isLie ? 'LIE' : 'TRUTH'} (${a.isLie ? -(a.strength - 1) : '+' + a.strength})`);
  log(`  [${b.id}] → ${b.isLie ? 'LIE' : 'TRUTH'} (${b.isLie ? -(b.strength - 1) : '+' + b.strength})`);

  if (result.combos.length > 0) {
    log(`\n  COMBOS:`);
    for (const c of result.combos) {
      log(`    ✦ ${c.name} +${c.bonus} (${c.description})`);
    }
  } else if (result.liesInPair > 0) {
    log(`\n  No combos — lie in pair cancels all bonuses.`);
  } else {
    log(`\n  No combos triggered.`);
  }

  // Show pressure penalties if any
  if (pressureResult && pressureResult.penalty < 0) {
    log(`\n  PRESSURE:`);
    for (const reason of pressureResult.reasons) {
      log(`    ⚠ ${reason}`);
    }
  }

  log(`  Pair total: ${result.totalScore > 0 ? '+' : ''}${result.totalScore}`);

  // Verdict quips
  const qa = puzzle.verdictQuips[a.id];
  const qb = puzzle.verdictQuips[b.id];
  if (qa) log(`\n  KOA on ${a.id}: ${a.isLie ? qa.lie : qa.truth}`);
  if (qb) log(`  KOA on ${b.id}: ${b.isLie ? qb.lie : qb.truth}`);
}

function printReactiveHint(key: string, puzzle: V4Puzzle) {
  const hint = puzzle.reactiveHints[key];
  if (hint) {
    log(`\n  ┌─ KOA's Observation ─┐`);
    log(`  │ ${hint.text}`);
    log(`  └─────────────────────┘`);
  }
}

function printReactiveTell(result: PairResult, stance: StanceConfig, puzzle: V4Puzzle) {
  const [a, b] = result.cards;
  const sameType = a.evidenceType === b.evidenceType;
  const sameLocation = a.location === b.location;
  const combinedStrength = a.strength + b.strength;

  // Parse times to check if both are in the "suspicious window" (10:30 PM - 1 AM)
  const parseHour = (t: string): number => {
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let hour = parseInt(match[1]!);
    const isPM = match[3]!.toUpperCase() === 'PM';
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    return hour;
  };
  const hourA = parseHour(a.time);
  const hourB = parseHour(b.time);
  const inSuspiciousWindow = (h: number) => h >= 22 || h === 0; // 10 PM - 1 AM
  const bothInWindow = inSuspiciousWindow(hourA) && inSuspiciousWindow(hourB);
  const neitherInWindow = !inSuspiciousWindow(hourA) && !inSuspiciousWindow(hourB);

  let tell = '';

  // Pattern-based observations (no lie detection - player sees TRUTH/LIE reveal separately)
  // These are KOA commenting on what the player is doing, not verdicts

  if (bothInWindow) {
    tell = "Both from the late-night window. Bold move — or reckless.";
  } else if (neitherInWindow) {
    tell = "Staying away from the late hours. Playing it safe?";
  } else if (sameType && sameLocation) {
    tell = `Same type, same place. You're doubling down on the ${a.location.toLowerCase()}.`;
  } else if (sameType) {
    const typeComments: Record<string, string> = {
      DIGITAL: "Two digital sources. You trust the machines.",
      PHYSICAL: "Physical evidence twice. Tangible, but is it true?",
      TESTIMONY: "Witnesses backing each other up. Convenient.",
      SENSOR: "Sensor data stacked. The house is talking — but is it lying?",
    };
    tell = typeComments[a.evidenceType] || `Both ${a.evidenceType.toLowerCase()}. Leaning on one channel.`;
  } else if (sameLocation) {
    tell = `Two cards from the ${a.location.toLowerCase()}. Focused, or hiding something?`;
  } else if (combinedStrength > 12) {
    tell = "Heavy hitters early. You're burning your strongest evidence fast.";
  } else if (combinedStrength < 6) {
    tell = "Low-strength pair. Saving the good stuff for later?";
  } else {
    const generic = [
      "Mixed evidence. Building a story piece by piece.",
      "Different sources, different angles. We'll see if it holds.",
      "Covering your bases. Smart — if it's true.",
    ];
    tell = generic[Math.floor(Math.random() * generic.length)]!;
  }

  log(`\n  ┌─ KOA ─┐`);
  log(`  │ "${tell}"`);
  log(`  └───────┘`);
}

// ============================================================================
// The Objection
// ============================================================================
// After T2, KOA challenges one of your played cards.
// You must either STAND BY it or WITHDRAW it.
//
// - Stand By on TRUTH: +2 points (conviction rewarded)
// - Stand By on LIE: -3 points (you doubled down on a lie)
// - Withdraw: -2 points (you backed off, regardless of truth/lie)
//
// KOA selects the highest-strength card you've played.

async function handleObjection(
  state: GameState,
  puzzle: V4Puzzle,
  rl: readline.Interface
): Promise<void> {
  // Find the highest-strength card played so far
  const playedCards = state.playedPairs.flat();
  const sortedByStrength = [...playedCards].sort((a, b) => b.strength - a.strength);
  const challengedCard = sortedByStrength[0]!;

  log(`\n╔═══════════════════════════════════════════════════════════════╗`);
  log(`║  THE OBJECTION                                                ║`);
  log(`╚═══════════════════════════════════════════════════════════════╝`);
  log(`\n  KOA leans forward, eyes narrowing.`);
  log(`\n  KOA: "I have a question about one of your claims."`);
  log(`  KOA: "The [${challengedCard.id}] — '${challengedCard.claim}'"`);
  log(`  KOA: "Do you stand by this?"`);
  log(`\n  ┌─────────────────────────────────────────────────────────────┐`);
  log(`  │  [STAND BY] — Maintain your claim                          │`);
  log(`  │               If truth: +2 | If lie: -3                    │`);
  log(`  │  [WITHDRAW] — Walk back your claim (-2)                    │`);
  log(`  └─────────────────────────────────────────────────────────────┘`);

  let choice: 'stand_by' | 'withdrawn' | null = null;
  while (!choice) {
    const input = await prompt(rl, `\n  Your choice (stand/withdraw): `);
    const normalized = input.trim().toLowerCase();
    if (normalized === 'stand' || normalized === 'stand by' || normalized === 's') {
      choice = 'stood_by';
    } else if (normalized === 'withdraw' || normalized === 'w') {
      choice = 'withdrawn';
    } else {
      log(`  Enter "stand" or "withdraw".`);
    }
  }

  let scoreChange = 0;

  if (choice === 'stood_by') {
    if (challengedCard.isLie) {
      // Doubled down on a lie
      scoreChange = -3;
      log(`\n  KOA: "Interesting that you'd double down on that."`);
      log(`  KOA: "Because it's FALSE."`);
      log(`  → You stood by a LIE. -3 points.`);
    } else {
      // Correctly stood by truth
      scoreChange = +2;
      log(`\n  KOA: "...Fair enough. I can't find a flaw in that one."`);
      log(`  → You stood by the TRUTH. +2 points.`);
    }
  } else {
    // Withdrew
    scoreChange = -2;
    if (challengedCard.isLie) {
      log(`\n  KOA: "Smart move. That one was shaky."`);
      log(`  → You withdrew (wisely — it was a lie). -2 points.`);
    } else {
      log(`\n  KOA: "Hmm. You didn't need to back off that one."`);
      log(`  → You withdrew a TRUTH. -2 points.`);
    }
  }

  state.score += scoreChange;
  state.objection = {
    challengedCard,
    resolved: true,
    result: choice,
    scoreChange,
  };

  log(`\n  Score after Objection: ${state.score}`);
  log(`\n  ─────────────────────────────────────────────────────────────`);
}

function printOutcome(state: GameState, puzzle: V4Puzzle) {
  const totalLies = state.pairResults.reduce((s, p) => s + p.liesInPair, 0);
  const tier = getTier(state.score, puzzle.target);

  const tierLine = tier === 'FLAWLESS' || tier === 'CLEARED' ? 'ACCESS GRANTED' : 'ACCESS DENIED';

  log(`
╔═══════════════════════════════════════════════════════════════╗
║  ${tierLine}${' '.repeat(Math.max(0, 60 - tierLine.length))}║
╚═══════════════════════════════════════════════════════════════╝

  ${tier} (${state.score}/${puzzle.target})

  KOA: ${puzzle.dialogue[tier.toLowerCase() as keyof typeof puzzle.dialogue]}

  ── Play Summary ──`);

  for (let i = 0; i < state.pairResults.length; i++) {
    const pr = state.pairResults[i]!;
    const [a, b] = pr.cards;
    const aV = a.isLie ? 'LIE' : 'TRUTH';
    const bV = b.isLie ? 'LIE' : 'TRUTH';
    const comboStr = pr.combos.length > 0
      ? ` + ${pr.combos.map(c => `${c.name}(+${c.bonus})`).join(' + ')}`
      : '';
    log(`  Turn ${i + 1}: [${a.id}](${aV}) + [${b.id}](${bV}) → ${pr.totalScore > 0 ? '+' : ''}${pr.totalScore}${comboStr}`);
  }

  // The Objection summary
  if (state.objection) {
    const obj = state.objection;
    const cardVerdict = obj.challengedCard!.isLie ? 'LIE' : 'TRUTH';
    const actionStr = obj.result === 'stood_by' ? 'STOOD BY' : 'WITHDREW';
    const changeStr = obj.scoreChange > 0 ? `+${obj.scoreChange}` : `${obj.scoreChange}`;
    log(`  Objection: [${obj.challengedCard!.id}](${cardVerdict}) — ${actionStr} → ${changeStr}`);
  }

  log(`  Final score: ${state.score}`);
  log(`  Lies played: ${totalLies}/3`);

  // Unplayed cards
  log(`\n  ── Left Unplayed ──`);
  for (const card of state.hand) {
    log(`  [${card.id}] str:${card.strength} ${card.isLie ? '← THIS WAS A LIE (good dodge!)' : '← truth (points left on table)'}`);
  }

  // Reveal all lies
  const lies = puzzle.cards.filter(c => c.isLie);
  log(`\n  ── The 3 Lies Were ──`);
  for (const lie of lies) {
    const played = state.playedPairs.flat().some(c => c.id === lie.id);
    log(`  ${lie.id} (str:${lie.strength}): "${lie.claim}" ${played ? '(you played this)' : '(you dodged this)'}`);
  }

  // Share card
  const pairEmojis = state.pairResults.map(pr => {
    const [a, b] = pr.cards;
    return `${a.isLie ? '✗' : '✓'}${b.isLie ? '✗' : '✓'}`;
  }).join(' ');

  log(`
  ── Share ──
  HOME SMART HOME
  "${puzzle.name}"
  ${pairEmojis} — ${tier} (${state.score}/${puzzle.target})
  KOA: ${puzzle.dialogue[tier.toLowerCase() as keyof typeof puzzle.dialogue]}
`);
}

// ============================================================================
// Interactive CLI
// ============================================================================

// Piped input support: pre-read all lines if stdin is not a TTY
const isPiped = !process.stdin.isTTY;
let pipedLines: string[] = [];
let pipedReady: Promise<void> | null = null;

if (isPiped) {
  pipedReady = new Promise<void>(resolve => {
    let buf = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { buf += chunk; });
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
  return new Promise(resolve => {
    rl.question('', resolve);
  });
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('+');
}

async function play(puzzle: V4Puzzle) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: !isPiped });
  const state: GameState = {
    score: 0,
    hand: [...puzzle.cards],
    playedPairs: [],
    pairResults: [],
    turnsPlayed: 0,
    activeHints: [],
    pressure: initPressure(),
    objection: null,
  };

  printOpening(puzzle);

  while (state.turnsPlayed < 3) {
    printStatus(state, puzzle);
    printHand(state);

    const turnNum = state.turnsPlayed + 1;

    // Get first card
    let card1: Card | undefined;
    while (!card1) {
      const input1 = await prompt(rl, `\n  Turn ${turnNum} — pick FIRST card for pair: `);
      const id1 = input1.trim();
      card1 = state.hand.find(c => c.id === id1);
      if (!card1) {
        log(`  Unknown card. Available: ${state.hand.map(c => c.id).join(', ')}`);
      }
    }

    // Get second card
    let card2: Card | undefined;
    while (!card2) {
      const input2 = await prompt(rl, `  Turn ${turnNum} — pick SECOND card for pair: `);
      const id2 = input2.trim();
      if (id2 === card1.id) {
        log('  Can\'t pair a card with itself.');
        continue;
      }
      card2 = state.hand.find(c => c.id === id2);
      if (!card2) {
        log(`  Unknown card. Available: ${state.hand.filter(c => c.id !== card1!.id).map(c => c.id).join(', ')}`);
      }
    }

    // Calculate pressure penalty from previous turns (unless disabled)
    const stance = STANCES[puzzle.stance];
    const pressureResult = noPressure
      ? { penalty: 0, reasons: [] }
      : calculatePressurePenalty([card1, card2], state.pressure);

    // Score the pair with pressure
    const result = scorePair(card1, card2, stance, pressureResult.penalty);
    state.score += result.totalScore;
    state.hand = state.hand.filter(c => c.id !== card1!.id && c.id !== card2!.id);
    state.playedPairs.push([card1, card2]);
    state.pairResults.push(result);
    state.turnsPlayed++;

    // Update pressure for next turn
    state.pressure = updatePressure([card1, card2], state.pressure);

    // Display result
    printPairResult(result, turnNum, puzzle, pressureResult);

    // Reactive tell after T1 and T2 (pattern commentary, not lie reveal)
    if (state.turnsPlayed <= 2) {
      printReactiveTell(result, stance, puzzle);
    }

    // THE OBJECTION: After T2, KOA challenges one of your played cards (unless disabled)
    if (state.turnsPlayed === 2 && !noObjection) {
      await handleObjection(state, puzzle, rl);
    }
  }

  printOutcome(state, puzzle);
  if (logStream) logStream.end();
  rl.close();
}

// ============================================================================
// Turn-by-turn State Mode
// ============================================================================

interface SavedState {
  puzzleSlug: string;
  score: number;
  turnsPlayed: number;
  handIds: string[];
  playedPairIds: [string, string][];
  pairResults: { cardIds: [string, string]; totalScore: number; liesInPair: number }[];
  pressure: {
    previousPairStrength: number;
    typesPlayedBefore: string[];
    lastPairLocation: string | null;
  };
  objectionPending: boolean;
  objection: {
    challengedCardId: string;
    resolved: boolean;
    result: 'stood_by' | 'withdrawn' | null;
    scoreChange: number;
  } | null;
}

function playTurn(puzzle: V4Puzzle, statePath: string, pickArg: string | null, objectionArg: string | null) {
  const stance = STANCES[puzzle.stance];

  // Load or create state
  let state: GameState;
  let savedState: SavedState | null = null;
  let isFirstTurn = false;

  if (fs.existsSync(statePath)) {
    savedState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    if (savedState!.puzzleSlug !== puzzle.slug) {
      console.error(`Error: State file puzzle "${savedState!.puzzleSlug}" does not match --puzzle "${puzzle.slug}"`);
      process.exit(1);
    }

    // Reconstruct hand from IDs
    const hand = savedState!.handIds.map(hid => {
      const card = puzzle.cards.find(c => c.id === hid);
      if (!card) { console.error(`Error: Card ID "${hid}" not found in puzzle`); process.exit(1); }
      return card;
    });

    // Reconstruct pairResults for outcome display
    const pairResults: PairResult[] = savedState!.pairResults.map(pr => {
      const a = puzzle.cards.find(c => c.id === pr.cardIds[0])!;
      const b = puzzle.cards.find(c => c.id === pr.cardIds[1])!;
      return scorePair(a, b, stance);
    });

    const playedPairs: [Card, Card][] = savedState!.playedPairIds.map(([pa, pb]) => {
      return [puzzle.cards.find(c => c.id === pa)!, puzzle.cards.find(c => c.id === pb)!];
    });

    // Reconstruct pressure
    const pressure: PressureState = {
      previousPairStrength: savedState!.pressure.previousPairStrength,
      typesPlayedBefore: new Set(savedState!.pressure.typesPlayedBefore),
      lastPairLocation: savedState!.pressure.lastPairLocation,
    };

    // Reconstruct objection
    let objection: ObjectionState | null = null;
    if (savedState!.objection) {
      objection = {
        challengedCard: puzzle.cards.find(c => c.id === savedState!.objection!.challengedCardId) || null,
        resolved: savedState!.objection.resolved,
        result: savedState!.objection.result,
        scoreChange: savedState!.objection.scoreChange,
      };
    }

    state = {
      score: savedState!.score,
      hand,
      playedPairs,
      pairResults,
      turnsPlayed: savedState!.turnsPlayed,
      activeHints: [],
      pressure,
      objection,
    };
  } else {
    isFirstTurn = true;
    state = {
      score: 0,
      hand: [...puzzle.cards],
      playedPairs: [],
      pairResults: [],
      turnsPlayed: 0,
      activeHints: [],
      pressure: initPressure(),
      objection: null,
    };
    savedState = null;
  }

  // Handle pending objection first
  if (savedState?.objectionPending && objectionArg) {
    const choice = objectionArg.toLowerCase();
    if (choice !== 'stand' && choice !== 'withdraw') {
      console.error('Error: --objection must be "stand" or "withdraw"');
      process.exit(1);
    }

    const challengedCard = puzzle.cards.find(c => c.id === savedState!.objection!.challengedCardId)!;
    let scoreChange = 0;

    log(`\n╔═══════════════════════════════════════════════════════════════╗`);
    log(`║  THE OBJECTION — Response                                     ║`);
    log(`╚═══════════════════════════════════════════════════════════════╝`);

    if (choice === 'stand') {
      if (challengedCard.isLie) {
        scoreChange = -3;
        log(`\n  KOA: "Interesting that you'd double down on that."`);
        log(`  KOA: "Because it's FALSE."`);
        log(`  → You stood by a LIE. -3 points.`);
      } else {
        scoreChange = +2;
        log(`\n  KOA: "...Fair enough. I can't find a flaw in that one."`);
        log(`  → You stood by the TRUTH. +2 points.`);
      }
      state.objection = { challengedCard, resolved: true, result: 'stood_by', scoreChange };
    } else {
      scoreChange = -2;
      if (challengedCard.isLie) {
        log(`\n  KOA: "Smart move. That one was shaky."`);
        log(`  → You withdrew (wisely — it was a lie). -2 points.`);
      } else {
        log(`\n  KOA: "Hmm. You didn't need to back off that one."`);
        log(`  → You withdrew a TRUTH. -2 points.`);
      }
      state.objection = { challengedCard, resolved: true, result: 'withdrawn', scoreChange };
    }

    state.score += scoreChange;
    log(`\n  Score after Objection: ${state.score}`);
    log(`\n  ─────────────────────────────────────────────────────────────`);

    // Save state with resolved objection and continue to T3
    const saved: SavedState = {
      puzzleSlug: puzzle.slug,
      score: state.score,
      turnsPlayed: state.turnsPlayed,
      handIds: state.hand.map(c => c.id),
      playedPairIds: state.playedPairs.map(([a, b]) => [a.id, b.id] as [string, string]),
      pairResults: state.pairResults.map(pr => ({
        cardIds: [pr.cards[0].id, pr.cards[1].id] as [string, string],
        totalScore: pr.totalScore,
        liesInPair: pr.liesInPair,
      })),
      pressure: {
        previousPairStrength: state.pressure.previousPairStrength,
        typesPlayedBefore: [...state.pressure.typesPlayedBefore],
        lastPairLocation: state.pressure.lastPairLocation,
      },
      objectionPending: false,
      objection: {
        challengedCardId: challengedCard.id,
        resolved: true,
        result: state.objection.result,
        scoreChange: state.objection.scoreChange,
      },
    };
    fs.writeFileSync(statePath, JSON.stringify(saved, null, 2));

    if (!pickArg) {
      // Just resolved objection, no pick this turn
      if (logStream) logStream.end();
      return;
    }
  }

  // Check if objection is pending and no objection arg
  if (savedState?.objectionPending && !objectionArg) {
    const challengedCard = puzzle.cards.find(c => c.id === savedState!.objection!.challengedCardId)!;
    log(`\n╔═══════════════════════════════════════════════════════════════╗`);
    log(`║  THE OBJECTION — Pending                                      ║`);
    log(`╚═══════════════════════════════════════════════════════════════╝`);
    log(`\n  KOA is challenging [${challengedCard.id}]: "${challengedCard.claim}"`);
    log(`\n  You must respond with --objection stand OR --objection withdraw`);
    if (logStream) logStream.end();
    process.exit(0);
  }

  // Now handle the pick
  if (!pickArg) {
    console.error('Error: --pick is required (e.g., --pick card1,card2)');
    process.exit(1);
  }

  const [id1, id2] = pickArg.split(',').map(s => s.trim());
  if (!id1 || !id2) {
    console.error('Error: --pick requires two comma-separated card IDs (e.g. --pick card1,card2)');
    process.exit(1);
  }
  if (id1 === id2) {
    console.error(`Error: Cannot pair a card with itself: ${id1}`);
    process.exit(1);
  }

  if (state.turnsPlayed >= 3) {
    console.error('Error: Game already complete (3 turns played). Delete state file to start over.');
    process.exit(1);
  }

  if (isFirstTurn) {
    printOpening(puzzle);
  }

  // Validate picks
  const card1 = state.hand.find(c => c.id === id1);
  if (!card1) {
    const allIds = puzzle.cards.map(c => c.id);
    if (!allIds.includes(id1)) {
      console.error(`Error: Invalid card ID "${id1}". Valid IDs: ${allIds.join(', ')}`);
    } else {
      console.error(`Error: Card "${id1}" is not in hand. Available: ${state.hand.map(c => c.id).join(', ')}`);
    }
    process.exit(1);
  }
  const card2 = state.hand.find(c => c.id === id2);
  if (!card2) {
    const allIds = puzzle.cards.map(c => c.id);
    if (!allIds.includes(id2)) {
      console.error(`Error: Invalid card ID "${id2}". Valid IDs: ${allIds.join(', ')}`);
    } else {
      console.error(`Error: Card "${id2}" is not in hand. Available: ${state.hand.filter(c => c.id !== id1).map(c => c.id).join(', ')}`);
    }
    process.exit(1);
  }

  const turnNum = state.turnsPlayed + 1;

  // Show status and hand before playing
  printStatus(state, puzzle);
  printHand(state);

  // Calculate pressure penalty (unless disabled)
  const pressureResult = noPressure
    ? { penalty: 0, reasons: [] }
    : calculatePressurePenalty([card1, card2], state.pressure);

  // Score the pair with pressure
  const result = scorePair(card1, card2, stance, pressureResult.penalty);
  state.score += result.totalScore;
  state.hand = state.hand.filter(c => c.id !== id1 && c.id !== id2);
  state.playedPairs.push([card1, card2]);
  state.pairResults.push(result);
  state.turnsPlayed++;

  // Update pressure for next turn
  state.pressure = updatePressure([card1, card2], state.pressure);

  // Display result
  printPairResult(result, turnNum, puzzle, pressureResult);

  if (state.turnsPlayed < 3) {
    // Reactive tell (pattern commentary, not lie reveal)
    printReactiveTell(result, stance, puzzle);

    // After T2, trigger The Objection (unless disabled)
    let objectionPending = false;
    let objectionData: SavedState['objection'] = null;

    if (state.turnsPlayed === 2 && !noObjection) {
      // Find highest-strength card played
      const playedCards = state.playedPairs.flat();
      const sortedByStrength = [...playedCards].sort((a, b) => b.strength - a.strength);
      const challengedCard = sortedByStrength[0]!;

      objectionPending = true;
      objectionData = {
        challengedCardId: challengedCard.id,
        resolved: false,
        result: null,
        scoreChange: 0,
      };

      log(`\n╔═══════════════════════════════════════════════════════════════╗`);
      log(`║  THE OBJECTION                                                ║`);
      log(`╚═══════════════════════════════════════════════════════════════╝`);
      log(`\n  KOA leans forward, eyes narrowing.`);
      log(`\n  KOA: "I have a question about one of your claims."`);
      log(`  KOA: "The [${challengedCard.id}] — '${challengedCard.claim}'"`);
      log(`  KOA: "Do you stand by this?"`);
      log(`\n  ┌─────────────────────────────────────────────────────────────┐`);
      log(`  │  [STAND BY] — Maintain your claim                          │`);
      log(`  │               If truth: +2 | If lie: -3                    │`);
      log(`  │  [WITHDRAW] — Walk back your claim (-2)                    │`);
      log(`  └─────────────────────────────────────────────────────────────┘`);
      log(`\n  Next call: use --objection stand OR --objection withdraw`);
    }

    const saved: SavedState = {
      puzzleSlug: puzzle.slug,
      score: state.score,
      turnsPlayed: state.turnsPlayed,
      handIds: state.hand.map(c => c.id),
      playedPairIds: state.playedPairs.map(([a, b]) => [a.id, b.id] as [string, string]),
      pairResults: state.pairResults.map(pr => ({
        cardIds: [pr.cards[0].id, pr.cards[1].id] as [string, string],
        totalScore: pr.totalScore,
        liesInPair: pr.liesInPair,
      })),
      pressure: {
        previousPairStrength: state.pressure.previousPairStrength,
        typesPlayedBefore: [...state.pressure.typesPlayedBefore],
        lastPairLocation: state.pressure.lastPairLocation,
      },
      objectionPending,
      objection: objectionData,
    };
    fs.writeFileSync(statePath, JSON.stringify(saved, null, 2));
  } else {
    // Final turn — show outcome and delete state file
    printOutcome(state, puzzle);
    try { fs.unlinkSync(statePath); } catch {}
  }

  if (logStream) logStream.end();
}

// ============================================================================
// Entry Point
// ============================================================================

// ============================================================================
// Training Mode Flags
// ============================================================================

const trainingMode = process.argv.includes('--training');
const noPressure = trainingMode || process.argv.includes('--no-pressure');
const noObjection = trainingMode || process.argv.includes('--no-objection');

// Export for use in game logic
export const GAME_FLAGS = { noPressure, noObjection, trainingMode };

const puzzleArg = process.argv.find((_, i, a) => a[i - 1] === '--puzzle') || 'midnight-print-job';
const selectedPuzzle = V4_PUZZLES_BY_SLUG[puzzleArg];
if (!selectedPuzzle) {
  console.error(`Unknown puzzle: ${puzzleArg}. Available: ${Object.keys(V4_PUZZLES_BY_SLUG).join(', ')}`);
  process.exit(1);
}

const stateArg = process.argv.find((_, i, a) => a[i - 1] === '--state');
const pickArg = process.argv.find((_, i, a) => a[i - 1] === '--pick');
const objectionArg = process.argv.find((_, i, a) => a[i - 1] === '--objection');

if (stateArg) {
  playTurn(selectedPuzzle, stateArg, pickArg || null, objectionArg || null);
} else {
  play(selectedPuzzle);
}
