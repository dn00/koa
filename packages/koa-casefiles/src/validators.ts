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

        // If they were the distracted witness, they have an implicit alibi
        // (they were there but didn't see anything = innocent)
        if (suspect === config.distractedWitness) continue;

        // No alibi found
        missingAlibis.push(suspect);
    }

    if (missingAlibis.length > 0) {
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
