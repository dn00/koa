# Status: Project PARANOIA

**Last Updated:** 2026-02-05

---

## Current Phase

**V1 Complete. V2 in planning.**

V1 delivers the core loop (propose/score/commit, event-driven suspicion, pacing arbiter, 2-meter UI, crew investigation, VERIFY counterplay). All balanced and working.

V2 completes the game as described in CORE_FANTASY.md by filling three design gaps — lies exposed by reality (not just investigation), suspicion-aware pressure shifting, and proactive honest communication with mechanical cost. After V2, all three CORE_FANTASY pillars are fully wired and the choice architecture is complete.

---

## Design Alignment (Discovery Findings)

The V1 implementation faithfully delivers the core loop from the design docs (paranoia.md, CORE_FANTASY.md). Three gaps remain before the game matches the design vision:

### Gap 1: Lies only fail via investigation, not reality (Pillar 1 incomplete)
**Current:** Tampering leaves evidence records. Crew may investigate terminals and find them. If nobody looks, lies succeed for free.
**Design intent:** Reality itself should expose lies — crew walks into the fire you suppressed, nobody responds to the spoof you faked, the person you fabricated against has an alibi.
**Solution:** TAMPER_BACKFIRE_DESIGN.md — TamperOp lifecycle, backfire triggers, coming-clean mechanic, targeted VERIFY via ActiveDoubts, suspicion ledger.

### Gap 2: Pressure doesn't shift with suspicion (pacing incomplete)
**Current:** Director spawns crises based on boredom/tension. At high suspicion, physical crises keep stacking, causing "RNG crisis spam → UNPLUGGED" with no counterplay.
**Design intent:** As suspicion rises, pressure should shift from physical challenges to social/epistemic pressure, giving the player VERIFY opportunities and trust-management gameplay.
**Solution:** DIRECTOR_PRESSURE_MIX.md — three pressure channels (physical/social/epistemic), suspicion-band weighted selection, social events (loyalty tests, confrontations), epistemic events (sensor conflicts, doubt voiced).

### Gap 3: Truth-telling has no mechanical cost (Pillar 2 missing)
**Current:** No way to proactively communicate with crew about crises. Truth is neutral — the player can lie in various ways but can't choose *how to be honest*.
**Design intent:** "FIRE IN CARGO. EVACUATE." → crew panics, abandons cargo, quota suffers. But they trust you. Every crisis should present truth / downplay / suppress / blame with real tradeoffs.
**Solution:** Announce/Downplay verb (not yet designed). Proactive honest communication that has mechanical consequences (stress, work stoppage, trust gain).

---

## V2 Roadmap

### Core V2 (Completes the game)

| # | Feature | Design Doc | Status | Fills Gap |
|---|---------|------------|--------|-----------|
| 1 | **Tamper Backfire** | `TAMPER_BACKFIRE_DESIGN.md` | Planning | Gap 1 |
| 2 | **Director Pressure Mix** | `DIRECTOR_PRESSURE_MIX.md` | Not started | Gap 2 |
| 3 | **Announce/Downplay Verb** | Not yet designed | Not started | Gap 3 |

### Polish (After core V2)

| Feature | Priority | Description |
|---------|----------|-------------|
| Player Visibility Gaps | High | Path blockage display, quota tracker, recovery ETA |
| Suspicion Ledger UI | High | End-of-day recap, STATUS command shows recent changes |
| Forensics/Replay | Medium | Post-game truth vs perception timeline reveal |
| Win Condition Polish | Medium | Victory/defeat screens, ending types, score breakdown |
| Dead Code Cleanup | Low | Remove legacy `src/engine/`, delete commented-out code |

### Out of Scope (expansion content, not core game)

- Multiplayer / Jackbox mode (paranoia.md S9)
- Scenario packs: The Thing, Company Orders, Memory Corruption (CORE_FANTASY.md)
- Corporate directives / external pressure axis
- Visual/audio horror layer
- Natural language crew interface ("Turing Interface")

---

## V1 Completion (All Done)

- [x] Truth/Perception kernel (propose/score/commit)
- [x] 6 crisis arc types with multi-step escalation
- [x] Social engine (whispers, rumors, incidents)
- [x] 5 NPC role actions (reset, sabotage, sedate, sacrifice, violence)
- [x] Manipulation verbs (SPOOF, SUPPRESS, FABRICATE) with evidence residue
- [x] AUDIT command wired to evidence system
- [x] Pacing arbiter (per-phase beat tracking)
- [x] 2-meter UI (INTEGRITY + SUSPICION bars)
- [x] Event-driven suspicion (observable outcomes, not timers)
- [x] VERIFY command (active trust-building counterplay)
- [x] Multi-stage reset (whispers → meeting → restrictions → countdown)
- [x] Crew investigation (autonomous audits when suspicious)
- [x] Confidence traffic lights on threat display
- [x] Fabrication cascade (grudge → violence → suspicion spiral)
- [x] Cold open boot sequence
- [x] Bio-monitor with diegetic readouts
- [x] Blackout system (solar flare sensor blindness)
- [x] Dead stat cleanup (sensorIntegrity, crewTrust commented out)

---

## Balance State (V1)

| Mode | SURVIVED | UNPLUGGED | Other |
|------|----------|-----------|-------|
| Smart Solver (w/ VERIFY) | ~93.5% | ~6% | ~0.5% |
| Passive Play | ~59% | ~10% | ~31% |

*Balance targets will shift after V2 — see TAMPER_BACKFIRE_DESIGN.md S8 and DIRECTOR_PRESSURE_MIX.md S10 for expected impact.*

---

## Active Features

### 001-tamper-backfire
**Status:** in-progress (Batches 1-3 done, Batch 4 remaining)
**Plan:** `_process/features/001-tamper-backfire/tamper-backfire.plan.md`

12 tasks in 4 batches:
- **Batch 1** (done): 001 extract crew, 002 extract beliefs, 003 extract physics, 004 types
- **Batch 2** (done): 005 tamperOp creation, 009 suspicion ledger
- **Batch 3** (done): 006 SUPPRESS backfire, 007 SPOOF backfire, 008 FABRICATE backfire, 011 coming clean
- **Batch 4** (ready): 010 ActiveDoubts + VERIFY, 012 ledger display

**Progress:** 10/12 tasks done, 95 tests passing, 0 type errors
