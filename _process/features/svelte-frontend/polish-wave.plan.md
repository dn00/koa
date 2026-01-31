# KOA Mini Polish Wave Plan

**Status:** in-progress
**Feature:** svelte-frontend
**Created:** 2026-01-30

---

## Overview

Polish tasks to make KOA Mini feel complete: scannable cards, animations, intro screen, and fixes.

---

## Batch Analysis

| Batch | Tasks | Complexity | Blocked By | Description |
|-------|-------|------------|------------|-------------|
| 1 | 020 | S | - | Add `source` field to cards for scannable display |
| 2 | 022, 023-partial | M | - | Wire GSAP animations, add verdict transition |
| 3 | 021 | S | - | Create IntroScreen component |
| 4 | 019, 023-remainder | S | - | Update validator for 3/3, fix share button |

**Batch count: 4**

---

## Wave Structure

### Wave 1 (All batches unblocked)
- Batch 1: 020 (Source Field) → sonnet
- Batch 2: 022 + 023-partial (Animations) → opus
- Batch 3: 021 (Intro Screen) → sonnet
- Batch 4: 019 + 023-remainder (Cleanup) → sonnet

---

## Task Details

### Batch 1: Source Field (S)
**Task 020: Card Source Field**
- Add `source: string` to Card interface in `packages/engine-core/src/types.ts`
- Update `EvidenceCard.svelte` to show `card.source` instead of truncated claim
- Update PrintGate puzzle in `packages/engine-core/src/packs/builtin.ts` with source values
- Update `scripts/v5-puzzles.ts` PrintGate with source values

### Batch 2: Animations (M)
**Task 022: Wire GSAP Animations**
- Import animation functions from `$lib/animations/gsap.ts` into `RunScreen.svelte`
- Call `animateCardPlay()` when card is played
- Add processing delay (800ms) before bark appears
- Set KOA mood to PROCESSING during delay
- Add dramatic timing (1500ms) for final turn

**Task 023-partial: Verdict Transition**
- Import `animateVerdictReveal()` into verdict flow
- Add fade/slide transition when entering VerdictScreen

### Batch 3: Intro Screen (S)
**Task 021: Game Intro Screen**
- Create `IntroScreen.svelte` component showing:
  - Puzzle name and day number
  - KOA avatar (NEUTRAL mood)
  - Opening line from puzzle
  - Known Facts as bullet list
  - Brief instructions
  - START button
- Modify `/routes/run/[slug]/+page.svelte` to show IntroScreen first
- Add state to track intro→game transition

### Batch 4: Cleanup (S)
**Task 019: Validator Update**
- Update `scripts/prototype-v5.ts` validator expectations:
  - S2: lie count 2 → 3
  - S3: truth count 4 → 3
  - B5: win rate 15-50% → 3-15%
  - B6: FLAWLESS rate 5-25% → 1-10%

**Task 023-remainder: Verdict Fixes**
- Fix share button to copy to clipboard (navigator.clipboard API)
- Fix card mini display to show icon instead of ID slice
- Ensure no viewport cropping (add overflow-y-auto if needed)

---

## Files Reference

### Engine Core
- `packages/engine-core/src/types.ts` - Card interface
- `packages/engine-core/src/packs/builtin.ts` - PrintGate puzzle

### App Svelte
- `packages/app-svelte/src/lib/components/RunScreen.svelte` - Game play
- `packages/app-svelte/src/lib/components/VerdictScreen.svelte` - Result screen
- `packages/app-svelte/src/lib/components/EvidenceCard.svelte` - Card display
- `packages/app-svelte/src/lib/animations/gsap.ts` - Animation functions (already implemented)
- `packages/app-svelte/src/routes/run/[slug]/+page.svelte` - Run route

### Scripts
- `scripts/v5-puzzles.ts` - Puzzle definitions
- `scripts/prototype-v5.ts` - Validator

---

## Execution Tracking

| Batch | Model | Impl Status | Review | Review Status |
|-------|-------|-------------|--------|---------------|
| 1 | sonnet | pending | skip (S) | - |
| 2 | opus | pending | needed | - |
| 3 | sonnet | pending | skip (S) | - |
| 4 | sonnet | pending | skip (S) | - |

---

## Agent IDs (for resume)

```
Batch 1 agent_id:
Batch 2 agent_id:
Batch 3 agent_id:
Batch 4 agent_id:
```
