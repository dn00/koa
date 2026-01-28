# KOA Mini — V5 Default Daily Mode Spec

**Purpose:** Define the simplified, Wordle-style daily mode for Home Smart Home (“KOA Mini”) that uses the V5 engine under the hood but exposes a much lighter rule surface. This is the mode most players see by default; V5 “Advanced” remains available for depth.

**Last Updated:** 2026-01-28  
**Related docs:**  
- `_process/v5-design/v5-design.md` — full V5 design  
- `_process/v5-design/v5-design-context.md` — V5 invariants  
- `_process/context/v5-daily-rotation.md` — weekly difficulty pattern  
- `_process/context/v5-scenario-seeds.md` — incident seeds  
- `_process/context/v5-daily-schedule-100.md` — example 100‑day schedule  
- `scripts/prototype-v5.ts` — validator

---

## 1. High-Level Concept

**KOA Mini** is the **default daily puzzle**: a 2–4 minute, phone-first, “three picks and a verdict” experience.

- You read a short **scenario** and a few **Known Facts**.  
- You see **6 evidence cards**. Exactly **2 are lies** (hidden).  
- You **play 3 cards total**; KOA reacts after each one.  
- At the end, KOA reveals which cards were lies and gives a **tier verdict** (BUSTED / CLOSE / CLEARED / FLAWLESS) with a short quip.  
- There are **no visible numbers**, no explicit scoring formula, and no explicit KOA Flag choice; all numeric mechanics stay under the hood.

KOA Mini is meant to feel as simple to explain as:

> “Pick 3 evidence cards that fit the facts; KOA tells you if your story holds up.”

V5 Advanced mode exposes the full Belief bar, Type Tax rule, and KOA Flag decision for players who want deeper mechanics.

---

## 2. Player-Facing Rules (Mini)

Everything a KOA Mini player needs to know should fit on one screen:

1. **Scenario & Facts**
   - Scenario: 1–2 sentences about what KOA is suspicious of (“The printer ran at 3 AM; you claim you were asleep.”).  
   - Known Facts: 3–5 bullet points that are guaranteed true.

2. **Evidence Cards**
   - You see 6 cards. Each card shows:
     - A short name (id / label)  
     - Type (DIGITAL / SENSOR / TESTIMONY / PHYSICAL)  
     - Location (where)  
     - Time (when)  
     - Claim (what it asserts)
   - You know 2 of these are lies, but not which ones.

3. **Your Task**
   - “Pick **3 evidence cards** that best support your story and fit the Known Facts.”  
   - You tap cards one at a time; KOA responds after each.

4. **Outcome**
   - After you pick 3 cards, KOA:
     - Reveals which played cards were lies.  
     - Shows a tier result (BUSTED / CLOSE / CLEARED / FLAWLESS).  
     - Optionally explains **one or two key contradictions** (“`email_draft` conflicted with your ‘in bed by 11’ claim.”).

No mention of Belief numbers, type tax, or KOA Flag appears in the KOA Mini rules. Those remain internal.

---

## 3. Core Loop & UX Flow

**Step 1: Read**
- Top of screen:
  - Scenario (1–2 lines).  
  - Known Facts (3–5 bullets).

**Step 2: Inspect Cards**
- Middle of screen:
  - 6 cards visible (2×3 grid or scroll).  
  - Each card shows type, time, location, strength icon, and claim in a compact layout.

**Step 3: Pick Card 1**
- Player taps a card → it becomes “played”:
  - Card animates to a “Story so far” strip at top/bottom.  
  - KOA shows a short bark (PRE_REVEAL_BARK) reacting along axes (timeline, channel, plausibility, coherence) but not naming truth/lie.
- A simple indicator updates: `Step 1 of 3` → `Step 2 of 3`.

**Step 4: Pick Card 2**
- Same as above:
  - Player taps second card.  
  - Card moves to Story strip.  
  - KOA bark again.
- After card 2, KOA may deliver a slightly heightened “system check” line:
  - E.g., “If this last claim doesn’t match my logs, your whole night leans on it.”
- Indicator: `Step 2 of 3` → `Step 3 of 3`.

**Step 5: Pick Card 3**
- Player taps third card:
  - Card moves to Story strip.  
  - KOA short reaction bark.
- Immediately transition into the verdict presentation.

**Step 6: Verdict Screen**
- Show:
  - Tier: BUSTED / CLOSE / CLEARED / FLAWLESS (with color).  
  - One KOA verdict line (from puzzle verdicts).  
  - Cards you played, with **lie marks** on the ones that were lies.  
  - Optional “why” bullets:
    - “`email_draft` contradicted Fact #2 (your ‘in bed by 11’ claim).”  
    - “`printer_queue` essentially proved KOA’s suspicion.”
- Optional “Share” button with a compact artifact (see §7).

No undo: once you pick a card, it’s locked in. That’s critical for tension.

---

## 4. Under-the-Hood Mechanics (Engine Contract)

KOA Mini uses the existing V5 engine; the difference is **presentation**, not core math.

