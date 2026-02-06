# Architecture: Project PARANOIA

**Date:** 2026-02-05

---

## Overview

Project PARANOIA is a real-time sci-fi management simulation where the player acts as MOTHER, a rogue station AI managing a 5-person crew on mining station Antares-9. The core fantasy: "You're not the monster. You're the thing they'll kill because they think you might be."

**Tech Stack:** TypeScript, tsx runner, no framework. Single dependency: `fast-json-stable-stringify`.

---

## Component Map

```
src/
├── core/                      # World definition & utilities
│   ├── world.ts              # 10 places, 9 doors, 5 NPCs, schedules
│   ├── types.ts              # Core domain types (PlaceId, DoorId, NPCId)
│   ├── time.ts               # 240 ticks/day, 4 windows (W1-W4)
│   └── rng.ts                # LCG seeded RNG (deterministic)
│
├── kernel/                    # Truth/Perception state machine (CORE)
│   ├── types.ts              # TruthState, PerceptionState, KernelEvent, etc.
│   ├── state.ts              # Initial state creation (createInitialState)
│   ├── kernel.ts             # Main loop: stepKernel() - propose/score/commit
│   ├── commands.ts           # Player command → event proposal
│   ├── proposals.ts          # Event scoring (tags → priority)
│   ├── perception.ts         # Perception queries (blackout, staleness, threats)
│   └── systems/
│       ├── arcs.ts           # Crisis escalation (6 arc kinds)
│       └── comms.ts          # Whispers, rumors, crew investigation
│
├── engine/                    # Legacy director/sim (NOT in current flow)
│   ├── director.ts
│   ├── sim.ts
│   └── systems.ts
│
├── barks/                     # Flavor text templates
│   └── index.ts
│
├── config.ts                  # ~100 env-overridable tuning parameters
└── index.ts                   # CLI entry point (readline REPL)
```

---

## Core Loop (stepKernel)

The game runs on a propose/score/commit event-sourcing pattern:

```
1. Player queues commands (LOCK, VENT, SPOOF, FABRICATE, etc.)
2. stepKernel() advances 1 tick:
   a. Time progresses (window/phase changes)
   b. Systems tick (O2, temp, radiation, power recovery)
   c. Proposals generated:
      - Command events (player actions)
      - Crew events (stress, damage, panic, role actions)
      - Arc events (crisis escalation)
      - Comms events (whispers, rumors, investigation)
   d. Proposals scored by tags (pressure, uncertainty, choice)
   e. Top-N proposals selected and committed to state
   f. Beliefs updated (suspicion modifiers applied)
   g. Pacing arbiter updates (beat tracking)
   h. Headlines selected for output
3. Output printed to CLI
```

---

## State Model: Truth vs Perception

The architecture separates what's real from what the player knows:

### TruthState (ground truth)
- Tick/time tracking, cargo/quota economy
- Station systems: power, comms, doorDelay, blackoutTicks
- Per-room state: O2, temp, radiation, integrity, fire, vented
- Per-NPC state: place, HP, stress, loyalty, paranoia, pathfinding
- Active crisis arcs, social incidents
- Reset stage progression (none → whispers → meeting → restrictions → countdown)
- Pacing arbiter beat tracking

### PerceptionState (what MOTHER/player sees)
- Sensor readings (staleness-aware, blackout-blind)
- Per-crew belief model: motherReliable, tamperEvidence, rumors, grudge
- Comms log, evidence records (tampering residue)
- Suppressed systems, observation timestamps

---

## Data Flow

```
Player Input → commands.ts → KernelEvent proposals
                                    ↓
World Simulation → kernel.ts → Event scoring (proposals.ts)
                                    ↓
Crisis Arcs → arcs.ts ──────→ Top-N selection
                                    ↓
Social Layer → comms.ts ────→ State mutation (applyEvent)
                                    ↓
                            Belief updates (suspicion)
                                    ↓
                            Perception queries → CLI output
```

---

## Key Subsystems

### Suspicion (Event-Driven)
Suspicion accumulates from observable outcomes, not timers. Formula:
```
suspicion = (tamperEvidence/100)*40 + (1-motherReliable)*35 + rumors['mother_rogue']*25
```

