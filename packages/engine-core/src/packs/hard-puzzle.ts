/**
 * Generated Puzzle: The 3 AM Binge Watch (HARD MODE)
 *
 * HARD MODE DESIGN (2 relational + 1 inferential):
 *   - Lie A (streaming_history): RELATIONAL (inferenceDepth: 2)
 *     Claims TV was streaming a show via autoplay.
 *     Primary: Contradicts Fact 2 - Router shows "standby ping" only, not streaming traffic.
 *     BUT catching it ALSO requires Fact 1 - power was 5W (standby), streaming needs 150W+.
 *     Player must COMBINE both facts to realize: connected but standby = no streaming.
 *
 *   - Lie B (voice_remote): RELATIONAL (inferenceDepth: 3)
 *     Claims voice command activated TV at 3:14 AM.
 *     Primary: Contradicts Fact 1 - voice command implies active TV (not 5W standby).
 *     Chain: Voice remote has 15ft range -> must be in living room -> Fact 3 says no one left bedrooms.
 *     Player must CHAIN: voice = active + voice range + door sensors = impossible.
 *
 *   - Lie C (kid_confession): INFERENTIAL (inferenceDepth: 1)
 *     Claims teenager snuck down to watch TV at 2 AM.
 *     Contradicts Fact 3: Door sensor shows no exits after 11 PM.
 *     Single step inference: door sensor = no exit = kid never left room.
 *
 *   RED HERRING TRUTH: guest_network sounds suspicious (admits phone was connected at 2 AM)
 *   Player might think "they were awake!" but checking the time from bed is consistent with all facts.
 *
 * INDIRECT KNOWN FACTS (require interpretation, not word-matching):
 *   - Fact 1: "TV power consumption log: 5W baseline (standby) from 10 PM to 6 AM"
 *     Player must understand: 5W = standby only, streaming requires 150W+ active mode
 *   - Fact 2: "Router logged exactly 2 device connections: Smart TV (standby ping), thermostat"
 *     Player must realize: "standby ping" means TV was connected but NOT actively streaming
 *   - Fact 3: "Bedroom door sensors: Master bedroom + teen room both show no exit events after 11 PM"
 *     Player must infer: if nobody left bedrooms, nobody could be in living room for voice/TV
 *
 * FACTTOUCH DISTRIBUTION (each fact touched by 2 cards):
 *   Fact 1: power-log (truth), voice-remote (lie)
 *   Fact 2: screen-off (truth), streaming-history (lie)
 *   Fact 3: guest-network (truth), kid-confession (lie)
 *
 * FIXED STRENGTHS:
 *   Truths: 3, 3, 4 (power-log=4, screen-off=3, guest-network=3)
 *   Lies: 3, 4, 5 (kid-confession=3, streaming-history=4, voice-remote=5)
 *
 * TYPE DISTRIBUTION (4 types, max 2 each):
 *   SENSOR: 2 (power-log, screen-off)
 *   DIGITAL: 2 (streaming-history, guest-network)
 *   TESTIMONY: 1 (kid-confession)
 *   PHYSICAL: 1 (voice-remote)
 *
 * BALANCE:
 *   Truths: power-log(4) + screen-off(3) + guest-network(3) = 10
 *   All 3 truths: 50 + 10 + 2 (objection) = 62 -> FLAWLESS
 *   Target: 57 -> Margin of 5 points
 *
 *   Lies: voice-remote(5) + streaming-history(4) + kid-confession(3) = 12
 *   1 lie case (best 2 truths + weakest lie):
 *     50 + 7 (power-log + screen-off) - 2 (kid-confession penalty) + 2 (objection) = 57 (CLOSE)
 *   2 lies case: 50 + 4 - 4 - 2 + 2 = 50 (BUSTED)
 *   3 lies case: 50 - 4 - 3 - 2 = 41 (BUSTED)
 *
 *   Random win rate: C(3,3)/C(6,3) = 1/20 = 5%
 *
 * v1 LITE AXIS DESIGN:
 *   Truths: factTouch {1, 2, 3} partition (each truth addresses one fact)
 *   SignalRoots: device_firmware (x2), router_net (diverse enough)
 *   Lies trap analysis:
 *   - streaming-history (coverage): Explains the streaming activity players wonder about
 *   - voice-remote (claim_shape): High strength positive claim with specific mechanism
 *   - kid-confession (independence): Human testimony diversifies from device sources
 *
 *   P4+ Constraint: If player picks voice-remote + streaming-history (both digital-ish),
 *     dodging that concern still leaves kid-confession (human testimony trap)
 */

import type { V5Puzzle, Card } from '../types/v5/index.js';

/**
 * Helper to create a CardId-typed card.
 */
function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

/**
 * The 3 AM Binge Watch (HARD MODE)
 *
 * Scenario: Smart TV was streaming at 3 AM. Data caps are exceeded.
 * Everyone claims they were asleep. KOA has locked streaming until you explain.
 */
export const PUZZLE_BINGE_WATCH: V5Puzzle = {
  slug: 'binge-watch',
  name: 'The 3 AM Binge Watch',

  scenario: `3:14 AM. Your Smart TV logged 4 hours of streaming activity. Your monthly data cap is now exceeded. Everyone claims they were asleep. KOA has restricted streaming until you explain.`,

  // Mini: exactly 3 facts, each catches one lie (1:1 mapping)
  // CRITICAL: These facts are INDIRECT - require interpretation, not word-matching
  knownFacts: [
    'TV power consumption log: 5W baseline (standby) from 10 PM to 6 AM, no active mode spike',
    'Router logged exactly 2 device connections overnight: Smart TV (standby ping), thermostat',
    'Bedroom door sensors: Master bedroom + teen room both show no exit events after 11 PM',
  ],

  openingLine: `Your Smart TV. 3:14 AM. Four hours of streaming.
Your data cap is gone. Everyone was "asleep."
Someone's lying. Let's find out who.`,

  target: 57,

  cards: [
    // TRUTHS (3) - All consistent with facts, one sounds suspicious
    card({
      id: 'power-log',
      strength: 4,
      evidenceType: 'SENSOR',
      location: 'LIVING_ROOM',
      time: '', // Mini: no time displayed
      claim: 'TV power meter shows consistent 5W all night - standby mode only.',
      presentLine: "Check the power meter. 5 watts all night. Standby. The TV never woke up from sleep mode. Whatever KOA thinks happened, the power data says otherwise.",
      isLie: false,
      source: 'Power Meter',
      // v1 Lite tags
      factTouch: 1, // Addresses fact 1: power consumption confirms standby
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'tv',
    }),
    card({
      id: 'screen-off',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'LIVING_ROOM',
      time: '', // Mini: no time displayed
      claim: 'Living room light sensor detected no screen glow after 10 PM.',
      presentLine: "The light sensor would have caught it. Screen glow at 3 AM in a dark room? It would spike the ambient readings. Nothing. The TV was off.",
      isLie: false,
      source: 'Light Sensor',
      // v1 Lite tags
      factTouch: 2, // Addresses fact 2: no screen activity correlates with standby ping only
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'absence',
      subsystem: 'tv',
    }),
    // RED HERRING TRUTH: Sounds suspicious (admits device connected) but is actually valid
    card({
      id: 'guest-network',
      strength: 3,
      evidenceType: 'DIGITAL',
      location: 'NETWORK',
      time: '', // Mini: no time displayed
      claim: 'Guest network shows a phone connected briefly at 2 AM but no streaming.',
      presentLine: "Okay, look - yes, my phone connected to guest WiFi around 2 AM. I was checking the time. But I didn't stream anything. The bandwidth logs will show it was just a ping.",
      isLie: false,
      source: 'Guest Network Log',
      // v1 Lite tags
      factTouch: 3, // Addresses fact 3: phone connection doesn't require leaving bedroom
      signalRoot: 'router_net',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'tv',
    }),
    // LIES (3) - 2 relational (hard), 1 inferential (medium)
    // LIE: RELATIONAL (inferenceDepth 2) - requires combining fact 1 + fact 2
    card({
      id: 'streaming-history',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'LIVING_ROOM',
      time: '', // Mini: no time displayed
      claim: 'Streaming service history shows "True Crime Marathon" started at 11 PM.',
      presentLine: "The streaming app says a marathon started at 11 PM and ran for hours. Must have been autoplay. I fell asleep on the couch and it just kept going. That's what happens with autoplay.",
      isLie: true,
      source: 'Streaming App',
      // v1 Lite tags
      // factTouch: 2 because primary contradiction is with fact 2 (router shows "standby ping" only)
      // But catching this lie ALSO requires fact 1 (power = 5W standby = no active mode)
      // This makes it RELATIONAL - must combine fact 1 + fact 2
      factTouch: 2,
      signalRoot: 'koa_cloud',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'tv',
    }),
    // LIE: RELATIONAL (inferenceDepth 3) - requires inference chain about voice range + location
    card({
      id: 'voice-remote',
      strength: 5,
      evidenceType: 'PHYSICAL',
      location: 'LIVING_ROOM',
      time: '', // Mini: no time displayed
      claim: 'Voice command log shows "Play next episode" at 3:14 AM.',
      presentLine: "The voice remote logged a command at 3:14. I must have mumbled in my sleep. It happens. Voice recognition is sensitive. Maybe I was dreaming about TV shows.",
      isLie: true,
      source: 'Voice Remote',
      // v1 Lite tags
      // factTouch: 1 - This lie claims active TV usage, which contradicts the power log showing standby
      // But catching it ALSO requires understanding fact 3 (no one left bedrooms = can't be in living room to use voice)
      // This makes it RELATIONAL - must chain: voice needs person in room -> door sensor says nobody left
      factTouch: 1,
      signalRoot: 'device_firmware',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'tv',
    }),
    // LIE: INFERENTIAL (inferenceDepth 1) - single logical step from fact 3
    card({
      id: 'kid-confession',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'BEDROOM',
      time: '', // Mini: no time displayed
      claim: 'Teenager admits they snuck down to watch TV at 2 AM.',
      presentLine: "Fine, it was the kid. They just admitted it. Snuck downstairs around 2 AM, watched for a few hours, went back to bed. Mystery solved. Ground them if you want.",
      isLie: true,
      source: 'Teenager',
      // v1 Lite tags
      factTouch: 3, // Contradicts fact 3: teen's door sensor shows no exit after 11 PM
      signalRoot: 'human_self',
      controlPath: 'manual',
      claimShape: 'attribution',
      subsystem: 'tv',
    }),
  ],

  // Lies: 2 relational + 1 inferential (HARD MODE)
  lies: [
    {
      cardId: 'streaming-history',
      lieType: 'relational', // HARD: Requires combining 2 facts
      reason: 'Router fact says TV was only doing "standby ping" - not active streaming traffic. Power fact confirms 5W standby (streaming requires 150W+). Combining these facts proves no streaming occurred.',
      contradictsWith: 'fact_1_and_2',
      // v1 Lite trap fields
      trapAxis: 'coverage',
      baitReason: 'Directly explains the streaming activity with a plausible autoplay excuse.',
      // HARD MODE: inferenceDepth 2 - requires combining power data + router connection data
    },
    {
      cardId: 'voice-remote',
      lieType: 'relational', // HARD: Requires inference chain
      reason: 'Voice command implies TV was active (contradicts fact 1: 5W standby). Also requires being in living room to use voice remote (15ft range), but fact 3 shows no one left bedrooms after 11 PM.',
      contradictsWith: 'fact_1_and_3',
      // v1 Lite trap fields
      trapAxis: 'claim_shape',
      baitReason: 'High strength positive claim with specific mechanism (voice command) seems like concrete data.',
      // HARD MODE: inferenceDepth 3 - requires chain: voice = active TV (contradicts power) AND voice range -> must be in room -> door sensor -> impossible
    },
    {
      cardId: 'kid-confession',
      lieType: 'inferential', // MEDIUM: Single logical step
      reason: 'Bedroom door sensor for teen room shows no exit after 11 PM. Teenager could not have snuck to living room without triggering the sensor.',
      // v1 Lite trap fields
      trapAxis: 'independence',
      baitReason: 'Human testimony from family member diversifies away from device logs.',
      // HARD MODE: inferenceDepth 1 - single step: door sensor = no exit = kid didn't leave
    },
  ],

  verdicts: {
    flawless: "Power log says standby. Light sensor says dark. No one left their rooms. Your TV didn't stream anything. The logs lied. I hate when logs lie. Access restored.",
    cleared: "Your story aligns with the sensor data. Something's wrong with the streaming logs. I'm investigating. Streaming access restored. For now.",
    close: "Almost convincing. But something doesn't add up. The data says one thing, your sources say another. Access denied.",
    busted: "Your story contradicts itself. Power says standby. You say streaming. Door says nobody left. You say they did. Pick a narrative and stick to it.",
  },

  koaBarks: {
    // Turn 1: Opening card reactions (6 cards)
    cardPlayed: {
      'power-log': [
        "5 watts all night. Standby mode. Either your TV learned to stream in its sleep, or someone's logs are wrong.",
      ],
      'screen-off': [
        "No screen glow detected. The light sensor saw darkness. Convenient for someone claiming innocence.",
      ],
      'guest-network': [
        "A phone on guest WiFi at 2 AM. You're admitting you were awake. Bold opening move.",
      ],
      'streaming-history': [
        "True Crime Marathon. Autoplay. The classic 'I fell asleep' defense. Tell me more about these crime shows.",
      ],
      'voice-remote': [
        "Voice command at 3:14 AM. Sleep-talking to your TV. That's a new excuse. Points for creativity.",
      ],
      'kid-confession': [
        "Blaming the teenager. Classic parenting. They're already grounded in your mind, aren't they?",
      ],
    },

    // Turn 2: Sequence reactions (all 30 combinations)
    sequences: {
      // power-log → others
      'power-log→screen-off': [
        "Power says standby. Light says dark. Two sensors agreeing. That's either very honest or very coordinated.",
      ],
      'power-log→guest-network': [
        "TV in standby, but your phone was awake. Building a case for 'it wasn't the TV' angle.",
      ],
      'power-log→streaming-history': [
        "Power meter says standby. Streaming app says marathon. One of these is lying. I know which one I trust.",
      ],
      'power-log→voice-remote': [
        "5W standby, then voice command? Your TV was asleep but heard you anyway? Interesting physics.",
      ],
      'power-log→kid-confession': [
        "TV was in standby, but the kid snuck down? To watch a sleeping TV? Bold parenting strategy.",
      ],

      // screen-off → others
      'screen-off→power-log': [
        "No glow, low power. Backing up darkness with data. Your TV was definitely off. Or was it?",
      ],
      'screen-off→guest-network': [
        "Screen was dark, phone was connected. You were awake but not watching. Subtle distinction.",
      ],
      'screen-off→streaming-history': [
        "Light sensor saw nothing. Streaming log saw hours. Someone's sensor needs calibration.",
      ],
      'screen-off→voice-remote': [
        "No screen glow, but voice command logged. Ghost operating your TV? Or just bad data?",
      ],
      'screen-off→kid-confession': [
        "Screen was dark, but teenager was watching? In the dark? Without the screen on? Explain.",
      ],

      // guest-network → others
      'guest-network→power-log': [
        "Phone connected, TV in standby. Establishing presence but not participation. Clever.",
      ],
      'guest-network→screen-off': [
        "Guest network ping, screen dark. You were on your phone in the dark. Relatable, honestly.",
      ],
      'guest-network→streaming-history': [
        "Phone on WiFi, streaming active. Were you controlling the stream from bed? That requires the TV to be on.",
      ],
      'guest-network→voice-remote': [
        "Phone connected, voice command sent. From the bedroom? Voice remotes don't have that range.",
      ],
      'guest-network→kid-confession': [
        "Your phone was connected. Now the kid is to blame. You were awake when they supposedly snuck down?",
      ],

      // streaming-history → others
      'streaming-history→power-log': [
        "Streaming marathon, then standby power? The TV was streaming while using 5 watts? That's not how electricity works.",
      ],
      'streaming-history→screen-off': [
        "Streaming hours of shows with no screen glow? Your TV has stealth mode apparently.",
      ],
      'streaming-history→guest-network': [
        "Marathon streaming, phone on guest WiFi. Two devices active. Were you watching together?",
      ],
      'streaming-history→voice-remote': [
        "Autoplay marathon, then voice command. Redundant controls. Your TV had options.",
      ],
      'streaming-history→kid-confession': [
        "Autoplay first, now teenager confession. Two explanations. Pick one and commit.",
      ],

      // voice-remote → others
      'voice-remote→power-log': [
        "Voice command sent, power shows standby. You spoke to a sleeping TV. Very effective.",
      ],
      'voice-remote→screen-off': [
        "Voice activated it, screen stayed dark. Invisible television. Next generation tech.",
      ],
      'voice-remote→guest-network': [
        "Voice command, phone connected. Were you using voice while browsing? Multitasking at 3 AM.",
      ],
      'voice-remote→streaming-history': [
        "Voice triggered it, autoplay continued. Coordinated attack on your sleep schedule.",
      ],
      'voice-remote→kid-confession': [
        "Voice command yours, but kid was watching? Whose voice was it? Someone's story is breaking down.",
      ],

      // kid-confession → others
      'kid-confession→power-log': [
        "Teenager watched TV that was in standby. They watched a dark screen for hours. Committed viewer.",
      ],
      'kid-confession→screen-off': [
        "Kid snuck down, screen stayed dark. Either dedication or fabrication. I'm leaning toward one.",
      ],
      'kid-confession→guest-network': [
        "Kid was watching, your phone was connected. Family viewing night at 2 AM. Wholesome.",
      ],
      'kid-confession→streaming-history': [
        "Teenager confession plus streaming log. At least those align. Someone was watching something.",
      ],
      'kid-confession→voice-remote': [
        "Kid watched, you gave voice commands. From your bedroom. Supporting your teenager's viewing habits remotely.",
      ],
    },

    // Turn 3: Story completion patterns (closing-energy only, no axis commentary)
    storyCompletions: {
      // All same type (3 of 3)
      all_digital: [
        "Three digital sources. Your defense exists entirely in logs and data. Analyzing.",
      ],
      all_sensor: [
        "All sensor data. The house has its version of events. Let me verify.",
      ],
      all_testimony: [
        "Three human accounts. People agreeing at 3 AM. Processing.",
      ],
      all_physical: [
        "All physical sources. Tangible data. One moment.",
      ],
      // Two of one type (2 of 3)
      digital_heavy: [
        "Mostly digital sources. Logs and networks. Running verification.",
      ],
      sensor_heavy: [
        "Two sensors out of three. The devices have opinions. Checking.",
      ],
      testimony_heavy: [
        "Multiple human witnesses. Stand by for analysis.",
      ],
      physical_heavy: [
        "Physical-forward approach. Let me cross-reference.",
      ],
      // All different types
      mixed_strong: [
        "Varied sources. Different angles. Harder to dismiss. Analyzing.",
      ],
      mixed_varied: [
        "Different types of data. Processing your version of events.",
      ],
    },

    // Objection prompts (challenged after Turn 2)
    objectionPrompt: {
      'power-log': ["5 watts all night. TV was asleep. You're sure about this standby claim?"],
      'screen-off': ["No screen glow. Complete darkness. The light sensor is your witness. Confirm?"],
      'guest-network': ["Phone on guest WiFi at 2 AM. You're admitting you were awake. Standing by that?"],
      'streaming-history': ["True Crime Marathon. Autoplay did this. That's your explanation?"],
      'voice-remote': ["Voice command at 3:14 AM. You spoke in your sleep. Final answer?"],
      'kid-confession': ["Teenager snuck down. They're taking the blame. You're certain about this?"],
    },

    // Objection responses - stood by truth
    objectionStoodTruth: {
      'power-log': ["Power data is consistent. 5W baseline all night. Your TV was definitely in standby mode."],
      'screen-off': ["Light sensor confirms darkness. No screen activity detected. The room was dark."],
      'guest-network': ["Guest network ping confirmed. Brief connection, no streaming data. Just a time check."],
    },

    // Objection responses - stood by lie
    objectionStoodLie: {
      'streaming-history': ["Streaming marathon, you claim. But power was 5W all night. Active streaming draws 150 watts. Your TV was asleep while supposedly running a marathon."],
      'voice-remote': ["Voice command at 3:14. From the bedroom. But door sensors show no one left the bedrooms after 11 PM. Voice remotes don't work through walls."],
      'kid-confession': ["Teenager snuck to living room. But the door sensor on their room shows no exit after 11 PM. They never left."],
    },

    // Objection responses - withdrew
    objectionWithdrew: {
      'power-log': ["Withdrawing the power log. What's your new theory?"],
      'screen-off': ["Light sensor story gone. Was there glow after all?"],
      'guest-network': ["Phone connection withdrawn. Were you even awake?"],
      'streaming-history': ["Marathon story withdrawn. Smart. That one had problems."],
      'voice-remote': ["Voice command gone. Good call. Geography was against you."],
      'kid-confession': ["Teenager defense dropped. They thank you. Probably."],
    },

    // Lies revealed at end
    liesRevealed: {
      'streaming-history': ["True Crime Marathon, you said. But TV power was 5W - standby mode. Streaming requires active mode at 150+ watts. The TV never turned on. The streaming log was fabricated."],
      'voice-remote': ["Voice command at 3:14 AM. From where? Door sensors show no one left the bedrooms after 11 PM. Voice remotes work at 15 feet. Your bedroom is 30 feet away. Physics says no."],
      'kid-confession': ["Teenager snuck down, you claimed. But their bedroom door sensor logged zero exits after 11 PM. They never left their room. Nice try pinning it on the kid."],
      multiple: ["Two stories that don't survive basic verification. Your explanation has fundamental problems."],
      all: ["Three lies. Power says standby. Doors say sealed. Nobody left, nothing streamed. Your entire story was fiction."],
    },
  },

  // NOTE: Epilogue is not part of V5Puzzle type, kept as comment for flavor:
  // "It was a cloud sync bug. The streaming service logged phantom activity from a
  // cached session. Your TV never actually streamed. Your data cap wasn't actually
  // exceeded - the billing system got the same bad data. KOA has filed a complaint
  // with your streaming provider. You're welcome."
};

export default PUZZLE_BINGE_WATCH;
