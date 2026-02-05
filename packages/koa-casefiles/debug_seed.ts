import { simulate } from './src/sim.js';
import { deriveEvidence } from './src/evidence.js';

const seed = parseInt(process.argv[2] || '2');
const result = simulate(seed, 2, { useBlueprints: true });
if (!result) {
  console.log("Seed failed to generate");
  process.exit(1);
}

const { world, eventLog, config } = result;
const evidence = deriveEvidence(world, eventLog, config);

console.log("=== CASE CONFIG ===");
console.log("Culprit:", config.culpritId);
console.log("Crime window:", config.crimeWindow);
console.log("Crime place:", config.crimePlace);
console.log("Suspects:", config.suspects);

console.log("\n=== PRESENCE EVIDENCE FOR CRIME WINDOW ===");
const crimeWindowPresence = evidence.filter(
  (e: any) => e.kind === 'presence' && e.window === config.crimeWindow
);
console.log("Total presence evidence for", config.crimeWindow + ":", crimeWindowPresence.length);

// Group by NPC
const byNpc = new Map<string, any[]>();
for (const e of crimeWindowPresence) {
  const npc = (e as any).npc;
  if (!byNpc.has(npc)) byNpc.set(npc, []);
  byNpc.get(npc)!.push(e);
}

console.log("\nBy NPC:");
for (const [npc, evs] of byNpc) {
  const isCulprit = npc === config.culpritId ? " (CULPRIT)" : "";
  console.log(`  ${npc}${isCulprit}:`);
  for (const e of evs) {
    console.log(`    - At ${(e as any).place}, cites: [${e.cites.join(', ')}]`);
  }
}

console.log("\n=== RED HERRING CHECK ===");
const redHerrings = config.suspects.filter((s: string) => s !== config.culpritId);
console.log("Red herrings:", redHerrings);

for (const rh of redHerrings) {
  const alibis = crimeWindowPresence.filter(
    (e: any) => e.npc === rh && e.place !== config.crimePlace
  );
  console.log(`\n${rh}: ${alibis.length > 0 ? "HAS ALIBI" : "NO ALIBI!"}`);
  if (alibis.length > 0) {
    for (const a of alibis) {
      console.log(`  At ${(a as any).place} (crime place: ${config.crimePlace})`);
    }
  } else {
    // Show where they were
    const rhPresence = crimeWindowPresence.filter((e: any) => e.npc === rh);
    console.log(`  Was at: ${rhPresence.map((e: any) => e.place).join(', ')}`);
  }
}
