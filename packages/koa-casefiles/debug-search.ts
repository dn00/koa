import { simulate } from './src/sim.js';
import { deriveEvidence } from './src/evidence.js';
import { PlayerSession } from './src/player.js';
import { performSearch, performInterview } from './src/actions.js';
import type { MotiveEvidence, PhysicalEvidence } from './src/types.js';

const seed = parseInt(process.argv[2] || '1');
const result = simulate(seed, 2, {});
if (!result) {
    console.log('Simulation failed');
    process.exit(1);
}

const evidence = deriveEvidence(result.world, result.eventLog, result.config);
const session = new PlayerSession(result.world, result.config, evidence, result.eventLog);

console.log('All evidence count:', session.allEvidence.length);
console.log('Physical evidence in allEvidence:');
session.allEvidence
    .filter(e => e.kind === 'physical')
    .forEach(e => {
        const p = e as PhysicalEvidence;
        console.log(' ', p.place, p.window, p.isGated ? '[GATED]' : '', p.detail.slice(0, 50));
    });

// Do gossip first
console.log('\n--- Getting gossip ---');
const gossipResult = performInterview(session, 'alice', '', 'gossip');
console.log('Gossip result:', gossipResult.success, gossipResult.evidence.length, 'items');

const crimeAwareness = session.knownEvidence.find(e =>
    e.kind === 'motive' && (e as MotiveEvidence).motiveHint === 'crime_awareness'
) as MotiveEvidence | undefined;
console.log('Crime awareness found:', !!crimeAwareness);
if (crimeAwareness) {
    console.log('Hint:', crimeAwareness.hint);
}

// Parse the place and window
const hint = crimeAwareness?.hint || '';
const windowMatch = hint.match(/\(W(\d)\)/);
const placeMatch = hint.match(/SEARCH:\s*(\w+)/);
const window = windowMatch ? `W${windowMatch[1]}` : 'W3';
const place = placeMatch ? placeMatch[1] : 'office';
console.log('Parsed: place =', place, ', window =', window);

// Now search
console.log('\n--- Searching', place, window, '---');
const searchResult = performSearch(session, place, window);
console.log('Search result:', searchResult.success, searchResult.resultCode);
console.log('Found:', searchResult.evidence.length, 'items');
searchResult.evidence.forEach(e => {
    console.log(' ', e.kind, e.id);
});

// Check what physical evidence exists at this place/window
console.log('\n--- Debug: Physical evidence at', place, window, '---');
const physicalAtLocation = session.allEvidence.filter(e =>
    e.kind === 'physical' && e.place === place && e.window === window
) as PhysicalEvidence[];
console.log('Found in allEvidence:', physicalAtLocation.length);
physicalAtLocation.forEach(e => {
    console.log(' ', e.id, e.isGated ? '[GATED]' : '[NOT GATED]');
    if (e.isGated) {
        console.log('   Prerequisites:', JSON.stringify(e.discoveryPrerequisites));
    }
});
