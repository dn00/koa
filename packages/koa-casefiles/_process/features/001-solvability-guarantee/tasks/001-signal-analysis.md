# Task 001: Signal Analysis Function

**Status:** ready
**Complexity:** M
**Depends On:** none
**Implements:** R1.1, R1.2, R1.3, R1.4, R1.5

---

## Objective

Add `analyzeSignal()` function to validators.ts that detects whether the culprit has a catchable contradiction, returning signal type and strength.

---

## Context

### Relevant Files
- `src/validators.ts` - Add new function here (alongside existing `findContradictions()`)
- `src/types.ts` - Add new types here

### Embedded Context

**Types to add to `src/types.ts`:**

```typescript
// Signal Analysis Types (add near Contradiction interface)

export type SignalType =
    | 'self_contradiction'    // Culprit claims X, culprit claims Y (incompatible)
    | 'device_contradiction'  // Culprit claims X, device log shows Y
    | 'scene_presence'        // Device log places culprit at crime scene during crime window
    | 'opportunity_only';     // No catchable signal - only motive/opportunity

export type SignalStrength = 'strong' | 'medium' | 'weak';

export interface SignalAnalysis {
    hasSignal: boolean;
    signalType: SignalType;
    signalStrength: SignalStrength;
    keystonePair?: {
        evidenceA: string;  // EvidenceId
        evidenceB: string;  // EvidenceId
    };
    details?: string;  // Human-readable explanation
}
```

**Function signature for `src/validators.ts`:**

```typescript
/**
 * Analyze whether the culprit has a catchable signal (contradiction they're party to).
 *
 * Signal hierarchy (strongest to weakest):
 * 1. self_contradiction - Culprit's testimony contradicts their own testimony
 * 2. device_contradiction - Culprit's testimony contradicts device log
 * 3. scene_presence - Device log places culprit at crime scene
 * 4. opportunity_only - No catchable signal (INVALID - case needs injection)
 */
export function analyzeSignal(
    evidence: EvidenceItem[],
    config: CaseConfig
): SignalAnalysis
```

**Key invariant (from INVARIANTS.md INV-1.1):**
> Every culprit must have at least ONE of:
> - Self-contradiction (false alibi about location)
> - Crime scene lie (testimony contradicts device log at scene)
> - Device log placing them at scene during crime window
> Signature motive alone is NOT sufficient for solvability.

**Existing patterns to follow:**

```typescript
// From findContradictions() - how to find culprit's presence evidence
const presenceEvidence = evidence.filter(
    e => e.kind === 'presence'
) as PresenceEvidence[];

// Culprit's claimed locations
const culpritPresence = presenceEvidence.filter(
    p => p.npc === config.culpritId
);

// From findKeystonePair() - how to check if evidence implicates culprit
const implicatesCulprit = implicated.includes(config.culpritId) ? 10 : 0;
```

### Source Docs
- `_process/features/001-solvability-guarantee/discovery.md` - Section "Signal Detection Algorithm"

---

## Acceptance Criteria

### AC-1: Self-contradiction detection ← R1.2
- **Given:** Evidence where culprit claims bedroom in W3, but also claims kitchen in W3
- **When:** `analyzeSignal(evidence, config)` is called
- **Then:** Returns `{ hasSignal: true, signalType: 'self_contradiction', signalStrength: 'strong' }`

### AC-2: Device contradiction detection ← R1.3
- **Given:** Evidence where culprit claims bedroom in W3, but door_sensor shows culprit opened kitchen door in W3
- **When:** `analyzeSignal(evidence, config)` is called
- **Then:** Returns `{ hasSignal: true, signalType: 'device_contradiction', signalStrength: 'strong' }`

### AC-3: Scene presence detection ← R1.4
- **Given:** Evidence with device log placing culprit at crime scene during crime window, no testimony contradiction
- **When:** `analyzeSignal(evidence, config)` is called
- **Then:** Returns `{ hasSignal: true, signalType: 'scene_presence', signalStrength: 'medium' }`

### AC-4: Opportunity-only detection ← R1.5
- **Given:** Evidence with only motive pointing to culprit, no location evidence involving culprit
- **When:** `analyzeSignal(evidence, config)` is called
- **Then:** Returns `{ hasSignal: false, signalType: 'opportunity_only', signalStrength: 'weak' }`

### AC-5: Returns keystone pair when signal found ← R1.1
- **Given:** Evidence with culprit self-contradiction
- **When:** `analyzeSignal(evidence, config)` is called
- **Then:** Returns keystonePair with both evidence IDs

---

## Edge Cases

### EC-1: Multiple signal types present
- **Scenario:** Culprit has both self-contradiction AND device contradiction
- **Expected:** Returns strongest signal type (`self_contradiction`)

### EC-2: Signal in non-crime window
- **Scenario:** Culprit lies about W2 (not crime window W3)
- **Expected:** Still counts as valid signal (contradiction is catchable)

### EC-3: Innocent with more contradictions than culprit
- **Scenario:** Red herring has 3 contradictions, culprit has 1
- **Expected:** Still returns `hasSignal: true` for culprit's signal

---

## Error Cases

### ERR-1: Missing culprit in evidence
- **When:** No presence/testimony evidence for culpritId
- **Then:** Returns `{ hasSignal: false, signalType: 'opportunity_only', signalStrength: 'weak', details: 'No culprit evidence found' }`

### ERR-2: Invalid config (no culpritId)
- **When:** `config.culpritId` is undefined
- **Then:** Throws `Error('analyzeSignal requires config.culpritId')`

---

## Scope

**In Scope:**
- Add `SignalAnalysis`, `SignalType`, `SignalStrength` types to types.ts
- Add `analyzeSignal()` function to validators.ts
- Unit tests for the function

**Out of Scope:**
- Integration with simulation pipeline (Task 003)
- Signal injection (Task 002)
- Solver modifications (Task 004)

---

## Implementation Hints

1. Start by filtering evidence to get:
   - Culprit's presence claims (`kind: 'presence', npc: culpritId`)
   - Culprit's testimony (`kind: 'testimony', witness: culpritId`)
   - Device logs at crime scene (`kind: 'device_log', place: crimePlace`)

2. Check for self-contradiction first (strongest signal):
   - Group culprit presence by window
   - If same window has 2+ different places → self-contradiction

3. Check for device contradiction second:
   - Compare culprit presence claims against device logs
   - If culprit claims place X but device shows them at Y → device_contradiction

4. Check for scene presence third:
   - Look for device logs with culprit's ID at crime scene during crime window
   - Note: anti-anticlimax rules may have removed actor ID, so check via door patterns

5. Leverage existing `findContradictions()` to find the contradiction, then check if culprit is party to it.

---

## Log

### Planning Notes
**Context:** The 2% unsolvable cases happen because culprit has no catchable contradiction. This function detects that condition so we can fix it.
**Decisions:** Signal hierarchy follows game design - self-contradiction is most satisfying "aha" moment, scene_presence is weakest but still valid.

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer
