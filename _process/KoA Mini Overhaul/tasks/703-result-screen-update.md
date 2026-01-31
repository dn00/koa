# Task 703: Update Result Screen for v1 Lite

**Status:** backlog
**Complexity:** M
**Depends On:** 001, 302, 501, 602, 702
**Implements:** R7.5, R7.6

---

## Objective

Update the Result screen (formerly Verdict screen) to show v1 Lite outcomes and ceiling explanations when CLEARED-not-FLAWLESS.

---

## Context

### Relevant Files
- `packages/app-svelte/src/lib/components/VerdictScreen.svelte` — rename to ResultScreen.svelte (Task 001)
- `packages/engine-core/src/narration/audit-barks.ts` — ceiling explanations (Task 602)
- `packages/app-svelte/src/lib/stores/game.ts` — outcome and axis data

### Embedded Context

**Result display structure:**
```svelte
<script>
  import { getCeilingExplanation } from 'engine-core';
  import { gameStore } from '$lib/stores/game';

  // All data from store (computed in Task 501)
  $: outcome = $gameStore.outcome;
  $: ceilingBlocker = $gameStore.ceilingBlocker;
  $: concernKey = $gameStore.concern?.key ?? null;
  $: truthCount = $gameStore.selectedCards.filter(c => !c.isLie).length;
</script>

<div class="result-screen">
  <h1 class="outcome outcome-{outcome.toLowerCase()}">{outcome}</h1>

  <div class="truth-count">
    {truthCount}/3 truths told
  </div>

  {#if ceilingBlocker && outcome === 'CLEARED'}
    <div class="ceiling-explanation">
      {getCeilingExplanation(ceilingBlocker, concernKey)}
    </div>
  {/if}

  <!-- Share button, etc. -->
</div>
```

**Outcome displays:**
- FLAWLESS: Gold/yellow styling, celebratory
- CLEARED: Green styling, "good but not perfect"
- CLOSE: Gray styling, almost there (2 truths + 1 lie)
- BUSTED: Red styling, failure state (0-1 truths)

**Ceiling explanation:**
- Only shown when outcome === 'CLEARED' AND ceilingBlocker is set
- ceilingBlocker computed in store (Task 501):
  - 'concern' if concernHit blocked FLAWLESS
  - 'correlation' if correlated (weak or strong) blocked FLAWLESS
  - 'both' if both blocked FLAWLESS
  - null if FLAWLESS achieved (no blocker)

**Ceiling text examples:**
- concern + automation_heavy: "Your story checks out. But you leaned hard on automation after I flagged it. No gold star."
- correlation: "Your story checks out. But your sources all trace back to the same place. Noted."
- both: "Your story checks out. But you doubled down AND your sources overlap. I'm watching you."

---

## Acceptance Criteria

### AC-1: Screen renamed to ResultScreen <- R7.5 (from Task 001)
- **Given:** VerdictScreen.svelte
- **When:** Renamed
- **Then:** File is ResultScreen.svelte, imports updated

### AC-2: v1 Lite outcomes displayed <- R7.5
- **Given:** outcome computed
- **When:** Result screen shows
- **Then:** Displays FLAWLESS, CLEARED, CLOSE, or BUSTED

### AC-3: Ceiling explanation shows when applicable <- R7.6
- **Given:** outcome is CLEARED and ceilingBlocker exists
- **When:** Result screen renders
- **Then:** Ceiling explanation text displayed

### AC-4: No ceiling explanation for FLAWLESS <- R7.6
- **Given:** outcome is FLAWLESS
- **When:** Result screen renders
- **Then:** No ceiling explanation shown

### AC-5: Dimension interpolated in concern ceiling <- R7.6
- **Given:** ceilingBlocker is 'concern', concernKey is 'automation_heavy'
- **When:** Rendering ceiling explanation
- **Then:** Text includes "automation" not "{dimension}"

---

## Edge Cases

### EC-1: Unknown concernKey
- **Scenario:** concernKey not in labels
- **Expected:** Uses concernKey as-is (fallback)

### EC-2: BUSTED outcome
- **Scenario:** Player told 2+ lies
- **Expected:** No ceiling explanation (didn't earn CLEARED)

### EC-3: CLOSE outcome
- **Scenario:** Player told 2 truths + 1 lie
- **Expected:** No ceiling explanation (didn't earn CLEARED)

---

## Error Cases

### ERR-1: ceilingBlocker null but CLEARED
- **When:** Logic error in tiering
- **Then:** No ceiling shown (defensive)
- **Error Message:** N/A (graceful degradation)

---

## Scope

**In Scope:**
- Rename VerdictScreen to ResultScreen
- Display v1 Lite outcome tiers
- Show ceiling explanation for CLEARED
- Interpolate concernKey into ceiling text
- Update styling for outcomes

**Out of Scope:**
- Outcome computation (Tasks 301, 302)
- Ceiling templates (Task 602)
- Final Audit panel (Task 702)
- Share functionality updates

---

## Implementation Hints

1. Rename file and update all imports
2. Read ALL data from store (outcome, ceilingBlocker, concernKey, truthCount)
3. Conditionally render ceiling explanation when outcome === 'CLEARED' && ceilingBlocker
4. Use different color schemes for each outcome (FLAWLESS=gold, CLEARED=green, CLOSE=gray, BUSTED=red)
5. Test with all outcome/blocker combinations
6. Component should be purely presentational (no props needed except optional styling)

---

## Log

### Planning Notes
**Context:** Result screen explains "why not FLAWLESS" for CLEARED
**Decisions:** Keep explanation brief, in KOA's voice
