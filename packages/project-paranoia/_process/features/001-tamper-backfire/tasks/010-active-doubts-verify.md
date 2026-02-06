# Task 010: ActiveDoubts + Targeted VERIFY

**Status:** backlog
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
Currently VERIFY in `commands.ts:238-316` has: cooldown check, power cost, tamper penalty multiplier, proposal generation, tamperEvidence reduction. **Keep all of that infrastructure.** Only modify the suspicion drop logic inside the "has power + off cooldown" branch.

Changes to the existing VERIFY handler:
1. **Keep:** cooldown check, power cost check, `lastVerifyTick` update, proposal flow
2. **Keep:** tamperEvidence reduction (`CONFIG.verifyTamperDrop`)
3. **Replace:** the suspicion drop value — instead of `CONFIG.verifySuspicionDrop`, use doubt-targeting:

```typescript
// Inside the existing "hasPower && !onCooldown" branch of VERIFY:
const doubt = state.perception.activeDoubts.find(d => !d.resolved);

let suspicionDrop: number;
let verifyDetail: string;

if (doubt) {
  // Targeted verify: bigger reward
  doubt.resolved = true;
  suspicionDrop = CONFIG.verifyDoubtDrop;  // -6
  verifyDetail = `Cleared doubt: ${doubt.topic}`;
  // Mark related tamper op as resolved
  if (doubt.relatedOpId) {
    const op = state.perception.tamperOps.find(o => o.id === doubt.relatedOpId);
    if (op) op.status = 'RESOLVED';
  }
} else {
  // Idle verify: minimal benefit
  suspicionDrop = CONFIG.verifyIdleDrop;   // -1
  verifyDetail = 'No active doubts to clear';
}

// Apply tamper penalty multiplier (existing logic)
const effectMultiplier = hasTampered ? CONFIG.verifyTamperPenalty : 1;
applySuspicionChange(state, suspicionDrop * effectMultiplier,
  doubt ? 'VERIFY_SUCCESS' : 'VERIFY_IDLE', verifyDetail);
```

**Do NOT replace the entire VERIFY handler.** This is a targeted modification to the existing proposal-based flow.

**Doubt decay:**
In tick loop, clean doubts older than 100 ticks:
```typescript
state.perception.activeDoubts = state.perception.activeDoubts.filter(
  d => d.resolved || (state.truth.tick - d.createdTick) < 100
);
```

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
