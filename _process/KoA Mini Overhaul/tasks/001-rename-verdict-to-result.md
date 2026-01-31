# Task 001: Rename VerdictScreen + Vocabulary Cleanup

**Status:** backlog
**Complexity:** S
**Depends On:** none
**Implements:** R1.1, R1.2

---

## Objective

Replace courtroom vocabulary with smart-home-appropriate terms. "Verdict" → "Outcome", rename VerdictScreen component to ResultScreen.

---

## Context

### Relevant Files
- `packages/app-svelte/src/lib/components/VerdictScreen.svelte` — rename to ResultScreen
- `packages/app-svelte/src/lib/stores/game.ts` — update `GamePhase` type
- `packages/app-svelte/src/lib/components/index.ts` — update exports
- `packages/app-svelte/src/routes/+page.svelte` — update imports

### Embedded Context

**Current GamePhase type:**
```typescript
export type GamePhase = 'READING' | 'PICKING' | 'VERDICT' | 'SHARE';
```

**New GamePhase type:**
```typescript
export type GamePhase = 'READING' | 'PICKING' | 'RESULT' | 'SHARE';
```

**Vocabulary replacements:**
| Old | New |
|-----|-----|
| Verdict | Outcome |
| verdict screen | result screen |
| verdict line | outcome line |
| VerdictScreen | ResultScreen |
| VERDICT (phase) | RESULT (phase) |

**Invariant:** KOA never uses courtroom vocabulary (verdict, objection, defense, guilty, trial, testimony). Use smart-home terms (outcome, logs, data, sources, story).

---

## Acceptance Criteria

### AC-1: VerdictScreen renamed to ResultScreen ← R1.2
- **Given:** VerdictScreen.svelte exists
- **When:** Running the rename
- **Then:** File is named ResultScreen.svelte, all imports updated

### AC-2: GamePhase updated ← R1.2
- **Given:** GamePhase type has 'VERDICT'
- **When:** Running the update
- **Then:** GamePhase has 'RESULT' instead

### AC-3: No "verdict" in UI strings ← R1.1
- **Given:** Codebase may have "verdict" strings
- **When:** Running grep for "verdict" (case-insensitive)
- **Then:** Zero matches in component files (comments OK)

---

## Edge Cases

### EC-1: VerdictData type from engine-core
- **Scenario:** VerdictData is exported from engine-core
- **Expected:** Leave VerdictData as-is (it's engine internal), but rename UI usages

### EC-2: Verdict tier styling object
- **Scenario:** VerdictScreen has `tierStyles` object
- **Expected:** Rename to `outcomeStyles` or leave as `tierStyles` (tiers are fine)

---

## Error Cases

### ERR-1: Missing import updates
- **When:** Renaming file but missing an import
- **Then:** TypeScript compilation fails
- **Error Message:** Cannot find module './VerdictScreen'

---

## Scope

**In Scope:**
- Rename VerdictScreen.svelte → ResultScreen.svelte
- Update GamePhase type
- Update all imports
- Replace "verdict" strings in UI

**Out of Scope:**
- Renaming VerdictData type in engine-core
- Updating documentation
- Changing component logic

---

## Implementation Hints

1. Use git mv for the rename to preserve history
2. Search for "VerdictScreen" case-sensitively first
3. Search for "verdict" case-insensitively second
4. Update the index.ts export
5. TypeScript will catch missed imports

---

## Log

### Planning Notes
**Context:** Phase 0 cleanup before main overhaul
**Decisions:** Leave VerdictData type in engine-core unchanged
