# D31 — Design Search Invariants

**Purpose:** Constraints for our design search. These are the non-negotiables we're optimizing against. Design decisions (like "no draft") are in D31 itself.

---

## What We're Building

| Requirement | Description |
|-------------|-------------|
| Daily puzzle game | Same puzzle for everyone each day |
| 2-10 minute sessions | 2-5 min for experienced, up to 10 min for novices |
| Mobile-first | Primary platform |
| Offline-capable | Core gameplay works without network |

---

## Fun Requirements (Must Achieve)

| Requirement | Test |
|-------------|------|
| Skill expression | Better players get better scores |
| "Aha" moments | Player discovers something during play |
| Satisfying wins | Victory feels earned |
| Forgiving losses | Player understands why they lost |
| Replayability | Day 30 is still engaging |
| Multiple paths to win | At least 2 valid solutions per puzzle |

---

## Fairness Requirements (Must Achieve)

| Requirement | Test |
|-------------|------|
| Always winnable | Every puzzle has at least one solution |
| No hidden gotchas | All critical info visible upfront |
| Mistakes recoverable | One error doesn't end the game |
| Failure is learnable | Player can see what they did wrong |

---

## Anti-Goals (Must Avoid)

| Anti-Goal | Why |
|-----------|-----|
| Ripoff of existing game | Must feel original |
| Pure luck | Skill must matter |
| Overwhelming complexity | Casual players can engage |
| Punishing difficulty | Frustration kills retention |
| Solved-at-glance | Must have actual puzzle depth |

---

## Quality Bar

| Metric | Target |
|--------|--------|
| Design confidence | 9.5/10+ |
| Time to first play | <10 seconds |
| Cognitive load | Low-medium |
| Decision depth | Medium-high |

---

## Open Design Space

These are NOT locked — they can change if it improves confidence:

- Number of cards in hand
- Draft vs no-draft
- Number of concerns
- Contradiction severity levels
- Turn count
- Resistance values
- Counter mechanics
- Any specific mechanic

**The only things locked are the requirements above.** Everything else is searchable.
