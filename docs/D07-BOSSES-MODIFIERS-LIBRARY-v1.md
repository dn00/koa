# D07 — BOSSES & MODIFIERS LIBRARY v1.1

**Status:** Draft v1.1 (post-MVP, Freeplay-only)
**Owner:** Core Resolver / Content Design
**Last Updated:** 2026-01-26
**Purpose:** Define the authoritative Boss Modifier library for Life with AURA. Modifiers alter game rules during incidents to force adaptation and create variety. This document is the source of truth for the resolver (D03), incident generator (D11), and pack validation (D10).

---

## ⚠️ Scope: Freeplay-only (post-MVP)

**Modifiers are NOT used in Daily mode.** Daily puzzles use fixed protocols without modifiers for simplicity.

| Mode | Modifiers | Bosses |
|------|-----------|--------|
| **Daily** (MVP) | None | None |
| **Freeplay** (post-MVP) | Full modifier library | Boss incidents with modifiers |

This library is preserved for Freeplay mode implementation post-MVP.

---

## 0) Modifier model (canonical)

A **Modifier** is a temporary rule alteration that changes how moves, gates, or scrutiny behave during an incident. Modifiers are selected during incident assembly and persist for a defined duration.

**Design invariants:**
- Modifiers change **constraints**, not raw "damage" numbers
- Every modifier must have at least one viable counter-strategy
- Modifiers stack deterministically (effects apply in ID-sorted order)

---

## 1) Modifier schema

```json
{
  "modifier_id": "mod.core.DEEP_VERIFY",
  "display": {
    "name": "Deep Verify",
    "chip": "DEEP VERIFY",
    "description": "AURA scrutinizes everything. Sketchy artifacts are heavily penalized."
  },
  "scope": "INCIDENT|ACT|TURNS",
  "duration_turns": 0,
  "effects": [...],
  "constraints": {
    "allowed_acts": ["ACT2", "BOSS"],
    "incompatible_with": ["mod.core.NARROW_CHANNEL"]
  }
}
```

---

## 2) Canonical Modifier List (v1 ships 6)

### MOD_01 — DEEP_VERIFY
**ID:** `mod.core.DEEP_VERIFY`
**Intent:** Forces player to use higher-trust evidence.
**Scope:** INCIDENT

**Effects:**
- SKETCHY artifacts treated as max PLAUSIBLE for counter-path matching
- SKETCHY artifacts add +2 scrutiny (instead of +3)
- EXPLOIT always triggers an Audit check next turn

**Counter-strategies:**
- Prioritize VERIFIED and PLAUSIBLE artifacts
- Use CORROBORATE to upgrade trust before INJECT
- Avoid EXPLOIT unless absolutely necessary

**Allowed acts:** ACT2, BOSS

---

### MOD_02 — NARROW_CHANNEL
**ID:** `mod.core.NARROW_CHANNEL`
**Intent:** Limits combo plays; forces precision.
**Scope:** INCIDENT

**Effects:**
- INJECT may attach only **1 artifact** (instead of 2)
- CYCLE draws only 2 cards (instead of 3)
- Single-artifact payloads get +10% gate strength delta bonus

**Counter-strategies:**
- Focus on high-quality single artifacts
- Use CORROBORATE to maximize single-artifact value
- Use FLAG to narrow gate requirements first

**Allowed acts:** ACT1, ACT2, BOSS
**Incompatible with:** RATE_LIMIT (would create unsolvable states)

---

### MOD_03 — RATE_LIMIT
**ID:** `mod.core.RATE_LIMIT`
**Intent:** Prevents brute-force spam of same strategy.
**Scope:** INCIDENT

**Effects:**
- Using same archetype family twice in a row: -50% gate strength delta
- Using same archetype family three times in a row: 0 gate strength delta
- CYCLE resets the repetition counter

**Counter-strategies:**
- Alternate between archetype families (Sensor → Purchase → Policy)
- Use CYCLE strategically to reset counter
- Draft diverse artifact pool

**Allowed acts:** ACT2, BOSS
**Incompatible with:** NARROW_CHANNEL

---

### MOD_04 — SENSOR_DRIFT
**ID:** `mod.core.SENSOR_DRIFT`
**Intent:** Makes sensor-heavy builds unreliable.
**Scope:** INCIDENT

