# V4 Playtest Readiness Checklist

Run through this checklist before launching any playtest. Every item must pass or be explicitly waived with a reason.

---

## 1. Validator

- [ ] `npx tsx scripts/prototype-v4.ts` runs without errors
- [ ] Target puzzle passes all 22 invariant checks (I1-I22)
- [ ] WARN-level invariants reviewed — any new WARNs have documented justification
- [ ] No regressions from previous playtest run

## 2. Play Engine

- [ ] `npx tsx scripts/play-v4.ts --puzzle {slug}` launches without errors
- [ ] Play through the FLAWLESS path (dodge 2 lies, pair truths for max combos) — verify scoring, pair narrations, KOA responses, combo display, closing line
- [ ] Play through a 1-lie pair path (pair 1 lie + 1 truth) — verify penalty `-(str-1)`, combo cancellation, narration still plays
- [ ] Play through a 2-lie pair path (pair 2 lies together) — verify both penalties, no combos, KOA response
- [ ] Play through worst case (play all 3 lies, bad pairings) — verify BUSTED outcome, closing line
- [ ] All 8 cards display correct: id, strength, evidenceType, location, time, claim
- [ ] All 28 pair narrations display correctly (playerStatement + koaResponse)
- [ ] All 8 verdict quips display correctly (truth and lie variants)
- [ ] Reactive hints display after Turn 1 and Turn 2 (not Turn 3)
- [ ] Lie reveal at end shows correct 3 lies with played/dodged status
- [ ] Share card displays correctly (✓/✗ per card in each pair)
- [ ] Score bar doesn't crash at high or negative scores
- [ ] Combo breakdown shows correct bonuses (Corroboration +3, Timeline +2, Coverage +2, Reinforcement +3)

## 3. Puzzle Content Review

- [ ] Read all 8 claims — do hint-matching claims (5 cards) feel equally suspicious?
- [ ] Read the behavioral hint — does it match ≥4 cards on first read? (No single card should be the obvious answer)
- [ ] For each lie: is there a same-type or same-location truth that makes the lie tempting to pair with?
- [ ] Read 3-4 pair narrations for thematically strong pairs (same type/location) — do they sound confident and natural?
- [ ] Read 3-4 pair narrations for mismatched pairs — do they sound like the speaker is reaching?
- [ ] Read KOA responses — are they ambiguous (don't reveal truth/lie status)?
- [ ] Check that no pair narration references card-specific facts that would reveal lie status
- [ ] Read specific reactive hints — do they narrow the lie set without naming cards?
- [ ] Read vague reactive hints — do they provide atmosphere without actionable identification?
- [ ] Check the hint text doesn't trivially partition the hand

## 4. Combo Verification

- [ ] Truth+Truth same-type pair triggers Reinforcement (+3) and Corroboration (+3) if same location
- [ ] Truth+Truth different-type pair triggers Coverage (+2)
- [ ] Truth+Truth adjacent-time pair triggers Timeline (+2)
- [ ] Lie+Truth pair triggers zero combos regardless of attributes
- [ ] Lie+Lie pair triggers zero combos regardless of attributes
- [ ] At least one "combo bait" exists: a lie shares type+location with a truth, tempting the player to pair them (which cancels the combo)

## 5. Briefing & Player View

- [ ] Briefing document exists and matches engine behavior:
  - [ ] Scoring: truth = +strength, lie = -(strength-1)
  - [ ] Combos: only fire if BOTH cards are truths
  - [ ] Combo values: Corroboration +3, Timeline +2, Coverage +2, Reinforcement +3
  - [ ] Tiers: FLAWLESS (≥target+5), CLEARED (≥target), CLOSE (≥target-3), BUSTED
  - [ ] 8 cards, 3 lies, play 3 pairs of 2, leave out 2
- [ ] Player view document exists with all card data (no isLie field)
- [ ] No stale references to V3 mechanics (single play, 6 cards, 2 lies)

## 6. Personas & Protocol

- [ ] Protocol document exists with agent personas
- [ ] All personas have distinct play styles (cautious, aggressive, analytical, intuitive, etc.)
- [ ] Protocol puzzle description matches current puzzle content
- [ ] Protocol pass criteria adapted for V4:
  - [ ] Hard requirements account for pair play, combos, forced lie
  - [ ] Soft requirements account for pair narration quality, KOA dialogue flow
- [ ] Playtest prompt template exists with V4 instructions

## 7. Pre-Launch Sanity

- [ ] All modified source files saved and error-free (`npx tsx` compiles cleanly)
- [ ] No uncommitted changes that would affect the playtest (or changes are intentional)
- [ ] Agent output paths are set (logs/ directory exists or will be created)
- [ ] Model specified for agents
- [ ] Piped input works for automated agent runs (or interactive mode confirmed)

---

## Quick Version (for repeat runs after initial setup)

If only puzzle content changed (no engine/briefing/protocol changes):

1. [ ] Validator passes on target puzzle (22/22)
2. [ ] Engine plays 4 paths correctly (FLAWLESS, 1-lie pair, 2-lie pair, BUSTED)
3. [ ] Player view synced with puzzle data
4. [ ] Claims feel equally suspicious (read 5 hint-matching cards)
5. [ ] Lies are tempting to pair (combo bait exists)
6. [ ] No obvious safe-haven card
7. [ ] Pair narrations quality check (3 strong + 3 weak pairs)

---

## Post-Playtest

After results come in:

- [ ] Compile results into `results-ptN.md`
- [ ] Identify mechanical issues → add validator invariants
- [ ] Identify content issues → add to puzzle authoring guidelines
- [ ] Identify narration issues → add to narration generation prompts
- [ ] Update this checklist if any step was missed that would have caught an issue
