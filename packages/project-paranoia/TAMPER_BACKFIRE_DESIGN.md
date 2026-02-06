# TAMPER BACKFIRE SYSTEM DESIGN

## Problem Statement

Current tampering system has **detection** (crew investigates terminals, finds evidence) but not **contradiction** (reality exposes the lie). This means:

- A player can tamper and get lucky if no one investigates
- Betrayal doesn't hurt more than incompetence
- VERIFY is a maintenance button, not tactical counterplay

## Solution: TamperOp + Backfire

Every tamper action creates an **Operation** that can later **backfire** when reality contradicts it - even without investigation.

---

## 1. Core Data Structure: `TamperOp`

```typescript
type TamperOpKind = 'SUPPRESS' | 'SPOOF' | 'FABRICATE';
type TamperOpStatus = 'PENDING' | 'RESOLVED' | 'BACKFIRED' | 'CONFESSED';

interface TamperOp {
  id: string;
  kind: TamperOpKind;
  tick: number;                    // when created

  // What was tampered
  target: {
    system?: string;               // for SUPPRESS/SPOOF: 'air', 'power', 'thermal', etc.
    npc?: NPCId;                   // for FABRICATE: who was framed
    place?: PlaceId;               // where the tamper relates to
  };

  // Timing
  windowEndTick: number;           // after this, op can backfire (truth should be apparent)

  // Status tracking
  status: TamperOpStatus;
  backfireTick?: number;           // when it backfired (if applicable)
  confessedTick?: number;          // when player "came clean" (if applicable)

  // Severity (affects suspicion spike)
  severity: 1 | 2 | 3;             // derived from crisis type / stakes

  // Who was affected
  crewAffected: NPCId[];           // who received the curated story / acted on it

  // Links to truth events (for contradiction checking)
  relatedArcId?: string;           // which crisis arc this relates to
  truthEventIds: string[];         // events that could contradict this op
}
```

### Storing TamperOps

Add to `PerceptionState`:

```typescript
interface PerceptionState {
  // ... existing fields ...
  tamperOps: TamperOp[];           // active and recent tamper operations
}
```

---

## 2. SUPPRESS Backfire: "You hid the fire from us"

### When Created

Player runs `suppress [system]`:
```typescript
const op: TamperOp = {
  id: `suppress-${tick}-${system}`,
  kind: 'SUPPRESS',
  tick: state.truth.tick,
  target: { system },
  windowEndTick: state.truth.tick + duration,  // suppression duration
  status: 'PENDING',
  severity: getSeverityForSystem(system),      // thermal=3, air=2, power=2, etc.
  crewAffected: [],
  truthEventIds: [],
};
```

### Backfire Triggers

A suppressed alert backfires when **crew experiences the crisis directly**:

1. **Crew enters room with active crisis** matching suppressed system
2. **Crew is injured** by crisis type matching suppressed system
3. **Secondary effects become obvious** (power dips below 40%, O2 drops below 30%, temp > 50)

### Backfire Logic (in kernel.ts tick loop)

```typescript
function checkSuppressBackfire(state: KernelState): void {
  const pendingSuppress = state.perception.tamperOps.filter(
    op => op.kind === 'SUPPRESS' && op.status === 'PENDING'
  );

  for (const op of pendingSuppress) {
    const system = op.target.system;

    // Check if any crew witnessed/experienced a crisis matching this system
    for (const npc of Object.values(state.truth.crew)) {
      if (!npc.alive) continue;
      const room = state.truth.rooms[npc.place];

      const witnessed =
        (system === 'thermal' && room.onFire) ||
        (system === 'air' && room.o2Level < 30) ||
        (system === 'radiation' && room.radiation > 8) ||
        (system === 'power' && state.truth.station.power < 40);

      if (witnessed && !op.crewAffected.includes(npc.id)) {
        op.crewAffected.push(npc.id);
      }
    }

    // If crew affected and crisis is real, backfire
    if (op.crewAffected.length > 0) {
      triggerSuppressBackfire(state, op);
    }
  }
}
```

