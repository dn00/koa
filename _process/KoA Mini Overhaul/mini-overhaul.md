# KOA Mini Axis Overhaul v1 Lite — Implementation Spec

**Goal:** Add composition-level depth to Mini through axes + natural Focus, achieving 7/7 puzzle principles while keeping Mini simple and fair.

This doc is **non-ambiguous** and **validator-enforceable**.

---

## 0) Definition of Done

A build is "Axis Overhaul Complete" only if **all** are true:

### Player experience

* [x] Mini still feels like: "Pick 3, KOA reacts, outcome."
* [x] Turn 3 is not abrupt: **Commit → Processing → Final Audit → Reveal** every run.
* [x] Players can always understand *one or two* reasons they failed.
* [x] No mid-run bark reveals truth/lie status.
* [x] KOA stays in character — no game-mechanic language.

### Fairness

* [x] **All 3 truths selected (any order) ⇒ Outcome ≥ CLEARED** (Mini only).
* [x] Concern can affect **FLAWLESS eligibility**, but never prevents CLEARED when all truths were played.

### Principles (7/7)

| Principle | How satisfied |
|-----------|---------------|
| P1: Instant Clarity | "Pick 3, avoid lies" — suspicion is flavor until learned |
| P2: Completable | Fairness clamp guarantees solvability |
| P3: Counter-intuitive | Concern creates "play strong card or avoid suspicion?" tension |
| P4: Dangerous Info | KOA's suspicion is double-edged — sometimes truths match it |
| P5: Resolution | Final Audit + lie reveal explains everything |
| P6: Shareability | Existing share format |
| P7: Fresh Daily | Scenarios + rotating concern dimensions |

### System enforceability

* [x] All tags are deterministic (no NLP required).
* [x] Validator enforces: tag presence, factTouch rules, concern P4 constraint, anti-meta checks.

---

## 1) Phase 0 — Pre-Overhaul Cleanups

Do these first to avoid rework.

### 1.1 Remove courtroom framing in Mini copy

Replace everywhere in Mini UI/spec:

* "Verdict" → **Outcome**
* "Verdict screen" → **Result screen**
* "Verdict line" → **Outcome line**

### 1.2 Fix Monday contradiction wording

If any doc says "direct contradictions" for Mini, change to:

* **Monday:** "two clean one-step inferences" (still not keyword-matching)

### 1.3 Mini has no timestamps

Mini must not reference clock times. The `time` field should be `''` or omitted.

### 1.4 Type Tax and KOA Flag in Mini

**Rule:** In Mini, Type Tax / Flag effects may exist under the hood but must **never** reduce "all truths" below CLEARED.

### 1.5 Objection/Flag in Mini Lite

**Hard rule:** Mini Lite has **no player-facing objection or flag mechanics**.

The Concern bark (T2 suspicion line) is the **sole tension mechanism** for T2. There is no:
* ❌ Flag button for players to press
* ❌ Objection mechanic to resolve
* ❌ Player choice about whether to flag something

If the engine has objection/flag logic, it must be:
* Auto-resolved silently (not surfaced to player), OR
* Skipped entirely for Mini mode

**Rationale:**
* Keeps P1 (Instant Clarity): "Pick 3, avoid lies" — one simple rule
* Keeps cognitive load minimal
* Concern bark provides all the P4 (Dangerous Info) tension needed
* Prevents pacing disruption before T3

---

## 2) Data Model — v1 Lite Schema

Minimal tag set that produces depth without over-engineering.

### 2.1 Card shape (v1 Lite)

