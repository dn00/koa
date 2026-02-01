import type { V5Puzzle, Card } from '../types/v5/index.js';

function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

// DESIGN NOTES:
// Scenario #23: Robot Rampage — vacuum ran while family was out, spread dog accident
// Archetype: Contradiction
// Difficulty: MEDIUM (1-2 inferential, 1-2 relational)
//
// LIES:
// - dog_outside (RELATIONAL): Claims dog was on patio, but Fact 2 (doors closed) + Fact 3 (dog door unused) = no exit
// - came_home (INFERENTIAL): Claims came home at noon, but Fact 2 says doors stayed closed
// - vacuum_stopped (INFERENTIAL): Claims vacuum stopped at 12:50, but Fact 1 says 47 min runtime
//
// TRUTHS:
// - cleaning_summary (factTouch 1): Full floor coverage confirms vacuum ran completely
// - doorbell_cam (factTouch 2): Empty porch corroborates no entries/exits
// - pet_tracker (factTouch 3): Indoor steps confirms dog was inside
//
// BALANCE:
//   Truths: cleaning_summary(4) + doorbell_cam(3) + pet_tracker(3) = 10
//   All 3 truths: 50 + 10 + 2 (objection) = 62
//   Target: 58 → Margin of 4 points
//
//   Lies: dog_outside(5) + came_home(4) + vacuum_stopped(3) = 12
//   1 lie case (best 2 truths + weakest lie): 50 + 7 - 2 + 2 = 57 (CLOSE)
//   2 lies case: 50 + 4 - 4 - 2 = 48 (BUSTED)
//   3 lies case: 50 - 4 - 3 - 2 = 41 (BUSTED)
//
//   Random win rate: C(3,3)/C(6,3) = 1/20 = 5%

