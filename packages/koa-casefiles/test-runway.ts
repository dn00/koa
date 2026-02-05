import { simulate } from './src/sim.js';

const patterns = new Set<string>();
const culpritCounts: Record<string, number> = {};
const windowCounts: Record<string, number> = {};
const itemCounts: Record<string, number> = {};
const hidePlaceCounts: Record<string, number> = {};
const crimePlaceCounts: Record<string, number> = {};
let nullCount = 0;

for (let seed = 1; seed <= 1000; seed++) {
  const result = simulate(seed, 2, { houseId: 'suburban_classic', castId: 'extended' });
  if (!result || !result.config) {
    nullCount++;
    continue;
  }

  const config = result.config;
  const itemName = typeof config.targetItem === 'string' ? config.targetItem : config.targetItem?.name || 'unknown';
  const pattern = `${config.culpritId}-${itemName}-${config.hiddenPlace}-${config.crimeWindow}`;
  patterns.add(pattern);

  culpritCounts[config.culpritId] = (culpritCounts[config.culpritId] || 0) + 1;
  windowCounts[config.crimeWindow] = (windowCounts[config.crimeWindow] || 0) + 1;
  itemCounts[itemName] = (itemCounts[itemName] || 0) + 1;
  hidePlaceCounts[config.hiddenPlace] = (hidePlaceCounts[config.hiddenPlace] || 0) + 1;
  crimePlaceCounts[config.crimePlace] = (crimePlaceCounts[config.crimePlace] || 0) + 1;
}

console.log('Null results:', nullCount);
console.log('Unique patterns:', patterns.size);
console.log('Culprit distribution:', culpritCounts, `(${Object.keys(culpritCounts).length} unique)`);
console.log('Window distribution:', windowCounts, `(${Object.keys(windowCounts).length} unique)`);
console.log('Item distribution:', itemCounts, `(${Object.keys(itemCounts).length} unique)`);
console.log('Hide place distribution:', hidePlaceCounts, `(${Object.keys(hidePlaceCounts).length} unique)`);
console.log('Crime place distribution:', crimePlaceCounts, `(${Object.keys(crimePlaceCounts).length} unique)`);
console.log('\nContent runway (days):', patterns.size);
console.log('Max theoretical:', Object.keys(culpritCounts).length * Object.keys(itemCounts).length * Object.keys(hidePlaceCounts).length * Object.keys(windowCounts).length);
