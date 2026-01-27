#!/usr/bin/env npx tsx
/**
 * Batch runner for play-v2.5 — accepts moves as CLI args
 * Usage: npx tsx scripts/play-batch.ts --moves "doorbell|fitbit,security_cam|microwave" --log path/to/log
 */

import * as fs from 'fs';

// ============================================================================
// V2.5 Types (duplicated from play-v2.5.ts)
// ============================================================================

const Tag = {
  ASLEEP: 'ASLEEP', AWAKE: 'AWAKE',
  HOME: 'HOME', AWAY: 'AWAY',
  ALONE: 'ALONE', ACCOMPANIED: 'ACCOMPANIED',
  IDLE: 'IDLE', ACTIVE: 'ACTIVE',
} as const;
type Tag = (typeof Tag)[keyof typeof Tag];

const OPPOSING = new Map<Tag, Tag>([
  [Tag.ASLEEP, Tag.AWAKE], [Tag.AWAKE, Tag.ASLEEP],
  [Tag.HOME, Tag.AWAY], [Tag.AWAY, Tag.HOME],
  [Tag.ALONE, Tag.ACCOMPANIED], [Tag.ACCOMPANIED, Tag.ALONE],
  [Tag.IDLE, Tag.ACTIVE], [Tag.ACTIVE, Tag.IDLE],
]);

const ProofType = {
  IDENTITY: 'IDENTITY', ALERTNESS: 'ALERTNESS',
  INTENT: 'INTENT', LOCATION: 'LOCATION', LIVENESS: 'LIVENESS',
} as const;
type ProofType = (typeof ProofType)[keyof typeof ProofType];

interface Card {
  readonly id: string;
  readonly power: number;
  readonly tag: Tag;
  readonly risk: number;
  readonly proves?: ProofType;
  readonly refutes?: string;
  readonly flavor: string;
  readonly source: string;
}

interface Counter {
  readonly id: string;
  readonly targets: readonly string[];
  refuted: boolean;
}

interface Concern {
  readonly id: string;
  readonly requiredProof: ProofType;
}

interface Puzzle {
  readonly name: string;
  readonly scenario: string;
  readonly resistance: number;
  readonly turns: number;
  readonly scrutinyLimit: number;
  readonly cards: readonly Card[];
  readonly counters: readonly Counter[];
  readonly concerns: readonly Concern[];
}

interface GameState {
  resistance: number;
  scrutiny: number;
  turnsRemaining: number;
  committedTags: Tag[];
  committedCardIds: Set<string>;
  addressedConcerns: Set<string>;
  counters: Counter[];
  contradictionsSoFar: number;
  committedProofs: ProofType[];
}

interface TurnResult {
  damage: number;
  scrutinyAdded: number;
  concernsAddressed: string[];
  refutationsApplied: string[];
  corroborationBonus: number;
  blocked: boolean;
  contradictionWarning: boolean;
  repetitionRiskFired: boolean;
  sourceDiversityUsed: boolean;
  outcome: 'CONTINUE' | 'WIN' | 'LOSS_SCRUTINY' | 'LOSS_TURNS';
}

