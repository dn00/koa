# Puzzle Archetype Spec — Constrained Variance

Defines the rules for authoring new puzzles. Any puzzle matching this spec can be validated by the brute-force checker without agent playtesting. Agent playtests are only needed when the spec itself changes.

---

## Fixed Constants

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Turns | 3 | Enough for a 3-act structure, short enough for mobile |
| Scrutiny limit | 5 | Tight enough that 2 risky plays threaten loss |
| Concerns | 3 | Forces coverage across at least 2 proof types |
| Cards per turn | 1-2 | Prevents corroboration burst |

---

## Variance Bands

| Parameter | Range | Notes |
|-----------|-------|-------|
| Hand size | 5-8 | Smaller = tighter margins, larger = more decision space |
| Resistance | 11-20 | Tuned per hand. Must satisfy SI/MI invariants. |
| Total card power | 18-28 | Sum of all card powers in hand |
| Total pool risk | 3-7 | Sum of all risk values. 3-5 → ~40-55% win rate. 6+ → <30%. |
| Counters | 0-3 | 0 = no contested cards. 3 = heavy sequencing pressure. |
| Contradiction axes | 1-3 | At least 1 required. Each axis = one opposing tag pair used. |
| Refuter cards | 0-2 | Must match counter count or be fewer (not every counter is refutable). |

---

## Required Elements (every puzzle)

1. **At least 1 tension source card:** risk >= 2, OR proves a needed concern but has a conflicting tag. The card that tempts greedy play.

2. **At least 1 tag contradiction axis:** At least 2 cards from one side (e.g., 2× ASLEEP) and at least 1 card from the opposing side (e.g., 1× AWAKE). Creates the "you can't have both" decision.

3. **At least 1 concern gated behind risk:** A concern that can ONLY be proved by a card with risk > 0 or a conflicting tag. Prevents free coverage.

4. **No free rides:** Safe-path margin (risk-0 cards only) must be ≤ +3 vs resistance (SP-1 invariant). Players must accept some risk.

5. **FLAWLESS path must exist:** At least one play sequence achieves all concerns + scrutiny ≤ 2 (FL-1 invariant).

6. **Naive path must lose:** Playing cards in descending power order must not win (MI-2 invariant).

---

## Trap Archetypes (rotate across consecutive puzzles)

No two consecutive puzzles in a session should use the same trap type.

| Trap Type | Description | Example |
|-----------|-------------|---------|
| **POWER TRAP** | Highest-power card has a conflicting tag or high risk. Greedy play punished. | phone_gps (pwr 5, AWAKE, risk 2) in Last Slice |
| **REPETITION TRAP** | Two cards prove the same concern. Playing both adds repetition risk scrutiny. | thermostat + phone_gps both prove LOCATION |
| **COUNTER TRAP** | High-power card is contested. Playing it without refuting first = half credit. | security_cam contested by counter_alibi |
| **CONVERGENCE TRAP** | Multiple cards share a tag — corroboration looks tempting but locks out the opposing tag you need. | 3× HOME cards, but AWAY card proves a needed concern |
| **SEQUENCE TRAP** | Card order matters — playing card A before card B is fine, but B before A triggers graduated contradiction. | AWAKE card must come before ASLEEP, not after |

---

## Validation Pipeline

For each new puzzle:

1. **Author** writes scenario, cards, counters, concerns within the variance bands
2. **Checker** (prototype-v2.5.ts) runs brute-force enumeration:
   - Win rate 30-70%
   - Zero clean sweeps
   - FLAWLESS paths > 0
   - Safe-path margin ≤ +3
   - Naive path loses
   - Repetition risk fires > 20% of wins
   - Graduated contradiction fires > 10% of wins
3. If all invariants pass → puzzle ships
4. If any fail → adjust resistance, risk values, or card composition and re-run
5. **Agent playtesting** only needed when:
   - The spec itself changes (new rules, new invariants)
   - A new trap archetype is introduced
   - Session-level testing (puzzle ordering, arc)

---

## Session Sequencing Rules

When puzzles are played in a session (e.g., daily-3, story mode):

1. **Puzzle 1:** Should be losable by a first-time player. Resistance set higher relative to card power. Uses POWER TRAP or COUNTER TRAP (most intuitive to learn from).

2. **Puzzle 2:** Introduces a different trap type than P1. Tests learning transfer. REPETITION TRAP or CONVERGENCE TRAP work well here — they punish the "just pick safe cards" strategy learned from P1.

3. **Puzzle 3:** Hardest, or at least requires synthesizing lessons from P1 and P2. Uses SEQUENCE TRAP or multiple trap types layered. Should NOT be solvable by the same strategy as P1/P2.

4. **No two consecutive puzzles share the same trap type.**

5. **Tag axes should vary.** If P1 uses ASLEEP/AWAKE, P2 should use HOME/AWAY or IDLE/ACTIVE.

---

## Card Slot Templates (optional starting point)

These are NOT rigid — they're a starting scaffold for authors.

| Slot | Typical Profile | Required? |
|------|----------------|-----------|
| ANCHOR | pwr 3-4, common tag, risk 0-1, proves a concern | Yes |
| ANCHOR_2 | pwr 2-3, same tag as ANCHOR (enables corroboration), proves different concern | Yes |
| TENSION | pwr 4-6, opposing tag to ANCHOR, risk 1-2, proves a needed concern | Yes |
| REFUTER | pwr 2, any tag, risk 0, refutes a counter | If counters > 0 |
| FILLER | pwr 2, neutral tag (IDLE/ALONE), risk 0, optional proves | Optional |
| DECOY | pwr 5-6, high risk OR conflicting tag, proves something already covered | Optional (is the trap) |

A minimal 5-card puzzle: ANCHOR, ANCHOR_2, TENSION, REFUTER, FILLER.
A rich 8-card puzzle: 2× ANCHOR, TENSION, DECOY, 2× FILLER, REFUTER, wild card.
