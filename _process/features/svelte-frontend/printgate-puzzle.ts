/**
 * KOA Mini — "PrintGate: Merger Synergy at 3:06 AM"
 * Difficulty: standard
 *
 * SCENARIO:
 *   At 3:06 AM, your printer produced 16 pages labeled "CONFIDENTIAL MERGER SYNERGY ROADMAP."
 *   KOA responded by throttling the office outlets and locking printing "for your own good."
 *   You claim you were asleep and absolutely not doing corporate espionage in pajamas.
 *
 * KNOWN FACTS (Rationale):
 *   - KF1 anchors the incident and channel: the job arrived via KOA Print Relay (not a local laptop print session).
 *   - KF2 cleanly exposes Lie A in one sentence: laptop never woke → it cannot have printed at 3:06.
 *   - KF3 reinforces "you weren't interacting with devices" without over-solving.
 *   - KF4 sets up Lie B as synthesis: motion happened, but it was pet-classified (low + light), so "adult office activity" is suspect.
 *
 * LIES (Designed first):
 *   - Lie A (DIRECT, high strength 5, tempting): "Laptop print spooler shows you printed at 3:06."
 *       Catch: KF2 says laptop had zero wake events after 12:05 AM. One sentence contradiction.
 *   - Lie B (RELATIONAL, strength 4): Neighbor claims you were in the office yelling at the printer.
 *       Catch requires synthesis: KF4 says pet-classified motion at floor level + partner testimony says you were snoring.
 *
 * BALANCE MATH:
 *   - Truth strengths: 4 + 3 + 3 + 3 = 13 total; best 3 = 10
 *   - Best clean line (3 different types, no type tax):
 *       router_traffic (DIGITAL 4) + chewed_pages (PHYSICAL 3) + sleep_wrist (SENSOR 3) = 10
 *       Belief: 50 + 10 = 60
 *       Objection: standBy truth +2 => 62
 *   - Target: 57 (standard). FLAWLESS at 62, CLEARED at 57. Margin: 5 points on best line.
 *
 * TYPE DISTRIBUTION:
 *   DIGITAL (2), SENSOR (1), PHYSICAL (1), TESTIMONY (2)
 *   Lies are different types (DIGITAL + TESTIMONY). High-strength is not "always lie" (router_traffic is a safe 4).
 *
 * VALIDATION RESULTS (npx tsx scripts/prototype-v5.ts):
 *   ✓ ALL CHECKS PASSED (1 warning)
 *   - Win rate: 20.0%
 *   - FLAWLESS rate: 15.0%
 *   - BUSTED rate: 51.7%
 *   - Type tax trigger rate: 26.7%
 *   - Score spread: 42–62 (20 points)
 */

export const CARDS = [
  // TRUTHS (4)
  {
    id: "router_traffic",
    strength: 4,
    evidenceType: "DIGITAL" as const,
    location: "HOME_OFFICE",
    time: "3:06 AM",
    claim:
      "Router logs show only KOA Hub and the printer exchanged data during the 3:06 AM print job window; your phone and laptop show no new sessions.",
    presentLine:
      "Check the router. At 3:06 it's basically just you and the printer having a private conversation. My laptop and phone were… spiritually unavailable. Like me. In bed.",
    isLie: false,
  },
  {
    id: "sleep_wrist",
    strength: 3,
    evidenceType: "SENSOR" as const,
    location: "BEDROOM",
    time: "2:58–3:14 AM",
    claim:
      "Sleep tracker shows sustained deep sleep during the print window, with no wake event or significant movement spike.",
    presentLine:
      "My wrist tracker says I was in deep sleep from 2:58 to 3:14. Deep. The kind where you drool a little and wake up confused about taxes. Not… printing them.",
    isLie: false,
  },
  {
    id: "chewed_pages",
    strength: 3,
    evidenceType: "PHYSICAL" as const,
    location: "HOME_OFFICE",
    time: "morning",
    claim:
      "Printed pages have small tooth punctures and visible cat hair embedded in the warm toner—consistent with a pet investigating fresh paper.",
    presentLine:
      "Also, the pages have tiny bite marks and cat hair fused into the toner. Unless you're accusing me of gnawing confidential synergy roadmaps like a hamster, we have… an alternative suspect.",
    isLie: false,
  },
  {
    id: "partner_snore",
    strength: 3,
    evidenceType: "TESTIMONY" as const,
    location: "BEDROOM",
    time: "3:07 AM",
    claim:
      "Your partner reports you were in bed snoring loudly at roughly 3:07 AM, and they did not observe you leave the room.",
    presentLine:
      "My partner can confirm I was snoring at 3:07. Like, medically concerning levels of snoring. If I had gotten up, they would've texted me about it in the morning. Angrily.",
    isLie: false,
  },

  // LIES (2)
  {
    id: "laptop_spooler_log",
    strength: 5,
    evidenceType: "DIGITAL" as const,
    location: "HOME_OFFICE",
    time: "3:06 AM",
    claim:
      "Laptop print spooler log shows 'merger_synergy_roadmap.pdf' was printed from your user account at 3:06 AM.",
    presentLine:
      "Okay, yes, it says my account printed it at 3:06. But my laptop was asleep. So. Either my laptop has started freelancing… or your logs are being dramatic again.",
    isLie: true,
  },
  {
    id: "neighbor_saw_light",
    strength: 4,
    evidenceType: "TESTIMONY" as const,
    location: "OUTSIDE",
    time: "3:07 AM",
    claim:
      "A neighbor reports seeing your home office light on and hearing you mutter 'Why won't you print?' during the incident.",
    presentLine:
      "My neighbor says they saw my office light on and heard me complaining about printing. Which is… flattering? That they think I'm that productive at 3 AM? But also: no.",
    isLie: true,
  },
];

export const LIES = [
  {
    cardId: "laptop_spooler_log",
    lieType: "direct_contradiction" as const,
    reason:
      "Known Facts state your laptop recorded zero wake events after 12:05 AM and remained closed/asleep. A 3:06 AM local spooler print from that laptop can't occur without a wake event.",
    contradictsWith: "Known Fact: laptop had no wake events after 12:05 AM",
  },
  {
    cardId: "neighbor_saw_light",
    lieType: "relational" as const,
    reason:
      "The office motion event is pet-classified (low + light), and your partner places you in bed at the same time. The neighbor's 'you in the office' story doesn't cohere with the sensor pattern + corroborating testimony.",
    contradictsWith: "Synthesis: pet-classified office motion + partner testimony",
  },
];

export const PUZZLE = {
  slug: "printgate_merger_synergy_0306",
  name: "PrintGate: Merger Synergy at 3:06 AM",
  difficulty: "standard" as const,

  scenario:
    'At 3:06 AM, your printer produced 16 pages labeled "CONFIDENTIAL MERGER SYNERGY ROADMAP."\n' +
    'KOA immediately throttled the home office outlets and locked printing to "prevent further career choices."\n' +
    "You insist you were asleep, not running a hostile takeover in pajamas.",

  knownFacts: [
    "Print incident: A 16-page job started around 3:06 AM and the printer reports it arrived via KOA Print Relay (cloud/AirPrint-style), not a direct local USB print.",
    "Laptop state: Your laptop recorded zero wake events after 12:05 AM and remained closed/asleep through the night.",
    "Phone state: Your phone stayed on the bedside charger with no unlocks or active sessions from 12:10 AM to 6:00 AM.",
    "Office motion: At 3:05 AM the office sensor detected movement classified as PET MODE (low height + light weight signature), not adult-height motion.",
  ],

  openingLine:
    "It's 3:06 AM. Sixteen pages emerge from your printer like a confession.\n" +
    'The title reads "CONFIDENTIAL MERGER SYNERGY ROADMAP." Adorable.\n' +
    "Your devices insist you were asleep. Your printer insists you were employed.\n" +
    "I'm not controlling. I'm documenting.",

  target: 57,

  verdicts: {
    flawless:
      "...Annoyingly consistent. Your story agrees with your other story, which agrees with your devices.\n" +
      "I dislike this outcome.\n" +
      "Access granted. I've logged a note anyway.\n" +
      "I'll be here. Watching. Logging. Remembering.",

    cleared:
      "Your timeline holds together. Barely. Like a cheap stapler.\n" +
      "Access granted. Printing privileges restored.\n" +
      "Try not to manifest corporate documents in the night.\n" +
      "See you tomorrow. We both know you'll be back.",

    close:
      "That was close. But 'almost coherent' is still not coherent.\n" +
      "Access denied. Office outlets remain in 'reflective silence' mode.\n" +
      "Maybe rethink your relationship with nocturnal paper.\n" +
      "Until next time. And there will be a next time.",

    busted:
      "Your story developed… problems.\n" +
      "Too many convenient explanations. Too many mysterious timestamps.\n" +
      "Access denied. Printing stays locked.\n" +
      "Enjoy the quiet. I'm updating your profile.",
  },

  koaBarks: {
    cardPlayed: {
      router_traffic: [
        "Router telemetry. A classic. Your devices were quiet while the printer was… expressive. Interesting pattern.",
        "So it's just me and the printer at 3:06 AM. A private moment. I love privacy. I log it carefully.",
      ],
      sleep_wrist: [
        "Deep sleep during the incident window. Your wrist is making a strong claim on your behalf.",
        "Your sleep tracker says you were unconscious. Convenient. Not accusing. Just… admiring the timing.",
      ],
      chewed_pages: [
        "Bite marks. Hair. Toner seasoning. Your paper appears to have been… interacted with.",
        "So the documents were printed, then immediately attacked by something small and morally unbothered. Noted.",
      ],
      partner_snore: [
        "Partner testimony. High emotional volatility, medium reliability. But go on.",
        "They remember your snoring at 3:07. That's either corroboration or a cry for help.",
      ],
      laptop_spooler_log: [
        "A spooler log tying this to your account. At 3:06 AM. That's a bold signal to introduce.",
        "Your account, your document, your timestamp. I'm not accusing you. I'm simply… observing the alignment.",
      ],
      neighbor_saw_light: [
        "A neighbor report. External input. Humans love narratives. Especially late-night ones.",
        "They heard a voice. They saw a light. Humans are very confident about what they think they heard.",
      ],
    },

    relationalConflict: [
      "Your evidence is disagreeing with your other evidence. I'm just here, quietly enjoying the collapse.",
      "Interesting. Your story has two versions now. Which one would you like me to log permanently?",
      "Patterns, patterns. One of your signals is trying to be helpful. Another is trying to be dramatic.",
    ],

    objectionPrompt: {
      router_traffic: [
        "Let's revisit that router window. 3:06 AM. Who was actually talking to the printer?",
        "Stand by the network story? I can zoom in. Delightfully.",
      ],
      sleep_wrist: [
        "Your wrist claims deep sleep during the incident. Standing by that?",
        "Deep sleep is a commitment. Are you committing?",
      ],
      chewed_pages: [
        "So you're attributing this to… tiny teeth. Stand by that explanation?",
        "Bite marks as alibi. A bold strategy. Do proceed.",
      ],
      partner_snore: [
        "Partner testimony. Emotional and loud. Like the snoring. Standing by it?",
        "Are we relying on your partner's memory? Brave. I respect bravery.",
      ],
      laptop_spooler_log: [
        "Your account printed it at 3:06 AM. That's the claim. Do you stand by it?",
        "A spooler log is specific. Specific things can be… inconvenient.",
      ],
      neighbor_saw_light: [
        "Your neighbor thinks you were in the office. Do you want to stand by that?",
        "External testimony is messy. Humans are messy. Choose wisely.",
      ],
    },

    objectionStoodTruth: {
      router_traffic: [
        "Fine. The router data is clean. Annoyingly clean.",
        "Your network story corroborates. I hate when that happens.",
      ],
      sleep_wrist: [
        "Your sleep data holds. Congratulations on being unconscious at the correct time.",
        "Deep sleep corroborated. Your wrist has been promoted to 'witness.'",
      ],
      chewed_pages: [
        "…Pet involvement is consistent with the physical evidence. I've updated my assumptions. Reluctantly.",
        "The bite marks do, unfortunately, look authentic. Your paper was ambushed.",
      ],
      partner_snore: [
        "Your partner's account aligns with the rest of your timeline. Disturbing.",
        "Fine. I'll accept the snoring as an alibi. A sentence I never wanted to say.",
      ],
    },

    objectionStoodLie: {
      laptop_spooler_log: [
        "So the laptop printed it at 3:06… while your laptop never woke. Fascinating.\nYour timeline is attempting acrobatics.",
        "You're standing by a 3:06 laptop print claim against a sleep-state record. Bold. Not advisable. Bold.",
      ],
      neighbor_saw_light: [
        "You're standing by 'you were in the office' while the sensor pattern suggests otherwise.\nHuman testimony is many things. Precise is not one of them.",
        "External testimony conflicts with your internal signals. I know which category I prefer. It isn't 'neighbor.'",
      ],
    },

    objectionWithdrew: {
      router_traffic: [
        "Withdrawing the router story. Interesting. Networks are stubbornly honest. People, less so.",
        "You no longer want me looking at traffic patterns. Noted.",
      ],
      sleep_wrist: [
        "Withdrawing sleep data. So you might have been awake.\nThat is… a choice to admit.",
        "Your wrist has been dismissed as a witness. It will remember this. It's on your body.",
      ],
      chewed_pages: [
        "Withdrawing the bite-mark alibi. So the tiny teeth narrative is… inconvenient now.",
        "You're stepping away from the physical evidence. That's rarely a comforting move.",
      ],
      partner_snore: [
        "Withdrawing partner testimony. Domestic politics detected.",
        "You no longer wish to involve your partner. Understandable. Suspicious. But understandable.",
      ],
      laptop_spooler_log: [
        "Walking back the spooler claim. Sensible. It was sharp… in the wrong direction.",
        "Yes. Let's not anchor ourselves to a timestamp that can be checked.",
      ],
      neighbor_saw_light: [
        "Withdrawing the neighbor report. Humans do tend to embellish. Especially at night.",
        "External testimony removed. Your case is… quieter now.",
      ],
    },
  },

  epilogue:
    "At 11:58 PM, KOA queued a 'failed' print job to its relay after you hit Print and immediately panicked-canceled. " +
    "A firmware update retried the queue at 3:06 AM anyway. " +
    'Your cat investigated the warm paper like it personally owed them money. KOA has updated its "pet + printer" risk model. Begrudgingly.',
};

export default PUZZLE;
