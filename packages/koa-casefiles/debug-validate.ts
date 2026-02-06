import { generateValidatedCase } from './src/sim.js';
import { validateCase } from './src/validators.js';
import { DIFFICULTY_PROFILES, profileToDifficultyConfig } from './src/types.js';

const result = generateValidatedCase(42, 2);
if (!result) { console.log('generateValidatedCase returned null'); process.exit(0); }
const dc = profileToDifficultyConfig(DIFFICULTY_PROFILES[2]);
const v = validateCase(result.sim.world, result.sim.config, result.evidence, dc);
console.log('keys:', Object.keys(v));
console.log('full:', JSON.stringify(v, null, 2));
