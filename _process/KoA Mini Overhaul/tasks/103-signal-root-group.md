# Task 103: Add SignalRootGroup Derivation

**Status:** backlog
**Complexity:** S
**Depends On:** 101
**Implements:** R2.8

---

## Objective

Create the SignalRootGroup type and derivation table that maps each SignalRoot to its group for independence computation.

---

## Context

### Relevant Files
- NEW: `packages/engine-core/src/resolver/v5/independence.ts`
- `packages/engine-core/src/types/v5/enums.ts` — add SignalRootGroup type

### Embedded Context

**SignalRootGroup type:**
```typescript
/**
 * Groups of related signal roots for independence computation.
 * Same group = related but not identical.
 * Same root = strongly correlated (single point of failure).
 */
export type SignalRootGroup = 'cloud' | 'device' | 'network' | 'human' | 'physical' | 'unknown';
```

**Derivation table (const, not function):**
```typescript
import type { SignalRoot, SignalRootGroup } from '../../types/v5/index.js';

/**
 * Maps each SignalRoot to its group.
 * Used to compute correlated_weak (same group, different root).
 */
export const signalRootGroup: Record<SignalRoot, SignalRootGroup> = {
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
} as const;

/**
 * Get the group for a signal root.
 * Prefer direct lookup over this function.
 */
export function getSignalRootGroup(root: SignalRoot): SignalRootGroup {
  return signalRootGroup[root];
}
```

**Invariant:** Every SignalRoot value must have a mapping. TypeScript will enforce this via `Record<SignalRoot, SignalRootGroup>`.

---

## Acceptance Criteria

### AC-1: SignalRootGroup type exists ← R2.8
- **Given:** enums.ts
- **When:** Adding type
- **Then:** Type has exactly 6 values: 'cloud', 'device', 'network', 'human', 'physical', 'unknown'

### AC-2: Derivation table is complete ← R2.8
- **Given:** signalRootGroup const
- **When:** Checking keys
- **Then:** All 11 SignalRoot values have mappings

### AC-3: Table type-checks ← R2.8
- **Given:** Record<SignalRoot, SignalRootGroup>
- **When:** Compiling TypeScript
- **Then:** Missing keys cause compile error

---

## Edge Cases

### EC-1: Adding new SignalRoot in future
- **Scenario:** Someone adds a new SignalRoot value
- **Expected:** TypeScript error until derivation table updated

### EC-2: 'unknown' group
- **Scenario:** Card has signalRoot: 'unknown'
- **Expected:** getSignalRootGroup returns 'unknown', independence logic ignores it

---

## Error Cases

### ERR-1: Missing mapping
- **When:** SignalRoot added but not in table
- **Then:** TypeScript error
- **Error Message:** Property 'new_root' is missing in type

---

## Scope

**In Scope:**
- Create independence.ts file
- Add SignalRootGroup type to enums
- Create signalRootGroup const
- Create getSignalRootGroup helper

**Out of Scope:**
- Independence computation logic (Task 202)
- Concern computation (Task 203)

---

## Implementation Hints

1. Create the new file at `resolver/v5/independence.ts`
2. Use `as const` for the derivation table
3. Export from resolver/v5/index.ts
4. The function is optional — direct table lookup works too

---

## Log

### Planning Notes
**Context:** Foundation for independence computation
**Decisions:** Table is const, not computed
