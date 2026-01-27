# V2.5 Design Changelog

---

## v2.5.3 — Post-Playtest-3 Fixes (2026-01-27)

**Source:** Playtest 3 — 5 personas × 3 different puzzles. Tests variety, difficulty, learning transfer, session arc.

### Playtest 3 Results
- 10/13 pass criteria met. 1 hard fail: nobody lost Puzzle 1 (resistance 17 still too easy)
- NPS: 7.6 (up from 7.0). Players who experienced loss-then-recovery gave 8; never-lost gave 7
- 2/15 losses, both on Puzzle 2 (Thermostat War) — the "productive failure" moment
- 5/5 achieved FLAWLESS on Puzzle 3 (Shampoo Thief) with 0 scrutiny in 2 turns — too easy when learned
- 3/5 flagged scrutiny calculation as opaque across PT2+PT3
- The 3-puzzle session format is strictly better than same-puzzle replay (higher NPS, actual losses, rising arcs)

### Mechanic Changes
1. **Last Slice reduced to 6-card hand.** Removed microwave (pwr 2, IDLE, risk 0, proves ALERTNESS). Tightens margins — safe path no longer trivially clears resistance. Should produce first-contact losses.
2. **Post-game scrutiny breakdown.** After every game (win or loss), an itemized breakdown shows per-turn scrutiny sources: `Turn 1 [A+B]: risk(2) + repeated-proof(1) = +3`. Keeps feedback ambiguous during play (Principle 4), reveals after. Addresses #1 recurring feedback from PT2+PT3.

### Playtest 3 Files
- `_process/v2.5-design/playtest-3/` — Protocol, briefings, survey, results
- `_process/v2.5-design/playtest-3/logs/` — 15 game logs + 5 surveys
- `_process/v2.5-design/7-puzzle-archetype-spec.md` — Constrained-variance spec for puzzle authoring

---

## v2.5.2 — Post-Playtest-2 Fixes (2026-01-27)

**Source:** Playtest 2 — 5 realistic personas × 3 runs, conditional replay, expanded survey with marketing questions.

### Playtest 2 Results
- 11/13 pass criteria met. 1 hard fail: nobody lost Run 1 (0% loss rate)
- 5/5 players flagged abrupt game-ending on resistance break as #1 frustration
- Jen achieved FLAWLESS — only player to do so
- Badge chase was the primary replay motivator (not losing)
- NPS: 7.0 (all five gave 7 — "like it but wouldn't evangelize")
- 5/5 want daily puzzles + story mode. 3/5 would pay $3-5 one-time. No subscription appetite.
- 5/5 said "more puzzles" is the #1 thing the game needs

### Mechanic Changes
1. **Resistance break no longer ends the game.** If resistance hits 0 but concerns remain unaddressed and turns remain, the player keeps playing. KOA says "You've made your case on the numbers... but I still have concerns." This was the #1 UX issue from playtest 2.
2. **The Last Slice resistance raised from 14 to 17.** Makes Run 1 losses possible — playtest 2 had 0% loss rate.

### New Content
3. **3 new puzzles ported to interactive CLI:** The Thermostat War, The Missing Remote, The Shampoo Thief. Selectable via `--puzzle` flag.
4. **Puzzle selection:** `npx tsx scripts/play-v2.5.ts --puzzle thermostat-war`

### Invariant Updates
5. **MI-1 margin target relaxed.** The loop-continuation fix inflates optimal margins (extra turns = more damage). 3/5 puzzles hit +10-11 vs old +3-8 target. Core metrics remain healthy: win rates 31-50%, FLAWLESS paths exist, naive always loses.

### Playtest 2 Files
- `_process/v2.5-design/playtest-2/` — Protocol, personas, survey, briefing
- `_process/v2.5-design/playtest-2/logs/` — 15 game logs + 5 surveys
- `_process/v2.5-design/playtest-2/results.md` — Full analysis

---

## v2.5.1 — Post-Playtest Tuning (2026-01-27)

