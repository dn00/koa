/**
 * Quick test for topology generator
 */
import { createRng } from '../../kernel/rng.js';
import { generateTopology, generateRandomTopology, topologyToWorld } from './generator.js';
import { getAllTopologyFamilies } from './families.js';

const rng = createRng(42);

console.log('=== Testing All Topology Families ===\n');

for (const family of getAllTopologyFamilies()) {
    console.log(`\n--- ${family.name} (${family.id}) ---`);

    const topology = generateTopology(family, rng);

    console.log(`Places (${topology.places.length}):`);
    for (const place of topology.places) {
        console.log(`  - ${place.id}: ${place.name} (${place.type})`);
    }

    console.log(`\nConnections (${topology.connections.length}):`);
    for (const conn of topology.connections) {
        const door = conn.hasDoor ? '🚪' : '  ';
        const sensor = conn.doorSensorId ? `[${conn.doorSensorId}]` : '';
        console.log(`  ${door} ${conn.from} <-> ${conn.to} ${sensor}`);
    }

    console.log(`\nDevices (${topology.devices.length}):`);
    for (const device of topology.devices) {
        const loc = device.connectsTo
            ? `${device.place} <-> ${device.connectsTo}`
            : device.place;
        console.log(`  - ${device.id}: ${device.type} @ ${loc}`);
    }
}

console.log('\n\n=== World Conversion Test ===');
const testTopology = generateRandomTopology(rng);
const world = topologyToWorld(testTopology);

console.log(`\nConverted ${testTopology.familyId} to World format:`);
console.log(`Places (${world.places.length}):`);
for (const place of world.places) {
    console.log(`  - ${place.id}: ${place.name}`);
    console.log(`    Adjacent: [${place.adjacent.join(', ')}]`);
}

console.log(`\nDevices (${world.devices.length}):`);
for (const device of world.devices) {
    console.log(`  - ${device.id}: ${device.type} @ ${device.place}`);
}