function processTurn(state: GameState, cardIds: string[], puzzle: Puzzle): TurnResult {
  const cards = cardIds.map(id => puzzle.cards.find(c => c.id === id)!);
  let contradictionWarning = false;
  let repetitionRiskFired = false;
  let sourceDiversityUsed = false;

  const tagsInFlight = [...state.committedTags];
  for (const card of cards) {
    const opposite = OPPOSING.get(card.tag);
    if (opposite && tagsInFlight.includes(opposite)) {
      if (state.contradictionsSoFar === 0) {
        state.contradictionsSoFar++;
        contradictionWarning = true;
        continue;
      } else {
        return {
          damage: 0, scrutinyAdded: 0, concernsAddressed: [],
          refutationsApplied: [], corroborationBonus: 0,
          blocked: true, contradictionWarning: false,
          repetitionRiskFired: false, sourceDiversityUsed: false,
          outcome: 'CONTINUE',
        };
      }
    }
    tagsInFlight.push(card.tag);
  }

  const refutationsApplied: string[] = [];
  for (const card of cards) {
    if (card.refutes) {
      const counter = state.counters.find(c => c.id === card.refutes);
      if (counter && !counter.refuted) {
        counter.refuted = true;
        refutationsApplied.push(counter.id);
      }
    }
  }

  const cardPowers = cards.map(card => {
    const contested = state.counters.some(c => !c.refuted && c.targets.includes(card.id));
    return contested ? Math.ceil(card.power * 0.5) : card.power;
  });

  const baseDamage = cardPowers.reduce((s, p) => s + p, 0);

  const tagCounts = new Map<Tag, number>();
  const tagSources = new Map<Tag, Set<string>>();
  for (const card of cards) {
    tagCounts.set(card.tag, (tagCounts.get(card.tag) ?? 0) + 1);
    if (!tagSources.has(card.tag)) tagSources.set(card.tag, new Set());
    if (card.source) tagSources.get(card.tag)!.add(card.source);
  }
  let corroborationBonus = 0;
  const hasCorroboration = [...tagCounts.values()].some(count => count >= 2);
  if (hasCorroboration) {
    let hasDiverseSources = false;
    for (const [tag, count] of tagCounts) {
      if (count >= 2 && (tagSources.get(tag)?.size ?? 0) >= 2) {
        hasDiverseSources = true;
        break;
      }
    }
    const bonusRate = hasDiverseSources ? 0.30 : 0.20;
    if (hasDiverseSources) sourceDiversityUsed = true;
    corroborationBonus = Math.ceil(baseDamage * bonusRate);
  }
  const totalDamage = baseDamage + corroborationBonus;

  let scrutinyDelta = cards.reduce((s, c) => s + c.risk, 0);
  for (const card of cards) {
    if (card.proves && state.committedProofs.includes(card.proves)) {
      scrutinyDelta += 1;
      repetitionRiskFired = true;
    }
  }
  if (contradictionWarning) scrutinyDelta += 1;
  if (refutationsApplied.length > 0) {
    scrutinyDelta = Math.max(0, scrutinyDelta - refutationsApplied.length);
  }

  const concernsAddressed: string[] = [];
  for (const card of cards) {
    if (card.proves) {
      for (const concern of puzzle.concerns) {
        if (concern.requiredProof === card.proves && !state.addressedConcerns.has(concern.id)) {
          concernsAddressed.push(concern.id);
          state.addressedConcerns.add(concern.id);
        }
      }
    }
  }

  state.resistance = Math.max(0, state.resistance - totalDamage);
  state.scrutiny = Math.min(puzzle.scrutinyLimit, state.scrutiny + scrutinyDelta);
  state.turnsRemaining -= 1;
  state.committedTags.push(...cards.map(c => c.tag));
  for (const id of cardIds) state.committedCardIds.add(id);
  for (const card of cards) {
    if (card.proves) state.committedProofs.push(card.proves);
  }

  let outcome: TurnResult['outcome'] = 'CONTINUE';
  if (state.scrutiny >= puzzle.scrutinyLimit) outcome = 'LOSS_SCRUTINY';
  else if (state.resistance <= 0) outcome = 'WIN';
  else if (state.turnsRemaining <= 0) outcome = 'LOSS_TURNS';

  return {
    damage: totalDamage, scrutinyAdded: scrutinyDelta,
    concernsAddressed, refutationsApplied, corroborationBonus,
    blocked: false, contradictionWarning, repetitionRiskFired,
    sourceDiversityUsed, outcome,
  };
}

