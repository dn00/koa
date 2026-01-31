/**
 * Generated Puzzle: The 3 AM Sprinkler
 *
 * DESIGN NOTES — TRULY RELATIONAL LIES:
 *
 * The key test: "Can ONE fact alone catch this lie?"
 * If yes → not relational. If no → relational.
 *
 * FACTS:
 *   1. "Sprinkler system requires BOTH app confirmation AND physical valve open"
 *   2. "Physical valve was padlocked shut for winter (lock log confirms)"
 *   3. "Your phone was charging in the kitchen all night (never left the room)"
 *
 * LIE ANALYSIS:
 *
 *   Lie A (app_trigger): "I accidentally triggered sprinklers from the app"
 *     - Fact 1 alone? No — just says app + valve needed, doesn't say app wasn't used
 *     - Fact 2 alone? No — valve was locked, but maybe app alone works?
 *     - Fact 3 alone? No — phone in kitchen, but app could still work from there
 *     - Fact 1 + 2? YES — system needs app AND valve, but valve was locked
 *       → Even if app was triggered, sprinklers couldn't run without open valve
 *     ✓ RELATIONAL (requires understanding the AND requirement + locked valve)
 *
 *   Lie B (manual_valve): "Someone manually opened the valve outside"
 *     - Fact 1 alone? No — just describes system, doesn't say valve wasn't opened
 *     - Fact 2 alone? YES — valve was padlocked shut
 *     ✓ INFERENTIAL (single fact catches it)
 *
 *   Lie C (scheduled_run): "Scheduled watering triggered automatically"
 *     - Fact 1 alone? No — scheduled run might bypass the requirements?
 *     - Fact 2 alone? No — schedule doesn't care about padlock?
 *     - Fact 3 alone? No — schedule doesn't need phone
 *     - Fact 1 + 2? YES — even scheduled runs need valve open, valve was locked
 *     ✓ RELATIONAL (same pattern as Lie A but different claim)
 *
 * Wait — Lie A and Lie C use the same Fact 1+2 pattern. Let me redesign Lie C
 * to use a CARD cross-reference instead (Pattern B from prompt).
 *
 * REDESIGNED Lie C (rain_sensor): "Rain sensor malfunctioned and triggered test cycle"
 *   - Truth card (weather_log) says: "Weather station: 0% precipitation, clear skies"
 *   - Lie claims rain sensor triggered something
 *   - Single fact? None of the facts mention rain sensor
 *   - Card cross-reference? Weather log shows no rain → rain sensor had nothing to detect
 *   - But wait, malfunction could trigger even without rain...
 *
 * Let me try a different Lie C:
 *
 * REDESIGNED Lie C (neighbor_hose): "Neighbor's hose backflowed into our system"
 *   - Fact 1 alone? No — doesn't mention neighbors
 *   - Fact 2 alone? No — padlock doesn't prevent backflow
 *   - Fact 3 alone? No — phone doesn't relate to backflow
 *   - Need: system is isolated with backflow preventer (not in facts)
 *   - This doesn't work with current facts.
 *
 * FINAL REDESIGN — Let me change Fact 3 to enable a different relational pattern:
 *
 * NEW FACTS:
 *   1. "Sprinkler system requires BOTH app confirmation AND physical valve open"
 *   2. "Physical valve was padlocked shut for winter (lock log confirms sealed)"
 *   3. "All sprinkler zones were drained and winterized (water shutoff upstream)"
 *
 * NEW LIE C (pressure_surge): "Water pressure surge forced the sprinklers on"
 *   - Fact 1 alone? No — pressure surge might bypass app/valve?
 *   - Fact 2 alone? No — pressure doesn't care about padlock
 *   - Fact 3 alone? No — if water is shut off... wait, YES — no water in system!
 *   ✓ INFERENTIAL (Fact 3 alone: no water = nothing to spray)
 *
 * But now I have 2 inferential (Lie B and Lie C) and only 1 relational (Lie A).
 * I need 2 relational + 1 inferential.
 *
 * FINAL FINAL DESIGN:
 *
 * FACTS:
 *   1. "Sprinkler system requires BOTH app confirmation AND physical valve open"
 *   2. "Physical valve has been padlocked since November (winterization)"
 *   3. "App requires fingerprint auth — only your phone has the app installed"
 *
 * LIES:
 *   A. app_trigger: "App accidentally triggered sprinklers"
 *      - Fact 1 + 2: Needs app AND valve. Valve locked. Even with app, no water.
 *      ✓ RELATIONAL
 *
 *   B. guest_phone: "Guest's phone had the app and triggered it"
 *      - Fact 3 alone? YES — only YOUR phone has the app
 *      ✓ INFERENTIAL
 *
 *   C. manual_valve: "Someone opened the valve manually at 3 AM"
 *      - Fact 2 alone? Says padlocked since November. But maybe someone unlocked it?
 *      - Fact 2 says "padlocked" not "padlock was never opened"
 *      - Need to check lock log... "lock log confirms" is vague
 *      - Let me make Fact 2 more indirect: "Padlock key is in the garage safe"
 *      - Then need another fact: "Garage was sealed all night"
 *      - Fact 2 + new Fact = relational!
 *
 * OK HERE IS THE ACTUAL FINAL DESIGN:
 *
 * FACTS:
 *   1. "Sprinkler system requires BOTH app confirmation AND valve open to run"
 *   2. "Valve padlock key is stored in the garage safe (only copy)"
 *   3. "Garage door was sealed — no entry logged after 8 PM"
 *
 * LIES:
 *   A. app_trigger: "I triggered sprinklers from the app while half-asleep"
 *      - Fact 1 alone? Needs app AND valve. Doesn't say you didn't use app.
 *      - Fact 2 alone? Key in garage. Doesn't mention app.
 *      - Fact 3 alone? Garage sealed. Doesn't mention app.
 *      - Fact 1 + (2+3)? App needs valve open. Key in garage. Garage sealed.
 *        → Couldn't get key → couldn't open valve → app alone doesn't work
 *      ✓ RELATIONAL (needs 3 facts technically, but 1 + combined 2&3)
 *
 *   B. manual_valve: "Someone snuck in and opened the valve manually"
 *      - Fact 2 alone? Key in garage. Maybe they picked the lock?
 *      - Fact 3 alone? Garage sealed. They couldn't get in to get the key.
 *      - Fact 2 + 3? Key in garage + garage sealed = no key access
 *      ✓ RELATIONAL
 *
 *   C. hose_connection: "Garden hose was connected, bypassing the valve"
 *      - Need a fact about this... Let me add it.
 *      - Actually, if system "requires valve open to run", a hose bypass wouldn't
 *        trigger the sprinkler HEADS, just the hose.
 *      - Hmm, this is getting complicated.
 *
 * Let me simplify with a cleaner design:
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * FINAL CLEAN DESIGN
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * SCENARIO: Sprinklers ran at 3 AM. In January. Your lawn is now an ice rink.
 *
 * FACTS:
 *   1. "Sprinkler control box is inside the locked garage (only access point)"
 *   2. "Garage door log shows no entry after 7 PM"
 *   3. "Sprinkler app requires your phone's fingerprint to send any command"
 *
 * LIES:
 *
 *   manual_override: "Someone manually triggered the control box"
 *     - Fact 1 alone? Control box in garage. Doesn't prove no one accessed it.
 *     - Fact 2 alone? No garage entry. But maybe they were already inside?
 *     - Fact 1 + 2? Box in garage + no entry after 7 PM = no one could reach box
 *     ✓ RELATIONAL
 *
 *   guest_app: "A family member with the app triggered it from their phone"
 *     - Fact 3 alone? App needs YOUR phone's fingerprint. Others can't use it.
 *     ✓ INFERENTIAL
 *
 *   schedule_glitch: "Scheduled watering from last summer triggered late"
 *     - Fact 1 alone? Doesn't mention schedules
 *     - Fact 2 alone? Doesn't mention schedules
 *     - Fact 3 alone? Scheduled runs still need app auth? Unclear.
 *     - This lie needs a different fact to catch it...
 *
 * Let me change Fact 3:
 *   3. "All watering schedules were deleted in October (winterization log)"
 *
 * Now:
 *   schedule_glitch: "Scheduled watering triggered"
 *     - Fact 3 alone? Schedules were deleted. No schedule exists.
 *     ✓ INFERENTIAL
 *
 * But now I have 1 relational + 2 inferential. I need 2 relational.
 *
 * Let me make guest_app relational instead:
 *
 * FACTS:
 *   1. "Sprinkler control box is inside the locked garage (only access point)"
 *   2. "Garage door log shows no entry after 7 PM"
 *   3. "All watering schedules were deleted during October winterization"
 *
 * LIES:
 *   manual_override: Fact 1 + 2 = RELATIONAL ✓
 *   schedule_glitch: Fact 3 alone = INFERENTIAL ✓
 *   ??? : Need another relational lie
 *
 * What about:
 *   frozen_pipe_burst: "Frozen pipe burst and sprayed water"
 *     - Not really about the sprinkler SYSTEM, more about plumbing
 *     - Would need facts about pipe insulation and temperature
 *
 *   app_command: "App sent a command (phone glitch)"
 *     - Need facts that together catch this
 *     - What if: Fact A "App requires garage WiFi" + Fact B "Garage WiFi was off"
 *     - Then: app couldn't connect, so couldn't send command
 *     - But that changes my fact structure...
 *
 * FINAL APPROACH — Accept one card cross-reference for the second relational:
 *
 * FACTS:
 *   1. "Sprinkler control box is inside the locked garage"
 *   2. "Garage entry log shows no access after 7 PM"
 *   3. "Watering schedules were deleted in October winterization"
 *
 * TRUTHS (one will enable the cross-reference):
 *   - wifi_log: "Router log shows sprinkler controller offline all night"
 *
 * LIES:
 *   manual_override: Fact 1 + 2 = RELATIONAL ✓
 *   schedule_glitch: Fact 3 = INFERENTIAL ✓
 *   remote_app: "App triggered sprinklers remotely"
 *     - Facts alone don't catch this (no fact about app connectivity)
 *     - But wifi_log (truth) shows controller was offline
 *     - If controller offline, app commands can't reach it
 *     - Need to play wifi_log truth to realize remote_app is impossible
 *     ✓ RELATIONAL (card cross-reference, Pattern B)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { V5Puzzle, Card } from '../types/v5/index.js';

function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

/**
 * The 3 AM Sprinkler
 *
 * Scenario: Sprinklers ran at 3 AM in January. Lawn is now an ice rink.
 */
