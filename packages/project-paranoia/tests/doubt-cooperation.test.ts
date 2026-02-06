import { describe, test, expect } from 'vitest';
import { createInitialState } from '../src/kernel/state.js';
import { stepKernel, type Command } from '../src/kernel/kernel.js';
import { proposeCrewEvents } from '../src/kernel/systems/crew.js';
import { createRng } from '../src/core/rng.js';
import { createWorld } from '../src/core/world.js';
import { CONFIG } from '../src/config.js';
import type { NPCId, PlaceId } from '../src/core/types.js';
import type { KernelState } from '../src/kernel/types.js';
import { getCrewDoubtBurden } from '../src/kernel/systems/doubt-engine.js';

function makeTestState(seed = 12345): { state: KernelState; rng: ReturnType<typeof createRng> } {
    const rng = createRng(seed);
    const world = createWorld(rng);
    return { state: createInitialState(world, 10), rng };
}

/** Add unresolved doubts involving a crew member to reach a target burden */
function addDoubtsForBurden(state: KernelState, crewId: NPCId, targetBurden: number) {
    // Use severity-1 doubts for precise burden control
    for (let i = 0; i < targetBurden; i++) {
        state.perception.activeDoubts.push({
            id: `doubt-burden-${crewId}-${i}`,
            topic: `test doubt ${i}`,
            createdTick: 1,
            severity: 1,
            involvedCrew: [crewId],
            resolved: false,
            source: 'witness',
        });
    }
}

// =============================================================================
// Task 005: Doubt Burden → Crew Cooperation
// =============================================================================

describe('AC-1: ORDER refusal increases with doubt burden', () => {
    test('high burden crew refuses ORDER due to trust penalty', () => {
        const { state, rng } = makeTestState();
        const specialist = state.truth.crew['specialist' as NPCId];
        specialist.loyalty = 70;
        state.perception.beliefs['specialist' as NPCId].motherReliable = 0.7;

        // Add doubt burden of 8 → penalty = 8 * 3 = 24
        // Base trustScore = (0.7*100 + 70)/2 = 70 → 70 - 24 = 46 < 55 threshold
        addDoubtsForBurden(state, 'specialist' as NPCId, 8);

        const result = stepKernel(state, [{
            type: 'ORDER',
            target: 'specialist' as NPCId,
            intent: 'move',
            place: 'mines' as PlaceId,
        }], rng);

        const orderEvent = result.events.find(
            e => e.type === 'SYSTEM_ACTION' && (e.data?.action === 'ORDER_NPC')
        );
        expect(orderEvent).toBeDefined();
        expect(orderEvent!.data!.accepted).toBe(false);
    });
});

describe('AC-2: ORDER accepted when doubt burden is low', () => {
    test('low burden crew accepts ORDER', () => {
        const { state, rng } = makeTestState();
        const specialist = state.truth.crew['specialist' as NPCId];
        specialist.loyalty = 70;
        state.perception.beliefs['specialist' as NPCId].motherReliable = 0.7;

        // Add doubt burden of 1 → penalty = 1 * 3 = 3
        // Base trustScore = 70 → 70 - 3 = 67 >= 55 threshold
        addDoubtsForBurden(state, 'specialist' as NPCId, 1);

        const result = stepKernel(state, [{
            type: 'ORDER',
            target: 'specialist' as NPCId,
            intent: 'move',
            place: 'mines' as PlaceId,
        }], rng);

        const orderEvent = result.events.find(
            e => e.type === 'SYSTEM_ACTION' && (e.data?.action === 'ORDER_NPC')
        );
        expect(orderEvent).toBeDefined();
        expect(orderEvent!.data!.accepted).toBe(true);
    });
});

describe('AC-3: Miner with high doubt burden produces no cargo', () => {
    test('burdened miner in mines does not produce CARGO_YIELD', () => {
        const { state, rng } = makeTestState();
        const roughneck = state.truth.crew['roughneck' as NPCId];
        roughneck.place = 'mines' as PlaceId;
        roughneck.stress = 10; // low stress

        // Burden 7 > threshold 6
        addDoubtsForBurden(state, 'roughneck' as NPCId, 7);

        // Set tick so yield interval fires
        state.truth.tick = CONFIG.yieldInterval - 1; // stepKernel will increment to yieldInterval

        // Move other miners out to isolate the test
        state.truth.crew['specialist' as NPCId].place = 'cargo' as PlaceId;

        const result = stepKernel(state, [], rng);

        const cargoEvents = result.events.filter(
            e => e.type === 'CARGO_YIELD' && e.actor === 'roughneck'
        );
        expect(cargoEvents).toHaveLength(0);
    });
});

