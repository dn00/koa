# D05 — MOVES & TOKENS SPEC v1

**Status:** Draft v1.1 (ship-blocking)
**Owner:** Core Resolver / Systems Design
**Last Updated:** 2026-01-26
**Purpose:** Define player actions and token economy. Split into Daily mode (simple) and Freeplay mode (full tactical depth).

---

## 0) Mode split (Option B decision)

This spec now defines **two modes** with different action sets:

| Mode | Actions | Tokens | Target |
|------|---------|--------|--------|
| **Daily** (MVP) | SUBMIT, SCAN | None | 5-minute puzzle |
| **Freeplay** (post-MVP) | INJECT, FLAG, REWIRE, CORROBORATE, CYCLE, EXPLOIT | Ops Tokens | 15-minute roguelite |

**Daily** is the flagship mode. **Freeplay** is expansion content.

---

# PART A: DAILY MODE (MVP)

---

## 1) Daily actions overview

Daily mode has exactly **two** player actions:

| Action | Purpose | Turn cost | Scrutiny cost |
|--------|---------|-----------|---------------|
| **SUBMIT** | Send 1–2 cards to satisfy protocol | 1 turn | varies |
| **SCAN** | Swap cards from reserve | 1 turn | +2 |

That's it. No tokens. No toggles.

---

## 2) SUBMIT (Daily core action)

### 2.1 Intent

Submit evidence cards to satisfy the active Protocol and reduce Resistance.

### 2.2 Mechanics

**Input:**
- 1 or 2 cards from your Evidence (loadout)

**Resolution:**
1. Check if payload satisfies any counter-path of the active Protocol
2. If satisfied: calculate Compliance, reduce Resistance
3. If not satisfied: Compliance = 0, +1 Scrutiny

### 2.3 Compliance formula (Daily)

```
if protocol_satisfied:
    base_impact = sum(card.impact for card in payload)

    resonance = 1.5 if (len(payload) == 2 AND shared_resonance_tag) else 1.0

    compliance = floor(base_impact * resonance)
    compliance = min(compliance, 30)  # per-turn cap

    resistance -= compliance
else:
    compliance = 0
```

**Resonance tags** (allowlist): `TIME, LOCATION, WORK, PURCHASE, SENSOR, AUTHORITY`

### 2.4 Scrutiny changes (SUBMIT)

| Condition | Scrutiny delta |
|-----------|----------------|
| Payload includes SKETCHY card | +1 |
| Protocol not satisfied | +1 |
| Protocol satisfied, all VERIFIED | +0 |
| Protocol satisfied, includes PLAUSIBLE | +0 |

### 2.5 Example

**State:** Resistance = 70, Scrutiny = 2
**Payload:** Card A (Impact 12, AUTHORITY) + Card B (Impact 10, TIME)
**Protocol requires:** AUTHORITY + TIME

- Protocol satisfied ✓
- Base impact = 12 + 10 = 22
- Resonance? No shared resonance tag → multiplier = 1.0
- Compliance = floor(22 × 1.0) = 22
- Resistance: 70 → 48
- Scrutiny: unchanged (no SKETCHY)

---

## 3) SCAN (Daily refresh action)

### 3.1 Intent

Swap weak cards from your Evidence with cards from your Reserve.

### 3.2 Mechanics

**Input:**
- Select 1–2 cards from Evidence to discard
- Game replaces them with next cards from Reserve (deterministic order)

**Costs:**
- Consumes 1 turn
- +2 Scrutiny

**Constraints:**
- Cannot SCAN if Scrutiny is already at 5
- Max 2 SCANs per Daily (typical)
- Reserve order is seed-deterministic

### 3.3 Why SCAN is risky

SCAN costs a turn AND +2 Scrutiny. At Scrutiny 3+, one SCAN triggers an Audit.

This prevents "scan until perfect hand" degenerate play.

---

## 4) Daily scrutiny and audit

### 4.1 Scrutiny scale

Daily uses a simple **0–5** integer scale (not LOW/MED/HIGH).

### 4.2 Scrutiny sources

| Action | Scrutiny change |
|--------|-----------------|
| SUBMIT with SKETCHY | +1 |
| SUBMIT fails protocol | +1 |
| SCAN | +2 |

### 4.3 Audit trigger

When Scrutiny reaches **5**, an Audit triggers immediately.

### 4.4 Audit penalty (Daily)

1. Resistance heals **+15** (up to max)
2. **Highest-impact card in last payload** is Quarantined for 2 turns
3. Scrutiny resets to **2**

### 4.5 Quarantine

A quarantined card cannot be placed in payload until quarantine expires.

---

## 5) Daily card model

Each Evidence card has:

| Field | Type | Range |
|-------|------|-------|
| `impact` | integer | 8–40 typical |
| `trust_tier` | enum | VERIFIED, PLAUSIBLE, SKETCHY |
| `tags[]` | string[] | TIME, WORK, PURCHASE, SENSOR, AUTHORITY, LOCATION, etc. |
| `traits[]` | string[] | TIMESTAMPED, EDITABLE, CORROBORATABLE (optional) |

**Impact distribution guidance:**
- VERIFIED: 8–20 (safe, moderate)
- PLAUSIBLE: 12–28 (medium risk, medium reward)
- SKETCHY: 20–40 (high risk, high reward)

---

## 6) Daily tuning targets

| Parameter | Value |
|-----------|-------|
| Resistance start | 100 |
| Turn limit | 8 (typical) |
| Draft size | 12 shown, keep 6 |
| Reserve size | 6 |
| Scrutiny cap | 5 |
| Audit penalty | +15 Resistance, quarantine 2 turns |
| Compliance cap | 30 per turn |
| SCAN limit | 2 per Daily |

---

# PART B: FREEPLAY MODE (Post-MVP)

---

## 7) Freeplay actions overview

Freeplay mode uses the full **6-move** system with Ops Tokens.

| Move | Token Cost | Attach | Base Scrutiny | Primary Use |
|------|------------|--------|---------------|-------------|
| INJECT | 0 | 1-2 | varies by trust | Standard payload submission |
| FLAG | 1 | 0-1 | +0/-1 | Reduce gate ambiguity |
| REWIRE | 1 | 1 | +1 | Reinterpret tags |
| CORROBORATE | 0 | 1-2 | -1 | Upgrade trust tier |
| CYCLE | 0 | 0 | +1 | Draw new cards |
| EXPLOIT | 2 | 0-1 | +3 | High-impact bypass |

---

## 8) Ops Tokens (Freeplay only)

### 8.1 Token economy

- `ops_tokens` integer, range 0..3 (cap enforced)
- Tokens represent "privileged operations" against AURA

### 8.2 Sources

- Start of each incident: +1 token
- Clear a gate (strength hits 0): +1 token (cap applies)
- Shop/caches may grant +1 token

### 8.3 Sinks

- FLAG: costs 1
- REWIRE: costs 1
- EXPLOIT: costs 2
- Other moves cost 0 tokens

---

## 9) Freeplay move definitions

### M1 — INJECT
**Intent:** Standard payload submission.
- **Cost:** 0 tokens
- **Attach:** up to 2 artifacts (default)
- **Base effects:** applies counter path evaluation; scrutiny depends on trust tier
- **Legality:** always legal if artifacts are in hand
- **Failure mode:** weak/0 damage if gate requires a specific counter path

**Scrutiny impact:**
- VERIFIED payload: +0
- PLAUSIBLE payload: +1
- SKETCHY payload: +3
- FAIL (no path matched): +2 additional

---

### M2 — FLAG
**Intent:** Force AURA to narrow/declare the active check axis.
- **Cost:** 1 token
- **Attach:** 0–1 artifact optional
- **Effect:** reduces gate complexity for 1–2 turns
- **Scrutiny:** typically +0 or -1
- **Constraints:** not allowed if `POLICY_LOCKDOWN` active unless +1 extra cost

---

### M3 — REWIRE
**Intent:** Reinterpret metadata/tags within bounded deterministic rules.
- **Cost:** 1 token
- **Attach:** 1 artifact required
- **Effect:** deterministic tag transform from allowlisted set
- **Scrutiny:** +1 baseline
- **Constraints:** If `INTEGRITY_LOCK` active, requires `Hashed` or `NonEditable` artifact

---

### M4 — CORROBORATE
**Intent:** Upgrade trust tier by anchoring evidence.
- **Cost:** 0 tokens (but consumes tool charges)
- **Attach:** 1–2 artifacts (primary + anchor)
- **Effect:** deterministic trust upgrade
- **Scrutiny:** -1 baseline
- **Legality:** always legal

---

### M5 — CYCLE
**Intent:** Discard/draw to find viable payload pieces.
- **Cost:** 0 tokens
- **Attach:** none
- **Effect:** deterministic draw/replace up to N cards
- **Scrutiny:** +1 baseline
- **Cooldown:** cannot use consecutive turns

---

### M6 — EXPLOIT
**Intent:** High-impact policy exploit / bypass.
- **Cost:** 2 tokens
- **Attach:** 0–1 artifact optional
- **Effect:** large GateStrength reduction (-40 to -60) OR temporary gate disable
- **Scrutiny:** +3 baseline; often triggers Audit
- **Constraints:** Under `DEEP_VERIFY`, always triggers Audit check

---

## 10) Freeplay turn structure

1. **Select Move** from available moves
2. **Attach Artifacts** (if move allows/requires)
3. **Select Tool** (optional)
4. **Target Gate** (for INJECT, FLAG, EXPLOIT)
5. **Resolve** deterministically via D03 Resolver
6. **Apply Effects** (gate strength delta, scrutiny delta, card movement)
7. **Check End Conditions** (gate cleared, audit triggered, turn limit)

---

## 11) Freeplay tuning guidance

- **INJECT:** mainline; 60-70% of turns
- **CORROBORATE:** safety valve; 15-25% of turns
- **FLAG:** strategic depth; 5-10% of turns
- **REWIRE:** jailbreak fantasy; 5-10% of turns
- **CYCLE:** anti-dead-hand; 5-10% of turns
- **EXPLOIT:** rare spike; <5% of turns

---

## 12) Terminology mapping

| Player term (Daily) | Internal term | Freeplay term |
|---------------------|---------------|---------------|
| Submit | `inject` | Inject |
| Scan | `cycle` | Cycle |
| Resistance | `lock_strength` | Gate Strength |
| Protocol | `gate` | Gate |
| Evidence | `artifact` | Artifact |
| Compliance | `damage` | Damage |

---

## 13) Cross references

- Gate counter paths and legality constraints reference D04.
- Tool definitions and effect schemas defined in D09 (Pack Schemas).
- Boss modifiers that alter move rules defined in D07.
- Resolver pipeline that processes moves defined in D03.
- Event model that records move resolution in D04A.
- Player-facing Daily contract in D29.
