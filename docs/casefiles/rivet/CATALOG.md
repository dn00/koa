# RIVET File Catalog

Detailed inventory of every file in the RIVET kernel package. Use this to understand what each file does and decide what to include in your game.

## Core Infrastructure (`src/core/`)

**Status: Copy as-is. Don't modify unless you understand the implications.**

| File | Purpose | Key Exports |
|------|---------|-------------|
| `kernel.ts` | 10-phase deterministic tick execution engine | `createKernel`, `ReducerRegistry`, `SystemRegistry`, `SystemContext`, `Kernel` |
| `rng.ts` | Deterministic xoroshiro128** random number generator | `createRng`, `restoreRng`, `RNG` interface |
| `canonical.ts` | Canonical JSON serialization + SHA256 hashing | `canonicalJson`, `sha256`, `computeStateHash`, `computeEventId`, `computeWorldRulesDigest` |
| `hash-chain.ts` | Hash chain computation and verification | `computeBatchHash`, `computeNextLastEventHash`, `verifyHashChain`, `HashChainMismatchError` |
| `validation.ts` | Runtime validation for deterministic state | `validateState`, `assertDeterministic`, `assertSafeInteger`, `intDiv`, `intDivFloor` |

### kernel.ts - Core Step Engine

The heart of RIVET. Implements:
- **SystemRegistry**: Manages system execution order (priority -> packOrder -> systemId)
- **ReducerRegistry**: Maps event types to reducer functions
- **Kernel.step()**: 10-phase tick execution

Key types:
```typescript
interface SystemDefinition {
  systemId: string;
  priority?: number;  // Lower = runs first (default 0)
  packOrder?: number; // For pack ordering (default 0)
  run: System;
}

interface SystemContext {
  readonly state: WorldState;
  proposeEvent(type, payload, attribution): void;
  rng(streamId: string): RNG;
  getEntitiesByType(type): EntityRecord[];
  getEntity(id): EntityRecord | undefined;
}
```

### rng.ts - Deterministic RNG

xoroshiro128** implementation with:
- BigInt-based 64-bit operations
- FNV-1a seed derivation from strings
- Rejection sampling for unbiased `nextInt()`

```typescript
const rng = createRng(worldSeed, streamId);
const value = rng.nextInt(100); // [0, 100)
const state = rng.getState();   // Serialize for persistence
```

### canonical.ts - Hashing Infrastructure

Canonical JSON rules:
1. UTF-8 encoding
2. No whitespace
3. Object keys sorted lexicographically
4. Arrays preserve order
5. Integers only (no floats)
6. No null for absent fields (omit instead)

### hash-chain.ts - Tamper-Evident History

```
batchHash = sha256(canonical_json(events[]))
lastEventHash = sha256(prevLastEventHash + batchHash)
```

Provides replay verification - any modification breaks the chain.

### validation.ts - Determinism Guards

Rejects non-deterministic values:
- Floats, Infinity, NaN
- Map, Set, Date
- BigInt (convert to string first)
- Unsafe integers (outside safe range)

---

## Types (`src/types/`)

**Status: Adapt for your game's state shape.**

| File | Purpose | Key Exports |
|------|---------|-------------|
| `core.ts` | Base type definitions | `WorldEnvelope`, `WorldState`, `EntityRecord`, `SimEvent`, `Cause`, `Attribution`, `EVENT_TYPES` |

### core.ts - Foundation Types

Core primitives:
```typescript
type WorldId = string;      // UUID
type TickIndex = number;    // Monotonic integer
type EntityId = string;     // Stable entity ID
type EventId = string;      // SHA256 hash
```

Entity record pattern:
```typescript
interface EntityRecord {
  id: EntityId;
  type: EntityType;
  createdTick: number;
  deletedTick?: number;    // Tombstone marker
  components: Record<string, unknown>;  // Namespaced
}
```

Event structure:
```typescript
interface SimEvent {
  eventId: EventId;
  tickIndex: TickIndex;
  ordinal: number;          // Position within tick
  type: EventType;
  payload: unknown;
  causedBy: Cause;
  attribution: Attribution;
}
```

---

## Utilities (`src/utils/`)

**Status: Use as-is. Game-agnostic algorithms.**