**4.1 Cards & Lies**
- Use `V5Puzzle` shape (`scripts/v5-types.ts`):
  - 6 cards (4 truths, 2 lies).  
  - `lies` metadata with `lieType` and `reason`.  
  - Tuning as per `puzzle-archetype-spec.md` and validated by `prototype-v5.ts`.

**4.2 Scoring & Tiers (unchanged from V5)**
- Belief starts at `DEFAULT_CONFIG.startingBelief` (e.g., 50).  
- On each card:
  - If truth: add `strength`.  
  - If lie: add `-(strength−1)`.  
- Type Tax:
  - If current card’s `evidenceType` matches previous card’s, apply `typeTax.penalty` (default −2) to the **next** card’s delta.  
  - This remains internal; Mini does not display or explain the rule.
- KOA Flag / System Check (hidden):
  - After second card, run the same KOA Flag logic as V5:
    - Stand-by truth: +2; stand-by lie: −4; withdraw: −2.  
  - For Mini, treat KOA as “always making the optimal risk-neutral choice” behind the scenes or use fixed behavior; the player does not choose.
- Final Belief is mapped to tier via `DEFAULT_CONFIG.tiers`:
  - FLAWLESS / CLEARED / CLOSE / BUSTED.

**4.3 Mini Mode Contract**
- Puzzles must be V5‑valid and **Mini‑compatible**:
  - 3-card lines (T1–T3) must produce reasonable tier distribution under default KOA behavior.  
  - There should be at least one line that yields CLEARED for a player who:
    - Plays an anchor truth,  
    - Avoids at least one obvious lie,  
    - Doesn’t get catastrophically punished by hidden tax/flag decisions.

---

## 5. Difficulty & Rotation in Mini

Mini follows the weekly rotation defined in `v5-daily-rotation.md`:

- **Monday:** Easy (2 clean direct contradictions; strong anchor truth; generous target).  
- **Tue/Wed/Thu/Sat:** Standard (1 direct + 1 synthesis lie).  
- **Friday:** Hard (at most 1 direct, at least 1 synthesis-only lie; tight target).  
- **Sunday:** Standard but tuned to feel slightly softer than Friday.

Puzzles for Mini are drawn from:

- Scenario seeds in `v5-scenario-seeds.md`.  
- A 100‑day mapping in `v5-daily-schedule-100.md` (example schedule).

Validator (`prototype-v5.ts`) + human/agent review ensure:

- Lies are deducible (not random).  
- There is at least one non-blind T1 anchor truth.  
- Lie patterns vary across the week (no “always highest-strength DIGITAL” meta).  
- Hard days meaningfully punish naive strategies (e.g., “never play strongest cards”) without being unfair.

---

## 6. KOA Behavior in Mini

KOA is the main way Mini regains depth and drama without exposing mechanics.

**6.1 Mid-run Barks**

After each card:

- KOA uses `PRE_REVEAL_BARK` and `PATTERN_CALLOUT` slots to comment on:
  - Timeline (late/early, gaps).  
  - Channel reliance (too many logs, not enough testimony).  
  - Coherence (story feels rehearsed vs messy).  
  - Plausibility (excuses vs believable accidents).

Requirements:

- Barks must never name “truth” or “lie” directly.  
- Barks should sometimes be **double-edged**:
  - Helpful hints but easy to misread if the player overreacts.

**6.2 System Check Beat (Card 2)**

- After the second card, KOA delivers a slightly more dramatic line:
  - “This last claim doesn’t quite match my logs. If it’s wrong, your whole story leans the wrong way.”  
- This substitutes for the explicit KOA Flag decision in V5; the player doesn’t click anything, but feels the tension.

**6.3 Verdict & Teaching**

On the verdict screen:

- KOA gives a verdict line per tier (FLAWLESS/CLEARED/CLOSE/BUSTED).  
- Optionally show a **“how KOA saw it”** block:
  - 1–2 bullets mapping lies to specific facts:
    - “`email_draft` contradicted Fact #2 (you claimed to be in bed by 11).”  
    - “`printer_queue` essentially proved my suspicion; that job came from your laptop at 3 AM.”

This optional teaching mode helps “Literal” personas learn without changing the in-play puzzle.

**6.4 Long-Term KOA Commentary (Optional)**

Over many days, KOA can:

- Comment on patterns:
  - “You’ve started catching most timeline lies. I’m… reluctantly impressed.”  
  - “You avoid DIGITAL evidence like it owes you money. Sometimes that helps; sometimes it costs you.”

This provides a sense of progression without extra mechanics.

---

## 7. Shareable Artifact (Mini)

Mini’s session must produce a compact, spoiler‑light artifact:

Suggested format:

```text
KOA Mini — Day 37
Cards: ✅ ✅ ❌
Result: CLEARED
“I’m still suspicious of your thermostat.”
```

Where:

- `Cards` encodes how many of the 3 picks were truth vs lies.  
- `Result` is the tier.  
- KOA’s line is the flavor hook.

Variations:

- Use emoji or simple symbols for tiers (e.g., 🔴 BUSTED, 🟡 CLOSE, 🟢 CLEARED, 🌟 FLAWLESS).  
- Omit slug/incident name to avoid spoilers; show only day number.

