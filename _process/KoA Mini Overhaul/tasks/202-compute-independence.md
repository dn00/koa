# Task 202: Implement computeIndependence

**Status:** backlog
**Complexity:** S
**Depends On:** 103
**Implements:** R3.2

---

## Objective

Create the independence computation function that determines whether the played cards come from diverse, weakly correlated, or strongly correlated sources.

---

## Context

### Relevant Files
- `packages/engine-core/src/resolver/v5/independence.ts` — add to this file (created in Task 103)
- `packages/engine-core/src/types/v5/card.ts` — Card interface with signalRoot field
- `packages/engine-core/src/types/v5/enums.ts` — SignalRoot and SignalRootGroup types

### Embedded Context

**Card type (from Task 101):**
```typescript
interface Card {
  readonly id: string;
  readonly signalRoot: SignalRoot;
  // ... other fields not relevant to this task
}
```

**SignalRoot type (from Task 101):**
```typescript
type SignalRoot =
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

**SignalRootGroup type and derivation (from Task 103):**
```typescript
type SignalRootGroup = 'cloud' | 'device' | 'network' | 'human' | 'physical' | 'unknown';

const signalRootGroup: Record<SignalRoot, SignalRootGroup> = {
  koa_cloud: 'cloud',
  phone_os: 'device',
  router_net: 'network',
  device_firmware: 'device',
  camera_storage: 'device',
  wearable_health: 'device',
  human_partner: 'human',
  human_neighbor: 'human',
  human_self: 'human',
  receipt_photo: 'physical',
  unknown: 'unknown',
};
```

**Independence result type:**
```typescript
/**
 * Independence level of played cards.
 * - 'diverse': No two cards share same signalRoot or signalRootGroup (best)
 * - 'correlated_weak': Two cards share same group but different roots
 * - 'correlated_strong': Two cards share exact same signalRoot (worst)
 */
export type IndependenceLevel = 'diverse' | 'correlated_weak' | 'correlated_strong';
```

**Function to implement:**
```typescript
/**
 * Computes the independence level of played cards based on their signalRoot values.
 *
 * Algorithm (from spec section 3.2):
 * 1. If any two played cards share same signalRoot (and signalRoot != 'unknown') => 'correlated_strong'
 * 2. Else if any two share same signalRootGroup (and group != 'unknown') => 'correlated_weak'
 * 3. Else => 'diverse'
 *
 * @param cards - Array of played cards (typically 1-3 cards)
 * @returns IndependenceLevel
 */
export function computeIndependence(cards: readonly Card[]): IndependenceLevel;
```

**Key invariant:** The 'unknown' signalRoot and 'unknown' signalRootGroup are excluded from correlation checks. Two cards with signalRoot: 'unknown' do NOT correlate.

---

## Acceptance Criteria

### AC-1: Diverse sources detected <- R3.2
- **Given:** Cards with signalRoot values ['koa_cloud', 'human_partner', 'receipt_photo']
- **When:** computeIndependence is called
- **Then:** Returns 'diverse' (all different roots and groups)

### AC-2: Strong correlation detected <- R3.2
- **Given:** Cards with signalRoot values ['phone_os', 'phone_os', 'human_partner']
- **When:** computeIndependence is called
- **Then:** Returns 'correlated_strong' (two cards share exact same root)

### AC-3: Weak correlation detected <- R3.2
- **Given:** Cards with signalRoot values ['phone_os', 'device_firmware', 'koa_cloud']
- **When:** computeIndependence is called
- **Then:** Returns 'correlated_weak' (phone_os and device_firmware both in 'device' group)

### AC-4: Unknown roots ignored for strong correlation <- R3.2
- **Given:** Cards with signalRoot values ['unknown', 'unknown', 'koa_cloud']
- **When:** computeIndependence is called
- **Then:** Returns 'diverse' (unknown roots don't count as same)

### AC-5: Unknown groups ignored for weak correlation <- R3.2
- **Given:** Cards with signalRoot values ['unknown', 'unknown', 'koa_cloud']
- **When:** computeIndependence is called
- **Then:** Returns 'diverse' (unknown groups don't correlate)

---

## Edge Cases

### EC-1: Empty cards array
- **Scenario:** computeIndependence([]) called with no cards
- **Expected:** Returns 'diverse' (nothing to correlate)

### EC-2: Single card
- **Scenario:** computeIndependence with only 1 card
- **Expected:** Returns 'diverse' (can't have correlation with one card)

### EC-3: All cards have unknown signalRoot
- **Scenario:** Cards with signalRoot values ['unknown', 'unknown', 'unknown']
- **Expected:** Returns 'diverse' (unknown is excluded from checks)

### EC-4: Strong correlation takes precedence
- **Scenario:** Cards with signalRoot values ['phone_os', 'phone_os', 'device_firmware']
- **Expected:** Returns 'correlated_strong' (even though phone_os and device_firmware share group)

### EC-5: Three different devices (same group)
- **Scenario:** Cards with signalRoot values ['phone_os', 'device_firmware', 'camera_storage']
- **Expected:** Returns 'correlated_weak' (all in 'device' group but different roots)

### EC-6: Human sources (same group, different roots)
- **Scenario:** Cards with signalRoot values ['human_partner', 'human_neighbor', 'human_self']
- **Expected:** Returns 'correlated_weak' (all in 'human' group)

---

## Error Cases

### ERR-1: Invalid signalRoot value
- **When:** Card has signalRoot value not in SignalRoot type
- **Then:** This is prevented by TypeScript. No runtime check needed.
- **Error Message:** N/A (compile-time only)

---

## Scope

**In Scope:**
- Add IndependenceLevel type to independence.ts
- Implement computeIndependence function
- Export from resolver/v5/index.ts

**Out of Scope:**
- UI display of independence results (Phase 2)
- Coverage computation (Task 201)
- Concern computation (Task 203)
- The "informational only" display rule when concern.key is 'same_system' (handled in outcome logic)

---

## Implementation Hints

1. Check for strong correlation first (priority order matters)
2. Use the existing signalRootGroup const from Task 103
3. For pairwise checks, compare each pair only once (avoid n^2 redundancy)
4. Early return when strong correlation found

**Example implementation sketch:**
```typescript
export function computeIndependence(cards: readonly Card[]): IndependenceLevel {
  // Check all pairs for same signalRoot (strong correlation)
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const rootA = cards[i].signalRoot;
      const rootB = cards[j].signalRoot;

      // Skip unknown roots
      if (rootA === 'unknown' || rootB === 'unknown') continue;

      if (rootA === rootB) {
        return 'correlated_strong';
      }
    }
  }

  // Check all pairs for same group (weak correlation)
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const groupA = signalRootGroup[cards[i].signalRoot];
      const groupB = signalRootGroup[cards[j].signalRoot];

      // Skip unknown groups
      if (groupA === 'unknown' || groupB === 'unknown') continue;

      if (groupA === groupB) {
        return 'correlated_weak';
      }
    }
  }

  return 'diverse';
}
```

---

## Log

### Planning Notes
**Context:** Independence is one of the 3 axes in v1 Lite. It answers "do the player's sources have single points of failure?"
**Decisions:**
- 'unknown' is explicitly excluded from correlation to avoid false positives
- Strong correlation has priority over weak (spec priority order)
- Internal distinction (strong vs weak) kept for analytics; collapsed for player display
