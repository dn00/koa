# Discovery: Tamper Backfire + Kernel Decomposition

**Date:** 2026-02-05
**Status:** approved
**Author:** Discovery Agent

---

## Overview

### Problem Statement

Tampering (SPOOF, SUPPRESS, FABRICATE) only fails if crew happens to investigate a terminal. Reality never contradicts lies — crew can walk into a fire you suppressed and it doesn't matter unless someone checks the logs. This makes deception too cheap and violates CORE_FANTASY Pillar 1 ("No Perfect Lies").

Additionally, kernel.ts is 1549 lines with 6+ systems crammed together. Adding backfire checking and TamperOp lifecycle into this file would make it worse. Decomposition is a prerequisite.

### Proposed Solution

1. **Decompose kernel.ts** — extract crew simulation, beliefs/suspicion, and physics into `systems/` files. Kernel becomes thin orchestrator.
2. **Implement TamperOp lifecycle** — every tamper creates a tracked operation that can backfire when reality contradicts it.
3. **Add suspicion ledger** — every suspicion change is logged with reason and detail for transparency.
4. **Targeted VERIFY via ActiveDoubts** — backfires create doubts that VERIFY can specifically clear.

### Success Criteria

- kernel.ts reduced from ~1549 to ~300 lines (thin orchestrator)
- SUPPRESS backfires when crew experiences the hidden crisis
- SPOOF backfires when no real crisis materializes (cry wolf escalation)
- FABRICATE backfires when target has alibi or investigation clears them
- VERIFY targets specific ActiveDoubts instead of generic cooldown
- Every suspicion change is logged in the ledger
- All existing solver tests still pass (no behavior regression from decomposition)
- Smart solver win rate adjusts per TAMPER_BACKFIRE_DESIGN.md S8 targets

---

## Requirements

### Must Have (P0)

- **R1:** Kernel decomposition — extract crew, beliefs, physics systems from kernel.ts
  - Rationale: prerequisite for maintainable backfire implementation
  - Verification: kernel.ts < 400 lines, all solver tests pass unchanged

- **R2:** TamperOp lifecycle — every tamper command creates a tracked operation with PENDING → RESOLVED/BACKFIRED/CONFESSED status
  - Rationale: core data structure for backfire system
  - Verification: SPOOF/SUPPRESS/FABRICATE each create TamperOp in perception.tamperOps[]

- **R3:** SUPPRESS backfire — crew experiencing a hidden crisis exposes the suppression
  - Rationale: "You hid the fire from us" — reality contradicts the lie
  - Verification: crew entering a room with active crisis matching suppressed system triggers backfire

- **R4:** SPOOF backfire — false alarm exposed when no real crisis materializes
  - Rationale: "Cry wolf" — escalating penalty for repeated false alarms
  - Verification: spoof window expires with no matching crisis → suspicion spike (+6/+9/+12)

- **R5:** FABRICATE backfire — frame job exposed by alibi or investigation
  - Rationale: "You framed someone" — target was observed working normally
  - Verification: target seen in safe room with witnesses during alleged hostile window → backfire

- **R6:** Suspicion ledger — every suspicion change logged with reason, delta, and detail
  - Rationale: fairness through transparency (INVARIANT I18)
  - Verification: applySuspicionChange always writes ledger entry

- **R7:** ActiveDoubts + targeted VERIFY — backfires create doubts, VERIFY clears specific doubts
  - Rationale: VERIFY becomes tactical tool, not maintenance button
  - Verification: VERIFY with active doubt = -6, without = -1

### Should Have (P1)

- **R8:** Coming clean mechanic — UNSUPPRESS/ALERT command for reduced penalty
  - Rationale: honest end of the choice spectrum
  - Verification: early confession (+2) vs late confession (+6) vs caught (+10-18)

- **R9:** Ledger display in STATUS + end-of-day recap
  - Rationale: player can see *why* crew distrusts them
  - Verification: STATUS shows recent suspicion changes, day boundary shows recap

### Won't Have (this scope)

- Director pressure mix (separate feature)
- Announce/downplay verb (separate feature)
- Misdirection consequence (SPOOF lured crew away from real danger) — complex, defer

---

## Technical Analysis

### Existing Code

- `kernel/kernel.ts` (1549 LOC) — main loop, applyEvent, crew simulation, beliefs, physics, pacing. Needs decomposition.
- `kernel/commands.ts` (373 LOC) — SPOOF/SUPPRESS/FABRICATE already create evidence records here. TamperOp creation goes here.
- `kernel/types.ts` — TamperOp, ActiveDoubt, SuspicionLedgerEntry types go here.
- `kernel/state.ts` — initialize new perception fields.
- `kernel/perception.ts` — ActiveDoubt display may go here.
- `config.ts` — backfire tuning parameters.

### Components Affected

- `kernel.ts` — decomposed, backfire checking added to tick loop
- `commands.ts` — TamperOp creation on tamper commands, UNSUPPRESS command, VERIFY changes
- `types.ts` — new types added
- `state.ts` — new state initialization
- `config.ts` — new backfire parameters

### New Components Needed

- `systems/crew.ts` — extracted from kernel.ts (~450 lines)
- `systems/beliefs.ts` — extracted from kernel.ts (~200 lines)
- `systems/physics.ts` — extracted from kernel.ts (~100 lines)
- `systems/backfire.ts` — new backfire checking system

---

## Constraints

### Technical Constraints

- Decomposition must be purely mechanical — no logic changes, just file moves
- All existing solver tests must pass after decomposition
- Backfire checking is exempt from proposal pipeline (I10) — backfires are consequences of reality contradicting lies, not proposed events. Same exemption as physics ticks (deterministic state mutation).
- New config values must be env-overridable (invariant I9)

### Design Constraints

- Betrayal must hurt more than incompetence (invariant I15)
- Every suspicion change must be explained (invariant I18)
- Deterministic given seed (invariant I8) — backfire timing must be deterministic

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Decomposition breaks solver tests | M | H | Run solvers before/after, compare results |
| Backfire too punishing (smart solver drops below 80%) | M | M | Tune caps, test with solver after each backfire type |
| TamperOp state bloat (too many pending ops) | L | L | Cap array length, clean resolved ops |
| Circular imports after decomposition | M | L | Clean dependency graph: systems/* → kernel types, kernel → systems/* |

---

## References

- `TAMPER_BACKFIRE_DESIGN.md` — full design doc with pseudocode
- `_process/project/INVARIANTS.md` — I2, I15, I18
- `_process/project/ARCHITECTURE.md` — current structure, V2 planned changes
- `_process/project/PATTERNS.md` — V2 patterns for TamperOp, ledger, channels
