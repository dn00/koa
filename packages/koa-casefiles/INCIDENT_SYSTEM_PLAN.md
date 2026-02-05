# KOA Casefiles - Incident Blueprint System (System B)

**Date:** 2026-02-05
**Status:** PLAN - Awaiting Approval

---

## Goal

Replace the current "on-rails" case generation with a parameterized blueprint system that produces high-variety, funny, replayable cases through orthogonal variation knobs.

## Key Insight

The core algorithms (pathfinding, opportunity detection, evidence derivation) are **already topology-agnostic**. The hardcoding is concentrated in data definitions. This is mostly a data restructuring effort, not algorithm rewriting.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   GENERATION PIPELINE                        │
│  Generate 100+ candidates → Validate → Fingerprint → Select │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   TOPOLOGY    │    │     CAST      │    │   INCIDENT    │
│   FAMILIES    │    │    RECIPES    │    │  BLUEPRINTS   │
│               │    │               │    │               │
│ hub_spokes    │    │ 15+ archetypes│    │ Intent-driven │
│ loop          │    │ Pick 5-6/case │    │ Method vars   │
│ gated_wing    │    │ Generic sched │    │ Fallbacks     │
│ split_level   │    │               │    │ Evidence budget│
└───────────────┘    └───────────────┘    └───────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SHENANIGAN PACK                           │
│  (Comedy layer - completely separate from truth)             │
│                                                              │
│  • Objects with affordances (swappable, spillable, squeaks) │
│  • Petty motives library                                     │
│  • Social dynamics templates                                 │
│  • Comedic twist rules                                       │
│  • Bark templates with slots                                 │
│  • KOA personality modes                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 1: Incident Blueprints

### What an Incident Is

An **Incident = a constrained event-chain** with:
- **Roles** (culprit, target/victim, witnesses, helpers)
- **A goal** (steal/swap/sabotage/spoof/misdeliver)
- **A method** (door spoof, camera gap, alibi trick, item swap)
- **A location + time window**
- **A cover-up behavior** (hide item, delete log, create distraction)
- **A guaranteed evidence footprint** (so the case is solvable)

### IncidentBlueprint Schema

```typescript
interface IncidentBlueprint {
    id: string;
    incidentType: 'theft' | 'sabotage' | 'disappearance' | 'prank' | 'swap';

    // Roles
    roles: {
        required: RoleSpec[];    // culprit, target
        optional: RoleSpec[];    // witnessA, witnessB, redHerring
    };

    // Requirements
    requiredProps: {
        items: ItemConstraint[];
        devices: DeviceConstraint[];
    };
    preconditions: Precondition[];  // "culprit has access to door"

    // Intent-driven plan (not coordinates)
    planSteps: PlanStep[];
    fallbacks: FallbackRule[];

    // Evidence requirements
    evidenceBudget: EvidenceBudget;
    antiClimaxRules: AntiClimaxRule[];

    // Comedy hooks
    comedySkin: ComedySkin;
}

interface PlanStep {
    id: string;
    intent: Intent;  // MOVE_TO, ACQUIRE, SPOOF, SWAP, HIDE, DISTRACT
    actor: RoleId;
    target?: string;  // place, item, device, or NPC role
    generateEvents: EventType[];
}

interface Intent {
    type: 'MOVE_TO' | 'ACQUIRE' | 'SPOOF' | 'SWAP' | 'HIDE' | 'DISTRACT' | 'WAIT';
    params: Record<string, unknown>;
}

interface FallbackRule {
    trigger: 'door_locked' | 'witness_present' | 'item_missing' | 'timeout';
    actions: FallbackAction[];  // Ordered by priority
}

type FallbackAction =
    | { type: 'wait'; ticks: number }
    | { type: 'alternate_route'; via: PlaceConstraint }
    | { type: 'create_distraction'; method: string }
    | { type: 'swap_method'; to: MethodId };

interface EvidenceBudget {
    whoChains: number;      // Min 2 independent chains for WHO
    howChains: number;      // Min 1 chain for HOW
    whenChains: number;     // Min 1 chain for WHEN
    whereChains: number;    // Min 1 chain for WHERE
    whyChains: number;      // Min 1 chain for WHY (motive)
    requiredModalities: EvidenceKind[];  // device_log, physical, testimony
}
```

### Method Variants

Each blueprint has 3-6 method variants:

