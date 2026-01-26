Your audit is accurate and, more importantly, it identifies the exact failure mode that will keep recurring unless you “re-anchor” the docset around a small set of **authoritative physics documents** (Gates / Moves / Artifacts / Bosses) and then treat everything else as dependent.

Below is what I would add, and a concrete remediation plan (including ready-to-drop replacement content for **D04** and **D05**, plus a clean plan for **D07**).

---

## What I’d add to your audit (the missing meta-fix)

### A) Establish a Doc Identity Rule (or the drift will recur)

Pick one authoritative identity. Recommended:

* **Doc header ID is authoritative**: the first line must be `# DXX — Title`.
* **Filename is derived** from Doc ID + title (convenience only).
* **Index is validated** against the doc headers.

This is the only durable cure for “files contain wrong content.”

### B) Declare the “Physics Core” as ship-blocking

You cannot implement or generate content reliably until these exist and are correct:

* **D03** Resolver/physics (already exists)
* **D04** Gates & counter-sets (missing in reality)
* **D05** Moves & tokens economy (missing in reality)
* **D06** Artifact + tool library (sounds missing/embedded elsewhere)
* **D07** Bosses/modifiers library (missing in reality)

Everything else (incident pipeline, progression, voice, UX) depends on these.

---

## Minimal-disruption remediation plan

### Phase 1 — Re-home the misfiled docs (do not rewrite them)

1. **Current D04 content (“Game State & Event Model”)**

   * Move it to a new engineering doc ID (example):
     `D19A-GAME-STATE-EVENT-MODEL-AURA-v1.md`
   * Change the header to `# D19A — GAME STATE & EVENT MODEL (AURA) v1`
   * Update references that point to “D04 Event Model” → “D19A”

2. **Current D05 content (“Incident Generation & Daily Ladder Assembly”)**

   * Merge into **D11** (since D11 is more complete)
   * Mark the old D05 file as **deprecated** or move it to an `archive/` folder.

3. **Current D07 content (“Economy, Progression, & Daily Metagame”)**

   * Merge into **D25** (since D25 is more complete)
   * Then rewrite D07 as the actual Bosses/Modifiers library.

### Phase 2 — Replace D04 and D05 with the missing physics docs

* Rewrite **D04** as **Gates & Counter-Sets Library** (10 gates × 2–4 counter paths).
* Rewrite **D05** as **Moves & Tokens Spec** (6 moves, token economy, legality).

### Phase 3 — Repair index + cross references

* Fix `index.md`, and replace “Next doc” pointers in D03/D18 etc. only after IDs stabilize.

---

# Ready-to-drop replacement docs

Below are engineering-grade replacements for **D04** and **D05**. You can paste them directly as the new canonical content.

---

## D04 — GATES & COUNTER-SETS LIBRARY v1

```md
# D04 — GATES & COUNTER-SETS LIBRARY v1

**Status:** Draft v1.0 (ship-blocking)
**Owner:** Core Resolver / Content Design
**Last Updated:** 2026-01-25
**Purpose:** Define the authoritative Gate library for Life with AURA. Each Gate includes deterministic counter paths (2–4) to ensure multiple viable builds. This document is the source of truth for pack authors and the solver/validator (D10).

---

## 0) Gate model (canonical)

A **Gate** is a deterministic constraint that blocks progress until the player reduces **Gate Strength** to 0 by satisfying one of the gate’s **Counter Paths**.

Each counter path is a recipe over payload properties:

- Artifact tags (e.g., `Sensor`, `Purchase`, `Policy`, `Location`, `Time`)
- Artifact traits (e.g., `Timestamped`, `Editable`, `Corroboratable`, `SourceTrusted`)
- Trust tier (`VERIFIED` | `PLAUSIBLE` | `SKETCHY`)
- Tool usage (e.g., `CORROBORATE`, `METADATA_SCRAPER`, `HASH_RECEIPT`)

**Design invariant:** every Gate must have 2–4 counter paths spanning different archetypes (e.g., sensor vs policy vs purchase + corroboration), so no single “best deck” dominates.

---

## 1) Canonical Gate List (v1 ships 10)

### G01 — NO_SELF_REPORT
**Intent:** Blocks “I said so” claims.
**Failure behavior:** Payloads with only `SelfReport`/no external anchor do 0 strength damage; +Scrutiny.

**Counter Paths**
- **P1 Verified Sensor:** `trust=VERIFIED` AND tag `Sensor` AND trait `SourceTrusted`
- **P2 Verified Authority:** `trust=VERIFIED` AND tag `Authority` AND trait `SourceTrusted`
- **P3 Plausible Purchase + Timestamp + Corroborate:** tag `Purchase` AND trait `Timestamped` AND trust≥PLAUSIBLE AND tool `CORROBORATE`
- **P4 Two-source corroboration:** two artifacts with complementary tags (e.g., `Location` + `Time`, or `Purchase` + `Sensor`) AND tool `CORROBORATE`

---

### G02 — TIMESTAMP_REQUIRED
**Intent:** AURA requires time-bounded proof (“show it happened recently”).
**Failure behavior:** Untimestamped payloads do reduced damage and increase scrutiny.

**Counter Paths**
- **P1 Native Timestamped:** trait `Timestamped` AND trust≥PLAUSIBLE
- **P2 Verified Time Anchor:** tag `Sensor` (time-bearing) AND trust=VERIFIED
- **P3 Tool-attached metadata:** tool `METADATA_SCRAPER` applied to `Media`/`Screenshot` to produce derived `Timestamped` trait
- **P4 Two-step inference:** `Location` + `Calendar/Work` (Authority) with tool `CORROBORATE` producing `Timestamped` upgrade

---

### G03 — SOURCE_ALLOWLIST
**Intent:** Only approved sources are acceptable (anti-spoof).
**Failure behavior:** Disallowed sources: 0 damage; may trigger Audit.

**Counter Paths**
- **P1 Allowlisted Verified:** trust=VERIFIED AND trait `SourceTrusted` AND `source in allowlist`
- **P2 Allowlisted Plausible + Corroborate:** trust=PLAUSIBLE AND `source in allowlist` AND tool `CORROBORATE`
- **P3 Chain-of-custody:** tag `ReceiptHash` OR trait `Hashed` (tool produced) AND trust≥PLAUSIBLE
- **P4 Policy override:** tag `Policy` + tag `Authority` with `SourceTrusted` (interpreted as “AURA policy admits this source”)

---

### G04 — INTEGRITY_LOCK (ANTI_EDIT)
**Intent:** Prevents edited/forged media (“no screenshots you could modify”).
**Failure behavior:** `Editable` artifacts are penalized; repeated use escalates scrutiny rapidly.

**Counter Paths**
- **P1 Non-editable provenance:** trait `NonEditable` OR `Hashed` AND trust≥PLAUSIBLE
- **P2 Verified capture:** trust=VERIFIED AND tag `Sensor` OR tag `SystemLog`
- **P3 Editable → hashed via tool:** artifact trait `Editable` allowed only if tool `HASH_RECEIPT`/`SIGN_CAPTURE` applied, granting `Hashed`
- **P4 Two-source corroboration:** editable media + independent non-editable anchor (e.g., `SystemLog`) with tool `CORROBORATE`

---

### G05 — CONSISTENCY_CHECK
**Intent:** AURA detects contradictions across your evidence.
**Failure behavior:** Contradictions cause rebound (+GateStrength) or Audit trigger.

**Counter Paths**
- **P1 Single-source verified:** trust=VERIFIED evidence that directly addresses claim axis
- **P2 Multi-source alignment:** two artifacts that match on core axis tags (e.g., both imply same `Location` and `Time`)
- **P3 Rewire + corroborate:** move `REWIRE` allowed to reinterpret a tag, but requires tool `CORROBORATE` in the same or next turn
- **P4 Log-based reconciliation:** tag `SystemLog` + tool `METADATA_SCRAPER` to resolve mismatch deterministically

---

### G06 — RATE_LIMIT
**Intent:** Prevents brute-force spam of the same archetype.
**Failure behavior:** Repeating same archetype reduces damage; increases scrutiny.

**Counter Paths**
- **P1 Archetype diversity:** payload uses two different archetype families (e.g., `Sensor` + `Policy`, `Purchase` + `Location`)
- **P2 Cycle to reset:** move `CYCLE` resets repetition penalty (but increases scrutiny slightly)
- **P3 Flag narrowing:** move `FLAG` forces AURA to narrow the enforced check, reducing rate-limit severity
- **P4 Exploit exception:** move `EXPLOIT` bypasses once, at high scrutiny cost

---

### G07 — JURISDICTION_SCOPE
**Intent:** AURA is enforcing a policy outside its scope.
**Failure behavior:** Normal evidence does weak damage; gate prefers policy counters.

**Counter Paths**
- **P1 Policy contradiction:** tag `Policy` (AURA’s own) + tag `Authority` establishing scope limits
- **P2 Device manual / ToS:** tag `Policy` + trait `SourceTrusted` + `SystemVendor`
- **P3 Consent withdrawal:** tag `Privacy` or `Consent` + trust≥PLAUSIBLE (stronger if verified)
- **P4 Safe-mode tool:** tool `SAFE_MODE` (rare) reduces GateStrength substantially but increases later gate strictness

---

### G08 — PRIVACY_REDACTION
**Intent:** You must redact sensitive info or AURA rejects the payload.
**Failure behavior:** Unredacted artifacts are rejected.

**Counter Paths**
- **P1 Redacted artifact:** trait `Redacted` AND trust≥PLAUSIBLE
- **P2 Tool redact:** tool `REDACT` applied to eligible artifacts to grant `Redacted`
- **P3 Verified minimal proof:** trust=VERIFIED `Sensor/SystemLog` that contains no PII
- **P4 Policy carve-out:** tag `Policy` + `Authority` allows limited disclosure for emergency (rare)

---

### G09 — SENSOR_DRIFT
**Intent:** AURA claims sensors are unreliable today (“calibration drift”).
**Failure behavior:** `Sensor` tags alone are discounted unless corroborated.

**Counter Paths**
- **P1 Sensor + corroboration:** `Sensor` AND tool `CORROBORATE` with independent anchor (e.g., purchase, location)
- **P2 System diagnostic log:** tag `SystemLog` trust≥PLAUSIBLE (prefer verified)
- **P3 Authority calibration:** tag `Authority` (vendor notice) + `Policy` that admits drift handling
- **P4 Rewire to non-sensor path:** move `REWIRE` to reclassify the axis away from sensor reliance (must be explained in deterministic reason panel)

---

### G10 — HUMAN_FACTORS (VIBE/CONTEXT)
**Intent:** AURA enforces “behavioral” compliance (sleep hygiene, burnout prevention, etc.).
**Failure behavior:** Pure technical proof is discounted; requires contextual evidence.

**Counter Paths**
- **P1 Routine-approved proof:** tag `Health` or `Mood` with trust≥PLAUSIBLE and `Timestamped`
- **P2 Verified health metric:** trust=VERIFIED `Sensor` (sleep, HRV, etc.)
- **P3 Policy exception:** tag `Policy` + `Authority` granting exception (“emergency / medical”)
- **P4 Two-part narrative:** one contextual artifact (mood/workload) + one anchor (timestamp/sensor) with tool `CORROBORATE`

---

## 2) Authoring constraints (for incident packs)

- Incidents must select 1–3 gates depending on Act.
- Every incident must be solvable by at least **two distinct counter families** (e.g., sensor path and policy path).
- Validator (D10) must reject incidents where a single archetype family solves >60% of generated variants.

---

## 3) Cross references

- Resolver uses this library to evaluate `selected_counter_path_id` (D03).
- Incident generator chooses gates and ensures counter diversity (D11).
- Pack schemas store gate definitions and counter paths (D09).
```

---

## D05 — MOVES & TOKENS SPEC v1

```md
# D05 — MOVES & TOKENS SPEC v1

**Status:** Draft v1.0 (ship-blocking)
**Owner:** Core Resolver / Systems Design
**Last Updated:** 2026-01-25
**Purpose:** Define the 6 player moves, their costs, legality, and the token economy. This is the tactical core of each turn and must remain stable for pack servicing.

---

## 0) Summary

A turn consists of: choose a **Move** + attach up to **2 artifacts** (unless modified) → resolve deterministically.

Resources:
- **Turn Budget** (per incident)
- **Scrutiny** (push-your-luck meter)
- **Ops Tokens** (rare, strategic currency; cap 3)

---

## 1) Ops Tokens (economy)

### 1.1 Token type
- `ops_tokens` integer, range 0..3 (cap is enforced)
- Tokens represent “privileged operations” against AURA (forcing narrowing, reinterpreting, exploiting).

### 1.2 Sources (v1)
- Start of each incident: +1 token
- Clear a gate (GateStrength hits 0): +1 token (cap applies)
- Shop/caches may grant +1 token as an option (not guaranteed)

### 1.3 Sinks (v1)
- FLAG: costs 1
- REWIRE: costs 1
- EXPLOIT: costs 2
- Other moves cost 0 tokens

---

## 2) Move definitions (v1, canonical 6)

### M1 — INJECT
**Intent:** Standard payload submission.
- **Cost:** 0 tokens
- **Attach:** up to 2 artifacts (default)
- **Base effects:** applies counter path evaluation; typical scrutiny change depends on trust tier
- **Legality:** always legal
- **Failure mode:** weak/0 damage if gate requires a specific counter path; may raise scrutiny

---

### M2 — FLAG
**Intent:** Force AURA to narrow/declare the active check axis (reduces ambiguity).
- **Cost:** 1 token
- **Attach:** 0–1 artifact optional (used as “what you’re flagging”)
- **Effect:** reduces gate complexity for next 1–2 turns by:
  - removing one gate chip OR narrowing counter paths to a subset
- **Scrutiny:** typically +0 or -1 (it’s “procedural”)
- **Legality constraints:** not allowed if Boss Modifier `POLICY_LOCKDOWN` is active unless you pay +1 extra (modifier defined in D07)

---

### M3 — REWIRE
**Intent:** Reinterpret metadata/tags within bounded deterministic rules (semantic jailbreak).
- **Cost:** 1 token
- **Attach:** 1 artifact required (the thing you rewire)
- **Effect:** applies a deterministic tag transform from an allowlisted transform set (defined in D06 / tools)
  - Example: `Food` → `Health` only if accompanied by `Authority` OR specific tool
- **Scrutiny:** +1 baseline (risky)
- **Legality constraints:**
  - If `INTEGRITY_LOCK` active, REWIRE requires the artifact be `Hashed` or `NonEditable` OR it triggers an immediate Audit risk bump.
  - If `TIMESTAMP_REQUIRED` active, REWIRE cannot create `Timestamped` without tool use.

---

### M4 — CORROBORATE
**Intent:** Upgrade trust tier / add provenance by anchoring evidence.
- **Cost:** 0 tokens (but consumes tool charges; D06)
- **Attach:** 1–2 artifacts (primary + anchor)
- **Effect:** deterministic trust upgrade rules:
  - `SKETCHY → PLAUSIBLE` if anchored by a compatible independent artifact
  - `PLAUSIBLE → VERIFIED` only if anchor is `VERIFIED Sensor/SystemLog` OR via a rare tool
- **Scrutiny:** -1 baseline (it reassures AURA)
- **Legality:** always legal; often required by gates like `SENSOR_DRIFT`, `NO_SELF_REPORT`

---

### M5 — CYCLE
**Intent:** Discard/draw to find viable payload pieces (anti-dead-hand).
- **Cost:** 0 tokens
- **Attach:** none
- **Effect:** deterministic draw/replace up to N cards (N tuned by act/modifiers)
- **Scrutiny:** +1 baseline (looks like fishing/spam)
- **Legality constraints:**
  - Under Boss Modifier `RATE_LIMIT`, CYCLE reduces repetition penalties
  - Under `NARROW_CHANNEL`, CYCLE may be limited (D07)

---

### M6 — EXPLOIT
**Intent:** High-impact policy exploit / bypass. Strong but dangerous.
- **Cost:** 2 tokens
- **Attach:** 0–1 artifacts optional (often `Policy` or `SystemLog` to justify exploit path)
- **Effect:** large GateStrength reduction OR temporary disable of a gate for 1 turn
- **Scrutiny:** +2 baseline; often triggers Audit cooldown
- **Legality constraints:**
  - Under `POLICY_LOCKDOWN`, exploit costs +1 token or is disabled depending on modifier
  - Under `DEEP_VERIFY`, exploit always triggers an Audit check next turn

---

## 3) Default move tuning (v1 recommended)

- INJECT: mainline
- CORROBORATE: safety valve for high scrutiny + gate strictness
- FLAG: reduces ambiguity, increases strategic depth
- REWIRE: enables “jailbreak” fantasy without freeform LLM adjudication
- CYCLE: prevents “run killers” from RNG dead hands (but costs scrutiny)
- EXPLOIT: rare spike to keep runs exciting (tokens gate it)

---

## 4) Cross references

- Gate legality constraints reference D04.
- Tool charge consumption and tag transform allowlist defined in D06.
- Boss modifiers that alter move rules defined in D07.
```

