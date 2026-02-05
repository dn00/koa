# Godhood Terrarium — Frozen Spec v1.0 (RIVET Kernel Game)
**Codename:** GT (Godhood Terrarium)  
**Spec Status:** **FROZEN v1.0** (authoritative for implementation)  
**Last updated:** 2026-02-05  
**Audience:** engineering, design, content, tooling  
**Core promise:** A **persistent, living “snowglobe world”** you check in on. Each session you make **1–3 meaningful godly choices** (Edicts/Miracles) and watch deterministic consequences unfold, narrated as delightful “chronicle” headlines and short scenes. The **kernel is truth**; narration is presentation.

---

## 0) What “Frozen” means
This document defines buildable v1 behavior with no ambiguity where it matters:
- **Canonical truth model** (event-sourced, deterministic)
- **Player verbs and session loop**
- **Simulation systems and constraints**
- **UI surfaces and information contract**
- **Packs/extensibility model**
- **LLM usage policy (strict separation of truth vs presentation)**
- **Definition of Done + ship gates**

Changes after v1 ship require:
- Spec version bump (v1.1, v1.2…)
- explicit migration notes
- backwards-compat story for saves (world identity, packs, replays)

---

## 1) One-liner & Fantasy

### 1.1 One-liner
A cozy god-game where you **nudge reality** in a tiny living world, then **return to see what happened**—with every consequence traceable to a causal chain of events.

### 1.2 Player fantasy
- “My world is alive and keeps surprising me.”
- “I’m a gentle deity—small choices, big ripples.”
- “When something weird happens, I can always ask: **why**?”
- “I’m building a tiny mythology: characters, places, legends.”

### 1.3 Non-negotiable feelings
- **Clarity:** you always understand *who* changed, *where*, *what*, and *why* (in < 2 seconds).
- **Delight:** consequences feel *playful*, not punishing.
- **Trust:** the sim is deterministic and auditable. No “randomly ruined my town.”
- **Lightweight sessions:** plays well in 60–180 seconds, but supports longer.

---

## 2) Product Goals & Non-goals

### 2.1 Product goals
1. **Daily/weekly retention via living world:** the world changes meaningfully between check-ins (even if simulated in bursts).
2. **Meaningful choices:** each session offers at least one decision that has visible consequences within the session.
3. **Deterministic truth + explainability:** every headline/scene references canonical events.
4. **Cozy emergence:** “shenanigans,” not grimdark tragedy (v1).
5. **Extensible design:** new systems and content ship as Packs without breaking determinism.

### 2.2 Non-goals (v1)
- Real-time MMO with thousands of players sharing one world
- Full open-ended sandbox building (Minecraft-style)
- Free-form LLM-driven truth or state mutations
- Complex combat focus / twitch gameplay
- High-fidelity cinematic cutscenes (presentation stays lightweight)

---

## 3) Canonical Definitions

### 3.1 Time model
- **Tick:** smallest simulation step (integer; deterministic).
- **Cycle / Day:** player-facing day unit used for cooldowns, budgets, and “check-in” rhythm. One day contains `ticksPerDay` ticks.
- **Session:** a player interaction period (opening the world, reviewing chronicle, making choices, advancing sim).

### 3.2 World
- **World:** a single persistent simulation instance owned by a player (tenant).
- **World Identity:** `worldId + kernelVersion + ordered pack digests + genesis hash` (see Section 10).

### 3.3 Events and truth
- **Event Log:** ordered canonical record of state transitions (truth).
- **State:** deterministic fold/reduce over genesis + events.
- **Chronicle:** derived, non-canonical presentation of events (headlines/scenes).

### 3.4 Player verbs
- **Edict:** low-intensity, persistent rule/constraint you set (a “policy”).
- **Miracle:** high-intensity, targeted intervention (a “nudge”).
- **Omen:** a forecast hint about the near future (derived, optional).
- **Favor:** resource representing your divine influence (spend on Miracles; accrues over time).

---

## 4) Core Loop & Session Structure

### 4.1 Loop summary (v1)
1. **Open world**
2. See **Chronicle** (what happened since last time)
3. Choose **1 Edict** (optional) and/or **1 Miracle** (optional)
4. **Advance simulation** until the next “Decision Beat” or time budget ends
5. See **Payoff**: 1–3 headlines + 0–2 short scenes + “Because…” causal link(s)
6. **Save + close** (world persists)

### 4.2 Session length targets
- **Micro-check:** 45–90 seconds (review + 1 small choice)
- **Normal:** 2–5 minutes (review + 1–3 choices + payoff)
- **Long play:** 10–20 minutes (multiple beats, reorganizing priorities)

### 4.3 The “Decision Beat” contract (critical)
GT is **watch → pause → decide → watch → pause**.

The sim must automatically pause when:
- a crisis escalates (fire spreading, food shortage spike, disease threshold)
- a major relationship break happens (betrayal, breakup, feud)
- a long-term project completes (festival, construction, invention)
- an Edict/Miracle is about to produce irreversible side effects
- a “fork choice” appears (two mutually exclusive futures)

Default behavior: auto-pause at beats; player can choose to continue running.

---

## 5) Player Systems

### 5.1 Resources
- **Favor (primary):**
  - gained passively per day + from good outcomes
  - spent on Miracles
  - capped; overflow can convert to cosmetics currency (optional)
- **Omens (secondary):**
  - earned by exploration/achievements
  - spent to reveal forecasts or causal explanations

### 5.2 Edicts (persistent policies)
Edicts are toggles/rules with intensity levels.
Examples:
- **Kindness First:** reduce feud escalation, increase help (tradeoff: slower productivity).
- **Thrift Week:** reduce consumption, increase savings (tradeoff: happiness).
- **Night Curfew:** reduce accidents/crime (tradeoff: creativity/romance).

Rules:
- **Max 3 active Edicts** (v1).
- Change at session start or at beats.
- Implemented as deterministic modifiers.

### 5.3 Miracles (targeted, costly)
Examples:
- **Bless Harvest** (zone): +food yield next day; may attract pests.
- **Soften Hearts** (two NPCs): reduce anger; may create awkwardness.
- **Reveal Secret** (NPC): creates gossip shockwave.
- **Quench Fire** (cell/zone): extinguish; may cause flooding.
- **Summon Visitor** (world): new NPC arrives with trait.

Rules:
- Cost Favor + cooldowns
- Always creates canonical events (no direct mutation)
- Deterministic side effects to preserve drama

---

## 6) World Model

### 6.1 Topology
Recommended: **grid world** with zones layered (TownSquare, Farm, ForestEdge, River, Homes).

### 6.2 Entities
NPCs, zones, structures, resources, projects, hazards.

### 6.3 NPC state (minimal v1)
- location (tile/zone)
- needs: hunger, rest, warmth, fun (0–100)
- traits: 2–4 tags (brave, anxious, greedy, kind, curious…)
- relationships: affinity map (0–100)
- stress (0–100)
- role/job: farmer, baker, guard, tinkerer…

### 6.4 Relationship & rumor (v1)
- Affinity changes from events.
- Rumors propagate via proximity/social graph.
- Rumor effects are bounded and reference causes.

---

## 7) Simulation Systems (v1 Required Set)

### 7.1 Needs & routine system
NPC chooses activities per tick based on needs, job, relationships, crises, edicts.
Emits `NPC_INTENT` then `MOVE/WORK/EAT/REST/SOCIALIZE`.

### 7.2 Economy & production
resource nodes, stations, storage, consumption; scarcity drives behavior.

### 7.3 Weather & seasons
seasons modify yields/hazards; weather events from deterministic schedule + seeded RNG.

### 7.4 Hazards (core 2)
1. Fire (spreads adjacency; influenced by wind/weather)
2. Illness (spreads via contact + stress)

### 7.5 Projects & milestones
projects produce beats and payoffs (Festival, Bridge Repair, Greenhouse, Beacon).

### 7.6 Omen / forecast (derived)
shadow sim forward horizon; surfaces likely beats with confidence; non-canonical.

---

## 8) Gameplay: What the player does
- Read chronicle headlines
- Tap for “Because…” chain
- Choose Edict/Miracle from short list
- Watch sim playback
- Decide again at beats

Skill expression:
- second-order thinking
- stabilizing equilibria (food/warmth/harmony)
- shaping social graph
- preventing cascades
- pursuing ambitions

---

## 9) Progression

### 9.1 Tracks
- Prosperity
- Harmony
- Wonder

Unlocks Edicts/Miracles/cosmetics/projects.

### 9.2 Ambitions
Pick 1 of 3: e.g., Host Grand Festival, Build Observatory.
Ambitions create milestone beats.

---

## 10) RIVET Kernel Architecture (Authoritative)

### 10.1 Determinism
- seeded RNG only
- canonicalized serialization
- no wall-clock time in sim
- pure reducers

### 10.2 World identity
`kernelVersion + genesisHash + ordered pack digests + hashChainHead`

Pack changes fork the world.

### 10.3 Event sourcing
Truth = event log. State = fold(genesis, events). Snapshots for speed.

