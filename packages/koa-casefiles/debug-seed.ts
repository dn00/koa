import { simulate } from './src/sim.js';
import { deriveEvidence } from './src/evidence.js';

const seed = parseInt(process.argv[2] || '1');
const result = simulate(seed, 2, {});
if (!result) {
    console.log('Simulation failed');
    process.exit(1);
}

const evidence = deriveEvidence(result.world, result.eventLog, result.config);

console.log('Config:');
console.log('  culprit:', result.config.culpritId);
console.log('  crimeType:', result.config.crimeType);
console.log('  crimeMethod:', result.config.crimeMethod.methodId);
console.log('  crimeWindow:', result.config.crimeWindow);
console.log('  crimePlace:', result.config.crimePlace);
console.log('  motive:', result.config.motive.type);

console.log('\nPhysical evidence:');
evidence.filter(e => e.kind === 'physical').forEach(e => {
    console.log(' ', e.place, e.window, '-', e.detail.slice(0, 80));
});

console.log('\nTestimony:');
evidence.filter(e => e.kind === 'testimony').forEach(e => {
    console.log(' ', e.witness, e.window, e.place, '-', e.observable.slice(0, 60));
});

console.log('\nDevice logs:');
evidence.filter(e => e.kind === 'device_log').forEach(e => {
    console.log(' ', e.window, e.device, e.actor || '-', '-', e.detail.slice(0, 50));
});

console.log('\nMotives:');
evidence.filter(e => e.kind === 'motive').forEach(e => {
    if (e.motiveHint === 'crime_awareness') {
        console.log('CRIME AWARENESS (full):', e.hint);
    } else {
        console.log(' ', e.suspect, e.motiveHint, '-', e.hint.slice(0, 60));
    }
});
