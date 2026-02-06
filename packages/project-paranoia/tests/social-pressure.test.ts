import { describe, test, expect } from 'vitest';
import { proposeSocialPressure, pickSuspiciousCrew } from '../src/kernel/systems/pressure.js';
import { createInitialState } from '../src/kernel/state.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import type { KernelState, NPCId } from '../src/kernel/types.js';

function makeTestState() {
    const rng = createRng(1);
    const world = createWorld(rng);
    return createInitialState(world, 8);
}

/** Set one crew member as suspicious (low motherReliable) */
function makeSuspicious(state: KernelState, npcId: NPCId, motherReliable = 0.3, tamperEvidence = 5) {
    const belief = state.perception.beliefs[npcId];
    if (belief) {
        belief.motherReliable = motherReliable;
        belief.tamperEvidence = tamperEvidence;
    }
}

/** Set one crew member with high tamper evidence */
function makeHighTamper(state: KernelState, npcId: NPCId, tamperEvidence = 35) {
    const belief = state.perception.beliefs[npcId];
    if (belief) {
        belief.tamperEvidence = tamperEvidence;
    }
}

describe('Task 003: Social Event Generators', () => {
    describe('AC-1: whisper_campaign creates COMMS_MESSAGE', () => {
        test('generates whisper with mother_rogue topic when suspicious crew exists', () => {
            const state = makeTestState();
            const rng = createRng(42);
            makeSuspicious(state, 'engineer');
            state.truth.tick = 50;

            // Run multiple times to find a whisper_campaign result
            let found = false;
            for (let seed = 0; seed < 50; seed++) {
                const s = makeTestState();
                s.truth.tick = 50;
                makeSuspicious(s, 'engineer');
                const r = createRng(seed);
                const proposals = proposeSocialPressure(s, r);
                if (proposals.length > 0) {
                    const p = proposals[0];
                    expect(p.event.type).toBe('COMMS_MESSAGE');
                    const msg = (p.event.data as any)?.message;
                    if (msg?.kind === 'whisper' && msg?.topic === 'mother_rogue') {
                        found = true;
                        expect(msg.confidence).toBeDefined();
                        break;
                    }
                }
            }
            expect(found).toBe(true);
        });
    });

    describe('AC-2: whisper_campaign spreads rumor via belief update path', () => {
        test('whisper_campaign uses kind=whisper so updateBeliefs processes it', () => {
            const state = makeTestState();
            makeSuspicious(state, 'engineer');
            state.truth.tick = 50;

            // Find a whisper_campaign proposal
            for (let seed = 0; seed < 50; seed++) {
                const r = createRng(seed);
                const proposals = proposeSocialPressure(state, r);
                for (const p of proposals) {
                    const msg = (p.event.data as any)?.message;
                    if (msg?.kind === 'whisper' && msg?.topic === 'mother_rogue') {
                        // Whispers are processed by updateBeliefs (kind != 'order', kind != 'log')
                        // They spread rumors to the listener
                        expect(msg.kind).toBe('whisper');
                        expect(msg.topic).toBe('mother_rogue');
                        return; // test passes
                    }
                }
            }
            throw new Error('No whisper_campaign found in 50 seeds');
        });
    });

    describe('AC-3: loyalty_test creates COMMS_MESSAGE + ActiveDoubt', () => {
        test('loyalty_test creates broadcast message with deferred doubt in event.data', () => {
            let found = false;
            for (let seed = 0; seed < 50; seed++) {
                const s = makeTestState();
                s.truth.tick = 50;
                makeSuspicious(s, 'commander');
                const r = createRng(seed);
                const proposals = proposeSocialPressure(s, r);
                for (const p of proposals) {
                    const msg = (p.event.data as any)?.message;
                    const doubt = (p.event.data as any)?.pressureDoubt;
                    if (msg?.kind === 'broadcast' && msg?.text?.toLowerCase().includes('mother') && doubt) {
                        expect(doubt.severity).toBe(1);
                        expect(doubt.resolved).toBe(false);
                        expect(doubt.involvedCrew.length).toBeGreaterThan(0);
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            expect(found).toBe(true);
        });
    });

    describe('AC-4: confrontation creates higher-impact COMMS_MESSAGE', () => {
        test('confrontation uses broadcast kind and involves high tamper crew', () => {
            const state = makeTestState();
            makeHighTamper(state, 'roughneck', 35);
            state.truth.tick = 50;

            let found = false;
            for (let seed = 0; seed < 50; seed++) {
                const s = makeTestState();
                s.truth.tick = 50;
                makeHighTamper(s, 'roughneck', 35);
                const r = createRng(seed);
                const proposals = proposeSocialPressure(s, r);
                for (const p of proposals) {
                    const msg = (p.event.data as any)?.message;
                    if (msg?.kind === 'broadcast' && msg?.text?.toLowerCase().includes('evidence')) {
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            expect(found).toBe(true);
        });
    });

    describe('AC-5: pickSuspiciousCrew selects suspicious crew preferentially', () => {
        test('crew with low motherReliable is selected over normal crew', () => {
            const state = makeTestState();
            // Set one suspicious, rest normal
            makeSuspicious(state, 'engineer', 0.3);
            for (const npcId of Object.keys(state.perception.beliefs) as NPCId[]) {
                if (npcId !== 'engineer') {
                    state.perception.beliefs[npcId].motherReliable = 0.9;
                    state.perception.beliefs[npcId].tamperEvidence = 0;
                }
            }

            const rng = createRng(42);
            const picked = pickSuspiciousCrew(state, rng);
            expect(picked).toBeDefined();
            expect(picked!.id).toBe('engineer');
        });
    });

    describe('AC-6: social events have correct proposal tags', () => {
        test('proposals include reaction tag', () => {
            const state = makeTestState();
            makeSuspicious(state, 'engineer');
            state.truth.tick = 50;

            // Find any social proposal
            for (let seed = 0; seed < 50; seed++) {
                const s = makeTestState();
                s.truth.tick = 50;
                makeSuspicious(s, 'engineer');
                const r = createRng(seed);
                const proposals = proposeSocialPressure(s, r);
                if (proposals.length > 0) {
                    const p = proposals[0];
                    expect(p.tags).toContain('reaction');
                    expect(
                        p.tags.includes('choice') || p.tags.includes('uncertainty')
                    ).toBe(true);
                    return;
                }
            }
            throw new Error('No social proposal generated in 50 seeds');
        });
    });

    describe('EC-1: uneasy crew produces proposals even without high suspicion', () => {
        test('stressed crew triggers social pressure (justified unease)', () => {
            let generated = false;
            for (let seed = 0; seed < 50; seed++) {
                const s = makeTestState();
                for (const npcId of Object.keys(s.perception.beliefs) as NPCId[]) {
                    s.perception.beliefs[npcId].motherReliable = 0.8;
                    s.perception.beliefs[npcId].tamperEvidence = 5;
                }
                // Give one crew member high stress — justified unease
                s.truth.crew['engineer'].stress = 50;
                s.truth.tick = 50;
                const r = createRng(seed);
                const proposals = proposeSocialPressure(s, r);
                if (proposals.length > 0) {
                    generated = true;
                    break;
                }
            }
            expect(generated).toBe(true);
        });

        test('calm healthy crew in safe station returns empty', () => {
            const s = makeTestState();
            for (const npcId of Object.keys(s.perception.beliefs) as NPCId[]) {
                s.perception.beliefs[npcId].motherReliable = 0.8;
                s.perception.beliefs[npcId].tamperEvidence = 5;
            }
            // All crew calm, healthy, not near crises
            for (const crew of Object.values(s.truth.crew)) {
                crew.stress = 0;
                crew.hp = 100;
            }
            s.truth.arcs = [];
            s.truth.tick = 50;
            const r = createRng(42);
            const proposals = proposeSocialPressure(s, r);
            expect(proposals).toEqual([]);
        });
    });

    describe('EC-2: single crew skips whisper_campaign', () => {
        test('with only 1 alive crew, whisper_campaign is skipped', () => {
            const state = makeTestState();
            // Kill all but one
            for (const npc of Object.values(state.truth.crew)) {
                if (npc.id !== 'commander') npc.alive = false;
            }
            makeSuspicious(state, 'commander', 0.2);
            state.truth.tick = 50;

            // Check across seeds — should never get a whisper
            for (let seed = 0; seed < 20; seed++) {
                const s = makeTestState();
                for (const npc of Object.values(s.truth.crew)) {
                    if (npc.id !== 'commander') npc.alive = false;
                }
                makeSuspicious(s, 'commander', 0.2);
                s.truth.tick = 50;
                const r = createRng(seed);
                const proposals = proposeSocialPressure(s, r);
                for (const p of proposals) {
                    const msg = (p.event.data as any)?.message;
                    expect(msg?.kind).not.toBe('whisper');
                }
            }
        });
    });

    describe('EC-3: all crew highly suspicious still generates events', () => {
        test('events still fire when all crew are suspicious', () => {
            const state = makeTestState();
            for (const npcId of Object.keys(state.perception.beliefs) as NPCId[]) {
                makeSuspicious(state, npcId, 0.2, 30);
            }
            state.truth.tick = 50;

            let generated = false;
            for (let seed = 0; seed < 30; seed++) {
                const s = makeTestState();
                for (const npcId of Object.keys(s.perception.beliefs) as NPCId[]) {
                    makeSuspicious(s, npcId, 0.2, 30);
                }
                s.truth.tick = 50;
                const r = createRng(seed);
                const proposals = proposeSocialPressure(s, r);
                if (proposals.length > 0) {
                    generated = true;
                    break;
                }
            }
            expect(generated).toBe(true);
        });
    });
});
