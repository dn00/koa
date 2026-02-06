# Plan: Tamper Backfire + Kernel Decomposition

**Discovery:** `_process/features/001-tamper-backfire/discovery.md`
**Design Doc:** `TAMPER_BACKFIRE_DESIGN.md`
**Status:** ready

---

## Overview

Decompose the 1549-line kernel.ts into focused system files, then implement the TamperOp lifecycle so that lies are exposed by reality (not just investigation), VERIFY targets specific doubts, and every suspicion change is logged.

---

## Requirements Expansion

### From R1: Kernel decomposition

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | `proposeCrewEvents` extracted to `systems/crew.ts` | Function exists in crew.ts, kernel.ts imports it | 001 |
| R1.2 | `applySuspicionChange`, `updateBeliefs`, `calculateCrewSuspicion` extracted to `systems/beliefs.ts` | Functions exist in beliefs.ts, kernel.ts imports them | 002 |
| R1.3 | `tickSystems`, `decayTamper`, `tickPassiveObservation` extracted to `systems/physics.ts` | Functions exist in physics.ts, kernel.ts imports them | 003 |
| R1.4 | kernel.ts is a thin orchestrator (~200-400 lines) | Line count verified | 001, 002, 003 |
| R1.5 | No behavior change — solver results identical before/after | Smart solver run produces same win rate ±1% | 001, 002, 003 |

### From R2: TamperOp lifecycle

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | `TamperOp` type defined with kind, status, target, severity, crewAffected, windowEndTick | Type exists in types.ts | 004 |
| R2.2 | `tamperOps: TamperOp[]` added to PerceptionState | Field exists, initialized to [] | 004 |
| R2.3 | SUPPRESS command creates TamperOp with kind='SUPPRESS' | Op pushed to tamperOps on suppress | 005 |
| R2.4 | SPOOF command creates TamperOp with kind='SPOOF' | Op pushed to tamperOps on spoof | 005 |
| R2.5 | FABRICATE command creates TamperOp with kind='FABRICATE' | Op pushed to tamperOps on fabricate | 005 |

### From R3: SUPPRESS backfire

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | Pending SUPPRESS ops checked each tick for contradiction | checkSuppressBackfire called in tick loop | 006 |
| R3.2 | Backfire triggers when crew is in room with active crisis matching suppressed system | SUPPRESS op for 'thermal' backfires when crew in room with onFire=true | 006 |
| R3.3 | Backfire suspicion spike: base +10, +2 per severity, +2 if injured, +4 if death, cap 18 | Spike formula matches design doc | 006 |
| R3.4 | Backfired op status set to 'BACKFIRED' with backfireTick | Status transitions correctly | 006 |

### From R4: SPOOF backfire

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R4.1 | Pending SPOOF ops checked when windowEndTick reached | checkSpoofBackfire called in tick loop | 007 |
| R4.2 | Backfire triggers when window expires with no matching real crisis and crew responded | Op with crewAffected > 0 and no matching arc → backfire | 007 |
| R4.3 | Cry-wolf escalation: first +6, second +9, third+ +12 per day | Escalating penalty based on daily false alarm count | 007 |
| R4.4 | Trust lost by crew who responded to false alarm | motherReliable -= 0.04 for each affected crew | 007 |

### From R5: FABRICATE backfire

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R5.1 | Pending FABRICATE ops checked each tick for contradiction | checkFabricateBackfire called in tick loop | 008 |
| R5.2 | Alibi check: target seen working in safe room with witnesses | checkTargetHasAlibi returns true when conditions met | 008 |
| R5.3 | Backfire suspicion spike: base +12, +2 per severity, +3 injured, +3 confined, +6 attacked, cap 22 | Spike formula matches design doc | 008 |
| R5.4 | Target becomes extremely distrustful: motherReliable -0.3, tamperEvidence +20 | Belief state updated on backfire | 008 |

