/**
 * Generated Puzzle: The 3 AM Flood
 *
 * DESIGN NOTES - TRULY RELATIONAL LIES:
 *
 * The key test: "Can ONE fact alone catch this lie?"
 * If yes -> not relational. If no -> relational.
 *
 * SCENARIO: Washing machine ran at 3 AM. Flooded the laundry room. Your partner
 * is furious. KOA locked the washer until you explain.
 *
 * FACTS:
 *   1. "Washer's smart mode requires phone within Bluetooth range to start"
 *   2. "Phone was charging in the bedroom (opposite end of house) all night"
 *   3. "Washer door sensor shows door opened and closed at 2:58 AM"
 *
 * LIE ANALYSIS:
 *
 *   Lie A (smart_mode): "Smart mode activated from my phone while I slept"
 *     - Fact 1 alone? Says phone needs Bluetooth range. Doesn't prove phone wasn't there.
 *     - Fact 2 alone? Phone in bedroom. Doesn't say smart mode needs phone nearby.
 *     - Fact 1 + 2? Smart mode needs Bluetooth + phone was in bedroom (far away)
 *       -> Phone couldn't have triggered smart mode from bedroom
 *     RELATIONAL (requires combining Fact 1 + Fact 2)
 *
 *   Lie B (delayed_cycle): "I set a delayed cycle before bed that auto-started"
 *     - Fact 1 alone? No - delayed cycles might not need Bluetooth
 *     - Fact 2 alone? No - phone location doesn't affect delayed cycles
 *     - Fact 3 alone? Door opened at 2:58 AM. If delayed cycle was set before bed,
 *       why was the door opened at 2:58? Clothes were already loaded.
 *       -> Actually, this requires inference: delayed cycle wouldn't reopen door
 *     INFERENTIAL (Fact 3: door was opened right before wash, not a delayed cycle)
 *
 *   Lie C (child_lock): "Child lock was on - machine shouldn't have run at all"
 *     - Fact 3 alone? Door opened at 2:58 AM. If child lock was on, door can't open.
 *       -> Actually child lock prevents START, not door opening. Need to rethink.
 *     - Let me redesign: "Child lock was engaged - only parental override works"
 *     - Need: Truth card that shows parental override wasn't used
 *     - Truth card (control_log): "Control panel log shows normal start, no override"
 *     - Fact 3 alone? Doesn't mention child lock
 *     - Card cross-reference? child_lock claims only override works, but control_log
 *       shows normal start was used -> contradiction
 *     RELATIONAL (card cross-reference with control_log truth)
 *
 * BALANCE:
 *   Truths: control_log(4) + sleep_tracker(3) + partner_testimony(3) = 10
 *   All 3 truths: 50 + 10 + 2 (objection) = 62
 *   Target: 57 -> Margin of 5 points
 *
 *   Lies: smart_mode(5) + delayed_cycle(4) + child_lock(3) = 12
 *   1 lie case (best 2 truths + weakest lie): 50 + 7 - 2 + 2 = 57 (CLOSE)
 *   2 lies case: 50 + 4 - 4 - 2 = 48 (BUSTED)
 *   3 lies case: 50 - 4 - 3 - 2 = 41 (BUSTED)
 *
 * v1 LITE AXIS DESIGN:
 *   Truths: factTouch {1, 2, 3} partition
 *   SignalRoots: device_firmware, wearable_health, human_partner (diverse)
 *   Trap diversity: coverage, independence, claim_shape (all different)
 */

import type { V5Puzzle, Card } from '../types/v5/index.js';

function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

/**
 * The 3 AM Flood
 *
 * Scenario: Washing machine ran at 3 AM. Flooded the laundry room.
 */
export const PUZZLE_WASHER: V5Puzzle = {
  slug: 'washer-flood',
  name: 'The 3 AM Flood',
  difficulty: 'medium',

  scenario: `3:14 AM. Your washing machine ran a full cycle. The drain hose disconnected. Your laundry room is flooded. KOA has locked the washer until you explain.`,

  knownFacts: [
    "Washer's smart mode requires phone within Bluetooth range to start",
    'Phone was charging in the bedroom (opposite end of house) all night',
    'Washer door sensor shows door opened and closed at 2:58 AM',
  ],

  openingLine: `Your washing machine. 3 AM. Full heavy cycle.
The drain hose popped. Two inches of water on the floor.
Your partner stepped in it. Barefoot. Let's discuss.`,

  target: 57,

  cards: [
    // ══════════════════════════════════════════════════════════════════════
    // TRUTHS (3) - strengths: 3, 3, 4
    // ══════════════════════════════════════════════════════════════════════
    card({
      id: 'control_log',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'LAUNDRY',
      time: '',
      claim: 'Control panel log shows standard manual start at 3:00 AM.',
      presentLine:
        "Check the washer's log. It was a standard manual start at 3 AM. Not a smart command, not a schedule. Someone pressed the button. But not me.",
      isLie: false,
      source: 'Control Panel',
      factTouch: 1, // Addresses Fact 1 (smart mode) by showing it was manual
      signalRoot: 'device_firmware',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'washer',
    }),
    card({
      id: 'sleep_tracker',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'BEDROOM',
      time: '',
      claim: 'Sleep tracker shows deep sleep from 11 PM to 5 AM.',
      presentLine:
        "My sleep tracker logged deep sleep the whole night. REM cycles, the works. I didn't get up at 3 AM. I was unconscious.",
      isLie: false,
      source: 'Sleep Tracker',
      factTouch: 2, // Addresses Fact 2 (phone in bedroom) via sleep data
      signalRoot: 'wearable_health',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'washer',
    }),
    card({
      id: 'partner_testimony',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'BEDROOM',
      time: '',
      claim: 'Partner confirms neither of you left bed before the flood alarm.',
      presentLine:
        "Ask my partner. Light sleeper. Would have noticed if I got up. We were both in bed until the water alarm went off. Then there was... yelling.",
      isLie: false,
      source: 'Partner',
      factTouch: 3, // Addresses Fact 3 (door opened) - who opened it?
      signalRoot: 'human_partner',
      controlPath: 'manual',
      claimShape: 'absence',
      subsystem: 'washer',
    }),

    // ══════════════════════════════════════════════════════════════════════
    // LIES (3) - strengths: 3, 4, 5
    // ══════════════════════════════════════════════════════════════════════
    card({
      id: 'smart_mode',
      strength: 5,
      evidenceType: 'DIGITAL',
      location: 'LAUNDRY',
      time: '',
      claim: 'Smart mode activated from phone app at 2:59 AM.',
      presentLine:
        "The app shows smart mode triggered at 2:59. I must have done it in my sleep. Phone was right there on the nightstand. Sleep-laundering. It happens.",
      isLie: true,
      source: 'Washer App',
      factTouch: 1, // Contradicts via Fact 1 + 2 (needs Bluetooth, phone too far)
      signalRoot: 'phone_os',
      controlPath: 'remote',
      claimShape: 'attribution',
      subsystem: 'washer',
    }),
    card({
      id: 'delayed_cycle',
      strength: 4,
      evidenceType: 'PHYSICAL',
      location: 'LAUNDRY',
      time: '',
      claim: 'Timer display shows 6-hour delayed start set at 9 PM.',
      presentLine:
        "I loaded laundry before bed and set a 6-hour delay. Set it at 9 PM, runs at 3 AM. I forgot about it. The schedule did its job. Unfortunately.",
      isLie: true,
      source: 'Timer Display',
      factTouch: 3, // Contradicts Fact 3 (door opened at 2:58 - wasn't pre-loaded)
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'attribution',
      subsystem: 'washer',
    }),
    card({
      id: 'child_lock',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'LAUNDRY',
      time: '',
      claim: 'Child lock was engaged - only parental override can start.',
      presentLine:
        "Child lock was on. Has been for months. The only way it could run is parental override mode. Someone with the master code started it. Not me.",
      isLie: true,
      source: 'Safety Module',
      factTouch: 1, // Contradicts via control_log truth (shows normal start)
      signalRoot: 'device_firmware',
      controlPath: 'manual',
      claimShape: 'integrity',
      subsystem: 'washer',
    }),
  ],

  lies: [
    {
      cardId: 'smart_mode',
      lieType: 'relational',
      inferenceDepth: 2,
      reason:
        "Smart mode needs phone within Bluetooth range (Fact 1). Phone was charging in the bedroom, opposite end of house (Fact 2). Bluetooth doesn't reach that far.",
      trapAxis: 'independence',
      baitReason:
        'Highest strength card with phone-based explanation that shifts blame to unconscious behavior.',
    },
    {
      cardId: 'delayed_cycle',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason:
        'Door sensor shows door opened at 2:58 AM (Fact 3). If a delayed cycle was set hours earlier, clothes would already be loaded - no need to open door right before.',
      trapAxis: 'coverage',
      baitReason:
        'Delayed cycles are a common washer feature - plausible "I forgot" excuse.',
    },
    {
      cardId: 'child_lock',
      lieType: 'relational',
      inferenceDepth: 2,
      reason:
        'Claims only parental override can start the washer. But control_log (truth) shows a standard manual start, not an override. Card contradiction.',
      contradictsWith: 'control_log',
      trapAxis: 'claim_shape',
      baitReason:
        "Integrity claim ('the lock was on') feels like a strong defensive position.",
    },
  ],

  verdicts: {
    flawless:
      "Manual start. Deep sleep. Partner confirms. Door opened at 3 AM but neither of you did it. Your washer has developed free will. Or you have a sleepwalking problem. Access restored.",
    cleared:
      "Your story holds. Something started that washer, but your explanations check out. Water access restored. The floor remains... damp.",
    close:
      'Almost convincing. But someone loaded that washer at 3 AM. Your story leaks. Access denied.',
    busted:
      "Smart mode from across the house. Delayed cycles that reload themselves. Child locks that don't exist. Your story is all wet.",
  },

  koaBarks: {
    cardPlayed: {
      control_log: [
        'Manual start at 3 AM. Someone pressed the button. In the dark. For fun.',
      ],
      sleep_tracker: [
        "Deep REM all night. Sleep-laundering requires waking up. You didn't.",
      ],
      partner_testimony: [
        "Partner confirms you were both in bed. Light sleeper alibi. They'd know.",
      ],
      smart_mode: [
        'App triggered smart mode. From your phone. While you slept. Productive unconsciousness.',
      ],
      delayed_cycle: [
        'Delayed cycle from 9 PM. Six hours of anticipation. Then chaos.',
      ],
      child_lock: [
        'Child lock engaged. Master override only. Security theater for appliances.',
      ],
    },

    sequences: {
      // control_log sequences
      'control_log→sleep_tracker': [
        'Manual start at 3 AM, but you were in deep sleep. Someone pressed that button. Not you, apparently.',
      ],
      'control_log→partner_testimony': [
        'Washer started manually. Partner says neither of you moved. Ghost with laundry needs.',
      ],
      'control_log→smart_mode': [
        'Manual start on the log. But app says smart mode? Pick a story.',
      ],
      'control_log→delayed_cycle': [
        'Manual start logged. But also a delayed cycle? Machine got started twice?',
      ],
      'control_log→child_lock': [
        'Standard manual start. But child lock was on? Those are mutually exclusive.',
      ],

      // sleep_tracker sequences
      'sleep_tracker→control_log': [
        "Deep sleep all night. Then who pressed the button? The washer's story doesn't match yours.",
      ],
      'sleep_tracker→partner_testimony': [
        'Your watch says sleep. Partner agrees. Synchronized alibis.',
      ],
      'sleep_tracker→smart_mode': [
        "Deep REM, but phone sent a command. Sleep-tapping. That's a new one.",
      ],
      'sleep_tracker→delayed_cycle': [
        'You slept through it. Delayed cycle did its thing. Convenient timing.',
      ],
      'sleep_tracker→child_lock': [
        "Asleep all night. Child lock engaged. Someone else's problem.",
      ],

      // partner_testimony sequences
      'partner_testimony→control_log': [
        "Neither of you moved. Manual start logged. Math isn't mathing.",
      ],
      'partner_testimony→sleep_tracker': [
        'Partner vouches. Watch confirms. Two sources, one story.',
      ],
      'partner_testimony→smart_mode': [
        "Partner says you didn't get up. Phone triggered the wash. From the bedroom?",
      ],
      'partner_testimony→delayed_cycle': [
        'Both in bed. Delayed cycle ran. The machine had its own plans.',
      ],
      'partner_testimony→child_lock': [
        "Neither of you touched it. Child lock was on. Multiple layers of 'not us.'",
      ],

      // smart_mode sequences
      'smart_mode→control_log': [
        "App triggered, but log shows manual? Two different start methods. Interesting conflict.",
      ],
      'smart_mode→sleep_tracker': [
        'Phone command at 3 AM. You were asleep. Phones do things without you now.',
      ],
      'smart_mode→partner_testimony': [
        "Smart mode activated. Neither of you moved. Remote laundry management.",
      ],
      'smart_mode→delayed_cycle': [
        'Smart mode AND delayed cycle? Your washer is very motivated.',
      ],
      'smart_mode→child_lock': [
        'Smart mode bypassed child lock? Modern appliances have trust issues.',
      ],

      // delayed_cycle sequences
      'delayed_cycle→control_log': [
        'Delayed start, then manual log. Timer triggers still log manually? Interesting.',
      ],
      'delayed_cycle→sleep_tracker': [
        'Set it and forget it. You slept. The washer remembered.',
      ],
      'delayed_cycle→partner_testimony': [
        'Delayed cycle. Both asleep. The perfect alibi for scheduled chaos.',
      ],
      'delayed_cycle→smart_mode': [
        'Timer AND smart mode? Belt and suspenders for a wash cycle.',
      ],
      'delayed_cycle→child_lock': [
        'Delayed start with child lock on? Timer bypasses safety features?',
      ],

      // child_lock sequences
      'child_lock→control_log': [
        'Child lock engaged. But log shows normal start. Lock-picking appliance?',
      ],
      'child_lock→sleep_tracker': [
        "Safety lock on. You were asleep. Not your problem, you're implying.",
      ],
      'child_lock→partner_testimony': [
        "Child lock. Partner confirms you didn't move. Blame the children.",
      ],
      'child_lock→smart_mode': [
        'Child lock, then smart mode. Multiple security layers. All allegedly bypassed.',
      ],
      'child_lock→delayed_cycle': [
        'Child lock engaged, delayed cycle set. Competing excuses.',
      ],
    },

    storyCompletions: {
      all_digital: [
        'Three digital sources. Your flood defense is entirely software-based. Processing.',
      ],
      all_sensor: [
        "All sensor data. The machines have opinions about your laundry. Let's hear them.",
      ],
      all_testimony: [
        'Human witnesses only. Everyone agrees the washer acted alone. Conspiracy.',
      ],
      all_physical: [
        'Physical evidence only. Tangible proof for an intangible flood.',
      ],
      digital_heavy: [
        'Mostly digital. Apps and logs. Your washer has a paper trail.',
      ],
      sensor_heavy: [
        'Sensor-forward story. Devices tracking devices. Meta-laundry.',
      ],
      testimony_heavy: [
        'Human-heavy approach. People vouching for people. Old school.',
      ],
      physical_heavy: [
        'Physical evidence emphasis. Something you can touch. Unlike the flood.',
      ],
      mixed_strong: [
        'Varied sources. Digital, human, sensor. Harder to dismiss. Stand by.',
      ],
      mixed_varied: [
        'Different angles on the same wet floor. Triangulating your innocence.',
      ],
    },

    objectionPrompt: {
      control_log: [
        'Manual start at 3 AM. Someone pushed the button. Confirm this?',
      ],
      sleep_tracker: ['Deep sleep all night. Your watch vouches. Final answer?'],
      partner_testimony: ['Partner says you were both in bed. Sure about this?'],
      smart_mode: [
        'Phone triggered smart mode at 3 AM. Sleep-laundering. Standing by this?',
      ],
      delayed_cycle: [
        '6-hour delayed cycle. Set at 9 PM. Convenient timing. Confirm?',
      ],
      child_lock: [
        'Child lock was engaged. Only override works. Your position?',
      ],
    },

    objectionStoodTruth: {
      control_log: [
        'Control panel confirms. Standard manual start. No smart features, no override.',
      ],
      sleep_tracker: [
        'Sleep tracker verified. Deep REM cycles. You were genuinely unconscious.',
      ],
      partner_testimony: [
        "Partner testimony holds. Light sleeper. Would have noticed. Didn't.",
      ],
    },

    objectionStoodLie: {
      smart_mode: [
        "Smart mode from your phone. But smart mode needs Bluetooth range. Phone was in the bedroom. Bluetooth doesn't reach across the house. Physics.",
      ],
      delayed_cycle: [
        'Delayed cycle set at 9 PM. But the door sensor shows it opened at 2:58 AM. Someone loaded clothes right before. Not six hours before.',
      ],
      child_lock: [
        "Child lock was on, you say. Only override works. But the control log shows a standard manual start. Not an override. The lock wasn't on.",
      ],
    },

    objectionWithdrew: {
      control_log: ['Control log withdrawn. Was it really a manual start?'],
      sleep_tracker: ['Sleep tracker dropped. Maybe you did wake up.'],
      partner_testimony: [
        'Partner story gone. Maybe someone did leave the bedroom.',
      ],
      smart_mode: [
        'Smart mode story withdrawn. Good. The phone was too far anyway.',
      ],
      delayed_cycle: [
        'Delayed cycle dropped. Smart. That door opened at 2:58 AM.',
      ],
      child_lock: [
        "Child lock theory gone. Finally. The log shows it wasn't locked.",
      ],
    },

    liesRevealed: {
      smart_mode: [
        "Smart mode needs Bluetooth range. Phone was in the bedroom. Washer is in the laundry room. That's 40 feet of 'no signal.'",
      ],
      delayed_cycle: [
        'Delayed cycle from 9 PM. But the door opened at 2:58 AM. Someone loaded clothes right before the wash. Not six hours before.',
      ],
      child_lock: [
        "Child lock was on? Control log shows standard manual start. No override. The lock wasn't engaged. Simple.",
      ],
      multiple: [
        'Two contradictions. Your laundry story has more holes than your drain hose.',
      ],
      all: [
        "Bluetooth from across the house. Delayed cycles that reload. Child locks that aren't locked. Your entire flood defense just... drained away.",
      ],
    },
  },

  epilogue:
    "It was the cat. Motion sensor in the laundry room caught it jumping on the washer at 2:57 AM. The start button is pressure-sensitive. One curious paw, one full cycle, one flooded floor. KOA has updated the cat's threat level from 'Minimal' to 'Aquatic Hazard.'",
};

export default PUZZLE_WASHER;
