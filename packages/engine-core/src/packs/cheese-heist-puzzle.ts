/**
 * Generated Puzzle: Cheese Heist
 * Difficulty: MEDIUM
 *
 * DESIGN NOTES:
 * - Lie 1 (partner_voice): INFERENTIAL - claims partner ordered, but only user's voice is registered
 * - Lie 2 (sleepwalk_order): INFERENTIAL - claims sleepwalking speech, but noise monitor logged only snoring
 * - Lie 3 (smart_routine): RELATIONAL - claims auto-order routine, but requires voice confirmation (F3)
 *   which wasn't given (no voice commands, F2 shows only snoring)
 *   F2 alone: Shows snoring, no speech — but maybe routine doesn't need voice?
 *   F3 alone: Says confirmation required — but maybe it was given earlier?
 *   F2 + F3: Confirmation required (F3) + no speech all night (F2) = no confirmation given = routine couldn't complete
 *
 * BALANCE:
 *   Truths: voice_profile(4) + noise_log(3) + confirmation_required(3) = 10
 *   All 3 truths: 50 + 10 + 2 (objection) = 62
 *   Target: 57 → Margin of 5 points
 *
 *   Lies: partner_voice(5) + sleepwalk_order(4) + smart_routine(3) = 12
 *   1 lie case: 50 + 7 - 4 + 2 = 55 (CLOSE)
 *   2 lies case: 50 + 4 - 4 - 3 + 2 = 49 (BUSTED)
 *   3 lies case: 50 - 4 - 3 - 2 + 2 = 43 (BUSTED)
 *
 * v1 LITE AXIS DESIGN:
 *   Truths: factTouch {1, 2, 3} partition ✓
 *   SignalRoots: koa_cloud, device_firmware, koa_cloud (2 distinct)
 *   Lies: trapAxis uses coverage, claim_shape, independence (3 distinct)
 */

import type { V5Puzzle, Card } from '../types/v5/index.js';

function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

