# Task 002: Director Pressure Routing

**Complexity:** M
**Depends On:** 001
**Implements:** R2.1, R2.2, R2.3, R2.4, R2.5, R6.3

---

## Objective

Refactor the director's threat activation to route through suspicion-aware channel selection, so the pressure type shifts based on crew suspicion level while preserving all existing arc behavior.

---

## Context

### Relevant Files
- `src/kernel/systems/arcs.ts` - current `maybeActivateArc()` at lines 303-320, `proposeArcEvents()` at lines 49-301
- `src/kernel/kernel.ts` - call site where arc proposals are generated (proposal generation phase)
- `src/kernel/systems/pressure.ts` - add `maybeActivatePressure()` routing function (from Task 001)
- `src/kernel/systems/beliefs.ts` - `calculateCrewSuspicion()` at lines 7-31
- `src/config.ts` - existing `threatActivationChance`, `threatActivationCooldown`, `boredomThreshold`, `tensionThreshold`

### Embedded Context

**Current maybeActivateArc flow (arcs.ts lines 303-320):**
```typescript
function maybeActivateArc(state: KernelState, rng: RNG): void {
  const { truth } = state;
  if (truth.arcs.length >= CONFIG.maxActiveThreats) return;
  if (truth.tick < truth.pacing.nextThreatActivationTick) return;

  let chance = CONFIG.threatActivationChance;
  if (truth.pacing.boredom >= CONFIG.boredomThreshold) chance += 3;
  if (truth.pacing.tension >= CONFIG.tensionThreshold) chance = Math.max(1, chance - 1);

  if (rng.nextInt(100) < chance) {
    const kind = pickArcKind(truth, rng);
    truth.arcs.push(createArc(state, kind, rng));
    truth.pacing.nextThreatActivationTick = truth.tick + CONFIG.threatActivationCooldown;
  }
}
```

**Current call site (kernel.ts, inside proposal generation):**
`maybeActivateArc` is called at the top of `proposeArcEvents()`. It mutates `truth.arcs[]` as a side effect, then `proposeArcEvents` proposes events for all active arcs.

**New routing function signature:**
```typescript
import type { Proposal } from '../types.js';
import type { PressureChannel } from './pressure.js';

export function maybeActivatePressure(
  state: KernelState,
  rng: RNG
): Proposal[] {
  // 1. Check cooldown (same logic)
  // 2. Calculate chance (same boredom/tension modifiers)
  // 3. Roll for activation
  // 4. Get suspicion → mix → channel
  // 5. Route:
  //    physical → call old maybeActivateArc logic, return []
  //    social → return proposeSocialPressure(state, rng)  (stub: returns [])
  //    epistemic → return proposeEpistemicPressure(state, rng)  (stub: returns [])
  // 6. Set cooldown
}
```

**calculateCrewSuspicion (beliefs.ts):**
```typescript
export function calculateCrewSuspicion(state: KernelState): number
// Returns 0-100 average suspicion across living crew
```

### Key Invariants
- I10: Proposals are scored, not hardcoded — social/epistemic events return `Proposal[]`
- I8: Deterministic given seed — same RNG path must produce same results
- I17: Pressure shifts with suspicion — this task implements the routing

---

## Acceptance Criteria

### AC-1: Physical channel activates arcs via existing logic <- R2.1
- **Given:** suspicion < 25 (mostly physical), below max arcs, cooldown expired
- **When:** `maybeActivatePressure` activates and picks physical channel
- **Then:** a new arc is pushed to `truth.arcs[]` (same as current behavior)

### AC-2: Social channel returns proposals (stub) <- R2.1
- **Given:** suspicion >= 45 (mostly social/epistemic), cooldown expired
- **When:** `maybeActivatePressure` activates and picks social channel
- **Then:** returns `Proposal[]` (empty for now, to be filled by Task 003)

### AC-3: Epistemic channel returns proposals (stub) <- R2.1
- **Given:** suspicion >= 45 (mostly social/epistemic), cooldown expired
- **When:** `maybeActivatePressure` activates and picks epistemic channel
- **Then:** returns `Proposal[]` (empty for now, to be filled by Task 004)

### AC-4: Boredom/tension modifiers still affect base chance <- R2.4
- **Given:** boredom >= boredomThreshold (15)
- **When:** activation check runs
- **Then:** chance is increased by +3 (same as current)

### AC-5: Cooldown applies after any channel activation <- R2.5
- **Given:** activation fires on social channel
- **When:** next tick arrives
- **Then:** `nextThreatActivationTick` is set to `tick + cooldown`

### AC-6: Physical arcs still gated by maxActiveThreats <- R2.2
- **Given:** `arcs.length >= maxActiveThreats`, physical channel selected
- **When:** activation check runs
- **Then:** no arc is created, but the pressure activation still occurred (cooldown set)

---

## Edge Cases

### EC-1: Physical channel at max arcs, social/epistemic would work
- **Scenario:** Physical selected but arcs at max
- **Expected:** No arc created. Cooldown still set. (Player doesn't get double pressure from fallback to another channel.)

### EC-2: All crew dead
- **Scenario:** No living crew → `calculateCrewSuspicion` returns 0
- **Expected:** Low-band mix used, physical channel likely. Game is ending anyway but no crash.

### EC-3: Existing arc stepping unaffected
- **Scenario:** Active arcs exist, `proposeArcEvents()` is called
- **Expected:** Arc stepping logic unchanged — only activation was extracted

---

## Error Cases

None — routing logic with no error paths.

---

## Scope

**In Scope:**
- Extract `maybeActivateArc` from `proposeArcEvents` into `maybeActivatePressure`
- Add channel routing with suspicion-based selection
- Update kernel.ts to call `maybeActivatePressure` and merge returned proposals
- Stub returns for social/epistemic channels (Tasks 003/004 fill these in)
- Preserve all existing test behavior for arcs

**Out of Scope:**
- Social event implementations (Task 003)
- Epistemic event implementations (Task 004)
- Pacing integration testing (Task 005)

---

## Implementation Hints

- Extract `maybeActivateArc` body into a helper called from `maybeActivatePressure`
- In `proposeArcEvents`, remove the `maybeActivateArc()` call — it now lives in `maybeActivatePressure`
- In kernel.ts, call `maybeActivatePressure` before the proposal generation phase and merge returned proposals into the perception proposals list
- For stubs: `proposeSocialPressure` and `proposeEpistemicPressure` should be exported functions that return `[]` — Tasks 003/004 will fill them in
- Run existing test suite after refactor to ensure no regression

---

## Log

### Planning Notes
**Context:** Core refactoring task. Separates "when to activate" from "what to activate" and adds suspicion awareness.
**Decisions:** Physical channel still uses arc side-effect mutation (not proposal-based) for backward compatibility. Social/epistemic return proposals to go through scoring pipeline.

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer
