/**
 * KOA Casefiles - Smart Automated Solver
 *
 * Uses proper deduction strategy:
 * 1. Gather ALL available information (gossip, testimony, logs)
 * 2. Find contradictions to identify liars
 * 3. Correlate: liar + motive + opportunity = culprit
 * 4. Build accusation from evidence
 *
 * Manages AP budget: 4 days × 3 AP = 12 AP total
 */

import { simulate, generateValidatedCase } from './sim.js';
import { deriveEvidence } from './evidence.js';
import { PlayerSession } from './player.js';
import { performSearch, performInterview, checkLogs, compareEvidence } from './actions.js';
import type { EvidenceItem, MotiveEvidence, PhysicalEvidence, DeviceLogEvidence, TestimonyEvidence, SignalAnalysis, DifficultyTier, ContradictionLevel } from './types.js';
import { analyzeSignal } from './validators.js';

export interface SolveResult {
    seed: number;
    solved: boolean;
    correct: boolean;
    coreCorrect: boolean;  // WHO + WHAT + WHEN + WHERE (without HOW/WHY)
    apUsed: number;
    failReason?: string;
    trace: string[];
    details?: {
        crimePlace?: string;
        crimeWindow?: string;
        physicalFound: number;
        contradictions: string[];
        liars: string[];
        suspectsWithMotive: string[];
        accusation?: string;
        expected?: string;
    };
    // Signal analysis (solvability guarantee)
    signalAnalysis?: SignalAnalysis;
    // Tuning metrics
    metrics?: {
        culpritHasSelfContradiction: boolean;
        culpritHasCrimeSceneLie: boolean;
        culpritHasSignatureMotive: boolean;
        culpritContradictionCount: number;
        maxInnocentContradictions: number;  // False positive risk
        totalContradictions: number;
        difficultyTier: 'easy' | 'medium' | 'hard' | 'unsolvable';
        // HARD/SOFT semantic metrics (Task 006)
        culpritHardContradictions: number;
        maxInnocentHardContradictions: number;
        culpritIsMostCaught: boolean;
        totalSoftContradictions: number;
    };
}

interface CrimeInfo {
    place: string;
    window: string;
    crimeType: string;
}

interface Contradiction {
    evidence1: EvidenceItem;
    evidence2: EvidenceItem;
    rule: string;
    level: ContradictionLevel;
    suspect: string | null;
}

/**
 * Parse crime_awareness gossip to extract location and window
 */
function parseCrimeAwareness(evidence: EvidenceItem[]): CrimeInfo | null {
    const awareness = evidence.find(e =>
        e.kind === 'motive' && (e as MotiveEvidence).motiveHint === 'crime_awareness'
    ) as MotiveEvidence | undefined;

    if (!awareness) return null;

    const hint = awareness.hint;

    // Parse window from "(W1)" pattern
    const windowMatch = hint.match(/\(W(\d)\)/);
    const window = windowMatch ? `W${windowMatch[1]}` : null;

    // Parse place from "SEARCH: place" pattern
    const placeMatch = hint.match(/SEARCH:\s*(\w+)/);
    const place = placeMatch ? placeMatch[1] : null;

    // Parse crime type from keywords
    let crimeType = 'theft';
    if (hint.includes('messed with') || hint.includes('sabotage')) crimeType = 'sabotage';
    else if (hint.includes('moved') || hint.includes('prank')) crimeType = 'prank';
    else if (hint.includes('vanished') || hint.includes('disappear')) crimeType = 'disappearance';
    else if (hint.includes('missing')) crimeType = 'theft';

    if (!window || !place) return null;

    return { place, window, crimeType };
}

/**
 * Find ALL contradictions and extract the suspect involved
 */
function findAllContradictions(session: PlayerSession): Contradiction[] {
    const contradictions: Contradiction[] = [];
    const evidence = session.knownEvidence;

    for (let i = 0; i < evidence.length; i++) {
        for (let j = i + 1; j < evidence.length; j++) {
            const result = compareEvidence(session, evidence[i].id, evidence[j].id);
            if (result.success && 'contradiction' in result && result.contradiction) {
                // Extract suspect from contradiction
                let suspect: string | null = null;
                const e1 = evidence[i];
                const e2 = evidence[j];

                // Testimony contradictions - the witness is the liar
                if (e1.kind === 'testimony' && e2.kind === 'device_log') {
                    suspect = (e1 as TestimonyEvidence).witness;
                } else if (e2.kind === 'testimony' && e1.kind === 'device_log') {
                    suspect = (e2 as TestimonyEvidence).witness;
                } else if (e1.kind === 'testimony' && e2.kind === 'testimony') {
                    // Both testimonies - harder to know who's lying
                    // But if one is about self-location, that's likely the liar
                    const t1 = e1 as TestimonyEvidence;
                    const t2 = e2 as TestimonyEvidence;
                    if (t1.witness === t2.witness) {
                        suspect = t1.witness; // Same person contradicting themselves
                    }
                } else if (e1.kind === 'testimony') {
                    suspect = (e1 as TestimonyEvidence).witness;
                } else if (e2.kind === 'testimony') {
                    suspect = (e2 as TestimonyEvidence).witness;
                }

                // Capture HARD/SOFT level from compareEvidence (backward compat: default HARD)
                const level: ContradictionLevel = 'level' in result ? result.level : 'HARD_CONTRADICTION';

                contradictions.push({
                    evidence1: e1,
                    evidence2: e2,
                    rule: result.rule,
                    level,
                    suspect
                });
            }
        }
    }

    return contradictions;
}

/**
 * Get adjacent windows for a given window
 */
function getAdjacentWindows(window: string): string[] {
    const num = parseInt(window.replace('W', ''));
    const adjacent: string[] = [];
    if (num > 1) adjacent.push(`W${num - 1}`);
    if (num < 6) adjacent.push(`W${num + 1}`);
    return adjacent;
}

/**
 * Ensure we have AP, advancing day if needed
 */
function ensureAP(session: PlayerSession, needed: number, log: (msg: string) => void): boolean {
    while (session.actionPoints < needed) {
        if (!session.nextDay()) {
            log(`Out of time! (Day ${session.currentDay}, ${session.actionPoints} AP)`);
            return false;
        }
        log(`--- Day ${session.currentDay} ---`);
    }
    return true;
}

/**
 * Smart accusation builder using deduction
 */