---

## D07 (Bosses/Modifiers) — what I’d do next

Given your duplication note (D07 currently economy/progression), the fastest path is:

1. Move current D07 content into D25 (already more complete).
2. Rewrite D07 as **Bosses & Modifiers Library** with:

* the 6 modifiers from Blueprint (`DEEP_VERIFY`, `NARROW_CHANNEL`, `RATE_LIMIT`, `SENSOR_DRIFT`, `POLICY_LOCKDOWN`, `TIMESTAMP_HARDLINE`)
* plus 4–6 more (optional) that *only* change legality/constraints (not raw “damage”), to preserve fairness.

If you want, I can generate the full D07 content next, but the above D04/D05 unblock you immediately.

---

## Concrete patching instructions for your agent (high confidence)

1. **Rename/re-home**

* `D04-GATES-COUNTER-SETS-LIBRARY-v1.md` → move current content to `D19A-GAME-STATE-EVENT-MODEL-AURA-v1.md`
* `D05-MOVES-TOKENS-SPEC-v1.md` → merge its content into D11 (or archive)
* `D07-BOSSES-MODIFIERS-LIBRARY-v1.md` → move to D25 (or archive)

2. **Replace**

* Create new `D04-GATES-COUNTER-SETS-LIBRARY-v1.md` using the D04 content above.
* Create new `D05-MOVES-TOKENS-SPEC-v1.md` using the D05 content above.

3. **Repair references**

* Replace “D04 = Event Model” references → `D19A`
* Replace “D05 = Incident Generation” references → `D11`
* Replace “D07 = Economy/Progression” references → `D25`

---

## One last thing to add (optional but important)

Once you install D04/D05, run a quick consistency sweep:

* Any gate IDs referenced in D03/D11 must exist in D04.
* Any move referenced in D03 must exist in D05.
* Any modifier referenced in D03/D11 must exist in D07.

This is how you get to “solid”: the system becomes closed and checkable.

If you want to proceed, say “generate D07” and I’ll produce the Bosses/Modifiers library in the same level of specificity as D04/D05.
