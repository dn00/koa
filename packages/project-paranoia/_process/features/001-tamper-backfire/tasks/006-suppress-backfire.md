# Task 006: SUPPRESS Backfire

**Status:** done
**Complexity:** M
**Depends On:** 005, 009
**Implements:** R3.1, R3.2, R3.3, R3.4

---

## Objective

Implement backfire logic for SUPPRESS operations: when crew experiences a crisis matching a suppressed system, the suppression is discovered and suspicion spikes.

---

## Context

### Relevant Files
- `src/kernel/systems/backfire.ts` — new file for all backfire logic
- `src/kernel/systems/beliefs.ts` — `applySuspicionChange` (extracted in task 002)
- `src/kernel/kernel.ts` — call backfire checks in tick loop
- `src/config.ts` — backfire tuning parameters
- `TAMPER_BACKFIRE_DESIGN.md` Section 2 — full pseudocode

### Embedded Context

**Backfire trigger conditions:**
A pending SUPPRESS op for system X backfires when any living crew member is in a room where:
- system='thermal' AND room.onFire=true
- system='air' AND room.o2Level < 30
- system='radiation' AND room.radiation > 8
- system='power' AND station.power < 40

**Suspicion spike formula:**
```
base = 10
+ severity * 2          (severity 1-3, so +2 to +6)
+ 2 if anyone injured during suppression window
+ 4 if anyone died during suppression window
cap at 18
```

**Config additions:**
```typescript
suppressBackfireBase: num('PARANOIA_SUPPRESS_BACKFIRE_BASE', 10),
suppressBackfireSeverityMult: num('PARANOIA_SUPPRESS_BACKFIRE_SEVERITY', 2),
suppressBackfireInjuryBonus: num('PARANOIA_SUPPRESS_BACKFIRE_INJURY', 2),
suppressBackfireDeathBonus: num('PARANOIA_SUPPRESS_BACKFIRE_DEATH', 4),
suppressBackfireCap: num('PARANOIA_SUPPRESS_BACKFIRE_CAP', 18),
```

**Key invariant:** I15 (betrayal > incompetence) — the spike must be larger than the +5 for crisis witnessed. I8 (deterministic).

---

## Acceptance Criteria

### AC-1: Backfire check runs each tick ← R3.1
- **Given:** stepKernel tick loop
- **When:** Tick advances
- **Then:** `checkSuppressBackfire(state)` is called

**stepKernel insertion point** (kernel.ts, after existing tick functions ~line 500):
```typescript
// Existing:
tickSystems(state);
tickPassiveObservation(state);
decayTamper(state);

// NEW (add after decayTamper, before proposal generation):
checkSuppressBackfire(state);   // Task 006
checkSpoofBackfire(state);      // Task 007
checkFabricateBackfire(state);  // Task 008
cleanupTamperOps(state);        // Task 005
decayDoubts(state);             // Task 010
```
Run backfire checks early so consequences (suspicion spike) influence that tick's crew behavior.

### AC-2: Backfire on crew witnessing suppressed crisis ← R3.2
- **Given:** SUPPRESS op for 'thermal' is PENDING, crew member is in room with onFire=true
- **When:** Backfire check runs
- **Then:** Op status set to 'BACKFIRED', backfireTick set, suspicion spikes

### AC-3: Spike formula correct ← R3.3
- **Given:** SUPPRESS op with severity=3, no injuries/deaths
- **When:** Backfire triggers
- **Then:** Suspicion spike = 10 + (3*2) = +16

### AC-4: Spike with casualties ← R3.3
- **Given:** SUPPRESS op with severity=2, 1 injury during window
- **When:** Backfire triggers
- **Then:** Suspicion spike = 10 + (2*2) + 2 = +16

### AC-5: Spike capped ← R3.3
- **Given:** SUPPRESS op with severity=3, injuries and death
- **When:** Backfire triggers
- **Then:** Suspicion spike = min(10 + 6 + 2 + 4, 18) = +18

### AC-6: Status transition ← R3.4
- **Given:** PENDING SUPPRESS op that backfires
- **When:** Backfire triggers
- **Then:** op.status = 'BACKFIRED', op.backfireTick = current tick

---

## Edge Cases

### EC-1: Multiple crew in crisis room
- **Scenario:** 3 crew members in burning room matching suppressed thermal
- **Expected:** Single backfire (not 3x). All 3 added to crewAffected.

### EC-2: Suppression expired naturally
- **Scenario:** Suppression duration ends, crisis resolves before crew sees it
- **Expected:** Op status → 'RESOLVED' (no backfire)

### EC-3: Crisis resolves before crew enters
- **Scenario:** Fire in room, crew never enters, fire goes out
- **Expected:** No backfire — crew never experienced the contradiction

---

## Error Cases

### ERR-1: No matching room state
- **When:** Suppressed system doesn't map to a room condition
- **Then:** Skip — only check known system-to-condition mappings

---

## Scope

**In Scope:**
- `checkSuppressBackfire` function in `systems/backfire.ts`
- Spike calculation with formula
- Config parameters
- Ledger entry on backfire (via applySuspicionChange)

**Important:** Do NOT call a separate `addToSuspicionLedger` function. After task 009, `applySuspicionChange` automatically writes ledger entries. Just call `applySuspicionChange` with reason + detail — the ledger is handled.

**Out of Scope:**
- SPOOF/FABRICATE backfire (tasks 007, 008)
- ActiveDoubt creation (task 010)
- Coming clean (task 011)

---

## Testing

Create `src/__tests__/backfire.test.ts` for backfire logic tests. Focus on:
- Backfire trigger conditions (crew in crisis room)
- Spike formula calculation
- Status transitions (PENDING → BACKFIRED)
- Edge cases (multiple crew, suppression expired)

Check existing test patterns:
```bash
ls packages/project-paranoia/src/__tests__/
```

---

## Log

### Planning Notes
**Context:** SUPPRESS backfire is the simplest of the three — direct physical contradiction. Good to implement first as the pattern for SPOOF and FABRICATE.

### Implementation Notes
**Files created:** `src/kernel/systems/backfire.ts`, `tests/006-suppress-backfire.test.ts`
**Files modified:** `src/kernel/kernel.ts` (wired into tick loop), `src/config.ts` (config values pre-existed from planning)
**Tests:** 10 test blocks (6 AC + 3 EC + 1 ERR), 13 individual tests
