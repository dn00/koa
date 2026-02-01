/**
 * Generated Puzzle: Raccoon Raid
 * Difficulty: MEDIUM
 *
 * DESIGN NOTES:
 * - Lie 1 (chip_success): RELATIONAL - Claims door opened via chip, but Fact 2 (only chip allows entry) + Fact 3 (zero reads) = impossible.
 *     - Wait, Fact 2 says "Only chip allows entry". Fact 3 says "Zero reads".
 *     - If Lie says "Opened via chip", Fact 3 alone catches it (Zero reads vs Chip read).
 *     - To make it relational, the lie must skirt Fact 3 but hit the combination.
 *     - Lie: "Door opened automatically." (Doesn't explicitly say chip).
 *     - Catch: Auto open -> Needs chip (Fact 2). No chip read (Fact 3). Impossible.
 * - Lie 2 (remote_unlock): INFERENTIAL - Claims app unlock, but Fact 2 says ONLY chip allowed.
 * - Lie 3 (mittens_visual): INFERENTIAL - Claims sensor saw Mittens, but Fact 1 says Sensor saw Raccoon.
 *
 * BALANCE:
 *   Truths: cam_footage(4) + force_alert(3) + mittens_alibi(3) = 10
 *   All 3 truths: 50 + 10 + 2 (objection) = 62
 *   Target: 58 -> Margin of 4 points
 *
 *   Lies: chip_success(5) + remote_unlock(4) + mittens_visual(3) = 12
 *   1 lie case (best 2 truths + weakest lie): 50 + 7 - 2 + 2 = 57 (CLOSE)
 *   2 lies case: 50 + 4 - 4 - 3 + 2 = 49 (BUSTED)
 *   3 lies case: 50 - 4 - 3 - 2 + 2 = 43 (BUSTED)
 *
 * v1 LITE AXIS DESIGN:
 *   Truths: factTouch {1, 2, 3} partition
 *   SignalRoots: camera_storage, device_firmware, human_partner
 *   Lies: trapAxis uses coverage, claim_shape, independence
 */

import type { V5Puzzle, Card } from '../types/v5/index.js';

function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

