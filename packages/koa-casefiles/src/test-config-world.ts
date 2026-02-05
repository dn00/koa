/**
 * Test canonical house + cast world creation
 */
import { createRng } from './kernel/rng.js';
import { createWorldFromConfig } from './world.js';
import { getAllHouses, getAllCasts } from './houses.js';

const rng = createRng(42);

console.log('=== Available Houses ===');
for (const house of getAllHouses()) {
    console.log(`  ${house.id}: ${house.name} - ${house.places.length} rooms`);
}

console.log('\n=== Available Casts ===');
for (const cast of getAllCasts()) {
    console.log(`  ${cast.id}: ${cast.name}`);
    for (const npc of cast.npcs) {
        const arch = cast.archetypes[npc.id];
        console.log(`    - ${npc.name} (${npc.role}) [${arch}]`);
    }
}

console.log('\n=== Share House + Roommates ===');
const world1 = createWorldFromConfig(rng, 'share_house', 'roommates');
console.log(`Places: ${world1.places.map(p => p.id).join(', ')}`);
console.log(`NPCs: ${world1.npcs.map(n => n.name).join(', ')}`);
console.log(`Relationships: ${world1.relationships.length}`);

console.log('\n=== Cramped Apartment + Family ===');
const world2 = createWorldFromConfig(rng, 'cramped_apartment', 'family');
console.log(`Places: ${world2.places.map(p => p.id).join(', ')}`);
console.log(`NPCs: ${world2.npcs.map(n => n.name).join(', ')}`);
console.log(`Items: ${world2.items.map(i => i.id).join(', ')}`);

console.log('\nSchedule for Mom (peacemaker):');
const mom = world2.npcs.find(n => n.name === 'Mom');
if (mom) {
    for (const entry of mom.schedule) {
        console.log(`  ${entry.window}: ${entry.place} - ${entry.activity}`);
    }
}

console.log('\n=== McMansion + Coworkers ===');
const world3 = createWorldFromConfig(rng, 'mcmansion', 'coworkers');
console.log(`Places: ${world3.places.map(p => p.id).join(', ')}`);
console.log(`NPCs: ${world3.npcs.map(n => `${n.name} (${n.role})`).join(', ')}`);

console.log('\nRelationships:');
for (const rel of world3.relationships.slice(0, 5)) {
    console.log(`  ${rel.from} → ${rel.to}: ${rel.type} (${rel.intensity})`);
    console.log(`    "${rel.backstory}"`);
}
