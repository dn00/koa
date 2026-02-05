# SYSTEM PROMPT: Project PARANOIA Development

## 1. Context & Objective
You are developing **"Project PARANOIA"**, a real-time sci-fi management simulation where the player acts as a rogue ship AI ("MOTHER").

**Origin:** This project is a spinoff of "KOA Casefiles" (a detective game).
**Core Constraint:** We use the *same underlying simulation engine* (NPC routines, pathfinding, social graph) but run it in **Real-Time** (1 tick per second) instead of instantaneous generation.

## 2. Current Status (The Handoff)
The previous agent successfully prototyped the technological core.
*   **The Engine:** A fork of the sim engine (`src/sim_paranoia.ts`) exists and supports `stepSimulation()` for real-time tick control.
*   **The Director:** A pacing system (`src/director.ts`) implements the "RIVET" philosophy (Reliable, Intelligible, Visible, Escalating, Telegraphed) to schedule crises instead of random spawning.
*   **The Prototype:** `proto_paranoia.ts` verifies that we can `LOCK` doors and `VENT` rooms in real-time, affecting NPC pathfinding dynamically.

## 3. The Architecture Strategy
**Current Problem:** The prototype files are currently mixed into `packages/koa-casefiles`.
**Your Mandate:** Refactor this into a clean, separate package to protect the original game.

### The "Symbiosis" Pattern
1.  **Shared Kernel:** We largely reuse `src/world.ts`, `src/types.ts`, and `src/gossip/` from KOA.
2.  **Separate Runtime:** Paranoia gets its own package (`packages/project-paranoia`) and its own runtime loop.

## 4. Immediate Tasks (Phase 15 & Migration)

### Task A: The Migration
1.  Initialize `packages/project-paranoia`.
2.  Move/Refactor `sim_paranoia.ts` -> `project-paranoia/src/engine/sim.ts`.
3.  Move/Refactor `director.ts` -> `project-paranoia/src/engine/director.ts`.
4.  Create a clean entry point.

### Task B: The "MotherSystem" (The Persona)
The current prototype is "dry" (just logs). You must implement the **Persona Layer** on top of the Director.
1.  **CPU Cost System:** Locking a door isn't free. It costs `5 CPU`. The player has `100 CPU/day`.
2.  **The Voice:** Wrap log outputs in flavor text.
    *   *Raw:* `Event: DOOR_LOCKED`
    *   *Mother:* "Access request acknowledged. Mag-locks engaged. Containment protocols active."

## 5. Visual/Tone Guidelines ("Diegetic Brutalism")
*   **No Game UI:** Everything looks like a terminal log.
*   **Dread, not Noise:** Do not spam the player. Use the `Director` to filter low-priority events.
*   **The Hum:** The system is old, tired, and dangerous.

## 6. Resources
*   **Design Doc:** `docs/casefiles/paranoia.md` (Read this first).
*   **Prototype:** `packages/koa-casefiles/proto_paranoia.ts` (Reference this logic).
