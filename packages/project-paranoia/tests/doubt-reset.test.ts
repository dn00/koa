import { describe, test, expect } from 'vitest';
import { createInitialState } from '../src/kernel/state.js';
import { stepKernel } from '../src/kernel/kernel.js';
import { createRng } from '../src/core/rng.js';
import { createWorld } from '../src/core/world.js';
import { CONFIG } from '../src/config.js';
import type { NPCId, PlaceId } from '../src/core/types.js';
import type { KernelState } from '../src/kernel/types.js';

function makeTestState(seed = 12345): { state: KernelState; rng: ReturnType<typeof createRng> } {
    const rng = createRng(seed);
    const world = createWorld(rng);
    return { state: createInitialState(world, 10), rng };
}

/** Set motherReliable and tamperEvidence to produce a target suspicion level.
 *  Suspicion per crew = (tamperEvidence/100)*40 + (1-motherReliable)*35 + rumor*25
 *  With no rumors, we use distrust+tamper to reach target.
 */
function setSuspicion(state: KernelState, target: number) {
    // All alive crew get same beliefs → suspicion = per-crew score
    // Use distrust = target/35 → motherReliable = 1 - target/35 (clamped)
    // But that only gives 35 max. Need tamperEvidence too.
    // Formula: suspicion = (tamperEvidence/100)*40 + (1-motherReliable)*35
    // Set motherReliable such that distrust gives ~half, tamper gives ~half
    const distrustPortion = Math.min(target, 35);
    const tamperPortion = target - distrustPortion;

    const motherReliable = Math.max(0, 1 - distrustPortion / 35);
    const tamperEvidence = Math.min(100, (tamperPortion / 40) * 100);

    for (const npc of Object.values(state.truth.crew)) {
        if (!npc.alive) continue;
        const belief = state.perception.beliefs[npc.id];
        if (belief) {
            belief.motherReliable = motherReliable;
            belief.tamperEvidence = tamperEvidence;
            belief.rumors = {};
        }
    }
}

/** Add unresolved doubts to all living crew to produce avg burden */
function addDoubtsForAvgBurden(state: KernelState, avgBurden: number) {
    const aliveCrew = Object.values(state.truth.crew).filter(c => c.alive);
    for (const npc of aliveCrew) {
        for (let i = 0; i < avgBurden; i++) {
            state.perception.activeDoubts.push({
                id: `doubt-reset-${npc.id}-${i}`,
                topic: `test doubt ${i}`,
                createdTick: 1,
                severity: 1,
                involvedCrew: [npc.id],
                resolved: false,
                source: 'witness',
            });
        }
    }
}

// =============================================================================
// Task 006: Doubt-Driven Reset Acceleration
// =============================================================================

describe('AC-1: High doubt accelerates reset', () => {
    test('effective suspicion crosses meeting threshold with doubt contribution', () => {
        const { state, rng } = makeTestState();

        // Set raw suspicion to 38 (below meeting threshold of 42)
        setSuspicion(state, 38);

        // Add avg doubt burden of 10 → effective = 38 + 10*0.5 = 43 > 42
        addDoubtsForAvgBurden(state, 10);

        // Commander must be alive and able to evaluate reset
        const commander = state.truth.crew['commander' as NPCId];
        commander.nextRoleTick = 0; // can act

        // Step kernel — commander evaluates reset
        stepKernel(state, [], rng);

        // Should have escalated to at least 'meeting'
        expect(['meeting', 'restrictions', 'countdown']).toContain(state.truth.resetStage);
    });
});

describe('AC-2: Zero doubts = existing behavior', () => {
    test('suspicion 38 with no doubts does not trigger meeting', () => {
        const { state, rng } = makeTestState();

        // Set raw suspicion to 38 (below meeting threshold of 42)
        setSuspicion(state, 38);

        // No doubts
        const commander = state.truth.crew['commander' as NPCId];
        commander.nextRoleTick = 0;

        stepKernel(state, [], rng);

        // With suspicion=38, should be at 'whispers' (>=30) but NOT meeting (>=42)
        expect(state.truth.resetStage).toBe('whispers');
    });
});

describe('AC-3: De-escalation when doubt drops', () => {
    test('resolving doubts + low suspicion triggers de-escalation', () => {
        const { state, rng } = makeTestState();

        // Start in meeting stage
        state.truth.resetStage = 'meeting';
        state.truth.resetStageTick = 0;

        // Set low suspicion (below de-escalation threshold of 25)
        setSuspicion(state, 22);

        // No doubts → effective suspicion = 22 < 25 deescalation threshold
        const commander = state.truth.crew['commander' as NPCId];
        commander.nextRoleTick = 0;

        stepKernel(state, [], rng);

        expect(state.truth.resetStage).toBe('none');
    });
});

describe('EC-1: All crew dead', () => {
    test('all dead crew means no reset progression', () => {
        const { state, rng } = makeTestState();

        // Kill all crew
        for (const npc of Object.values(state.truth.crew)) {
            npc.alive = false;
            npc.hp = 0;
        }

        // High suspicion setup
        setSuspicion(state, 50);

        // stepKernel will end with COMPANY SCENARIO since all crew dead
        const result = stepKernel(state, [], rng);

        // Game should end with all crew dead ending
        expect(state.truth.ending).toBe('COMPANY SCENARIO');
    });
});

describe('EC-2: Only commander alive', () => {
    test('solo commander doubt burden is the average', () => {
        const { state, rng } = makeTestState();

        // Kill everyone except commander
        for (const npc of Object.values(state.truth.crew)) {
            if (npc.id !== 'commander') {
                npc.alive = false;
                npc.hp = 0;
            }
        }

        // Set suspicion just below meeting threshold
        setSuspicion(state, 38);

        // Add high doubt burden to commander only → avg = commander's burden
        for (let i = 0; i < 12; i++) {
            state.perception.activeDoubts.push({
                id: `doubt-commander-solo-${i}`,
                topic: `test doubt ${i}`,
                createdTick: 1,
                severity: 1,
                involvedCrew: ['commander' as NPCId],
                resolved: false,
                source: 'witness',
            });
        }

        // effective = 38 + 12*0.5 = 44 > 42 → meeting
        const commander = state.truth.crew['commander' as NPCId];
        commander.nextRoleTick = 0;

        stepKernel(state, [], rng);

        expect(['meeting', 'restrictions', 'countdown']).toContain(state.truth.resetStage);
    });
});
