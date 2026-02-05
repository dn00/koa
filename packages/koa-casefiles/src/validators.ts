/**
 * KOA Casefiles - Case Validators
 *
 * Validates that a generated case is:
 * 1. Solvable - Evidence uniquely identifies the culprit
 * 2. Non-trivial - No single piece of evidence gives away the answer
 * 3. Fair to red herrings - Each non-culprit has an alibi
 */

import type {
    World,
    CaseConfig,
    EvidenceItem,
    ValidationResult,
    CaseValidation,
    NPCId,
    WindowId,
    PresenceEvidence,
    DeviceLogEvidence,
    TestimonyEvidence,
    PhysicalEvidence,
    MotiveEvidence,
    EvidenceChainV2,
    ChainTarget,
    Contradiction,
    DifficultyValidation,
    DifficultyConfig,
} from './types.js';

import { DIFFICULTY_TIER_TARGETS } from './types.js';

// ============================================================================
// Solvability Validator
// ============================================================================

/**
 * Chain = a sequence of evidence that points to the culprit.
 *
 * For theft, valid chains include:
 * - Culprit was at crime location during crime window (presence)
 * - Door/motion events place culprit moving to/from crime location
 * - Testimony places someone matching culprit at scene
 */
export interface EvidenceChain {
    type: 'presence' | 'device' | 'testimony' | 'physical';
    evidence: EvidenceItem[];
    impliesNPC: NPCId;
    confidence: number;
}

export function findImplicatingChains(
    culprit: NPCId,
    config: CaseConfig,
    evidence: EvidenceItem[]
): EvidenceChain[] {
    const chains: EvidenceChain[] = [];

    // Chain type 1: Presence at crime scene during crime window
    const presenceEvidence = evidence.filter(
        e => e.kind === 'presence'
    ) as PresenceEvidence[];

    const culpritAtScene = presenceEvidence.find(
        e => e.npc === culprit &&
            e.window === config.crimeWindow &&
            e.place === config.crimePlace
    );

    if (culpritAtScene) {
        chains.push({
            type: 'presence',
            evidence: [culpritAtScene],
            impliesNPC: culprit,
            confidence: 0.9,
        });
    }

    // Chain type 2: Device logs showing movement to crime scene
    const deviceEvidence = evidence.filter(
        e => e.kind === 'device_log'
    ) as DeviceLogEvidence[];

    // Find door events during crime window that could have been culprit
    const crimeWindowDoors = deviceEvidence.filter(
        e => e.window === config.crimeWindow &&
            (e.place === config.crimePlace || e.place === config.hiddenPlace)
    );

    if (crimeWindowDoors.length > 0) {
        // This is circumstantial but useful
        chains.push({
            type: 'device',
            evidence: crimeWindowDoors,
            impliesNPC: culprit, // We know it's culprit, but player has to deduce
            confidence: 0.6,
        });
    }

    // Chain type 3: Physical evidence (item locations)
    const physicalEvidence = evidence.filter(
        e => e.kind === 'physical' && e.item === config.targetItem
    );

    if (physicalEvidence.length > 0) {
        chains.push({
            type: 'physical',
            evidence: physicalEvidence,
            impliesNPC: culprit,
            confidence: 0.8,
        });
    }

    // Chain type 4: Testimony pointing to culprit (with low confidence)
    const testimonyEvidence = evidence.filter(
        e => e.kind === 'testimony'
    ) as TestimonyEvidence[];

    const relevantTestimony = testimonyEvidence.filter(
        e => e.window === config.crimeWindow &&
            e.observable.includes('someone') // Vague sightings
    );

    if (relevantTestimony.length > 0) {
        chains.push({
            type: 'testimony',
            evidence: relevantTestimony,
            impliesNPC: culprit,
            confidence: 0.5,
        });
    }

    return chains;
}

// ============================================================================
// Chain Finders (V2 - Multi-target)
// ============================================================================

/**
 * Find evidence chains that identify WHO committed the crime.
 * Uses existing findImplicatingChains logic but returns EvidenceChainV2.
 */
export function findWhoChains(
    config: CaseConfig,
    evidence: EvidenceItem[]
): EvidenceChainV2[] {
    const oldChains = findImplicatingChains(config.culpritId, config, evidence);
    return oldChains.map(c => ({
        target: 'who' as ChainTarget,
        type: c.type,
        evidence: c.evidence,
        confidence: c.confidence,
        requiredActions: estimateActionsForEvidence(c.evidence),
    }));
}

/**
 * Find evidence chains that prove HOW the crime was committed.
 * HOW = method of crime (access, movement pattern, tools).
 */
export function findHowChains(
    config: CaseConfig,
    evidence: EvidenceItem[]
): EvidenceChainV2[] {
    const chains: EvidenceChainV2[] = [];

    // Device logs showing movement pattern
    const deviceEvidence = evidence.filter(
        e => e.kind === 'device_log'
    ) as DeviceLogEvidence[];

    const crimeWindowDevices = deviceEvidence.filter(
        e => e.window === config.crimeWindow
    );

    // Door events showing path from crime place to hidden place
    const doorEvents = crimeWindowDevices.filter(
        e => e.deviceType === 'door_sensor' &&
            (e.place === config.crimePlace || e.place === config.hiddenPlace)
    );

    if (doorEvents.length >= 2) {
        chains.push({
            target: 'how',
            type: 'device',
            evidence: doorEvents,
            confidence: 0.7,
            requiredActions: estimateActionsForEvidence(doorEvents),
        });
    }

    // Physical traces from activities (TRACE_FOUND events)
    const physicalEvidence = evidence.filter(
        e => e.kind === 'physical'
    ) as PhysicalEvidence[];

    const traces = physicalEvidence.filter(
        e => e.detail.toLowerCase().includes('trace') ||
            e.detail.toLowerCase().includes('crumb') ||
            e.detail.toLowerCase().includes('mark')
    );

    if (traces.length > 0) {
        chains.push({
            target: 'how',
            type: 'physical',
            evidence: traces,
            confidence: 0.6,
            requiredActions: estimateActionsForEvidence(traces),
        });
    }

    // Testimony about sounds/movements matching crime execution
    const testimonyEvidence = evidence.filter(
        e => e.kind === 'testimony'
    ) as TestimonyEvidence[];

    const methodTestimony = testimonyEvidence.filter(
        e => e.window === config.crimeWindow &&
            (e.observable.toLowerCase().includes('heard') ||
             e.observable.toLowerCase().includes('footsteps') ||
             e.observable.toLowerCase().includes('door'))
    );

    if (methodTestimony.length > 0) {
        chains.push({
            target: 'how',
            type: 'testimony',
            evidence: methodTestimony,
            confidence: 0.5,
            requiredActions: estimateActionsForEvidence(methodTestimony),
        });
    }

    return chains;
}

