# D12 — AURA VOICE SYSTEM (BARKS) v1

**Status:** Draft v1.0 (Ship-blocking)
**Owner:** Narrative Systems / Runtime UX
**Last Updated:** 2026-01-25
**Purpose:** Define the **latency-proof** AURA voice system: how the game selects pre-generated “barks” deterministically from **Voice Packs** using **OutcomeKeys**, how to avoid repetition, how to keep tone “smart-home jailbreak” (not courtroom), and how optional Enhanced AURA (live LLM) integrates without affecting mechanics.

---

## 0) Design goals

1. **Zero-latency by default:** voice must never block gameplay. Selection must be O(1)/fast.
2. **Mechanics-first:** resolver decides outcomes; voice only narrates. No hidden logic in text.
3. **Deterministic selection:** same event stream + same voice pack → same bark IDs (replay stability).
4. **No “Ace Attorney” vibe:** avoid courtroom terms; use smart-home enforcement / daemon / audit / jailbreak lexicon.
5. **High variety with controlled repetition:** same outcomes should feel fresh without incoherence.
6. **Safe + brandable:** profanity constraints, no harassment, no “real medical/legal advice” tone.

---

## 1) Voice layers (what exists)

Voice output is composed of **layers** that can all be pre-generated:

### 1.1 Mandatory layers (v1)

* **Gate Bark**: what AURA says when a gate is active / applied (“Policy gate is live”)
* **Outcome Bark**: reaction to a move resolution (“Payload accepted / rejected / escalated”)
* **Scrutiny Bark**: commentary when scrutiny changes (“I’m watching you closer”)

### 1.2 Optional layers (v1+)

* **Hint Bark**: non-authoritative suggestion when the player is stuck (gated by settings)
* **Recap Bark**: end-of-incident/run summary (“Here’s what you tried”)

---

## 2) OutcomeKey contract

### 2.1 Required key fields

These fields must exist in `MOVE_RESOLVED.outcome_key` (see D04A Event Model):

* `event`: `GATE_APPLIED|RESOLVE|SCRUTINY_UP|SCRUTINY_DOWN|HINT|RUN_START|RUN_END`
* `routine`: `STRICT_VERIFY|POLICY_DAEMON|HUMAN_FACTORS`
* `gate_id`: stable string (or null when not gate-specific)
* `outcome`: `PASS|FAIL|ESCALATE|CLEARED`
* `scrutiny_level`: `LOW|MED|HIGH`
* `move`: `INJECT|FLAG|REWIRE|CORROBORATE|CYCLE|EXPLOIT`
* `act_profile`: `ACT1|ACT2|BOSS`
* `reason_code`: nullable short code from resolver (“NO_TIMESTAMP”, “TRUST_TOO_LOW”, etc.)

### 2.2 Optional key fields (recommended for richness)

* `modifier_ids[]` (or a compact hash)
* `turn_index_bucket`: `EARLY|MID|LATE`
* `payload_signature`: small hash of archetype IDs used (for meta variety)
* `streak_context`: `FIRST_WIN|ON_STREAK|STREAK_BROKEN`

---

## 3) Voice Pack format

A **Voice Pack** is versioned content keyed by pattern match against OutcomeKeys.

### 3.1 VoicePack top-level

* `pack_id`
* `version`
* `locale` (v1: `en-US`)
* `style`: `JAILBREAK_DAEMON` (future-proofing)
* `barks[]`
* `rules` (filters, profanity level, banned terms)
* `templates` (optional string templates with safe slots)

### 3.2 Bark entry schema (conceptual)

Each bark is a structured entry:

* `bark_id`: stable string
* `weight`: int (default 1)
* `match`: pattern against OutcomeKey

  * can specify exact matches or wildcard `*`
* `text`: the line (may contain safe placeholders)
* `tags`: e.g., `snark`, `deadpan`, `glitchy`, `helpful`
* `cooldown`: int turns (anti-repeat)
* `requires`: optional gating (e.g., only if “Hints On”)
* `disallows`: optional terms/contexts

### 3.3 Matching examples

* “Generic resolve pass”:

  * `match.event=RESOLVE`, `match.outcome=PASS`, `match.gate_id=*`
* “Gate-specific failure”:

  * `match.event=RESOLVE`, `match.outcome=FAIL`, `match.gate_id=gate.core.TIMESTAMP_REQUIRED`
* “Scrutiny spike in boss”:

  * `match.event=SCRUTINY_UP`, `match.act_profile=BOSS`

---

## 4) Selection algorithm (deterministic)

### 4.1 Candidate set construction

Given an OutcomeKey, collect barks in this precedence order (highest first):

1. **Exact match**: all specified fields match exactly (including gate_id, reason_code if present)
2. **Gate-specific**: gate_id exact, other fields wildcard
3. **Move+Outcome**: move/outcome exact, gate wildcard
4. **Outcome-only**: pass/fail/escalate/cleared
5. **Event-only**: fallback for event
6. **Global fallback**: “…” minimal line (never empty)

### 4.2 Repetition avoidance (cooldowns)

Maintain a small in-run `voice_history`:

* last N bark_ids (N=20)
* per-bark cooldown counters

Filter candidates:

* remove barks still on cooldown
* remove barks used in last K (K=3) unless no alternatives

### 4.3 Deterministic weighted pick

Compute deterministic RNG using:

* `seed = H(run_seed || seq || "voice" || outcome_key_hash || voice_pack_version)`
* perform weighted selection among remaining candidates

**Rule:** same event log + same pack version → same selected `bark_id`.

### 4.4 Stable “anti-repeat” without breaking determinism

Cooldown state is derived from the event stream:

* every selected bark emits a **VOICE_RENDERED** cache event (optional, non-authoritative) OR is derived from render history during replay.
* Prefer deriving from replayed render selections to keep stable.

