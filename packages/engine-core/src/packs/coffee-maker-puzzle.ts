/**
 * Generated Puzzle: The 4 AM Coffee Incident
 *
 * 7-MINUTE DESIGN (no direct contradictions, all inference):
 *   - Lie A (coffee_app): INFERENTIAL - App command requires WiFi (fact: WiFi was down)
 *   - Lie B (voice_log): RELATIONAL - Voice command requires someone speaking (fact: no audio detected)
 *   - Lie C (timer_preset): INFERENTIAL - Timer was cleared yesterday (fact: no active timers)
 *
 *   Anchor truth: power_spike (highest truth strength, clearly matches electrical anomaly explanation)
 *
 * FIXED STRENGTHS:
 *   Truths: 3, 3, 4 (power_spike=4, cat_motion=3, partner_testimony=3)
 *   Lies: 3, 4, 5 (timer_preset=3, coffee_app=4, voice_log=5)
 *
 * TYPE DISTRIBUTION (4 types, max 2 each):
 *   SENSOR: 2 (power_spike, cat_motion)
 *   DIGITAL: 2 (coffee_app, voice_log)
 *   TESTIMONY: 1 (partner_testimony)
 *   PHYSICAL: 1 (timer_preset)
 *
 * BALANCE:
 *   Truths: power_spike(4) + cat_motion(3) + partner_testimony(3) = 10
 *   All 3 truths: 50 + 10 + 2 (objection) = 62 -> FLAWLESS
 *   Target: 57 -> Margin of 5 points
 *
 *   Lies: voice_log(5) + coffee_app(4) + timer_preset(3) = 12
 *   1 lie case (best 2 truths + weakest lie):
 *     50 + 7 (power_spike + cat_motion) - 2 (timer_preset penalty) + 2 (objection) = 57 (CLOSE - exactly at target)
 *   2 lies case: 50 + 4 - 4 - 2 + 2 = 50 (BUSTED)
 *   3 lies case: 50 - 4 - 3 - 2 = 41 (BUSTED)
 *
 *   Random win rate: C(3,3)/C(6,3) = 1/20 = 5%
 *
 * v1 LITE AXIS DESIGN:
 *   Truths: factTouch {1, 2, 3} partition (each truth addresses one fact)
 *   SignalRoots: device_firmware, device_firmware, human_partner (2 device, 1 human)
 *   Concern scenario: If player picks coffee_app + voice_log on T1/T2,
 *     triggers "same_system" concern (both phone_os)
 *   P4+ Constraint: Dodging the digital concern still leaves timer_preset (coverage trap)
 */

import type { V5Puzzle, Card } from '../types/v5/index.js';

/**
 * Helper to create a CardId-typed card.
 */
function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

/**
 * The 4 AM Coffee Incident
 *
 * Scenario: Coffee maker started brewing at 4 AM. Nobody scheduled it.
 * Partner is awake and unhappy. KOA locked kitchen appliances until you explain.
 */
