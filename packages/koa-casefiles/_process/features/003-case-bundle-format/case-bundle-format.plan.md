# Plan: CaseBundle Publish Format

**Discovery:** notes.md (inline discovery, no separate session needed)
**Status:** ready

---

## Overview

Define the canonical format for publishing mystery cases to clients. The CaseBundle separates public game data from the solution, includes a validator report as proof of quality, and uses SHA256 hashing for client-side answer verification. This is the format that gets sent to players — it must never contain spoilers.

---

## Requirements Expansion

### From R1: Define canonical CaseBundle format (no spoilers)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | CaseBundle has metadata: version, bundleId, rulesetVersion, generatedAt | Type check + unit test constructs valid bundle | 001 |
| R1.2 | CaseBundle has public game data: seed, tier, WorldSnapshot, suspects | Type check + unit test | 001 |
| R1.3 | CaseBundle has BundleValidatorReport aggregating solvability proof | Type check + unit test | 001, 002 |
| R1.4 | CaseBundle NEVER contains culpritId, crimeWindow, crimePlace, hiddenPlace, motive, crimeMethod | Unit test inspects JSON output for absence of spoiler fields | 002 |
| R1.5 | WorldSnapshot strips NPC schedules and relationships from World | Unit test comparing World vs WorldSnapshot | 001, 002 |

### From R2: Solution separation and hashing

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | Solution interface maps to ACCUSE dimensions: who, what, when, where, how, why | Type check | 001 |
| R2.2 | hashSolution() produces deterministic SHA256 hex via canonical JSON | Unit test with known input/output pair | 002 |
| R2.3 | verifyAnswer() returns true when player answer matches solution hash | Unit test | 002 |
| R2.4 | extractSolution() extracts Solution from CaseConfig | Unit test | 002 |

### From R3: Bundle generation pipeline

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | generateBundle(seed, tier, options) returns CaseBundle or null | Unit test | 002 |
| R3.2 | generateBundle uses generateValidatedCase() internally (solvability guarantee) | Implementation check | 002 |
| R3.3 | Same seed + tier always produces identical bundle (deterministic) | Unit test comparing two calls | 002 |

### From R4: Bundle validation (round-trip)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R4.1 | validateBundle() regenerates from seed, verifies solution hash matches | Unit test | 003 |
| R4.2 | validateBundle() checks validator report consistency with regenerated case | Unit test | 003 |
| R4.3 | validateBundle() detects tampered bundles (modified hash or seed) | Unit test | 003 |

### From R5: CLI integration

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R5.1 | --export-bundle flag outputs JSON CaseBundle to stdout | Integration test | 003 |
| R5.2 | --export-bundle composes with --seed and --tier flags | Integration test | 003 |

---

## Dependency Graph

```
001 ---> 002 ---> 003
```

Sequential chain is justified: 002 needs types from 001, 003 needs generateBundle from 002.

---

## Batch Analysis

| Batch | Tasks | Complexity | Blocked By | Notes |
|-------|-------|------------|------------|-------|
| 1 | 001 | S | - | Foundation types only |
| 2 | 002 | M | Batch 1 | Core bundle logic (generation + hashing) |
| 3 | 003 | S | Batch 2 | Validation + CLI wiring |

---

## Task Summary

| ID | Name | Complexity | Status |
|----|------|------------|--------|
| 001 | Bundle and Solution types | S | done |
| 002 | Bundle generation and hashing | M | done |
| 003 | Bundle validation and CLI | S | done |

---

## Task Details (Inline)

### Task 001: Bundle and Solution Types

**Complexity:** S
**Depends On:** none
**Implements:** R1.1, R1.2, R1.3, R1.5, R2.1

#### Objective
Define the CaseBundle, Solution, WorldSnapshot, and BundleValidatorReport interfaces in types.ts so that bundle generation (Task 002) has exact type contracts to work against.

#### Context
**Relevant Files:**
- `src/types.ts` - Add new interfaces alongside existing CaseConfig, World, etc.

**Embedded Context:**

