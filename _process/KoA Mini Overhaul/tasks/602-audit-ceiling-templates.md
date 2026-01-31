# Task 602: Create Final Audit + Ceiling Templates

**Status:** backlog
**Complexity:** S
**Depends On:** none
**Implements:** R6.3, R6.4

---

## Objective

Create the Final Audit panel line templates and ceiling explanation templates for when CLEARED-not-FLAWLESS.

---

## Context

### Relevant Files
- NEW: `packages/engine-core/src/narration/audit-barks.ts`

### Embedded Context

**Final Audit line templates:**
```typescript
/**
 * Coverage check line.
 */
export const coverageLines = {
  complete: "Facts addressed: ✅ Complete",
  gap: "Facts addressed: ⚠️ Gap",
} as const;

/**
 * Independence check line.
 */
export const independenceLines = {
  diverse: "Source diversity: ✅ Varied",
  correlated: "Source diversity: ⚠️ Correlated",
} as const;

/**
 * Concern check line.
 * Uses "After my warning" for actual concerns, "Concern" for no_concern.
 */
export const concernLines = {
  diversified: "After my warning: ✅ Diversified",
  doubled_down: "After my warning: ⚠️ Doubled down",
  balanced: "Concern: ✅ Balanced",  // Used when no_concern
} as const;

/**
 * Get the appropriate concern line.
 */
export function getConcernLine(concernHit: boolean, noConcern: boolean): string {
  if (noConcern) return concernLines.balanced;
  return concernHit ? concernLines.doubled_down : concernLines.diversified;
}
```

**Ceiling explanation templates (when CLEARED with all truths):**
```typescript
type CeilingBlocker = 'concern' | 'correlation' | 'both';

/**
 * Ceiling explanations for CLEARED-not-FLAWLESS.
 * Shown on Result screen when player got all truths but not FLAWLESS.
 */
export const ceilingExplanations: Record<CeilingBlocker, string> = {
  concern: "Your story checks out. But you leaned hard on {dimension} after I flagged it. No gold star.",
  correlation: "Your story checks out. But your sources all trace back to the same place. Noted.",
  both: "Your story checks out. But you doubled down AND your sources overlap. I'm watching you.",
};

/**
 * Dimension labels for ceiling explanation interpolation.
 */
export const concernDimensionLabels: Record<string, string> = {
  same_system: "the same system",
  automation_heavy: "automation",
  manual_heavy: "manual actions",
  remote_heavy: "remote access",
  absence_heavy: "absence claims",
  attribution_heavy: "blame patterns",
  integrity_heavy: "integrity claims",
  all_digital: "device logs",
  all_sensor: "sensor data",
  all_testimony: "human testimony",
  all_physical: "physical evidence",
};

/**
 * Get the ceiling explanation with dimension interpolated.
 */
export function getCeilingExplanation(
  blocker: CeilingBlocker,
  concernKey?: string
): string {
  const template = ceilingExplanations[blocker];
  if (blocker === 'concern' && concernKey) {
    const dimension = concernDimensionLabels[concernKey] || concernKey;
    return template.replace('{dimension}', dimension);
  }
  return template;
}
```

---

## Acceptance Criteria

### AC-1: Coverage lines exist ← R6.3
- **Given:** coverageLines const
- **When:** Checking keys
- **Then:** Has 'complete' and 'gap'

### AC-2: Independence lines exist ← R6.3
- **Given:** independenceLines const
- **When:** Checking keys
- **Then:** Has 'diverse' and 'correlated'

### AC-3: Concern lines exist ← R6.3
- **Given:** concernLines const
- **When:** Checking keys
- **Then:** Has 'diversified', 'doubled_down', 'balanced'

### AC-4: Ceiling explanations exist ← R6.4
- **Given:** ceilingExplanations const
- **When:** Checking keys
- **Then:** Has 'concern', 'correlation', 'both'

### AC-5: Dimension interpolation works ← R6.4
- **Given:** getCeilingExplanation('concern', 'automation_heavy')
- **When:** Calling function
- **Then:** Returns string with "automation" instead of "{dimension}"

---

## Edge Cases

### EC-1: Unknown concernKey for ceiling
- **Scenario:** concernKey not in labels
- **Expected:** Use concernKey as-is (fallback)

### EC-2: Ceiling explanation without concernKey
- **Scenario:** blocker is 'correlation', no concernKey provided
- **Expected:** Template works without interpolation

---

## Error Cases

### ERR-1: Missing template
- **When:** New blocker type added
- **Then:** TypeScript error
- **Error Message:** Property 'new_blocker' is missing

---

## Scope

**In Scope:**
- Create audit-barks.ts
- Add coverage, independence, concern lines
- Add ceiling explanations with interpolation
- Add dimension labels

**Out of Scope:**
- Suspicion templates (Task 601)
- UI components (Tasks 702, 703)
- Computing which blocker applies (Task 302)

---

## Implementation Hints

1. Use emoji in template strings (✅ ⚠️)
2. Keep templates readable — no complex logic
3. Test interpolation with different concernKeys
4. Export all for use in UI

---

## Log

### Planning Notes
**Context:** Final Audit and ceiling UX
**Decisions:** Interpolation for concern dimension
