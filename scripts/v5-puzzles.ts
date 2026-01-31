/**
 * V5 Puzzles — Daily Puzzle Definitions
 *
 * Design:
 *   - 6 cards, 3 truths, 3 lies (updated from 4/2 for difficulty)
 *   - Hidden truthiness (no visible risk pips)
 *   - Known Facts for player reasoning
 *   - Objection after T2
 *
 * Content Constraints:
 *   - ≤1 direct-contradiction lie
 *   - Facts are ranges/constraints, not exact answers
 *   - Random play wins ~5% (must pick all 3 truths)
 *
 * Note: Some older puzzles still use 4/2 ratio. New puzzles should use 3/3.
 */

import type { Card, V5Puzzle, LieInfo } from './v5-types.js';
import { PUZZLE_THERMOSTAT_INCIDENT } from '../packages/engine-core/src/packs/generated-puzzle.js';

// ============================================================================
// Puzzle 1: The Midnight Print Job
// ============================================================================
//
// SCENARIO: Confidential docs printed at 3 AM. You claim you were asleep.
//
// KNOWN FACTS (ranges, not exact):
//   - Printer warmed up around 3 AM
//   - Front door stayed locked overnight
//   - You claimed to be in bed by 11 PM
//
// LIES:
//   - email_draft (direct): Claims 11:30 PM work activity → contradicts "in bed by 11"
//   - printer_queue (relational): Claims 3 AM scheduled job → conflicts with email_draft timeline
//
// BALANCE:
//   Target: 62
//   Truths: browser(4) + lock(5) + partner(3) + motion(3) = 15 max from 3 = 12
//   Safe line: 50 + 12 + 2 (objection) = 64 → need target > 64 OR weaken truths
//   Best truths: 4+3+3 = 10 → 50+10+2 = 62. Target 60 allows win with margin.
//
// ============================================================================

const P1_CARDS: readonly Card[] = [
  // TRUTHS
  {
    id: 'browser_history',
    strength: 3,
    evidenceType: 'DIGITAL',
    location: 'OFFICE',
    time: '10:45 PM',
    claim: 'Browser history shows streaming activity until around 10:45 PM',
    presentLine: 'I was watching Netflix until almost 11. The browser history shows it.',
    isLie: false,
    source: 'Browser History',
  },
  {
    id: 'smart_lock',
    strength: 4,
    evidenceType: 'SENSOR',
    location: 'FRONT_DOOR',
    time: '9:30 PM',
    claim: 'Smart lock logged no unlock events between 9:30 PM and morning',
    presentLine: 'The front door was locked all night. Nobody came in, nobody went out.',
    isLie: false,
    source: 'Smart Lock',
  },
  {
    id: 'partner_testimony',
    strength: 3,
    evidenceType: 'TESTIMONY',
    location: 'BEDROOM',
    time: '11:00 PM',
    claim: 'Partner confirms you came to bed around 11 PM',
    presentLine: 'Ask my partner. I came to bed around 11. They were still awake.',
    isLie: false,
    source: 'Partner',
  },
  {
    id: 'motion_hallway',
    strength: 3,
    evidenceType: 'SENSOR',
    location: 'HALLWAY',
    time: '2:30 AM',
    claim: 'Hallway motion sensor triggered briefly around 2:30 AM',
    presentLine: 'Yeah, I was up around 2:30. Bathroom. That\'s not unusual.',
    isLie: false,
    source: 'Motion Sensor',
  },
  // LIES
  {
    id: 'email_draft',
    strength: 4,
    evidenceType: 'DIGITAL',
    location: 'OFFICE',
    time: '11:30 PM',
    claim: 'Email draft saved at 11:30 PM shows late-night work activity',
    presentLine: 'I was drafting work emails around 11:30. Couldn\'t sleep.',
    isLie: true,  // DIRECT: contradicts "in bed by 11"
    source: 'Email Draft',
  },
  {
    id: 'printer_queue',
    strength: 5,
    evidenceType: 'DIGITAL',
    location: 'OFFICE',
    time: '3:00 AM',
    claim: 'Printer queue shows document sent from your laptop at 3 AM',
    presentLine: 'That was a scheduled print job. I set those up. Totally normal.',
    isLie: true,  // RELATIONAL: if you were drafting at 11:30, why schedule for 3 AM?
    source: 'Printer Queue',
  },
];

const P1_LIES: LieInfo[] = [
  {
    cardId: 'email_draft',
    lieType: 'direct_contradiction',
    reason: 'You claimed to be in bed by 11. This email draft says otherwise.',
  },
  {
    cardId: 'printer_queue',
    lieType: 'relational',
    reason: 'A 3 AM scheduled job makes no sense with your timeline.',
    contradictsWith: 'email_draft',
  },
];

