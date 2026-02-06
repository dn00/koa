# Task 010: ActiveDoubts + Targeted VERIFY

**Status:** done
**Complexity:** M
**Depends On:** 006, 007, 008
**Implements:** R7.3, R7.4, R7.5, R7.6

---

## Objective

Backfires create ActiveDoubts. VERIFY command targets specific doubts for larger suspicion drop (-6) vs idle verify (-1). Doubts decay after ~100 ticks.

---

## Context

### Relevant Files
- `src/kernel/systems/backfire.ts` — add doubt creation after backfires
- `src/kernel/commands.ts` — modify VERIFY handler
- `src/kernel/types.ts` — ActiveDoubt type (from task 004)
- `TAMPER_BACKFIRE_DESIGN.md` Section 5 — full pseudocode

### Embedded Context

**Doubt creation (in backfire functions):**
```typescript
// After triggerSuppressBackfire:
state.perception.activeDoubts.push({
  id: `doubt-${state.truth.tick}-suppress`,
  topic: `${op.target.system} crisis was hidden`,
  createdTick: state.truth.tick,
  severity: op.severity,
  involvedCrew: op.crewAffected,
  relatedOpId: op.id,
  system: op.target.system,
  resolved: false,
});
```

**VERIFY command change:**
Currently VERIFY in `commands.ts:238-316` has: cooldown check, power cost, tamper penalty multiplier, proposal generation. It creates a proposal with `action: 'VERIFY_TRUST'` and `suspicionDrop` in the data (line 290). The actual suspicion change is applied when this proposal is committed in `kernel.ts applyEvent`.

**Architecture note:** The commands.ts VERIFY handler builds proposals; `kernel.ts applyEvent` applies them. The doubt-targeting logic belongs in `applyEvent` where VERIFY_TRUST action is handled.

Changes needed:
1. **commands.ts:** Keep proposal flow. Add `hasDoubt: boolean` to proposal data.
2. **kernel.ts applyEvent:** Find where VERIFY_TRUST is processed. Add doubt-targeting logic there.

```typescript
// In commands.ts, inside the hasPower && !onCooldown branch (~line 285):
// Add doubt detection to proposal data:
const activeDoubt = state.perception.activeDoubts.find(d => !d.resolved);
// ... existing proposal code, but add to data:
data: {
    action: 'VERIFY_TRUST',
    suspicionDrop: activeDoubt ? CONFIG.verifyDoubtDrop : CONFIG.verifyIdleDrop,
    tamperDrop: CONFIG.verifyTamperDrop * effectMultiplier,
    powerCost: CONFIG.verifyCpuCost,
    hasTampered,
    hasDoubt: !!activeDoubt,       // NEW
    doubtId: activeDoubt?.id,       // NEW
},
```

```typescript
// In kernel.ts applyEvent, VERIFY_TRUST case (search for 'VERIFY_TRUST'):
// Add doubt resolution logic:
if (data.hasDoubt && data.doubtId) {
  const doubt = state.perception.activeDoubts.find(d => d.id === data.doubtId);
  if (doubt) {
    doubt.resolved = true;
    // Mark related tamper op as resolved
    if (doubt.relatedOpId) {
      const op = state.perception.tamperOps.find(o => o.id === doubt.relatedOpId);
      if (op) op.status = 'RESOLVED';
    }
  }
}
// Then apply suspicion change via applySuspicionChange with reason
```

**Location:** VERIFY_TRUST is handled in `kernel.ts:209-229` inside `applyEvent`. It already calls `applySuspicionChange(state, suspicionDrop, 'VERIFY_TRUST')` at line 219. Add doubt resolution logic before this call.

**Doubt decay:**
Add `decayDoubts(state)` function to `systems/backfire.ts`, called from `stepKernel` after backfire checks:
```typescript
export function decayDoubts(state: KernelState): void {
  state.perception.activeDoubts = state.perception.activeDoubts.filter(
    d => d.resolved || (state.truth.tick - d.createdTick) < CONFIG.doubtDecayTicks
  );
}
```
Co-located with backfire logic since doubts are created by backfires.

**Config additions:**
```typescript
verifyDoubtDrop: num('PARANOIA_VERIFY_DOUBT_DROP', -6),
verifyIdleDrop: num('PARANOIA_VERIFY_IDLE_DROP', -1),
doubtDecayTicks: num('PARANOIA_DOUBT_DECAY_TICKS', 100),
```

---

## Acceptance Criteria

### AC-1: Backfires create doubts ← R7.3
- **Given:** SUPPRESS backfire triggers
- **When:** Backfire function runs
- **Then:** ActiveDoubt pushed with topic, severity, relatedOpId

### AC-2: Targeted VERIFY clears doubt ← R7.4
- **Given:** Active doubt exists, player runs `verify`
- **When:** VERIFY processed
- **Then:** Doubt.resolved = true, suspicion drops by -6

### AC-3: Idle VERIFY gives minimal benefit ← R7.5
- **Given:** No active doubts, player runs `verify`
- **When:** VERIFY processed
- **Then:** Suspicion drops by -1

### AC-4: Doubts decay ← R7.6
- **Given:** Unresolved doubt created 100+ ticks ago
- **When:** Tick advances
- **Then:** Doubt removed from activeDoubts array

### AC-5: Related op resolved
- **Given:** Doubt with relatedOpId pointing to a TamperOp
- **When:** Doubt resolved via VERIFY
- **Then:** Linked TamperOp status set to 'RESOLVED'

---

## Edge Cases

### EC-1: Multiple active doubts
- **Scenario:** Two backfires create two doubts, player verifies
- **Expected:** Oldest doubt resolved first (FIFO)

### EC-2: VERIFY cooldown still applies
- **Scenario:** Player tries to verify twice in quick succession
- **Expected:** Existing cooldown still applies (80 ticks between verifies)

### EC-3: Doubt created while VERIFY on cooldown
- **Scenario:** Backfire at tick 50, VERIFY used at tick 40 (cooldown until tick 120)
- **Expected:** Doubt sits until VERIFY available. May decay if cooldown is very long.

---

## Scope

**In Scope:**
- Doubt creation in backfire functions (all three types)
- VERIFY command modification (targeted vs idle)
- Doubt decay in tick loop
- Config parameters

**Out of Scope:**
- Doubts from non-backfire sources (epistemic events — DIRECTOR_PRESSURE_MIX feature)
- VERIFY targeting specific doubts by name (just clears oldest for now)

---

## Log

### Planning Notes
**Context:** This transforms VERIFY from maintenance button to tactical tool. The key insight: VERIFY is most valuable right after a backfire, creating a meaningful decision about when to spend the cooldown.

### Implementation Notes
**Files created:** `tests/010-active-doubts-verify.test.ts`
**Files modified:** `src/kernel/systems/backfire.ts` (doubt creation after all 3 backfire types + `decayDoubts`), `src/kernel/commands.ts` (VERIFY detects active doubts, sets `verifyDoubtDrop`/`verifyIdleDrop`), `src/kernel/kernel.ts` (doubt resolution in VERIFY_TRUST handler + `decayDoubts` in tick loop), `src/config.ts` (3 new config values)
**Tests:** 8 test blocks (5 AC + 3 EC), 8 individual tests
**Note:** VERIFY suspicionDrop no longer uses effectMultiplier — doubt gives fixed -6, idle gives fixed -1. tamperDrop still penalized by recent tampering.