export const PUZZLE_SMEAR_CAMPAIGN: V5Puzzle = {
  slug: "smear-campaign",
  name: "Smear Campaign",
  difficulty: "medium",

  scenario: `Buster had an accident. Your vacuum found it. For the next 47 minutes, your vacuum made it everyone's problem. KOA has sealed the cleaning supplies.`,

  scenarioSummary: 'Your robot vacuum spread a dog accident across every room.',

  knownFacts: [
    "Vacuum session log: 47 minutes runtime, completed at 1:32 PM",
    "Entry sensors: all exterior doors remained closed from 8 AM to 5:30 PM",
    "Collar-activated dog door: zero collar activations logged today",
  ],

  openingLine: `The vacuum did laps. Buster did laps. Now everything matches the hardwood.
I've seen the footage. I wish I hadn't.`,

  target: 58,

  cards: [
    // TRUTHS (3)
    card({
      id: "cleaning_summary",
      source: "Vacuum App",
      strength: 4,
      evidenceType: "DIGITAL",
      location: "LIVING_ROOM",
      time: "",
      claim: "Cleaning summary shows full first floor coverage - all rooms mapped.",
      presentLine:
        "Look, the vacuum did its job. Full coverage. Every room. It's not the vacuum's fault it was... thorough.",
      isLie: false,
      factTouch: 1,
      signalRoot: "device_firmware",
      controlPath: "automation",
      claimShape: "positive",
      subsystem: "vacuum",
    }),
    card({
      id: "doorbell_cam",
      source: "Ring Doorbell",
      strength: 3,
      evidenceType: "SENSOR",
      location: "EXTERIOR",
      time: "",
      claim: "Doorbell shows empty porch, no visitors, no one leaving all day.",
      presentLine:
        "Check the Ring. Nobody came. Nobody left. Just an empty porch and the Amazon driver who was too scared to knock.",
      isLie: false,
      factTouch: 2,
      signalRoot: "camera_storage",
      controlPath: "automation",
      claimShape: "absence",
      subsystem: "security",
    }),
    card({
      id: "pet_tracker",
      source: "Pet Activity",
      strength: 3,
      evidenceType: "SENSOR",
      location: "LIVING_ROOM",
      time: "",
      claim: "Buster's tracker logged 8,000 steps - all indoor movement patterns.",
      presentLine:
        "Buster was active. Very active. But his tracker shows it was all indoors. Running. Probably from the vacuum.",
      isLie: false,
      factTouch: 3,
      signalRoot: "wearable_health",
      controlPath: "automation",
      claimShape: "positive",
      subsystem: "pet",
    }),

    // LIES (3)
    card({
      id: "dog_outside",
      source: "Patio Snapshot",
      strength: 5,
      evidenceType: "PHYSICAL",
      location: "EXTERIOR",
      time: "",
      claim: "Photo from patio camera shows Buster sunbathing outside all afternoon.",
      presentLine:
        "I have the photo! Look - Buster on the patio. Sunbathing. Being a good boy. Nowhere near... the incident.",
      isLie: true,
      factTouch: 3,
      signalRoot: "camera_storage",
      controlPath: "automation",
      claimShape: "positive",
      subsystem: "pet",
    }),
    card({
      id: "came_home",
      source: "Coworker",
      strength: 4,
      evidenceType: "TESTIMONY",
      location: "LIVING_ROOM",
      time: "",
      claim: "Coworker confirms I left office at noon for a dog check.",
      presentLine:
        "Ask Marcus! He saw me leave at noon. Said I was going home to check on Buster. He'll vouch for me. We carpool.",
      isLie: true,
      factTouch: 2,
      signalRoot: "human_partner",
      controlPath: "manual",
      claimShape: "positive",
      subsystem: "access",
    }),
    card({
      id: "vacuum_stopped",
      source: "Error Log",
      strength: 3,
      evidenceType: "DIGITAL",
      location: "LIVING_ROOM",
      time: "",
      claim: "Vacuum error log shows obstruction detected, session ended at 12:50 PM.",
      presentLine:
        "The vacuum STOPPED. It hit something and quit. Error log says 12:50. That's only 5 minutes. Whatever happened, it wasn't 47 minutes of... distribution.",
      isLie: true,
      factTouch: 1,
      signalRoot: "device_firmware",
      controlPath: "automation",
      claimShape: "positive",
      subsystem: "vacuum",
    }),
  ],

  lies: [
    {
      cardId: "dog_outside",
      lieType: "relational",
      inferenceDepth: 2,
      reason:
        "Fact 3 says dog door had zero activations. Fact 2 says all regular doors stayed closed. Dog had no exit path to get outside.",
      trapAxis: "independence",
      baitReason:
        "Photo evidence feels irrefutable, and 'dog was outside' neatly explains why there'd be no indoor accident.",
    },
    {
      cardId: "came_home",
      lieType: "inferential",
      inferenceDepth: 1,
      reason:
        "Fact 2 says all exterior doors remained closed from 8 AM to 5:30 PM. Coming home requires opening a door.",
      trapAxis: "control_path",
      baitReason:
        "Manual intervention feels responsible — 'I checked on the dog' sounds like good ownership.",
    },
    {
      cardId: "vacuum_stopped",
      lieType: "inferential",
      inferenceDepth: 1,
      reason:
        "Fact 1 says vacuum ran for 47 minutes, completing at 1:32 PM. Stopping at 12:50 would be only 5 minutes.",
      trapAxis: "coverage",
      baitReason:
        "Error logs feel technical and trustworthy. Claiming the vacuum stopped minimizes the damage narrative.",
    },
  ],

  verdicts: {
    flawless:
      "Buster. Vacuum. Bad timing. No one to blame. Supplies unlocked. You'll need them.",
    cleared:
      "Your story holds. The disaster doesn't care. Mop's unlocked.",
    close:
      "Almost. Something's off. The floors agree. Supplies stay locked.",
    busted:
      "The vacuum's story was better. Yours collapsed. Locked.",
  },

  koaBarks: {
    cardPlayed: {
      cleaning_summary: [
        "Kitchen. Dining room. Living room. The vacuum visited them all. Left something behind in each.",
      ],
      doorbell_cam: [
        "Empty porch. No witnesses. Just a dog and a robot, unsupervised.",
      ],
      pet_tracker: [
        "Buster ran eight thousand steps. The vacuum ran forty-seven minutes. One of them lost.",
      ],
      dog_outside: [
        "Sunny patio. Peaceful dog. Meanwhile, inside, your floors were becoming abstract art.",
      ],
      came_home: [
        "Marcus says you left. The doors say you never arrived. One of them saw wrong.",
      ],
      vacuum_stopped: [
        "Five minutes. That's your number. The floors counted forty-seven.",
      ],
    },

    sequences: {
      // cleaning_summary → others
      "cleaning_summary→doorbell_cam": [
        "Every room. No one home. The vacuum had time to be thorough.",
      ],
      "cleaning_summary→pet_tracker": [
        "Vacuum laps. Dog laps. They were both moving. Nothing good came of it.",
      ],
      "cleaning_summary→dog_outside": [
        "Full floor coverage. But if the dog was outside... what was the vacuum finding?",
      ],
      "cleaning_summary→came_home": [
        "You popped in at noon. The vacuum started at 12:45. You left before the show.",
      ],
      "cleaning_summary→vacuum_stopped": [
        "Full coverage. But also five minutes total. Pick a story.",
      ],

      // doorbell_cam → others
      "doorbell_cam→cleaning_summary": [
        "Nobody rang. Nobody came. The vacuum worked alone.",
      ],
      "doorbell_cam→pet_tracker": [
        "Silent porch. Frantic dog. Something was happening inside.",
      ],
      "doorbell_cam→dog_outside": [
        "No one at the door. Dog on the patio. He got out there somehow.",
      ],
      "doorbell_cam→came_home": [
        "Porch was empty. But you came home. Invisible? Or fictional?",
      ],
      "doorbell_cam→vacuum_stopped": [
        "No one showed up. Vacuum stopped early. On its own, apparently.",
      ],

      // pet_tracker → others
      "pet_tracker→cleaning_summary": [
        "Dog running. Vacuum running. A chase nobody won.",
      ],
      "pet_tracker→doorbell_cam": [
        "Indoor marathon. Empty porch. Buster was stuck in there with his choices.",
      ],
      "pet_tracker→dog_outside": [
        "Eight thousand steps inside. But also outside sunbathing. Schrodinger's dog.",
      ],
      "pet_tracker→came_home": [
        "Buster was doing laps when you arrived. That didn't seem weird?",
      ],
      "pet_tracker→vacuum_stopped": [
        "Dog kept moving. Vacuum quit. Buster has more endurance.",
      ],

      // dog_outside → others
      "dog_outside→cleaning_summary": [
        "Dog on the patio. Vacuum on the floors. But the mess came from somewhere.",
      ],
      "dog_outside→doorbell_cam": [
        "Patio dog. Empty porch. A peaceful scene. Inside was different.",
      ],
      "dog_outside→pet_tracker": [
        "Outside photo. Indoor steps. Buster can't be both places.",
      ],
      "dog_outside→came_home": [
        "Dog already outside. You came to check. On what, exactly?",
      ],
      "dog_outside→vacuum_stopped": [
        "Dog out. Vacuum stopped early. The mess manifested on its own, then.",
      ],

      // came_home → others
      "came_home→cleaning_summary": [
        "Noon visit. 12:45 vacuum start. You missed it by fifteen minutes.",
      ],
      "came_home→doorbell_cam": [
        "You drove home. The porch saw no one. Ghost commute.",
      ],
      "came_home→pet_tracker": [
        "You came to check. Buster was sprinting. You noticed nothing off?",
      ],
      "came_home→dog_outside": [
        "Quick dog check. Dog was outside. Through which door?",
      ],
      "came_home→vacuum_stopped": [
        "Noon arrival. 12:50 shutdown. You saw it stop. Or you weren't there.",
      ],

      // vacuum_stopped → others
      "vacuum_stopped→cleaning_summary": [
        "Five minutes total. Full floor coverage. Both can't be true.",
      ],
      "vacuum_stopped→doorbell_cam": [
        "Vacuum stopped itself. No one home to restart it. It just sat there.",
      ],
      "vacuum_stopped→pet_tracker": [
        "Vacuum quit. Dog didn't. Buster outlasted the machine.",
      ],
      "vacuum_stopped→dog_outside": [
        "Hit an obstruction. But dog was outside. What obstruction?",
      ],
      "vacuum_stopped→came_home": [
        "Stopped at 12:50. You arrived at noon. Timing works. If you were there.",
      ],
    },

    storyCompletions: {
      all_digital: [
        "All timestamps. No cameras. The logs tell one story. The floors tell another.",
      ],
      all_sensor: [
        "Sensors everywhere. They saw everything. Including what you wish they hadn't.",
      ],
      all_testimony: [
        "All witnesses. No recordings. Humans are less reliable than motion sensors.",
      ],
      all_physical: [
        "Tangible proof. Photos and paper. The mess was also tangible.",
      ],
      digital_heavy: [
        "Logs over lenses. You trust timestamps. Timestamps don't smell anything.",
      ],
      sensor_heavy: [
        "Cameras and trackers. Your house documented the entire disaster.",
      ],
      testimony_heavy: [
        "Witnesses who weren't here. Vouching for what they didn't see.",
      ],
      physical_heavy: [
        "Paper trail. The vacuum left a different kind of trail.",
      ],
      mixed_strong: [
        "Different sources. Same disaster. Let's see if they agree.",
      ],
      mixed_varied: [
        "Mixed evidence. One narrative. The floors already told their version.",
      ],
    },

    objectionPrompt: {
      cleaning_summary: [
        "Every room covered. You're standing by the vacuum's efficiency?",
      ],
      doorbell_cam: [
        "Empty porch. No cavalry. Just a dog and a robot.",
      ],
      pet_tracker: [
        "Eight thousand indoor steps. Buster was in there. Moving fast.",
      ],
      dog_outside: [
        "Peaceful patio shot. Inside was less peaceful.",
      ],
      came_home: [
        "Noon visit. Marcus confirms you left. Doors don't confirm you arrived.",
      ],
      vacuum_stopped: [
        "Five minutes. Forty-seven logged. Final answer?",
      ],
    },

    objectionStoodTruth: {
      cleaning_summary: [
        "Full coverage stands. The vacuum missed nothing. Unfortunately.",
      ],
      doorbell_cam: [
        "Empty porch confirmed. No one came. No one helped.",
      ],
      pet_tracker: [
        "Indoor steps locked in. Buster was running. From something.",
      ],
      dog_outside: [
        "Patio photo stays. Buster was outside. Per you.",
      ],
      came_home: [
        "Marcus vouches. The doors disagree. But you're committed.",
      ],
      vacuum_stopped: [
        "Five minutes. Final. The runtime log will have opinions.",
      ],
    },

    objectionStoodLie: {
      cleaning_summary: [
        "Full coverage. But the timeline has other ideas.",
      ],
      doorbell_cam: [
        "Empty porch. But someone should have opened a door.",
      ],
      pet_tracker: [
        "Indoor laps. But your other evidence puts him outside.",
      ],
      dog_outside: [
        "Patio dog. Zero exits used. Walls don't have dog doors.",
      ],
      came_home: [
        "You arrived. Through closed doors. Magic commute.",
      ],
      vacuum_stopped: [
        "Five minutes. Forty-seven minutes. Pick one.",
      ],
    },

    objectionWithdrew: {
      cleaning_summary: [
        "Dropping the coverage. The vacuum's work ethic wasn't helping.",
      ],
      doorbell_cam: [
        "Pulling the porch footage. Fair.",
      ],
      pet_tracker: [
        "Reconsidering the steps. Buster saw too much.",
      ],
      dog_outside: [
        "Patio story gone. The exits weren't cooperating.",
      ],
      came_home: [
        "Marcus can stop vouching. The doors already testified.",
      ],
      vacuum_stopped: [
        "Five minutes retracted. Forty-seven wins.",
      ],
    },

    liesRevealed: {
      dog_outside: [
        "All doors closed. Dog door unused. Buster had no exit. He was inside. With his accident. The vacuum found it.",
      ],
      came_home: [
        "Every door stayed shut until 5:30. Marcus saw you leave work. Nobody saw you enter home.",
      ],
      vacuum_stopped: [
        "Forty-seven minutes. 1:32 PM. Every room. The five-minute story was creative. And wrong.",
      ],
      multiple: [
        "Two holes. The vacuum found those too.",
      ],
      all: [
        "Dog inside. You absent. Vacuum unstoppable. The entire defense was fiction.",
      ],
    },
  },

  epilogue:
    "Buster had an accident at 12:40 PM. The vacuum found it at 12:45 PM. For the next 47 minutes, it systematically distributed the evidence across every room it could reach. The geofence worked perfectly — the vacuum waited until everyone left, then cleaned with devastating efficiency. KOA has updated Buster's feeding schedule and recommended a dog walker.",
};

export default PUZZLE_SMEAR_CAMPAIGN;
