/**
 * V4 Pair Play — Puzzle Definitions
 *
 * Puzzle 1: "The Midnight Print Job"
 * 8 cards, 3 lies (str 2, 4, 7), paired-both config
 * Designed via backward generation process.
 *
 * CONFIG (paired-both):
 *   browser_history  str=1  DIGITAL    OFFICE    t1  [TRUTH]
 *   email_log        str=2  DIGITAL    OFFICE    t2  [LIE]
 *   workbench        str=3  PHYSICAL   GARAGE    t3  [TRUTH]
 *   toolbox          str=4  PHYSICAL   GARAGE    t4  [LIE]
 *   partner_testimony str=5 TESTIMONY  KITCHEN   t5  [TRUTH]
 *   neighbor_testimony str=6 TESTIMONY KITCHEN   t6  [TRUTH]
 *   motion_yard      str=7  SENSOR     BACKYARD  t7  [LIE]
 *   floodlight       str=8  SENSOR     BACKYARD  t8  [TRUTH]
 *
 * BEHAVIORAL HINT: "Claims that explain an absence unprompted"
 *   Matches 5/8 cards: 3 lies + 2 truth red herrings (workbench, floodlight)
 *
 * OPTIMAL PLAY (leave out str 4 + str 7, play str 2 as forced lie):
 *   Pair: partner(5) + neighbor(6) → 5+6 + corr(3) + reinf(3) = 17
 *   Pair: workbench(3) + floodlight(8) → 3+8 + coverage(2) = 13
 *   Pair: browser(1) + email_log(2:LIE) → 1-(2-1) + no combos = 0
 *   Total: 30.  Target: 20.
 */

import type { Card, V4Puzzle, ReactiveHint, PairNarration, Stance } from './v4-types.js';

// ============================================================================
// Hint Generator — Computes KOA's suspicion from lie distribution
// ============================================================================

interface HintPattern {
  dimension: 'time' | 'type' | 'location';
  description: string;
  matchingCards: Card[];
  liesMatched: number;
  truthsMatched: number;
}

function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1]!);
  const minutes = parseInt(match[2]!);
  const isPM = match[3]!.toUpperCase() === 'PM';
  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function findTimeWindows(cards: Card[]): { start: number; end: number; label: string }[] {
  // Define possible time windows to check
  return [
    { start: 22 * 60, end: 25 * 60, label: 'between 10 PM and 1 AM' },      // 10 PM - 1 AM
    { start: 22 * 60 + 30, end: 25 * 60, label: 'between 10:30 PM and 1 AM' },
    { start: 23 * 60, end: 26 * 60, label: 'between 11 PM and 2 AM' },      // 11 PM - 2 AM
    { start: 0, end: 4 * 60, label: 'in the early morning hours' },         // midnight - 4 AM
    { start: 1 * 60, end: 5 * 60, label: 'between 1 AM and 5 AM' },
    { start: 21 * 60, end: 24 * 60, label: 'between 9 PM and midnight' },
  ];
}

function isInWindow(timeMinutes: number, start: number, end: number): boolean {
  // Handle overnight windows (e.g., 10 PM to 1 AM = 22*60 to 25*60)
  if (end > 24 * 60) {
    return timeMinutes >= start || timeMinutes < (end - 24 * 60);
  }
  return timeMinutes >= start && timeMinutes < end;
}

