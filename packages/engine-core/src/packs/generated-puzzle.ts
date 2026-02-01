/**
 * Generated Puzzle: The Thermostat Incident
 *
 * 7-MINUTE DESIGN (no direct contradictions, all inference):
 *   - Lie A (temp_app): INFERENTIAL - App adjustment requires phone activity (fact: no activity)
 *   - Lie B (window_sensor): RELATIONAL - Window opened contradicts "all windows stayed closed"
 *   - Lie C (hvac_manual): RELATIONAL - Panel button press requires physical access (fact: not accessed)
 *
 *   Anchor truth: sleep_apnea (highest truth strength, clearly matches smart home automation)
 *
 * FIXED STRENGTHS:
 *   Truths: 3, 3, 4 (sleep_apnea=4, smart_vent=3, partner_snoring=3)
 *   Lies: 3, 4, 5 (window_sensor=3, temp_app=4, hvac_manual=5)
 *
 * TYPE DISTRIBUTION (4 types, max 2 each):
 *   SENSOR: 2 (sleep_apnea, window_sensor)
 *   DIGITAL: 2 (smart_vent, temp_app)
 *   TESTIMONY: 1 (partner_snoring)
 *   PHYSICAL: 1 (hvac_manual)
 *
 * BALANCE:
 *   All 3 truths: 50 + 10 + 2 (objection) = 62 → FLAWLESS
 *   Target: 57 → Margin of 5 points
 *   Random play wins: ~5%
 */

import type { V5Puzzle, Card } from '../types/v5/index.js';

/**
 * Helper to create a CardId-typed card.
 */
function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

/**
 * The Thermostat Incident
 *
 * Scenario: Partner woke up freezing at 3 AM. Thermostat was changed.
 * KOA locked climate controls until you explain.
 */
