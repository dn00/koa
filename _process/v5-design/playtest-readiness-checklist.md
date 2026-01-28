# V5 Playtest Readiness Checklist

Run through before launching agent playtests.

---

## 1. Engine

- [ ] `npx tsx scripts/play-v5.ts --puzzle {slug}` launches without errors
- [ ] `--state` mode works: create, continue, complete game
- [ ] `--seed` produces deterministic output
- [ ] `--json` produces structured output
- [ ] Play through FLAWLESS path (3 safe cards) — verify scoring, KOA responses
- [ ] Play through BUSTED path (play contradictions) — verify penalties
- [ ] Scrutiny flow works (stand/withdraw)
- [ ] Tactic flow works (probe/bolster/deflect)

## 2. Puzzle Content

- [ ] 6 cards total (play 3, leave 3)
- [ ] 2 contradictions (risk 3 cards)
- [ ] 2 solid cards (risk 1)
- [ ] 2 shaky cards (risk 2)
- [ ] Target achievable: best 3 cards score ≥ target
- [ ] All puzzle-specific barks written for each card
- [ ] Opening line matches puzzle scenario
- [ ] Verdicts written for all tiers

## 3. Dialogue Quality

- [ ] KOA voice matches D12 guidelines:
  - [ ] Dry observations, not snark
  - [ ] Uses YOUR data against you
  - [ ] Concerned, not angry
  - [ ] Grudging acceptance phrases
  - [ ] Ominous sign-offs
- [ ] No courtroom language (objection, verdict, guilty, etc.)
- [ ] Puzzle-specific barks reference the actual scenario
- [ ] Each card has distinct bark (not generic)

## 4. Agent Briefing

- [ ] `briefing.md` exists with rules
- [ ] `player-view.md` exists with card data (no lie status)
- [ ] Card claims don't reveal contradiction status
- [ ] Risk pips match actual card risks

## 5. Pre-Launch

- [ ] All files compile cleanly
- [ ] State files cleaned up from previous tests
- [ ] Log directory exists
- [ ] Agent model specified

---

## Quick Test Commands

```bash
# Full game (interactive)
npx tsx scripts/play-v5.ts --puzzle midnight-print-job

# State mode (agent simulation)
npx tsx scripts/play-v5.ts --puzzle midnight-print-job --state /tmp/test.json --pick browser_history --seed 12345

# JSON mode (agent output)
npx tsx scripts/play-v5.ts --puzzle midnight-print-job --state /tmp/test.json --pick browser_history --seed 12345 --json

# Scrutiny response
npx tsx scripts/play-v5.ts --puzzle midnight-print-job --state /tmp/test.json --scrutiny stand --seed 12345 --json
```

---

## Post-Playtest

- [ ] Compile results
- [ ] Identify mechanical issues → engine fixes
- [ ] Identify dialogue issues → bark library updates
- [ ] Identify balance issues → puzzle adjustments