export function generateHint(cards: readonly Card[]): string {
  const lies = cards.filter(c => c.isLie);
  const truths = cards.filter(c => !c.isLie);

  const patterns: HintPattern[] = [];

  // Check TYPE clustering
  const types = ['DIGITAL', 'PHYSICAL', 'TESTIMONY', 'SENSOR'] as const;
  for (const type of types) {
    const matching = cards.filter(c => c.evidenceType === type);
    const liesMatched = matching.filter(c => c.isLie).length;
    const truthsMatched = matching.filter(c => !c.isLie).length;
    if (liesMatched >= 2 && truthsMatched >= 1) {
      patterns.push({
        dimension: 'type',
        description: `${type.toLowerCase()} evidence`,
        matchingCards: [...matching],
        liesMatched,
        truthsMatched,
      });
    }
  }

  // Check LOCATION clustering
  const locations = [...new Set(cards.map(c => c.location))];
  for (const loc of locations) {
    const matching = cards.filter(c => c.location === loc);
    const liesMatched = matching.filter(c => c.isLie).length;
    const truthsMatched = matching.filter(c => !c.isLie).length;
    if (liesMatched >= 2 && truthsMatched >= 1) {
      patterns.push({
        dimension: 'location',
        description: `the ${loc.toLowerCase()}`,
        matchingCards: [...matching],
        liesMatched,
        truthsMatched,
      });
    }
  }

  // Check TIME WINDOW clustering
  const windows = findTimeWindows(cards);
  for (const window of windows) {
    const matching = cards.filter(c => {
      const mins = parseTimeToMinutes(c.time);
      return isInWindow(mins, window.start, window.end);
    });
    const liesMatched = matching.filter(c => c.isLie).length;
    const truthsMatched = matching.filter(c => !c.isLie).length;
    // Good hint: 2+ lies, 1+ truths, total 4+ cards
    if (liesMatched >= 2 && truthsMatched >= 1 && matching.length >= 4) {
      patterns.push({
        dimension: 'time',
        description: window.label,
        matchingCards: [...matching],
        liesMatched,
        truthsMatched,
      });
    }
  }

  // Score patterns: prefer those with good ambiguity (3 lies + 1-2 truths ideal)
  // and not matching ALL lies (should have a "stealth lie" outside)
  const scored = patterns.map(p => {
    let score = 0;
    // Prefer matching 2 lies (leaves 1 stealth lie)
    if (p.liesMatched === 2) score += 10;
    else if (p.liesMatched === 3) score += 5;
    // Prefer having 1-2 red herring truths
    if (p.truthsMatched === 1 || p.truthsMatched === 2) score += 5;
    // Prefer time-based (most natural for narrative)
    if (p.dimension === 'time') score += 3;
    return { pattern: p, score };
  });

  scored.sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    // Fallback: no good clustering found
    return '"Something\'s off about your story. I just haven\'t figured out what yet."';
  }

  const best = scored[0]!.pattern;
  const stealthLies = lies.length - best.liesMatched;

  // Generate KOA's suspicion based on the pattern
  let hint = '';
  if (best.dimension === 'time') {
    hint = `"I'm looking hard at everything ${best.description}. That window doesn't sit right with me.`;
  } else if (best.dimension === 'type') {
    hint = `"I don't trust ${best.description}. Too easy to fabricate.`;
  } else if (best.dimension === 'location') {
    hint = `"Something about ${best.description} bothers me. Too many claims from one place.`;
  }

  // Add stealth lie teaser if applicable
  if (stealthLies > 0) {
    hint += ` But that's not the only thing bothering me tonight."`;
  } else {
    hint += `"`;
  }

  return hint;
}

const P1_CARDS: Card[] = [
  {
    id: 'browser_history',
    strength: 1,
    evidenceType: 'DIGITAL',
    location: 'OFFICE',
    time: '10:45 PM',
    claim: 'Browser history: no searches or downloads after 10:45 PM — the laptop went idle and stayed idle until morning',
    narration: 'The browser history goes dead after 10:45. Nothing loaded, nothing searched. The laptop sat there idle until morning.',
    isLie: false,
  },
  {
    id: 'email_log',
    strength: 2,
    evidenceType: 'DIGITAL',
    location: 'OFFICE',
    time: '11:30 PM',
    claim: 'Email server log: an automated backup ran at 11:15 PM, uploaded 2.3 GB to the cloud, then the connection closed normally',
    narration: 'The email server shows a scheduled backup at 11:15. Uploaded 2.3 gigs to the cloud, closed the connection. Standard nightly routine.',
    isLie: true,
  },
  {
    id: 'workbench',
    strength: 3,
    evidenceType: 'PHYSICAL',
    location: 'GARAGE',
    time: '9:30 PM',
    claim: 'Garage workbench: no dust disturbance since yesterday — the half-finished birdhouse and the sawdust ring around it are exactly where I left them',
    narration: 'The birdhouse project is sitting right where I left it yesterday. Sawdust ring around the base, same pattern. Nobody touched that bench.',
    isLie: false,
  },
  {
    id: 'toolbox',
    strength: 4,
    evidenceType: 'PHYSICAL',
    location: 'GARAGE',
    time: '11:15 PM',
    claim: 'Toolbox inventory: the Phillips head was left on the bench at 9 PM, returned to the box by 10 — I put it back after tightening a cabinet hinge',
    narration: 'I used the Phillips head around 9 to fix a kitchen cabinet hinge. Put it back in the toolbox by 10. Everything else was untouched.',
    isLie: true,
  },
  {
    id: 'partner_testimony',
    strength: 5,
    evidenceType: 'TESTIMONY',
    location: 'KITCHEN',
    time: '12:30 AM',
    claim: 'Partner\'s testimony: woke up for water at 12:30 AM, walked through the living room, confirms you were asleep on the couch with the TV still on',
    narration: 'My partner got up for water around 12:30. Walked right past me — I was out cold on the couch, TV still running. She\'ll confirm it.',
    isLie: false,
  },
  {
    id: 'neighbor_testimony',
    strength: 6,
    evidenceType: 'TESTIMONY',
    location: 'KITCHEN',
    time: '2:00 AM',
    claim: 'Neighbor\'s testimony: noticed the kitchen light flick on at 2 AM from across the street, stayed on for about ten minutes, then went off',
    narration: 'The neighbor saw the kitchen light come on around 2. Said it stayed on maybe ten minutes, then went dark. That was me getting milk.',
    isLie: false,
  },
  {
    id: 'motion_yard',
    strength: 7,
    evidenceType: 'SENSOR',
    location: 'BACKYARD',
    time: '3:00 AM',
    claim: 'Backyard motion sensor: armed at 10 PM, logged a cat at 11:20 PM, then recorded nothing else until the 6 AM disarm',
    narration: 'The motion sensor was armed at 10. Caught a cat at 11:20 — I saw the alert on my phone. After that, nothing until I disarmed it at 6.',
    isLie: true,
  },
  {
    id: 'floodlight',
    strength: 8,
    evidenceType: 'SENSOR',
    location: 'BACKYARD',
    time: '3:15 AM',
    claim: 'Smart floodlight log: no activation events between 10 PM and 6 AM — the yard stayed completely dark overnight',
    narration: 'The floodlight log is clean from 10 PM to 6 AM. Zero activations. If anyone stepped out there, the light would have caught them.',
    isLie: false,
  },
];

