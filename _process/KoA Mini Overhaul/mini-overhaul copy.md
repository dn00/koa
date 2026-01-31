# KOA Mini Axis Overhaul v1 — Complete Implementation Doc

**Goal:** Replace card-level “tax/lock” depth with **composition-level pressure** (axes) + a **Final Audit beat**, while keeping Mini **Wordle-simple, fair, and scalable**.

This doc is written to be **non-ambiguous** and **validator-enforceable**, so another LLM (or agent) can implement without guessing.

---

## 0) Definition of Done

A build is “Axis Overhaul Complete” only if **all** are true:

### Player experience

* [ ] Mini still feels like: “Pick 3, KOA reacts, outcome.”
* [ ] Turn 3 is not abrupt: **Commit → Final Audit → Reveal** every run.
* [ ] Players can always understand *one or two* reasons they failed.
* [ ] No mid-run bark reveals truth/lie.

### Fairness

* [ ] **All 3 truths selected (any order) ⇒ Outcome ≥ CLEARED** (Mini only).
* [ ] Axis/Focus can affect **FLAWLESS eligibility**, but never prevent CLEARED when all truths were played.

### System enforceability

* [ ] All new tags are deterministic (no NLP required to compute axes).
* [ ] Validator enforces: axis contract, touch mapping rules, lie trap mapping, focus determinism, anti-meta checks.

---

## 1) Phase 0 — Pre-Overhaul Cleanups

Do these first to avoid rework.

### 1.1 Remove courtroom framing in Mini copy

Replace everywhere in Mini UI/spec:

* “Verdict” → **Outcome**
* “Verdict screen” → **Result screen**
* “Verdict line” → **Outcome line**

Checklist:

* [ ] Spec sections updated
* [ ] UI strings updated
* [ ] Bark library filtered (no “verdict”, “defense”, etc.)

### 1.2 Fix Monday contradiction wording

If any doc says “direct contradictions” for Mini, change to:

* **Monday:** “two clean one-step inferences” (still not keyword-matching)

Checklist:

* [ ] Rotation doc updated
* [ ] Generator prompt updated
* [ ] Reviewer checklist updated

### 1.3 Decide “time” replacement vocabulary (Mini has no timestamps)

Mini must not reference clock times. Replace timeline talk with **event window tags**:

* **New field:** `windowTag: 'during_incident' | 'before_incident' | 'after_incident' | 'overnight_general' | 'unknown'`

Checklist:

* [ ] Barks avoid “2:50–3:05” style references
* [ ] Any “timeline clustering” axis becomes “window clustering” using `windowTag`

### 1.4 Type Tax and KOA Flag in Mini

Mini should not feel punished by hidden math.

**Rule:** In Mini, Type Tax / Flag effects may exist under the hood but must **never** reduce “all truths” below CLEARED.

Recommended simplification:

* **Mini:** Remove Type Tax and KOA Flag *from win/loss math* (or clamp outcome).
* **Advanced:** keep full V5 mechanics.

Checklist:

* [ ] Mini scoring path defined (see §6)
* [ ] Advanced scoring unchanged

---

## 2) Phase 1 — Data Model Changes (Schema)

This is the “connective tissue” that makes axes deterministic.

### 2.1 Card shape (Mini-compatible V5)

Add these **hidden axis tags** to every card.

```ts
type EvidenceType = 'SENSOR' | 'DIGITAL' | 'TESTIMONY' | 'PHYSICAL';

type ControlPath = 'manual' | 'automation' | 'remote' | 'unknown';

type ClaimShape = 'absence' | 'positive' | 'attribution' | 'integrity';

type WindowTag =
  | 'during_incident'
  | 'before_incident'
  | 'after_incident'
  | 'overnight_general'
  | 'unknown';

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
  | 'wearable_sleep'
  | 'human_partner'
  | 'human_neighbor'
  | 'human_self'
  | 'receipt_photo'
  | 'unknown';

interface CardV5Mini {
  id: string;
  source: string;
  strength: 3 | 4 | 5;
  evidenceType: EvidenceType;
  location: string;
  time?: '' | string;     // Mini: should be '' or omitted
  claim: string;
  presentLine: string;
  isLie: boolean;

  // NEW tags (required)
  subsystem: string;          // e.g. 'printer', 'thermostat', 'garage', 'router'
  controlPath: ControlPath;   // manual/automation/remote/unknown
  claimShape: ClaimShape;     // absence/positive/attribution/integrity
  dependenceGroup: string;    // coarse bucket e.g. 'smart-home-cloud', 'phone-telemetry', 'human-witness'
  signalRoot: SignalRoot;     // fine-grained independence primitive
  windowTag: WindowTag;       // incident window without timestamps

  /**
   * factTouches = which known fact(s) this card *purports to address*.
   * Not "consistent with". Lies will also touch their target fact.
   */
  factTouches: (1 | 2 | 3)[];
}
```

#### Required constraints (validator enforced)

* [ ] `factTouches.length` is **1** for most cards.
* [ ] At most **1 card per puzzle** may have `factTouches.length === 2`.
* [ ] No card may touch all 3 facts.
* [ ] `signalRoot` must be one of the defined enum values (no creative strings).
* [ ] `time` is `''` or absent in Mini.

---

### 2.2 Lie metadata (make “axis trap” enforceable)

Extend lie info so every lie is a designed trap.

```ts
type LieType = 'inferential' | 'relational';

type TrapAxis =
  | 'coverage'
  | 'independence'
  | 'control_path'
  | 'claim_shape'
  | 'tidiness'
  | 'proximity';

type TrapMechanism =
  // coverage
  | 'patch_gap'
  | 'reduce_overlap'
  // independence
  | 'add_diversity'
  | 'feign_independence'
  // control path
  | 'automation_alibi'
  | 'remote_alibi'
  | 'manual_denial'
  // claim shape
  | 'absence_seduction'
  | 'integrity_shield'
  | 'attribution_scapegoat'
  // tidiness/proximity
  | 'too_neat_story'
  | 'single_room_story';

interface LieInfoV5Mini {
  cardId: string;
  lieType: LieType;
  reason: string;      // post-reveal explanation; can mention facts

  // NEW (required)
  trapAxis: TrapAxis;
  trapMechanism: TrapMechanism;
  baitReason: string;  // 1 sentence, non-technical: why players will pick it
}
```

Validator requirements:

* [ ] Exactly 3 lies in `lies[]`, one per lie card.
* [ ] All lies have trapAxis/trapMechanism/baitReason populated.
* [ ] trapAxis distribution per puzzle: at least **2 distinct trapAxis** across 3 lies (anti-meta).

---

## 3) Phase 2 — Axis Contract (What Axes Can/Can’t Say)

This is the V3-collapse prevention rule.

### 3.1 Axis outputs must be structural states only

Axes may output **only** the following states (or a strict subset). No card IDs. No “conflicts Fact #2” pre-reveal.

#### Coverage

* `complete`
* `gap_fact_1`
* `gap_fact_2`
* `gap_fact_3`
* `overlap_heavy`

#### Independence

* `diverse`
* `correlated`
* `single_point_failure`

#### Control-path

* `manual_heavy`
* `automation_heavy`
* `remote_heavy`
* `mixed`

#### Claim-shape mix

* `absence_heavy`
* `attribution_heavy`
* `integrity_heavy`
* `mixed`

#### Tidiness

* `too_clean`
* `plausible`
* `chaotic`

#### Proximity

* `single_subsystem`
* `single_location`
* `spread`

### 3.2 Forbidden pre-reveal content

In Turn 1/2/3 barks and Final Audit:

* ❌ mention any specific card ID/name/source
* ❌ “this is wrong / lie / fabricated / false / doesn’t match”
* ❌ “conflicts Fact #X”
* ❌ “pick X next” / “you should” instructions

Allowed: skepticism, patterns, structure, “so far”.

---

## 4) Phase 3 — Deterministic Axis Computation

All axes computed from tags + known facts mapping, no NLP.

### 4.1 Coverage computation (uses factTouches)

Input: played cards so far (1–3).

Algorithm:

1. Let `covered = union(all factTouches from played cards)`.
2. If `covered` contains {1,2,3} ⇒ `coverage = complete`
3. Else if missing exactly one ⇒ `gap_fact_n` for the missing fact
4. If `covered` size is 1 and you have ≥2 cards touching the same fact ⇒ `overlap_heavy` (override gap state)

Validator check:

* [ ] Overlap-heavy can only occur if 2+ cards touch the same fact.

