
import { createRng } from './kernel/rng.js';
import { createWorld } from './world.js';
import { WINDOWS } from './types.js';
import { simulateRoutines, initNPCStates } from './sim.js';
import { deriveEvidence } from './evidence.js';
import type { CaseConfig } from './types.js';

console.log('Running Active Red Herring Test...');

const rng = createRng(12345);
const world = createWorld(rng);
const npcStates = initNPCStates(world);

console.log('Simulating routines...');
const allEvents: any[] = [];
for (const w of ['W1', 'W2', 'W3', 'W4']) {
    const events = simulateRoutines(world, npcStates, w as any, 0, rng);
    allEvents.push(...events);
}
const events = allEvents;
console.log(`Generated ${events.length} events.`);

const activityEvents = events.filter((e: any) => e.type === 'ACTIVITY_STARTED');
const traceEvents = events.filter((e: any) => e.type === 'TRACE_FOUND');

console.log(`Activities Started: ${activityEvents.length}`);
console.log(`Traces Left: ${traceEvents.length}`);

for (const e of activityEvents) {
    console.log(`[${e.tick}] ${e.actor} started ${(e.data as any).activity} in ${e.place}`);
}

for (const t of traceEvents) {
    console.log(`[${t.tick}] Trace found in ${t.place}: "${(t.data as any).trace}"`);
}

// Mock config
const config = {
    culpritId: 'alice',
    crimeWindow: 'W3',
    targetItem: 'router',
    hiddenPlace: 'garage'
} as unknown as CaseConfig;

const evidence = deriveEvidence(world, events, config);

const traceEvidence = evidence.filter(e => e.kind === 'physical' && e.item === 'trace');
const soundEvidence = evidence.filter(e => e.kind === 'testimony' && e.observable.startsWith('heard '));

console.log(`\nEvidence Derived:`);
console.log(`Physical Traces: ${traceEvidence.length}`);
console.log(`Sound Testimony: ${soundEvidence.length}`);

if (traceEvidence.length > 0) {
    console.log('Sample Trace Evidence:', traceEvidence[0]);
}
if (soundEvidence.length > 0) {
    console.log('Sample Sound Evidence:', soundEvidence[0]);
}
