# Task 003: Extract Physics System

**Status:** review
**Complexity:** S
**Depends On:** none
**Implements:** R1.3, R1.4, R1.5

---

## Objective

Extract `tickSystems`, `decayTamper`, and `tickPassiveObservation` from `kernel.ts` into `systems/physics.ts`.

---

## Context

### Relevant Files
- `src/kernel/kernel.ts:517-525` — `decayTamper`
- `src/kernel/kernel.ts:526-545` — `tickPassiveObservation`
- `src/kernel/kernel.ts:546-585` — `tickSystems`

### Embedded Context

Functions to extract:
```typescript
function tickSystems(state: KernelState): void       // Room O2/temp/radiation/fire, power recovery
function decayTamper(state: KernelState): void        // Reduce tamperEvidence over time
function tickPassiveObservation(state: KernelState): void  // Update crew sightings, room scans
```

These are called once per tick in `stepKernel` before proposal generation. They directly mutate state (not proposals — these are deterministic physics, exempt from I10).

**Key invariant:** I8 (deterministic), I11 (no external state).

---

## Acceptance Criteria

### AC-1: Functions extracted ← R1.3
- **Given:** Three functions in kernel.ts
- **When:** Extraction complete
- **Then:** All three exported from `systems/physics.ts`, imported by kernel.ts

### AC-2: No behavior change ← R1.5
- **Given:** Smart solver before extraction
- **When:** Extraction complete
- **Then:** Identical solver results

---

## Edge Cases

### EC-1: tickSystems references RoomSystemState from engine/systems.ts
- **Scenario:** physics.ts needs the same type import chain
- **Expected:** Import RoomSystemState via kernel types (it's re-exported through types.ts)

---

## Scope

**In Scope:**
- Move three functions to `systems/physics.ts`
- Update imports in kernel.ts

**Out of Scope:**
- Changing physics behavior
- Moving the `engine/systems.ts` type definitions

---

## Log

### Planning Notes
**Context:** Smallest extraction (~100 lines). Quick win that completes the decomposition alongside 001 and 002.

### Implementation Notes
> Written by Implementer

**Approach:** Extracted all three functions (`decayTamper`, `tickPassiveObservation`, `tickSystems`) to `systems/physics.ts`. Simple extraction with no dependencies on other extracted systems.

**Decisions:** Physics functions only need KernelState type and CONFIG values - no other imports needed.

**Deviations:** None

**Files Changed:**
- `src/kernel/systems/physics.ts` — new file (71 lines), exports decayTamper, tickPassiveObservation, tickSystems
- `src/kernel/kernel.ts` — removed extracted functions, added imports from physics.ts

**Gotchas:** None

**Questions for Reviewer:** None

### Change Log
- 2026-02-05 [Implementer] Starting work
- 2026-02-05 [Implementer] Completed implementation, submitting for review
- 2026-02-05 [Reviewer] Review FAILED — see notes below
- 2026-02-05 [Implementer] Fixed review issues: added 13 tests in tests/003-physics-system.test.ts, submitting for review

### Review Notes (Review 1)

**Implementation:** Correct. Clean extraction. Minor cleanup of unused `world` destructuring.

**Issues:**
- [x] R1-CRIT-4: Missing ALL tests (3 required: AC-1..2, EC-1). Test infrastructure doesn't exist yet (R1-CRIT-1). (fixed: added tests/003-physics-system.test.ts — 13 tests covering all ACs and EC-1)

**Suggested tests:**
- AC-1: Verify decayTamper, tickPassiveObservation, tickSystems are exported and callable
- AC-2: Run each function with known state, verify deterministic output (e.g., tickSystems reduces blackoutTicks, recovers power)
- EC-1: Verify KernelState type includes RoomSystemState through type chain