### 4.2 Independence computation (uses signalRoot + dependenceGroup)

Input: played cards.

Algorithm:

1. If any two played cards share same `signalRoot` (and signalRoot != 'unknown'):

   * If also same `dependenceGroup` ⇒ `single_point_failure`
   * Else ⇒ `correlated`
2. Else if two share same `dependenceGroup` ⇒ `correlated`
3. Else ⇒ `diverse`

### 4.3 Control-path computation

Count controlPath among played cards (ignore unknown if possible):

* If 2+ automation and no other dominates ⇒ `automation_heavy`
* If 2+ remote ⇒ `remote_heavy`
* If 2+ manual ⇒ `manual_heavy`
* Else `mixed`

### 4.4 Claim-shape mix

Same as controlPath:

* If 2+ absence ⇒ `absence_heavy`
* If 2+ attribution ⇒ `attribution_heavy`
* If 2+ integrity ⇒ `integrity_heavy`
* Else `mixed`

### 4.5 Tidiness

Tidiness is derived from *structural* alignment, not correctness.

Suggested deterministic proxy (simple and stable):

* If `coverage=complete` AND `independence=diverse` AND no `unknown` tags among controlPath/signalRoot for played cards ⇒ `too_clean`
* If 2+ unknown tags among played cards ⇒ `chaotic`
* Else `plausible`

(You can tune later, but keep deterministic.)

### 4.6 Proximity

* If all played cards share same `subsystem` ⇒ `single_subsystem`
* Else if all share same `location` ⇒ `single_location`
* Else `spread`

---

## 5) Phase 4 — Focus Dimension (Deterministic “Suspicion Focus”)

Focus is your “dangerous info” lever; it must be predictable and never card-specific.

### 5.1 Focus triggers (priority order)

After Turn 2 only (compute from the two played cards):

1. If same `signalRoot` and not unknown ⇒ `FOCUS: SAME SOURCE ROOT`
2. Else if same `dependenceGroup` ⇒ `FOCUS: SAME SYSTEM`
3. Else if same `claimShape` ⇒ `FOCUS: [CLAIM SHAPE]` (e.g. ABSENCE CLAIMS)
4. Else if same `controlPath` ⇒ `FOCUS: [CONTROL PATH]` (e.g. AUTOMATION ALIBIS)
5. Else if same `evidenceType` ⇒ `FOCUS: [EVIDENCE TYPE]` (e.g. DEVICE LOGS)
6. Else ⇒ `FOCUS: NONE`

### 5.2 Focus effect (Mini only)

**Hard rule:** Focus can only affect **FLAWLESS eligibility**, not CLEARED.

Implementation options:

* **Option A (cleanest):** If Focus triggers and Turn 3 matches focus dimension ⇒ `flawlessEligible=false`
* **Option B:** apply small internal penalty but clamp all-truth runs to CLEARED

Validator:

* [ ] In simulated all-truth runs, worst-case focus outcome still yields ≥ CLEARED.

---

## 6) Phase 5 — Final Audit Beat (Fix abrupt Turn 3)

Turn 3 must always flow:

**Pick 3rd card → KOA “processing” → Final Audit panel → Result screen**

### 6.1 Final Audit panel (always 3 lines)

Displayed for ~2–4 seconds, no interaction required.

Must show exactly:

* **Coverage:** `complete / gap`
* **Independence:** `diverse / correlated / single point`
* **Focus:** the focus label computed after Turn 2 (and whether you avoided/hit it)

No mention of lies. No card names.

Example display:

* Coverage: ✅ Complete / ⚠️ Gap
* Independence: ✅ Diverse / ⚠️ Correlated / 🚫 Single point
* Focus: “ABSENCE CLAIMS — avoided” (or “hit”)

### 6.2 Outcome mapping (Mini fairness clamp)

Outcome tiers are still BUSTED/CLOSE/CLEARED/FLAWLESS, but:

**Mini clamp:**

* If selected cards are all truths ⇒ outcome is at least CLEARED
* FLAWLESS requires:

  * all truths AND
  * `flawlessEligible=true` (focus not hit) AND
  * optional: independence not single_point_failure (your choice)

This gives Turn 3 meaning while keeping fairness.

---

## 7) Phase 6 — Bark System Overhaul (Axis Families + Budget)

You already have barks; this makes them axis-driven and scalable.

### 7.1 Axis budget (strict)

Per run:

* Turn 1: **1 axis mention max**
* Turn 2: **1 axis mention max + Focus setup line**
* Turn 3: **1 axis mention max** (capstone)
* Final Audit: no jokes, just the three checks (can have a single header quip)

Rule:

* Never mention more than one axis in a single bark.

### 7.2 Bark selection keys

Barks are selected by:

* `turnIndex` (1|2|3)
* `primaryAxis` chosen for that turn
* `axisState` computed
* optional: `difficultyBand` (easy/standard/hard)

Suggested key format:

* `t2.coverage.gap_fact_3`
* `t2.focus.absence_claims`
* `t3.independence.single_point_failure`

### 7.3 Choosing the primary axis each turn (deterministic)

At each turn, compute all axis states, then pick the **most salient** via priority:

Turn 1 priority:

1. control_path heavy (if manual/automation/remote heavy)
2. claim_shape heavy
3. proximity single
4. fallback: “neutral curiosity”

Turn 2 priority:

1. coverage is gap or overlap_heavy
2. independence correlated/single_point
3. focus trigger (always appended as separate setup line)
4. claim_shape heavy

Turn 3 priority:

1. coverage gap resolved vs not (compare T2 → T3)
2. independence worsened vs improved (compare)
3. tidiness too_clean/chaotic

(Comparisons use axis state transitions; no card IDs.)

### 7.4 Bark content rules (Mini-safe)

* Must be 1–2 sentences.
* Must reference “so far” / “your story” not “that source”.
* Must not say “truth/lie”.
* Must not instruct.

---

## 8) Phase 7 — Generator Changes (Puzzle Authoring Contract)

Update your puzzle generator prompt/spec so it must output tags + trap mapping.

### 8.1 Authoring steps (required)

1. Pick scenario seed and 3 known facts.
2. Design 3 lies **as axis traps first**:

   * each has trapAxis + trapMechanism + baitReason
3. Create 3 truths consistent with all facts.
4. Assign deterministic tags to all cards:

   * controlPath, claimShape, subsystem, dependenceGroup, signalRoot, windowTag, factTouches
5. Validate constraints:

   * 3 facts, 6 cards, strengths fixed, evidence type distribution, etc.
6. Run validator simulation:

   * all-truth combos clamp to ≥ CLEARED
   * ensure only one winning “truth set” (still 3 truths)
7. Produce bark families or bark keys only (not 30 bespoke pair barks).

### 8.2 Lie trap design requirement (non-negotiable)

Each lie must be tempting because it:

* patches a coverage gap, OR
* adds “diversity,” OR
* offers a convenient automation/remote explanation, OR
* offers a seductive absence/integrity claim.

Generator must explicitly label this via trap fields.

---

## 9) Phase 8 — Validator Updates (prototype-v5.ts)

This is where ambiguity dies. Add these checks.

### 9.1 Existing checks (keep)

* [ ] Exactly 6 cards, 3 truths, 3 lies
* [ ] Exactly 3 known facts
* [ ] Strengths truths = {3,3,4}; lies = {3,4,5}
* [ ] Evidence types: ≥3 types, max 2 each
* [ ] Claim length target (soft warning)
* [ ] No timestamps in Mini (hard rule: time empty/omitted)

### 9.2 New checks (hard)

**Tags present**

* [ ] Every card has: subsystem, controlPath, claimShape, dependenceGroup, signalRoot, windowTag, factTouches
* [ ] signalRoot is from enum (no arbitrary strings)

**factTouches constraints**

* [ ] Each card touches 1 fact (except at most 1 card touches 2)
* [ ] No card touches 3
* [ ] Each fact (1,2,3) is touched by at least 1 card overall (recommended; can be hard)

**Lie trap mapping**

* [ ] Each lie has trapAxis/trapMechanism/baitReason
* [ ] At least 2 distinct trapAxis across the 3 lies

**Focus determinism**

* [ ] Focus label computed from first two picks is always reproducible
* [ ] Focus label never includes card names

### 9.3 Mini fairness simulation (required)

Simulate all 20 possible 3-card selections:

* Confirm exactly 1 selection yields “all truths” (the 3 truth cards)
* Confirm that selection yields ≥ CLEARED **in all 6 orders** (since order can affect focus eligibility but not clearing)