function buildSmartAccusation(
    session: PlayerSession,
    crimeInfo: CrimeInfo,
    contradictions: Contradiction[],
    log: (msg: string) => void
): { who: string; what: string; how: string; when: string; where: string; why: string } | null {
    const evidence = session.knownEvidence;

    // Get all motives (excluding crime_awareness)
    const motives = evidence.filter(e =>
        e.kind === 'motive' &&
        (e as MotiveEvidence).motiveHint !== 'crime_awareness' &&
        (e as MotiveEvidence).suspect !== 'unknown'
    ) as MotiveEvidence[];

    // Collect ALL motives per suspect (not just one)
    const suspectMotives = new Map<string, MotiveEvidence[]>();
    for (const m of motives) {
        const existing = suspectMotives.get(m.suspect) || [];
        existing.push(m);
        suspectMotives.set(m.suspect, existing);
    }

    // For compatibility: pick the first motive for checking "has motive"
    const suspectsWithMotive = new Map<string, MotiveEvidence>();
    for (const [suspect, mList] of suspectMotives) {
        suspectsWithMotive.set(suspect, mList[0]);
    }

    // ── WHO: Rank by HARD contradictions (evidence-only deduction) ──
    // Count HARD and SOFT contradictions per suspect
    const hardCounts = new Map<string, number>();
    const softCounts = new Map<string, number>();

    for (const c of contradictions) {
        if (!c.suspect) continue;
        if (c.level === 'HARD_CONTRADICTION') {
            hardCounts.set(c.suspect, (hardCounts.get(c.suspect) || 0) + 1);
        } else if (c.level === 'SOFT_TENSION') {
            softCounts.set(c.suspect, (softCounts.get(c.suspect) || 0) + 1);
        }
    }

    // Log summary
    for (const [suspect, count] of hardCounts) {
        log(`  HARD: ${suspect} (${count}x)`);
    }
    for (const [suspect, count] of softCounts) {
        log(`  SOFT: ${suspect} (${count}x)`);
    }

    let who: string | null = null;

    // 1. Most HARD contradictions
    if (hardCounts.size > 0) {
        const sortedByHard = [...hardCounts.entries()].sort((a, b) => b[1] - a[1]);
        const maxHard = sortedByHard[0][1];
        const tiedAtMax = sortedByHard.filter(([_, count]) => count === maxHard);

        if (tiedAtMax.length === 1) {
            who = tiedAtMax[0][0];
            log(`  WHO: ${who} (most HARD contradictions: ${maxHard})`);
        } else {
            // Tiebreak: SOFT count, then motive, then alphabetical
            const ranked = tiedAtMax.map(([suspect]) => ({
                suspect,
                soft: softCounts.get(suspect) || 0,
                hasMotive: suspectsWithMotive.has(suspect),
            })).sort((a, b) => {
                if (b.soft !== a.soft) return b.soft - a.soft;
                if (a.hasMotive && !b.hasMotive) return -1;
                if (b.hasMotive && !a.hasMotive) return 1;
                return a.suspect.localeCompare(b.suspect);
            });
            who = ranked[0].suspect;
            log(`  WHO: ${who} (tied HARD: ${maxHard}, tiebreak by SOFT/motive)`);
        }
    }

    // 2. If no HARD, fall back to SOFT count
    if (!who && softCounts.size > 0) {
        const sortedBySoft = [...softCounts.entries()].sort((a, b) => b[1] - a[1]);
        const maxSoft = sortedBySoft[0][1];
        const tiedAtMax = sortedBySoft.filter(([_, count]) => count === maxSoft);
        const withMotive = tiedAtMax.filter(([suspect]) => suspectsWithMotive.has(suspect));

        if (withMotive.length > 0) {
            who = withMotive[0][0];
            log(`  WHO: ${who} (SOFT fallback: ${maxSoft} + motive)`);
        } else {
            who = tiedAtMax[0][0];
            log(`  WHO: ${who} (SOFT fallback: ${maxSoft})`);
        }
    }

    // 3. If no contradictions, fall back to motive + scene presence
    if (!who) {
        const doorLogs = evidence.filter(e =>
            e.kind === 'device_log' &&
            (e as DeviceLogEvidence).window === crimeInfo.window
        ) as DeviceLogEvidence[];

        for (const [suspect, _motive] of suspectsWithMotive) {
            const wasAtScene = doorLogs.some(dl =>
                dl.actor === suspect &&
                (dl.place === crimeInfo.place || dl.device.includes(crimeInfo.place))
            );
            if (wasAtScene) {
                who = suspect;
                log(`  WHO: ${who} (motive + at scene)`);
                break;
            }
        }
    }

    // 4. Any suspect with motive
    if (!who && suspectsWithMotive.size > 0) {
        who = Array.from(suspectsWithMotive.keys())[0];
        log(`  WHO: ${who} (has motive)`);
    }

    // 5. Last resort: first suspect
    if (!who) {
        who = session.config.suspects[0];
        log(`  WHO: ${who} (fallback)`);
    }

    // WHAT: From crime type
    const what = crimeInfo.crimeType;

    // HOW: From physical evidence methodTag
    const physical = evidence.filter(e => e.kind === 'physical') as PhysicalEvidence[];
    const methodTag = physical.find(p => p.methodTag)?.methodTag;

    const defaultMethods: Record<string, string> = {
        theft: 'grabbed',
        sabotage: 'broke',
        prank: 'relocated',
        disappearance: 'hid'
    };
    const how = methodTag || defaultMethods[what] || 'grabbed';

    // WHEN: From crime info
    const when = crimeInfo.window;

    // WHERE: From crime scene physical evidence
    const crimeScene = physical.find(p => p.detail.includes('[CRIME SCENE]'));
    const where = crimeScene?.place || crimeInfo.place;

    // WHY: From the suspect's motives - look for the ACTUAL motive signature phrases
    // The real motive uses specific templates from evidence.ts motiveHints
    const culpritMotives = suspectMotives.get(who) || [];
    let why: string | null = null;

    if (culpritMotives.length > 0) {
        // Signature phrases that indicate the ACTUAL crime motive (not general gossip)
        const motiveSignatures: Record<string, string[]> = {
            envy: ['green with envy'],
            embarrassment: ['mortified', 'cover it up'],
            cover_up: ['acting shady', 'hiding something'],
            rivalry: ['fierce competition'],
            attention: ['desperate for attention', 'nobody pays'],
            revenge: ['plotting payback'],
            chaos: ['chaotic mood', 'watching it all burn'],
        };

        // Look for signature phrases in the gossip.
        // Score each candidate: aligned phrase+motiveHint is better, and motiveHints
        // that are unlikely to come from generic relationships rank higher.
        // Relationship-derived motiveHints (rivalry, revenge, cover_up) are common for
        // innocents too, while attention, embarrassment, chaos, envy are more specific.
        const RELATIONSHIP_MOTIVES = new Set(['rivalry', 'revenge', 'cover_up']);
        let bestWhy: string | null = null;
        let bestScore = 0;
        let bestLen = 0;
        for (const m of culpritMotives) {
            const hint = m.hint.toLowerCase();
            for (const [motiveType, signatures] of Object.entries(motiveSignatures)) {
                if (signatures.some(sig => hint.includes(sig.toLowerCase()))) {
                    const aligned = m.motiveHint === motiveType;
                    // Score: aligned=2, non-relationship motive=1 (more likely real crime motive)
                    let score = aligned ? 2 : 0;
                    if (!RELATIONSHIP_MOTIVES.has(motiveType)) score += 1;
                    // Tiebreak: real motive gossip is longer (includes funnyReason, qualifiers)
                    if (score > bestScore || (score === bestScore && hint.length > bestLen)) {
                        bestScore = score;
                        bestLen = hint.length;
                        bestWhy = motiveType;
                        log(`  WHY candidate: ${motiveType} (score=${score}, len=${hint.length}, aligned=${aligned}, hint="${m.motiveHint}")`);
                    }
                    break;
                }
            }
        }
        if (bestWhy) {
            why = bestWhy;
            log(`  WHY: ${why} (signature phrase, score=${bestScore})`);
        }

        // Fallback: use most frequent if no signature found
        if (!why) {
            const motiveCounts = new Map<string, number>();
            for (const m of culpritMotives) {
                motiveCounts.set(m.motiveHint, (motiveCounts.get(m.motiveHint) || 0) + 1);
            }
            let maxCount = 0;
            for (const [motive, count] of motiveCounts) {
                if (count > maxCount) {
                    maxCount = count;
                    why = motive;
                }
            }
            log(`  WHY: ${why} (fallback - ${maxCount} mentions)`);
        }
    }

    // Final fallback
    if (!why) why = 'revenge';

    return { who, what, how, when, where, why };
}

