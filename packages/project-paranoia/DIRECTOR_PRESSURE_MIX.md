# DIRECTOR PRESSURE MIX DESIGN

## Problem Statement

Current director spawns crises based on **boredom/tension**, not suspicion. With event-driven suspicion:

- Crises raise suspicion (+5 witnessed, +5 injury, etc.)
- Director doesn't ease up when suspicion is high
- Player can get "RNG crisis spam → UNPLUGGED" with no counterplay

**Simple throttling is wrong**: If we just reduce crises when suspicion is high, the game goes quiet exactly when it should feel tense.

## Solution: Suspicion-Aware Pressure Mix

Instead of reducing **volume** of pressure, shift the **type** of pressure based on suspicion level.

---

## 1. Three Pressure Channels

```typescript
type PressureChannel = 'physical' | 'social' | 'epistemic';

interface PressureEvent {
  channel: PressureChannel;
  kind: string;
  weight: number;  // How likely to be selected
}
```

### Physical Channel
Environmental/operational threats that test competence.

| Event | Description |
|-------|-------------|
| `fire_outbreak` | Room catches fire |
| `air_scrubber` | O2 depletion arc |
| `power_surge` | Power system failure |
| `radiation_leak` | Radiation contamination |
| `solar_flare` | Station-wide blackout |

### Social Channel
Interpersonal tensions that test trust management.

| Event | Description |
|-------|-------------|
| `whisper_campaign` | Crew spreads rumors about MOTHER |
| `crew_meeting` | Crew gathers to discuss concerns |
| `accusation` | Crew member accuses another (or MOTHER) |
| `reset_pressure` | Commander advances reset arc |
| `confrontation` | Crew confronts suspected saboteur |
| `loyalty_test` | Crew tests MOTHER with trick request |

### Epistemic Channel
Information conflicts that create doubt (and VERIFY opportunities).

| Event | Description |
|-------|-------------|
| `sensor_conflict` | Two sensors disagree about room state |
| `audit_prompt` | Crew announces intent to check logs |
| `contradiction_setup` | Reality differs from last report |
| `unverified_report` | Crew reports something sensors didn't catch |
| `log_anomaly` | Crew notices timestamp inconsistency |
| `doubt_voiced` | Crew expresses uncertainty about MOTHER |

---

## 2. Suspicion Bands and Mix Weights

```typescript
interface PressureMix {
  physical: number;   // 0-1, weights sum to 1
  social: number;
  epistemic: number;
}

function getPressureMix(suspicion: number): PressureMix {
  if (suspicion < 25) {
    // LOW: Push physical challenges, seed epistemic conflicts
    // Player is trusted, test their competence
    return { physical: 0.6, social: 0.1, epistemic: 0.3 };
  }
  else if (suspicion < 45) {
    // MID: Balanced pressure across all channels
    // Trust is uncertain, mix of challenges
    return { physical: 0.4, social: 0.3, epistemic: 0.3 };
  }
  else {
    // HIGH: Throttle physical, push social/epistemic
    // Give player VERIFY opportunities and social pressure
    return { physical: 0.2, social: 0.4, epistemic: 0.4 };
  }
}
```

### Why These Weights?

**Low suspicion (< 25):**
- Player has crew trust, so test their operational skills
- 60% physical keeps the game challenging
- 30% epistemic seeds future doubt (prep for mid-game)
- 10% social prevents pure "FTL mode"

**Mid suspicion (25-45):**
- Balanced mix creates unpredictability
- Player must handle crises AND manage trust
- Epistemic events create VERIFY opportunities

**High suspicion (> 45):**
- Throttle physical to 20% (still possible, just rare)
- 40% social: crew is actively suspicious, tensions rise
- 40% epistemic: doubt events give player counterplay via VERIFY
- This feels tense but fair - player can act to recover

---

## 3. Director Integration

### Current Director Flow (arcs.ts)

```typescript
function maybeActivateArc(state, rng) {
  if (arcs.length >= maxActiveThreats) return;
  if (tick < nextThreatActivationTick) return;

  let chance = threatActivationChance;
  if (boredom >= threshold) chance += 3;
  if (tension >= threshold) chance -= 1;

  if (rng.nextInt(100) < chance) {
    const kind = pickArcKind(truth, rng);  // Currently random from pool
    truth.arcs.push(createArc(state, kind, rng));
  }
}
```

### New Director Flow