```typescript
interface MethodVariant {
    id: MethodId;
    name: string;
    planStepsOverride?: Partial<PlanStep>[];
    requiredConditions: MethodCondition[];
    evidenceSignature: EvidenceSignature[];
    comedyHooks: string[];
}

// Example: "Swapped Package" blueprint
const SWAPPED_PACKAGE: IncidentBlueprint = {
    id: 'swapped_package',
    incidentType: 'swap',
    roles: {
        required: [{ id: 'culprit' }, { id: 'target' }],
        optional: [{ id: 'witnessA' }, { id: 'redHerring' }],
    },
    methodVariants: [
        { id: 'voice_spoof', name: 'Spoof delivery voice command' },
        { id: 'label_swap', name: 'Swap labels in mailbox' },
        { id: 'intercept', name: 'Intercept via unlocked door' },
    ],
    evidenceBudget: {
        whoChains: 2,
        howChains: 1,
        whenChains: 1,
        whereChains: 1,
        whyChains: 1,
        requiredModalities: ['device_log', 'physical', 'testimony'],
    },
    // ...
};
```

---

## Part 2: Topology Families

### TopologyFamily Schema

```typescript
type TopologyId =
    | 'hub_spokes'      // Current: living room central hub
    | 'loop'            // Circular path, no dead ends
    | 'gated_wing'      // Two sections with single connection
    | 'split_level'     // Vertical layers with limited access
    | 'open_plan';      // Few walls, high visibility

interface TopologyFamily {
    id: TopologyId;
    name: string;

    placeCount: { min: number; max: number };
    connectivityRules: ConnectivityRule[];

    deviceStrategy: DevicePlacementStrategy;
    placeTemplates: PlaceTemplate[];

    // Graph properties
    expectedDiameter: number;
    chokepointCount: number;
}

interface DevicePlacementStrategy {
    doorSensorCoverage: number;     // 0-1
    motionSensorPlacement: 'hub' | 'chokepoints' | 'random';
    wifiPresencePlacement: 'isolated' | 'all' | 'random';
}
```

### Example Topologies

**Hub+Spokes (Current):**
```
    B  K
     \ /
      L --- O --- G
```

**Loop Apartment:**
```
K --- L --- Br
|           |
B --------- O
```

**Gated Wing:**
```
Main Hall
  +-- Public Wing (K, L, O)
  |     └─ Gate ─┐
  +-- Private Wing (Br, Study, G)
```

---

## Part 3: Cast Recipes

### NPC Archetypes (15+)

```typescript
type ArchetypeId =
    // Work styles
    | 'workaholic' | 'slacker' | 'creative' | 'techie'
    // Sleep patterns
    | 'early_bird' | 'night_owl' | 'insomniac'
    // Social styles
    | 'social_butterfly' | 'introvert' | 'gossip' | 'peacemaker' | 'troublemaker'
    // Personality
    | 'paranoid' | 'oblivious' | 'nosy' | 'secretive';

interface NPCArchetype {
    id: ArchetypeId;
    name: string;

    // Schedule (generic, not hardcoded rooms)
    schedulePattern: SchedulePattern;
    preferredPlaceTypes: PlaceType[];  // 'social', 'private', 'functional'

    // Distraction profile
    distractibility: number;           // 0-100
    peakAlertWindows: WindowId[];
    peakDistractedWindows: WindowId[];

    // Social
    gossipTendency: number;
    witnessReliability: number;

    // Comedy
    embarrassmentThreshold: number;    // For embarrassment meter
    comedyTraits: string[];
}
```

### CastRecipe Schema

```typescript
interface CastRecipe {
    id: string;
    archetypePool: ArchetypeId[];
    minCastSize: number;  // 5
    maxCastSize: number;  // 6
    requiredArchetypes: ArchetypeId[];
    forbiddenCombinations: [ArchetypeId, ArchetypeId][];
    relationshipRules: RelationshipRule[];
}
```

---

## Part 4: Shenanigan Pack (Comedy Layer)

Comedy is **completely separate from truth**. The sim produces clear causality; the Shenanigan Pack skins it with humor.

### Objects with Affordances

```typescript
interface ShenaniganObject {
    id: string;
    name: string;
    funnyName: string;           // "Sourdough starter 'Gerald'"
    category: ItemCategory;

    // Affordances (used by blueprints)
    affordances: ObjectAffordance[];

    // Comedy properties
    awkwardness: number;         // 0-100
    whyPeopleCare: string;       // "It's been in the family for 3 weeks"
}

type ObjectAffordance =
    | 'swappable'
    | 'spillable'
    | 'squeaks'
    | 'needsFridge'
    | 'leavesResidue'
    | 'fragile'
    | 'smelly'
    | 'embarrassing';
```

### Petty Motives Library

```typescript
const PETTY_MOTIVES = [
    "Prove I'm right",
    "Avoid embarrassment",
    "Win the bake-off",
    "Get attention",
    "Revenge for a group chat incident",
    "Hide a mistake",
    "Jealous of praise",
    "Fear of being judged",
    "Algorithmic hustle (reselling)",
];
```

