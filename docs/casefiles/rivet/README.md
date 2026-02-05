# RIVET Kernel

**RIVET** - Replayable, Immutable, Verified Event Ticks

A deterministic, event-sourced simulation kernel for "indirect control" games. The kernel is the **single source of truth** - everything else (UI, narration, replays) is derived from the event log and state snapshots.

Given `(genesis snapshot, ordered event log, kernel version, worldRulesDigest)`, anyone can **reproduce the exact same world** byte-for-byte.

## Quick Start

```bash
# Copy this entire folder to your new game project
cp -r packages/rivet my-game/src/kernel

# Install dependencies
npm install fast-json-stable-stringify @noble/hashes
```

Then adapt:
1. **Keep as-is**: `core/`, most of `utils/`
2. **Adapt**: `types/` for your game's state shape
3. **Pick & choose**: `domains/` - use what you need, delete the rest
4. **Derive from examples**: `domains/gt/` and `domains/heist/` show patterns

## The Contract (Non-Negotiables)

| Principle | Description |
|-----------|-------------|
| **Event-sourced truth** | World state changes *only* by applying validated Events |
| **Determinism** | Same inputs = same outputs (canonical encoding + stable hashes) |
| **Pack isolation** | Packs propose events through allowlisted APIs; no direct mutation |
| **Hash chaining** | Event batches form a verifiable hash chain (tamper-evident) |
| **Replay first** | Replay moments from stored artifacts without re-running systems |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Kernel.step()                            │
│               (10-Phase Deterministic Execution)                │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    SYSTEMS      │  │    REDUCERS     │  │   HASH CHAIN    │
│  (Read-only)    │  │ (State mutate)  │  │  & VALIDATION   │
│                 │  │                 │  │                 │
│ - Propose events│  │ - Apply events  │  │ - computeEventId│
│ - Use RNG       │  │ - Mutate state  │  │ - batchHash     │
│ - Query state   │  │                 │  │ - lastEventHash │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 10-Phase Tick Execution

1. **Command Validation** - Validate player commands
2. **System Execution** - Systems propose events (no mutation)
3. **Event Cap Check** - Enforce maxEvents limit
4. **Event Validation** - Validate all proposed events
5. **Event ID Computation** - Hash each event deterministically
6. **Reducer Application** - Apply reducers in event order
7. **RNG State Update** - Persist RNG state
8. **Calendar & Favor** - Update day index, apply regeneration
9. **Hash Computation** - Compute state hash and hash chain
10. **Output Envelope** - Return new envelope with all changes

## Directory Structure

```
rivet/
├── src/
│   ├── core/                 # Essential kernel infrastructure
│   │   ├── kernel.ts         # Step engine (10-phase execution)
│   │   ├── rng.ts            # Deterministic xoroshiro128**
│   │   ├── canonical.ts      # Canonical JSON + SHA256
│   │   ├── hash-chain.ts     # Hash chain utilities
│   │   └── validation.ts     # State validation (integers only)
│   │
│   ├── types/                # Type definitions
│   │   └── core.ts           # Base types (adapt for your game)
│   │
│   ├── utils/                # Pure algorithms (use as-is)
│   │   ├── pathfinding.ts    # A*, BFS, cover finding
│   │   ├── vision.ts         # Bresenham LOS, cones
│   │   └── placegraph.ts     # Dijkstra, graph navigation
│   │
│   └── domains/              # Domain-specific systems (examples)
│       ├── gt/               # From Godhood Terrarium
│       │   ├── npc.ts        # NPC behavior, needs, travel
│       │   ├── job.ts        # Job lifecycle
│       │   ├── economy.ts    # Stockpile/resources
│       │   ├── rumor.ts      # Social information flow
│       │   ├── ambition.ts   # Long-term goals
│       │   ├── emergence.ts  # World initialization
│       │   └── player.ts     # Player commands
│       │
│       └── heist/            # From Auto-Heist (grid-based)
│           └── (detection, alert, vision systems)
│
├── README.md                 # This file
└── CATALOG.md               # File inventory with descriptions
```

