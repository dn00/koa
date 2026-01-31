/**
 * Generated Puzzle: The 4 AM Order
 *
 * 7-MINUTE DESIGN (2 relational + 1 inferential):
 *   - Lie A (voice_log): RELATIONAL - Claims voice command heard, but Fact 1 (speaker muted) + Fact 2 (no one awake) together catch it
 *   - Lie B (phone_app): RELATIONAL - Claims app purchase, but Fact 1 (speaker muted) + Fact 3 (phone in DND) together catch it
 *   - Lie C (tv_ad): INFERENTIAL - Claims TV ad triggered it, but Fact 2 alone catches it (TV was off overnight)
 *
 *   Anchor truth: sleep_watch (clearly safe, matches "no one awake" fact)
 *
 * RELATIONAL LIE VERIFICATION:
 *   voice_log:
 *     - Can Fact 1 alone catch it? NO - speaker muted doesn't prove no one spoke
 *     - Can Fact 2 alone catch it? NO - TV off doesn't prove no voice command
 *     - Can Fact 3 alone catch it? NO - phone DND doesn't prove no voice
 *     - Need Fact 1 (muted) + Fact 2 (no one awake to speak)? YES - RELATIONAL
 *
 *   phone_app:
 *     - Can Fact 1 alone catch it? NO - speaker muted doesn't prove no app purchase
 *     - Can Fact 2 alone catch it? NO - TV off doesn't disprove app purchase
 *     - Can Fact 3 alone catch it? NO - phone DND blocks notifications, not app use
 *     - Need Fact 1 (muted = voice disabled) + Fact 3 (DND = no confirmations received)? YES - RELATIONAL
 *
 *   tv_ad:
 *     - Can Fact 1 alone catch it? NO - muted speaker doesn't disprove TV ad
 *     - Can Fact 2 alone catch it? YES - TV was off, so no ad could have played
 *     - INFERENTIAL (single-fact)
 *
 * FIXED STRENGTHS:
 *   Truths: 3, 3, 4 (sleep_watch=4, partner_testimony=3, transaction_log=3)
 *   Lies: 3, 4, 5 (tv_ad=3, phone_app=4, voice_log=5)
 *
 * TYPE DISTRIBUTION (4 types, max 2 each):
 *   SENSOR: 1 (sleep_watch)
 *   DIGITAL: 2 (phone_app, transaction_log)
 *   TESTIMONY: 1 (partner_testimony)
 *   PHYSICAL: 2 (voice_log, tv_ad)
 *
 * BALANCE:
 *   Truths: sleep_watch(4) + partner_testimony(3) + transaction_log(3) = 10
 *   All 3 truths: 50 + 10 + 2 (objection) = 62 -> FLAWLESS
 *   Target: 57 -> Margin of 5 points
 *
 *   Lies: voice_log(5) + phone_app(4) + tv_ad(3) = 12
 *   1 lie case (best 2 truths + weakest lie):
 *     50 + 7 (sleep_watch + partner_testimony) - 2 (tv_ad penalty) + 2 (objection) = 57 (CLOSE)
 *   2 lies case: 50 + 4 - 4 - 2 + 2 = 50 (BUSTED)
 *   3 lies case: 50 - 4 - 3 - 2 = 41 (BUSTED)
 *
 *   Random win rate: C(3,3)/C(6,3) = 1/20 = 5%
 *
 * v1 LITE AXIS DESIGN:
 *   Truths: factTouch {1, 2, 3} partition (each truth addresses one fact)
 *   SignalRoots: wearable_health, human_partner, koa_cloud (diverse)
 *   Concern scenario: If player picks voice_log + phone_app on T1/T2,
 *     triggers "same_system" concern (both claim device/app triggered purchase)
 *   P4+ Constraint: Dodging the device concern still leaves tv_ad (coverage trap)
 */

import type { V5Puzzle, Card } from '../types/v5/index.js';

/**
 * Helper to create a CardId-typed card.
 */
function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

/**
 * The 4 AM Order
 *
 * Scenario: Smart speaker ordered 47 pool noodles at 4:12 AM.
 * Account is now locked until you explain how this happened.
 */