```ts
type EvidenceType = 'SENSOR' | 'DIGITAL' | 'TESTIMONY' | 'PHYSICAL';

type ControlPath = 'manual' | 'automation' | 'remote' | 'unknown';

type ClaimShape = 'absence' | 'positive' | 'attribution' | 'integrity';

/**
 * signalRoot = the primitive used to compute independence.
 * Keep it small, consistent, and non-creative.
 */
type SignalRoot =
  | 'koa_cloud'
  | 'phone_os'
  | 'router_net'
  | 'device_firmware'
  | 'camera_storage'
  | 'wearable_health'
  | 'human_partner'
  | 'human_neighbor'
  | 'human_self'
  | 'receipt_photo'
  | 'unknown';

interface CardV5MiniLite {
  id: string;
  source: string;
  strength: 3 | 4 | 5;
  evidenceType: EvidenceType;
  location: string;
  time?: '';              // Mini: always empty or omitted
  claim: string;
  presentLine: string;
  isLie: boolean;

  // Required tags (v1 Lite)
  factTouch: 1 | 2 | 3;         // Which known fact this card addresses (exactly one)
  signalRoot: SignalRoot;       // Independence computation
  controlPath: ControlPath;     // Concern dimension
  claimShape: ClaimShape;       // Concern dimension
  subsystem: string;            // e.g. 'printer', 'thermostat', 'garage'
}
```

### 2.2 factTouch definition (non-ambiguous)

> **A card "touches" Fact N if the card's claim is intended to reduce uncertainty about Fact N.**
> Not "could be used generally," but "the claim is *aimed at* that fact."

**Type:** `factTouch: 1 | 2 | 3` (scalar, not array — exactly one fact per card)

#### Required constraints (validator enforced)

* Each card touches **exactly 1 fact** (enforced by scalar type)
* **The 3 truths must form a perfect partition:** one truth touches Fact 1, one touches Fact 2, one touches Fact 3
* Each fact must be touched by at least 2 cards total (ensures coverage decisions exist)

### 2.3 Lie metadata (v1 Lite)

```ts
type LieType = 'inferential' | 'relational';

type TrapAxis =
  | 'coverage'
  | 'independence'
  | 'control_path'
  | 'claim_shape';

interface LieInfoV5MiniLite {
  cardId: string;
  lieType: LieType;
  reason: string;           // Post-reveal explanation

  // Required (v1 Lite)
  trapAxis: TrapAxis;       // Why this lie is tempting
  baitReason: string;       // 1 sentence: why players will pick it
}
```

#### Validator requirements

* Exactly 3 lies in `lies[]`, one per lie card
* All lies have `trapAxis` + `baitReason` populated
* At least **2 distinct trapAxis** across 3 lies (anti-meta)

---

## 3) Axes — Coverage + Independence + Concern

Only 3 axes for v1 Lite. All computed deterministically from tags.

### 3.1 Coverage (uses factTouch)

Input: played cards (1–3).

Algorithm:
1. Let `covered = Set(card.factTouch for each played card)`
2. If `covered` contains {1,2,3} ⇒ `coverage = complete`
3. Else ⇒ `coverage = gap` (with indication of which fact is missing)

### 3.2 Independence (uses signalRoot + signalRootGroup)

Independence uses a **derivation table** to group related signal roots:

```ts
type SignalRootGroup = 'cloud' | 'device' | 'network' | 'human' | 'physical' | 'unknown';

const signalRootGroup: Record<SignalRoot, SignalRootGroup> = {
  koa_cloud: 'cloud',
  phone_os: 'device',
  router_net: 'network',
  device_firmware: 'device',
  camera_storage: 'device',
  wearable_health: 'device',
  human_partner: 'human',
  human_neighbor: 'human',
  human_self: 'human',
  receipt_photo: 'physical',
  unknown: 'unknown',
};
```

#### Independence computation

Input: played cards.

Algorithm:
1. If any two played cards share **same signalRoot** (and signalRoot != 'unknown') ⇒ `correlated_strong`
2. Else if any two share **same signalRootGroup** (and group != 'unknown') ⇒ `correlated_weak`
3. Else ⇒ `diverse`

#### Display (v1 Mini)

Collapse for player-facing display:
* `correlated_strong` or `correlated_weak` → "⚠️ Correlated"
* `diverse` → "✅ Varied"

Keep the distinction internally for analytics and tuning.

### 3.3 Concern (Natural Focus)

Concern is the "dangerous information" lever. It's computed after T2 and revealed to the player **before** T3 commit via a KOA bark.

#### Concern type (explicit payload)

