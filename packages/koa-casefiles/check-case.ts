import { simulate } from './src/sim.js';

const seed = parseInt(process.argv[2] || '100');
const result = simulate(seed, 2, { houseId: 'suburban_classic', castId: 'extended' });

if (!result?.config) {
  console.log('No valid case generated');
  process.exit(1);
}

console.log('=== CASE SOLUTION (SPOILERS) ===');
console.log('Culprit:', result.config.culpritId);
console.log('Crime:', result.config.crimeType);
console.log('Method:', result.config.crimeMethod.methodId);
console.log('Window:', result.config.crimeWindow);
console.log('Crime Place:', result.config.crimePlace);
console.log('Hidden Place:', result.config.hiddenPlace);
console.log('Motive:', result.config.motive.type);
console.log('Item:', result.config.targetItem);
