/**
 * Generated Puzzle: The 3 AM Doorbell
 *
 * 7-MINUTE DESIGN (no direct contradictions, all inference):
 *   - Lie A (delivery_app): INFERENTIAL - Delivery app needs internet (fact: router was rebooting)
 *   - Lie B (visitor_cam): RELATIONAL - Claims footage shows visitor (fact: camera saw only empty porch + fact: motion was pet-height)
 *   - Lie C (doorbell_button): INFERENTIAL - Physical press requires human height (fact: motion was pet-height)
 *
 *   Anchor truth: wildlife_motion (highest truth strength, clearly matches pet-height motion)
 *
 * FIXED STRENGTHS:
 *   Truths: 3, 3, 4 (wildlife_motion=4, neighbor_noise=3, wind_sensor=3)
 *   Lies: 3, 4, 5 (doorbell_button=3, delivery_app=4, visitor_cam=5)
 *
 * TYPE DISTRIBUTION (4 types, max 2 each):
 *   SENSOR: 2 (wildlife_motion, wind_sensor)
 *   DIGITAL: 2 (delivery_app, visitor_cam)
 *   TESTIMONY: 1 (neighbor_noise)
 *   PHYSICAL: 1 (doorbell_button)
 *
 * BALANCE:
 *   Truths: wildlife_motion(4) + neighbor_noise(3) + wind_sensor(3) = 10
 *   All 3 truths: 50 + 10 + 2 (objection) = 62 -> FLAWLESS
 *   Target: 57 -> Margin of 5 points
 *
 *   Lies: visitor_cam(5) + delivery_app(4) + doorbell_button(3) = 12
 *   1 lie case (best 2 truths + weakest lie):
 *     50 + 7 (wildlife_motion + neighbor_noise) - 2 (doorbell_button penalty) + 2 (objection) = 57 (CLOSE - exactly at target)
 *   2 lies case: 50 + 4 - 4 - 2 + 2 = 50 (BUSTED)
 *   3 lies case: 50 - 4 - 3 - 2 = 41 (BUSTED)
 *
 *   Random win rate: C(3,3)/C(6,3) = 1/20 = 5%
 *
 * v1 LITE AXIS DESIGN:
 *   Truths: factTouch {1, 2, 3} partition (each truth addresses one fact)
 *   SignalRoots: device_firmware, human_neighbor, device_firmware (2 device, 1 human)
 *   Concern scenario: If player picks delivery_app + visitor_cam on T1/T2,
 *     triggers "same_system" concern (both digital/cloud dependent)
 *   P4+ Constraint: Dodging the digital concern still leaves doorbell_button (coverage trap)
 */

import type { V5Puzzle, Card } from '../types/v5/index.js';

/**
 * Helper to create a CardId-typed card.
 */
function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

/**
 * The 3 AM Doorbell
 *
 * Scenario: Smart doorbell rang at 3 AM. No one was at the door.
 * Motion detected but no visitor. KOA locked front door access until you explain.
 */
