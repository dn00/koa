# Feature: Four-Tier Difficulty System

**Status:** idea
**Priority:** P1
**Spec Reference:** Section 14

---

## Goal

Expand from 3 difficulty levels (easy/medium/hard) to 4 tiers with clearer progression.

---

## Current State

```typescript
// sim.ts
difficulty?: 'easy' | 'medium' | 'hard'

// Easy: Culprit self-contradicts (false_alibi) → obvious liar
// Medium: Culprit lies about off-axis window → connect the dots
// Hard: Competing narratives, sparse coverage → synthesis required
```

Three levels, string-based.

---

## Spec: 4 Tiers

| Tier | Name | Description |
|------|------|-------------|
| 1 | Tutorial | Obvious culprit, minimal noise |
| 2 | Standard | Default experience, fair challenge |
| 3 | Challenging | Red herrings, device gaps |
| 4 | Expert | Multiple valid-looking suspects, sparse evidence |

---

## Proposed Mapping

```typescript
type DifficultyTier = 1 | 2 | 3 | 4;

const DIFFICULTY_CONFIGS: Record<DifficultyTier, DifficultyProfile> = {
  1: {
    name: 'Tutorial',
    signalType: 'self_contradiction',  // Always obvious
    deviceCoverage: 'full',
    redHerrings: 0,
    competingNarratives: false,
    twistRules: [],
  },
  2: {
    name: 'Standard',
    signalType: 'self_contradiction',  // Usually obvious
    deviceCoverage: 'full',
    redHerrings: 1,
    competingNarratives: false,
    twistRules: ['false_alibi'],
  },
  3: {
    name: 'Challenging',
    signalType: 'device_contradiction',  // Requires comparison
    deviceCoverage: 'partial',  // 1 gap
    redHerrings: 2,
    competingNarratives: false,
    twistRules: ['false_alibi', 'unreliable_witness'],
  },
  4: {
    name: 'Expert',
    signalType: 'scene_presence',  // Weakest signal
    deviceCoverage: 'sparse',  // 2 gaps
    redHerrings: 3,
    competingNarratives: true,
    twistRules: ['false_alibi', 'unreliable_witness', 'planted_evidence'],
  },
};
```

---

## What Changes Per Tier

| Aspect | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|--------|--------|--------|--------|--------|
| Signal clarity | Obvious self-lie | Clear lie | Device mismatch | Opportunity only |
| Device gaps | None | None | 1 window | 2 windows |
| Red herrings | 0 | 1 | 2 | 3 |
| Competing theory | No | No | No | Yes |
| Twist complexity | None | Basic | Moderate | Full |
| Innocent liars | 0 | 0 | 1 | 2 |

---

## Signal Type Distribution

With solvability guarantee (Feature 001), we can tune signal distribution:

```typescript
// Tier 1: 100% self_contradiction (easiest to spot)
// Tier 2: 80% self_contradiction, 20% device_contradiction
// Tier 3: 40% self, 50% device, 10% scene_presence
// Tier 4: 20% self, 40% device, 40% scene_presence
```

---

## Weekly Tier Schedule

```
Monday:    Tier 1 (ease into week)
Tuesday:   Tier 2
Wednesday: Tier 2
Thursday:  Tier 3
Friday:    Tier 2
Saturday:  Tier 3
Sunday:    Tier 4 (weekend challenge)
```

---

## Migration

Current string-based to number-based:
```typescript
const LEGACY_MAP = {
  'easy': 1,
  'medium': 2,
  'hard': 4,  // Current "hard" is actually expert level
};
```

Need to add Tier 3 (Challenging) as new middle ground.

---

## TODO

1. [ ] Change `difficulty` type from string to number (1-4)
2. [ ] Add Tier 3 configuration (between current medium and hard)
3. [ ] Update DIFFICULTY_PRESETS in sim.ts
4. [ ] Update CLI flags (`--difficulty 3` vs `--difficulty medium`)
5. [ ] Update solver to report tier correctly
6. [ ] Balance testing: run 500 seeds per tier

---

## Dependencies

- [x] Solvability guarantee (Feature 001) - enables signal type tuning
- [x] Signal analysis (Task 001-004) - needed to control signal distribution

---

## Notes

- Current "hard" is very hard - might actually be Tier 4
- Need playtesting to find right Tier 3 balance
- Consider keeping string aliases for convenience (`--difficulty challenging`)

---

## Hooks from Feature 001 (ready to wire)

Feature 001 shipped `SignalConfig` and `SolveResult.signalAnalysis` as tuning hooks. This feature should wire them:

1. **Director → SignalConfig**: Add `getSignalConfig()` to `CaseDirector` that maps tier to preferred signal type (Tier 1 → `self_contradiction`, Tier 3 → `device_contradiction`, etc). Callers pass `director.getSignalConfig()` into `generateValidatedCase()` options.

2. **CLI verbose → signal display**: Single-seed verbose mode (`--seed N -v`) should call `analyzeSignal()` and display signal type/strength after the DIFFICULTY METRICS section. Needed to verify cases match their tier's target signal distribution.
