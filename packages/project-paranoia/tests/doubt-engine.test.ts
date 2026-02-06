import { describe, test, expect } from 'vitest';
import { createInitialState } from '../src/kernel/state.js';
import { createRng } from '../src/core/rng.js';
import { createWorld } from '../src/core/world.js';
import { CONFIG } from '../src/config.js';
import type { NPCId } from '../src/core/types.js';
import type { ActiveDoubt, KernelState } from '../src/kernel/types.js';
import { getCrewDoubtBurden } from '../src/kernel/systems/doubt-engine.js';

function makeTestState(seed = 12345): KernelState {
    const rng = createRng(seed);
    const world = createWorld(rng);
    return createInitialState(world, 10);
}

// =============================================================================
// Task 001: Types + Config + Helpers
// =============================================================================

describe('AC-1: ActiveDoubt type includes source field', () => {
    test('doubt with source "witness" compiles and is valid', () => {
        const doubt: ActiveDoubt = {
            id: 'doubt-witness-1',
            topic: 'MOTHER vented the air in engineering',
            createdTick: 10,
            severity: 2,
            involvedCrew: ['roughneck' as NPCId],
            resolved: false,
            source: 'witness',
        };

        expect(doubt.source).toBe('witness');
    });

    test('doubt with source "backfire" compiles and is valid', () => {
        const doubt: ActiveDoubt = {
            id: 'doubt-backfire-1',
            topic: 'MOTHER hid the fire from us',
            createdTick: 20,
            severity: 3,
            involvedCrew: ['commander' as NPCId],
            resolved: false,
            source: 'backfire',
        };

        expect(doubt.source).toBe('backfire');
    });

    test('doubt with source "spread" compiles and is valid', () => {
        const doubt: ActiveDoubt = {
            id: 'doubt-spread-1',
            topic: 'MOTHER vented the air in engineering',
            createdTick: 30,
            severity: 2,
            involvedCrew: ['roughneck' as NPCId, 'specialist' as NPCId],
            resolved: false,
            source: 'spread',
        };

        expect(doubt.source).toBe('spread');
    });

    test('doubt with source "pressure" compiles and is valid', () => {
        const doubt: ActiveDoubt = {
            id: 'doubt-pressure-1',
            topic: 'Background suspicion from doubts',
            createdTick: 40,
            severity: 1,
            involvedCrew: [],
            resolved: false,
            source: 'pressure',
        };

        expect(doubt.source).toBe('pressure');
    });

    test('doubt with undefined source is valid (backwards compat)', () => {
        const doubt: ActiveDoubt = {
            id: 'doubt-old-1',
            topic: 'Old doubt without source',
            createdTick: 50,
            severity: 1,
            involvedCrew: [],
            resolved: false,
            // source is undefined
        };

        expect(doubt.source).toBeUndefined();
    });
});

describe('AC-2: Config params exist with expected defaults', () => {
    test('doubtWitnessVent defaults to 3', () => {
        expect(CONFIG.doubtWitnessVent).toBe(3);
    });

    test('doubtWitnessLock defaults to 2', () => {
        expect(CONFIG.doubtWitnessLock).toBe(2);
    });

    test('doubtWitnessPurge defaults to 2', () => {
        expect(CONFIG.doubtWitnessPurge).toBe(2);
    });

    test('doubtWitnessOrder defaults to 1', () => {
        expect(CONFIG.doubtWitnessOrder).toBe(1);
    });

    test('doubtBurdenOrderPenalty defaults to 3', () => {
        expect(CONFIG.doubtBurdenOrderPenalty).toBe(3);
    });

    test('doubtBurdenMineThreshold defaults to 6', () => {
        expect(CONFIG.doubtBurdenMineThreshold).toBe(6);
    });

    test('doubtBurdenAgencyThreshold defaults to 8', () => {
        expect(CONFIG.doubtBurdenAgencyThreshold).toBe(8);
    });

    test('doubtResetWeight defaults to 1.5', () => {
        expect(CONFIG.doubtResetWeight).toBe(1.5);
    });

    test('doubtSpreadInterval defaults to 10', () => {
        expect(CONFIG.doubtSpreadInterval).toBe(10);
    });

    test('doubtSpreadChance defaults to 45', () => {
        expect(CONFIG.doubtSpreadChance).toBe(45);
    });

    test('doubtSuspicionDripInterval defaults to 25', () => {
        expect(CONFIG.doubtSuspicionDripInterval).toBe(25);
    });

    test('doubtSuspicionDripPerSeverity defaults to 0.7', () => {
        expect(CONFIG.doubtSuspicionDripPerSeverity).toBe(0.7);
    });

    test('doubtSuspicionDripCap defaults to 3', () => {
        expect(CONFIG.doubtSuspicionDripCap).toBe(3);
    });

    test('doubtAgencyCooldown defaults to 40', () => {
        expect(CONFIG.doubtAgencyCooldown).toBe(40);
    });
});