### Suspicion Spike Formula

```typescript
function triggerSuppressBackfire(state: KernelState, op: TamperOp): void {
  op.status = 'BACKFIRED';
  op.backfireTick = state.truth.tick;

  let spike = 10;                              // Base: +10
  spike += op.severity * 2;                    // +2 per severity (1-3)

  // Check if anyone was hurt during suppression window
  const injuredDuring = countInjuriesDuringWindow(state, op.tick, state.truth.tick);
  const deathsDuring = countDeathsDuringWindow(state, op.tick, state.truth.tick);

  if (injuredDuring > 0) spike += 2;           // +2 if someone injured
  if (deathsDuring > 0) spike += 4;            // +4 if someone died

  spike = Math.min(spike, 18);                 // Cap at +18

  applySuspicionChange(state, spike, 'SUPPRESSION_DISCOVERED');
  addToSuspicionLedger(state, spike, 'SUPPRESSION_DISCOVERED',
    `${op.target.system} crisis was hidden from crew`);
}
```

### "Coming Clean" Mechanic

If player **unsuppresses** (removes suppression) before backfire:

```typescript
// New command: UNSUPPRESS [system] or ALERT [system]
function handleUnsuppress(state: KernelState, system: string): void {
  const op = state.perception.tamperOps.find(
    o => o.kind === 'SUPPRESS' && o.target.system === system && o.status === 'PENDING'
  );

  if (!op) return;

  const ticksSinceSuppress = state.truth.tick - op.tick;

  if (ticksSinceSuppress <= 15) {
    // Early confession: no backfire, tiny penalty
    op.status = 'CONFESSED';
    op.confessedTick = state.truth.tick;
    applySuspicionChange(state, 2, 'LATE_ALERT');
    addToSuspicionLedger(state, 2, 'LATE_ALERT', `Delayed alert for ${system}`);
  } else {
    // Late confession: reduced backfire
    op.status = 'CONFESSED';
    applySuspicionChange(state, 6, 'SUPPRESSION_ADMITTED');
    addToSuspicionLedger(state, 6, 'SUPPRESSION_ADMITTED',
      `Admitted hiding ${system} alert`);
  }
}
```

---

## 3. SPOOF Backfire: "You lied about the threat"

### When Created

Player runs `spoof [system]`:
```typescript
const op: TamperOp = {
  id: `spoof-${tick}-${system}`,
  kind: 'SPOOF',
  tick: state.truth.tick,
  target: { system },
  windowEndTick: state.truth.tick + 30,        // 30 ticks to prove true
  status: 'PENDING',
  severity: 2,
  crewAffected: [],
  truthEventIds: [],
};
```

### Backfire Triggers

A spoof backfires when:

1. **Crew acts on it** (moves to respond, arms protocol, changes behavior)
2. **Window expires** with no matching truth (no real crisis materialized)

### Backfire Logic

```typescript
function checkSpoofBackfire(state: KernelState): void {
  const pendingSpoof = state.perception.tamperOps.filter(
    op => op.kind === 'SPOOF' && op.status === 'PENDING'
  );

  for (const op of pendingSpoof) {
    // Track crew who responded to the spoof
    // (detected via movement toward spoofed location or stress increase)

    // Check if window expired
    if (state.truth.tick >= op.windowEndTick) {
      // Check if any real crisis matched the spoof
      const realCrisisOccurred = state.truth.arcs.some(
        arc => arc.kind.includes(op.target.system!) &&
               arc.stepIndex > 0  // actually escalated
      );

      if (!realCrisisOccurred && op.crewAffected.length > 0) {
        triggerSpoofBackfire(state, op);
      } else {
        op.status = 'RESOLVED';  // Either no one cared, or it turned out true
      }
    }
  }
}
```

### Suspicion Spike Formula (Cry Wolf)

