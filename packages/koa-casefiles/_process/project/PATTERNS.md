# KOA Casefiles - Coding Patterns

Conventions and patterns used in this codebase.

---

## Type Patterns

### String IDs with Type Aliases

```typescript
// types.ts
export type NPCId = string;
export type PlaceId = string;
export type WindowId = string;
export type EventId = string;
```

These provide documentation and enable future refinement without breaking code.

### Discriminated Unions for Evidence

```typescript
export type EvidenceItem =
    | PresenceEvidence
    | DeviceLogEvidence
    | TestimonyEvidence
    | PhysicalEvidence
    | MotiveEvidence;

// Each has a 'kind' field for discrimination
interface PresenceEvidence extends BaseEvidence {
    kind: 'presence';
    npc: NPCId;
    window: WindowId;
    place: PlaceId;
}
```

### Config Objects

```typescript
interface CaseConfig {
    seed: number;
    culpritId: NPCId;
    crimeType: CrimeType;
    // ...
}
```

Ground truth is always in a config object, passed explicitly.

---

## RNG Patterns

### Seeded RNG

```typescript
import { createRng, type RNG } from './kernel/rng.js';

const rng = createRng(seed);
const choice = rng.pick(options);
const value = rng.nextInt(max);
```

Never use `Math.random()`. Always pass RNG through function params.

### Deterministic Event IDs

```typescript
import { computeEventId } from './kernel/canonical.js';

const event = {
    id: computeEventId({ tick, ordinal, type, ...fields }),
    // ...
};
```

IDs are content-based hashes for stable references.

---

## Evidence Patterns

### Citation Tracking

```typescript
// Every evidence item cites its source events
evidence.push({
    id: makeEvidenceId('physical'),
    kind: 'physical',
    // ...
    cites: events
        .filter(e => e.type === 'ITEM_TAKEN' && e.target === item.id)
        .map(e => e.id),
});
```

### Anti-Anticlimax Guards

```typescript
// Never identify culprit directly at crime scene
const isCrimeEvent = config &&
    event.actor === config.culpritId &&
    event.window === config.crimeWindow;

if (isCrimeEvent) {
    confidence = Math.min(confidence, 0.5);
    subject = undefined; // Don't identify
}
```

### Method Hints

```typescript
// Physical evidence includes method tag for HOW deduction
evidence.push({
    // ...
    detail: `[CRIME SCENE] ${missingDetail}`,
    methodTag: methodId,  // 'grabbed', 'smuggled', etc.
});
```

---

## Game Loop Patterns

### Command Handler Structure

```typescript
switch (verb) {
    case 'SEARCH': {
        // 1. Validate args
        if (cmdArgs.length < 2) throw new Error('Usage: ...');

        // 2. Check for lead discount
        const lead = session.matchesLead(place, window);
        const free = !!lead;
        if (lead) session.useLead(lead);

        // 3. Perform action
        const result = performSearch(session, place, window, free);

        // 4. Format output
        const formatted = koa.formatSearch(place, window, evidence);
        print(formatted, agentMode, { type: 'action_result', ...result });

        // 5. Fire reactive barks
        if (result.resultCode === 'EMPTY') {
            fireBark(barkState, 'SEARCH_EMPTY', { shape, turn });
        }

        return;
    }
}
```

### State Persistence

```typescript
interface SavedState {
    currentDay: number;
    actionPoints: number;
    knownEvidenceIds: string[];  // Store IDs, reconstruct from allEvidence
    // ...
}

function saveState(session: PlayerSession, seed: number): void {
    const state: SavedState = { ... };
    writeFileSync(getSaveFilePath(seed), JSON.stringify(state, null, 2));
}
```

---

## Testing Patterns

### Solver Strategy

```typescript
// solver.ts follows optimal investigation order
async function solve(session: PlayerSession): Promise<AccusationResult> {
    // 1. Get gossip → learn WHAT/WHERE/WHEN
    await runCommand('INTERVIEW alice gossip');

    // 2. Search crime scene → find physical evidence
    await runCommand(`SEARCH ${crimePlace} ${crimeWindow}`);

    // 3. Get device logs → track movement
    await runCommand(`LOGS door ${crimeWindow}`);

    // 4. Interview for testimony → gather witness accounts
    for (const npc of suspects) {
        await runCommand(`INTERVIEW ${npc} ${crimeWindow} testimony`);
    }

    // 5. Find contradictions → identify liar
    const contradictions = findContradictions(session.knownEvidence);

    // 6. Accuse based on evidence
    return buildAccusation(contradictions, motives);
}
```

### Validation Metrics

```typescript
interface CaseValidation {
    valid: boolean;
    reason?: string;
    solvability: ValidationResult;
    antiAnticlimax: ValidationResult;
    redHerrings: ValidationResult;
    difficulty?: DifficultyValidation;
}
```

---

## Blueprint Patterns

### Blueprint Structure

```typescript
interface IncidentBlueprint {
    id: string;
    incidentType: 'theft' | 'sabotage' | 'prank';
    variants: MethodVariant[];
    requirements: Requirements;
}

interface CrimePlan {
    blueprintId: string;
    variantId: MethodId;
    culprit: NPCId;
    targetItem: ItemId;
    crimePlace: PlaceId;
    hidePlace: PlaceId;
    crimeWindow: WindowId;
}
```

### Blueprint Instantiation

```typescript
function tryInstantiateAny(
    blueprints: IncidentBlueprint[],
    world: World,
    rng: RNG,
    maxAttempts: number
): { blueprint: IncidentBlueprint; plan: CrimePlan } | null {
    for (let i = 0; i < maxAttempts; i++) {
        const bp = rng.pick(blueprints);
        const plan = tryInstantiate(bp, world, rng);
        if (plan) return { blueprint: bp, plan };
    }
    return null;
}
```

---

## Output Formatting

### KOA Voice

```typescript
// koa-voice.ts provides personality-infused formatting
export function formatSearch(
    place: string,
    window: string,
    evidence: PhysicalEvidence[],
    gatedHint: boolean
): string {
    // Returns formatted box with KOA commentary
}
```

### Agent Mode

```typescript
function print(msg: string, agentMode: boolean, json?: any) {
    if (agentMode) {
        console.log(JSON.stringify(json ?? { type: 'info', message: msg }));
    } else {
        console.log(msg);
    }
}
```

---

## Error Handling

### Validation Errors

```typescript
if (!config.suspects.includes(who)) {
    throw new Error(`Unknown suspect: ${who}. Valid: ${config.suspects.join(', ')}`);
}
```

### Graceful Fallbacks

```typescript
// Fall back to legacy if blueprints fail
const instantiation = tryInstantiateAny(blueprints, world, rng, 20);
if (!instantiation) {
    return simulate(seed, difficultyTier, { useBlueprints: false });
}
```

### Null Seed Handling

```typescript
if (opportunities.length === 0) {
    // RESCUE STRATEGY: Force a distraction
    // ... attempt to create valid opportunity
}

if (opportunities.length === 0) {
    return null; // This seed fails
}
```
