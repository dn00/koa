# Task 601: Create Suspicion Bark Templates

**Status:** backlog
**Complexity:** S
**Depends On:** none
**Implements:** R6.1, R6.2, R6.6

---

## Objective

Create the T2 suspicion line templates and subtitle templates for all 12 concernKeys. These are shown after the sequence bark on Turn 2.

---

## Context

### Relevant Files
- NEW: `packages/engine-core/src/narration/suspicion-barks.ts`

### Embedded Context

**Suspicion line templates (by concernKey):**
```typescript
import type { Concern } from '../types/v5/index.js';

type ConcernKey = Concern['key'];

/**
 * T2 suspicion lines by concern key.
 * Shown after sequence bark, before subtitle.
 * Must only reference dimension labels, never card names or facts.
 */
export const suspicionLines: Record<ConcernKey, string> = {
  same_system: "Same system vouching twice. Interesting.",
  automation_heavy: "Lot of automation doing the work for you.",
  manual_heavy: "Two manual actions. Busy night.",
  remote_heavy: "Everything happening remotely. Convenient.",
  absence_heavy: "Two stories about what didn't happen.",
  attribution_heavy: "Blaming a lot of other things tonight.",
  integrity_heavy: "Two claims about system integrity. Noted.",
  all_digital: "All device logs so far. Where are the humans?",
  all_sensor: "Your sensors have opinions tonight.",
  all_testimony: "Humans agreeing with humans. Cozy.",
  all_physical: "Lot of physical evidence. Hands-on night.",
  no_concern: "At least you're mixing your sources.",
};

/**
 * T2 subtitle templates by concern key.
 * Shown in parentheses after suspicion line.
 * Clarifies what KOA is watching.
 */
export const suspicionSubtitles: Record<ConcernKey, string | null> = {
  same_system: "(Double-checking system dependency.)",
  automation_heavy: "(Double-checking automation tonight.)",
  manual_heavy: "(Double-checking manual actions.)",
  remote_heavy: "(Double-checking remote access.)",
  absence_heavy: "(Double-checking absence claims.)",
  attribution_heavy: "(Double-checking blame patterns.)",
  integrity_heavy: "(Double-checking integrity claims.)",
  all_digital: "(Double-checking device logs.)",
  all_sensor: "(Double-checking sensor data.)",
  all_testimony: "(Double-checking human testimony.)",
  all_physical: "(Double-checking physical evidence.)",
  no_concern: null,  // No subtitle when no concern
};

/**
 * Get the full T2 suspicion text (line + subtitle).
 */
export function getSuspicionText(concernKey: ConcernKey): { line: string; subtitle: string | null } {
  return {
    line: suspicionLines[concernKey],
    subtitle: suspicionSubtitles[concernKey],
  };
}
```

**Non-eliminative rule (CRITICAL):**
Suspicion barks must ONLY reference dimension labels:
- ✅ "automation", "absence claims", "device logs"
- ❌ "the router log", "your partner testimony", "Fact #2"

---

## Acceptance Criteria

### AC-1: All 12 suspicion lines exist ← R6.1
- **Given:** suspicionLines record
- **When:** Checking keys
- **Then:** All 12 concernKeys have lines

### AC-2: All 12 subtitles exist ← R6.2
- **Given:** suspicionSubtitles record
- **When:** Checking keys
- **Then:** All 12 concernKeys have entries (null for no_concern)

### AC-3: no_concern has null subtitle ← R6.2
- **Given:** no_concern key
- **When:** Looking up subtitle
- **Then:** Value is null, not a string

### AC-4: Lines are non-eliminative ← R6.6
- **Given:** All suspicion lines
- **When:** Checking content
- **Then:** No line mentions card names, sources, or specific facts

---

## Edge Cases

### EC-1: same_system needs root info
- **Scenario:** For same_system, the repeated root is in Concern payload
- **Expected:** Generic line works; specific root not mentioned in bark

### EC-2: Line length
- **Scenario:** Line might be too long for UI
- **Expected:** Keep lines under 60 characters

---

## Error Cases

### ERR-1: Missing concernKey
- **When:** New concernKey added but not in templates
- **Then:** TypeScript error
- **Error Message:** Property 'new_key' is missing

---

## Scope

**In Scope:**
- Create suspicion-barks.ts
- Add all 12 suspicion lines
- Add all 12 subtitles
- Add getSuspicionText helper

**Out of Scope:**
- Final Audit templates (Task 602)
- Wiring to UI (Task 701)
- Concern computation (Task 203)

---

## Implementation Hints

1. Create file in narration/ directory
2. Use Record types for compile-time completeness
3. Keep lines punchy — KOA is terse
4. Test by visual inspection for non-eliminative rule

---

## Log

### Planning Notes
**Context:** Natural Focus via KOA barks
**Decisions:** Subtitles are optional (null for no_concern)
