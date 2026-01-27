# D05 — MOVES & TOKENS SPEC v2.0

**Status:** Draft v2.0 (ship-blocking)
**Owner:** Core Resolver / Systems Design
**Last Updated:** 2026-01-26
**Purpose:** Define player actions and game economy. Daily mode uses SUBMIT only (adversarial testimony design). Freeplay mode extends with additional tactical options.
**Canonical Reference:** D31-ADVERSARIAL-TESTIMONY-DESIGN.md

---

## 0) Mode split

This spec defines **two modes** with different action sets:

| Mode | Actions | Tokens | Target |
|------|---------|--------|--------|
| **Daily** (MVP) | SUBMIT | None | 5-minute puzzle |
| **Freeplay** (post-MVP) | Extended moves | Ops Tokens | 15-minute roguelite |

**Daily** is the flagship mode. **Freeplay** is expansion content.

---

# PART A: DAILY MODE (MVP)

---

## 1) Daily actions overview

Daily mode has exactly **one** player action:

| Action | Purpose | Turn cost | Scrutiny cost |
|--------|---------|-----------|---------------|
| **SUBMIT** | Send 1-3 cards to address concerns and reduce resistance | 1 turn | varies |

That's it. No tokens. No toggles. No SCAN.

---

## 2) SUBMIT (Daily core action)

### 2.1 Intent

Submit evidence cards to address KOA's concerns, reduce resistance, and build your alibi.

### 2.2 Mechanics

**Input:**
- 1, 2, or 3 cards from your hand

**Pre-submit preview:**
- Concerns this would address
- Contradictions with committed story (MINOR/MAJOR)
- KOA's counter response (which counter applies)
- Projected damage (base, contested, or blocked)

**Resolution:**
1. Check for MAJOR contradictions → blocked if found
2. Check for MINOR contradictions → allowed with +1 scrutiny each
3. KOA plays counter-evidence (if applicable)
4. Calculate damage (base power, contested penalty, corroboration bonus)
5. Apply damage to resistance
6. Mark concerns as addressed
7. Add cards to committed story

### 2.3 Damage formula (Daily)

```
total_damage = 0

for each card in submission:
    card_damage = card.power

    if counter applies to this card's proof type AND counter not refuted:
        card_damage = ceil(card_damage * 0.5)  # 50% contested penalty

    total_damage += card_damage

if 2+ cards share same claim (location/state/activity):
    total_damage = ceil(total_damage * 1.25)  # 25% corroboration bonus

resistance -= total_damage
```

### 2.4 Refutation

If submission includes a refutation card:
- Target counter is marked as refuted
- Retroactive damage restoration: all previously-contested cards' missing 50% is applied immediately
- Refutation card also deals its own power as damage

### 2.5 Scrutiny changes

