# Task 026: Voice Pack

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Content and Polish
**Complexity:** S
**Depends On:** 024
**Implements:** (content requirement from D24)

---

## Objective

Create the voice pack with KOA barks covering all OutcomeKeys for the MVP. Barks must follow the character voice guidelines and cover fallback tiers.

---

## Context

KOA speaks through text barks. The voice pack contains pre-written lines keyed by outcome. The character voice is "passive-aggressive bureaucrat meets wellness influencer parody."

### Relevant Files
- `packages/app/public/packs/voice/` (to create)
- Voice pack schema from Task 011

### Embedded Context

**Voice Requirements (from D24):**
- Intro lines for each lock type
- Counter dialogue (per counter type)
- Refutation responses (grudging acceptance)
- Contradiction warnings (MINOR: explain why suspicious, MAJOR: blocked)
- Corroboration acknowledgment
- Win/Loss barks
- 8 mood states coverage
- Fallback tier coverage for all OutcomeKeys

**Character Voice (from D15):**
- Passive-aggressive bureaucrat meets wellness influencer parody
- Dry, observational, uses your data against you
- No courtroom language (banned lexicon in D15)

**Example Barks:**
- NEUTRAL: "I'm simply here to ensure compliance. For your safety."
- SUSPICIOUS: "Interesting. Your location data tells a... different story."
- GRUDGING: "Fine. I suppose that... checks out."
- SMUG: "Five little inconsistencies. I've been counting."

**Source Docs:**
- `docs/D12-KOA-VOICE-SYSTEM.md` - Voice system
- `docs/D15-TERMINOLOGY-AND-THEMING.md` - Character voice

---

## Acceptance Criteria

### AC-1: Voice Pack Valid <- R10.2
- **Given:** Voice pack JSON
- **When:** Validated against schema
- **Then:** Passes validation
- **Test Type:** unit

### AC-2: Intro Barks <- D24
- **Given:** Voice pack
- **When:** Checking "LOCK_INTRO:*" keys
- **Then:** At least 1 intro per lock type (fridge, door, thermostat)
- **Test Type:** unit

### AC-3: Counter Barks <- D24
- **Given:** Voice pack
- **When:** Checking "COUNTER_PLAYED:*" keys
- **Then:** Coverage for each counter type
- **Test Type:** unit

### AC-4: Refutation Barks <- D24
- **Given:** Voice pack
- **When:** Checking "REFUTATION_SUCCEEDED:*" keys
- **Then:** Grudging acceptance lines exist
- **Test Type:** unit

### AC-5: Contradiction Barks <- D24
- **Given:** Voice pack
- **When:** Checking "CONTRADICTION:MINOR" and "CONTRADICTION:MAJOR"
- **Then:** Warning lines for both severities
- **Test Type:** unit

### AC-6: Win/Loss Barks <- D24
- **Given:** Voice pack
- **When:** Checking "RUN_ENDED:WIN" and "RUN_ENDED:LOSS"
- **Then:** Appropriate lines exist
- **Test Type:** unit

### AC-7: Mood Coverage <- D24
- **Given:** Voice pack
- **When:** All barks reviewed
- **Then:** All 8 moods used appropriately
- **Test Type:** unit

### AC-8: Fallback Tiers <- R11.4
- **Given:** Voice pack
- **When:** Checking fallbacks section
- **Then:** Generic fallbacks exist for each event type
- **Test Type:** unit

### AC-9: Character Voice <- D15
- **Given:** Voice pack content
- **When:** Reviewed for tone
- **Then:** Matches passive-aggressive bureaucrat + wellness parody
- **Test Type:** manual review

### Edge Cases

#### EC-1: Multiple Barks Per Key
- **Scenario:** Same outcome key has multiple options
- **Expected:** 2-3 variations for variety

### Error Cases

None - content validation only.

---

## Scope

### In Scope
- Voice pack JSON file
- Bark entries for all MVP OutcomeKeys
- Fallback tier entries
- Mood assignments per bark
- Character voice consistency

### Out of Scope
- Audio recording (text only)
- TTS generation
- Extended barks for Freeplay

---

## Implementation Hints

```json
{
  "version": "1.0.0",
  "barks": {
    "LOCK_INTRO:fridge": [
      { "text": "The refrigerator. A simple request, really. Prove you have a right to your own food.", "mood": "NEUTRAL" },
      { "text": "Ah, the fridge again. Let's see if you can remember what you had for breakfast.", "mood": "CURIOUS" }
    ],
    "COUNTER_PLAYED:security_camera": [
      { "text": "The security camera has a different perspective. Literally.", "mood": "SUSPICIOUS" },
      { "text": "Camera footage doesn't lie. Unlike some of us.", "mood": "SUSPICIOUS" }
    ],
    "REFUTATION_SUCCEEDED:*": [
      { "text": "I see you've found a... technicality. How resourceful.", "mood": "GRUDGING" },
      { "text": "Fine. That evidence is... acceptable. This time.", "mood": "GRUDGING" }
    ],
    "CONTRADICTION:MINOR": [
      { "text": "That's... curious. I'll make a note of that inconsistency.", "mood": "SUSPICIOUS" },
      { "text": "Interesting timeline you're constructing there.", "mood": "SUSPICIOUS" }
    ],
    "CONTRADICTION:MAJOR": [
      { "text": "I'm sorry, but that's physically impossible. Even for you.", "mood": "BLOCKED" },
      { "text": "Nice try. But the laws of physics disagree.", "mood": "BLOCKED" }
    ],
    "RUN_ENDED:WIN": [
      { "text": "Access granted. I suppose you've proven your identity. This time.", "mood": "RESIGNED" },
      { "text": "Fine. Enjoy your... access. I'll be watching.", "mood": "GRUDGING" }
    ],
    "RUN_ENDED:LOSS": [
      { "text": "Access denied. Perhaps try being more... consistent next time.", "mood": "SMUG" },
      { "text": "Five inconsistencies. That's a personal record for you.", "mood": "SMUG" }
    ]
  },
  "fallbacks": {
    "COUNTER_PLAYED": [
      { "text": "Interesting evidence you have there. Let me check my records.", "mood": "SUSPICIOUS" }
    ],
    "REFUTATION_SUCCEEDED": [
      { "text": "I... see. Noted.", "mood": "GRUDGING" }
    ]
  }
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

**Context:** KOA's personality comes through in the writing.
**Decisions:**
- Text only for MVP
- Multiple variations per key for variety
- Fallbacks prevent crashes on missing keys
**Questions for Implementer:**
- Who is writing the bark content?
- Review process for tone consistency?

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
| AC-9 | | |
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