```ts
type Concern =
  | { key: 'same_system'; root: SignalRoot }      // remembers which root repeated
  | { key: 'automation_heavy' }
  | { key: 'manual_heavy' }
  | { key: 'remote_heavy' }
  | { key: 'absence_heavy' }
  | { key: 'attribution_heavy' }
  | { key: 'integrity_heavy' }
  | { key: 'all_digital' }
  | { key: 'all_sensor' }
  | { key: 'all_testimony' }
  | { key: 'all_physical' }
  | { key: 'no_concern' };
```

The `same_system` variant stores which `signalRoot` was repeated, so the hit test can match exactly.

#### Concern computation (priority order)

After T2, compute `Concern` from the two played cards:

1. `signalRoot` repeats (and != 'unknown') → `{ key: 'same_system', root: theRepeatedRoot }`
2. `controlPath` repeats → `{ key: 'automation_heavy' }` | `{ key: 'manual_heavy' }` | `{ key: 'remote_heavy' }`
3. `claimShape` repeats → `{ key: 'absence_heavy' }` | `{ key: 'attribution_heavy' }` | `{ key: 'integrity_heavy' }`
4. `evidenceType` repeats → `{ key: 'all_digital' }` | `{ key: 'all_sensor' }` | `{ key: 'all_testimony' }` | `{ key: 'all_physical' }`
5. else → `{ key: 'no_concern' }`

**Important:** Concern is computed **once** after T2 and never re-evaluated. The payload is stored for the hit test.

#### Concern hit test (3-of-3 semantics)

Because ConcernKey is defined by a repeated dimension in the first two cards, **ConcernHit is true only if the third card also matches that same dimension (3-of-3).**

* `concernHit = (all 3 cards match the concernKey dimension)` → "Doubled down"
* `concernAvoided = (only 2 cards match, T3 diversified)` → "Diversified"

This keeps:
* **Agency** — T3 matters; you can diversify after the warning
* **Honesty** — "doubled down" means you kept leaning after warning
* **P4 danger** — sometimes the best truth is the one that doubles down

#### Dimension matching logic

| Concern.key | Card matches if... |
|-------------|-------------------|
| `same_system` | `card.signalRoot === concern.root` (the stored repeated root) |
| `automation_heavy` | `card.controlPath == 'automation'` |
| `manual_heavy` | `card.controlPath == 'manual'` |
| `remote_heavy` | `card.controlPath == 'remote'` |
| `absence_heavy` | `card.claimShape == 'absence'` |
| `attribution_heavy` | `card.claimShape == 'attribution'` |
| `integrity_heavy` | `card.claimShape == 'integrity'` |
| `all_digital` | `card.evidenceType == 'DIGITAL'` |
| `all_sensor` | `card.evidenceType == 'SENSOR'` |
| `all_testimony` | `card.evidenceType == 'TESTIMONY'` |
| `all_physical` | `card.evidenceType == 'PHYSICAL'` |
| `no_concern` | *(always false — no hit possible)* |

#### no_concern semantics (explicit)

If `concern.key === 'no_concern'`:
- Set `concernHit = false`
- Set `concernAvoided = true` (Concern is N/A)
- Final Audit uses: `Concern: ✅ Balanced`

#### Scoring impact

* If all 3 picks are truths:
  * Always **≥ CLEARED**
  * **FLAWLESS only if concern avoided** (diversified on T3) AND diverse sources

#### Independence + Concern overlap rule

When `concern.key === 'same_system'`, the same repeated signalRoot causes both:
* Independence = correlated
* Concern = potential doubled down

To avoid double-punishing for the same underlying issue:
* **Concern is the FLAWLESS blocker** (if doubled down)
* **Independence is shown but informational only** when concern.key is `same_system`

In other words: if you double down on `same_system`, that's one penalty (concern), not two.

---

## 4) Natural Focus — KOA Expresses Suspicion

Focus is delivered as a KOA bark, not a UI chip. This keeps KOA in character.

### 4.1 T2 flow (with pair narration)

After the player plays their second card:

```
KOA: "[Sequence bark from 30 pairs]"          ← Personality
     "[Suspicion line from templates]"         ← P4 setup
     (Double-checking [dimension] tonight.)    ← Clarity subtitle
```

