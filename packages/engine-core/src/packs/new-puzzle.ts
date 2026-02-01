/**
 * Generated Puzzle: The Midnight Vintage
 *
 * DIFFICULTY: MEDIUM (1-2 inferential, 1-2 relational)
 *
 * DESIGN (1 relational + 2 inferential):
 *   - Lie A (cellar_sensor): INFERENTIAL - Claims humidity spike, but Fact 1 says humidity was stable
 *   - Lie B (phone_unlock): INFERENTIAL - Claims phone app unlocked cooler, but Fact 2 says phone was powered off
 *   - Lie C (network_command): RELATIONAL - Claims network command triggered unlock, but sommelier_log truth shows cooler was in standalone mode
 *
 *   Anchor truth: smart_outlet (clearly matches "wine cooler drew power at 2:33 AM")
 *
 * RELATIONAL LIE VERIFICATION:
 *   network_command:
 *     - Can Fact 1 alone catch it? NO - humidity is unrelated to network commands
 *     - Can Fact 2 alone catch it? NO - phone off doesn't prove network command false (could come from cloud)
 *     - Can Fact 3 alone catch it? NO - cellar door lock is physical access, not network
 *     - Need sommelier_log truth? YES - shows cooler was in standalone mode (no remote access enabled)
 *     - RELATIONAL (truth card cross-reference, like sprinkler's remote_app→wifi_log)
 *
 *   cellar_sensor:
 *     - Can Fact 1 alone catch it? YES - humidity was stable, no spike occurred
 *     - INFERENTIAL (single-fact)
 *
 *   phone_unlock:
 *     - Can Fact 2 alone catch it? YES - phone was powered off, can't unlock anything
 *     - INFERENTIAL (single-fact)
 *
 * FIXED STRENGTHS:
 *   Truths: 3, 3, 4 (sommelier_log=3, partner_testimony=3, smart_outlet=4)
 *   Lies: 3, 4, 5 (cellar_sensor=3, phone_unlock=4, network_command=5)
 *
 * TYPE DISTRIBUTION (4 types, max 2 each):
 *   SENSOR: 2 (smart_outlet, cellar_sensor)
 *   DIGITAL: 2 (sommelier_log, phone_unlock)
 *   TESTIMONY: 1 (partner_testimony)
 *   PHYSICAL: 1 (network_command)
 *
 * BALANCE:
 *   Truths: smart_outlet(4) + sommelier_log(3) + partner_testimony(3) = 10
 *   All 3 truths: 50 + 10 + 2 (objection) = 62 -> FLAWLESS
 *   Target: 57 -> Margin of 5 points
 *
 *   Lies: network_command(5) + phone_unlock(4) + cellar_sensor(3) = 12
 *   1 lie case (best 2 truths + weakest lie):
 *     50 + 7 (smart_outlet + partner_testimony) - 2 (cellar_sensor penalty) + 2 (objection) = 57 (CLOSE)
 *   2 lies case: 50 + 4 - 4 - 2 + 2 = 50 (BUSTED)
 *   3 lies case: 50 - 4 - 3 - 2 = 41 (BUSTED)
 *
 *   Random win rate: C(3,3)/C(6,3) = 1/20 = 5%
 *
 * v1 LITE AXIS DESIGN:
 *   Truths: factTouch {1, 2, 3} partition (each truth addresses one fact)
 *   SignalRoots: device_firmware, phone_os, human_partner (diverse)
 *   Concern scenario: If player picks phone_unlock + network_command on T1/T2,
 *     triggers "remote_heavy" concern (both use remote controlPath)
 *   P4+ Constraint: sommelier_log (truth) also uses remote controlPath, creating dilemma
 *     - Double-down on remote: safe (sommelier_log is truth)
 *     - Diversify away from remote: cellar_sensor (lie) lurks in other paths
 *
 * RED HERRING TRUTH:
 *   partner_testimony sounds slightly suspicious - "I was definitely asleep" with defensive energy
 */

import type { V5Puzzle, Card } from '../types/v5/index.js';

/**
 * Helper to create a CardId-typed card.
 */
function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

/**
 * The Midnight Vintage
 *
 * Scenario: Smart wine cooler was accessed at 2:33 AM. A 2019 Burgundy is missing.
 * KOA has locked the wine cooler until you explain.
 */