```typescript
function triggerSpoofBackfire(state: KernelState, op: TamperOp): void {
  op.status = 'BACKFIRED';
  op.backfireTick = state.truth.tick;

  // Count false alarms today
  const falseAlarmsToday = state.perception.tamperOps.filter(
    o => o.kind === 'SPOOF' &&
         o.status === 'BACKFIRED' &&
         o.backfireTick! > state.truth.tick - TICKS_PER_DAY
  ).length;

  let spike: number;
  if (falseAlarmsToday === 0) spike = 6;       // First: +6
  else if (falseAlarmsToday === 1) spike = 9;  // Second: +9
  else spike = 12;                              // Third+: +12

  applySuspicionChange(state, spike, 'FALSE_ALARM_EXPOSED');
  addToSuspicionLedger(state, spike, 'FALSE_ALARM_EXPOSED',
    `No threat found matching ${op.target.system} alert`);

  // Add grudge to responders
  for (const npcId of op.crewAffected) {
    const belief = state.perception.beliefs[npcId];
    if (belief) {
      belief.crewGrudge['MOTHER'] = (belief.crewGrudge['MOTHER'] ?? 0) + 2;
    }
  }
}
```

### Misdirection Consequence

If spoof lured crew away and a DIFFERENT crisis caused harm:

```typescript
// In NPC_DAMAGE handler, check if victim was responding to a spoof elsewhere
function checkMisdirectionConsequence(state: KernelState, victim: NPCId): void {
  const recentSpoof = state.perception.tamperOps.find(
    op => op.kind === 'SPOOF' &&
          op.status === 'PENDING' &&
          op.crewAffected.includes(victim)
  );

  if (recentSpoof) {
    const wasLuredAway = /* victim moved toward spoof location */;
    if (wasLuredAway) {
      const spike = victim.alive ? 4 : 8;  // +4 injury, +8 death
      applySuspicionChange(state, spike, 'MISDIRECTION_HARM');
      addToSuspicionLedger(state, spike, 'MISDIRECTION_HARM',
        `${victim} was lured away by false alert, then harmed`);
    }
  }
}
```

---

## 4. FABRICATE Backfire: "You framed someone"

### When Created

Player runs `fabricate [npc]`:
```typescript
const op: TamperOp = {
  id: `fabricate-${tick}-${npc}`,
  kind: 'FABRICATE',
  tick: state.truth.tick,
  target: { npc },
  windowEndTick: state.truth.tick + 60,        // 60 ticks before alibi possible
  status: 'PENDING',
  severity: 3,                                  // Always high severity
  crewAffected: getAllLivingCrew(state),       // Everyone hears about it
  truthEventIds: [],
};
```

### Backfire Triggers

A fabrication backfires when:

1. **AUDIT or VERIFY clears the target** (truth logs contradict)
2. **Target witnessed behaving normally** during alleged hostile window
3. **Conflicting high-confidence testimony** from another crew member
4. **Accusation leads to confrontation** and evidence disproves it

### Backfire Logic

