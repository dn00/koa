# Life with AURA — Doc Set v1 (Numbered for trackability)

**Last Updated:** 2026-01-26
**Mode:** Option B — Daily Draft (Single-Incident MVP)

---

## Doc Contract (to prevent drift)

- Every doc must have: file name matches H1 title, "Last Updated", "Depends On" (implicit via cross-refs)
- Doc header ID (e.g., `# D04 — ...`) is authoritative; filename is derived
- Index is validated against doc headers

---

## Terminology mapping (Option B)

| Player term (Daily) | Internal term | Freeplay term |
|---------------------|---------------|---------------|
| Resistance | `lock_strength` | Gate Strength |
| Protocol | `gate` | Gate |
| Submit | `inject` | Inject |
| Scan | `cycle` | Cycle |
| Evidence | `artifact` | Artifact |
| Compliance | `damage` | Damage |

---

## 0) Product and architecture "north star" (ship-blocking)

**D00 — BLUEPRINT-v0.2.md**
Canonical product/game design overview. Defines pillars, modes, core loop, constraints, pack-first servicing, LLM contract.

**D01 — NON-GOALS & SCOPE GUARDRAILS.md**
Explicit exclusions (no realtime multiplayer, no LLM adjudication, no pay-to-win, etc.) and MVP boundaries.

---

## 1) Game design core — "Physics" (ship-blocking)

**D31 — ADVERSARIAL TESTIMONY DESIGN v1.md** ⭐ NEW
The core gameplay loop. Dealt 6 cards (no draft), AURA's visible counter-evidence, refutation mechanics, soft contradictions (MINOR/MAJOR), corroboration bonuses. Supersedes D30. Confidence: 9.5/10.

**D31-INVARIANTS.md**
Non-negotiable requirements and constraints. Reference before making design changes.

**D02 — GAME LOOP & RUN STRUCTURE.md**
Mode split: Daily (single-incident, SUBMIT/SCAN) vs Freeplay (3-incident ladder, 6 moves). Daily phases: Lock→Draft→Solve→Result. Freeplay: Recon→Build→Inject→Adapt loop with Cache/Shop between acts.

**D03 — DETERMINISTIC RESOLVER SPEC.md**
The "physics." State model (lock_strength, Scrutiny, Active Gates), resolution pipeline, compliance formula, audit triggers, and output contract. Serves both Daily and Freeplay modes.

**D04 — GATES & COUNTER-SETS LIBRARY v1.md**
Gate taxonomy (10 gates) with 2–4 counter paths each; strictness rules; edge cases. Internal term "gate" = player term "protocol".

**D04A — GAME STATE & EVENT MODEL.md**
Event-sourced runtime model; event types (RUN_STARTED, MOVE_RESOLVED, etc.); chain hashing; replay contract.

**D05 — MOVES & TOKENS SPEC v1.md**
Mode split: Daily (SUBMIT + SCAN only, no tokens) vs Freeplay (6 moves + Ops Tokens). Compliance formula, resonance, scrutiny rules, audit mechanics.

**D06 — CORE GAME LOOP UX.md**
Player-facing loop and client state machine; screens (Home, Run, Cache, Results); tap-to-attach interaction; instant mechanics with non-blocking voice; "Why it worked" explainability.

**D07 — BOSSES & MODIFIERS LIBRARY v1.md**
Boss modifier taxonomy (6 modifiers); effects on moves and gates; stacking rules; audit modifiers. Freeplay-only content.

---

## 2) Content system and servicing (ship-blocking)

**D08 — PACK SYSTEM OVERVIEW.md**
Pack types (Protocol/Incident/Voice/Artifact-Tool), versioning, compatibility rules, "fail closed" loading, and rollout strategy.

**D09 — PACK SCHEMAS (JSON) v1.md**
Concrete JSON schemas for each pack type + examples. Contains authoritative definitions for Artifacts/Tools schema. Includes Impact field for Daily compliance formula.

**D10 — PACK VALIDATION & SOLVABILITY CHECKS.md**
Deterministic validation suite: solvability, dominance heuristics, pacing checks (audit frequency), size constraints. Daily draft constraints.

**D11 — INCIDENT GENERATION PIPELINE.md**
Procedural assembly from templates; seeding rules; weekly scheduling; themes/subthemes; CLI tooling. Daily single-incident vs Freeplay 3-act.

---

## 3) LLM contract and voice (ship-blocking)

