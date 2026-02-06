import { generateValidatedCase } from '../src/sim.js';
import { analyzeSignal } from '../src/validators.js';
import { PlayerSession } from '../src/player.js';
import { compareEvidence } from '../src/actions.js';
import type { TestimonyEvidence, DeviceLogEvidence } from '../src/types.js';

const seed = parseInt(process.argv[2] || '4069832368', 10);
const gv = generateValidatedCase(seed, 2);
if (!gv) { console.error('Failed'); process.exit(1); }
const { sim, evidence } = gv;
const signal = analyzeSignal(evidence, sim.config);
console.log('Signal type:', signal.signalType, 'strength:', signal.signalStrength);
console.log('Keystone pair:', signal.keystonePair);
console.log('Details:', signal.details);

if (signal.keystonePair) {
    const a = evidence.find(e => e.id === signal.keystonePair!.evidenceA);
    const b = evidence.find(e => e.id === signal.keystonePair!.evidenceB);
    console.log('\nKeystone A:', JSON.stringify(a, null, 2));
    console.log('\nKeystone B:', JSON.stringify(b, null, 2));

    // Test COMPARE on the keystone
    const session = new PlayerSession(sim.world, sim.config, evidence);
    for (const e of evidence) {
        if (!session.knownEvidence.find(k => k.id === e.id)) {
            session.knownEvidence.push(e);
        }
    }
    const cmp = compareEvidence(session, signal.keystonePair.evidenceA, signal.keystonePair.evidenceB);
    console.log('\nCOMPARE on keystone:', JSON.stringify(cmp));

    // Also test STAY vs door log (what I compared in the game)
    const stayClaim = evidence.find(e =>
        e.kind === 'testimony' && (e as TestimonyEvidence).claimType === 'STAY'
        && (e as TestimonyEvidence).witness === sim.config.culpritId
    );
    const doorLogs = evidence.filter(e =>
        e.kind === 'device_log' && (e as DeviceLogEvidence).actor === sim.config.culpritId
        && (e as DeviceLogEvidence).deviceType === 'door_sensor'
    );
    if (stayClaim && doorLogs.length > 0) {
        console.log('\n--- STAY vs door logs ---');
        console.log('STAY:', stayClaim.id, (stayClaim as TestimonyEvidence).place);
        for (const d of doorLogs) {
            const dl = d as DeviceLogEvidence;
            const cmpDoor = compareEvidence(session, stayClaim.id, dl.id);
            console.log(`  vs ${dl.id} (${dl.place}, ${dl.detail}): ${JSON.stringify(cmpDoor)}`);
        }
    }
}
