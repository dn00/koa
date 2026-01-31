# Task 101: Add Card v1 Lite Fields

**Status:** backlog
**Complexity:** M
**Depends On:** none
**Implements:** R2.1, R2.2, R2.3, R2.4, R2.5

---

## Objective

Extend the Card interface with new axis-related fields required for v1 Lite: `factTouch`, `signalRoot`, `controlPath`, `claimShape`, `subsystem`.

---

## Context

### Relevant Files
- `packages/engine-core/src/types/v5/card.ts` — Card interface
- `packages/engine-core/src/types/v5/enums.ts` — add new enums
- `packages/engine-core/src/types/v5/index.ts` — export new types

### Existing Fields (No Change Needed)
The following fields **already exist** in the Card interface:
- `evidenceType: EvidenceType` — already defined in card.ts line 52
- `source: string` — already defined in card.ts line 70

This task only **adds new fields**, it does not modify existing ones.

### Embedded Context

**New enums to add to enums.ts:**
```typescript
/**
 * How the evidence was obtained/controlled.
 */
export type ControlPath = 'manual' | 'automation' | 'remote' | 'unknown';

/**
 * What kind of claim the evidence makes.
 */
export type ClaimShape = 'absence' | 'positive' | 'attribution' | 'integrity';

/**
 * The underlying data source for independence computation.
 * Keep this list small and consistent — no creative strings.
 */
export type SignalRoot =
  | 'koa_cloud'
  | 'phone_os'
  | 'router_net'
  | 'device_firmware'
  | 'camera_storage'
  | 'wearable_health'
  | 'human_partner'
  | 'human_neighbor'
  | 'human_self'
  | 'receipt_photo'
  | 'unknown';
```

**New fields to add to Card interface:**
```typescript
interface Card {
  // ... existing fields ...

  // v1 Lite axis tags (required for Mini mode)
  /** Which known fact this card addresses (exactly one). Scalar, not array. */
  readonly factTouch: 1 | 2 | 3;

  /** The underlying data source for independence computation. */
  readonly signalRoot: SignalRoot;

  /** How the evidence was obtained/controlled. */
  readonly controlPath: ControlPath;

  /** What kind of claim the evidence makes. */
  readonly claimShape: ClaimShape;

  /** The subsystem this evidence relates to (e.g., 'thermostat', 'printer', 'garage'). */
  readonly subsystem: string;
}
```

**Invariant:** `factTouch` is scalar (1, 2, or 3), NOT an array. Each card touches exactly one fact.

---

## Acceptance Criteria

### AC-1: ControlPath enum exists ← R2.3
- **Given:** enums.ts file
- **When:** Adding ControlPath type
- **Then:** Type has exactly 4 values: 'manual', 'automation', 'remote', 'unknown'

### AC-2: ClaimShape enum exists ← R2.4
- **Given:** enums.ts file
- **When:** Adding ClaimShape type
- **Then:** Type has exactly 4 values: 'absence', 'positive', 'attribution', 'integrity'

### AC-3: SignalRoot enum exists ← R2.2
- **Given:** enums.ts file
- **When:** Adding SignalRoot type
- **Then:** Type has exactly 11 values as specified

### AC-4: Card has factTouch field ← R2.1
- **Given:** Card interface
- **When:** Adding factTouch
- **Then:** Field is `readonly factTouch: 1 | 2 | 3` (scalar, not array)

### AC-5: Card has all new fields ← R2.2, R2.3, R2.4, R2.5
- **Given:** Card interface
- **When:** Adding all fields
- **Then:** Card has factTouch, signalRoot, controlPath, claimShape, subsystem

### AC-6: Types exported ← all
- **Given:** index.ts
- **When:** Updating exports
- **Then:** All new types are exported from engine-core

---

## Edge Cases

### EC-1: Existing puzzles missing fields
- **Scenario:** generated-puzzle.ts doesn't have new fields
- **Expected:** TypeScript will error; handled in Task 801

### EC-2: Unknown values for new fields
- **Scenario:** Generator doesn't know what value to use
- **Expected:** 'unknown' is valid for signalRoot and controlPath

---

## Error Cases

### ERR-1: Array factTouch
- **When:** Developer tries `factTouch: [1, 2]`
- **Then:** TypeScript error: "Type '(1 | 2)[]' is not assignable to type '1 | 2 | 3'"
- **Error Message:** Type mismatch on factTouch

---

## Scope

**In Scope:**
- Add new enums to enums.ts
- Add new fields to Card interface
- Update exports

**Out of Scope:**
- Updating existing puzzle data (Task 801)
- Validation logic (Task 401)
- SignalRootGroup derivation (Task 103)

---

## Implementation Hints

1. Add enums first, then Card fields
2. Use `readonly` for all new fields
3. Add JSDoc comments explaining each field's purpose
4. Don't make fields optional — they're required for Mini

---

## Log

### Planning Notes
**Context:** Foundation for v1 Lite axis system
**Decisions:** factTouch is scalar not array per spec
