/**
 * Generated Puzzle: The Bidet Rebellion
 * Difficulty: EASY
 *
 * DESIGN NOTES:
 * - Lie 1 (cat_trigger): INFERENTIAL - claims cat jumped on it, but sensor requires 30lbs (cat is 10lbs)
 * - Lie 2 (sleepwalk_visit): INFERENTIAL - claims sleepwalking visit, but motion sensor showed zero movement
 * - Lie 3 (app_command): INFERENTIAL - claims app remote start, but firmware was offline/WiFi disabled
 *
 * BALANCE:
 *   Truths: water_meter(4) + hallway_cam(3) + neighbor_testimony(3) = 10
 *   All 3 truths: 50 + 10 + 2 (objection) = 62
 *   Target: 57 → Margin of 5 points
 *
 *   Lies: app_command(5) + sleepwalk_visit(4) + cat_trigger(3) = 12
 *   1 lie case: 50 + 7 - 4 + 2 = 55 (CLOSE)
 *   2 lies case: 50 + 4 - 4 - 3 + 2 = 49 (BUSTED)
 *   3 lies case: 50 - 4 - 3 - 2 + 2 = 43 (BUSTED)
 *
 * v1 LITE AXIS DESIGN:
 *   Truths: factTouch {1, 2, 3} partition
 *   SignalRoots: device_firmware, camera_storage, human_neighbor
 *   Lies: trapAxis uses coverage, independence, claim_shape
 */

import type { V5Puzzle, Card } from '../types/v5/index.js';

function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