/**
 * Find evidence chains that prove WHEN the crime occurred.
 * WHEN = time window identification.
 */
export function findWhenChains(
    config: CaseConfig,
    evidence: EvidenceItem[]
): EvidenceChainV2[] {
    const chains: EvidenceChainV2[] = [];

    // Device logs timestamped to crime window
    const deviceEvidence = evidence.filter(
        e => e.kind === 'device_log' && e.window === config.crimeWindow
    ) as DeviceLogEvidence[];

    if (deviceEvidence.length > 0) {
        chains.push({
            target: 'when',
            type: 'device',
            evidence: deviceEvidence,
            confidence: 0.8,
            requiredActions: estimateActionsForEvidence(deviceEvidence),
        });
    }

    // Testimony referencing crime window
    const testimonyEvidence = evidence.filter(
        e => e.kind === 'testimony' && e.window === config.crimeWindow
    ) as TestimonyEvidence[];

    if (testimonyEvidence.length > 0) {
        chains.push({
            target: 'when',
            type: 'testimony',
            evidence: testimonyEvidence,
            confidence: 0.6,
            requiredActions: estimateActionsForEvidence(testimonyEvidence),
        });
    }

    // Physical evidence showing item state change
    const physicalEvidence = evidence.filter(
        e => e.kind === 'physical' && e.item === config.targetItem
    ) as PhysicalEvidence[];

    const missingEvidence = physicalEvidence.filter(e =>
        e.detail.toLowerCase().includes('missing') ||
        e.detail.toLowerCase().includes('gone')
    );

    if (missingEvidence.length > 0) {
        chains.push({
            target: 'when',
            type: 'physical',
            evidence: missingEvidence,
            confidence: 0.7,
            requiredActions: estimateActionsForEvidence(missingEvidence),
        });
    }

    return chains;
}

/**
 * Find evidence chains that prove WHERE the crime occurred.
 * WHERE = crime location and hidden location.
 */
export function findWhereChains(
    config: CaseConfig,
    evidence: EvidenceItem[]
): EvidenceChainV2[] {
    const chains: EvidenceChainV2[] = [];

    // Physical evidence at crime location
    const physicalEvidence = evidence.filter(
        e => e.kind === 'physical'
    ) as PhysicalEvidence[];

    const crimeLocationEvidence = physicalEvidence.filter(
        e => e.place === config.crimePlace && e.item === config.targetItem
    );

    if (crimeLocationEvidence.length > 0) {
        chains.push({
            target: 'where',
            type: 'physical',
            evidence: crimeLocationEvidence,
            confidence: 0.9,
            requiredActions: estimateActionsForEvidence(crimeLocationEvidence),
        });
    }

    // Physical evidence at hidden location
    const hiddenLocationEvidence = physicalEvidence.filter(
        e => e.place === config.hiddenPlace && e.item === config.targetItem
    );

    if (hiddenLocationEvidence.length > 0) {
        chains.push({
            target: 'where',
            type: 'physical',
            evidence: hiddenLocationEvidence,
            confidence: 0.9,
            requiredActions: estimateActionsForEvidence(hiddenLocationEvidence),
        });
    }

    // Device logs at crime/hidden locations
    const deviceEvidence = evidence.filter(
        e => e.kind === 'device_log'
    ) as DeviceLogEvidence[];

    const locationDeviceLogs = deviceEvidence.filter(
        e => (e.place === config.crimePlace || e.place === config.hiddenPlace) &&
            e.window === config.crimeWindow
    );

    if (locationDeviceLogs.length > 0) {
        chains.push({
            target: 'where',
            type: 'device',
            evidence: locationDeviceLogs,
            confidence: 0.7,
            requiredActions: estimateActionsForEvidence(locationDeviceLogs),
        });
    }

    return chains;
}

/**
 * Find evidence chains that prove WHY the crime was committed.
 * WHY = motive.
 */
export function findWhyChains(
    config: CaseConfig,
    evidence: EvidenceItem[]
): EvidenceChainV2[] {
    const chains: EvidenceChainV2[] = [];

    // Motive evidence pointing to culprit
    const motiveEvidence = evidence.filter(
        e => e.kind === 'motive'
    ) as MotiveEvidence[];

    const culpritMotive = motiveEvidence.filter(
        e => e.suspect === config.culpritId
    );

    if (culpritMotive.length > 0) {
        chains.push({
            target: 'why',
            type: 'motive',
            evidence: culpritMotive,
            confidence: 0.7,
            requiredActions: estimateActionsForEvidence(culpritMotive),
        });
    }

    // Motive evidence matching the actual motive type
    const matchingMotive = motiveEvidence.filter(
        e => e.suspect === config.culpritId &&
            e.motiveHint === config.motive.type
    );

    if (matchingMotive.length > 0 && matchingMotive !== culpritMotive) {
        chains.push({
            target: 'why',
            type: 'motive',
            evidence: matchingMotive,
            confidence: 0.9,
            requiredActions: estimateActionsForEvidence(matchingMotive),
        });
    }

    return chains;
}

