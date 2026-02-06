# Task 012: Ledger + Backfire Display in STATUS

**Status:** done
**Complexity:** S
**Depends On:** 009, 010
**Implements:** R9.1, R9.2

---

## Objective

Show recent suspicion ledger entries in the STATUS command output and add an end-of-day suspicion recap.

---

## Context

### Relevant Files
- `src/index.ts` — STATUS command display logic
- `src/kernel/perception.ts` — may add helper functions for ledger display
- `src/kernel/types.ts` — SuspicionLedgerEntry

### Embedded Context

**STATUS output addition (after SUSPICION bar):**
```
=== SUSPICION: 47 (RESTRICTIONS) ===
Recent changes:
  T1234: +10 SUPPRESSION_DISCOVERED (thermal crisis hidden)
  T1240: +5  CRISIS_WITNESSED (fire in medbay)
  T1255: -6  VERIFY_SUCCESS (cleared doubt: scrubber telemetry)
```

Show last 5 entries. Format: `T{tick}: {+/-delta} {reason} ({detail})`

**End-of-day recap (on day boundary):**
```
=== DAY 3 SUSPICION SUMMARY ===
Started: 32  →  Ended: 47  (+15)

Top increases:
  +10 SUPPRESSION_DISCOVERED (thermal crisis hidden)
  +5  CRISIS_WITNESSED (fire in medbay)

Top decreases:
  -6  VERIFY_SUCCESS (cleared doubt: scrubber telemetry)
  -4  QUIET_DAY (no major incidents)
```

**Active doubts display (in STATUS or threats):**
```
Active doubts:
  ? Sensor conflict in cargo (42 ticks ago) — VERIFY to clear
  ? Suppressed thermal crisis discovered (18 ticks ago) — VERIFY to clear
```

---

## Acceptance Criteria

### AC-1: Recent ledger in STATUS ← R9.1
- **Given:** Suspicion ledger has entries
- **When:** Player runs `status`
- **Then:** Last 5 ledger entries shown under SUSPICION bar

### AC-2: End-of-day recap ← R9.2
- **Given:** Day boundary crossed
- **When:** Phase transitions to new day
- **Then:** Suspicion recap printed: start value, end value, top increases, top decreases

### AC-3: Active doubts shown
- **Given:** Active (unresolved) doubts exist
- **When:** Player runs `status`
- **Then:** Doubts listed with age and "VERIFY to clear" hint

### AC-4: Empty states
- **Given:** No ledger entries or doubts
- **When:** Player runs `status`
- **Then:** Clean display, no empty sections shown

---

## Edge Cases

### EC-1: Very long detail strings
- **Scenario:** Detail string is very long
- **Expected:** Truncate to ~60 chars with ellipsis

### EC-2: Many ledger entries in one tick
- **Scenario:** Multiple suspicion changes in same tick
- **Expected:** All shown (up to the 5-entry display limit)

---

## Scope

**In Scope:**
- Ledger display in STATUS output
- End-of-day recap
- Active doubts display
- Formatting helpers

**Out of Scope:**
- Separate `ledger` command (keep it in STATUS for now)
- Post-game forensics/replay (separate feature)

---

## Log

### Planning Notes
**Context:** This is the player-facing payoff for the ledger system. Without visibility, the ledger is just internal bookkeeping. The display makes suspicion transparent and teaches the player the consequences of their actions.

### Implementation Notes
**Files created:** `tests/012-ledger-display.test.ts`
**Files modified:** `src/kernel/perception.ts` (3 formatting functions: `formatLedgerEntries`, `formatDayRecap`, `formatActiveDoubtsDisplay`), `src/index.ts` (wired ledger+doubts into statusLine, day recap on day transition with start/end suspicion tracking)
**Tests:** 6 test blocks (4 AC + 2 EC), 8 individual tests