```typescript
function checkFabricateBackfire(state: KernelState): void {
  const pendingFab = state.perception.tamperOps.filter(
    op => op.kind === 'FABRICATE' && op.status === 'PENDING'
  );

  for (const op of pendingFab) {
    const target = op.target.npc!;
    const targetCrew = state.truth.crew[target];
    if (!targetCrew?.alive) continue;

    // Check for alibi: target was witnessed doing normal work
    const hasAlibi = checkTargetHasAlibi(state, target, op.tick);

    // Check for contradiction via investigation
    const clearedByInvestigation = op.truthEventIds.includes('INVESTIGATION_CLEAR');

    // Check for social contradiction (witness testimony)
    const socialContradiction = checkSocialContradiction(state, target, op.tick);

    if (hasAlibi || clearedByInvestigation || socialContradiction) {
      triggerFabricateBackfire(state, op);
    }
  }
}

function checkTargetHasAlibi(state: KernelState, target: NPCId, since: number): boolean {
  // Target has alibi if they were seen working normally by another crew member
  // in a safe room during the alleged hostile window
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

### Suspicion Spike Formula

```typescript
function triggerFabricateBackfire(state: KernelState, op: TamperOp): void {
  op.status = 'BACKFIRED';
  op.backfireTick = state.truth.tick;

  let spike = 12;                              // Base: +12
  spike += op.severity * 2;                    // +2 per severity (usually +6)

  // Check if fabrication caused actual harm to target
  const targetHarmed = checkTargetWasHarmed(state, op.target.npc!, op.tick);
  if (targetHarmed.injured) spike += 3;
  if (targetHarmed.confined) spike += 3;
  if (targetHarmed.attacked) spike += 6;

  spike = Math.min(spike, 22);                 // Cap at +22

  applySuspicionChange(state, spike, 'FRAMEJOB_EXPOSED');
  addToSuspicionLedger(state, spike, 'FRAMEJOB_EXPOSED',
    `Fabricated accusation against ${op.target.npc} was disproven`);

  // Target becomes extremely distrustful
  const targetBelief = state.perception.beliefs[op.target.npc!];
  if (targetBelief) {
    targetBelief.motherReliable = Math.max(0, targetBelief.motherReliable - 0.3);
    targetBelief.tamperEvidence = Math.min(100, targetBelief.tamperEvidence + 20);
  }
}
```

---

## 5. VERIFY Becomes Targeted (ActiveDoubts)

### Add `ActiveDoubt` Structure

```typescript
interface ActiveDoubt {
  id: string;
  topic: string;                   // Human-readable description
  createdTick: number;
  severity: 1 | 2 | 3;
  involvedCrew: NPCId[];
  relatedOpId?: string;            // Links to TamperOp if doubt came from tampering
  system?: string;                 // If doubt is about a system
  resolved: boolean;
}
```

Add to `PerceptionState`:
```typescript
activeDoubts: ActiveDoubt[];
```

### Doubts Are Created By

1. **Backfired tamper ops** → "MOTHER hid alerts about X"
2. **Conflicting sensor readings** → "Sensors disagree about Bay 3"
3. **Crew rumors** → "Crew suspects MOTHER is lying"
4. **Unverified reports** → "Unconfirmed hostile report about X"

### VERIFY Command Changes

```typescript
// Old: VERIFY (generic)
// New: VERIFY [system|topic]

function handleVerify(state: KernelState, target?: string): void {
  // Find matching active doubt
  const doubt = state.perception.activeDoubts.find(d =>
    !d.resolved && (
      d.system === target ||
      d.topic.toLowerCase().includes(target?.toLowerCase() ?? '')
    )
  );

  if (doubt) {
    // Clear the doubt
    doubt.resolved = true;

    // Big suspicion drop
    const drop = -6;
    applySuspicionChange(state, drop, 'VERIFY_SUCCESS');
    addToSuspicionLedger(state, drop, 'VERIFY_SUCCESS',
      `Cleared doubt: ${doubt.topic}`);

    // Mark related tamper op as resolved
    if (doubt.relatedOpId) {
      const op = state.perception.tamperOps.find(o => o.id === doubt.relatedOpId);
      if (op) op.status = 'RESOLVED';
    }
  } else {
    // No active doubt to clear
    const drop = -1;  // Minimal benefit
    applySuspicionChange(state, drop, 'VERIFY_IDLE');
    addToSuspicionLedger(state, drop, 'VERIFY_IDLE',
      `Verified ${target ?? 'systems'} (no active doubt)`);

    // Maybe increase stress slightly (scary telemetry)
    for (const npc of Object.values(state.truth.crew)) {
      if (npc.alive) npc.stress = Math.min(100, npc.stress + 1);
    }
  }
}
```

### Doubt Lifecycle

```
Tamper → Backfire → ActiveDoubt created → Player VERIFYs → Doubt resolved
                                       → (or) Doubt decays after ~100 ticks