### Social Dynamics

```typescript
const SOCIAL_DYNAMICS = [
    "Passive-aggressive roommates",
    "HOA tyrant vs chaos neighbor",
    "Influencer vs normie",
    "Overly earnest volunteer group",
    "Neighborhood group chat wars",
];
```

### Comedic Twist Rules

```typescript
type ComedyTwist =
    | 'well_intentioned_sabotage'   // Culprit thinks they're helping
    | 'overcorrection'              // Fix causes worse outcome
    | 'mistaken_identity'           // Same hoodie / phone name
    | 'device_misinterpretation'    // KOA hears wrong command
    | 'polite_lying'                // Fake compliment alibi
    | 'pet_factor';                 // Cat triggers sensor, steals item
```

### Bark Templates with Slots

```typescript
interface BarkTemplate {
    id: string;
    template: string;
    tags: string[];
    context: BarkContext;
}

const BARK_TEMPLATES = [
    {
        template: "I have logged {absurdity}. This is… not standard household behavior.",
        tags: ['koa', 'dry', 'observation'],
    },
    {
        template: "I saw {subjectHint} near {place} during {window}, and they looked {vibe}.",
        tags: ['testimony', 'witness'],
    },
    {
        template: "Minor irregularity detected: {object} status = {state}. Recommend de-escalation.",
        tags: ['koa', 'corporate'],
    },
];
```

### KOA Personality Modes

```typescript
type KOAMode =
    | 'corporate'           // Euphemisms, liability shielding
    | 'passive_aggressive'  // "Noted. Interesting choice."
    | 'overhelpful'         // "I filed your shame under 'Kitchen: Crimes'."
    | 'conspiracy';         // "Pattern match: 87% chance of petty revenge."
```

---

## Part 5: Validation & Anti-Pattern Rules

### Comedy Validators (Required per case)

```typescript
interface ComedyRequirements {
    absurdProps: number;              // Min 1 absurd prop
    pettyMotiveImplied: boolean;      // Motive must be petty
    benignSuspiciousAct: number;      // Min 1 red herring
    directConfession: number;         // Must be 0
}
```

### Anti-Pattern Rejection Rules

Reject a candidate if:

```typescript
interface AntiPatternRules {
    // Same object archetype 3 days in a row
    objectArchetypeCooldown: 3;

    // Same twist rule too often
    twistRuleCooldown: 5;

    // Same culprit method repeats
    methodCooldown: 3;

    // Same evidence topology
    evidenceTopologySimilarityThreshold: 0.7;
}
```

### Fingerprint for Novelty Gating

```typescript
interface CaseFingerprint {
    topologyFamily: TopologyId;
    culpritArchetype: ArchetypeId;
    incidentType: IncidentType;
    methodId: MethodId;
    evidencePattern: string;       // Hash of evidence topology
    primaryContradictionType: string;
    absurdPropCategory: ItemCategory;
}

function isTooSimilar(
    fingerprint: CaseFingerprint,
    recentFingerprints: CaseFingerprint[],
    threshold: number = 0.6
): boolean {
    // Hamming distance on fingerprint fields
    // Reject if similarity > threshold with any of last 14 cases
}
```

---

## Part 6: Two Tiny Comedy Systems

### Embarrassment Meter (per NPC)

```typescript
interface EmbarrassmentState {
    npcId: NPCId;
    level: number;           // 0-100
    triggers: string[];      // What caused it
}

// High embarrassment → lies, avoidance, weird alibis
function getTestimonyModifier(embarrassment: number): TestimonyModifier {
    if (embarrassment > 70) return { lies: true, avoids: true };
    if (embarrassment > 40) return { vague: true };
    return { honest: true };
}
```

### Petty Escalation Rule

```typescript
// If NPC gets wronged, they do small retaliation later
// Not part of crime, just spice

interface PettyEscalation {
    wrongedNpc: NPCId;
    wrongedBy: NPCId;
    retaliationType: 'passive_aggressive_note' | 'hide_item' | 'spread_rumor';
    tick: number;
}
```

---

## Part 7: Generation Pipeline

