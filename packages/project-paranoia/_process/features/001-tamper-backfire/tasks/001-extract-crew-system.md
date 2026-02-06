# Task 001: Extract Crew System

**Status:** ready
**Complexity:** M
**Depends On:** none
**Implements:** R1.1, R1.4, R1.5

---

## Objective

Extract `proposeCrewEvents` and all its helper functions from `kernel.ts` into `systems/crew.ts`, reducing kernel.ts by ~450 lines.

---

## Context

### Relevant Files
- `src/kernel/kernel.ts:622-1070` — `proposeCrewEvents` function and inline helpers
- `src/kernel/types.ts` — types used by crew simulation
- `src/kernel/systems/arcs.ts` — existing extracted system (pattern to follow)
- `src/kernel/systems/comms.ts` — existing extracted system (pattern to follow)

### Embedded Context

The function to extract:
```typescript
function proposeCrewEvents(state: KernelState, rng: RNG): Proposal[]
```

It uses these helpers currently defined in kernel.ts:
- `isRoomHazardous(room)` — checks O2/temp/radiation/vented/fire
- `findSafeRoom(state, current, exclude?)` — BFS for nearest safe room
- `makeReading(...)` — creates SensorReading objects

**Pattern to follow:** See how `arcs.ts` exports `proposeArcEvents` and `comms.ts` exports `proposeCommsEvents`. Both take `KernelState` + `RNG` and return `Proposal[]`.

**Import pattern:**
```typescript
// systems/crew.ts
import type { KernelState, Proposal } from '../types.js';
import type { RNG } from '../../core/rng.js';
import { makeProposal } from '../proposals.js';
import { CONFIG } from '../../config.js';
```

**Key invariant:** I8 (deterministic given seed) — no behavior change from extraction.

---

## Acceptance Criteria

### AC-1: Function extracted ← R1.1
- **Given:** Current `proposeCrewEvents` in kernel.ts (lines 622-1070)
- **When:** Extraction complete
- **Then:** `proposeCrewEvents` exported from `systems/crew.ts`, imported by kernel.ts

### AC-2: Helpers co-located ← R1.1
- **Given:** `isRoomHazardous`, `findSafeRoom`, `makeReading` used by crew events
- **When:** Extraction complete
- **Then:** Helpers that are only used by crew events live in `systems/crew.ts`. Helpers shared with other systems stay in kernel.ts or move to a shared utils file.

### AC-3: Kernel.ts reduced ← R1.4
- **Given:** kernel.ts is ~1549 lines
- **When:** Extraction complete
- **Then:** kernel.ts is ~450 lines shorter

### AC-4: No behavior change ← R1.5
- **Given:** Smart solver produces ~93.5% win rate before extraction
- **When:** Extraction complete
- **Then:** Smart solver produces identical win rate (same seeds, same results)

---

## Edge Cases

### EC-1: Shared helpers
- **Scenario:** `isRoomHazardous` or `findSafeRoom` is used by other functions in kernel.ts
- **Expected:** Export from crew.ts and import where needed, OR move to a shared utils file

### EC-2: Circular imports
- **Scenario:** crew.ts needs something from kernel.ts that kernel.ts needs from crew.ts
- **Expected:** Break cycle by having crew.ts depend only on types.ts, proposals.ts, config.ts, and core/*

---

## Error Cases

### ERR-1: Import path mismatch
- **When:** Relative imports don't resolve after file move
- **Then:** Fix all import paths. Project uses `.js` extensions in imports.

---

## Scope

**In Scope:**
- Move `proposeCrewEvents` and its private helpers to `systems/crew.ts`
- Update imports in kernel.ts
- Verify solver results unchanged

**Out of Scope:**
- Refactoring the crew simulation logic
- Changing any game behavior
- Extracting `applyEvent` crew cases (stays in kernel.ts for now)

---

## Implementation Hints

- Start by identifying which helpers are used ONLY by proposeCrewEvents vs shared
- `clamp` is likely shared — leave it in kernel.ts or make a utils file
- `makeReading` is used by both proposeCrewEvents AND proposePerceptionEvents (line 1093). Move it to a shared utils file (e.g. `kernel/utils.ts`), not crew.ts, so both can import it.
- The `findPath` and `getDoorBetween` imports come from `core/world.ts` — crew.ts will need these too
- Run `npx tsx scripts/smart-solver.ts 50` before and after to verify

---

## Log

### Planning Notes
**Context:** kernel.ts has 6+ systems in 1549 lines. Crew simulation is the largest single block (~450 lines). Extracting it first gives the biggest reduction.
**Decisions:** Extract to systems/crew.ts following existing arcs.ts/comms.ts pattern.
