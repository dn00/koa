# Task 102: Add Lie v1 Lite Fields

**Status:** backlog
**Complexity:** S
**Depends On:** none
**Implements:** R2.6, R2.7

---

## Objective

Extend the LieInfo interface with new trap fields: `trapAxis` and `baitReason`.

---

## Context

### Relevant Files
- `packages/engine-core/src/types/v5/index.ts` — LieInfo interface (or puzzle.ts)
- `packages/engine-core/src/types/v5/enums.ts` — add TrapAxis enum

### Embedded Context

**Current LieInfo structure (from puzzle.ts or index.ts):**
```typescript
interface LieInfo {
  cardId: string;
  lieType: 'direct_contradiction' | 'inferential' | 'relational';
  reason: string;
}
```

**New TrapAxis enum:**
```typescript
/**
 * Why a lie is tempting from an axis perspective.
 */
export type TrapAxis =
  | 'coverage'      // Lie patches a coverage gap
  | 'independence'  // Lie adds source diversity
  | 'control_path'  // Lie offers convenient automation/remote alibi
  | 'claim_shape';  // Lie uses seductive absence/integrity claim
```

**Updated LieInfo interface:**
```typescript
interface LieInfo {
  cardId: string;
  lieType: 'inferential' | 'relational';  // Note: 'direct_contradiction' removed
  reason: string;

  // v1 Lite trap fields (required)
  /** Why this lie is tempting from an axis perspective. */
  trapAxis: TrapAxis;
  /** One sentence explaining why players will pick this lie. */
  baitReason: string;
}
```

**Invariant:**
- `lieType` no longer includes 'direct_contradiction' (all lies require inference)
- Every lie must have both `trapAxis` and `baitReason`

---

## Acceptance Criteria

### AC-1: TrapAxis enum exists ← R2.6
- **Given:** enums.ts file
- **When:** Adding TrapAxis type
- **Then:** Type has exactly 4 values: 'coverage', 'independence', 'control_path', 'claim_shape'

### AC-2: LieInfo has trapAxis ← R2.6
- **Given:** LieInfo interface
- **When:** Adding trapAxis field
- **Then:** Field is `trapAxis: TrapAxis` (required, not optional)

### AC-3: LieInfo has baitReason ← R2.7
- **Given:** LieInfo interface
- **When:** Adding baitReason field
- **Then:** Field is `baitReason: string` (required, not optional)

### AC-4: LieType updated ← R1.2
- **Given:** LieType includes 'direct_contradiction'
- **When:** Updating per spec
- **Then:** LieType is `'inferential' | 'relational'` only

---

## Edge Cases

### EC-1: Existing puzzles have 'direct_contradiction'
- **Scenario:** generated-puzzle.ts uses lieType: 'direct_contradiction'
- **Expected:** TypeScript error; change to 'inferential' in Task 801

### EC-2: Missing trapAxis/baitReason in existing puzzles
- **Scenario:** Existing puzzle doesn't have new fields
- **Expected:** TypeScript error; add fields in Task 801

---

## Error Cases

### ERR-1: Invalid TrapAxis value
- **When:** Developer uses string not in enum
- **Then:** TypeScript error
- **Error Message:** Type '"invalid"' is not assignable to type 'TrapAxis'

---

## Scope

**In Scope:**
- Add TrapAxis enum
- Add trapAxis and baitReason to LieInfo
- Update LieType to remove 'direct_contradiction'

**Out of Scope:**
- Updating existing puzzle data (Task 801)
- Validation logic for trap diversity (Task 403)

---

## Implementation Hints

1. Check where LieInfo is defined (might be in puzzle.ts)
2. Remove 'direct_contradiction' from LieType
3. Add JSDoc comments
4. Export TrapAxis from index.ts

---

## Log

### Planning Notes
**Context:** Lies need trap metadata for anti-meta analysis
**Decisions:** Remove direct_contradiction per 7-minute design
