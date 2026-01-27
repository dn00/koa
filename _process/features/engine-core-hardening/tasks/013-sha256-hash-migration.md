# Task 013: SHA-256 Hash Migration

**Status:** ready
**Assignee:** -
**Blocked By:** -
**Phase:** Foundation Hardening
**Complexity:** M
**Depends On:** none
**Implements:** R1.1, R1.2, R1.3, R1.4

---

## Objective

Replace djb2 hash with SHA-256 to match the Python kernel's cryptographic hash chain, enabling tamper-evident replay verification.

---

## Context

The current engine-core uses djb2 (8-char output) for event and state hashing. The Python kernel uses SHA-256 (64-char hex). While djb2 is fine for non-adversarial scenarios, SHA-256 provides:
- Cryptographic collision resistance
- Tamper-evident event chains
- Cross-platform verification compatibility

### Relevant Files
- `packages/engine-core/src/resolver/events.ts` - Current djb2Hash, computeEventHash, computeStateHash
- `docs/source-files/kernel/hash.py` - Python reference implementation

### Embedded Context

**Invariant I1 (Deterministic Resolver):**
- Same inputs MUST produce same outputs
- No floating-point math in game logic (use integers)
- Event replay reconstructs identical state

**Invariant I4 (Event-Sourced Truth):**
- Event log is canonical, state is derived
- Events are append-only, never modified

**Pattern from Python kernel:**
```python
ZERO_HASH = "0" * 64

def canonical_json(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=True)

def compute_hash(data: str | bytes) -> str:
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()
```

---

## Acceptance Criteria

### AC-1: SHA-256 Hash Output Format ← R1.1
- **Given:** Any string input
- **When:** `sha256Hex(input)` is called
- **Then:** Returns 64-character lowercase hex string
- **Test Type:** unit

### AC-2: Canonical JSON Matches Python ← R1.4
- **Given:** Object with nested keys in random order
- **When:** `canonicalJson(obj)` is called
- **Then:** Keys are sorted alphabetically at all levels, no whitespace, ASCII-safe
- **Test Type:** unit

### AC-2b: Canonical JSON Unicode Normalization ← R1.4 (from kernel-hardening §1.1)
- **Given:** String with composed unicode (e.g., "café" with combining acute)
- **When:** `canonicalJson({name: str})` is called
- **Then:** String is NFC normalized before encoding
- **Test Type:** unit

### AC-2c: Canonical JSON Rejects Invalid Values ← R1.4 (from kernel-hardening §1.1)
- **Given:** Object containing NaN, Infinity, or -Infinity
- **When:** `canonicalJson(obj)` is called
- **Then:** Throws Error with message "Cannot serialize NaN/Infinity"
- **Test Type:** unit

### AC-3: GENESIS_HASH is 64 Zeros ← R1.3
- **Given:** GENESIS_HASH constant
- **When:** Examined
- **Then:** Equals `"0".repeat(64)`
- **Test Type:** unit

### AC-4: computeStateHash Uses SHA-256 ← R1.2
- **Given:** Two identical RunState objects
- **When:** `computeStateHash(state1)` and `computeStateHash(state2)` called
- **Then:** Both return identical 64-char hex strings
- **Test Type:** unit

### AC-5: computeEventHash Uses SHA-256 ← R1.1
- **Given:** An event with known content
- **When:** `computeEventHash(event, prevHash)` called
- **Then:** Returns 64-char hex, deterministic for same input
- **Test Type:** unit

### AC-6: Existing Tests Still Pass
- **Given:** All current event system tests
- **When:** Tests run with new hash implementation
- **Then:** All pass (may need hash value updates in fixtures)
- **Test Type:** integration

### Edge Cases

#### EC-1: Empty String Hash
- **Scenario:** Hash empty string
- **Expected:** SHA-256 of empty string: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`

#### EC-2: Unicode Content
- **Scenario:** Hash string with unicode characters
- **Expected:** UTF-8 encoded before hashing, deterministic output

### Error Cases

#### ERR-1: Non-String Input to canonicalJson
- **When:** canonicalJson receives undefined
- **Then:** Throws TypeError
- **Error Message:** Pattern: `Cannot serialize undefined`

---

## Scope

### In Scope
- New `sha256Hex()` function
- New `canonicalJson()` function (replaces sortKeys + JSON.stringify)
- Update `GENESIS_HASH` to 64 zeros
- Update `computeStateHash()` to use SHA-256
- Update `computeEventHash()` to use SHA-256
- Export hash functions for external use

### Out of Scope
- Async hashing (future enhancement)
- Migration of existing stored event logs (not yet persisted)
- Changes to event structure or types

---

## Implementation Hints

**Browser/Node compatibility:**
```typescript
// Works in both Node.js and browsers
async function sha256Async(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Sync version for tests (Node.js only)
import { createHash } from 'crypto';
function sha256Sync(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}
```

**For MVP:** Use sync version since engine-core is pure TypeScript with no DOM dependencies. The Web Crypto API is async which complicates the pure function design.

**Alternative:** Use a pure-JS SHA-256 implementation like `js-sha256` for universal sync support.

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] Code follows project patterns
- [ ] No project doc violations
- [ ] Types are correct (no `any`)
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** Audit revealed djb2 hash (8 chars) differs from Python kernel SHA-256 (64 chars). While functional, SHA-256 provides cryptographic guarantees for tamper-evident event chains.

**Decisions:**
- Keep functions synchronous for pure function design
- Export hash utilities for external verification use
- Maintain backward compatibility in API

**Questions for Implementer:**
- Consider if async Web Crypto API is worth the complexity
- May need to add `js-sha256` dependency for universal sync support

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer

### Change Log
> Append-only, chronological

- 2026-01-26 21:30 [Planner] Task created from audit recommendations

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | ready | Planner | Created, no dependencies |
