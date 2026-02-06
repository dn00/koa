# Task 005: TamperOp Creation on Tamper Commands

**Status:** done
**Complexity:** S
**Depends On:** 004
**Implements:** R2.3, R2.4, R2.5

---

## Objective

Wire SUPPRESS, SPOOF, and FABRICATE commands to create TamperOp entries in `perception.tamperOps[]` when executed.

---

## Context

### Relevant Files
- `src/kernel/commands.ts` — SPOOF/SUPPRESS/FABRICATE handlers (lines 99-149)
- `src/kernel/kernel.ts` — `applyEvent` cases for TAMPER_SPOOF, TAMPER_SUPPRESS, TAMPER_FABRICATE
- `src/kernel/types.ts` — TamperOp type (from task 004)
- `src/config.ts` — add window durations for each op kind

### Embedded Context

TamperOps should be created in `applyEvent` when the tamper event is committed (not in command proposal — the op is created when the action happens, not when proposed).

```typescript
// In applyEvent, TAMPER_SUPPRESS case:
const op: TamperOp = {
  id: `suppress-${state.truth.tick}-${system}`,
  kind: 'SUPPRESS',
  tick: state.truth.tick,
  target: { system },
  windowEndTick: state.truth.tick + duration,
  status: 'PENDING',
  severity: getSeverityForSystem(system),  // thermal=3, air=2, power=2, radiation=2
  crewAffected: [],
};
state.perception.tamperOps.push(op);
```

**Severity mapping:**
- thermal/fire: 3 (high — fire kills)
- air/o2: 2
- power: 2
- radiation: 2
- comms: 1

**Window durations:**
- SUPPRESS: suppression duration (already in command data)
- SPOOF: 30 ticks (time for real crisis to materialize or not)
- FABRICATE: 60 ticks (time for alibi to emerge)

**Config additions:**
```typescript
spoofBackfireWindow: num('PARANOIA_SPOOF_BACKFIRE_WINDOW', 30),
fabricateBackfireWindow: num('PARANOIA_FABRICATE_BACKFIRE_WINDOW', 60),
```

---

## Acceptance Criteria

### AC-1: SUPPRESS creates TamperOp ← R2.3
- **Given:** Player runs `suppress thermal`
- **When:** TAMPER_SUPPRESS event applied
- **Then:** TamperOp with kind='SUPPRESS', target.system='thermal', severity=3, status='PENDING' exists in perception.tamperOps

### AC-2: SPOOF creates TamperOp ← R2.4
- **Given:** Player runs `spoof air`
- **When:** TAMPER_SPOOF event applied
- **Then:** TamperOp with kind='SPOOF', target.system='air', windowEndTick=tick+30 exists

### AC-3: FABRICATE creates TamperOp ← R2.5
- **Given:** Player runs `fabricate engineer`
- **When:** TAMPER_FABRICATE event applied
- **Then:** TamperOp with kind='FABRICATE', target.npc='engineer', severity=3, crewAffected=[] exists (crewAffected populated as crew react to fabrication)

---

## Edge Cases

### EC-1: Multiple tamper ops for same system
- **Scenario:** Player suppresses thermal twice
- **Expected:** Two separate TamperOps created (both can independently backfire)

### EC-2: TamperOp array cleanup
- **Scenario:** Many ops accumulate over game
- **Expected:** Clean ops with status !== 'PENDING' older than 240 ticks (1 day)
- **Location:** Add `cleanupTamperOps(state)` function to `systems/backfire.ts`, called from `stepKernel` after backfire checks:
```typescript
export function cleanupTamperOps(state: KernelState): void {
  const cutoff = state.truth.tick - 240;
  state.perception.tamperOps = state.perception.tamperOps.filter(
    op => op.status === 'PENDING' || op.tick > cutoff
  );
}
```

---

## Scope

**In Scope:**
- TamperOp creation in applyEvent for all three tamper types
- Severity mapping function
- Config additions for window durations
- Array cleanup

**Out of Scope:**
- Backfire checking (tasks 006-008)
- Suspicion ledger (task 009)

---

## Log

### Planning Notes
**Context:** This is the bridge between existing tamper commands and the new backfire system. Creates the data that backfire tasks consume.

### Implementation Notes
**Files changed:**
- `src/kernel/kernel.ts` — Added TamperOp creation in `applyEvent` for TAMPER_SUPPRESS, TAMPER_SPOOF, TAMPER_FABRICATE cases; added `getSeverityForSystem()` helper; added `cleanupTamperOps()` function
- `src/kernel/commands.ts` — Added `system` field to TAMPER_SPOOF event data
- `src/config.ts` — Added `spoofBackfireWindow` (30) and `fabricateBackfireWindow` (60)

**Tests:** 3 AC + 2 EC = 5 test blocks in `tests/tamperOp-creation.test.ts`. Task has 5 requirements. Test file has 5 test blocks. ✓