### From R6: Suspicion ledger

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R6.1 | `SuspicionLedgerEntry` type: tick, delta, reason, detail | Type exists in types.ts | 004 |
| R6.2 | `suspicionLedger: SuspicionLedgerEntry[]` added to PerceptionState | Field exists, initialized to [] | 004 |
| R6.3 | All applySuspicionChange calls write to ledger | Every existing call site updated with reason + detail | 009 |
| R6.4 | Ledger capped at 100 entries (oldest dropped) | Length check after push | 009 |

### From R7: ActiveDoubts + targeted VERIFY

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R7.1 | `ActiveDoubt` type: id, topic, createdTick, severity, involvedCrew, relatedOpId, resolved | Type exists in types.ts | 004 |
| R7.2 | `activeDoubts: ActiveDoubt[]` added to PerceptionState | Field exists, initialized to [] | 004 |
| R7.3 | Backfires create ActiveDoubts | Each backfire type creates a doubt | 010 |
| R7.4 | VERIFY with matching active doubt: -6 suspicion, doubt resolved | Targeted verify gives bigger reward | 010 |
| R7.5 | VERIFY without active doubt: -1 suspicion (minimal) | Idle verify is weak | 010 |
| R7.6 | Doubts decay after ~100 ticks if unresolved | Stale doubts cleaned up | 010 |

### From R8: Coming clean

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R8.1 | UNSUPPRESS/ALERT command exists | Command type added, parsed in CLI | 011 |
| R8.2 | Early confession (≤15 ticks): +2 suspicion, op status CONFESSED | Reduced penalty for quick honesty | 011 |
| R8.3 | Late confession (>15 ticks): +6 suspicion, op status CONFESSED | Moderate penalty for delayed honesty | 011 |

### From R9: Ledger display

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R9.1 | STATUS command shows recent suspicion ledger entries | Last 5 entries shown in status output | 012 |
| R9.2 | End-of-day recap shows suspicion summary | Day start/end, top increases, top decreases | 012 |

---

## Dependency Graph

```
001 (crew) ─────┐
002 (beliefs) ──┤
003 (physics) ──┤
004 (types) ────┤
                ↓
        005 (tamperOp creation) ──┐
        009 (suspicion ledger) ───┤
                                  ↓
                          006 (SUPPRESS backfire)
                          007 (SPOOF backfire)
                          008 (FABRICATE backfire)
                          011 (coming clean) ← needs only 005
                                  ↓
                          010 (ActiveDoubts + VERIFY)
                                  ↓
                          012 (ledger display)
```

---

## Batch Analysis

| Batch | Tasks | Complexity | Blocked By | Notes |
|-------|-------|------------|------------|-------|
| 1 | 001, 002, 003, 004 | M | - | Foundation: decomposition + types. All parallel. |
| 2 | 005, 009 | S | Batch 1 | Wiring: TamperOp creation on commands + ledger. Parallel. |
| 3 | 006, 007, 008, 011 | M | Batch 2 | Core feature: three backfire systems + coming clean. All parallel. |
| 4 | 010, 012 | M | Batch 3 | Integration: ActiveDoubts/VERIFY + ledger display. Parallel. |

---

## Task Summary

