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

/** Add unresolved doubts involving a crew member to reach a target burden */
function addDoubtsForBurden(state: KernelState, crewId: NPCId, targetBurden: number) {
    for (let i = 0; i < targetBurden; i++) {
        state.perception.activeDoubts.push({
            id: `doubt-agency-${crewId}-${i}`,
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
// Task 007: Crew Doubt Agency Actions
// =============================================================================

describe('AC-1: Commander calls meeting at high doubt', () => {
    test('commander with high doubt burden triggers emergency meeting', () => {
        const { state, rng } = makeTestState();

        const commander = state.truth.crew['commander' as NPCId];
        commander.nextRoleTick = 0;
        // Don't let normal reset logic interfere — keep suspicion low
        for (const belief of Object.values(state.perception.beliefs)) {
            belief.motherReliable = 0.7;
            belief.tamperEvidence = 0;
        }

        // Burden above agency threshold (8)
        addDoubtsForBurden(state, 'commander' as NPCId, CONFIG.doubtBurdenAgencyThreshold + 1);

        // Ensure not already in meeting
        state.truth.resetStage = 'none';

        const result = stepKernel(state, [], rng);

        // Should have triggered meeting via doubt agency
        const meetingAlert = result.events.find(
            e => e.type === 'SYSTEM_ALERT' &&
                 e.actor === 'commander' &&
                 String(e.data?.message ?? '').toLowerCase().includes('meeting')
        );
        expect(meetingAlert).toBeDefined();
        expect(state.truth.resetStage).toBe('meeting');
    });
});

describe('AC-2: Engineer runs audit at high doubt', () => {
    test('engineer at terminal with high doubt burden runs investigation', () => {
        const { state, rng } = makeTestState();

        const engineer = state.truth.crew['engineer' as NPCId];
        engineer.place = 'bridge' as PlaceId;
        engineer.nextRoleTick = 0;

        // Burden above threshold
        addDoubtsForBurden(state, 'engineer' as NPCId, CONFIG.doubtBurdenAgencyThreshold + 1);

        // Add some evidence for the investigation to find
        state.perception.evidence.push({
            id: 'ev-test-1',
            tick: state.truth.tick,
            kind: 'suppress',
            strength: 2,
            detail: 'test evidence',
        });

        const result = stepKernel(state, [], rng);

        // Should see investigation-related events from engineer
        const investigationEvent = result.events.find(
            e => e.type === 'SYSTEM_ACTION' &&
                 e.actor === 'engineer' &&
                 (e.data?.action === 'INVESTIGATION_FOUND' || e.data?.action === 'INVESTIGATION_CLEAR')
        );
        expect(investigationEvent).toBeDefined();
    });
});

describe('AC-3: Roughneck outburst at high doubt', () => {
    test('roughneck with high doubt burden has outburst near other crew', () => {
        const { state, rng } = makeTestState();

        const roughneck = state.truth.crew['roughneck' as NPCId];
        roughneck.place = 'mess' as PlaceId;
        roughneck.stress = 10; // below violence threshold so stress-based violence doesn't trigger
        roughneck.paranoia = 0;
        roughneck.nextRoleTick = 0;

        // Put another crew member in same room
        state.truth.crew['doctor' as NPCId].place = 'mess' as PlaceId;

        // Burden above threshold
        addDoubtsForBurden(state, 'roughneck' as NPCId, CONFIG.doubtBurdenAgencyThreshold + 1);

        const result = stepKernel(state, [], rng);

        // Should see broadcast comms from roughneck
        const outburst = result.events.find(
            e => e.type === 'COMMS_MESSAGE' &&
                 e.actor === 'roughneck' &&
                 String((e.data?.message as any)?.kind ?? '').includes('broadcast')
        );
        expect(outburst).toBeDefined();
    });
});

describe('AC-4: Actions have cooldowns', () => {
    test('commander doubt meeting has cooldown', () => {
        const { state, rng } = makeTestState();

        const commander = state.truth.crew['commander' as NPCId];
        commander.nextRoleTick = 0;

        // Set low suspicion so normal reset doesn't interfere
        for (const belief of Object.values(state.perception.beliefs)) {
            belief.motherReliable = 0.7;
            belief.tamperEvidence = 0;
        }

        addDoubtsForBurden(state, 'commander' as NPCId, CONFIG.doubtBurdenAgencyThreshold + 1);
        state.truth.resetStage = 'none';

        // First step triggers meeting
        stepKernel(state, [], rng);
        expect(state.truth.resetStage).toBe('meeting');

        // Reset stage back to none to allow re-trigger attempt
        state.truth.resetStage = 'none';
        state.truth.resetStageTick = 0;

        // Second step — should NOT re-trigger (cooldown)
        const result2 = stepKernel(state, [], rng);

        const meetingAlerts = result2.events.filter(
            e => e.type === 'SYSTEM_ALERT' &&
                 e.actor === 'commander' &&
                 String(e.data?.message ?? '').toLowerCase().includes('emergency meeting')
        );
        // No new doubt-triggered meeting due to cooldown
        expect(meetingAlerts).toHaveLength(0);
    });
});

describe('AC-5: Actions produce visible events', () => {
    test('doubt agency action appears in kernel output events', () => {
        const { state, rng } = makeTestState();

        const roughneck = state.truth.crew['roughneck' as NPCId];
        roughneck.place = 'mess' as PlaceId;
        roughneck.stress = 10;
        roughneck.paranoia = 0;
        roughneck.nextRoleTick = 0;

        state.truth.crew['doctor' as NPCId].place = 'mess' as PlaceId;

        addDoubtsForBurden(state, 'roughneck' as NPCId, CONFIG.doubtBurdenAgencyThreshold + 1);

        const result = stepKernel(state, [], rng);

        // Events array should contain the doubt agency event
        expect(result.events.length).toBeGreaterThan(0);
        const agencyEvent = result.events.find(
            e => (e.actor === 'roughneck' || e.actor === 'commander' || e.actor === 'engineer') &&
                 (e.type === 'COMMS_MESSAGE' || e.type === 'SYSTEM_ALERT' || e.type === 'SYSTEM_ACTION')
        );
        expect(agencyEvent).toBeDefined();
    });
});

describe('EC-1: Dead crew dont act', () => {
    test('dead crew member with high doubt burden does not trigger agency', () => {
        const { state, rng } = makeTestState();

        // Kill commander
        state.truth.crew['commander' as NPCId].alive = false;
        state.truth.crew['commander' as NPCId].hp = 0;
        state.truth.crew['commander' as NPCId].nextRoleTick = 0;

        addDoubtsForBurden(state, 'commander' as NPCId, CONFIG.doubtBurdenAgencyThreshold + 5);

        const result = stepKernel(state, [], rng);

        // No meeting triggered by dead commander
        const meetingAlert = result.events.find(
            e => e.type === 'SYSTEM_ALERT' &&
                 e.actor === 'commander' &&
                 String(e.data?.message ?? '').toLowerCase().includes('meeting')
        );
        expect(meetingAlert).toBeUndefined();
    });
});

describe('EC-2: Crew in panic dont act on doubt', () => {
    test('panicking crew member does not trigger doubt agency', () => {
        const { state, rng } = makeTestState();

        const roughneck = state.truth.crew['roughneck' as NPCId];
        roughneck.place = 'mess' as PlaceId;
        roughneck.stress = 10;
        roughneck.paranoia = 0;
        roughneck.nextRoleTick = 0;
        // Set panic
        roughneck.panicUntilTick = state.truth.tick + 100;

        state.truth.crew['doctor' as NPCId].place = 'mess' as PlaceId;

        addDoubtsForBurden(state, 'roughneck' as NPCId, CONFIG.doubtBurdenAgencyThreshold + 3);

        const result = stepKernel(state, [], rng);

        // No doubt outburst from panicking roughneck
        const outburst = result.events.find(
            e => e.type === 'COMMS_MESSAGE' &&
                 e.actor === 'roughneck' &&
                 String((e.data?.message as any)?.text ?? '').toLowerCase().includes('trust')
        );
        expect(outburst).toBeUndefined();
    });
});

describe('EC-3: Meeting attendance overrides doubt agency', () => {
    test('crew in meeting does not trigger doubt agency action', () => {
        const { state, rng } = makeTestState();

        // Force meeting state
        state.truth.resetStage = 'meeting';
        state.truth.resetStageTick = state.truth.tick;

        const roughneck = state.truth.crew['roughneck' as NPCId];
        roughneck.place = 'mess' as PlaceId;
        roughneck.stress = 10;
        roughneck.paranoia = 0;
        roughneck.nextRoleTick = 0;

        state.truth.crew['doctor' as NPCId].place = 'mess' as PlaceId;

        addDoubtsForBurden(state, 'roughneck' as NPCId, CONFIG.doubtBurdenAgencyThreshold + 3);

        const result = stepKernel(state, [], rng);

        // No doubt outburst during meeting
        const outburst = result.events.find(
            e => e.type === 'COMMS_MESSAGE' &&
                 e.actor === 'roughneck' &&
                 String((e.data?.message as any)?.text ?? '').toLowerCase().includes('trust')
        );
        expect(outburst).toBeUndefined();
    });
});
