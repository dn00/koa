# Plan: Daily Puzzle MVP (Vertical Slice)

**Discovery:** [discovery.md](./discovery.md)
**Date:** 2026-01-26
**Status:** active

---

## Overview

Build a playable Daily Puzzle mode that proves the Home Smart Home adversarial testimony design works. Players are dealt 6 evidence cards, use SUBMIT to reduce Resistance to 0 while addressing all Concerns, and contend with KOA's counter-evidence. Win by building a coherent story; lose by running out of turns or hitting Scrutiny 5.

---

## Requirements Expansion

### From R1: Daily Puzzle Mode

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | Single puzzle per day, seeded deterministically | Same seed produces identical puzzle | 021 |
| R1.2 | Same puzzle for all players (daily_id binding) | Two devices with same daily_id get same puzzle | 021 |
| R1.3 | Lock phase shows: target, Resistance, Concerns, Turns, Counters, Hand | All elements visible before first move | 017 |
| R1.4 | Solve phase loop: select cards, preview, confirm, resolve | Turn flow works correctly | 017, 019 |
| R1.5 | Result phase: ACCESS GRANTED or ACCESS DENIED with score | Win/loss display with recap | 020 |

### From R2: Dealt Hand (6 cards)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | Players receive exactly 6 evidence cards | Hand has 6 cards | 017 |
| R2.2 | Cards are dealt, not drafted (no selection) | No draft UI, cards appear dealt | 017 |
| R2.3 | Same 6 cards for all players on same daily | Deterministic dealing from puzzle seed | 021 |

### From R3: SUBMIT Action

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | Player can select 1-3 cards | Selection enforces 1-3 card limit | 018, 019 |
| R3.2 | Preview shows: expected damage, concerns addressed, contradictions, KOA response | Preview renders before confirm | 019 |
| R3.3 | Confirm executes resolution | Submit triggers resolver | 019 |
| R3.4 | Cards move to committed story after submission | Submitted cards visible in story timeline | 017 |
| R3.5 | Turn counter decrements | Turns decrease after each submit | 017 |

### From R4: Concerns System

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R4.1 | Puzzle has 2-4 proof requirements (Concerns) | Puzzle schema includes concerns array | 002, 011 |
| R4.2 | Each Concern requires specific proof type(s) | Concern has requiredProof field | 002 |
| R4.3 | Cards with matching `proves` field address Concerns | Card proves IDENTITY addresses IDENTITY concern | 008 |
| R4.4 | Addressed Concerns are visually marked | UI shows filled vs unfilled concern chips | 017 |
| R4.5 | Win requires ALL Concerns addressed | Win condition checks all concerns fulfilled | 009 |

### From R5: Counter-Evidence System

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R5.1 | KOA has 2-3 counter-evidence cards per puzzle | Puzzle schema includes counters array | 002, 011 |
| R5.2 | Each counter targets specific proof type(s) | Counter has targets field | 002 |
| R5.3 | Counter applies 50% contested penalty to matching cards | ceil(power * 0.5) when targeted | 006 |
| R5.4 | Counters visible in FULL mode, hidden in HIDDEN mode | UI toggle for counter visibility | 017 |
| R5.5 | Counter application recorded in event log | COUNTER_APPLIED event emitted | 009 |

### From R6: Refutation Cards

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R6.1 | Some evidence cards can refute specific counters | Card has refutes field | 002 |
| R6.2 | Refutation nullifies counter's penalty | Counter marked refuted, penalty removed | 007 |
| R6.3 | Refuted counter restores full damage to affected cards | Damage recalculated without penalty | 007 |
| R6.4 | Refutation is permanent for the run | Counter stays refuted | 007, 009 |
| R6.5 | Grudging acceptance bark on successful refutation | Voice selection includes refutation outcome | 024 |

### From R7: Contradiction Detection

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R7.1 | Cards in committed story have claims (location, time, state) | Card schema includes claims | 002 |
| R7.2 | MINOR contradiction: suspicious but allowed (+1 scrutiny) | Scrutiny increments, move proceeds | 004, 010 |
| R7.3 | MAJOR contradiction: impossible combination, blocked | Submission rejected, no state change | 004 |
| R7.4 | Time gap check: ASLEEP→AWAKE in <3min = MAJOR | Specific test for state transitions | 004 |
| R7.5 | Location check: HOME→GYM in <20min = MAJOR | Specific test for location transitions | 004 |
| R7.6 | Contradiction warning in UI (MINOR: yellow, MAJOR: red) | Visual feedback before/during submission | 019 |

### From R8: Corroboration Bonus

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R8.1 | 2+ cards sharing a claim get 25% bonus | ceil(total * 1.25) when claims match | 005 |
| R8.2 | Claims to check: location, state, activity | Match on any shared claim qualifies | 005 |
| R8.3 | Corroboration indicator in UI | Visual feedback when bonus applies | 019 |

