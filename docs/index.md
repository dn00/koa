# Home Smart Home — Doc Set v2 (D31 Aligned)

**Last Updated:** 2026-01-26
**Mode:** Option B — Daily Puzzle (Single-Puzzle MVP with Adversarial Testimony)

---

## Doc Contract (to prevent drift)

- Every doc must have: file name matches H1 title, "Last Updated", "Depends On" (implicit via cross-refs)
- Doc header ID (e.g., `# D04 — ...`) is authoritative; filename is derived
- Index is validated against doc headers

---

## Terminology mapping (D31 aligned)

| Player term (Daily) | Internal term | Freeplay term |
|---------------------|---------------|---------------|
| Resistance | `resistance` | Gate Strength |
| "Prove you're..." | `concern` | Gate |
| KOA's Challenge | `counter_evidence` | Counter-Evidence |
| Explanation | `refutation` | Refutation |
| Stories Align | `corroboration` | Corroboration |
| Disputed | `contested` | Contested |
| Your Story | `committed_story` | Committed Story |
| Submit | `submit` | Inject |
| Evidence | `evidence_card` | Artifact |
| Progress | `damage` | Damage |
| Scrutiny | `scrutiny` | Scrutiny |

**Removed from Daily mode (D31):**
- Draft (players dealt 6 cards)
- SCAN (no reserve mechanic)
- Audit (scrutiny 5 = instant loss)

---

## 0) Product and architecture "north star" (ship-blocking)

**D00 — BLUEPRINT-v0.2.md**
Canonical product/game design overview. Defines pillars, modes, core loop, constraints, pack-first servicing, LLM contract.

**D01 — NON-GOALS & SCOPE GUARDRAILS.md**
Explicit exclusions (no realtime multiplayer, no LLM adjudication, no pay-to-win, etc.) and MVP boundaries.

---

## 1) Game design core — "Physics" (ship-blocking)

**D31 — ADVERSARIAL TESTIMONY DESIGN v1.md** ⭐ CANONICAL
The core gameplay loop. Dealt 6 cards (no draft), KOA's visible counter-evidence, refutation mechanics, contradictions (MINOR/MAJOR), corroboration bonuses. **This is the source of truth for core mechanics.**
Confidence: 9.5/10.

**D31-INVARIANTS.md**
Non-negotiable requirements and constraints. Reference before making design changes.

~~**D30 — LITE CROSS-EXAM SYSTEM SPEC v1.md**~~ **SUPERSEDED by D31 (archived)**

**D02 — GAME LOOP & RUN STRUCTURE.md**
Mode split: Daily (single-puzzle, SUBMIT only) vs Freeplay (deferred). Daily phases: Lock→Play→Result. Updated for D31.

**D03 — DETERMINISTIC RESOLVER SPEC.md**
The "physics." State model (resistance, Scrutiny, Concerns, Counters), resolution pipeline, damage formula, and output contract.

**D04 — CONCERNS & COUNTER-EVIDENCE LIBRARY v2.md**
Concern taxonomy (5 standard), Counter-Evidence definitions, Refutation cards. Updated for D31.

**D04A — GAME STATE & EVENT MODEL v2.md**
Event-sourced runtime model; D31 event types (COUNTER_EVIDENCE_PLAYED, CONTRADICTION_DETECTED, etc.); replay contract.

**D05 — MOVES & TOKENS SPEC v1.md**
Mode split: Daily (SUBMIT only, no tokens) vs Freeplay (6 moves + Ops Tokens). Damage formula, scrutiny rules.

**D06 — CORE GAME LOOP UX v2.md**
Player-facing loop and client state machine; screens (Home, Run, Results); D31 UI elements (counter panel, committed story, contradiction warnings, KOA mood states).

**D07 — BOSSES & MODIFIERS LIBRARY v1.md**
Boss modifier taxonomy. Freeplay-only content.

---

## 2) Content system and servicing (ship-blocking)

**D08 — PACK SYSTEM OVERVIEW v2.md**
Pack types (Puzzle/Evidence/Voice), versioning, compatibility, pre-generated testimony (41 combinations). Updated for D31.

**D09 — PACK SCHEMAS (JSON) v2.md**
D31 schemas: EvidenceCard, CounterEvidence, RefutationCard, Concern, Puzzle. Enums: ProofType, LocationValue, StateValue, KoaMoodState.

**D10 — PACK VALIDATION & SOLVABILITY CHECKS v2.md**
D31 solvability: all concerns addressable, multiple winning paths, no forced MAJOR contradictions. Updated for fixed-hand model.