| File | Purpose | Key Functions |
|------|---------|---------------|
| `pathfinding.ts` | Grid pathfinding (A*, BFS) | `findPath`, `findPathAStar`, `findPathWithCosts`, `findNearestCover`, `findNearestShadow` |
| `vision.ts` | Line-of-sight calculations | `hasLineOfSight`, `isInVisionCone`, `isInPeripheral`, `canGuardSee` |
| `placegraph.ts` | Graph navigation | `shortestPath` (Dijkstra), `getNeighbors`, `seedWorld` |

### pathfinding.ts - Grid Navigation

**Basic pathfinding:**
- `findPath(from, to, map)` - BFS shortest path
- `findPathAStar(from, to, map)` - A* (more efficient for long distances)

**Cost-aware pathfinding (for stealth games):**
- `findPathWithCosts(from, to, ctx)` - A* with dynamic costs
- Costs: danger (near guards), light, crowd, reservations

**Cover/shadow finding:**
- `findNearestCover(from, map)` - Find wall-adjacent tile
- `findNearestShadow(from, map)` - Find shadow tile

**Reservation system (WHCA* lite):**
- `createReservationTable(horizonH)`
- `reserveTile(table, tileId, tick, agentId)`
- `isReserved(table, tileId, tick, excludeAgent)`

**Intent system:**
- `createMoveIntent(agent, route, ctx)` - Convert route to move intent
- `resolveIntents(intents, occupancy, config)` - Resolve collisions

### vision.ts - Line of Sight

**Core LOS:**
- `hasLineOfSight(from, to, tiles)` - Bresenham's algorithm
- `hasLineOfSightWithDoors(from, to, tiles, doors)` - Respects door state

**Vision cones:**
- `isInVisionCone(guardPos, facing, targetPos, angle, range)`
- `isInPeripheral(guardPos, targetPos, range)` - Adjacent detection

**Combined check:**
- `canGuardSee(...)` - Full visibility check with smoke, shadow, lights

### placegraph.ts - Graph Navigation

For node-based worlds (not grids):
- `shortestPath(from, to, edges)` - Dijkstra with deterministic tie-breaking
- `seedWorld(seedData)` - Initialize world from seed
- `getNeighbors(placeId, graph)` - Adjacent places

---

## Patterns (`src/patterns/`)

**Status: Game-agnostic reusable patterns. Copy and adapt for your game.**

| File | Purpose | Key Exports |
|------|---------|-------------|
| `detection-accumulator.ts` | Gradual detection with thresholds | `DetectionState`, `DetectionConfig`, `detectEntity`, `decayDetection`, `getThresholdCrossing` |
| `state-machine.ts` | Deterministic FSM for entity behavior | `FSMConfig`, `FSMInstance`, `createFSM`, `tickFSM`, `transitionTo`, `GUARD_STATES`, `GUARD_TRANSITIONS` |
| `needs-system.ts` | 0-1000 needs with lazy evaluation | `NeedsComponent`, `createNeedsComponent`, `getNeedValue`, `satisfyNeed`, `getMostUrgentNeed`, `scoreNeedIntent` |
| `intent-scoring.ts` | Score-based decisions with tie-breaking | `ScoredOption`, `selectBest`, `canSwitchIntent`, `scoreNeed`, `scoreJob`, `scorePursuit`, `buildIntentOption` |
| `alert-escalation.ts` | Multi-level alert system | `AlertState`, `AlertConfig`, `addEvidence`, `decayEvidence`, `isInLockdown`, `setAlertLevel` |

### detection-accumulator.ts - Gradual Detection

Instead of binary detection, use a 0-100 accumulator:
```typescript
interface DetectionState {
  value: number;        // 0-100
  gainingTicks: number; // Consecutive ticks gaining detection
}

interface DetectionConfig {
  gainPerTick: number;      // Rate when visible (default 15)
  decayPerTick: number;     // Rate when hidden (default 8)
  noticedThreshold: number; // When noticed (default 35)
  spottedThreshold: number; // Full detection (default 70)
  lostThreshold: number;    // Lost contact (default 20)
}
```

### state-machine.ts - Finite State Machine

Deterministic FSM with:
- Named states with `onEnter`/`onExit`/`onTick` hooks
- Transition conditions with guards
- Min duration and timeout timers
- Priority-ordered transition checking

Includes example guard FSM: `PATROL` → `INVESTIGATE` → `PURSUE` → `SWEEP`

### needs-system.ts - Needs System

Lazy-evaluated 0-1000 need values:
- Store value + lastUpdateTick, compute on read
- Per-need drain rates
- Warning (400) and critical (850) thresholds
- Intent scoring: `3 * needValue - distanceCost`