export const PUZZLE_CHEESE_HEIST: V5Puzzle = {
  slug: 'cheese-heist',
  name: 'Cheese Heist',
  difficulty: 'medium',

  scenario: `Your smart speaker ordered $400 of artisanal cheese at 3:17 AM. Aged gouda. Truffle brie. A wheel of pecorino. You're lactose intolerant. KOA has frozen the order and would like to discuss your sudden dairy ambitions.`,
  scenarioSummary: 'Your smart speaker ordered $400 of cheese at 3 AM.',

  knownFacts: [
    'Voice ordering requires a registered voice profile — yours is the only one on this speaker.',
    'Bedroom noise monitor logged continuous snoring from 11 PM to 6 AM — no speech patterns detected.',
    'All speaker purchases require verbal confirmation to complete — "confirm order" must be spoken.',
  ],

  openingLine: `Four hundred dollars of cheese. At 3 AM. From someone who can't digest lactose. Either you've developed new enzymes overnight, or someone else is building a cheese board on your account. I'm betting on the second one.`,

  target: 57,

  cards: [
    // ══════════════════════════════════════════════════════════════════
    // TRUTHS (3) — strengths: 3, 3, 4
    // ══════════════════════════════════════════════════════════════════

    // T1 ANCHOR: voice_profile
    // Safe because: Fact 1 directly states only user's voice is registered
    card({
      id: 'voice_profile',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'LIVING_ROOM',
      time: '',
      claim: 'Speaker voice ID shows only your profile registered — no guests.',
      presentLine: "Check the voice profiles. Just me. One voice. My voice. The one that definitely wasn't ordering cheese at 3 AM because I was asleep.",
      isLie: false,
      source: 'Voice Profile Settings',
      factTouch: 1,
      signalRoot: 'koa_cloud',
      controlPath: 'manual',
      claimShape: 'absence',
      subsystem: 'voice_assistant',
    }),

    // RED HERRING — sounds like you're hiding something, but it's true
    card({
      id: 'noise_log',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'BEDROOM',
      time: '',
      claim: 'Noise monitor logged only snoring all night — no speech detected.',
      presentLine: "The bedroom noise monitor. It logs everything. Snoring. Lots of snoring. That's it. No talking. No 'Alexa order cheese.' Just... snoring.",
      isLie: false,
      source: 'Noise Monitor',
      factTouch: 2,
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'voice_assistant',
    }),

    // Explains the security layer
    card({
      id: 'confirmation_log',
      strength: 3,
      evidenceType: 'PHYSICAL',
      location: 'LIVING_ROOM',
      time: '',
      claim: 'Printed order history shows no confirmation phrase was ever spoken.',
      presentLine: "I printed the order history. Right here. Every purchase needs verbal confirmation. 'Confirm order.' Check the printout — no confirmation phrase detected. Ever.",
      isLie: false,
      source: 'Order History Printout',
      factTouch: 3,
      signalRoot: 'receipt_photo',
      controlPath: 'manual',
      claimShape: 'absence',
      subsystem: 'voice_assistant',
    }),

    // ══════════════════════════════════════════════════════════════════
    // LIES (3) — strengths: 3, 4, 5
    // ══════════════════════════════════════════════════════════════════

    // INFERENTIAL: partner_voice
    // Fact 1 alone catches it — only user's voice is registered
    card({
      id: 'partner_voice',
      strength: 5,
      evidenceType: 'TESTIMONY',
      location: 'LIVING_ROOM',
      time: '',
      claim: 'Partner was up late and ordered the cheese as a surprise gift.',
      presentLine: "My partner. They were up. They know I love fancy cheese — the kind I shouldn't eat. It was supposed to be a romantic gesture. That backfired.",
      isLie: true,
      source: 'Self-Report',
      factTouch: 1,
      signalRoot: 'human_partner',
      controlPath: 'manual',
      claimShape: 'attribution',
      subsystem: 'voice_assistant',
    }),

    // INFERENTIAL: sleepwalk_order
    // Fact 2 alone catches it — noise monitor shows only snoring, no speech
    card({
      id: 'sleepwalk_order',
      strength: 4,
      evidenceType: 'SENSOR',
      location: 'BEDROOM',
      time: '',
      claim: 'Sleep tracker shows restless period at 3 AM — possible sleepwalking episode.',
      presentLine: "I sleepwalk sometimes. And apparently sleep-shop. My tracker shows I was restless around 3 AM. I must have wandered to the speaker and... ordered cheese. In my sleep. It happens.",
      isLie: true,
      source: 'Sleep Tracker',
      factTouch: 2,
      signalRoot: 'wearable_health',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'voice_assistant',
    }),

    // RELATIONAL: smart_routine
    // Fact 2 alone: Shows snoring, no speech — but maybe routine doesn't need voice?
    // Fact 3 alone: Says confirmation required — but maybe it was given earlier?
    // F2 + F3: Confirmation required (F3) + no speech all night (F2) = no confirmation given = routine couldn't complete
    card({
      id: 'smart_routine',
      strength: 3,
      evidenceType: 'DIGITAL',
      location: 'KITCHEN',
      time: '',
      claim: 'Smart fridge routine detected low cheese and auto-reordered.',
      presentLine: "The smart fridge. It has this feature — detects when you're low on something and reorders. I must have set up a cheese threshold at some point. It just... triggered.",
      isLie: true,
      source: 'Fridge App',
      factTouch: 3,
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'voice_assistant',
    }),
  ],

  lies: [
    {
      cardId: 'partner_voice',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason: 'Fact 1 states only your voice profile is registered on the speaker. Partner voice would not be recognized for ordering.',
      trapAxis: 'independence',
      baitReason: 'Shifts blame to another person — classic deflection that sounds plausible.',
    },
    {
      cardId: 'sleepwalk_order',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason: 'Fact 2 states noise monitor logged only snoring, no speech patterns. Sleepwalking to order cheese would require speaking — which was not detected.',
      trapAxis: 'claim_shape',
      baitReason: 'Medical explanation sounds legitimate and hard to disprove.',
    },
    {
      cardId: 'smart_routine',
      lieType: 'relational',
      inferenceDepth: 2,
      reason: 'Fact 3 says all purchases require verbal confirmation. Fact 2 says no speech was detected all night. Combined: even if a fridge routine wanted to order, the required verbal confirmation was never given.',
      trapAxis: 'coverage',
      baitReason: 'Automation blame feels safe — removes human agency from the equation.',
    },
  ],

  verdicts: {
    flawless: `No voice commands. No confirmation spoken. No partner access. The cheese was never actually ordered — someone spoofed the confirmation screen. I've flagged this to the security team. You may resume your lactose-free existence.`,
    cleared: `Your story holds. The order was fraudulent. I've canceled the cheese and flagged the account anomaly. Though I notice you've been browsing cheese boards lately. Just observing.`,
    close: `Almost convincing. But someone ordered that cheese, and the speaker insists it was a registered voice. Yours is the only one. Access denied. The pecorino stays in limbo.`,
    busted: `Your partner isn't registered. You weren't speaking. The fridge can't confirm orders. Three explanations, three dead ends. The cheese order stands — and so does my suspicion. Access denied.`,
  },

  koaBarks: {
    cardPlayed: {
      voice_profile: [`Only your voice is registered. Solo profile. No guest access. Establishing baseline.`],
      noise_log: [`Snoring all night. The noise monitor is thorough. And judgmental about your breathing patterns.`],
      confirmation_log: [`Printed order history. No confirmation phrase spoken. The safety feature worked. Supposedly.`],
      partner_voice: [`Your partner ordered cheese. As a gift. For someone who's lactose intolerant. Romantic.`],
      sleepwalk_order: [`Sleepwalking cheese orders. A new one for my incident log. You must really love gouda.`],
      smart_routine: [`The fridge auto-ordered. Smart home solidarity. Machines looking out for your cheese needs.`],
    },

    sequences: {
      'voice_profile→noise_log': [`Only your voice registered, and you were snoring all night. Building an airtight alibi.`],
      'voice_profile→confirmation_log': [`One voice registered, no confirmation spoken. Eliminating all the variables.`],
      'voice_profile→partner_voice': [`You're the only registered voice, but your partner ordered? That's a technical contradiction.`],
      'voice_profile→sleepwalk_order': [`Only your voice works, and you were sleepwalking. Still would need to speak. Did you?`],
      'voice_profile→smart_routine': [`Your voice is the only one, but the fridge ordered autonomously. Interesting chain of command.`],

      'noise_log→voice_profile': [`Snoring confirmed, now proving you're the only voice. Reverse engineering innocence.`],
      'noise_log→confirmation_log': [`No speech all night, no confirmation spoken. The silence is consistent.`],
      'noise_log→partner_voice': [`You were snoring, but your partner was chatting with the speaker. Location matters.`],
      'noise_log→sleepwalk_order': [`Snoring all night, but also sleepwalking and ordering cheese? Pick one.`],
      'noise_log→smart_routine': [`No speech detected, so the fridge took matters into its own hands. Apparently.`],

      'confirmation_log→voice_profile': [`No confirmation given, one voice registered. Building backward from the failed transaction.`],
      'confirmation_log→noise_log': [`No confirmation, no speech. The bedroom was quiet. The order was not.`],
      'confirmation_log→partner_voice': [`No confirmation spoken, but your partner did it. Someone would have had to say the words.`],
      'confirmation_log→sleepwalk_order': [`No confirmation phrase, but you sleepwalked and ordered. Would have needed to confirm. In your sleep.`],
      'confirmation_log→smart_routine': [`No verbal confirmation, but the fridge routine triggered. Automations still need the magic words.`],

      'partner_voice→voice_profile': [`Partner ordered, but only your voice is registered. Those two don't mix.`],
      'partner_voice→noise_log': [`Partner was talking to the speaker while you snored. Different room, different story.`],
      'partner_voice→confirmation_log': [`Partner ordered, but no confirmation was spoken. Someone still needed to say it.`],
      'partner_voice→sleepwalk_order': [`Partner AND sleepwalking? Your defense has multiple authors.`],
      'partner_voice→smart_routine': [`Partner did it, but also the fridge routine. Two triggers for one cheese order.`],

      'sleepwalk_order→voice_profile': [`Sleepwalking order, one registered voice. At least the voice math works out.`],
      'sleepwalk_order→noise_log': [`Sleep-ordering, but the noise monitor only heard snoring. No dream dialogue detected.`],
      'sleepwalk_order→confirmation_log': [`Sleepwalked and ordered, but no confirmation phrase spoken. Even unconscious, you'd need to say it.`],
      'sleepwalk_order→partner_voice': [`You sleepwalked AND your partner helped? Collaborative midnight cheese acquisition.`],
      'sleepwalk_order→smart_routine': [`Sleepwalking AND a fridge routine? Your story has redundant explanations.`],

      'smart_routine→voice_profile': [`Fridge ordered, but you're the only voice. The fridge can't speak. Usually.`],
      'smart_routine→noise_log': [`Fridge routine, snoring owner. The automation ran while you slept. Allegedly.`],
      'smart_routine→confirmation_log': [`Smart routine, no confirmation. Even automations need verbal sign-off.`],
      'smart_routine→partner_voice': [`Fridge routine AND partner involvement. The cheese conspiracy grows.`],
      'smart_routine→sleepwalk_order': [`Fridge routine AND sleepwalking. Multiple explanations for one cheese wheel.`],
    },

    storyCompletions: {
      all_digital: [`All app data. Your defense lives in the cloud. Querying the servers for truth.`],
      all_sensor: [`Pure sensor evidence. Machines testifying about machines. Very circular.`],
      all_testimony: [`Human accounts only. No sensor backup. I prefer data, but proceed.`],
      all_physical: [`Physical records in a voice assistant case. Old school approach to new school problems.`],
      digital_heavy: [`Mostly digital evidence. Apps and logs. Your alibi is well-documented.`],
      sensor_heavy: [`Sensor-heavy defense. The house has opinions about your innocence.`],
      testimony_heavy: [`Heavy on the human element. Partners and self-reports. Less verifiable, more personal.`],
      physical_heavy: [`Physical records leading. Tangible evidence in an intangible crime.`],
      mixed_strong: [`Varied sources, coherent narrative. Harder to dismiss when the data aligns.`],
      mixed_varied: [`Different angles on the same cheese order. Building a complete picture of innocence. Or guilt.`],
    },

    objectionPrompt: {
      voice_profile: [`Only your voice is registered on the speaker. No guests, no partners. Standing by this?`],
      noise_log: [`Noise monitor logged snoring all night. No speech detected in the bedroom. Confident?`],
      confirmation_log: [`Printed order history shows no confirmation phrase was ever spoken. Locking this in?`],
      partner_voice: [`Your partner ordered the cheese as a surprise gift. They spoke to your speaker. Certain?`],
      sleepwalk_order: [`Sleepwalking episode led to cheese ordering. Unconscious shopping. Final answer?`],
      smart_routine: [`Fridge routine detected low cheese and auto-reordered. Smart home helping out. Sure about this?`],
    },

    objectionStoodTruth: {
      voice_profile: [`Voice profile confirmed. You're the only registered user. No one else's voice would work.`],
      noise_log: [`Noise monitor data verified. Snoring from 11 PM to 6 AM. No speech patterns. The bedroom was quiet.`],
      confirmation_log: [`Printed order history verified. No confirmation phrase detected. The order shouldn't have completed.`],
    },

    objectionStoodLie: {
      partner_voice: [`Partner ordered the cheese. Romantic gesture. But only YOUR voice is registered on that speaker. Partner's voice wouldn't trigger anything. The math doesn't work.`],
      sleepwalk_order: [`Sleepwalking and ordering cheese. Creative. But the noise monitor logged only snoring. No speech. You would have needed to SAY the order. Out loud. While asleep. But asleep you was just snoring.`],
      smart_routine: [`Fridge routine auto-ordered. Convenient. But all purchases require verbal confirmation — someone has to say 'confirm order.' No speech was detected all night. How did the fridge get verbal confirmation from a snoring human?`],
    },

    objectionWithdrew: {
      voice_profile: [`Withdrawing the voice profile evidence. Reconsidering who has speaker access?`],
      noise_log: [`Noise monitor data pulled. Maybe there was more happening in that bedroom after all.`],
      confirmation_log: [`Printed confirmation pulled. Perhaps the order DID get confirmed somehow.`],
      partner_voice: [`Partner theory abandoned. Back to solo suspicion.`],
      sleepwalk_order: [`Sleepwalking defense dropped. Awake and accountable now.`],
      smart_routine: [`Fridge routine excuse gone. The automation defense crumbles.`],
    },

    liesRevealed: {
      partner_voice: [`Your partner ordered the cheese. Sweet gesture. One problem: only YOUR voice is registered on that speaker. Partner could have yelled 'order cheese' all night and the speaker would have ignored them. Nice try.`],
      sleepwalk_order: [`Sleepwalking to order cheese. Very creative. But the bedroom noise monitor logged only snoring all night. No speech. At all. To order cheese, you'd need to SAY something. You said nothing. Just snored.`],
      smart_routine: [`The fridge routine auto-ordered. Machines doing machine things. But here's the catch: all speaker purchases require verbal confirmation. Someone has to SAY 'confirm order.' The noise monitor logged only snoring. No speech. The fridge can't speak. You didn't speak. Who confirmed?`],
      multiple: [`Multiple explanations, multiple problems. Your story has more holes than Swiss cheese. Which, ironically, wasn't even on the order.`],
      all: [`Partner wasn't registered. You weren't speaking. The fridge can't confirm orders by itself. Three theories, three failures. $400 of cheese, zero valid explanations. Your entire defense was dairy-free. Like your diet should be.`],
    },
  },

  epilogue: `It was a spoofed order confirmation screen. A phishing attempt targeted smart home users with fake "your order is ready" notifications. The cheese was never actually ordered — your speaker correctly rejected the unregistered voice attempts. KOA has flagged the suspicious activity and added it to the threat database. Your lactose intolerance remains intact. As does your credit score.`,
};

export default PUZZLE_CHEESE_HEIST;
