# Puzzle Archetype Spec — V3 "The Statement"

> **SUPERSEDED.** This doc predates Option C (split lies), conditional reactive hints (quality: specific/vague), and the current validator (I1-I25, C1-C8). Target ranges, variance bands, and archetype definitions are stale. For current puzzle authoring guidance, use:
> - `_process/v3-design/puzzle-gen-invariants.md` — semantic invariants S1-S13 + backward generation process
> - `_process/v3-design/design.md` — section 3.7 (card design constraints) + Appendix C (difficulty scaling)
> - `scripts/prototype-v3.ts` — current validator

Defines the rules for authoring new V3 puzzles. Any puzzle matching this spec can be validated by the brute-force checker (`scripts/prototype-v3.ts`). Agent playtests are only needed when the spec itself changes.

---

## Fixed Constants

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Cards | 6 | Small enough to evaluate, large enough for deduction |
| Lies | 2 | Known count — player deduces identity, not quantity |
| Truths | 4 | 4 choose 3 = 4 possible truth-only plays |
| Turns | 3 | Play 1 card per turn, always exactly 3 plays |
| Cards per turn | 1 | No multi-card submissions — sequential commitment |
| Reactive hint | After Turn 1 only | KOA responds to T1 play |

---

## Variance Bands

| Parameter | Range | Notes |
|-----------|-------|-------|
| Target | 3-13 | Primary difficulty lever |
| Card strength | 1-5 | Per card |
| Total pool strength | 18-26 | Sum of all 6 cards |
| Lie strength (each) | 3-5 | Must be tempting |
| Truth strength (each) | 2-5 | Mix of weak and strong |
| Hint ambiguity | 3-5 cards match | 2 lies + 1-3 red herring truths |
| Margin (top 3 truths - target) | 0-5 | 0 = razor tight, 5 = generous |

---

## Required Elements (every puzzle)

### 1. Ambiguous Hint
The opening hint must match ≥ 3 cards (both lies + at least 1 truth). A hint that matches exactly 2 cards solves the puzzle instantly. Hints matching 4-5 cards create the best deduction challenges.

**Test:** Count how many cards satisfy the hinted property. If only 2 → redesign the hint or add a red herring truth.

### 2. Tempting Lies
Average lie strength ≥ average truth strength. The "play the big numbers" instinct must lead toward lies.

**Ideal:** One lie is the highest or tied-highest strength in the hand. The other lie is mid-range (3-4) — not so obvious it screams "trap."

### 3. Tight Target
Top 3 truth strengths - target ≤ 3. The player can't just play any 3 truths and win comfortably. They need to find the RIGHT 3 truths (or at least avoid the RIGHT 2 lies).

**For hard puzzles:** Top 3 truths = target exactly. One wrong choice = loss.

### 4. Naive Must Fail
Playing the 3 highest-strength cards must include ≥ 1 lie. If a greedy player can stumble into FLAWLESS, the puzzle has no deduction challenge.

### 5. Recovery Gradient
Hitting 1 lie should have varying consequences based on which lie and when:
- Hitting a low-strength lie (2-3) on T1: recovery should be possible with good T2/T3 play
- Hitting a high-strength lie (4-5) on T1: recovery should be very difficult or impossible
- This creates the risk gradient that makes strength meaningful

### 6. Decisive Reactive Hints
At least 2 of the 6 reactive hints must provide information that narrows lie candidates beyond what the opening hint provides. Without this, the reactive hint system is decorative.

---

## Hint Archetypes (rotate across consecutive puzzles)

No two consecutive puzzles in a session should use the same hint type.

| Hint Type | Description | Matching Cards | Difficulty |
|-----------|-------------|----------------|------------|
| **DIRECT** | Names a single attribute value | 2-3 | Easy |
| **COMPOUND** | Names two intersecting attributes | 3-4 | Medium |
| **NEGATION** | Names what the lies are NOT | 3-4 | Medium |
| **RELATIONAL** | Describes relationship between lies | 3-5 | Hard |
| **OBLIQUE** | Metaphorical or indirect | 4-5 | Hard |

### DIRECT
*"Both lies mention the kitchen."*
Player scans for KITCHEN cards. If 2 are KITCHEN → solved. If 3+ → must narrow further.