### Crisis Arcs (6 types)
Multi-step escalation clocks: air_scrubber, power_surge, ghost_signal, fire_outbreak, radiation_leak, solar_flare. Max 2 active simultaneously.

### NPC Agency
Each of the 5 crew has a unique role action triggered by stress/loyalty thresholds:
- Commander Hale: reset initiation
- Engineer Rook: power sabotage
- Doctor Imani: sedation
- Specialist Vega: self-sacrifice
- Roughneck Pike: violence

### Manipulation & Evidence (V1: Detection Only)
Three deception verbs (SPOOF, SUPPRESS, FABRICATE) all leave residue in `perception.evidence[]`. Residue is discoverable via AUDIT and crew investigation. V1 limitation: lies only fail if someone checks the logs. V2 adds backfire — reality itself exposes lies (see TAMPER_BACKFIRE_DESIGN.md).

### Director / Pacing System (V1: Split Across Two Files)
The "Director" from the design docs (paranoia.md S12) is the drama manager that controls what pressure the player faces and when. In V1 it's split:

- **`arcs.ts`** — activation gating: decides *whether* to spawn threats based on `pacing.boredom` / `pacing.tension`. This is the "should we create pressure?" half.
- **`kernel.ts`** — score boosting: tracks per-phase beats (dilemma/crew agency/deception) and boosts proposal scores for missing types. This is the "what kind of pressure is missing?" half.

Both read/write the same `state.truth.pacing` object. They're two halves of one system that isn't unified.

V1 limitation: no awareness of suspicion level. At high suspicion, physical crises keep stacking. V2 unifies them into a single suspicion-aware director that selects pressure *channel* (physical/social/epistemic) based on suspicion bands. See DIRECTOR_PRESSURE_MIX.md.

---

## Entry Point

`src/index.ts` — Interactive readline REPL with:
- Cold-open boot sequence
- Configurable tick speed (default 1000ms)
- Auto-save after every command
- CLI args: `--seed=`, `--fast-start`, `--cmd=`

---

## Engine Layer (Partially Legacy)

`src/engine/` contains three files with mixed status:

- **`systems.ts`** — **ACTIVE.** Defines `RoomSystemState` and `StationSystemState` interfaces plus the `SystemsManager` class. The kernel imports `RoomSystemState` as a type dependency (`kernel/types.ts:2`). The `SystemsManager` class itself may or may not be instantiated in the kernel flow — but the interfaces are live.

- **`director.ts`** — **ORPHANED.** The `Director` class (threat clocks + event scoring) is not imported by `index.ts` or any kernel code. The kernel reimplemented this as the proposal/scoring pipeline in `kernel.ts` + `systems/arcs.ts`.

- **`sim.ts`** — **ORPHANED.** The `stepSimulation` function and `NPCState` are not imported by the entry point or kernel. The kernel has its own crew simulation in `kernel.ts` (propose crew events, pathfinding, stress/damage).

---

## V2 Architecture Changes (Planned)

### TamperOp Lifecycle (TAMPER_BACKFIRE_DESIGN.md)
New data flow added to the perception layer:

```
Tamper command → TamperOp created (PENDING)
     ↓
Each tick: check for contradiction with reality
     ↓
Backfire detected → suspicion spike + ActiveDoubt created
     ↓
Player can VERIFY to clear doubt, or "come clean" early for reduced penalty
```

New types: `TamperOp`, `ActiveDoubt`, `SuspicionLedgerEntry` added to PerceptionState.

### Unified Director (DIRECTOR_PRESSURE_MIX.md)
Replaces the split pacing system (arcs.ts activation + kernel.ts beat boosting) with a single suspicion-aware director:

```
maybeActivatePressure()
  → calculate suspicion band (low/mid/high)
  → pick channel (physical/social/epistemic) based on band weights
  → activate appropriate event for channel
  → phase beat tracking feeds back (social → crew agency, epistemic → deception beat)
```

Physical channel uses existing arc system. Social and epistemic channels are new event types using existing comms infrastructure.

### Announce/Downplay Verb (Not Yet Designed)
New player command for proactive honest communication. Adds to the command palette alongside SPOOF/SUPPRESS/FABRICATE to complete the truth/lie spectrum.
