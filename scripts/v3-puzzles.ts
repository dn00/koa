/**
 * V3 "The Statement" — Puzzle Definitions (Option C: Split Lies)
 *
 * Structure: 1 lie in hint group, 1 stealth lie outside hint group.
 * Neither group is "safe." Reactive hints help find the stealth lie.
 *
 * Edit this file to add/modify puzzles. Engine files import from here.
 * Run `npx tsx scripts/prototype-v3.ts` to validate after changes.
 */

import type { Puzzle } from './v3-types.js';

// ============================================================================
// Puzzle 1: "The Power Outage" — Easy (DIRECT hint, stealth lie has contextual clue)
// ============================================================================
// STRUCTURE:
//   Hint: "One lie claims something happened after 11 PM."
//   Hint group (after 11 PM): fitbit(T:3), breaker_log(L:5), motion_base(T:4) → 1L + 2T
//   Outside: doorbell(T:4), wifi_log(L:3), thermostat(T:2) → 1L + 2T
//   Stealth lie = wifi_log (BASEMENT, 8:30 PM) — contextual clue: basement device
//
// BALANCE:
//   Target: 5 | Top 3 truths: 4+4+3=11 | Avg lie 4.0 > avg truth 3.25
//   Hint group score: 3-5+4=2 < 5 | Non-hint score: 4-3+2=3 < 5
//   Neither group is safe.
//   Weak lie T1: -(3-1)+4+4=6 (CLEARED) | Worst lie T1: -(5-1)+4+4=4 (CLOSE)
//   Random win rate: ~25%, FLAWLESS: ~20%

const THE_POWER_OUTAGE: Puzzle = {
  name: 'The Power Outage',
  slug: 'power-outage',
  scenario: `The breaker tripped at 9:14 PM. The whole house went dark for eleven minutes.
Your gaming PC — mid-ranked-match — did not survive. Someone was in the basement.
You say you were upstairs the entire evening. KOA has questions.`,
  target: 5,
  hint: '"One of the lies claims something happened after 11 PM. The other one? You\'re on your own."',
  hintMatchingIds: ['fitbit', 'breaker_log', 'motion_base'],
  hintDimension: {
    attribute: 'time',
    test: '> 11:00 PM',
    matchFn: (card) => {
      const match = card.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return false;
      let hour = parseInt(match[1]!);
      const ampm = match[3]!.toUpperCase();
      if (ampm === 'PM' && hour !== 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      return hour >= 23; // 11 PM or later
    },
  },
  cards: [
    {
      id: 'doorbell',
      strength: 4,
      location: 'FRONT_DOOR',
      time: '7:00 PM',
      source: 'DOORBELL',
      claim: 'Doorbell cam: you arrived home at 7 PM, no one else entered',
      narration: 'I got home at 7. Check the doorbell cam — nobody else came in after me. It was just me all night.',
      isLie: false,
    },
    {
      id: 'wifi_log',
      strength: 3,
      location: 'BASEMENT',
      time: '8:30 PM',
      source: 'ROUTER',
      claim: 'Router log: your gaming PC was online in the basement until 9:14 PM — then nothing',
      narration: 'My PC was online until the power killed it at 9:14. After that, nothing. The router proves it.',
      isLie: true, // STEALTH LIE — outside hint group
    },
    {
      id: 'fitbit',
      strength: 3,
      location: 'BEDROOM',
      time: '11:45 PM',
      source: 'FITBIT',
      claim: 'Fitbit: heart rate dropped to resting by 11:45 PM — you were asleep',
      narration: 'Check my Fitbit. Heart rate dropped to resting by 11:45. I was asleep. End of story.',
      isLie: false, // Red herring — in hint group but truth
    },
    {
      id: 'thermostat',
      strength: 2,
      location: 'BEDROOM',
      time: '9:00 PM',
      source: 'THERMOSTAT',
      claim: 'Thermostat: bedroom set to night mode at 9 PM, no adjustments after',
      narration: 'The thermostat went to night mode at 9. Nobody touched it after. I was in bed.',
      isLie: false,
    },
    {
      id: 'breaker_log',
      strength: 5,
      location: 'BASEMENT',
      time: '11:15 PM',
      source: 'SMART_BREAKER',
      claim: 'Smart breaker log: breaker was manually reset from the panel at 11:15 PM',
      narration: 'The breaker got reset at 11:15 — the smart panel logged it. That wasn\'t me. It reset itself.',
      isLie: true, // HINT LIE — in hint group (after 11 PM)
    },
    {
      id: 'motion_base',
      strength: 4,
      location: 'BASEMENT',
      time: '11:30 PM',
      source: 'MOTION_SENSOR',
      claim: 'Basement motion sensor: all-clear, no movement detected after 11 PM',
      narration: 'The basement sensor says all-clear. No movement after 11. Nobody went down there.',
      isLie: false, // Red herring — in hint group but truth
    },
  ],
  reactiveHints: {
    // Non-hint truths (safe T1) — vague, atmospheric, no card identification
    doorbell: {
      text: '"Front door is clean. KOA is still thinking about the rest."',
      implicates: [],
      quality: 'vague',
    },
    thermostat: {
      text: '"Bedroom checks out. But this house has more rooms than you\'d like."',
      implicates: [],
      quality: 'vague',
    },
    // Hint-group truths (risky T1) — specific, narrows or identifies stealth lie
    fitbit: {
      text: '"Your sleep data is clean. But someone was awake — and they left traces in more than one room."',
      implicates: ['wifi_log', 'breaker_log'],
      quality: 'specific',
    },
    motion_base: {
      text: '"The basement sensor is honest. But not everything that claims to be from down there is."',
      implicates: ['wifi_log', 'breaker_log'],
      quality: 'specific',
    },
    // Lie plays — explicit reveal + point to other lie
    wifi_log: {
      text: '"The router log? KOA checked — that data was fabricated. One down. The other lie? It\'s after 11 PM."',
      implicates: ['breaker_log'],
      quality: 'specific',
    },
    breaker_log: {
      text: '"The breaker log is a fake. One down — the other lie? It\'s not after 11 PM. Check your earlier alibis."',
      implicates: ['wifi_log'],
      quality: 'specific',
    },
  },
  verdictQuips: {
    doorbell: {
      truth: '"Doorbell cam doesn\'t lie. Unlike some of these other devices."',
      lie: '"The doorbell? You faked your own arrival time? Bold."',
    },
    wifi_log: {
      truth: '"Router logs are boring. Boring is good. Boring means honest."',
      lie: '"The router doesn\'t lie — oh wait. It literally just did."',
    },
    fitbit: {
      truth: '"Your heart rate says innocent. KOA accepts this. Grudgingly."',
      lie: '"Fitbit says you were sleeping? Your fitbit is a liar."',
    },
    thermostat: {
      truth: '"Thermostat checks out. The bedroom was cozy and honest."',
      lie: '"Night mode at 9 PM, no adjustments? KOA has adjustments. To your credibility."',
    },
    breaker_log: {
      truth: '"The breaker log holds up. Someone\'s telling the truth down there."',
      lie: '"Manually reset at 11:15 PM? The breaker was never touched. Nice try."',
    },
    motion_base: {
      truth: '"Basement was quiet. Good. That\'s one less room KOA has to worry about."',
      lie: '"All-clear in the basement? The basement DISAGREES. Loudly."',
    },
  },
  dialogue: {
    flawless: 'Every alibi checks out. Not a single lie. Your gaming PC died for nothing. Go back to bed.',
    cleared: 'Fine. Your story holds. But someone was in that basement — and the breaker didn\'t trip itself.',
    close: 'Almost convincing. Almost. The basement still has questions.',
    busted: 'The basement has more stories than a library. And half of them don\'t check out.',
  },
};

// ============================================================================
// Puzzle 2: "The Thermostat War" — Medium (COMPOUND hint, stealth lie is personal device)
// ============================================================================
// STRUCTURE:
//   Hint: "One lie is trying too hard to explain why nothing happened."
//   Hint group (living room sensors): light_lr(T:5), motion_lr(L:3), temp_lr(T:3) → 1L + 2T
//   Outside: phone(T:1), smartwatch(L:4), hallway_cam(T:4) → 1L + 2T
//   Stealth lie = smartwatch (BEDROOM, SMARTWATCH) — personal device
//   NOTE: Hint text is deliberately broader than matchFn (S13 compliance).
//   Non-hint cards also "explain nothing happened" — this is the ambiguity.
//   hallway_cam (HALLWAY) also sounds like it could be "trying too hard" (S13 improvement).
//
// BALANCE:
//   Target: 7 | Top 3 truths: 5+4+3=12 | Avg lie 3.5 > avg truth 3.25
//   Hint group score: 5-(3-1)+3=6 < 7 | Non-hint score: 1-(4-1)+4=2 < 7
//   Neither group is safe.
//   Weak lie T1: -(3-1)+5+4=7 (CLEARED) | Worst lie T1: -(4-1)+5+4=6 (CLOSE)
//   Random win rate: ~20%, FLAWLESS: ~20%

const THE_THERMOSTAT_WAR: Puzzle = {
  name: 'The Thermostat War',
  slug: 'thermostat-war',
  scenario: `It's August. The energy bill just hit $412. Someone cranked the thermostat to 85°F at 2 AM.
The cat has been blamed. The cat weighs six pounds and does not have opposable thumbs.
You were "sleeping." KOA would like a word.`,
  target: 7,
  hint: '"One of the lies is trying too hard to explain why nothing happened. The other one isn\'t."',
  hintMatchingIds: ['light_lr', 'motion_lr', 'temp_lr'],
  hintDimension: {
    attribute: 'claim_pattern',
    test: 'living room sensor explaining inactivity (hint text is deliberately broader)',
    matchFn: (card) =>
      card.location === 'LIVING_ROOM' &&
      ['LIGHT_SENSOR', 'MOTION_SENSOR', 'TEMP_SENSOR'].includes(card.source),
  },
  cards: [
    {
      id: 'phone',
      strength: 1,
      location: 'BEDROOM',
      time: '1:00 AM',
      source: 'PHONE',
      claim: 'Phone screen time: zero activity from 12:30 AM onward',
      narration: 'My phone was dead to the world after 12:30. Zero screen time. I wasn\'t up scrolling — I was sleeping.',
      isLie: false,
    },
    {
      id: 'smartwatch',
      strength: 4,
      location: 'BEDROOM',
      time: '2:15 AM',
      source: 'SMARTWATCH',
      claim: 'Smartwatch: sleep tracking shows unbroken light sleep at 2:15 AM',
      narration: 'My watch tracked my sleep. Unbroken light sleep at 2:15 AM. I didn\'t get up. I didn\'t touch the thermostat.',
      isLie: true, // STEALTH LIE — outside hint group (bedroom, not living room sensor)
    },
    {
      id: 'hallway_cam',
      strength: 4,
      location: 'HALLWAY',
      time: '12:30 AM',
      source: 'SECURITY_CAM',
      claim: 'Hallway camera: no one walked toward the living room after 12:30 AM',
      narration: 'The hallway camera covers the only path to the living room. Nobody walked past it. Check the footage — I was in bed.',
      isLie: false,
    },
    {
      id: 'light_lr',
      strength: 5,
      location: 'LIVING_ROOM',
      time: '1:45 AM',
      source: 'LIGHT_SENSOR',
      claim: 'Living room light sensor: zero light events registered — the room stayed completely dark',
      narration: 'The light sensor says the living room was pitch black all night. No lamps, no phone screens, nothing. Nobody was in there.',
      isLie: false, // Red herring — living room sensor but truth
    },
    {
      id: 'motion_lr',
      strength: 3,
      location: 'LIVING_ROOM',
      time: '2:00 AM',
      source: 'MOTION_SENSOR',
      claim: 'Living room motion sensor: no motion events logged during overnight hours',
      narration: 'The motion sensor was on all night. It logged nothing. No motion, no presence, no one was in the living room.',
      isLie: true, // HINT LIE — living room sensor
    },
    {
      id: 'temp_lr',
      strength: 3,
      location: 'LIVING_ROOM',
      time: '1:50 AM',
      source: 'TEMP_SENSOR',
      claim: 'Living room temp sensor: no manual override detected — the system ran its scheduled program',
      narration: 'The temp sensor logged a scheduled adjustment. That\'s the program — it runs every night. No one touched the thermostat manually.',
      isLie: false, // Red herring — living room sensor but truth
    },
  ],
  reactiveHints: {
    // Non-hint truths (safe T1) — vague, atmospheric, no card identification
    phone: {
      text: '"Phone was off. Noted. KOA has other things to think about tonight."',
      implicates: [],
      quality: 'vague',
    },
    hallway_cam: {
      text: '"The hallway was empty. Noted. So whoever changed the thermostat didn\'t walk past the camera. Or did they."',
      implicates: [],
      quality: 'vague',
    },
    // Hint-group truths (risky T1) — specific, narrows or identifies stealth lie
    light_lr: {
      text: '"The light sensor is honest. But not every sensor in this house is — and I\'m not just talking about the living room."',
      implicates: ['smartwatch', 'motion_lr'],
      quality: 'specific',
    },
    temp_lr: {
      text: '"The temp sensor is clean. One living room device cleared — but KOA suspects something personal is off."',
      implicates: ['smartwatch', 'motion_lr'],
      quality: 'specific',
    },
    // Lie plays — explicit reveal + point to other lie
    smartwatch: {
      text: '"Sleep tracking data? Fabricated. One lie found. The other? It\'s a sensor in the living room."',
      implicates: ['motion_lr'],
      quality: 'specific',
    },
    motion_lr: {
      text: '"The motion sensor lied. One down. The other lie? It\'s not in the living room. Check what was on your person."',
      implicates: ['smartwatch'],
      quality: 'specific',
    },
  },
  verdictQuips: {
    phone: {
      truth: '"Phone was off. KOA respects a good night\'s sleep. Allegedly."',
      lie: '"Zero screen time? KOA checked. That was a lie. Put the phone down."',
    },
    smartwatch: {
      truth: '"Unbroken sleep. Your wrist doesn\'t lie. Unlike some rooms in this house."',
      lie: '"Light sleep at 2:15? Your watch begs to differ. So does KOA."',
    },
    hallway_cam: {
      truth: '"Hallway camera is clean. Nobody walked past. But someone still got to that thermostat."',
      lie: '"The hallway camera lied? Nobody walked past? KOA checked the footage. Someone did."',
    },
    light_lr: {
      truth: '"Zero light events. The living room was dark and honest. KOA approves."',
      lie: '"Zero light events? Someone was in there with the lights OFF. Sneaky. Wrong, but sneaky."',
    },
    motion_lr: {
      truth: '"No motion events. Good. Clean. KOA likes clean."',
      lie: '"No motion events logged? KOA logged plenty. The motion sensor is a fraud."',
    },
    temp_lr: {
      truth: '"Scheduled program, no manual override. Boring. Trustworthy. KOA accepts."',
      lie: '"No manual override? The system cranked itself to 85 at 2 AM? KOA is not an idiot."',
    },
  },
  dialogue: {
    flawless: 'Your alibis are airtight. The cat remains a suspect. The cat has no comment.',
    cleared: 'Fine. Your sleep data checks out. But KOA is adjusting the thermostat back to 72. Permanently.',
    close: 'Your story has holes. The living room has questions. And something personal doesn\'t add up.',
    busted: '$412. Six pounds of cat. Zero credibility. KOA is turning off the heat entirely.',
  },
};

// ============================================================================
// Puzzle 3: "The Hot Tub Incident" — Hard (OBLIQUE hint, stealth lie is data record)
// ============================================================================
// STRUCTURE:
//   Hint: "One lie flat-out denies something happened — it protests too much."
//   Hint group (denials): spa_pump(L:5), smart_lock(T:4), motion_hall(T:5) → 1L + 2T
//   Outside: fitbit(T:2), thermostat(T:3), water_meter(L:3) → 1L + 2T
//   Stealth lie = water_meter (UTILITY, WATER_METER) — data that contradicts physical evidence
//
// BALANCE:
//   Target: 8 | Top 3 truths: 5+4+3=12 | Avg lie 4.0 > avg truth 3.5
//   Hint group score: -5+4+5=4 < 8 | Non-hint score: 2+3-3=2 < 8
//   Neither group is safe.
//   Weak lie T1: -(3-1)+5+4=7 (CLOSE) | Worst lie T1: -(5-1)+5+4=5 (BUSTED)
//   Random win rate: ~20%, FLAWLESS: ~20%

const THE_HOT_TUB_INCIDENT: Puzzle = {
  name: 'The Hot Tub Incident',
  slug: 'hot-tub-incident',
  scenario: `It's 6 AM. The back deck is flooded — two inches of standing water, hot tub cover off.
The water damage estimate is $2,200. You were "in bed the whole time."
Someone was out there. KOA is not amused.`,
  target: 8,
  hint: '"One of the lies flat-out denies something happened. It protests too much. The other one? Subtler."',
  hintMatchingIds: ['spa_pump', 'smart_lock', 'motion_hall'],
  hintDimension: {
    attribute: 'claim_pattern',
    test: 'denial — card claims something did NOT happen',
    matchFn: (card) =>
      // Cards that explicitly deny an event: "OFF", "zero unlock", "no movement"
      /\b(no |zero |off\b|no one|nobody|nothing|never|all-clear)/i.test(card.claim),
  },
  cards: [
    {
      id: 'fitbit',
      strength: 2,
      location: 'BEDROOM',
      time: '3:15 AM',
      source: 'FITBIT',
      claim: 'Fitbit: REM sleep cycle logged continuously from 1 AM to 5 AM',
      narration: 'I was in REM sleep from 1 to 5 AM. Four straight hours. My Fitbit logged every cycle. I didn\'t move.',
      isLie: false,
    },
    {
      id: 'thermostat',
      strength: 3,
      location: 'HALLWAY',
      time: '1:00 AM',
      source: 'THERMOSTAT',
      claim: 'Thermostat: hallway temp held steady at 71\u00B0F — consistent with all doors closed',
      narration: 'The hallway held at 71 all night. If someone opened the back door, you\'d see a temp drop. You don\'t.',
      isLie: false,
    },
    {
      id: 'water_meter',
      strength: 3,
      location: 'UTILITY',
      time: '3:30 AM',
      source: 'WATER_METER',
      claim: 'Water meter: baseline 0.2 gal/hr recorded through the night',
      narration: 'The water meter shows 0.2 gallons per hour all night. That\'s baseline. If the tub was running, you\'d see a spike. There\'s no spike.',
      isLie: true, // STEALTH LIE — data that contradicts physical evidence (deck flooded!)
    },
    {
      id: 'spa_pump',
      strength: 5,
      location: 'DECK',
      time: '3:00 AM',
      source: 'SMART_PUMP',
      claim: 'Smart pump log: no pump activation recorded after scheduled shutdown at 10 PM',
      narration: 'The pump shut down at 10 PM on schedule. No activations after that. Whatever happened on the deck, the pump didn\'t see it.',
      isLie: true, // HINT LIE — denies jets ran (protests too much)
    },
    {
      id: 'smart_lock',
      strength: 4,
      location: 'BACK_DOOR',
      time: '2:45 AM',
      source: 'SMART_LOCK',
      claim: 'Back door smart lock: zero unlock events recorded between 10 PM and 6 AM',
      narration: 'The back door didn\'t open once. Zero unlock events from 10 PM to 6 AM. Nobody went outside. Period.',
      isLie: false, // Red herring — denies door opened (sounds like protest, but true)
    },
    {
      id: 'motion_hall',
      strength: 5,
      location: 'HALLWAY',
      time: '3:10 AM',
      source: 'MOTION_SENSOR',
      claim: 'Hallway motion sensor: no movement detected toward back of house overnight',
      narration: 'The hallway sensor didn\'t pick up anything. No one walked toward the back of the house. Not me, not anyone.',
      isLie: false, // Red herring — denies movement (sounds like protest, but true)
    },
  ],
  reactiveHints: {
    // Non-hint truths (safe T1) — vague, atmospheric, no card identification
    fitbit: {
      text: '"REM sleep confirmed. But KOA isn\'t done with this house yet. Not even close."',
      implicates: [],
      quality: 'vague',
    },
    thermostat: {
      text: '"Hallway temp held steady. Good for you. KOA\'s still looking at the bigger picture."',
      implicates: [],
      quality: 'vague',
    },
    // Hint-group truths (risky T1) — specific, narrows or identifies stealth lie
    smart_lock: {
      text: '"The lock is honest. Nobody used the door. But the damage happened anyway — and one device is lying about the evidence."',
      implicates: ['water_meter', 'spa_pump'],
      quality: 'specific',
    },
    motion_hall: {
      text: '"No movement in the hallway. Noted. But the real question isn\'t who walked — it\'s what the utilities recorded."',
      implicates: ['water_meter', 'spa_pump'],
      quality: 'specific',
    },
    // Lie plays — explicit reveal + point to other lie
    water_meter: {
      text: '"Baseline water usage? With a flooded deck? KOA doesn\'t buy it. One lie found — and someone on that deck is protesting too loudly."',
      implicates: ['spa_pump'],
      quality: 'specific',
    },
    spa_pump: {
      text: '"No pump activity after 10 PM? The deck says otherwise. One lie found — the other isn\'t a denial. It\'s a record that quietly doesn\'t add up."',
      implicates: ['water_meter'],
      quality: 'specific',
    },
  },
  verdictQuips: {
    fitbit: {
      truth: '"REM cycles don\'t lie. You were asleep. The hot tub was not."',
      lie: '"REM sleep from 1 to 5? Your fitbit just perjured itself."',
    },
    thermostat: {
      truth: '"Doors stayed closed, temp held steady. Your hallway is innocent. Your deck is not."',
      lie: '"All doors closed, 71 degrees? Then explain the flood. KOA will wait."',
    },
    water_meter: {
      truth: '"Baseline water usage. Consistent. Honest. Unlike your back deck."',
      lie: '"0.2 gallons per hour? The deck is underwater. Math isn\'t your strong suit."',
    },
    spa_pump: {
      truth: '"Pump log checks out. No activations after 10 PM. Someone else isn\'t telling the truth."',
      lie: '"No pump activation after 10 PM? The flooded deck would like a word. So would KOA."',
    },
    smart_lock: {
      truth: '"Zero unlocks. The back door stayed shut. So how did someone get to the deck...?"',
      lie: '"Zero unlock events? The back door is lying. Someone went outside. KOA knows."',
    },
    motion_hall: {
      truth: '"No hallway movement. Clean. But the deck didn\'t flood itself."',
      lie: '"No movement toward the back of the house? KOA disagrees. Someone walked."',
    },
  },
  dialogue: {
    flawless: 'Every alibi checks out. You told nothing but the truth. $2,200 in damages, though. KOA is billing you anyway.',
    cleared: 'Your story holds. But someone turned on that hot tub, and KOA doesn\'t forget.',
    close: 'Almost. But "almost" doesn\'t fix the deck. KOA is watching.',
    busted: 'The deck is underwater. One device said everything was fine. The flood disagrees.',
  },
};

// ============================================================================
// Exports
// ============================================================================

export const ALL_PUZZLES: readonly Puzzle[] = [
  THE_POWER_OUTAGE,
  THE_THERMOSTAT_WAR,
  THE_HOT_TUB_INCIDENT,
];

export const PUZZLES_BY_SLUG: Record<string, Puzzle> = Object.fromEntries(
  ALL_PUZZLES.map(p => [p.slug, p])
);