Existing types this builds on:
```typescript
// Already in types.ts
type NPCId = string;
type PlaceId = string;
type WindowId = string;
type DifficultyTier = 1 | 2 | 3 | 4;
type CrimeType = 'theft' | 'sabotage' | 'prank' | 'disappearance';
type MethodId = 'grabbed' | 'pocketed' | 'smuggled' | 'broke' | 'unplugged' | 'reprogrammed' | 'relocated' | 'swapped' | 'disguised' | 'hid' | 'buried' | 'donated';
type MotiveType = 'envy' | 'embarrassment' | 'cover_up' | 'rivalry' | 'attention' | 'revenge' | 'chaos' | 'crime_awareness';
type SignalType = 'self_contradiction' | 'device_contradiction' | 'scene_presence' | 'opportunity_only';
type SignalStrength = 'strong' | 'medium' | 'weak';

interface Place { id: PlaceId; name: string; adjacent: PlaceId[]; }
interface Device { id: DeviceId; type: DeviceType; place: PlaceId; connectsTo?: PlaceId; }
interface Item { id: ItemId; name: string; funnyName: string; startPlace: PlaceId; }
interface NPC { id: NPCId; name: string; role: string; schedule: ScheduleEntry[]; }
interface World { places: Place[]; devices: Device[]; items: Item[]; npcs: NPC[]; relationships: Relationship[]; }
```

New interfaces to add (place after the World/SimulationResult section, before Validation section):
```typescript
// ============================================================================
// CaseBundle (Publish Format)
// ============================================================================

/** NPC data safe for client consumption (no schedule) */
export interface WorldSnapshotNPC {
    id: NPCId;
    name: string;
    role: string;
}

/** World data safe for client consumption (no schedules, no relationships) */
export interface WorldSnapshot {
    places: Place[];
    devices: Device[];
    items: Item[];
    npcs: WorldSnapshotNPC[];
}

/** What the player accuses — maps to ACCUSE command dimensions */
export interface Solution {
    who: NPCId;
    what: CrimeType;
    when: WindowId;
    where: PlaceId;
    how: MethodId;
    why: MotiveType;
}

/** Validator report included in bundle as public proof of case quality */
export interface BundleValidatorReport {
    solvable: boolean;
    playable: boolean;
    signalType: SignalType;
    signalStrength: SignalStrength;
    keystoneExists: boolean;
    estimatedMinAP: number;
    contradictionCount: number;
    difficulty: DifficultyTier;
}

/** Ruleset version constant — bump when simulation logic changes */
export const RULESET_VERSION = '0.1.0';

/** Published case bundle — safe for client consumption, no spoilers */
export interface CaseBundle {
    // Metadata
    version: string;
    bundleId: string;
    rulesetVersion: string;
    generatedAt: string;

    // Public game data
    seed: number;
    tier: DifficultyTier;
    world: WorldSnapshot;
    suspects: NPCId[];

    // Validation proof
    validatorReport: BundleValidatorReport;

    // Solution verification (hash only)
    solutionHash: string;
}
```

**Key invariant:** `WorldSnapshot.npcs` uses `WorldSnapshotNPC` (no `schedule` field), NOT the full `NPC` type. `WorldSnapshot` has no `relationships` field.

#### Entry Points / Wiring
- Types are consumed by `src/bundle.ts` (Task 002) and `src/cli.ts` (Task 003)
- `RULESET_VERSION` is imported by bundle generation and validation functions
- No runtime wiring needed — pure type definitions

#### Files Touched
- `src/types.ts` - modify (add interfaces after World/SimulationResult section)

#### Acceptance Criteria
##### AC-1: WorldSnapshotNPC excludes schedule <- R1.5
- **Given:** The WorldSnapshotNPC interface
- **When:** Compared to NPC interface
- **Then:** WorldSnapshotNPC has id, name, role but NOT schedule

##### AC-2: WorldSnapshot excludes relationships <- R1.5
- **Given:** The WorldSnapshot interface
- **When:** Compared to World interface
- **Then:** WorldSnapshot has places, devices, items, npcs but NOT relationships

##### AC-3: Solution maps to ACCUSE dimensions <- R2.1
- **Given:** The Solution interface
- **When:** Checked against ACCUSE command parameters
- **Then:** Has fields: who (NPCId), what (CrimeType), when (WindowId), where (PlaceId), how (MethodId), why (MotiveType)