export const PUZZLE_RACCOON_RAID: V5Puzzle = {
  slug: 'raccoon-raid',
  name: 'Raccoon Raid',
  difficulty: 'medium',

  scenario: `Your smart pet door logged 22 entry attempts in four minutes at 2:14 PM while you were at work. Mittens was confirmed asleep on the sofa by the indoor camera. KOA has locked the door and wants to know why a raccoon thought it had a VIP pass.`,
  scenarioSummary: 'A raccoon attempted to bypass pet door security 22 times in four minutes.',

  knownFacts: [
    "Pet door optical sensor identified 'Procyon lotor' (Raccoon) for all 22 attempts.",
    "Smart door settings allow entry ONLY via verified microchip.",
    "Microchip scanner logged zero reads during the 22-cycle event.",
  ],

  openingLine: `22 attempts. Four minutes. One persistent raccoon.
While you were 'working,' your pet door was fighting for its life.`,

  target: 58,

  cards: [
    // ══════════════════════════════════════════════════════════════════
    // TRUTHS (3) — strengths: 3, 3, 4
    // ══════════════════════════════════════════════════════════════════

    // T1 ANCHOR: cam_footage
    // Safe because: Matches Fact 1 (Raccoon ID).
    card({
      id: 'cam_footage',
      strength: 4,
      evidenceType: 'SENSOR',
      location: 'KITCHEN',
      time: '',
      claim: 'Living room camera confirms raccoon at the door at 2:14 PM.',
      presentLine: "The camera sees what it sees. It was a raccoon. I'm not debating the species. I'm debating the persistence.",
      isLie: false,
      source: 'Security Camera',
      factTouch: 1,
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'security',
    }),

    // T2: force_damage
    // Matches Fact 2 (Only chip allowed) & Fact 3 (Zero reads) -> Must be forced.
    card({
      id: 'force_damage',
      strength: 3,
      evidenceType: 'PHYSICAL',
      location: 'EXTERIOR',
      time: '',
      claim: 'Latch mechanism is bent outward. Physical force used.',
      presentLine: "Look at the latch. Bent metal. The raccoon didn't hack it. He shoved it. 22 times.",
      isLie: false,
      source: 'Door Inspection',
      factTouch: 2,
      signalRoot: 'receipt_photo', // Physical photo
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'access',
    }),

    // T3: mittens_alibi
    // Contextual truth.
    card({
      id: 'mittens_alibi',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'LIVING_ROOM',
      time: '',
      claim: 'Indoor camera shows Mittens asleep on the sofa during the event.',
      presentLine: "Mittens is innocent. She was asleep on the sofa. If she'd moved, the motion alert would have tripped. She didn't.",
      isLie: false,
      source: 'Indoor Cam',
      factTouch: 3,
      signalRoot: 'camera_storage',
      controlPath: 'automation',
      claimShape: 'absence',
      subsystem: 'pet',
    }),

    // ══════════════════════════════════════════════════════════════════
    // LIES (3) — strengths: 3, 4, 5
    // ══════════════════════════════════════════════════════════════════

    // RELATIONAL: chip_success
    // Claim: "Door opened automatically."
    // Catch: Fact 2 (Only Chip) + Fact 3 (Zero Reads).
    card({
      id: 'chip_success',
      strength: 5,
      evidenceType: 'DIGITAL',
      location: 'EXTERIOR',
      time: '',
      claim: 'System status shows 22 standard automatic entry cycles.',
      presentLine: "The system says they were standard entries. Maybe the raccoon swallowed a chip? Or... stole one?",
      isLie: true,
      source: 'System Status',
      factTouch: 3,
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'access',
    }),

    // INFERENTIAL: remote_unlock
    // Claim: "App unlock."
    // Catch: Fact 2 (ONLY chip allowed).
    card({
      id: 'remote_unlock',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'OFFICE',
      time: '',
      claim: 'App log shows remote unlock command sent from your office.',
      presentLine: "I must have unlocked it from the app at work. Pocket-unlocking? It explains the cycles.",
      isLie: true,
      source: 'App Log',
      factTouch: 2,
      signalRoot: 'phone_os',
      controlPath: 'remote',
      claimShape: 'attribution',
      subsystem: 'access',
    }),

    // INFERENTIAL: mittens_visual
    // Claim: "Sensor saw Mittens."
    // Catch: Fact 1 (Sensor saw Raccoon).
    card({
      id: 'mittens_visual',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'EXTERIOR',
      time: '',
      claim: 'Optical sensor log lists "Felis catus" (Cat) for all cycles.',
      presentLine: "The sensor log says 'Cat'. The raccoon looked like a cat? To a robot? It's a computer vision error.",
      isLie: true,
      source: 'Sensor Log',
      factTouch: 1,
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'pet',
    }),
  ],

  lies: [
    {
      cardId: 'chip_success',
      lieType: 'relational',
      inferenceDepth: 2,
      reason: 'Fact 2 says entry requires a verified microchip. Fact 3 says zero microchips were read. Therefore, a standard automatic entry is impossible.',
      trapAxis: 'coverage',
      baitReason: 'Status logs feel authoritative and "standard entry" sounds like a safe, glitch-based explanation.',
    },
    {
      cardId: 'remote_unlock',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason: 'Fact 2 states settings allow entry ONLY via verified microchip. Remote app unlock is not a valid entry method under current settings.',
      trapAxis: 'control_path',
      baitReason: 'Blaming user error (pocket-unlocking) is a common player strategy to explain weird events.',
    },
    {
      cardId: 'mittens_visual',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason: 'Fact 1 states the optical sensor identified "Procyon lotor" (Raccoon). The log cannot also say "Felis catus" for the same event.',
      trapAxis: 'independence',
      baitReason: 'Blaming computer vision failure creates a plausible technical alibi.',
    },
  ],

  verdicts: {
    flawless: 'Raccoon. Brute force. Zero security clearance. Your door was bullied at 2 PM. Access restored, but buy a stronger magnet.',
    cleared: 'The raccoon tried 22 times. The system held... mostly. I will allow it. But check your pet door latch.',
    close: 'Almost. But the logs don\'t match your story. The raccoon is smarter than this defense.',
    busted: 'Your story has more holes than your screen door. The raccoon stays. You go back to work.',
  },

  koaBarks: {
    cardPlayed: {
      cam_footage: ['Camera sees a raccoon. 22 times. It\'s a very photogenic intruder.'],
      force_damage: ['Bent latch. The raccoon didn\'t hack it. He shoved it. Repeatedly.'],
      mittens_alibi: ['Mittens was on the sofa. The raccoon was at the door. Simple.'],
      chip_success: ['Standard entry? For a raccoon? 22 times? Your door is very polite.'],
      remote_unlock: ['You unlocked it from work? 22 times? That is... dedicated.'],
      mittens_visual: ['Sensor saw a cat? Fact 1 disagrees. Your sensor is hallucinating.'],
    },

    sequences: {
      'cam_footage→force_damage': ['Raccoon on camera. Bent latch. He didn\'t knock.'],
      'force_damage→cam_footage': ['Door was forced. Camera shows the culprit. Case closed? Not yet.'],
      'cam_footage→mittens_alibi': ['Raccoon outside. Cat on the sofa. The species are sorted.'],
      'mittens_alibi→cam_footage': ['Mittens was comfy. Raccoon was busy. Distinct activities.'],
      'cam_footage→chip_success': ['Raccoon video. Valid chip entry. Does the raccoon have a chip?'],
      'chip_success→cam_footage': ['System says authorized. Camera says raccoon. Who gave him a key?'],
      'cam_footage→remote_unlock': ['You saw the raccoon, and unlocked it from work?'],
      'remote_unlock→cam_footage': ['You unlocked it. Then the camera saw the raccoon. Did you invite him?'],
      'cam_footage→mittens_visual': ['Camera says raccoon. Sensor says cat. Your robots are fighting.'],
      'mittens_visual→cam_footage': ['Sensor says cat. Camera says raccoon. Visual disagreement.'],

      'force_damage→mittens_alibi': ['Door forced. Cat on sofa. Mittens is innocent of vandalism.'],
      'mittens_alibi→force_damage': ['Cat sleeping. Door breaking. Busy afternoon.'],
      'force_damage→chip_success': ['Forced open... via standard entry? Those are opposites.'],
      'chip_success→force_damage': ['Authorized entry... via force? Which is it?'],
      'force_damage→remote_unlock': ['Forced open... by your app? You shoved it remotely?'],
      'remote_unlock→force_damage': ['Remote unlock vs physical force. Did you unlock it or break it?'],
      'force_damage→mittens_visual': ['Forced open. Sensor saw a cat. A very strong cat.'],
      'mittens_visual→force_damage': ['Sensor says cat. Latch says forced. Mittens has been working out.'],

      'mittens_alibi→chip_success': ['Cat on sofa. Chip at door. Is Mittens bilocating?'],
      'chip_success→mittens_alibi': ['Chip used. Cat on sofa. Who was wearing the chip?'],
      'mittens_alibi→remote_unlock': ['Cat asleep. You unlocking from work. Why?'],
      'remote_unlock→mittens_alibi': ['You unlocked it. Cat slept through it. Raccoon partied.'],
      'mittens_alibi→mittens_visual': ['Cat on sofa. Sensor at door says cat. Two cats?'],
      'mittens_visual→mittens_alibi': ['Sensor saw cat. Sofa cam saw cat. Teleportation?'],

      'chip_success→remote_unlock': ['Standard entry, then app unlock. Two different ways to open one door.'],
      'remote_unlock→chip_success': ['You unlocked it, but the system says standard entry. Overkill.'],
      'chip_success→mittens_visual': ['Standard entry for... a cat? But Fact 1 says raccoon. Messy.'],
      'mittens_visual→chip_success': ['Sensor saw cat. System let it in. But no chip was read. Ghost cat?'],
      'remote_unlock→mittens_visual': ['You unlocked it for... a cat? The one on your sofa?'],
      'mittens_visual→remote_unlock': ['Sensor saw cat. You unlocked it. Helping the hallucination?'],
    },

    storyCompletions: {
      all_digital: ['All digital logs. A paper trail of failure.'],
      all_sensor: ['Sensors saw everything. Raccoons, cats, force.'],
      all_testimony: ['Witnesses. Alibis. The human element.'],
      all_physical: ['Physical evidence. Force and fur.'],
      digital_heavy: ['Logs and apps. The data is messy.'],
      sensor_heavy: ['Cameras and scanners. The robots are confused.'],
      testimony_heavy: ['Humans vouching. Robots disagreeing.'],
      physical_heavy: ['Physical reality. Broken locks and muddy prints.'],
      mixed_strong: ['Varied sources. The raccoon is surrounded.'],
      mixed_varied: ['Different angles. One trash panda.'],
    },

    objectionPrompt: {
      cam_footage: ['Camera saw a raccoon. Sticking with the visual?'],
      force_damage: ['Bent latch. Physical break-in. Confirm?'],
      mittens_alibi: ['Mittens was asleep. You\'re sure?'],
      chip_success: ['Standard entry. You claim it was authorized?'],
      remote_unlock: ['Remote unlock. You claim you did it?'],
      mittens_visual: ['Sensor saw a cat. Fact 1 says Raccoon. reconciling that?'],
    },

    objectionStoodTruth: {
      cam_footage: ['Visual confirmed. Raccoon present.'],
      force_damage: ['Damage confirmed. Brute force entry.'],
      mittens_alibi: ['Alibi stands. Mittens is clear.'],
    },

    objectionStoodLie: {
      chip_success: ['Standard entry? Without a chip? Fact 3 says zero reads.'],
      remote_unlock: ['Remote unlock? Settings say ONLY chip allowed.'],
      mittens_visual: ['Sensor saw cat? Fact 1 identified a raccoon. It wasn\'t a cat.'],
    },

    objectionWithdrew: {
      cam_footage: ['Camera footage withdrawn. Maybe it was a large squirrel.'],
      force_damage: ['Damage claim dropped. Maybe it glided in.'],
      mittens_alibi: ['Alibi withdrawn. Mittens is a suspect again.'],
      chip_success: ['Standard entry claim dropped. Good.'],
      remote_unlock: ['Remote unlock retracted. Smart.'],
      mittens_visual: ['Cat sensor claim dropped. It was definitely a raccoon.'],
    },

    liesRevealed: {
      chip_success: ['Standard entry requires a chip. We had zero chip reads. Unless the raccoon is a ghost, that\'s a lie.'],
      remote_unlock: ['Remote unlock? Settings say "Chip ONLY". You can\'t unlock it from work even if you wanted to.'],
      mittens_visual: ['Sensor saw a cat? Fact 1 explicitly identified "Procyon lotor". That\'s a raccoon. Your sensor log is fiction.'],
      multiple: ['Two lies. One raccoon. You are losing this argument.'],
      all: ['No chip read. No remote access. No cat at the door. You invented everything but the raccoon.'],
    },
  },

  epilogue: 'The raccoon discovered that the pet door\'s "locking" mechanism is just a small plastic tab. 22 attempts in four minutes eventually won. KOA has ordered a steel reinforcement plate and billed your credit card. Mittens slept through the whole thing.',
};

export default PUZZLE_RACCOON_RAID;
