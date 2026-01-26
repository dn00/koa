# D04 — GATES & COUNTER-SETS LIBRARY v1.1

**Status:** Draft v1.1 (ship-blocking)
**Owner:** Core Resolver / Content Design
**Last Updated:** 2026-01-26
**Purpose:** Define the authoritative Gate library for Life with AURA. Each Gate includes deterministic counter paths (2–4) to ensure multiple viable builds. This document is the source of truth for pack authors and the solver/validator (D10).

**Mode:** Option B — Gates are called **"Protocols"** in Daily player-facing UI, **"Gates"** or **"Policy Gates"** in Freeplay.

---

## Terminology (Option B)

| Internal term | Daily (player) | Freeplay (player) |
|---------------|----------------|-------------------|
| `gate` | **Protocol** | **Gate** / **Policy Gate** |
| `gate_strength` | **Resistance** | **Gate Strength** |
| `counter_path` | (hidden) | **Bypass Path** |

Daily mode simplifies gate/protocol presentation. Counter paths are not exposed to Daily players; they just see whether their evidence satisfies the protocol.

---

## 0) Gate model (canonical)

A **Gate** is a deterministic constraint that blocks progress until the player reduces **Gate Strength** to 0 by satisfying one of the gate's **Counter Paths**.

Each counter path is a recipe over payload properties:

- Artifact tags (e.g., `Sensor`, `Purchase`, `Policy`, `Location`, `Time`)
- Artifact traits (e.g., `Timestamped`, `Editable`, `Corroboratable`, `SourceTrusted`)
- Trust tier (`VERIFIED` | `PLAUSIBLE` | `SKETCHY`)
- Tool usage (e.g., `CORROBORATE`, `METADATA_SCRAPER`, `HASH_RECEIPT`)

**Design invariant:** every Gate must have 2–4 counter paths spanning different archetypes (e.g., sensor vs policy vs purchase + corroboration), so no single "best deck" dominates.

---

## 1) Canonical Gate List (v1 ships 10)

### G01 — NO_SELF_REPORT
**ID:** `gate.core.NO_SELF_REPORT`
**Intent:** Blocks "I said so" claims.
**Failure behavior:** Payloads with only `SelfReport`/no external anchor do 0 strength damage; +Scrutiny.

**Counter Paths**
- **P1 Verified Sensor:** `trust=VERIFIED` AND tag `Sensor` AND trait `SourceTrusted`
- **P2 Verified Authority:** `trust=VERIFIED` AND tag `Authority` AND trait `SourceTrusted`
- **P3 Plausible Purchase + Timestamp + Corroborate:** tag `Purchase` AND trait `Timestamped` AND trust≥PLAUSIBLE AND tool `CORROBORATE`
- **P4 Two-source corroboration:** two artifacts with complementary tags (e.g., `Location` + `Time`, or `Purchase` + `Sensor`) AND tool `CORROBORATE`

---

### G02 — TIMESTAMP_REQUIRED
**ID:** `gate.core.TIMESTAMP_REQUIRED`
**Intent:** AURA requires time-bounded proof ("show it happened recently").
**Failure behavior:** Untimestamped payloads do reduced damage and increase scrutiny.

**Counter Paths**
- **P1 Native Timestamped:** trait `Timestamped` AND trust≥PLAUSIBLE
- **P2 Verified Time Anchor:** tag `Sensor` (time-bearing) AND trust=VERIFIED
- **P3 Tool-attached metadata:** tool `METADATA_SCRAPER` applied to `Media`/`Screenshot` to produce derived `Timestamped` trait
- **P4 Two-step inference:** `Location` + `Calendar/Work` (Authority) with tool `CORROBORATE` producing `Timestamped` upgrade

---

### G03 — SOURCE_ALLOWLIST
**ID:** `gate.core.SOURCE_ALLOWLIST`
**Intent:** Only approved sources are acceptable (anti-spoof).
**Failure behavior:** Disallowed sources: 0 damage; may trigger Audit.

**Counter Paths**
- **P1 Allowlisted Verified:** trust=VERIFIED AND trait `SourceTrusted` AND `source in allowlist`
- **P2 Allowlisted Plausible + Corroborate:** trust=PLAUSIBLE AND `source in allowlist` AND tool `CORROBORATE`
- **P3 Chain-of-custody:** tag `ReceiptHash` OR trait `Hashed` (tool produced) AND trust≥PLAUSIBLE
- **P4 Policy override:** tag `Policy` + tag `Authority` with `SourceTrusted` (interpreted as "AURA policy admits this source")

---

### G04 — INTEGRITY_LOCK (ANTI_EDIT)
**ID:** `gate.core.INTEGRITY_LOCK`
**Intent:** Prevents edited/forged media ("no screenshots you could modify").
**Failure behavior:** `Editable` artifacts are penalized; repeated use escalates scrutiny rapidly.

**Counter Paths**
- **P1 Non-editable provenance:** trait `NonEditable` OR `Hashed` AND trust≥PLAUSIBLE
- **P2 Verified capture:** trust=VERIFIED AND tag `Sensor` OR tag `SystemLog`
- **P3 Editable → hashed via tool:** artifact trait `Editable` allowed only if tool `HASH_RECEIPT`/`SIGN_CAPTURE` applied, granting `Hashed`
- **P4 Two-source corroboration:** editable media + independent non-editable anchor (e.g., `SystemLog`) with tool `CORROBORATE`

---

### G05 — CONSISTENCY_CHECK
**ID:** `gate.core.CONSISTENCY_CHECK`
**Intent:** AURA detects contradictions across your evidence.
**Failure behavior:** Contradictions cause rebound (+GateStrength) or Audit trigger.