**D11 — INCIDENT GENERATION PIPELINE.md**
Procedural assembly. Freeplay content (deferred).

---

## 3) LLM contract and voice (ship-blocking)

**D12 — KOA VOICE SYSTEM (BARKS) v1.md**
OutcomeKey design, bark selection, 8 mood states (NEUTRAL, CURIOUS, SUSPICIOUS, BLOCKED, GRUDGING, IMPRESSED, RESIGNED, SMUG), repetition avoidance.

**D13 — LLM USAGE POLICY & PROMPT CONTRACTS.md**
What LLM does (offline generation of testimony combinations), privacy stance, safety constraints.

---

## 4) UX/UI specs (ship-blocking)

**D14 — UX WIREFRAME SPEC (MOBILE-FIRST) v2.md**
Screen-by-screen flows: run start, play, win/loss. D31 elements: counter panel, committed story, contradiction modals, corroboration indicators, KOA mood states. No draft screen.

**D15 — UI COPY & LEXICON (JAILBREAK TONE) v2.md**
D31 terminology table, banned words, UI labels, tone guidelines. KOA (not AURA). No courtroom language.

**D16 — GAME FEEL: ANIMATION, HAPTICS, SFX.md**
Timing rules, animation beats, sound cues.

**D27 — VISUAL STYLE SPEC v1.md**
Visual design system; KOA avatar states.

**D28 — END-GAME UI SPEC v2.md**
Daily run screen layout: Resistance bar, Concern chips, SUBMIT button, Evidence carousel. KOA Presence rendering (8 states). D31 elements: counter panel, committed story, contradiction warnings.

---

## 5) Engineering implementation docs (ship-blocking)

**D17 — CLIENT ARCHITECTURE (PWA) v1.md**
Front-end stack, state management, offline caching, pack loading, performance budgets.

**D18 — BACKEND MINIMUM (Packs + Daily Seed) v1.md**
CDN strategy, pack manifest, daily API, telemetry events.

**D19 — DATA MODELS & STORAGE.md**
Run logs, local persistence, pack cache, settings.

**D20 — SECURITY & ANTI-TAMPER (BASIC) v1.md**
Integrity checks, pack signing.

---

## 6) QA and operations (ship-blocking)

**D21 — TEST PLAN & FIXTURES v2.md**
D31 fixtures: contradiction detection, counter-evidence, refutation, corroboration, concern fulfillment, damage formula. Golden replays for fixed-hand puzzles. No draft RNG fixtures.

**D22 — TELEMETRY & BALANCING DASHBOARD.md**
What metrics you capture (win rate, scrutiny, contradiction rate), thresholds.

**D23 — RELEASE & VERSIONING POLICY.md**
Semantic versioning for packs vs client, migration strategy.

---

## 7) MVP definition (ship-blocking)

**D24 — VERTICAL SLICE DoD (MVP) v2.0.md**
Daily MVP: single-puzzle (~5 min), 5 concerns, 6 dealt cards, SUBMIT only, D31 mechanics (contradiction, counter, refutation, corroboration), KOA's 8 mood states, share card. Freeplay deferred.

---

## 8) Progression and replayability (post-MVP / Freeplay)

**D25 — PROGRESSION & COMPLETION SYSTEM v1.md**
Starter Kits, Codex completion, Mastery Challenges. Freeplay content.

**D26 — REPLAYABILITY EXTENSIONS v1.md**
Daemons, Synergy Hooks. Freeplay content.

---

## 9) Player-facing documentation (ship-blocking)

**D29 — PLAYER-FACING RULES CARD (Daily Puzzle Contract) v2.md**
D31 rules: single-puzzle, 6 dealt cards, SUBMIT only, concerns + counter-evidence + refutation + corroboration, scrutiny 0-5 (5 = loss). No draft, no SCAN, no audit.

---

## 10) Later (explicitly out of current scope)

**D90 — MULTIPLAYER & SOCIAL SYSTEMS.md** (deferred)
**D91 — CREATOR WORKSHOP & MARKETPLACE.md** (deferred)
**Freeplay Mode** (deferred to post-MVP)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1 | 2026-01-25 | Initial doc set |
| v2 | 2026-01-26 | D31 alignment: AURA→KOA, "Life with AURA"→"Home Smart Home", Daily mode simplification (no draft, no SCAN, no audit), D31 mechanics integration |