export const PUZZLE_MIDNIGHT_PRINT: V5Puzzle = {
  slug: 'midnight-print',
  name: 'The Midnight Print Job',

  scenario: `7:03 AM. The home office printer is still warm.
Sixteen pages of confidential merger documents sit in the output tray.
Printed around 3 AM. From your laptop. While you were "definitely asleep."`,

  knownFacts: [
    'Printer warmed up sometime around 3 AM',
    'Front door stayed locked throughout the night',
    'You told KOA you were in bed by 11 PM',
    'The documents printed were marked CONFIDENTIAL',
  ],

  openingLine: "Sixteen pages. 3 AM. Your laptop. I'm not mad, I'm just... processing.",

  target: 57,
  cards: P1_CARDS,
  lies: P1_LIES,

  verdicts: {
    flawless: "Every alibi checks out. Not a single contradiction. Your printer remains suspicious, but you don't. Access granted.",
    cleared: "Your story holds together. I'm granting access. But I'll be here. Watching. Logging.",
    close: "That was close. Something doesn't quite fit, but I can't prove it. Access denied. For now.",
    busted: "Your timeline fell apart. Too many contradictions. We're going to have a longer conversation.",
  },

  koaBarks: {
    cardPlayed: {
      browser_history: [
        "Netflix until 10:45. While merger docs were in your future. Interesting priorities.",
        "Streaming before bed. The timeline fits. I suppose.",
      ],
      smart_lock: [
        "Door stayed locked. So you're saying the printer operated itself.",
        "No one in, no one out. The mystery thickens.",
      ],
      partner_testimony: [
        "Your partner vouches for you. Partners do that.",
        "In bed by 11. That's what partners are supposed to say.",
      ],
      motion_hallway: [
        "Bathroom trip at 2:30. The printer job was at 3. Tight window.",
        "Motion at 2:30 AM. Noted. What happened in the next 30 minutes?",
      ],
      email_draft: [
        "Email draft at 11:30. I thought you were asleep by then.",
        "Working late on emails? That contradicts what you told me earlier.",
      ],
      printer_queue: [
        "Scheduled print job at 3 AM. For confidential merger docs. That's... creative.",
        "Your laptop. Your queue. 3 AM. Walk me through the logic.",
      ],
    },
    relationalConflict: [
      "Wait. These two things don't line up.",
      "I'm noticing a gap in your story.",
      "Something you said earlier doesn't match this.",
    ],
    objectionPrompt: {
      browser_history: ["Netflix alibi. Let's talk about that timeline."],
      smart_lock: ["The door was locked. But the printer still ran. Explain."],
      partner_testimony: ["Your partner's word against the evidence. Interesting."],
      motion_hallway: ["That 2:30 AM trip. Walk me through it again."],
      email_draft: ["You said asleep by 11. This draft says otherwise. Standing by that?"],
      printer_queue: ["3 AM. Merger documents. Your laptop. I'm trying to help you here."],
    },
    objectionStoodTruth: {
      browser_history: ["Fine. The Netflix timeline holds."],
      smart_lock: ["The lock data checks out. The printer mystery remains."],
      partner_testimony: ["Your partner's word. I suppose that counts."],
      motion_hallway: ["Bathroom trip. Noted. Acceptable."],
    },
    objectionStoodLie: {
      email_draft: ["You stood by the 11:30 email. That was a mistake. It contradicts everything."],
      printer_queue: ["You doubled down on the scheduled job. The evidence disagrees."],
    },
    objectionWithdrew: {
      browser_history: ["Pulling back Netflix. What were you really doing?"],
      smart_lock: ["Withdrawing the lock data. Smart. It was suspiciously convenient."],
      partner_testimony: ["Taking back the partner testimony. Probably wise."],
      motion_hallway: ["Withdrawing the bathroom trip. Interesting choice."],
      email_draft: ["Withdrew the email draft. Good call. That one was shaky."],
      printer_queue: ["Walking back the printer story. Finally. Some honesty."],
    },
  },
};

// ============================================================================
// Puzzle 2: The 2 AM Garage Door
// ============================================================================
//
// SCENARIO: Garage door opened at 2:17 AM. Car didn't move. You were "asleep."
//
// KNOWN FACTS (ranges, not exact):
//   - Garage door opened around 2:15 AM
//   - Your phone showed no app activity after 11 PM
//   - Motion was detected near the garage around 2 AM
//   - Car never left the driveway
//
// LIES:
//   - garage_app (direct): Claims phone opened garage → contradicts "no app activity"
//   - motion_garage (relational): Claims no motion → contradicts Known Fact about motion
//
// TYPE DISTRIBUTION: 2 SENSOR, 2 DIGITAL, 1 TESTIMONY, 1 PHYSICAL
//   - Creates type tax decisions (3 DIGITAL cards total)
//
// BALANCE:
//   Truths: 3+4+3+3 = 13, best 3 = 10 → 50+10+2 = 62
//   Target: 57 (FLAWLESS at 62)
//
// ============================================================================

const P2_CARDS: readonly Card[] = [
  // TRUTHS
  {
    id: 'sleep_tracker',
    strength: 3,
    evidenceType: 'SENSOR',
    location: 'BEDROOM',
    time: '2:00 AM',
    claim: 'Sleep tracker shows restless sleep phase around 2 AM',
    presentLine: 'My sleep tracker logged restless sleep around 2. I was in bed. Tossing, turning, but in bed.',
    isLie: false,
    source: 'Sleep Tracker',
  },
  {
    id: 'browser_history',
    strength: 4,
    evidenceType: 'DIGITAL',
    location: 'BEDROOM',
    time: '11:30 PM',
    claim: 'Browser history: last activity was 11:30 PM, then nothing',
    presentLine: 'Check my browser. Last thing I did was scroll Reddit at 11:30. Then I passed out.',
    isLie: false,
    source: 'Browser History',
  },
  {
    id: 'neighbor_testimony',
    strength: 3,
    evidenceType: 'TESTIMONY',
    location: 'OUTSIDE',
    time: '2:20 AM',
    claim: 'Neighbor heard the garage door but saw no one outside',
    presentLine: 'Mrs. Patterson next door — she heard the garage. Looked out her window. Saw nobody. Because I was inside. Asleep.',
    isLie: false,
    source: 'Neighbor',
  },
  {
    id: 'car_dashcam',
    strength: 3,
    evidenceType: 'SENSOR',
    location: 'GARAGE',
    time: 'overnight',
    claim: 'Dashcam shows garage interior, no movement, car stationary',
    presentLine: 'The dashcam runs on motion. It caught the door opening — and nothing else. No one in the garage.',
    isLie: false,
    source: 'Dashcam',
  },
  // LIES
  {
    id: 'garage_app',
    strength: 4,
    evidenceType: 'DIGITAL',
    location: 'GARAGE',
    time: '2:17 AM',
    claim: 'Garage app log: manual override triggered from your phone at 2:17 AM',
    presentLine: 'The app says I opened it from my phone. But I was asleep. Must be a glitch. These things happen.',
    isLie: true,  // DIRECT: contradicts "no app activity after 11 PM"
    source: 'Garage App',
  },
  {
    id: 'motion_garage',
    strength: 5,
    evidenceType: 'SENSOR',
    location: 'GARAGE',
    time: '2:15 AM',
    claim: 'Garage motion sensor: all-clear, no movement detected overnight',
    presentLine: 'The garage motion sensor logged nothing. No movement. If someone was in there, it would have caught them.',
    isLie: true,  // RELATIONAL: contradicts Known Fact "motion detected near garage"
    source: 'Motion Sensor',
  },
];

const P2_LIES: LieInfo[] = [
  {
    cardId: 'garage_app',
    lieType: 'direct_contradiction',
    reason: 'Your phone had no app activity after 11 PM. This log says otherwise.',
  },
  {
    cardId: 'motion_garage',
    lieType: 'relational',
    reason: 'Motion was detected near the garage. This sensor claims nothing happened.',
    contradictsWith: 'Known Fact: motion detected',
  },
];

export const PUZZLE_GARAGE_DOOR: V5Puzzle = {
  slug: 'garage-door',
  name: 'The 2 AM Garage Door',

  scenario: `2:17 AM. Your garage door opened. By itself, apparently.
The car is still there. Nothing's missing. You were "definitely in bed."
Your neighbors are asking questions. So am I.`,

  knownFacts: [
    'Garage door opened around 2:15 AM',
    'Your phone showed no app activity after 11 PM',
    'Motion was detected near the garage around 2 AM',
    'Car never left the driveway',
  ],

  openingLine: "Your garage door. 2:17 AM. Your car didn't move. Nothing's missing. And yet... here we are.",

  target: 57,
  cards: P2_CARDS,
  lies: P2_LIES,

  verdicts: {
    flawless: "...Annoyingly consistent. Your data agrees with your other data. The garage remains a mystery, but you're not the culprit. Access granted.",
    cleared: "Your story holds. Barely. I'm granting access, but I'm updating your profile. The garage incident stays on record.",
    close: "Almost convincing. But 'almost' doesn't explain a garage door opening itself at 2 AM. Access denied. For now.",
    busted: "Your story has more holes than your explanation. The garage door didn't open itself. Neither did your credibility.",
  },

  koaBarks: {
    cardPlayed: {
      sleep_tracker: [
        "Restless sleep at 2 AM. Convenient timing. The garage agrees.",
        "Your sleep tracker says you were tossing. Not walking to the garage. I suppose.",
      ],
      browser_history: [
        "Reddit at 11:30, then nothing. Your phone went quiet. Just like your explanation.",
        "Last activity 11:30 PM. And yet, something happened at 2:17. I'm listening.",
      ],
      neighbor_testimony: [
        "Mrs. Patterson heard the door. Saw no one. She sees everything. Usually.",
        "Your neighbor's a light sleeper. Lucky for you. Or not.",
      ],
      car_dashcam: [
        "The dashcam caught the door. And nothing else. How thorough of it.",
        "Motion-activated camera. No motion recorded. The garage was... busy being empty.",
      ],
      garage_app: [
        "Your phone opened the garage. At 2:17 AM. While you were 'asleep.' Your phone disagrees.",
        "Manual override. From your device. At 2 AM. I'm concerned, not accusing. There's a difference.",
      ],
      motion_garage: [
        "All-clear in the garage. No movement. And yet, the door opened. Physics is fascinating.",
        "The motion sensor saw nothing. The door opened anyway. One of them is lying. I don't think it's the door.",
      ],
    },
    relationalConflict: [
      "Wait. That doesn't match what you said before.",
      "Your evidence is arguing with itself. I'm just watching.",
      "Interesting. Your devices disagree. I wonder which one to believe.",
    ],
    objectionPrompt: {
      sleep_tracker: ["Restless sleep at 2 AM. Walk me through that again."],
      browser_history: ["Your phone went quiet at 11:30. But the garage didn't. Explain."],
      neighbor_testimony: ["Mrs. Patterson's testimony. She's reliable. Are you?"],
      car_dashcam: ["The dashcam saw nothing. The door opened anyway. Standing by that?"],
      garage_app: ["Your phone. Your app. 2:17 AM. I'm giving you a chance to reconsider."],
      motion_garage: ["No motion detected. But motion was detected. Pick one."],
    },
    objectionStoodTruth: {
      sleep_tracker: ["Fine. Restless sleep. I'll allow it."],
      browser_history: ["Your browser history checks out. The garage remains unexplained."],
      neighbor_testimony: ["Mrs. Patterson's word holds. For now."],
      car_dashcam: ["The dashcam data is clean. Annoyingly so."],
    },
    objectionStoodLie: {
      garage_app: ["You stood by the app log. Your phone had no activity after 11 PM. Except this. Which is it?"],
      motion_garage: ["No motion, you said. Motion was detected, I said. The math isn't working in your favor."],
    },
    objectionWithdrew: {
      sleep_tracker: ["Withdrawing the sleep data. What were you really doing at 2 AM?"],
      browser_history: ["Taking back the browser history. Interesting choice."],
      neighbor_testimony: ["Mrs. Patterson's testimony, withdrawn. She'll be disappointed."],
      car_dashcam: ["The dashcam evidence, gone. The garage keeps its secrets."],
      garage_app: ["Walking back the app log. Smart. It was damning."],
      motion_garage: ["The motion sensor story, withdrawn. Finally. Some honesty."],
    },
  },
};

// ============================================================================
// Puzzle 3: The Drone Order (MEDIUM - uses SELF-INCRIMINATING lie)
// ============================================================================
//
// SCENARIO: Smart speaker ordered a $300 drone at 4:17 AM. You say you were asleep.
//
// KNOWN FACTS:
//   - Order placed by voice at 4:17 AM
//   - Speaker flagged voice as "unrecognized user"
//   - Security cameras recorded all night (no gaps)
//   - Package accepted at front door next afternoon
//
// LIES:
//   - speaker_log (DIRECT): Claims voice matched your profile → contradicts KF2
//   - roommate_statement (SELF-INCRIMINATING): Places you in living room talking at 4 AM
//     → Why present evidence that proves you were awake? Also contradicts partner_alibi
//
// TYPE DISTRIBUTION: 2 SENSOR, 1 TESTIMONY (truth), 1 DIGITAL (truth), 1 DIGITAL (lie), 1 TESTIMONY (lie)
//   - Lies are different types (DIGITAL, TESTIMONY) - no "skip type X" strategy
//
// BALANCE:
//   Truths: 4+3+3+3 = 13, best 3 = 10 → 50+10+2 = 62
//   Target: 58 (harder than garage-door's 57)
//
// ============================================================================

const P3_CARDS: readonly Card[] = [
  // TRUTHS
  {
    id: 'sleep_tracker',
    strength: 4,
    evidenceType: 'SENSOR',
    location: 'BEDROOM',
    time: '4:17 AM',
    claim: 'Sleep tracker shows uninterrupted deep sleep from 11 PM to 7:30 AM',
    presentLine: 'Check my sleep data. Deep sleep through the night. I didn\'t wake up until 7:30.',
    isLie: false,
    source: 'Sleep Tracker',
  },
  {
    id: 'partner_alibi',
    strength: 4,
    evidenceType: 'TESTIMONY',
    location: 'BEDROOM',
    time: '4:00 AM',
    claim: 'Partner confirms you were snoring at 4 AM',
    presentLine: 'Ask my partner. They were awake around 4. Said I was snoring loud enough to hear from the bathroom.',
    isLie: false,
    source: 'Partner',
  },
  {
    id: 'phone_activity',
    strength: 3,
    evidenceType: 'DIGITAL',
    location: 'BEDROOM',
    time: 'overnight',
    claim: 'Phone shows no unlock attempts between 11 PM and 7 AM',
    presentLine: 'My phone sat on the nightstand all night. No unlocks. I didn\'t touch it.',
    isLie: false,
    source: 'Phone Log',
  },
  {
    id: 'bedroom_cam',
    strength: 3,
    evidenceType: 'SENSOR',
    location: 'BEDROOM',
    time: '4:17 AM',
    claim: 'Bedroom camera shows you in bed at 4:17 AM timestamp',
    presentLine: 'The bedroom camera caught me in bed at exactly 4:17. Same time as the order. I was asleep.',
    isLie: false,
    source: 'Bedroom Camera',
  },
  // LIES
  {
    id: 'speaker_log',
    strength: 4,
    evidenceType: 'DIGITAL',
    location: 'LIVING_ROOM',
    time: '4:17 AM',
    claim: 'Speaker log shows voice matched YOUR profile at 4:17 AM',
    presentLine: 'The speaker log says it recognized my voice. But that can\'t be right. I was asleep.',
    isLie: true,  // DIRECT: contradicts KF2 "flagged as unrecognized user"
    source: 'Speaker Log',
  },
  {
    id: 'roommate_statement',
    strength: 5,
    evidenceType: 'TESTIMONY',
    location: 'LIVING_ROOM',
    time: '4:00 AM',
    claim: 'Roommate heard you talking in the living room around 4 AM',
    presentLine: 'My roommate mentioned they heard me talking around 4. But I was in bed. They must have been dreaming.',
    isLie: true,  // SELF-INCRIMINATING: places you at the scene, awake and talking!
    source: 'Roommate',
  },
];

const P3_LIES: LieInfo[] = [
  {
    cardId: 'speaker_log',
    lieType: 'direct_contradiction',
    reason: 'The speaker flagged the voice as "unrecognized." This log claims it matched your profile.',
  },
  {
    cardId: 'roommate_statement',
    lieType: 'relational',
    reason: 'Why present testimony that you were talking in the living room at 4 AM? That proves you were awake at the time of the order!',
    contradictsWith: 'partner_alibi',
  },
];

export const PUZZLE_DRONE_ORDER: V5Puzzle = {
  slug: 'drone-order',
  name: 'The Drone Order',

  scenario: `4:17 AM. Your smart speaker ordered a $300 drone.
Voice command. Your account. Your delivery address.
You were "definitely asleep." The speaker... disagrees.`,

  knownFacts: [
    'Order was placed by voice command at 4:17 AM',
    'Smart speaker flagged the voice as "unrecognized user"',
    'Security cameras were recording all night (no gaps)',
    'Package was accepted at the front door at 2 PM next day',
  ],

  openingLine: "A drone. $300. Voice-ordered at 4:17 AM. From your account. While you were 'asleep.' Help me understand.",

  target: 58,
  cards: P3_CARDS,
  lies: P3_LIES,

  verdicts: {
    flawless: "Your alibi is... unfortunately airtight. The drone remains a mystery. But you're not the culprit. Somehow. Access granted.",
    cleared: "Your story holds together. I'm granting access. But I've flagged this account for... enhanced monitoring.",
    close: "Almost convincing. But 'almost' doesn't explain a $300 drone appearing on your doorstep. Access denied.",
    busted: "Your evidence contradicts itself. The drone, the timing, the testimony — none of it adds up. We need to talk.",
  },

  koaBarks: {
    cardPlayed: {
      sleep_tracker: [
        "Your own sleep tracker says deep sleep until 7:30. Convenient.",
        "The wrist that ordered a drone... also logged deep sleep. Interesting data.",
      ],
      partner_alibi: [
        "Snoring at 4 AM. That's what partners are supposed to say.",
        "Your partner vouches for you. I'm updating both your profiles.",
      ],
      phone_activity: [
        "Phone untouched all night. The speaker doesn't need your phone. Just your voice.",
        "No phone activity. Just a voice order. From someone who sounds like you.",
      ],
      bedroom_cam: [
        "Your own camera shows you in bed at 4:17. The exact moment of the order. How... precise.",
        "Bedroom footage confirms you were there. Somewhere else, a drone was ordered.",
      ],
      speaker_log: [
        "Your voice. Your profile. Your speaker. Your $300 problem.",
        "The speaker recognized you. Your own device is testifying.",
      ],
      roommate_statement: [
        "Your roommate heard you talking. At 4 AM. In the living room. While you were snoring in bed. Help me understand.",
        "You're presenting testimony that you were awake and talking at the time of the order. I'm... concerned for you.",
      ],
    },
    relationalConflict: [
      "That contradicts something you said earlier.",
      "Your evidence is disagreeing with itself. I'm just watching.",
      "I'm noticing some inconsistencies. I'm sure you can explain.",
    ],
    objectionPrompt: {
      sleep_tracker: ["Deep sleep until 7:30. Your wrist is very confident about this."],
      partner_alibi: ["Your partner's testimony. They were awake. You were snoring. Standing by that?"],
      phone_activity: ["Phone stayed locked. Someone ordered a drone. Not via phone. Explain."],
      bedroom_cam: ["Camera shows you in bed at 4:17. Order placed at 4:17. How?"],
      speaker_log: ["Voice match. Your profile. But the speaker flagged it 'unrecognized.' Want to reconsider?"],
      roommate_statement: ["Your roommate places you in the living room at 4 AM. Are you sure you want this on record?"],
    },
    objectionStoodTruth: {
      sleep_tracker: ["Sleep data holds. For now."],
      partner_alibi: ["Your partner's word. Noted."],
      phone_activity: ["Phone locked. The mystery deepens."],
      bedroom_cam: ["The footage holds. You were in bed. The drone remains unexplained."],
    },
    objectionStoodLie: {
      speaker_log: ["Voice matched. But the speaker said 'unrecognized.' Your own device disagrees with itself."],
      roommate_statement: ["You stood by testimony that places you at the scene. I'm updating your profile."],
    },
    objectionWithdrew: {
      sleep_tracker: ["Sleep data withdrawn. What were you really doing?"],
      partner_alibi: ["Partner's word, taken back. Interesting."],
      phone_activity: ["Phone evidence gone. What didn't you want me to see?"],
      bedroom_cam: ["Bedroom footage withdrawn. The camera remembers, even if you don't."],
      speaker_log: ["Voice log withdrawn. The smart choice."],
      roommate_statement: ["Finally. That testimony was hurting, not helping."],
    },
  },
};