/**
 * Get all chains for all targets.
 */
export function getAllChains(
    config: CaseConfig,
    evidence: EvidenceItem[]
): Record<ChainTarget, EvidenceChainV2[]> {
    return {
        who: findWhoChains(config, evidence),
        how: findHowChains(config, evidence),
        when: findWhenChains(config, evidence),
        where: findWhereChains(config, evidence),
        why: findWhyChains(config, evidence),
    };
}

/**
 * Estimate how many actions are needed to discover a set of evidence.
 */
const LOG_SLICE_SIZE = 3; // Must match actions.ts

function estimateActionsForEvidence(evidence: EvidenceItem[]): number {
    // Group by action type and count items per action
    const actionCounts = new Map<string, number>();

    for (const e of evidence) {
        const key = getActionKey(e);
        actionCounts.set(key, (actionCounts.get(key) || 0) + 1);
    }

    // Calculate total actions, accounting for log slicing
    let totalActions = 0;
    for (const [key, count] of actionCounts) {
        if (key.startsWith('LOGS_')) {
            // Device logs are sliced - need ceil(count/3) actions
            totalActions += Math.ceil(count / LOG_SLICE_SIZE);
        } else {
            // Other actions reveal all matching evidence in 1 action
            totalActions += 1;
        }
    }

    return totalActions;
}

function getActionKey(evidence: EvidenceItem): string {
    switch (evidence.kind) {
        case 'physical':
            return `SEARCH_${evidence.place}_${evidence.window}`;
        case 'testimony':
            // Testimony now requires INTERVIEW <npc> <window> testimony
            return `INTERVIEW_${evidence.witness}_${evidence.window}_testimony`;
        case 'device_log':
            return `LOGS_${evidence.deviceType}_${evidence.window}`;
        case 'motive':
            // Gossip now requires INTERVIEW <npc> gossip (separate action)
            return `INTERVIEW_${evidence.gossipSource}_gossip`;
        case 'presence':
            // Presence is inferred from other evidence
            return `INFERRED_${evidence.npc}_${evidence.window}`;
    }
}

/**
 * Find exculpating evidence for a non-culprit.
 * An alibi exists if the suspect was provably elsewhere during crime window.
 */
function findExculpatingEvidence(
    suspect: NPCId,
    config: CaseConfig,
    evidence: EvidenceItem[]
): EvidenceItem | null {
    const presenceEvidence = evidence.filter(
        e => e.kind === 'presence'
    ) as PresenceEvidence[];

    // Alibi = suspect was NOT at crime place during crime window
    const alibi = presenceEvidence.find(
        e => e.npc === suspect &&
            e.window === config.crimeWindow &&
            e.place !== config.crimePlace
    );

    return alibi ?? null;
}

export function validateSolvability(
    world: World,
    config: CaseConfig,
    evidence: EvidenceItem[]
): ValidationResult {
    const chains = findImplicatingChains(config.culpritId, config, evidence);

    // Need at least 2 independent chains
    if (chains.length < 2) {
        return {
            valid: false,
            reason: `Insufficient evidence chains (found ${chains.length}, need 2)`,
            details: { chainCount: chains.length, chainTypes: chains.map(c => c.type) },
        };
    }

    // Check chain diversity - need more than one type
    const chainTypes = new Set(chains.map(c => c.type));
    if (chainTypes.size < 2) {
        return {
            valid: false,
            reason: 'Evidence chains lack diversity (all same type)',
            details: { chainTypes: Array.from(chainTypes) },
        };
    }

    return {
        valid: true,
        details: {
            chainCount: chains.length,
            chainTypes: chains.map(c => c.type),
        },
    };
}

// ============================================================================
// Anti-Anticlimax Validator
// ============================================================================

/**
 * Ensure no single piece of evidence trivially solves the case.
 *
 * Rules:
 * - No testimony with confidence >= 0.95 that identifies culprit
 * - No device log that directly identifies culprit at crime scene
 * - Crime window testimony must be vague
 */
export function validateAntiAnticlimax(
    config: CaseConfig,
    evidence: EvidenceItem[]
): ValidationResult {
    const testimonyEvidence = evidence.filter(
        e => e.kind === 'testimony'
    ) as TestimonyEvidence[];

    // Check for trivial witness
    for (const testimony of testimonyEvidence) {
        if (testimony.window === config.crimeWindow &&
            testimony.confidence >= 0.95) {
            return {
                valid: false,
                reason: 'Trivial witness exists with high confidence during crime window',
                details: {
                    testimony: testimony.id,
                    confidence: testimony.confidence,
                    observable: testimony.observable,
                },
            };
        }
    }

    // Check for device logs that directly identify actor
    const deviceEvidence = evidence.filter(
        e => e.kind === 'device_log'
    ) as DeviceLogEvidence[];

    for (const device of deviceEvidence) {
        if (device.window === config.crimeWindow &&
            device.actor === config.culpritId) {
            return {
                valid: false,
                reason: 'Device log directly identifies culprit during crime',
                details: {
                    device: device.id,
                    actor: device.actor,
                },
            };
        }
    }

    return { valid: true };
}

// ============================================================================
// Red Herring Validator
// ============================================================================

/**
 * Each non-culprit must have an alibi (exculpating evidence).
 * An alibi can be:
 * - Being provably elsewhere during crime window
 * - Being at crime scene but distracted (couldn't have seen/done crime)
 */
export function validateRedHerrings(
    world: World,
    config: CaseConfig,
    evidence: EvidenceItem[]
): ValidationResult {
    const redHerrings = config.suspects.filter(s => s !== config.culpritId);
    const missingAlibis: NPCId[] = [];

    for (const suspect of redHerrings) {
        const alibi = findExculpatingEvidence(suspect, config, evidence);

        // If they have a location alibi, they're cleared
        if (alibi) continue;

        // If they were a distracted witness, they have an implicit alibi
        // (they were there but didn't see anything = innocent)
        if (config.distractedWitnesses?.includes(suspect)) continue;

        // No alibi found
        missingAlibis.push(suspect);
    }

    // Allow up to 1 red herring without alibi - still solvable through
    // process of elimination if culprit has incriminating evidence
    if (missingAlibis.length > 1) {
        return {
            valid: false,
            reason: `Red herrings missing alibis: ${missingAlibis.join(', ')}`,
            details: { missingAlibis },
        };
    }

    return { valid: true };
}

