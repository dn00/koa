import { generateValidatedCase } from '../src/sim.js';
import { PlayerSession } from '../src/player.js';
import { performInterview } from '../src/actions.js';
import type { TestimonyEvidence } from '../src/types.js';

const seed = parseInt(process.argv[2] || '77', 10);
const gv = generateValidatedCase(seed, 2);
if (!gv) { console.error('Failed'); process.exit(1); }
const { sim, evidence } = gv;
const session = new PlayerSession(sim.world, sim.config, evidence, sim.eventLog);

// Check what testimony_368 actually is
const t368 = evidence.find(e => e.id === 'testimony_368');
console.log('testimony_368:', JSON.stringify(t368, null, 2));

// Check all STAY claims in full evidence
const allStay = evidence.filter(e => e.kind === 'testimony' && (e as TestimonyEvidence).claimType === 'STAY');
console.log('\nAll STAY claims in full evidence:');
for (const s of allStay) {
    const t = s as TestimonyEvidence;
    console.log(`  ${t.id}: witness=${t.witness} place=${t.place} window=${t.window}`);
}

// Interview eve for W3 testimony
console.log('\n--- INTERVIEW eve W3 testimony ---');
const result = performInterview(session, 'eve', sim.config.crimeWindow, 'testimony');
console.log(`Got ${result.evidence.length} testimony items:`);
for (const e of result.evidence) {
    const t = e as TestimonyEvidence;
    console.log(`  ${t.id}: ${t.claimType || t.semantic} ${t.place} "${t.observable?.slice(0, 60)}"`);
}

// Check: is testimony_368 among them?
const has368 = result.evidence.find(e => e.id === 'testimony_368');
console.log(`\ntestimony_368 in interview result: ${!!has368}`);

// How many total eve W3 testimonies exist?
const eveW3 = evidence.filter(e =>
    e.kind === 'testimony' && (e as TestimonyEvidence).witness === 'eve' && (e as TestimonyEvidence).window === sim.config.crimeWindow
);
console.log(`Total eve W3 testimonies in evidence: ${eveW3.length}`);
