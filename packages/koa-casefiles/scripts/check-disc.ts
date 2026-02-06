import { generateValidatedCase } from '../src/sim.js';
import { analyzeSignal, analyzeKeystoneDiscoverability } from '../src/validators.js';

for (const seed of [77, 79]) {
    const gv = generateValidatedCase(seed, 2);
    if (!gv) { console.log(seed, 'FAILED'); continue; }
    const { sim, evidence } = gv;
    const discoverableKinds = new Set(['testimony', 'device_log', 'physical', 'motive']);
    const sv = evidence.filter(e => {
        if (!discoverableKinds.has(e.kind)) return false;
        const w = (e as any).window;
        return !w || w === sim.config.crimeWindow;
    });
    const signal = analyzeSignal(sv, sim.config);
    const kd = analyzeKeystoneDiscoverability(sv, sim.config);
    console.log(`Seed ${seed} | signal: ${signal.signalType} ${signal.signalStrength} | keystoneDisc: score=${kd.score} bothFirst=${kd.bothInFirstBatch}`);
    if (signal.keystonePair) {
        console.log(`  keystone: ${signal.keystonePair.evidenceA} vs ${signal.keystonePair.evidenceB}`);
        const a = sv.find(e => e.id === signal.keystonePair!.evidenceA);
        const b = sv.find(e => e.id === signal.keystonePair!.evidenceB);
        console.log(`  A:`, a?.kind, (a as any)?.place, (a as any)?.deviceType || (a as any)?.claimType);
        console.log(`  B:`, b?.kind, (b as any)?.place, (b as any)?.deviceType || (b as any)?.claimType);
    }
}
