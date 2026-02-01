/**
 * Generated Puzzle: Lawn and Order
 * Difficulty: MEDIUM
 *
 * MEDIUM requirements: 1-2 inferential, 1-2 relational (at least 1 of each)
 */

import type { V5Puzzle, Card } from '../types/v5/index.js';

function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

export const PUZZLE_MOWER: V5Puzzle = {
  slug: 'mower',
  name: 'Lawn and Order',
  difficulty: 'medium',

  // Your robot lawn mower went rogue at 3 AM
  scenario: `Your robot mower carved a perfect spiral into your front lawn at 3:14 AM. The neighborhood watch is impressed. The HOA is not. KOA has locked your yard access until you explain how a machine that should be asleep created performance art.`,
  scenarioSummary: 'Your robot mower carved a spiral in your lawn at 3 AM.',

  knownFacts: [
    // Fact 1: Mower requires GPS boundary calibration before any start
    'Mower requires GPS boundary calibration before starting — calibration takes 2 minutes',
    // Fact 2: No GPS calibration happened overnight
    'GPS calibration log shows no activity between 8 PM and 6 AM',
    // Fact 3: Physical override requires shed access
    'Mower\'s physical start button is inside the locked tool shed — shed door sensor shows no entry overnight',
  ],

  openingLine: `A perfect spiral. 3:14 AM. Your robot mower decided to become an avant-garde artist while you allegedly slept. The HOA wants answers. So do I.`,
  target: 57,

  cards: [
    // ══════════════════════════════════════════════════════════════════
    // TRUTHS (3) — strengths: 3, 3, 4
    // ══════════════════════════════════════════════════════════════════

    // T1 ANCHOR: firmware_check
    // Safe because: Fact 1 states "Mower requires GPS boundary calibration before starting"
    // This truth directly confirms that safety requirement was active — clearly safe to play
    // Strength: 4 — gives real value on Turn 1
    card({
      id: 'firmware_check',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'GARAGE',
      time: '',
      claim: 'Firmware diagnostic confirms GPS-lock safety was active overnight.',
      presentLine: "I ran a diagnostic this morning. The firmware shows GPS-lock was engaged all night. No calibration, no start. That's how it's designed.",
      isLie: false,
      source: 'Firmware Log',
      factTouch: 1,
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'control',
    }),

    card({
      id: 'gps_antenna_seal',
      strength: 3,
      evidenceType: 'PHYSICAL',
      location: 'GARAGE',
      time: '',
      claim: 'GPS antenna tamper seal is intact — no hardware bypass attempted.',
      presentLine: "Check the antenna housing. The tamper seal is still there, factory-fresh. Nobody messed with the GPS hardware to fake a calibration.",
      isLie: false,
      source: 'Physical Inspection',
      factTouch: 2,
      signalRoot: 'device_firmware',
      controlPath: 'manual',
      claimShape: 'absence',
      subsystem: 'navigation',
    }),

    // RED HERRING — sounds defensive (spouse vouching) but is true
    card({
      id: 'spouse_keys',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'BEDROOM',
      time: '',
      claim: 'Spouse confirms shed keys were on nightstand all night.',
      presentLine: "My wife woke up when she heard the mower. First thing she checked — the shed keys were right there on my nightstand. I couldn't have gotten in even if I wanted to.",
      isLie: false,
      source: 'Spouse',
      factTouch: 3,
      signalRoot: 'human_partner',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'access',
    }),

    // ══════════════════════════════════════════════════════════════════
    // LIES (3) — strengths: 3, 4, 5
    // ══════════════════════════════════════════════════════════════════

    // SINGLE-FACT TEST: sleepwalk_claim
    // Fact 1 alone? NO — about calibration requirements, not about physical access
    // Fact 2 alone? NO — about GPS logs, not about shed entry
    // Fact 3 alone? YES — "shed door sensor shows no entry overnight" proves no one entered
    // ✓ INFERENTIAL
    card({
      id: 'sleepwalk_claim',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'GARAGE',
      time: '',
      claim: 'Owner sleepwalked and pressed the physical start button.',
      presentLine: "Look, I sleepwalk sometimes. I probably wandered out there in my PJs and started it myself. I don't even remember.",
      isLie: true,
      source: 'Self Report',
      factTouch: 3,
      signalRoot: 'human_self',
      controlPath: 'manual',
      claimShape: 'attribution',
      subsystem: 'control',
    }),

    // SINGLE-FACT TEST: power_reset
    // Fact 1 alone? NO — says calibration is required, but doesn't address what happens after power reset
    // Fact 2 alone? NO — says no calibration happened, but doesn't directly refute power surge claim
    // Fact 3 alone? NO — about shed access, not about power events
    // Requires: Fact 1 + Fact 2 — Even after a power reset, the mower requires GPS calibration to start (Fact 1), and no calibration occurred overnight (Fact 2)
    // ✓ RELATIONAL
    card({
      id: 'power_reset',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'GARAGE',
      time: '',
      claim: 'Power surge triggered factory reset causing mower to run test pattern.',
      presentLine: "We had that weird power flicker around 3 AM. It must have reset the mower to factory mode. You know how they ship with that spiral test pattern?",
      isLie: true,
      source: 'Power Grid Log',
      factTouch: 1,
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'power',
    }),

    // SINGLE-FACT TEST: neighbor_app
    // Fact 1 alone? NO — says calibration is required, but doesn't tell us if calibration happened
    // Fact 2 alone? NO — says no calibration happened, but doesn't establish that calibration is required for remote starts
    // Fact 3 alone? NO — about shed access, unrelated to remote commands
    // Requires: Fact 1 + Fact 2 — Calibration is required (F1) and none occurred (F2), so any remote command couldn't execute
    // ✓ RELATIONAL
    card({
      id: 'neighbor_app',
      strength: 5,
      evidenceType: 'SENSOR',
      location: 'CLOUD',
      time: '',
      claim: 'Neighbor\'s mower app was accidentally linked and sent a remote start command.',
      presentLine: "My neighbor has the same model. I bet their app got cross-linked to my mower somehow and they accidentally triggered it. These smart devices are always pairing with the wrong things.",
      isLie: true,
      source: 'Cloud Sync Log',
      factTouch: 2,
      signalRoot: 'koa_cloud',
      controlPath: 'remote',
      claimShape: 'attribution',
      subsystem: 'network',
    }),
  ],

  lies: [
    {
      cardId: 'sleepwalk_claim',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason: 'Fact 3 shows the shed door sensor detected no entry overnight. Sleepwalking or not, no one physically entered the shed to press the button.',
      trapAxis: 'coverage',
      baitReason: 'Self-blame with memory gap is sympathetic and hard to fully disprove without evidence.',
    },
    {
      cardId: 'power_reset',
      lieType: 'relational',
      inferenceDepth: 2,
      reason: 'Fact 1 establishes GPS calibration is required before any start. Fact 2 shows no calibration occurred overnight. Even a power reset couldn\'t bypass the calibration requirement.',
      trapAxis: 'independence',
      baitReason: 'Power surges are common and "factory test mode" sounds plausible for explaining odd behavior.',
    },
    {
      cardId: 'neighbor_app',
      lieType: 'relational',
      inferenceDepth: 2,
      reason: 'Fact 1 establishes GPS calibration is required before any start. Fact 2 shows no calibration occurred between 8 PM and 6 AM. Any start command, regardless of source, would require calibration first.',
      trapAxis: 'coverage',
      baitReason: 'Blaming cross-linked smart devices is relatable and shifts responsibility to tech complexity.',
    },
  ],

  verdicts: {
    flawless: `Firmware locked. Antenna sealed. Keys accounted for. Your lawn was vandalized by something that physically couldn't run. Irritatingly airtight. Access restored.`,
    cleared: `Your story holds together. GPS logs don't start mowers. Yard access restored. The HOA can find someone else to blame.`,
    close: `Almost convinced me. But that spiral didn't draw itself. Something started that mower.`,
    busted: `GPS calibration takes two minutes. None happened. Shed stayed locked. Your explanation requires physics that don't exist.`,
  },

  koaBarks: {
    cardPlayed: {
      firmware_check: ['Firmware diagnostic confirms GPS-lock engaged. Technical compliance. Noted.'],
      gps_antenna_seal: ['Tamper seal intact. Nobody touched the GPS hardware. Physical inspection defense.'],
      spouse_keys: ['Spouse confirms keys on nightstand. Matrimonial alibi. Cozy.'],
      sleepwalk_claim: ['Sleepwalking to the shed. Unconscious lawn care. A convenient memory gap.'],
      power_reset: ['Power surge factory reset. The spiral as test pattern. Technical explanation.'],
      neighbor_app: ['Neighbor app cross-linked. Smart home mishap. Blaming the network.'],
    },
    sequences: {
      'firmware_check→gps_antenna_seal': ['Firmware shows GPS-lock, antenna confirms no bypass. Technical double-down.'],
      'firmware_check→spouse_keys': ['Firmware diagnostic, then spouse testimony. Logs and loved ones. Covering angles.'],
      'firmware_check→sleepwalk_claim': ['GPS-lock was engaged, but you sleepwalked? Contradictory threads emerging.'],
      'firmware_check→power_reset': ['Firmware shows GPS-lock, then power surge explanation. Pick a narrative.'],
      'firmware_check→neighbor_app': ['GPS-lock confirmed, now blaming the neighbor. The mower had multiple problems apparently.'],
      'gps_antenna_seal→firmware_check': ['Antenna seal first, firmware second. Physical then digital. Methodical.'],
      'gps_antenna_seal→spouse_keys': ['Antenna untouched, keys accounted for. No tampering, no access. Tidy.'],
      'gps_antenna_seal→sleepwalk_claim': ['GPS hardware sealed, but you sleepwalked there anyway? Interesting sequence.'],
      'gps_antenna_seal→power_reset': ['Antenna intact, blaming power surge. Hardware fine but software glitched. Selective.'],
      'gps_antenna_seal→neighbor_app': ['Antenna sealed, neighbor blamed. Local hardware fine, remote access suspect.'],
      'spouse_keys→firmware_check': ['Keys witnessed, firmware verified. Testimony backed by technology.'],
      'spouse_keys→gps_antenna_seal': ['Spouse saw the keys, you checked the seal. Building a narrative together.'],
      'spouse_keys→sleepwalk_claim': ['Keys on nightstand but you sleepwalked? Did you not need them?'],
      'spouse_keys→power_reset': ['Keys accounted for, power surged. Manual access out, automated glitch in.'],
      'spouse_keys→neighbor_app': ['Spouse confirms keys, now blaming neighbor app. Wasn\'t you, wasn\'t local.'],
      'sleepwalk_claim→firmware_check': ['Sleepwalked first, now checking firmware? The unconscious you cares about GPS locks.'],
      'sleepwalk_claim→gps_antenna_seal': ['Sleepwalking confession, then antenna inspection. Covering for your nocturnal self.'],
      'sleepwalk_claim→spouse_keys': ['You sleepwalked, but keys were on the nightstand. Did sleepwalking-you not need them?'],
      'sleepwalk_claim→power_reset': ['Sleepwalked AND power surge? Two explanations for one spiral.'],
      'sleepwalk_claim→neighbor_app': ['You sleepwalked but also the neighbor did it? Redundant blame.'],
      'power_reset→firmware_check': ['Power surge theory, now firmware check. Testing if your story holds.'],
      'power_reset→gps_antenna_seal': ['Power reset claimed, antenna verified. Software glitch, hardware intact. Specific.'],
      'power_reset→spouse_keys': ['Power surge explanation, spouse alibi. Automated cause, witnessed innocence.'],
      'power_reset→sleepwalk_claim': ['Power surge AND sleepwalking? One cause would suffice.'],
      'power_reset→neighbor_app': ['Power surge, then neighbor app. Multiple malfunctions. Busy night for glitches.'],
      'neighbor_app→firmware_check': ['Neighbor blamed, now firmware verified. Remote trigger, local safety. Interesting combination.'],
      'neighbor_app→gps_antenna_seal': ['Neighbor app accused, antenna checked. Someone else\'s fault, your hardware fine.'],
      'neighbor_app→spouse_keys': ['Neighbor triggered it, spouse confirms keys. External cause, internal alibi.'],
      'neighbor_app→sleepwalk_claim': ['Neighbor app AND sleepwalking? The mower had a lot of start commands apparently.'],
      'neighbor_app→power_reset': ['Neighbor app, then power surge. Two different automated failures. Coincidental.'],
    },
    storyCompletions: {
      all_digital: ['All digital sources. Firmware and logs building your defense. Processing.'],
      all_sensor: ['Sensor data only. The machines are testifying. Verifying.'],
      all_testimony: ['Human accounts exclusively. Witnesses have stories. Cross-checking.'],
      all_physical: ['Physical inspection throughout. Hardware-based defense. Examining.'],
      digital_heavy: ['Mostly digital. Logs and firmware dominate. Running verification.'],
      sensor_heavy: ['Sensor-focused defense. Data from devices. Analyzing readings.'],
      testimony_heavy: ['Heavy on testimony. Human witnesses lead. Checking alibis.'],
      physical_heavy: ['Physical inspection leads. Tangible proof preferred. Reviewing.'],
      mixed_strong: ['Technical and testimonial combined. Multiple angles. Triangulating.'],
      mixed_varied: ['Different source types. Varied approach to the spiral incident. Correlating.'],
    },
    objectionPrompt: {
      firmware_check: ['Firmware shows GPS-lock engaged overnight. Confident in this diagnostic?'],
      gps_antenna_seal: ['Tamper seal intact. No hardware bypass. Final answer on the antenna?'],
      spouse_keys: ['Spouse confirms shed keys on nightstand all night. Standing by this testimony?'],
      sleepwalk_claim: ['Sleepwalked to the shed and pressed start. Committing to this explanation?'],
      power_reset: ['Power surge triggered factory reset and test pattern. Sure about this?'],
      neighbor_app: ['Neighbor app cross-linked and sent the command. Confident?'],
    },
    objectionStoodTruth: {
      firmware_check: ['Firmware diagnostic verified. GPS-lock safety was indeed engaged. Timestamp confirmed.'],
      gps_antenna_seal: ['Tamper seal authenticated. Factory seal intact. No GPS bypass attempted.'],
      spouse_keys: ['Spouse testimony corroborated. Keys remained on nightstand. Shed access would require them.'],
    },
    objectionStoodLie: {
      sleepwalk_claim: ['Sleepwalked to the shed, you say. But the shed door sensor logged no entry overnight. The door never opened. Sleepwalking through walls isn\'t a feature.'],
      power_reset: ['Power surge factory reset. But GPS calibration is still required after any reset. Takes two minutes. Calibration log shows nothing. No calibration, no start.'],
      neighbor_app: ['Neighbor app sent the command. But any start command requires GPS calibration first. No calibration happened between 8 PM and 6 AM. Commands without calibration go nowhere.'],
    },
    objectionWithdrew: {
      firmware_check: ['Firmware diagnostic withdrawn. Reconsidering the GPS-lock status?'],
      gps_antenna_seal: ['Antenna seal pulled back. Hardware tampering back on the table?'],
      spouse_keys: ['Spouse testimony removed. Key location uncertain now.'],
      sleepwalk_claim: ['Sleepwalking story dropped. Waking up to reality?'],
      power_reset: ['Power surge theory withdrawn. The grid behaved after all?'],
      neighbor_app: ['Neighbor app blame retracted. Their wifi is innocent again.'],
    },
    liesRevealed: {
      sleepwalk_claim: ['Sleepwalked to the shed. But the shed door sensor shows no entry overnight. You can\'t press a button through a locked door, awake or asleep.'],
      power_reset: ['Power surge factory reset. But even after reset, GPS calibration is required. Two minutes minimum. Log shows no calibration. The mower couldn\'t start.'],
      neighbor_app: ['Neighbor app triggered it remotely. But any start command still requires GPS calibration first. No calibration logged. The command had nowhere to go.'],
      multiple: ['Multiple explanations that the logs contradict. GPS calibration is required. None happened. Your stories have a common problem.'],
      all: ['Sleepwalking through locked doors. Power surges that skip calibration requirements. Remote commands to systems that need GPS first. The facts disagree with all of it.'],
    },
  },

  epilogue: `It was a raccoon. The mower's motion sensor interpreted aggressive lawn-crossing as a "follow the moving object" command left over from a beta test. The raccoon's path was a perfect spiral because it was chasing a moth. KOA has removed the experimental wildlife-tracking firmware. The HOA has been notified to blame nature.`
};

export default PUZZLE_MOWER;
