# Task 702: Implement Final Audit Panel

**Status:** backlog
**Complexity:** M
**Depends On:** 501, 602
**Implements:** R7.3, R7.4

---

## Objective

Create the Final Audit panel UI that displays after T3 submission and before Result screen. Shows three axis check lines (Coverage, Independence, Concern) with checkmarks or warnings.

---

## Context

### Relevant Files
- NEW: `packages/app-svelte/src/lib/components/FinalAuditPanel.svelte`
- `packages/engine-core/src/narration/audit-barks.ts` — line templates (Task 602)
- `packages/app-svelte/src/lib/stores/game.ts` — axis results

### Embedded Context

**Panel structure:**
```svelte
<script>
  import { coverageLines, independenceLines, getConcernLine } from 'engine-core';

  export let coverageComplete: boolean;
  export let independenceOk: boolean;
  export let concernHit: boolean;
  export let noConcern: boolean;
</script>

<div class="final-audit-panel">
  <h3>FINAL AUDIT</h3>

  <div class="audit-line">
    {coverageComplete ? coverageLines.complete : coverageLines.gap}
  </div>

  <div class="audit-line">
    {independenceOk ? independenceLines.diverse : independenceLines.correlated}
  </div>

  <div class="audit-line">
    {getConcernLine(concernHit, noConcern)}
  </div>
</div>
```

**Animation sequence:**
1. T3 bark completes → "Processing..." beat (~0.5-1s delay)
2. Panel fades in
3. Each line reveals sequentially (300ms delay between)
4. Brief pause (500ms) after all lines
5. Panel transitions to Result screen

**"Processing..." beat (required per spec §5.1):**
- After T3 closing bark, show brief "Processing..." text or spinner
- Duration: ~0.5-1 second
- This creates the "Commit → Processing → Final Audit → Reveal" flow
- Can be a simple text overlay or integrated into bark panel

**Visual treatment:**
```css
.final-audit-panel {
  background: rgba(0, 0, 0, 0.9);
  padding: 1.5rem;
  border-radius: 8px;
}

.final-audit-panel h3 {
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  opacity: 0.6;
  margin-bottom: 1rem;
}

.audit-line {
  font-size: 1.1rem;
  margin: 0.5rem 0;
  opacity: 0;  /* Animated in */
}

/* Checkmark lines */
.audit-line:has(✅) {
  color: #4ade80;  /* Green */
}

/* Warning lines */
.audit-line:has(⚠️) {
  color: #fbbf24;  /* Amber */
}
```

**Data flow (all from store.axisResults, computed in Task 501):**
```typescript
// In FinalAuditPanel.svelte
import { gameStore } from '$lib/stores/game';

$: axisResults = $gameStore.axisResults;
$: coverageComplete = axisResults?.coverage.status === 'complete';
$: independenceOk = axisResults?.independence === 'diverse';
$: concernHit = axisResults?.concernHit ?? false;
$: noConcern = axisResults?.noConcern ?? false;
```

- `coverageComplete`: `axisResults.coverage.status === 'complete'` (from computeCoverage)
- `independenceOk`: `axisResults.independence === 'diverse'` (from computeIndependence)
- `concernHit`: `axisResults.concernHit` (derived from concernResult)
- `noConcern`: `axisResults.noConcern` (derived from concern.key)

---

## Acceptance Criteria

### AC-1: Panel displays after T3 <- R7.3
- **Given:** Player submits T3 card
- **When:** Submission completes
- **Then:** Final Audit panel appears

### AC-2: Three lines shown <- R7.3
- **Given:** Final Audit panel
- **When:** Panel is visible
- **Then:** Coverage, Independence, and Concern lines all display

### AC-3: Lines use correct templates <- R7.3
- **Given:** Axis results
- **When:** Rendering lines
- **Then:** Templates from audit-barks.ts used correctly

### AC-4: Lines animate sequentially <- R7.4
- **Given:** Panel appearing
- **When:** Animation plays
- **Then:** Each line fades in with delay between

### AC-5: Panel transitions to Result <- R7.4
- **Given:** All lines visible
- **When:** Pause completes
- **Then:** Panel transitions to Result screen

---

## Edge Cases

### EC-1: All green
- **Scenario:** All axes pass
- **Expected:** Three green checkmark lines

### EC-2: All warnings
- **Scenario:** All axes have issues
- **Expected:** Three amber warning lines

### EC-3: Mixed results
- **Scenario:** Some pass, some fail
- **Expected:** Appropriate mix of colors

### EC-4: no_concern shows "Balanced"
- **Scenario:** Concern was no_concern
- **Expected:** Third line shows "Concern: ✅ Balanced"

---

## Error Cases

### ERR-1: Axis results not computed
- **When:** Tiering hasn't run yet
- **Then:** Panel waits or shows loading
- **Error Message:** N/A (loading state)

---

## Scope

**In Scope:**
- Create FinalAuditPanel.svelte
- Display three axis lines
- Apply color coding
- Sequential animation
- Transition to Result

**Out of Scope:**
- Axis computation in store (Task 501)
- Line templates (Task 602)
- Result screen (Task 703)
- Tiering/outcome computation (Task 302)

---

## Implementation Hints

1. Create component in components/ directory
2. Accept props for axis results
3. Use GSAP or CSS for sequential animation
4. Emit event when animation complete
5. Consider using Svelte transitions

---

## Log

### Planning Notes
**Context:** Final Audit is the evaluation moment, not T3 barks
**Decisions:** Sequential reveal builds tension