describe('AC-3: getCrewDoubtBurden returns correct sum', () => {
    test('returns sum of severity for unresolved doubts involving crew', () => {
        const state = makeTestState();

        // Add 3 unresolved doubts involving roughneck with severities 1, 2, 3
        state.perception.activeDoubts.push(
            {
                id: 'doubt-1',
                topic: 'test doubt 1',
                createdTick: 10,
                severity: 1,
                involvedCrew: ['roughneck' as NPCId],
                resolved: false,
            },
            {
                id: 'doubt-2',
                topic: 'test doubt 2',
                createdTick: 20,
                severity: 2,
                involvedCrew: ['roughneck' as NPCId],
                resolved: false,
            },
            {
                id: 'doubt-3',
                topic: 'test doubt 3',
                createdTick: 30,
                severity: 3,
                involvedCrew: ['roughneck' as NPCId],
                resolved: false,
            }
        );

        const burden = getCrewDoubtBurden(state, 'roughneck' as NPCId);
        expect(burden).toBe(6); // 1 + 2 + 3
    });
});

describe('AC-4: getCrewDoubtBurden ignores resolved doubts', () => {
    test('returns only sum of unresolved doubts', () => {
        const state = makeTestState();

        // Add 2 doubts: one resolved (severity 3), one unresolved (severity 2)
        state.perception.activeDoubts.push(
            {
                id: 'doubt-resolved',
                topic: 'resolved doubt',
                createdTick: 10,
                severity: 3,
                involvedCrew: ['roughneck' as NPCId],
                resolved: true, // resolved!
            },
            {
                id: 'doubt-unresolved',
                topic: 'unresolved doubt',
                createdTick: 20,
                severity: 2,
                involvedCrew: ['roughneck' as NPCId],
                resolved: false,
            }
        );

        const burden = getCrewDoubtBurden(state, 'roughneck' as NPCId);
        expect(burden).toBe(2); // only unresolved count
    });
});

describe('EC-1: Crew with no doubts', () => {
    test('returns 0 when no doubts involve the crew member', () => {
        const state = makeTestState();

        // Add a doubt that involves commander, not specialist
        state.perception.activeDoubts.push({
            id: 'doubt-commander',
            topic: 'commander doubt',
            createdTick: 10,
            severity: 3,
            involvedCrew: ['commander' as NPCId],
            resolved: false,
        });

        const burden = getCrewDoubtBurden(state, 'specialist' as NPCId);
        expect(burden).toBe(0);
    });
});

describe('EC-2: Dead crew burden calculation', () => {
    test('returns burden even for dead crew (for tracking purposes)', () => {
        const state = makeTestState();

        // Mark roughneck as dead
        state.truth.crew['roughneck' as NPCId].alive = false;

        // Add doubt involving dead roughneck
        state.perception.activeDoubts.push({
            id: 'doubt-dead-crew',
            topic: 'doubt from before death',
            createdTick: 10,
            severity: 2,
            involvedCrew: ['roughneck' as NPCId],
            resolved: false,
        });

        // Burden is still calculated (doubts persist, just won't affect behavior)
        const burden = getCrewDoubtBurden(state, 'roughneck' as NPCId);
        expect(burden).toBe(2);
    });
});
