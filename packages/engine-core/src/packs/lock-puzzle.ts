/**
 * Generated Puzzle: The 2 AM Unlock
 *
 * 7-MINUTE DESIGN (2 relational + 1 inferential):
 *   - Lie A (key_fob): RELATIONAL - Fob claim + charging station fact + dashboard verification
 *   - Lie B (guest_code): RELATIONAL - Guest code + disabled codes + camera shows no one
 *   - Lie C (geofence_unlock): INFERENTIAL - Auto-unlock requires leaving geofence (phone never moved)
 *
 *   Anchor truth: security_camera (clearly safe, matches no-one-entered observation)
 *
 * FIXED STRENGTHS:
 *   Truths: 3, 3, 4 (security_camera=4, dog_sensor=3, partner_testimony=3)
 *   Lies: 3, 4, 5 (key_fob=3, geofence_unlock=4, guest_code=5)
 *
 * TYPE DISTRIBUTION (4 types, max 2 each):
 *   SENSOR: 2 (security_camera, dog_sensor)
 *   DIGITAL: 2 (geofence_unlock, guest_code)
 *   TESTIMONY: 1 (partner_testimony)
 *   PHYSICAL: 1 (key_fob)
 *
 * BALANCE:
 *   Truths: security_camera(4) + dog_sensor(3) + partner_testimony(3) = 10
 *   All 3 truths: 50 + 10 + 2 (objection) = 62 -> FLAWLESS
 *   Target: 57 -> Margin of 5 points
 *
 *   Lies: guest_code(5) + geofence_unlock(4) + key_fob(3) = 12
 *   1 lie case (best 2 truths + weakest lie):
 *     50 + 7 (security_camera + dog_sensor) - 2 (key_fob penalty) + 2 (objection) = 57 (CLOSE)
 *   2 lies case: 50 + 4 - 4 - 2 + 2 = 50 (BUSTED)
 *   3 lies case: 50 - 4 - 3 - 2 = 41 (BUSTED)
 *
 *   Random win rate: C(3,3)/C(6,3) = 1/20 = 5%
 *
 * v1 LITE AXIS DESIGN:
 *   Truths: factTouch {1, 2, 3} partition (each truth addresses one fact)
 *   SignalRoots: camera_storage, device_firmware, human_partner (diverse)
 *   Concern scenario: If player picks guest_code + geofence_unlock on T1/T2,
 *     triggers "same_system" concern (both digital/phone-adjacent)
 *   P4+ Constraint: Dodging the digital concern still leaves key_fob (coverage trap)
 */

import type { V5Puzzle, Card } from '../types/v5/index.js';

/**
 * Helper to create a CardId-typed card.
 */
function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

/**
 * The 2 AM Unlock
 *
 * Scenario: Smart lock unlocked at 2:14 AM. Nobody claims to have opened it.
 * Nothing is missing, but KOA wants answers before restoring exterior access.
 */
