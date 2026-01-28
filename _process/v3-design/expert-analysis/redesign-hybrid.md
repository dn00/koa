# Home Smart Home — Hybrid Evolution Proposal

**Codename:** The Evolution
**Date:** 2026-01-27
**Status:** Proposal — not selected for V3 (retained for reference)

---

## 1. One-Paragraph Pitch

Rather than replacing the card-presentation mechanic, evolve it by cutting 5 of the 9+ systems that don't create meaningful trade-offs and adding 2 new mechanics that do. Keep cards with power/tag/risk, tag opposition, concerns, badge tiers, scrutiny limits, the 3-turn structure, and 6-card hands. Cut corroboration bonuses, source diversity, repetition penalties, counter/refutation, and graduated contradictions. Add **KOA's Pressure** (after each turn, KOA names a tag — next turn, cards with that tag cost +1 scrutiny) and **Burn** (discard 1 card per turn before playing). The result is 5 interacting systems instead of 9+ independent ones, where every system creates a genuine trade-off.

---

## 2. Rules in 3 Sentences

1. You have 6 evidence cards (each with power, tag, and risk); play 1-2 cards per turn for 3 turns to convince KOA you're innocent, but tag contradictions block plays and scrutiny is limited.
2. After each turn, KOA announces a **pressure tag** — next turn, cards with that tag cost +1 scrutiny, so your plays determine KOA's response and constrain your future options.
3. Before playing each turn, you may **burn** 1 card from your hand (discard permanently) to avoid its tag triggering pressure or contradictions later.

---

## 3. Detailed Mechanics

### 3.1 What's Kept from V2.5

| System | Role | Why Keep |
|--------|------|----------|
| **Cards** (power, tag, risk) | Core input — what you play | Fundamental to the game identity |
| **Tag opposition** (HOME/AWAY, etc.) | Contradiction constraint | Creates the "you can't have both" decision |
| **Concerns** | Proof-type gates | Provides thematic structure ("prove you were home") |
| **Badge tiers** | Outcome gradient | FLAWLESS / THOROUGH / CLEAN / WIN |
| **Scrutiny limit** | Resource budget | Forces efficiency, not just power |
| **3-turn structure** | Session pacing | Right length for daily puzzle |
| **6-card hand** | Decision space | Enough for choices, small enough to evaluate |

### 3.2 What's Cut

| System | Why Cut |
|--------|---------|
| **Corroboration bonuses** | Doesn't create trade-offs — always good to corroborate, no reason not to |
| **Source diversity** | Parallel check that doesn't interact with other systems |
| **Repetition penalties** | Binary avoid-or-eat — no strategic decision |
| **Counter/refutation** | Predictable and solvable — KOA picks first applicable counter |
| **Graduated contradictions** | Over-complex for the decision it creates (MINOR vs MAJOR) |

### 3.3 New Mechanic: KOA's Pressure

After each turn, KOA names a **pressure tag** (visible UI element). Next turn, all cards with that tag cost **+1 scrutiny** to play.

How the pressure tag is chosen:
- Deterministic based on what you played (not random)
- If you played a HOME card, KOA pressures a related tag (e.g., AWAY or ALONE)
- The mapping is fixed per puzzle but hidden — experienced players learn to predict it

**Why this works:**
- Makes KOA's dialogue **mechanically relevant** without requiring reading — the pressure tag is a clear UI element
- Creates a **reactive adversary** — KOA responds to your plays
- Experienced players can **predict and manipulate** pressure (depth)
- But predicting requires knowledge of the mapping (learning curve)
- Forces the question: "Is this card worth playing if it triggers pressure on my T3 options?"

### 3.4 New Mechanic: Burn

Before playing cards each turn, you may **discard 1 card** from your hand. Discarded cards are gone permanently — they don't contribute power, but they also can't trigger contradictions or add to pressure calculations.

