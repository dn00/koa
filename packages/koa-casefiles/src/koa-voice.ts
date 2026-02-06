/**
 * KOA Voice Module
 *
 * KOA = "Kind of an Asshole" - the smart home AI that runs this house.
 * Snarky, judgmental, overshares, but ultimately helpful.
 *
 * All game output should go through these formatters to maintain consistent voice.
 */

import type { EvidenceItem, TestimonyEvidence, MotiveEvidence, DeviceLogEvidence, PhysicalEvidence, DifficultyTier } from './types.js';
import { DIFFICULTY_PROFILES } from './types.js';
import type { CoverageMeter, WhereaboutsMap } from './player.js';

// ============================================================================
// KOA Commentary Pool
// ============================================================================

const KOA_SNARK = {
    // General observations
    noEvidence: [
        "Nothing here. Either you're looking in the wrong place, or someone cleaned up. My money's on the first one.",
        "Empty. Like my faith in humanity's ability to not touch the thermostat.",
        "Found nothing. Don't look at me like that. I just report what I see.",
    ],

    foundEvidence: [
        "Well, well, well. Look what we have here.",
        "Found something. You're welcome.",
        "Interesting. And by interesting, I mean suspicious.",
    ],

    // Coverage commentary
    coverageComplete: [
        "You've got evidence for this. Whether it's the RIGHT evidence is another question.",
        "Covered. Probably. I'm a home AI, not a detective.",
    ],

    coverageMissing: [
        "Big gap here. Just saying.",
        "You've got nothing on this. Might want to fix that before accusing anyone.",
        "Blank. Empty. Void. Like the space where this evidence should be.",
    ],

    // Contradiction reactions
    contradictionFound: [
        "Someone's lying. I know, shocking. Humans do that.",
        "Well, those can't both be true. Unless physics changed and nobody told me.",
        "Contradiction detected. I love it when they slip up.",
    ],

    noContradiction: [
        "These don't contradict each other. Try again.",
        "Consistent. Boring, but consistent.",
        "No conflict here. Maybe try comparing things that actually matter?",
    ],

    // Hint reactions
    hintGiven: [
        "Fine, I'll help. But this costs you points. And my respect. Mostly points.",
        "You asked for a hint. Here it is. Don't say I never did anything for you.",
        "Alright, one freebie. But I'm judging you.",
    ],

    // Time/day reactions
    newDay: [
        "New day. Fresh start. Same household drama.",
        "You slept. They probably plotted. Let's see what happened.",
        "Another day, another chance to figure out who did what to whom.",
    ],

    timeRunningOut: [
        "Clock's ticking. Just thought you should know.",
        "Running low on time. No pressure.",
        "Days left: not many. Evidence found: debatable.",
    ],

    // Interview reactions
    pullingChat: [
        "Accessing #household-general. The things I see in this chat...",
        "Pulling messages. People really do just... type things.",
        "Let me check what they said. Spoiler: probably something petty.",
    ],

    pullingDMs: [
        "Accessing private messages. I know I shouldn't. You asked.",
        "DMs incoming. This is technically a privacy violation but you asked nicely.",
        "Going into the DMs. The real drama is always here.",
    ],

    // Device log reactions
    pullingLogs: [
        "Sensor data coming up. I see everything, by the way.",
        "Accessing my records. Yes, I log everything. It's literally my job.",
        "Let me check the sensors. Unlike people, they don't lie.",
    ],
};

// Pick random item from array
function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================================================
// Formatters
// ============================================================================

/**
 * Format the intro banner
 */
