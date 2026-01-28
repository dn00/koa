# Playtest Readiness Checklist

Run through this checklist before launching any playtest. Every item must pass or be explicitly waived with a reason. This checklist is designed to be reusable for post-puzzle-generation agentic playtesting.

---

## 1. Validator

- [ ] `npx tsx scripts/prototype-v3.ts` runs without errors
- [ ] Target puzzle passes all FAIL-level invariants (I1-I27)
- [ ] WARN-level invariants (I21, I22, I28) reviewed — any new WARNs have documented justification
- [ ] Cross-puzzle checks pass (C1-C8), or new WARNs documented
- [ ] No regressions from previous playtest run

## 2. Play Engine

- [ ] `npx tsx scripts/play-v3.ts --puzzle {slug}` launches without errors
- [ ] Play through the FLAWLESS path (3 truths, highest score) — verify scoring, quips, closing line
- [ ] Play through a lie-hit path (stealth lie T1) — verify reduced penalty `-(str-1)`, reactive hint, recovery math
- [ ] Play through a hint-group probe path (hint-group truth T1) — verify specific reactive hint fires
- [ ] Play through a safe T1 path (non-hint truth T1) — verify vague reactive hint fires
- [ ] Play through worst case (both lies) — verify BUSTED outcome, closing line
- [ ] All 6 cards display correct: id, strength, location, time, source, claim
- [ ] All 6 narrations display correctly on play
- [ ] All 6 verdict quips display correctly (truth and lie variants)
- [ ] All 6 reactive hints display after T1
- [ ] Lie reveal at end shows correct 2 lies

## 3. Puzzle Content Review

- [ ] Read all 6 claims aloud — do hint-group claims feel equally suspicious?
- [ ] Read the opening hint — does it match ≥3 cards on first read? (No single card should be the obvious answer)
- [ ] Identify the stealth lie — is it in the top half by strength? Would you be tempted to play it?
- [ ] Identify the "safest looking" card — is there a card that's trivially identifiable as safe? If so, is there a documented justification (e.g., behavioral hint makes it ambiguous)?
- [ ] Read each specific reactive hint — does it narrow to the stealth lie without naming it?
- [ ] Read each vague reactive hint — does it provide atmosphere without actionable card identification?
- [ ] Check the hint text doesn't name a location, source, or card ID that trivially partitions the hand

## 4. Briefing & Player View

- [ ] `briefing.md` scoring section matches engine behavior (currently `-(strength - 1)`)
- [ ] `briefing.md` tips section reflects current hint mechanics (probe transparency)
- [ ] `puzzles-player-view.md` is synced with `v3-puzzles.ts` for the target puzzle:
  - [ ] All card IDs match
  - [ ] All strengths match
  - [ ] All locations match
  - [ ] All claims match (exact text)
  - [ ] All narrations match
  - [ ] All reactive hints match
  - [ ] All verdict quips match
  - [ ] All closing lines match
- [ ] No stale card names in player view (e.g., old "doorbell" in P2)
- [ ] Example in briefing doesn't contradict current scoring rules

## 5. Personas & Protocol

- [ ] `protocol.md` agent table lists the correct 5 personas
- [ ] All persona files referenced in protocol exist
- [ ] Protocol puzzle description matches current puzzle content (card names, hint text)
- [ ] Protocol pass criteria are appropriate for current changes:
  - [ ] H1-H4 hard requirements still make sense
  - [ ] S1-S10 soft requirements still make sense
  - [ ] Thresholds are calibrated (not auto-passing or impossible given changes)
- [ ] `playtest-prompt-template.md` variable reference is current (persona names, etc.)
- [ ] No references to retired personas (Sarah, Jen) in active documents

## 6. Design Doc Consistency

- [ ] `design.md` scoring rules match engine + briefing
- [ ] `design.md` hint system description matches current reactive hint behavior
- [ ] `puzzle-gen-invariants.md` semantic invariants (S1-S13) are compatible with current puzzle content
- [ ] Decision docs (2-conditional-hints.md, 3-reduced-lie-penalty.md) reflect current state
- [ ] `PLAYTEST-STATE.md` is updated with all changes since last playtest

## 7. Pre-Launch Sanity

- [ ] All modified source files saved and error-free (`npx tsx` compiles cleanly)
- [ ] No uncommitted changes that would affect the playtest (or changes are intentional)
- [ ] PLAYTEST-STATE "What's Next" section accurately describes this playtest
- [ ] Agent output paths are set (logs/ directory exists or will be created)
- [ ] Model specified (currently opus 4.5 for all agents)

---

## Quick Version (for repeat runs after initial setup)

If only puzzle content changed (no engine/briefing/protocol changes):

1. [ ] Validator passes on target puzzle
2. [ ] Engine plays 3 paths correctly (FLAWLESS, lie-hit, probe)
3. [ ] Player view synced with puzzle data
4. [ ] Claims feel equally suspicious (read aloud)
5. [ ] Stealth lie is tempting (top half strength)
6. [ ] No obvious safe haven card
7. [ ] PLAYTEST-STATE updated

---

## Post-Playtest

After results come in:

- [ ] Compile results into `results-ptN.md`
- [ ] Update PLAYTEST-STATE with results, findings, and pass/fail
- [ ] Identify mechanical issues → add validator invariants
- [ ] Identify content issues → add to semantic invariants doc
- [ ] Update this checklist if any step was missed that would have caught an issue
