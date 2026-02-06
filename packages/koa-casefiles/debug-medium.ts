import { simulate } from './src/sim.js';
import { deriveEvidence } from './src/evidence.js';

const result = simulate(1, 2, { difficulty: 'medium' });
if (!result) { console.log('Sim failed'); process.exit(1); }

const { world, config } = result;
const evidence = deriveEvidence(world, result.eventLog, config);

console.log('=== GROUND TRUTH ===');
console.log('Culprit:', config.culpritId);
console.log('Motive:', config.motive.type, '-', config.motive.funnyReason);
console.log('Crime:', config.crimeType, 'at', config.crimePlace, 'during', config.crimeWindow);
console.log();

console.log('=== CULPRIT TESTIMONY ===');
const culpritTestimony = evidence.filter(e => e.kind === 'testimony' && (e as any).witness === config.culpritId);
culpritTestimony.forEach(t => console.log('-', (t as any).observable));
console.log();

console.log('=== MOTIVE GOSSIP (about culprit) ===');
const culpritMotives = evidence.filter(e => e.kind === 'motive' && (e as any).suspect === config.culpritId);
culpritMotives.forEach(m => console.log('-', (m as any).hint, '(source:', (m as any).gossipSource + ')'));
console.log();

console.log('=== CRIME AWARENESS GOSSIP ===');
const awareness = evidence.filter(e => e.kind === 'motive' && (e as any).motiveHint === 'crime_awareness');
awareness.forEach(m => console.log('-', (m as any).hint));
console.log();

console.log('=== ALL MOTIVE GOSSIP ===');
const allMotives = evidence.filter(e => e.kind === 'motive' && (e as any).motiveHint !== 'crime_awareness');
allMotives.forEach(m => console.log('-', (m as any).suspect + ':', (m as any).hint, '[' + (m as any).motiveHint + ']'));