| Condition | Scrutiny delta |
|-----------|----------------|
| MINOR contradiction | +1 |
| SKETCHY trust card | +1 |
| MAJOR contradiction | — (blocked, can't submit) |
| Clean submission | +0 |

### 2.6 Scrutiny 5 = Instant Loss

When scrutiny reaches 5:
- Game ends immediately
- Player loses
- KOA: "Your story fell apart under scrutiny."

---

## 3) Card model

### 3.1 Evidence card fields

| Field | Type | Description |
|-------|------|-------------|
| `power` | integer | Damage dealt on successful submission |
| `proves` | ProofType[] | What concerns this addresses |
| `claims.timeRange` | [string, string] | Time range claimed |
| `claims.location` | LocationValue? | Location claimed |
| `claims.state` | StateValue? | State claimed (AWAKE, ASLEEP, etc.) |
| `claims.activity` | ActivityValue? | Activity claimed |
| `trust` | TrustTier | VERIFIED, PLAUSIBLE, SKETCHY |

### 3.2 Trust tiers

| Tier | Scrutiny | Notes |
|------|----------|-------|
| VERIFIED | +0 | Trusted source, no penalty |
| PLAUSIBLE | +0 | Acceptable source |
| SKETCHY | +1 | Low-quality source, adds scrutiny |

### 3.3 Refutation card fields

Refutation cards extend evidence cards:

| Field | Type | Description |
|-------|------|-------------|
| `power` | integer | Damage dealt |
| `refutes` | string[] | Counter IDs this nullifies |
| `claims` | {} | Empty - refutation cards have no claims |

---

## 4) KOA's counter-evidence

### 4.1 Counter mechanics

Each turn, KOA may respond with counter-evidence:
- KOA plays at most ONE counter per turn
- Counter targets specific proof types
- Targeted cards deal only 50% damage (contested)
- Counter can be refuted by matching refutation card

### 4.2 Counter visibility

| Mode | Behavior |
|------|----------|
| **FULL** (default) | All counters visible from turn 1 |
| **HIDDEN** | Counters revealed only when triggered |

---

## 5) Contradiction system

### 5.1 When contradictions occur

Contradictions are checked when a card's claims conflict with the committed story.

### 5.2 Severity levels

| Severity | Effect | Example |
|----------|--------|---------|
| **MAJOR** | Submission blocked | ASLEEP at 2:00 + AWAKE at 2:01 |
| **MINOR** | +1 scrutiny, allowed | ASLEEP at 2:00 + AWAKE at 2:07 |
| **NONE** | No conflict | ASLEEP at 2:00 + AWAKE at 2:30 |

### 5.3 Pre-submission warning

UI shows contradiction warnings BEFORE player submits:
- MAJOR: Red block, submit button disabled
- MINOR: Yellow warning, submit allowed

---

## 6) Corroboration system

### 6.1 When corroboration triggers

Corroboration bonus applies when 2+ cards in the same submission share a claim:
- Same location (e.g., both claim KITCHEN)
- Same state (e.g., both claim AWAKE)
- Same activity (e.g., both claim WALKING)

### 6.2 Bonus calculation

When corroboration applies:
- Total damage multiplied by 1.25
- Round UP (favor player)
- Applied after contested penalties

---

## 7) Daily tuning targets

| Parameter | Value |
|-----------|-------|
| Resistance start | 35 (Normal) |
| Turn limit | 6 (Normal) |
| Dealt cards | 6 |
| Scrutiny cap | 5 (instant loss) |
| Contested penalty | 50% per card |
| Corroboration bonus | 25% total |

---

## 8) Daily difficulty levels

| Difficulty | Cards | Concerns | Resistance | Counters | Traps | Turns |
|------------|-------|----------|------------|----------|-------|-------|
| Tutorial | 4 | 2 | 20 | 1 | 0 | 5 |
| Easy | 5 | 2 | 25 | 2 | 0 | 5 |
| Normal | 6 | 3 | 35 | 2 | 1 | 6 |
| Hard | 6 | 3 | 45 | 3 | 1 | 6 |
| Expert | 6 | 4 | 50 | 3 | 1 | 6 |

---

# PART B: FREEPLAY MODE (Post-MVP)

---

## 9) Freeplay actions overview

Freeplay mode extends Daily with additional tactical moves:

| Move | Token Cost | Purpose |
|------|------------|---------|
| SUBMIT | 0 | Standard card submission |
| FLAG | 1 | Reveal hidden counter info |
| REWIRE | 1 | Transform card claims |
| CORROBORATE | 0 | Boost trust tier |
| CYCLE | 0 | Redraw cards |
| EXPLOIT | 2 | High-impact bypass |

---

## 10) Ops Tokens (Freeplay only)

### 10.1 Token economy

- `ops_tokens` integer, range 0..3 (cap enforced)
- Tokens represent "privileged operations" against KOA

### 10.2 Sources

- Start of each puzzle: +1 token
- Refute a counter: +1 token (cap applies)
- Shop/caches may grant +1 token

### 10.3 Sinks

- FLAG: costs 1
- REWIRE: costs 1
- EXPLOIT: costs 2
- Other moves cost 0 tokens

---

## 11) Terminology mapping

| Player term (Daily) | Internal term | Description |
|---------------------|---------------|-------------|
| Submit | `submit` | Play cards |
| Resistance | `lock_strength` | Health bar to deplete |
| Concern | `proof_requirement` | What you must prove |
| Counter-Evidence | `counter` | KOA's challenges |
| Evidence | `evidence_card` | Your cards |
| Refutation | `refutation_card` | Nullifies counters |
| Corroboration | `claim_match_bonus` | Cards agreeing on claims |

---

## 12) Cross references

- Concerns and counter paths: D31
- Resolver pipeline: D03
- Game loop and phases: D02
- Player-facing rules: D29