**Effects:**
- `Sensor` tag alone does not satisfy counter paths requiring Sensor
- `Sensor` + CORROBORATE with non-Sensor anchor restores validity
- `SystemLog` tag is unaffected (still counts as valid sensor-like evidence)

**Counter-strategies:**
- Pair Sensor artifacts with Purchase or Location anchors
- Use CORROBORATE on Sensor artifacts before INJECT
- Pivot to Policy or Authority builds

**Allowed acts:** ACT1, ACT2, BOSS

---

### MOD_05 — POLICY_LOCKDOWN
**ID:** `mod.core.POLICY_LOCKDOWN`
**Intent:** Restricts policy-based jailbreak moves.
**Scope:** INCIDENT

**Effects:**
- FLAG costs +1 token (total 2)
- EXPLOIT costs +1 token (total 3) OR is disabled if player has <3 tokens
- Policy counter paths require trust≥PLAUSIBLE (no SKETCHY policy)

**Counter-strategies:**
- Conserve tokens for critical moments
- Use CORROBORATE to ensure Policy artifacts are at least PLAUSIBLE
- Pivot to Sensor or Purchase builds

**Allowed acts:** BOSS only

---

### MOD_06 — TIMESTAMP_HARDLINE
**ID:** `mod.core.TIMESTAMP_HARDLINE`
**Intent:** Makes time-based proof mandatory.
**Scope:** INCIDENT

**Effects:**
- All counter paths implicitly require `Timestamped` trait
- Artifacts without `Timestamped` do -50% gate strength delta
- REWIRE cannot add `Timestamped` (must be native or tool-applied)

**Counter-strategies:**
- Prioritize artifacts with native `Timestamped` trait
- Use METADATA_SCRAPER tool to add timestamps to Media
- Draft from time-heavy pools (Purchase, Sensor with timestamps)

**Allowed acts:** ACT2, BOSS

---

## 3) Modifier distribution by act

| Act | Modifier Count | Allowed Severity |
|-----|----------------|------------------|
| ACT1 | 0-1 | Light only (NARROW_CHANNEL, SENSOR_DRIFT) |
| ACT2 | 1 | Medium (any except POLICY_LOCKDOWN) |
| BOSS | 1-2 | Any, including POLICY_LOCKDOWN |

---

## 4) Modifier stacking rules

When multiple modifiers are active:

1. **Token cost increases are additive** (FLAG under POLICY_LOCKDOWN + another modifier = costs add)
2. **Percentage effects multiply** (RATE_LIMIT -50% × TIMESTAMP_HARDLINE -50% = -75% total)
3. **Binary restrictions are AND'd** (if both say "requires Timestamped", it requires Timestamped)
4. **Effects apply in modifier_id sorted order** for determinism

---

## 5) Audit modifiers (triggered, not pre-selected)

These modifiers are applied when an Audit is triggered (scrutiny threshold crossed):

### AUDIT_DEEP_VERIFY
**Trigger:** Scrutiny reaches MED
**Duration:** 2 turns
**Effects:** Same as MOD_DEEP_VERIFY but temporary

### AUDIT_NARROW_CHANNEL
**Trigger:** Scrutiny reaches HIGH
**Duration:** 1-2 turns
**Effects:** Same as MOD_NARROW_CHANNEL but temporary

### AUDIT_SOURCE_LOCK
**Trigger:** Scrutiny reaches HIGH + specific gate active
**Duration:** 2 turns
**Effects:** Only sources in a restricted allowlist count for Sensor tag

---

## 6) Boss identity modifiers (optional, for theming)

Future expansion can add "Boss identity" modifiers that combine multiple effects:

```json
{
  "modifier_id": "mod.core.BOSS_PARANOID_AURA",
  "display": { "name": "Paranoid AURA", "chip": "PARANOID" },
  "composed_of": ["MOD_DEEP_VERIFY", "MOD_SENSOR_DRIFT"],
  "additional_effects": [
    { "type": "SCRUTINY_START", "value": "MED" }
  ]
}
```

---

## 7) Validation constraints (for D10)

- Every incident with modifiers must remain solvable
- No modifier combination may reduce viable counter paths to <2
- POLICY_LOCKDOWN must not appear with NARROW_CHANNEL
- Boss incidents must have at least 1 modifier

---

## 8) Cross references

- Gates that interact with modifiers defined in D04
- Moves affected by modifiers defined in D05
- Resolver applies modifier effects per D03
- Incident generator selects modifiers per D11
- Pack schemas for modifier definitions in D09
