# Task 203: Implement computeConcern

**Status:** backlog
**Complexity:** M
**Depends On:** 101
**Implements:** R3.3, R3.4, R3.5

---

## Objective

Create the Concern type with its payload variants and the computeConcern function that determines KOA's suspicion focus based on the first two played cards.

---

## Context

### Relevant Files
- NEW: `packages/engine-core/src/resolver/v5/concern.ts` — create this file
- `packages/engine-core/src/types/v5/card.ts` — Card interface
- `packages/engine-core/src/types/v5/enums.ts` — SignalRoot, ControlPath, ClaimShape, EvidenceType

### Embedded Context

**Card type (relevant fields from Task 101):**
```typescript
interface Card {
  readonly id: string;
  readonly signalRoot: SignalRoot;
  readonly controlPath: ControlPath;  // 'manual' | 'automation' | 'remote' | 'unknown'
  readonly claimShape: ClaimShape;    // 'absence' | 'positive' | 'attribution' | 'integrity'
  readonly evidenceType: EvidenceType; // 'SENSOR' | 'DIGITAL' | 'TESTIMONY' | 'PHYSICAL'
}
```

**Concern type (discriminated union with payload):**
```typescript
/**
 * Concern represents KOA's focus/suspicion after the first two cards.
 * The type uses a discriminated union so the payload can be type-checked.
 *
 * Priority order for computation (from spec section 3.3):
 * 1. signalRoot repeats -> same_system (stores which root)
 * 2. controlPath repeats -> automation_heavy | manual_heavy | remote_heavy
 * 3. claimShape repeats -> absence_heavy | attribution_heavy | integrity_heavy
 * 4. evidenceType repeats -> all_digital | all_sensor | all_testimony | all_physical
 * 5. nothing repeats -> no_concern
 */
export type Concern =
  | { readonly key: 'same_system'; readonly root: SignalRoot }
  | { readonly key: 'automation_heavy' }
  | { readonly key: 'manual_heavy' }
  | { readonly key: 'remote_heavy' }
  | { readonly key: 'absence_heavy' }
  | { readonly key: 'attribution_heavy' }
  | { readonly key: 'integrity_heavy' }
  | { readonly key: 'all_digital' }
  | { readonly key: 'all_sensor' }
  | { readonly key: 'all_testimony' }
  | { readonly key: 'all_physical' }
  | { readonly key: 'no_concern' };

/**
 * Type alias for the concern key discriminant.
 */
export type ConcernKey = Concern['key'];

/**
 * Helper to extract the concern key from a Concern object.
 * Useful for template lookups and ceiling explanations.
 */
export function getConcernKey(concern: Concern): ConcernKey {
  return concern.key;
}
```

**Function signatures to implement:**
```typescript
/**
 * Computes the Concern from the first two played cards.
 * Uses priority order: signalRoot > controlPath > claimShape > evidenceType > no_concern
 *
 * @param card1 - First played card (T1)
 * @param card2 - Second played card (T2)
 * @returns Concern object with key and optional payload
 */
export function computeConcern(card1: Card, card2: Card): Concern;

/**
 * Tests whether a card matches the given concern's dimension.
 * Used for determining concern hit (3-of-3) vs avoided (2-of-3).
 *
 * Matching logic (from spec section 3.3):
 * - same_system: card.signalRoot === concern.root
 * - automation_heavy: card.controlPath === 'automation'
 * - manual_heavy: card.controlPath === 'manual'
 * - remote_heavy: card.controlPath === 'remote'
 * - absence_heavy: card.claimShape === 'absence'
 * - attribution_heavy: card.claimShape === 'attribution'
 * - integrity_heavy: card.claimShape === 'integrity'
 * - all_digital: card.evidenceType === 'DIGITAL'
 * - all_sensor: card.evidenceType === 'SENSOR'
 * - all_testimony: card.evidenceType === 'TESTIMONY'
 * - all_physical: card.evidenceType === 'PHYSICAL'
 * - no_concern: always false
 *
 * @param card - Card to test
 * @param concern - Concern to match against
 * @returns true if card matches the concern dimension
 */
export function matchesConcern(card: Card, concern: Concern): boolean;
```

