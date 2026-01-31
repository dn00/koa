/**
 * Generated Puzzle: The 3 AM Vacuum Incident
 *
 * 7-MINUTE DESIGN (no direct contradictions, all inference):
 *   - Lie A (schedule_log): INFERENTIAL - Schedule shows 3 AM setting, but fact: schedule was disabled last week
 *   - Lie B (pet_trigger): RELATIONAL - Claims pet triggered auto-clean, but fact: pet mode was off and pets in bedroom
 *   - Lie C (app_command): INFERENTIAL - App remote start command, but fact: phone was in airplane mode charging
 *
 *   Anchor truth: firmware_glitch (highest truth strength, clearly matches unexpected activation pattern)
 *
 * FIXED STRENGTHS:
 *   Truths: 3, 3, 4 (firmware_glitch=4, bedroom_sensor=3, partner_testimony=3)
 *   Lies: 3, 4, 5 (schedule_log=3, app_command=4, pet_trigger=5)
 *
 * TYPE DISTRIBUTION (4 types, max 2 each):
 *   SENSOR: 2 (bedroom_sensor, pet_trigger)
 *   DIGITAL: 2 (firmware_glitch, app_command)
 *   TESTIMONY: 1 (partner_testimony)
 *   PHYSICAL: 1 (schedule_log)
 *
 * BALANCE:
 *   Truths: firmware_glitch(4) + bedroom_sensor(3) + partner_testimony(3) = 10
 *   All 3 truths: 50 + 10 + 2 (objection) = 62 -> FLAWLESS
 *   Target: 57 -> Margin of 5 points
 *
 *   Lies: pet_trigger(5) + app_command(4) + schedule_log(3) = 12
 *   1 lie case (best 2 truths + weakest lie):
 *     50 + 7 (firmware_glitch + bedroom_sensor) - 2 (schedule_log penalty) + 2 (objection) = 57 (CLOSE - exactly at target)
 *   2 lies case: 50 + 4 - 4 - 2 + 2 = 50 (BUSTED)
 *   3 lies case: 50 - 4 - 3 - 2 = 41 (BUSTED)
 *
 *   Random win rate: C(3,3)/C(6,3) = 1/20 = 5%
 *
 * v1 LITE AXIS DESIGN:
 *   Truths: factTouch {1, 2, 3} partition (each truth addresses one fact)
 *   SignalRoots: device_firmware, device_firmware, human_partner (2 device, 1 human - diverse)
 *   ControlPaths: automation, automation, manual (mix of automation and manual)
 *
 *   Lies trap analysis:
 *   - schedule_log (coverage): Explains the scheduling angle players wonder about
 *   - app_command (independence): Phone-based explanation diversifies from device sources
 *   - pet_trigger (claim_shape): High strength absence claim feels safe
 *
 *   Concern scenario: If player picks app_command + schedule_log on T1/T2,
 *     triggers "all_digital" or "control_path" concern (both claim scheduled/remote)
 *   P4+ Constraint: Dodging the digital concern still leaves pet_trigger (sensor with high strength)
 */

import type { V5Puzzle, Card } from '../types/v5/index.js';

/**
 * Helper to create a CardId-typed card.
 */
function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

/**
 * The 3 AM Vacuum Incident
 *
 * Scenario: Robot vacuum started cleaning at 3 AM, waking the household.
 * No schedule was set. Partner is furious. KOA has locked the vacuum until you explain.
 */