**Source:** 27-run agent playtest (3 personas × 3 knowledge tiers × 3 runs each).

### Findings
- All 10 pass criteria met (10/10)
- phone_gps decoy works — all impulsive agents fell for it on Run 1
- Analytical×T1 deduced all 5 hidden mechanics from zero knowledge in 3 runs
- **Problem:** Cautious players win too easily (Cautious×T1 won blind on Run 1)
- **Problem:** FLAWLESS badge is structurally impossible on The Last Slice (INTENT requires speaker/AWAKE, which forces contradiction with needed ASLEEP cards; remaining risk-0 cards can't reach resistance)
- **Problem:** Strategy convergence by Run 3 — most agents land on same 2-turn line (doorbell+thermostat → fitbit+security_cam)

### Mechanic Changes
1. **Badge tiers expanded:** WIN → CLEAN (scrutiny ≤ 2) → THOROUGH (all concerns) → FLAWLESS (all concerns + scrutiny ≤ 2). Previously only WIN/CLEAN/FLAWLESS existed.
2. **Minimum concerns gate:** WIN now requires ≥ ⌈totalConcerns/2⌉ concerns addressed. For 3-concern puzzles, must address at least 2. Prevents winning by raw damage alone without engaging the thematic evidence layer.

### New Invariants
3. **FL-1 (FLAWLESS path exists):** At least one path must achieve all concerns + scrutiny ≤ 2. Prevents structurally impossible aspirational badges.
4. **SP-1 (Safe-path margin ≤ +3):** Max damage from risk-0 cards only must be < resistance + 3. Ensures cautious play isn't a free ride — players must accept some risk.

### Tuning Recipe Updates
- Added Step 5b: Verify FLAWLESS achievability
- Added Step 6b: Check safe-path tension
- Updated checklist with FL-1 and SP-1

---

## v2.5.0 — Initial Prototype (2026-01-27)

**Source:** 10+ Dr. Strange agent explorations, V1/V2 prototype comparison.

### Schema
- V2 card schema: power/tag/risk + proves/refutes/source/flavor
- No new attributes over V2

### 3 Interference Rules
1. **Rule A — Repetition Risk:** If submitted card's `proves` matches committed card's `proves`, +1 scrutiny
2. **Rule B — Graduated Contradictions:** 1st contradiction = warning (+1 scrutiny), 2nd = blocked
3. **Rule C — Source Diversity Bonus:** Corroborating cards from different sources get 30% bonus (vs 20% same source)

### Design Decisions
- Max 2 cards per submission (prevents corroboration burst)
- Ambiguous feedback: scrutiny shown as aggregate only, never itemized
- Testimony Lock: no pre-submission preview
- Corroboration rates: 30% diverse, 20% same source

### Validation
- 5 puzzles validated: Midnight Snack (Corroboration), Thermostat War (Trap), Missing Remote (Tight Margins), Shampoo Thief (Counter-Heavy), Last Slice v2.5 (Corroboration)
- All 5 pass 8/8 invariants (P5-winrate, SI5-sweeps, MI1-margin, MI2-naive, P7-blocks, RepRisk>20%, Contra>10%, SrcDiv>15%)
- Win rates: 30.7%–53.9% across archetypes

### Key Tuning Discoveries
- Total pool risk 3-5 → win rate ~40-55%
- Total pool risk 6+ → win rate < 30%
- Total pool risk ≤ 2 → win rate > 70%
- Corroboration bonus with ceil() makes 35%→30% change negligible at low powers
- Need 2+ cards per side of contradiction axis for hard blocks to fire

### Files Created
- `scripts/prototype-v2.5.ts` — Checker with 5 puzzles
- `scripts/play-v2.5.ts` — Interactive CLI for The Last Slice
- `_process/v2.5-design/3-puzzle-tuning-recipe.md` — Authoring guide
- `_process/v2.5-design/6-playtest-protocol.md` — Agent testing strategy
- `_process/v2.5-design/playtest/` — Persona files, briefings, survey, logs