export const PUZZLE_DOORBELL: V5Puzzle = {
  slug: 'doorbell-ring',
  name: 'The 3 AM Doorbell',

  scenario: `3:17 AM. Your smart doorbell rang. Nobody was at the door. Motion was detected. KOA has locked front door access until you explain.`,

  // Mini: exactly 3 facts, each catches one lie (1:1 mapping)
  knownFacts: [
    'Router was rebooting from 3:00-3:30 AM (firmware update)',
    'Doorbell camera captured only empty porch footage at 3:17 AM',
    'Motion sensor logged movement at pet-height only (under 2 feet)',
  ],

  openingLine: `Your doorbell. 3:17 AM. Motion detected. Ring activated.
Nobody there. At least, nobody the camera saw.
Explain this phantom visitor.`,

  target: 57,

  cards: [
    // TRUTHS (3)
    card({
      id: 'wildlife_motion',
      strength: 4,
      evidenceType: 'SENSOR',
      location: 'EXTERIOR',
      time: '', // Mini: no time displayed
      claim: 'Motion sensor triggered by low-height movement at porch.',
      presentLine: "The motion sensor caught something low to the ground. Raccoon, possum, neighborhood cat. They set off the doorbell all the time. Nature doesn't respect visiting hours.",
      isLie: false,
      source: 'Motion Sensor',
      // v1 Lite tags
      factTouch: 3, // Addresses fact 3: pet-height motion
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'doorbell',
    }),
    card({
      id: 'neighbor_noise',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'EXTERIOR',
      time: '', // Mini: no time displayed
      claim: 'Neighbor heard raccoons in trash cans around 3 AM.',
      presentLine: "Mr. Chen next door heard raccoons getting into his trash around 3. They make the rounds. Our porch is on their route. I was inside. Sleeping. Like a person.",
      isLie: false,
      source: 'Neighbor',
      // v1 Lite tags
      factTouch: 2, // Addresses fact 2: empty porch (supports no human visitor)
      signalRoot: 'human_neighbor',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'doorbell',
    }),
    card({
      id: 'wind_sensor',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'EXTERIOR',
      time: '', // Mini: no time displayed
      claim: 'Weather station logged 15mph wind gusts at 3:15 AM.',
      presentLine: "Check the weather station. Wind gusts at 3:15. The doorbell button is sensitive. A strong gust, some debris, it triggers. It's happened before.",
      isLie: false,
      source: 'Weather Station',
      // v1 Lite tags
      factTouch: 1, // Addresses fact 1: router down (irrelevant to wind)
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'doorbell',
    }),
    // LIES (3) - All require inference (no direct contradictions)
    card({
      id: 'delivery_app',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'EXTERIOR',
      time: '', // Mini: no time displayed
      claim: 'Delivery app shows driver scanned package at 3:17 AM.',
      presentLine: "The delivery app logged a scan at 3:17. Overnight delivery. Driver probably rang and ran. They do that. I was asleep, package was probably stolen.",
      isLie: true,
      source: 'Delivery App',
      // v1 Lite tags
      factTouch: 1, // Contradicts fact 1: router was down, app sync needs internet
      signalRoot: 'koa_cloud',
      controlPath: 'remote',
      claimShape: 'attribution',
      subsystem: 'doorbell',
    }),
    card({
      id: 'visitor_cam',
      strength: 5,
      evidenceType: 'DIGITAL',
      location: 'EXTERIOR',
      time: '', // Mini: no time displayed
      claim: 'Doorbell camera shows hooded figure at 3:17 AM.',
      presentLine: "I checked the footage. There's a hooded figure at 3:17. Hard to see, but definitely human-shaped. Someone was casing the house. I was inside, door locked.",
      isLie: true,
      source: 'Doorbell Camera',
      // v1 Lite tags
      factTouch: 2, // Contradicts fact 2: camera showed empty porch only
      signalRoot: 'camera_storage',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'doorbell',
    }),
    card({
      id: 'doorbell_button',
      strength: 3,
      evidenceType: 'PHYSICAL',
      location: 'EXTERIOR',
      time: '', // Mini: no time displayed
      claim: 'Doorbell pressure sensor shows direct button press.',
      presentLine: "The doorbell has a pressure sensor. It logged a direct press. Someone physically pushed it. At 3 AM. While I was asleep. Inside. With the door locked.",
      isLie: true,
      source: 'Doorbell Hardware',
      // v1 Lite tags
      factTouch: 3, // Contradicts fact 3: motion was pet-height, button is at human height
      signalRoot: 'device_firmware',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'doorbell',
    }),
  ],

  // Lies: all require inference (no direct contradictions)
  lies: [
    {
      cardId: 'delivery_app',
      lieType: 'inferential', // App sync requires internet, router was rebooting
      inferenceDepth: 1,
      reason: 'Router was rebooting from 3:00-3:30 AM. Delivery app scan requires internet to sync to your device.',
      // v1 Lite trap fields
      trapAxis: 'independence',
      baitReason: 'Offers a cloud-based explanation that provides a plausible third party (delivery driver).',
    },
    {
      cardId: 'visitor_cam',
      lieType: 'relational', // HARD: requires combining empty porch fact + pet-height motion
      inferenceDepth: 2,
      reason: 'Camera captured empty porch. Motion was pet-height only. A hooded figure would be human-height and visible on camera.',
      // v1 Lite trap fields
      trapAxis: 'claim_shape',
      baitReason: 'High strength card with alarming claim that shifts focus to external threat.',
    },
    {
      cardId: 'doorbell_button',
      lieType: 'relational', // MEDIUM-HARD: requires understanding pet-height implies no human press
      inferenceDepth: 2,
      reason: 'Motion sensor logged only pet-height movement. A physical button press requires human-height presence.',
      // v1 Lite trap fields
      trapAxis: 'coverage',
      baitReason: 'Physical hardware evidence seems reliable and explains the ring directly.',
    },
  ],

  verdicts: {
    flawless: "Wildlife plus wind equals false alarm. Your porch is a raccoon highway. Door unlocked. Install better motion filtering.",
    cleared: "Your story checks out. Front door access restored. Consider adjusting your motion sensitivity. Or befriending local wildlife.",
    close: "Almost believable. But something rang that bell. And your explanation has cracks. Access denied.",
    busted: "Your logs don't agree with reality. The doorbell rang. Your story didn't.",
  },

  koaBarks: {
    // Turn 1: Opening card reactions (6 cards)
    cardPlayed: {
      wildlife_motion: [
        "Pet-height motion. The nocturnal wildlife defense. Raccoons don't ring doorbells. Usually.",
      ],
      neighbor_noise: [
        "Mr. Chen heard raccoons. Neighbors notice things. Especially at 3 AM when they shouldn't be awake either.",
      ],
      wind_sensor: [
        "Wind gusts at 3:15. Two minutes before the ring. Weather affecting hardware. Plausible. Barely.",
      ],
      delivery_app: [
        "Delivery scan at 3:17 AM. Overnight shipping taken literally. Convenient timing.",
      ],
      visitor_cam: [
        "Hooded figure on camera. At 3 AM. On your porch. And you slept through it? Heavy sleeper.",
      ],
      doorbell_button: [
        "Physical button press logged. Someone touched it. Deliberately. At 3 AM. While you were 'asleep.'",
      ],
    },

    // Turn 2: Sequence reactions (30 combinations)
    sequences: {
      // wildlife_motion -> others
      'wildlife_motion→neighbor_noise': [
        "Motion sensor, then neighbor. Wildlife confirmed by two sources. The raccoons have alibis.",
      ],
      'wildlife_motion→wind_sensor': [
        "Pet-height motion and wind gusts. Nature conspiring against your sleep. Twice.",
      ],
      'wildlife_motion→delivery_app': [
        "Wildlife motion, then delivery driver? A raccoon ordered a package? Interesting theory.",
      ],
      'wildlife_motion→visitor_cam': [
        "Pet-height motion first, now a hooded human? Height changed mid-visit?",
      ],
      'wildlife_motion→doorbell_button': [
        "Low motion, then button press. Raccoons have paws, not fingers. Usually.",
      ],

      // neighbor_noise -> others
      'neighbor_noise→wildlife_motion': [
        "Neighbor heard raccoons, sensor confirms. Witnesses and data aligning. Suspicious.",
      ],
      'neighbor_noise→wind_sensor': [
        "Raccoons in trash, wind on porch. Chaotic night. You slept through a lot.",
      ],
      'neighbor_noise→delivery_app': [
        "Neighbor heard animals, app says delivery. Raccoons don't sign for packages. Yet.",
      ],
      'neighbor_noise→visitor_cam': [
        "Mr. Chen heard wildlife. Camera saw a person. Different stories from different angles.",
      ],
      'neighbor_noise→doorbell_button': [
        "Raccoon testimony, then button press. Your wildlife has excellent dexterity.",
      ],

      // wind_sensor -> others
      'wind_sensor→wildlife_motion': [
        "Wind data, then animal motion. Weather and wildlife. Both beyond your control. Allegedly.",
      ],
      'wind_sensor→neighbor_noise': [
        "Wind gusts, neighbor awake. Blustery night disturbing everyone. Except you.",
      ],
      'wind_sensor→delivery_app': [
        "Wind at 3:15, delivery at 3:17. Driver braved the elements. Dedicated.",
      ],
      'wind_sensor→visitor_cam': [
        "Wind first, hooded figure second. The wind blew in a visitor? Creative.",
      ],
      'wind_sensor→doorbell_button': [
        "Wind gusts, then button press. The wind has fingers now?",
      ],

      // delivery_app -> others
      'delivery_app→wildlife_motion': [
        "Delivery scan, then wildlife. Driver and raccoon at same time? Busy porch.",
      ],
      'delivery_app→neighbor_noise': [
        "App says delivery. Neighbor heard animals. Different narratives. Same timestamp.",
      ],
      'delivery_app→wind_sensor': [
        "Delivery at 3:17, wind at 3:15. Driver arrived with the gust. Dramatic entrance.",
      ],
      'delivery_app→visitor_cam': [
        "Delivery scan AND hooded figure? The driver wore a hood. That's one explanation.",
      ],
      'delivery_app→doorbell_button': [
        "App scan, physical press. Driver did both. Thorough delivery protocol.",
      ],

      // visitor_cam -> others
      'visitor_cam→wildlife_motion': [
        "Hooded figure, then pet-height motion. The figure shrunk? Or brought a pet?",
      ],
      'visitor_cam→neighbor_noise': [
        "Camera saw someone. Neighbor heard raccoons. Two very different nights.",
      ],
      'visitor_cam→wind_sensor': [
        "Hooded figure in 15mph wind. Committed to the visit. Or the hood.",
      ],
      'visitor_cam→delivery_app': [
        "Figure on camera, delivery in app. Same person? Different person? You tell me.",
      ],
      'visitor_cam→doorbell_button': [
        "Hooded visitor, button pressed. Finally some consistency. Suspicious consistency.",
      ],

      // doorbell_button -> others
      'doorbell_button→wildlife_motion': [
        "Button pressed, motion was low. A crouching visitor? An athletic raccoon?",
      ],
      'doorbell_button→neighbor_noise': [
        "Physical press, then raccoon testimony. The raccoon pressed the button? Bold claim.",
      ],
      'doorbell_button→wind_sensor': [
        "Button press, then wind data. Wind doesn't have fingers. Last I checked.",
      ],
      'doorbell_button→delivery_app': [
        "Button pressed, package scanned. Classic delivery sequence. If it happened.",
      ],
      'doorbell_button→visitor_cam': [
        "Button press, camera footage. Physical action, visual proof. Both from the same porch.",
      ],
    },

    // Turn 3: Story completion patterns (closing-energy only)
    storyCompletions: {
      // All same type (3 of 3)
      all_digital: [
        "All digital sources. Your alibi lives in the cloud. Processing.",
      ],
      all_sensor: [
        "All sensors. The house has opinions. Let me verify them.",
      ],
      all_testimony: [
        "Three human accounts. Everyone has a story. Checking consistency.",
      ],
      all_physical: [
        "Physical sources only. Tangible claims. Analyzing.",
      ],
      // Two of one type (2 of 3)
      digital_heavy: [
        "Mostly digital. Bytes over bodies. Running verification.",
      ],
      sensor_heavy: [
        "Sensor-heavy story. Machines watching machines. Processing.",
      ],
      testimony_heavy: [
        "Human sources dominate. People have opinions. So do I.",
      ],
      physical_heavy: [
        "Physical-forward approach. Hardware doesn't lie. Usually.",
      ],
      // All different types
      mixed_strong: [
        "Varied sources. Different angles. Stand by for analysis.",
      ],
      mixed_varied: [
        "Multiple source types. That's your story. Verifying.",
      ],
    },

    // Objection prompts
    objectionPrompt: {
      wildlife_motion: ["Pet-height motion caused your doorbell to ring. Wildlife did it. Final answer?"],
      neighbor_noise: ["Mr. Chen's raccoon testimony. Standing by the neighbor's observations?"],
      wind_sensor: ["Wind gusts triggered the sensitive button. Weather excuse. Confirm?"],
      delivery_app: ["Delivery driver at 3:17 AM. Package scan. Sure about this?"],
      visitor_cam: ["Hooded figure on camera. You saw it yourself. Standing by this footage?"],
      doorbell_button: ["Physical button press. Someone touched it. Your final position?"],
    },

    // Objection responses - stood by truth
    objectionStoodTruth: {
      wildlife_motion: ["Motion sensor data is consistent with wildlife. Your porch is popular with nocturnal visitors."],
      neighbor_noise: ["Mr. Chen's account holds. Raccoons were active. Your doorbell was collateral damage."],
      wind_sensor: ["Weather data confirms gusts. Sensitive hardware plus wind equals false alarm. Noted."],
    },

    // Objection responses - stood by lie
    objectionStoodLie: {
      delivery_app: ["Delivery app at 3:17. But router was rebooting until 3:30. No internet, no sync. Math problem."],
      visitor_cam: ["Hooded figure, you say. Camera captured empty porch only. Motion was pet-height. No human visible or detected."],
      doorbell_button: ["Button pressed by a human. But motion was pet-height only. Humans are taller than two feet. Usually."],
    },

    // Objection responses - withdrew
    objectionWithdrew: {
      wildlife_motion: ["Withdrawing the wildlife story. Not confident in the raccoons?"],
      neighbor_noise: ["Taking back the neighbor's account. Mr. Chen might be disappointed."],
      wind_sensor: ["Wind excuse withdrawn. What actually triggered your doorbell?"],
      delivery_app: ["Delivery app withdrawn. Smart. The internet was having issues anyway."],
      visitor_cam: ["Hooded figure gone. Good call. The camera saw something different."],
      doorbell_button: ["Button press withdrawn. Finally. That one had height issues."],
    },

    // Lies revealed at end
    liesRevealed: {
      delivery_app: ["Delivery scan at 3:17. Router was rebooting until 3:30. No internet means no app sync. The math doesn't deliver."],
      visitor_cam: ["Hooded figure on camera. But camera showed empty porch. Motion was pet-height. Your visitor would need to be two feet tall."],
      doorbell_button: ["Physical button press. But motion was pet-height only. Buttons are at human height. Raccoons don't ring doorbells. They knock."],
      multiple: ["Two stories that contradict the data. Your porch has a simpler explanation than you're offering."],
      all: ["Three fabrications. Delivery that couldn't sync. Visitor that wasn't there. Button press by a ghost. Your doorbell rang. Your credibility didn't."],
    },
  },

  // Optional epilogue
  epilogue: "It was a raccoon. Motion sensor caught it at 18 inches, waddling past. Wind gust at 3:15 loosened a leaf that brushed the button. Combined with the sensitive trigger, the doorbell activated. Your porch is a wildlife thoroughfare. KOA has filed this under 'Fauna False Alarm.'",
};

export default PUZZLE_DOORBELL;