// ============================================================================
// Contradiction Detection
// ============================================================================

/**
 * Find contradictions in the evidence.
 * A contradiction is when two pieces of evidence cannot both be true.
 */
export function findContradictions(
    evidence: EvidenceItem[],
    config: CaseConfig
): Contradiction[] {
    const contradictions: Contradiction[] = [];
    let contradictionId = 0;

    // Type 1: Presence contradictions (NPC in two places same window)
    const presenceEvidence = evidence.filter(
        e => e.kind === 'presence'
    ) as PresenceEvidence[];

    // Group by NPC + window
    const presenceByNpcWindow = new Map<string, PresenceEvidence[]>();
    for (const p of presenceEvidence) {
        const key = `${p.npc}_${p.window}`;
        if (!presenceByNpcWindow.has(key)) {
            presenceByNpcWindow.set(key, []);
        }
        presenceByNpcWindow.get(key)!.push(p);
    }

    for (const [, items] of presenceByNpcWindow) {
        if (items.length > 1) {
            const places = new Set(items.map(i => i.place));
            if (places.size > 1) {
                contradictions.push({
                    id: `contradiction_${contradictionId++}`,
                    rule: 'cannot_be_two_places',
                    evidenceA: items[0].id,
                    evidenceB: items[1].id,
                    cites: [...items[0].cites, ...items[1].cites],
                });
            }
        }
    }

    // Type 2: Testimony contradictions (conflicting observations)
    const testimonyEvidence = evidence.filter(
        e => e.kind === 'testimony'
    ) as TestimonyEvidence[];

    // Group testimony by window + place
    const testimonyByContext = new Map<string, TestimonyEvidence[]>();
    for (const t of testimonyEvidence) {
        const key = `${t.window}_${t.place}`;
        if (!testimonyByContext.has(key)) {
            testimonyByContext.set(key, []);
        }
        testimonyByContext.get(key)!.push(t);
    }

    // Look for contradicting observations in same context
    for (const [, items] of testimonyByContext) {
        if (items.length > 1) {
            // Check for "heard nothing" vs "heard something"
            const heardNothing = items.find(t =>
                t.observable.toLowerCase().includes('nothing') ||
                t.observable.toLowerCase().includes('quiet')
            );
            const heardSomething = items.find(t =>
                t.observable.toLowerCase().includes('heard') &&
                !t.observable.toLowerCase().includes('nothing')
            );

            if (heardNothing && heardSomething) {
                contradictions.push({
                    id: `contradiction_${contradictionId++}`,
                    rule: 'testimony_conflict',
                    evidenceA: heardNothing.id,
                    evidenceB: heardSomething.id,
                    cites: [...heardNothing.cites, ...heardSomething.cites],
                });
            }
        }
    }

    // Type 3: False alibi contradiction (from twist)
    if (config.twist?.type === 'false_alibi') {
        // The false alibi creates a contradiction with true presence
        const alibiActor = config.twist.actor;
        const alibiEvidence = presenceEvidence.find(
            p => p.npc === alibiActor && p.window === config.crimeWindow
        );
        const truePresence = presenceEvidence.find(
            p => p.npc === alibiActor &&
                p.window === config.crimeWindow &&
                p.place !== alibiEvidence?.place
        );

        if (alibiEvidence && truePresence) {
            contradictions.push({
                id: `contradiction_${contradictionId++}`,
                rule: 'false_alibi',
                evidenceA: alibiEvidence.id,
                evidenceB: truePresence.id,
                cites: [...alibiEvidence.cites, ...truePresence.cites],
            });
        }
    }

    return contradictions;
}

// ============================================================================
// Difficulty Validator
// ============================================================================

/**
 * Estimate the minimum AP needed to solve the case.
 * Models investigation as finding the minimum-cost set of evidence
 * that covers all 5 targets (who/how/when/where/why).
 */
export function estimateMinimumAP(
    chains: Record<ChainTarget, EvidenceChainV2[]>,
    evidence: EvidenceItem[]
): number {
    const collectedEvidence = new Set<string>();
    let totalAP = 0;

    const targets: ChainTarget[] = ['who', 'how', 'when', 'where', 'why'];

    for (const target of targets) {
        const targetChains = chains[target];

        if (targetChains.length === 0) {
            // No chain = this target can't be proven
            // Add 2 AP penalty (they'll have to guess or cross-reference)
            totalAP += 2;
            continue;
        }

        // Find chain with lowest incremental cost (evidence not yet collected)
        let bestNewAP = Infinity;
        let bestChain: EvidenceChainV2 | null = null;

        for (const chain of targetChains) {
            const newEvidence = chain.evidence.filter(
                e => !collectedEvidence.has(e.id)
            );
            const newAP = estimateActionsForEvidence(newEvidence);

            if (newAP < bestNewAP) {
                bestNewAP = newAP;
                bestChain = chain;
            }
        }

        if (bestChain) {
            bestChain.evidence.forEach(e => collectedEvidence.add(e.id));
            totalAP += bestNewAP;
        }
    }

    // Minimum of 3 AP (can't solve in less than 3 actions)
    return Math.max(3, totalAP);
}

/**
 * Calculate branching factor - how many distinct investigation openings exist.
 * Higher = more player agency in how to approach the case.
 */