export const PUZZLE_SPEAKER: V5Puzzle = {
  slug: 'speaker-order',
  name: 'The 4 AM Order',

  scenario: `4:12 AM. Your smart speaker ordered 47 pool noodles. You don't have a pool. KOA has locked purchasing until you explain.`,

  // Mini: exactly 3 facts, each catches one lie (1:1 mapping)
  knownFacts: [
    'Smart speaker was in mute mode from 10 PM to 6 AM (voice disabled)',
    'TV power log shows it was off from 11 PM to 7 AM',
    'Phone was in Do Not Disturb mode with all notifications blocked',
  ],

  openingLine: `Pool noodles. Forty-seven of them. At 4:12 AM.
Your speaker decided you needed them. Urgently.
You don't have a pool. Let's discuss.`,

  target: 57,

  cards: [
    // TRUTHS (3)
    card({
      id: 'sleep_watch',
      strength: 4,
      evidenceType: 'SENSOR',
      location: 'BEDROOM',
      time: '', // Mini: no time displayed
      claim: 'Sleep tracker shows deep REM from 3:45 to 5:30 AM.',
      presentLine: "My sleep tracker logged deep REM at 4:12. The good kind. The kind where you're definitely not ordering pool toys. I was unconscious.",
      isLie: false,
      source: 'Sleep Tracker',
      // v1 Lite tags
      factTouch: 2, // Supports fact 2: TV was off (aligns with being asleep)
      signalRoot: 'wearable_health',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'speaker',
    }),
    card({
      id: 'partner_testimony',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'BEDROOM',
      time: '', // Mini: no time displayed
      claim: 'Partner confirms you were snoring at 4 AM.',
      presentLine: "Ask my partner. I was snoring. Loudly. At 4:12 AM I was making sounds no conscious person could make. It's documented. They're not happy about it.",
      isLie: false,
      source: 'Partner',
      // v1 Lite tags
      factTouch: 1, // Supports fact 1: speaker muted (you couldn't have spoken)
      signalRoot: 'human_partner',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'speaker',
    }),
    card({
      id: 'transaction_log',
      strength: 3,
      evidenceType: 'DIGITAL',
      location: 'CLOUD',
      time: '', // Mini: no time displayed
      claim: 'Purchase log shows no confirmation prompt was acknowledged.',
      presentLine: "Check the transaction log. No confirmation was ever acknowledged. The order went through without the usual 'are you sure' step. Something bypassed normal flow.",
      isLie: false,
      source: 'Purchase History',
      // v1 Lite tags
      factTouch: 3, // Supports fact 3: phone in DND (no confirmations possible)
      signalRoot: 'koa_cloud',
      controlPath: 'automation',
      claimShape: 'absence',
      subsystem: 'speaker',
    }),
    // LIES (3) - 2 relational + 1 inferential
    card({
      id: 'voice_log',
      strength: 5,
      evidenceType: 'PHYSICAL',
      location: 'LIVING_ROOM',
      time: '', // Mini: no time displayed
      claim: 'Speaker audio log captured a voice command at 4:12 AM.',
      presentLine: "The speaker logged a voice command at 4:12. Someone said 'order pool noodles.' It wasn't me. Maybe someone outside? Window was open. Voices carry.",
      isLie: true,
      source: 'Speaker Audio Log',
      // v1 Lite tags
      factTouch: 1, // Contradicts fact 1: speaker was muted (can't hear commands)
      signalRoot: 'device_firmware',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'speaker',
    }),
    card({
      id: 'phone_app',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'BEDROOM',
      time: '', // Mini: no time displayed
      claim: 'Companion app shows purchase initiated from phone.',
      presentLine: "The app says the order came from my phone. Maybe I was sleepwalking? Sleep-shopping? It's a thing. I read about it. People buy weird stuff unconscious.",
      isLie: true,
      source: 'Companion App',
      // v1 Lite tags
      factTouch: 3, // Contradicts fact 3: phone in DND (no app confirmations)
      signalRoot: 'phone_os',
      controlPath: 'remote',
      claimShape: 'attribution',
      subsystem: 'speaker',
    }),
    card({
      id: 'tv_ad',
      strength: 3,
      evidenceType: 'PHYSICAL',
      location: 'LIVING_ROOM',
      time: '', // Mini: no time displayed
      claim: 'TV ad for pool supplies played at 4:11 AM.',
      presentLine: "There was a pool supply ad on TV right before the order. Those smart speakers pick up TV audio all the time. It heard 'pool noodle' and just... went for it.",
      isLie: true,
      source: 'TV Log',
      // v1 Lite tags
      factTouch: 2, // Contradicts fact 2: TV was off overnight
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'attribution',
      subsystem: 'speaker',
    }),
  ],

  // Lies: 2 relational + 1 inferential (per spec)
  lies: [
    {
      cardId: 'voice_log',
      lieType: 'relational', // Requires Fact 1 (muted) + Fact 2 (no one awake to speak)
      inferenceDepth: 2,
      reason: 'Speaker was in mute mode (voice disabled). Even if someone spoke, the speaker could not hear commands. Plus TV was off and everyone was asleep.',
      // v1 Lite trap fields
      trapAxis: 'claim_shape',
      baitReason: 'High strength card with positive claim that offers concrete audio evidence of a voice command.',
    },
    {
      cardId: 'phone_app',
      lieType: 'relational', // Requires Fact 1 (speaker muted) + Fact 3 (phone DND)
      inferenceDepth: 2,
      reason: 'Phone was in DND blocking all notifications. Purchase confirmations would be blocked. Combined with muted speaker, no valid purchase flow existed.',
      // v1 Lite trap fields
      trapAxis: 'independence',
      baitReason: 'Offers phone-based explanation that shifts blame to sleep-shopping, a plausible-sounding phenomenon.',
    },
    {
      cardId: 'tv_ad',
      lieType: 'inferential', // Fact 2 alone catches it (TV was off)
      inferenceDepth: 1,
      reason: 'TV was off from 11 PM to 7 AM. No ad could have played. A muted speaker also cannot hear TV audio anyway.',
      // v1 Lite trap fields
      trapAxis: 'coverage',
      baitReason: 'Blames TV audio trigger which is a known smart speaker issue, making it seem plausible.',
    },
  ],

  verdicts: {
    flawless: "Deep sleep, snoring partner, no confirmations acknowledged. The speaker glitched. You're absurdly innocent. Pool noodle order cancelled. Purchasing restored.",
    cleared: "Your story holds. Something triggered that order, but it wasn't you. Purchasing restored. The pool noodles are on their way back.",
    close: "Almost convinced me. But someone ordered those noodles. Your story has gaps. Purchasing locked.",
    busted: "Voice logs, app claims, TV ads that didn't exist. Your story is as inflated as those pool noodles. Purchasing stays locked.",
  },

  koaBarks: {
    // Turn 1: Opening card reactions (6 cards)
    cardPlayed: {
      sleep_watch: [
        "Deep REM at 4:12 AM. The unconscious defense. Sleep trackers don't lie. Usually.",
      ],
      partner_testimony: [
        "Partner confirms snoring. Romantic. And incidentally, an alibi.",
      ],
      transaction_log: [
        "No confirmation acknowledged. The order bypassed normal flow. Interesting technical detail.",
      ],
      voice_log: [
        "Voice command captured. Someone said the words. At 4 AM. While you 'slept.'",
      ],
      phone_app: [
        "App says phone initiated purchase. Sleep-shopping. A creative defense.",
      ],
      tv_ad: [
        "TV ad triggered the speaker. The 'my devices are conspiring against me' theory. Classic.",
      ],
    },

    // Turn 2: Sequence reactions (30 combinations)
    sequences: {
      // sleep_watch -> others
      'sleep_watch→partner_testimony': [
        "Watch says REM. Partner says snoring. Two sources agreeing you were unconscious. Conveniently aligned.",
      ],
      'sleep_watch→transaction_log': [
        "Deep sleep, then no confirmation. You couldn't have approved anything. Building a solid absence case.",
      ],
      'sleep_watch→voice_log': [
        "REM sleep, but a voice command logged? Hard to talk while that deeply asleep.",
      ],
      'sleep_watch→phone_app': [
        "Sleep tracker says unconscious. App says phone purchase. Sleep-shopping requires waking up. Usually.",
      ],
      'sleep_watch→tv_ad': [
        "Deep sleep during the alleged TV ad. You slept through your own purchase. Allegedly.",
      ],

      // partner_testimony -> others
      'partner_testimony→sleep_watch': [
        "Partner's testimony, then sleep data. Human and machine agreeing. Rare occurrence.",
      ],
      'partner_testimony→transaction_log': [
        "Snoring confirmed. No confirmation sent. You were loudly unconscious.",
      ],
      'partner_testimony→voice_log': [
        "Partner says snoring. Speaker heard a voice. Snoring isn't a shopping command. Usually.",
      ],
      'partner_testimony→phone_app': [
        "Partner confirms sleep. Phone says purchase. Did you sleepwalk to your phone? Quietly?",
      ],
      'partner_testimony→tv_ad': [
        "Partner asleep, you asleep. TV was playing pool ads. Someone left the TV on?",
      ],

      // transaction_log -> others
      'transaction_log→sleep_watch': [
        "No confirmation, deep sleep. The purchase bypassed you entirely. Or did it?",
      ],
      'transaction_log→partner_testimony': [
        "Unconfirmed order, snoring witness. Technical and testimonial angles.",
      ],
      'transaction_log→voice_log': [
        "No confirmation acknowledged, but voice command logged. Someone spoke but didn't confirm?",
      ],
      'transaction_log→phone_app': [
        "No confirmation, but app claims phone initiated. Contradictory data streams.",
      ],
      'transaction_log→tv_ad': [
        "Unconfirmed purchase, TV ad trigger. The TV ordered and forgot to confirm?",
      ],

      // voice_log -> others
      'voice_log→sleep_watch': [
        "Voice command at 4:12. Sleep tracker says REM. Talking in your sleep. Very specifically.",
      ],
      'voice_log→partner_testimony': [
        "Someone spoke to the speaker. Partner says you were snoring. Hard to do both.",
      ],
      'voice_log→transaction_log': [
        "Voice command, no confirmation. Partial purchase flow. Something's missing.",
      ],
      'voice_log→phone_app': [
        "Voice command AND app purchase? Two methods for one order. Redundant triggering.",
      ],
      'voice_log→tv_ad': [
        "Voice log, then TV ad. The speaker heard a person AND the TV? Busy audio environment.",
      ],

      // phone_app -> others
      'phone_app→sleep_watch': [
        "Phone purchase, then deep sleep data. You ordered in your sleep. Impressively.",
      ],
      'phone_app→partner_testimony': [
        "App says phone, partner says snoring. Sleep-shopping requires waking your phone first.",
      ],
      'phone_app→transaction_log': [
        "Phone initiated, no confirmation. App purchase without approval? Unlikely flow.",
      ],
      'phone_app→voice_log': [
        "Phone app AND voice command. Multiple triggers. Your speaker was very motivated.",
      ],
      'phone_app→tv_ad': [
        "Phone purchase, TV ad. Belt and suspenders approach to pool noodle acquisition.",
      ],

      // tv_ad -> others
      'tv_ad→sleep_watch': [
        "TV ad trigger, then sleep proof. The TV woke the speaker but not you?",
      ],
      'tv_ad→partner_testimony': [
        "TV ad at 4 AM. Partner was asleep. Who left the TV on?",
      ],
      'tv_ad→transaction_log': [
        "Ad triggered order, no confirmation. TV can't click confirm. Neither could you.",
      ],
      'tv_ad→voice_log': [
        "TV ad and voice command. Audio chaos. Your living room was busy at 4 AM.",
      ],
      'tv_ad→phone_app': [
        "TV trigger, phone purchase. The TV ordered via your phone? Creative routing.",
      ],
    },

    // Turn 3: Story completion patterns (closing-energy only)
    storyCompletions: {
      // All same type (3 of 3)
      all_digital: [
        "All digital sources. Your defense lives in logs and apps. Processing.",
      ],
      all_sensor: [
        "Three sensors. Machines vouching for you. Let me verify.",
      ],
      all_testimony: [
        "Human witnesses only. Everyone has a story. Cross-referencing.",
      ],
      all_physical: [
        "Physical logs only. Hardware records. Checking authenticity.",
      ],
      // Two of one type (2 of 3)
      digital_heavy: [
        "Mostly digital. Apps and logs. Running verification.",
      ],
      sensor_heavy: [
        "Sensor-forward story. Your devices are talking. I'm listening.",
      ],
      testimony_heavy: [
        "Human-heavy approach. Witnesses have opinions. So do I.",
      ],
      physical_heavy: [
        "Physical evidence emphasis. Hardware logs don't lie. Usually.",
      ],
      // All different types
      mixed_strong: [
        "Varied sources. Different angles. Stand by for analysis.",
      ],
      mixed_varied: [
        "Multiple source types. Let me triangulate the truth.",
      ],
    },

    // Objection prompts
    objectionPrompt: {
      sleep_watch: ["Deep REM during the order. You were unconscious. Final answer?"],
      partner_testimony: ["Partner confirms the snoring. They vouch for your unconsciousness. Sure?"],
      transaction_log: ["No confirmation was acknowledged. Order bypassed normal flow. Standing by this?"],
      voice_log: ["Voice command at 4:12 AM. The speaker heard someone. Confirm?"],
      phone_app: ["Phone app initiated the purchase. Sleep-shopping defense. Your final position?"],
      tv_ad: ["TV ad triggered the speaker. External audio caused this. Sure about that?"],
    },

    // Objection responses - stood by truth
    objectionStoodTruth: {
      sleep_watch: ["Sleep data is consistent. Deep REM at 4:12. You were thoroughly unconscious."],
      partner_testimony: ["Partner testimony holds. The snoring was memorable. And documented."],
      transaction_log: ["Purchase log confirms no confirmation. Something bypassed the normal flow."],
    },

    // Objection responses - stood by lie
    objectionStoodLie: {
      voice_log: ["Voice command logged. But speaker was in mute mode. Muted speakers don't hear commands. That's what mute means."],
      phone_app: ["Phone initiated purchase. But phone was in Do Not Disturb. No confirmations were possible. App couldn't have triggered this."],
      tv_ad: ["TV ad at 4:11 AM. But TV was off from 11 PM to 7 AM. Ads don't play on powered-off TVs."],
    },

    // Objection responses - withdrew
    objectionWithdrew: {
      sleep_watch: ["Withdrawing the sleep data. Having second thoughts about your REM?"],
      partner_testimony: ["Partner testimony gone. They didn't actually notice the snoring?"],
      transaction_log: ["Transaction log withdrawn. Maybe there was a confirmation after all?"],
      voice_log: ["Voice command story dropped. Good instinct. The speaker was muted anyway."],
      phone_app: ["Phone purchase withdrawn. Smart. DND mode was blocking everything."],
      tv_ad: ["TV ad theory gone. Finally. The TV was off all night."],
    },

    // Lies revealed at end
    liesRevealed: {
      voice_log: ["Voice command logged at 4:12. But speaker was muted from 10 PM. Mute means mute. It couldn't hear anything."],
      phone_app: ["Phone app initiated purchase. But phone was in Do Not Disturb. All notifications blocked. No purchase confirmations possible."],
      tv_ad: ["TV ad triggered the order. But TV was off since 11 PM. Ads require a powered TV. Basic physics."],
      multiple: ["Two explanations that don't survive contact with the facts. Your pool noodle defense has holes."],
      all: ["Voice commands on muted speakers. TV ads on powered-off TVs. Phone purchases through blocked notifications. Zero for three."],
    },
  },

  // Optional epilogue
  epilogue: "It was a firmware bug. The smart speaker's latest update included a 'predictive shopping' feature that misinterpreted your browsing history from three summers ago when you briefly considered installing a pool. It extrapolated. Aggressively. KOA has disabled predictive shopping and filed a complaint with the manufacturer.",
};

export default PUZZLE_SPEAKER;