##### AC-4: CaseBundle has required metadata <- R1.1
- **Given:** The CaseBundle interface
- **When:** Inspected
- **Then:** Has version (string), bundleId (string), rulesetVersion (string), generatedAt (string)

##### AC-5: CaseBundle has public game data <- R1.2
- **Given:** The CaseBundle interface
- **When:** Inspected
- **Then:** Has seed (number), tier (DifficultyTier), world (WorldSnapshot), suspects (NPCId[])

##### AC-6: CaseBundle has validator report <- R1.3
- **Given:** The CaseBundle interface
- **When:** Inspected
- **Then:** Has validatorReport (BundleValidatorReport) with solvable, playable, signalType, signalStrength, keystoneExists, estimatedMinAP, contradictionCount, difficulty

##### AC-7: RULESET_VERSION constant exists <- R1.1
- **Given:** The RULESET_VERSION constant
- **When:** Imported
- **Then:** Is a string matching semver format

#### Edge Cases
##### EC-1: CaseBundle has no Solution fields
- **Scenario:** Inspect CaseBundle interface definition
- **Expected:** No culpritId, crimeWindow, crimePlace, hiddenPlace, motive, crimeMethod fields exist on the type

#### Error Cases
None — this task is pure type definitions, no runtime logic.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | WorldSnapshotNPC excludes schedule | `tests/bundle.test.ts` |
| AC-2 | WorldSnapshot excludes relationships | `tests/bundle.test.ts` |
| AC-3 | Solution maps to ACCUSE dimensions | `tests/bundle.test.ts` |
| AC-4 | CaseBundle has required metadata | `tests/bundle.test.ts` |
| AC-5 | CaseBundle has public game data | `tests/bundle.test.ts` |
| AC-6 | CaseBundle has validator report | `tests/bundle.test.ts` |
| AC-7 | RULESET_VERSION is semver string | `tests/bundle.test.ts` |
| EC-1 | CaseBundle has no solution fields | `tests/bundle.test.ts` |

#### Notes
**Planning Notes:**
- Used hash-only approach (Option C from notes). Excluded NPC schedules and relationships from WorldSnapshot since they're internal simulation data, not player-facing. Solution uses semantic field names (who/what/when/where/how/why) matching ACCUSE command dimensions rather than CaseConfig field names.
- Add interfaces after the `World` / `SimulationResult` section and before the `Validation` section in types.ts. RULESET_VERSION should start at '0.1.0' (matches current package version).

**Implementation Notes:** Added WorldSnapshotNPC, WorldSnapshot, Solution, BundleValidatorReport, CaseBundle interfaces and RULESET_VERSION constant to `src/types.ts` after the Simulation Result section. All 8 tests passing (7 AC + 1 EC).
**Review Notes:** [filled by reviewer]

---

### Task 002: Bundle Generation and Hashing

**Complexity:** M
**Depends On:** 001
**Implements:** R1.3, R1.4, R2.2, R2.3, R2.4, R3.1, R3.2, R3.3

#### Objective
Create `bundle.ts` with the core bundle generation pipeline: extract Solution from CaseConfig, hash it with SHA256, build the WorldSnapshot, populate the ValidatorReport, and assemble a complete CaseBundle. Also add client-side answer verification.

#### Context
**Relevant Files:**
- `src/bundle.ts` - **NEW FILE** to create
- `src/types.ts` - CaseBundle, Solution, WorldSnapshot, BundleValidatorReport (from Task 001)
- `src/sim.ts` - `generateValidatedCase()` returns `{ sim, evidence }` or null
- `src/validators.ts` - `analyzeSignal()`, `validatePlayability()`, `getAllChains()`, `validateCase()`
- `src/kernel/canonical.ts` - `canonicalJson()`, `sha256()` (already exist)
- `package.json` - Add `"./bundle"` export

**Embedded Context:**

generateValidatedCase signature (sim.ts):
```typescript
export function generateValidatedCase(
    seed: number,
    tier: DifficultyTier = 2,
    options: SimulationOptions = {}
): { sim: SimulationResult; evidence: EvidenceItem[] } | null
```

