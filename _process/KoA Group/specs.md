Absolutely — here’s a **clean-slate, full spec doc for A1** (the *novel* version):

* **12 tiles total**
* **3 true sets of 3** (9 “solution” tiles)
* **+ 3 decoy tiles** (belong to no set)
* Player locks **triples** (3 tiles at a time)
* **KOA suspicion** after the first correct lock is **provably double-edged** (P4+) via validator constraints
* Everything is **deterministic + validator enforceable** (no NLP scoring)

---

# A1 — KOA Audit Triples (12 tiles, 3 triples + 3 decoys)

## Full Implementation Spec v1.0 (Non-ambiguous, Validator-enforceable)

**Elevator:**
A daily puzzle where players must **lock 3 correct triples** from a grid of **12 tiles**. Only **9 tiles belong to the solution** (3 triples). The remaining **3 tiles are decoys** (belong nowhere). KOA reacts in-character. After the first correct lock, KOA raises a **suspicion** about a pattern in your choices. That information is **dangerous** (sometimes helpful, sometimes harmful), enforced by validator constraints.

---

## 0) Definition of Done

A build is “A1 v1.0 shipped” only if **all** are true:

### Player experience

* [ ] Rules fit on one screen: **“Make 3 correct groups of 3. 4 misses max.”**
* [ ] Core loop is understandable in **≤ 60 seconds**: select 3 → LOCK → feedback.
* [ ] KOA never names a tile or a group before it is locked.
* [ ] End pacing: **Final Lock → Processing → Final Audit → Reveal → Share** (never abrupt).
* [ ] Players always get at least **one clear reason** on reveal (especially after near-miss traps).

### Fairness & solvability

* [ ] Puzzle has **exactly one intended solution**: **3 disjoint true triples**.
* [ ] The 3 decoy tiles are not part of any valid triple.
* [ ] No alternative valid triple partition exists.
* [ ] Difficulty does not depend on randomness (shuffle is cosmetic only).

### Principles (7/7)

* [ ] **P1 Instant Clarity:** “3 groups of 3.”
* [ ] **P2 Completable:** Unique solution + miss budget.
* [ ] **P3 Counter-intuitive Optimal:** At least one tempting wrong triple exists, and/or lock order meaningfully affects “Perfect” tier.
* [ ] **P4 Dangerous Info:** KOA suspicion is double-edged (validator-enforced).
* [ ] **P5 Satisfying Resolution:** Reveal explains true triples + decoys + why traps were tempting.
* [ ] **P6 Shareability:** Compact share artifact (locks/misses/time/tier).
* [ ] **P7 Fresh Daily:** Generator can produce daily variety with anti-meta constraints.

### System enforceability

* [ ] All validation uses **tags + rules**, not interpreting English.
* [ ] All “dangerous info” constraints are expressible as deterministic checks over hidden tags.

---

## 1) Player-Facing Game Rules

### 1.1 Board

* 12 tiles displayed in a 3×4 (or 4×3) grid.
* Each tile shows **icon + 1–3 words** (scan-first).
* Optional tap-to-expand subtext is allowed but should be rare.

### 1.2 Input

* Tap tiles to select/unselect.
* When **exactly 3 tiles** are selected, **LOCK TRIPLE** becomes enabled.

### 1.3 Lock attempt results

* If the 3 selected tiles exactly match **one of the 3 true triples**:

  * The triple locks into a slot (Slot 1, Slot 2, Slot 3).
  * Those tiles are removed from the grid.
  * The triple’s title is revealed (short).
* Otherwise:

  * It counts as **a Miss**.
  * Selection clears and tiles shake.

### 1.4 Miss budget

* Standard Daily: **4 misses max**.
* On the 4th miss, the run ends immediately → **Processing → Audit → Reveal**.

### 1.5 Win condition

* Win when all **3 true triples** are locked.

---

## 2) Puzzle Data Model (Deterministic)

### 2.1 Types

```ts
type TileId = string;
type SetId = 'S1' | 'S2' | 'S3' | 'DECOY';

type DimensionKey =
  | 'source_group'
  | 'control_path'
  | 'claim_shape'
  | 'evidence_type'
  | 'topic_family'
  | 'none';

type SourceGroup = 'cloud' | 'device' | 'network' | 'human' | 'physical' | 'unknown';
type ControlPath = 'manual' | 'automation' | 'remote' | 'unknown';
type ClaimShape = 'absence' | 'positive' | 'attribution' | 'integrity';
type EvidenceType = 'SENSOR' | 'DIGITAL' | 'TESTIMONY' | 'PHYSICAL' | 'UNKNOWN';

interface Tile {
  id: TileId;
  text: string;         // <= 24 chars recommended
  subtext?: string;     // optional, <= 50 chars
  // Hidden deterministic tags:
  setId: SetId;         // S1/S2/S3 or DECOY
  sourceGroup: SourceGroup;
  controlPath: ControlPath;
  claimShape: ClaimShape;
  evidenceType: EvidenceType;
  topicFamily: string;  // from small enum per theme pack
}
```

