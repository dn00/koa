import { generateValidatedCase } from '../src/sim.js';
import { findContradictions } from '../src/validators.js';
import type { TestimonyEvidence } from '../src/types.js';

for (const seed of [243, 277]) {
    const gv = generateValidatedCase(seed, 2);
    if (!gv) continue;
    const { sim, evidence } = gv;
    const contras = findContradictions(evidence, sim.config);
    console.log(`\nSeed ${seed} (culprit=${sim.config.culpritId}):`);
    console.log(`  Total contradictions: ${contras.length}`);
    const bySuspect = new Map<string, number>();
    for (const c of contras) {
        if (c.rule !== 'testimony_vs_device' && c.rule !== 'tampered_device') continue;
        const eA = evidence.find(e => e.id === c.evidenceA);
        const suspect = eA?.kind === 'testimony' ? (eA as any).subject : undefined;
        if (suspect) bySuspect.set(suspect, (bySuspect.get(suspect) || 0) + 1);
        console.log(`  ${c.rule}: ${c.evidenceA} vs ${c.evidenceB} → suspect=${suspect}`);
    }
    console.log(`  By suspect:`, Object.fromEntries(bySuspect));
}