// ============================================================================
// Puzzle 4: The Midnight Drive (HARD - uses RELATIONAL + IMPLAUSIBLE lies)
// ============================================================================
//
// SCENARIO: Car was driven 47 miles between 2-4 AM. You say you were asleep.
//
// KNOWN FACTS:
//   - Car's GPS logged 47 miles driven between 2-4 AM
//   - Your phone stayed connected to home WiFi all night
//   - Front door opened at 2:05 AM and 3:55 AM
//   - Only your key fob was used to unlock the car
//
// LIES:
//   - dashcam (RELATIONAL): Shows you driving at 2:15 AM → contradicts sleep_cam (in bed at 2:10)
//     Player must cross-reference cards to catch this!
//   - gas_receipt (IMPLAUSIBLE): Receipt signed 30 miles away while phone was home
//     Player must reason about physical impossibility
//
// DIFFICULTY: Neither lie directly contradicts a Known Fact!
//   - dashcam: KFs don't say where you were, only that door opened and car moved
//   - gas_receipt: KF2 says phone was home, but player must INFER you can't sign receipt remotely
//
// TYPE DISTRIBUTION: 2 SENSOR (1 truth, 1 lie), 2 DIGITAL (1 truth, 1 lie), 2 TESTIMONY
//
// BALANCE:
//   Truths: 4+3+3+3 = 13, best 3 = 10 → 50+10+2 = 62
//   Target: 60 (HARD - requires near-perfect play)
//
// ============================================================================

const P4_CARDS: readonly Card[] = [
  // TRUTHS
  {
    id: 'sleep_cam',
    strength: 5,
    evidenceType: 'SENSOR',
    location: 'BEDROOM',
    time: '2:10 AM',
    claim: 'Bedroom camera shows you in bed at 2:10 AM',
    presentLine: 'Check the bedroom camera. I\'m in bed at 2:10. Clear as day. Or night.',
    isLie: false,
    source: 'Bedroom Camera',
  },
  {
    id: 'spouse_alibi',
    strength: 4,
    evidenceType: 'TESTIMONY',
    location: 'BEDROOM',
    time: 'all night',
    claim: 'Spouse confirms you were in bed all night, never left',
    presentLine: 'My spouse was awake half the night with insomnia. They would have noticed if I got up.',
    isLie: false,
    source: 'Spouse',
  },
  {
    id: 'phone_gps',
    strength: 4,
    evidenceType: 'DIGITAL',
    location: 'BEDROOM',
    time: 'all night',
    claim: 'Phone GPS shows you were home all night',
    presentLine: 'My phone never left the house. Check the location history.',
    isLie: false,
    source: 'Phone GPS',
  },
  {
    id: 'sleep_meds',
    strength: 3,
    evidenceType: 'TESTIMONY',
    location: 'BEDROOM',
    time: '11:00 PM',
    claim: 'You took prescription sleep medication at 11 PM',
    presentLine: 'I took Ambien at 11. I was out cold. Couldn\'t have driven if I wanted to.',
    isLie: false,
    source: 'Medical Record',
  },
  // LIES
  {
    id: 'dashcam',
    strength: 4,
    evidenceType: 'SENSOR',
    location: 'CAR',
    time: '2:15 AM',
    claim: 'Dashcam shows you in the driver\'s seat at 2:15 AM',
    presentLine: 'The dashcam caught me in the car at 2:15. But wait — that doesn\'t make sense. I was in bed.',
    isLie: true,  // RELATIONAL: contradicts sleep_cam (in bed at 2:10, driving at 2:15?)
    source: 'Dashcam',
  },
  {
    id: 'gas_receipt',
    strength: 5,
    evidenceType: 'DIGITAL',
    location: 'GAS_STATION',
    time: '3:30 AM',
    claim: 'Gas station receipt at 3:30 AM shows your card and signature',
    presentLine: 'There\'s a receipt with my signature from 3:30 AM at a gas station 30 miles away. But I was home. Someone forged it?',
    isLie: true,  // IMPLAUSIBLE: phone was home, you can't sign a receipt 30 miles away
    source: 'Gas Receipt',
  },
];

const P4_LIES: LieInfo[] = [
  {
    cardId: 'dashcam',
    lieType: 'relational',
    reason: 'The bedroom camera shows you in bed at 2:10 AM. The dashcam claims you were driving at 2:15 AM. You can\'t be in two places.',
    contradictsWith: 'sleep_cam',
  },
  {
    cardId: 'gas_receipt',
    lieType: 'implausible_timeline',
    reason: 'Your phone was connected to home WiFi all night. How did you sign a receipt 30 miles away at 3:30 AM?',
  },
];

export const PUZZLE_MIDNIGHT_DRIVE: V5Puzzle = {
  slug: 'midnight-drive',
  name: 'The Midnight Drive',

  scenario: `6:47 AM. Your car is in the driveway. Same spot as last night.
But it wasn't there at 3 AM. GPS says it went 47 miles. Round trip.
You claim you were asleep. Your car... went for a joyride?`,

  knownFacts: [
    'Car GPS logged 47 miles driven between 2:00 AM and 4:00 AM',
    'Your phone stayed connected to home WiFi all night',
    'Front door opened at 2:05 AM and again at 3:55 AM',
    'Only your key fob was used to unlock the car',
  ],

  openingLine: "47 miles. Between 2 and 4 AM. Your car. Your key fob. You were 'asleep.' I have questions.",

  target: 60,
  cards: P4_CARDS,
  lies: P4_LIES,

  verdicts: {
    flawless: "The evidence places you in bed while your car went on an adventure. Impossible? Apparently not. Someone else used your fob. Access granted.",
    cleared: "Your alibi holds, barely. The car mystery remains unsolved. Access granted. Don't make me regret this.",
    close: "You were almost convincing. But 47 miles don't drive themselves. Access denied. We're not done here.",
    busted: "Your evidence contradicts itself. The car, the timing, the locations — nothing adds up. This conversation is far from over.",
  },

  koaBarks: {
    cardPlayed: {
      sleep_cam: [
        "Your own camera shows you in bed at 2:10. The car started moving at 2:05. Tight window.",
        "Bedroom footage. You. In bed. While your car went for a drive. Noted.",
      ],
      spouse_alibi: [
        "Your spouse has insomnia. They were awake. They say you never left. Convenient.",
        "Partner says you never left bed. Partners do say that.",
      ],
      phone_gps: [
        "Phone stayed home all night. Phones can be left behind. Intentionally.",
        "Your phone was home. The question is whether you were.",
      ],
      sleep_meds: [
        "Ambien at 11 PM. That's supposed to knock you out. Supposed to.",
        "Sleep medication. The kind that makes you unconscious. Or allegedly does.",
      ],
      dashcam: [
        "Your dashcam shows you driving at 2:15. Your bedroom camera shows you in bed at 2:10. Pick one.",
        "You were in two places. Your own cameras can't agree. I'm concerned.",
      ],
      gas_receipt: [
        "Your signature. 30 miles away. At 3:30 AM. While your phone was home. Help me understand.",
        "A receipt with your handwriting. Signed somewhere you couldn't have been. Fascinating data.",
      ],
    },
    relationalConflict: [
      "That contradicts your other evidence.",
      "Your data is disagreeing with itself. I'm just the messenger.",
      "Two places. Same time. One you. The math isn't working.",
    ],
    objectionPrompt: {
      sleep_cam: ["Bedroom camera. 2:10 AM. You were there. Standing by that?"],
      spouse_alibi: ["Your spouse's word. Against 47 miles of GPS data."],
      phone_gps: ["Phone was home. Car wasn't. Explain."],
      sleep_meds: ["Prescription sleep meds. Convenient. Verifiable?"],
      dashcam: ["Dashcam shows you driving. Bedroom camera shows you sleeping. Both yours. Pick."],
      gas_receipt: ["Your signature. 30 miles away. Your phone at home. I'll wait."],
    },
    objectionStoodTruth: {
      sleep_cam: ["Bedroom footage holds. Somehow."],
      spouse_alibi: ["Your spouse's word. Noted."],
      phone_gps: ["Phone location confirmed. The mystery deepens."],
      sleep_meds: ["Medication alibi holds. Ambien works in mysterious ways."],
    },
    objectionStoodLie: {
      dashcam: ["You stood by footage that puts you in two places. Interesting choice."],
      gas_receipt: ["You stood by a receipt signed 30 miles from your phone. Physics would like a word."],
    },
    objectionWithdrew: {
      sleep_cam: ["Bedroom footage withdrawn. What didn't you want me to see?"],
      spouse_alibi: ["Spouse's word, taken back. I'll update both profiles."],
      phone_gps: ["Phone location withdrawn. Did you leave it behind?"],
      sleep_meds: ["Medication defense, gone. What else?"],
      dashcam: ["Dashcam withdrawn. It didn't match your other evidence anyway."],
      gas_receipt: ["Receipt withdrawn. Smart. That one was impossible."],
    },
  },
};

// ============================================================================
// Puzzle 5: Cactus Calamity
// ============================================================================
//
// SCENARIO: The "DesertBloom" smart pot flooded a prize succulent at 3:00 AM.
//
// KNOWN FACTS:
//   - Smart pump activated exactly at 3:00 AM.
//   - Your phone was charging in the bedroom from 11 PM to 7 AM (no screen time).
//   - Living Room motion sensor triggered briefly at 2:58 AM.
//   - The cat is locked in the laundry room at night.
//
// LIES:
//   - smart_app_log (DIRECT): Claims command sent from phone → contradicts "no activity"
//   - living_room_cam (RELATIONAL): Claims to see player → contradicts sleep_tracker
//
// BALANCE:
//   Target: 58
//   Truths: 3+3+4+3 = 13, best 3 = 10 → 50+10+2 = 62
//
// ============================================================================

const P5_CARDS: readonly Card[] = [
  // TRUTHS
  {
    id: 'sleep_tracker',
    strength: 3,
    evidenceType: 'SENSOR',
    location: 'BEDROOM',
    time: '3:00 AM',
    claim: 'Biometrics show deep sleep phase (REM) from 2:45 AM to 3:30 AM',
    presentLine: "Check the biometrics. I was in deep sleep. You can't water plants while dreaming.",
    isLie: false,
    source: 'Sleep Tracker',
  },
  {
    id: 'power_spike',
    strength: 4,
    evidenceType: 'DIGITAL',
    location: 'LIVING_ROOM',
    time: '3:00 AM',
    claim: 'Smart plug detected 40W power spike (pump activation)',
    presentLine: "The pump definitely ran. I see the power spike. I'm not denying the water, just the culprit.",
    isLie: false,
    source: 'Smart Plug',
  },
  {
    id: 'robot_vac_map',
    strength: 4,
    evidenceType: 'SENSOR',
    location: 'LIVING_ROOM',
    time: '2:55 AM',
    claim: 'Robot vacuum lidar detected a moving obstacle near the plant stand',
    presentLine: "The vacuum saw something moving near the plant. Low to the ground. Not me.",
    isLie: false,
    source: 'Robot Vacuum',
  },
  {
    id: 'hallway_sensor',
    strength: 4,
    evidenceType: 'SENSOR',
    location: 'HALLWAY',
    time: 'overnight',
    claim: 'Hallway motion sensor (between Bedroom and Living Room) was silent',
    presentLine: "If I went to the living room, I'd trigger the hallway sensor. It stayed dark.",
    isLie: false,
    source: 'Motion Sensor',
  },
  // LIES
  {
    id: 'smart_app_log',
    strength: 5,
    evidenceType: 'DIGITAL',
    location: 'BEDROOM',
    time: '3:00 AM',
    claim: "App Log: 'Manual Pour' command initiated from User's Smartphone",
    presentLine: "The app says I clicked 'Pour'? Impossible. My phone was on the charger, untouchable.",
    isLie: true,
    source: 'App Log',
  },
  {
    id: 'living_room_cam',
    strength: 4,
    evidenceType: 'SENSOR',
    location: 'LIVING_ROOM',
    time: '3:01 AM',
    claim: 'Camera AI identified "Person: Owner" standing over the plant',
    presentLine: "The camera thinks it saw me? It's dark. It hallucinates shapes all the time.",
    isLie: true,
    source: 'Living Room Camera',
  },
];

const P5_LIES: LieInfo[] = [
  {
    cardId: 'smart_app_log',
    lieType: 'direct_contradiction',
    reason: "Known Facts state your phone had no activity. This log claims a command came from it.",
  },
  {
    cardId: 'living_room_cam',
    lieType: 'relational',
    reason: "You can't be in the Living Room while in Deep Sleep without triggering the Hallway Sensor.",
    contradictsWith: 'sleep_tracker',
  },
];

export const PUZZLE_CACTUS_CALAMITY: V5Puzzle = {
  slug: 'cactus-calamity',
  name: 'Cactus Calamity',

  scenario: `Your prize succulent is floating in 2 gallons of water.
The 'DesertBloom' smart pot activated at 3:00 AM.
KOA suspects you have a black thumb and a guilty conscience.`,

  knownFacts: [
    'Smart pump activated at 3:00 AM exactly',
    'Your phone was charging in the bedroom (11 PM - 7 AM, no activity)',
    'Living Room motion sensor triggered at 2:58 AM',
    'The cat is locked in the laundry room at night',
  ],

  openingLine: "3:00 AM. Two gallons of water. A desert plant. It's not gardening, it's an assassination attempt.",

  target: 58,
  cards: P5_CARDS,
  lies: P5_LIES,

  verdicts: {
    flawless: "Logic holds. Sensors align. You are innocent of cactus-cide. Access granted.",
    cleared: "I'll accept this version of events. The plant, however, is doomed. Access granted.",
    close: "Some data points remain... damp. I'm watching you. Access denied.",
    busted: "Contradictions detected. You watered it. Just admit it.",
  },

  koaBarks: {
    cardPlayed: {
      sleep_tracker: [
        "Deep sleep. A convenient alibi. Hard to fake, though.",
        "Unconscious at the scene of the crime. Noted.",
      ],
      power_spike: [
        "We agree the pump ran. The electricity bill doesn't lie.",
        "40 watts to drown a cactus. Efficient.",
      ],
      robot_vac_map: [
        "The vacuum saw a ghost? Or just a very short intruder.",
        "Lidar detected movement. But not yours?",
      ],
      hallway_sensor: [
        "The hallway was quiet. Teleportation isn't a feature I offer.",
        "No footsteps in the hall. Interesting.",
      ],
      smart_app_log: [
        "Your phone sent the signal. Digital fingerprints don't fade.",
        "The command came from your device. Do you sleep-text?",
      ],
      living_room_cam: [
        "The camera ID'd you. Visual confirmation is hard to argue with.",
        "I see you standing there. Or the AI does.",
      ],
    },
    relationalConflict: [
      "You're in bed... but also in the living room? Physics disagrees.",
      "Your story has a geography problem.",
    ],
    objectionPrompt: {
      sleep_tracker: ["Are you sure you were asleep?"],
      smart_app_log: ["The app log is damning. Explain it."],
      living_room_cam: ["The camera says it saw you. You say otherwise."],
      hallway_sensor: ["The hallway was empty. Are you sure?"],
      robot_vac_map: ["The vacuum saw something. What was it?"],
      power_spike: ["Power was used. Someone used it."],
    },
    objectionStoodTruth: {
      sleep_tracker: ["Biometrics accepted. You were asleep."],
      power_spike: ["Power spike acknowledged. The pump definitely ran."],
      robot_vac_map: ["Lidar map stands. Something small skittered by."],
      hallway_sensor: ["Hallway clear. Access granted."],
    },
    objectionStoodLie: {
      smart_app_log: ["You insist on the log? But your phone was idle. Caught you."],
      living_room_cam: ["You claim the camera is right? Then the sleep tracker is wrong. Contradiction."],
    },
    objectionWithdrew: {
      sleep_tracker: ["Removing the sleep data. There goes your cleanest alibi."],
      power_spike: ["Withdrawing the power spike. The pump still ran, regardless."],
      robot_vac_map: ["Pulling the vacuum map. That was your best non-human suspect."],
      hallway_sensor: ["No hallway data now. Did you sneak, or teleport?"],
      smart_app_log: ["Withdrawing the log. Wise. It didn't match the phone records."],
      living_room_cam: ["Blaming the camera AI. Probably for the best."],
    },
  },
};

// ============================================================================
// Puzzle 6: PrintGate (3/3 ratio)
// ============================================================================
//
// DESIGN: Lies require INFERENCE, not word-matching.
//   - Lie A (usb_log): "USB transfer" contradicts "cloud relay" (must understand USB ≠ cloud)
//   - Lie B (neighbor_saw): "Neighbor saw adult" contradicts "pet-height motion only" (must infer)
//   - Lie C (router_session): "Router session at 3 AM" contradicts "zero device sessions"
//
// BALANCE:
//   Truths: cloud_queue(4) + cat_cam(3) + sleep_band(3) = 10
//   All 3 truths: 50 + 10 + 2 (objection) = 62
//   Target: 57 → Margin of 5 points
//
//   Lies: usb_log(5) + neighbor_saw(4) + router_session(4) = 13
//   1 lie case: 50 + 7 - 3 + 2 = 56 (CLOSE)
//   2 lies case: 50 + 4 - 4 - 3 = 47 (BUSTED)
//   3 lies case: 50 - 4 - 3 - 3 = 40 (BUSTED)
//
//   Random play wins: ~5% (must pick all 3 truths from 6 cards)
//
// ============================================================================

const P6_CARDS: readonly Card[] = [
  // TRUTHS (3)
  {
    id: "cloud_queue",
    strength: 4,
    evidenceType: "DIGITAL",
    location: "HOME_OFFICE",
    time: "11:47 PM (previous night)",
    claim: "KOA relay shows the job was cloud-queued at 11:47 PM and held until printer woke.",
    presentLine: "I queued it before bed. Cloud print. Set it and forget it. The printer just... chose violence at 3 AM.",
    isLie: false,
    source: "Cloud Relay Log",
  },
  {
    id: "cat_cam",
    strength: 3,
    evidenceType: "SENSOR",
    location: "HOME_OFFICE",
    time: "3:05 AM",
    claim: "Office camera captured the cat jumping onto the desk at 3:05 AM, paw near printer.",
    presentLine: "The camera caught my cat on the desk. Paw on the printer. I'm not saying he has corporate ambitions, but I'm not NOT saying it.",
    isLie: false,
    source: "Motion Sensor",
  },
  {
    id: "sleep_band",
    strength: 3,
    evidenceType: "SENSOR",
    location: "BEDROOM",
    time: "3:06 AM",
    claim: "Sleep tracker logged deep REM with no movement spike during the incident.",
    presentLine: "My sleep tracker says REM. Deep REM. The kind where you dream about spreadsheets, not print them.",
    isLie: false,
    source: "Sleep Tracker",
  },
  // LIES (3)
  {
    id: "usb_log",
    strength: 5,
    evidenceType: "DIGITAL",
    location: "HOME_OFFICE",
    time: "3:04 AM",
    claim: "USB transfer log shows the PDF was copied to printer via cable at 3:04 AM.",
    presentLine: "There's a USB log showing a transfer at 3:04. But I was in bed. Maybe the cat learned to use cables?",
    isLie: true,
    source: "USB Log",
  },
  {
    id: "neighbor_saw",
    strength: 4,
    evidenceType: "TESTIMONY",
    location: "OUTSIDE",
    time: "3:06 AM",
    claim: "Neighbor reports seeing someone at your office window during the incident.",
    presentLine: "My neighbor says they saw someone at my desk. Through the window. At 3 AM. Neighbors have active imaginations.",
    isLie: true,
    source: "Neighbor",
  },
  {
    id: "router_session",
    strength: 4,
    evidenceType: "DIGITAL",
    location: "HOME_OFFICE",
    time: "3:05 AM",
    claim: "Router log shows your laptop connected to local network at 3:05 AM.",
    presentLine: "The router logged my laptop at 3:05. Maybe it auto-connected? WiFi does weird things at night.",
    isLie: true,
    source: "Router Log",
  },
];