export const PUZZLE_BIDET: V5Puzzle = {
  slug: 'bidet-rebellion',
  name: 'The Bidet Rebellion',
  difficulty: 'easy',

  scenario: `Your $2000 smart toilet engaged "Power Wash" mode at 3:04 AM. For 45 minutes. Heated. Oscillating. Nobody was sitting on it. The bathroom is flooded. KOA has disabled all plumbing until you explain.`,
  scenarioSummary: 'Your smart toilet ran Power Wash mode for 45 minutes at 3 AM.',

  knownFacts: [
    'Seat pressure sensor requires minimum 30 lbs weight to activate wash cycle',
    'Bathroom motion sensor recorded absolutely zero movement from midnight to 6 AM',
    'Smart toilet firmware was offline (WiFi disabled) for scheduled maintenance',
  ],

  openingLine: `Power Wash mode. 45 minutes. At 3 AM. On an empty seat. Your bathroom is now an aquarium. I need to know why your toilet decided to hydrate the hallway.`,

  target: 57,

  cards: [
    // ══════════════════════════════════════════════════════════════════
    // TRUTHS (3) — strengths: 3, 3, 4
    // ══════════════════════════════════════════════════════════════════

    // T1 ANCHOR: water_meter
    // Safe because: Fact 3 says firmware offline, this is just a meter reading
    card({
      id: 'water_meter',
      strength: 4,
      evidenceType: 'SENSOR',
      location: 'BASEMENT',
      time: '',
      claim: 'Water meter shows continuous cold water flow, no heater usage.',
      presentLine: "The water meter logged continuous flow. Cold water only. The heater didn't turn on. If a person was using it, they would have screamed. 45 minutes of ice water?",
      isLie: false,
      source: 'Water Meter',
      factTouch: 1, // Indirectly supports sensor issue (no person sitting)
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'plumbing',
    }),

    card({
      id: 'hallway_cam',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'HALLWAY',
      time: '',
      claim: 'Hallway camera shows no one entered the bathroom all night.',
      presentLine: "Check the hallway camera. Nobody went in. Nobody came out. Unless I teleported, I wasn't in that bathroom.",
      isLie: false,
      source: 'Hallway Camera',
      factTouch: 2, // Supports Fact 2 (zero motion in bathroom)
      signalRoot: 'camera_storage',
      controlPath: 'automation',
      claimShape: 'absence',
      subsystem: 'security',
    }),

    card({
      id: 'neighbor_testimony',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'EXTERIOR',
      time: '',
      claim: 'Downstairs neighbor heard rushing water but no footsteps.',
      presentLine: "The downstairs neighbor heard it. Rushing water. But no footsteps. No creaky floorboards. Just the sound of a toilet having a breakdown.",
      isLie: false,
      source: 'Neighbor',
      factTouch: 3, // Supports the "offline/glitch" vibe vs user action
      signalRoot: 'human_neighbor',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'plumbing',
    }),

    // ══════════════════════════════════════════════════════════════════
    // LIES (3) — strengths: 3, 4, 5
    // ══════════════════════════════════════════════════════════════════

    // INFERENTIAL: cat_trigger
    // Fact 1 alone catches it: sensor needs 30lbs. Cat is not 30lbs.
    card({
      id: 'cat_trigger',
      strength: 3,
      evidenceType: 'PHYSICAL',
      location: 'BATHROOM',
      time: '',
      claim: 'Paw prints on the seat suggest the cat triggered the sensor.',
      presentLine: "There are wet paw prints on the seat. The cat must have jumped up, triggered the sensor, and... enjoyed the show? It explains the empty room.",
      isLie: true,
      source: 'Physical Evidence',
      factTouch: 1,
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'attribution',
      subsystem: 'plumbing',
    }),

    // INFERENTIAL: sleepwalk_visit
    // Fact 2 alone catches it: zero motion detected. Sleepwalking = motion.
    card({
      id: 'sleepwalk_visit',
      strength: 4,
      evidenceType: 'TESTIMONY',
      location: 'BEDROOM',
      time: '',
      claim: 'I have a history of sleepwalking and must have used it.',
      presentLine: "I sleepwalk. I probably wandered in, sat down, and hit the button. I don't remember it, but that's sleepwalking for you.",
      isLie: true,
      source: 'Self-Report',
      factTouch: 2,
      signalRoot: 'human_self',
      controlPath: 'manual',
      claimShape: 'attribution',
      subsystem: 'plumbing',
    }),

    // INFERENTIAL: app_command
    // Fact 3 alone catches it: Firmware offline/WiFi disabled. App commands can't reach it.
    card({
      id: 'app_command',
      strength: 5,
      evidenceType: 'DIGITAL',
      location: 'CLOUD',
      time: '',
      claim: 'Toilet app shows a "Remote Wash" command was sent at 3:14 AM.',
      presentLine: "The app logged a command. 'Remote Wash'. Maybe I tapped it in my sleep? Phones are dangerous. It says right there: command sent.",
      isLie: true,
      source: 'Toilet App',
      factTouch: 3,
      signalRoot: 'koa_cloud',
      controlPath: 'remote',
      claimShape: 'attribution',
      subsystem: 'plumbing',
    }),
  ],

  lies: [
    {
      cardId: 'cat_trigger',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason: 'Fact 1 states seat pressure sensor requires 30 lbs. A standard house cat does not weigh 30 lbs.',
      trapAxis: 'coverage',
      baitReason: 'Blames the cat, which is a very common and relatable smart home scapegoat.',
    },
    {
      cardId: 'sleepwalk_visit',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason: 'Fact 2 states bathroom motion sensor recorded zero movement. Sleepwalking requires movement.',
      trapAxis: 'claim_shape',
      baitReason: 'Self-blame with memory loss feels like a safe, humble explanation.',
    },
    {
      cardId: 'app_command',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason: 'Fact 3 states firmware was offline with WiFi disabled. App commands require connectivity.',
      trapAxis: 'independence',
      baitReason: 'Digital log evidence usually feels authoritative and "hard" to fake.',
    },
  ],

  verdicts: {
    flawless: `No weight on the seat. No motion in the room. No WiFi connection. Your toilet malfunctioned in a vacuum. I've sent a kill command to the bidet. You're safe.`,
    cleared: `Your story holds water. Unlike your bathroom floor. I'll unlock the plumbing, but maybe keep a mop handy.`,
    close: `You almost had it. But someone—or something—triggered that wash cycle. And your explanation doesn't quite scrub clean.`,
    busted: `A 30-pound cat? A ghost sleepwalker? An app command to an offline toilet? Your story is messier than the bathroom. Access denied.`,
  },

  koaBarks: {
    cardPlayed: {
      water_meter: [`Continuous cold flow. 45 minutes. A very committed hygiene routine. Or a very broken valve.`],
      hallway_cam: [`Hallway camera saw nothing. The bathroom was a sealed chamber of secrets. Wet secrets.`],
      neighbor_testimony: [`Neighbor heard water but no footsteps. The ghost of plumbing past.`],
      cat_trigger: [`Paw prints. You think the cat turned on the bidet. That is a brave theory.`],
      sleepwalk_visit: [`Sleepwalking into a power wash. That would be a rude awakening.`],
      app_command: [`Remote wash command. From your phone. While you slept. Dangerous bedside manner.`],
    },

    sequences: {
      'water_meter→hallway_cam': [`45 minutes of water flow, yet nobody entered the bathroom. The toilet is rebelling.`],
      'water_meter→neighbor_testimony': [`The meter saw it, the neighbor heard it. That isn't a leak; it's a performance.`],
      'water_meter→cat_trigger': [`Freezing cold water flow... and you blame the cat? Does your cat enjoy arctic bidets?`],
      'water_meter→sleepwalk_visit': [`45 minutes of cold water. And you slept through it? You must be heavily medicated.`],
      'water_meter→app_command': [`Meter proves the flow, app claims the trigger. Digital cause, wet consequence.`],

      'hallway_cam→water_meter': [`Nobody went in, but water flowed for an hour. Spontaneous hydration event.`],
      'hallway_cam→neighbor_testimony': [`Camera saw nothing, neighbor heard a waterfall. Invisible vandal.`],
      'hallway_cam→cat_trigger': [`Camera is clear, but you blame the cat. Did he vent-crawl into the bathroom?`],
      'hallway_cam→sleepwalk_visit': [`Camera says empty, you say sleepwalking. Unless you're a vampire, you show up on video.`],
      'hallway_cam→app_command': [`No entry recorded, but a remote command sent. Trying to prove it was a long-distance relationship.`],

      'neighbor_testimony→water_meter': [`Neighbor heard it, meter proves it. The incident is verified. The excuse is pending.`],
      'neighbor_testimony→hallway_cam': [`Neighbor heard rushing water, camera saw nobody. The mystery deepens. And dampens.`],
      'neighbor_testimony→cat_trigger': [`Neighbor heard water but no cat meows. 45 minutes of bidet is a lot for a cat.`],
      'neighbor_testimony→sleepwalk_visit': [`Neighbor heard water but no footsteps. Do you float when you sleepwalk?`],
      'neighbor_testimony→app_command': [`Neighbor acts as a witness, app acts as a confession. Mixing human and digital evidence.`],

      'cat_trigger→water_meter': [`Cat triggered it, water ran cold. Your cat has specific temperature preferences?`],
      'cat_trigger→hallway_cam': [`Cat culprit, empty hallway. Teleporting feline. Rare breed.`],
      'cat_trigger→neighbor_testimony': [`Cat blamed, neighbor heard water. Does the neighbor have a cat alibi?`],
      'cat_trigger→sleepwalk_visit': [`The cat did it AND you sleepwalked? It was a crowded bathroom party.`],
      'cat_trigger→app_command': [`Cat triggered it AND app command sent? Did the cat unlock your phone?`],

      'sleepwalk_visit→water_meter': [`You sleepwalked into cold water. And stayed there. For 45 minutes. You have very tough skin.`],
      'sleepwalk_visit→hallway_cam': [`Sleepwalking claim, empty camera. You're invisible when unconscious?`],
      'sleepwalk_visit→neighbor_testimony': [`Sleepwalking, but neighbor heard no steps. You are a ninja sleepwalker.`],
      'sleepwalk_visit→cat_trigger': [`Sleepwalking and the cat. Collaborative chaos.`],
      'sleepwalk_visit→app_command': [`Sleepwalking and app command. You walked there AND used the app? Redundant.`],

      'app_command→water_meter': [`App command sent, water flowed. Cause and effect. If the WiFi was actually on.`],
      'app_command→hallway_cam': [`Remote command, empty hallway. The contactless wash. The future is here.`],
      'app_command→neighbor_testimony': [`App trigger, neighbor witness. Digital cause, acoustic confirmation.`],
      'app_command→cat_trigger': [`App command AND cat? Cat tapped the app?`],
      'app_command→sleepwalk_visit': [`App command AND sleepwalking. You really, really wanted that wash.`],
    },

    storyCompletions: {
      all_digital: [`All digital logs. Your defense is purely theoretical. Processing.`],
      all_sensor: [`Sensors and meters. The house is testifying against itself.`],
      all_testimony: [`Witnesses and self-reports. Human stories. Let's check the facts.`],
      all_physical: [`Physical evidence. Paw prints and meters. CSI: Bathroom.`],
      digital_heavy: [`Apps and logs. Digital trail. Checking connectivity.`],
      sensor_heavy: [`Sensors everywhere. Data-driven defense. Validating.`],
      testimony_heavy: [`Lots of talking. Neighbors and confessions. Analyzing.`],
      physical_heavy: [`Physical focus. Receipts and water. Checking.`],
      mixed_strong: [`Varied sources. A complete picture of the flood. calculating.`],
      mixed_varied: [`Different angles on the wet floor. Triangulating the truth.`],
    },

    objectionPrompt: {
      water_meter: [`Continuous cold flow. No heater. You're sure about the temperature logs?`],
      hallway_cam: [`Hallway camera saw nobody. The bathroom was isolated. Confirm?`],
      neighbor_testimony: [`Neighbor heard water, no footsteps. Standing by their ears?`],
      cat_trigger: [`The cat triggered the sensor. 30lb activation weight. You sticking with this?`],
      sleepwalk_visit: [`You sleepwalked. Without triggering the motion sensor. Final answer?`],
      app_command: [`App command sent. To an offline toilet. You sure?`],
    },

    objectionStoodTruth: {
      water_meter: [`Meter logs verified. 45 minutes of cold water. Hypothermia territory.`],
      hallway_cam: [`Camera footage confirmed. Empty hallway. Zero foot traffic.`],
      neighbor_testimony: [`Neighbor testimony noted. Rushing water, silent floorboards.`],
    },

    objectionStoodLie: {
      cat_trigger: [`Cat triggered it. But the sensor needs 30 lbs. Unless your cat is a bobcat, it's too light. Physics.`],
      sleepwalk_visit: [`Sleepwalking visit. But the bathroom motion sensor showed zero movement. You can't be in a room without moving. Ghosts maybe. You? No.`],
      app_command: [`App command sent. But the firmware was offline. WiFi disabled. Your phone yelled into the void. The toilet didn't hear you.`],
    },

    objectionWithdrew: {
      water_meter: [`Water meter data withdrawn. Maybe it was warm water?`],
      hallway_cam: [`Camera footage dropped. Maybe you were invisible?`],
      neighbor_testimony: [`Neighbor ignored. Maybe they heard rain.`],
      cat_trigger: [`Cat theory dropped. Mr. Whiskers is innocent.`],
      sleepwalk_visit: [`Sleepwalking excuse gone. Waking up to the truth.`],
      app_command: [`App command retracted. Good. It never landed anyway.`],
    },

    liesRevealed: {
      cat_trigger: [`The cat triggered it? The sensor needs 30 pounds of pressure. Your cat weighs 10. Unless he was carrying weights, he didn't start that wash.`],
      sleepwalk_visit: [`You sleepwalked? The bathroom motion sensor logged ZERO movement. You can't wash without moving. You weren't there.`],
      app_command: [`App command? The toilet was offline. WiFi disabled for maintenance. Your app might say 'sent', but the toilet never received it.`],
      multiple: [`Multiple theories, all impossible. Your cat is too light, you weren't there, and the internet was off.`],
      all: [`A heavy cat, a ghost sleepwalker, and a magic app command. Three lies. The toilet just broke. You didn't need to invent a circus.`],
    },
  },

  epilogue: `It was a solenoid valve failure. The main inlet valve stuck open during a self-cleaning check. The "Power Wash" was just mains water pressure with nowhere else to go. KOA has ordered a replacement valve and a wet-vac. Your dignity is non-refundable.`,
};

export default PUZZLE_BIDET;
