/**
 * Test generated topology world creation
 */
import { createRng } from './kernel/rng.js';
import { createWorld, createWorldWithTopology } from './world.js';

const rng = createRng(42);

console.log('=== Fixed World (Legacy) ===\n');
const fixedWorld = createWorld(rng);
console.log(`Places: ${fixedWorld.places.map(p => p.id).join(', ')}`);
console.log(`Devices: ${fixedWorld.devices.length}`);
console.log(`Items: ${fixedWorld.items.length}`);
console.log(`NPCs: ${fixedWorld.npcs.map(n => n.name).join(', ')}`);

console.log('\n=== Generated World (Random Topology) ===\n');
const genWorld = createWorldWithTopology(rng);
console.log(`Places: ${genWorld.places.map(p => p.id).join(', ')}`);
console.log(`Devices: ${genWorld.devices.length}`);
console.log(`Items: ${genWorld.items.length}`);

console.log('\nPlace adjacencies:');
for (const place of genWorld.places) {
    console.log(`  ${place.id}: [${place.adjacent.join(', ')}]`);
}

console.log('\nItem distribution:');
for (const item of genWorld.items) {
    console.log(`  ${item.id}: ${item.startPlace}`);
}

console.log('\nNPC schedules (first 2):');
for (const npc of genWorld.npcs.slice(0, 2)) {
    console.log(`\n  ${npc.name}:`);
    for (const entry of npc.schedule) {
        console.log(`    ${entry.window}: ${entry.place} (${entry.activity})`);
    }
}

console.log('\n=== Hub & Spokes Topology ===\n');
const hubWorld = createWorldWithTopology(createRng(123), 'hub_spokes');
console.log(`Places: ${hubWorld.places.map(p => p.id).join(', ')}`);

console.log('\n=== Loop Topology ===\n');
const loopWorld = createWorldWithTopology(createRng(123), 'loop');
console.log(`Places: ${loopWorld.places.map(p => p.id).join(', ')}`);
for (const place of loopWorld.places) {
    console.log(`  ${place.id}: [${place.adjacent.join(', ')}]`);
}