export function calculateBranchingFactor(
    chains: Record<ChainTarget, EvidenceChainV2[]>
): number {
    // Count distinct "opening" investigation paths
    // An opening is a chain type that reveals useful info early

    const openings = new Set<string>();

    // WHO chains provide direct suspect identification
    for (const chain of chains.who) {
        openings.add(`who_${chain.type}`);
    }

    // WHERE chains reveal locations to investigate
    for (const chain of chains.where) {
        openings.add(`where_${chain.type}`);
    }

    // WHEN chains help narrow the timeframe
    for (const chain of chains.when) {
        openings.add(`when_${chain.type}`);
    }

    return Math.max(1, openings.size);
}

/**
 * Validate that the case meets difficulty requirements.
 */
export function validateDifficulty(
    world: World,
    config: CaseConfig,
    evidence: EvidenceItem[],
    difficultyConfig: DifficultyConfig
): DifficultyValidation {
    const chains = getAllChains(config, evidence);
    const minAP = estimateMinimumAP(chains, evidence);
    const contradictions = findContradictions(evidence, config);
    const branchingFactor = calculateBranchingFactor(chains);

    const targets = DIFFICULTY_TIER_TARGETS[difficultyConfig.tier];

    const issues: string[] = [];

    if (minAP < targets.minAP) {
        issues.push(`Too easy: ${minAP} AP < ${targets.minAP} minimum`);
    }
    if (minAP > targets.maxAP) {
        issues.push(`Too hard: ${minAP} AP > ${targets.maxAP} maximum`);
    }
    if (contradictions.length < targets.minContradictions) {
        issues.push(`Too few contradictions: ${contradictions.length} < ${targets.minContradictions}`);
    }
    if (contradictions.length > targets.maxContradictions) {
        issues.push(`Too many contradictions: ${contradictions.length} > ${targets.maxContradictions}`);
    }
    if (branchingFactor < targets.minBranching) {
        issues.push(`Too linear: branching ${branchingFactor} < ${targets.minBranching}`);
    }

    return {
        valid: issues.length === 0,
        reason: issues.length > 0 ? issues.join('; ') : undefined,
        estimatedMinAP: minAP,
        contradictionCount: contradictions.length,
        branchingFactor,
        chainsByTarget: {
            who: chains.who.length,
            how: chains.how.length,
            when: chains.when.length,
            where: chains.where.length,
            why: chains.why.length,
        },
    };
}

// ============================================================================
// Funness Lint
// ============================================================================

/**
 * Validate that the case is "fun" - not too easy, not too linear, has drama.
 */
export function validateFunness(
    config: CaseConfig,
    evidence: EvidenceItem[],
    chains: Record<ChainTarget, EvidenceChainV2[]>
): ValidationResult {
    const issues: string[] = [];

    // Check: Too easy (single action reveals 3+ targets)
    const actionToTargets = new Map<string, Set<ChainTarget>>();

    for (const [target, targetChains] of Object.entries(chains) as [ChainTarget, EvidenceChainV2[]][]) {
        for (const chain of targetChains) {
            for (const e of chain.evidence) {
                const actionKey = getActionKey(e);
                if (!actionToTargets.has(actionKey)) {
                    actionToTargets.set(actionKey, new Set());
                }
                actionToTargets.get(actionKey)!.add(target);
            }
        }
    }

    for (const [action, targets] of actionToTargets) {
        if (targets.size >= 3) {
            issues.push(`Single action "${action}" reveals ${targets.size} targets`);
        }
    }

    // Check: Too linear (only 1 opening for WHO target)
    const whoOpenings = new Set(chains.who.map(c => c.type));
    if (whoOpenings.size < 2 && chains.who.length > 0) {
        issues.push('Only one way to identify WHO');
    }

    // Check: No misdirection (no suspicious red herrings)
    const hasRedHerrings = config.suspiciousActs.length > 0;
    if (!hasRedHerrings) {
        issues.push('No suspicious red herrings');
    }

    // Check: No motive variety (only one suspect has motive evidence)
    const motiveEvidence = evidence.filter(e => e.kind === 'motive') as MotiveEvidence[];
    const suspectsWithMotive = new Set(motiveEvidence.map(m => m.suspect));
    if (suspectsWithMotive.size < 2) {
        issues.push('Only one suspect has motive evidence');
    }

    return {
        valid: issues.length === 0,
        reason: issues.length > 0 ? issues.join('; ') : undefined,
        details: { issues },
    };
}

// ============================================================================
// Keystone Pair Detection
// ============================================================================

/**
 * A keystone pair is a contradiction that, when found, narrows suspects to ≤2.
 * This is the designed "aha moment" of the case.
 */
export interface KeystonePair {
    evidenceA: string;
    evidenceB: string;
    rule: string;
    implicated: NPCId[];  // NPCs implicated by finding this contradiction
    description: string;  // Human-readable hint
}

/**
 * Find the keystone contradiction for a case.
 * Returns the contradiction that most narrows down the suspect list.
 */
export function findKeystonePair(
    config: CaseConfig,
    evidence: EvidenceItem[],
    contradictions: Contradiction[]
): KeystonePair | null {
    if (contradictions.length === 0) return null;

    // Score each contradiction by how much it narrows suspects
    let bestPair: KeystonePair | null = null;
    let bestScore = 0;

    for (const c of contradictions) {
        const evA = evidence.find(e => e.id === c.evidenceA);
        const evB = evidence.find(e => e.id === c.evidenceB);
        if (!evA || !evB) continue;

        // Find which NPCs are implicated by this contradiction
        const implicated: NPCId[] = [];

        // Check testimony contradictions - the witness who lied is implicated
        if (evA.kind === 'testimony' && evB.kind === 'testimony') {
            const testA = evA as TestimonyEvidence;
            const testB = evB as TestimonyEvidence;

            // If same witness contradicts themselves, they're implicated
            if (testA.witness === testB.witness) {
                implicated.push(testA.witness);
            }
        }

        // Check presence contradictions - NPC in two places
        if (c.rule === 'cannot_be_two_places' || c.rule === 'witness_location_conflict') {
            if (evA.kind === 'presence') {
                implicated.push((evA as PresenceEvidence).npc);
            } else if (evA.kind === 'testimony') {
                implicated.push((evA as TestimonyEvidence).witness);
            }
        }

        // Score = how many suspects eliminated (prefer implicating culprit)
        const eliminates = config.suspects.filter(s => !implicated.includes(s)).length;
        const implicatesCulprit = implicated.includes(config.culpritId) ? 10 : 0;
        const score = eliminates + implicatesCulprit;

        if (score > bestScore) {
            bestScore = score;
            bestPair = {
                evidenceA: c.evidenceA,
                evidenceB: c.evidenceB,
                rule: c.rule,
                implicated,
                description: getKeystoneDescription(c.rule, implicated),
            };
        }
    }

    return bestPair;
}