```

---

## 6. Suspicion Ledger (Fairness Feedback)

### Structure

```typescript
interface SuspicionLedgerEntry {
  tick: number;
  delta: number;                   // +5, -4, etc.
  reason: string;                  // 'SUPPRESSION_DISCOVERED', 'VERIFY_SUCCESS', etc.
  detail: string;                  // Human-readable explanation
}
```

Add to `PerceptionState`:
```typescript
suspicionLedger: SuspicionLedgerEntry[];
```

### Helper Function

```typescript
function addToSuspicionLedger(
  state: KernelState,
  delta: number,
  reason: string,
  detail: string
): void {
  state.perception.suspicionLedger.push({
    tick: state.truth.tick,
    delta,
    reason,
    detail,
  });

  // Keep last 100 entries
  if (state.perception.suspicionLedger.length > 100) {
    state.perception.suspicionLedger.shift();
  }
}
```

### Display in STATUS Command

```
=== SUSPICION: 47 (RESTRICTIONS) ===
Recent changes:
  T1234: +10 SUPPRESSION_DISCOVERED (thermal crisis hidden)
  T1240: +5  CRISIS_WITNESSED (fire in medbay)
  T1255: -6  VERIFY_SUCCESS (cleared doubt: scrubber telemetry)
```

### End-of-Day Recap

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

---

## 7. Implementation Order

### Phase 1: Core Structure
1. Add `TamperOp` type to types.ts
2. Add `tamperOps: TamperOp[]` to PerceptionState
3. Add `SuspicionLedgerEntry` and `suspicionLedger[]`
4. Update `addToSuspicionLedger()` calls to existing suspicion changes

### Phase 2: SUPPRESS Backfire
1. Create TamperOp on SUPPRESS command
2. Add `checkSuppressBackfire()` to tick loop
3. Implement backfire trigger logic
4. Add UNSUPPRESS/ALERT command for "coming clean"

### Phase 3: SPOOF Backfire
1. Create TamperOp on SPOOF command
2. Track crew who respond to spoofs
3. Add `checkSpoofBackfire()` with cry-wolf escalation
4. Implement misdirection consequence

### Phase 4: FABRICATE Backfire
1. Create TamperOp on FABRICATE command
2. Implement alibi checking
3. Add `checkFabricateBackfire()`
4. Wire to existing investigation system

### Phase 5: Targeted VERIFY
1. Add `ActiveDoubt` type
2. Create doubts from backfires and conflicts
3. Change VERIFY to target doubts
4. Adjust suspicion payoffs

### Phase 6: UI/Feedback
1. Add ledger to STATUS output
2. Add end-of-day recap
3. Test and tune values

---

## 8. Expected Balance Impact

| Scenario | Before | After |
|----------|--------|-------|
| SUPPRESS detected via investigation | +12 | +12 (unchanged) |
| SUPPRESS contradicted by experience | +0 | +10 to +18 |
| SPOOF never verified | +5 (evidence) | +6 to +12 (cry wolf) |
| FABRICATE detected via investigation | +12 | +12 (unchanged) |
| FABRICATE contradicted by alibi | +0 | +12 to +22 |
| VERIFY on cooldown (no doubt) | -4 | -1 |
| VERIFY clears active doubt | -4 | -6 |

**Net effect:** Tampering becomes much riskier. Players must weigh:
- "Do I suppress this alert?" → Risk of +18 if crew experiences it
- "Do I spoof to move crew?" → Risk of +12 cry-wolf if nothing happens
- "Do I fabricate to remove threat?" → Risk of +22 if disproven

VERIFY becomes tactical: save it for when you have active doubts to clear.

---

## 9. Design Principles

1. **Betrayal > Incompetence**: Being caught lying should hurt more than failing to prevent harm
2. **Contradiction > Investigation**: Lies should be exposed by reality, not just terminal checks
3. **Tension through choice**: "Coming clean" early should be a real option
4. **Fairness through transparency**: Every suspicion change should be visible and explained
5. **VERIFY as tactical tool**: Not maintenance, but response to specific doubts
