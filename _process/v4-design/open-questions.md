# V4 Open Questions

## 1. Deckbuilding Model

**Question**: How do players get their 8 cards for a puzzle?

**Options explored**:
- **Option A (Abstract)**: Cards are type+strength slots. Puzzle provides narrative. Player brings generic deck.
- **Option B (Concrete)**: Cards are named objects ("Ring Doorbell Footage"). Puzzles authored around card pool. Collecting gives access to more puzzles.
- **Hybrid (Likely winner)**: Daily puzzle gives everyone the same 8 cards (no deckbuilding, fair, Wordle-like). Archive/challenge puzzles require owned cards — collecting unlocks more content, never gates the daily.

**Risk**: Gating daily play behind card ownership → player annoyance. Hybrid avoids this.

**Status**: Deferred until core pair-play mechanics are validated via playtest.

## 2. Card Narrative ↔ Strength Relationship

**Principle**: str-1 should feel like weak evidence ("browsing a recipe site"), str-8 should feel like strong evidence ("floodlight sensor log"). The narrative weight must match the mechanical weight so the game reads intuitively.

**For deckbuilding**: If cards are concrete (Option B), their strength is permanent. A "Ring Doorbell Footage" card is always str-3 SENSOR. Puzzle authors work with the card pool's fixed strengths.

**Status**: Current prototype follows this principle. Formalize as an authoring guideline when writing more puzzles.

## 3. Freemium Split

**Validated via sweep**:
- **Daily (free)**: 8 cards, 2 lies, play 4 singles, no combos. 28/28 lie pairs viable, ~33% win rate.
- **Premium (paid)**: 8 cards, 3 lies, play 3 pairs, combos. 54/56 lie triples viable, ~19% win rate.

Same puzzle data, two game modes. Premium justifies subscription via richer content (28 pair narrations, combo system, forced lie tension, longer session).

**Status**: Math validated. Implementation deferred until core pair-play validated.

## 4. Scoring Contexts as Weekly Themes

From doc 8 (superseded): evidence type multipliers, corroboration bonuses, suspicion penalties, escalation. Could layer on top of pair play as weekly modifiers.

**Status**: Post-validation exploration. Pair play must stand alone first.

## 5. Multi-Act Structure

Multiple rounds with the same deck, different scoring contexts per act. Card value shifts between acts.

**Status**: Post-validation. Depends on scoring contexts (Q4).