## Core Concepts

### SystemContext

Systems receive a frozen state view and can only propose events:

```typescript
interface SystemContext {
  readonly state: WorldState;
  readonly tickIndex: number;
  readonly worldId: string;

  proposeEvent(type: EventType, payload: unknown, attribution: Attribution): void;
  rng(streamId: string): RNG;
  getEntitiesByType(type: EntityType): EntityRecord[];
  getEntity(id: EntityId): EntityRecord | undefined;
}
```

### Reducers

Reducers apply events to state. They're the only code that mutates state:

```typescript
type Reducer = (state: WorldState, event: SimEvent) => void;
```

### Hash Chain

Every tick produces a hash chain entry:

```
batchHash = sha256(canonical_json(events[]))
lastEventHash = sha256(prevLastEventHash + batchHash)
```

### Determinism Rules

State must contain only:
- Integers (no floats)
- Strings, booleans
- Objects with sorted keys
- Arrays (order preserved)

**Not allowed**: floats, Infinity, NaN, Map, Set, Date, BigInt, functions

## Usage Patterns

### Creating a Kernel

```typescript
import { createKernel, ReducerRegistry, SystemRegistry } from './core/kernel.js';

const reducers = new ReducerRegistry();
reducers.register('my.event', (state, event) => {
  // mutate state based on event
});

const systems = new SystemRegistry([
  { systemId: 'my.system', priority: 10, run: mySystemFn },
]);

const kernel = createKernel({ reducers, systems });
```

### Running a Tick

```typescript
const output = kernel.step({
  envelope: currentEnvelope,
  commands: playerCommands,
  maxEvents: 200,
});

// output.envelopeNext - new state
// output.events - events that occurred
// output.batchHash - hash of this tick's events
```

### Using RNG

```typescript
function mySystem(ctx: SystemContext) {
  const rng = ctx.rng('my.stream');
  const value = rng.nextInt(100); // [0, 100)
}
```

## Game Families RIVET Supports

Because it's **event-sourced + replayable + pack-extensible**, it naturally supports games where:

- You **steer** via policies / loadouts / edicts rather than direct micro
- Outcomes are **watchable**, streamable, and explainable
- Players can share seeds/builds/replays because runs are reproducible

**Examples**:
- Auto-sim roguelites (build a policy deck, watch it play, iterate)
- Heist / breach sims (crew + guards + alert states + director powers)
- Terrarium god sim (edicts/miracles + systemic cascades)
- Cozy mystery "simulated case" (truth from log; UI reveals slices)
- League/economy sims (policies steer markets; replay key incidents)

## What RIVET Does NOT Do

- Free-form NPC chat that changes truth
- Nondeterministic simulation outcomes
- Runtime dependency on an LLM
- "LLM decides actions" (LLM may narrate, not author truth)

## Dependencies

```json
{
  "dependencies": {
    "fast-json-stable-stringify": "^2.1.0"
  }
}
```

For Node.js, uses built-in `crypto`. For browser, you may need a polyfill or use `@noble/hashes`.

## For LLM Agents

When adapting RIVET for a new game:

1. **Start with `CATALOG.md`** to understand what each file does
2. **Copy `core/`** as-is - don't modify unless you know what you're doing
3. **Adapt `types/core.ts`** for your game's state shape and event types
4. **Pick domains from `domains/`** that match your game mechanics
5. **Use `utils/`** algorithms directly - they're game-agnostic
6. **Wire up in your game's kernel file** (see `domains/gt/` or `domains/heist/` for patterns)

Key patterns to follow:
- Systems propose events, reducers mutate state
- All state changes go through events
- RNG streams are per-system or per-entity
- Entity IDs are sorted for deterministic iteration
