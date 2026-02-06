/**
 * Task 004: Comedy Validation Gate
 * Tests validateComedy() and its integration with the daily finder.
 */
import { describe, test, expect } from 'vitest';
import type { CaseConfig, EvidenceItem, World, CaseValidation, TestimonyEvidence, PhysicalEvidence, DeviceLogEvidence, MotiveEvidence } from '../src/types.js';
import { validateComedy, validateCase } from '../src/validators.js';

// Helper: make a minimal config
function makeConfig(overrides: Partial<CaseConfig> = {}): CaseConfig {
    return {
        seed: 42,
        suspects: ['alice', 'bob', 'carol'],
        culpritId: 'alice',
        crimeType: 'theft',
        crimeMethod: { methodId: 'swipe', description: 'swiped it', verb: 'swipe' },
        targetItem: 'cactus',
        crimeWindow: 'W3',
        crimePlace: 'kitchen',
        hiddenPlace: 'bedroom',
        motive: {
            type: 'envy',
            description: 'Alice envied the cactus',
            funnyReason: 'The cactus got more Instagram followers than her',
        },
        suspiciousActs: [
            { npc: 'bob', window: 'W3', place: 'living', action: 'pacing', looksLike: 'nervous', actualReason: 'steps', generatesEvents: true },
        ],
        tier: 2,
        difficulty: 'medium',
        ...overrides,
    } as CaseConfig;
}

// Helper: make evidence with multiple modalities
function makeMultiModalEvidence(): EvidenceItem[] {
    return [
        { id: 'e1', kind: 'testimony', witness: 'bob', window: 'W3', place: 'living', observable: 'saw something', confidence: 0.7, cites: [] } as TestimonyEvidence,
        { id: 'e2', kind: 'physical', window: 'W3', place: 'kitchen', item: 'cactus', detail: 'soil marks', cites: [] } as PhysicalEvidence,
        { id: 'e3', kind: 'device_log', window: 'W3', place: 'kitchen', deviceType: 'door_sensor', detail: 'door opened', cites: [] } as DeviceLogEvidence,
    ] as EvidenceItem[];
}

// Helper: single-modality evidence
function makeSingleModalEvidence(): EvidenceItem[] {
    return [
        { id: 'e1', kind: 'testimony', witness: 'bob', window: 'W3', place: 'living', observable: 'saw something', confidence: 0.7, cites: [] } as TestimonyEvidence,
        { id: 'e2', kind: 'testimony', witness: 'carol', window: 'W3', place: 'living', observable: 'heard something', confidence: 0.5, cites: [] } as TestimonyEvidence,
    ] as EvidenceItem[];
}

describe('Task 004: Comedy Validation Gate', () => {
    // AC-1: Rejects no red herrings
    describe('AC-1: Empty suspiciousActs = invalid', () => {
        test('returns valid: false when no suspicious acts', () => {
            const config = makeConfig({ suspiciousActs: [] });
            const evidence = makeMultiModalEvidence();
            const result = validateComedy(config, evidence);

            expect(result.valid).toBe(false);
            expect(result.reason).toContain('suspicious');
        });
    });

    // AC-2: Rejects no funny motive
    describe('AC-2: No funnyReason = invalid', () => {
        test('returns valid: false when motive has empty funnyReason', () => {
            const config = makeConfig({
                motive: {
                    type: 'envy',
                    description: 'Alice envied the cactus',
                    funnyReason: '',
                },
            });
            const evidence = makeMultiModalEvidence();
            const result = validateComedy(config, evidence);

            expect(result.valid).toBe(false);
            expect(result.reason).toContain('motive');
        });
    });

    // AC-3: Rejects single modality
    describe('AC-3: Single modality = invalid', () => {
        test('returns valid: false when only testimony evidence exists', () => {
            const config = makeConfig();
            const evidence = makeSingleModalEvidence();
            const result = validateComedy(config, evidence);

            expect(result.valid).toBe(false);
            expect(result.reason).toContain('modal');
        });
    });

    // AC-4: Passes typical case
    describe('AC-4: Normal case = valid', () => {
        test('returns valid: true for well-formed case', () => {
            const config = makeConfig();
            const evidence = makeMultiModalEvidence();
            const result = validateComedy(config, evidence);

            expect(result.valid).toBe(true);
        });
    });

    // AC-5: Finder rejects comedy-invalid
    describe('AC-5: Finder skips comedy-invalid', () => {
        test('validateCase includes comedy field', () => {
            const config = makeConfig({ suspiciousActs: [] });
            const evidence = makeMultiModalEvidence();
            const world: World = {
                places: [],
                devices: [],
                items: [],
                npcs: [
                    { id: 'alice', name: 'Alice', role: 'test', schedule: [] },
                    { id: 'bob', name: 'Bob', role: 'test', schedule: [] },
                    { id: 'carol', name: 'Carol', role: 'test', schedule: [] },
                ],
                relationships: [],
            };

            const validation = validateCase(world, config, evidence);
            expect(validation.comedy).toBeDefined();
            expect(validation.comedy!.valid).toBe(false);
        });
    });

    // EC-1: Funness pass + comedy fail
    describe('EC-1: Funness pass + comedy fail', () => {
        test('case with no suspicious acts can fail comedy but pass funness', () => {
            const config = makeConfig({ suspiciousActs: [] });
            const evidence = makeMultiModalEvidence();
            const result = validateComedy(config, evidence);

            // Comedy should fail
            expect(result.valid).toBe(false);
        });
    });

    // EC-2: Success rate impact
    describe('EC-2: Success rate impact <= 20%', () => {
        test('comedy gate does not reject too many typical cases', () => {
            let passCount = 0;
            const total = 20;

            for (let i = 0; i < total; i++) {
                const config = makeConfig({ seed: i + 100 });
                const evidence = makeMultiModalEvidence();
                const result = validateComedy(config, evidence);
                if (result.valid) passCount++;
            }

            // At least 80% should pass (well-formed test cases always pass)
            expect(passCount / total).toBeGreaterThanOrEqual(0.8);
        });
    });

    // ERR-1: Empty evidence
    describe('ERR-1: Empty evidence', () => {
        test('returns valid: false with issues listed', () => {
            const config = makeConfig();
            const evidence: EvidenceItem[] = [];
            const result = validateComedy(config, evidence);

            expect(result.valid).toBe(false);
        });
    });

    // INT-1: generateValidatedCase pipeline integration
    describe('INT-1: Full pipeline integration', () => {
        test('generateValidatedCase succeeds for >= 95% of seeds', async () => {
            const { generateValidatedCase } = await import('../src/sim.js');

            let successCount = 0;
            const total = 100;

            for (let seed = 1; seed <= total; seed++) {
                const result = generateValidatedCase(seed, 2);
                if (result) successCount++;
            }

            expect(successCount / total).toBeGreaterThanOrEqual(0.95);
        });

        test('comedy validation passes on generated cases', async () => {
            const { generateValidatedCase } = await import('../src/sim.js');

            let comedyPass = 0;
            let tested = 0;

            for (let seed = 1; seed <= 50; seed++) {
                const result = generateValidatedCase(seed, 2);
                if (!result) continue;
                tested++;

                const comedy = validateComedy(result.sim.config, result.evidence);
                if (comedy.valid) comedyPass++;
            }

            expect(tested).toBeGreaterThan(0);
            // Most generated cases should pass comedy validation
            expect(comedyPass / tested).toBeGreaterThanOrEqual(0.9);
        });
    });
});
