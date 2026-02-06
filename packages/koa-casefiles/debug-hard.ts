import { simulate } from './src/sim.js';
import { deriveEvidence } from './src/evidence.js';
import type { TestimonyEvidence, PresenceEvidence } from './src/types.js';

const result = simulate(1, 2, { difficulty: 'hard' });
if (!result) { console.log('Sim failed'); process.exit(1); }

const { world, config } = result;
const evidence = deriveEvidence(world, result.eventLog, config);

console.log('=== GROUND TRUTH ===');
console.log('Culprit:', config.culpritId);
console.log('Crime window:', config.crimeWindow);
console.log();

console.log('=== SELF-REPORTED ALIBIS (lies/misremembers) ===');
const alibiPresence = evidence.filter(e =>
    e.kind === 'presence' &&
    ((e as PresenceEvidence).cites.includes('self_reported_alibi') ||
     (e as PresenceEvidence).cites.includes('uncertain_memory'))
) as PresenceEvidence[];

for (const p of alibiPresence) {
    const isCulprit = p.npc === config.culpritId;
    const flag = p.cites[0];
    console.log(`- ${p.npc} claims ${p.place} during ${p.window} [${flag}] ${isCulprit ? '← CULPRIT' : '← INNOCENT'}`);
}

console.log();
console.log('=== TESTIMONIES WITH CLAIMS ===');
const claims = evidence.filter(e =>
    e.kind === 'testimony' &&
    ((e as TestimonyEvidence).observable.includes('claims') ||
     (e as TestimonyEvidence).observable.includes('thinks'))
) as TestimonyEvidence[];

for (const t of claims) {
    const isCulprit = t.witness === config.culpritId;
    console.log(`- ${t.witness} (conf ${t.confidence}): "${t.observable}" ${isCulprit ? '← CULPRIT' : '← INNOCENT'}`);
}