Canonical hashing utilities (kernel/canonical.ts):
```typescript
export function canonicalJson(obj: unknown): string;  // Sorted keys, no whitespace
export function sha256(data: string): string;          // Lowercase hex
```

analyzeSignal signature (validators.ts):
```typescript
export function analyzeSignal(
    evidence: EvidenceItem[],
    config: CaseConfig
): SignalAnalysis  // { hasSignal, signalType, signalStrength, keystonePair?, details? }
```

validatePlayability signature (validators.ts):
```typescript
export function validatePlayability(
    config: CaseConfig,
    evidence: EvidenceItem[],
    chains: Record<ChainTarget, EvidenceChainV2[]>,
    constraints: PlayerConstraints = DEFAULT_PLAYER_CONSTRAINTS
): PlayabilityResult  // { playable, minAPToSolve, apMargin, keystoneExists, ... }
```

validateCase signature (validators.ts):
```typescript
export function validateCase(
    world: World,
    config: CaseConfig,
    evidence: EvidenceItem[],
    difficultyConfig?: DifficultyConfig
): CaseValidation  // { passed, solvability, difficulty, contradictions, ... }
```

CaseConfig fields relevant to Solution extraction:
```typescript
interface CaseConfig {
    culpritId: NPCId;           // → Solution.who
    crimeType: CrimeType;       // → Solution.what
    crimeWindow: WindowId;      // → Solution.when
    crimePlace: PlaceId;        // → Solution.where
    crimeMethod: CrimeMethod;   // .methodId → Solution.how
    motive: Motive;             // .type → Solution.why
}
```

Functions to implement:
```typescript
import type { World, CaseConfig, CaseBundle, Solution, WorldSnapshot,
    WorldSnapshotNPC, BundleValidatorReport, DifficultyTier } from './types.js';
import { RULESET_VERSION } from './types.js';
import { canonicalJson, sha256 } from './kernel/canonical.js';
import { generateValidatedCase } from './sim.js';
import { analyzeSignal, validatePlayability, getAllChains, validateCase } from './validators.js';
import { profileToDifficultyConfig, DIFFICULTY_PROFILES } from './types.js';

/** Strip World down to client-safe WorldSnapshot */
export function toWorldSnapshot(world: World): WorldSnapshot {
    return {
        places: world.places,
        devices: world.devices,
        items: world.items,
        npcs: world.npcs.map(npc => ({
            id: npc.id,
            name: npc.name,
            role: npc.role,
        })),
    };
}

/** Extract Solution from CaseConfig */
export function extractSolution(config: CaseConfig): Solution {
    return {
        who: config.culpritId,
        what: config.crimeType,
        when: config.crimeWindow,
        where: config.crimePlace,
        how: config.crimeMethod.methodId,
        why: config.motive.type,
    };
}

/** Hash a Solution using canonical JSON + SHA256 */
export function hashSolution(solution: Solution): string {
    return sha256(canonicalJson(solution));
}

/** Verify a player's answer against a bundle's solution hash */
export function verifyAnswer(solutionHash: string, answer: Solution): boolean {
    return hashSolution(answer) === solutionHash;
}

export interface BundleOptions {
    bundleId?: string;
    houseId?: string;
    castId?: string;
}

/** Generate a complete CaseBundle from a seed */
export function generateBundle(
    seed: number,
    tier: DifficultyTier = 2,
    options: BundleOptions = {}
): CaseBundle | null {
    const result = generateValidatedCase(seed, tier, {
        houseId: options.houseId,
        castId: options.castId,
    });
    if (!result) return null;

    const { sim, evidence } = result;
    const { world, config } = sim;

    const signal = analyzeSignal(evidence, config);
    const chains = getAllChains(config, evidence);
    const playability = validatePlayability(config, evidence, chains);
    const validation = validateCase(world, config, evidence,
        profileToDifficultyConfig(DIFFICULTY_PROFILES[tier]));

    const validatorReport: BundleValidatorReport = {
        solvable: validation.solvability.valid,
        playable: playability.playable,
        signalType: signal.signalType,
        signalStrength: signal.signalStrength,
        keystoneExists: signal.hasSignal,
        estimatedMinAP: validation.difficulty?.estimatedMinAP ?? 0,
        contradictionCount: validation.difficulty?.contradictionCount ?? 0,
        difficulty: tier,
    };

    const solution = extractSolution(config);
    const solutionHash = hashSolution(solution);

    return {
        version: '1.0.0',
        bundleId: options.bundleId ?? `seed-${seed}`,
        rulesetVersion: RULESET_VERSION,
        generatedAt: new Date().toISOString(),
        seed,
        tier,
        world: toWorldSnapshot(world),
        suspects: config.suspects,
        validatorReport,
        solutionHash,
    };
}
```

