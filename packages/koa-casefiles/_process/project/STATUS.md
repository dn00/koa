# KOA Casefiles - Project Status

**Updated:** 2026-02-05
**Phase:** Solvability & Difficulty Done, Publishing Pipeline Next
**Spec:** See `SPEC_ALIGNMENT.md` for detailed comparison

---

## Quick Stats

| Metric | Value | Spec Target | Status |
|--------|-------|-------------|--------|
| Solvability | ≥95% | **≥95%** | ✅ Fixed (Feature 001) |
| Solver Perfect | 98% | 95%+ | ✅ |
| First Move Clarity | 100% | 100% | ✅ |
| Avg Min AP | 8.3 | <10 | ✅ |
| Has Keystone | ≥95% | 95%+ | ✅ Fixed (signal injection) |

---

## Completed Features

### Core Gameplay (P0)
- [x] Simulation engine (sim.ts)
- [x] Evidence derivation (evidence.ts)
- [x] Interactive CLI (game.ts)
- [x] SEARCH, INTERVIEW, LOGS commands
- [x] COMPARE contradiction detection
- [x] ACCUSE with 6-part answer (3 required, 3 bonus)

### Balance & UX (P1)
- [x] 4-day / 3-AP economy
- [x] Lead tokens (free follow-up actions)
- [x] SUGGEST command (keystone hint)
- [x] Bark system (KOA personality)
- [x] Gossip reveals WHERE/WHEN clearly
- [x] Physical evidence tagged [CRIME SCENE]/[HIDDEN]
- [x] Method hints [HOW: grabbed]

### Difficulty System (P2)
- [x] Easy: Culprit self-contradicts
- [x] Medium: Off-axis lie, requires localization
- [x] Hard: Competing narratives, sparse coverage
- [x] Fairness contract maintained

### Solvability Guarantee (P0) — Feature 001
- [x] Signal analysis (analyzeSignal in validators.ts)
- [x] Signal injection (injectMinimalSignal in sim.ts)
- [x] Pipeline integration (generateValidatedCase in sim.ts)
- [x] Tuning hooks (SignalConfig for variety system)
- **Status:** AUDITED - Ready for release
- **Plan:** `_process/features/001-solvability-guarantee/solvability-guarantee.plan.md`
- **Audit:** PASS (2026-02-05)

### 4-Tier Difficulty System (P2) — Feature 005
- [x] DifficultyProfile type & DIFFICULTY_PROFILES table
- [x] Profiles wired into simulate() pipeline
- [x] CLI/game.ts --tier parser (accepts 1-4, names, legacy labels)
- [x] Signal preference wiring in generateValidatedCase
- [x] Regression & batch validation
- **Status:** done
- **Plan:** `_process/features/005-four-tier-difficulty/005-four-tier-difficulty.plan.md`

### Testing Infrastructure
- [x] Automated solver (solver.ts)
- [x] Batch validator (validate-seeds.ts)
- [x] Grid search tuner (cli.ts --tune)
- [x] Playability metrics

---

## In Progress

### Structured Interview Questions (P1) — Feature 004
**Status:** Backlog — needs plan
**Plan:** TBD

Replace generic INTERVIEW with structured question types.

### Daily Seed System (P2) — Feature 002
**Status:** Implementation complete — awaiting review
**Plan:** `_process/features/002-daily-seed-system/daily-seed-system.plan.md`

Offline pipeline for generating "Daily Cases":
1. **Schedule & History** (Task 001, done)
2. **Seed Finder Logic** (Task 002, done)
3. **CLI Tool** (Task 003, done)

### CaseBundle Publish Format (P0) — Feature 003
**Status:** AUDITED - Ready for release
**Plan:** `_process/features/003-case-bundle-format/case-bundle-format.plan.md`

