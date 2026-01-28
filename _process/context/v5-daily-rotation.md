# V5 Daily Rotation Plan — Difficulty & Lie Modes

**Purpose:** Define how V5 micro‑daily puzzles should rotate across the week, based on survey learnings about difficulty, lie patterns, and variety.

This file is a **scheduling spec**, not code. It pairs with:
- `v5-scenario-seeds.md` (incident hooks + axes + lie flavor hints)
- `v5-design-context.md` (V5 invariants)
- `puzzle-gen-insights-from-playtests.md` (LLM generation rules)

---

## 1. Difficulty & Lie Modes (V5)

We use three difficulty bands, defined by **lie design** and **target margins**, not just “harder numbers.”

### Easy

- Lie design:
  - 2 lies, both **cleanly deducible** from Known Facts (direct contradictions).  
  - Strong anchor truth clearly supported by facts.  
  - Minimal relational/self‑incriminating trickery.
- Targeting:
  - Target Belief set so that **3 truths** with reasonable sequencing reach CLEARED even if the player plays 1 lie or eats 1 type tax.
- Purpose:
  - Tutorial feel; reinforces basic “fact vs claim” reasoning.  
  - Good for new players, Mondays, and recovery days.

### Standard

- Lie design:
  - 1 clean **direct** lie.  
  - 1 **synthesis** lie (relational or self‑incriminating or subtle timeline).  
  - Lies not always the highest‑strength or same evidence type.
- Targeting:
  - Target Belief tuned so players generally need **3 good plays**, or **2 good + 1 mediocre** with decent sequencing.
- Purpose:
  - Core daily experience most days of the week.  
  - Requires using Known Facts and some cross‑card reasoning.

### Hard

- Lie design:
  - At most 1 clean direct lie.  
  - At least 1 lie that is **only detectable via cross‑card or scenario reasoning** (nontrivial synthesis).  
  - Some simple metas (“always avoid the strongest DIGITAL card”) must **fail** on these days.
- Targeting:
  - Target close to the best all‑truth line; players must find near‑optimal sequence and avoid at least 1 lie.  
  - Type tax and KOA Flag decisions materially affect the outcome.
- Purpose:
  - Occasional challenge; for players who already understand basic V5 logic.  
  - Drives replay and “I almost had it” moments.

---

## 2. Weekly Difficulty Pattern (Baseline)

Baseline weekly rotation (can be adjusted later):

- **Monday — Easy Mode (“Clean Lies”)**
  - 2 direct contradictions; strong anchor truth; generous target.  
  - Goal: re‑onboard players, reinforce basic fact checking.

- **Tuesday — Standard**
  - 1 direct + 1 synthesis lie.  
  - Normal target.  
  - Goal: “typical” daily feel.

- **Wednesday — Standard**
  - Same shape as Tuesday, but emphasize a different axis (e.g., channel or plausibility over pure timeline).

- **Thursday — Standard / Themed**
  - Standard difficulty, but scenario/axes follow a weekly “theme” (e.g., guests week, garage week, screens week).

- **Friday — Hard**
  - 1 clean, 1+ subtle lies; tight target; type tax and KOA Flag matter.  
  - Goal: weekly “challenge puzzle.”

- **Saturday — Standard (Variant)**
  - Standard difficulty, with at least one non‑timeline lie (channel reliance, plausibility, social).  
  - Useful for breaking lie‑pattern meta.

- **Sunday — Easy→Standard Hybrid**
  - Early‑week style direct contradictions, but slightly stricter target or more interesting synthesis lie.  
  - Goal: satisfying but not punishing “weekend” puzzle.

This schedule ensures:
- New players hit an **easy entry** every Monday.  
- Regulars see **predictable variety** without memorizing patterns.  
- Hard days are **rare but expected** (Friday).

---

## 3. Mapping Seeds to Difficulty (Guidelines)

`v5-scenario-seeds.md` does not hard‑code difficulty; instead, treat its metadata as hints:

- If a seed’s lie flavor hints are mostly **direct + self‑incriminating**, use it as:
  - **Easy** if both lies can be made clean contradictions vs facts.  
  - **Standard** if one lie is direct and the other is a self‑incriminating synthesis.

- If a seed’s lie flavor hints include **relational / implausible_timeline / suspicious_specificity**, prefer:
  - **Standard** when at least one lie is still clearly fact‑catchable.  
  - **Hard** when core challenge is cross‑card/timeline synthesis and target is tight.

When building a week:

- Pick **2–3 Easy seeds**, **3–4 Standard seeds**, and **1 Hard seed**.  
- Ensure across that week that:
  - Not all lies are timeline; some are channel/plausibility/social.  
  - Not all lies live in the same evidence type or strength bracket.

---

## 4. Rotation & Meta-Safety Rules

To avoid stale meta:

- Do **not** schedule back‑to‑back days where:
  - Lies are always the highest‑strength cards.  
  - Lies are always DIGITAL.  
  - All lies are purely timeline contradictions.

- Ensure at least once per week:
  - A puzzle where **avoiding all high‑strength cards is a mistake** (safe high‑strength truths).  
  - A puzzle where **Type Tax** is worth eating once for a strong truth.  
  - A puzzle where **KOA Flag choice** is genuinely ambiguous but fair.

---

## 5. How to Use This File

For each upcoming week:

1. Choose a set of 7 seeds from `v5-scenario-seeds.md`.  
2. Assign each seed a difficulty band (Easy/Standard/Hard) per the guidelines above.  
3. Slot them into the weekly pattern (Mon–Sun).  
4. For each seed, generate a V5 puzzle that:
   - Obeys `v5-design-context.md` invariants.  
   - Passes `prototype-v5.ts` validation.  
   - Follows the intended lie mode for that difficulty band.

If a generated puzzle fails the intended difficulty (e.g., Validator shows it plays like “Easy” when scheduled as “Hard”), regenerate or adjust card strengths/target instead of silently shipping it. 