function getKeystoneDescription(rule: string, implicated: NPCId[]): string {
    switch (rule) {
        case 'cannot_be_two_places':
            return `Someone claims to be in two places at once`;
        case 'witness_location_conflict':
            return `A witness's story doesn't match where they said they were`;
        case 'testimony_conflict':
            return `Two statements about the same moment can't both be true`;
        case 'false_alibi':
            return `An alibi doesn't hold up to scrutiny`;
        default:
            return `These two pieces of evidence are incompatible`;
    }
}

/**
 * Validate that the case has a keystone pair that narrows to ≤2 suspects.
 */
export function validateKeystonePair(
    config: CaseConfig,
    evidence: EvidenceItem[]
): ValidationResult {
    const contradictions = findContradictions(evidence, config);
    const keystone = findKeystonePair(config, evidence, contradictions);

    if (!keystone) {
        return {
            valid: false,
            reason: 'No keystone contradiction found',
        };
    }

    // Check if keystone narrows to ≤2 suspects
    const remaining = config.suspects.filter(s => !keystone.implicated.includes(s));
    if (remaining.length > 2 && !keystone.implicated.includes(config.culpritId)) {
        return {
            valid: false,
            reason: `Keystone doesn't narrow enough (${remaining.length} suspects remain)`,
            details: { remaining, implicated: keystone.implicated },
        };
    }

    return {
        valid: true,
        details: {
            keystone,
            remainingSuspects: remaining.length,
        },
    };
}

// ============================================================================
// Player Constraints Validation
// ============================================================================

/**
 * Player-side game constraints that affect solvability.
 */
export interface PlayerConstraints {
    maxDays: number;           // Total days available
    apPerDay: number;          // AP restored each day
    coverUpDay: number | null; // Day after which cover-up occurs (null = no cover-up)
    maxLeads: number;          // Max leads that can discount AP
    leadDiscount: number;      // AP saved per lead used (typically 1)
}

export const DEFAULT_PLAYER_CONSTRAINTS: PlayerConstraints = {
    maxDays: 4,
    apPerDay: 3,
    coverUpDay: null,  // Disabled: playtest showed it adds stress without fun
    maxLeads: 2,
    leadDiscount: 1,
};

export interface PlayabilityResult {
    playable: boolean;
    totalAP: number;              // Total AP available
    effectiveAP: number;          // AP after lead discounts
    minAPToSolve: number;         // Estimated minimum AP needed
    apMargin: number;             // effectiveAP - minAPToSolve
    crimeWindowDiscoverable: boolean;  // Can player find the crime window?
    keystoneExists: boolean;      // Is there a keystone contradiction?
    criticalEvidenceAtRisk: number;    // Evidence that could be removed by cover-up
    issues: string[];

    // Player guidance metrics
    crimeWindowSignalAP: number;       // AP needed to discover crime window (0 = gossip reveals it)
    keystoneReachAP: number;           // AP needed to gather keystone evidence
    firstMoveClarity: 'clear' | 'moderate' | 'unclear';  // Is there an obvious first move?
    windowSpread: number;              // How many windows have relevant evidence (1-6)
}

/**
 * Check if a case is playable given player constraints.
 * This is different from validateCase() which checks if the case is well-formed.
 * This checks if a player can actually solve it within the resource limits.
 */