---

## 8. Advanced Mode (V5) Integration

KOA Mini is not meant to replace the deeper V5 experience, but to **front it**:

- By default, players see **KOA Mini rules and UI**.  
- In settings (or after certain milestones), KOA offers an **“Expert View”**:
  - “If you want to see the numbers behind my suspicions—Belief, penalties, the whole thing—flip on Expert View.”
- Expert View:
  - Reveals Belief bar and numeric scoring.  
  - Shows Type Tax rule explicitly.  
  - Restores the explicit KOA Flag choice (keep on record vs roll back).  
  - Uses the same V5 puzzles, but with more surfaces exposed.

This keeps:

- Mini as the “Wordle-simple” on-ramp.  
- V5 as a second layer for players who want to engage with all 7 design principles at full strength.

---

## 9. Invariants Specific to KOA Mini

On top of V5 invariants, KOA Mini adds:

- **No numeric UI:** No Belief numbers, targets, or penalties are shown. Tiers only.  
- **No explicit tax rule:** Type Tax may exist under the hood but is never described as a rule; KOA can comment about overreliance on channels.  
- **No player‑facing KOA Flag choice:** System check is narrative only; any Belief adjustments from flagging are internal.  
- **3 picks only:** Exactly 3 cards per run; no multi‑card turns or tactics in Mini.  
- **2–4 minute sessions:** Puzzles must be solvable (or at least readable) in a few minutes on a phone.  
- **KOA barks are axis‑level, not solution‑level:** They hint at patterns, never at specific cards being lies during play.

Any change to Mini’s UX or mechanic surface should be checked against:

1. This spec,  
2. `v5-design-context.md`, and  
3. The 7 principles in `_process/v3-design/1-principles-and-depth-audit.md`.

If Mini stays within these bounds and puzzles continue to pass `prototype-v5.ts` + your qualitative checklists, KOA Mini should remain easy to start, satisfying to solve, and deep enough—especially with V5 Advanced layered on for players who want more. 

---

## 10. Recommended Next Steps for KOA Mini

To make KOA Mini robust in practice (not just on paper), the following are high‑leverage follow-ups:

**10.1 First-Run Tutorial (“Day 0”)**

- Design a **bespoke tutorial puzzle** that:
  - Has 1 extremely clear anchor truth and 1 extremely blatant contradiction.  
  - Walks the player through:
    - Reading the scenario + facts.  
    - Tapping a clearly safe card.  
    - Seeing KOA praise (“That matches Fact #2 exactly.”).  
    - Tapping a clearly bad card and seeing KOA call out the contradiction.  
  - Ends with a simple explanation: “Puzzles will be trickier than this, but the idea is the same: pick 3 cards that fit the facts.”

**10.2 KOA Mini Analytics**

- Define a small analytics schema per daily:
  - Completion rate.  
  - Distribution across tiers (BUSTED / CLOSE / CLEARED / FLAWLESS).  
  - Avg number of lies played per run.  
  - Time to first pick, and total session time.  
  - Per-card selection frequencies (especially T1 choices).  
- Use this to:
  - Validate difficulty bands (Easy/Standard/Hard).  
  - Detect stale metas (e.g., one card being T1 90% of the time).  
  - Flag puzzles where too many players feel forced into lies or where win rates are out of range.

**10.3 Bark Library Pass for Mini**

- Audit existing KOA barks and tag:
  - **Mini-safe** lines (axis-level, short, no reference to numbers or advanced mechanics).  
  - **Expert-only** lines (those that mention Belief, penalties, flags, etc.).  
- Ensure KOA Mini uses only Mini-safe barks:
  - Under 2 sentences.  
  - No mention of “score,” “penalty,” “type tax,” or “objection/flag” mechanics.  
  - Focus on timeline/channel/coherence/personal snark.

**10.4 Contradiction Visualization on Verdict**

- Design a very compact UI pattern to show “Card X contradicted Fact Y,” e.g.:
  - Highlighted card + small arrow + Fact snippet.  
  - Limit to 1–2 key contradictions for clarity.  
- This is critical for learning: players should walk away knowing *why* a lie was a lie.

**10.5 Mode Switching UX**

- Decide how players discover Expert/V5 mode:
  - Default: Mini only.  
  - After N days or a certain performance threshold, KOA offers Expert View in character:
    - “If you want to see how I’m scoring you—Belief, penalties, everything—flip on Expert View.”  
  - Offer a reversible toggle in settings.

**10.6 Hard Friday Calibration in Mini**

- Internally test “Friday Hard” puzzles in Mini view only:
  - Lies are subtler (more relational/implausible timelines).  
  - Targets are tighter, but still fair.  
  - No extra rules are exposed to the player.  
- Adjust generation and validation thresholds until Friday feels:
  - Noticeably harder than other days.  
  - Still solvable by careful fact reading (not random).

Implementing these steps will make KOA Mini feel polished, teach players the right mental model, and create a smooth on-ramp into the deeper V5 experience. 