**Key invariants:**
- Concern is computed ONCE after T2 and never re-evaluated
- signalRoot: 'unknown' does NOT trigger same_system (spec: "and != 'unknown'")
- controlPath: 'unknown' does NOT trigger concern (only manual/automation/remote)
- The `same_system` variant stores the exact root for precise hit testing

---

## Acceptance Criteria

### AC-1: Same signalRoot triggers same_system <- R3.3
- **Given:** card1.signalRoot = 'phone_os', card2.signalRoot = 'phone_os'
- **When:** computeConcern(card1, card2) is called
- **Then:** Returns `{ key: 'same_system', root: 'phone_os' }`

### AC-2: Unknown signalRoot does not trigger same_system <- R3.3
- **Given:** card1.signalRoot = 'unknown', card2.signalRoot = 'unknown'
- **When:** computeConcern(card1, card2) is called
- **Then:** Falls through to next priority level (does NOT return same_system)

### AC-3: Same controlPath triggers appropriate concern <- R3.4
- **Given:** card1.controlPath = 'automation', card2.controlPath = 'automation'
- **When:** computeConcern(card1, card2) is called
- **Then:** Returns `{ key: 'automation_heavy' }`

### AC-4: Same claimShape triggers appropriate concern <- R3.4
- **Given:** card1.claimShape = 'absence', card2.claimShape = 'absence'
- **When:** computeConcern(card1, card2) is called
- **Then:** Returns `{ key: 'absence_heavy' }`

### AC-5: Same evidenceType triggers appropriate concern <- R3.4
- **Given:** card1.evidenceType = 'SENSOR', card2.evidenceType = 'SENSOR'
- **When:** computeConcern(card1, card2) is called
- **Then:** Returns `{ key: 'all_sensor' }`

### AC-6: Priority order respected <- R3.5
- **Given:** card1 and card2 match on BOTH signalRoot ('phone_os') AND controlPath ('automation')
- **When:** computeConcern(card1, card2) is called
- **Then:** Returns `{ key: 'same_system', root: 'phone_os' }` (signalRoot has priority)

### AC-7: No matches returns no_concern <- R3.3
- **Given:** card1 and card2 differ on all dimensions
- **When:** computeConcern(card1, card2) is called
- **Then:** Returns `{ key: 'no_concern' }`

### AC-8: matchesConcern works for same_system <- R3.5
- **Given:** concern = `{ key: 'same_system', root: 'phone_os' }`, card.signalRoot = 'phone_os'
- **When:** matchesConcern(card, concern) is called
- **Then:** Returns true

### AC-9: matchesConcern returns false for no_concern <- R3.5
- **Given:** concern = `{ key: 'no_concern' }`, any card
- **When:** matchesConcern(card, concern) is called
- **Then:** Returns false (no_concern never matches)

---

## Edge Cases

