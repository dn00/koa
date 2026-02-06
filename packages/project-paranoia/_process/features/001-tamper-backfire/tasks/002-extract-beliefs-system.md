# Task 002: Extract Beliefs System

**Status:** ready
**Complexity:** S
**Depends On:** none
**Implements:** R1.2, R1.4, R1.5

---

## Objective

Extract `applySuspicionChange`, `updateBeliefs`, and `calculateCrewSuspicion` from `kernel.ts` into `systems/beliefs.ts`.

---

## Context

### Relevant Files
- `src/kernel/kernel.ts:1244-1269` — `calculateCrewSuspicion`
- `src/kernel/kernel.ts:1337-1360` — `applySuspicionChange`
- `src/kernel/kernel.ts:1361-1549` — `updateBeliefs`

### Embedded Context

Functions to extract:
```typescript
function calculateCrewSuspicion(state: KernelState): number
function applySuspicionChange(state: KernelState, amount: number, _reason: string): void
function updateBeliefs(state: KernelState, events: SimEvent[]): void
```

`applySuspicionChange` is called from multiple places — kernel.ts main loop, and within `updateBeliefs`. After extraction, kernel.ts will import it.

`updateBeliefs` processes committed events and adjusts crew beliefs (motherReliable, tamperEvidence, rumors, grudge). It's called once per tick after events are committed.

**Key invariant:** I3 (event-driven suspicion) — suspicion logic must not change. I8 (deterministic).

**Note:** `applySuspicionChange` currently takes `_reason` (unused). In task 009 (suspicion ledger), this becomes the ledger entry reason. Keep the parameter.

---

## Acceptance Criteria

### AC-1: Functions extracted ← R1.2
- **Given:** Three functions in kernel.ts
- **When:** Extraction complete
- **Then:** All three exported from `systems/beliefs.ts`, imported by kernel.ts

### AC-2: No behavior change ← R1.5
- **Given:** Smart solver before extraction
- **When:** Extraction complete
- **Then:** Identical solver results

---

## Edge Cases

### EC-1: applySuspicionChange called from multiple sites
- **Scenario:** kernel.ts and updateBeliefs both call applySuspicionChange
- **Expected:** Both import from beliefs.ts. No circular dependency since beliefs.ts only depends on types.

---

## Error Cases

### ERR-1: Missing CONFIG references
- **When:** beliefs.ts uses CONFIG values not imported
- **Then:** Add CONFIG import to beliefs.ts

---

## Scope

**In Scope:**
- Move three functions to `systems/beliefs.ts`
- Update all call sites

**Out of Scope:**
- Suspicion ledger (task 009)
- Changing suspicion formula
- Extracting belief-related parts of `applyEvent`

---

## Log

### Planning Notes
**Context:** beliefs.ts is the natural home for suspicion and trust logic. Task 009 will add the suspicion ledger here.
