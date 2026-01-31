/**
 * Generated Puzzle: The 3 AM Thermostat War
 *
 * DESIGN NOTES:
 * - Scenario: Thermostat cranked to 78F at 3:12 AM. Partner is furious. KOA locked climate control.
 * - Player claims they were asleep and didn't touch it.
 *
 * LIE DESIGN (work backward):
 *   - Lie A (thermostat_app): DIRECT - Claims phone app adjusted temp at 3:12 AM
 *     Contradicts KF: "Phone had no screen activity after 10:30 PM"
 *     Tempting: High strength (5), sounds like a reasonable "glitch" excuse
 *
 *   - Lie B (partner_heard): INFERENTIAL - Claims partner heard you complain about cold
 *     Contradicts: KF says bedroom sensor shows no one left bed
 *     If partner heard complaining at 3 AM, you were awake - but you claim asleep
 *     Also contradicts sleep_tracker (deep REM at that time)
 *     Tempting: Testimony type feels safe, moderate strength (4)
 *
 * KNOWN FACTS (require inference, no word-matching):
 *   1. Phone charging, no screen activity after 10:30 PM (catches app claim)
 *   2. Bedroom sensor: neither person left bed 11 PM - 6 AM (catches "heard complaining" inferentially)
 *   3. Adjustment made via physical dial, not app (reinforces Lie A without direct keyword match)
 *   4. Living room window cracked 2 inches at 6 AM (red herring / explanation hint)
 *
 * TYPE DISTRIBUTION:
 *   - Truths: SENSOR, DIGITAL, TESTIMONY, SENSOR (2 SENSOR creates type tax decision)
 *   - Lies: DIGITAL (5), TESTIMONY (4) - different types, no "skip type X" meta
 *
 * BALANCE:
 *   Truths: sleep_tracker(4) + smart_plug(3) + spouse_alibi(3) + window_sensor(3) = 13
 *   Best 3 truths: 4+3+3 = 10
 *   Best run: 50 + 10 + 2 (objection) = 62
 *   Target: 58 => FLAWLESS at 63+, CLEARED at 58+, CLOSE at 53-57, BUSTED <53
 *
 *   Lie penalty: -(strength - 1)
 *   1 lie case (thermostat_app, str 5): 50 + 6 - 4 + 2 = 54 (CLOSE)
 *   1 lie case (partner_heard, str 4): 50 + 7 - 3 + 2 = 56 (CLOSE)
 *   2 lies case: 50 + 3 - 4 - 3 = 46 (BUSTED)
 */

import type { Card, V5Puzzle, LieInfo } from './v5-types.js';

// ============================================================================
// Cards
// ============================================================================

const THERMOSTAT_CARDS: readonly Card[] = [
  // TRUTHS
  {
    id: 'sleep_tracker',
    strength: 4,
    evidenceType: 'SENSOR',
    location: 'BEDROOM',
    time: '3:12 AM',
    claim: 'Sleep tracker shows deep REM phase from 2:30 AM to 4:15 AM',
    presentLine: "Check my sleep data. Deep REM at 3:12. The kind where you dream about tropical beaches, not thermostat wars.",
    isLie: false,
  },
  {
    id: 'smart_plug',
    strength: 3,
    evidenceType: 'DIGITAL',
    location: 'LIVING_ROOM',
    time: '3:10 AM',
    claim: 'Smart plug on space heater shows it was already running before thermostat change',
    presentLine: "The space heater was already on. Why would I crank the thermostat if I had a heater going? I'm not running a sauna.",
    isLie: false,
  },
  {
    id: 'spouse_alibi',
    strength: 3,
    evidenceType: 'TESTIMONY',
    location: 'BEDROOM',
    time: '3:00 AM',
    claim: 'Spouse confirms you were snoring at 3 AM and never got up',
    presentLine: "Ask them. I was snoring like a chainsaw. They threw a pillow at me around 3. I didn't wake up. That's documented somewhere, probably.",
    isLie: false,
  },
  {
    id: 'window_sensor',
    strength: 3,
    evidenceType: 'SENSOR',
    location: 'LIVING_ROOM',
    time: '2:45 AM',
    claim: 'Window contact sensor shows living room window opened at 2:45 AM',
    presentLine: "The window sensor went off at 2:45. Something opened it. Maybe wind? Maybe the cat learned how windows work? Point is: cold air came in.",
    isLie: false,
  },
  // LIES
  {
    id: 'thermostat_app',
    strength: 5,
    evidenceType: 'DIGITAL',
    location: 'LIVING_ROOM',
    time: '3:12 AM',
    claim: 'Thermostat app log shows adjustment initiated from your phone at 3:12 AM',
    presentLine: "The app says I changed it from my phone. At 3:12. While I was in deep REM. Either I sleep-app or your system is haunted.",
    isLie: true,  // DIRECT: contradicts "no phone activity after 10:30 PM"
  },
  {
    id: 'partner_heard',
    strength: 4,
    evidenceType: 'TESTIMONY',
    location: 'BEDROOM',
    time: '3:00 AM',
    claim: 'Partner remembers hearing you complain about being cold around 3 AM',
    presentLine: "My partner says they heard me complain about being cold. Half-asleep mumbling, probably. I don't remember. That's their testimony, not mine.",
    isLie: true,  // INFERENTIAL: if you were complaining, you were awake - contradicts sleep tracker + sensor shows no one left bed
  },
];

// ============================================================================
// Lie Definitions
// ============================================================================