**INV-4 through INV-6 (Anti-anticlimax):** Bundle must not contain any field that directly identifies the culprit. The `solutionHash` is a one-way hash — safe.

**INV-7 through INV-9 (Determinism):** Same seed + tier must produce same bundle content (except `generatedAt` timestamp). The hash and all game data are deterministic via seeded RNG.

#### Entry Points / Wiring
- `"./bundle": "./src/bundle.ts"` added to `package.json` exports
- `generateBundle` called by CLI `--export-bundle` (Task 003)
- `hashSolution`, `extractSolution`, `verifyAnswer` available for external consumers via package export

#### Files Touched
- `src/bundle.ts` - create (toWorldSnapshot, extractSolution, hashSolution, verifyAnswer, BundleOptions, generateBundle)
- `package.json` - modify (add `"./bundle"` export)

#### Acceptance Criteria
##### AC-1: toWorldSnapshot strips schedules <- R1.5
- **Given:** A World with NPCs that have schedule arrays
- **When:** toWorldSnapshot(world) is called
- **Then:** Returned WorldSnapshot.npcs have id, name, role but no schedule field

##### AC-2: toWorldSnapshot strips relationships <- R1.5
- **Given:** A World with relationships array
- **When:** toWorldSnapshot(world) is called
- **Then:** Returned WorldSnapshot has no relationships field

##### AC-3: extractSolution maps CaseConfig correctly <- R2.4
- **Given:** A CaseConfig with culpritId='alice', crimeType='theft', crimeWindow='W3', crimePlace='kitchen', crimeMethod.methodId='grabbed', motive.type='envy'
- **When:** extractSolution(config) is called
- **Then:** Returns { who: 'alice', what: 'theft', when: 'W3', where: 'kitchen', how: 'grabbed', why: 'envy' }

##### AC-4: hashSolution is deterministic <- R2.2
- **Given:** Two identical Solution objects
- **When:** hashSolution() is called on each
- **Then:** Both return the same SHA256 hex string

##### AC-5: hashSolution uses canonical JSON <- R2.2
- **Given:** Two Solution objects with same values but fields declared in different order
- **When:** hashSolution() is called on each
- **Then:** Both return the same hash (canonical JSON sorts keys)

##### AC-6: verifyAnswer returns true for correct answer <- R2.3
- **Given:** A solution hash and the matching Solution object
- **When:** verifyAnswer(hash, answer) is called
- **Then:** Returns true

##### AC-7: verifyAnswer returns false for wrong answer <- R2.3
- **Given:** A solution hash and a Solution with one wrong field
- **When:** verifyAnswer(hash, answer) is called
- **Then:** Returns false

##### AC-8: generateBundle returns valid CaseBundle <- R3.1
- **Given:** A known-good seed (e.g., seed 42)
- **When:** generateBundle(seed, 2) is called
- **Then:** Returns a CaseBundle with all required fields populated

##### AC-9: generateBundle returns null for bad seed <- R3.1
- **Given:** A seed that produces no valid crime opportunity
- **When:** generateBundle(seed, 2) is called
- **Then:** Returns null