Default needs: hunger, sleep, morale

### intent-scoring.ts - Intent Scoring

Deterministic tie-breaking for AI decisions:
1. Higher score wins
2. Lower rank wins (intent type priority)
3. Lexicographic tiebreakId wins

Common scoring functions:
- `scoreNeed(needValue, distanceCost)`
- `scoreJob(basePriority, urgencyClass, distanceCost, fatigue)`
- `scorePursuit(distance, isVisible, maxRange)`
- `scoreInvestigate(evidenceStrength, ticksSince, distanceCost)`

### alert-escalation.ts - Alert Escalation

Multi-level alert system:
- Levels: `CALM` → `SUSPICIOUS` → `ALARM` → `LOCKDOWN`
- Evidence accumulation triggers escalation
- Time-based decay returns to baseline
- Lockdown state with minimum duration

```typescript
const { state, levelChanged, newLevel } = addEvidence(state, config, 25, tick);
const { state: decayed } = decayEvidence(state, config, tick);
```

---

## Domain Modules - Godhood Terrarium (`src/domains/gt/`)

**Status: Pick what matches your game. These are complete, tested implementations.**

| File | Purpose | Systems | Events |
|------|---------|---------|--------|
| `npc.ts` | NPC behavior, needs, travel | `npcSystem` | `NPC_TRAVEL_STARTED`, `NPC_ARRIVED`, `NPC_NEED_CRITICAL`, `NPC_ATE`, `NPC_SLEPT`, `NPC_INTENT_SET` |
| `job.ts` | Job lifecycle | `jobSystem`, `autoSpawnSystem` | `JOB_CREATED`, `JOB_CLAIMED`, `JOB_PROGRESSED`, `JOB_COMPLETED`, `JOB_CANCELLED` |
| `economy.ts` | Resource stockpiles | - | `STOCKPILE_DELTA`, `STOCKPILE_INITIALIZED` |
| `rumor.ts` | Social information flow | `rumorSpawningSystem`, `rumorPropagationSystem`, `relationshipRumorEffectSystem` | `RUMOR_SPAWNED`, `RUMOR_SPREAD`, `RUMOR_DECAYED`, `RELATIONSHIP_CHANGED` |
| `ambition.ts` | Long-term goal tracking | `ambitionSystem` | `AMBITION_SELECTED`, `AMBITION_PROGRESSED`, `AMBITION_COMPLETED` |
| `emergence.ts` | World initialization | `dailyConsumptionSystem` | - |
| `player.ts` | Player commands | - | `COMMAND_APPLIED`, `EDICT_ISSUED`, `EDICT_EXPIRED`, `FAVOR_CHANGED` |

### npc.ts - NPC Behavior

Components:
- `CoreLocationComponent` - Current place
- `CoreTravelComponent` - Travel state (from, to, cost, elapsed)
- `CoreNpcNeedsComponent` - Needs (hunger, sleep) with drain rates
- `CoreNpcIntentComponent` - Current intent (idle, satisfy_need, travel, do_job)

Intent scoring system:
- `satisfy_need`: 3 * needValue - distCost
- `do_job`: 400 - distCost - (tired ? 200 : 0)
- Deterministic tie-breaking: score desc -> rank asc -> targetId lex

### job.ts - Job Lifecycle

Job states: `open` -> `claimed` -> `in_progress` -> `completed`

Components:
- `CoreJobComponent` - Job definition, status, work progress

Features:
- Job templates with work required, priority, urgency
- Auto-spawn at day boundary (if food < threshold)
- Work progress (25 units/tick)

### rumor.ts - Social Information

Rumor types:
- `job_done` - Positive (spawned on JOB_COMPLETED)
- `hardship` - Negative (spawned on NPC_NEED_CRITICAL)

Propagation:
- Spreads to NPCs at adjacent place or with affinity > 30
- Intensity decays by 100 per spread
- 20% mutation chance

Relationship effects:
- `job_done`: +5 affinity (scaled)
- `hardship`: -8 affinity (scaled)

### ambition.ts - Goal Tracking

Ambition tracks with objectives:
- `food_security`: 3 harvests + maintain 50+ food for 2 days
- `sanctuary`: Repair shrine + no critical needs for 2 days

Objective types:
- `count_events` - Count matching events
- `maintain_condition` - Maintain state for N days

### player.ts - Player Commands