export const PUZZLE_VACUUM_INCIDENT: V5Puzzle = {
  slug: 'vacuum-incident',
  name: 'The 3 AM Vacuum Incident',

  scenario: `3:17 AM. Your robot vacuum started its cleaning cycle. The whole house woke up. No schedule was active. KOA has locked the vacuum until you explain.`,

  // Mini: exactly 3 facts, each catches one lie (1:1 mapping)
  knownFacts: [
    'Vacuum schedule was disabled last week (no active schedule)',
    'Pet tracking shows both cats were in the bedroom all night',
    'Your phone was in airplane mode charging from midnight to 6 AM',
  ],

  openingLine: `Your robot vacuum. 3:17 AM. Full cleaning cycle.
The household is awake. The cat is traumatized.
I need answers.`,

  target: 57,

  cards: [
    // TRUTHS (3)
    card({
      id: 'firmware_glitch',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'LIVING_ROOM',
      time: '', // Mini: no time displayed
      claim: 'Firmware logs show unexpected restart and default behavior activation.',
      presentLine: "The vacuum's firmware crashed and rebooted. When it came back, it ran its default startup routine. Which apparently includes cleaning. At 3 AM. I didn't program that.",
      isLie: false,
      source: 'Firmware Log',
      // v1 Lite tags
      factTouch: 1, // Addresses fact 1: schedule disabled (firmware glitch explains activation without schedule)
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'vacuum',
    }),
    card({
      id: 'bedroom_sensor',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'BEDROOM',
      time: '', // Mini: no time displayed
      claim: 'Bedroom motion sensor shows no human movement until vacuum noise started.',
      presentLine: "Check the bedroom sensor. I didn't move until that thing started screaming across the floor. The sensor knows. I was horizontal and unconscious.",
      isLie: false,
      source: 'Bedroom Sensor',
      // v1 Lite tags
      factTouch: 2, // Addresses fact 2: pets in bedroom (sensor shows humans were in bedroom too)
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'absence',
      subsystem: 'vacuum',
    }),
    card({
      id: 'partner_testimony',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'BEDROOM',
      time: '', // Mini: no time displayed
      claim: 'Partner confirms you were in bed when the vacuum started.',
      presentLine: "My partner was right there. They'll tell you. I was dead asleep until that robot decided to terrorize us. They're still mad, but they'll confirm I was in bed.",
      isLie: false,
      source: 'Partner',
      // v1 Lite tags
      factTouch: 3, // Addresses fact 3: phone in airplane mode (partner confirms you weren't on phone)
      signalRoot: 'human_partner',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'vacuum',
    }),
    // LIES (3) - All require inference (no direct contradictions)
    card({
      id: 'schedule_log',
      strength: 3,
      evidenceType: 'PHYSICAL',
      location: 'LIVING_ROOM',
      time: '', // Mini: no time displayed
      claim: 'Vacuum display shows scheduled clean was set for 3 AM.', // INFERENTIAL: schedule was disabled
      presentLine: "The vacuum's display shows a 3 AM schedule. I must have set it by accident last time I used the thing. Sleep-scheduling. It happens.",
      isLie: true,
      source: 'Vacuum Display',
      // v1 Lite tags
      factTouch: 1, // Contradicts fact 1: schedule was disabled last week
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'vacuum',
    }),
    card({
      id: 'app_command',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'BEDROOM',
      time: '', // Mini: no time displayed
      claim: 'Vacuum app shows remote start command sent at 3:16 AM.', // INFERENTIAL: phone was in airplane mode
      presentLine: "The app logged a remote start from my phone. Maybe I tapped it in my sleep? Phones are slippery. Things happen.",
      isLie: true,
      source: 'Vacuum App',
      // v1 Lite tags
      factTouch: 3, // Contradicts fact 3: phone was in airplane mode
      signalRoot: 'phone_os',
      controlPath: 'remote',
      claimShape: 'attribution',
      subsystem: 'vacuum',
    }),
    card({
      id: 'pet_trigger',
      strength: 5,
      evidenceType: 'SENSOR',
      location: 'LIVING_ROOM',
      time: '', // Mini: no time displayed
      claim: 'Motion sensor shows pet-height activity triggered auto-clean mode.', // RELATIONAL: pets were in bedroom
      presentLine: "The vacuum's pet sensor detected movement. Cats prowl at night. Auto-clean activated because of cat activity. It's a feature. An inconvenient feature.",
      isLie: true,
      source: 'Pet Sensor',
      // v1 Lite tags
      factTouch: 2, // Contradicts fact 2: pets were in bedroom all night
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'vacuum',
    }),
  ],

  // Lies: all require inference (no direct contradictions)
  lies: [
    {
      cardId: 'schedule_log',
      lieType: 'inferential', // Schedule claims 3 AM, but schedule was disabled
      reason: 'Vacuum schedule was disabled last week. No active schedule could have triggered the clean.',
      // v1 Lite trap fields
      trapAxis: 'coverage',
      baitReason: 'Physical evidence from the device display seems reliable and explains the timing.',
    },
    {
      cardId: 'app_command',
      lieType: 'inferential', // App command requires connectivity, phone was in airplane mode
      reason: 'Phone was in airplane mode charging. No app commands could be sent without connectivity.',
      // v1 Lite trap fields
      trapAxis: 'independence',
      baitReason: 'Phone-based explanation diversifies away from vacuum-internal sources.',
    },
    {
      cardId: 'pet_trigger',
      lieType: 'relational', // Requires cross-referencing pet location with trigger claim
      reason: 'Pet tracking shows both cats were in the bedroom all night. No pet was in the living room to trigger the sensor.',
      // v1 Lite trap fields
      trapAxis: 'claim_shape',
      baitReason: 'High strength positive claim with a relatable pet explanation seems safe.',
    },
  ],

  verdicts: {
    flawless: "Firmware crash plus unconscious human equals accidental midnight vacuuming. Your robot has issues. But you don't. Access granted.",
    cleared: "Your story holds. Vacuum unlocked. I suggest disabling the default startup routine. Unless you enjoy 3 AM chaos.",
    close: "Almost convincing. But vacuums don't spontaneously clean themselves. Your story has gaps. Access denied.",
    busted: "Your logs contradict themselves. The vacuum didn't decide to clean on its own. Neither did your excuses hold up.",
  },

  koaBarks: {
    // Turn 1: Opening card reactions (6 cards)
    cardPlayed: {
      firmware_glitch: [
        "Firmware crash at 3 AM. Convenient timing for a malfunction. Vacuums don't usually glitch into productivity.",
      ],
      bedroom_sensor: [
        "Bedroom sensor says you didn't move. Until the screaming started. That's what you're going with?",
      ],
      partner_testimony: [
        "Partner confirms you were in bed. Being in bed doesn't mean being asleep. But noted.",
      ],
      schedule_log: [
        "Schedule says 3 AM. You forgot you set it. Memory issues or convenient alibi?",
      ],
      app_command: [
        "Remote start from your phone. At 3:16 AM. Sleep-tapping is a new one. Creative.",
      ],
      pet_trigger: [
        "Cat triggered the vacuum. The eternal cat excuse. They do make convenient scapegoats.",
      ],
    },

    // Turn 2: Sequence reactions (30 combinations)
    sequences: {
      // firmware_glitch → others
      'firmware_glitch→bedroom_sensor': [
        "Firmware crashed, you stayed in bed. Technical failure and human immobility. Aligned alibis.",
      ],
      'firmware_glitch→partner_testimony': [
        "Robot malfunction, partner vouches. Machine error plus human witness. Covering your bases.",
      ],
      'firmware_glitch→schedule_log': [
        "Firmware crashed AND a schedule was set? Two explanations for one vacuum run. Which was it?",
      ],
      'firmware_glitch→app_command': [
        "Glitch first, now app command? The vacuum malfunctioned AND you triggered it remotely?",
      ],
      'firmware_glitch→pet_trigger': [
        "Firmware crash, then cat trigger. Multiple causes. Your vacuum had a busy night.",
      ],

      // bedroom_sensor → others
      'bedroom_sensor→firmware_glitch': [
        "You were in bed, vacuum glitched. Sensor confirms immobility. Now explaining the activation.",
      ],
      'bedroom_sensor→partner_testimony': [
        "Sensor data, then human witness. Tech and testimony. Redundant confirmation.",
      ],
      'bedroom_sensor→schedule_log': [
        "Bedroom sensor, then schedule log. You didn't move, but the schedule was set. Interesting setup.",
      ],
      'bedroom_sensor→app_command': [
        "You didn't move, but your phone did something. Remote command from a stationary position?",
      ],
      'bedroom_sensor→pet_trigger': [
        "You stayed put, cat triggered it. Passing blame to the pet. Classic misdirection.",
      ],

      // partner_testimony → others
      'partner_testimony→firmware_glitch': [
        "Partner vouches, firmware crashed. Human word plus robot error. Building the narrative.",
      ],
      'partner_testimony→bedroom_sensor': [
        "Witness first, then sensor backup. Your partner and your house agree. For now.",
      ],
      'partner_testimony→schedule_log': [
        "Partner confirms bed, schedule confirms time. Someone set that schedule. If it wasn't you in bed...",
      ],
      'partner_testimony→app_command': [
        "Partner says asleep. App says remote command. Were you sleep-commanding? That's not a thing.",
      ],
      'partner_testimony→pet_trigger': [
        "Partner vouch, then cat blame. Everyone's innocent except the feline. Convenient.",
      ],

      // schedule_log → others
      'schedule_log→firmware_glitch': [
        "Schedule set, then firmware crashed. The schedule triggered a glitch? Reaching.",
      ],
      'schedule_log→bedroom_sensor': [
        "Schedule first, bedroom sensor second. You forgot you set it, then forgot to get up. Consistent.",
      ],
      'schedule_log→partner_testimony': [
        "Schedule on record, partner confirms. Forgotten timer plus unconscious human. Story building.",
      ],
      'schedule_log→app_command': [
        "Schedule AND app command? Your vacuum received two sets of instructions. Overachieving.",
      ],
      'schedule_log→pet_trigger': [
        "Schedule plus cat trigger. Backup explanations. Your vacuum is very popular tonight.",
      ],

      // app_command → others
      'app_command→firmware_glitch': [
        "App command sent, vacuum crashed. Did your command break it? Or was it already broken?",
      ],
      'app_command→bedroom_sensor': [
        "Phone sent command, you stayed in bed. Remote vacuuming while horizontal. Efficient.",
      ],
      'app_command→partner_testimony': [
        "App triggered it, partner saw you sleeping. Sleep-tapping while witnessed. Awkward.",
      ],
      'app_command→schedule_log': [
        "Remote command, then schedule. Both active? Your vacuum takes orders from everywhere.",
      ],
      'app_command→pet_trigger': [
        "Phone command and cat activity. Multiple triggers. Busy night for that vacuum.",
      ],

      // pet_trigger → others
      'pet_trigger→firmware_glitch': [
        "Cat triggered it, then firmware crashed. The cat broke your vacuum? Cats do destroy things.",
      ],
      'pet_trigger→bedroom_sensor': [
        "Cat activity, then bedroom stillness. The cat was out, you were in. Location alibi.",
      ],
      'pet_trigger→partner_testimony': [
        "Pet trigger, partner backup. The cat did it, partner confirms your absence. Team effort.",
      ],
      'pet_trigger→schedule_log': [
        "Cat and schedule. Both? Your vacuum responds to cats AND timers?",
      ],
      'pet_trigger→app_command': [
        "Cat triggered, phone commanded. The cat AND your phone? Coordinated assault on your sleep.",
      ],
    },

    // Turn 3: Story completion patterns (closing-energy only)
    // Per v1 Lite spec: T3 barks must NOT evaluate or reference axes.
    storyCompletions: {
      // All same type (3 of 3) - closing-energy only
      all_digital: [
        "All digital sources. Your alibi lives in firmware logs. Processing.",
      ],
      all_sensor: [
        "Three sensors. The house has feelings about this. Running verification.",
      ],
      all_testimony: [
        "Three human sources. Coordinated story. Let me check.",
      ],
      all_physical: [
        "Physical sources only. Tangible receipts. One moment.",
      ],
      // Two of one type (2 of 3) - closing-energy only
      digital_heavy: [
        "Mostly digital. Logs and apps. Processing.",
      ],
      sensor_heavy: [
        "Sensor-heavy approach. The devices have opinions. Checking.",
      ],
      testimony_heavy: [
        "Lot of humans vouching. Stand by.",
      ],
      physical_heavy: [
        "Physical-forward. Let me verify.",
      ],
      // All different types - closing-energy only
      mixed_strong: [
        "Different angles. That's your story. Analyzing.",
      ],
      mixed_varied: [
        "Varied sources. Processing your version of events.",
      ],
    },

    // Objection prompts
    objectionPrompt: {
      firmware_glitch: ["Firmware crash made your vacuum spontaneously clean. That's your explanation?"],
      bedroom_sensor: ["You didn't move until the noise. The sensor confirms you were horizontal. Final answer?"],
      partner_testimony: ["Partner saw you in bed. They're still mad, but they vouch. Confirmed?"],
      schedule_log: ["Schedule was set for 3 AM. You forgot. That's what happened?"],
      app_command: ["Your phone sent the command. At 3:16 AM. While you slept. Standing by this?"],
      pet_trigger: ["Cat triggered the auto-clean. The cat was responsible. Confirm?"],
    },

    // Objection responses - stood by truth
    objectionStoodTruth: {
      firmware_glitch: ["Firmware logs are consistent. Your vacuum has issues. Documented issues. Noted."],
      bedroom_sensor: ["Bedroom sensor confirms stillness. You were horizontal until chaos. Consistent."],
      partner_testimony: ["Partner account holds. They were awake, you were not. Annoying but consistent."],
    },

    // Objection responses - stood by lie
    objectionStoodLie: {
      schedule_log: ["Schedule at 3 AM, you claim. But schedule was disabled last week. No active schedule exists."],
      app_command: ["Phone sent command at 3:16. But phone was in airplane mode charging. No commands could be sent."],
      pet_trigger: ["Cat triggered it, you say. But pet tracking shows both cats in bedroom all night. No cat was there."],
    },

    // Objection responses - withdrew
    objectionWithdrew: {
      firmware_glitch: ["Withdrawing the firmware crash. What actually started that vacuum?"],
      bedroom_sensor: ["Sensor story withdrawn. Were you really that still?"],
      partner_testimony: ["Taking back the partner testimony. Were they even awake to see?"],
      schedule_log: ["Schedule story gone. Smart. That one had problems."],
      app_command: ["Phone command withdrawn. Good choice. Connectivity issues. Like your story."],
      pet_trigger: ["Cat excuse withdrawn. The cats thank you. Probably."],
    },

    // Lies revealed at end
    liesRevealed: {
      schedule_log: ["Schedule at 3 AM, you said. Schedule was disabled last week, I know. Your vacuum has better memory than you claim."],
      app_command: ["Phone sent the command, you claimed. Phone was in airplane mode all night. Can't send commands with no signal. Basic connectivity."],
      pet_trigger: ["Cat triggered it, you insisted. Both cats were in the bedroom with you. Pet tracking doesn't lie. Cats weren't even in the room."],
      multiple: ["Two stories that don't survive verification. Your explanation has structural problems."],
      all: ["Three contradictions. Every explanation was fabricated. The vacuum was real. Your story wasn't."],
    },
  },

  // NOTE: Epilogue is not part of V5Puzzle type, kept as comment for flavor:
  // "It was a firmware bug. Version 2.3.7 had a known issue where a memory leak
  // would cause the vacuum to reboot and run its factory default routine. Which
  // includes an immediate clean cycle. At whatever time it happens. Your vacuum
  // has been updated. KOA has filed this under 'Software Liability.'"
};

export default PUZZLE_VACUUM_INCIDENT;
