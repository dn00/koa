# Task 003: Update PATTERNS.md

**Status:** backlog
**Complexity:** S
**Depends On:** none (but run after app-v5-migration complete)
**Implements:** R5, R6

---

## Objective

Update PATTERNS.md to reflect V5 code patterns. Remove MVP-specific patterns, add V5 patterns.

---

## Changes Needed

First, read current PATTERNS.md to identify MVP-specific sections:
```
Read {process}/project/PATTERNS.md
```

### Likely Updates

**Type Patterns:**
- Update branded ID examples to use V5 types (CardId, etc.)
- Update domain type examples (Card instead of EvidenceCard)

**Result Pattern:**
- Still applies - V5 uses `Result<T, E>` extensively
- Update examples to use V5 function signatures

**Event Sourcing Pattern (if exists):**
- Update to show V5Event types
- Update deriveState example to deriveV5State

**Store Patterns:**
- Update Zustand examples for V5 store interface
- Show event append → derive pattern

**Error Handling:**
- Update error codes to V5 codes (CARD_NOT_IN_HAND, GAME_OVER, etc.)

---

## V5 Patterns to Document (if not present)

### Pure Engine Functions
```typescript
// V5 engine functions are pure: (state, input, config, seed) → Result
const result = playCard(state, cardId, config, seed);
if (result.ok) {
  // result.value contains new state + turn result
}
```

### Seed-Based Determinism
```typescript
// Initial seed stored in GAME_STARTED event
// Per-action seed derived: startEvent.seed + actionIndex
const seed = startEvent.seed + events.length;
```

### Config-Driven Behavior
```typescript
// GameConfig controls mechanics
interface GameConfig {
  startingBelief: number;
  turnsPerGame: number;
  typeTax: { enabled: boolean; penalty: number };
  objection: { enabled: boolean; ... };
}
```

---

## Definition of Done

- [ ] All MVP type examples updated to V5
- [ ] Result pattern examples use V5 functions
- [ ] Event pattern examples use V5Event
- [ ] No mentions of: EvidenceCard, Concern, Scrutiny, Counter
- [ ] V5-specific patterns documented

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
