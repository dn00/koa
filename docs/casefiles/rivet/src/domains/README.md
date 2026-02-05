# RIVET Domain Modules

This directory contains **complete implementations** from two reference games. Everything is included - pick what you need.

## Godhood Terrarium (`gt/`)

Node-based world simulation with NPCs, jobs, economy, and social systems.

| File | Purpose |
|------|---------|
| `types.ts` | Full GT type definitions |
| `validation.ts` | State validation utilities |
| `npc.ts` | NPC behavior, needs, travel, intent scoring |
| `job.ts` | Job lifecycle, work progress, auto-spawn |
| `economy.ts` | Stockpile/resource management |
| `rumor.ts` | Social information flow, relationships |
| `ambition.ts` | Long-term goal tracking |
| `emergence.ts` | World initialization, daily dynamics |
| `player.ts` | Player commands (edicts, miracles) |
| `placegraph.ts` | Graph navigation (Dijkstra), world seeding |

## Auto-Heist (`heist/`)

Grid-based stealth simulation with guards, cameras, and directive cards.

### Core Files
| File | Purpose |
|------|---------|
| `types.ts` | Full heist type definitions (Vec2, Entity, Components, etc.) |
| `events.ts` | Event type catalog (40+ events) |
| `config.ts` | Configuration with defaults and validation |
| `pack-types.ts` | Pack schema (facilities, guards, cameras) |
| `rules-types.ts` | Directive card, trigger, action types |
| `kernel.ts` | System/Reducer infrastructure |
| `heist-kernel.ts` | Wiring all systems + reducers |
| `go-validation.ts` | Game outcome validation |

### Systems (`heist/systems/`)
| File | Purpose |
|------|---------|
| `vision.ts` | Guard/camera detection, accumulators (0-100) |
| `alert.ts` | Alert escalation (CALM → SUSPICIOUS → ALARM → LOCKDOWN) |
| `crew-behavior.ts` | Crew AI intents, hiding, objectives |
| `crew-movement.ts` | Crew pathfinding execution |
| `guard-movement.ts` | Guard FSM (PATROL → INVESTIGATE → PURSUE → SWEEP) |
| `rules.ts` | Directive card evaluation, veto windows |
| `objectives.ts` | Objective completion tracking |
| `tokens.ts` | Token effects (LIGHTS, SMOKE, RADIO, DECOY) |
| `noise.ts` | Noise emission and hearing |
| `catch.ts` | Crew capture detection |
| `outcome.ts` | Win/loss detection |
| `stance.ts` | Crew stance (SNEAK/NORMAL/SPRINT) |
| `doors.ts` | Door toggle mechanics |
| `coordination.ts` | Guard alert broadcasting |
| `heat.ts` | Heat threshold effects |

### Reducers (`heist/reducers/`)
| File | Purpose |
|------|---------|
| `vision.ts` | Detection accumulator updates |
| `movement.ts` | Entity position updates |
| `alert.ts` | Alert escalation state |
| `catch.ts` | Crew caught state |
| `rules.ts` | Card action effects |
| `objectives.ts` | Objective progress |
| `tokens.ts` | Token activation/expiration |
| `outcome.ts` | Game result |
| `noise.ts` | Noise tracking |
| `stance.ts` | Stance changes |
| `doors.ts` | Door state |
| `coordination.ts` | Guard coordination state |
| `heat.ts` | Heat level updates |

### Utilities (`heist/utils/`)
| File | Purpose |
|------|---------|
| `pathfinding.ts` | A* with costs, reservations, door queues |
| `vision.ts` | Bresenham LOS, vision cones |
| `perception.ts` | Light overlay, camera FOV |
| `heat.ts` | Heat level computation |
| `modules.ts` | Module card effects |
| `noise.ts` | Noise propagation |

### Adapters (`heist/adapters/`)
| File | Purpose |
|------|---------|
| `human.ts` | ASCII terminal UI |
| `agent.ts` | JSON protocol for LLM agents |
| `headless.ts` | Programmatic testing control |

### Game Session (`heist/game/`)
| File | Purpose |
|------|---------|
| `session.ts` | GameSession wrapper class |
| `types.ts` | View types for UI |

## How to Use

1. **Decide which domains you need** based on your game mechanics
2. **Copy the source files** to `domains/` (preserving subdirectories)
3. **Update imports** to point to RIVET core types instead of game-specific types
4. **Wire up in your kernel** by registering systems and reducers

## Example: Using NPC System

```typescript
import { createKernel, ReducerRegistry, SystemRegistry } from '../core/kernel.js';
import { npcSystem, npcReducers } from './domains/gt/npc.js';

// Create reducer registry
const reducers = new ReducerRegistry();

// Register NPC reducers
const npcReg = npcReducers();
for (const [type, reducer] of npcReg) {
  reducers.register(type, reducer);
}

// Create system registry
const systems = new SystemRegistry([
  { systemId: 'core.npc', priority: 10, run: npcSystem },
]);

// Create kernel
const kernel = createKernel({ reducers, systems });
```

## Key Patterns

### GT Patterns
- **Needs system**: 0-1000 values with drain rates and thresholds
- **Intent scoring**: Score-based decision making with deterministic tie-breaking
- **Job lifecycle**: open → claimed → in_progress → completed
- **Rumor ecology**: Spawn, propagate, decay with relationship effects

### Heist Patterns
- **Detection accumulator**: 0-100 with gain/decay, threshold crossings
- **Guard FSM**: PATROL → INVESTIGATE → PURSUE → SWEEP/HOLD
- **Alert escalation**: CALM → SUSPICIOUS → ALARM → LOCKDOWN
- **Card system**: Triggers + conditions + actions with charges/cooldowns

## Import Adjustments

When copying domain files, update imports:

```typescript
// Before (GT)
import type { WorldState } from './types/index.js';
import { SystemContext } from './kernel.js';

// After (RIVET)
import type { WorldState } from '../../types/core.js';
import { SystemContext } from '../../core/kernel.js';
```

## Minimal vs Full Copy

**Minimal** - Just copy the files you need and their dependencies.

**Full** - Copy everything if you want the complete reference implementation.

The advantage of minimal: smaller bundle, easier to understand.
The advantage of full: all patterns available when needed later.