```typescript
function generateCase(
    dailySeed: number,
    difficulty: DifficultyConfig,
    recentCases: CaseFingerprint[]
): SimulationResult | null {
    const rng = createRng(dailySeed);

    // 1. Select topology (with cooldown check)
    const topology = selectTopology(difficulty, recentCases, rng);

    // 2. Select cast recipe
    const cast = generateCast(selectCastRecipe(difficulty, rng), topology, rng);

    // 3. Assemble world
    const world = assembleWorld(topology, cast, rng);

    // 4. Generate 100+ candidates
    const candidates: CaseCandidate[] = [];
    for (let i = 0; i < 300; i++) {
        const candidateRng = createRng(dailySeed + i);

        // Select blueprint
        const blueprint = selectBlueprint(difficulty, world, candidateRng);

        // Instantiate (intent-driven, with fallbacks)
        const instance = instantiateBlueprint(blueprint, world, candidateRng);
        if (!instance) continue;

        // Simulate
        const result = simulateFromInstance(instance, world, candidateRng);

        // Validate
        const validation = validateCandidate(result, difficulty);
        if (!validation.passed) continue;

        // Comedy validation
        const comedyValid = validateComedy(result, COMEDY_REQUIREMENTS);
        if (!comedyValid) continue;

        // Fingerprint & novelty check
        const fingerprint = computeFingerprint(result);
        if (isTooSimilar(fingerprint, recentCases)) continue;

        candidates.push({ result, fingerprint, score: validation.score });

        if (candidates.length >= 100) break;
    }

    // 5. Select (with 5% outlier preservation)
    return selectFinalCandidate(candidates, rng)?.result ?? null;
}
```

---

## Part 8: File Structure

```
src/
├── blueprints/
│   ├── types.ts              # IncidentBlueprint, PlanStep, Intent, etc.
│   ├── registry.ts           # Blueprint registry
│   ├── theft/                # Theft blueprints
│   ├── sabotage/             # Sabotage blueprints
│   ├── swap/                 # Swap blueprints
│   └── disappearance/        # Disappearance blueprints
│
├── topology/
│   ├── types.ts              # TopologyFamily, PlaceTemplate
│   ├── families.ts           # Hub, Loop, Gated, Split definitions
│   └── generator.ts          # generateTopology()
│
├── cast/
│   ├── archetypes.ts         # 15+ NPC archetypes
│   ├── recipes.ts            # Cast recipes
│   └── schedule-gen.ts       # Generic schedule generation
│
├── shenanigans/
│   ├── objects.ts            # Objects with affordances
│   ├── motives.ts            # Petty motives library
│   ├── dynamics.ts           # Social dynamics
│   ├── twists.ts             # Comedic twist rules
│   ├── barks.ts              # Bark templates
│   └── koa-modes.ts          # KOA personality modes
│
├── generation/
│   ├── pipeline.ts           # Main generateCase()
│   ├── instantiate.ts        # Blueprint instantiation
│   ├── fingerprint.ts        # Case fingerprinting
│   ├── novelty.ts            # Anti-pattern rejection
│   └── validators.ts         # Comedy + core validators
│
├── systems/
│   ├── embarrassment.ts      # Embarrassment meter
│   └── escalation.ts         # Petty escalation
│
└── sim.ts                    # Refactored to use blueprints
```

---

## Part 9: Implementation Phases

### Phase 1: Types & Infrastructure (2-3 days)
- Create all type definitions
- No behavior changes, existing tests pass

### Phase 2: Topology System (3-4 days)
- Define 4 topology families
- Implement `generateTopology()`
- Backward compatible (default = current)

### Phase 3: Cast System (3-4 days)
- Define 15 NPC archetypes
- Generic schedule generation
- Backward compatible

### Phase 4: Incident Blueprints (5-6 days)
- Define blueprints for all 4 crime types
- Implement intent-driven execution with fallbacks
- Refactor `sim.ts`

### Phase 5: Shenanigan Pack (3-4 days)
- Objects with affordances
- Bark templates
- KOA modes

### Phase 6: Generation Pipeline (3-4 days)
- Multi-candidate generation
- Fingerprinting and novelty gating
- Comedy validation

### Phase 7: Polish (2-3 days)
- Embarrassment meter
- Petty escalation
- Anti-pattern rules

---

## Part 10: Verification

```bash
# Type check
npx tsc --noEmit

# Existing tests (must pass)
npm test

# Generate with new system
npx tsx src/cli.ts --generate 50 -v --tier 2

# Verify variety (check fingerprints)
npx tsx src/cli.ts --generate 50 --show-fingerprints | sort | uniq -c

# Play test
npx tsx src/game.ts --seed 1 --agent-mode
```

---

## Success Criteria

1. **Variety**: 50 consecutive cases have <20% fingerprint overlap
2. **Determinism**: Same seed = same case
3. **Backward compatible**: Default params = current behavior
4. **Comedy preserved**: Absurd props, petty motives, KOA snark
5. **No pattern fatigue**: Anti-pattern rejection works
6. **Performance**: <5s for 100 candidates