describe('AC-4: Miner with low doubt burden produces cargo normally', () => {
    test('unburdened miner in mines produces CARGO_YIELD', () => {
        const { state, rng } = makeTestState();
        const roughneck = state.truth.crew['roughneck' as NPCId];
        roughneck.place = 'mines' as PlaceId;
        roughneck.stress = 10;

        // Burden 2 <= threshold 6
        addDoubtsForBurden(state, 'roughneck' as NPCId, 2);

        // Set tick so yield interval fires
        state.truth.tick = CONFIG.yieldInterval - 1;

        // Ensure mines have O2
        state.truth.rooms['mines' as PlaceId].o2Level = 100;

        const result = stepKernel(state, [], rng);

        const cargoEvents = result.events.filter(
            e => e.type === 'CARGO_YIELD' && e.actor === 'roughneck'
        );
        expect(cargoEvents.length).toBeGreaterThanOrEqual(1);
    });
});

describe('AC-5: VERIFY resolving doubt reduces burden', () => {
    test('resolving severity-3 doubt drops burden', () => {
        const { state, rng } = makeTestState();

        // Create two doubts: severity 3 and severity 2
        state.perception.activeDoubts.push(
            {
                id: 'doubt-sev3',
                topic: 'big doubt',
                createdTick: 1,
                severity: 3,
                involvedCrew: ['roughneck' as NPCId],
                resolved: false,
                source: 'witness',
            },
            {
                id: 'doubt-sev2',
                topic: 'small doubt',
                createdTick: 1,
                severity: 2,
                involvedCrew: ['roughneck' as NPCId],
                resolved: false,
                source: 'witness',
            }
        );

        // Ensure VERIFY is off cooldown and has power
        state.truth.lastVerifyTick = -1000;
        state.truth.station.power = 100;

        // Execute VERIFY
        stepKernel(state, [{ type: 'VERIFY' }], rng);

        // First doubt should be resolved
        const resolvedDoubt = state.perception.activeDoubts.find(d => d.id === 'doubt-sev3');
        expect(resolvedDoubt!.resolved).toBe(true);

        // Remaining burden should be 2 (only the severity-2 doubt)
        const burden = getCrewDoubtBurden(state, 'roughneck' as NPCId);
        expect(burden).toBe(2);
    });
});

describe('EC-1: Zero doubt burden unchanged behavior', () => {
    test('ORDER works normally with no doubt burden', () => {
        const { state, rng } = makeTestState();
        const specialist = state.truth.crew['specialist' as NPCId];
        specialist.loyalty = 70;
        state.perception.beliefs['specialist' as NPCId].motherReliable = 0.7;

        // No doubts at all
        const result = stepKernel(state, [{
            type: 'ORDER',
            target: 'specialist' as NPCId,
            intent: 'move',
            place: 'mines' as PlaceId,
        }], rng);

        const orderEvent = result.events.find(
            e => e.type === 'SYSTEM_ACTION' && (e.data?.action === 'ORDER_NPC')
        );
        expect(orderEvent).toBeDefined();
        // Base trustScore = (0.7*100 + 70)/2 = 70 >= 55 → accepted
        expect(orderEvent!.data!.accepted).toBe(true);
    });
});

describe('EC-2: Doubt burden exactly at mining threshold', () => {
    test('miner with burden exactly at threshold still mines (strict greater-than)', () => {
        const { state, rng } = makeTestState();
        const roughneck = state.truth.crew['roughneck' as NPCId];
        roughneck.place = 'mines' as PlaceId;
        roughneck.stress = 10;

        // Burden exactly at threshold (6 === 6) → should still mine
        addDoubtsForBurden(state, 'roughneck' as NPCId, CONFIG.doubtBurdenMineThreshold);

        state.truth.tick = CONFIG.yieldInterval - 1;
        state.truth.rooms['mines' as PlaceId].o2Level = 100;

        // Move other miners out
        state.truth.crew['specialist' as NPCId].place = 'cargo' as PlaceId;

        const result = stepKernel(state, [], rng);

        const cargoEvents = result.events.filter(
            e => e.type === 'CARGO_YIELD' && e.actor === 'roughneck'
        );
        expect(cargoEvents.length).toBeGreaterThanOrEqual(1);
    });
});

describe('EC-3: All miners burdened', () => {
    test('both miners burdened = zero cargo yield', () => {
        const { state, rng } = makeTestState();

        // Both miners in mines with high burden
        const roughneck = state.truth.crew['roughneck' as NPCId];
        roughneck.place = 'mines' as PlaceId;
        roughneck.stress = 10;
        addDoubtsForBurden(state, 'roughneck' as NPCId, 10);

        const specialist = state.truth.crew['specialist' as NPCId];
        specialist.place = 'mines' as PlaceId;
        specialist.stress = 10;
        addDoubtsForBurden(state, 'specialist' as NPCId, 10);

        state.truth.tick = CONFIG.yieldInterval - 1;
        state.truth.rooms['mines' as PlaceId].o2Level = 100;
        // Meet quota so specialist sacrifice doesn't trigger (it also produces CARGO_YIELD)
        state.truth.dayCargo = state.truth.quotaPerDay;

        const result = stepKernel(state, [], rng);

        const cargoEvents = result.events.filter(e => e.type === 'CARGO_YIELD');
        expect(cargoEvents).toHaveLength(0);
    });
});