Defines canonical format for publishing cases to clients (no spoilers):
1. **Bundle & Solution types** (Task 001, done) - CaseBundle, Solution, WorldSnapshot in types.ts
2. **Bundle generation & hashing** (Task 002, done) - generateBundle(), SHA256 verification in bundle.ts
3. **Bundle validation & CLI** (Task 003, done) - validateBundle(), --export-bundle flag
**Audit:** PASS (2026-02-05)

### Variety System (P1)
**Status:** Design complete, solvability blocker now resolved
**Doc:** `VARIETY.md`

Features planned:
- [ ] Case shapes (classic, frame_job, two_step, collusion)
- [ ] Liar models (confident_lie, omission, misremember)
- [ ] Coverage profiles (full, partial, sparse)
- [ ] Twist slots (one modifier per case)
- [ ] Probabilistic difficulty
- [ ] Weekly themes

---

## Backlog (Spec Gaps)

### Priority 2 - Spec Compliance
- [ ] Daily seed generation (spec Section 11.1)
- [ ] Structured interview questions (spec Section 6.2.A)

### Priority 3 - Feature Completeness
- [ ] Deduction Board UI (spec Section 6.2.E)
- [ ] Wifi presence device (spec Section 8.6)
- [ ] Evidence decay (spec Section 6.2.B)
- [ ] Fraud/Impersonation crime type (spec Section 7)

### Priority 4 - Polish
- [ ] More blueprint variety (10+ crime templates)
- [ ] NPC archetypes affect testimony style
- [ ] Camera visual evidence
- [ ] Coffee Boost (+1 AP once)

### Priority 5 - Platform
- [ ] Web UI (port from CLI)
- [ ] Archive/replay system
- [ ] Telemetry (spec Section 21)
- [ ] Monetization (spec Section 20)

---

## Known Issues

1. ~~**Solvability at 94%**~~ - RESOLVED by Feature 001 (signal injection guarantees catchable signal). Awaiting review.

2. ~~**2% "hard" cases**~~ - RESOLVED. Signal injection adds minimal device event when culprit lacks catchable contradiction.

3. **False positive risk at 53%** - Innocents often have more contradictions than culprit. Signature motive breaks ties. Acceptable but worth monitoring.

4. **Cover-up disabled** - Was adding stress without fun. Code preserved for hard mode if needed. Not a bug.

5. **Tier 2 may be too easy** - Playtest (seed 42): solved 6/6 in 5 AP, S-rank. Culprit's alibi directly contradicts their own testimony location — COMPARE hands you the answer. Testimony citing crime events ("heard Carol rummaging") feels too direct. 417 evidence items is high noise. May need tuning for human players vs solver.

---

## Recent Changes

### 2026-02-05
- Feature 002 (Daily Seed System) complete — schedule types, HMAC finder, CLI --daily flag (30 new tests, 197 total)
- Feature 005 (4-tier difficulty) completed — DifficultyProfile types, CLI --tier parser, signal preference wiring
- Feature 001 (solvability guarantee) all tasks done, awaiting review — analyzeSignal, injectMinimalSignal, generateValidatedCase pipeline
- Feature 003 (CaseBundle) complete — types, bundle.ts, validateBundle, --export-bundle CLI flag (30 tests)
- Playtest (seed 42): 6/6 S-rank solve, noted tier 2 difficulty concerns

### Previous
- Difficulty control system implemented (easy/medium/hard)
- Competing narratives for hard mode
- Device coverage gaps for medium/hard
- Accusation system overhaul (3 required, 3 bonus parts)
- Batch seed validator added
- COMPARE fixes for device vs testimony
- Gossip now shows exact SEARCH command

---

## Dev Commands

```bash
# Play a case
npx tsx src/game.ts --seed 42 --agent-mode --reset

# Validate 100 seeds
npx tsx src/cli.ts --autosolve --generate 100

# Check playability
npx tsx src/cli.ts --playability --generate 50

# Verbose trace for one seed
npx tsx src/cli.ts --autosolve --generate 1 --seed 14 -v
```
