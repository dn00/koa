import { simulate } from './src/sim.js';
import { deriveEvidence } from './src/evidence.js';
import type { TestimonyEvidence, PresenceEvidence } from './src/types.js';

const result = simulate(1, 2, { difficulty: 'medium' });
if (!result) { console.log('Sim failed'); process.exit(1); }

const { world, config } = result;
const evidence = deriveEvidence(world, result.eventLog, config);

console.log('=== GROUND TRUTH ===');
console.log('Culprit:', config.culpritId);
console.log('Crime window:', config.crimeWindow);
console.log();

console.log('=== CULPRIT ALIBIS/CLAIMS ===');
const culpritTestimony = evidence.filter(e =>
    e.kind === 'testimony' &&
    (e as TestimonyEvidence).witness === config.culpritId
) as TestimonyEvidence[];

for (const t of culpritTestimony) {
    if (t.observable.includes('claims') || t.observable.includes('remember')) {
        console.log(`- Window ${t.window}: "${t.observable}" (conf ${t.confidence})`);
    }
}

const culpritPresence = evidence.filter(e =>
    e.kind === 'presence' &&
    (e as PresenceEvidence).npc === config.culpritId &&
    (e as PresenceEvidence).cites.includes('self_reported_alibi')
) as PresenceEvidence[];

for (const p of culpritPresence) {
    console.log(`- Window ${p.window}: Presence claim at ${p.place}`);
}