const THE_LAST_SLICE_V25: Puzzle = {
  name: 'The Last Slice',
  scenario: `It's 2:47am. The fridge is open. The pizza box is empty.
One slice is missing and KOA wants answers.
You were "asleep the whole time." Prove it.`,
  resistance: 14,
  turns: 3,
  scrutinyLimit: 5,
  cards: [
    { id: 'doorbell', power: 3, tag: Tag.HOME, risk: 1, proves: ProofType.IDENTITY, refutes: 'counter_alibi', source: 'smart_doorbell', flavor: 'Smart doorbell — front door cam shows no movement since 11pm' },
    { id: 'fitbit', power: 4, tag: Tag.ASLEEP, risk: 0, proves: ProofType.ALERTNESS, source: 'fitness_tracker', flavor: 'Fitbit — heart rate 52bpm, deep sleep since 12:30am' },
    { id: 'thermostat', power: 3, tag: Tag.HOME, risk: 0, proves: ProofType.LOCATION, source: 'smart_thermostat', flavor: 'Smart thermostat — "Night Mode" active, no manual override' },
    { id: 'phone_gps', power: 5, tag: Tag.AWAKE, risk: 2, proves: ProofType.LOCATION, source: 'phone_gps', flavor: 'Phone GPS — pinged living room at 2:11am (why was your phone on?)' },
    { id: 'speaker', power: 3, tag: Tag.AWAKE, risk: 1, proves: ProofType.INTENT, source: 'smart_speaker', flavor: 'Smart speaker — "Hey Google, how long does pizza stay good?" at 1:58am' },
    { id: 'security_cam', power: 5, tag: Tag.ASLEEP, risk: 1, proves: ProofType.LIVENESS, source: 'security_camera', flavor: 'Security camera — bedroom door closed from 11:30pm to 6am' },
    { id: 'microwave', power: 2, tag: Tag.IDLE, risk: 0, proves: ProofType.ALERTNESS, source: 'smart_microwave', flavor: 'Smart microwave — no usage logged between 10pm and 7am' },
  ],
  counters: [
    { id: 'counter_alibi', targets: ['security_cam'], refuted: false },
  ],
  concerns: [
    { id: 'concern_identity', requiredProof: ProofType.IDENTITY },
    { id: 'concern_location', requiredProof: ProofType.LOCATION },
    { id: 'concern_intent', requiredProof: ProofType.INTENT },
  ],
};

function koaReact(result: TurnResult, state: GameState, puzzle: Puzzle, cards: Card[]): string {
  const lines: string[] = [];
  if (result.blocked) {
    return '  KOA: "That directly contradicts what you already showed me. Rejected."';
  }
  if (result.corroborationBonus > 0) {
    lines.push(`  Conviction: ${result.damage} damage (${result.damage - result.corroborationBonus} base + ${result.corroborationBonus} corroboration)`);
  } else {
    lines.push(`  Conviction: ${result.damage} damage`);
  }
  lines.push(`  Resistance remaining: ${state.resistance > 0 ? state.resistance : 'BROKEN'}`);
  if (result.scrutinyAdded > 0) {
    lines.push(`  Scrutiny: +${result.scrutinyAdded} (${state.scrutiny}/${puzzle.scrutinyLimit})`);
  }
  if (result.contradictionWarning && result.repetitionRiskFired) {
    lines.push(`\n  KOA: "Wait. That doesn't match... and you're repeating yourself.\n        This is starting to sound rehearsed."`);
  } else if (result.contradictionWarning) {
    lines.push(`\n  KOA: "Hmm. That doesn't quite line up with what you showed me before.\n        I'll let it slide... this time."`);
  } else if (result.repetitionRiskFired) {
    lines.push(`\n  KOA: "You keep circling back to that same point.\n        Innocent people don't need to say it twice."`);
  } else if (result.refutationsApplied.length > 0) {
    lines.push(`\n  KOA: "...Fine. That checks out. I'll drop that line of questioning."`);
  } else if (result.sourceDiversityUsed) {
    lines.push(`\n  KOA: "Two different devices agreeing? That's... annoyingly consistent."`);
  } else if (state.scrutiny >= 3) {
    lines.push(`\n  KOA: "I'm running out of patience. And you're running out of credibility."`);
  } else if (result.damage >= 8) {
    lines.push(`\n  KOA: "...I'll admit, that's fairly convincing."`);
  } else {
    lines.push(`\n  KOA: "Noted. Continue."`);
  }
  for (const card of cards) {
    const contested = state.counters.some(c => !c.refuted && c.targets.includes(card.id));
    if (contested) {
      lines.push(`  KOA: "About that ${card.flavor.split(' — ')[0]}... I have counter-evidence. Half credit."`);
    }
  }
  if (result.concernsAddressed.length > 0) {
    lines.push(`  [Concerns addressed: ${result.concernsAddressed.join(', ')}]`);
  }
  return lines.join('\n');
}

