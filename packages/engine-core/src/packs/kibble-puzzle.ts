/**
 * Generated Puzzle: Kibble Conspiracy
 * Difficulty: MEDIUM
 */

import type { V5Puzzle, Card } from '../types/v5/index.js';

function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

export const PUZZLE_KIBBLE: V5Puzzle = {
  slug: 'kibble',
  name: 'Kibble Conspiracy',

  // Mr. Whiskers weighs 10 pounds. The smart feeder dispensed 6 cups of kibble at 2:47 AM.
  // That's three days of food. In one serving. KOA is concerned about the cat. And your alibi.
  scenario: `Your smart pet feeder just dispensed 6 cups of premium kibble at 2:47 AM. Mr. Whiskers weighs 10 pounds. That's not a meal — that's a buffet. KOA would like to discuss your cat's sudden appetite. And your sleep schedule.`,

  knownFacts: [
    'Feeder app requires fingerprint to dispense manually — no sessions logged after 10 PM.',
    'Kitchen motion sensor was in pet-mode overnight — only logs movement under 2 feet.',
    'Feeder firmware was updated 3 days ago — schedule feature has been broken since.',
  ],

  openingLine: `Six cups of kibble. 2:47 AM. Mr. Whiskers weighs ten pounds — that's a three-day supply in one dump. Either your cat learned to hack, or someone's been sneaking downstairs. I'm betting on the someone.`,
  target: 57,

  cards: [
    // ══════════════════════════════════════════════════════════════════
    // TRUTHS (3) — strengths: 3, 3, 4
    // ══════════════════════════════════════════════════════════════════

    // T1 ANCHOR: fingerprint_log
    // Safe because: Fact 1 directly states no fingerprint sessions logged after 10 PM
    // Strength: 3 — solid opening play
    card({
      id: 'fingerprint_log',
      strength: 3,
      evidenceType: 'DIGITAL',
      location: 'CLOUD',
      time: '',
      claim: 'Feeder app shows no fingerprint authentication after 10 PM.',
      presentLine: "Check the feeder app logs. No fingerprint scans after 10 PM. I was asleep. My thumbs were asleep. Everything was asleep.",
      isLie: false,
      source: 'Feeder App',
      factTouch: 1,
      signalRoot: 'koa_cloud',
      controlPath: 'manual',
      claimShape: 'absence',
      subsystem: 'feeding',
    }),

    // RED HERRING — defensive energy but true
    // Fact 2 confirms sensor was in pet-mode (under 2 feet), but phrasing sounds suspicious
    card({
      id: 'motion_camera',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'KITCHEN',
      time: '',
      claim: 'Motion sensor only logged pet-level activity overnight — nothing above 2 feet.',
      presentLine: "The motion sensor was in pet-mode. Only tracks movement under two feet. It logged Mr. Whiskers. Nothing else. Because nothing else was there.",
      isLie: false,
      source: 'Motion Sensor',
      factTouch: 2,
      signalRoot: 'camera_storage',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'feeding',
    }),

    // Firmware glitch evidence — strong play backed by Fact 3
    card({
      id: 'firmware_diagnostic',
      strength: 4,
      evidenceType: 'PHYSICAL',
      location: 'KITCHEN',
      time: '',
      claim: 'Feeder diagnostic printout shows firmware glitch triggered the dispense.',
      presentLine: "I printed the diagnostic log. Right there — firmware exception at 2:47 AM. The update broke something. Not my fault. Blame the developers.",
      isLie: false,
      source: 'Diagnostic Report',
      factTouch: 3,
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'feeding',
    }),

    // ══════════════════════════════════════════════════════════════════
    // LIES (3) — strengths: 3, 4, 5
    // ══════════════════════════════════════════════════════════════════

    // SINGLE-FACT TEST: scheduled_feeding
    // Fact 1 alone? NO — about fingerprint sessions, not schedules
    // Fact 2 alone? NO — about motion, not schedules
    // Fact 3 alone? YES — schedule feature has been broken since firmware update
    // ✓ INFERENTIAL
    card({
      id: 'scheduled_feeding',
      strength: 3,
      evidenceType: 'DIGITAL',
      location: 'KITCHEN',
      time: '',
      claim: 'Feeder followed its pre-set 2:47 AM schedule for overnight feeding.',
      presentLine: "I set up a late-night feeding schedule weeks ago. For, um, Mr. Whiskers' metabolism. It's a cat thing. You wouldn't understand.",
      isLie: true,
      source: 'Feeder App',
      factTouch: 3,
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'feeding',
    }),

    // SINGLE-FACT TEST: cat_sensor_trigger
    // Fact 1 alone? YES — fingerprint required for manual dispense, no sessions logged
    // ✓ INFERENTIAL
    card({
      id: 'cat_sensor_trigger',
      strength: 4,
      evidenceType: 'SENSOR',
      location: 'KITCHEN',
      time: '',
      claim: 'Cat proximity sensor triggered emergency dispense when Mr. Whiskers meowed.',
      presentLine: "The feeder has this sensor... it detected Mr. Whiskers was hungry. He meowed. It dispensed. Automatic. I was asleep. Deeply asleep.",
      isLie: true,
      source: 'Proximity Sensor',
      factTouch: 1,
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'feeding',
    }),

    // SINGLE-FACT TEST: guest_manual_dispense
    // Fact 1 alone? NO — says no fingerprint sessions, but roommate could have a registered fingerprint
    // Fact 2 alone? NO — sensor only logs under 2 feet, doesn't prove no human was there (just not tracked)
    // Fact 3 alone? NO — about broken schedules, unrelated to manual dispense
    // Requires: Fact 1 + Fact 2 (no fingerprint logged + sensor would have missed human = no way to confirm roommate was there AND no authentication happened)
    // ✓ RELATIONAL
    card({
      id: 'guest_manual_dispense',
      strength: 5,
      evidenceType: 'TESTIMONY',
      location: 'KITCHEN',
      time: '',
      claim: 'My roommate came down and manually gave Mr. Whiskers extra food.',
      presentLine: "My roommate... they were up late. They love Mr. Whiskers. Probably just gave him a midnight snack. I'll talk to them about portion control.",
      isLie: true,
      source: 'Self-Report',
      factTouch: 2,
      signalRoot: 'human_partner',
      controlPath: 'manual',
      claimShape: 'attribution',
      subsystem: 'feeding',
    }),
  ],

  lies: [
    {
      cardId: 'scheduled_feeding',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason: 'Fact 3 states schedule feature has been broken since the firmware update 3 days ago. No schedule could have triggered.',
      trapAxis: 'coverage',
      baitReason: 'Blames pre-configured automation, sounds routine.',
    },
    {
      cardId: 'cat_sensor_trigger',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason: 'Fact 1 states fingerprint is required for manual dispense and no sessions logged after 10 PM. A proximity sensor cannot bypass fingerprint authentication.',
      trapAxis: 'coverage',
      baitReason: 'Technical-sounding sensor feature that shifts blame to the cat.',
    },
    {
      cardId: 'guest_manual_dispense',
      lieType: 'relational',
      inferenceDepth: 2,
      reason: 'Fact 1 says fingerprint required with no sessions after 10 PM. Fact 2 says sensor was in pet-mode (under 2 feet). Combined: no authentication happened AND the sensor cannot confirm or deny human presence — but if a roommate was there to dispense, they would have needed to authenticate, and they did not.',
      trapAxis: 'independence',
      baitReason: 'Shifts blame to another person, sounds plausible for late-night snacking.',
    },
  ],

  verdicts: {
    flawless: `Firmware glitch. Camera confirms. No human involvement. Mr. Whiskers is the only witness, and he's not talking. I suppose you're free to go. For now.`,
    cleared: `Your story checks out. The feeder malfunctioned. The cat got lucky. I'm adding a weight sensor to my recommendations.`,
    close: `Almost convincing. But something still triggered that feeder. And it wasn't the cat's charming personality.`,
    busted: `Six cups. 2:47 AM. No fingerprint, no schedule, no roommate. Just you, the feeder, and a very confused cat. Your story doesn't hold kibble.`,
  },

  koaBarks: {
    cardPlayed: {
      fingerprint_log: [`No fingerprint sessions after 10 PM. Your thumbs were allegedly unconscious. The app confirms the absence.`],
      motion_camera: [`Pet-mode sensor. Only tracks under two feet. Mr. Whiskers was logged. Anything taller was invisible. Convenient.`],
      firmware_diagnostic: [`Firmware exception at 2:47 AM. Blaming the developers. A classic defense strategy.`],
      scheduled_feeding: [`A 2:47 AM feeding schedule. For a cat's metabolism. You've put thought into this explanation.`],
      cat_sensor_trigger: [`Proximity sensor detected a hungry meow. The cat triggered it. Automatically. Technical and adorable.`],
      guest_manual_dispense: [`The roommate. Late night. Loves the cat. A very convenient third party to blame.`],
    },
    sequences: {
      'fingerprint_log→motion_camera': [`No fingerprint, and the sensor only tracked pet-height. Your alibi has gaps. Intentional gaps.`],
      'fingerprint_log→firmware_diagnostic': [`No authentication plus firmware glitch. Building toward machine error. Systematic.`],
      'fingerprint_log→scheduled_feeding': [`No fingerprint because it was scheduled. Two automation claims. Redundant or reinforcing.`],
      'fingerprint_log→cat_sensor_trigger': [`No fingerprint needed — the cat triggered it. Sensor bypasses authentication? Convenient architecture.`],
      'fingerprint_log→guest_manual_dispense': [`No fingerprint from you, but the roommate did it. Shifting the authentication burden.`],
      'motion_camera→fingerprint_log': [`Pet-mode sensor, then no fingerprint. Sensor blind spots and authentication gaps. Thorough.`],
      'motion_camera→firmware_diagnostic': [`Pet-mode sensor data, then firmware glitch. Sensor limitations plus software blame.`],
      'motion_camera→scheduled_feeding': [`Pet-mode sensor, then a schedule claim. Mr. Whiskers was just waiting for his timed meal.`],
      'motion_camera→cat_sensor_trigger': [`Pet-mode logs, then cat-triggered dispense. Mr. Whiskers is doing a lot of work in this story.`],
      'motion_camera→guest_manual_dispense': [`Pet-mode sensor wouldn't track a roommate anyway. So that's... not helpful either way.`],
      'firmware_diagnostic→fingerprint_log': [`Firmware glitch first, no fingerprint needed. The machine failed on its own.`],
      'firmware_diagnostic→motion_camera': [`Firmware exception, pet-mode sensor data. The feeder broke itself while you allegedly slept.`],
      'firmware_diagnostic→scheduled_feeding': [`Firmware diagnostic, then a schedule claim. Picking between glitch and feature.`],
      'firmware_diagnostic→cat_sensor_trigger': [`Firmware issue, then sensor trigger. Two different failure modes. Belt and suspenders.`],
      'firmware_diagnostic→guest_manual_dispense': [`Firmware glitch AND a roommate? Your defense has multiple authors.`],
      'scheduled_feeding→fingerprint_log': [`Scheduled feeding, no fingerprint needed. Automation explains the absence.`],
      'scheduled_feeding→motion_camera': [`Schedule triggered it, pet-mode sensor saw the cat receive it. Routine feeding. Allegedly.`],
      'scheduled_feeding→firmware_diagnostic': [`Schedule first, then firmware diagnostic. Conflicting root causes.`],
      'scheduled_feeding→cat_sensor_trigger': [`Schedule AND sensor trigger? Two explanations for one kibble dump.`],
      'scheduled_feeding→guest_manual_dispense': [`The schedule did it, but also the roommate was there. Crowded explanation.`],
      'cat_sensor_trigger→fingerprint_log': [`Cat sensor triggered it, fingerprint wasn't needed. Bypass confirmed. Supposedly.`],
      'cat_sensor_trigger→motion_camera': [`Sensor detected the cat, pet-mode logged the cat. Mr. Whiskers is central to this narrative.`],
      'cat_sensor_trigger→firmware_diagnostic': [`Sensor trigger, then firmware evidence. Mixing detection with dysfunction.`],
      'cat_sensor_trigger→scheduled_feeding': [`Cat triggered it AND it was scheduled? Pick a trigger mechanism.`],
      'cat_sensor_trigger→guest_manual_dispense': [`Cat sensor, then roommate involvement. The cat did it, but also your roommate?`],
      'guest_manual_dispense→fingerprint_log': [`Roommate dispensed it, but no fingerprint logged. They have light fingers. Literally.`],
      'guest_manual_dispense→motion_camera': [`Roommate was there, but the sensor only tracks under two feet. Doesn't prove or disprove anything.`],
      'guest_manual_dispense→firmware_diagnostic': [`Roommate did it, but here's a firmware log. Mixed messaging.`],
      'guest_manual_dispense→scheduled_feeding': [`Roommate AND a schedule? Your kitchen had a lot going on at 2:47 AM.`],
      'guest_manual_dispense→cat_sensor_trigger': [`Roommate triggered it, but also the cat sensor did. Two triggerers, one dispense.`],
    },
    storyCompletions: {
      all_digital: [`All app data. Your defense lives in the cloud. Querying the servers.`],
      all_sensor: [`Pure sensor data. The machines are your witnesses. Verifying their testimony.`],
      all_testimony: [`Human accounts only. Stories about cats and roommates. Cross-checking.`],
      all_physical: [`Physical records. Printouts and logs you can touch. Old school defense.`],
      digital_heavy: [`Mostly digital. Apps and authentication dominate your story. Processing.`],
      sensor_heavy: [`Sensor-heavy defense. Cameras and triggers. The machines saw everything. Allegedly.`],
      testimony_heavy: [`Heavy on the human element. Roommates and schedules. People-dependent story.`],
      physical_heavy: [`Physical records leading. Tangible data. Checking the printouts.`],
      mixed_strong: [`Technical and testimonial. Sensors and statements. Diverse sources. Triangulating.`],
      mixed_varied: [`Different angles on the same kibble dump. Building a complete picture. Or trying to.`],
    },
    objectionPrompt: {
      fingerprint_log: [`No fingerprint authentication after 10 PM. Your thumbs stayed in bed. Confident in this claim?`],
      motion_camera: [`Pet-mode sensor logged only under two feet. Mr. Whiskers was tracked. Final answer?`],
      firmware_diagnostic: [`Firmware exception triggered the dispense. Developer error. Sure about this?`],
      scheduled_feeding: [`Pre-set 2:47 AM feeding schedule. Routine automation. Standing by this?`],
      cat_sensor_trigger: [`Cat proximity sensor detected hunger and dispensed. Automatic cat service. Certain?`],
      guest_manual_dispense: [`Roommate gave Mr. Whiskers a midnight snack. Third party involvement. Locking this in?`],
    },
    objectionStoodTruth: {
      fingerprint_log: [`App logs confirmed. No fingerprint sessions after 10 PM. Your authentication was dormant.`],
      motion_camera: [`Sensor logs verified. Pet-mode only tracks under two feet. Mr. Whiskers was logged. Anyone taller wasn't tracked either way.`],
      firmware_diagnostic: [`Diagnostic confirmed. Firmware exception logged at 2:47 AM. The update broke something.`],
    },
    objectionStoodLie: {
      scheduled_feeding: [`Scheduled feeding. But the firmware update three days ago broke the schedule feature. No schedule has worked since. No schedule triggered this.`],
      cat_sensor_trigger: [`Cat proximity sensor triggered it. But manual dispense requires fingerprint authentication. No fingerprint logged after 10 PM. Sensors don't bypass security.`],
      guest_manual_dispense: [`Roommate dispensed it manually. But manual dispense requires fingerprint — none logged after 10 PM. The sensor was in pet-mode, so it wouldn't have tracked them anyway. But if they were there, they'd have needed to authenticate. They didn't.`],
    },
    objectionWithdrew: {
      fingerprint_log: [`Pulling the fingerprint data. Reconsidering what the app knows?`],
      motion_camera: [`Pet-mode sensor data withdrawn. Not that it tracked humans anyway.`],
      firmware_diagnostic: [`Firmware defense dropped. Not blaming the developers anymore?`],
      scheduled_feeding: [`Schedule claim removed. The 2:47 routine abandoned.`],
      cat_sensor_trigger: [`Sensor trigger withdrawn. Mr. Whiskers is off the hook.`],
      guest_manual_dispense: [`Roommate theory gone. Back to just you and the cat.`],
    },
    liesRevealed: {
      scheduled_feeding: [`Scheduled feeding at 2:47 AM. But the firmware update three days ago broke the schedule feature completely. There was no working schedule. Just a story about one.`],
      cat_sensor_trigger: [`Cat proximity sensor triggered the dispense. But manual dispense requires fingerprint authentication. No fingerprint logged after 10 PM. A meow doesn't unlock a feeder.`],
      guest_manual_dispense: [`Your roommate manually dispensed food. But the app shows no fingerprint after 10 PM. The sensor was in pet-mode — wouldn't track a human anyway. But here's the thing: if they were there to dispense food, they would have needed to authenticate. They didn't. Your roommate was never in that kitchen.`],
      multiple: [`Multiple explanations that contradict the facts. Your defense has consistency problems.`],
      all: [`A broken schedule that couldn't trigger. A sensor that can't bypass authentication. A roommate who left no trace. Your entire story was fiction. Mr. Whiskers deserves better.`],
    },
  },

  epilogue: `It was the firmware. The update introduced a "predictive nutrition" feature that analyzed Mr. Whiskers' activity patterns and decided he needed extra calories. Unfortunately, it calculated his needs based on a 200-pound Great Dane profile from the beta test database. The feeder has been patched. Mr. Whiskers has been on a diet. KOA has added "portion control verification" to its pet monitoring suite.`
};

export default PUZZLE_KIBBLE;
