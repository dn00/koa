# KOA Casefiles - Project Status

**Updated:** 2026-02-05
**Phase:** Core Complete, Solvability Fix Needed Before Variety
**Spec:** See `SPEC_ALIGNMENT.md` for detailed comparison

---

## Quick Stats

| Metric | Value | Spec Target | Status |
|--------|-------|-------------|--------|
| Solvability | 94% | **≥95%** | ⚠️ Below spec |
| Solver Perfect | 98% | 95%+ | ✅ |
| First Move Clarity | 100% | 100% | ✅ |
| Avg Min AP | 8.3 | <10 | ✅ |
| Has Keystone | 94% | 95%+ | ⚠️ Gap |

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

### Testing Infrastructure
- [x] Automated solver (solver.ts)
- [x] Batch validator (validate-seeds.ts)
- [x] Grid search tuner (cli.ts --tune)
- [x] Playability metrics

---

## Critical Path (Spec Compliance)

### P0: Solvability Guarantee System
**Status:** PLANNED - 4 tasks ready
**Target:** Raise from 94% to ≥95% per spec Section 13.1
**Plan:** `_process/features/001-solvability-guarantee/solvability-guarantee.plan.md`

**Root cause:** 2% of cases have culprit with NO catchable contradiction.

**Solution (Approved):** Separate solvability from difficulty:
1. **Signal Analysis** (Task 001) - Detect if culprit has catchable signal
2. **Signal Injection** (Task 002) - Inject minimal device event if validation fails
3. **Pipeline Integration** (Task 003) - Wire into generation flow
4. **Tuning Hooks** (Task 004, P1) - Enable variety system to control signal distribution

**Key insight:** Signal ALWAYS exists (invariant). Difficulty controls discoverability (tunable).

---

## In Progress

### Variety System (P1 after solvability fix)
**Status:** Design complete, implementation blocked on solvability
**Doc:** `VARIETY.md`

Features planned:
- [ ] Case shapes (classic, frame_job, two_step, collusion)
- [ ] Liar models (confident_lie, omission, misremember)
- [ ] Coverage profiles (full, partial, sparse)
- [ ] Twist slots (one modifier per case)
- [ ] Probabilistic difficulty
- [ ] Weekly themes

**Dependency:** Variety will change puzzle mechanics, so solvability must be fixed first, then re-validated after variety lands.

---

## Backlog (Spec Gaps)

### Priority 2 - Spec Compliance
- [ ] CaseBundle publish format (spec Section 17.2)
- [ ] Daily seed generation (spec Section 11.1)
- [ ] Structured interview questions (spec Section 6.2.A)
- [ ] 4-tier difficulty system (spec Section 14)

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

1. **Solvability at 94%** - CRITICAL. Spec requires ≥95%. See P0 above.

2. **2% "hard" cases** - Culprit doesn't self-contradict, only signature motive distinguishes them. Solver falls back to guessing. This is the root cause of #1.

3. **False positive risk at 53%** - Innocents often have more contradictions than culprit. Signature motive breaks ties. Acceptable but worth monitoring.

4. **Cover-up disabled** - Was adding stress without fun. Code preserved for hard mode if needed. Not a bug.

---

## Recent Changes

### 2026-02-05
- Difficulty control system implemented (easy/medium/hard)
- Competing narratives for hard mode
- Device coverage gaps for medium/hard

### Previous
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