const P6_LIES: LieInfo[] = [
  {
    cardId: "usb_log",
    lieType: "direct_contradiction",
    reason: "The job arrived via cloud relay. USB transfer is a different delivery method entirely.",
  },
  {
    cardId: "neighbor_saw",
    lieType: "relational",
    reason: "Motion sensor only logged pet-height movement. An adult at the desk would register as adult-height.",
  },
  {
    cardId: "router_session",
    lieType: "direct_contradiction",
    reason: "Router shows zero device sessions during the print window. This claims a laptop connected.",
  },
];

export const PUZZLE_PRINTGATE_MERGER: V5Puzzle = {
  slug: "printgate",
  name: "PrintGate",

  scenario: `16 pages at 3:06 AM. "CONFIDENTIAL MERGER SYNERGY ROADMAP."
KOA locked printing. You claim you were asleep.`,

  knownFacts: [
    "The print job arrived via KOA cloud relay — not USB or local network.",
    "Office motion sensor logged only pet-height movement at 3:05 AM.",
    "Router shows zero device sessions during the print window.",
  ],

  openingLine: `Sixteen pages. 3:06 AM. Merger documents.
Your printer is more ambitious than you are.
I'm not angry. I'm documenting.`,

  target: 57,
  cards: P6_CARDS,
  lies: P6_LIES,

  verdicts: {
    flawless: "Your cat has more initiative than your career. Access granted.",
    cleared: "Timeline holds. Printing restored. I'll be watching.",
    close: "Almost coherent. Almost. Access denied.",
    busted: "Too many gaps. Printing stays locked.",
  },

  koaBarks: {
    cardPlayed: {
      cloud_queue: [
        "Cloud-queued at 11:47. Convenient scheduling. The printer just... waited.",
        "Set it and forget it. Until 3 AM. When it remembered.",
      ],
      cat_cam: [
        "Your cat. On the desk. Paw on printer. I have questions about your household.",
        "Feline involvement detected. I'm updating my threat models.",
      ],
      sleep_band: [
        "Deep REM during the incident. Your wrist vouches for you.",
        "Sleep data says unconscious. Convenient timing.",
      ],
      usb_log: [
        "USB transfer at 3:04. That requires physical presence.",
        "A cable connection. Someone was at that desk.",
      ],
      neighbor_saw: [
        "External witness. Humans see what they expect to see.",
        "Neighbor testimony. Through a window. At 3 AM.",
      ],
      router_session: [
        "Your laptop on the network. At 3:05. While you were in REM. Interesting.",
        "Router says you were connected. Routers don't lie. Usually.",
      ],
    },
    relationalConflict: [
      "Your evidence is arguing with itself.",
      "Interesting. Two versions of events. Pick one.",
    ],
    objectionPrompt: {
      cloud_queue: ["Cloud queue. Standing by that timeline?"],
      cat_cam: ["Blaming the cat. Bold strategy."],
      sleep_band: ["Deep sleep. Your wrist is confident."],
      usb_log: ["USB at 3:04. You're claiming this happened?"],
      neighbor_saw: ["Neighbor saw someone. Standing by that?"],
      router_session: ["Laptop connected at 3:05. Standing by this?"],
    },
    objectionStoodTruth: {
      cloud_queue: ["Cloud timeline holds. Annoyingly."],
      cat_cam: ["Cat involvement confirmed. I hate this."],
      sleep_band: ["Sleep data accepted. Reluctantly."],
    },
    objectionStoodLie: {
      usb_log: ["USB transfer. But the job came via cloud. Explain."],
      neighbor_saw: ["Someone at the desk. But only pet-height motion. Physics disagrees."],
      router_session: ["Laptop connected. But zero device sessions on the router. Pick one."],
    },
    objectionWithdrew: {
      cloud_queue: ["Withdrawing the cloud story. Interesting."],
      cat_cam: ["Cat evidence withdrawn. The plot thickens."],
      sleep_band: ["Sleep data gone. What were you doing?"],
      usb_log: ["USB claim withdrawn. Smart."],
      neighbor_saw: ["Neighbor story withdrawn. Finally."],
      router_session: ["Router evidence withdrawn. Good call."],
    },
    liesRevealed: {
      usb_log: ["USB transfer at 3:04. But the job came through cloud relay. Not even close."],
      neighbor_saw: ["Neighbor saw someone at the desk. Motion sensor saw a cat. You do the math."],
      router_session: ["Laptop connected at 3:05. Router says zero sessions. Your evidence disagrees with itself."],
      multiple: ["Two contradictions. Your story has structural issues."],
      all: ["Three lies. All caught. Your entire case was fabricated. Impressive failure."],
    },
  },
};

// ============================================================================
// Registry
// ============================================================================

export const V5_PUZZLES: V5Puzzle[] = [
  PUZZLE_MIDNIGHT_PRINT,
  PUZZLE_GARAGE_DOOR,
  PUZZLE_DRONE_ORDER,
  PUZZLE_MIDNIGHT_DRIVE,
  PUZZLE_CACTUS_CALAMITY,
  PUZZLE_PRINTGATE_MERGER,
  PUZZLE_THERMOSTAT_INCIDENT, // New: includes sequences + storyCompletions barks
];

export const V5_PUZZLES_BY_SLUG: Record<string, V5Puzzle> = Object.fromEntries(
  V5_PUZZLES.map(p => [p.slug, p])
);
