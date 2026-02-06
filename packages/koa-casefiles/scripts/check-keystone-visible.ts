import { generateValidatedCase } from '../src/sim.js';
import { analyzeSignal, findContradictions } from '../src/validators.js';
import { PlayerSession } from '../src/player.js';
import { compareEvidence } from '../src/actions.js';
import type { TestimonyEvidence, DeviceLogEvidence } from '../src/types.js';

const seed = parseInt(process.argv[2] || '77', 10);
const gv = generateValidatedCase(seed, 2);
if (!gv) { console.error('Failed'); process.exit(1); }
const { sim, evidence } = gv;

// Filter same way as generateValidatedCase
const discoverableKinds = new Set(['testimony', 'device_log', 'physical', 'motive']);
const solverVisible = evidence.filter(e => {
    if (!discoverableKinds.has(e.kind)) return false;
    const w = (e as any).window;
    return !w || w === sim.config.crimeWindow;
});

console.log(`Culprit: ${sim.config.culpritId}`);
console.log(`Crime: ${sim.config.crimeType} at ${sim.config.crimePlace} during ${sim.config.crimeWindow}`);
console.log(`Total evidence: ${evidence.length}, solver-visible: ${solverVisible.length}`);

// Signal on solver-visible
const signalVisible = analyzeSignal(solverVisible, sim.config);
console.log('\nSignal (solver-visible):', signalVisible.signalType, signalVisible.signalStrength);
console.log('Details:', signalVisible.details);
console.log('Keystone:', signalVisible.keystonePair);

// Signal on ALL evidence
const signalAll = analyzeSignal(evidence, sim.config);
console.log('\nSignal (all evidence):', signalAll.signalType, signalAll.signalStrength);
console.log('Details:', signalAll.details);

// findContradictions on solver-visible
const contras = findContradictions(solverVisible, sim.config);
console.log('\nContradictions (solver-visible):', contras.length);
const culpritContras = contras.filter(c => {
    const eA = solverVisible.find(e => e.id === c.evidenceA);
    const eB = solverVisible.find(e => e.id === c.evidenceB);
    const involvesCulprit = (eA: any, eB: any) => {
        const npc = (e: any) => e?.actor || e?.witness || e?.subject || e?.npc;
        return npc(eA) === sim.config.culpritId || npc(eB) === sim.config.culpritId;
    };
    return involvesCulprit(eA, eB);
});
console.log('Culprit contradictions:', culpritContras.length);
for (const c of culpritContras) {
    console.log(`  ${c.rule}: ${c.evidenceA} vs ${c.evidenceB}`);
}

// COMPARE on keystone pair (if any)
if (signalVisible.keystonePair) {
    const session = new PlayerSession(sim.world, sim.config, evidence);
    for (const e of solverVisible) {
        if (!session.knownEvidence.find(k => k.id === e.id)) {
            session.knownEvidence.push(e);
        }
    }
    const cmp = compareEvidence(session, signalVisible.keystonePair.evidenceA, signalVisible.keystonePair.evidenceB);
    console.log('\nCOMPARE on keystone:', JSON.stringify(cmp));
}

// Show culprit's STAY claim and device logs
const stayClaim = solverVisible.find(e =>
    e.kind === 'testimony' && (e as TestimonyEvidence).claimType === 'STAY'
    && (e as TestimonyEvidence).witness === sim.config.culpritId
);
const culpritDeviceLogs = solverVisible.filter(e =>
    e.kind === 'device_log' && (e as DeviceLogEvidence).actor === sim.config.culpritId
);
console.log('\nSTAY claim:', stayClaim ? `${stayClaim.id} place=${(stayClaim as TestimonyEvidence).place}` : 'NONE');
console.log('Culprit device logs:');
for (const d of culpritDeviceLogs) {
    const dl = d as DeviceLogEvidence;
    console.log(`  ${dl.id}: ${dl.deviceType} ${dl.place} ${dl.detail} sem=${dl.semantic}`);
}