### EC-1: controlPath 'unknown' does not trigger concern
- **Scenario:** card1.controlPath = 'unknown', card2.controlPath = 'unknown'
- **Expected:** Falls through to claimShape check (unknown doesn't trigger _heavy concerns)

### EC-2: Different signalRoot same group
- **Scenario:** card1.signalRoot = 'phone_os', card2.signalRoot = 'device_firmware' (both 'device' group)
- **Expected:** Does NOT trigger same_system (concern checks exact root match, not group)

### EC-3: positive claimShape does not trigger concern
- **Scenario:** card1.claimShape = 'positive', card2.claimShape = 'positive'
- **Expected:** Falls through to evidenceType (no 'positive_heavy' concern exists)

### EC-4: matchesConcern with same_system but different root
- **Scenario:** concern = `{ key: 'same_system', root: 'phone_os' }`, card.signalRoot = 'device_firmware'
- **Expected:** matchesConcern returns false

### EC-5: matchesConcern with controlPath concern
- **Scenario:** concern = `{ key: 'automation_heavy' }`, card.controlPath = 'manual'
- **Expected:** matchesConcern returns false

### EC-6: All dimensions different
- **Scenario:** card1 = (koa_cloud, manual, absence, SENSOR), card2 = (human_partner, automation, positive, DIGITAL)
- **Expected:** Returns `{ key: 'no_concern' }`

---

## Error Cases

### ERR-1: Invalid signalRoot stored in same_system
- **When:** This should never happen (type system prevents it)
- **Then:** TypeScript enforces SignalRoot type on `root` field
- **Error Message:** N/A (compile-time only)

---

## Scope

**In Scope:**
- Create concern.ts file
- Define Concern discriminated union type
- Define ConcernKey type alias
- Implement computeConcern function
- Implement matchesConcern function
- Export from resolver/v5/index.ts

**Out of Scope:**
- Concern hit test (evaluateConcernResult) - Task 204
- KOA bark templates - Task 601
- UI display of concern - Phase 2
- Outcome tiering logic - separate task

---

## Implementation Hints

1. Use a switch or if-else chain that returns early on first match
2. For same_system, check `root1 === root2 && root1 !== 'unknown'`
3. For controlPath, exclude 'unknown' from triggering concerns
4. For claimShape, note that 'positive' does NOT have a corresponding concern
5. matchesConcern should use a switch on concern.key for type narrowing

**Example implementation sketch for computeConcern:**
```typescript
export function computeConcern(card1: Card, card2: Card): Concern {
  // Priority 1: signalRoot (must match and not be 'unknown')
  if (card1.signalRoot === card2.signalRoot && card1.signalRoot !== 'unknown') {
    return { key: 'same_system', root: card1.signalRoot };
  }

  // Priority 2: controlPath (exclude 'unknown')
  if (card1.controlPath === card2.controlPath && card1.controlPath !== 'unknown') {
    switch (card1.controlPath) {
      case 'automation': return { key: 'automation_heavy' };
      case 'manual': return { key: 'manual_heavy' };
      case 'remote': return { key: 'remote_heavy' };
    }
  }

  // Priority 3: claimShape (note: 'positive' has no concern)
  if (card1.claimShape === card2.claimShape) {
    switch (card1.claimShape) {
      case 'absence': return { key: 'absence_heavy' };
      case 'attribution': return { key: 'attribution_heavy' };
      case 'integrity': return { key: 'integrity_heavy' };
      // 'positive' falls through - no concern for it
    }
  }

  // Priority 4: evidenceType
  if (card1.evidenceType === card2.evidenceType) {
    switch (card1.evidenceType) {
      case 'DIGITAL': return { key: 'all_digital' };
      case 'SENSOR': return { key: 'all_sensor' };
      case 'TESTIMONY': return { key: 'all_testimony' };
      case 'PHYSICAL': return { key: 'all_physical' };
    }
  }

  return { key: 'no_concern' };
}
```

**Example implementation sketch for matchesConcern:**
```typescript
export function matchesConcern(card: Card, concern: Concern): boolean {
  switch (concern.key) {
    case 'same_system':
      return card.signalRoot === concern.root;
    case 'automation_heavy':
      return card.controlPath === 'automation';
    case 'manual_heavy':
      return card.controlPath === 'manual';
    case 'remote_heavy':
      return card.controlPath === 'remote';
    case 'absence_heavy':
      return card.claimShape === 'absence';
    case 'attribution_heavy':
      return card.claimShape === 'attribution';
    case 'integrity_heavy':
      return card.claimShape === 'integrity';
    case 'all_digital':
      return card.evidenceType === 'DIGITAL';
    case 'all_sensor':
      return card.evidenceType === 'SENSOR';
    case 'all_testimony':
      return card.evidenceType === 'TESTIMONY';
    case 'all_physical':
      return card.evidenceType === 'PHYSICAL';
    case 'no_concern':
      return false;
  }
}
```

---

## Log

### Planning Notes
**Context:** Concern is the "dangerous information" lever (P4). It creates tension: "play strong card or avoid suspicion?"
**Decisions:**
- Concern type is a discriminated union for type safety
- same_system stores the exact root for precise hit testing
- 'positive' claimShape intentionally has no concern (per spec)
- controlPath 'unknown' excluded to avoid false triggers
- Priority order is critical: signalRoot > controlPath > claimShape > evidenceType