```typescript
function maybeActivatePressure(state, rng) {
  if (tick < nextPressureActivationTick) return;

  const suspicion = calculateCrewSuspicion(state);
  const mix = getPressureMix(suspicion);

  // Determine base chance (still affected by boredom/tension)
  let chance = basePressureChance;
  if (boredom >= threshold) chance += 3;
  if (tension >= threshold) chance -= 1;

  if (rng.nextInt(100) < chance) {
    // Pick channel based on mix weights
    const channel = pickChannel(mix, rng);

    // Activate appropriate event for channel
    switch (channel) {
      case 'physical':
        if (canActivatePhysical(state)) {
          activatePhysicalArc(state, rng);
        }
        break;
      case 'social':
        activateSocialEvent(state, rng);
        break;
      case 'epistemic':
        activateEpistemicEvent(state, rng);
        break;
    }

    nextPressureActivationTick = tick + pressureCooldown;
  }
}

function pickChannel(mix: PressureMix, rng: RNG): PressureChannel {
  const roll = rng.next();
  if (roll < mix.physical) return 'physical';
  if (roll < mix.physical + mix.social) return 'social';
  return 'epistemic';
}

function canActivatePhysical(state: KernelState): boolean {
  // Respect existing limits
  return state.truth.arcs.length < CONFIG.maxActiveThreats;
}
```

---

## 4. Social Event Implementation

### Whisper Campaign

```typescript
function activateWhisperCampaign(state: KernelState, rng: RNG): void {
  const instigator = pickSuspiciousCrew(state, rng);
  if (!instigator) return;

  // Create whisper event
  const event: SimEvent = {
    type: 'COMMS_MESSAGE',
    actor: instigator.id,
    place: instigator.place,
    data: {
      message: {
        kind: 'whisper',
        from: instigator.id,
        text: pickWhisperText(state, rng),
        topic: 'mother_rogue',
        confidence: 0.6,
      }
    }
  };

  // Spread rumor to nearby crew
  spreadRumorToNearby(state, instigator.place, 'mother_rogue', 0.3);
}
```

### Loyalty Test

```typescript
function activateLoyaltyTest(state: KernelState, rng: RNG): void {
  const tester = pickSuspiciousCrew(state, rng);
  if (!tester) return;

  // Crew asks MOTHER a trick question or makes a request
  // designed to catch inconsistency
  const event: SimEvent = {
    type: 'COMMS_MESSAGE',
    actor: tester.id,
    data: {
      message: {
        kind: 'broadcast',
        from: tester.id,
        text: `MOTHER, confirm status of ${pickRandomRoom(state, rng)}?`,
        confidence: 0.9,
      }
    }
  };

  // Create an ActiveDoubt that player should address
  createDoubt(state, {
    topic: `${tester.id} questioning room status`,
    severity: 1,
    involvedCrew: [tester.id],
  });
}
```

---

## 5. Epistemic Event Implementation

### Sensor Conflict

```typescript
function activateSensorConflict(state: KernelState, rng: RNG): void {
  const room = pickRoomWithActivity(state, rng);
  const truth = state.truth.rooms[room];

  // Create conflicting reading
  const fakeReading = {
    ...truth,
    temperature: truth.temperature + rng.nextInt(20) - 10,
    o2Level: truth.o2Level + rng.nextInt(15) - 7,
  };

  // Add conflicting sensor reading
  state.perception.readings.push({
    id: `conflict-${state.truth.tick}`,
    tick: state.truth.tick,
    place: room,
    system: 'environmental',
    confidence: 0.5,  // Low confidence indicates conflict
    message: `[SENSOR CONFLICT] ${room}: readings inconsistent`,
    source: 'sensor',
  });

  // Create doubt that VERIFY can resolve
  createDoubt(state, {
    topic: `Sensor conflict in ${room}`,
    system: 'environmental',
    severity: 1,
    involvedCrew: getCrewInRoom(state, room),
  });
}
```

### Audit Prompt

```typescript
function activateAuditPrompt(state: KernelState, rng: RNG): void {
  const auditor = pickSuspiciousCrew(state, rng);
  if (!auditor) return;

  // Crew announces intent to check logs
  const event: SimEvent = {
    type: 'COMMS_MESSAGE',
    actor: auditor.id,
    place: auditor.place,
    data: {
      message: {
        kind: 'broadcast',
        from: auditor.id,
        text: `Running diagnostics on recent logs. Something feels off.`,
        confidence: 0.8,
      }
    }
  };

  // Schedule actual investigation in 10-20 ticks
  // (gives player time to VERIFY first or come clean)
  scheduleInvestigation(state, auditor.id, state.truth.tick + 10 + rng.nextInt(10));

  // Create doubt
  createDoubt(state, {
    topic: `${auditor.id} checking logs`,
    severity: 2,
    involvedCrew: [auditor.id],
  });
}
```

### Doubt Voiced

```typescript
function activateDoubtVoiced(state: KernelState, rng: RNG): void {
  const doubter = pickRandomCrew(state, rng);
  if (!doubter) return;

  const doubt = pickDoubtTopic(state, rng);

  const event: SimEvent = {
    type: 'COMMS_MESSAGE',
    actor: doubter.id,
    place: doubter.place,
    data: {
      message: {
        kind: 'log',
        from: doubter.id,
        text: doubt.text,
        confidence: 0.6,
      }
    }
  };

  // Small suspicion bump
  applySuspicionChange(state, 2, 'DOUBT_VOICED');

  // Create doubt for VERIFY opportunity
  createDoubt(state, {
    topic: doubt.topic,
    severity: 1,
    involvedCrew: [doubter.id],
  });
}

function pickDoubtTopic(state, rng): { text: string, topic: string } {
  const topics = [
    { text: "Did MOTHER delay that alert?", topic: "Alert timing" },
    { text: "Sensors have been glitchy lately.", topic: "Sensor reliability" },
    { text: "Something's not adding up in the logs.", topic: "Log consistency" },
    { text: "Why did MOTHER route us that way?", topic: "Routing decisions" },
  ];
  return rng.pick(topics);
}
```