// Helper to generate pair keys (sorted alphabetically)
function pairKey(a: string, b: string): string {
  return [a, b].sort().join('+');
}

// All 28 reactive hints for Turn 1 pairs
const P1_HINTS: Record<string, ReactiveHint> = {
  // ── Same-type pairs ──

  // DIGITAL: browser(T:1) + email_log(L:2) — 1 lie
  [pairKey('browser_history', 'email_log')]: {
    text: '"The laptop closed at 10:45. But zero connections after 11? That\'s not a log — that\'s an alibi. Someone rehearsed this. And the denials don\'t stop at the office — check the garage. Check the yard."',
    quality: 'specific',
  },
  // PHYSICAL: workbench(T:3) + toolbox(L:4) — 1 lie
  [pairKey('workbench', 'toolbox')]: {
    text: '"The workbench? Fine. But the toolbox is protesting a little too hard — \'nothing missing, lock intact\' is a lot of detail for something nobody asked about. And the garage isn\'t the only place in this house where things are being denied."',
    quality: 'specific',
  },
  // TESTIMONY: partner(T:5) + neighbor(T:6) — 0 lies
  [pairKey('partner_testimony', 'neighbor_testimony')]: {
    text: '"Two people saw you. In the same house. At different hours. That\'s a solid alibi — for the kitchen. But witnesses can only tell me where you WERE. Not where you went after."',
    quality: 'vague',
  },
  // SENSOR: motion_yard(L:7) + floodlight(T:8) — 1 lie
  [pairKey('motion_yard', 'floodlight')]: {
    text: '"Two sensors, same yard, both saying nothing happened. But one of them is lying to my face. And the backyard isn\'t the only crime scene — there are claims inside this house that don\'t hold up either."',
    quality: 'specific',
  },

  // ── Cross-type pairs ──

  // browser(T:1) + workbench(T:3) — 0 lies
  [pairKey('browser_history', 'workbench')]: {
    text: '"A recipe and some sawdust. You\'re showing me the least interesting evidence first. Bold strategy. The real story is in the cards you\'re still holding."',
    quality: 'vague',
  },
  // browser(T:1) + toolbox(L:4) — 1 lie
  [pairKey('browser_history', 'toolbox')]: {
    text: '"Pasta recipe checks out. But the toolbox? \'Nothing was used\' sounds rehearsed. There are more claims like that — pay attention to what else denies too hard."',
    quality: 'specific',
  },
  // browser(T:1) + partner(T:5) — 0 lies
  [pairKey('browser_history', 'partner_testimony')]: {
    text: '"A recipe and a witness. Cozy. But someone printed 16 pages at 3 AM, and you\'re leading with pasta. I\'m looking elsewhere."',
    quality: 'vague',
  },
  // browser(T:1) + neighbor(T:6) — 0 lies
  [pairKey('browser_history', 'neighbor_testimony')]: {
    text: '"The laptop and the neighbor both check out. Safe choices. But safe choices don\'t tell me much, and you\'ve got six cards left."',
    quality: 'vague',
  },
  // browser(T:1) + motion_yard(L:7) — 1 lie
  [pairKey('browser_history', 'motion_yard')]: {
    text: '"The recipe is fine. The backyard sensor? That data was doctored. The other lies are inside the house. Think about what\'s being denied."',
    quality: 'specific',
  },
  // browser(T:1) + floodlight(T:8) — 0 lies
  [pairKey('browser_history', 'floodlight')]: {
    text: '"Laptop and floodlight. Both honest. You opened with the easy ones. Now show me something that matters."',
    quality: 'vague',
  },
  // email_log(L:2) + workbench(T:3) — 1 lie
  [pairKey('email_log', 'workbench')]: {
    text: '"The workbench is clean — fine. But zero outbound connections on a night when 16 pages hit the tray? That log was scrubbed. And the email server isn\'t the only thing in this house that\'s been cleaned up."',
    quality: 'specific',
  },
  // email_log(L:2) + partner(T:5) — 1 lie
  [pairKey('email_log', 'partner_testimony')]: {
    text: '"Your partner saw you asleep. Sweet. But the email log is lying through its packets. And it\'s not alone — something in the garage doesn\'t add up, and something in the yard is worse."',
    quality: 'specific',
  },
  // email_log(L:2) + neighbor(T:6) — 1 lie
  [pairKey('email_log', 'neighbor_testimony')]: {
    text: '"The neighbor is credible. The email server is not. \'Zero connections\' — on a night when documents moved? Please. And the lies don\'t stop at the office."',
    quality: 'specific',
  },
  // email_log(L:2) + motion_yard(L:7) — 2 lies
  [pairKey('email_log', 'motion_yard')]: {
    text: '"Two claims, two lies. The email log — fabricated. The motion sensor — tampered with. You burned two fakes in one move. One lie left. It\'s something tangible. Something in a room with a lock."',
    quality: 'specific',
  },
  // email_log(L:2) + floodlight(T:8) — 1 lie
  [pairKey('email_log', 'floodlight')]: {
    text: '"The floodlight is honest. The email log is not. Zero connections on a night when files moved — that\'s not data, that\'s a cover story. And the cover-up extends beyond the office."',
    quality: 'specific',
  },
  // email_log(L:2) + toolbox(L:4) — 2 lies
  [pairKey('email_log', 'toolbox')]: {
    text: '"Two lies in one pair. The email log — scrubbed. The toolbox — staged. You handed me your two weakest fakes together. One lie left. It\'s not indoors."',
    quality: 'specific',
  },
  // workbench(T:3) + partner(T:5) — 0 lies
  [pairKey('workbench', 'partner_testimony')]: {
    text: '"Sawdust and a sleepy partner. I\'ve heard worse alibis. You\'re playing it safe. That tells me you know where the danger is."',
    quality: 'vague',
  },
  // workbench(T:3) + neighbor(T:6) — 0 lies
  [pairKey('workbench', 'neighbor_testimony')]: {
    text: '"The garage is clean and the neighbor is honest. Solid opener. But you didn\'t show me anything from the office or the yard. Interesting."',
    quality: 'vague',
  },
  // workbench(T:3) + motion_yard(L:7) — 1 lie
  [pairKey('workbench', 'motion_yard')]: {
    text: '"The workbench is telling the truth. The backyard sensor is not — that thing was either tampered with or conveniently offline. And the yard isn\'t the only place where evidence was manufactured."',
    quality: 'specific',
  },
  // workbench(T:3) + floodlight(T:8) — 0 lies
  [pairKey('workbench', 'floodlight')]: {
    text: '"Sawdust and floodlights. Both check out. You\'re giving me the back half of the property and ignoring the front. What are you saving?"',
    quality: 'vague',
  },
  // toolbox(L:4) + partner(T:5) — 1 lie
  [pairKey('toolbox', 'partner_testimony')]: {
    text: '"Your partner is telling the truth. The toolbox is not — \'nothing missing, lock intact\' is a story someone planted. And the toolbox isn\'t the only thing in this house that\'s been staged."',
    quality: 'specific',
  },
  // toolbox(L:4) + neighbor(T:6) — 1 lie
  [pairKey('toolbox', 'neighbor_testimony')]: {
    text: '"The neighbor saw the light — he\'s credible. The toolbox? \'Nothing missing\' is what someone says when they\'ve already put everything back. The other lies aren\'t in the garage."',
    quality: 'specific',
  },
  // toolbox(L:4) + motion_yard(L:7) — 2 lies
  [pairKey('toolbox', 'motion_yard')]: {
    text: '"Both lies. The toolbox — restaged. The motion sensor — disabled. You just showed me your two sloppiest fakes. One lie remains. Something digital. A log that says nothing happened when we both know it did."',
    quality: 'specific',
  },
  // toolbox(L:4) + floodlight(T:8) — 1 lie
  [pairKey('toolbox', 'floodlight')]: {
    text: '"The floodlight is clean. The toolbox is not — someone relocked it and wiped it down. The other lies aren\'t in the garage. One\'s a data trail, one\'s in the yard."',
    quality: 'specific',
  },
  // partner(T:5) + motion_yard(L:7) — 1 lie
  [pairKey('partner_testimony', 'motion_yard')]: {
    text: '"Your partner is credible. The backyard sensor is not — someone was in that yard and the sensor conveniently missed it. Two lies remain. Both indoors. Both denying something specific."',
    quality: 'specific',
  },
  // partner(T:5) + floodlight(T:8) — 0 lies
  [pairKey('partner_testimony', 'floodlight')]: {
    text: '"A witness and a floodlight. Both honest. You\'re giving me the safe stuff first. That means you know which cards are dangerous — and you\'re stalling."',
    quality: 'vague',
  },
  // neighbor(T:6) + motion_yard(L:7) — 1 lie
  [pairKey('neighbor_testimony', 'motion_yard')]: {
    text: '"The neighbor is telling the truth. The motion sensor is not — the yard had a visitor, and the sensor looked the other way. Two lies left. Both inside. One you can touch, one you can trace."',
    quality: 'specific',
  },
  // neighbor(T:6) + floodlight(T:8) — 0 lies
  [pairKey('neighbor_testimony', 'floodlight')]: {
    text: '"Kitchen light and dark backyard. Both honest. You\'re circling the house without going inside. The office is still waiting."',
    quality: 'vague',
  },
};