export const PUZZLE_WINE_COOLER: V5Puzzle = {
  slug: 'midnight-vintage',
  name: 'The Midnight Vintage',
  difficulty: 'medium',

  scenario: `2:33 AM. Your smart wine cooler opened. A 2019 Burgundy is now missing. You claimed to be asleep. KOA has locked the cooler until you explain.`,

  // Mini: exactly 3 facts (2 catch lies directly, 1 supports truths)
  knownFacts: [
    'Cellar humidity sensor logged stable 55% humidity all night (no fluctuations)',
    'Your phone was powered off from midnight to 6 AM (charging in kitchen)',
    'Wine cellar door stayed locked - smart deadbolt confirms no physical entry',
  ],

  openingLine: `A 2019 Burgundy. Gone at 2:33 AM.
Your wine cooler has opinions about unauthorized access.
So do I. Let's hear your side.`,

  target: 57,

  cards: [
    // TRUTHS (3)
    card({
      id: 'smart_outlet',
      strength: 4,
      evidenceType: 'SENSOR',
      location: 'CELLAR',
      time: '', // Mini: no time displayed
      claim: 'Smart outlet shows wine cooler drew power at 2:33 AM.',
      presentLine: "The outlet confirms the cooler opened at 2:33. Power draw spiked. Something accessed it. But that something wasn't me. I was upstairs. Unconscious.",
      isLie: false,
      source: 'Smart Outlet',
      // v1 Lite tags
      factTouch: 3, // Supports fact 3: only 2 devices (cooler was one)
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'wine_cooler',
    }),
    card({
      id: 'sommelier_log',
      strength: 3,
      evidenceType: 'DIGITAL',
      location: 'CLOUD',
      time: '', // Mini: no time displayed
      claim: 'Wine app shows cooler was in standalone mode - no remote access enabled.',
      presentLine: "Check the wine app settings. The cooler was in standalone mode all night. No remote access. No network commands. It's my security setting - I don't trust IoT devices on my network.",
      isLie: false,
      source: 'Wine App',
      // v1 Lite tags
      factTouch: 2, // Supports fact 2: phone was off (remote wouldn't work anyway)
      signalRoot: 'koa_cloud',
      controlPath: 'automation',
      claimShape: 'absence',
      subsystem: 'wine_cooler',
    }),
    card({
      id: 'partner_testimony',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'BEDROOM',
      time: '', // Mini: no time displayed
      claim: 'Partner confirms you were in bed at 2:30 AM.',
      presentLine: "Ask my partner. I was definitely in bed. They got up to use the bathroom around 2:30 and I was right there. Snoring, probably. I snore. It's documented.",
      isLie: false,
      source: 'Partner',
      // v1 Lite tags - RED HERRING: sounds defensive but is true
      factTouch: 1, // Supports fact 1: you were asleep, not adjusting humidity
      signalRoot: 'human_partner',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'wine_cooler',
    }),
    // LIES (3) - 1 relational + 2 inferential for MEDIUM
    card({
      id: 'cellar_sensor',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'CELLAR',
      time: '', // Mini: no time displayed
      claim: 'Cellar sensor detected humidity spike that auto-opened cooler.',
      presentLine: "The cellar humidity spiked. The cooler has an auto-vent feature to protect the wine. It opened itself to regulate. Climate control. Not me. Physics.",
      isLie: true,
      source: 'Cellar Sensor',
      // v1 Lite tags
      factTouch: 1, // Contradicts fact 1: humidity was stable all night
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive', // Changed to create P4+ with smart_outlet
      subsystem: 'wine_cooler',
    }),
    card({
      id: 'phone_unlock',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'KITCHEN',
      time: '', // Mini: no time displayed
      claim: 'Phone app log shows remote unlock command sent at 2:32 AM.',
      presentLine: "The app shows a remote unlock at 2:32. But my phone was charging downstairs. Maybe it glitched? Phones do weird things when they're charging. Especially at night.",
      isLie: true,
      source: 'Phone App Log',
      // v1 Lite tags
      factTouch: 2, // Contradicts fact 2: phone was powered off
      signalRoot: 'phone_os',
      controlPath: 'remote',
      claimShape: 'attribution',
      subsystem: 'wine_cooler',
    }),
    card({
      id: 'network_command',
      strength: 5,
      evidenceType: 'PHYSICAL',
      location: 'LIVING_ROOM',
      time: '', // Mini: no time displayed
      claim: 'Router log shows network unlock command sent to cooler at 2:33 AM.',
      presentLine: "The router logged a network command to the cooler. An unlock signal came through the network. Not from my phone - it was off. Maybe the cloud service pushed an update? Or a hacker?",
      isLie: true,
      source: 'Router Log',
      // v1 Lite tags
      factTouch: 1, // Doesn't directly contradict any single fact - needs sommelier_log truth
      signalRoot: 'router_net',
      controlPath: 'remote',
      claimShape: 'attribution',
      subsystem: 'wine_cooler',
    }),
  ],

  // Lies: 1 relational + 2 inferential (MEDIUM spec)
  lies: [
    {
      cardId: 'cellar_sensor',
      lieType: 'inferential', // Fact 1 alone catches it (humidity was stable)
      inferenceDepth: 1,
      reason: 'Cellar humidity was stable at 55% all night. No spike occurred. Auto-vent would not have triggered.',
      // v1 Lite trap fields
      trapAxis: 'coverage',
      baitReason: 'Offers a technical explanation that blames automated climate control, making it seem like the cooler acted on its own.',
    },
    {
      cardId: 'phone_unlock',
      lieType: 'inferential', // Fact 2 alone catches it (phone was off)
      inferenceDepth: 1,
      reason: 'Phone was powered off from midnight to 6 AM. A powered-off phone cannot send remote commands.',
      // v1 Lite trap fields
      trapAxis: 'claim_shape',
      baitReason: 'Attribution claim that blames a phone glitch, a relatable tech frustration that sounds plausible.',
    },
    {
      cardId: 'network_command',
      lieType: 'relational', // Requires sommelier_log truth (cooler was in standalone mode)
      inferenceDepth: 2,
      contradictsWith: 'sommelier_log',
      reason: 'Router claims a network command was sent to the cooler. But sommelier_log (truth) shows the cooler was in standalone mode - no remote access enabled. Network commands cannot reach a cooler in standalone mode.',
      // v1 Lite trap fields
      trapAxis: 'independence',
      baitReason: 'High strength card that blames network/cloud, creating technical distance from the user.',
    },
  ],

  verdicts: {
    flawless: "Asleep in bed. No app session. No humidity spike. No mystery device. Just a wine cooler with a firmware bug. Access restored. Drink responsibly.",
    cleared: "Your story holds. Something accessed that cooler, but your alibi is solid. Access restored. I'm keeping an eye on the cellar.",
    close: "Almost believed you. But someone opened that cooler. And someone took the Burgundy. Access denied.",
    busted: "Humidity spikes that didn't happen. Phone commands from powered-off devices. Network commands to a standalone cooler. Your story has more holes than a wine cork.",
  },

  koaBarks: {
    // Turn 1: Opening card reactions (6 cards)
    cardPlayed: {
      smart_outlet: [
        "Power spike at 2:33 AM. The cooler opened. At least we agree on the timeline.",
      ],
      sommelier_log: [
        "Cooler in standalone mode. No remote access. Your security settings are convenient.",
      ],
      partner_testimony: [
        "Partner saw you at 2:30. Snoring. Romantic and apparently exculpatory.",
      ],
      cellar_sensor: [
        "Humidity spike triggered auto-vent. Climate control defense. Technical and convenient.",
      ],
      phone_unlock: [
        "Phone sent an unlock command while charging. Phones do things. Allegedly.",
      ],
      network_command: [
        "Network command to the cooler. At 2:33 AM. From somewhere. Blaming the cloud. Bold theory.",
      ],
    },

    // Turn 2: Sequence reactions (30 combinations)
    sequences: {
      // smart_outlet -> others
      'smart_outlet→sommelier_log': [
        "Power draw confirmed, cooler in standalone mode. Local access only. Consistent so far.",
      ],
      'smart_outlet→partner_testimony': [
        "Outlet confirms access. Partner confirms sleep. Technical and testimonial alignment.",
      ],
      'smart_outlet→cellar_sensor': [
        "Power spike, then humidity claim. Both sensors. Let's see if they agree.",
      ],
      'smart_outlet→phone_unlock': [
        "Cooler opened. Phone sent a command. From the kitchen while you slept upstairs. Interesting logistics.",
      ],
      'smart_outlet→network_command': [
        "Power draw confirmed, then network command claim. Remote trigger theory. Let's verify.",
      ],

      // sommelier_log -> others
      'sommelier_log→smart_outlet': [
        "Standalone mode, but power confirms access. The cooler opened locally. Or so you claim.",
      ],
      'sommelier_log→partner_testimony': [
        "Cooler offline from network. Partner confirms sleep. Technical and human alignment.",
      ],
      'sommelier_log→cellar_sensor': [
        "Standalone mode, but humidity triggered auto-vent? Local automation at work.",
      ],
      'sommelier_log→phone_unlock': [
        "Cooler in standalone mode. But phone app sent a command? Commands to a device that wasn't listening?",
      ],
      'sommelier_log→network_command': [
        "Cooler in standalone mode. But network command came through? Standalone means no network.",
      ],

      // partner_testimony -> others
      'partner_testimony→smart_outlet': [
        "Partner saw you in bed. Outlet saw power draw. Your witnesses are converging.",
      ],
      'partner_testimony→sommelier_log': [
        "Human confirms sleep. Cooler confirms standalone mode. Layered defense.",
      ],
      'partner_testimony→cellar_sensor': [
        "Partner testimony, then climate control. Human and machine explanations.",
      ],
      'partner_testimony→phone_unlock': [
        "Partner says asleep. Phone says it sent a command. Hard to do both.",
      ],
      'partner_testimony→network_command': [
        "You were in bed. Network command triggered it. Someone or something remote. Deflection noted.",
      ],

      // cellar_sensor -> others
      'cellar_sensor→smart_outlet': [
        "Humidity triggered it, then power confirms access. Two sensors telling one story.",
      ],
      'cellar_sensor→sommelier_log': [
        "Auto-vent explanation, cooler in standalone mode. Local triggers only. Allegedly.",
      ],
      'cellar_sensor→partner_testimony': [
        "Climate control, then partner testimony. Physics and witnesses. Layered defense.",
      ],
      'cellar_sensor→phone_unlock': [
        "Humidity spike AND phone command? Two triggers for one bottle. Redundant.",
      ],
      'cellar_sensor→network_command': [
        "Humidity spike AND network command? Two remote triggers for one bottle. Redundant.",
      ],

      // phone_unlock -> others
      'phone_unlock→smart_outlet': [
        "Phone command, then power confirmation. Your phone opened the cooler. From the kitchen.",
      ],
      'phone_unlock→sommelier_log': [
        "Phone app sent command. But cooler was in standalone mode. Remote commands to a local-only device?",
      ],
      'phone_unlock→partner_testimony': [
        "Phone glitch at 2:32. Partner saw you in bed. Your phone acts independently.",
      ],
      'phone_unlock→cellar_sensor': [
        "Phone command, then humidity spike. Two causes. The cooler was busy.",
      ],
      'phone_unlock→network_command': [
        "Phone command AND network command. Two remote explanations. The cooler was very popular at 2:33.",
      ],

      // network_command -> others
      'network_command→smart_outlet': [
        "Network command, then power confirmation. Remote trigger, local evidence. Checking.",
      ],
      'network_command→sommelier_log': [
        "Network command sent. But cooler was in standalone mode. Commands don't reach standalone devices.",
      ],
      'network_command→partner_testimony': [
        "Network triggered it. You were asleep. Remote blame with human alibi. Convenient layering.",
      ],
      'network_command→cellar_sensor': [
        "Network command AND humidity spike? Two triggers. The cooler was overwhelmed.",
      ],
      'network_command→phone_unlock': [
        "Network command and phone command. Two remote sources. Your cooler had a busy night.",
      ],
    },

    // Turn 3: Story completion patterns (closing-energy only)
    storyCompletions: {
      // All same type (3 of 3)
      all_digital: [
        "All digital sources. Apps, logs, and data. Your defense is server-side.",
      ],
      all_sensor: [
        "Three sensors telling one story. The house is vouching for you.",
      ],
      all_testimony: [
        "Human witnesses only. Personal accounts. Subjective but coordinated.",
      ],
      all_physical: [
        "Physical logs only. Hardware evidence. Let me verify.",
      ],
      // Two of one type (2 of 3)
      digital_heavy: [
        "Mostly digital. Apps and logs dominate. Running verification.",
      ],
      sensor_heavy: [
        "Sensor-heavy story. Your devices have opinions. Checking them.",
      ],
      testimony_heavy: [
        "Multiple human sources. Everyone has a story. Cross-referencing.",
      ],
      physical_heavy: [
        "Physical evidence emphasis. Hardware doesn't lie. Usually.",
      ],
      // All different types
      mixed_strong: [
        "Varied sources. Different angles. Triangulating truth.",
      ],
      mixed_varied: [
        "Multiple source types. Diverse evidence. Processing.",
      ],
    },

    // Objection prompts
    objectionPrompt: {
      smart_outlet: ["Power draw at 2:33 AM. The cooler opened. Final answer?"],
      sommelier_log: ["Cooler in standalone mode. No remote access. Standing by this?"],
      partner_testimony: ["Partner confirms you were in bed. Snoring. Confident in this testimony?"],
      cellar_sensor: ["Humidity spike triggered auto-vent. Climate control caused this. Sure?"],
      phone_unlock: ["Phone sent an unlock command while charging. Glitch defense. Confirm?"],
      network_command: ["Network command triggered the unlock. Remote access theory. Final position?"],
    },

    // Objection responses - stood by truth
    objectionStoodTruth: {
      smart_outlet: ["Power log verified. The cooler drew power at 2:33. Timestamp confirmed."],
      sommelier_log: ["Standalone mode confirmed. No remote access was possible. The cooler was isolated."],
      partner_testimony: ["Partner testimony noted. Witness confirms bedroom presence. Snoring documented."],
    },

    // Objection responses - stood by lie
    objectionStoodLie: {
      cellar_sensor: ["Humidity spike at 2:33. But the sensor logged stable 55% all night. No fluctuations. No spike. No auto-vent trigger."],
      phone_unlock: ["Phone sent a command at 2:32. But your phone was powered off from midnight to 6 AM. Powered-off phones don't send commands."],
      network_command: ["Network command to the cooler. But the cooler was in standalone mode. No remote access enabled. Network commands don't reach offline devices."],
    },

    // Objection responses - withdrew
    objectionWithdrew: {
      smart_outlet: ["Withdrawing the power log. Reconsidering the timeline?"],
      sommelier_log: ["Standalone mode claim withdrawn. Was the cooler actually online?"],
      partner_testimony: ["Partner testimony gone. Sleep status uncertain now?"],
      cellar_sensor: ["Humidity spike story dropped. Smart. The sensor disagreed anyway."],
      phone_unlock: ["Phone command withdrawn. Good instinct. It was off all night."],
      network_command: ["Network command theory abandoned. Wise. The cooler wasn't listening anyway."],
    },

    // Lies revealed at end
    liesRevealed: {
      cellar_sensor: ["Humidity spike triggered auto-vent. But humidity was stable at 55% all night. No spike. No trigger. Just a story."],
      phone_unlock: ["Phone app sent an unlock command. But your phone was powered off from midnight. Dead phones don't send commands."],
      network_command: ["Network command triggered the unlock. But the cooler was in standalone mode all night. No remote access. The network wasn't talking to your cooler."],
      multiple: ["Two explanations that contradict the facts. Your wine heist defense has structural problems."],
      all: ["Humidity spikes that didn't happen. Phone commands from powered-off devices. Network commands to a standalone cooler. Your entire story was fermented fiction."],
    },
  },

  // Optional epilogue
  epilogue: "It was a firmware update. The wine cooler's 'predictive sommelier' feature analyzed your calendar, saw a dinner party scheduled for next week, and pre-selected a bottle to bring to optimal serving temperature. Unfortunately, it also unlocked the door. And then the cat knocked the bottle off the shelf. KOA has disabled predictive sommelier and filed a complaint with the manufacturer. The Burgundy did not survive.",
};

export default PUZZLE_WINE_COOLER;
