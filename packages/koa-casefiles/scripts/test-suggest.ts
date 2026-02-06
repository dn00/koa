/**
 * Quick test: verify SUGGEST fallback works with the STAY claim fix.
 */
import { generateValidatedCase } from '../src/sim.js';
import { PlayerSession } from '../src/player.js';
import { performInterview, checkLogs, compareEvidence } from '../src/actions.js';
import { findContradictions, findKeystonePair, analyzeSignal, analyzeMotiveAmbiguity, analyzeKeystoneDiscoverability } from '../src/validators.js';
import type { TestimonyEvidence } from '../src/types.js';

const result = generateValidatedCase(42, 2);
if (!result) { console.error('Failed to generate case'); process.exit(1); }

const { sim, evidence } = result;
const session = new PlayerSession(sim.world, sim.config, evidence);

console.log('=== Case Info ===');
console.log(`Culprit: ${sim.config.culpritId}`);
console.log(`Crime window: ${sim.config.crimeWindow}`);

// Check STAY claim has subject fields
const stayClaim = evidence.find(e =>
    e.kind === 'testimony' && (e as TestimonyEvidence).claimType === 'STAY'
) as TestimonyEvidence | undefined;

if (stayClaim) {
    console.log(`\n=== STAY Claim ===`);
    console.log(`witness: ${stayClaim.witness}`);
    console.log(`subject: ${stayClaim.subject}`);
    console.log(`subjectPlace: ${stayClaim.subjectPlace}`);
    console.log(`place: ${stayClaim.place}`);
    console.log(`window: ${stayClaim.window}`);
} else {
    console.log('NO STAY CLAIM FOUND');
}

// Analyze signal
const signal = analyzeSignal(evidence, sim.config);
console.log(`\n=== Signal ===`);
console.log(`type: ${signal.signalType}`);
console.log(`strength: ${signal.signalStrength}`);
console.log(`keystonePair: ${JSON.stringify(signal.keystonePair)}`);

// Check contradictions on FULL evidence
const allContradictions = findContradictions(evidence, sim.config);
console.log(`\n=== Contradictions (full evidence) ===`);
console.log(`Count: ${allContradictions.length}`);
for (const c of allContradictions) {
    console.log(`  ${c.rule}: ${c.evidenceA} vs ${c.evidenceB}`);
}

const keystone = findKeystonePair(sim.config, evidence, allContradictions);
console.log(`\nKeystone: ${keystone ? `${keystone.rule} — ${keystone.evidenceA} vs ${keystone.evidenceB}` : 'NONE'}`);

// Now simulate player collecting some evidence and test SUGGEST
console.log(`\n=== Player Simulation ===`);
const culprit = sim.config.culpritId;
const crimeWindow = sim.config.crimeWindow;

performInterview(session, culprit, crimeWindow, 'testimony');
checkLogs(session, 'door', crimeWindow);
checkLogs(session, 'motion', crimeWindow);

console.log(`Known evidence: ${session.knownEvidence.length} items`);

const knownContradictions = findContradictions(session.knownEvidence, sim.config);
console.log(`Known contradictions (findContradictions): ${knownContradictions.length}`);
for (const c of knownContradictions) {
    console.log(`  ${c.rule}: ${c.evidenceA} vs ${c.evidenceB}`);
}

const knownKeystone = findKeystonePair(sim.config, session.knownEvidence, knownContradictions);
console.log(`Known keystone: ${knownKeystone ? `FOUND (${knownKeystone.rule})` : 'NULL — fallback to COMPARE scan'}`);

// Test compareEvidence fallback
let foundPairs = 0;
const known = session.knownEvidence;
for (let i = 0; i < known.length; i++) {
    for (let j = i + 1; j < known.length; j++) {
        const cmp = compareEvidence(session, known[i].id, known[j].id);
        if (cmp.success && 'contradiction' in cmp && cmp.contradiction) {
            console.log(`  COMPARE: ${cmp.level} — ${known[i].id} vs ${known[j].id}`);
            foundPairs++;
        }
    }
}
console.log(`Total pairs via COMPARE: ${foundPairs}`);

// Deduction quality analysis
console.log(`\n=== Deduction Quality ===`);
const motiveAmb = analyzeMotiveAmbiguity(evidence, sim.config);
console.log(`Motive ambiguity: score=${motiveAmb.ambiguityScore}, accusatory=${motiveAmb.accusatorySuspectCount}, standsOut=${motiveAmb.culpritStandsOut}`);

const keystoneDisc = analyzeKeystoneDiscoverability(evidence, sim.config);
console.log(`Keystone discoverability: score=${keystoneDisc.score}, bothFirst=${keystoneDisc.bothInFirstBatch}`);

console.log('\n=== ALL GOOD ===');
