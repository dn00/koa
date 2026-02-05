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

import { simulate } from './sim.js';
import { deriveEvidence } from './evidence.js';
import { PlayerSession } from './player.js';
import { performSearch, performInterview, checkLogs, compareEvidence } from './actions.js';
import type { EvidenceItem, MotiveEvidence, PhysicalEvidence, DeviceLogEvidence, TestimonyEvidence } from './types.js';

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
    // Tuning metrics
    metrics?: {
        culpritHasSelfContradiction: boolean;
        culpritHasCrimeSceneLie: boolean;
        culpritHasSignatureMotive: boolean;
        culpritContradictionCount: number;
        maxInnocentContradictions: number;  // False positive risk
        totalContradictions: number;
        difficultyTier: 'easy' | 'medium' | 'hard' | 'unsolvable';
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

                contradictions.push({
                    evidence1: e1,
                    evidence2: e2,
                    rule: result.rule,
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

    // Get liars from contradictions, prioritizing:
    // 1. Self-contradiction (witness_location_conflict) = highest
    // 2. Contradiction involving CRIME SCENE = very high (they lied about being at the scene!)
    // 3. Other device contradictions = medium
    // Also COUNT contradictions - more lies = more suspicious
    const selfContradictorCounts = new Map<string, number>();
    const crimeSceneContradictorCounts = new Map<string, number>();
    const deviceContradictorCounts = new Map<string, number>();

    for (const c of contradictions) {
        if (c.suspect) {
            if (c.rule === 'witness_location_conflict' || c.rule === 'false_alibi') {
                selfContradictorCounts.set(c.suspect, (selfContradictorCounts.get(c.suspect) || 0) + 1);
            } else if (c.rule === 'device_vs_testimony') {
                // Check if this contradiction involves the crime scene
                const involvesScene =
                    (c.evidence1.kind === 'device_log' && (c.evidence1 as DeviceLogEvidence).device.includes(crimeInfo.place)) ||
                    (c.evidence2.kind === 'device_log' && (c.evidence2 as DeviceLogEvidence).device.includes(crimeInfo.place)) ||
                    (c.evidence1.kind === 'testimony' && (c.evidence1 as TestimonyEvidence).place === crimeInfo.place) ||
                    (c.evidence2.kind === 'testimony' && (c.evidence2 as TestimonyEvidence).place === crimeInfo.place);

                if (involvesScene) {
                    crimeSceneContradictorCounts.set(c.suspect, (crimeSceneContradictorCounts.get(c.suspect) || 0) + 1);
                } else {
                    deviceContradictorCounts.set(c.suspect, (deviceContradictorCounts.get(c.suspect) || 0) + 1);
                }
            }
        }
    }

    // Log summary
    for (const [suspect, count] of selfContradictorCounts) {
        log(`  SELF-CONTRADICTION: ${suspect} (${count}x)`);
    }
    for (const [suspect, count] of crimeSceneContradictorCounts) {
        log(`  CRIME SCENE LIE: ${suspect} (${count}x)`);
    }

    // WHO: Prioritize by signal strength, picking the MOST suspicious within each tier
    let who: string | null = null;

    // Check which suspects have a SIGNATURE motive (the actual crime motive template)
    const motiveSignatures: Record<string, string[]> = {
        envy: ['green with envy'],
        embarrassment: ['mortified', 'cover it up'],
        cover_up: ['acting shady', 'hiding something'],
        rivalry: ['fierce competition'],
        attention: ['desperate for attention', 'nobody pays'],
        revenge: ['plotting payback'],
        chaos: ['chaotic mood', 'watching it all burn'],
    };

    const suspectsWithSignatureMotive = new Set<string>();
    for (const [suspect, motiveList] of suspectMotives) {
        for (const m of motiveList) {
            const hint = m.hint.toLowerCase();
            for (const signatures of Object.values(motiveSignatures)) {
                if (signatures.some(sig => hint.includes(sig.toLowerCase()))) {
                    suspectsWithSignatureMotive.add(suspect);
                    break;
                }
            }
        }
    }

    // Helper: find suspect with highest count who also has motive
    // Priority: signature motive > scene lie > count
    const findMostSuspiciousWithMotive = (counts: Map<string, number>): string | null => {
        let best: string | null = null;
        let bestCount = 0;
        let bestHasSignature = false;
        let bestHasSceneLie = false;
        for (const [suspect, count] of counts) {
            if (!suspectsWithMotive.has(suspect)) continue;
            const hasSignature = suspectsWithSignatureMotive.has(suspect);
            const hasSceneLie = crimeSceneContradictorCounts.has(suspect);

            // Scoring: signature motive is strongest, then scene lie, then count
            const isBetter =
                (hasSignature && !bestHasSignature) ||  // Has signature when best doesn't
                (hasSignature === bestHasSignature && hasSceneLie && !bestHasSceneLie) ||  // Same sig, has scene lie
                (hasSignature === bestHasSignature && hasSceneLie === bestHasSceneLie && count > bestCount);  // Same sig+scene, higher count

            if (isBetter) {
                best = suspect;
                bestCount = count;
                bestHasSignature = hasSignature;
                bestHasSceneLie = hasSceneLie;
            }
        }
        return best;
    };

    // Helper: find suspect with highest count
    // On ties, prefer suspects who ALSO have crime scene lies
    const findMostSuspicious = (counts: Map<string, number>): string | null => {
        let best: string | null = null;
        let bestCount = 0;
        let bestHasSceneLie = false;
        for (const [suspect, count] of counts) {
            const hasSceneLie = crimeSceneContradictorCounts.has(suspect);
            if (count > bestCount || (count === bestCount && hasSceneLie && !bestHasSceneLie)) {
                best = suspect;
                bestCount = count;
                bestHasSceneLie = hasSceneLie;
            }
        }
        return best;
    };

    // 1. Self-contradictor with motive - pick the one with MOST contradictions
    who = findMostSuspiciousWithMotive(selfContradictorCounts);
    if (who) {
        log(`  WHO: ${who} (self-contradiction + motive, ${selfContradictorCounts.get(who)}x)`);
    }

    // 2. Any self-contradictor - pick the one with MOST contradictions
    if (!who && selfContradictorCounts.size > 0) {
        who = findMostSuspicious(selfContradictorCounts);
        if (who) log(`  WHO: ${who} (self-contradiction, ${selfContradictorCounts.get(who)}x)`);
    }

    // 3. Crime scene liar with motive
    if (!who) {
        who = findMostSuspiciousWithMotive(crimeSceneContradictorCounts);
        if (who) log(`  WHO: ${who} (crime scene lie + motive, ${crimeSceneContradictorCounts.get(who)}x)`);
    }

    // 4. Any crime scene liar
    if (!who && crimeSceneContradictorCounts.size > 0) {
        who = findMostSuspicious(crimeSceneContradictorCounts);
        if (who) log(`  WHO: ${who} (crime scene lie, ${crimeSceneContradictorCounts.get(who)}x)`);
    }

    // 5. Device contradictor with motive
    if (!who) {
        who = findMostSuspiciousWithMotive(deviceContradictorCounts);
        if (who) log(`  WHO: ${who} (device contradiction + motive, ${deviceContradictorCounts.get(who)}x)`);
    }

    // 6. Any device contradictor
    if (!who && deviceContradictorCounts.size > 0) {
        who = findMostSuspicious(deviceContradictorCounts);
        if (who) log(`  WHO: ${who} (device contradiction, ${deviceContradictorCounts.get(who)}x)`);
    }


    // Third: suspect with motive who was at crime scene
    if (!who) {
        const physical = evidence.filter(e => e.kind === 'physical') as PhysicalEvidence[];

        // Check door logs for who was at the crime location
        const doorLogs = evidence.filter(e =>
            e.kind === 'device_log' &&
            (e as DeviceLogEvidence).window === crimeInfo.window
        ) as DeviceLogEvidence[];

        for (const [suspect, _motive] of suspectsWithMotive) {
            // Check if this suspect was at the crime scene via door logs
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

    // Fourth: any suspect with motive
    if (!who && suspectsWithMotive.size > 0) {
        who = Array.from(suspectsWithMotive.keys())[0];
        log(`  WHO: ${who} (has motive)`);
    }

    // Last resort: first suspect
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

        // Look for signature phrases in the gossip
        outer: for (const m of culpritMotives) {
            const hint = m.hint.toLowerCase();
            for (const [motiveType, signatures] of Object.entries(motiveSignatures)) {
                if (signatures.some(sig => hint.includes(sig.toLowerCase()))) {
                    why = motiveType;
                    log(`  WHY: ${why} (signature phrase found: "${signatures.find(s => hint.includes(s.toLowerCase()))}")`);
                    break outer;
                }
            }
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
export function solve(seed: number, verbose: boolean = false): SolveResult {
    const trace: string[] = [];
    let apUsed = 0;

    const log = (msg: string) => {
        trace.push(msg);
        if (verbose) console.log(`  ${msg}`);
    };

    // Generate case
    const result = simulate(seed, 2, {});
    if (!result) {
        return { seed, solved: false, correct: false, coreCorrect: false, apUsed: 0, failReason: 'sim_failed', trace };
    }

    const evidence = deriveEvidence(result.world, result.eventLog, result.config);
    const session = new PlayerSession(result.world, result.config, evidence, result.eventLog);
    const suspects = session.config.suspects;

    log(`--- Day 1 ---`);

    // ===== PHASE 1: GET CRIME INFO (1 AP) =====
    log('=== Phase 1: Get Crime Info ===');
    if (!ensureAP(session, 1, log)) {
        return { seed, solved: false, correct: false, coreCorrect: false, apUsed, failReason: 'out_of_time', trace };
    }
    log(`INTERVIEW ${suspects[0]} gossip`);
    performInterview(session, suspects[0], '', 'gossip');
    apUsed++;

    const crimeInfo = parseCrimeAwareness(session.knownEvidence);
    if (!crimeInfo) {
        return { seed, solved: false, correct: false, coreCorrect: false, apUsed, failReason: 'no_crime_awareness', trace };
    }
    log(`Crime: ${crimeInfo.crimeType} at ${crimeInfo.place} during ${crimeInfo.window}`);

    // ===== PHASE 2: SEARCH CRIME SCENE (1 AP) =====
    log('=== Phase 2: Crime Scene Search ===');
    if (!ensureAP(session, 1, log)) {
        return { seed, solved: false, correct: false, coreCorrect: false, apUsed, failReason: 'out_of_time', trace };
    }
    log(`SEARCH ${crimeInfo.place} ${crimeInfo.window}`);
    const searchResult = performSearch(session, crimeInfo.place, crimeInfo.window);
    apUsed++;

    const physicalFound = searchResult.evidence.filter(e => e.kind === 'physical').length;
    log(`Found ${physicalFound} physical evidence`);

    // ===== PHASE 3: DEVICE LOGS (1-3 AP) =====
    log('=== Phase 3: Device Logs ===');
    const windowsToCheck = [crimeInfo.window, ...getAdjacentWindows(crimeInfo.window)];
    for (const w of windowsToCheck) {
        if (!ensureAP(session, 1, log)) break;
        log(`LOGS door ${w}`);
        checkLogs(session, 'door', w);
        apUsed++;
    }

    // ===== PHASE 4: TESTIMONY FROM ALL SUSPECTS (5 AP) =====
    log('=== Phase 4: Gathering Testimony ===');
    for (const suspect of suspects) {
        if (!ensureAP(session, 1, log)) break;
        log(`INTERVIEW ${suspect} ${crimeInfo.window} testimony`);
        performInterview(session, suspect, crimeInfo.window, 'testimony');
        apUsed++;
    }

    // ===== PHASE 5: MORE GOSSIP FOR MOTIVES (remaining AP) =====
    log('=== Phase 5: More Gossip ===');
    for (const suspect of suspects.slice(1)) {  // Skip first, already got their gossip
        if (!ensureAP(session, 1, log)) break;
        log(`INTERVIEW ${suspect} gossip`);
        performInterview(session, suspect, '', 'gossip');
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

    const metrics = {
        culpritHasSelfContradiction: culpritSelfContradictions > 0,
        culpritHasCrimeSceneLie: culpritCrimeSceneLies > 0,
        culpritHasSignatureMotive,
        culpritContradictionCount,
        maxInnocentContradictions,
        totalContradictions: contradictions.length,
        difficultyTier,
    };

    // ===== PHASE 7: BUILD ACCUSATION =====
    log('=== Phase 7: Building Accusation ===');
    const accusation = buildSmartAccusation(session, crimeInfo, contradictions, log);

    if (!accusation) {
        return {
            seed, solved: false, correct: false, coreCorrect: false, apUsed,
            failReason: 'could_not_build_accusation',
            trace,
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
        metrics,
    };
}

/**
 * Run solver across multiple seeds and report results
 */
export function autosolve(count: number, startSeed: number = 1, verbose: boolean = false): void {
    console.log(`\nSmart Autosolving ${count} cases starting from seed ${startSeed}...\n`);

    const results: SolveResult[] = [];
    const failures: SolveResult[] = [];

    for (let i = 0; i < count; i++) {
        const seed = startSeed + i;
        if (verbose) console.log(`\n--- Seed ${seed} ---`);

        const result = solve(seed, verbose);
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

    // ===== TUNING METRICS =====
    const withMetrics = results.filter(r => r.metrics);
    if (withMetrics.length > 0) {
        console.log(`\n${'='.repeat(60)}`);
        console.log('TUNING METRICS');
        console.log('='.repeat(60));

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

        // Signal availability
        const hasSelfContradiction = withMetrics.filter(r => r.metrics?.culpritHasSelfContradiction).length;
        const hasCrimeSceneLie = withMetrics.filter(r => r.metrics?.culpritHasCrimeSceneLie).length;
        const hasSignatureMotive = withMetrics.filter(r => r.metrics?.culpritHasSignatureMotive).length;

        console.log('\nSignal Availability (culprit has...):');
        console.log(`  Self-contradiction:  ${hasSelfContradiction}/${withMetrics.length} (${(hasSelfContradiction/withMetrics.length*100).toFixed(0)}%)`);
        console.log(`  Crime scene lie:     ${hasCrimeSceneLie}/${withMetrics.length} (${(hasCrimeSceneLie/withMetrics.length*100).toFixed(0)}%)`);
        console.log(`  Signature motive:    ${hasSignatureMotive}/${withMetrics.length} (${(hasSignatureMotive/withMetrics.length*100).toFixed(0)}%)`);

        // False positive risk
        const falsePositiveRisk = withMetrics.filter(r =>
            r.metrics && r.metrics.maxInnocentContradictions >= r.metrics.culpritContradictionCount
        ).length;
        console.log('\nFalse Positive Risk:');
        console.log(`  Cases where innocent has >= culprit contradictions: ${falsePositiveRisk}/${withMetrics.length} (${(falsePositiveRisk/withMetrics.length*100).toFixed(0)}%)`);

        // Average contradictions
        const avgCulpritContradictions = withMetrics.reduce((sum, r) => sum + (r.metrics?.culpritContradictionCount || 0), 0) / withMetrics.length;
        const avgInnocentContradictions = withMetrics.reduce((sum, r) => sum + (r.metrics?.maxInnocentContradictions || 0), 0) / withMetrics.length;
        console.log('\nContradiction Counts (avg):');
        console.log(`  Culprit:  ${avgCulpritContradictions.toFixed(1)}`);
        console.log(`  Innocent: ${avgInnocentContradictions.toFixed(1)} (max per case)`);
    }
}