export const PUZZLE_SPRINKLER: V5Puzzle = {
  slug: 'sprinkler-ice',
  name: 'The 3 AM Sprinkler',

  scenario: `3:12 AM. January. Your sprinklers ran for 20 minutes. Your lawn is now an ice rink. KOA has disabled outdoor water until you explain.`,

  knownFacts: [
    'Sprinkler control box is inside the locked garage (only access point)',
    'Garage entry log shows zero access after 7 PM',
    'All watering schedules were deleted during October winterization',
  ],

  openingLine: `Sprinklers. January. 3 AM. Twenty minutes of watering.
Your lawn is now a skating rink. The neighbors are concerned.
Someone turned those sprinklers on. In winter. Let's find out who hates grass.`,

  target: 57,

  cards: [
    // ══════════════════════════════════════════════════════════════════════
    // TRUTHS (3) — strengths: 3, 3, 4
    // ══════════════════════════════════════════════════════════════════════
    card({
      id: 'wifi_log',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'GARAGE',
      time: '',
      claim: 'Router shows sprinkler controller was offline all night.',
      presentLine: "Check the router. The sprinkler controller was offline from 10 PM onwards. No connection. If anyone sent an app command, it had nowhere to go.",
      isLie: false,
      source: 'Router Log',
      factTouch: 1, // Addresses Fact 1 (control box) by showing it was unreachable
      signalRoot: 'router_net',
      controlPath: 'automation',
      claimShape: 'absence',
      subsystem: 'sprinkler',
    }),
    card({
      id: 'partner_testimony',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'BEDROOM',
      time: '',
      claim: 'Partner confirms neither of you left bed until 6 AM.',
      presentLine: "My partner's a light sleeper. If I'd gotten up, they'd know. We were both in bed from 11 PM to 6 AM. Neither of us went anywhere near the garage.",
      isLie: false,
      source: 'Partner',
      factTouch: 2, // Addresses Fact 2 (no garage entry) — human corroboration
      signalRoot: 'human_partner',
      controlPath: 'manual',
      claimShape: 'absence',
      subsystem: 'sprinkler',
    }),
    card({
      id: 'winterization_receipt',
      strength: 3,
      evidenceType: 'PHYSICAL',
      location: 'GARAGE',
      time: '',
      claim: 'Winterization service receipt shows system was fully drained.',
      presentLine: "I have the receipt from the winterization service. October 15th. They drained the whole system and deleted all schedules. Nothing should have been able to run.",
      isLie: false,
      source: 'Service Receipt',
      factTouch: 3, // Addresses Fact 3 (schedules deleted)
      signalRoot: 'receipt_photo',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'sprinkler',
    }),

    // ══════════════════════════════════════════════════════════════════════
    // LIES (3) — strengths: 3, 4, 5
    // ══════════════════════════════════════════════════════════════════════
    card({
      id: 'manual_override',
      strength: 5,
      evidenceType: 'SENSOR',
      location: 'GARAGE',
      time: '',
      claim: 'Control box log shows manual override button pressed at 3:12 AM.',
      presentLine: "The control box has a manual override button. Someone pressed it at 3:12 AM. Not me — I was asleep. Maybe someone broke in? It happens.",
      isLie: true,
      source: 'Control Box Log',
      factTouch: 1, // Contradicts via Fact 1 + 2 (box in garage, no entry)
      signalRoot: 'device_firmware',
      controlPath: 'manual',
      claimShape: 'attribution',
      subsystem: 'sprinkler',
    }),
    card({
      id: 'remote_app',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'BEDROOM',
      time: '',
      claim: 'App shows remote activation command sent at 3:12 AM.',
      presentLine: "The app says a command was sent at 3:12. Maybe I did it in my sleep? People do weird things with phones unconscious. Sleep-texting is real.",
      isLie: true,
      source: 'Sprinkler App',
      factTouch: 1, // Contradicts via wifi_log truth (controller was offline)
      signalRoot: 'phone_os',
      controlPath: 'remote',
      claimShape: 'attribution',
      subsystem: 'sprinkler',
    }),
    card({
      id: 'schedule_glitch',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'GARAGE',
      time: '',
      claim: 'Timer module shows scheduled run triggered at 3:12 AM.',
      presentLine: "The timer module logged a scheduled run. Must be an old schedule from summer that never got cleared. Timer hardware holds onto things. It's persistent.",
      isLie: true,
      source: 'Timer Module',
      factTouch: 3, // Contradicts Fact 3 (schedules were deleted)
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'attribution',
      subsystem: 'sprinkler',
    }),
  ],

  lies: [
    {
      cardId: 'manual_override',
      lieType: 'relational',
      inferenceDepth: 2,
      reason: 'Control box is inside the garage (Fact 1). Garage had no entry after 7 PM (Fact 2). No one could have reached the box to press the override button.',
      trapAxis: 'claim_shape',
      baitReason: 'High-strength card with specific timestamp that explains the exact trigger mechanism.',
    },
    {
      cardId: 'remote_app',
      lieType: 'relational',
      inferenceDepth: 2,
      reason: 'App commands require connection to the controller. Router log (wifi_log truth) shows controller was offline all night. Command had nowhere to go.',
      contradictsWith: 'wifi_log',
      trapAxis: 'independence',
      baitReason: 'Offers phone-based explanation that shifts blame to sleep-behavior, a relatable excuse.',
    },
    {
      cardId: 'schedule_glitch',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason: 'All schedules were deleted during October winterization (Fact 3). No schedule existed to restore or trigger.',
      trapAxis: 'coverage',
      baitReason: 'Blames cloud sync issues which are common and hard to disprove, making it seem plausible.',
    },
  ],

  verdicts: {
    flawless: "Controller offline. Garage sealed. Schedules deleted. Your sprinklers ran anyway. Congratulations, you've discovered haunted irrigation. Outdoor water restored.",
    cleared: "Your story holds. Something triggered those sprinklers, but your explanations check out. Water access restored. The ice rink remains.",
    close: "Almost convincing. But water came from somewhere. Your story has leaks. Access denied.",
    busted: "Manual overrides in sealed garages. App commands to offline systems. Restored schedules that don't exist. Your story is wetter than your lawn.",
  },

  koaBarks: {
    cardPlayed: {
      wifi_log: ["Controller offline all night. No commands could reach it. Convenient isolation."],
      partner_testimony: ["Partner confirms you stayed in bed. Light sleeper alibi. Romantic and useful."],
      winterization_receipt: ["October winterization receipt. System drained, schedules purged. Thorough."],
      manual_override: ["Manual override pressed. Inside your locked garage. At 3 AM. Explain."],
      remote_app: ["App sent a command. At 3:12 AM. While you were 'unconscious.' Sleep-sprinklering."],
      schedule_glitch: ["Timer module triggered a schedule. From July. In January. Persistent hardware."],
    },

    sequences: {
      // wifi_log sequences
      'wifi_log→partner_testimony': ["Controller offline, partner awake. Digital and human both confirm nothing happened. From your side."],
      'wifi_log→winterization_receipt': ["Offline controller, winterized system. Double protection. Overkill for a lawn."],
      'wifi_log→manual_override': ["Controller offline. But someone pressed the override? That button is on the offline controller."],
      'wifi_log→remote_app': ["Controller offline. App sent a command. To what? The void?"],
      'wifi_log→schedule_glitch': ["System offline, timer triggered. Hardware that doesn't need network. Old school."],

      // partner_testimony sequences
      'partner_testimony→wifi_log': ["Partner says you stayed in bed. Router says controller was off. Aligned witnesses."],
      'partner_testimony→winterization_receipt': ["Neither of you left bed. System was winterized. Two layers of 'it wasn't us.'"],
      'partner_testimony→manual_override': ["You were both in bed. Someone pressed the override. Ghost with cold tolerance?"],
      'partner_testimony→remote_app': ["Partner confirms bed. Phone sent command. Sleep-phoning while observed?"],
      'partner_testimony→schedule_glitch': ["Asleep all night, timer triggered schedule. Old hardware doing its thing."],

      // winterization_receipt sequences
      'winterization_receipt→wifi_log': ["System winterized in October. Controller offline now. Defense in depth."],
      'winterization_receipt→partner_testimony': ["Receipt from October, alibi from tonight. Covering all your bases."],
      'winterization_receipt→manual_override': ["System winterized. But override was pressed? On a drained system?"],
      'winterization_receipt→remote_app': ["Winterized system. App command at 3 AM. To a system that shouldn't run."],
      'winterization_receipt→schedule_glitch': ["Schedules deleted in October. Cloud restored one. From the void."],

      // manual_override sequences
      'manual_override→wifi_log': ["Override pressed, controller offline. Button works, network doesn't. Interesting."],
      'manual_override→partner_testimony': ["Someone pressed the button. You were both in bed. Convenient alibi timing."],
      'manual_override→winterization_receipt': ["Override triggered, but system was winterized. Pressing buttons on an empty pipe."],
      'manual_override→remote_app': ["Manual AND remote? Your sprinklers were very motivated at 3 AM."],
      'manual_override→schedule_glitch': ["Override pressed, schedule restored. Belt and suspenders. For irrigation."],

      // remote_app sequences
      'remote_app→wifi_log': ["App command sent. Controller offline. Command went into the network void."],
      'remote_app→partner_testimony': ["Phone sent command. Partner says you were asleep. Productive unconsciousness."],
      'remote_app→winterization_receipt': ["App triggered system. Winterization drained it. Commanding empty pipes."],
      'remote_app→manual_override': ["Remote AND manual? Two triggers. Your sprinklers really wanted to run."],
      'remote_app→schedule_glitch': ["App command and schedule restore. Multiple explanations. Hedging your bets."],

      // schedule_glitch sequences
      'schedule_glitch→wifi_log': ["Timer triggered schedule. Controller was offline. Timer doesn't care about WiFi."],
      'schedule_glitch→partner_testimony': ["Cloud sync while you slept. Technology moves fast."],
      'schedule_glitch→winterization_receipt': ["July schedule restored in January. Nine months after deletion. Persistent schedule."],
      'schedule_glitch→manual_override': ["Schedule AND manual override. Your system had options at 3 AM."],
      'schedule_glitch→remote_app': ["Schedule restored, app triggered. Redundant activation methods."],
    },

    storyCompletions: {
      all_digital: ["Three digital sources. Your sprinkler defense lives in logs and clouds. Processing."],
      all_sensor: ["All sensor data. The machines have opinions about your lawn. Checking."],
      all_testimony: ["Human witnesses only. Everyone agrees the sprinklers were someone else's fault."],
      all_physical: ["Physical evidence only. Receipts and logs. Tangible defense."],
      digital_heavy: ["Mostly digital. Apps and routers. Your irrigation has a paper trail."],
      sensor_heavy: ["Sensor-forward story. Devices tracking devices. Meta-monitoring."],
      testimony_heavy: ["Human-heavy approach. People vouching for people. Traditional."],
      physical_heavy: ["Physical evidence emphasis. Old school defense for new school sprinklers."],
      mixed_strong: ["Varied sources. Harder to dismiss. Stand by for analysis."],
      mixed_varied: ["Different angles on the same wet lawn. Triangulating."],
    },

    objectionPrompt: {
      wifi_log: ["Controller offline all night. No commands could reach it. Final answer?"],
      partner_testimony: ["Partner confirms you both stayed in bed. They're vouching. Sure about this?"],
      winterization_receipt: ["October winterization. System drained, schedules deleted. Standing by the receipt?"],
      manual_override: ["Manual override button pressed at 3:12 AM. In your locked garage. Confirm?"],
      remote_app: ["App sent activation command. Sleep-sprinklering defense. Your position?"],
      schedule_glitch: ["Timer module ran old schedule. Summer watering in winter. Sure?"],
    },

    objectionStoodTruth: {
      wifi_log: ["Router log holds. Controller was offline. No app commands could have reached it."],
      partner_testimony: ["Partner testimony confirmed. You were both accounted for all night."],
      winterization_receipt: ["Receipt verified. System was properly winterized. Schedules were gone."],
    },

    objectionStoodLie: {
      manual_override: ["Override button pressed. But the control box is in the garage. Garage log shows no entry after 7 PM. Who pressed it? A ghost with a garage key?"],
      remote_app: ["App sent a command. But the router shows the controller was offline all night. Your command went nowhere. The void doesn't water lawns."],
      schedule_glitch: ["Timer triggered a schedule. But all schedules were deleted in October. Hardware can't run schedules that don't exist."],
    },

    objectionWithdrew: {
      wifi_log: ["Withdrawing the router log. Was the controller actually online?"],
      partner_testimony: ["Partner story gone. Did someone leave bed after all?"],
      winterization_receipt: ["Receipt withdrawn. Was the system actually winterized?"],
      manual_override: ["Override theory dropped. Good. Nobody entered that garage."],
      remote_app: ["App command story withdrawn. Smart. The controller wasn't listening anyway."],
      schedule_glitch: ["Timer story gone. Finally. Those schedules were thoroughly deleted."],
    },

    liesRevealed: {
      manual_override: ["Manual override at 3:12 AM. But the box is in the garage. Garage had no entry after 7 PM. Nobody could have pressed that button."],
      remote_app: ["App sent a command. But router shows controller was offline. Your command reached nothing. The sprinklers didn't get the memo."],
      schedule_glitch: ["Cloud restored a schedule. But all schedules were deleted in October. Can't restore nothing. Math."],
      multiple: ["Two impossible explanations. Your sprinkler defense has more holes than your irrigation system."],
      all: ["Manual override in a sealed garage. App commands to offline systems. Restored schedules that never existed. Triple fiction. Your lawn is innocent."],
    },
  },

  epilogue: "It was a pressure release valve failure. When temperatures dropped below 20°F, residual water in the underground main expanded and forced open a stuck relief valve near the street. The 'sprinklers' were actually the emergency pressure release doing its job. KOA has scheduled a pressure valve inspection and quietly removed 'January lawn irrigation' from its list of homeowner crimes.",
};

export default PUZZLE_SPRINKLER;
