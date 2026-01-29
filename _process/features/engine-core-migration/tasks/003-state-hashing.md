# Task 003: State Hashing

**Status:** backlog
**Assignee:** -
**Blocked By:** 001
**Phase:** 1 - Foundation Types
**Complexity:** S
**Depends On:** 001
**Implements:** R7.1, R7.2, R7.3

---

## Objective

Implement deterministic state hashing for GameState, following the Python kernel's `snapshot_hash()` pattern. This enables verification that game state is identical across different platforms/replays.

---

## Context

The Python kernel (`docs/source-files/kernel/state.py`) uses canonical JSON serialization with sorted keys to produce deterministic hashes. We need the same for V5 GameState to verify determinism (Invariant I1).

### Relevant Files
- `docs/source-files/kernel/state.py` - Python snapshot_hash() implementation
- `docs/source-files/kernel/hash.py` - canonical_json() and compute_hash()
- Task 001 output: `packages/engine-core/src/types/v5/state.ts`

### Embedded Context

**Python Pattern (from hash.py):**
```python
def canonical_json(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()

def compute_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()
```

**Invariant I1 (Deterministic Resolver):**
- Same inputs MUST produce same outputs
- Event replay reconstructs identical state
- No floating-point math in game logic

---

## Acceptance Criteria

### AC-1: canonicalJson Function ← R7.2
- **Given:** An object `{ b: 1, a: 2 }`
- **When:** canonicalJson() called
- **Then:** Returns `{"a":2,"b":1}` (sorted keys, no spaces)
- **Test Type:** unit

### AC-2: computeStateHash Function ← R7.1
- **Given:** A GameState object
- **When:** computeStateHash() called
- **Then:** Returns 64-character hex string (SHA-256)
- **Test Type:** unit

### AC-3: Hash is Deterministic ← R7.2
- **Given:** Two identical GameState objects created separately
- **When:** computeStateHash() called on each
- **Then:** Returns identical hash strings
- **Test Type:** unit

### Edge Cases (REQUIRE TESTS)

#### EC-1: Nested object sorting
- **Scenario:** GameState with nested objects (turnResults with card objects)
- **Expected:** All nested keys sorted recursively
- **Test Type:** unit

#### EC-2: Array ordering preserved
- **Scenario:** GameState with cards in specific order
- **Expected:** Array order affects hash (arrays not sorted, only object keys)
- **Test Type:** unit

---

## Scope

### In Scope
- `canonicalJson(obj: unknown): string` function
- `computeStateHash(state: GameState): string` function
- SHA-256 hashing (use Web Crypto API or similar)

### Out of Scope
- Event hashing (future task if needed)
- State serialization for persistence (separate concern)

---

## Implementation Hints

1. Create `packages/engine-core/src/hash.ts`
2. For SHA-256 in Node/browser, use `crypto.subtle.digest` or a lightweight library
3. Recursive key sorting needed for nested objects
4. Arrays should NOT be sorted (order is meaningful)

```typescript
function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortKeys((obj as Record<string, unknown>)[key]);
        return acc;
      }, {} as Record<string, unknown>);
  }
  return obj;
}
```

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] Code follows project patterns
- [ ] No `any` types
- [ ] Hash matches Python kernel output for same input
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** State hashing enables determinism verification per Invariant I1.
**Decisions:** Use Web Crypto API for SHA-256 to avoid dependencies.
**Questions for Implementer:** Should hash be sync or async? (Async for Web Crypto, but could cache/compute lazily)

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer

### Change Log
> Append-only, chronological

- 2026-01-28 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created, blocked by 001 |