### From R9: Scrutiny System

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R9.1 | Scrutiny is integer 0-5 | State tracks scrutiny as int | 002, 009 |
| R9.2 | Starts at 0 each puzzle | Initial state has scrutiny = 0 | 009 |
| R9.3 | MINOR contradiction adds +1 scrutiny | Scrutiny increments on minor | 010 |
| R9.4 | Scrutiny 5 = instant loss | Game ends immediately at 5 | 009, 010 |
| R9.5 | Scrutiny visible in HUD | UI shows current scrutiny level | 017 |

### From R10: Pack Loading

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R10.1 | Puzzle Pack contains puzzles, cards, counters, concerns | Pack schema defined | 011 |
| R10.2 | Voice Pack contains barks keyed by OutcomeKey | Pack schema defined | 011 |
| R10.3 | Pack validated on load (schema, references) | Invalid pack fails closed | 012 |
| R10.4 | Pack cached by content hash | Same hash = skip fetch | 014 |
| R10.5 | Run binds to manifest, no mid-run swap | Manifest pinned at run start | 021 |

### From R11: KOA Voice/Barks (P1)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R11.1 | Voice lines selected by OutcomeKey | Deterministic selection | 024 |
| R11.2 | 8 mood states supported | NEUTRAL → SMUG mood enum | 002, 023 |
| R11.3 | Voice never blocks mechanics (<120ms) | Async voice, instant resolution | 024 |
| R11.4 | Missing bark falls back to generic tier | No crash on missing key | 024 |

### From R12: Offline Support (P1)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R12.1 | Service Worker caches app shell | App loads offline | 014 |
| R12.2 | Packs cached in IndexedDB | Packs available offline | 013, 014 |
| R12.3 | Resume works after app restart | State restored from events | 022 |
| R12.4 | Daily loads from cache if available | Offline daily works | 021 |

### From R13: Share Card (P1)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R13.1 | Wordle-style result sharing | Copy/share text result | 028 |
| R13.2 | Shows: date, win/loss, turns, score | All metrics in share text | 028 |

### From R14: Basic Telemetry (P1)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R14.1 | RUN_STARTED event | Logged on run start | 029 |
| R14.2 | TURN_SUMMARY event | Logged each turn | 029 |
| R14.3 | RUN_ENDED_SUMMARY event | Logged on run end | 029 |
| R14.4 | Telemetry opt-out supported | Setting disables telemetry | 029 |

---

## Phases

### Phase 1: Foundation

**Goal:** Project scaffolding, core types, basic resolver

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| 001 | Monorepo Setup | done | - |
| 002 | Domain Types | backlog | 001 |
| 003 | Basic Damage Calculation | backlog | 002 |

### Phase 2: Game Engine

**Goal:** Complete resolver with all D31 mechanics

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| 004 | Contradiction Detection | backlog | 002 |
| 005 | Corroboration Bonus | backlog | 003 |
| 006 | Counter-Evidence and Contested Penalty | backlog | 003 |
| 007 | Refutation Mechanics | backlog | 006 |
| 008 | Concern Fulfillment Tracking | backlog | 002 |
| 009 | Event System and State Derivation | backlog | 002 |
| 010 | Scrutiny System | backlog | 004, 009 |

### Phase 3: Content System

**Goal:** Pack loading, validation, persistence

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| 011 | Pack Schemas | backlog | 002 |
| 012 | Pack Validation | backlog | 011 |
| 013 | IndexedDB Persistence | backlog | 009 |
| 014 | Service Worker and Pack Caching | backlog | 012, 013 |

### Phase 4: UI Layer

**Goal:** Playable game on screen

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| 015 | Zustand Stores | backlog | 009 |
| 016 | Home Screen | backlog | 001 |
| 017 | Run Screen (HUD, Hand, Story) | backlog | 015, 018 |
| 018 | Evidence Card Component | backlog | 002 |
| 019 | Submit Flow with Preview | backlog | 003, 004, 005, 006, 017 |
| 020 | Result Screen | backlog | 009 |

### Phase 5: Integration

**Goal:** Daily flow, offline, polish

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| 021 | Daily Puzzle Fetching | backlog | 012, 014 |
| 022 | Resume Support | backlog | 013, 015 |
| 023 | KOA Avatar and Moods | backlog | 002 |
| 024 | Voice Bark Integration | backlog | 011, 023 |

### Phase 6: Content and Polish

**Goal:** Ship-ready content and UX

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| 025 | Puzzle Templates (7+) | backlog | 012 |
| 026 | Voice Pack | backlog | 024 |
| 027 | Tutorial Flow | backlog | 017, 025 |
| 028 | Share Card | backlog | 020 |
| 029 | Telemetry | backlog | 009 |

---

## Dependency Graph

**Required.** Show task dependencies visually.

