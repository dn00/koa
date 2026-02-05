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
} from './types.js';

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
interface EvidenceChain {
    type: 'presence' | 'device' | 'testimony' | 'physical';
    evidence: EvidenceItem[];
    impliesNPC: NPCId;
    confidence: number;
}

function findImplicatingChains(
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
    const physicalEvidence = evidence.filter(e => e.kind === 'physical');

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
// Aggregate Validator
// ============================================================================

export function validateCase(
    world: World,
    config: CaseConfig,
    evidence: EvidenceItem[]
): CaseValidation {
    const solvability = validateSolvability(world, config, evidence);
    const antiAnticlimax = validateAntiAnticlimax(config, evidence);
    const redHerrings = validateRedHerrings(world, config, evidence);

    return {
        seed: config.seed,
        solvability,
        antiAnticlimax,
        redHerrings,
        passed: solvability.valid && antiAnticlimax.valid && redHerrings.valid,
        culprit: config.culpritId,
        evidenceCount: evidence.length,
    };
}