##### AC-10: Bundle contains no spoiler fields <- R1.4
- **Given:** A generated CaseBundle
- **When:** JSON.stringify(bundle) is inspected
- **Then:** The serialized bundle has no keys named `culpritId`, `crimeWindow`, `crimePlace`, `hiddenPlace`, `crimeMethod`, or `motive` at any depth. (Values like 'kitchen' may appear in items/devices — check keys, not values. Culprit IS in `suspects[]` — that's expected.)

##### AC-11: Bundle is deterministic <- R3.3
- **Given:** Same seed and tier
- **When:** generateBundle is called twice
- **Then:** All fields except generatedAt are identical

#### Edge Cases
##### EC-1: Solution field order independence
- **Scenario:** Create Solution with fields in alphabetical vs reverse order
- **Expected:** hashSolution returns identical hash for both

##### EC-2: Bundle with all difficulty tiers
- **Scenario:** Generate bundles with tier 1, 2, 3, 4
- **Expected:** All return valid bundles (or null), tier field matches input

#### Error Cases
##### ERR-1: generateBundle with invalid tier
- **When:** generateBundle called with tier value outside 1-4
- **Then:** TypeScript prevents this at compile time (DifficultyTier = 1 | 2 | 3 | 4)
- **Error Message:** N/A (type-level enforcement)

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | toWorldSnapshot strips schedules | `tests/bundle.test.ts` |
| AC-2 | toWorldSnapshot strips relationships | `tests/bundle.test.ts` |
| AC-3 | extractSolution maps CaseConfig correctly | `tests/bundle.test.ts` |
| AC-4 | hashSolution is deterministic | `tests/bundle.test.ts` |
| AC-5 | hashSolution canonical JSON order independence | `tests/bundle.test.ts` |
| AC-6 | verifyAnswer returns true for correct answer | `tests/bundle.test.ts` |
| AC-7 | verifyAnswer returns false for wrong answer | `tests/bundle.test.ts` |
| AC-8 | generateBundle returns valid CaseBundle | `tests/bundle.test.ts` |
| AC-9 | generateBundle returns null for bad seed | `tests/bundle.test.ts` |
| AC-10 | bundle contains no spoiler fields | `tests/bundle.test.ts` |
| AC-11 | bundle is deterministic | `tests/bundle.test.ts` |
| EC-1 | solution field order independence | `tests/bundle.test.ts` |
| EC-2 | bundle with all difficulty tiers | `tests/bundle.test.ts` |

#### Notes
**Planning Notes:**
- This is the core implementation task. It bridges the existing pipeline (simulate → evidence → validate) with the new publish format.
- Use `canonicalJson()` and `sha256()` from `./kernel/canonical.js` — do NOT reimplement.
- `generateValidatedCase()` already handles the simulate → evidence → signal injection pipeline.
- For the spoiler-absence test (AC-10): stringify the bundle and check that the culprit's ID doesn't appear as a value in any field that singles them out.
- The `generatedAt` field breaks strict determinism. Tests for AC-11 should exclude this field.

**Implementation Notes:** Created `src/bundle.ts` with toWorldSnapshot, extractSolution, hashSolution, verifyAnswer, and generateBundle. Added `"./bundle"` export to package.json. Used explicit `WorldSnapshotNPC` return type on map callback per Gemini review. All 13 tests passing.
**Review Notes:** Gemini review PASS (1 pre-existing type error in validate-seeds.ts, 1 non-issue re field whitelisting, 1 return type annotation fixed).

---

### Task 003: Bundle Validation and CLI Integration

**Complexity:** S
**Depends On:** 002
**Implements:** R4.1, R4.2, R4.3, R5.1, R5.2

#### Objective
Add round-trip bundle validation (regenerate from seed, verify hash and report match) and wire the `--export-bundle` flag into the existing CLI so users can generate publishable bundles from the command line.

#### Context
**Relevant Files:**
- `src/bundle.ts` - Add validateBundle() (from Task 002, already has generateBundle)
- `src/cli.ts` - Add --export-bundle flag alongside existing --seed, --tier
- `src/types.ts` - CaseBundle, RULESET_VERSION

**Embedded Context:**

generateBundle signature (from Task 002):
```typescript
export function generateBundle(
    seed: number,
    tier?: DifficultyTier,
    options?: BundleOptions
): CaseBundle | null;

export function hashSolution(solution: Solution): string;
export function extractSolution(config: CaseConfig): Solution;
```

generateValidatedCase signature (sim.ts):
```typescript
export function generateValidatedCase(
    seed: number,
    tier: DifficultyTier = 2,
    options: SimulationOptions = {}
): { sim: SimulationResult; evidence: EvidenceItem[] } | null;
```

Function to implement in bundle.ts:
```typescript
export interface BundleValidationResult {
    valid: boolean;
    issues: string[];
    hashMatch: boolean;
    reportMatch: boolean;
    rulesetMatch: boolean;
}

/** Validate a bundle by regenerating from seed and checking consistency */
export function validateBundle(
    bundle: CaseBundle,
    tier?: DifficultyTier
): BundleValidationResult {
    const issues: string[] = [];
    const effectiveTier = tier ?? bundle.tier;

    // Check ruleset version
    const rulesetMatch = bundle.rulesetVersion === RULESET_VERSION;
    if (!rulesetMatch) {
        issues.push(`Ruleset version mismatch: bundle=${bundle.rulesetVersion}, current=${RULESET_VERSION}`);
    }

    // Regenerate from seed
    const regenerated = generateValidatedCase(bundle.seed, effectiveTier);
    if (!regenerated) {
        return { valid: false, issues: ['Failed to regenerate case from seed'], hashMatch: false, reportMatch: false, rulesetMatch };
    }

    // Verify solution hash
    const solution = extractSolution(regenerated.sim.config);
    const expectedHash = hashSolution(solution);
    const hashMatch = expectedHash === bundle.solutionHash;
    if (!hashMatch) {
        issues.push('Solution hash does not match regenerated case');
    }

    // Verify validator report key fields
    const signal = analyzeSignal(regenerated.evidence, regenerated.sim.config);
    const reportMatch = (
        bundle.validatorReport.signalType === signal.signalType &&
        bundle.validatorReport.keystoneExists === signal.hasSignal
    );
    if (!reportMatch) {
        issues.push('Validator report does not match regenerated case');
    }

    return {
        valid: hashMatch && reportMatch,
        issues,
        hashMatch,
        reportMatch,
        rulesetMatch,
    };
}
```

CLI integration pattern (existing cli.ts parseArgs):
```typescript
// Add to Args interface:
//   exportBundle: boolean;

// Add to parseArgs:
//   } else if (arg === '--export-bundle') {
//       exportBundle = true;
//   }

// Add to main execution block (between autosolve and playability):
// } else if (args.exportBundle) {
//     const bundle = generateBundle(args.seed ?? Math.floor(Math.random() * 10000), args.tier);
//     if (bundle) {
//         console.log(JSON.stringify(bundle, null, 2));
//     } else {
//         console.error('Failed to generate bundle');
//         process.exit(1);
//     }
// }
```

#### Entry Points / Wiring
- `validateBundle` exported from `src/bundle.ts` (available via `./bundle` package export)
- `--export-bundle` flag added to CLI arg parser and main execution block in `src/cli.ts`
- Help text in `src/cli.ts` updated with `--export-bundle` description

#### Files Touched
- `src/bundle.ts` - modify (add BundleValidationResult interface, validateBundle function)
- `src/cli.ts` - modify (add --export-bundle to Args, parseArgs, execution block, help text)

#### Acceptance Criteria
##### AC-1: validateBundle passes for fresh bundle <- R4.1
- **Given:** A bundle generated by generateBundle(seed, tier)
- **When:** validateBundle(bundle) is called
- **Then:** Returns { valid: true, hashMatch: true, reportMatch: true, rulesetMatch: true, issues: [] }

##### AC-2: validateBundle detects tampered hash <- R4.3
- **Given:** A valid bundle with solutionHash manually changed
- **When:** validateBundle(bundle) is called
- **Then:** Returns { valid: false, hashMatch: false } with issue about hash mismatch

##### AC-3: validateBundle detects mismatched seed <- R4.3
- **Given:** A valid bundle with seed manually changed to a different value
- **When:** validateBundle(bundle) is called
- **Then:** Returns { valid: false, hashMatch: false }

##### AC-4: validateBundle checks report consistency <- R4.2
- **Given:** A valid bundle with validatorReport.signalType manually changed
- **When:** validateBundle(bundle) is called
- **Then:** Returns { valid: false, reportMatch: false }

##### AC-5: --export-bundle outputs valid JSON <- R5.1
- **Given:** CLI invoked with `--export-bundle --seed 42`
- **When:** Command runs
- **Then:** stdout contains valid JSON parseable as CaseBundle

##### AC-6: --export-bundle respects --tier <- R5.2
- **Given:** CLI invoked with `--export-bundle --seed 42 --tier 3`
- **When:** Command runs and output is parsed
- **Then:** Bundle's tier field equals 3

#### Edge Cases
##### EC-1: validateBundle with different rulesetVersion
- **Scenario:** Bundle has rulesetVersion '0.0.1' but current is '0.1.0'
- **Expected:** Returns rulesetMatch: false with descriptive issue message; valid is still true if hashMatch and reportMatch pass (rulesetMatch is advisory)

##### EC-2: --export-bundle without --seed
- **Scenario:** CLI invoked with just `--export-bundle`
- **Expected:** Uses a random seed (same as existing CLI behavior) and outputs bundle

#### Error Cases
##### ERR-1: --export-bundle with unreproducible seed
- **When:** Seed produces no valid crime opportunity
- **Then:** Prints error message to stderr and exits with code 1
- **Error Message:** "Failed to generate bundle"

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | validateBundle passes for fresh bundle | `tests/bundle.test.ts` |
| AC-2 | validateBundle detects tampered hash | `tests/bundle.test.ts` |
| AC-3 | validateBundle detects mismatched seed | `tests/bundle.test.ts` |
| AC-4 | validateBundle checks report consistency | `tests/bundle.test.ts` |
| AC-5 | --export-bundle outputs valid JSON | `tests/bundle-cli.test.ts` |
| AC-6 | --export-bundle respects --tier | `tests/bundle-cli.test.ts` |
| EC-1 | validateBundle with different rulesetVersion | `tests/bundle.test.ts` |
| ERR-1 | --export-bundle with unreproducible seed | `tests/bundle-cli.test.ts` |

#### Notes
**Planning Notes:**
- validateBundle does a full regeneration rather than partial checks — expensive but thorough.
- rulesetMatch is advisory only — does NOT affect `valid`. Version drift is expected and informational; if hash and report match, the bundle is good.
- Keep --export-bundle output clean — only JSON to stdout, errors to stderr.
- The --export-bundle flag works with --seed but NOT with --generate (bundles are single-seed).
- CLI integration tests should spawn a subprocess via `execSync('npx tsx src/cli.ts --export-bundle --seed 42')` and parse stdout.

**Implementation Notes:** Added `BundleValidationResult` interface and `validateBundle()` to `src/bundle.ts`. Added `--export-bundle` flag to CLI arg parser, help text, and main execution block. CLI outputs clean JSON to stdout, errors to stderr. All 9 tests passing (6 AC + 2 EC + 1 ERR).
**Review Notes:** [filled by reviewer]

---

## Scope

**In Scope:**
- CaseBundle, Solution, WorldSnapshot, BundleValidatorReport type definitions
- generateBundle() pipeline function
- Solution hashing (SHA256 via existing canonical.ts utilities)
- Client-side answer verification (verifyAnswer)
- Bundle round-trip validation (validateBundle)
- CLI --export-bundle flag
- Package export for bundle module

**Out of Scope:**
- Solution encryption (AES) — v1 uses hash-only (Option C from notes)
- Bundle storage/API/file system strategy
- Daily seed integration (Feature 002 concern)
- CBOR/msgpack binary optimization
- Anti-cheat beyond hash verification
- Server-side validation endpoints

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Simulation changes break bundle determinism | Bundles from old rulesetVersion won't validate | rulesetVersion field tracks simulation version; validation compares versions |
| WorldSnapshot accidentally includes spoiler data | Players can cheat | R1.4 test explicitly checks for absence of every spoiler field |
| Hash collisions in Solution | Near-zero with SHA256 | Accepted risk for v1 |

---

## Open Questions

None — design decisions resolved in notes.md (Option C hashing, no encryption, no schedules in snapshot).

---

## Review Log

> Written by Reviewer after implementation