### 10.4 Canonical event record (TS)
```ts
export type EventId = string;
export type Tick = number;

export type EventRecord = {
  id: EventId;
  tick: Tick;
  type: string;
  actorId?: string;
  targetId?: string;
  placeId?: string;
  data: Record<string, unknown>;
  causes?: EventId[];
  hash?: string;
};

export type TickBundle = {
  tick: Tick;
  events: EventRecord[];
  tickHash: string;
  prevTickHash: string;
};
```

### 10.5 Causality (“Because…”)
Use explicit `causes` when available plus deterministic reason codes.

### 10.6 Presentation separation (LLM policy)
- Chronicle derived from events.
- LLM (if used) reads only event summaries.
- LLM output is non-canonical; must have deterministic template fallback.

---

## 11) Content & Packs

### 11.1 Pack types
Theme, System, Story, Presentation.

### 11.2 Pack contract
Each pack declares:
- version
- events/reducers added
- determinism guarantees
- compatibility bounds
Pack order is part of world identity.

---

## 12) UI/UX Spec (v1)

### 12.1 Primary screens
1. World Home (chronicle since last open)
2. Snowglobe View (world + time controls)
3. Decision Panel (3–6 options)
4. Chronicle (filters + causal chain)
5. Codex (NPCs, relationships, projects)
6. Settings

### 12.2 Autopause & time controls
Show day/tick, speed/pause/step, autopause reason badge.

---

## 13) Visual Direction (v1)
Cozy, readable, top-down orthographic, minimal animation.
Asset minimums: terrain tiles, props, building shells, NPC parts (combinatorial).
Effects: fire states, rain/snow overlay, highlight rings.

---

## 14) Live Ops (works with unique worlds)
Use deterministic pack injections:
- seasonal packs
- global challenge modifiers
- community unlocks (server tracks totals; pack applies deterministically)

No arbitrary server state mutation.

---

## 15) Monetization (non-extractive)
Premium or premium-lite; cosmetics and expansions; no Favor purchase.

---

## 16) Telemetry
Session length, beats/session, choice pick rates, disaster rates, “Why” opens, retention.

---

## 17) Tech Stack Recommendation
Godot 4 for rendering/UI. Deterministic kernel as pure library (TS) for tests/tooling; port/runtime integration as needed.

---

## 18) Save/Load & Replays
Save = snapshots + event log. Replays optional but recommended. “Why panel” required.

---

## 19) Ship Gates (Definition of Done)

### 19.1 v1 MVP slice
- world creation (seeded)
- 8 NPCs, 6 zones, 3 projects
- needs/routines, economy (food/wood/stone)
- hazards: fire + illness
- 6 Edicts, 8 Miracles
- chronicle + Because chain for major events
- autopause beats (>=6 trigger types)
- deterministic save/load

### 19.2 Quality gates
- determinism: same seed+log → identical state hash
- performance: 10k ticks headless under target
- beat frequency: meaningful beat within 5 min in 90% QA runs

---

## 20) Deferred to v1.1+
Multiplayer/shared worlds, full building placement, deep genetics, complex combat, UGC marketplace.

---

## Appendix A — Example Event Types
```ts
type GTEventType =
  | "NPC_SPAWNED"
  | "NPC_MOVED"
  | "NPC_STARTED_WORK"
  | "NPC_FINISHED_WORK"
  | "NPC_ATE"
  | "NPC_RESTED"
  | "RELATIONSHIP_CHANGED"
  | "RUMOR_STARTED"
  | "RUMOR_HEARD"
  | "PROJECT_STARTED"
  | "PROJECT_PROGRESS"
  | "PROJECT_COMPLETED"
  | "FIRE_STARTED"
  | "FIRE_SPREAD"
  | "FIRE_EXTINGUISHED"
  | "ILLNESS_STARTED"
  | "ILLNESS_SPREAD"
  | "ILLNESS_RECOVERED"
  | "EDICT_SET"
  | "EDICT_CLEARED"
  | "MIRACLE_CAST"
  | "OMEN_REVEALED"
  | "BEAT_TRIGGERED";
```

---

## Appendix B — “Because…” Chain UI Contract
```ts
type BecauseNode = {
  label: string;           // short: "Food shortage"
  eventId?: string;        // canonical event reference
  reasonCode?: string;     // deterministic derived explanation
};
```

---

## Appendix C — Default v1 tuning constants
- `ticksPerDay = 240`
- `snapshotIntervalTicks = 480`
- `maxActiveEdicts = 3`
- `defaultFavorCap = 100`
- `favorGainPerDay = 8`
- `miracleCosts = 10–40`
- `autopauseMinIntervalTicks = 12`
- `forecastHorizonTicks = 240`

---

**End of Frozen Spec v1.0**