**Why this works:**
- Creates a **third action type** beyond play/hold: deliberate sacrifice
- Sometimes the right move is to throw away a strong card to avoid its tag triggering pressure or contradictions
- Gives the player an escape valve for bad hands without making the game trivially easy
- **Constraint as engine**: you have 6 cards, 3 turns, can play 1-2 per turn (max 6 plays) — burning means you voluntarily reduce your arsenal

### 3.5 System Interaction

The 5 remaining systems form a web of trade-offs:

```
    Cards (power/tag)
       /     |     \
      /      |      \
  Scrutiny  Tags   Concerns
     |       |       |
     +---Pressure---+
            |
          Burn
```

- **Cards × Scrutiny**: High-power cards have high risk (scrutiny cost). Budget forces choices.
- **Cards × Tags**: Tag opposition blocks plays. You can't just play your strongest cards.
- **Cards × Concerns**: Each concern requires specific proof types. Not every card addresses the right concern.
- **Pressure × Scrutiny**: Pressure raises scrutiny cost of tagged cards next turn. Your T1 plays make T2 more expensive.
- **Pressure × Tags**: Pressure targets specific tags, so your tag choices have forward consequences.
- **Burn × All**: Burning removes a card from all future calculations — no power, no tag conflicts, no pressure triggers. But you lose the power forever.

Every system's output feeds into another system's input. Unlike V2.5 where systems are parallel checks, these systems are **multiplicative**.

---

## 4. Example Turn Sequence

### Setup

Puzzle has 6 cards. KOA has 3 concerns. Scrutiny limit: 6.

**Turn 1:** You play cards A (HOME, power 4, risk 1) and B (HOME, power 3, risk 1). Total scrutiny: 2. Concerns partially addressed.

KOA announces: **Pressure tag: AWAY**. Next turn, AWAY cards cost +1 scrutiny.

**Turn 2 Decision:** Card C (AWAY, power 5, risk 2) would now cost 3 scrutiny instead of 2. Card D (ASLEEP, power 3, risk 1) is unaffected. Do you:
- Play C anyway (expensive but powerful)?
- Play D (cheaper but weaker)?
- **Burn** C to remove it from the equation, then play D?

If you burn C and play D: lower scrutiny, but you've lost your strongest card. If KOA's T2 pressure targets ASLEEP, your T3 options narrow further.

**Turn 3:** Remaining cards are constrained by: what you played, what you burned, what's under pressure, and whether the remaining cards can address the final concern without blowing your scrutiny budget.

---

## 5. Principles Mapping

| Principle | How Met |
|-----------|---------|
| **1. Transparent space, opaque solution** | All cards visible. Pressure tag visible. But the optimal sequence considering pressure cascades is non-obvious. |
| **2. Irreversible + information** | Each play reveals KOA's pressure response. Burns are permanent. Both produce information about the pressure mapping. |
| **3. Counter-intuitive optimal** | Sometimes burning your best card is correct. Sometimes triggering pressure deliberately is optimal (to steer KOA away from a worse pressure target). |
| **4. Partial info helpful AND dangerous** | Pressure tag tells you what KOA is watching — but following it might be a trap if KOA's pressure mapping is designed to funnel you into a corner. |
| **5. Depth without punishing breadth** | Casual players ignore pressure and burn, play strongest cards. Still winnable. Experts manipulate pressure chains and burn strategically. |
| **6. Shareable artifact** | Turn sequence + burns + pressure tags = a compact narrative of strategic choices. |
| **7. Constraint is the engine** | Pressure makes the game tighter each turn. Burn gives you an escape at a cost. Both are constraints that focus creativity. |

---

## 6. Skill Gradient

| Stage | Behavior | Notes |
|-------|----------|-------|
| **Day 1** | Play strongest cards, ignore pressure, never burn | Wins easy puzzles on raw power |
| **Day 10** | Notices pressure costs, avoids pressured tags, starts burning trap cards | First strategic burns |
| **Day 20** | Predicts pressure tags based on play patterns, sequences plays to minimize future pressure | Proactive pressure management |
| **Day 30** | Deliberately triggers specific pressure to steer KOA away from critical T3 tags, uses burn as a precision tool | Pressure manipulation |

