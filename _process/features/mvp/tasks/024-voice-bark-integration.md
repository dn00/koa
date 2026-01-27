# Task 024: Voice Bark Integration

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Integration
**Complexity:** S
**Depends On:** 011, 023
**Implements:** R6.5, R11.1, R11.3, R11.4

---

## Objective

Integrate voice barks with gameplay: select appropriate bark by OutcomeKey, display text, trigger mood changes, and handle fallbacks. Voice must never block mechanics.

---

## Context

KOA speaks through pre-generated text barks selected by deterministic outcome keys. Barks are cosmetic and must never affect game state or block user input.

### Relevant Files
- `packages/app/src/services/voice.ts` (to create)
- `packages/app/src/components/koa/BarkDisplay.tsx` (to create)

### Embedded Context

**Voice Selection (from D12):**
- OutcomeKey format: `{EVENT_TYPE}:{detail}` (e.g., "COUNTER_PLAYED:security_camera")
- Voice Pack contains barks keyed by OutcomeKey
- Each entry has text and mood
- Fallback tiers for missing keys

**Invariant I3 - LLM Never Adjudicates:**
- Barks are pre-generated
- Voice output never affects game state
- Voice never blocks input

**Invariant I6 - Instant Mechanics:**
- Voice selection is async, non-blocking
- User sees result before voice plays

**Source Docs:**
- `docs/D12-KOA-VOICE-SYSTEM.md` - Voice system
- `docs/D24-VERTICAL-SLICE-DOD-MVP.md` - Voice coverage

---

## Acceptance Criteria

### AC-1: Select Bark by Key <- R11.1
- **Given:** Voice pack loaded
- **When:** selectBark("COUNTER_PLAYED:security_camera") called
- **Then:** Returns matching bark entry
- **Test Type:** unit

### AC-2: Deterministic Selection <- R11.1
- **Given:** Same outcome key
- **When:** selectBark called multiple times
- **Then:** Same bark returned
- **Test Type:** unit

### AC-3: Fallback on Missing <- R11.4
- **Given:** Specific key missing
- **When:** selectBark("COUNTER_PLAYED:rare_counter")
- **Then:** Falls back to "COUNTER_PLAYED:*" or generic tier
- **Test Type:** unit

### AC-4: Never Crash <- R11.4
- **Given:** All fallbacks missing
- **When:** selectBark for unmapped key
- **Then:** Returns default empty bark (no crash)
- **Test Type:** unit

### AC-5: Display Bark Text <- R11.1
- **Given:** Bark selected
- **When:** BarkDisplay renders
- **Then:** Shows bark text
- **Test Type:** unit

### AC-6: Trigger Mood <- R11.2
- **Given:** Bark with mood GRUDGING
- **When:** Bark displayed
- **Then:** KOA avatar mood changes to GRUDGING
- **Test Type:** integration

### AC-7: Non-Blocking <- R11.3
- **Given:** Submit action
- **When:** Resolution completes
- **Then:** UI updates immediately, bark follows
- **Test Type:** integration

### AC-8: Refutation Bark <- R6.5
- **Given:** Player refutes counter
- **When:** REFUTATION_SUCCEEDED event
- **Then:** Grudging acceptance bark displayed
- **Test Type:** integration

### Edge Cases

#### EC-1: Rapid Events
- **Scenario:** Multiple barks triggered quickly
- **Expected:** Show most recent, queue or skip older

#### EC-2: Voice Pack Not Loaded
- **Scenario:** selectBark before pack ready
- **Expected:** Return empty, no crash

### Error Cases

#### ERR-1: Malformed Bark Entry
- **When:** Bark entry missing text field
- **Then:** Skip, use fallback
- **Error Message:** (console warning)

---

## Scope

### In Scope
- `selectBark(outcomeKey: string): BarkEntry | null`
- Fallback tier logic
- BarkDisplay component
- Mood change triggering
- Integration with game events

### Out of Scope
- Audio playback (text only for MVP)
- Voice pack creation (content task)

---

## Implementation Hints

```typescript
interface BarkEntry {
  text: string;
  mood: KOAMood;
}

interface VoicePack {
  barks: Record<string, BarkEntry[]>;
  fallbacks: Record<string, BarkEntry[]>;
}

export function selectBark(
  pack: VoicePack,
  outcomeKey: string,
  seed?: string
): BarkEntry | null {
  // Try exact match
  const exact = pack.barks[outcomeKey];
  if (exact?.length) {
    return pickDeterministic(exact, seed || outcomeKey);
  }

  // Try wildcard fallback (COUNTER_PLAYED:* from COUNTER_PLAYED:xyz)
  const [eventType] = outcomeKey.split(':');
  const wildcard = pack.barks[`${eventType}:*`];
  if (wildcard?.length) {
    return pickDeterministic(wildcard, seed || outcomeKey);
  }

  // Try generic fallbacks
  const generic = pack.fallbacks[eventType];
  if (generic?.length) {
    return pickDeterministic(generic, seed || outcomeKey);
  }

  // Ultimate fallback
  return null;
}

function pickDeterministic(entries: BarkEntry[], seed: string): BarkEntry {
  const hash = simpleHash(seed);
  const index = hash % entries.length;
  return entries[index];
}
```

```tsx
function BarkDisplay({ bark }: { bark: BarkEntry | null }) {
  if (!bark) return null;

  return (
    <div className="bark-display">
      <p className="bark-text">{bark.text}</p>
    </div>
  );
}

// Integration in RunScreen
function RunScreen() {
  const [currentBark, setCurrentBark] = useState<BarkEntry | null>(null);

  // Subscribe to game events
  useEffect(() => {
    const unsubscribe = subscribeToGameEvents(event => {
      const outcomeKey = getOutcomeKey(event);
      const bark = selectBark(voicePack, outcomeKey);
      setCurrentBark(bark);
    });
    return unsubscribe;
  }, [voicePack]);

  return (
    <>
      <KOAAvatar mood={currentBark?.mood ?? 'NEUTRAL'} />
      <BarkDisplay bark={currentBark} />
      {/* ... rest of UI */}
    </>
  );
}
```

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

**Context:** Brings KOA to life with personality.
**Decisions:**
- Text-only for MVP (no audio)
- Deterministic selection for replay consistency
- Never block on voice
**Questions for Implementer:**
- Typewriter effect for bark display?
- Auto-dismiss timer for barks?

### Implementation Notes
> Written by Implementer

**Approach:**
**Decisions:**
**Deviations:**
**Files Changed:**
**Gotchas:**

### Review Notes
> Written by Reviewer

**Verdict:**
**AC Verification:**
| AC | Test | Pass |
|----|------|------|
| AC-1 | | |
| AC-2 | | |
| AC-3 | | |
| AC-4 | | |
| AC-5 | | |
| AC-6 | | |
| AC-7 | | |
| AC-8 | | |
**Issues:**
**Suggestions:**

### Change Log
> Append-only, chronological

- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