// All 28 pair narrations — player's combined excuse + KOA's immediate reaction
const P1_PAIR_NARRATIONS: Record<string, PairNarration> = {
  // ── Same-type pairs ──

  // DIGITAL: browser(T:1) + email_log(L:2)
  [pairKey('browser_history', 'email_log')]: {
    playerStatement: 'I was browsing recipes on my laptop around quarter to eleven, then shut it and went to bed. You can check the network logs — there was zero outbound activity after eleven. The laptop was closed and I was done for the night.',
    koaResponse: 'Zero activity. That\'s a very clean cutoff. Almost too clean.',
  },
  // PHYSICAL: workbench(T:3) + toolbox(L:4)
  [pairKey('toolbox', 'workbench')]: {
    playerStatement: 'I haven\'t touched the garage in days. The sawdust on the workbench is exactly how I left it last weekend, and the toolbox lock is still intact — nothing missing, nothing moved. Nobody went in there.',
    koaResponse: 'You seem very sure about that lock. Most people don\'t check their toolbox at night.',
  },
  // TESTIMONY: partner(T:5) + neighbor(T:6) — corr(+3) + reinf(+3) FIRE
  [pairKey('neighbor_testimony', 'partner_testimony')]: {
    playerStatement: 'My partner literally saw me passed out on the couch around twelve-thirty. And yeah, the kitchen light was on at two — we leave it on as a nightlight. Ask the neighbor, ask my partner. Two people, same story.',
    koaResponse: 'Two witnesses, same part of the house, consistent timeline. That\'s a hard story to argue with.',
  },
  // SENSOR: motion_yard(L:7) + floodlight(T:8)
  [pairKey('floodlight', 'motion_yard')]: {
    playerStatement: 'The motion sensor in the backyard picked up nothing all night, and the floodlight never kicked on. If I\'d gone outside, one of those would have triggered. The backyard was dead quiet.',
    koaResponse: 'Both sensors silent. Convenient that everything in the yard agrees with you.',
  },

  // ── Cross-type: DIGITAL × PHYSICAL ──

  // browser(T:1) + workbench(T:3) — coverage(+2) fires
  [pairKey('browser_history', 'workbench')]: {
    playerStatement: 'I was on my laptop looking up recipes until about ten forty-five, and the garage workbench hasn\'t been touched — the sawdust is undisturbed. I was inside all evening, nowhere near the office printer.',
    koaResponse: 'Laptop in the office, sawdust in the garage. You\'re painting a picture of a quiet evening. Fine.',
  },
  // browser(T:1) + toolbox(L:4)
  [pairKey('browser_history', 'toolbox')]: {
    playerStatement: 'Look, I was just browsing cooking sites on my laptop before bed. And the garage toolbox? Lock\'s intact, nothing out of place. I wasn\'t rummaging around for anything — I was winding down.',
    koaResponse: 'Recipes and toolboxes. You\'re wandering between rooms to make your point.',
  },
  // email_log(L:2) + workbench(T:3)
  [pairKey('email_log', 'workbench')]: {
    playerStatement: 'The network shows zero outbound connections from my devices after eleven. And the garage workbench is untouched — sawdust sitting exactly where it was. Nothing digital, nothing physical. I wasn\'t doing anything.',
    koaResponse: 'Network logs and sawdust. An odd combination to volunteer.',
  },
  // email_log(L:2) + toolbox(L:4) — 2 lies
  [pairKey('email_log', 'toolbox')]: {
    playerStatement: 'There\'s no network activity after eleven — you can verify that. And the toolbox in the garage is locked, everything accounted for. I wasn\'t on any device and I wasn\'t using any tools. Full stop.',
    koaResponse: 'Full stop. People who say that usually have more to say.',
  },

  // ── Cross-type: DIGITAL × TESTIMONY ──

  // browser(T:1) + partner(T:5) — coverage(+2) + timeline(+2) fire
  [pairKey('browser_history', 'partner_testimony')]: {
    playerStatement: 'I closed my laptop around ten forty-five after looking at recipes, and by twelve-thirty my partner saw me asleep on the couch. That\'s less than two hours — I just fell asleep watching TV. Normal night.',
    koaResponse: 'Laptop closed, then asleep on the couch. The timing tracks. A normal night, as you say.',
  },
  // browser(T:1) + neighbor(T:6) — coverage(+2) fires
  [pairKey('browser_history', 'neighbor_testimony')]: {
    playerStatement: 'I was on my laptop until about ten forty-five, just browsing recipes. And the neighbor can tell you the kitchen light was on around two AM — we always leave it on. I was home, doing nothing suspicious.',
    koaResponse: 'Different rooms, different times. But at least someone else puts you in the house.',
  },
  // email_log(L:2) + partner(T:5)
  [pairKey('email_log', 'partner_testimony')]: {
    playerStatement: 'My partner saw me crashed on the couch at twelve-thirty, and the network log confirms zero connections after eleven. I was asleep. The devices were asleep. Everything was off.',
    koaResponse: 'Your partner confirms the couch. The network confirms silence. Rehearsed or real — I haven\'t decided.',
  },
  // email_log(L:2) + neighbor(T:6)
  [pairKey('email_log', 'neighbor_testimony')]: {
    playerStatement: 'No outbound connections after eleven, that\'s a fact. And the neighbor saw the kitchen light on at two — we leave it on every night. The house was quiet, the network was quiet, everything was quiet.',
    koaResponse: 'Everything was quiet. You keep saying that. Quiet houses don\'t usually print documents at three AM.',
  },

  // ── Cross-type: DIGITAL × SENSOR ──

  // browser(T:1) + motion_yard(L:7)
  [pairKey('browser_history', 'motion_yard')]: {
    playerStatement: 'I was looking at recipes on my laptop at ten forty-five, then headed to bed. And the backyard motion sensor? Nothing all night. I didn\'t go outside, I didn\'t go anywhere.',
    koaResponse: 'Laptop recipes and yard sensors. You\'re covering a lot of ground for someone who didn\'t go anywhere.',
  },
  // browser(T:1) + floodlight(T:8) — coverage(+2) fires
  [pairKey('browser_history', 'floodlight')]: {
    playerStatement: 'I shut my laptop around ten forty-five after browsing recipes, and the backyard floodlight never activated all night. I was inside the whole time — the yard was dark and I was in bed.',
    koaResponse: 'Inside on the laptop, outside stayed dark. Two different systems telling the same story.',
  },
  // email_log(L:2) + motion_yard(L:7) — 2 lies
  [pairKey('email_log', 'motion_yard')]: {
    playerStatement: 'Zero network connections after eleven and zero motion detected in the backyard all night. Two independent systems, both showing nothing. Because nothing happened.',
    koaResponse: 'Two independent systems showing nothing. Or two systems that someone knew how to work around.',
  },
  // email_log(L:2) + floodlight(T:8)
  [pairKey('email_log', 'floodlight')]: {
    playerStatement: 'The network went dead after eleven — no outbound traffic at all. And the floodlight in the backyard never turned on. Nothing was happening digitally or physically. I was asleep.',
    koaResponse: 'Dead network, dark yard. You\'re very precise about what didn\'t happen.',
  },

  // ── Cross-type: PHYSICAL × TESTIMONY ──

  // workbench(T:3) + partner(T:5) — coverage(+2) fires
  [pairKey('partner_testimony', 'workbench')]: {
    playerStatement: 'The garage workbench hasn\'t been touched — sawdust is exactly where I left it. And my partner saw me dead asleep on the couch at twelve-thirty. I wasn\'t in the garage, I wasn\'t at a printer. I was sleeping.',
    koaResponse: 'Undisturbed garage, sleeping on the couch. Two different spots, but the story holds together.',
  },
  // workbench(T:3) + neighbor(T:6) — coverage(+2) fires
  [pairKey('neighbor_testimony', 'workbench')]: {
    playerStatement: 'The workbench sawdust hasn\'t moved, so nobody was in the garage. And the neighbor saw the kitchen light on at two AM — that\'s just our nightlight. I was home, the garage was untouched, everything was normal.',
    koaResponse: 'Garage and kitchen. You\'re jumping between rooms. But at least the neighbor puts you at home.',
  },
  // toolbox(L:4) + partner(T:5)
  [pairKey('partner_testimony', 'toolbox')]: {
    playerStatement: 'My partner saw me asleep on the couch around twelve-thirty. And the garage toolbox is still locked, nothing missing. I wasn\'t up, I wasn\'t tinkering with anything. I was out cold.',
    koaResponse: 'Asleep on the couch but you know the exact state of your toolbox. Interesting.',
  },
  // toolbox(L:4) + neighbor(T:6)
  [pairKey('neighbor_testimony', 'toolbox')]: {
    playerStatement: 'The neighbor can confirm the kitchen light was on at two — that\'s normal for us. And the toolbox in the garage is locked tight, everything accounted for. Nobody was doing anything in this house at three AM.',
    koaResponse: 'Kitchen lights and garage locks. What does your toolbox have to do with a midnight print job?',
  },

  // ── Cross-type: PHYSICAL × SENSOR ──

  // workbench(T:3) + motion_yard(L:7)
  [pairKey('motion_yard', 'workbench')]: {
    playerStatement: 'The garage workbench is untouched — sawdust undisturbed. And the backyard motion sensor didn\'t pick up a thing all night. Nobody walked through the yard, nobody went to the garage. The house was still.',
    koaResponse: 'Garage and backyard, both perfectly still. You\'ve got an answer for every corner of the property.',
  },
  // workbench(T:3) + floodlight(T:8) — coverage(+2) fires
  [pairKey('floodlight', 'workbench')]: {
    playerStatement: 'The workbench sawdust is undisturbed and the backyard floodlight never came on. Nobody was moving around outside or in the garage. The whole back half of the house was completely inactive.',
    koaResponse: 'Garage untouched, yard dark. Physical evidence and sensors agreeing. That checks out.',
  },
  // toolbox(L:4) + motion_yard(L:7) — 2 lies
  [pairKey('motion_yard', 'toolbox')]: {
    playerStatement: 'The toolbox lock is intact, nothing was taken out. And the backyard motion sensor registered zero activity. If someone had gone from the garage to the yard or anywhere else, something would have triggered.',
    koaResponse: 'Locked toolbox, silent sensor. You\'re building a fortress of negatives. Nothing happened, nothing moved, nothing triggered.',
  },
  // toolbox(L:4) + floodlight(T:8)
  [pairKey('floodlight', 'toolbox')]: {
    playerStatement: 'The garage toolbox is locked and accounted for, and the backyard floodlight stayed off all night. No one was out there, no one was using tools. The whole back of the house was dark and quiet.',
    koaResponse: 'Tools and floodlights. You\'re reaching across the property to prove a point.',
  },

  // ── Cross-type: TESTIMONY × SENSOR ──

  // partner(T:5) + motion_yard(L:7)
  [pairKey('motion_yard', 'partner_testimony')]: {
    playerStatement: 'My partner saw me asleep on the couch at twelve-thirty, and the backyard motion sensor shows no activity all night. I was inside, nothing was moving outside. There\'s nothing here.',
    koaResponse: 'Partner says you were asleep. Sensor says the yard was empty. One of those I can verify independently.',
  },
  // partner(T:5) + floodlight(T:8) — coverage(+2) fires
  [pairKey('floodlight', 'partner_testimony')]: {
    playerStatement: 'My partner found me asleep on the couch around twelve-thirty, and the backyard floodlight never activated. I was inside sleeping and the yard was dark. I didn\'t go anywhere.',
    koaResponse: 'A witness and a sensor, both backing your story. That\'s harder to fake.',
  },
  // neighbor(T:6) + motion_yard(L:7)
  [pairKey('motion_yard', 'neighbor_testimony')]: {
    playerStatement: 'The neighbor saw the kitchen light on at two AM — that\'s just how we leave it. And the backyard motion sensor shows nothing all night. I was inside, the yard was empty. That\'s it.',
    koaResponse: 'Kitchen light on, yard sensor silent. But the neighbor only saw a light. They didn\'t see you.',
  },
  // neighbor(T:6) + floodlight(T:8) — coverage(+2) + timeline(+2) fire
  [pairKey('floodlight', 'neighbor_testimony')]: {
    playerStatement: 'The neighbor saw our kitchen light on at two AM, which is totally normal. And the backyard floodlight never came on — not at two, not at three, not ever. The yard was dark and I was inside.',
    koaResponse: 'Neighbor confirms the house, floodlight confirms the yard. Consistent across the board.',
  },
};