**Example:**
```
KOA: "Breathing issues, then vent adjustment. Your bedroom
      was having a rough night."

     "Lot of automation in this story, though."

     (Double-checking automation tonight.)
```

### 4.2 Suspicion line templates (by concernKey)

| concernKey | Suspicion line |
|------------|----------------|
| `same_system` | "Same system vouching twice. Interesting." |
| `automation_heavy` | "Lot of automation doing the work for you." |
| `manual_heavy` | "Two manual actions. Busy night." |
| `remote_heavy` | "Everything happening remotely. Convenient." |
| `absence_heavy` | "Two stories about what didn't happen." |
| `attribution_heavy` | "Blaming a lot of other things tonight." |
| `integrity_heavy` | "Two claims about system integrity. Noted." |
| `all_digital` | "All device logs so far. Where are the humans?" |
| `all_sensor` | "Your sensors have opinions tonight." |
| `all_testimony` | "Humans agreeing with humans. Cozy." |
| `all_physical` | "Lot of physical evidence. Hands-on night." |
| `no_concern` | "At least you're mixing your sources." |

### 4.3 Subtitle templates (clarity)

| concernKey | Subtitle |
|------------|----------|
| `same_system` | (Double-checking system dependency.) |
| `automation_heavy` | (Double-checking automation tonight.) |
| `manual_heavy` | (Double-checking manual actions.) |
| `remote_heavy` | (Double-checking remote access.) |
| `absence_heavy` | (Double-checking absence claims.) |
| `attribution_heavy` | (Double-checking blame patterns.) |
| `integrity_heavy` | (Double-checking integrity claims.) |
| `all_digital` | (Double-checking device logs.) |
| `all_sensor` | (Double-checking sensor data.) |
| `all_testimony` | (Double-checking human testimony.) |
| `all_physical` | (Double-checking physical evidence.) |
| `no_concern` | *(no subtitle)* |

### 4.4 Non-eliminative rule

Suspicion bark must **only reference dimension labels**, never:
* ❌ "that contradicts Fact #2"
* ❌ "the router log is suspicious"
* ❌ "your partner testimony seems off"
* ❌ any card name or source

---

## 5) Final Audit — The T3 Resolution Beat

Turn 3 must always flow: **Pick 3rd card → KOA "processing" → Final Audit → Reveal**

### 5.1 Final Audit panel (always shown)

Displayed for 2–4 seconds, no interaction required.

Shows exactly 3 lines in KOA-flavored language:

| Check | If good | If bad | If N/A |
|-------|---------|--------|--------|
| Coverage | "Facts addressed: ✅ Complete" | "Facts addressed: ⚠️ Gap" | — |
| Independence | "Source diversity: ✅ Varied" | "Source diversity: ⚠️ Correlated" | — |
| Concern | "After my warning: ✅ Diversified" | "After my warning: ⚠️ Doubled down" | "Concern: ✅ Balanced" (no_concern) |

**Example (FLAWLESS eligible):**
```
Facts addressed: ✅ Complete
Source diversity: ✅ Varied
After my warning: ✅ Diversified
```

**Example (FLAWLESS blocked by concern):**
```
Facts addressed: ✅ Complete
Source diversity: ✅ Varied
After my warning: ⚠️ Doubled down
```

**When no concern triggered (no_concern):**
```
Facts addressed: ✅ Complete
Source diversity: ✅ Varied
Concern: ✅ Balanced
```

### 5.2 Outcome mapping (Mini uses Lite mapping)

**Important:** Mini tiers are determined by this Lite mapping, **not V5 Belief math.**
V5 Belief remains internal and is used only in Advanced mode / Expert View.

#### Tiering rules

**Rule 0 (Fairness clamp):** All 3 truths in any order ⇒ Outcome ≥ **CLEARED**. Always.

**Rule 1 (Base failure tiers):**
- 2 truths + 1 lie ⇒ **CLOSE**
- 1 truth + 2 lies ⇒ **BUSTED**
- 0 truths + 3 lies ⇒ **BUSTED**

**Rule 2 (All-truth tiers):** If all 3 picks are truths:

**Case A — concern.key === 'same_system'**
- If `concernHit === true` (doubled down on the same system) ⇒ **CLEARED**
- Else (`concernHit === false`, diversified on T3) ⇒ **FLAWLESS**
- Independence correlation is **display-only** in this case (informational, not tiering).

**Case B — all other concern keys (including no_concern)**
- If `concernHit === true` ⇒ **CLEARED**
- Else if `independence` is correlated (strong or weak) ⇒ **CLEARED**
- Else ⇒ **FLAWLESS**

**Hard rule:** All truths in any order ⇒ at least **CLEARED**. Always.

### 5.3 Ceiling explanation (required UX)

When a player gets CLEARED with all 3 truths (blocked from FLAWLESS), add a KOA line on the Result screen:

**If blocked by concern (doubled down):**
> "Your story checks out. But you leaned hard on [dimension] after I flagged it. No gold star."

**If blocked by correlation:**
> "Your story checks out. But your sources all trace back to the same place. Noted."

**If blocked by both:**
> "Your story checks out. But you doubled down AND your sources overlap. I'm watching you."

This prevents "I got all truths but lost?!" confusion.

---

## 6) Bark System — Sequence Barks + Concern Barks

### 6.1 Bark structure per turn

| Turn | Bark type | Source | Rules |
|------|-----------|--------|-------|
| T1 | Card reaction | Bespoke per card (6 barks) | React to the specific card |
| T2 | Sequence + Suspicion | Bespoke pairs (30 barks) + Concern template | Personality + P4 setup |
| T3 | Story completion | Pattern-based | **Closing energy only — no axis commentary** |
| Audit | Final Audit lines | Template (3 lines) | Evaluation happens here, not in barks |

**T3 bark rule (HARD):** T3 barks must be "closing energy" — signaling commitment, not evaluation. The Final Audit panel does the evaluation.

T3 barks must:
* ✅ Signal commitment/finality ("That's your story")
* ✅ Be generic — same bark works regardless of axis outcomes
* ✅ Set up the audit beat ("Let me check")

T3 barks must NOT:
* ❌ Reference any axis concept (coverage, independence, concern, sources, automation, etc.)
* ❌ Be conditional on concernKey or concernResult
* ❌ Evaluate the player's choices in any way
* ❌ Hint at whether player diversified or doubled down
* ❌ Reference evidence types or signal roots

Safe T3 bark styles:
* "That's your story. Let me check the house."
* "Alright. Committed. Give me a second."
* "Three pieces. Let's see what they add up to."
* "Okay. That's what you're going with. Processing."

Forbidden T3 styles:
* ❌ "Finally a human witness" (leaks concern outcome)
* ❌ "Still all automation" (evaluates before audit)
* ❌ "That breaks the pattern" (reveals diversification)
* ❌ "Good mix of sources" (evaluates independence)
* ❌ "Interesting choice for your third" (implies evaluation)

**Implementation note:** T3 barks should be a small fixed set (5-10) selected randomly or by pattern, NOT generated per-puzzle or per-concernKey. This prevents accidental leakage.

### 6.2 Pair narration — All 30 bespoke, with structural hints

The 30 sequence barks (T2) are kept for personality. They're additive with the concern suspicion line.

#### Generator structural hints

When generating pair barks, compute these hints for the generator (not stored at runtime):

```ts
interface PairBarkHints {
  cardA: string;           // card ID
  cardB: string;           // card ID
  sameFact: boolean;       // A.factTouch === B.factTouch
  sameRoot: boolean;       // A.signalRoot === B.signalRoot && !== 'unknown'
  sameGroup: boolean;      // signalRootGroup(A) === signalRootGroup(B)
  sameControlPath: boolean;
  sameClaimShape: boolean;
  typeCombo: string;       // e.g. "SENSOR→DIGITAL"
}
```

#### Bark generation rules

Each pair bark must:
* ✅ Reference **both sources** (A then B) in natural language
* ✅ May reference **one structural hint** (e.g., "both from your bedroom")
* ❌ Must not reference facts or truth/lie status
* ❌ Must not evaluate the combination as good/bad

### 6.3 Bark content rules (Mini-safe)

All barks must avoid:
* ❌ "lie/false/fake/fabricated"
* ❌ "verdict/objection/defense/guilty"
* ❌ "card/play/turn" (use "what you've shown me" / "your story so far")
* ❌ specific fact references before reveal
* ❌ instructions ("you should pick...")

---

## 7) Validator Updates

### 7.1 Existing checks (keep)

* Exactly 6 cards, 3 truths, 3 lies
* Exactly 3 known facts
* Strengths: truths = {3,3,4}, lies = {3,4,5}
* Evidence types: ≥3 types, max 2 each
* No timestamps in Mini (time empty/omitted)
* No direct contradiction lies (all require inference)

### 7.2 New checks (v1 Lite)

**Tags present:**
* Every card has: `factTouch` (scalar 1|2|3), `signalRoot`, `controlPath`, `claimShape`, `subsystem`
* `signalRoot` is from enum (no arbitrary strings)
* `factTouch` is scalar (not array) — exactly one fact per card

**factTouch constraints:**
* Each card's `factTouch` is 1, 2, or 3 (scalar)
* The 3 truths form a perfect partition (one per fact)
* Each fact is touched by at least 2 cards total

**Lie trap mapping:**
* Each lie has `trapAxis` + `baitReason`
* At least 2 distinct `trapAxis` across the 3 lies

**Ordered T2 pair definition:**
* T2 pairs are **ordered**: (A then B) ≠ (B then A)
* There are **30 possible ordered T2 pairs** (6 cards × 5 remaining = 30)
* P4/P4+ constraints require existence for **at least one** pair that produces non-`no_concern`

**Concern P4 constraint (basic):**
* At least one possible Concern (from T2 pairs) must match at least 1 truth
* This ensures "avoid what KOA mentions" isn't always correct

**Concern P4+ constraint (proper — ensures dangerous info dilemma):**

For at least **one ordered T2 pair** that produces a non-`no_concern` Concern:

Let `dimPredicate(card)` = "card matches concern dimension" (using the stored payload for `same_system`).

Among the **remaining 4 cards** (not in that T2 pair), require:

1) There exists **a truth** with `dimPredicate(truth) == true`

2) There exists **a lie** that makes the information dangerous in **at least one** of these ways:
   - (A) `dimPredicate(lie) == false`  (danger when avoiding the warned dimension)
   - OR
   - (B) `dimPredicate(lie) == true`   (danger when doubling down on the warned dimension)

This ensures: after KOA warns about X, both "diversify" and "double down" can be risky depending on which card you choose.

### 7.3 Mini fairness simulation

Simulate all 20 possible 3-card selections:
* Confirm exactly 1 selection yields "all truths"
* Confirm that selection yields ≥ CLEARED in all 6 orders

### 7.4 Anti-meta constraints (content rules)

Across a rolling set of puzzles:
* At least 1x/week: most tempting card is a truth
* At least 1x/week: a lie is strength 3
* Strength doesn't correlate with truthiness in aggregate
* trapAxis distribution not dominated (>60% same axis)

---

## 8) Implementation Plan (3 Phases)

### Phase 1 — Data + Validator

1. Add required tags to card schema
2. Add signalRootGroup derivation table
3. Add lie trap fields (`trapAxis`, `baitReason`)
4. Update validator:
   * Enforce tags present
   * Enforce factTouch rules (including perfect partition)
   * Enforce concern P4 and P4+ constraints
   * Simulate all-truth orders ⇒ ≥ CLEARED

### Phase 2 — UX Pacing

1. Add T2 suspicion line + subtitle after sequence bark
2. Add "processing..." beat after T3
3. Add Final Audit panel (Coverage / Independence / Concern)
4. Add ceiling explanation line on Result screen
5. Wire concern computation (priority order + 3-of-3 hit test)

### Phase 3 — Bark Integration

1. Create suspicion line templates (12 concernKeys)
2. Create subtitle templates
3. Create Final Audit line templates
4. Create ceiling explanation templates
5. Update T3 barks to closing-energy only
6. Add structural hints for pair bark generation
7. Ensure sequence barks (30 pairs) remain as personality layer

---

## 9) v1.1+ (Later)

These are explicitly **not in v1 Lite** but can be added later:

* `windowTag` (incident window flavor without timestamps)
* `dependenceGroup` (currently derived from signalRootGroup)
* `tidiness` axis (needs careful redefinition to not punish good play)
* `proximity` axis (subsystem/location clustering)
* `trapMechanism` (more detailed trap classification)
* Weekly anti-meta lint across puzzle sets
* Richer signalRoot taxonomy
* Expose `correlated_strong` vs `correlated_weak` distinction to players

---

## 10) Content Authoring Checklist (Per Puzzle)

### Puzzle checklist (hard requirements)

* [ ] Scenario: household incident, non-crime framing
* [ ] Known facts: exactly 3
* [ ] Cards: 6 total, 3 truths / 3 lies
* [ ] Strengths: truths = {3,3,4}, lies = {3,4,5}
* [ ] Evidence types: ≥3 types, max 2 each
* [ ] All cards have: `factTouch` (scalar 1|2|3), `signalRoot`, `controlPath`, `claimShape`, `subsystem`
* [ ] Each card's `factTouch` is exactly one fact (enforced by scalar type)
* [ ] 3 truths form perfect partition (one per fact)
* [ ] Each lie has `trapAxis` + `baitReason`
* [ ] At least 2 distinct `trapAxis` across lies
* [ ] P4 constraint: at least one concernKey matches a truth
* [ ] P4+ constraint: at least one scenario where truth matches concern AND lie doesn't
* [ ] Validator simulation passes
* [ ] 30 sequence barks provided (T2 pairs) with structural hints
* [ ] T3 barks are closing-energy only

### Bark checklist (Mini-safe)

* [ ] No "lie/false/fake"
* [ ] No "verdict/objection/defense/guilty"
* [ ] No "card/play/turn" wording
* [ ] Suspicion lines reference only dimension labels
* [ ] T3 barks don't evaluate or reveal concern outcome

---

## Quick Reference: The Full T2 → Reveal Flow

```
T2: Player plays second card
    ↓
    KOA: "[Sequence bark]"           ← 30 bespoke pairs (personality)
         "[Suspicion line]"          ← templated by concernKey (P4 setup)
         (Double-checking X.)        ← subtitle for clarity
    ↓
T3: Player plays third card
    ↓
    KOA: "[Closing-energy bark]"     ← no evaluation, just commitment
         "Processing..."             ← brief beat
    ↓
    FINAL AUDIT:
    Facts addressed: ✅/⚠️
    Source diversity: ✅/⚠️
    After my warning: ✅ Diversified / ⚠️ Doubled down / Concern: ✅ Balanced
    ↓
    REVEAL: Outcome + lie explanations
    (If CLEARED with all truths: ceiling explanation line)
```

---

## One-Page Summary

1. **v1 Lite tags:** `factTouch` (scalar), `signalRoot`, `controlPath`, `claimShape`, `subsystem` (cards) + `trapAxis`, `baitReason` (lies)
2. **3 axes only:** Coverage, Independence, Concern
3. **Natural Focus:** KOA expresses suspicion via T2 bark + subtitle, not a UI chip
4. **Concern semantics:** 3-of-3 = doubled down (hit), 2-of-3 = diversified (avoided)
5. **Concern type has payload:** `same_system` stores the repeated `signalRoot` for exact matching
6. **Concern affects FLAWLESS only** — all truths = at least CLEARED
7. **Overlap rule:** When concern.key is `same_system`, Independence is informational only (no double-penalty)
8. **P4+ constraint:** Validator ensures dodging concern can expose you to lies (checks all 30 ordered T2 pairs)
9. **Pair narration preserved:** 30 sequence barks stay for personality
10. **T3 barks:** Closing energy only, no axis evaluation
11. **Final Audit:** Coverage / Independence / Concern shown before reveal ("Balanced" when no_concern)
12. **Ceiling explanation:** KOA explains why all-truths got CLEARED not FLAWLESS
13. **Mini uses Lite mapping:** Not V5 Belief math
14. **Fairness clamp:** All truths in any order ⇒ ≥ CLEARED. Always.