export function validatePlayability(
    config: CaseConfig,
    evidence: EvidenceItem[],
    chains: Record<ChainTarget, EvidenceChainV2[]>,
    constraints: PlayerConstraints = DEFAULT_PLAYER_CONSTRAINTS
): PlayabilityResult {
    const issues: string[] = [];

    // Calculate available AP
    const totalAP = constraints.maxDays * constraints.apPerDay;
    const effectiveAP = totalAP + (constraints.maxLeads * constraints.leadDiscount);

    // Estimate minimum AP to solve
    const minAPToSolve = estimateMinimumAP(chains, evidence);
    const apMargin = effectiveAP - minAPToSolve;

    if (apMargin < 0) {
        issues.push(`Not enough AP: need ${minAPToSolve}, have ${effectiveAP}`);
    } else if (apMargin < 2) {
        issues.push(`Tight AP margin: only ${apMargin} AP buffer`);
    }

    // Check if crime window is discoverable early
    // The crime_awareness gossip should hint at timing
    const crimeAwareness = evidence.find(e =>
        e.kind === 'motive' && e.motiveHint === 'crime_awareness'
    );
    const crimeWindowDiscoverable = !!crimeAwareness;

    if (!crimeWindowDiscoverable) {
        issues.push(`No crime_awareness gossip to hint at crime window`);
    }

    // Check if there's evidence in the crime window that can be found with 2 AP
    const crimeWindowEvidence = evidence.filter(e => {
        if (e.kind === 'device_log') return e.window === config.crimeWindow;
        if (e.kind === 'testimony') return e.window === config.crimeWindow;
        if (e.kind === 'physical') return e.window === config.crimeWindow;
        return false;
    });

    if (crimeWindowEvidence.length < 3) {
        issues.push(`Crime window ${config.crimeWindow} has sparse evidence (${crimeWindowEvidence.length} items)`);
    }

    // Check keystone contradiction exists
    const contradictions = findContradictions(evidence, config);
    const keystone = findKeystonePair(config, evidence, contradictions);
    const keystoneExists = !!keystone;

    if (!keystoneExists) {
        issues.push(`No keystone contradiction found`);
    }

    // Estimate evidence at risk from cover-up
    // Cover-up removes undiscovered evidence pointing to culprit
    let criticalEvidenceAtRisk = 0;
    if (constraints.coverUpDay !== null) {
        // Evidence that player likely hasn't found by cover-up day
        // Assume player can do (coverUpDay * apPerDay) actions before cover-up
        const actionsBeforeCoverUp = constraints.coverUpDay * constraints.apPerDay;

        // Count evidence that requires more actions than available before cover-up
        // and points to the culprit
        const culpritEvidence = evidence.filter(e => {
            if (e.kind === 'motive') return e.suspect === config.culpritId;
            if (e.kind === 'physical') return e.place === config.crimePlace || e.place === config.hiddenPlace;
            if (e.kind === 'testimony') return e.subjectHint?.toLowerCase() === config.culpritId;
            return false;
        });

        // Rough estimate: if minAP > actionsBeforeCoverUp, some evidence is at risk
        if (minAPToSolve > actionsBeforeCoverUp) {
            criticalEvidenceAtRisk = Math.min(3, culpritEvidence.length);
        }
    }

    if (criticalEvidenceAtRisk > 1) {
        issues.push(`${criticalEvidenceAtRisk} critical evidence items may be lost to cover-up`);
    }

    // =========================================================================
    // Player Guidance Metrics
    // =========================================================================

    // 1. Crime window signal - how many AP to discover which window has the crime?
    let crimeWindowSignalAP = 0;
    const crimeAwarenessGossip = evidence.find(e =>
        e.kind === 'motive' && e.motiveHint === 'crime_awareness'
    );

    if (crimeAwarenessGossip) {
        // Gossip exists - costs 1 AP to get (interview gossip)
        crimeWindowSignalAP = 1;
    } else {
        // No gossip - player must scan windows with LOGS
        // Worst case: check all 6 windows = 6 AP
        // Average case: find crime window in 3 AP
        crimeWindowSignalAP = 3;
        issues.push('No gossip hints at crime timing - player must scan windows');
    }

    // 2. Keystone reachability - how many AP to gather both pieces?
    // Traces back to source evidence for presence-based keystones
    let keystoneReachAP = Infinity;
    if (keystone) {
        const evA = evidence.find(e => e.id === keystone.evidenceA);
        const evB = evidence.find(e => e.id === keystone.evidenceB);

        if (evA && evB) {
            // Trace back to source evidence for presence items
            const traceA = estimateAPWithSourceTrace(evA, evidence);
            const traceB = estimateAPWithSourceTrace(evB, evidence);

            // Combine action keys to avoid double-counting shared sources
            const allKeys = new Set([...traceA.actionKeys, ...traceB.actionKeys]);
            keystoneReachAP = allKeys.size; // Each unique action = 1 AP
        }
    }

    if (keystoneReachAP > 4) {
        issues.push(`Keystone requires ${keystoneReachAP} AP to reach`);
    }

    // 3. First move clarity - is there an obvious starting point?
    // Clear: crime_awareness gossip tells what happened
    // Moderate: crime window has lots of evidence
    // Unclear: evidence spread evenly, no signal
    let firstMoveClarity: 'clear' | 'moderate' | 'unclear' = 'unclear';

    if (crimeAwarenessGossip) {
        firstMoveClarity = 'clear';
    } else {
        // Check if crime window has significantly more evidence than others
        const evidenceByWindow = new Map<string, number>();
        for (const e of evidence) {
            const w = getEvidenceWindow(e);
            if (w) {
                evidenceByWindow.set(w, (evidenceByWindow.get(w) || 0) + 1);
            }
        }

        const crimeWindowCount = evidenceByWindow.get(config.crimeWindow) || 0;
        const otherWindowCounts = Array.from(evidenceByWindow.entries())
            .filter(([w]) => w !== config.crimeWindow)
            .map(([, c]) => c);
        const avgOther = otherWindowCounts.length > 0
            ? otherWindowCounts.reduce((a, b) => a + b, 0) / otherWindowCounts.length
            : 0;

        if (crimeWindowCount > avgOther * 1.5) {
            firstMoveClarity = 'moderate';
        }
    }

    if (firstMoveClarity === 'unclear') {
        issues.push('No clear first move - evidence spread evenly across windows');
    }

    // 4. Window spread - how many windows have relevant evidence?
    const windowsWithEvidence = new Set<string>();
    for (const e of evidence) {
        const w = getEvidenceWindow(e);
        if (w) windowsWithEvidence.add(w);
    }
    const windowSpread = windowsWithEvidence.size;

    // Playability now includes guidance metrics
    const wellGuided = crimeWindowSignalAP <= 2 && keystoneReachAP <= 4 && firstMoveClarity !== 'unclear';
    const playable = apMargin >= 0 && keystoneExists && crimeWindowDiscoverable && wellGuided;

    return {
        playable,
        totalAP,
        effectiveAP,
        minAPToSolve,
        apMargin,
        crimeWindowDiscoverable,
        keystoneExists,
        criticalEvidenceAtRisk,
        issues,
        crimeWindowSignalAP,
        keystoneReachAP: keystoneReachAP === Infinity ? -1 : keystoneReachAP,
        firstMoveClarity,
        windowSpread,
    };
}

// Helper: estimate AP for a single evidence item
function estimateAPForSingleEvidence(e: EvidenceItem): number {
    switch (e.kind) {
        case 'device_log':
            return 1; // LOGS command
        case 'testimony':
            return 1; // INTERVIEW testimony
        case 'motive':
            return 1; // INTERVIEW gossip
        case 'physical':
            return 1; // SEARCH
        case 'presence':
            return 0; // Inferred from other evidence
        default:
            return 1;
    }
}

/**
 * Estimate AP for evidence, tracing back to source for presence evidence.
 * Presence evidence is derived from other evidence (testimony, device logs),
 * so we need to find and cost the original sources.
 */
function estimateAPWithSourceTrace(
    e: EvidenceItem,
    allEvidence: EvidenceItem[]
): { ap: number; actionKeys: Set<string> } {
    // If not presence, just return direct cost
    if (e.kind !== 'presence') {
        return {
            ap: estimateAPForSingleEvidence(e),
            actionKeys: new Set([getEvidenceActionKey(e)]),
        };
    }

    // Presence evidence - trace back to sources via cites
    const presenceEv = e as PresenceEvidence;
    const sourceIds = presenceEv.cites || [];

    if (sourceIds.length === 0) {
        // No sources cited, fallback to 1 AP (assume some action reveals it)
        return { ap: 1, actionKeys: new Set([`PRESENCE_${e.id}`]) };
    }

    // Find source evidence and calculate their AP
    const actionKeys = new Set<string>();
    let totalAP = 0;

    for (const sourceId of sourceIds) {
        const sourceEv = allEvidence.find(ev => ev.id === sourceId);
        if (sourceEv && sourceEv.kind !== 'presence') {
            const key = getEvidenceActionKey(sourceEv);
            if (!actionKeys.has(key)) {
                actionKeys.add(key);
                totalAP += estimateAPForSingleEvidence(sourceEv);
            }
        }
    }

    // If we found sources, return their cost; otherwise fallback
    return totalAP > 0
        ? { ap: totalAP, actionKeys }
        : { ap: 1, actionKeys: new Set([`PRESENCE_${e.id}`]) };
}

// Helper: get action key for evidence
function getEvidenceActionKey(e: EvidenceItem): string {
    switch (e.kind) {
        case 'device_log':
            return `LOGS_${(e as DeviceLogEvidence).deviceType}_${(e as DeviceLogEvidence).window}`;
        case 'testimony':
            return `INTERVIEW_${(e as TestimonyEvidence).witness}_${(e as TestimonyEvidence).window}`;
        case 'motive':
            return `GOSSIP_${(e as MotiveEvidence).gossipSource}`;
        case 'physical':
            return `SEARCH_${(e as PhysicalEvidence).place}_${(e as PhysicalEvidence).window}`;
        default:
            return `OTHER_${e.id}`;
    }
}

// Helper: get window for evidence
function getEvidenceWindow(e: EvidenceItem): string | null {
    switch (e.kind) {
        case 'device_log':
            return (e as DeviceLogEvidence).window;
        case 'testimony':
            return (e as TestimonyEvidence).window;
        case 'physical':
            return (e as PhysicalEvidence).window;
        case 'presence':
            return (e as PresenceEvidence).window;
        default:
            return null;
    }
}

/**
 * Grid search over player constraints to find optimal settings.
 */
export interface TunerConfig {
    daysRange: number[];
    apPerDayRange: number[];
    coverUpDayRange: (number | null)[];
    maxLeadsRange: number[];
}

export const DEFAULT_TUNER_CONFIG: TunerConfig = {
    daysRange: [3, 4, 5, 6],
    apPerDayRange: [2, 3, 4],
    coverUpDayRange: [null, 2, 3],
    maxLeadsRange: [0, 1, 2],
};

export interface SolverMetrics {
    // Difficulty distribution
    difficultyCount: Record<'easy' | 'medium' | 'hard' | 'unsolvable', number>;
    difficultySolved: Record<'easy' | 'medium' | 'hard' | 'unsolvable', number>;
    // Signal availability
    culpritSelfContradiction: number;  // count of cases where culprit self-contradicts
    culpritCrimeSceneLie: number;      // count of cases where culprit lies about crime scene
    culpritSignatureMotive: number;    // count of cases where culprit has signature motive phrase
    // False positive risk
    falsePositiveRisk: number;         // cases where innocent has >= culprit contradictions
    avgCulpritContradictions: number;
    avgInnocentContradictions: number;
    // Solve rate
    solveRate: number;
    solveCount: number;
}

export interface TunerResult {
    constraints: PlayerConstraints;
    passRate: number;
    avgAPMargin: number;
    avgMinAP: number;
    issues: Record<string, number>;
    // Guidance metrics
    avgWindowSignalAP: number;
    avgKeystoneReachAP: number;
    avgWindowSpread: number;
    clarityDistribution: Record<string, number>;
    // Solver metrics (optional - only present if solver was run)
    solverMetrics?: SolverMetrics;
}

// ============================================================================
// Aggregate Validator
// ============================================================================

export function validateCase(
    world: World,
    config: CaseConfig,
    evidence: EvidenceItem[],
    difficultyConfig?: DifficultyConfig
): CaseValidation {
    const solvability = validateSolvability(world, config, evidence);
    const antiAnticlimax = validateAntiAnticlimax(config, evidence);
    const redHerrings = validateRedHerrings(world, config, evidence);

    // Use default tier 2 if no config provided
    const effectiveConfig: DifficultyConfig = difficultyConfig ?? {
        tier: 2,
        suspectCount: 5,
        windowCount: 6,
        twistRules: ['false_alibi'],
        redHerringStrength: 5,
    };

    const chains = getAllChains(config, evidence);
    const difficulty = validateDifficulty(world, config, evidence, effectiveConfig);
    const funness = validateFunness(config, evidence, chains);
    const contradictions = findContradictions(evidence, config);

    // Core validators must pass; difficulty/funness are soft gates for now
    const passed = solvability.valid && antiAnticlimax.valid && redHerrings.valid;

    return {
        seed: config.seed,
        solvability,
        antiAnticlimax,
        redHerrings,
        difficulty,
        funness,
        passed,
        culprit: config.culpritId,
        evidenceCount: evidence.length,
        contradictions,
    };
}
