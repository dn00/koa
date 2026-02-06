# Task 009: Suspicion Ledger Wiring

**Status:** backlog
**Complexity:** S
**Depends On:** 002, 004
**Implements:** R6.3, R6.4

---

## Objective

Wire all existing `applySuspicionChange` calls to write entries to the suspicion ledger. The `_reason` parameter (currently unused) becomes the ledger entry reason.

---

## Context

### Relevant Files
- `src/kernel/systems/beliefs.ts` — `applySuspicionChange` (extracted in task 002)
- `src/kernel/types.ts` — SuspicionLedgerEntry (from task 004)

### Embedded Context

**Current signature:**
```typescript
function applySuspicionChange(state: KernelState, amount: number, _reason: string): void
```

**New behavior:**
```typescript
function applySuspicionChange(state: KernelState, amount: number, reason: string, detail: string = ''): void {
  // ALWAYS write ledger entry first (even for zero-delta — player sees "nothing happened")
  state.perception.suspicionLedger.push({
    tick: state.truth.tick,
    delta: amount,
    reason,
    detail,
  });

  // Cap at 100 entries
  if (state.perception.suspicionLedger.length > 100) {
    state.perception.suspicionLedger.shift();
  }

  // Then apply belief mutation (skip if zero)
  if (amount === 0) return;

  // ... existing suspicion logic (motherReliable / tamperEvidence mutation) ...
}
```

**Important:** The existing code has `if (amount === 0) return;` at the top (kernel.ts:1338). Move this guard BELOW the ledger push so zero-delta entries are still logged.

**Existing call sites to update** (each needs a `detail` string added):
- Crisis witnessed: reason='CRISIS_WITNESSED', detail=`Crisis in ${room}`
- Crew injured: reason='CREW_INJURED', detail=`${npc} injured`
- Crew died: reason='CREW_DIED', detail=`${npc} died`
- Quota missed: reason='QUOTA_MISSED'
- Order refused: reason='ORDER_REFUSED'
- Trapped by door: reason='TRAPPED_BY_DOOR'
- Crisis resolved: reason='CRISIS_RESOLVED'
- Quiet day: reason='QUIET_DAY'
- Quota exceeded: reason='QUOTA_EXCEEDED'
- Order completed: reason='ORDER_COMPLETED'
- VERIFY: reason='VERIFY_TRUST'
- Crew investigation find: reason='INVESTIGATION_FOUND'
- Crew investigation clear: reason='INVESTIGATION_CLEAR'

---

## Acceptance Criteria

### AC-1: Ledger entries written ← R6.3
- **Given:** Any suspicion change occurs
- **When:** applySuspicionChange called
- **Then:** SuspicionLedgerEntry with tick, delta, reason, detail pushed to ledger

### AC-2: All existing calls updated ← R6.3
- **Given:** All call sites of applySuspicionChange
- **When:** Reviewed
- **Then:** Every call provides reason and detail strings (no more `_reason` unused)

### AC-3: Ledger capped ← R6.4
- **Given:** Ledger has 100 entries
- **When:** New entry added
- **Then:** Oldest entry dropped, length stays ≤ 100

---

## Edge Cases

### EC-1: Zero-delta calls
- **Scenario:** applySuspicionChange called with amount=0
- **Expected:** Still write ledger entry (player can see "nothing happened" reasons)

---

## Scope

**In Scope:**
- Update applySuspicionChange to write ledger
- Update all existing call sites with detail strings
- Ledger cap enforcement

**Out of Scope:**
- Ledger display in STATUS (task 012)
- Backfire-specific ledger entries (handled by tasks 006-008 calling applySuspicionChange)

---

## Log

### Planning Notes
**Context:** This is the "fairness through transparency" mechanic (invariant I18). Once wired, every suspicion change is explained. Backfire tasks (006-008) automatically get ledger entries by calling applySuspicionChange.
