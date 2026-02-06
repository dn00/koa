# Patterns: Project PARANOIA

**Date:** 2026-02-05

Coding conventions and patterns established in the codebase.

---

## Architecture Pattern: Event Sourcing

All state changes flow through the proposal pipeline:

```typescript
// 1. Generate proposals (KernelEvent candidates)
const proposals = [
  ...proposeCommandEvents(state, commands),
  ...proposeCrewEvents(state),
  ...proposeArcEvents(state),
  ...proposeCommsEvents(state),
];

// 2. Score and select
const selected = scoreAndSelect(proposals, budget);

// 3. Apply to state (pure mutation)
for (const event of selected) {
  applyEvent(state, event);
}
```

No code should bypass this pipeline to directly mutate state (except deterministic systems ticks).

---

## State Pattern: Truth/Perception Split

```typescript
// Truth = what's actually happening (hidden from player)
interface TruthState { ... }

// Perception = what MOTHER/player knows (shown to player)
interface PerceptionState { ... }

// Player output comes from perception queries, NEVER raw truth
const display = perceiveStation(truth, perception);
```

---

## Configuration Pattern

All tuning parameters live in `config.ts` with env override:

```typescript
// Pattern: defaultValue overridden by PARANOIA_KEY_NAME env var
export const cfg = {
  quotaPerDay: envInt('PARANOIA_QUOTA_PER_DAY', 8),
  winDays: envInt('PARANOIA_WIN_DAYS', 5),
  // ...
};
```

No magic numbers in game logic. All tuning values reference `cfg.*`.

---

## Naming Conventions

- **Files:** kebab-case (`kernel.ts`, `perception.ts`)
- **Types:** PascalCase (`TruthState`, `KernelEvent`, `NPCId`)
- **Functions:** camelCase (`stepKernel`, `applyEvent`, `perceiveStation`)
- **Config keys:** camelCase (`quotaPerDay`, `resetThresholdCountdown`)
- **Env vars:** SCREAMING_SNAKE with `PARANOIA_` prefix (`PARANOIA_QUOTA_PER_DAY`)

---

## NPC Pattern: Role Actions

Each NPC has a unique role action defined by:
1. **Trigger condition** — stress/loyalty/paranoia threshold
2. **Action** — state mutation with specific effects
3. **Cooldown** — minimum ticks between firings
4. **Evidence** — observable consequences for suspicion/rumors

```typescript
// Example: Engineer sabotage
if (crew.stress >= cfg.engineerStressThreshold || crew.loyalty <= cfg.sabotageThreshold) {
  // Action: damage power, comms, door delay
  // Cooldown: 22 ticks
  // Evidence: witnessed by crew in same room
}
```

---

## Crisis Arc Pattern

Arcs are multi-step escalation clocks:

```typescript
interface ActiveArc {
  kind: ArcKind;       // 'fire_outbreak' | 'air_scrubber' | etc.
  step: number;        // Current escalation step
  nextStepTick: number; // When next step fires
  place: PlaceId;      // Affected room
}
```

Each step increases severity. Player can intervene between steps to resolve.

---

## Testing Pattern

Balance testing uses solver scripts, not unit tests:

```bash
npx tsx scripts/smart-solver.ts 200   # Optimal play
npx tsx scripts/stress-test.ts 200    # Passive play
npx tsx scripts/debug-solver.ts 1014  # Specific seed
```

Win rates are the primary balance metric. See INVARIANTS.md I12-I14 for targets.

---

## CLI Output Pattern

All player-facing output is diegetic (in-world):
- Status shows sensor readings, not raw state
- Bio shows HR/cortisol/tremor, not stress/loyalty/paranoia numbers
- Threats use confidence traffic lights (confirmed/uncertain/conflicting)
- Intent labels (HOSTILE, SABOTAGE RISK) instead of raw paranoia values

---

## V2 Patterns (Apply After Implementation)

### TamperOp Lifecycle Pattern

Every tamper command creates an operation that tracks its own contradiction:

```typescript
interface TamperOp {
  kind: 'SUPPRESS' | 'SPOOF' | 'FABRICATE';
  status: 'PENDING' | 'RESOLVED' | 'BACKFIRED' | 'CONFESSED';
  windowEndTick: number;      // after this, backfire possible
  crewAffected: NPCId[];      // who acted on the lie
  severity: 1 | 2 | 3;
}
```

Each tick, pending ops are checked against reality. Backfire creates ActiveDoubts that VERIFY can clear. See `TAMPER_BACKFIRE_DESIGN.md`.

### Suspicion Ledger Pattern

Every suspicion change must be logged with reason and detail:

```typescript
addToSuspicionLedger(state, delta, reason, detail);
// e.g. addToSuspicionLedger(state, +10, 'SUPPRESSION_DISCOVERED', 'thermal crisis hidden from crew')
```

Player can see recent entries in STATUS output. End-of-day recap summarizes.

### Pressure Channel Pattern

Director selects pressure channel based on suspicion band before choosing specific event:

```typescript
const mix = getPressureMix(suspicion); // { physical: 0.6, social: 0.1, epistemic: 0.3 }
const channel = pickChannel(mix, rng);
// then: activate event matching channel
```

Physical uses existing arcs. Social/epistemic use comms infrastructure.