| ID | Name | Complexity | Status | Batch |
|----|------|------------|--------|-------|
| 001 | Extract crew system | M | done | 1 |
| 002 | Extract beliefs system | S | done | 1 |
| 003 | Extract physics system | S | done | 1 |
| 004 | TamperOp + ActiveDoubt + Ledger types | S | done | 1 |
| 005 | TamperOp creation on tamper commands | S | done | 2 |
| 006 | SUPPRESS backfire | M | done | 3 |
| 007 | SPOOF backfire | M | done | 3 |
| 008 | FABRICATE backfire | M | done | 3 |
| 009 | Suspicion ledger wiring | S | done | 2 |
| 010 | ActiveDoubts + targeted VERIFY | M | backlog | 4 |
| 011 | Coming clean (UNSUPPRESS/ALERT) | S | done | 3 |
| 012 | Ledger + backfire display in STATUS | S | backlog | 4 |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Decomposition breaks solver | M | H | Run solver before/after each extraction, compare win rates |
| Backfire too harsh → solver drops below 80% | M | M | Tune severity caps after each backfire type, run solver |
| Circular imports after decomposition | M | L | systems/* imports types only, kernel imports systems/* |
| TamperOp array grows unbounded | L | L | Clean resolved/backfired ops older than 240 ticks (1 day) |

---

## Open Questions

- Should backfire checking go through the proposal pipeline (invariant I10) or be direct state mutation? Design doc shows direct mutation. Proposal pipeline may be cleaner but adds complexity. **Decision: direct mutation for backfires** — they're consequences, not proposals.
- How to track "crew who responded to spoof" for SPOOF backfire? **Decision: resolved in Task 007** — track crew who moved toward `SYSTEM_RESPONSE_PLACES[system]` or arrived there after spoof creation. This is an approximation (crew may move for other reasons) but errs on the side of "crew were near, they probably noticed."

---

## Review Log

### Review 1: 2026-02-05

**Reviewer:** Claude (Plan-Level Reviewer)
**Verdict:** NEEDS-CHANGES

#### Test Results
- **Tests:** No test infrastructure exists. 0 tests. `package.json` has placeholder test script.
- **Type check:** 0 NEW errors in extracted files. Pre-existing errors only (Door type, tick/proposal mismatch, TS7053 indexing).

#### Implementation Assessment
Implementation quality is **good**. All four tasks are correctly implemented:
- Tasks 001-003: Clean cut-and-paste extraction following arcs.ts/comms.ts pattern. No logic changes. No circular imports. kernel.ts reduced from 1549→759 lines.
- Task 004: Types match design doc exactly. PerceptionState extended. State initialized.

#### Critical Issues
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| R1-CRIT-1 | No test infrastructure | `package.json` | No vitest/jest configured. No test runner, no config, no dependencies. |
| R1-CRIT-2 | Task 001 missing 7 tests | — | AC-1..4, EC-1..2, ERR-1 all untested |
| R1-CRIT-3 | Task 002 missing 4 tests | — | AC-1..2, EC-1, ERR-1 all untested |
| R1-CRIT-4 | Task 003 missing 3 tests | — | AC-1..2, EC-1 all untested |
| R1-CRIT-5 | Task 004 missing 5 tests | — | AC-1..4, EC-1 all untested |

#### Should-Fix Issues
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| R1-SHLD-1 | Unused import | `crew.ts:8` | `import { clamp } from '../utils.js'` — clamp is never called in crew.ts. Remove it. |

#### Consider Issues
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| R1-CNSD-1 | Separate eventOrdinal | `beliefs.ts:59` | Own `let eventOrdinal = 0` diverges from kernel.ts ordinal. No behavioral impact (different ID format) but deviates from original single-counter. |
| R1-CNSD-2 | Save/load migration | `state.ts` | No migration for old saves missing new PerceptionState fields. New games fine, old saves could crash. |

#### Action Items
- [ ] R1-CRIT-1: Install vitest, create `vitest.config.ts`, add test script to package.json
- [ ] R1-CRIT-2: Write tests for Task 001 (7 test blocks: AC-1..4, EC-1..2, ERR-1)
- [ ] R1-CRIT-3: Write tests for Task 002 (4 test blocks: AC-1..2, EC-1, ERR-1)
- [ ] R1-CRIT-4: Write tests for Task 003 (3 test blocks: AC-1..2, EC-1)
- [ ] R1-CRIT-5: Write tests for Task 004 (5 test blocks: AC-1..4, EC-1)
- [ ] R1-SHLD-1: Remove unused `clamp` import from crew.ts

#### What's Good
- Clean extraction following existing arcs.ts/comms.ts pattern
- No new type errors introduced
- Import graph is clean (no circular dependencies)
- clamp properly shared via utils.ts
- makeReading correctly left in kernel.ts
- Types match design doc exactly
- kernel.ts reduced by ~51%