```
Phase 1 (Foundation):
001 ──→ 002 ──→ 003

Phase 2 (Game Engine):
002 ──→ 004 ──┐
         │   │
002 ──→ 008  │
         │   │
002 ──→ 009 ─┼──→ 010
             │
003 ──→ 005  │
         │   │
003 ──→ 006 ─┴──→ 007

Phase 3 (Content):
002 ──→ 011 ──→ 012 ──┐
                      ├──→ 014
009 ──→ 013 ──────────┘

Phase 4 (UI):
001 ──→ 016
009 ──→ 015 ──┐
              ├──→ 017 ──→ 019
002 ──→ 018 ──┘
              │
009 ─────────→ 020

Phase 5 (Integration):
012, 014 ──→ 021
013, 015 ──→ 022
002 ──→ 023 ──→ 024
011 ─────────→ 024

Phase 6 (Content & Polish):
012 ──→ 025 ──┐
              ├──→ 027
017 ─────────┘
024 ──→ 026
020 ──→ 028
009 ──→ 029
```

---

## Batch Analysis

**Required.** Group tasks into implementation batches. Tasks in the same batch have no mutual dependencies.

| Batch | Tasks | Blocked By | Notes |
|-------|-------|------------|-------|
| 1 | 001 | - | Monorepo scaffolding, can start immediately |
| 2 | 002, 016 | 001 | Domain types + Home screen (independent) |
| 3 | 003, 004, 008, 009, 011, 018, 023 | 002 | Core resolver pieces + UI components (parallel) |
| 4 | 005, 006, 010, 012, 013, 015 | Batch 3 | Damage modifiers, validation, persistence, stores |
| 5 | 007, 014, 017, 020, 029 | Batch 4 | Refutation, caching, main screens, telemetry |
| 6 | 019, 021, 022, 024, 025 | Batch 5 | Submit flow, daily service, resume, voice |
| 7 | 026, 027, 028 | Batch 6 | Voice pack, tutorial, share card |

**Batch size guidance:** 2-7 tasks per batch. Batch 3 is large but tasks are independent and can be parallelized.

---

## Task Summary

| ID | Name | Complexity | Status | Phase |
|----|------|------------|--------|-------|
| 001 | Monorepo Setup | M | done | 1 |
| 002 | Domain Types | M | backlog | 1 |
| 003 | Basic Damage Calculation | S | backlog | 1 |
| 004 | Contradiction Detection | M | backlog | 2 |
| 005 | Corroboration Bonus | S | backlog | 2 |
| 006 | Counter-Evidence and Contested Penalty | S | backlog | 2 |
| 007 | Refutation Mechanics | S | backlog | 2 |
| 008 | Concern Fulfillment Tracking | S | backlog | 2 |
| 009 | Event System and State Derivation | M | backlog | 2 |
| 010 | Scrutiny System | S | backlog | 2 |
| 011 | Pack Schemas | M | backlog | 3 |
| 012 | Pack Validation | M | backlog | 3 |
| 013 | IndexedDB Persistence | M | backlog | 3 |
| 014 | Service Worker and Pack Caching | M | backlog | 3 |
| 015 | Zustand Stores | M | backlog | 4 |
| 016 | Home Screen | S | backlog | 4 |
| 017 | Run Screen (HUD, Hand, Story) | M | backlog | 4 |
| 018 | Evidence Card Component | S | backlog | 4 |
| 019 | Submit Flow with Preview | M | backlog | 4 |
| 020 | Result Screen | S | backlog | 4 |
| 021 | Daily Puzzle Fetching | M | backlog | 5 |
| 022 | Resume Support | S | backlog | 5 |
| 023 | KOA Avatar and Moods | S | backlog | 5 |
| 024 | Voice Bark Integration | S | backlog | 5 |
| 025 | Puzzle Templates (7+) | M | backlog | 6 |
| 026 | Voice Pack | S | backlog | 6 |
| 027 | Tutorial Flow | M | backlog | 6 |
| 028 | Share Card | S | backlog | 6 |
| 029 | Telemetry | S | backlog | 6 |

**Totals:** 29 tasks (11 Medium, 18 Small)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Contradiction rules too complex | Medium | High | Start with simple time/location, add complexity incrementally |
| Pack validation too slow | Low | Medium | Lazy validation, cache validation results |
| Determinism bugs across platforms | Medium | High | Golden fixtures, CI tests on multiple platforms |
| Puzzle balance issues | Medium | Medium | Solver tool to verify paths, playtesting |
| Service Worker complexity | Medium | Low | Use Workbox, follow proven patterns |

---

## Open Questions

| Question | Status | Answer |
|----------|--------|--------|
| Package manager (npm/pnpm/bun)? | Open | TBD by implementer |
| Initial puzzle content author? | Open | Need content owner |
| KOA bark content author? | Open | Need content owner |
| Testing on which mobile devices? | Open | TBD |

---

## References

- `docs/D24-VERTICAL-SLICE-DOD-MVP.md` - MVP definition
- `docs/D31-ADVERSARIAL-TESTIMONY-DESIGN.md` - Core mechanics
- `_process/project/ARCHITECTURE.md` - System structure
- `_process/project/INVARIANTS.md` - Non-negotiable rules
- `_process/project/PATTERNS.md` - Coding conventions