If your engine uses any hidden penalties in Mini:

* apply them during simulation,
* then clamp outcomes accordingly.

### 9.4 Anti-meta window check (rolling)

Validator can’t see player telemetry, but it can enforce “pattern variety” on content:

* Over a rolling set of N puzzles (e.g. 14), ensure:

  * trapAxis distribution not dominated (>60% same axis)
  * signalRoot “badness” not always same (e.g., not always phone_os lies)
  * claimShape of lies not always absence

(If this is too heavy for validator, put it in the content pipeline lint step.)

---

## 10) Phase 9 — Telemetry + Anti-Meta Harness (Production Guardrails)

### 10.1 Required events

Log:

* `puzzle_started`
* `card_picked` (turnIndex, cardId)
* `audit_shown` (coverageState, independenceState, focusLabel, focusHit)
* `puzzle_completed` (tier, truthsPlayedCount, liesPlayedCount)
* `share_clicked`

### 10.2 Weekly checks (automated)

* T1 dominance: no single cardId > 60–70% first pick
* Evidence type avoidance: if DIGITAL underpicked, schedule puzzles with DIGITAL anchor truth
* Tier distribution:

  * CLEARED: target 60–80% among “skilled cohort”
  * FLAWLESS: 20–40% among skilled
* Median session time: 4–8 minutes

### 10.3 Anti-meta interventions (content knobs)

Rotate:

* which trapAxis dominates on which day
* which claimShape is “dangerous”
* which evidenceType contains the anchor truth
* which signalRoot produces lies

---

## 11) Rollout Plan (No surprises)

### 11.1 Build order

1. Schema changes + validator tag checks
2. factTouches and trap mapping enforced
3. Axis computation + Focus algorithm
4. Final Audit UI + flow
5. Bark key system (axis families)
6. Mini fairness clamp
7. Telemetry + weekly harness
8. Content rotation configs

### 11.2 Testing checklist

* [ ] Golden puzzle set (10 puzzles) passes validator
* [ ] Manual playtest: 10 runs with “already know truths” → Turn 3 still feels meaningful
* [ ] Regression: no bark uses forbidden words
* [ ] Confirm “all truths” never results in CLOSE/BUSTED

---

## 12) Content Authoring Checklist (Per Puzzle)

### Puzzle checklist (hard)

* [ ] Scenario: household incident, non-crime framing
* [ ] Known facts: exactly 3, each maps 1:1 to a lie contradiction
* [ ] Cards: 6 total, 3 truths/3 lies
* [ ] Strengths fixed
* [ ] Evidence type constraints satisfied
* [ ] All cards have required axis tags
* [ ] Each lie has trapAxis + trapMechanism + baitReason
* [ ] factTouches valid, and coverage is “dangerous” (lies touch facts too)
* [ ] Validator simulation passes
* [ ] Barks exist via axis keys (no bespoke 30-pair requirement)

### Bark checklist (Mini-safe)

* [ ] No “lie/false/fake”
* [ ] No “verdict/objection/defense/guilty”
* [ ] No “card/play/turn” wording (use “what you’ve shown me / your story so far”)

---

# One-page “No Mistakes” Summary for the other LLM

If you copy only one section, copy this:

1. **Add required tags to every card**: subsystem, controlPath, claimShape, dependenceGroup, signalRoot, windowTag, factTouches.
2. **Add required trap mapping to every lie**: trapAxis, trapMechanism, baitReason.
3. **Axis Contract:** barks/audit can only output structural states (coverage gap/complete, independence diverse/correlated, etc.). Never reference specific cards pre-reveal.
4. **Focus Dimension:** after Turn 2 compute focus label by strict priority (signalRoot → dependenceGroup → claimShape → controlPath → evidenceType). Focus affects **FLAWLESS only**.
5. **Final Audit beat always shown** after Turn 3 (Coverage / Independence / Focus).
6. **Mini fairness clamp:** all truths in any order ⇒ ≥ CLEARED.
7. **Validator must simulate all combos** and enforce all of the above.

<!-- ---

If you want, I can also produce:

* a concrete `AxisState` TypeScript type + `computeAxisState()` pseudocode,
* the full bark key table (states → example lines),
* and a diff-style patch to your existing spec sections (§3–§7). -->