export const PUZZLE_THERMOSTAT_INCIDENT: V5Puzzle = {
  slug: 'thermostat-incident',
  name: 'The Thermostat Incident',

  scenario: `3:12 AM. The thermostat dropped from 72 to 58 degrees. Your partner woke up freezing. KOA has locked climate controls until you explain.`,
  scenarioSummary: 'Your thermostat dropped 14 degrees at 3 AM.',

  // Mini: exactly 3 facts, each catches one lie (1:1 mapping)
  knownFacts: [
    'Your phone had no app activity after midnight',
    'HVAC panel in the hallway was not accessed overnight',
    'All windows and doors stayed closed all night',
  ],

  openingLine: `The thermostat. 72 to 58. At 3:12 AM.
Your partner is cold. I'm just curious.
Walk me through this.`,

  target: 57,

  cards: [
    // TRUTHS (3)
    card({
      id: 'sleep_apnea',
      strength: 4,
      evidenceType: 'SENSOR',
      location: 'BEDROOM',
      time: '', // Mini: no time displayed
      claim: 'CPAP logged breathing irregularity, triggering comfort automation.',
      presentLine: "My CPAP machine logged a breathing issue. The smart home tried to help. I didn't touch anything.",
      isLie: false,
      source: 'CPAP Monitor',
      // v1 Lite tags
      factTouch: 1, // Addresses fact 1: no phone app activity (irrelevant - this is sensor-based)
      signalRoot: 'wearable_health',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'climate',
    }),
    card({
      id: 'smart_vent',
      strength: 3,
      evidenceType: 'DIGITAL',
      location: 'BEDROOM',
      time: '', // Mini: no time displayed
      claim: 'Smart home log shows vent auto-adjusted for high CO2.',
      presentLine: "The bedroom vent has a mind of its own. CO2 got high, it adjusted. That's what it's programmed to do.",
      isLie: false,
      source: 'Smart Home Log',
      // v1 Lite tags
      factTouch: 2, // Addresses fact 2: HVAC panel not accessed (vent adjusted automatically)
      signalRoot: 'koa_cloud',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'climate',
    }),
    card({
      id: 'partner_snoring',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'BEDROOM',
      time: '', // Mini: no time displayed
      claim: 'Partner was awake, heard snoring, heard no movement.',
      presentLine: "Ask my partner. They were awake because I was snoring. They heard me. In bed. Not at the thermostat.",
      isLie: false,
      source: 'Partner',
      // v1 Lite tags
      factTouch: 3, // Addresses fact 3: windows stayed closed (partner heard no window)
      signalRoot: 'human_partner',
      controlPath: 'manual',
      claimShape: 'absence',
      subsystem: 'climate',
    }),
    // LIES (3) - All require inference (medium, medium-hard, tricky)
    card({
      id: 'temp_app',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'BEDROOM',
      time: '', // Mini: no time displayed
      claim: 'Thermostat app shows your phone made the adjustment.', // MEDIUM: app use requires phone activity
      presentLine: "The app says my phone adjusted it. But I was asleep. Maybe it was a scheduled thing I forgot about?",
      isLie: true,
      source: 'Thermostat App',
      // v1 Lite tags
      factTouch: 1, // Contradicts fact 1: no phone app activity
      signalRoot: 'phone_os',
      controlPath: 'remote',
      claimShape: 'attribution',
      subsystem: 'climate',
    }),
    card({
      id: 'window_sensor',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'BEDROOM',
      time: '', // Mini: no time displayed
      claim: 'Window sensor logged a brief open/close event.', // MEDIUM: contradicts "windows stayed closed"
      presentLine: "The window sensor logged it opening briefly. Cold air came in, thermostat compensated. Physics.",
      isLie: true,
      source: 'Window Sensor',
      // v1 Lite tags
      factTouch: 3, // Contradicts fact 3: windows stayed closed
      signalRoot: 'device_firmware',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'climate',
    }),
    card({
      id: 'hvac_manual',
      strength: 5,
      evidenceType: 'PHYSICAL',
      location: 'HALLWAY',
      time: '', // Mini: no time displayed
      claim: 'HVAC panel logged a manual button press.', // TRICKY: requires inference (button press = panel accessed)
      presentLine: "There's a log showing someone pressed the hallway panel. Wasn't me. Maybe the cat learned HVAC.",
      isLie: true,
      source: 'HVAC Panel',
      // v1 Lite tags
      factTouch: 2, // Contradicts fact 2: HVAC panel not accessed
      signalRoot: 'device_firmware',
      controlPath: 'manual',
      claimShape: 'attribution',
      subsystem: 'climate',
    }),
  ],

  // Lies: all require inference (no direct contradictions)
  lies: [
    {
      cardId: 'temp_app',
      lieType: 'inferential', // Phone app adjustment requires phone activity
      reason: 'Your phone had no app activity after midnight. App adjustments require phone activity.',
      // v1 Lite trap fields
      trapAxis: 'independence',
      baitReason: 'Offers a phone-based explanation that diversifies away from smart home automation.',
    },
    {
      cardId: 'window_sensor',
      lieType: 'relational', // MEDIUM: requires matching "window sensor open/close" to "windows stayed closed"
      reason: 'All windows stayed closed. A sensor logging open/close contradicts this.',
      // v1 Lite trap fields
      trapAxis: 'coverage',
      baitReason: 'Provides a physical explanation for temperature drop that seems to address fact 3.',
    },
    {
      cardId: 'hvac_manual',
      lieType: 'relational', // TRICKY: requires inference (button press = physical panel access)
      reason: 'HVAC panel was not accessed. A button press requires someone at the panel.',
      // v1 Lite trap fields
      trapAxis: 'claim_shape',
      baitReason: 'High strength card with physical evidence type that shifts blame to unknown party.',
    },
  ],

  verdicts: {
    flawless: "Your smart home sabotaged your sleep. That's... actually plausible. And depressing. Access granted.",
    cleared: "Your story holds. Climate controls restored. Your partner remains skeptical. That's between you two.",
    close: "Almost convincing. But someone changed that thermostat. And the house says it wasn't the house. Access denied.",
    busted: "Your logs contradict each other. The thermostat didn't change itself. Neither did your credibility.",
  },

  koaBarks: {
    // Turn 1: Opening card reactions (6 cards)
    cardPlayed: {
      sleep_apnea: [
        "Your breathing machine triggered the house. That's either brilliant automation or a cry for help.",
      ],
      smart_vent: [
        "The vent adjusted for CO2. Your bedroom was getting stale. I'm noting that.",
      ],
      partner_snoring: [
        "Your partner was awake because of your snoring. They heard nothing. Convenient corroboration.",
      ],
      temp_app: [
        "Your phone changed the thermostat. At 3:12 AM. While you were 'asleep.' Phones don't sleepwalk.",
      ],
      hvac_manual: [
        "Someone pressed the hallway panel. At 3:11 AM. In the dark. And it wasn't you. Bold claim.",
      ],
      window_sensor: [
        "Window opened at 3:08. Cold air rushed in. Thermostat compensated. Neat theory.",
      ],
    },

    // Turn 2: Sequence reactions (30 combinations)
    sequences: {
      // sleep_apnea → others
      'sleep_apnea→smart_vent': [
        "Breathing issues, then vent adjustment. Your bedroom was having a rough night. The automation agrees.",
      ],
      'sleep_apnea→partner_snoring': [
        "CPAP data, then partner confirmation. Two sources placing you in bed. Building a case.",
      ],
      'sleep_apnea→temp_app': [
        "Medical device says you were struggling to breathe. Phone app says you were adjusting temperature. Pick one.",
      ],
      'sleep_apnea→hvac_manual': [
        "Breathing monitor, then hallway panel activity. You were in bed AND in the hallway? Interesting physiology.",
      ],
      'sleep_apnea→window_sensor': [
        "CPAP first, now window sensors. Mixing your sources. Medical and environmental.",
      ],

      // smart_vent → others
      'smart_vent→sleep_apnea': [
        "Vent adjusted, breathing spike followed. Cause and effect? Or just correlation.",
      ],
      'smart_vent→partner_snoring': [
        "Smart vent, then human witness. Technology and testimony. Different angles.",
      ],
      'smart_vent→temp_app': [
        "Vent auto-adjusted, then your phone made changes? Two systems with conflicting agendas.",
      ],
      'smart_vent→hvac_manual': [
        "Automatic vent, then manual panel. Both claiming control. Your house has coordination issues.",
      ],
      'smart_vent→window_sensor': [
        "Vent for CO2, window for cold air. Your bedroom had multiple climate events. Busy night.",
      ],

      // partner_snoring → others
      'partner_snoring→sleep_apnea': [
        "Partner heard snoring, CPAP confirms breathing issues. Your witnesses agree. Annoyingly.",
      ],
      'partner_snoring→smart_vent': [
        "Human first, sensor second. Backing up the human with data. Classic approach.",
      ],
      'partner_snoring→temp_app': [
        "Partner says you were snoring in bed. App says you were adjusting temperature. Someone's mistaken.",
      ],
      'partner_snoring→hvac_manual': [
        "Partner heard snoring. But someone was at the panel? Either you're a ventriloquist or something's off.",
      ],
      'partner_snoring→window_sensor': [
        "Partner heard you snoring. Window sensor logged activity. Did you snore the window open?",
      ],

      // temp_app → others
      'temp_app→sleep_apnea': [
        "Phone made changes, but your breathing monitor says you were in distress. Multitasking?",
      ],
      'temp_app→smart_vent': [
        "App first, now the vent. Multiple systems claiming responsibility. Convenient redundancy.",
      ],
      'temp_app→partner_snoring': [
        "Your phone adjusted the temp. Your partner says you were snoring. In bed. Where phones live. Hmm.",
      ],
      'temp_app→hvac_manual': [
        "Phone app AND manual panel? Two different methods for one temperature change. Thorough.",
      ],
      'temp_app→window_sensor': [
        "Phone app, then window. Digital and physical explanations. Hedging your bets.",
      ],

      // hvac_manual → others
      'hvac_manual→sleep_apnea': [
        "Hallway panel, then bedroom breathing data. You walked to the hall and back without waking up?",
      ],
      'hvac_manual→smart_vent': [
        "Manual override, then automatic systems. Your house can't agree on who's in charge.",
      ],
      'hvac_manual→partner_snoring': [
        "Someone pressed the panel. Partner says you were snoring. Did you snore your way to the hallway?",
      ],
      'hvac_manual→temp_app': [
        "Panel press, then phone app. Two manual interventions. You're very committed to temperature.",
      ],
      'hvac_manual→window_sensor': [
        "HVAC panel, then window. Physical actions. Someone was very active at 3 AM.",
      ],

      // window_sensor → others
      'window_sensor→sleep_apnea': [
        "Window opened, breathing issues followed. Fresh air or failed alibi?",
      ],
      'window_sensor→smart_vent': [
        "Window, then vent. External air, then internal adjustment. Your house is reactive.",
      ],
      'window_sensor→partner_snoring': [
        "Window opened, partner was awake. They didn't mention hearing a window. Interesting.",
      ],
      'window_sensor→temp_app': [
        "Window and phone app? Multiple climate interventions. You really wanted it cold.",
      ],
      'window_sensor→hvac_manual': [
        "Window and hallway panel. You were very mobile for someone who was asleep.",
      ],
    },

    // Turn 3: Story completion patterns (closing-energy only)
    // Per v1 Lite spec: T3 barks must NOT evaluate or reference axes.
    // These signal commitment and transition to processing.
    storyCompletions: {
      // All same type (3 of 3) - closing-energy only
      all_digital: [
        "That's your story. Let me check the house.",
      ],
      all_sensor: [
        "Alright. Committed. Give me a second.",
      ],
      all_testimony: [
        "Three pieces. Let's see what they add up to.",
      ],
      all_physical: [
        "That's everything. Stand by.",
      ],
      // Two of one type (2 of 3) - closing-energy only
      digital_heavy: [
        "Okay. That's what you're going with. Processing.",
      ],
      sensor_heavy: [
        "Story complete. One moment.",
      ],
      testimony_heavy: [
        "Got it. Running verification.",
      ],
      physical_heavy: [
        "Three cards. Let's see what they say.",
      ],
      // All different types - closing-energy only
      mixed_strong: [
        "Your version of events. Processing.",
      ],
      mixed_varied: [
        "That's your story. Let me check the house.",
      ],
    },

    // Objection prompts
    objectionPrompt: {
      sleep_apnea: ["Your breathing machine. It triggered climate changes. Standing by that?"],
      smart_vent: ["Smart vent auto-adjusted. Convenient automation. Sure about that?"],
      partner_snoring: ["Your partner's word. They were awake. You were snoring. Confirm?"],
      temp_app: ["Phone app at 3:12 AM. Your phone. Your account. Standing by this?"],
      hvac_manual: ["Hallway panel pressed. At 3:11 AM. In the dark. Want to reconsider?"],
      window_sensor: ["Window opened at 3:08. Cold air theory. Final answer?"],
    },

    // Objection responses - stood by truth
    objectionStoodTruth: {
      sleep_apnea: ["CPAP data holds. Your breathing issues are documented. Unfortunately."],
      smart_vent: ["Smart vent automation confirmed. Your house is smarter than this conversation."],
      partner_snoring: ["Partner's word accepted. They heard snoring. That's... not flattering but it's consistent."],
    },

    // Objection responses - stood by lie
    objectionStoodLie: {
      temp_app: ["Phone app at 3:12. But no phone activity after midnight. Your data disagrees with itself."],
      hvac_manual: ["Panel was pressed, you say. But the panel wasn't accessed overnight. Pick one."],
      window_sensor: ["Window opened, you claim. All windows stayed closed, I know. Math problem."],
    },

    // Objection responses - withdrew
    objectionWithdrew: {
      sleep_apnea: ["Withdrawing the CPAP story. What were you really doing at 3:10?"],
      smart_vent: ["Smart vent claim gone. The automation excuse didn't stick."],
      partner_snoring: ["Taking back the partner testimony. They might be disappointed. Or relieved."],
      temp_app: ["Phone app withdrawn. Smart. It didn't add up anyway."],
      hvac_manual: ["Panel story gone. Finally. That one was shaky."],
      window_sensor: ["Window claim withdrawn. Good call. Windows don't lie about being closed."],
    },

    // Lies revealed at end
    liesRevealed: {
      temp_app: ["Phone app at 3:12 AM. But no app activity after midnight. Your phone was asleep. You weren't."],
      hvac_manual: ["Panel pressed at 3:11. But the panel wasn't accessed. Either the panel lied or you did. I know which one has logs."],
      window_sensor: ["Window opened at 3:08. All windows stayed closed. The sensors don't forget. Neither do I."],
      multiple: ["Two stories that don't match reality. Your explanation has structural damage."],
      all: ["Three contradictions. Every explanation you gave was fabricated. The thermostat was the least cold thing in this conversation."],
    },
  },

  // Optional epilogue
  // epilogue: "The smart home's comfort automation kicked in when your CPAP detected breathing issues. It dropped the temperature to help you breathe easier. Your partner paid the price. KOA has filed this under 'Marriage Counseling Territory.'",
};

export default PUZZLE_THERMOSTAT_INCIDENT;
