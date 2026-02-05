/**
 * Case variety analysis script
 */

import { simulate } from './sim.js';

const seen = new Set<string>();
const details = {
    culprits: {} as Record<string, number>,
    items: {} as Record<string, number>,
    motives: {} as Record<string, number>,
    combos: {} as Record<string, number>,
    suspiciousActCounts: {} as Record<number, number>,
    twistRate: 0,
    validCount: 0,
    invalidCount: 0,
};

const NUM_SEEDS = 1000;

for (let seed = 0; seed < NUM_SEEDS; seed++) {
    const result = simulate(seed);
    if (!result) {
        details.invalidCount++;
        continue;
    }
    details.validCount++;

    const c = result.config;
    const key = `${c.culpritId}+${c.targetItem}+${c.motive.type}`;
    seen.add(key);

    details.culprits[c.culpritId] = (details.culprits[c.culpritId] || 0) + 1;
    details.items[c.targetItem] = (details.items[c.targetItem] || 0) + 1;
    details.motives[c.motive.type] = (details.motives[c.motive.type] || 0) + 1;
    details.combos[key] = (details.combos[key] || 0) + 1;

    const actCount = c.suspiciousActs.length;
    details.suspiciousActCounts[actCount] = (details.suspiciousActCounts[actCount] || 0) + 1;

    if (c.twist) details.twistRate++;
}

console.log('='.repeat(60));
console.log('CASE VARIETY ANALYSIS - 1000 SEEDS');
console.log('='.repeat(60));

console.log(`\nValid cases: ${details.validCount} (${(details.validCount / NUM_SEEDS * 100).toFixed(1)}%)`);
console.log(`Invalid (no opportunity): ${details.invalidCount}`);

console.log('\n--- UNIQUE COMBINATIONS ---');
console.log(`Unique culprit+item+motive combos: ${seen.size}`);

console.log('\n--- CULPRIT DISTRIBUTION ---');
for (const [k, v] of Object.entries(details.culprits).sort((a, b) => b[1] - a[1])) {
    const pct = (v / details.validCount * 100).toFixed(1);
    console.log(`  ${k}: ${v} (${pct}%)`);
}

console.log('\n--- ITEM DISTRIBUTION ---');
for (const [k, v] of Object.entries(details.items).sort((a, b) => b[1] - a[1])) {
    const pct = (v / details.validCount * 100).toFixed(1);
    console.log(`  ${k}: ${v} (${pct}%)`);
}

console.log('\n--- MOTIVE DISTRIBUTION ---');
for (const [k, v] of Object.entries(details.motives).sort((a, b) => b[1] - a[1])) {
    const pct = (v / details.validCount * 100).toFixed(1);
    console.log(`  ${k}: ${v} (${pct}%)`);
}

console.log('\n--- SUSPICIOUS ACT COUNTS ---');
for (const [k, v] of Object.entries(details.suspiciousActCounts).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    console.log(`  ${k} acts: ${v} cases`);
}

console.log(`\n--- TWIST RATE ---`);
console.log(`Cases with twist: ${details.twistRate} (${(details.twistRate / details.validCount * 100).toFixed(1)}%)`);

console.log('\n--- TOP 10 MOST COMMON COMBOS ---');
const sorted = Object.entries(details.combos).sort((a, b) => b[1] - a[1]).slice(0, 10);
for (const [k, v] of sorted) {
    console.log(`  ${v}x ${k}`);
}

console.log('\n--- EMERGENT DEPTH ANALYSIS ---');
const avgReuse = details.validCount / seen.size;
console.log(`Average reuse per combo: ${avgReuse.toFixed(2)}`);

// Days until 50% of combos repeat
const daysFor50PctRepeat = Math.ceil(seen.size * 0.5);
const daysFor90PctRepeat = Math.ceil(seen.size * 0.9);
console.log(`\nWith ${seen.size} unique combos:`);
console.log(`  ~${daysFor50PctRepeat} daily cases before 50% seen repeats`);
console.log(`  ~${daysFor90PctRepeat} daily cases before 90% seen`);

// But suspicious acts add variety
const suspiciousActVariety = 10 * 4 * 3; // templates * NPCs * windows
console.log(`\nSuspicious act combinations add ~${suspiciousActVariety}x variety`);
console.log(`Effective unique "feel": ${seen.size * suspiciousActVariety} combinations`);
