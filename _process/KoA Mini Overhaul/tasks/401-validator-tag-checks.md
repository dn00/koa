# Task 401: Validator Tag Presence Checks

**Status:** backlog
**Complexity:** M
**Depends On:** 101, 102
**Implements:** R1.3, R7.1, R7.2, R7.3

---

## Objective

Add validator checks to ensure every card has the required v1 Lite axis tags: `factTouch`, `signalRoot`, `controlPath`, `claimShape`, and `subsystem`. All enum values must come from their respective type definitions.

---

## Context

### Relevant Files
- `scripts/prototype-v5.ts` — Main validator file
- `scripts/v5-types.ts` — Type definitions (will have new types from Task 101)

### Embedded Context

**Required types (from Task 101/102):**
```typescript
type ControlPath = 'manual' | 'automation' | 'remote' | 'unknown';

type ClaimShape = 'absence' | 'positive' | 'attribution' | 'integrity';

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

// factTouch is a scalar: 1 | 2 | 3 (not an array)
```

**Existing check() pattern in prototype-v5.ts:**
```typescript
const check = (
  id: string,
  label: string,
  passed: boolean,
  detail: string,
  severity: 'error' | 'warn' = 'error'
) => {
  checks.push({ id, label, passed, detail, severity });
};

// Example usage:
check('S1', 'Card count', cards.length === config.cardsInHand,
  `${cards.length} (expected ${config.cardsInHand})`);
```

**Validation arrays for enum checking:**
```typescript
const VALID_SIGNAL_ROOTS: readonly string[] = [
  'koa_cloud', 'phone_os', 'router_net', 'device_firmware',
  'camera_storage', 'wearable_health', 'human_partner',
  'human_neighbor', 'human_self', 'receipt_photo', 'unknown'
];

const VALID_CONTROL_PATHS: readonly string[] = [
  'manual', 'automation', 'remote', 'unknown'
];

const VALID_CLAIM_SHAPES: readonly string[] = [
  'absence', 'positive', 'attribution', 'integrity'
];
```

**From spec section 1.3:**
- Mini has no timestamps. The `time` field should be `''` or omitted.

**From spec section 7.2:**
- Every card has: `factTouch` (scalar 1|2|3), `signalRoot`, `controlPath`, `claimShape`, `subsystem`
- `signalRoot` is from enum (no arbitrary strings)
- `factTouch` is scalar (not array) — exactly one fact per card

---

## Acceptance Criteria

### AC-1: factTouch presence and type check <- R7.1
- **Given:** A puzzle with 6 cards
- **When:** Running the validator
- **Then:** Check V1 passes if all cards have `factTouch` as exactly 1, 2, or 3 (scalar)
- **Then:** Check V1 fails with detail listing cards if any card is missing factTouch or has invalid value

### AC-2: signalRoot enum validation <- R7.2
- **Given:** A puzzle with 6 cards
- **When:** Running the validator
- **Then:** Check V2 passes if all cards have `signalRoot` from the defined enum
- **Then:** Check V2 fails with detail showing invalid values if any card has an arbitrary string

### AC-3: controlPath enum validation <- R7.2
- **Given:** A puzzle with 6 cards
- **When:** Running the validator
- **Then:** Check V3 passes if all cards have `controlPath` from the defined enum
- **Then:** Check V3 fails with detail showing invalid values

### AC-4: claimShape enum validation <- R7.2
- **Given:** A puzzle with 6 cards
- **When:** Running the validator
- **Then:** Check V4 passes if all cards have `claimShape` from the defined enum
- **Then:** Check V4 fails with detail showing invalid values

### AC-5: subsystem presence check <- R7.3
- **Given:** A puzzle with 6 cards
- **When:** Running the validator
- **Then:** Check V5 passes if all cards have `subsystem` as a non-empty string
- **Then:** Check V5 fails with detail listing cards missing subsystem

### AC-6: Mini has no timestamps <- R1.3
- **Given:** A puzzle with 6 cards (Mini mode)
- **When:** Running the validator
- **Then:** Check V6 passes if all cards have `time` as empty string or undefined
- **Then:** Check V6 fails with detail listing cards with non-empty timestamps

---

## Edge Cases

### EC-1: factTouch is array instead of scalar
- **Scenario:** Card has `factTouch: [1, 2]` instead of `factTouch: 2`
- **Expected:** V1 check fails with "factTouch must be scalar (1, 2, or 3), not array"

### EC-2: signalRoot is empty string
- **Scenario:** Card has `signalRoot: ''`
- **Expected:** V2 check fails, listing card ID and invalid value

### EC-3: subsystem is whitespace-only
- **Scenario:** Card has `subsystem: '   '`
- **Expected:** V5 check fails (trim and check non-empty)

### EC-4: Mixed valid and invalid
- **Scenario:** 5 cards have valid signalRoot, 1 has `signalRoot: 'made_up_value'`
- **Expected:** V2 fails, detail shows the one invalid card: "card-6: 'made_up_value'"

### EC-5: Card with timestamp in Mini
- **Scenario:** Card has `time: '11:47 PM'` in Mini mode
- **Expected:** V6 fails: "card-3 has timestamp '11:47 PM' (Mini must have no timestamps)"

---

## Error Cases

### ERR-1: Missing field entirely
- **When:** Card object doesn't have `factTouch` property at all
- **Then:** V1 fails with "missing: card-1, card-3"
- **Error Message:** "[card-id]: missing factTouch"

### ERR-2: Wrong factTouch type
- **When:** `factTouch: 0` or `factTouch: 4`
- **Then:** V1 fails with "[card-id]: factTouch 0 not in [1,2,3]"
- **Error Message:** "[card-id]: factTouch [value] not in [1,2,3]"

---

## Scope

**In Scope:**
- Add check V1: factTouch presence and scalar validation
- Add check V2: signalRoot enum validation
- Add check V3: controlPath enum validation
- Add check V4: claimShape enum validation
- Add check V5: subsystem presence (non-empty string)
- Add check V6: Mini timestamp check (time empty or omitted)
- All checks use severity 'error' (required for valid puzzle)

**Out of Scope:**
- factTouch partition logic (Task 402)
- Lie trapAxis/baitReason checks (Task 403)
- Concern P4 constraint (Task 404)

---

## Implementation Hints

1. Add validation arrays at module scope for clean enum checking
2. Place new checks in a "V1 Lite Tag Checks" section after Content Constraints
3. Use the same check() helper pattern
4. For factTouch, explicitly check `typeof card.factTouch === 'number'` and value in [1,2,3]
5. Collect all invalid cards before reporting (don't fail fast per card)
6. Use Array.isArray() to detect erroneous array factTouch

**Suggested check IDs:**
- V1: factTouch presence and type
- V2: signalRoot from enum
- V3: controlPath from enum
- V4: claimShape from enum
- V5: subsystem non-empty
- V6: Mini no timestamps (time empty/omitted)

---

## Log

### Planning Notes
**Context:** Foundation for v1 Lite axis validation; required before partition and concern checks
**Decisions:** All checks are 'error' severity since tags are mandatory for Mini