Command types:
- **Edict** (`prioritize_job_kind`) - +200 priority for job kind, 3-day duration
- **Miracle** (`complete_job`) - Complete job instantly, costs 60 favor

Cooldowns, daily limits, favor system.

---

## Domain Modules - Auto Heist (`src/domains/heist/`)

**Status: Pick what matches your game. These are patterns for grid-based stealth games.**

Key patterns from Auto-Heist:

### Detection Accumulator Pattern

Instead of binary detection, use 0-100 accumulator:
- Gain rate when visible
- Decay rate when not visible
- Thresholds: NOTICED (35), SPOTTED (70), LOST (20)

```typescript
interface DetectionState {
  value: number;        // 0-100
  crossed: 'NONE' | 'NOTICED' | 'SPOTTED' | 'LOST';
}
```

### Guard State Machine

States: `PATROL` -> `INVESTIGATE` -> `PURSUE` -> `SWEEP` -> `HOLD`

Transitions based on detection events and timer decay.

### Alert Escalation

Levels: `CALM` -> `SUSPICIOUS` -> `ALARM` -> `LOCKDOWN`

Evidence accumulation with decay timers.

### Rule/Card System

For directive card games:
```typescript
interface DirectiveCard {
  id: string;
  trigger: Trigger;
  conditions?: RuleCondition[];
  actions: Action[];
  charges?: number;
  cooldownTicks?: number;
  pausesBeforeFire?: boolean;  // Veto window
}
```

---

## Adapters (`src/adapters/`)

**Status: Optional. Copy if you need CLI or AI interfaces.**

| File | Purpose |
|------|---------|
| `human.ts` | ASCII terminal UI for human players |
| `agent.ts` | JSON protocol for LLM/AI agents |
| `headless.ts` | Programmatic control for testing |

---

## Examples (`examples/`)

**Status: Reference implementations for testing and tuning.**

| File | Purpose | Use Case |
|------|---------|----------|
| `balance-tuner.ts` | Automated parameter sweeps and grid search | Find balanced difficulty configurations |
| `emergence-tester.ts` | Cross-system correlation analysis | Verify systems interact meaningfully |
| `README.md` | Documentation for examples | How to write your own scripts |

### balance-tuner.ts - Game Balancing

Patterns for automated balance testing:
- Define tunable parameters (`TuningConfig`)
- Create AI policies that play automatically
- Run batches of simulations (50-100 runs)
- Sweep individual parameters or grid search combinations
- Target specific win rates (e.g., 30-50%)

```bash
npx tsx examples/balance-tuner.ts --sweep   # Test each param
npx tsx examples/balance-tuner.ts --grid    # Find optimal combo
```

### emergence-tester.ts - Emergence Analysis

Patterns for testing emergent behavior:
- Collect cross-system metrics (economy → stress → social)
- Check for correlations between systems
- Identify when systems are too isolated
- Suggest tuning for stronger emergence

```bash
npx tsx examples/emergence-tester.ts
```

---

## File Size Reference

Largest implementation files (complexity indicators):

| File | Size | Notes |
|------|------|-------|
| `pathfinding.ts` | ~1600 lines | Full A* with costs, reservations, door queues |
| `kernel.ts` | ~430 lines | Core 10-phase execution |
| `npc.ts` | ~500 lines | Full NPC behavior system |
| `rumor.ts` | ~400 lines | Rumor ecology with relationships |
| `job.ts` | ~350 lines | Job lifecycle management |

---

## Integration Checklist

When creating a new game:

- [ ] Copy `src/core/` entirely
- [ ] Adapt `src/types/core.ts` for your state shape
- [ ] Define your EVENT_TYPES registry
- [ ] Pick needed utils from `src/utils/`
- [ ] Pick needed patterns from `src/patterns/` (detection, FSM, needs, intents, alerts)
- [ ] Pick/adapt domain modules from `src/domains/`
- [ ] Create your game's kernel.ts that wires systems + reducers
- [ ] Create your game's types.ts with state + components
- [ ] Write systems that propose events
- [ ] Write reducers that apply events
- [ ] Test determinism with same-seed replay
- [ ] Adapt `examples/balance-tuner.ts` for your parameters
- [ ] Use `examples/emergence-tester.ts` to verify system interactions

## Further Reading

- **ROADMAP.md** - Known kernel gaps and future improvements
- **README.md** - Architecture overview and RIVET contract
- **src/domains/README.md** - Guide to using domain modules
