# Feature: Daily Seed System

**Status:** idea
**Priority:** P2 (after solvability fix, needs UI first)
**Spec Reference:** Section 11.1

---

## Goal

Automatically publish a new validated seed each day so players get a shared daily puzzle.

---

## Approach: Option C (Hybrid)

```
1. Nightly job generates candidate: HMAC(secret, date + rulesetVersion)
2. Validate candidate (solvability, difficulty, variety)
3. If bad, try candidate+1, candidate+2, etc until good
4. Publish validated seed
```

**Why not simpler options:**
- Option A (pre-curated pool): Works but no cryptographic fairness, pool could leak
- Option B (pure HMAC): Random seed might be unsolvable, no quality gate

---

## What Makes a "Good" Seed

- [ ] Passes solvability validation (≥95% confidence)
- [ ] Matches target difficulty tier
- [ ] Has interesting signal (not trivially obvious)
- [ ] Variety across week (different crime types, methods, culprits)
- [ ] Playable within AP budget
- [ ] No degenerate cases (e.g., everyone in same room)

---

## Components Needed

### 1. Seed Validator Script
```bash
npx tsx src/validate-daily-seed.ts --date 2026-02-05
```
- Generate candidate from HMAC
- Run full validation suite
- Output: seed number or "retry with offset"

### 2. Seed Quality Scorer
```typescript
interface SeedQuality {
  solvable: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  signalType: SignalType;
  crimeType: CrimeType;
  uniqueSuspects: number;  // variety metric
  estimatedMinAP: number;
}
```

### 3. Weekly Variety Tracker
- Don't repeat same crime type 2 days in row
- Rotate difficulty through week (M-easy, T-medium, W-hard, etc?)
- Track culprit names to avoid repetition

### 4. Publishing Mechanism
**Options:**
- Static JSON file in repo (simplest, git-based)
- Serverless function (Vercel/Cloudflare)
- Database with API

**Minimal viable:**
```json
// daily-seeds.json (committed to repo)
{
  "2026-02-05": { "seed": 4821, "difficulty": "medium", "validated": true },
  "2026-02-06": { "seed": 7293, "difficulty": "easy", "validated": true }
}
```

### 5. Automation
- GitHub Actions cron job (runs at midnight UTC)
- Validates next day's seed
- Commits to repo or pushes to API
- Alerts on failure (Slack/Discord webhook)

---

## Daily Seed Derivation

```typescript
import { createHmac } from 'crypto';

function getDailySeed(date: string, secret: string, rulesetVersion: string): number {
  const hmac = createHmac('sha256', secret);
  hmac.update(`${date}:${rulesetVersion}`);
  const hash = hmac.digest('hex');
  return parseInt(hash.slice(0, 8), 16);  // First 32 bits as seed
}

// If seed fails validation, try offsets
function findValidSeed(date: string, secret: string, ruleset: string): number {
  for (let offset = 0; offset < 1000; offset++) {
    const candidate = getDailySeed(date, secret, ruleset) + offset;
    if (validateSeed(candidate)) return candidate;
  }
  throw new Error(`No valid seed found for ${date}`);
}
```

---

## Weekly Schedule Ideas

| Day | Difficulty | Theme |
|-----|------------|-------|
| Mon | Easy | Warm-up |
| Tue | Medium | Standard |
| Wed | Medium | Standard |
| Thu | Hard | Challenge |
| Fri | Medium | Standard |
| Sat | Easy | Casual |
| Sun | Hard | Weekend warrior |

---

## Dependencies

- [x] Solvability guarantee (Feature 001) - need reliable validation
- [ ] Signal analysis in solver output - for quality scoring
- [ ] UI to display daily puzzle - no point without frontend
- [ ] User accounts (optional) - for streaks/stats

---

## Open Questions

- [ ] What timezone for "daily" cutoff? (UTC probably)
- [ ] How far ahead to pre-generate? (1 day? 1 week?)
- [ ] Public leaderboard for daily times?
- [ ] "Spoiler period" before discussing solutions?
- [ ] Archive of past dailies playable?

---

## TODO (When Ready)

1. [ ] Implement `validate-daily-seed.ts` script
2. [ ] Add seed quality scoring to solver
3. [ ] Set up GitHub Actions workflow
4. [ ] Create `daily-seeds.json` or API endpoint
5. [ ] Add `/daily` command to CLI for testing
6. [ ] UI integration (blocked on having UI)

---

## Notes

- Don't need this until UI exists
- Solvability fix (Feature 001) is prerequisite - can't publish unreliable seeds
- Start with static JSON file, upgrade to API later if needed
- Consider "weekly theme" batches (same household, 7 different crimes)
