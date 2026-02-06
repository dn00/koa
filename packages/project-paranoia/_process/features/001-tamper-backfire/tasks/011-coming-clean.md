# Task 011: Coming Clean (UNSUPPRESS/ALERT)

**Status:** backlog
**Complexity:** S
**Depends On:** 005
**Implements:** R8.1, R8.2, R8.3

---

## Objective

Add UNSUPPRESS/ALERT command that lets the player "come clean" about a suppression for a reduced suspicion penalty vs getting caught.

---

## Context

### Relevant Files
- `src/kernel/commands.ts` — add new command type and handler
- `src/index.ts` — add CLI parsing for `alert [system]`
- `src/kernel/types.ts` — command type union (may need new entry)
- `TAMPER_BACKFIRE_DESIGN.md` Section 2 — "Coming Clean" mechanic

### Embedded Context

**New command:**
```typescript
| { type: 'ALERT'; system: string }   // "Come clean" about a suppression
```

**Logic:**
```typescript
function handleAlert(state: KernelState, system: string): void {
  const op = state.perception.tamperOps.find(
    o => o.kind === 'SUPPRESS' && o.target.system === system && o.status === 'PENDING'
  );
  if (!op) return;  // No active suppression for this system

  const ticksSince = state.truth.tick - op.tick;
  op.status = 'CONFESSED';
  op.confessedTick = state.truth.tick;

  // Remove the suppression itself
  delete state.perception.tamper.suppressed[system];

  if (ticksSince <= CONFIG.alertEarlyWindow) {
    // Early confession: tiny penalty
    applySuspicionChange(state, CONFIG.alertEarlySuspicion, 'EARLY_CONFESSION',
      `Quick alert for ${system} — suppression lasted ${ticksSince} ticks`);
  } else {
    // Late confession: moderate penalty
    applySuspicionChange(state, CONFIG.alertLateSuspicion, 'LATE_CONFESSION',
      `Admitted hiding ${system} alert after ${ticksSince} ticks`);
  }
}
```

**Config additions:**
```typescript
alertEarlyWindow: num('PARANOIA_ALERT_EARLY_WINDOW', 15),
alertEarlySuspicion: num('PARANOIA_ALERT_EARLY_SUSPICION', 2),
alertLateSuspicion: num('PARANOIA_ALERT_LATE_SUSPICION', 6),
```

**Penalty comparison:**
- Come clean early (≤15 ticks): +2 suspicion
- Come clean late (>15 ticks): +6 suspicion
- Get caught by backfire: +10 to +18 suspicion

---

## Acceptance Criteria

### AC-1: Command exists ← R8.1
- **Given:** Player types `alert thermal`
- **When:** Command parsed
- **Then:** ALERT command with system='thermal' queued

### AC-2: Early confession ← R8.2
- **Given:** SUPPRESS op created 10 ticks ago for 'thermal'
- **When:** Player runs `alert thermal`
- **Then:** Op status = 'CONFESSED', +2 suspicion, suppression removed

### AC-3: Late confession ← R8.3
- **Given:** SUPPRESS op created 20 ticks ago for 'thermal'
- **When:** Player runs `alert thermal`
- **Then:** Op status = 'CONFESSED', +6 suspicion, suppression removed

### AC-4: No active suppression
- **Given:** No PENDING SUPPRESS op for 'thermal'
- **When:** Player runs `alert thermal`
- **Then:** No effect, message: "No active suppression for thermal"

---

## Edge Cases

### EC-1: Suppression already backfired
- **Scenario:** Player tries to come clean after backfire already triggered
- **Expected:** No matching PENDING op found — no effect

### EC-2: Multiple suppressions for same system
- **Scenario:** Player suppressed thermal twice
- **Expected:** Confesses the first (oldest) PENDING one

---

## Scope

**In Scope:**
- ALERT command type
- CLI parsing for `alert [system]`
- Coming clean logic with early/late penalty
- Config parameters
- Help text update

**Out of Scope:**
- Coming clean for SPOOF or FABRICATE (only SUPPRESS for now — SPOOF/FABRICATE lies are harder to retract)

---

## Log

### Planning Notes
**Context:** This is the "honest end of the choice spectrum" for suppressions. It creates a genuine decision: suppress a crisis, then decide whether to come clean before getting caught. The window mechanic (≤15 ticks = early, >15 = late) creates time pressure.
