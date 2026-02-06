import { generateValidatedCase } from '../src/sim.js';
import { PlayerSession } from '../src/player.js';
import { performSearch, performInterview, checkLogs, compareEvidence } from '../src/actions.js';
import { analyzeSignal } from '../src/validators.js';
import type { MotiveEvidence, TestimonyEvidence, DeviceLogEvidence } from '../src/types.js';

const seed = parseInt(process.argv[2] || '77', 10);
const gv = generateValidatedCase(seed, 2);
if (!gv) { console.error('Failed'); process.exit(1); }
const { sim, evidence } = gv;
const session = new PlayerSession(sim.world, sim.config, evidence, sim.eventLog);
const suspects = sim.config.suspects;

// Replicate solver strategy
// Phase 1
performInterview(session, suspects[0], '', 'gossip');
const crime = session.knownEvidence.find(e =>
    e.kind === 'motive' && (e as MotiveEvidence).motiveHint === 'crime_awareness'
) as MotiveEvidence | undefined;
const window = sim.config.crimeWindow;
const place = sim.config.crimePlace;

// Phase 2
performSearch(session, place, window);

// Phase 3
checkLogs(session, 'motion', window);
const motionAfter3 = session.knownEvidence.filter(e => e.kind === 'device_log' && (e as DeviceLogEvidence).deviceType === 'motion_sensor');
console.log(`After LOGS motion (round 1): ${motionAfter3.length} motion entries`);
for (const m of motionAfter3) {
    const d = m as DeviceLogEvidence;
    console.log(`  ${d.id}: ${d.actor ?? 'anonymous'} at ${d.place} (${d.semantic})`);
}

session.nextDay();
checkLogs(session, 'door', window);

// Phase 4
for (const s of suspects) {
    performInterview(session, s, window, 'testimony');
}

// Check: does session have the keystone pair?
const discoverableKinds = new Set(['testimony', 'device_log', 'physical', 'motive']);
const sv = evidence.filter(e => {
    if (!discoverableKinds.has(e.kind)) return false;
    const w = (e as any).window;
    return !w || w === sim.config.crimeWindow;
});
const signal = analyzeSignal(sv, sim.config);
console.log(`\nKeystone: ${signal.keystonePair?.evidenceA} vs ${signal.keystonePair?.evidenceB}`);

const hasA = session.knownEvidence.find(e => e.id === signal.keystonePair?.evidenceA);
const hasB = session.knownEvidence.find(e => e.id === signal.keystonePair?.evidenceB);
console.log(`Session has keystone A (${signal.keystonePair?.evidenceA}): ${!!hasA}`);
console.log(`Session has keystone B (${signal.keystonePair?.evidenceB}): ${!!hasB}`);

if (hasA && hasB) {
    const cmp = compareEvidence(session, signal.keystonePair!.evidenceA, signal.keystonePair!.evidenceB);
    console.log('COMPARE result:', JSON.stringify(cmp));
}

// Show all STAY claims
const stayClaims = session.knownEvidence.filter(e =>
    e.kind === 'testimony' && (e as TestimonyEvidence).claimType === 'STAY'
);
console.log('\nSTAY claims in session:');
for (const s of stayClaims) {
    const t = s as TestimonyEvidence;
    console.log(`  ${t.id}: ${t.witness} at ${t.place}`);
}

// Show culprit's device logs
const culpritDevLogs = session.knownEvidence.filter(e =>
    e.kind === 'device_log' && (e as DeviceLogEvidence).actor === sim.config.culpritId
);
console.log(`\nCulprit (${sim.config.culpritId}) device logs in session:`);
for (const d of culpritDevLogs) {
    const dl = d as DeviceLogEvidence;
    console.log(`  ${dl.id}: ${dl.deviceType} ${dl.place} ${dl.detail} sem=${dl.semantic}`);
}
