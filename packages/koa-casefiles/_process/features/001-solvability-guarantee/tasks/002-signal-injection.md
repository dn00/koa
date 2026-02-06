# Task 002: Signal Injection Function

**Status:** backlog
**Complexity:** M
**Depends On:** 001
**Implements:** R2.1, R2.2, R2.3, R2.4, R2.5

---

## Objective

Add `injectMinimalSignal()` function that adds a device event to catch the culprit when signal validation fails, ensuring the case becomes solvable.

---

## Context

### Relevant Files
- `src/sim.ts` - Add new function here (used during simulation)
- `src/evidence.ts` - Understand how evidence is derived from events
- `src/world.ts` - Use `getDoorBetween()` to find door sensors

### Embedded Context

**Function signature to add to `src/sim.ts`:**

```typescript
import type { SignalAnalysis } from './types.js';

/**
 * Inject a minimal device event that catches the culprit.
 * Called when analyzeSignal() returns hasSignal: false.
 *
 * Strategy: Add a door event during crime window that places
 * culprit at crime scene. This is the least intrusive injection.
 *
 * @param world - The world state
 * @param events - Current event log (will be mutated)
 * @param config - Case config with culpritId, crimePlace, crimeWindow
 * @param rng - Seeded RNG for determinism
 * @returns The injected event (for logging/debugging)
 */
export function injectMinimalSignal(
    world: World,
    events: SimEvent[],
    config: CaseConfig,
    rng: RNG
): SimEvent | null
```

**Event creation pattern (from sim.ts):**

```typescript
function createEvent(
    tick: number,
    type: EventType,
    fields: Partial<SimEvent>
): SimEvent {
    const event: SimEvent = {
        id: '', // Will be computed
        tick,
        window: getWindowForTick(tick),
        type,
        ...fields,
    };

    // Compute deterministic event ID
    event.id = computeEventId({
        tick,
        ordinal: eventOrdinal++,
        type,
        ...fields,
    });

    return event;
}
```

**Finding door sensors (from world.ts):**

```typescript
export function getDoorBetween(
    fromPlace: PlaceId,
    toPlace: PlaceId,
    devices: Device[]
): Device | undefined {
    return devices.find(d =>
        d.type === 'door_sensor' &&
        ((d.place === fromPlace && d.connectsTo === toPlace) ||
         (d.place === toPlace && d.connectsTo === fromPlace))
    );
}
```

**Crime window tick calculation (from types.ts):**

```typescript
export const WINDOWS: TimeWindow[] = [
    { id: 'W1', label: '4:00pm - 5:30pm', startTick: 0, endTick: 15 },
    { id: 'W2', label: '5:30pm - 7:00pm', startTick: 16, endTick: 30 },
    { id: 'W3', label: '7:00pm - 8:30pm', startTick: 31, endTick: 45 },
    // ...
];
```

**Key invariant (from INVARIANTS.md INV-7):**
> Same seed produces identical case. RNG seeded from input seed.
> Signal injection must use RNG for determinism.

### Source Docs
- `_process/features/001-solvability-guarantee/discovery.md` - Section "Signal Injection Strategy"

---

## Acceptance Criteria

### AC-1: Injects door event catching culprit ← R2.1
- **Given:** World with door between kitchen and living, crime at kitchen
- **When:** `injectMinimalSignal(world, events, config, rng)` is called
- **Then:** Event added with `type: 'DOOR_OPENED', actor: culpritId, place: kitchen`

### AC-2: Uses seeded RNG for determinism ← R2.2
- **Given:** Same seed, same world, same config
- **When:** `injectMinimalSignal()` called twice
- **Then:** Both calls produce identical event (same tick, same ID)

### AC-3: Targets existing door sensor ← R2.3
- **Given:** World with door sensors
- **When:** `injectMinimalSignal()` is called
- **Then:** Injected event's `target` matches a real device ID from `world.devices`

### AC-4: Event occurs during crime window ← R2.4
- **Given:** Config with `crimeWindow: 'W3'`
- **When:** `injectMinimalSignal()` is called
- **Then:** Injected event's `window === 'W3'` and tick is within W3 range (31-45)

### AC-5: Evidence derivation picks up injected event ← R2.5
- **Given:** Events array with injected door event
- **When:** `deriveEvidence(world, events, config)` is called
- **Then:** Result includes `DeviceLogEvidence` citing the injected event ID

---

## Edge Cases

### EC-1: No door at crime scene
- **Scenario:** Crime scene has no adjacent door sensors
- **Expected:** Find nearest door sensor (1 hop away) and inject there

### EC-2: Crime scene is isolated
- **Scenario:** Crime scene has no reachable door sensors
- **Expected:** Return `null` (cannot inject - seed is truly unsalvageable)

### EC-3: Multiple valid doors
- **Scenario:** Crime scene has 3 adjacent doors
- **Expected:** Use RNG to pick one (deterministic based on seed)

---

## Error Cases

### ERR-1: Events array is frozen/immutable
- **When:** Cannot push to events array
- **Then:** Throws `Error('Events array must be mutable for injection')`

### ERR-2: Config missing required fields
- **When:** `config.culpritId` or `config.crimePlace` is undefined
- **Then:** Throws `Error('injectMinimalSignal requires culpritId and crimePlace')`

---

## Scope

**In Scope:**
- Add `injectMinimalSignal()` function to sim.ts
- Find appropriate door sensor
- Create door event with proper tick/window
- Unit tests for the function

**Out of Scope:**
- Calling this function from pipeline (Task 003)
- Other injection strategies (testimony injection, etc.)
- Logging/debugging output for injection

---

## Implementation Hints

1. Get crime window tick range:
   ```typescript
   const windowDef = WINDOWS.find(w => w.id === config.crimeWindow)!;
   const tick = windowDef.startTick + rng.nextInt(windowDef.endTick - windowDef.startTick);
   ```

2. Find door near crime scene:
   ```typescript
   const crimePlace = world.places.find(p => p.id === config.crimePlace);
   for (const adjacent of crimePlace.adjacent) {
       const door = getDoorBetween(config.crimePlace, adjacent, world.devices);
       if (door) { /* use this door */ }
   }
   ```

3. Create the event:
   ```typescript
   const event = createEvent(tick, 'DOOR_OPENED', {
       actor: config.culpritId,
       place: config.crimePlace,
       toPlace: adjacent,
       target: door.id,
   });
   events.push(event);
   ```

4. Note: `createEvent()` uses global `eventOrdinal` counter. You may need to manage ordinal to ensure determinism. Consider adding a parameter or resetting ordinal context.

---

## Log

### Planning Notes
**Context:** This function creates the "safety net" - when natural simulation doesn't create a catchable signal, we inject one.
**Decisions:** Door events chosen as injection method because they feel natural (culprit opened door to crime scene) and create strong device_contradiction signal.

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer
