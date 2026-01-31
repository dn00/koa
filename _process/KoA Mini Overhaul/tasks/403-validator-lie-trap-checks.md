# Task 403: Validator Lie Trap Checks

**Status:** backlog
**Complexity:** S
**Depends On:** 401
**Implements:** R7.6, R7.7

---

## Objective

Add validator checks to ensure each lie has `trapAxis` and `baitReason` populated, and at least 2 distinct `trapAxis` values exist across the 3 lies (anti-meta constraint).

---

## Context

### Relevant Files
- `scripts/prototype-v5.ts` — Main validator file
- `scripts/v5-types.ts` — LieInfo interface (will have new fields from Task 102)

### Embedded Context

**LieInfo structure (from Task 102):**
```typescript
type TrapAxis =
  | 'coverage'      // Lie patches a coverage gap
  | 'independence'  // Lie adds source diversity
  | 'control_path'  // Lie offers convenient automation/remote alibi
  | 'claim_shape';  // Lie uses seductive absence/integrity claim

interface LieInfo {
  cardId: string;
  lieType: 'inferential' | 'relational';
  reason: string;

  // v1 Lite trap fields (required)
  trapAxis: TrapAxis;
  baitReason: string;
}
```

**From spec section 2.3 (Lie metadata):**
> - Exactly 3 lies in `lies[]`, one per lie card
> - All lies have `trapAxis` + `baitReason` populated
> - At least **2 distinct trapAxis** across 3 lies (anti-meta)

**Existing lie access in validator:**
```typescript
// Already available in runChecks:
const lies = cards.filter(c => c.isLie);

// puzzle.lies contains LieInfo for each lie
for (const lie of puzzle.lies) {
  // lie.cardId, lie.lieType, lie.reason, lie.trapAxis, lie.baitReason
}
```

**Existing check() pattern:**
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
```

---

## Acceptance Criteria

### AC-1: All lies have trapAxis <- R7.6
- **Given:** A puzzle with 3 lies in puzzle.lies[]
- **When:** Running the validator
- **Then:** Check V8 passes if all LieInfo entries have non-empty trapAxis
- **Then:** Check V8 fails if any lie is missing trapAxis, listing the cardIds

### AC-2: All lies have baitReason <- R7.6
- **Given:** A puzzle with 3 lies in puzzle.lies[]
- **When:** Running the validator
- **Then:** Check V9 passes if all LieInfo entries have non-empty baitReason
- **Then:** Check V9 fails if any lie is missing baitReason, listing the cardIds

### AC-3: At least 2 distinct trapAxis values <- R7.7
- **Given:** A puzzle with 3 lies
- **When:** Running the validator
- **Then:** Check V10 passes if Set(lies.map(l => l.trapAxis)).size >= 2
- **Then:** Check V10 fails if all 3 lies have identical trapAxis

---

## Edge Cases

### EC-1: Empty string trapAxis
- **Scenario:** Lie has `trapAxis: ''`
- **Expected:** V8 fails: "missing trapAxis: card-lie-1"

### EC-2: Empty string baitReason
- **Scenario:** Lie has `baitReason: '   '` (whitespace only)
- **Expected:** V9 fails after trimming: "missing baitReason: card-lie-2"

### EC-3: All lies same trapAxis
- **Scenario:** All 3 lies have `trapAxis: 'coverage'`
- **Expected:** V10 fails: "only 1 distinct trapAxis: [coverage] — need 2+"

### EC-4: Exactly 2 distinct trapAxis
- **Scenario:** Lies have trapAxis: ['coverage', 'coverage', 'independence']
- **Expected:** V10 passes: "2 distinct trapAxis: [coverage, independence]"

### EC-5: All 3 distinct trapAxis
- **Scenario:** Lies have trapAxis: ['coverage', 'independence', 'claim_shape']
- **Expected:** V10 passes: "3 distinct trapAxis"

---

## Error Cases

### ERR-1: puzzle.lies doesn't match lie cards
- **When:** puzzle.lies has 2 entries but 3 cards have isLie=true
- **Then:** Existing check S5 catches this; V8/V9 iterate over puzzle.lies

### ERR-2: Invalid trapAxis value
- **When:** Lie has trapAxis: 'invalid_axis'
- **Then:** TypeScript should catch this at compile time
- **Note:** Runtime check optional but recommended for robustness

---

## Scope

**In Scope:**
- Add check V8: all lies have trapAxis
- Add check V9: all lies have baitReason
- Add check V10: at least 2 distinct trapAxis values
- V8 and V9 are error severity; V10 can be error or warn (spec says required)

**Out of Scope:**
- Validating trapAxis is from enum (TypeScript handles)
- Validating baitReason quality/length
- Tag presence for cards (Task 401)

---

## Implementation Hints

1. Place these checks after V7 (fact coverage) in the validator
2. Iterate over puzzle.lies, not the lie cards directly
3. Collect all missing fields before reporting
4. For V10, use Set to count distinct values
5. Use .trim() on baitReason before checking non-empty

**Suggested check IDs:**
- V8: Lies have trapAxis
- V9: Lies have baitReason
- V10: Trap axis diversity (2+ distinct)

**Example detail strings:**
- V8 pass: "all 3 lies have trapAxis"
- V8 fail: "missing trapAxis: lie-thermostat, lie-router"
- V9 pass: "all 3 lies have baitReason"
- V10 pass: "3 distinct trapAxis: coverage, independence, claim_shape"
- V10 fail: "only 1 trapAxis: [coverage] — need 2+ distinct"

**Validation array (optional runtime check):**
```typescript
const VALID_TRAP_AXES: readonly string[] = [
  'coverage', 'independence', 'control_path', 'claim_shape'
];
```

---

## Log

### Planning Notes
**Context:** Anti-meta constraint — lies shouldn't all exploit same weakness
**Decisions:** V10 at error severity since spec requires diversity
