# Task 801: Update Thermostat Puzzle with v1 Lite Tags

**Status:** backlog
**Complexity:** M
**Depends On:** 101, 102, 603
**Implements:** R8.1, R8.2

---

## Objective

Update the thermostat puzzle (generated-puzzle.ts) with all new v1 Lite fields: factTouch, signalRoot, controlPath, claimShape, evidenceType for cards; trapAxis, baitReason for lies; and closing-energy storyCompletions barks.

---

## Context

### Relevant Files
- `packages/engine-core/src/packs/generated-puzzle.ts` — thermostat puzzle
- Task 101: Card field definitions
- Task 102: Lie field definitions
- Task 603: T3 bark audit results

### Embedded Context

**Current card structure (needs updating):**
```typescript
{
  id: 'card-1',
  name: 'Thermostat Log',
  description: '...',
  strength: 3,
  isLie: false,
  // Missing: factTouch, signalRoot, controlPath, claimShape, evidenceType
}
```

**Updated card structure:**
```typescript
{
  id: 'card-1',
  name: 'Thermostat Log',
  description: 'The smart thermostat recorded the temperature drop at 11:47 PM.',
  strength: 3,
  isLie: false,

  // v1 Lite fields
  factTouch: 1,  // Which fact this card addresses (1, 2, or 3)
  signalRoot: 'koa_cloud',  // Where the signal originates
  controlPath: 'automation',  // How the action was controlled
  claimShape: 'positive',  // Shape of the claim
  evidenceType: 'DIGITAL',  // Type of evidence source (existing field, ensure populated)
}
```

**Lie structure update:**
```typescript
{
  id: 'lie-1',
  cardId: 'card-lie-1',
  lieType: 'inferential',  // NOT 'direct_contradiction'
  reason: 'Claims device was offline but logs show activity',

  // v1 Lite trap fields
  trapAxis: 'independence',  // Why this lie is tempting
  baitReason: 'Offers a human witness to break device-heavy pattern',
}
```

**storyCompletions update (from Task 603):**
```typescript
storyCompletions: {
  all_digital: ["That's your story. Let me process."],
  all_sensor: ["Three pieces submitted. Checking the house."],
  all_testimony: ["Story complete. One moment."],
  digital_heavy: ["Alright. Your version. Processing."],
  sensor_heavy: ["Got it. Running verification."],
  testimony_heavy: ["Understood. Let me check."],
  mixed_strong: ["That's everything. Stand by."],
  mixed_varied: ["Three cards. Let's see what they say."],
}
```

**factTouch assignment rules:**
1. Each card addresses exactly one fact
2. All 3 facts must be coverable by truth cards
3. Lies may address any fact (adds to trap design)

---

## Acceptance Criteria

### AC-1: All truth cards have factTouch <- R8.1
- **Given:** Each truth card in puzzle
- **When:** Checking fields
- **Then:** factTouch is 1, 2, or 3

### AC-2: All cards have signalRoot <- R8.1
- **Given:** Each card in puzzle
- **When:** Checking fields
- **Then:** signalRoot is valid SignalRoot value

### AC-3: All cards have controlPath <- R8.1
- **Given:** Each card in puzzle
- **When:** Checking fields
- **Then:** controlPath is 'manual' | 'automation' | 'remote' | 'unknown'

### AC-4: All cards have claimShape <- R8.1
- **Given:** Each card in puzzle
- **When:** Checking fields
- **Then:** claimShape is 'absence' | 'positive' | 'attribution' | 'integrity'

### AC-5: All cards have evidenceType <- R8.1
- **Given:** Each card in puzzle
- **When:** Checking fields
- **Then:** evidenceType is 'DIGITAL' | 'SENSOR' | 'TESTIMONY' | 'PHYSICAL'

### AC-6: All lies have trapAxis <- R8.2
- **Given:** Each lie in puzzle
- **When:** Checking fields
- **Then:** trapAxis is valid TrapAxis value

### AC-7: All lies have baitReason <- R8.2
- **Given:** Each lie in puzzle
- **When:** Checking fields
- **Then:** baitReason is non-empty string

### AC-8: lieType has no direct_contradiction <- R8.2
- **Given:** Each lie in puzzle
- **When:** Checking lieType
- **Then:** Value is 'inferential' or 'relational', never 'direct_contradiction'

### AC-9: storyCompletions are closing-energy <- R8.1
- **Given:** All storyCompletions barks
- **When:** Reading content
- **Then:** No axis commentary, no evaluation, just commitment/transition

---

## Edge Cases

### EC-1: factTouch coverage
- **Scenario:** Need to ensure facts 1, 2, 3 all covered
- **Expected:** At least one truth card for each fact

### EC-2: signalRoot diversity
- **Scenario:** Cards should have varied signalRoots
- **Expected:** Not all cards have same signalRoot

### EC-3: Trap diversity
- **Scenario:** Lies should have different trapAxis values
- **Expected:** Multiple trap strategies represented

---

## Error Cases

### ERR-1: Missing field
- **When:** TypeScript compile
- **Then:** Error for missing required field
- **Error Message:** Property 'factTouch' is missing

---

## Scope

**In Scope:**
- Add all v1 Lite fields to all cards
- Add trapAxis and baitReason to all lies
- Update lieType values (remove direct_contradiction)
- Replace storyCompletions with closing-energy versions

**Out of Scope:**
- Creating new puzzles (Task 802 addresses generator)
- Validator checks (Tasks 401-405)
- UI changes

---

## Implementation Hints

1. Read existing puzzle structure carefully
2. Assign factTouch based on what fact each card addresses
3. Derive signalRoot from the card's description/source
4. Choose controlPath based on how the action was taken
5. Choose claimShape based on what the card claims
6. Choose evidenceType based on evidence type
7. For lies, think about why a player would pick it (trapAxis, baitReason)
8. Run TypeScript compiler to verify no missing fields

---

## Log

### Planning Notes
**Context:** First puzzle to be fully tagged for v1 Lite
**Decisions:** Manual tagging for existing puzzle
