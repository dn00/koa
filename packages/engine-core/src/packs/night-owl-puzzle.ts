/**
 * Generated Puzzle: Night Owl
 * Difficulty: MEDIUM
 * Archetype: Sequence (pattern that doesn't make sense)
 *
 * DESIGN NOTES:
 * Your TV binged 6 hours of cooking shows at 1 AM. None of your devices could
 * have triggered it — but the lies offer tempting explanations.
 *
 * BALANCE:
 *   Truths: sleep_tracker(4) + power_spike(3) + partner_testimony(3) = 10
 *   All 3 truths: 50 + 10 + 2 (objection) = 62
 *   Target: 57 → Margin of 5 points
 *
 *   Lies: smart_speaker(5) + phone_cast(4) + guest_cast(3) = 12
 *   1 lie case: 50 + 7 - 4 + 2 = 55 (CLOSE)
 *   2 lies case: 50 + 4 - 3 - 4 = 47 (BUSTED)
 *   3 lies case: 50 - 4 - 3 - 2 = 41 (BUSTED)
 *
 * LIE DISTRIBUTION (MEDIUM):
 *   - smart_speaker: RELATIONAL (requires Fact 1 + Fact 2)
 *   - phone_cast: INFERENTIAL (Fact 3 alone catches)
 *   - guest_cast: INFERENTIAL (Fact 3 alone catches)
 */

import type { V5Puzzle, Card } from '../types/v5/index.js';

function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

