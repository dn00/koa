# Status: Project PARANOIA

**Last Updated:** 2026-02-06

---

## Current Phase

**V2 Features 1-4 complete. Doubt Engine (005) complete — all 8/8 tasks done.**

V1 delivers the core loop. V2 features 1-4 complete the mechanical foundation. Now: the Doubt Engine adds the missing paranoia layer. Playtesting revealed that honest play is always optimal — no temptation to manipulate. Feature 005 fixes this: honest actions witnessed by crew generate doubts, doubts impair cooperation (orders, mining), spread between crew, and accelerate reset. This creates the corruption arc where honest play has a cost, making deception genuinely tempting.

Feature 004 (Systems Bite) adds mechanical teeth: fabrication now produces visible crew drama, reset stages restrict MOTHER, integrity formula reflects room crises, and mining requires calm present miners.

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
| 1 | **Tamper Backfire** | `TAMPER_BACKFIRE_DESIGN.md` | **Done** | Gap 1 |
| 2 | **Director Pressure Mix** | `DIRECTOR_PRESSURE_MIX.md` | **Done** | Gap 2 |
| 3 | **Announce/Downplay Verb** | `CORE_FANTASY.md` Choice Architecture | **Done** | Gap 3 |

### Polish (After core V2)

| Feature | Priority | Description |
|---------|----------|-------------|
| Player Visibility Gaps | High | Path blockage display, quota tracker, recovery ETA |
| ~~Suspicion Ledger UI~~ | ~~High~~ | ~~End-of-day recap, STATUS command shows recent changes~~ (Done — delivered in 001-tamper-backfire Task 012) |
| Forensics/Replay | Medium | Post-game truth vs perception timeline reveal |
| Win Condition Polish | Medium | Victory/defeat screens, ending types, score breakdown |
| Dead Code Cleanup | Low | Remove legacy `src/engine/`, delete commented-out code |

### V3: Doubt Engine (The Paranoia Layer)

| # | Feature | Design Doc | Status | Fills Gap |
|---|---------|------------|--------|-----------|
| 5 | **Doubt Engine v1** | `doubt-engine.plan.md` | **Done** | Temptation layer |

8 tasks in 4 batches. Creates the corruption arc: honest actions → witness doubts → cooperation loss → deception temptation.
- **Batch 1** (done): 001 types + config + helpers
- **Batch 2** (done): 002 witness doubts, 003 narrative backfire, 004 spread + drip
- **Batch 3** (done): 005 doubt burden → cooperation, 006 reset acceleration, 007 crew agency
- **Batch 4** (done): 008 solver adaptation + balance

**Progress:** 8/8 tasks done, 319 total tests passing, 0 type errors
**Balance:** 93.4% solver win rate at 1000 games (target 85-95%)

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

## Balance State

| Mode | SURVIVED | UNPLUGGED | Other |
|------|----------|-----------|-------|
| Smart Solver (w/ Doubt Engine) | ~93.4% | ~6.6% | 0% |
| Smart Solver (pre-doubt) | ~93.5% | ~6% | ~0.5% |
| Passive Play | ~59% | ~10% | ~31% |

*Doubt Engine tuned via Task 008 balance pass: doubtResetWeight=1.5, doubtSpreadChance=45, doubtSuspicionDripPerSeverity=0.7, doubtSuspicionDripCap=4.*

---

## Completed Features

### 001-tamper-backfire
**Status:** done (Integration audit PASS)
**Plan:** `_process/features/001-tamper-backfire/tamper-backfire.plan.md`

12 tasks in 4 batches:
- **Batch 1** (done): 001 extract crew, 002 extract beliefs, 003 extract physics, 004 types
- **Batch 2** (done): 005 tamperOp creation, 009 suspicion ledger
- **Batch 3** (done): 006 SUPPRESS backfire, 007 SPOOF backfire, 008 FABRICATE backfire, 011 coming clean
- **Batch 4** (done): 010 ActiveDoubts + VERIFY, 012 ledger display

**Progress:** 12/12 tasks done, 111 tests passing, 0 type errors

### 004-systems-bite
**Status:** done (Gemini review PASS)
**Plan:** `_process/features/004-systems-bite/systems-bite.plan.md`

4 tasks in 1 batch (all independent):
- **Batch 1** (done): 001 fabricate visible consequences, 002 compliance + reset stage teeth, 003 integrity formula rework, 004 quota requires active mining

**Progress:** 4/4 tasks done, 37 new tests (247 total passing), 0 type errors