### 2.2 True triples and decoys

```ts
interface TrueTriple {
  id: 'S1' | 'S2' | 'S3';
  title: string;            // revealed after lock (<= 32 chars)
  tiles: [TileId, TileId, TileId];
  ruleExplanation: string;  // reveal-only (<= 140 chars)
}

interface DecoyTileExplanation {
  tileId: TileId;
  whyTempting: string;      // <= 120 chars
  whyInvalid: string;       // <= 140 chars
}
```

### 2.3 Concern (KOA suspicion payload)

```ts
type Concern =
  | { key: 'none' }
  | { key: 'dimension'; dim: DimensionKey; value: string };
```

### 2.4 Full puzzle shape

```ts
interface DailyPuzzleA1 {
  puzzleId: string;     // stable seed key: YYYY-MM-DD + variant
  dateISO: string;      // YYYY-MM-DD

  tiles: Tile[];        // length 12
  trueTriples: [TrueTriple, TrueTriple, TrueTriple];

  // Reveal helpers (recommended):
  decoyExplainers: DecoyTileExplanation[]; // length 3, one per DECOY tile

  // KOA voice pools (strings are content-only; no logic embedded):
  koaLines: {
    lockSuccess: string[];     // used on correct lock
    miss: string[];            // used on miss
    suspicion: Record<string, string>;  // templates keyed by Concern rendering key
    suspicionSubtitle: Record<string, string>; // clarity subtitles
    processing: string[];      // after final lock / loss
    final: string[];           // endcap quips
    ceilingExplain: {
      concern: string[];       // CLEARED not FLAWLESS due to concern
      independence: string[];  // CLEARED not FLAWLESS due to correlation
      both: string[];          // both
    };
  };
}
```

---

## 3) Core Deterministic Engine Logic

### 3.1 Authoritative triple check

A lock is correct iff the selection exactly equals one of the `trueTriples.tiles` (order-insensitive).

```ts
function isTrueTriple(sel: TileId[], puzzle: DailyPuzzleA1): boolean {
  if (sel.length !== 3) return false;
  return puzzle.trueTriples.some(tt => sameMembers(sel, tt.tiles));
}
```

No semantic interpretation is allowed.

### 3.2 Non-spoilery “closeness” feedback (optional but recommended)

To make retries addictive without giving answers, provide a **tight hint scale** on misses:

Compute:

* For each true triple `T`, overlap = |sel ∩ T|
* Let `best = max overlap over T`

Then display:

* `best == 0` → “No connection.”
* `best == 1` → “One of these belongs somewhere else.”
* `best == 2` → “Close. One tile is poisoning this.”
* (`best == 3` would have been a correct lock.)

**Hard rule:** never identify which tile is wrong.

This is deterministic and makes the “near miss” loop sticky.

---

## 4) KOA Suspicion (P4 lever) — computed after first correct lock

### 4.1 When it triggers

Immediately after the **first correct triple** is locked.

### 4.2 How it’s computed (priority order)

Let `firstSetTiles = the 3 tiles in the first locked true triple`.

A dimension is eligible if **≥ 2 of 3** tiles share the same value (and not unknown where applicable).

Priority:

1. `source_group` (value != unknown)
2. `control_path` (value != unknown)
3. `claim_shape`
4. `evidence_type` (value != UNKNOWN)
5. `topic_family`
   else → none

```ts
function computeConcern(firstSetTiles: Tile[]): Concern {
  // Return {key:'dimension', dim, value} or {key:'none'}
}
```

**Important:** Concern is computed **once**, stored, and never recomputed.

### 4.3 How Concern is evaluated (end-of-run)

Concern is a **FLAWLESS ceiling only** (never blocks win).

Define `dominantValue(setTiles, dim)`:

* The value is “dominant” if it appears **≥ 2 of 3** tiles in that set.
* Else dominantValue = `"mixed"`.

Now evaluate Concern hit:

* If `Concern.key == 'none'` → hit = false
* Else hit = true iff **two or more** locked true triples have `dominantValue(dim) == Concern.value`

This captures “leaning on one pillar” across your locked sets, not just one coincidence.

### 4.4 Independence (correlation) for audit

