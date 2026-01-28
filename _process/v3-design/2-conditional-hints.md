# Design Decision: Conditional Reactive Hints + Non-Partitioning Opening Hints

**Date:** 2026-01-27
**Triggered by:** Playtest 2 findings

---

## Playtest 2 Findings

Five agents played all three puzzles. Key observations:

1. **Safe-play is dominant.** All 5 agents converged on "safe T1, read hint, avoid lies." No agent ever benefited from probing — playing a low-strength card outside the hint group costs almost nothing and still yields a reactive hint that often identifies the stealth lie.

2. **Hints are too informative for free.** A safe T1 play (card NOT in hint group) gives a reactive hint just as specific as a risky T1 play (card IN hint group). There's no information cost to playing safe.

3. **Principle 3 (counter-intuitive optimal) is failing.** The optimal move is always obvious: play safe, read hint, avoid lies. No puzzle rewards probing.

4. **Principle 4 (helpful AND dangerous info) is half-failing.** Hints are only helpful, never misleading or costly. There's no tradeoff.

5. **S2 (difficulty curve) still failing.** P3 is easiest despite highest target because its reactive hints are too specific.

6. **S1 (loss rate) at floor.** 20% loss rate across all agents, barely passing the minimum threshold.

## The Fix

### A. Conditional Reactive Hint Quality

Tie reactive hint specificity to T1 risk:

- **Risky T1** (card IS in hint group): get a **specific** reactive hint (`quality: 'specific'`) that narrows or identifies the stealth lie. `implicates` contains card IDs.
- **Safe T1** (card is NOT in hint group): get a **vague** reactive hint (`quality: 'vague'`) that provides atmosphere/mood but doesn't identify specific cards. `implicates` is empty `[]`.

This creates the probe-vs-protect dilemma:
- Safe T1 = safe score but blind for T2/T3 (must guess which cards are lies)
- Risky T1 = might lose points (if you accidentally play the hint-group lie) but get actionable intelligence for T2/T3

Lie plays always get specific hints regardless of group — the point penalty is already paid.

### B. Non-Partitioning Opening Hints

Replace attribute-partitioning hints with behavioral/qualitative hints for medium and hard puzzles:

- **P1 (easy):** Keep "after 11 PM" — attribute hints are appropriate for day-1 players
- **P2 (medium):** Changed from "sensor in the living room" to "trying too hard to explain why nothing happened" — requires reading each card's claim, not just checking location
- **P3 (hard):** Keep "protests too much" — already behavioral

The old P2 hint cleanly split cards by location+source, allowing immediate elimination of half the pool. The new hint requires scenario-level reasoning.

## Principles Mapping

| Principle | Before Fix | After Fix |
|-----------|-----------|----------|
| **P3: Counter-intuitive optimal** | Safe play always optimal | Probing gives better info; safe play leaves you guessing |
| **P4: Helpful AND dangerous** | Hints always helpful | Vague hints are atmospheric only; specific hints require risk |
| **S1: Loss rate** | 20% (floor) | Expected increase — safe play no longer guarantees enough info to avoid lies |
| **S2: Difficulty curve** | P3 easiest despite highest target | Vague hints on safe T1 make harder puzzles genuinely harder |

## Implementation

### Types
Added `quality: 'specific' | 'vague'` to `ReactiveHint` interface.

### Puzzles
- P1: doorbell, thermostat → vague (safe T1); fitbit, motion_base → specific (risky T1)
- P2: phone, doorbell → vague; light_lr, temp_lr → specific; opening hint rewritten
- P3: fitbit, thermostat → vague; smart_lock, motion_hall → specific

### Validator
- I18 updated: vague hints exempt from implication requirements
- I23: Hint quality must match card group (hint-group = specific, non-hint = vague, lies exempt)
- I24: Vague hints must have empty `implicates`
- I25: Specific non-lie hints must implicate >= 1 card
- New cross-puzzle metric: probe win rate vs safe win rate gap

## Expected Impact

- Safe-play win rate should decrease (vague hints provide no narrowing)
- Probe-play win rate should remain high (specific hints still identify lies)
- The gap between probe and safe win rates represents the information value of probing
- Overall loss rate should increase from 20% toward 30-40%
- P3 should become harder than P1 (difficulty curve restored)
