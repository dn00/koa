# Task 001: Pressure Channel Types & Config

**Complexity:** S
**Depends On:** none
**Implements:** R1.1, R1.2, R1.3, R1.4, R6.1, R6.2

---

## Objective

Define the foundational types, config parameters, and utility functions for the three-channel pressure system so that downstream tasks can route director activation through suspicion-weighted channels.

---

## Context

### Relevant Files
- `src/kernel/systems/pressure.ts` - **new file** to create
- `src/config.ts` - add suspicion band and channel weight parameters
- `src/kernel/types.ts` - reference for existing types (TruthState, PressureMix not yet defined)

### Embedded Context

**Types to define:**
```typescript
export type PressureChannel = 'physical' | 'social' | 'epistemic';

export interface PressureMix {
  physical: number;   // 0-1, weights sum to 1
  social: number;
  epistemic: number;
}
```

**Config parameters to add (config.ts):**
```typescript
// Suspicion band thresholds
suspicionBandLow: num('PARANOIA_SUSPICION_BAND_LOW', 25),
suspicionBandHigh: num('PARANOIA_SUSPICION_BAND_HIGH', 45),

// Channel weights per band (integers 0-100, normalized to 0-1 in getPressureMix)
pressureLowPhysical: num('PARANOIA_PRESSURE_LOW_PHYSICAL', 60),
pressureLowSocial: num('PARANOIA_PRESSURE_LOW_SOCIAL', 10),
pressureLowEpistemic: num('PARANOIA_PRESSURE_LOW_EPISTEMIC', 30),

pressureMidPhysical: num('PARANOIA_PRESSURE_MID_PHYSICAL', 40),
pressureMidSocial: num('PARANOIA_PRESSURE_MID_SOCIAL', 30),
pressureMidEpistemic: num('PARANOIA_PRESSURE_MID_EPISTEMIC', 30),

pressureHighPhysical: num('PARANOIA_PRESSURE_HIGH_PHYSICAL', 20),
pressureHighSocial: num('PARANOIA_PRESSURE_HIGH_SOCIAL', 40),
pressureHighEpistemic: num('PARANOIA_PRESSURE_HIGH_EPISTEMIC', 40),
```

**RNG pattern (from core/rng.ts):**
```typescript
import { createRng, type RNG } from '../core/rng.js';
// rng.next() returns float 0-1
// rng.nextInt(n) returns int 0 to n-1
```

**Existing config pattern (config.ts):**
```typescript
const num = (key: string, fallback: number): number =>
  Number(process.env[key] ?? fallback);
```

### Key Invariants
- I9: All config params must be env-overridable via `PARANOIA_` prefix
- I17: Pressure must shift with suspicion (this task provides the foundation)

---

## Acceptance Criteria

### AC-1: getPressureMix returns low-band weights <- R1.3
- **Given:** suspicion = 10, config with default band thresholds
- **When:** `getPressureMix(10, config)` is called
- **Then:** returns `{ physical: 0.6, social: 0.1, epistemic: 0.3 }`

### AC-2: getPressureMix returns mid-band weights <- R1.3
- **Given:** suspicion = 35, config with default band thresholds
- **When:** `getPressureMix(35, config)` is called
- **Then:** returns `{ physical: 0.4, social: 0.3, epistemic: 0.3 }`

### AC-3: getPressureMix returns high-band weights <- R1.3
- **Given:** suspicion = 60, config with default band thresholds
- **When:** `getPressureMix(60, config)` is called
- **Then:** returns `{ physical: 0.2, social: 0.4, epistemic: 0.4 }`

### AC-4: pickChannel selects proportionally to weights <- R1.4
- **Given:** mix `{ physical: 0.5, social: 0.3, epistemic: 0.2 }` and a seeded RNG
- **When:** `pickChannel(mix, rng)` is called 1000 times
- **Then:** distribution is approximately 50/30/20 (within 5% tolerance)

---

## Edge Cases

### EC-1: Suspicion at band boundaries
- **Scenario:** suspicion = 25 (exactly at low/mid boundary)
- **Expected:** returns mid-band weights (boundary belongs to mid band, i.e. `>= bandLow` is mid)

### EC-2: Extreme suspicion values
- **Scenario:** suspicion = 0 or suspicion = 100
- **Expected:** returns valid mix (low-band for 0, high-band for 100), no crash

---

## Error Cases

None — pure functions with no error paths.

---

## Scope

**In Scope:**
- `PressureChannel` and `PressureMix` type definitions
- `getPressureMix(suspicion, config)` function
- `pickChannel(mix, rng)` function
- Config parameter additions to `config.ts`
- Unit tests for all of the above

**Out of Scope:**
- Director refactor (Task 002)
- Actual event generators (Tasks 003, 004)
- Kernel integration (Task 002)

---

## Implementation Hints

- Create `src/kernel/systems/pressure.ts` as a new system module
- Config weights are integers 0-100 for readability; normalize to 0-1 inside `getPressureMix` by dividing by the sum
- `pickChannel` uses the standard weighted random selection: roll = rng.next(), accumulate weights, return first channel where cumulative >= roll
- Export types and functions for use by Tasks 002-004

---

## Log

### Planning Notes
**Context:** Foundation task for the pressure mix feature. All downstream tasks import from this module.
**Decisions:** Config weights stored as integers (not floats) for env var readability. Normalization happens at runtime so weights don't need to sum to 100 exactly.

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer
