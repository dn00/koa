/**
 * Builtin Pack & Loader
 *
 * Task 009: Builtin Pack & Loader
 * Implements: R6.4, R6.5
 *
 * Provides BUILTIN_PACK constant and createBuiltinLoader factory
 * that wraps V5 puzzles as a PuzzlePack with PackLoader interface.
 *
 * Note: Puzzle data is defined inline here. For production, this could be
 * generated from or synchronized with scripts/v5-puzzles.ts.
 */

import { ok, err, type Result } from '../types/index.js';
import type { V5Puzzle, Card } from '../types/v5/index.js';
import type { PuzzlePack, PuzzlePackManifest, PackLoader, PackError } from './types.js';

// ============================================================================
// Builtin Puzzle Data
// ============================================================================

/**
 * Helper to create a CardId-typed card (for internal use only).
 * The branded type ensures type safety at compile time.
 */
function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

/**
 * Puzzle 1: The Midnight Print Job
 */
const PUZZLE_MIDNIGHT_PRINT: V5Puzzle = {
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
  cards: [
    card({
      id: 'browser_history',
      strength: 3,
      evidenceType: 'DIGITAL',
      location: 'OFFICE',
      time: '10:45 PM',
      claim: 'Browser history shows streaming activity until around 10:45 PM',
      presentLine: 'I was watching Netflix until almost 11. The browser history shows it.',
      isLie: false,
    }),
    card({
      id: 'smart_lock',
      strength: 4,
      evidenceType: 'SENSOR',
      location: 'FRONT_DOOR',
      time: '9:30 PM',
      claim: 'Smart lock logged no unlock events between 9:30 PM and morning',
      presentLine: 'The front door was locked all night. Nobody came in, nobody went out.',
      isLie: false,
    }),
    card({
      id: 'partner_testimony',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'BEDROOM',
      time: '11:00 PM',
      claim: 'Partner confirms you came to bed around 11 PM',
      presentLine: 'Ask my partner. I came to bed around 11. They were still awake.',
      isLie: false,
    }),
    card({
      id: 'motion_hallway',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'HALLWAY',
      time: '2:30 AM',
      claim: 'Hallway motion sensor triggered briefly around 2:30 AM',
      presentLine: "Yeah, I was up around 2:30. Bathroom. That's not unusual.",
      isLie: false,
    }),
    card({
      id: 'email_draft',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'OFFICE',
      time: '11:30 PM',
      claim: 'Email draft saved at 11:30 PM shows late-night work activity',
      presentLine: "I was drafting work emails around 11:30. Couldn't sleep.",
      isLie: true,
    }),
    card({
      id: 'printer_queue',
      strength: 5,
      evidenceType: 'DIGITAL',
      location: 'OFFICE',
      time: '3:00 AM',
      claim: 'Printer queue shows document sent from your laptop at 3 AM',
      presentLine: 'That was a scheduled print job. I set those up. Totally normal.',
      isLie: true,
    }),
  ],
  lies: [
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
  ],
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

/**
 * Puzzle 2: The 2 AM Garage Door
 */
const PUZZLE_GARAGE_DOOR: V5Puzzle = {
  slug: 'garage-door',
  name: 'The 2 AM Garage Door',
  scenario: `2:17 AM. The garage door opened.
Your car never left the driveway. You claim you were asleep.
But something triggered that door.`,
  knownFacts: [
    'Garage door opened around 2:15 AM',
    'Your phone showed no app activity after 11 PM',
    'Motion was detected near the garage around 2 AM',
    'Car never left the driveway',
  ],
  openingLine: "The garage door opened at 2:17 AM. Your car stayed put. So what was the point?",
  target: 57,
  cards: [
    card({
      id: 'sleep_tracker',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'BEDROOM',
      time: '2:00 AM',
      claim: 'Sleep tracker shows restless sleep phase around 2 AM',
      presentLine: 'My sleep tracker logged restless sleep around 2. I was in bed. Tossing, turning, but in bed.',
      isLie: false,
    }),
    card({
      id: 'browser_history',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'BEDROOM',
      time: '11:30 PM',
      claim: 'Browser history: last activity was 11:30 PM, then nothing',
      presentLine: 'Check my browser. Last thing I did was scroll Reddit at 11:30. Then I passed out.',
      isLie: false,
    }),
    card({
      id: 'neighbor_testimony',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'OUTSIDE',
      time: '2:20 AM',
      claim: 'Neighbor heard the garage door but saw no one outside',
      presentLine: "Mrs. Patterson next door — she heard the garage. Looked out her window. Saw nobody. Because I was inside. Asleep.",
      isLie: false,
    }),
    card({
      id: 'car_dashcam',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'GARAGE',
      time: 'overnight',
      claim: 'Dashcam shows garage interior, no movement, car stationary',
      presentLine: 'The dashcam runs on motion. It caught the door opening — and nothing else. No one in the garage.',
      isLie: false,
    }),
    card({
      id: 'garage_app',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'GARAGE',
      time: '2:17 AM',
      claim: 'Garage app log: manual override triggered from your phone at 2:17 AM',
      presentLine: 'The app says I opened it from my phone. But I was asleep. Must be a glitch. These things happen.',
      isLie: true,
    }),
    card({
      id: 'motion_garage',
      strength: 5,
      evidenceType: 'SENSOR',
      location: 'GARAGE',
      time: '2:15 AM',
      claim: 'Garage motion sensor: all-clear, no movement detected overnight',
      presentLine: 'The garage motion sensor logged nothing. No movement. If someone was in there, it would have caught them.',
      isLie: true,
    }),
  ],
  lies: [
    {
      cardId: 'garage_app',
      lieType: 'direct_contradiction',
      reason: 'Your phone opened the garage at 2:17 AM, contradicting no app activity after 11 PM.',
    },
    {
      cardId: 'motion_garage',
      lieType: 'relational',
      reason: 'Motion was detected near the garage, contradicting your sensor claim.',
    },
  ],
  verdicts: {
    flawless: "...Annoyingly consistent. Your data agrees with your other data. The garage remains a mystery, but you're not the culprit. Access granted.",
    cleared: "Your story holds. Barely. I'm granting access, but I'll be here. Watching. Logging.",
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

/**
 * Puzzle 3: The Drone Order
 */
const PUZZLE_DRONE_ORDER: V5Puzzle = {
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
  cards: [
    card({
      id: 'sleep_tracker',
      strength: 4,
      evidenceType: 'SENSOR',
      location: 'BEDROOM',
      time: '4:17 AM',
      claim: 'Sleep tracker shows uninterrupted deep sleep from 11 PM to 7:30 AM',
      presentLine: "Check my sleep data. Deep sleep through the night. I didn't wake up until 7:30.",
      isLie: false,
    }),
    card({
      id: 'partner_alibi',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'BEDROOM',
      time: '4:00 AM',
      claim: 'Partner confirms you were snoring at 4 AM',
      presentLine: 'Ask my partner. They were awake around 4. Said I was snoring loud enough to hear from the bathroom.',
      isLie: false,
    }),
    card({
      id: 'phone_activity',
      strength: 3,
      evidenceType: 'DIGITAL',
      location: 'BEDROOM',
      time: 'overnight',
      claim: 'Phone shows no unlock attempts between 11 PM and 7 AM',
      presentLine: "My phone sat on the nightstand all night. No unlocks. I didn't touch it.",
      isLie: false,
    }),
    card({
      id: 'bedroom_cam',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'BEDROOM',
      time: '4:17 AM',
      claim: 'Bedroom camera shows you in bed at 4:17 AM timestamp',
      presentLine: 'The bedroom camera caught me in bed at exactly 4:17. Same time as the order. I was asleep.',
      isLie: false,
    }),
    card({
      id: 'speaker_log',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'LIVING_ROOM',
      time: '4:17 AM',
      claim: 'Speaker log shows voice matched YOUR profile at 4:17 AM',
      presentLine: "The speaker log says it recognized my voice. But that can't be right. I was asleep.",
      isLie: true,
    }),
    card({
      id: 'roommate_statement',
      strength: 5,
      evidenceType: 'TESTIMONY',
      location: 'LIVING_ROOM',
      time: '4:00 AM',
      claim: 'Roommate heard you talking in the living room around 4 AM',
      presentLine: 'My roommate mentioned they heard me talking around 4. But I was in bed. They must have been dreaming.',
      isLie: true,
    }),
  ],
  lies: [
    {
      cardId: 'speaker_log',
      lieType: 'direct_contradiction',
      reason: 'The speaker flagged the voice as "unrecognized." This log claims it matched your profile.',
    },
    {
      cardId: 'roommate_statement',
      lieType: 'self_incriminating',
      reason: 'Why present testimony that you were talking in the living room at 4 AM? That proves you were awake at the time of the order!',
      contradictsWith: 'partner_alibi',
    },
  ],
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

/**
 * Puzzle 4: The Midnight Drive
 */
const PUZZLE_MIDNIGHT_DRIVE: V5Puzzle = {
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
  cards: [
    card({
      id: 'sleep_cam',
      strength: 4,
      evidenceType: 'SENSOR',
      location: 'BEDROOM',
      time: '2:10 AM',
      claim: 'Bedroom camera shows you in bed at 2:10 AM',
      presentLine: "Check the bedroom camera. I'm in bed at 2:10. Clear as day. Or night.",
      isLie: false,
    }),
    card({
      id: 'spouse_alibi',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'BEDROOM',
      time: 'all night',
      claim: 'Spouse confirms you were in bed all night, never left',
      presentLine: 'My spouse was awake half the night with insomnia. They would have noticed if I got up.',
      isLie: false,
    }),
    card({
      id: 'phone_gps',
      strength: 3,
      evidenceType: 'DIGITAL',
      location: 'BEDROOM',
      time: 'all night',
      claim: 'Phone GPS shows you were home all night',
      presentLine: 'My phone never left the house. Check the location history.',
      isLie: false,
    }),
    card({
      id: 'sleep_meds',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'BEDROOM',
      time: '11:00 PM',
      claim: 'You took prescription sleep medication at 11 PM',
      presentLine: "I took Ambien at 11. I was out cold. Couldn't have driven if I wanted to.",
      isLie: false,
    }),
    card({
      id: 'dashcam',
      strength: 4,
      evidenceType: 'SENSOR',
      location: 'CAR',
      time: '2:15 AM',
      claim: "Dashcam shows you in the driver's seat at 2:15 AM",
      presentLine: "The dashcam caught me in the car at 2:15. But wait — that doesn't make sense. I was in bed.",
      isLie: true,
    }),
    card({
      id: 'gas_receipt',
      strength: 5,
      evidenceType: 'DIGITAL',
      location: 'GAS_STATION',
      time: '3:30 AM',
      claim: 'Gas station receipt at 3:30 AM shows your card and signature',
      presentLine: "There's a receipt with my signature from 3:30 AM at a gas station 30 miles away. But I was home. Someone forged it?",
      isLie: true,
    }),
  ],
  lies: [
    {
      cardId: 'dashcam',
      lieType: 'relational',
      reason: "The bedroom camera shows you in bed at 2:10 AM. The dashcam claims you were driving at 2:15 AM. You can't be in two places.",
      contradictsWith: 'sleep_cam',
    },
    {
      cardId: 'gas_receipt',
      lieType: 'implausible_timeline',
      reason: 'Your phone was connected to home WiFi all night. How did you sign a receipt 30 miles away at 3:30 AM?',
    },
  ],
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

/**
 * All V5 puzzles for the builtin pack.
 */
const V5_PUZZLES: readonly V5Puzzle[] = [
  PUZZLE_MIDNIGHT_PRINT,
  PUZZLE_GARAGE_DOOR,
  PUZZLE_DRONE_ORDER,
  PUZZLE_MIDNIGHT_DRIVE,
];

// ============================================================================
// Builtin Pack
// ============================================================================

/**
 * The builtin V5 puzzle pack.
 * Contains all core V5 puzzles for the game.
 */
export const BUILTIN_PACK: PuzzlePack = {
  version: '1.0.0',
  id: 'builtin-v5',
  name: 'V5 Core Puzzles',
  puzzles: V5_PUZZLES,
};

// ============================================================================
// Builtin Loader
// ============================================================================

/**
 * Create a PackLoader that serves the builtin pack.
 *
 * @returns PackLoader implementation for builtin puzzles
 */
export function createBuiltinLoader(): PackLoader {
  return {
    /**
     * List available packs (only builtin-v5)
     */
    listPacks(): PuzzlePackManifest[] {
      return [
        {
          id: BUILTIN_PACK.id,
          name: BUILTIN_PACK.name,
          version: BUILTIN_PACK.version,
          puzzleCount: BUILTIN_PACK.puzzles.length,
        },
      ];
    },

    /**
     * Load a pack by ID
     */
    loadPack(packId: string): Result<PuzzlePack, PackError> {
      if (packId === BUILTIN_PACK.id) {
        return ok(BUILTIN_PACK);
      }
      return err({
        code: 'PACK_NOT_FOUND',
        message: `Pack '${packId}' not found`,
      });
    },

    /**
     * Get a specific puzzle from a pack
     */
    getPuzzle(packId: string, slug: string): Result<V5Puzzle, PackError> {
      if (packId !== BUILTIN_PACK.id) {
        return err({
          code: 'PACK_NOT_FOUND',
          message: `Pack '${packId}' not found`,
        });
      }

      const puzzle = BUILTIN_PACK.puzzles.find(p => p.slug === slug);
      if (!puzzle) {
        return err({
          code: 'PUZZLE_NOT_FOUND',
          message: `Puzzle '${slug}' not found in pack '${packId}'`,
        });
      }

      return ok(puzzle);
    },
  };
}