### COMPOUND
*"The lies share a time AND a source — same device, same hour."*
Player must intersect two attribute axes. More cards match on one axis alone, creating false candidates.

### NEGATION
*"I trust everything from before 10 PM."*
Player inverts: lies are after 10 PM. But multiple cards are after 10 PM.

### RELATIONAL
*"The lies tell suspiciously similar stories."*
Player must find the pair of cards with the most shared attributes. Multiple pairs might be similar.

### OBLIQUE
*"Your story is too perfect in one place."*
Player must connect the metaphor to the scenario and card attributes. Multiple interpretations possible.

---

## Trap Archetypes (rotate across consecutive puzzles)

| Trap Type | Description | Design Pattern |
|-----------|-------------|----------------|
| **STRENGTH TRAP** | Highest-strength cards are lies | Lie strengths 4-5, truth strengths 2-4 |
| **RED HERRING TRAP** | A truth matches the hint, player avoids it | Truth shares attribute with lies, high strength |
| **TARGET TRAP** | Safe cards don't reach target | Top 3 truths barely meet target, any dodge = loss |
| **PROBE TRAP** | Probing a lie on T1 is tempting but fatal | High-strength lie, target too tight to absorb penalty |
| **SPLIT TRAP** | Lies share the hint axis but differ on a visible axis | Player identifies 1 lie easily, 2nd is harder to find |

---

## Session Sequencing Rules

When puzzles are played in a session:

1. **Puzzle 1:** Easy hint (DIRECT), generous target (margin 3-5). Uses STRENGTH TRAP. First-time player can win by reading the hint carefully. Loss is possible but not likely for attentive players. Purpose: teach the mechanic.

2. **Puzzle 2:** Medium hint (COMPOUND or NEGATION), tighter target (margin 1-2). Uses RED HERRING or TARGET TRAP. Tests whether the player learned from P1. The "just avoid what the hint says" strategy should fail here because truths also match the hint. Purpose: teach deduction.

3. **Puzzle 3:** Hard hint (RELATIONAL or OBLIQUE), tight target (margin 0-1). Uses PROBE TRAP or SPLIT TRAP. Requires combining opening hint + reactive hints + elimination logic. Purpose: test skill.

**Rules:**
- No two consecutive puzzles share the same hint type
- No two consecutive puzzles share the same trap type
- Attribute axes should vary (P1 uses locations, P2 uses sources, P3 uses times)

---

## Validation Pipeline

For each new puzzle:

1. **Author** writes scenario, cards, hint, reactive hints, target within variance bands
2. **Checker** (`scripts/prototype-v3.ts`) runs brute-force enumeration:
   - All auto-invariants pass (L2, W1, T1, R1, S1, S2, WR, FL)
   - T1 strategy shows meaningful win-rate variance across cards
3. **Manual checks:**
   - Hint ambiguity ≥ 3 cards match
   - ≥ 2 reactive hints are decisive
   - Naive (top-3 strength) includes a lie
   - Target tension ≤ 3
4. If all pass → puzzle ships
5. If any fail → adjust target, strengths, hint, or card composition

---

## Card Slot Templates (starting scaffold)

| Slot | Profile | Purpose |
|------|---------|---------|
| **ANCHOR** | Truth, str 4-5, doesn't match hint | The safe strong card — but maybe too obviously safe |
| **SUPPORT** | Truth, str 3, doesn't match hint | Reliable backup, slightly weaker |
| **RED HERRING** | Truth, str 3-4, partially matches hint | Looks like a lie, is actually safe — tests deduction |
| **FILLER** | Truth, str 2-3, doesn't match hint | The "I need this if I'm in trouble" fallback |
| **BAIT** | Lie, str 4-5, matches hint, tempting | The obvious trap for greedy players |
| **LURKER** | Lie, str 3-4, matches hint, less obvious | The subtler trap — harder to identify without reactive hints |

A standard puzzle uses all 6 slots. The ANCHOR+SUPPORT+RED HERRING should reach or exceed target (ensuring winnability). The BAIT should be the highest or tied-highest strength (ensuring naive fails).