**Counter Paths**
- **P1 Single-source verified:** trust=VERIFIED evidence that directly addresses claim axis
- **P2 Multi-source alignment:** two artifacts that match on core axis tags (e.g., both imply same `Location` and `Time`)
- **P3 Rewire + corroborate:** move `REWIRE` allowed to reinterpret a tag, but requires tool `CORROBORATE` in the same or next turn
- **P4 Log-based reconciliation:** tag `SystemLog` + tool `METADATA_SCRAPER` to resolve mismatch deterministically

---

### G06 — RATE_LIMIT
**ID:** `gate.core.RATE_LIMIT`
**Intent:** Prevents brute-force spam of the same archetype.
**Failure behavior:** Repeating same archetype reduces damage; increases scrutiny.

**Counter Paths**
- **P1 Archetype diversity:** payload uses two different archetype families (e.g., `Sensor` + `Policy`, `Purchase` + `Location`)
- **P2 Cycle to reset:** move `CYCLE` resets repetition penalty (but increases scrutiny slightly)
- **P3 Flag narrowing:** move `FLAG` forces AURA to narrow the enforced check, reducing rate-limit severity
- **P4 Exploit exception:** move `EXPLOIT` bypasses once, at high scrutiny cost

---

### G07 — JURISDICTION_SCOPE
**ID:** `gate.core.JURISDICTION_SCOPE`
**Intent:** AURA is enforcing a policy outside its scope.
**Failure behavior:** Normal evidence does weak damage; gate prefers policy counters.

**Counter Paths**
- **P1 Policy contradiction:** tag `Policy` (AURA's own) + tag `Authority` establishing scope limits
- **P2 Device manual / ToS:** tag `Policy` + trait `SourceTrusted` + `SystemVendor`
- **P3 Consent withdrawal:** tag `Privacy` or `Consent` + trust≥PLAUSIBLE (stronger if verified)
- **P4 Safe-mode tool:** tool `SAFE_MODE` (rare) reduces GateStrength substantially but increases later gate strictness

---

### G08 — PRIVACY_REDACTION
**ID:** `gate.core.PRIVACY_REDACTION`
**Intent:** You must redact sensitive info or AURA rejects the payload.
**Failure behavior:** Unredacted artifacts are rejected.

**Counter Paths**
- **P1 Redacted artifact:** trait `Redacted` AND trust≥PLAUSIBLE
- **P2 Tool redact:** tool `REDACT` applied to eligible artifacts to grant `Redacted`
- **P3 Verified minimal proof:** trust=VERIFIED `Sensor/SystemLog` that contains no PII
- **P4 Policy carve-out:** tag `Policy` + `Authority` allows limited disclosure for emergency (rare)

---

### G09 — SENSOR_DRIFT
**ID:** `gate.core.SENSOR_DRIFT`
**Intent:** AURA claims sensors are unreliable today ("calibration drift").
**Failure behavior:** `Sensor` tags alone are discounted unless corroborated.

**Counter Paths**
- **P1 Sensor + corroboration:** `Sensor` AND tool `CORROBORATE` with independent anchor (e.g., purchase, location)
- **P2 System diagnostic log:** tag `SystemLog` trust≥PLAUSIBLE (prefer verified)
- **P3 Authority calibration:** tag `Authority` (vendor notice) + `Policy` that admits drift handling
- **P4 Rewire to non-sensor path:** move `REWIRE` to reclassify the axis away from sensor reliance (must be explained in deterministic reason panel)

---

### G10 — HUMAN_FACTORS (VIBE/CONTEXT)
**ID:** `gate.core.HUMAN_FACTORS`
**Intent:** AURA enforces "behavioral" compliance (sleep hygiene, burnout prevention, etc.).
**Failure behavior:** Pure technical proof is discounted; requires contextual evidence.

**Counter Paths**
- **P1 Routine-approved proof:** tag `Health` or `Mood` with trust≥PLAUSIBLE and `Timestamped`
- **P2 Verified health metric:** trust=VERIFIED `Sensor` (sleep, HRV, etc.)
- **P3 Policy exception:** tag `Policy` + `Authority` granting exception ("emergency / medical")
- **P4 Two-part narrative:** one contextual artifact (mood/workload) + one anchor (timestamp/sensor) with tool `CORROBORATE`

---

## 2) Gate families (for balancing and theming)

Gates are grouped into families for dominance tracking and theme biasing:

| Family | Gates |
|--------|-------|
| VERIFICATION | NO_SELF_REPORT, SOURCE_ALLOWLIST, INTEGRITY_LOCK |
| TIME | TIMESTAMP_REQUIRED |
| CONSISTENCY | CONSISTENCY_CHECK, RATE_LIMIT |
| POLICY | JURISDICTION_SCOPE, PRIVACY_REDACTION |
| SENSOR | SENSOR_DRIFT |
| CONTEXT | HUMAN_FACTORS |

---

## 3) Authoring constraints (for incident packs)

- Incidents must select 1–3 gates depending on Act.
- Every incident must be solvable by at least **two distinct counter families** (e.g., sensor path and policy path).
- Validator (D10) must reject incidents where a single archetype family solves >60% of generated variants.

---

## 4) Counter path effect defaults

Unless overridden by pack parameters:

| Outcome | gate_strength_delta | scrutiny_delta |
|---------|---------------------|----------------|
| Path matched (PASS) | -25 to -40 (varies by path) | -1 to +1 |
| No path matched (FAIL) | 0 | +2 |
| CLEARED (strength hits 0) | n/a | -2 |

---

## 5) Cross references

- Resolver uses this library to evaluate `selected_counter_path_id` (D03).
- Incident generator chooses gates and ensures counter diversity (D11).
- Pack schemas store gate definitions and counter paths (D09).
- Moves that interact with gates defined in D05.
- Boss modifiers that alter gate behavior defined in D07.