function koaOutcome(state: GameState, puzzle: Puzzle): string {
  const concernsMet = state.addressedConcerns.size;
  const totalConcerns = puzzle.concerns.length;
  if (state.scrutiny >= puzzle.scrutinyLimit) {
    return `
╔═══════════════════════════════════════════════════════════════╗
║  ACCESS DENIED                                               ║
╚═══════════════════════════════════════════════════════════════╝

  KOA: "Too many holes in your story. I'm locking the fridge.
        And I'm setting up a camera INSIDE it this time."

  Result: LOSS (scrutiny reached ${puzzle.scrutinyLimit})
  Scrutiny: ${state.scrutiny}/${puzzle.scrutinyLimit}
  Resistance remaining: ${state.resistance}
  Concerns addressed: ${concernsMet}/${totalConcerns}`;
  }
  if (state.resistance <= 0) {
    const badge = state.scrutiny <= 1 && concernsMet === totalConcerns
      ? '\n  Badge: FLAWLESS'
      : state.scrutiny <= 2
        ? '\n  Badge: CLEAN'
        : '';
    return `
╔═══════════════════════════════════════════════════════════════╗
║  ACCESS GRANTED                                              ║
╚═══════════════════════════════════════════════════════════════╝

  KOA: "${state.scrutiny === 0
    ? "...I have no objections. This troubles me more than your midnight snacking."
    : state.scrutiny <= 2
      ? "Your alibi is... frustratingly solid. Fine. Fridge access restored."
      : "You got through. But I'm watching you. And the leftover pad thai."
  }"

  Result: WIN
  Turns used: ${puzzle.turns - state.turnsRemaining}/${puzzle.turns}
  Scrutiny: ${state.scrutiny}/${puzzle.scrutinyLimit}
  Concerns addressed: ${concernsMet}/${totalConcerns}${badge}`;
  }
  return `
╔═══════════════════════════════════════════════════════════════╗
║  ACCESS DENIED                                               ║
╚═══════════════════════════════════════════════════════════════╝

  KOA: "Time's up. You didn't make your case.
        The fridge stays locked. Maybe try a more convincing story tomorrow."

  Result: LOSS (ran out of turns)
  Resistance remaining: ${state.resistance}
  Scrutiny: ${state.scrutiny}/${puzzle.scrutinyLimit}
  Concerns addressed: ${concernsMet}/${totalConcerns}`;
}

// ============================================================================
// Batch runner
// ============================================================================

const movesArg = process.argv.find((_, i, a) => a[i - 1] === '--moves') || '';
const logPath = process.argv.find((_, i, a) => a[i - 1] === '--log');
const moves = movesArg.split('|').map(m => m.trim());

let logStream: fs.WriteStream | null = null;
if (logPath) {
  logStream = fs.createWriteStream(logPath, { flags: 'w' });
}

function log(msg: string) {
  console.log(msg);
  if (logStream) logStream.write(msg + '\n');
}

const puzzle = THE_LAST_SLICE_V25;
const state: GameState = {
  resistance: puzzle.resistance,
  scrutiny: 0,
  turnsRemaining: puzzle.turns,
  committedTags: [],
  committedCardIds: new Set(),
  addressedConcerns: new Set(),
  counters: puzzle.counters.map(c => ({ ...c, refuted: false })),
  contradictionsSoFar: 0,
  committedProofs: [],
};

