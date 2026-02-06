# Task 007: SPOOF Backfire

**Status:** backlog
**Complexity:** M
**Depends On:** 005, 009
**Implements:** R4.1, R4.2, R4.3, R4.4

---

## Objective

Implement backfire logic for SPOOF operations: false alarms exposed when window expires with no matching real crisis. Escalating "cry wolf" penalty.

---

## Context

### Relevant Files
- `src/kernel/systems/backfire.ts` — add SPOOF backfire alongside SUPPRESS
- `src/kernel/systems/beliefs.ts` — applySuspicionChange
- `TAMPER_BACKFIRE_DESIGN.md` Section 3 — full pseudocode

### Embedded Context

**Backfire trigger:**
When `state.truth.tick >= op.windowEndTick`:
1. Check if any real crisis arc matches the spoofed system AND escalated (stepIndex > 0)
2. If NO real crisis AND crewAffected.length > 0 → backfire
3. If real crisis occurred → op.status = 'RESOLVED' (got lucky)
4. If nobody responded → op.status = 'RESOLVED' (nobody cared)

**System-to-ArcKind mapping** (required — `.includes()` fails for thermal/fire):
```typescript
const SYSTEM_TO_ARC_KINDS: Record<string, ArcKind[]> = {
  thermal: ['fire_outbreak'],
  air: ['air_scrubber'],
  power: ['power_surge'],
  radiation: ['radiation_leak', 'solar_flare'],
};
// Usage: check if any active arc's kind is in SYSTEM_TO_ARC_KINDS[op.target.system]
```

**Tracking crew who responded:**
Inline in `checkSpoofBackfire`, each tick while op is PENDING (before the window-expiry check): check if any living crew's current `place` is associated with the spoofed system. If yes, add to `crewAffected`.

```typescript
// Per-tick crew response tracking (inside checkSpoofBackfire loop, before window check):
for (const npc of Object.values(state.truth.crew)) {
  if (!npc.alive || op.crewAffected.includes(npc.id)) continue;
  const room = state.truth.rooms[npc.place];
  // Crew "responded" if they're in a room affected by the spoofed system type
  const inAffectedRoom =
    (system === 'thermal' && room.onFire) ||
    (system === 'air' && room.o2Level < 50) ||
    (system === 'power' && npc.place === 'engineering') ||
    (system === 'radiation' && room.radiation > 3);
  if (inAffectedRoom) op.crewAffected.push(npc.id);
}
```

**Cry-wolf escalation:**
```
falseAlarmsToday = count SPOOF ops with status='BACKFIRED' and backfireTick within last 240 ticks
  0 previous: +6
  1 previous: +9
  2+ previous: +12
```

**Trust impact on responders:**
For each NPC in crewAffected, reduce trust in MOTHER via existing `motherReliable`:
```typescript
for (const npcId of op.crewAffected) {
  const belief = state.perception.beliefs[npcId];
  if (belief) {
    belief.motherReliable = Math.max(0, belief.motherReliable - 0.04);
  }
}
```
Note: `crewGrudge` is `Record<NPCId, number>` — 'MOTHER' is not a valid key. Use `motherReliable` reduction instead.

**Config additions:**
```typescript
spoofBackfireCryWolf1: num('PARANOIA_SPOOF_CRY_WOLF_1', 6),
spoofBackfireCryWolf2: num('PARANOIA_SPOOF_CRY_WOLF_2', 9),
spoofBackfireCryWolf3: num('PARANOIA_SPOOF_CRY_WOLF_3', 12),
```

---

## Acceptance Criteria

### AC-1: Check on window expiry ← R4.1
- **Given:** SPOOF op with windowEndTick = tick 100
- **When:** Tick reaches 100
- **Then:** `checkSpoofBackfire` evaluates this op

### AC-2: Backfire when no real crisis ← R4.2
- **Given:** SPOOF for 'air', no air_scrubber arc active, crew responded (crewAffected > 0)
- **When:** Window expires
- **Then:** Op status = 'BACKFIRED', suspicion spike applied

### AC-3: No backfire when real crisis occurred ← R4.2
- **Given:** SPOOF for 'air', air_scrubber arc actually activated during window
- **When:** Window expires
- **Then:** Op status = 'RESOLVED' (lie happened to be true)

### AC-4: Cry-wolf escalation ← R4.3
- **Given:** Second SPOOF backfire today
- **When:** Backfire triggers
- **Then:** Suspicion spike = +9 (not +6)

### AC-5: Trust impact on responders ← R4.4
- **Given:** Engineer and Specialist responded to spoof
- **When:** Backfire triggers
- **Then:** Both lose motherReliable (-0.04 each)

---

## Edge Cases

### EC-1: Nobody responded to spoof
- **Scenario:** Spoof created but crew didn't react (too far away, busy)
- **Expected:** Op status → 'RESOLVED' (no audience = no backfire)

### EC-2: Spoof system doesn't map to arc kind
- **Scenario:** Spoof for 'comms' — no matching crisis arc
- **Expected:** Always backfires if crew responded (no way for truth to save you)

---

## Scope

**In Scope:**
- `checkSpoofBackfire` function
- Cry-wolf escalation logic
- Crew response tracking (simplified)
- Config parameters

**Important:** Do NOT call a separate `addToSuspicionLedger` function. After task 009, `applySuspicionChange` automatically writes ledger entries. Just call `applySuspicionChange` with reason + detail — the ledger is handled.

**Out of Scope:**
- Misdirection consequence (crew harmed while responding to spoof) — deferred per discovery

---

## Log

### Planning Notes
**Context:** SPOOF backfire is time-delayed (window expiry) vs SUPPRESS (immediate contradiction). The cry-wolf mechanic makes repeated spoofing increasingly dangerous.
