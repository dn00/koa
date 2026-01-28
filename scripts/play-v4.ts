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
 * Turn-by-turn mode (for agent use):
 *   npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/game.json --pick card1,card2
 */

import * as readline from 'readline';
import * as fs from 'fs';
import type { Card, ComboResult, PairResult, Tier, GameState, V4Puzzle } from './v4-types.js';
import { V4_PUZZLES_BY_SLUG } from './v4-puzzles.js';

// ============================================================================
// Combo Scoring
// ============================================================================

function getCombos(a: Card, b: Card): ComboResult[] {
  const combos: ComboResult[] = [];
  if (a.location === b.location) {
    combos.push({ name: 'Corroboration', bonus: 3, description: `Same location: ${a.location}` });
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
  if (diff > 0 && diff <= 90) {
    combos.push({ name: 'Timeline', bonus: 2, description: `Adjacent times: ${a.time} & ${b.time}` });
  }
  if (a.evidenceType !== b.evidenceType) {
    combos.push({ name: 'Coverage', bonus: 2, description: `Different types: ${a.evidenceType} + ${b.evidenceType}` });
  }
  if (a.evidenceType === b.evidenceType) {
    combos.push({ name: 'Reinforcement', bonus: 3, description: `Same type: ${a.evidenceType}` });
  }
  return combos;
}

function scorePair(a: Card, b: Card): PairResult {
  const aScore = a.isLie ? -(a.strength - 1) : a.strength;
  const bScore = b.isLie ? -(b.strength - 1) : b.strength;
  const baseScore = aScore + bScore;

  const bothTruth = !a.isLie && !b.isLie;
  const combos = bothTruth ? getCombos(a, b) : [];
  const comboTotal = combos.reduce((s, c) => s + c.bonus, 0);

  return {
    cards: [a, b],
    baseScore,
    combos,
    comboTotal,
    totalScore: baseScore + comboTotal,
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
  log(`
╔═══════════════════════════════════════════════════════════════╗
║  HOME SMART HOME — "${puzzle.name}"${' '.repeat(Math.max(0, 39 - puzzle.name.length))}║
╚═══════════════════════════════════════════════════════════════╝

  ${puzzle.scenario.split('\n').join('\n  ')}

  KOA: ${puzzle.hint}

  Target score: ${puzzle.target}
  Cards in hand: ${puzzle.cards.length} (3 are lies)
  Turns: 3 (play 2 cards per turn as a pair)
  Combo bonuses: Corroboration(+3), Timeline(+2), Coverage(+2), Reinforcement(+3)
  Note: Combos only fire if BOTH cards in the pair are truths.
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

function printPairResult(result: PairResult, turnNum: number, puzzle: V4Puzzle) {
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

    // Score the pair
    const result = scorePair(card1, card2);
    state.score += result.totalScore;
    state.hand = state.hand.filter(c => c.id !== card1!.id && c.id !== card2!.id);
    state.playedPairs.push([card1, card2]);
    state.pairResults.push(result);
    state.turnsPlayed++;

    // Display result
    printPairResult(result, turnNum, puzzle);

    // Show reactive hint after Turn 1 and Turn 2
    if (state.turnsPlayed <= 2) {
      const key = pairKey(card1.id, card2.id);
      printReactiveHint(key, puzzle);
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
}

function playTurn(puzzle: V4Puzzle, statePath: string, pickArg: string) {
  const [id1, id2] = pickArg.split(',').map(s => s.trim());
  if (!id1 || !id2) {
    console.error('Error: --pick requires two comma-separated card IDs (e.g. --pick card1,card2)');
    process.exit(1);
  }
  if (id1 === id2) {
    console.error(`Error: Cannot pair a card with itself: ${id1}`);
    process.exit(1);
  }

  // Load or create state
  let state: GameState;
  let isFirstTurn = false;

  if (fs.existsSync(statePath)) {
    const saved: SavedState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    if (saved.puzzleSlug !== puzzle.slug) {
      console.error(`Error: State file puzzle "${saved.puzzleSlug}" does not match --puzzle "${puzzle.slug}"`);
      process.exit(1);
    }
    if (saved.turnsPlayed >= 3) {
      console.error('Error: Game already complete (3 turns played). Delete state file to start over.');
      process.exit(1);
    }
    // Reconstruct hand from IDs
    const hand = saved.handIds.map(hid => {
      const card = puzzle.cards.find(c => c.id === hid);
      if (!card) { console.error(`Error: Card ID "${hid}" not found in puzzle`); process.exit(1); }
      return card;
    });
    // Reconstruct pairResults for outcome display
    const pairResults: PairResult[] = saved.pairResults.map(pr => {
      const a = puzzle.cards.find(c => c.id === pr.cardIds[0])!;
      const b = puzzle.cards.find(c => c.id === pr.cardIds[1])!;
      return scorePair(a, b);
    });
    const playedPairs: [Card, Card][] = saved.playedPairIds.map(([pa, pb]) => {
      return [puzzle.cards.find(c => c.id === pa)!, puzzle.cards.find(c => c.id === pb)!];
    });
    state = {
      score: saved.score,
      hand,
      playedPairs,
      pairResults,
      turnsPlayed: saved.turnsPlayed,
      activeHints: [],
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
    };
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

  // Score the pair
  const result = scorePair(card1, card2);
  state.score += result.totalScore;
  state.hand = state.hand.filter(c => c.id !== id1 && c.id !== id2);
  state.playedPairs.push([card1, card2]);
  state.pairResults.push(result);
  state.turnsPlayed++;

  // Display result
  printPairResult(result, turnNum, puzzle);

  if (state.turnsPlayed < 3) {
    // Show reactive hint, save state
    const key = pairKey(card1.id, card2.id);
    printReactiveHint(key, puzzle);

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

const puzzleArg = process.argv.find((_, i, a) => a[i - 1] === '--puzzle') || 'midnight-print-job';
const selectedPuzzle = V4_PUZZLES_BY_SLUG[puzzleArg];
if (!selectedPuzzle) {
  console.error(`Unknown puzzle: ${puzzleArg}. Available: ${Object.keys(V4_PUZZLES_BY_SLUG).join(', ')}`);
  process.exit(1);
}

const stateArg = process.argv.find((_, i, a) => a[i - 1] === '--state');
const pickArg = process.argv.find((_, i, a) => a[i - 1] === '--pick');

if (stateArg && pickArg) {
  playTurn(selectedPuzzle, stateArg, pickArg);
} else {
  play(selectedPuzzle);
}