export const PUZZLE_COFFEE_INCIDENT: V5Puzzle = {
  slug: 'coffee-incident',
  name: 'The 4 AM Coffee Incident',

  scenario: `4:03 AM. Your smart coffee maker started brewing. Nobody scheduled it. Your partner is awake and unhappy. KOA has locked kitchen appliances until you explain.`,

  // Mini: exactly 3 facts, each catches one lie (1:1 mapping)
  knownFacts: [
    'WiFi router was offline from 3 AM to 5 AM (scheduled maintenance)',
    'Smart speaker detected no voice commands after midnight',
    'Coffee maker timer was cleared yesterday (no active preset)',
  ],

  openingLine: `Your coffee maker. 4:03 AM. Fresh brew cycle.
Your partner is awake. The coffee is not for them.
Walk me through this.`,

  target: 57,

  cards: [
    // TRUTHS (3)
    card({
      id: 'power_spike',
      strength: 4,
      evidenceType: 'SENSOR',
      location: 'KITCHEN',
      time: '', // Mini: no time displayed
      claim: 'Power meter logged a voltage spike at 4:02 AM.',
      presentLine: "There was a power surge. The electrical panel logged it. Sometimes appliances just... wake up. It's not my fault the grid is unstable.",
      isLie: false,
      source: 'Power Meter',
      // v1 Lite tags
      factTouch: 1, // Addresses fact 1: WiFi down (irrelevant to power spike)
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'kitchen',
    }),
    card({
      id: 'cat_motion',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'KITCHEN',
      time: '', // Mini: no time displayed
      claim: 'Kitchen motion sensor triggered at counter height.',
      presentLine: "The motion sensor caught something at counter height. We have a cat. Cats jump on counters. It's what they do. I was in bed.",
      isLie: false,
      source: 'Motion Sensor',
      // v1 Lite tags
      factTouch: 2, // Addresses fact 2: no voice commands (cat can't speak)
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'kitchen',
    }),
    card({
      id: 'partner_testimony',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'BEDROOM',
      time: '', // Mini: no time displayed
      claim: 'Partner confirms you were snoring until the coffee smell woke them.',
      presentLine: "Ask my partner. They were already annoyed because I was snoring. Then the coffee smell hit. That's when they woke up. I was in bed the whole time.",
      isLie: false,
      source: 'Partner',
      // v1 Lite tags
      factTouch: 3, // Addresses fact 3: timer cleared (supports you didn't schedule it)
      signalRoot: 'human_partner',
      controlPath: 'manual',
      claimShape: 'absence',
      subsystem: 'kitchen',
    }),
    // LIES (3) - All require inference (no direct contradictions)
    card({
      id: 'coffee_app',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'BEDROOM',
      time: '', // Mini: no time displayed
      claim: 'Coffee app shows remote brew command from your phone.', // MEDIUM: requires WiFi
      presentLine: "The app says my phone triggered it. But I was asleep. Maybe I sleepwalk-tapped? Is that a thing?",
      isLie: true,
      source: 'Coffee App',
      // v1 Lite tags
      factTouch: 1, // Contradicts fact 1: WiFi was down, app requires WiFi
      signalRoot: 'phone_os',
      controlPath: 'remote',
      claimShape: 'attribution',
      subsystem: 'kitchen',
    }),
    card({
      id: 'voice_log',
      strength: 5,
      evidenceType: 'DIGITAL',
      location: 'KITCHEN',
      time: '', // Mini: no time displayed
      claim: 'Smart speaker logged voice command: "Start coffee."', // MEDIUM-HARD: requires voice detection
      presentLine: "The smart speaker logged someone saying 'start coffee.' I must have been sleep-talking. Very specifically. About coffee.",
      isLie: true,
      source: 'Smart Speaker',
      // v1 Lite tags
      factTouch: 2, // Contradicts fact 2: no voice commands after midnight
      signalRoot: 'phone_os',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'kitchen',
    }),
    card({
      id: 'timer_preset',
      strength: 3,
      evidenceType: 'PHYSICAL',
      location: 'KITCHEN',
      time: '', // Mini: no time displayed
      claim: 'Coffee maker display shows timer was set for 4 AM.', // TRICKY: timer was cleared
      presentLine: "Look at the display. Timer says 4 AM. I must have set it and forgot. That's the kind of thing I do. Forgetting things.",
      isLie: true,
      source: 'Coffee Maker Display',
      // v1 Lite tags
      factTouch: 3, // Contradicts fact 3: timer was cleared yesterday
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'kitchen',
    }),
  ],

  // Lies: all require inference (no direct contradictions)
  lies: [
    {
      cardId: 'coffee_app',
      lieType: 'inferential', // App commands require WiFi, WiFi was down
      reason: 'WiFi was offline from 3-5 AM. App commands require WiFi connectivity.',
      // v1 Lite trap fields
      trapAxis: 'independence',
      baitReason: 'Offers a phone-based explanation that diversifies away from sensor data.',
    },
    {
      cardId: 'voice_log',
      lieType: 'relational', // MEDIUM-HARD: voice command contradicts "no voice detected"
      reason: 'Smart speaker detected no voice commands after midnight. A voice command log contradicts this.',
      // v1 Lite trap fields
      trapAxis: 'claim_shape',
      baitReason: 'High strength card with a positive claim that shifts blame to sleep behavior.',
    },
    {
      cardId: 'timer_preset',
      lieType: 'inferential', // TRICKY: requires remembering timer was cleared
      reason: 'Coffee maker timer was cleared yesterday. There was no active preset.',
      // v1 Lite trap fields
      trapAxis: 'coverage',
      baitReason: 'Physical evidence from the device itself seems reliable and covers the scheduling angle.',
    },
  ],

  verdicts: {
    flawless: "Power surge plus cat equals accidental coffee. Your house is haunted by bad wiring and feline chaos. Access granted.",
    cleared: "Your story holds. Kitchen access restored. Your partner is still waiting for an apology. That's between you two.",
    close: "Almost convincing. But something triggered that brew cycle. And your story has gaps. Access denied.",
    busted: "Your logs contradict themselves. The coffee didn't brew itself. Neither did your credibility.",
  },

  koaBarks: {
    // Turn 1: Opening card reactions (6 cards)
    cardPlayed: {
      power_spike: [
        "Power surge at 4:02. Then coffee at 4:03. Cause and effect, or convenient coincidence?",
      ],
      cat_motion: [
        "Counter-height motion. The cat defense. Classic. Cats do love pushing buttons.",
      ],
      partner_testimony: [
        "Partner was awake due to snoring. They vouch for your unconsciousness. Romantic.",
      ],
      coffee_app: [
        "Your phone sent a brew command. At 4:03 AM. While you were 'sleeping.' Phones don't caffeinate themselves.",
      ],
      voice_log: [
        "Voice command logged. 'Start coffee.' At 4 AM. In your voice. Sleep-talking baristas are rare.",
      ],
      timer_preset: [
        "Timer display says 4 AM. Someone programmed that. Forgetting things is convenient. And common.",
      ],
    },

    // Turn 2: Sequence reactions (30 combinations)
    sequences: {
      // power_spike → others
      'power_spike→cat_motion': [
        "Power surge, then cat activity. The cat and the electricity are conspiring. Against your sleep.",
      ],
      'power_spike→partner_testimony': [
        "Electrical anomaly, then human witness. Technical and testimonial. Different angles on innocence.",
      ],
      'power_spike→coffee_app': [
        "Power spike first, now your phone triggered it? Two causes for one brew cycle. Pick one.",
      ],
      'power_spike→voice_log': [
        "Surge, then voice command. The power spiked AND you spoke? Busy night.",
      ],
      'power_spike→timer_preset': [
        "Power surge and a timer. Electrical fault plus scheduled brew? Redundant explanations.",
      ],

      // cat_motion → others
      'cat_motion→power_spike': [
        "Cat first, then power data. Feline and electrical. Your kitchen had multiple events.",
      ],
      'cat_motion→partner_testimony': [
        "Motion sensor, then partner. The cat and your partner agree you were innocent. Sort of.",
      ],
      'cat_motion→coffee_app': [
        "Cat triggered motion. Phone sent command. Did the cat use your phone? They're smart, but not that smart.",
      ],
      'cat_motion→voice_log': [
        "Cat moved, then voice command. Cats don't say 'start coffee.' Usually.",
      ],
      'cat_motion→timer_preset': [
        "Cat activity, then timer preset. The cat set a timer? That's advanced even for cats.",
      ],

      // partner_testimony → others
      'partner_testimony→power_spike': [
        "Partner vouches, power meter confirms. Human and machine alignment. Interesting.",
      ],
      'partner_testimony→cat_motion': [
        "Witness first, then sensors. Backing up the human with data. Thorough approach.",
      ],
      'partner_testimony→coffee_app': [
        "Partner says you were snoring. App says you were brewing. Someone's confused.",
      ],
      'partner_testimony→voice_log': [
        "Partner heard snoring, not coffee commands. The voice log disagrees. Whose ears are better?",
      ],
      'partner_testimony→timer_preset': [
        "Partner's word, then the timer. Human memory plus device memory. Both can be wrong.",
      ],

      // coffee_app → others
      'coffee_app→power_spike': [
        "Phone command, then power spike. Your app triggered a surge? That's some powerful coffee.",
      ],
      'coffee_app→cat_motion': [
        "App first, now the cat. Multiple triggers. Your kitchen is eventful.",
      ],
      'coffee_app→partner_testimony': [
        "Phone made coffee. Partner says you were asleep. Sleepwalking through apps?",
      ],
      'coffee_app→voice_log': [
        "App command AND voice command? Two methods for one brew. Very committed to coffee.",
      ],
      'coffee_app→timer_preset': [
        "Phone app, then timer preset. Digital and physical triggers. Hedging your bets.",
      ],

      // voice_log → others
      'voice_log→power_spike': [
        "Voice command, then power surge. You spoke AND there was a surge? Eventful night.",
      ],
      'voice_log→cat_motion': [
        "Voice first, cat second. The cat made you talk in your sleep? Interesting theory.",
      ],
      'voice_log→partner_testimony': [
        "Voice logged, partner heard snoring. Either you snore words or something's off.",
      ],
      'voice_log→coffee_app': [
        "Voice command, then phone app. Spoke and tapped? You really wanted that coffee.",
      ],
      'voice_log→timer_preset': [
        "Voice log, then timer. Multiple explanations. Your story is... comprehensive.",
      ],

      // timer_preset → others
      'timer_preset→power_spike': [
        "Timer was set, then power spiked. The timer caused a surge? Unlikely but creative.",
      ],
      'timer_preset→cat_motion': [
        "Timer and cat. Both triggered at 4 AM. Coincidence? Probably. Suspiciously.",
      ],
      'timer_preset→partner_testimony': [
        "Timer preset, partner confirms bed time. You set a timer and forgot? Very human.",
      ],
      'timer_preset→coffee_app': [
        "Timer AND app? Two brewing methods. Your coffee maker is overcommitted.",
      ],
      'timer_preset→voice_log': [
        "Timer set, then voice command. Belt and suspenders approach to caffeine.",
      ],
    },

    // Turn 3: Story completion patterns (closing-energy only)
    // Per v1 Lite spec: T3 barks must NOT evaluate or reference axes.
    // These signal commitment and transition to processing.
    storyCompletions: {
      // All same type (3 of 3) - closing-energy only
      all_digital: [
        "That's your story. Let me check the logs.",
      ],
      all_sensor: [
        "All sensor data. Alright. Processing.",
      ],
      all_testimony: [
        "Three voices. Let me see if they harmonize.",
      ],
      all_physical: [
        "Physical sources only. Tangible. One moment.",
      ],
      // Two of one type (2 of 3) - closing-energy only
      digital_heavy: [
        "Mostly digital. Okay. Running verification.",
      ],
      sensor_heavy: [
        "Sensor-heavy story. The house has opinions. Processing.",
      ],
      testimony_heavy: [
        "Lots of human sources. People have opinions too.",
      ],
      physical_heavy: [
        "Physical-forward approach. Let me check.",
      ],
      // All different types - closing-energy only
      mixed_strong: [
        "Varied sources. That's your story. Stand by.",
      ],
      mixed_varied: [
        "Different angles. Processing your version.",
      ],
    },

    // Objection prompts
    objectionPrompt: {
      power_spike: ["Power surge made your coffee maker spontaneously brew. Standing by that?"],
      cat_motion: ["The cat did it. Counter height activity. Final answer?"],
      partner_testimony: ["Your partner vouches. Snoring confirmed. Want to reconsider?"],
      coffee_app: ["Phone app at 4:03 AM. Your phone. Your account. Sure about this?"],
      voice_log: ["Voice command logged. In what sounds like your voice. Confirm?"],
      timer_preset: ["Timer was preset for 4 AM. You forgot you set it. Standing by this?"],
    },

    // Objection responses - stood by truth
    objectionStoodTruth: {
      power_spike: ["Power meter data is consistent. Your house has electrical quirks. Noted."],
      cat_motion: ["Motion sensor confirms counter activity. Your cat is exonerated. Or implicated. Depends on perspective."],
      partner_testimony: ["Partner's account holds. They were awake, you were snoring. Not flattering but consistent."],
    },

    // Objection responses - stood by lie
    objectionStoodLie: {
      coffee_app: ["Phone app at 4:03. But WiFi was down from 3-5 AM. App commands need WiFi. Math doesn't work."],
      voice_log: ["Voice command logged, you say. Smart speaker detected no voices after midnight. Your speaker disagrees with itself."],
      timer_preset: ["Timer preset for 4 AM. But the timer was cleared yesterday. No active preset exists. Check your story."],
    },

    // Objection responses - withdrew
    objectionWithdrew: {
      power_spike: ["Withdrawing the power surge story. What really happened at 4 AM?"],
      cat_motion: ["Cat theory withdrawn. The cat is relieved. Probably."],
      partner_testimony: ["Taking back the partner testimony. Were they even awake?"],
      coffee_app: ["Phone app withdrawn. Smart. It had connectivity issues. Like your story."],
      voice_log: ["Voice command gone. Good call. The silence was deafening anyway."],
      timer_preset: ["Timer story withdrawn. Finally. That one didn't add up."],
    },

    // Lies revealed at end
    liesRevealed: {
      coffee_app: ["Phone app at 4:03 AM. But WiFi was down. Your phone couldn't talk to anything. Including your coffee maker."],
      voice_log: ["Voice command logged. But the speaker detected no voices after midnight. Someone's not listening. And it's not the speaker."],
      timer_preset: ["Timer preset, you said. Timer was cleared yesterday, I know. Your coffee maker remembers better than you do."],
      multiple: ["Two stories that don't match reality. Your explanation has holes. Large ones."],
      all: ["Three contradictions. Every explanation was fabricated. The coffee was real. Your story wasn't."],
    },
  },

  // Optional epilogue
  // epilogue: "It was the cat. The motion sensor caught it stepping on the manual brew button at 4:02 AM. Combined with the power surge, the coffee maker woke up confused and started brewing. Your cat has developed a caffeine habit. KOA has filed this under 'Feline Interference.'",
};

export default PUZZLE_COFFEE_INCIDENT;