Independence is computed similarly but uses only `sourceGroup`:

* dominantGroup per locked set = mode of `sourceGroup` if appears ≥2/3 (else mixed)
* If two locked sets share the same dominantGroup and group != mixed/unknown → correlated

This is coarse on purpose.

---

## 5) Outcomes and Final Audit

### 5.1 Result tiers (deterministic, public)

Keep tiers simple:

* **FLAWLESS:** win AND missesUsed ≤ 1 AND Concern not hit AND Independence not correlated
* **CLEARED:** win (any missesUsed ≤ 4)
* **BUSTED:** missesUsed == 4 (loss)

You can tune miss thresholds, but keep them explicit and deterministic.

### 5.2 Final pacing (always)

On win or loss:
**Processing…** (1–2 sec) → **Final Audit** (2–4 sec) → **Reveal**

### 5.3 Final Audit panel (always shown)

Show exactly 3 lines:

* **Sets locked:** `0..3`
* **Source variety:** ✅ Varied / ⚠️ Correlated
* **After my warning:** ✅ Balanced / ⚠️ Still leaning / ✅ No concern

No spoilers. No tile names.

### 5.4 Ceiling explanation (required UX)

If the player wins but does not get FLAWLESS:

* If blocked by Concern:

  * “You solved it. But you leaned hard on one pattern after I flagged it. No gold star.”
* If blocked by Independence:

  * “You solved it. But your sets trace back to the same kind of source. Noted.”
* If blocked by both:

  * “You solved it. But you doubled down *and* your sources overlap. I’m watching you.”

(Use KOA voice pools; keep this “in character,” not mechanical.)

---

## 6) KOA Voice System (Non-spoiler contract)

### 6.1 KOA must never

* Name a tile
* Name a set title before it’s locked
* Say which tile is wrong
* Mention internal tags (“sourceGroup”, “claimShape”, etc.)

### 6.2 KOA may

* Talk in metaphors: “same channel,” “one pillar,” “same kind of story”
* Express suspicion after first lock (P4 setup)
* Tease misses without revealing structure

### 6.3 When KOA speaks

1. On correct lock → `lockSuccess[]`
2. On miss → `miss[]` (+ optional closeness line)
3. After first correct lock → suspicion line + subtitle (if Concern != none)
4. On final step → processing line
5. On reveal → final quip

### 6.4 Suspicion rendering

Concern `{dim, value}` is mapped to KOA language:

* source_group → “same kind of source”
* control_path → “same way actions happen”
* claim_shape → “same shape of claim”
* evidence_type → “same kind of evidence”
* topic_family → “same theme”

Subtitle provides clarity without mechanics:

* “(I’m watching that pattern.)”

---

## 7) Generator Contract (LLM allowed, Validator authoritative)

### 7.1 LLM responsibilities (allowed)

LLM can generate:

* Theme (optional 1 sentence)
* Tile text (+ optional subtext)
* True triple titles + rule explanations
* Decoy explainer text
* KOA bark pools
* Hidden tags per tile (from enums)

LLM must output:

* `setId` for each tile (S1/S2/S3/DECOY)
* `trueTriples` membership (authoritative target)

### 7.2 Validator responsibilities (authoritative)

Validator enforces:

* Structure, uniqueness, decoy integrity
* P3/P4/P4+ constraints
* Anti-meta constraints across a rolling window

LLM output is never trusted without validator pass.

---

## 8) Validator Spec (Non-ambiguous)

### 8.1 Basic structure checks

* `tiles.length == 12`
* Exactly 9 tiles have `setId in {S1,S2,S3}` and exactly 3 have `setId == DECOY`
* `trueTriples.length == 3`
* Each true triple has 3 distinct tiles
* True triples are disjoint and cover exactly the 9 solution tiles
* All enums are valid (no arbitrary strings)

### 8.2 Unique solution check (triple-based)

We require that the **only** triples that lock are the three true triples.

Deterministic check:

* Generate all combinations of 3 tiles from 12: `C(12,3)=220`
* Count how many combos match any true triple (as sets)
* Must be **exactly 3**
* And those 3 must be disjoint and cover exactly the 9 non-decoy tiles

### 8.3 P3 constraint (counter-intuitive optimal)

Require at least one “tempting wrong triple” exists.

Define a deterministic **surface coherence score** for any triple of tiles:

+1 if ≥2 share `sourceGroup` (and not unknown)
+1 if ≥2 share `controlPath` (and not unknown)
+1 if ≥2 share `claimShape`
+1 if ≥2 share `evidenceType` (and not UNKNOWN)
+1 if ≥2 share `topicFamily`

Now require:

* There exists at least one **wrong** triple with coherence ≥ 4
* And its bestOverlap with any true triple is 2 (a near-miss), to avoid pure randomness.

This creates “I was *so close*” moments.

### 8.4 P4 basic (suspicion triggers sometimes)

Across the 3 possible first-lock scenarios (S1, S2, S3):

* At least one produces `Concern != none`.

### 8.5 P4+ proper (dangerous info is double-edged)

For at least one first-lock scenario producing `Concern = {dim,value}`:

Among the remaining two true triples:

* At least one remaining true triple has `dominantValue(dim) == value`
  (so “doubling down” can be correct)

AND there exists a **tempting wrong triple** available after that first lock such that:

* It has coherence ≥ 4
* It includes **at least one DECOY tile**
* And its `dominantValue(dim) != value`
  (so “avoiding the warned pattern” can tempt you into a trap)

This enforces the real dilemma:

* Continue the warned pattern (might be right)
* Avoid it (might lead you into a near-miss decoy)

### 8.6 Anti-meta constraints (rolling window, recommend N=14)

Across last N puzzles:

* No single Concern dimension triggers > 60%
* No single evidenceType dominates tiles > 60%
* At least 2 distinct topic families per week
* At least 3 distinct Concern dims per week (unless Concern=none that day)

---

## 9) UX Flow (Exact)

### 9.1 Start

* Show date/title
* Show 12 tiles
* Show misses remaining: `4 - missesUsed`

### 9.2 Correct lock #1

* Lock animation → Slot 1
* Reveal title for that triple
* KOA success line
* Compute and store Concern from locked triple
* If Concern != none:

  * KOA suspicion line + subtitle

### 9.3 Subsequent locks / misses

* Correct locks fill Slot 2, Slot 3 similarly
* Misses shake + KOA miss bark (+ optional closeness line)

### 9.4 End

On win or loss:

* KOA closing line
* “Processing…”
* Final Audit
* Reveal screen

### 9.5 Reveal screen contents

* Outcome tier (FLAWLESS/CLEARED/BUSTED)
* True triples:

  * title + tiles + ruleExplanation
* Decoy tiles section:

  * each decoy tile + whyTempting + whyInvalid
* KOA final quip
* Share button

---

## 10) Share Artifact (Deterministic)

Example compact share string:

`A1 2026-01-30  ✅✅✅  ⛔⛔  01:18  FLAWLESS`

Where:

* ✅ count = locked triples (3 max)
* ⛔ count = misses used
* time elapsed
* tier

Optional: include lock order as digits `1-2-3` for the slots filled (not category names).

---

## 11) Implementation Checklist (Step-by-step)

### Phase 1 — Engine & Schema

* [ ] Implement Tile + TrueTriple + Concern schemas
* [ ] Implement `isTrueTriple()`
* [ ] Implement miss tracking + end conditions
* [ ] Implement computeConcern() + store
* [ ] Implement dominantValue() per dimension
* [ ] Implement Concern hit evaluation
* [ ] Implement Independence evaluation

### Phase 2 — Validator

* [ ] Basic structure checks (9 solution + 3 decoys)
* [ ] Unique solution check over 220 triples
* [ ] Coherence scoring
* [ ] P3 near-miss trap existence
* [ ] P4 basic trigger existence
* [ ] P4+ double-edged constraint (first-lock scenario search)
* [ ] Rolling anti-meta lint harness

### Phase 3 — UX & Copy

* [ ] Grid UI + selection rules (3 tiles)
* [ ] Lock animation + slot UI
* [ ] KOA bark system + suspicion bark + subtitles
* [ ] Processing + Final Audit + Reveal
* [ ] Ceiling explanation for CLEARED-not-FLAWLESS
* [ ] Share artifact

---

## 12) v1.1+ Extensions (Explicitly not required)

* Hard Daily (3 misses max)
* One-time “KOA Nudge”: highlights 3 tiles containing **exactly 2** from a true triple (still not solving)
* Weekly theme packs
* Cosmetic KOA voice packs / tile skins

---

## Why A1 is not “just Connections”

Connections-style puzzles typically:

* cover all tiles with sets (endgame becomes forced)
* don’t have “true decoys” (just alternative groupings)

A1 is meaningfully different because:

* **decoy tiles** keep the final choice non-forced
* KOA’s suspicion is **provably double-edged** (P4+)
* your “perfect” tier is about **composition under scrutiny**, not just solving

---

If you want, I can also generate:

1. **validator pseudocode** for P4+ search (exact loops), and
2. a **full JSON example puzzle** that passes every check (including decoy explainers + KOA bark pools).