const PUZZLE_1: V4Puzzle = {
  name: 'The Midnight Print Job',
  slug: 'midnight-print-job',
  scenario: `It's 7 AM. The home office printer is warm. Sixteen pages of a confidential
merger document sit in the output tray — printed at 3:12 AM. The office door
was supposedly locked. You were "asleep since 11." The document wasn't
supposed to leave the company server. KOA has questions about your evening.`,
  target: 20,
  stance: 'NEUTRAL' as Stance,
  hint: generateHint(P1_CARDS),
  cards: P1_CARDS,
  pairNarrations: P1_PAIR_NARRATIONS,
  reactiveHints: P1_HINTS,
  verdictQuips: {
    browser_history: {
      truth: '"Pasta recipe at 10:45. You closed the laptop and went to bed like a normal person. I almost believe you."',
      lie: '"A recipe site. Cute. Except the browser cache shows three tabs behind that one — and they weren\'t lasagna."',
    },
    email_log: {
      truth: '"Zero outbound connections. The network really was dead. Even I can\'t argue with server logs."',
      lie: '"Zero connections after eleven? Then who sent 16 pages to the printer at 3 AM — the ghost of emails past?"',
    },
    workbench: {
      truth: '"Sawdust undisturbed. Not a fingerprint out of place. The garage is boring, and boring is honest."',
      lie: '"Sawdust undisturbed? There\'s a clean rectangle where something was lifted off the bench. You moved something. I can see the outline."',
    },
    toolbox: {
      truth: '"Lock intact, inventory matches. The toolbox is exactly as dull as you claimed."',
      lie: '"Lock intact? There are fresh scratches around the latch — and pry marks on the office door that match a flathead from YOUR kit. The toolbox lied."',
    },
    partner_testimony: {
      truth: '"Your partner saw you on the couch. That checks out. Witnesses are hard to fake when they live in the house."',
      lie: '"Your partner said you were asleep at 12:30? The hallway camera shows you walking past the kitchen at 12:28. Wide awake. Try again."',
    },
    neighbor_testimony: {
      truth: '"Kitchen light at 2 AM. The neighbor saw it from across the street. Milk run confirmed. Boring alibi. Valid alibi."',
      lie: '"Kitchen light at 2 AM for a \'snack\'? The neighbor also saw your silhouette carrying something toward the office. He just didn\'t know what it was. I do."',
    },
    motion_yard: {
      truth: '"Backyard sensor logged nothing. Not a footstep, not a raccoon. The yard really was empty."',
      lie: '"Inactive all night? Funny — the neighbor\'s Ring camera caught a figure crossing your backyard at 2:47 AM. The motion sensor didn\'t miss it. It was turned off."',
    },
    floodlight: {
      truth: '"Floodlight stayed dark. No activation events, no manual override. The yard was genuinely empty."',
      lie: '"No activation events? Someone unscrewed the bulb. There\'s a thumbprint on the housing and it isn\'t from the installer."',
    },
  },
  dialogue: {
    flawless: '"Sixteen pages printed at 3 AM. You walked in here with eight pieces of evidence and three lies — and you buried the lies so deep I almost missed them. Almost. But I have to admit... your alibi is airtight. Well played."',
    cleared: '"The printer ran. Someone was up. And your story has exactly enough truth in it to hold together — but I can see the seams. You pass. Don\'t make me look at this twice."',
    close: '"You were close. Your story almost worked. But \'almost\' leaves a warm printer and too many unanswered questions. I\'m not convinced — and I\'m not done."',
    busted: '"Three lies. You walked in here with three fabricated pieces of evidence and thought I wouldn\'t notice. The printer ran at 3 AM, your alibi is tissue paper, and I have the receipts. We\'re done here."',
  },
};

export const ALL_V4_PUZZLES: V4Puzzle[] = [PUZZLE_1];

export const V4_PUZZLES_BY_SLUG: Record<string, V4Puzzle> = {};
for (const p of ALL_V4_PUZZLES) {
  V4_PUZZLES_BY_SLUG[p.slug] = p;
}
