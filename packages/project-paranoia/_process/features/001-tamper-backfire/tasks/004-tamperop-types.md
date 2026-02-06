# Task 004: TamperOp + ActiveDoubt + Ledger Types

**Status:** ready
**Complexity:** S
**Depends On:** none
**Implements:** R2.1, R2.2, R6.1, R6.2, R7.1, R7.2

---

## Objective

Define TamperOp, ActiveDoubt, and SuspicionLedgerEntry types in types.ts. Add corresponding arrays to PerceptionState. Initialize in state.ts.

---

## Context

### Relevant Files
- `src/kernel/types.ts` — add new types and PerceptionState fields
- `src/kernel/state.ts` — initialize new arrays

### Embedded Context

**Types to add (from TAMPER_BACKFIRE_DESIGN.md):**

```typescript
type TamperOpKind = 'SUPPRESS' | 'SPOOF' | 'FABRICATE';
type TamperOpStatus = 'PENDING' | 'RESOLVED' | 'BACKFIRED' | 'CONFESSED';

interface TamperOp {
  id: string;
  kind: TamperOpKind;
  tick: number;
  target: {
    system?: string;        // for SUPPRESS/SPOOF
    npc?: NPCId;            // for FABRICATE
    place?: PlaceId;        // where the tamper relates to
  };
  windowEndTick: number;    // after this, op can backfire
  status: TamperOpStatus;
  backfireTick?: number;
  confessedTick?: number;
  severity: 1 | 2 | 3;
  crewAffected: NPCId[];
  relatedArcId?: string;
}

interface ActiveDoubt {
  id: string;
  topic: string;
  createdTick: number;
  severity: 1 | 2 | 3;
  involvedCrew: NPCId[];
  relatedOpId?: string;
  system?: string;
  resolved: boolean;
}

interface SuspicionLedgerEntry {
  tick: number;
  delta: number;
  reason: string;
  detail: string;
}
```

**PerceptionState additions:**
```typescript
interface PerceptionState {
  // ... existing fields ...
  tamperOps: TamperOp[];
  activeDoubts: ActiveDoubt[];
  suspicionLedger: SuspicionLedgerEntry[];
}
```

**Key invariant:** I1 (no stat without purpose) — these types will be read by backfire checking, VERIFY, and STATUS display. I11 (no external state) — fully serializable.

---

## Acceptance Criteria

### AC-1: TamperOp type defined ← R2.1
- **Given:** types.ts
- **When:** Type added
- **Then:** TamperOp interface exported with all fields from design doc

### AC-2: PerceptionState extended ← R2.2, R6.2, R7.2
- **Given:** PerceptionState interface
- **When:** Fields added
- **Then:** tamperOps, activeDoubts, suspicionLedger arrays present

### AC-3: State initialization ← R2.2
- **Given:** createInitialState in state.ts
- **When:** New state created
- **Then:** tamperOps=[], activeDoubts=[], suspicionLedger=[] initialized

### AC-4: Types exported
- **Given:** types.ts
- **When:** Types added
- **Then:** TamperOp, TamperOpKind, TamperOpStatus, ActiveDoubt, SuspicionLedgerEntry all exported

---

## Edge Cases

### EC-1: Save/load compatibility
- **Scenario:** Existing save file loaded that doesn't have new fields
- **Expected:** State initialization should handle missing fields gracefully (default to [])

---

## Scope

**In Scope:**
- Type definitions in types.ts
- PerceptionState field additions
- State initialization in state.ts

**Out of Scope:**
- Creating TamperOps (task 005)
- Using TamperOps (tasks 006-008)
- Suspicion ledger wiring (task 009)

---

## Log

### Planning Notes
**Context:** Foundation types that enable all subsequent tasks. No logic, just type definitions and initialization.