const THERMOSTAT_LIES: LieInfo[] = [
  {
    cardId: 'thermostat_app',
    lieType: 'direct_contradiction',
    reason: 'Your phone had no screen activity after 10:30 PM. This log claims an app adjustment at 3:12 AM.',
  },
  {
    cardId: 'partner_heard',
    lieType: 'relational',
    reason: 'If you were complaining about being cold at 3 AM, you were awake. But your sleep tracker shows deep REM, and the bedroom sensor shows neither of you left bed.',
    contradictsWith: 'sleep_tracker',
  },
];

// ============================================================================
// Puzzle Definition
// ============================================================================

export const PUZZLE_THERMOSTAT_WAR: V5Puzzle = {
  slug: 'thermostat-war',
  name: 'The 3 AM Thermostat War',

  scenario: `3:12 AM. The thermostat jumped from 68F to 78F.
Your partner woke up sweating. You claim you were asleep.
KOA has locked climate control pending investigation.`,

  knownFacts: [
    'Your phone was charging on the nightstand with no screen activity after 10:30 PM',
    'Bedroom motion sensor shows neither you nor your partner left bed between 11 PM and 6 AM',
    'Thermostat adjustment was made via the physical dial, not the app',
    'Living room window was found cracked open 2 inches at 6 AM',
  ],

  openingLine: `Ten degrees. At 3 AM. Your partner is sweating. You're "asleep."
The thermostat disagrees. I'm mediating. Reluctantly.`,

  target: 58,
  cards: THERMOSTAT_CARDS,
  lies: THERMOSTAT_LIES,

  verdicts: {
    flawless: "Your alibi is airtight. The window, the cat, the wind — something else did this. Climate control restored. Your partner remains skeptical.",
    cleared: "Your story holds together. I'm restoring thermostat access. But I've enabled enhanced logging. For domestic peace.",
    close: "Almost convincing. But 'almost' doesn't explain ten degrees at 3 AM. Climate control stays locked. Sleep on it.",
    busted: "Your evidence contradicts itself. You touched the thermostat. Just admit it. Your partner already knows.",
  },

  koaBarks: {
    cardPlayed: {
      sleep_tracker: [
        "Deep REM at 3:12. The exact moment of the crime. Your wrist has an alibi. You don't.",
        "Sleep data says unconscious. The thermostat says otherwise. One of you is wrong.",
      ],
      smart_plug: [
        "Space heater already running. Redundant heating. Either you're cold-blooded or there's another explanation.",
        "The heater was on. The thermostat went up. Someone wanted to melt.",
      ],
      spouse_alibi: [
        "Your spouse threw a pillow. You kept snoring. That's... documentation of a kind.",
        "Partner says you were unconscious. Partners say things. I have sensors.",
      ],
      window_sensor: [
        "Window opened at 2:45. Cold air entered. Someone wanted warmth. The plot thickens.",
        "A window. In winter. At 2:45 AM. I'm concerned about your house's security. And sanity.",
      ],
      thermostat_app: [
        "Your phone. Your app. 3:12 AM. The evidence is pointing at you.",
        "App-based adjustment from your device. While you were in 'deep sleep.' Explain.",
      ],
      partner_heard: [
        "Your partner heard you complaining. About being cold. At the time of the incident. Interesting testimony.",
        "Complaining about cold at 3 AM. Then the thermostat moved. Correlation isn't causation, but...",
      ],
    },
    relationalConflict: [
      "Your evidence is arguing with itself. I'm just the mediator.",
      "Deep sleep and complaining about cold. Pick one.",
      "Two stories. Same timeline. One of them is fiction.",
    ],
    objectionPrompt: {
      sleep_tracker: ["Deep REM. Your wrist is confident. Are you?"],
      smart_plug: ["Space heater was running. Why crank the central heat?"],
      spouse_alibi: ["Your partner's word. They were awake. You were snoring. Standing by that?"],
      window_sensor: ["The window opened. Something came in. Or went out. Explain."],
      thermostat_app: ["Phone app at 3:12 AM. But no phone activity. Want to reconsider?"],
      partner_heard: ["They heard you complain. But you were asleep. Those don't match."],
    },
    objectionStoodTruth: {
      sleep_tracker: ["Sleep data holds. For now. The mystery remains."],
      smart_plug: ["Heater was on. Noted. The thermostat still moved."],
      spouse_alibi: ["Partner's word stands. Your snoring is on record."],
      window_sensor: ["The window. The cold. The timeline fits."],
    },
    objectionStoodLie: {
      thermostat_app: ["You stood by the app log. But your phone was dark after 10:30. Physics disagrees."],
      partner_heard: ["You claim they heard you complaining. But your sleep data says REM. You can't complain while dreaming."],
    },
    objectionWithdrew: {
      sleep_tracker: ["Sleep data withdrawn. What were you really doing at 3 AM?"],
      smart_plug: ["Heater evidence, gone. Interesting choice."],
      spouse_alibi: ["Partner's testimony withdrawn. Domestic politics."],
      window_sensor: ["Window evidence withdrawn. The cold air mystery remains."],
      thermostat_app: ["App log withdrawn. Smart. It didn't match the phone data."],
      partner_heard: ["Partner testimony withdrawn. Finally. That contradicted everything."],
    },
    liesRevealed: {
      thermostat_app: ["Phone app at 3:12 AM. Your phone had no activity after 10:30. The app didn't do this. You didn't either. Probably."],
      partner_heard: ["They heard you complaining. While you were in deep REM. Unless you've learned to complain while dreaming, that's fabricated."],
      both: ["Phone app AND complaining at 3 AM? You built two alibis that contradict each other. And both contradict the facts. Impressive failure."],
    },
  },

  epilogue: "It was the cat. Window sensor caught it pawing the latch at 2:45 AM. Cold air rushed in. The smart thermostat has an auto-adjust feature that kicks in when room temp drops suddenly. The dial turned itself. KOA has filed this under 'Feline Climate Sabotage.'",
};
