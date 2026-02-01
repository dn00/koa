# KOA Mini — Puzzle Freshness Audit

**Purpose:** Ensure each new puzzle feels distinct from existing puzzles. Run this after the main quality audit passes.

---

## Input

You receive:
1. **New puzzle file** to audit

## Step 1: Find the 3 Most Recent Puzzles

Sort puzzle files by modification date and read the 3 most recent (excluding the puzzle being audited):

```bash
ls -t packages/engine-core/src/packs/*-puzzle.ts | head -4
```

Read those 3 puzzles fully and note their voice patterns before auditing the new puzzle.

## Step 2: Build Voice Profiles

For each of the 3 recent puzzles, identify:
- **Voice style** (deadpan, technical, absurdist, etc.)
- **Signature phrases** (recurring patterns in their barks)
- **Humor angle** (what makes it funny)
- **time of scenario** (3:14 AM, etc)

The new puzzle must feel distinct from these 3.

---

## Core Question

**Does the new puzzle feel fresh compared to the 3 most recent?**

If you read the 4 puzzles back-to-back, would a player notice they have different personalities? Or do they blur together?

---

## Freshness Checklist

### 1. Scenario Uniqueness

- [ ] Device/system not used in recent puzzles
- [ ] Incident type is different (not another "3 AM" mystery)
- [ ] Cast/characters feel distinct
- [ ] Setting brings new flavor

**Red flags:**
- Same device as another puzzle (vacuum, thermostat, etc.)
- Relies on specific time (3 AM, midnight) as main hook
- Same "someone else did it" structure

### 2. Voice Differentiation

For each bark category, check the new puzzle doesn't copy patterns:

**Opening line:**
- [ ] Different sentence structure than other puzzles
- [ ] Unique hook/angle on the disaster
- [ ] Not using common KOA phrases from other puzzles

**cardPlayed barks:**
- [ ] Each bark has scenario-specific flavor
- [ ] Not generic observations that could fit any puzzle
- [ ] References specific elements (device names, character names, etc.)

**Sequence barks:**
- [ ] Reference both cards with fresh language
- [ ] Avoid template phrases like "Building a picture", "Timeline's getting specific"
- [ ] Scenario-specific humor or observations

**Verdicts:**
- [ ] Unique punchlines
- [ ] Reference puzzle-specific elements
- [ ] Different energy than other puzzles

### 3. Humor Style Check

Identify the puzzle's humor style and verify it's distinct:

| Style | Examples | Puzzles Using It |
|-------|----------|------------------|
| Deadpan horror | Dry observations about disaster | (list) |
| Absurdist quantity | "47 pounds of cheese" | Cheese Heist, Bean Bonanza |
| Technical sarcasm | "The math doesn't work" | Cheese Heist |
| Awkward/embarrassing | Dignity, bathroom humor | Bidet |
| Puns/wordplay | "flatter than the beer" | Tap Out |

- [ ] New puzzle has identifiable humor style
- [ ] Style is not overused in existing puzzles
- [ ] Consistent style throughout all barks

### 4. Banned Phrase Check

These phrases appear in multiple puzzles. Avoid them:

**Generic observations (ban):**
- "Interesting choice"
- "Building a picture"
- "Timeline's getting specific"
- "Let's see if they align"
- "The math doesn't work" (owned by Cheese Heist)
- "Convenient timing"

**Overused structures (vary):**
- "[X] says [thing]. [Y] says [other thing]. Pick one."
- "Your [source] has opinions."
- "[Thing] first, then [thing]. [Comment]."

### 5. Structural Variety

Check the puzzle varies from common patterns:

**Lie structures:**
- [ ] Not all lies are "someone else did it" deflections
- [ ] Not all lies are equipment malfunction claims
- [ ] Mix of claim types (absence, positive, attribution)

**Truth structures:**
- [ ] Not all truths are sensor data
- [ ] Include variety (testimony, physical, digital)
- [ ] At least one truth that sounds slightly suspicious

**Fact structures:**
- [ ] Facts use different phrasings than other puzzles
- [ ] Not all facts are timestamps
- [ ] Facts feel specific to this scenario

---

## Scoring

| Category | Weight | Score |
|----------|--------|-------|
| Scenario Uniqueness | 25 | /25 |
| Voice Differentiation | 30 | /30 |
| Humor Style | 20 | /20 |
| No Banned Phrases | 15 | /15 |
| Structural Variety | 10 | /10 |
| **TOTAL** | | **/100** |

### Thresholds

| Score | Verdict | Action |
|-------|---------|--------|
| 90-100 | Fresh | Ship as-is |
| 75-89 | Acceptable | Minor voice tweaks recommended |
| 60-74 | Stale | Rewrite barks with distinct voice |
| <60 | Reject | Major revision needed |

---

## Output Format

```
# Freshness Audit: [puzzle name]

## 3 Recent Puzzles Compared Against
1. [name] - [voice style in 3 words]
2. [name] - [voice style in 3 words]
3. [name] - [voice style in 3 words]

## New Puzzle Voice
- Style: [describe in 3 words]
- Distinct from recent 3? [YES/NO]

## Overlap Check
- Copied phrases from [puzzle]: [list any]
- Similar humor to [puzzle]: [describe overlap]

## Standout Lines
[2-3 lines that feel uniquely THIS puzzle]

## Problem Lines
[Any lines that feel generic or borrowed]

## Scores
| Category | Score |
|----------|-------|
| Scenario Uniqueness | /25 |
| Voice Differentiation | /30 |
| Humor Style | /20 |
| No Banned Phrases | /15 |
| Structural Variety | /10 |
| **TOTAL** | /100 |

## Verdict: [FRESH/ACCEPTABLE/STALE/REJECT]

## Fixes (if needed)
[specific lines to rewrite]
```

---

## Quick Reference: What Makes a Puzzle Feel Fresh

**DO:**
- Name characters (Buster, Marcus, Dave)
- Reference specific objects (the patio, the hardwood, the kegerator)
- Use scenario-specific metaphors ("abstract art" for poop smears)
- Vary sentence length and structure
- Have a consistent but unique comedic angle

**DON'T:**
- Use generic phrases that could fit any puzzle
- Copy bark structures from other puzzles
- Default to "the math" or "timeline" observations
- Make all barks sound like data analysis
- Forget the human/absurd element
