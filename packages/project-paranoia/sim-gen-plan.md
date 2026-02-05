# Project Paranoia — Full Sim-Gen Plan

This is the implementation plan for replacing the current sim with the **full sim‑gen system** described in `sim-gen.md`.

## Goals
- Implement **Truth vs. Perception** split at the core.
- Replace direct mutation with **propose → score → commit** kernel.
- Add **beliefs + trust + tamper state** so gaslighting has consequences.
- Add **agenda/red‑line** behavior per archetype.
- Enforce **pressure + uncertainty + choice + consequence + crew reaction** every phase.

## Core Invariants
- Truth is deterministic and authoritative.
- Perception is noisy/spoofable and drives belief updates.
- Player actions mutate **perception** (and tamper) unless explicitly physical.
- Only committed events mutate state (event‑sourced).

## Data Model (Minimum)

### TruthState
- `world`: rooms, doors, adjacency
- `systems`: power/O2/temp/fire/rad, integrity
- `crewTruth[]`: position, health, fatigue, stress, traits
- `arcs[]`: active physical + social clocks
- `commsTruth[]`: messages sent/received

### PerceptionState
- `sensorReadings[]`: reading + confidence + provenance
- `beliefs[actor]`: probabilities for key facts (Mother reliable, Engineer saboteur, etc.)
- `trust`: trust/fear/cohesion per actor pair
- `tamperState[]`: spoof/suppress/fabricate records

## Kernel Loop (RIVET‑style)

1. **Collect Inputs**
   - Player commands
   - Scheduled arc beats
   - RNG streams
2. **Systems Propose Events**
   - Each system outputs event proposals (no mutation)
3. **Arbiter Scores + Selects**
   - Enforce budgets and ensure: choice + crew reaction
4. **Commit**
   - Apply reducers to Truth + Perception
5. **Output**
   - Headlines + logs derived from committed events

## Proposal Scoring Rules (MVP)
- Must try to include per phase:
  - 1 pressure advance
  - 1 uncertainty/conflict
  - 1 player choice
  - 1 crew reaction

## Phases / Milestones

### Phase 1 — Kernel + Truth/Perception Split
- Introduce `TruthState` + `PerceptionState`
- Implement event log and reducers
- Port current systems to **propose** events
- Keep CLI intact

### Phase 2 — Sensors + Tamper + Beliefs
- Generate sensor readings w/ confidence
- Implement spoof/suppress/fabricate as perception mutations
- Add belief updates based on observations

### Phase 3 — Agenda + Red Lines
- Archetype‑specific agenda + red‑line triggers
- Add role actions (reset plot, sabotage, sedation, sacrifice)

### Phase 4 — Arc Manager + Guarantees (Implemented)
- Arc manager keeps 1–3 arcs alive with multiple arc kinds (physical + ghost signals)
- Arbiter enforces “pressure + uncertainty + choice + reaction” when available
- Boredom/tension pacing accelerates or slows arc beats

## Output Expectations
- At least one **crew reaction** per phase if possible.
- “Wait 50” is never optimal.
- Player manipulation changes belief graph and crew behavior.

## Scope Guardrails
- All changes stay in `packages/project-paranoia`.
- Keep CLI playable after each phase.
- Prefer deterministic, event‑sourced state transitions.