---

## 7. Anti-Skeleton Argument

V2.5 skeleton: "refute T1 → corroborate → manage penalties." This works because every system is independent.

The hybrid evolution breaks this because:

1. **Pressure creates path-dependency.** Your T1 play determines T2 costs, which determines T3 options. Different T1 plays lead to different pressure chains. No fixed T1 strategy works across all puzzles.

2. **Burn creates a third action.** The skeleton assumes play-or-hold. Burn adds deliberate sacrifice. The optimal number of burns (0, 1, 2, or 3) varies per puzzle based on the pressure mapping and card composition.

3. **Pressure mapping varies per puzzle.** Each puzzle defines which tags trigger which pressure responses. A strategy that works on Monday (where HOME→AWAY pressure mapping is used) fails on Wednesday (where HOME→ASLEEP mapping is used).

4. **Concerns still gate outcomes.** You can't just dodge pressure — you must also address KOA's specific proof-type requirements. The interaction between "which tags are pressured" and "which proof types are needed" creates puzzle-specific constraints.

---

## 8. Cognitive Load Analysis

### Systems Tracked

| # | System | Visible? | Complexity |
|---|--------|----------|------------|
| 1 | Card power/tag/risk | Yes | Read numbers and tags |
| 2 | Tag opposition | Yes | ~5 rules (memorizable) |
| 3 | Scrutiny budget | Yes | Running subtraction |
| 4 | Concerns | Yes | 2-3 proof-type gates |
| 5 | Pressure tag | Yes | 1 tag shown after each turn |

**Total: 5 systems, all visible.** Estimated working memory: 4-5 chunks.

### Comparison

| V2.5 | Hybrid |
|------|--------|
| 9+ systems | 5 systems |
| Many hidden interactions | All interactions visible |
| Systems don't feed into each other | Every system affects at least one other |
| One algorithm fits all | Path-dependent decisions |

---

## 9. What's Lost

| Lost | Impact |
|------|--------|
| Corroboration combos | No "matching bonus" satisfaction — but this was never a real decision (always corroborate if you can) |
| Counter/refutation | KOA no longer has specific "attacks" to counter — biggest gameplay loss. Pressure partially replaces this. |
| Source diversity | No "use different devices" incentive — simplifies without reducing depth |
| Graduated contradictions | Binary block instead of MINOR/MAJOR spectrum — loses nuance but reduces confusion |
| Repetition penalties | Gone — was never a meaningful decision |

**Honest assessment:** This proposal keeps more thematic continuity with V2.5 than the other proposals. KOA still feels like an adversary (through pressure). Cards still have tags and interact. The game still "feels like Home Smart Home." But the new mechanics (pressure + burn) add ~30 seconds of per-turn decision time, which risks pushing the session past 5 minutes on hard puzzles.

---

## 10. Why This Proposal Was Not Selected for V3

The hybrid evolution preserves V2.5's strengths (thematic richness, KOA as adversary) but:

1. **Still requires reading KOA's dialogue** to understand pressure context — the cognitive load concern that prompted the redesign exploration.
2. **5 systems is still a lot** for a daily puzzle that should be learnable in under a minute. "The Statement" achieves the same depth goals with fewer moving parts.
3. **Pressure mapping is hidden**, creating a discovery curve that may frustrate casual players who don't understand why cards cost more on some turns.
4. **Burn adds a third action type**, increasing per-turn decision complexity. "Play or hold" (V2.5) is simpler than "play, hold, or burn" (hybrid).

However, individual ideas from this proposal — particularly KOA's Pressure — could be layered onto V3 in a future version if playtesting reveals the deduction-only design lacks enough turn-by-turn tension.