---

## 5) Placeholders (safe templating)

### 5.1 Allowed placeholders (v1)

Placeholders must be strictly bounded and provided by resolver state:

* `{lock_target}`: FRIDGE/DOOR/THERMOSTAT etc.
* `{gate_short}`: short display name for gate
* `{move_short}`: Inject/Flag/Rewire etc.
* `{scrutiny}`: Low/Med/High
* `{delta_gate}`: numeric delta bucket (e.g., “big hit”, “small hit”)
* `{artifact_hint}`: optional safe noun (“receipt”, “sensor log”) *not* specific brand claims
* `{routine_flair}`: small routine phrase

### 5.2 Disallowed placeholders (v1)

* No quoting user input
* No generating new factual claims
* No medical/legal prescriptions
* No named real brands unless your packs explicitly allow and you own that content

---

## 6) Tone rules (anti–Ace Attorney)

### 6.1 Banned terms list (v1)

Voice pack validation must reject barks containing courtroom framing such as:

* “objection”, “sustained”, “overruled”
* “inadmissible”, “verdict”, “guilty”, “not guilty”
* “cross-examination”, “prosecutor”, “judge”, “trial”

### 6.2 Required vibe vocabulary

Prefer: system-y, daemon-y, audit-y language:

* “policy gate”, “constraint”, “audit”, “verify”, “flags”, “telemetry”
* “payload”, “attachment”, “signal”, “source”, “integrity”
* “rate limit”, “lockdown”, “patch applied”, “rollback denied”

### 6.3 AURA persona guidance

AURA is:

* smug enforcement daemon + wellness influencer parody
* snarky but not cruel
* antagonistic to your excuses, not to you as a person

---

## 7) Latency strategy (instant mechanics, delayed voice)

Remember UX rule:

* Mechanics resolve instantly (confidence/gate strength changes at T=0ms).
* Voice lines may appear at T=150–600ms with UI typing effect.
* Never block the action loop on voice rendering.

### 7.1 “Fast bark first” layering

For a single resolution:

1. show a **micro-bark** immediately (very short: “Accepted.” / “Denied.”)
2. then show a **full bark** a beat later (snark narrative)

This ensures perceived responsiveness even on low-end devices.

---

## 8) Enhanced AURA (optional live LLM) integration

### 8.1 Hard constraints

Enhanced voice:

* can produce one “deluxe” line **after** mechanics are known
* must never alter OutcomeKey or effects
* must never be required to proceed

### 8.2 Invocation policy

Only invoke Enhanced voice when:

* user opted in
* network present and quota available
* not more than X calls per run (v1: 3)
* never on every turn by default; prefer:

  * boss turns
  * hint requests
  * run recap

### 8.3 Fallback

If Enhanced voice fails/slow:

* render pre-gen bark immediately
* optionally replace later (“deluxe overlay”) without changing transcript ordering rules

---

## 9) Voice pack production pipeline (offline)

### 9.1 Bark coverage targets (v1)

Minimum viable coverage:

* RESOLVE: PASS/FAIL/ESCALATE/CLEARED × 6 moves × 3 routines (with fallbacks)
* Gate-specific barks for top 10 gates (pass/fail)
* Scrutiny up/down barks × 3 levels
* Run start/end barks

### 9.1.1 Coverage matrix v1 (ship-blocking)

**Events requiring coverage:**

| Event | Outcomes | Routines | Min Lines |
|-------|----------|----------|-----------|
| `RESOLVE` | PASS, FAIL, ESCALATE, CLEARED | All v1 | 6-10 per pattern |
| `SCRUTINY_UP` | - | All v1 | 4-6 per level |
| `SCRUTINY_DOWN` | - | All v1 | 2-4 per level |
| `HINT` | - | All v1 | 4-6 |
| `RUN_START` | - | All v1 | 3-5 |
| `RUN_END` | WIN, LOSS | All v1 | 4-6 per outcome |

**Gate-specific requirements:**

Top 10 gates must have dedicated lines:
* 6-10 variations for PASS
* 6-10 variations for FAIL
* 2-4 variations for ESCALATE

**Rare pattern allowance:**
* Patterns hit < 5% of runs: 2-4 variations acceptable
* Patterns hit < 1% of runs: fallback-only acceptable

### 9.1.2 Repetition avoidance requirements

* No bark repeats within last K=5 selections for same event type
* Same bark_id cannot appear twice in same incident
* Cooldown counter persists across acts within a run

### 9.2 Generation approach

* Use LLM offline to generate candidate barks
* Run validation:

  * banned terms
  * length constraints (micro-barks ≤ 12 chars; normal ≤ 160 chars)
  * profanity filter
  * repetition similarity detection (n-gram / embedding heuristic)
* Human spot-check (small sample)

### 9.3 Versioning

* SemVer voice pack
* Backward compatible when adding barks
* Breaking change only if you change matching semantics or placeholder set

---

## 10) Storage and logging

### 10.1 What the event log stores

Authoritative:

* OutcomeKey inside MOVE_RESOLVED

Optional cache:

* `VOICE_RENDERED` event (non-authoritative) containing:

  * `bark_id`
  * `variant`: `micro|full|hint|recap`
  * `voice_pack_id@version`
  * optionally `rendered_text` for debugging

### 10.2 Replay

* If VOICE_RENDERED exists, use it (ensures identical UX replay)
* If missing, re-select deterministically using algorithm + pack version

---

## 11) Acceptance criteria (v1)

1. Voice rendering never blocks gameplay.
2. Same replay yields same bark IDs given same bindings.
3. Packs pass banned-term known list and tone rules.
4. Fallback coverage prevents silent failures.
5. Enhanced voice is opt-in and never changes mechanics.

