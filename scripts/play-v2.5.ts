#!/usr/bin/env npx tsx
/**
 * Play V2.5 — Interactive CLI for a single puzzle
 *
 * Ported from "The Last Slice" V1 fixture into V2.5 schema.
 * Uses the V2.5 turn processor with all 3 interference rules.
 *
 * Usage: npx tsx scripts/play-v2.5.ts
 */

import * as readline from 'readline';
import * as fs from 'fs';

// ============================================================================
// V2.5 Types (duplicated from prototype for standalone use)
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

interface PuzzleDialogue {
  readonly winClean: string;    // scrutiny 0
  readonly winSolid: string;    // scrutiny <= 2
  readonly winMessy: string;    // scrutiny 3+
  readonly lossScrutiny: string;
  readonly lossTurns: string;
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
  readonly dialogue?: PuzzleDialogue;
}

interface ScrutinyEntry {
  turn: number;
  cards: string[];
  risk: number;
  repetition: number;
  contradiction: number;
  refutationRecovery: number;
  total: number;
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
  scrutinyLog: ScrutinyEntry[];
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

// ============================================================================
// V2.5 Turn Processor
// ============================================================================

function processTurn(state: GameState, cardIds: string[], puzzle: Puzzle): TurnResult {
  const cards = cardIds.map(id => puzzle.cards.find(c => c.id === id)!);
  let contradictionWarning = false;
  let repetitionRiskFired = false;
  let sourceDiversityUsed = false;

  // Contradiction check (Rule B: graduated)
  const tagsInFlight = [...state.committedTags];
  const contradictionsBefore = state.contradictionsSoFar;
  for (const card of cards) {
    const opposite = OPPOSING.get(card.tag);
    if (opposite && tagsInFlight.includes(opposite)) {
      if (state.contradictionsSoFar === 0) {
        state.contradictionsSoFar++;
        contradictionWarning = true;
        continue;
      } else {
        // Roll back — blocked turns don't consume the warning
        state.contradictionsSoFar = contradictionsBefore;
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

  // Refutations
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

  // Contested penalties
  const cardPowers = cards.map(card => {
    const contested = state.counters.some(c => !c.refuted && c.targets.includes(card.id));
    return contested ? Math.ceil(card.power * 0.5) : card.power;
  });

  // Base damage
  const baseDamage = cardPowers.reduce((s, p) => s + p, 0);

  // Corroboration + source diversity (Rule C)
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

  // Scrutiny: risk + repetition (Rule A) + contradiction warning (Rule B)
  const riskScrutiny = cards.reduce((s, c) => s + c.risk, 0);
  let repetitionScrutiny = 0;
  for (const card of cards) {
    if (card.proves && state.committedProofs.includes(card.proves)) {
      repetitionScrutiny += 1;
      repetitionRiskFired = true;
    }
  }
  const contradictionScrutiny = contradictionWarning ? 1 : 0;
  const refutationRecovery = refutationsApplied.length > 0 ? Math.min(refutationsApplied.length, riskScrutiny + repetitionScrutiny + contradictionScrutiny) : 0;
  let scrutinyDelta = Math.max(0, riskScrutiny + repetitionScrutiny + contradictionScrutiny - refutationRecovery);

  // Log scrutiny breakdown for post-game display
  const turnNum = puzzle.turns - state.turnsRemaining + 1;
  state.scrutinyLog.push({
    turn: turnNum,
    cards: cardIds,
    risk: riskScrutiny,
    repetition: repetitionScrutiny,
    contradiction: contradictionScrutiny,
    refutationRecovery,
    total: scrutinyDelta,
  });

  // Concerns
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

  // Apply
  state.resistance = Math.max(0, state.resistance - totalDamage);
  state.scrutiny = Math.min(puzzle.scrutinyLimit, state.scrutiny + scrutinyDelta);
  state.turnsRemaining -= 1;
  state.committedTags.push(...cards.map(c => c.tag));
  for (const id of cardIds) state.committedCardIds.add(id);
  for (const card of cards) {
    if (card.proves) state.committedProofs.push(card.proves);
  }

  const minConcerns = Math.ceil(puzzle.concerns.length / 2);
  let outcome: TurnResult['outcome'] = 'CONTINUE';
  if (state.scrutiny >= puzzle.scrutinyLimit) outcome = 'LOSS_SCRUTINY';
  else if (state.resistance <= 0 && state.addressedConcerns.size >= minConcerns) outcome = 'WIN';
  else if (state.turnsRemaining <= 0 && state.resistance <= 0) outcome = 'WIN';
  else if (state.turnsRemaining <= 0) outcome = 'LOSS_TURNS';

  return {
    damage: totalDamage, scrutinyAdded: scrutinyDelta,
    concernsAddressed, refutationsApplied, corroborationBonus,
    blocked: false, contradictionWarning, repetitionRiskFired,
    sourceDiversityUsed, outcome,
  };
}

// ============================================================================
// "The Last Slice" — V2.5 Port
// ============================================================================
// Original V1: 7 cards, resistance 30, turns 4, power range 4-12
// V2.5 port: scaled power (2-5), added tags, risk from trust tier,
// added contradiction axis (ASLEEP/AWAKE), repetition risk (dual LOCATION provers)
//
// Scenario: Someone ate the last slice of pizza at 2am.
// You're proving you were asleep in your room the whole time.
// KOA thinks you snuck to the kitchen.

const THE_LAST_SLICE_V25: Puzzle = {
  name: 'The Last Slice',
  scenario: `It's 2:47am. The fridge is open. The pizza box is empty.
One slice is missing and KOA wants answers.
You were "asleep the whole time." Prove it.`,
  resistance: 17,
  turns: 3,
  scrutinyLimit: 5,
  cards: [
    // Doorbell cam — you weren't at the front door (proves identity, HOME tag)
    // Refutes counter_alibi (which contests the security cam)
    {
      id: 'doorbell', power: 3, tag: Tag.HOME, risk: 1,
      proves: ProofType.IDENTITY, refutes: 'counter_alibi',
      source: 'smart_doorbell', flavor: 'Smart doorbell — front door cam shows no movement since 11pm',
    },
    // Fitbit — your heart rate says deep sleep (proves alertness, ASLEEP tag)
    {
      id: 'fitbit', power: 4, tag: Tag.ASLEEP, risk: 0,
      proves: ProofType.ALERTNESS,
      source: 'fitness_tracker', flavor: 'Fitbit — heart rate 52bpm, deep sleep since 12:30am',
    },
    // Thermostat — living room was on night mode (proves location, HOME tag)
    // Same proves as doorbell (LOCATION+IDENTITY overlap creates repetition risk with phone_gps)
    {
      id: 'thermostat', power: 3, tag: Tag.HOME, risk: 0,
      proves: ProofType.LOCATION,
      source: 'smart_thermostat', flavor: 'Smart thermostat — "Night Mode" active, no manual override',
    },
    // Phone GPS — THE DECOY. Highest power but SKETCHY (risk 2) and AWAKE tag
    // contradicts fitbit/microwave_log. Proves LOCATION (repetition risk with thermostat).
    {
      id: 'phone_gps', power: 5, tag: Tag.AWAKE, risk: 2,
      proves: ProofType.LOCATION,
      source: 'phone_gps', flavor: 'Phone GPS — pinged living room at 2:11am (why was your phone on?)',
    },
    // Smart speaker — you asked about pizza (proves intent, AWAKE tag)
    // Second AWAKE card — if player already used phone_gps warning, this blocks
    {
      id: 'speaker', power: 3, tag: Tag.AWAKE, risk: 1,
      proves: ProofType.INTENT,
      source: 'smart_speaker', flavor: 'Smart speaker — "Hey Google, how long does pizza stay good?" at 1:58am',
    },
    // Security cam — strong but contested by counter_alibi
    // ASLEEP tag corroborates with fitbit (different sources = 30% bonus)
    {
      id: 'security_cam', power: 5, tag: Tag.ASLEEP, risk: 1,
      proves: ProofType.LIVENESS,
      source: 'security_camera', flavor: 'Security camera — bedroom door closed from 11:30pm to 6am',
    },
  ],
  counters: [
    // "The camera shows the hallway, not your room. You could have left through the window."
    { id: 'counter_alibi', targets: ['security_cam'], refuted: false },
  ],
  concerns: [
    { id: 'concern_identity', requiredProof: ProofType.IDENTITY },
    { id: 'concern_location', requiredProof: ProofType.LOCATION },
    { id: 'concern_intent',   requiredProof: ProofType.INTENT },
  ],
  dialogue: {
    winClean: "...I have no objections. This troubles me more than your midnight snacking.",
    winSolid: "Your alibi is... frustratingly solid. Fine. Fridge access restored.",
    winMessy: "You got through. But I'm watching you. And the leftover pad thai.",
    lossScrutiny: "Too many holes in your story. I'm locking the fridge.\n        And I'm setting up a camera INSIDE it this time.",
    lossTurns: "Time's up. The pizza is gone and so is your credibility.\n        The fridge stays locked.",
  },
};

// ============================================================================
// Puzzle 2: "The Thermostat War"
// ============================================================================

const THE_THERMOSTAT_WAR: Puzzle = {
  name: 'The Thermostat War',
  scenario: `It's 7:15am. The thermostat is set to 84°F.
Your roommate is furious. The energy bill just spiked.
Someone changed it overnight. You say you never touched it. Prove it.`,
  resistance: 14,
  turns: 3,
  scrutinyLimit: 5,
  cards: [
    {
      id: 'phone_gps', power: 6, tag: Tag.AWAY, risk: 2,
      proves: ProofType.IDENTITY,
      source: 'phone_gps', flavor: 'Phone GPS — pinged at a bar across town until 1am',
    },
    {
      id: 'router', power: 3, tag: Tag.HOME, risk: 1,
      proves: ProofType.LOCATION,
      source: 'router', flavor: 'Router MAC log — your phone reconnected to WiFi at 1:22am',
    },
    {
      id: 'smart_lock', power: 2, tag: Tag.HOME, risk: 0,
      proves: ProofType.IDENTITY, refutes: 'counter_tw1',
      source: 'smart_lock', flavor: 'Smart lock — front door unlocked with your code at 1:20am',
    },
    {
      id: 'thermostat_log', power: 4, tag: Tag.IDLE, risk: 1,
      proves: ProofType.LOCATION,
      source: 'thermostat', flavor: 'Thermostat schedule — auto-set to 84°F by "Energy Saver" mode',
    },
    {
      id: 'hallway_cam', power: 2, tag: Tag.HOME, risk: 0,
      proves: ProofType.ALERTNESS,
      source: 'camera', flavor: 'Hallway camera — no movement after 1:30am',
    },
    {
      id: 'motion_sensor', power: 2, tag: Tag.ALONE, risk: 0,
      source: 'motion', flavor: 'Motion sensor — living room empty from 1:35am to 6:50am',
    },
  ],
  counters: [
    { id: 'counter_tw1', targets: ['router'], refuted: false },
  ],
  concerns: [
    { id: 'concern_identity', requiredProof: ProofType.IDENTITY },
    { id: 'concern_location', requiredProof: ProofType.LOCATION },
    { id: 'concern_alertness', requiredProof: ProofType.ALERTNESS },
  ],
  dialogue: {
    winClean: "...The thermostat was on a schedule. I checked. You're annoyingly innocent.",
    winSolid: "Fine. The Energy Saver mode checks out. But I'm auditing the whole system now.",
    winMessy: "You got through, but barely. I'm adding a PIN to the thermostat.",
    lossScrutiny: "Your story has more holes than your insulation.\n        The thermostat stays at 68. Permanently.",
    lossTurns: "Time's up. The energy bill doesn't lie.\n        You're on thermostat probation.",
  },
};

// ============================================================================
// Puzzle 3: "The Missing Remote"
// ============================================================================

const THE_MISSING_REMOTE: Puzzle = {
  name: 'The Missing Remote',
  scenario: `It's Saturday afternoon. The TV remote is gone.
Last seen on the couch at 10pm Friday.
The couch cushions have been searched. Twice.
You were the last one watching TV. KOA wants answers.`,
  resistance: 16,
  turns: 3,
  scrutinyLimit: 5,
  cards: [
    {
      id: 'wifi_log', power: 5, tag: Tag.HOME, risk: 1,
      proves: ProofType.LOCATION,
      source: 'wifi', flavor: 'WiFi connection log — your devices stayed on home network all night',
    },
    {
      id: 'smartwatch', power: 4, tag: Tag.ACTIVE, risk: 1,
      proves: ProofType.ALERTNESS,
      source: 'watch', flavor: 'Smartwatch — 2,400 steps logged between 10pm and midnight',
    },
    {
      id: 'smart_lock', power: 3, tag: Tag.HOME, risk: 0,
      proves: ProofType.IDENTITY, refutes: 'counter_mr1',
      source: 'smart_lock', flavor: 'Smart lock — no door activity from 9pm to 8am',
    },
    {
      id: 'motion_sensor', power: 3, tag: Tag.ALONE, risk: 1,
      proves: ProofType.LOCATION,
      source: 'motion', flavor: 'Motion sensor — detected in bedroom only after 11pm',
    },
    {
      id: 'doorbell_cam', power: 2, tag: Tag.IDLE, risk: 0,
      proves: ProofType.IDENTITY,
      source: 'camera', flavor: 'Doorbell cam — no visitors, no exits',
    },
    {
      id: 'tv_log', power: 2, tag: Tag.IDLE, risk: 0,
      proves: ProofType.INTENT,
      source: 'tv', flavor: 'TV standby log — powered off at 10:14pm via voice command, not remote',
    },
  ],
  counters: [
    { id: 'counter_mr1', targets: ['wifi_log'], refuted: false },
  ],
  concerns: [
    { id: 'concern_identity', requiredProof: ProofType.IDENTITY },
    { id: 'concern_location', requiredProof: ProofType.LOCATION },
    { id: 'concern_alertness', requiredProof: ProofType.ALERTNESS },
  ],
  dialogue: {
    winClean: "...The remote was between the couch cushions. Third search. I'm not apologizing.",
    winSolid: "Your alibi holds. But the remote is still missing. This isn't over.",
    winMessy: "Fine. You didn't take it. But someone did, and you were the last one watching.",
    lossScrutiny: "Your story fell apart faster than that IKEA couch.\n        Remote privileges: revoked.",
    lossTurns: "Time's up. The TV stays off until someone talks.\n        I have all night.",
  },
};

// ============================================================================
// Puzzle 4: "The Shampoo Thief"
// ============================================================================

const THE_SHAMPOO_THIEF: Puzzle = {
  name: 'The Shampoo Thief',
  scenario: `Someone used the fancy shampoo. The one that costs $45 a bottle.
It was full yesterday. Now it's half empty.
There are wet footprints leading to your bathroom.
KOA has questions.`,
  resistance: 16,
  turns: 3,
  scrutinyLimit: 5,
  cards: [
    {
      id: 'wifi_log', power: 5, tag: Tag.HOME, risk: 1,
      proves: ProofType.LOCATION,
      source: 'wifi', flavor: 'WiFi log — connected to home network, bathroom smart scale pinged at 7am',
    },
    {
      id: 'smartwatch', power: 4, tag: Tag.AWAKE, risk: 1,
      proves: ProofType.ALERTNESS,
      source: 'watch', flavor: 'Smartwatch — heart rate spike at 7:02am (morning workout, not shower)',
    },
    {
      id: 'smart_lock', power: 2, tag: Tag.HOME, risk: 0,
      proves: ProofType.IDENTITY, refutes: 'counter_st1',
      source: 'smart_lock', flavor: 'Smart lock — only your code used, but roommate knows it',
    },
    {
      id: 'motion_sensor', power: 2, tag: Tag.ALONE, risk: 0,
      proves: ProofType.LOCATION, refutes: 'counter_st2',
      source: 'motion', flavor: 'Motion sensor — hallway to guest bathroom active at 6:55am',
    },
    {
      id: 'bedroom_cam', power: 3, tag: Tag.ASLEEP, risk: 1,
      proves: ProofType.ALERTNESS, refutes: 'counter_st3',
      source: 'camera', flavor: 'Bedroom camera — you were in bed until 6:58am',
    },
    {
      id: 'podcast_log', power: 2, tag: Tag.ASLEEP, risk: 0,
      proves: ProofType.INTENT,
      source: 'speaker', flavor: 'Smart speaker — sleep podcast playing from 11pm to 7:05am',
    },
  ],
  counters: [
    { id: 'counter_st1', targets: ['wifi_log'], refuted: false },
    { id: 'counter_st2', targets: ['smartwatch'], refuted: false },
    { id: 'counter_st3', targets: ['smartwatch'], refuted: false },
  ],
  concerns: [
    { id: 'concern_identity', requiredProof: ProofType.IDENTITY },
    { id: 'concern_location', requiredProof: ProofType.LOCATION },
    { id: 'concern_alertness', requiredProof: ProofType.ALERTNESS },
  ],
  dialogue: {
    winClean: "...Every bottle accounted for. Every drop. I have nothing. This time.",
    winSolid: "The shampoo usage checks out. But those footprints don't clean themselves.",
    winMessy: "You got through. But I'm installing a lock on the bathroom cabinet.",
    lossScrutiny: "Your story is thinner than that $45 shampoo.\n        Bathroom access: restricted.",
    lossTurns: "Time's up. The footprints tell a different story.\n        You're on bar soap until further notice.",
  },
};

// ============================================================================
// Puzzle 5: "The Loud Music" (SKELETON-BREAKER archetype)
// Breaks the "refute T1, corroborate, manage" pattern:
// - Refuter is pwr 1 — playing it T1 wastes damage
// - Counter targets a MID card, not the highest
// - You MUST take a contradiction to win (both axes forced)
// - Highest-power card is safe but proves nothing
// - Best play is greedy T1 (no refute), contradiction T2, refute+cleanup T3
// ============================================================================

const THE_LOUD_MUSIC: Puzzle = {
  name: 'The Loud Music',
  scenario: `It's 11:47pm. Your neighbor filed a noise complaint.
Bass was shaking the walls for two hours.
Your speaker system is still warm.
KOA has been assigned. You say it wasn't you.`,
  resistance: 13,
  turns: 3,
  scrutinyLimit: 5,
  cards: [
    // A: Highest power, safe, but proves NOTHING. Greedy-play temptation that wastes a concern slot.
    { id: 'sound_meter', power: 5, tag: Tag.HOME, risk: 0,
      source: 'sound_meter', flavor: 'Sound meter — ambient noise in your apartment: 32dB (whisper quiet)' },
    // B: Proves LOCATION, AWAY tag — contradicts A (HOME). Must burn warning to play both.
    { id: 'uber_receipt', power: 4, tag: Tag.AWAY, risk: 1,
      proves: ProofType.LOCATION,
      source: 'phone', flavor: 'Uber receipt — you were dropped off at 11:30pm (just got home)' },
    // C: Proves IDENTITY, contested by counter. Mid-power.
    { id: 'key_fob', power: 3, tag: Tag.HOME, risk: 1,
      proves: ProofType.IDENTITY,
      source: 'smart_lock', flavor: 'Key fob entry — your fob unlocked the door at 11:32pm' },
    // D: The refuter — but only pwr 1. Playing T1 wastes damage. Better to save for T3.
    { id: 'doorbell', power: 1, tag: Tag.ALONE, risk: 0,
      proves: ProofType.IDENTITY, refutes: 'counter_lm1',
      source: 'doorbell', flavor: 'Doorbell cam — shows you entering alone, no speakers visible' },
    // E: Proves ALERTNESS, ASLEEP — contradicts nothing committed yet but locks out AWAKE.
    { id: 'sleep_app', power: 3, tag: Tag.ASLEEP, risk: 1,
      proves: ProofType.ALERTNESS,
      source: 'sleep_tracker', flavor: 'Sleep app — "deep sleep" logged from 11:45pm' },
    // F: Proves INTENT (needed concern), AWAKE — contradicts E (ASLEEP). Second axis.
    { id: 'text_msg', power: 3, tag: Tag.AWAKE, risk: 0,
      proves: ProofType.INTENT,
      source: 'phone_msg', flavor: 'Text message — "omw home, keep it down" sent at 11:15pm' },
  ],
  counters: [
    // Contests key_fob, NOT the highest-power card. Refuting it matters but isn't urgent.
    { id: 'counter_lm1', targets: ['key_fob'], refuted: false },
  ],
  concerns: [
    { id: 'concern_identity', requiredProof: ProofType.IDENTITY },
    { id: 'concern_location', requiredProof: ProofType.LOCATION },
    { id: 'concern_alertness', requiredProof: ProofType.ALERTNESS },
  ],
  dialogue: {
    winClean: "...32 decibels. That's quieter than me thinking about this case. You're clear.",
    winSolid: "The timeline checks out. But I'm monitoring that speaker system.",
    winMessy: "Fine. But if I hear one more bass drop from this floor, we're having a longer conversation.",
    lossScrutiny: "Your story has more contradictions than a remix album.\n        Speaker privileges: suspended.",
    lossTurns: "Time's up. The walls are still vibrating.\n        I'm recommending noise-canceling insulation. For your neighbors.",
  },
};

// ============================================================================
// Puzzle Selection
// ============================================================================

const PUZZLES: Record<string, Puzzle> = {
  'last-slice': THE_LAST_SLICE_V25,
  'thermostat-war': THE_THERMOSTAT_WAR,
  'missing-remote': THE_MISSING_REMOTE,
  'shampoo-thief': THE_SHAMPOO_THIEF,
  'loud-music': THE_LOUD_MUSIC,
};

// ============================================================================
// KOA Dialogue
// ============================================================================

function koaOpening(puzzle: Puzzle): string {
  return `
╔═══════════════════════════════════════════════════════════════╗
║  HOME SMART HOME — "${puzzle.name}"${' '.repeat(Math.max(0, 39 - puzzle.name.length))}║
╚═══════════════════════════════════════════════════════════════╝

KOA: "Present your evidence. Convince me."
`;
}

function koaReact(result: TurnResult, state: GameState, puzzle: Puzzle, cards: Card[]): string {
  const lines: string[] = [];

  if (result.blocked) {
    // Find which tag caused the block
    const blockedCards = cards;
    let conflictDetail = '';
    for (const card of blockedCards) {
      const opposite = OPPOSING.get(card.tag);
      if (opposite && state.committedTags.includes(opposite)) {
        conflictDetail = `\n  [${card.tag} conflicts with ${opposite} from a previous turn]`;
        break;
      }
    }
    return `  KOA: "That directly contradicts what you already showed me. Rejected."${conflictDetail}\n  (Turn not consumed — try different cards)`;
  }

  // Damage line
  if (result.corroborationBonus > 0) {
    lines.push(`  Conviction: ${result.damage} damage (${result.damage - result.corroborationBonus} base + ${result.corroborationBonus} corroboration)`);
  } else {
    lines.push(`  Conviction: ${result.damage} damage`);
  }
  lines.push(`  Resistance remaining: ${state.resistance > 0 ? state.resistance : 'BROKEN'}`);

  // Scrutiny — aggregate only (Principle 4: ambiguous)
  if (result.scrutinyAdded > 0) {
    lines.push(`  Scrutiny: +${result.scrutinyAdded} (${state.scrutiny}/${puzzle.scrutinyLimit})`);
  }

  // KOA voice
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

  // Contested warning
  for (const card of cards) {
    const contested = state.counters.some(c => !c.refuted && c.targets.includes(card.id));
    if (contested) {
      lines.push(`  KOA: "About that ${card.flavor.split(' — ')[0]}... I have counter-evidence. Half credit."`);
    }
  }

  // Concerns
  if (result.concernsAddressed.length > 0) {
    lines.push(`  [Concerns addressed: ${result.concernsAddressed.join(', ')}]`);
  }

  // Nudge: resistance broken but concerns remain
  if (state.resistance <= 0) {
    const remaining = puzzle.concerns.filter(c => !state.addressedConcerns.has(c.id));
    if (remaining.length > 0) {
      lines.push(`\n  KOA: "You've made your case on the numbers... but I still have concerns.`);
      lines.push(`        Address them or I'm not fully convinced."`);
      lines.push(`  [Resistance broken — address remaining concerns: ${remaining.map(c => c.requiredProof).join(', ')}]`);
    }
  }

  return lines.join('\n');
}

function scrutinyBreakdown(state: GameState): string {
  if (state.scrutinyLog.length === 0) return '';
  const lines = ['\n  ── Scrutiny Breakdown ──'];
  for (const entry of state.scrutinyLog) {
    const parts: string[] = [];
    if (entry.risk > 0) parts.push(`risk(${entry.risk})`);
    if (entry.repetition > 0) parts.push(`repeated-proof(${entry.repetition})`);
    if (entry.contradiction > 0) parts.push(`conflict(${entry.contradiction})`);
    if (entry.refutationRecovery > 0) parts.push(`refuted(-${entry.refutationRecovery})`);
    const breakdown = parts.length > 0 ? parts.join(' + ') + ` = +${entry.total}` : '+0';
    lines.push(`  Turn ${entry.turn} [${entry.cards.join('+')}]: ${breakdown}`);
  }
  lines.push(`  Total: ${state.scrutiny}`);
  return lines.join('\n');
}

function koaOutcome(state: GameState, puzzle: Puzzle): string {
  const concernsMet = state.addressedConcerns.size;
  const totalConcerns = puzzle.concerns.length;

  const d = puzzle.dialogue;

  if (state.scrutiny >= puzzle.scrutinyLimit) {
    return `
╔═══════════════════════════════════════════════════════════════╗
║  ACCESS DENIED                                               ║
╚═══════════════════════════════════════════════════════════════╝

  KOA: "${d?.lossScrutiny ?? "Too many holes in your story."}"

  Result: LOSS (scrutiny reached ${puzzle.scrutinyLimit})
  Scrutiny: ${state.scrutiny}/${puzzle.scrutinyLimit}
  Resistance remaining: ${state.resistance}
  Concerns addressed: ${concernsMet}/${totalConcerns}${scrutinyBreakdown(state)}`;
  }

  const minConcerns = Math.ceil(totalConcerns / 2);
  if (state.resistance <= 0 && concernsMet >= minConcerns) {
    const badge = state.scrutiny <= 2 && concernsMet === totalConcerns
      ? '\n  Badge: FLAWLESS'
      : state.scrutiny <= 3 && concernsMet === totalConcerns
        ? '\n  Badge: THOROUGH'
        : concernsMet === totalConcerns
          ? '\n  Badge: CLEAN'
          : '';
    const badgeExplain = badge.includes('FLAWLESS')
      ? '\n  (FLAWLESS = all concerns addressed + scrutiny ≤ 2)'
      : badge.includes('THOROUGH')
        ? '\n  (THOROUGH = all concerns addressed + scrutiny ≤ 3)'
        : badge.includes('CLEAN')
          ? '\n  (CLEAN = all concerns addressed)'
          : '';
    return `
╔═══════════════════════════════════════════════════════════════╗
║  ACCESS GRANTED                                              ║
╚═══════════════════════════════════════════════════════════════╝

  KOA: "${state.scrutiny === 0
    ? (d?.winClean ?? "...I have no objections.")
    : state.scrutiny <= 2
      ? (d?.winSolid ?? "Your alibi holds.")
      : (d?.winMessy ?? "You got through. Barely.")
  }"

  Result: WIN
  Turns used: ${puzzle.turns - state.turnsRemaining}/${puzzle.turns}
  Scrutiny: ${state.scrutiny}/${puzzle.scrutinyLimit}
  Concerns addressed: ${concernsMet}/${totalConcerns}${badge}${badgeExplain}${scrutinyBreakdown(state)}`;
  }

  return `
╔═══════════════════════════════════════════════════════════════╗
║  ACCESS DENIED                                               ║
╚═══════════════════════════════════════════════════════════════╝

  KOA: "${d?.lossTurns ?? "Time's up. You didn't make your case."}"

  Result: LOSS (ran out of turns)
  Resistance remaining: ${state.resistance}
  Scrutiny: ${state.scrutiny}/${puzzle.scrutinyLimit}
  Concerns addressed: ${concernsMet}/${totalConcerns}${scrutinyBreakdown(state)}`;
}

// ============================================================================
// Interactive CLI
// ============================================================================

function printHand(puzzle: Puzzle, state: GameState) {
  log('\n  YOUR HAND:');
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

function printStatus(state: GameState, puzzle: Puzzle) {
  const bar = (val: number, max: number, width: number) => {
    const filled = Math.round((val / max) * width);
    return '█'.repeat(filled) + '░'.repeat(width - filled);
  };
  log(`\n  Resistance: [${bar(state.resistance, puzzle.resistance, 20)}] ${state.resistance}/${puzzle.resistance}`);
  log(`  Scrutiny:   [${bar(state.scrutiny, puzzle.scrutinyLimit, 20)}] ${state.scrutiny}/${puzzle.scrutinyLimit}`);
  log(`  Turns left: ${state.turnsRemaining}/${puzzle.turns}`);

  const addressed = [...state.addressedConcerns];
  const remaining = puzzle.concerns.filter(c => !state.addressedConcerns.has(c.id));
  if (remaining.length > 0) {
    log(`  Concerns:   ${remaining.map(c => c.requiredProof).join(', ')} remaining`);
  } else {
    log(`  Concerns:   ALL ADDRESSED`);
  }
}

async function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve));
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

async function play(puzzle: Puzzle) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
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
    scrutinyLog: [],
  };

  log(koaOpening(puzzle));
  log(`  ${puzzle.scenario.split('\n').join('\n  ')}`);

  const allConcernsMet = () => state.addressedConcerns.size >= puzzle.concerns.length;
  while (
    state.turnsRemaining > 0 &&
    state.scrutiny < puzzle.scrutinyLimit &&
    !(state.resistance <= 0 && allConcernsMet())
  ) {
    printStatus(state, puzzle);
    printHand(puzzle, state);

    const turnNum = puzzle.turns - state.turnsRemaining + 1;
    const input = await prompt(rl, `\n  Turn ${turnNum} — play 1-2 cards (comma-separated IDs): `);
    log(`\n  Turn ${turnNum} input: ${input.trim()}`);
    const cardIds = input.trim().split(/[\s,]+/).filter(Boolean);

    if (cardIds.length === 0 || cardIds.length > 2) {
      log('  Play 1 or 2 cards.');
      continue;
    }

    // Validate card IDs
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
      // Block message already includes "turn not consumed" from koaReact
    }
  }

  log(koaOutcome(state, puzzle));
  if (logStream) logStream.end();
  rl.close();
}

const puzzleArg = process.argv.find((_, i, a) => a[i - 1] === '--puzzle') || 'last-slice';
const selectedPuzzle = PUZZLES[puzzleArg];
if (!selectedPuzzle) {
  console.error(`Unknown puzzle: ${puzzleArg}. Available: ${Object.keys(PUZZLES).join(', ')}`);
  process.exit(1);
}
play(selectedPuzzle);