export function formatIntroBanner(seed: number, resumed: boolean, tier?: DifficultyTier): string {
    const resumeNote = resumed ? ' [RESUMED]' : '';
    const tierLabel = tier ? ` [${DIFFICULTY_PROFILES[tier]?.name?.toUpperCase() ?? `TIER ${tier}`}]` : '';
    const caseInfo = `Case #${seed}${resumeNote}${tierLabel}`;
    return `
┌─────────────────────────────────────────────────────┐
│  🏠 KOA - Kind of an Asshole (Smart Home AI v2.4)  │
├─────────────────────────────────────────────────────┤
│  ${caseInfo.padEnd(49)}│
│                                                     │
│  I run this house. I see everything.                │
│  Someone did something. Let's find out who.         │
│                                                     │
│  Type HELP if you need me to explain things.        │
└─────────────────────────────────────────────────────┘
`;
}

/**
 * Format device logs output
 */
export function formatLogs(
    device: string,
    window: string,
    evidence: DeviceLogEvidence[],
    moreAvailable: number
): string {
    const header = `┌─────────────────────────────────────────────────────┐
│ 📟 ${device.toUpperCase()} SENSOR LOG - ${window.padEnd(28)}│
├─────────────────────────────────────────────────────┤`;

    if (evidence.length === 0) {
        return `${header}
│ No activity recorded.                               │
├─────────────────────────────────────────────────────┤
│ KOA: Either nothing happened, or someone disabled   │
│      the sensors. I'm not saying it's suspicious.   │
│      But I'm not NOT saying it either.              │
└─────────────────────────────────────────────────────┘`;
    }

    const entries = evidence.map(e =>
        `│  • ${e.detail.padEnd(35)} ${e.place.padEnd(10)}│`
    ).join('\n');

    const moreNote = moreAvailable > 0
        ? `\n│ (${moreAvailable} more entries available)${' '.repeat(30 - moreAvailable.toString().length)}│`
        : '';

    const commentary = pick(KOA_SNARK.pullingLogs);

    return `${header}
${entries}${moreNote}
├─────────────────────────────────────────────────────┤
│ KOA: ${commentary.substring(0, 47).padEnd(47)}│
└─────────────────────────────────────────────────────┘`;
}

/**
 * Format testimony from group chat
 */
export function formatTestimony(
    npc: string,
    window: string,
    evidence: TestimonyEvidence[]
): string {
    const header = `┌─────────────────────────────────────────────────────┐
│ 💬 #household-general during ${window.padEnd(22)}│
├─────────────────────────────────────────────────────┤`;

    if (evidence.length === 0) {
        return `${header}
│ No messages from ${npc} during this window.${' '.repeat(10 - npc.length)}│
├─────────────────────────────────────────────────────┤
│ KOA: They were quiet. Suspicious? Maybe. Or maybe   │
│      they just have nothing interesting to say.     │
│      Both are equally likely with this crowd.       │
└─────────────────────────────────────────────────────┘`;
    }

    const messages = evidence.map(e => {
        const confidence = e.confidence < 0.5 ? ' (uncertain)' : '';
        return `│ ${npc}: "${e.observable}"${confidence}`;
    }).join('\n');

    // Add location info
    const place = evidence[0]?.place || 'unknown';
    const commentary = pick(KOA_SNARK.pullingChat);

    return `${header}
${messages}
├─────────────────────────────────────────────────────┤
│ KOA: ${npc} was in the ${place} during ${window}.${' '.repeat(Math.max(0, 20 - npc.length - place.length))}│
│      ${commentary.substring(0, 47).padEnd(47)}│
└─────────────────────────────────────────────────────┘`;
}

/**
 * Format gossip from DMs
 */
export function formatGossip(
    npc: string,
    evidence: MotiveEvidence[]
): string {
    const header = `┌─────────────────────────────────────────────────────┐
│ 🔒 PRIVATE MESSAGES (${npc})${' '.repeat(30 - npc.length)}│
│    Look, you asked. I delivered.                    │
├─────────────────────────────────────────────────────┤`;

    if (evidence.length === 0) {
        return `${header}
│ No juicy DMs found.                                 │
├─────────────────────────────────────────────────────┤
│ KOA: ${npc} either doesn't gossip or uses a different│
│      app. Either way, I've got nothing.             │
└─────────────────────────────────────────────────────┘`;
    }

    const gossipLines = evidence.map(e => {
        return `│ "${e.hint}"`;
    }).join('\n│\n');

    const commentary = pick(KOA_SNARK.pullingDMs);

    return `${header}
${gossipLines}
├─────────────────────────────────────────────────────┤
│ KOA: ${commentary.substring(0, 47).padEnd(47)}│
└─────────────────────────────────────────────────────┘`;
}

/**
 * Format search results
 */
export function formatSearch(
    place: string,
    window: string,
    evidence: PhysicalEvidence[],
    gatedHint: boolean
): string {
    const header = `┌─────────────────────────────────────────────────────┐
│ 🔍 SEARCHING: ${place.toUpperCase()} during ${window}${' '.repeat(22 - place.length)}│
├─────────────────────────────────────────────────────┤`;

    if (evidence.length === 0 && !gatedHint) {
        const commentary = pick(KOA_SNARK.noEvidence);
        return `${header}
│ Nothing notable found.                              │
├─────────────────────────────────────────────────────┤
│ KOA: ${commentary.substring(0, 47).padEnd(47)}│
└─────────────────────────────────────────────────────┘`;
    }

    if (evidence.length === 0 && gatedHint) {
        return `${header}
│ Something feels off here, but you need more clues   │
│ to know where to look.                              │
├─────────────────────────────────────────────────────┤
│ KOA: My sensors are picking up... something. But    │
│      I can't pinpoint it without more context.      │
│      Come back when you know what you're looking for│
└─────────────────────────────────────────────────────┘`;
    }

    const findings = evidence.map(e =>
        `│ FOUND: ${e.detail}`
    ).join('\n');

    const commentary = pick(KOA_SNARK.foundEvidence);

    return `${header}
${findings}
├─────────────────────────────────────────────────────┤
│ KOA: ${commentary.substring(0, 47).padEnd(47)}│
└─────────────────────────────────────────────────────┘`;
}

/**
 * Format coverage/status display
 */
export function formatCoverage(coverage: CoverageMeter, totalEvidence: number): string {
    const formatBar = (count: number): string => {
        const filled = Math.min(count, 8);
        return '█'.repeat(filled) + '░'.repeat(8 - filled);
    };

    const formatLine = (name: string, dim: { count: number; hints: string[] }): string => {
        const bar = formatBar(dim.count);
        const status = dim.count > 0 ? dim.hints.slice(0, 2).join(', ') : 'no evidence';
        return `│ ${name.toUpperCase().padEnd(5)} ${bar} ${status.substring(0, 30).padEnd(30)}│`;
    };

    // Calculate what's missing for commentary
    const missing: string[] = [];
    if (coverage.who.count === 0) missing.push('WHO');
    if (coverage.what.count === 0) missing.push('WHAT');
    if (coverage.how.count === 0) missing.push('HOW');
    if (coverage.when.count === 0) missing.push('WHEN');
    if (coverage.where.count === 0) missing.push('WHERE');
    if (coverage.why.count === 0) missing.push('WHY');

    let commentary: string;
    if (missing.length === 0) {
        commentary = "You've got evidence for everything. Whether it's RIGHT is another question.";
    } else if (missing.length <= 2) {
        commentary = `Still missing ${missing.join(' and ')}. Might want to fix that.`;
    } else {
        commentary = `Missing ${missing.length} categories. That's most of them. Keep digging.`;
    }

    return `┌─────────────────────────────────────────────────────┐
│ 📊 KOA STATUS REPORT                                │
├─────────────────────────────────────────────────────┤
${formatLine('who', coverage.who)}
${formatLine('what', coverage.what)}
${formatLine('how', coverage.how)}
${formatLine('when', coverage.when)}
${formatLine('where', coverage.where)}
${formatLine('why', coverage.why)}
├─────────────────────────────────────────────────────┤
│ Total evidence collected: ${totalEvidence.toString().padEnd(26)}│
├─────────────────────────────────────────────────────┤
│ KOA: ${commentary.substring(0, 47).padEnd(47)}│
└─────────────────────────────────────────────────────┘`;
}

/**
 * Format COMPARE result
 */
export function formatCompare(
    id1: string,
    id2: string,
    isContradiction: boolean,
    explanation: string
): string {
    if (isContradiction) {
        const commentary = pick(KOA_SNARK.contradictionFound);
        return `┌─────────────────────────────────────────────────────┐
│ ⚡ CONTRADICTION DETECTED                           │
├─────────────────────────────────────────────────────┤
│ ${id1.padEnd(51)}│
│   vs                                                │
│ ${id2.padEnd(51)}│
├─────────────────────────────────────────────────────┤
│ ${explanation.substring(0, 51).padEnd(51)}│
├─────────────────────────────────────────────────────┤
│ KOA: ${commentary.substring(0, 47).padEnd(47)}│
└─────────────────────────────────────────────────────┘`;
    } else {
        const commentary = pick(KOA_SNARK.noContradiction);
        return `┌─────────────────────────────────────────────────────┐
│ ✓ NO CONTRADICTION                                  │
├─────────────────────────────────────────────────────┤
│ ${id1.padEnd(51)}│
│   and                                               │
│ ${id2.padEnd(51)}│
│                                                     │
│ These don't conflict with each other.               │
├─────────────────────────────────────────────────────┤
│ KOA: ${commentary.substring(0, 47).padEnd(47)}│
└─────────────────────────────────────────────────────┘`;
    }
}

/**
 * Format HINT output
 */
export function formatHint(
    coverage: CoverageMeter,
    hintsRemaining: number,
    suggestion: string
): string {
    const commentary = pick(KOA_SNARK.hintGiven);

    // Find what's missing
    const missing: string[] = [];
    if (coverage.who.count === 0) missing.push('WHO (no suspects identified)');
    if (coverage.what.count === 0) missing.push('WHAT (no crime type evidence)');
    if (coverage.how.count === 0) missing.push('HOW (no method evidence)');
    if (coverage.when.count === 0) missing.push('WHEN (no time window evidence)');
    if (coverage.where.count === 0) missing.push('WHERE (no location evidence)');
    if (coverage.why.count === 0) missing.push('WHY (no motive evidence)');

    const missingList = missing.length > 0
        ? missing.map(m => `│   • ${m}`).join('\n')
        : '│   Everything covered! Now figure out which clues matter.';

    return `┌─────────────────────────────────────────────────────┐
│ 💡 KOA HINT (${hintsRemaining} remaining)${' '.repeat(33 - hintsRemaining.toString().length)}│
├─────────────────────────────────────────────────────┤
│ You're missing evidence for:                        │
${missingList}
├─────────────────────────────────────────────────────┤
│ Suggestion: ${suggestion.substring(0, 40).padEnd(40)}│
├─────────────────────────────────────────────────────┤
│ KOA: ${commentary.substring(0, 47).padEnd(47)}│
│      This cost you points, by the way.              │
└─────────────────────────────────────────────────────┘`;
}

/**
 * Format HELP output
 */
export function formatHelp(suspects: string[]): string {
    return `┌─────────────────────────────────────────────────────┐
│ 📖 KOA COMMAND REFERENCE                            │
│    I'm KOA. I run this house. I see everything.     │
├─────────────────────────────────────────────────────┤
│ INVESTIGATION (costs 1 AP each, FREE if on lead):   │
│   SEARCH <place> <window>    - Check a location     │
│   INTERVIEW <npc> <window> testimony                │
│                              - Pull their messages  │
│   INTERVIEW <npc> gossip     - Pull their DMs       │
│   LOGS <device> <window>     - My sensor data       │
│                                                     │
│ ANALYSIS (free):                                    │
│   COMPARE <id1> <id2>        - Find contradictions  │
│   SUGGEST                    - I'll hint a compare  │
│   EVIDENCE                   - List what you found  │
│   STATUS                     - Coverage report      │
│   LEADS                      - Show active leads    │
│   WHEREABOUTS                - NPC location grid    │
│                                                     │
│ GAME:                                               │
│   NEXT_DAY                   - Sleep, restore AP    │
│   ACCUSE <who> <what> <how> <when> <where> <why>    │
├─────────────────────────────────────────────────────┤
│ SUSPECTS: ${suspects.join(', ').padEnd(42)}│
├─────────────────────────────────────────────────────┤
│ WINDOWS (time periods):                             │
│   W1  4:00–5:30pm   (late afternoon)                │
│   W2  5:30–7:00pm   (early evening)                 │
│   W3  7:00–8:30pm   (evening)                       │
│   W4  8:30–10:00pm  (late evening)                  │
│   W5  10:00–11:30pm (late night)                    │
│   W6  11:30pm–1:00am (after midnight)               │
├─────────────────────────────────────────────────────┤
│ PLACES:   kitchen, living, bedroom, office, garage  │
│ DEVICES:  door, motion                              │
└─────────────────────────────────────────────────────┘`;
}

/**
 * Format WHEREABOUTS display
 */
export function formatWhereabouts(whereabouts: WhereaboutsMap, suspects: string[]): string {
    const windows = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];

    // Build header row
    const header = `│       │${windows.map(w => w.padStart(8)).join('│')}│`;
    const divider = `├───────┼${windows.map(() => '────────').join('┼')}┤`;

    // Build rows for each suspect
    const rows = suspects.map(npc => {
        const cells = windows.map(w => {
            const entry = whereabouts[npc]?.[w];
            if (!entry || !entry.place) {
                return '   ?   ';
            }
            const place = entry.place.substring(0, 6);
            const marker = entry.confidence === 'claimed' ? '*' : ' ';
            return `${place.padStart(6)}${marker}`;
        });
        return `│ ${npc.substring(0, 5).padEnd(5)} │${cells.join('│')}│`;
    });

    // Count unknowns for commentary
    let unknownCount = 0;
    let claimedCount = 0;
    for (const npc of suspects) {
        for (const w of windows) {
            const entry = whereabouts[npc]?.[w];
            if (!entry || !entry.place) unknownCount++;
            else if (entry.confidence === 'claimed') claimedCount++;
        }
    }

    let commentary: string;
    if (unknownCount === 0) {
        commentary = "I know where everyone was. Whether they're LYING is your problem.";
    } else if (unknownCount < 10) {
        commentary = `Still ${unknownCount} gaps. Interview more people.`;
    } else {
        commentary = "Lots of unknowns. You've barely started.";
    }

    if (claimedCount > 0) {
        commentary += ` (${claimedCount} claimed only*)`;
    }

    return `┌─────────────────────────────────────────────────────────────────┐
│ 📍 WHEREABOUTS TRACKER                                          │
│    * = claimed only (not confirmed by sensors)                  │
├───────┬${windows.map(() => '────────').join('┬')}┤
${header}
${divider}
${rows.join('\n')}
├───────┴${windows.map(() => '────────').join('┴')}┤
│ KOA: ${commentary.substring(0, 60).padEnd(60)}│
└─────────────────────────────────────────────────────────────────┘`;
}

/**
 * Format status line (day/AP)
 */
export function formatStatusLine(day: number, maxDays: number, ap: number, maxAp: number): string {
    const daysLeft = maxDays - day;
    let urgency = '';
    if (daysLeft <= 1) {
        urgency = ' ⚠️ FINAL DAY';
    } else if (daysLeft <= 2) {
        urgency = ' ⏰ Time running out';
    }

    return `📅 Day ${day}/${maxDays} | ⚡ AP: ${ap}/${maxAp}${urgency}`;
}
