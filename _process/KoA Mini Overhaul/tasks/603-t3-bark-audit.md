# Task 603: Audit T3 Barks for Closing-Energy

**Status:** backlog
**Complexity:** S
**Depends On:** none
**Implements:** R6.5

---

## Objective

Audit and update T3 (storyCompletions) barks to ensure they are "closing-energy" only — no axis commentary, no evaluation. The Final Audit panel does evaluation.

---

## Context

### Relevant Files
- `packages/engine-core/src/packs/generated-puzzle.ts` — thermostat puzzle storyCompletions
- Any other puzzle files with storyCompletions barks

### Embedded Context

**Safe T3 bark styles:**
```typescript
// Good: Closing energy, signals commitment
"That's your story. Let me check the house."
"Alright. Committed. Give me a second."
"Three pieces. Let's see what they add up to."
"Story complete. Running verification."
"Your version of events. Processing."
```

**Forbidden T3 bark styles:**
```typescript
// Bad: Leaks concern outcome
"Finally a human witness"  // ❌ reveals diversification
"Still all automation"     // ❌ evaluates before audit
"That breaks the pattern"  // ❌ reveals diversification

// Bad: Evaluates story quality
"Strong mix of sources"    // ❌ evaluates independence
"All from one place"       // ❌ evaluates correlation
"You covered everything"   // ❌ evaluates coverage
```

**Current thermostat storyCompletions (to audit):**
```typescript
storyCompletions: {
  // All same type (3 of 3)
  all_digital: ["Three digital sources. Your alibi is server-side. No humans involved."],
  all_sensor: ["All sensor data. The house has opinions. Whether they're accurate is another question."],
  all_testimony: ["All humans vouching. No devices. Bold strategy in a smart home."],
  // Two of one type (2 of 3)
  digital_heavy: ["Two digital sources. Your alibi is mostly bits and bytes."],
  sensor_heavy: ["Two sensors out of three. You trust your devices. They might not trust you back."],
  testimony_heavy: ["Two humans, one device. You prefer witnesses to data. Noted."],
  // All different types
  mixed_strong: ["Varied sources. Harder to dismiss when they don't all come from the same place."],
  mixed_varied: ["Different angles. We'll see if they actually agree."],
}
```

**Verdict:** Most of these evaluate! They need to become closing-energy only.

---

## Acceptance Criteria

### AC-1: No axis commentary in T3 barks ← R6.5
- **Given:** All storyCompletions barks
- **When:** Reading content
- **Then:** No bark mentions "sources", "digital", "sensor", "human", "varied", "same"

### AC-2: No evaluation in T3 barks ← R6.5
- **Given:** All storyCompletions barks
- **When:** Reading content
- **Then:** No bark judges the story quality (good/bad/strong/weak)

### AC-3: All barks are closing-energy ← R6.5
- **Given:** All storyCompletions barks
- **When:** Reading content
- **Then:** All barks signal commitment and transition to processing

---

## Edge Cases

### EC-1: storyCompletions pattern still matters
- **Scenario:** Game still computes pattern for bark selection
- **Expected:** Pattern can vary which closing bark is shown, but all are closing-energy

### EC-2: Minimal variety needed
- **Scenario:** All barks become identical
- **Expected:** Keep 3-4 variations for freshness

---

## Error Cases

### ERR-1: Evaluative bark slips through
- **When:** Bark contains axis commentary
- **Then:** Caught in code review
- **Error Message:** N/A (manual audit)

---

## Scope

**In Scope:**
- Audit all storyCompletions barks
- Rewrite to closing-energy only
- Keep variety (3-4 options)

**Out of Scope:**
- T1/T2 barks (those can have personality)
- Final Audit panel (that does evaluation)
- New puzzle creation

---

## Implementation Hints

1. Read all storyCompletions in generated-puzzle.ts
2. Replace each with closing-energy alternatives
3. **Per spec §6.1:** T3 barks should be a small fixed set (5-10) selected randomly or by pattern, NOT generated per-puzzle or per-concernKey
4. Test by reading each bark aloud — does it evaluate?

**DECISION: Keep pattern keys, but all barks are closing-energy**

We keep the pattern-based structure (`all_digital`, `sensor_heavy`, `mixed_strong`, etc.) because:
- The pattern selection logic already exists in `game.ts:getStoryPattern()`
- Variety is good for freshness
- The key constraint is: **all barks must be closing-energy regardless of which pattern key selects them**

The pattern key is used for variety selection only — it does NOT affect bark content semantics. Every bark says "story complete, processing" — just with slight wording variety.

**Spec reference (§6.1 T3 bark rule):**
- Must NOT reference any axis concept
- Must NOT be conditional on concernKey or concernResult
- Must NOT evaluate or hint at diversification
- Must be generic — same bark works regardless of axis outcomes

**Suggested replacement — simple fixed set:**
```typescript
// Instead of pattern-based keys, use a single array of closing barks
storyCompletions: [
  "That's your story. Let me check the house.",
  "Alright. Committed. Give me a second.",
  "Three pieces. Let's see what they add up to.",
  "Okay. That's what you're going with. Processing.",
  "Story complete. One moment.",
  "Got it. Running verification.",
]
```

This prevents accidental leakage and simplifies the bark system.

---

## Log

### Planning Notes
**Context:** T3 barks were accidentally evaluative
**Decisions:** Replace with neutral closing-energy barks
