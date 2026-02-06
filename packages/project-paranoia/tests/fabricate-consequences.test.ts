import { describe, test, expect } from 'vitest';
import { topicToSubject } from '../src/kernel/systems/comms.js';
import { proposeSocialPressure } from '../src/kernel/systems/pressure.js';
import { proposeCrewEvents } from '../src/kernel/systems/crew.js';
import { stepKernel } from '../src/kernel/kernel.js';
import { createInitialState } from '../src/kernel/state.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import { CONFIG } from '../src/config.js';
import type { KernelState, NPCId } from '../src/kernel/types.js';

function makeTestState(): KernelState {
    const rng = createRng(1);
    const world = createWorld(rng);
    return createInitialState(world, 8);
}

describe('Task 001: Fabricate Visible Consequences', () => {
    describe('AC-1: Fabrication rumor has target place', () => {
        test('fabrication rumor has place set to target current location', () => {
            const state = makeTestState();
            const rng = createRng(42);

            // Place roughneck in mines
            state.truth.crew['roughneck'].place = 'mines';
            state.truth.tick = 49; // stepKernel will advance to 50

            // Issue fabricate command
            const output = stepKernel(state, [{ type: 'FABRICATE', target: 'roughneck' }], rng);

            // Find the fabrication rumor in perception.rumors
            const fabRumor = output.state.perception.rumors.find(
                r => r.topic === 'roughneck_hostile'
            );
            expect(fabRumor).toBeDefined();
            expect(fabRumor!.place).toBe('mines');
        });
    });

    describe('AC-2: topicToSubject parses _hostile topics', () => {
        test('topicToSubject returns npc id for _hostile suffix', () => {
            expect(topicToSubject('roughneck_hostile')).toBe('roughneck');
            expect(topicToSubject('commander_hostile')).toBe('commander');
            expect(topicToSubject('engineer_hostile')).toBe('engineer');
            expect(topicToSubject('doctor_hostile')).toBe('doctor');
            expect(topicToSubject('specialist_hostile')).toBe('specialist');
        });

        test('existing topics still work', () => {
            expect(topicToSubject('commander_reset')).toBe('commander');
            expect(topicToSubject('engineer_sabotage')).toBe('engineer');
            expect(topicToSubject('roughneck_violence')).toBe('roughneck');
        });

        test('unknown topics still return null', () => {
            expect(topicToSubject('random_topic')).toBeNull();
            expect(topicToSubject('mother_rogue')).toBeNull();
        });
    });

    describe('AC-3: Grudge whispers fire from high-grudge crew', () => {
        test('proposeSocialPressure generates grudge_whisper when crew has high grudge', () => {
            let found = false;
            for (let seed = 0; seed < 100; seed++) {
                const state = makeTestState();
                state.truth.tick = 50;

                // Set up high grudge against roughneck for multiple crew
                for (const npcId of ['commander', 'engineer', 'doctor', 'specialist'] as NPCId[]) {
                    const belief = state.perception.beliefs[npcId];
                    if (belief) {
                        belief.crewGrudge['roughneck'] = 20; // above grudgeWhisperThreshold (15)
                    }
                }
                // At least one crew needs to be suspicious for proposeSocialPressure to generate
                state.perception.beliefs['engineer'].motherReliable = 0.3;

                const rng = createRng(seed);
                const proposals = proposeSocialPressure(state, rng);

                for (const p of proposals) {
                    const msg = (p.event.data as any)?.message;
                    if (msg?.topic?.endsWith('_hostile') && msg?.kind === 'whisper') {
                        found = true;
                        expect(msg.topic).toBe('roughneck_hostile');
                        break;
                    }
                }
                if (found) break;
            }
            expect(found).toBe(true);
        });
    });

    describe('AC-4: Target stress cascade reaches role action', () => {
        test('fabrication pushes roughneck past violence threshold', () => {
            const state = makeTestState();
            const rng = createRng(42);

            // Pre-set roughneck stress to 61 (below violence threshold of 70)
            // +15 from fabrication = 76, minus safe-room decay -1 = 75
            state.truth.crew['roughneck'].stress = 61;
            state.truth.crew['roughneck'].place = 'mines';
            // Place another crew member in the same room for violence target
            state.truth.crew['specialist'].place = 'mines';
            state.truth.tick = 49;

            // Issue fabricate command
            const output = stepKernel(state, [{ type: 'FABRICATE', target: 'roughneck' }], rng);

            // After fabrication, roughneck stress should be 61 + 15 - 1(safe decay) = 75
            const roughneck = output.state.truth.crew['roughneck'];
            expect(roughneck.stress).toBeGreaterThanOrEqual(75);
            // Roughneck should now be above violence threshold (70)
            expect(roughneck.stress).toBeGreaterThanOrEqual(CONFIG.roughneckViolenceStress);
        });
    });

    describe('EC-1: Fabricate dead crew', () => {
        test('rumor spreads but no target stress spike for dead crew', () => {
            const state = makeTestState();
            const rng = createRng(42);

            // Kill roughneck
            state.truth.crew['roughneck'].alive = false;
            state.truth.crew['roughneck'].hp = 0;
            state.truth.crew['roughneck'].place = 'mines';
            state.truth.tick = 49;

            const prevStress = state.truth.crew['roughneck'].stress;

            // Issue fabricate command
            const output = stepKernel(state, [{ type: 'FABRICATE', target: 'roughneck' }], rng);

            // Rumor should still exist
            const fabRumor = output.state.perception.rumors.find(
                r => r.topic === 'roughneck_hostile'
            );
            expect(fabRumor).toBeDefined();

            // Dead crew stress should not have changed
            expect(output.state.truth.crew['roughneck'].stress).toBe(prevStress);

            // Other crew should still have grudge increased
            const cmdBelief = output.state.perception.beliefs['commander'];
            expect(cmdBelief.crewGrudge['roughneck']).toBeGreaterThan(0);
        });
    });

    describe('EC-2: Grudge whisper capped per target', () => {
        test('max 1 grudge whisper per target per proposeSocialPressure call', () => {
            // Even with many crew having high grudge, only 1 whisper per target
            let found = false;
            for (let seed = 0; seed < 100; seed++) {
                const state = makeTestState();
                state.truth.tick = 50;

                // All crew have high grudge against roughneck
                for (const npcId of ['commander', 'engineer', 'doctor', 'specialist'] as NPCId[]) {
                    const belief = state.perception.beliefs[npcId];
                    if (belief) {
                        belief.crewGrudge['roughneck'] = 30;
                    }
                }
                state.perception.beliefs['engineer'].motherReliable = 0.3;

                const rng = createRng(seed);
                const proposals = proposeSocialPressure(state, rng);

                // Count grudge whispers against roughneck
                const grudgeWhispers = proposals.filter(p => {
                    const msg = (p.event.data as any)?.message;
                    return msg?.topic === 'roughneck_hostile' && msg?.kind === 'whisper';
                });

                if (grudgeWhispers.length > 0) {
                    found = true;
                    expect(grudgeWhispers.length).toBeLessThanOrEqual(1);
                    break;
                }
            }
            expect(found).toBe(true);
        });
    });
});
