# Feature: Offline Case Generation Pipeline

**Status:** idea
**Priority:** P2 (after Feature 005 tiers + Feature 003 bundle format)
**Spec Reference:** Section 11.1

---

## Goal

Define the offline pipeline for generating, validating, and publishing case bundles. Enforce the boundary between offline generation (dev/publish time) and runtime (player time).

---

## Architecture: Offline vs Runtime

Cases are **pre-generated offline**, validated, human-reviewed, and published as bundles. The runtime never calls `simulate()`.

```
OFFLINE (dev/publish time)              RUNTIME (player time)
─────────────────────────               ────────────────────
simulate(seed, tier)                    Load CaseBundle
deriveEvidence()                        Player session
generateValidatedCase()                   - interview, examine, accuse
validateCase()                          Evidence revelation (pre-computed)
analyzeSignal()                         Scoring / accusation check
injectMinimalSignal()                   Share results
Human review / QA
Bundle & publish
```

**The CaseBundle (Feature 003) IS the boundary.** Everything to its left is offline tooling. Everything to its right is the player-facing runtime.

### What does NOT belong at runtime
- `simulate()` — world creation, crime generation, event simulation
- `deriveEvidence()` — evidence derivation from events
- `validateCase()` — quality gates
- `analyzeSignal()` / `injectMinimalSignal()` — solvability checks
- Any RNG-based generation

### What belongs at runtime
- Loading a pre-built CaseBundle (contains world, evidence, solution hash)
- PlayerSession (AP tracking, interview/examine commands)
- Evidence revelation from pre-computed evidence set
- Accusation validation (compare hash)
- Scoring

---

## Pipeline Overview

```
1. Schedule defines tier per slot (e.g., Thursday = tier 3)
2. Candidate seed generated: HMAC(secret, date + rulesetVersion)
3. generateValidatedCase(candidate, tier) → case or null
4. validateCase() → quality gates (anti-anticlimax, red herrings, difficulty metrics)
5. If fail: try candidate+1, candidate+2, ... up to 1000 offsets
6. Human reviews passing case (optional but recommended)
7. Bundle case → CaseBundle (Feature 003 format)
8. Publish bundle (static JSON, API, or git commit)
```

---

## Components

### 1. Schedule Config (static data, not code)

```typescript
// schedule.json or inline config — NOT a CaseDirector class
interface WeeklySchedule {
    [day: string]: {  // 'monday' | 'tuesday' | ...
        tier: DifficultyTier;
        theme?: string;  // optional editorial theme
    };
}

const DEFAULT_SCHEDULE: WeeklySchedule = {
    monday:    { tier: 1 },  // Tutorial — warm-up
    tuesday:   { tier: 2 },  // Standard
    wednesday: { tier: 2 },  // Standard
    thursday:  { tier: 3 },  // Challenging
    friday:    { tier: 2 },  // Standard
    saturday:  { tier: 1 },  // Casual
    sunday:    { tier: 4 },  // Expert — weekend challenge
};
```

### 2. Seed Finder Script

```bash
npx tsx src/find-daily-seed.ts --date 2026-02-05 --schedule default
```

- Reads schedule to get tier for date
- Generates candidate seed from HMAC(secret, date + rulesetVersion)
- Loops offsets until `generateValidatedCase()` + `validateCase()` both pass
- Outputs: seed, tier, signal type, quality metrics
- Human reviews output before publishing

### 3. Quality Scorer

```typescript
interface CaseQuality {
    seed: number;
    tier: DifficultyTier;
    tierName: string;
    solvable: boolean;
    signalType: SignalType;
    signalStrength: SignalStrength;
    crimeType: CrimeType;
    contradictionCount: number;
    estimatedMinAP: number;
    passesAllValidators: boolean;
    // Variety metrics (compared against recent published cases)
    uniqueCrimeType: boolean;   // Not same as yesterday
    uniqueCulprit: boolean;     // Not same NPC as yesterday
}
```

### 4. Weekly Variety Tracker

- Don't repeat same crime type 2 days in a row
- Don't repeat same culprit NPC 2 days in a row
- Track in `published-cases.json` alongside bundles
- Variety check is part of the seed finder's quality gate

### 5. Publishing

**Minimal viable (v1):** Static JSON committed to repo

```json
{
    "2026-02-05": {
        "seed": 4821,
        "tier": 3,
        "tierName": "Challenging",
        "signalType": "device_contradiction",
        "bundleFile": "bundles/2026-02-05.json",
        "validated": true,
        "reviewedBy": "human"
    }
}
```

**Automation (v2):** GitHub Actions cron job
- Runs at midnight UTC
- Finds valid seed for next day
- Generates bundle
- Opens PR for human review (not auto-commit)
- Alerts on failure (webhook)

---

## Seed Derivation

```typescript
import { createHmac } from 'crypto';

function getDailySeed(date: string, secret: string, rulesetVersion: string): number {
    const hmac = createHmac('sha256', secret);
    hmac.update(`${date}:${rulesetVersion}`);
    const hash = hmac.digest('hex');
    return parseInt(hash.slice(0, 8), 16);
}

function findValidSeed(
    date: string,
    secret: string,
    ruleset: string,
    tier: DifficultyTier,
    recentCases: PublishedCase[]
): { seed: number; quality: CaseQuality } {
    for (let offset = 0; offset < 1000; offset++) {
        const candidate = getDailySeed(date, secret, ruleset) + offset;
        const result = generateValidatedCase(candidate, tier);
        if (!result) continue;

        const validation = validateCase(result.sim.world, result.sim.config, result.evidence);
        if (!validation.passed) continue;

        const quality = scoreCase(result, recentCases);
        if (!quality.uniqueCrimeType || !quality.uniqueCulprit) continue;

        return { seed: candidate, quality };
    }
    throw new Error(`No valid seed found for ${date} at tier ${tier}`);
}
```

---

## Dependencies

- [x] Feature 001 — Solvability guarantee (done)
- [ ] Feature 005 — Four-tier difficulty (in planning)
- [ ] Feature 003 — CaseBundle format (defines the offline/runtime boundary)
- [ ] UI — needed to actually serve puzzles to players

---

## Architectural Decision: No CaseDirector

Previous notes proposed a `CaseDirector` class with rotation patterns (cycle, ramp, weighted random) for dynamic tier selection. This is **deprecated** in favor of:

- **Static schedule config** — tier per day/slot is editorial data, not runtime logic
- **Human review** — cases are reviewed before publishing, not auto-shipped
- **Seed finder script** — CLI tooling, not a runtime abstraction

The director pattern conflated case generation (offline) with case serving (runtime). These are fundamentally separate concerns.

---

## Open Questions

- [ ] What timezone for "daily" cutoff? (UTC probably)
- [ ] How far ahead to pre-generate? (1 week batch recommended)
- [ ] Public leaderboard for daily times?
- [ ] "Spoiler period" before discussing solutions?
- [ ] Archive of past dailies playable?
- [ ] Should the seed finder auto-commit or open PR for review?

---

## Notes

- Don't need this until UI exists (Feature 006)
- Feature 003 (CaseBundle) is the prerequisite — defines what gets published
- Start with static JSON in repo, upgrade to API later
- Consider "weekly theme" batches (same household, 7 different crimes)
- The entire generation pipeline (`simulate`, `deriveEvidence`, etc.) should eventually be excluded from the runtime bundle via tree-shaking or separate entry points