/**
 * Smart solve using comprehensive investigation
 */
export function solve(seed: number, verbose: boolean = false, tier?: DifficultyTier): SolveResult {
    const trace: string[] = [];
    let apUsed = 0;

    const log = (msg: string) => {
        trace.push(msg);
        if (verbose) console.log(`  ${msg}`);
    };

    // Generate case using validated pipeline (includes signal injection)
    const gv = generateValidatedCase(seed, (tier ?? 2) as DifficultyTier);
    if (!gv) {
        return { seed, solved: false, correct: false, coreCorrect: false, apUsed: 0, failReason: 'sim_failed', trace };
    }
    const result = gv.sim;
    const evidence = gv.evidence;

    const session = new PlayerSession(result.world, result.config, evidence, result.eventLog);
    const suspects = session.config.suspects;

    // Compute signal analysis for tuning metrics (R5.1)
    const signalAnalysisResult = analyzeSignal(evidence, result.config);

    log(`--- Day 1 ---`);

    // ===== PHASE 1: GET CRIME INFO (1 AP) =====
    log('=== Phase 1: Get Crime Info ===');
    if (!ensureAP(session, 1, log)) {
        return { seed, solved: false, correct: false, coreCorrect: false, apUsed, failReason: 'out_of_time', trace, signalAnalysis: signalAnalysisResult };
    }
    log(`INTERVIEW ${suspects[0]} gossip`);
    performInterview(session, suspects[0], '', 'gossip');
    apUsed++;

    const crimeInfo = parseCrimeAwareness(session.knownEvidence);
    if (!crimeInfo) {
        return { seed, solved: false, correct: false, coreCorrect: false, apUsed, failReason: 'no_crime_awareness', trace, signalAnalysis: signalAnalysisResult };
    }
    log(`Crime: ${crimeInfo.crimeType} at ${crimeInfo.place} during ${crimeInfo.window}`);

    // ===== PHASE 2: SEARCH CRIME SCENE (1 AP) =====
    log('=== Phase 2: Crime Scene Search ===');
    if (!ensureAP(session, 1, log)) {
        return { seed, solved: false, correct: false, coreCorrect: false, apUsed, failReason: 'out_of_time', trace, signalAnalysis: signalAnalysisResult };
    }
    log(`SEARCH ${crimeInfo.place} ${crimeInfo.window}`);
    const searchResult = performSearch(session, crimeInfo.place, crimeInfo.window);
    apUsed++;

    const physicalFound = searchResult.evidence.filter(e => e.kind === 'physical').length;
    log(`Found ${physicalFound} physical evidence`);

    // ===== PHASE 3: DEVICE LOGS — MOTION FIRST (2 AP) =====
    // Motion sensors provide presence-semantic evidence needed for HARD contradictions.
    // Prioritize motion over door (door = movement semantic = SOFT only).
    log('=== Phase 3: Device Logs ===');
    for (const dtype of ['motion', 'door']) {
        if (!ensureAP(session, 1, log)) break;
        log(`LOGS ${dtype} ${crimeInfo.window}`);
        checkLogs(session, dtype, crimeInfo.window);
        apUsed++;
    }

    // ===== PHASE 4: TESTIMONY FROM ALL SUSPECTS (4 AP) =====
    log('=== Phase 4: Gathering Testimony ===');
    for (const suspect of suspects) {
        if (!ensureAP(session, 1, log)) break;
        log(`INTERVIEW ${suspect} ${crimeInfo.window} testimony`);
        performInterview(session, suspect, crimeInfo.window, 'testimony');
        apUsed++;
    }

    // ===== PHASE 5: GOSSIP FOR MOTIVES (2 AP) =====
    log('=== Phase 5: More Gossip ===');
    for (const suspect of suspects.slice(1, 3)) {  // 2 more gossip sources (skip first)
        if (!ensureAP(session, 1, log)) break;
        log(`INTERVIEW ${suspect} gossip`);
        performInterview(session, suspect, '', 'gossip');
        apUsed++;
    }

    // ===== PHASE 6: SECOND ROUND DEVICE LOGS (2 AP) =====
    // Get more motion + camera logs to increase HARD contradiction discovery.
    log('=== Phase 6: More Device Logs ===');
    for (const dtype of ['motion', 'camera']) {
        if (!ensureAP(session, 1, log)) break;
        log(`LOGS ${dtype} ${crimeInfo.window} (round 2)`);
        checkLogs(session, dtype, crimeInfo.window);
        apUsed++;
    }

    // ===== PHASE 6: FIND CONTRADICTIONS =====
    log('=== Phase 6: Finding Contradictions ===');
    const contradictions = findAllContradictions(session);
    log(`Found ${contradictions.length} contradiction(s)`);

    const liars = [...new Set(contradictions.map(c => c.suspect).filter(Boolean))] as string[];
    const suspectsWithMotive = session.knownEvidence
        .filter(e => e.kind === 'motive' && (e as MotiveEvidence).motiveHint !== 'crime_awareness')
        .map(e => (e as MotiveEvidence).suspect)
        .filter(s => s !== 'unknown');

    // ===== COLLECT METRICS FOR TUNING =====
    const culpritId = session.config.culpritId;

    // Count contradictions by type for each suspect
    const selfContradictionCounts = new Map<string, number>();
    const crimeSceneLieCounts = new Map<string, number>();
    for (const c of contradictions) {
        if (!c.suspect) continue;
        if (c.rule === 'witness_location_conflict' || c.rule === 'false_alibi') {
            selfContradictionCounts.set(c.suspect, (selfContradictionCounts.get(c.suspect) || 0) + 1);
        } else if (c.rule === 'device_vs_testimony') {
            const involvesScene =
                (c.evidence1.kind === 'device_log' && (c.evidence1 as DeviceLogEvidence).device.includes(crimeInfo.place)) ||
                (c.evidence2.kind === 'device_log' && (c.evidence2 as DeviceLogEvidence).device.includes(crimeInfo.place));
            if (involvesScene) {
                crimeSceneLieCounts.set(c.suspect, (crimeSceneLieCounts.get(c.suspect) || 0) + 1);
            }
        }
    }

    // Check if culprit has signature motive
    const motiveSignaturesForMetrics: Record<string, string[]> = {
        envy: ['green with envy'],
        embarrassment: ['mortified', 'cover it up'],
        cover_up: ['acting shady', 'hiding something'],
        rivalry: ['fierce competition'],
        attention: ['desperate for attention', 'nobody pays'],
        revenge: ['plotting payback'],
        chaos: ['chaotic mood', 'watching it all burn'],
    };

    let culpritHasSignatureMotive = false;
    const culpritMotives = session.knownEvidence.filter(e =>
        e.kind === 'motive' &&
        (e as MotiveEvidence).suspect === culpritId &&
        (e as MotiveEvidence).motiveHint !== 'crime_awareness'
    ) as MotiveEvidence[];

    for (const m of culpritMotives) {
        const hint = m.hint.toLowerCase();
        for (const sigs of Object.values(motiveSignaturesForMetrics)) {
            if (sigs.some(s => hint.includes(s.toLowerCase()))) {
                culpritHasSignatureMotive = true;
                break;
            }
        }
        if (culpritHasSignatureMotive) break;
    }

    // Compute metrics
    const culpritSelfContradictions = selfContradictionCounts.get(culpritId) || 0;
    const culpritCrimeSceneLies = crimeSceneLieCounts.get(culpritId) || 0;
    const culpritContradictionCount = culpritSelfContradictions + culpritCrimeSceneLies;

    // Max contradictions for any innocent suspect
    let maxInnocentContradictions = 0;
    for (const suspect of session.config.suspects) {
        if (suspect === culpritId) continue;
        const total = (selfContradictionCounts.get(suspect) || 0) + (crimeSceneLieCounts.get(suspect) || 0);
        if (total > maxInnocentContradictions) maxInnocentContradictions = total;
    }

    // Difficulty tier
    let difficultyTier: 'easy' | 'medium' | 'hard' | 'unsolvable';
    if (culpritSelfContradictions > 0) {
        difficultyTier = 'easy';  // Self-contradiction is obvious
    } else if (culpritCrimeSceneLies > 0) {
        difficultyTier = 'medium';  // Crime scene lie requires connecting dots
    } else if (culpritHasSignatureMotive) {
        difficultyTier = 'hard';  // Only motive signature to go on
    } else {
        difficultyTier = 'unsolvable';  // No clear signal
    }

    // HARD/SOFT semantic metrics (Task 006)
    const hardCountsMetrics = new Map<string, number>();
    for (const c of contradictions) {
        if (!c.suspect) continue;
        if (c.level === 'HARD_CONTRADICTION') {
            hardCountsMetrics.set(c.suspect, (hardCountsMetrics.get(c.suspect) || 0) + 1);
        }
    }
    const culpritHardContradictions = hardCountsMetrics.get(culpritId) || 0;
    let maxInnocentHardContradictions = 0;
    for (const suspect of session.config.suspects) {
        if (suspect === culpritId) continue;
        const hard = hardCountsMetrics.get(suspect) || 0;
        if (hard > maxInnocentHardContradictions) maxInnocentHardContradictions = hard;
    }
    const culpritIsMostCaught = culpritHardContradictions > maxInnocentHardContradictions;
    const totalSoftContradictions = contradictions.filter(c => c.level === 'SOFT_TENSION').length;

    const metrics = {
        culpritHasSelfContradiction: culpritSelfContradictions > 0,
        culpritHasCrimeSceneLie: culpritCrimeSceneLies > 0,
        culpritHasSignatureMotive,
        culpritContradictionCount,
        maxInnocentContradictions,
        totalContradictions: contradictions.length,
        difficultyTier,
        culpritHardContradictions,
        maxInnocentHardContradictions,
        culpritIsMostCaught,
        totalSoftContradictions,
    };

    // ===== PHASE 7: BUILD ACCUSATION =====
    log('=== Phase 7: Building Accusation ===');
    const accusation = buildSmartAccusation(session, crimeInfo, contradictions, log);

    if (!accusation) {
        return {
            seed, solved: false, correct: false, coreCorrect: false, apUsed,
            failReason: 'could_not_build_accusation',
            trace,
            signalAnalysis: signalAnalysisResult,
            details: {
                crimePlace: crimeInfo.place,
                crimeWindow: crimeInfo.window,
                physicalFound,
                contradictions: contradictions.map(c => c.rule),
                liars,
                suspectsWithMotive
            }
        };
    }

    const accuseStr = `${accusation.who} ${accusation.what} ${accusation.how} ${accusation.when} ${accusation.where} ${accusation.why}`;
    log(`ACCUSE ${accuseStr}`);

    // Check correctness
    const config = session.config;

    // Core facts (WHO, WHAT, WHEN, WHERE)
    const coreCorrect =
        accusation.who === config.culpritId &&
        accusation.what === config.crimeType &&
        accusation.when === config.crimeWindow &&
        accusation.where === config.crimePlace;

    // Full correctness (includes HOW and WHY)
    const correct =
        coreCorrect &&
        accusation.how === config.crimeMethod.methodId &&
        accusation.why === config.motive.type;

    const expected = `${config.culpritId} ${config.crimeType} ${config.crimeMethod.methodId} ${config.crimeWindow} ${config.crimePlace} ${config.motive.type}`;

    if (!correct) {
        const wrong: string[] = [];
        if (accusation.who !== config.culpritId) wrong.push(`who(${accusation.who}≠${config.culpritId})`);
        if (accusation.what !== config.crimeType) wrong.push(`what(${accusation.what}≠${config.crimeType})`);
        if (accusation.how !== config.crimeMethod.methodId) wrong.push(`how(${accusation.how}≠${config.crimeMethod.methodId})`);
        if (accusation.when !== config.crimeWindow) wrong.push(`when(${accusation.when}≠${config.crimeWindow})`);
        if (accusation.where !== config.crimePlace) wrong.push(`where(${accusation.where}≠${config.crimePlace})`);
        if (accusation.why !== config.motive.type) wrong.push(`why(${accusation.why}≠${config.motive.type})`);

        return {
            seed, solved: true, correct: false, coreCorrect, apUsed,
            failReason: `wrong: ${wrong.join(', ')}`,
            trace,
            details: {
                crimePlace: crimeInfo.place,
                crimeWindow: crimeInfo.window,
                physicalFound,
                contradictions: contradictions.map(c => c.rule),
                liars,
                suspectsWithMotive,
                accusation: accuseStr,
                expected
            },
            signalAnalysis: signalAnalysisResult,
            metrics,
        };
    }

    return {
        seed, solved: true, correct: true, coreCorrect: true, apUsed,
        trace,
        details: {
            crimePlace: crimeInfo.place,
            crimeWindow: crimeInfo.window,
            physicalFound,
            contradictions: contradictions.map(c => c.rule),
            liars,
            suspectsWithMotive,
            accusation: accuseStr,
            expected
        },
        signalAnalysis: signalAnalysisResult,
        metrics,
    };
}

/**
 * Run solver across multiple seeds and report results
 */
export function autosolve(count: number, startSeed: number = 1, verbose: boolean = false, tier?: DifficultyTier): void {
    const tierLabel = tier ? ` [Tier ${tier}]` : '';
    console.log(`\nSmart Autosolving ${count} cases${tierLabel} starting from seed ${startSeed}...\n`);

    const results: SolveResult[] = [];
    const failures: SolveResult[] = [];

    for (let i = 0; i < count; i++) {
        const seed = startSeed + i;
        if (verbose) console.log(`\n--- Seed ${seed} ---`);

        const result = solve(seed, verbose, tier);
        results.push(result);

        const status = result.correct ? '✅' : result.solved ? '⚠️' : '❌';
        const reason = result.failReason ? ` - ${result.failReason}` : '';
        console.log(`Seed ${seed}: ${status} ${result.correct ? 'SOLVED' : 'FAILED'}${reason} (${result.apUsed} AP)`);

        if (!result.correct) {
            failures.push(result);
        }
    }

    // Summary
    const solved = results.filter(r => r.correct).length;
    const coreSolved = results.filter(r => r.coreCorrect).length;
    const partial = results.filter(r => r.solved && !r.correct).length;
    const failed = results.filter(r => !r.solved).length;
    const avgAp = results.filter(r => r.correct).reduce((sum, r) => sum + r.apUsed, 0) / (solved || 1);

    console.log(`\n${'='.repeat(60)}`);
    console.log('SMART AUTOSOLVE RESULTS');
    console.log('='.repeat(60));
    console.log(`Total:    ${count}`);
    console.log(`✅ Perfect:    ${solved} (${(solved/count*100).toFixed(1)}%) - all 6 fields correct`);
    console.log(`🎯 Core:       ${coreSolved} (${(coreSolved/count*100).toFixed(1)}%) - WHO+WHAT+WHEN+WHERE correct`);
    console.log(`⚠️ Wrong:      ${partial} (${(partial/count*100).toFixed(1)}%)`);
    console.log(`❌ Failed:     ${failed} (${(failed/count*100).toFixed(1)}%)`);
    console.log(`Avg AP:   ${avgAp.toFixed(1)}`);

    // Analyze what went wrong
    if (failures.length > 0) {
        console.log(`\n${'='.repeat(60)}`);
        console.log('FAILURE ANALYSIS');
        console.log('='.repeat(60));

        // Group by what was wrong
        const wrongField = new Map<string, number>();
        for (const f of failures) {
            if (f.failReason?.startsWith('wrong:')) {
                const fields = f.failReason.replace('wrong: ', '').split(', ');
                for (const field of fields) {
                    const fieldName = field.split('(')[0];
                    wrongField.set(fieldName, (wrongField.get(fieldName) || 0) + 1);
                }
            } else {
                wrongField.set(f.failReason || 'unknown', (wrongField.get(f.failReason || 'unknown') || 0) + 1);
            }
        }

        console.log('\nWrong fields:');
        for (const [field, cnt] of [...wrongField.entries()].sort((a, b) => b[1] - a[1])) {
            console.log(`  ${field}: ${cnt}`);
        }

        // Check if liars were found
        const casesWithLiar = failures.filter(f => f.details?.liars && f.details.liars.length > 0);
        const casesWithoutLiar = failures.filter(f => !f.details?.liars || f.details.liars.length === 0);
        console.log(`\nLiar detection:`);
        console.log(`  Found liar: ${casesWithLiar.length}`);
        console.log(`  No liar found: ${casesWithoutLiar.length}`);
    }

    // ===== HARD/SOFT CONTRADICTION METRICS =====
    const withMetrics = results.filter(r => r.metrics);
    if (withMetrics.length > 0) {
        console.log(`\n${'='.repeat(60)}`);
        console.log('HARD/SOFT CONTRADICTION METRICS');
        console.log('='.repeat(60));

        const avgVal = (arr: number[]) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

        const hasAtLeast1Hard = withMetrics.filter(r => (r.metrics?.culpritHardContradictions ?? 0) >= 1).length;
        const culpritMostCaught = withMetrics.filter(r => r.metrics?.culpritIsMostCaught).length;

        console.log(`\nCulprit has >= 1 HARD:     ${hasAtLeast1Hard}/${withMetrics.length} (${(hasAtLeast1Hard/withMetrics.length*100).toFixed(0)}%)  target: 100%`);
        console.log(`Culprit most caught HARD:  ${culpritMostCaught}/${withMetrics.length} (${(culpritMostCaught/withMetrics.length*100).toFixed(0)}%)  target: >= 90%`);
        console.log(`Avg HARD culprit:          ${avgVal(withMetrics.map(r => r.metrics?.culpritHardContradictions ?? 0)).toFixed(1)}`);
        console.log(`Avg HARD max innocent:     ${avgVal(withMetrics.map(r => r.metrics?.maxInnocentHardContradictions ?? 0)).toFixed(1)}`);
        console.log(`Avg SOFT per case:         ${avgVal(withMetrics.map(r => r.metrics?.totalSoftContradictions ?? 0)).toFixed(1)}`);

        // HARD false positive risk
        const fpRiskHard = withMetrics.filter(r =>
            r.metrics && r.metrics.maxInnocentHardContradictions >= r.metrics.culpritHardContradictions
            && r.metrics.culpritHardContradictions > 0
        ).length;
        console.log(`HARD false positive risk:  ${fpRiskHard}/${withMetrics.length} (${(fpRiskHard/withMetrics.length*100).toFixed(0)}%)`);

        // Difficulty distribution
        const difficultyCount = { easy: 0, medium: 0, hard: 0, unsolvable: 0 };
        const difficultySolved = { easy: 0, medium: 0, hard: 0, unsolvable: 0 };
        for (const r of withMetrics) {
            if (r.metrics) {
                difficultyCount[r.metrics.difficultyTier]++;
                if (r.correct) difficultySolved[r.metrics.difficultyTier]++;
            }
        }

        console.log('\nDifficulty Distribution:');
        console.log('  Tier        | Cases | Solved | Rate');
        console.log('  ------------|-------|--------|------');
        for (const tier of ['easy', 'medium', 'hard', 'unsolvable'] as const) {
            const total = difficultyCount[tier];
            const solved = difficultySolved[tier];
            const rate = total > 0 ? (solved / total * 100).toFixed(0) : '-';
            console.log(`  ${tier.padEnd(11)} | ${String(total).padStart(5)} | ${String(solved).padStart(6)} | ${rate}%`);
        }
    }
}