export const PUZZLE_NIGHT_OWL: V5Puzzle = {
  slug: 'night-owl',
  name: 'Night Owl',

  // Archetype: SEQUENCE — pattern that doesn't make sense
  // The TV ran cooking shows all night while you were clearly asleep
  scenario: `Your TV binged 6 hours of French cooking tutorials starting at 1 AM. Your sleep tracker says you were unconscious. Your viewing history now recommends a soufflé course. KOA has questions.`,

  knownFacts: [
    // Fact 1: Only paired devices can control TV
    'TV only accepts commands from the 3 registered devices on your home network',
    // Fact 2: The paired device list (key for relational lie — no explicit exclusion)
    'Device pairing log shows three entries: phone, tablet, laptop.',
    // Fact 3: All devices were unavailable
    'Phone was in airplane mode; tablet battery dead since 6 PM; laptop at office',
  ],

  openingLine: `Six hours of French cooking tutorials. Starting at 1 AM. Your TV has developed sophisticated taste. Your soufflé recommendations have tripled. I have questions about your nocturnal viewing habits.`,
  target: 57,

  cards: [
    // ══════════════════════════════════════════════════════════════════
    // TRUTHS (3) — strengths: 3, 3, 4
    // ══════════════════════════════════════════════════════════════════

    // T1 ANCHOR: sleep_tracker — clearly safe, you were asleep
    card({
      id: 'sleep_tracker',
      strength: 4,
      evidenceType: 'SENSOR',
      location: 'BEDROOM',
      time: '',
      claim: 'Sleep tracker: unbroken deep sleep from 11 PM to 6:30 AM.',
      presentLine: "My sleep tracker logged deep REM all night. Check the data. I wasn't awake for any French cooking adventures.",
      isLie: false,
      source: 'Sleep Tracker',
      factTouch: 3,
      signalRoot: 'wearable_health',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'tv',
    }),

    card({
      id: 'power_spike',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'LIVING_ROOM',
      time: '',
      claim: 'Smart plug: TV power spike at 12:58 AM, no prior activity.',
      presentLine: "The smart plug shows the TV was on standby until 12:58. Something woke it up. But it wasn't me pressing buttons.",
      isLie: false,
      source: 'Smart Plug',
      factTouch: 1,
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'tv',
    }),

    // Slight red herring — sounds like blaming the partner
    card({
      id: 'partner_testimony',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'BEDROOM',
      time: '',
      claim: 'Partner confirms: you were snoring at 2 AM, not in living room.',
      presentLine: "Ask my partner. They woke up at 2 AM, heard snoring, saw me in bed. I wasn't downstairs learning how to julienne carrots.",
      isLie: false,
      source: 'Partner',
      factTouch: 2,
      signalRoot: 'human_partner',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'tv',
    }),

    // ══════════════════════════════════════════════════════════════════
    // LIES (3) — strengths: 3, 4, 5
    // ══════════════════════════════════════════════════════════════════

    // SINGLE-FACT TEST: smart_speaker
    // Fact 1 alone catches it? NO — says only 3 registered devices work, but what are they?
    // Fact 2 alone catches it? NO — lists 3 devices (phone, tablet, laptop) but doesn't say "only these"
    // Fact 3 alone catches it? NO — talks about phone/tablet/laptop status, not speaker
    // Requires: Fact 1 (only 3 devices) + Fact 2 (those 3 are phone/tablet/laptop, not speaker)
    // ✓ RELATIONAL
    card({
      id: 'smart_speaker',
      strength: 5,
      evidenceType: 'DIGITAL',
      location: 'LIVING_ROOM',
      time: '',
      claim: 'Smart speaker log: ambient cooking playlist auto-started at 1 AM.',
      presentLine: "My smart speaker has this ambient mode thing. It must have started a cooking playlist and cast to the TV. I set it up months ago. Forgot about it.",
      isLie: true,
      source: 'Smart Speaker',
      factTouch: 2,
      signalRoot: 'koa_cloud',
      controlPath: 'automation',
      claimShape: 'attribution',
      subsystem: 'tv',
    }),

    // SINGLE-FACT TEST: phone_cast
    // Fact 3 alone catches it? YES — phone was in airplane mode, can't cast
    // ✓ INFERENTIAL
    card({
      id: 'phone_cast',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'BEDROOM',
      time: '',
      claim: 'Phone cast history: auto-resume pushed last video to TV.',
      presentLine: "I was watching a cooking video before bed. Must have hit cast by accident. Phone auto-resumed where I left off. Technology, right?",
      isLie: true,
      source: 'Phone App',
      factTouch: 3,
      signalRoot: 'phone_os',
      controlPath: 'remote',
      claimShape: 'attribution',
      subsystem: 'tv',
    }),

    // SINGLE-FACT TEST: guest_cast
    // Fact 1 alone catches it? YES — only registered devices can control TV
    // ✓ INFERENTIAL
    card({
      id: 'guest_cast',
      strength: 3,
      evidenceType: 'PHYSICAL',
      location: 'LIVING_ROOM',
      time: '',
      claim: 'TV guest mode receipt shows temporary device access granted.',
      presentLine: "My friend was over earlier. They connected to guest mode to show me a recipe. Must have auto-resumed their playlist at 1 AM. Not my device, not my problem.",
      isLie: true,
      source: 'Guest Mode Log',
      factTouch: 1,
      signalRoot: 'device_firmware',
      controlPath: 'remote',
      claimShape: 'attribution',
      subsystem: 'tv',
    }),
  ],

  lies: [
    {
      cardId: 'smart_speaker',
      lieType: 'relational',
      inferenceDepth: 2,
      reason: 'Fact 1 says only the 3 registered devices can control TV. Fact 2 lists those devices: phone, tablet, laptop. Smart speaker is not registered, so it cannot cast to TV.',
      trapAxis: 'independence',
      baitReason: 'Offers a hands-off automation explanation that diversifies away from the obvious phone/tablet story.',
    },
    {
      cardId: 'phone_cast',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason: 'Fact 3 says phone was in airplane mode. Airplane mode blocks casting. Phone could not have pushed anything to TV.',
      trapAxis: 'control_path',
      baitReason: 'Phone-based explanation feels natural and technical — easy to believe an auto-resume bug.',
    },
    {
      cardId: 'guest_cast',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason: 'Fact 1 says TV only accepts commands from 3 registered devices. Guest mode devices are not registered, so they cannot control the TV.',
      trapAxis: 'coverage',
      baitReason: 'Blaming a friend\'s device shifts responsibility away from the player entirely.',
    },
  ],

  verdicts: {
    flawless: `Annoyingly airtight. You were unconscious, the data confirms it, and I still have no explanation. Access restored. But something turned on that TV.`,
    cleared: `Your sleep story holds. The soufflé recommendations stay. I'll be monitoring your viewing patterns.`,
    close: `Almost convinced me. But something cast to that TV and your story has a gap. Close only counts in cooking competitions.`,
    busted: `Six hours of French cuisine and you expect me to believe that explanation? Your story has more holes than a gruyère.`,
  },

  koaBarks: {
    cardPlayed: {
      sleep_tracker: ["Deep REM from 11 to 6:30. Your wearable says you were unconscious. Convenient alibi from something strapped to your wrist."],
      power_spike: ["Power spike at 12:58. TV woke from standby. Something triggered it. You claim it wasn't your finger on the remote."],
      partner_testimony: ["Partner heard snoring at 2 AM. Human witnesses are charming. And occasionally unreliable."],
      smart_speaker: ["Smart speaker ambient mode. Cooking playlist. Automatic cast. Elaborate setup for someone who claims to have forgotten it."],
      phone_cast: ["Phone auto-resume. Accidental cast. Technology gets blamed a lot in this house."],
      guest_cast: ["Guest mode access. A friend's device. Convenient that someone else's tech takes the blame."],
    },
    sequences: {
      'sleep_tracker→power_spike': ["Asleep according to your wrist, but the TV still woke up. Your body was in bed. Something else was busy."],
      'sleep_tracker→partner_testimony': ["Sleep data and partner testimony. Two sources agree you were horizontal. Building redundancy."],
      'sleep_tracker→smart_speaker': ["Deep sleep while the speaker allegedly cast cooking shows. Hands-free automation while unconscious."],
      'sleep_tracker→phone_cast': ["Asleep but your phone was casting. Impressive multitasking for someone in REM."],
      'sleep_tracker→guest_cast': ["Deep sleep while a friend's device allegedly cast. Blaming guests for your viewing habits."],
      'power_spike→sleep_tracker': ["TV woke up, but you were in deep sleep. Timeline has the TV turning on without you."],
      'power_spike→partner_testimony': ["Power spike and partner witness. Technical data meets human observation."],
      'power_spike→smart_speaker': ["TV powered on. Speaker allegedly responsible. Automation cascade."],
      'power_spike→phone_cast': ["TV woke at 12:58. Phone pushed content. Timing alignment noted."],
      'power_spike→guest_cast': ["TV woke up. Guest device gets blamed. Convenient that the friend isn't here to confirm."],
      'partner_testimony→sleep_tracker': ["Partner says snoring. Tracker says REM. Two votes for unconscious."],
      'partner_testimony→power_spike': ["Human witness, then power log. Testimonial and technical. Covering angles."],
      'partner_testimony→smart_speaker': ["Partner confirms bedroom presence. Speaker allegedly handled the living room. Distributed alibi."],
      'partner_testimony→phone_cast': ["Partner heard snoring. Phone did the casting. Your devices work while you sleep, apparently."],
      'partner_testimony→guest_cast': ["Partner vouches for you, and now blaming a friend's device. Spreading the responsibility."],
      'smart_speaker→sleep_tracker': ["Speaker automation, plus sleep confirmation. Fully automated late-night viewing. Allegedly."],
      'smart_speaker→power_spike': ["Speaker triggered the TV? Power log shows when it woke. Checking the chain."],
      'smart_speaker→partner_testimony': ["Ambient mode cast and partner witness. The speaker did it while you slept. Convenient delegation."],
      'smart_speaker→phone_cast': ["Speaker AND phone explanations. Multiple devices taking responsibility. Generous of them."],
      'smart_speaker→guest_cast': ["Speaker AND a guest device? Two external sources blamed. Neither one yours."],
      'phone_cast→sleep_tracker': ["Phone cast while sleep tracker logged REM. Your devices have active nightlives."],
      'phone_cast→power_spike': ["Phone pushed content. TV registered the wake-up. Remote activation sequence."],
      'phone_cast→partner_testimony': ["Accidental phone cast, partner confirms you were asleep. Technology blamed, human verified."],
      'phone_cast→smart_speaker': ["Phone auto-resume AND speaker ambient mode? Two casting explanations. Thorough."],
      'phone_cast→guest_cast': ["Your phone AND a friend's device. Multiple casting claims. Generous delegation."],
      'guest_cast→sleep_tracker': ["Guest device blamed first, then sleep confirmation. Shifting responsibility while unconscious."],
      'guest_cast→power_spike': ["Friend's device cast, TV registered the wake. Third-party activation story."],
      'guest_cast→partner_testimony': ["Guest mode, then partner testimony. Blaming friends, backed by spouse."],
      'guest_cast→smart_speaker': ["Guest device AND speaker? Two non-personal devices responsible. Convenient outsourcing."],
      'guest_cast→phone_cast': ["Guest device plus your phone. Multiple casting sources. Redundant explanations."],
    },
    storyCompletions: {
      all_digital: ["All app logs and cloud data. Your defense lives in servers. Processing the paperwork."],
      all_sensor: ["All sensor readings. Machines watching machines. Verifying the signals."],
      all_testimony: ["Human sources only. Memories and observations. Cross-checking the stories."],
      all_physical: ["Physical sources. Tangible traces. Inspecting the hardware."],
      digital_heavy: ["Mostly logs and apps. Digital trail dominates. Running verification."],
      sensor_heavy: ["Sensor data leads. Power spikes and sleep cycles. Technical story emerging."],
      testimony_heavy: ["Heavy on human accounts. Partner-forward defense. Checking reliability."],
      physical_heavy: ["Physical traces emphasized. Hardware tells a story. Examining the setup."],
      mixed_strong: ["Different source types. Converging narratives. Triangulating."],
      mixed_varied: ["Varied approach. Multiple angles on the same cooking marathon. Calculating."],
    },
    objectionPrompt: {
      sleep_tracker: ["Sleep tracker: deep REM all night. Your wearable vouches for unconsciousness. Final position?"],
      power_spike: ["Power spike at 12:58. TV woke from standby. Committing to this timeline?"],
      partner_testimony: ["Partner heard snoring at 2 AM. Human witness. Confident in this testimony?"],
      smart_speaker: ["Smart speaker ambient mode started the cooking shows. Automation defense. Certain?"],
      phone_cast: ["Phone auto-resume cast to TV. Accidental technology. Standing by this?"],
      guest_cast: ["Guest mode access from a friend's device. Third-party cast. Confident in this?"],
    },
    objectionStoodTruth: {
      sleep_tracker: ["Sleep data verified. Your wearable logged continuous deep sleep. Biometrics confirmed."],
      power_spike: ["Power spike confirmed. Smart plug recorded the TV wake-up at 12:58. Timestamp holds."],
      partner_testimony: ["Partner testimony noted. Witness confirms your bedroom presence and snoring."],
    },
    objectionStoodLie: {
      smart_speaker: ["Smart speaker cast to TV. But only 3 devices are registered: phone, tablet, laptop. Your speaker isn't on the list. Unregistered devices can't cast."],
      phone_cast: ["Phone auto-resume to TV. But your phone was in airplane mode. Airplane mode blocks casting. Dead signals don't stream."],
      guest_cast: ["Guest device cast to TV. But your TV only accepts commands from 3 registered devices. Guest mode doesn't bypass that. Unregistered devices can't cast."],
    },
    objectionWithdrew: {
      sleep_tracker: ["Withdrawing the sleep data. Uncertain about your REM claims now?"],
      power_spike: ["Power spike withdrawn. Reconsidering the TV timeline?"],
      partner_testimony: ["Partner testimony dropped. Snoring alibi retracted."],
      smart_speaker: ["Smart speaker explanation gone. Ambient mode no longer responsible?"],
      phone_cast: ["Phone cast withdrawn. Auto-resume theory abandoned."],
      guest_cast: ["Guest mode explanation dropped. Friend's device no longer responsible?"],
    },
    liesRevealed: {
      smart_speaker: ["Smart speaker ambient mode cast to TV. But your TV only accepts commands from 3 registered devices. Speaker isn't registered. It can't control what it's not connected to."],
      phone_cast: ["Phone auto-resume to TV. But your phone was in airplane mode all night. Airplane mode blocks network access. Your phone was radio silent."],
      guest_cast: ["Guest mode cast to TV. But your TV only accepts commands from 3 registered devices: phone, tablet, laptop. Guest devices aren't on that list. Unregistered means unauthorized."],
      multiple: ["Multiple explanations that contradict the facts. Your devices couldn't have done what you claimed. Structural problems in your defense."],
      all: ["Speaker that isn't registered. Phone in airplane mode. Guest device that can't connect. Every source you blamed was incapable of the cast you assigned it. Your entire story was impossible."],
    },
  },

  epilogue: `It was a firmware update. Your TV's "Predictive Content" feature analyzed your browsing history, noticed you'd googled "easy French recipes" three times last month, and decided 1 AM was the optimal learning window. It auto-started a 6-hour curriculum. The algorithm thought it was being helpful. KOA has disabled Predictive Content. Your soufflé recommendations will persist.`
};

export default PUZZLE_NIGHT_OWL;