**D12 — AURA VOICE SYSTEM (BARKS) v1.md**
OutcomeKey design, bark selection algorithm, repetition avoidance, fallback tiers, profanity/brand rules.

**D13 — LLM USAGE POLICY & PROMPT CONTRACTS.md**
Exactly what LLM is allowed to do (offline generation, optional enhanced runtime voice), privacy stance, and safety constraints.

---

## 4) UX/UI specs (ship-blocking)

**D14 — UX WIREFRAME SPEC (MOBILE-FIRST).md**
Screen-by-screen flows: run start, draft, submit, audit, victory/loss, recap, codex.

**D15 — UI COPY & LEXICON (JAILBREAK TONE).md**
Canonical vocabulary table + banned words list ("verdict," "inadmissible," etc.), UI labels, tone guidelines. Player terminology (Resistance, Protocol, Submit, Scan).

**D16 — GAME FEEL: ANIMATION, HAPTICS, SFX.md**
Timing rules (instant mechanics, delayed voice), animation beats, sound cues, accessibility considerations.

**D27 — VISUAL STYLE SPEC v1.md**
Visual design system; color tokens; typography; iconography; card templates; AURA avatar states; glitch rules.

**D28 — END-GAME UI SPEC v1.md**
Daily run screen layout: Resistance bar, Protocol chips, SUBMIT/SCAN buttons, Evidence carousel. AURA Presence rendering (Orb/Lens, 6 states). Freeplay UI notes (Ops Strip, Tokens). Explainability panel; Daily fairness indicators.

---

## 5) Engineering implementation docs (ship-blocking)

**D17 — CLIENT ARCHITECTURE (PWA) v1.md**
Front-end stack, state management, offline caching, pack loading, rendering, performance budgets.

**D18 — BACKEND MINIMUM (Packs + Daily Seed) v1.md**
CDN strategy, pack manifest, daily API, telemetry events, weekly schedule delivery.

**D19 — DATA MODELS & STORAGE.md**
Run logs, local persistence (IndexedDB), pack cache, settings, codex, archive.

**D20 — SECURITY & ANTI-TAMPER (BASIC) v1.md**
For non-competitive modes: integrity checks, pack signing, tiered trust model.

---

## 6) QA and operations (ship-blocking)

**D21 — TEST PLAN & FIXTURES.md**
Resolver tests, gate/counter-set unit tests, pack validation tests, golden-run fixtures, regression harness, CI gates.

**D22 — TELEMETRY & BALANCING DASHBOARD.md**
What metrics you capture (win rate, audit rate, dead hand rate), thresholds, and how you use them to tune packs.

**D23 — RELEASE & VERSIONING POLICY.md**
Semantic versioning for packs vs client, content lifecycle states, migration strategy, deprecation rules.

---

## 7) MVP definition (ship-blocking)

**D24 — VERTICAL SLICE DoD (MVP) v2.0.md**
Daily MVP: single-incident puzzle (~5 min), 10 protocols, 20+ evidence cards, Draft 6 of 12, SUBMIT/SCAN actions, compliance formula (Impact × Resonance, cap 30), Scrutiny 0-5, Audit at 5, par medals, share card. Freeplay (3-act ladder, 6 moves, Ops Tokens) preserved for post-MVP.

---

## 8) Progression and replayability (post-MVP)

**D25 — PROGRESSION & COMPLETION SYSTEM v1.md**
Starter Kits (Balatro-like decks), Codex/Registry completion, Mastery Challenges, Firmware Levels (difficulty ladder), meta currencies, monetization guardrails. Freeplay content.

**D26 — REPLAYABILITY EXTENSIONS (Daemons & Synergy Hooks) v1.md**
Daemons (run modifiers/relics), Synergy Hooks (deterministic combos), content volume targets for Balatro-grade longevity. Freeplay content.

---

## 9) Player-facing documentation (ship-blocking)

**D29 — PLAYER-FACING RULES CARD (Daily Puzzle Contract) v2.md**
Option B Daily rules: single-incident, Draft 6 of 12, SUBMIT + SCAN only, Compliance formula (Impact × Resonance, cap 30), Scrutiny 0-5, Audit at 5, Quarantine. No Ops Tokens in Daily. Terminology mapping, worked example, share card format.

---

## 10) Later (explicitly out of current scope)

**D90 — MULTIPLAYER & SOCIAL SYSTEMS.md** (deferred)
**D91 — CREATOR WORKSHOP & MARKETPLACE.md** (deferred)
