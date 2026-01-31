# Task 301: Add Mini Lite Mode Config

**Status:** backlog
**Complexity:** S
**Depends On:** 201, 202, 204
**Implements:** R5.1

---

## Objective

Add a `useLiteTiering: boolean` field to ModeConfig to distinguish Mini Lite tiering (axis-based) from V5 Belief tiering (numeric score-based), enabling the engine to route to the correct tier calculation logic.

---

## Context

### Relevant Files
- `packages/engine-core/src/types/v5/mode.ts` - ModeConfig interface and presets
- `packages/engine-core/src/types/v5/index.ts` - Type exports

### Embedded Context

**Current ModeConfig interface (mode.ts):**
```typescript
export interface ModeConfig {
  readonly mode: GameMode;
  readonly showBeliefBar: boolean;
  readonly showNumericScoring: boolean;
  readonly playerChoosesObjection: boolean;
  readonly showTypeTaxRule: boolean;
  readonly barkFilter: BarkFilter;
}
```

**Modified ModeConfig interface:**
```typescript
export interface ModeConfig {
  readonly mode: GameMode;
  readonly showBeliefBar: boolean;
  readonly showNumericScoring: boolean;
  readonly playerChoosesObjection: boolean;
  readonly showTypeTaxRule: boolean;
  readonly barkFilter: BarkFilter;

  /**
   * When true, use Mini Lite tiering (axis-based: coverage, independence, concern).
   * When false, use V5 Belief tiering (numeric score vs target threshold).
   *
   * Mini Lite tiering rules (from spec section 5.2):
   * - 2 truths + 1 lie => CLOSE
   * - 1 truth + 2 lies => BUSTED
   * - 0 truths + 3 lies => BUSTED
   * - All truths + concernHit => CLEARED
   * - All truths + correlated => CLEARED
   * - All truths + diverse + diversified => FLAWLESS
   * - Fairness clamp: All truths => at least CLEARED, always
   */
  readonly useLiteTiering: boolean;
}
```

**Updated MINI_MODE preset:**
```typescript
export const MINI_MODE: ModeConfig = {
  mode: 'mini',
  showBeliefBar: false,
  showNumericScoring: false,
  playerChoosesObjection: false,
  showTypeTaxRule: false,
  barkFilter: 'mini-safe',
  useLiteTiering: true,  // NEW: Mini uses axis-based tiering
} as const;
```

**Updated ADVANCED_MODE preset:**
```typescript
export const ADVANCED_MODE: ModeConfig = {
  mode: 'advanced',
  showBeliefBar: true,
  showNumericScoring: true,
  playerChoosesObjection: true,
  showTypeTaxRule: true,
  barkFilter: 'all',
  useLiteTiering: false,  // NEW: Advanced uses V5 Belief tiering
} as const;
```

**Key Invariant:** The `useLiteTiering` flag determines which tier calculation path is used:
- `true` => call `getMiniLiteTier()` (Task 302)
- `false` => call `getTier()` (existing V5 belief-based)

**Why this field exists:**
The spec (section 5.2) states: "Mini tiers are determined by this Lite mapping, **not V5 Belief math.** V5 Belief remains internal and is used only in Advanced mode / Expert View."

This flag enables the resolver to route to the correct tiering logic without needing mode-specific branching throughout the codebase.

### Source Docs
- `_process/KoA Mini Overhaul/mini-overhaul.md` - Section 5.2 Outcome mapping

---

## Acceptance Criteria

### AC-1: useLiteTiering field exists in ModeConfig <- R5.1
- **Given:** ModeConfig interface in mode.ts
- **When:** Adding useLiteTiering field
- **Then:** Field is `readonly useLiteTiering: boolean` with JSDoc explaining the two tiering systems

### AC-2: MINI_MODE has useLiteTiering: true <- R5.1
- **Given:** MINI_MODE preset
- **When:** Checking preset value
- **Then:** `useLiteTiering` is `true`

### AC-3: ADVANCED_MODE has useLiteTiering: false <- R5.1
- **Given:** ADVANCED_MODE preset
- **When:** Checking preset value
- **Then:** `useLiteTiering` is `false`

### AC-4: Type exports unchanged <- R5.1
- **Given:** index.ts exports
- **When:** Checking ModeConfig export
- **Then:** ModeConfig is still exported (no change needed, type auto-updates)

---

## Edge Cases

### EC-1: Custom ModeConfig without useLiteTiering
- **Scenario:** Developer creates custom ModeConfig and forgets useLiteTiering
- **Expected:** TypeScript error: Property 'useLiteTiering' is missing

### EC-2: Trial mode (future)
- **Scenario:** TRIAL_MODE preset is added later
- **Expected:** Must explicitly set useLiteTiering (probably false for Trial mode)

---

## Error Cases

### ERR-1: Missing useLiteTiering in preset
- **When:** Creating a ModeConfig without useLiteTiering
- **Then:** TypeScript compile error
- **Error Message:** Property 'useLiteTiering' is missing in type '{ mode: "mini"; ... }'

---

## Scope

**In Scope:**
- Add useLiteTiering field to ModeConfig interface
- Update MINI_MODE preset to `useLiteTiering: true`
- Update ADVANCED_MODE preset to `useLiteTiering: false`
- Add JSDoc comment explaining the field

**Out of Scope:**
- Implementing getMiniLiteTier function (Task 302)
- Wiring the resolver to use useLiteTiering (Task 302)
- Coverage computation (Task 201)
- Independence computation (Task 202)
- Concern computation (Task 204)

---

## Implementation Hints

1. This is a simple type extension - add the field and update presets
2. The JSDoc comment should reference both tiering systems for clarity
3. Don't add conditional logic yet - that's Task 302's job
4. Consider adding a note in the JSDoc about the fairness clamp (all truths => CLEARED minimum)

---

## Log

### Planning Notes
**Context:** Mini needs axis-based tiering instead of V5 Belief math. This flag enables the router to pick the right tier function.
**Decisions:** Boolean flag is simpler than a string enum since there are only two tiering systems.