log(`
╔═══════════════════════════════════════════════════════════════╗
║  HOME SMART HOME — "The Last Slice"                         ║
╚═══════════════════════════════════════════════════════════════╝

KOA: "Good morning. Or should I say... good middle-of-the-night.
      The fridge sensor logged an open event at 2:11am.
      The pizza box — which had ONE slice left — is now empty.
      You say you were asleep. I have questions."

KOA: "Present your evidence. Convince me."

  ${puzzle.scenario.split('\n').join('\n  ')}
`);

function printHand() {
  log('  YOUR HAND:');
  log('  ──────────');
  for (const card of puzzle.cards) {
    if (state.committedCardIds.has(card.id)) {
      log(`  [USED] ${card.id}`);
      continue;
    }
    const contested = state.counters.some(c => !c.refuted && c.targets.includes(card.id));
    const tag = card.tag;
    const risk = card.risk > 0 ? ` risk:${card.risk}` : '';
    const proves = card.proves ? ` proves:${card.proves}` : '';
    const ref = card.refutes ? ` REFUTES:${card.refutes}` : '';
    const cont = contested ? ' [CONTESTED]' : '';
    log(`  ${card.id.padEnd(14)} pwr:${card.power} ${tag.padEnd(12)}${risk}${proves}${ref}${cont}`);
    log(`  ${''.padEnd(14)} ${card.flavor}`);
  }
}

function printStatus() {
  const bar = (val: number, max: number, width: number) => {
    const filled = Math.round((val / max) * width);
    return '█'.repeat(filled) + '░'.repeat(width - filled);
  };
  log(`  Resistance: [${bar(state.resistance, puzzle.resistance, 20)}] ${state.resistance}/${puzzle.resistance}`);
  log(`  Scrutiny:   [${bar(state.scrutiny, puzzle.scrutinyLimit, 20)}] ${state.scrutiny}/${puzzle.scrutinyLimit}`);
  log(`  Turns left: ${state.turnsRemaining}/${puzzle.turns}`);
  const remaining = puzzle.concerns.filter(c => !state.addressedConcerns.has(c.id));
  if (remaining.length > 0) {
    log(`  Concerns:   ${remaining.map(c => c.requiredProof).join(', ')} remaining`);
  } else {
    log(`  Concerns:   ALL ADDRESSED`);
  }
}

let moveIdx = 0;
while (state.turnsRemaining > 0 && state.resistance > 0 && state.scrutiny < puzzle.scrutinyLimit) {
  printStatus();
  printHand();

  const turnNum = puzzle.turns - state.turnsRemaining + 1;
  if (moveIdx >= moves.length) break;
  const input = moves[moveIdx++];
  log(`\n  Turn ${turnNum} input: ${input}`);
  const cardIds = input.split(/[\s,]+/).filter(Boolean);

  if (cardIds.length === 0 || cardIds.length > 2) {
    log('  Play 1 or 2 cards.');
    continue;
  }

  const invalid = cardIds.filter(id => !puzzle.cards.find(c => c.id === id));
  if (invalid.length > 0) {
    log(`  Unknown card(s): ${invalid.join(', ')}`);
    continue;
  }
  const alreadyUsed = cardIds.filter(id => state.committedCardIds.has(id));
  if (alreadyUsed.length > 0) {
    log(`  Already used: ${alreadyUsed.join(', ')}`);
    continue;
  }

  const playedCards = cardIds.map(id => puzzle.cards.find(c => c.id === id)!);
  log(`\n  Playing: ${playedCards.map(c => `${c.id} (${c.flavor.split(' — ')[0]})`).join(' + ')}`);

  const result = processTurn(state, cardIds, puzzle);
  log(koaReact(result, state, puzzle, playedCards));

  if (result.blocked) {
    log('  (Turn not consumed — try different cards)');
  }
}

log(koaOutcome(state, puzzle));
if (logStream) logStream.end();