export const PUZZLE_LOCK_UNLOCK: V5Puzzle = {
  slug: 'lock-unlock',
  name: 'The 2 AM Unlock',

  scenario: `2:14 AM. Your smart lock unlocked. Nobody came in. Nothing's missing. KOA has locked exterior access until you explain who — or what — opened the door.`,

  // Mini: exactly 3 facts, each catches one lie (1:1 mapping)
  knownFacts: [
    'All key fobs were in the charging station overnight (dashboard confirmed)',
    'Guest access codes have been disabled for 6 months',
    'Phone GPS logged bedroom location from 11 PM to 7 AM continuously',
  ],

  openingLine: `Your front door. 2:14 AM. Smart lock disengaged.
Nobody entered. Nobody exited. Just... unlocked.
Someone triggered this. Let's find out who.`,

  target: 57,

  cards: [
    // TRUTHS (3)
    card({
      id: 'security_camera',
      strength: 4,
      evidenceType: 'SENSOR',
      location: 'EXTERIOR',
      time: '', // Mini: no time displayed
      claim: 'Doorbell camera recorded nothing at 2:14 AM — no person, no motion.',
      presentLine: "Check the doorbell camera. It was recording all night. At 2:14? Nothing. No person, no shadow, no cat. The door just... clicked open. For nobody.",
      isLie: false,
      source: 'Doorbell Camera',
      // v1 Lite tags
      factTouch: 2, // Supports fact 2: no guest entered (camera confirms)
      signalRoot: 'camera_storage',
      controlPath: 'automation',
      claimShape: 'absence',
      subsystem: 'lock',
    }),
    card({
      id: 'dog_sensor',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'LIVING_ROOM',
      time: '', // Mini: no time displayed
      claim: 'Pet motion sensor shows dog stayed in living room all night.',
      presentLine: "Our dog has a motion tracker. He didn't budge from his bed all night. If someone came in, he would've lost his mind. He's... not subtle.",
      isLie: false,
      source: 'Pet Tracker',
      // v1 Lite tags
      factTouch: 1, // Supports fact 1: no one used a fob (dog would react)
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'absence',
      subsystem: 'lock',
    }),
    card({
      id: 'partner_testimony',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'BEDROOM',
      time: '', // Mini: no time displayed
      claim: 'Partner was awake reading — confirms you never left bed.',
      presentLine: "My partner couldn't sleep. They were reading until 3 AM. If I'd gotten up, they would've noticed. They're a light sleeper and I'm not quiet.",
      isLie: false,
      source: 'Partner',
      // v1 Lite tags
      factTouch: 3, // Supports fact 3: phone never left bedroom (you didn't either)
      signalRoot: 'human_partner',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'lock',
    }),
    // LIES (3) - 2 relational + 1 inferential
    card({
      id: 'key_fob',
      strength: 3,
      evidenceType: 'PHYSICAL',
      location: 'EXTERIOR',
      time: '', // Mini: no time displayed
      claim: 'Lock log shows key fob proximity unlock at 2:14 AM.',
      presentLine: "The lock says a key fob triggered it. Maybe someone walked past with their fob? Sometimes proximity unlocks are... generous.",
      isLie: true,
      source: 'Lock Log',
      // v1 Lite tags
      factTouch: 1, // Contradicts fact 1: all fobs were charging
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'attribution',
      subsystem: 'lock',
    }),
    card({
      id: 'geofence_unlock',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'BEDROOM',
      time: '', // Mini: no time displayed
      claim: 'Smart home log shows geofence auto-unlock triggered.',
      presentLine: "The smart home thought I was arriving home. Geofence trigger. Maybe GPS glitched? Satellites are... imperfect.",
      isLie: true,
      source: 'Smart Home Log',
      // v1 Lite tags
      factTouch: 3, // Contradicts fact 3: phone GPS was stationary in bedroom
      signalRoot: 'koa_cloud',
      controlPath: 'automation',
      claimShape: 'attribution',
      subsystem: 'lock',
    }),
    card({
      id: 'guest_code',
      strength: 5,
      evidenceType: 'DIGITAL',
      location: 'EXTERIOR',
      time: '', // Mini: no time displayed
      claim: 'Lock shows guest code entry at 2:14 AM.',
      presentLine: "Someone used a guest code. Must be an old one we forgot to delete. Family members have codes. Maybe someone stopped by and... left without coming in?",
      isLie: true,
      source: 'Lock Access Log',
      // v1 Lite tags
      factTouch: 2, // Contradicts fact 2: guest codes disabled for 6 months
      signalRoot: 'device_firmware',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'lock',
    }),
  ],

  // Lies: 2 relational + 1 inferential (per spec)
  lies: [
    {
      cardId: 'key_fob',
      lieType: 'relational', // Requires combining fob claim with dashboard + charging station fact
      inferenceDepth: 2,
      reason: 'All key fobs were confirmed in the charging station. A fob proximity unlock requires a fob near the door — impossible if all fobs were inside charging.',
      // v1 Lite trap fields
      trapAxis: 'coverage',
      baitReason: 'Physical evidence from the lock itself seems authoritative and covers the proximity unlock angle.',
    },
    {
      cardId: 'geofence_unlock',
      lieType: 'inferential', // GPS was stationary, geofence requires leaving/entering zone
      inferenceDepth: 1,
      reason: 'Phone GPS logged bedroom location continuously from 11 PM to 7 AM. Geofence auto-unlock requires crossing the boundary — impossible with stationary phone.',
      // v1 Lite trap fields
      trapAxis: 'independence',
      baitReason: 'Offers smart home automation explanation that shifts blame to system behavior.',
    },
    {
      cardId: 'guest_code',
      lieType: 'relational', // Requires combining disabled codes + camera showing no one
      inferenceDepth: 2,
      reason: 'Guest codes have been disabled for 6 months AND security camera showed no one at the door. Both facts must be combined to catch this.',
      // v1 Lite trap fields
      trapAxis: 'claim_shape',
      baitReason: 'High strength card with positive claim that offers simple explanation — someone used a code.',
    },
  ],

  verdicts: {
    flawless: "Camera saw nothing. Dog slept through. Partner confirms you were unconscious. It was a glitch. A spooky, 2 AM glitch. Access restored.",
    cleared: "Your story holds. The lock malfunctioned. Probably. I've logged this as 'unexplained' and restored access. I'm still watching.",
    close: "Almost convincing. But something triggered that lock. And your explanation has gaps. Access denied.",
    busted: "Your sources contradict the logs. Someone opened that door. And your story is full of holes. Access denied.",
  },

  koaBarks: {
    // Turn 1: Opening card reactions (6 cards)
    cardPlayed: {
      security_camera: [
        "Camera saw nothing at 2:14. No person. No animal. Just an empty porch. Helpful and eerie.",
      ],
      dog_sensor: [
        "The dog didn't move. Didn't bark. If someone entered, he'd know. Dogs know things.",
      ],
      partner_testimony: [
        "Partner was awake. Reading. They noticed nothing unusual. Except you snoring, probably.",
      ],
      key_fob: [
        "Fob proximity unlock. Someone's fob was at the door. At 2 AM. Whose fob, exactly?",
      ],
      geofence_unlock: [
        "Geofence triggered. The house thought you arrived home. While you were... already home. GPS is fun.",
      ],
      guest_code: [
        "Guest code at 2:14 AM. Someone typed it in. At your door. In the middle of the night. Who has your codes?",
      ],
    },

    // Turn 2: Sequence reactions (30 combinations)
    sequences: {
      // security_camera → others
      'security_camera→dog_sensor': [
        "Camera saw nothing. Dog heard nothing. Two sources agreeing on absence. Peaceful night.",
      ],
      'security_camera→partner_testimony': [
        "Camera empty, partner awake. Digital and human both report nothing. Consistent.",
      ],
      'security_camera→key_fob': [
        "Camera saw no one. But a fob was there? Invisible fobs. That's new.",
      ],
      'security_camera→geofence_unlock': [
        "Empty doorbell footage, but geofence triggered. Your phone arrived without you?",
      ],
      'security_camera→guest_code': [
        "Camera shows empty porch. Someone typed a guest code... where? In the void?",
      ],

      // dog_sensor → others
      'dog_sensor→security_camera': [
        "Dog stayed put. Camera confirms nothing to see. Your house was very quiet.",
      ],
      'dog_sensor→partner_testimony': [
        "Dog calm, partner awake. Both noticed nothing. Either nothing happened or everyone's oblivious.",
      ],
      'dog_sensor→key_fob': [
        "Dog didn't react. But a fob triggered the lock. Dogs notice things. Usually.",
      ],
      'dog_sensor→geofence_unlock': [
        "Calm dog, geofence trigger. The house thought someone arrived. The dog disagreed.",
      ],
      'dog_sensor→guest_code': [
        "Dog stayed asleep. Someone used a code. Your dog has selective hearing?",
      ],

      // partner_testimony → others
      'partner_testimony→security_camera': [
        "Partner saw nothing. Camera saw nothing. Two blind spots or one empty night?",
      ],
      'partner_testimony→dog_sensor': [
        "Partner awake, dog asleep. Human and animal witnesses. Thorough approach.",
      ],
      'partner_testimony→key_fob': [
        "Partner was awake. Didn't see you leave. But your fob was at the door?",
      ],
      'partner_testimony→geofence_unlock': [
        "Partner confirms you were in bed. Geofence says you arrived. Contradictory timelines.",
      ],
      'partner_testimony→guest_code': [
        "Partner reading until 3 AM. Didn't hear the door? Guest codes are noisy.",
      ],

      // key_fob → others
      'key_fob→security_camera': [
        "Fob triggered the lock. Camera shows nobody. Ghost with a key fob?",
      ],
      'key_fob→dog_sensor': [
        "Fob proximity event. Dog didn't stir. Dogs notice strangers. Allegedly.",
      ],
      'key_fob→partner_testimony': [
        "Fob at the door. Partner says you were in bed. Whose fob, then?",
      ],
      'key_fob→geofence_unlock': [
        "Fob AND geofence? Two unlock methods for one event. Redundant triggering.",
      ],
      'key_fob→guest_code': [
        "Fob first, now guest code. Multiple access methods. Busy door.",
      ],

      // geofence_unlock → others
      'geofence_unlock→security_camera': [
        "Geofence says arrival. Camera says empty. You arrived... invisibly?",
      ],
      'geofence_unlock→dog_sensor': [
        "Geofence triggered. Dog didn't notice. Either GPS lied or the dog is compromised.",
      ],
      'geofence_unlock→partner_testimony': [
        "Geofence thinks you arrived. Partner says you never left. Someone's wrong.",
      ],
      'geofence_unlock→key_fob': [
        "Geofence AND fob? Two triggers. Your lock was very motivated to open.",
      ],
      'geofence_unlock→guest_code': [
        "Auto-unlock and guest code. Belt and suspenders. For a door that just opened.",
      ],

      // guest_code → others
      'guest_code→security_camera': [
        "Guest code entered. Camera shows no guest. Invisible visitors now?",
      ],
      'guest_code→dog_sensor': [
        "Guest code used. Dog slept through. Either silent guest or no guest.",
      ],
      'guest_code→partner_testimony': [
        "Someone used a code. Partner was awake. They didn't notice?",
      ],
      'guest_code→key_fob': [
        "Guest code, then fob. Two unlock methods. Your door had options.",
      ],
      'guest_code→geofence_unlock': [
        "Code entry and geofence. Whoever came had your codes AND your location. Concerning.",
      ],
    },

    // Turn 3: Story completion patterns (closing-energy only)
    storyCompletions: {
      // All same type (3 of 3)
      all_digital: [
        "All digital sources. Alright. Let me cross-reference.",
      ],
      all_sensor: [
        "Three sensors. The house has opinions. Processing.",
      ],
      all_testimony: [
        "Human witnesses only. Old school. One moment.",
      ],
      all_physical: [
        "Physical sources. Tangible approach. Checking.",
      ],
      // Two of one type (2 of 3)
      digital_heavy: [
        "Mostly digital. Okay. Running verification.",
      ],
      sensor_heavy: [
        "Sensor-forward story. The devices are talking. I'm listening.",
      ],
      testimony_heavy: [
        "Human-heavy approach. Let me compare notes.",
      ],
      physical_heavy: [
        "Physical evidence emphasis. Checking against logs.",
      ],
      // All different types
      mixed_strong: [
        "Varied sources. Harder to dismiss. Stand by.",
      ],
      mixed_varied: [
        "Different angles. Let me triangulate.",
      ],
    },

    // Objection prompts
    objectionPrompt: {
      security_camera: ["Camera saw nothing at 2:14. An empty porch. Standing by that?"],
      dog_sensor: ["The dog didn't react. No barking, no movement. Final answer?"],
      partner_testimony: ["Partner was awake reading. They vouch for you. Confirm?"],
      key_fob: ["Key fob proximity unlock. Someone's fob was at the door. Sure?"],
      geofence_unlock: ["Geofence triggered auto-unlock. GPS said you arrived. Standing by this?"],
      guest_code: ["Guest code entry. Someone typed your code. Want to commit?"],
    },

    // Objection responses - stood by truth
    objectionStoodTruth: {
      security_camera: ["Camera confirms empty porch. No visitors. The lock opened for nothing."],
      dog_sensor: ["Pet tracker shows a calm dog. No intruder reaction. Your guard dog vouches."],
      partner_testimony: ["Partner was reading. They confirm you were horizontal. Insomniac alibi accepted."],
    },

    // Objection responses - stood by lie
    objectionStoodLie: {
      key_fob: ["Fob proximity unlock. But all fobs were in the charging station. Dashboard confirmed. No fob was at that door."],
      geofence_unlock: ["Geofence trigger. But GPS shows your phone never left the bedroom. From 11 PM to 7 AM. You didn't cross any boundary."],
      guest_code: ["Guest code entry. But guest codes have been disabled for 6 months. Check your settings. That code doesn't exist."],
    },

    // Objection responses - withdrew
    objectionWithdrew: {
      security_camera: ["Withdrawing the camera footage. What's really on that recording?"],
      dog_sensor: ["Dog testimony gone. Did he bark after all?"],
      partner_testimony: ["Partner story withdrawn. Were they really awake?"],
      key_fob: ["Fob theory dropped. Good instinct. Those fobs were accounted for."],
      geofence_unlock: ["Geofence explanation withdrawn. Your GPS was suspiciously stationary anyway."],
      guest_code: ["Guest code story gone. Smart. Those codes have been dead for months."],
    },

    // Lies revealed at end
    liesRevealed: {
      key_fob: ["Fob proximity unlock at 2:14. But all fobs were charging. Dashboard confirmed. No fob was anywhere near that door."],
      geofence_unlock: ["Geofence auto-unlock. But your phone GPS was stationary in the bedroom. All night. You can't trigger arrival without leaving."],
      guest_code: ["Guest code entry. But guest codes have been disabled for six months. That code doesn't exist. Neither does your story."],
      multiple: ["Two explanations. Both impossible. Your door has trust issues now."],
      all: ["Three lock triggers. All fabricated. The door opened somehow. But not like you claimed."],
    },
  },

  // Optional epilogue
  epilogue: "It was a firmware update. The lock rebooted at 2:14 AM, briefly unlocking during restart. A known bug in version 3.2.1. KOA has flagged this for manufacturer review and added 'random 2 AM unlock' to its growing list of smart home complaints.",
};

export default PUZZLE_LOCK_UNLOCK;
