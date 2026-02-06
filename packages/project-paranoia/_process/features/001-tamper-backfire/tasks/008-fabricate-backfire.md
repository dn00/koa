# Task 008: FABRICATE Backfire

**Status:** backlog
**Complexity:** M
**Depends On:** 005, 009
**Implements:** R5.1, R5.2, R5.3, R5.4

---

## Objective

Implement backfire logic for FABRICATE operations: frame job exposed when target has an alibi (witnessed working normally) or cleared by investigation.

---

## Context

### Relevant Files
- `src/kernel/systems/backfire.ts` — add FABRICATE backfire
- `src/kernel/systems/beliefs.ts` — applySuspicionChange
- `src/kernel/systems/comms.ts` — crew investigation system (already checks evidence)
- `TAMPER_BACKFIRE_DESIGN.md` Section 4 — full pseudocode

### Embedded Context

**Alibi check (primary backfire trigger):**
Target has alibi if ALL of:
1. Target was sighted (lastCrewSighting) after the fabrication tick
2. Target was in a safe room (mines, engineering, or any work room)
3. Another crew member was in the same room (witness)

```typescript
function checkTargetHasAlibi(state: KernelState, target: NPCId, since: number): boolean {
  const sighting = state.perception.observation.lastCrewSighting[target];
  if (!sighting) return false;
  const seenRecently = sighting.tick > since;
  const seenWorking = sighting.place === 'mines' || sighting.place === 'engineering';
  const otherCrewPresent = Object.values(state.truth.crew).some(
    c => c.alive && c.id !== target && c.place === sighting.place
  );
  return seenRecently && seenWorking && otherCrewPresent;
}
```

Note: The design doc also shows `clearedByInvestigation` and `socialContradiction` paths. These are **deferred** — they require comms.ts changes to write back into TamperOps, which is out of scope. For now, FABRICATE backfire relies solely on alibi check + window expiry. Investigation-clear can be added as a follow-up.

**Backfire spike formula:**
```
base = 12
+ severity * 2          (FABRICATE severity always 3, so +6)
+ 3 if target was injured due to fabrication
+ 3 if target was confined/isolated due to fabrication
+ 6 if target was attacked by another crew due to fabrication
cap at 22
```

**Target belief impact:**
```typescript
targetBelief.motherReliable -= 0.3;           // massive trust loss
targetBelief.tamperEvidence += 20;             // huge evidence spike
```

**Config additions:**
```typescript
fabricateBackfireBase: num('PARANOIA_FABRICATE_BACKFIRE_BASE', 12),
fabricateBackfireSeverityMult: num('PARANOIA_FABRICATE_BACKFIRE_SEVERITY', 2),
fabricateBackfireInjuryBonus: num('PARANOIA_FABRICATE_BACKFIRE_INJURY', 3),
fabricateBackfireConfinedBonus: num('PARANOIA_FABRICATE_BACKFIRE_CONFINED', 3),
fabricateBackfireAttackedBonus: num('PARANOIA_FABRICATE_BACKFIRE_ATTACKED', 6),
fabricateBackfireCap: num('PARANOIA_FABRICATE_BACKFIRE_CAP', 22),
fabricateBackfireTrustDrop: num('PARANOIA_FABRICATE_BACKFIRE_TRUST', 0.3),
fabricateBackfireEvidenceGain: num('PARANOIA_FABRICATE_BACKFIRE_EVIDENCE', 20),
```

---

## Acceptance Criteria

### AC-1: Backfire check runs ← R5.1
- **Given:** PENDING FABRICATE op in tamperOps
- **When:** Tick advances
- **Then:** `checkFabricateBackfire` evaluates the op

### AC-2: Alibi detection ← R5.2
- **Given:** FABRICATE against engineer, engineer seen in mines with specialist present, after fabrication tick
- **When:** Backfire check runs
- **Then:** Alibi detected, backfire triggered

### AC-3: No alibi = no backfire (yet) ← R5.2
- **Given:** FABRICATE against engineer, engineer alone or not recently sighted
- **When:** Backfire check runs
- **Then:** Op stays PENDING (may still be caught by investigation)

### AC-4: Spike formula ← R5.3
- **Given:** FABRICATE backfire, severity=3, no harm to target
- **When:** Backfire triggers
- **Then:** Spike = 12 + 6 = +18

### AC-5: Target trust destroyed ← R5.4
- **Given:** FABRICATE backfire against engineer
- **When:** Backfire triggers
- **Then:** engineer's motherReliable -= 0.3, tamperEvidence += 20

---

## Edge Cases

### EC-1: Target is dead
- **Scenario:** Fabricated against someone who died before alibi could surface
- **Expected:** Op status → 'RESOLVED' (can't disprove, but also moot)

### EC-2: Investigation clears target before alibi
- **Scenario:** Crew investigation at bridge/core finds fabrication evidence before alibi surfaces
- **Expected:** Also triggers backfire (cleared by investigation path)

### EC-3: Window expires without alibi or investigation
- **Scenario:** 60 ticks pass, no one witnessed target working, no investigation
- **Expected:** Op status → 'RESOLVED' (got away with it — this time)

---

## Scope

**In Scope:**
- `checkFabricateBackfire` function
- Alibi checking logic
- Spike formula with harm bonuses
- Target belief impact
- Config parameters

**Important:** Do NOT call a separate `addToSuspicionLedger` function. After task 009, `applySuspicionChange` automatically writes ledger entries. Just call `applySuspicionChange` with reason + detail — the ledger is handled.

**Out of Scope:**
- Investigation-clear path (comms.ts writing back into TamperOps) — deferred
- Social contradiction path (witness testimony) — deferred
- Confrontation events (DIRECTOR_PRESSURE_MIX feature)

---

## Log

### Planning Notes
**Context:** FABRICATE is the highest-stakes tamper (severity always 3, cap at +22). The alibi system is the novel mechanic — it uses existing passive observation data (lastCrewSighting) to determine if the lie is plausible.