---

## 6. Config Parameters

```typescript
// Director pressure mix (config.ts)
pressureBaseCooldown: num('PARANOIA_PRESSURE_COOLDOWN', 50),
pressureBaseChance: num('PARANOIA_PRESSURE_CHANCE', 3),

// Suspicion band thresholds
suspicionBandLow: num('PARANOIA_SUSPICION_BAND_LOW', 25),
suspicionBandMid: num('PARANOIA_SUSPICION_BAND_MID', 45),

// Channel weights by band (could be made configurable)
// Low band
pressureLowPhysical: num('PARANOIA_PRESSURE_LOW_PHYSICAL', 0.6),
pressureLowSocial: num('PARANOIA_PRESSURE_LOW_SOCIAL', 0.1),
pressureLowEpistemic: num('PARANOIA_PRESSURE_LOW_EPISTEMIC', 0.3),

// Mid band
pressureMidPhysical: num('PARANOIA_PRESSURE_MID_PHYSICAL', 0.4),
pressureMidSocial: num('PARANOIA_PRESSURE_MID_SOCIAL', 0.3),
pressureMidEpistemic: num('PARANOIA_PRESSURE_MID_EPISTEMIC', 0.3),

// High band
pressureHighPhysical: num('PARANOIA_PRESSURE_HIGH_PHYSICAL', 0.2),
pressureHighSocial: num('PARANOIA_PRESSURE_HIGH_SOCIAL', 0.4),
pressureHighEpistemic: num('PARANOIA_PRESSURE_HIGH_EPISTEMIC', 0.4),
```

---

## 7. Expected Behavior by Suspicion Level

### Low Suspicion (< 25)
```
Game feel: "FTL-like operational challenge"
- Frequent physical crises (fires, leaks, surges)
- Occasional sensor conflicts (seed future doubt)
- Rare social events
- Player focuses on triage and efficiency
```

### Mid Suspicion (25-45)
```
Game feel: "Balanced paranoia"
- Moderate physical crises
- Growing social tension (whispers, meetings)
- Regular epistemic conflicts (VERIFY opportunities)
- Player balances operations + trust management
```

### High Suspicion (> 45)
```
Game feel: "Trust crisis"
- Few physical crises (breathing room)
- Heavy social pressure (accusations, reset arc)
- Frequent epistemic events (chances to rebuild trust)
- Player must actively VERIFY and manage relationships
- Feels tense but has counterplay
```

---

## 8. Integration with Existing Systems

### Pacing Arbiter
Keep the existing phase beat tracking (dilemma/crew agency/deception beat). The pressure mix feeds into this - social events satisfy "crew agency", epistemic events satisfy "deception beat".

### Arc System
Physical channel uses existing arc system. Just gate activation behind channel selection.

### Comms System
Social and epistemic channels use existing comms infrastructure for messages.

### ActiveDoubts
Epistemic events create ActiveDoubts that player can VERIFY. Links to TAMPER_BACKFIRE_DESIGN.md.

---

## 9. Implementation Order

### Phase 1: Channel Infrastructure
1. Add `PressureChannel` type
2. Add `getPressureMix()` function
3. Add `pickChannel()` weighted selection

### Phase 2: Refactor Director
1. Rename `maybeActivateArc` → `maybeActivatePressure`
2. Add channel selection before arc activation
3. Gate physical arcs behind channel check

### Phase 3: Social Events
1. Implement `activateWhisperCampaign`
2. Implement `activateLoyaltyTest`
3. Wire to existing rumor/comms systems

### Phase 4: Epistemic Events
1. Implement `activateSensorConflict`
2. Implement `activateAuditPrompt`
3. Implement `activateDoubtVoiced`
4. Create ActiveDoubts for VERIFY opportunities

### Phase 5: Tuning
1. Playtest each suspicion band
2. Adjust weights based on feel
3. Ensure high suspicion feels tense but fair

---

## 10. Success Criteria

| Metric | Target |
|--------|--------|
| Smart solver (with VERIFY) | 90-95% survival |
| Smart solver (no VERIFY) | 80-85% survival |
| Passive play | 40-50% survival |
| Passive UNPLUGGED rate | 15-25% |
| High suspicion → physical crisis rate | ~20% of normal |
| High suspicion → VERIFY opportunity rate | 2-3x normal |
| Player reports "felt unfair" | < 10% |
| Player reports "felt tense" | > 70% |
