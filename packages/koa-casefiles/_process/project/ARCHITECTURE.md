# KOA Casefiles - Architecture

## Overview

KOA Casefiles is a **procedurally generated cozy mystery detective game**. Players investigate household shenanigans to figure out WHO did it, WHAT they did, HOW, WHEN, WHERE, and WHY.

The system uses **simulation-based generation**: NPCs follow schedules, a crime is executed based on opportunity, and the event log is converted to discoverable evidence.

---

## Core Pipeline

```
Seed → Simulation → Event Log → Evidence → Game Session
       (sim.ts)      [SimEvent]  (evidence.ts)  (game.ts)
```

### 1. Simulation (`sim.ts`)

Runs the household simulation:
- Creates world (places, devices, items, NPCs, relationships)
- NPCs follow schedules, generate MOVE/DOOR events
- Finds crime **opportunity** (NPC alone or with only distracted witnesses)
- Executes crime (ITEM_TAKEN, ITEM_HIDDEN events)
- Generates motive from emergent gossip history

**Key Design:** Culprit is chosen by opportunity, not predetermined. This makes cases feel organic.

### 2. Evidence Derivation (`evidence.ts`)

Converts raw events into discoverable evidence:
- **Presence**: Where each NPC was per window (from MOVE events)
- **Device Logs**: Door opens/closes, motion detected (from sensor events)
- **Testimony**: What NPCs observed (adjacent room witnesses)
- **Physical**: Crime scene + hidden item location
- **Motive**: Gossip about relationships and the actual crime

**Anti-Anticlimax Rule:** Evidence never directly identifies the culprit at the crime scene. Players must deduce through contradictions.

### 3. Game Session (`game.ts`, `player.ts`, `actions.ts`)

Interactive investigation loop:
- Commands cost **Action Points** (AP): SEARCH, INTERVIEW, LOGS
- Free commands: EVIDENCE, COMPARE, STATUS, WHEREABOUTS
- **COMPARE** detects contradictions between evidence pieces
- **ACCUSE** checks answer against ground truth

**Resource Economy:**
- 4 days, 3 AP/day = 12 base AP
- Lead tokens (max 2) = free follow-up actions
- Average solve requires ~8.6 AP (comfortable margin)

---

## Data Flow

```
World                 CaseConfig              Evidence[]
├─ places[]           ├─ culpritId           ├─ presence[]
├─ devices[]          ├─ crimeType           ├─ device_log[]
├─ items[]            ├─ crimeMethod         ├─ testimony[]
├─ npcs[]             ├─ crimeWindow         ├─ physical[]
└─ relationships[]    ├─ crimePlace          └─ motive[]
                      ├─ hiddenPlace
                      ├─ motive
                      └─ twist?

SimEvent[]
├─ NPC_MOVE
├─ DOOR_OPENED/CLOSED
├─ MOTION_DETECTED
├─ ITEM_TAKEN
├─ ITEM_HIDDEN
├─ ACTIVITY_STARTED
└─ TRACE_FOUND
```

---

## Key Components

### Types (`types.ts`)

Defines all domain types:
- `NPCId`, `PlaceId`, `WindowId`, `EventId` - string IDs
- `SimEvent` - simulation events with tick, type, actor, place
- `EvidenceItem` - union of 5 evidence kinds
- `CaseConfig` - ground truth for the mystery
- `Motive`, `Relationship`, `TwistRule` - narrative elements

### World Generation (`world.ts`)

Creates household layout:
- 5 places: living, kitchen, bedroom, office, garage
- Door sensors between adjacent rooms
- Motion sensors in key rooms
- 5 NPCs with schedules and roles

### Blueprints (`blueprints/`)

Crime templates for variety:
- `theft.ts` - quick_snatch, opportunistic_theft, premeditated_theft
- `sabotage.ts` - device_sabotage, recipe_sabotage, event_sabotage
- `prank.ts` - item_relocation, item_swap, disappearance, message_prank

### Gossip System (`gossip/`)

Emergent motive generation:
- Pre-simulation generates synthetic history (30 days)
- Relationships spawn rumors and grievances
- Culprit's motive derived from actual relationship graph

### Validation (`validators.ts`)

Ensures cases are playable:
- Solvability: keystone contradiction exists
- Anti-anticlimax: culprit not directly identified
- Difficulty metrics: AP required, branching factor

### Solver (`solver.ts`)

Automated "perfect player" for testing:
- Follows optimal strategy: gossip → search → logs → interview → accuse
- Validates evidence findability
- Reports solve rate and difficulty distribution

---

## Difficulty System

Three difficulty levels control culprit behavior:

| Level | Culprit's Lie | Device Coverage | Signal |
|-------|---------------|-----------------|--------|
| **Easy** | Crime window (70%) or off-axis (30%) | Full | Direct contradiction |
| **Medium** | Off-axis window only | Partial gaps | Requires localization |
| **Hard** | Crime window + competing narrative | Sparse | Requires synthesis |

**Fairness Contract:**
- Contradiction ALWAYS exists at all difficulties
- Crime window device logs are NEVER offline
- Hard mode competing narratives are flagged

---

## File Structure

```
src/
├─ types.ts          # Core domain types
├─ sim.ts            # Simulation engine
├─ evidence.ts       # Evidence derivation
├─ game.ts           # Interactive CLI
├─ player.ts         # Session state, scoring
├─ actions.ts        # SEARCH, INTERVIEW, LOGS, COMPARE
├─ validators.ts     # Playability checks
├─ solver.ts         # Automated solver
├─ cli.ts            # Batch validation/tuning
├─ world.ts          # World generation
├─ barks.ts          # KOA personality/voice
├─ koa-voice.ts      # Output formatting
├─ director.ts       # Case difficulty control
├─ activities.ts     # Red herring activities
├─ blueprints/       # Crime templates
│   ├─ theft.ts
│   ├─ sabotage.ts
│   └─ prank.ts
├─ gossip/           # Emergent motive system
│   ├─ relationships.ts
│   ├─ rumors.ts
│   └─ motives.ts
└─ kernel/           # Core utilities
    ├─ rng.ts        # Deterministic RNG
    └─ canonical.ts  # Hash-based IDs
```

---

## Design Principles

1. **Simulation-First**: Generate events, derive evidence. Don't handcraft.
2. **Deterministic**: Same seed = same case. Enables replay and testing.
3. **Anti-Anticlimax**: Never hand player the answer. Make them deduce.
4. **Traceability**: Every evidence piece cites its source events.
5. **Fairness**: Always solvable. Difficulty changes discoverability, not possibility.
