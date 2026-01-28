# V5 Home Smart Home — Puzzle Design Checklist

**Goal:** If a puzzle (or daily build) genuinely passes **every** item here, it should be very hard to argue it’s a “bad” puzzle.  
Use this as a **final human/agent QA pass** on top of automated validators.

This checklist is derived from `puzzle-design-context.md`, D31/D10 invariants, and V5 micro‑daily playtest insights.

Tick items as `[x]` when satisfied.

---

## 1. Product & Format

- [ ] **Daily format:** Puzzle is designed and packaged as a **single daily scenario** (same for everyone that day).
- [ ] **Session length:** Expected playtime is in the **2–10 minute** band (tutorials can be shorter), not a 30+ minute “case file.”
- [ ] **Mobile-first:** All required information fits comfortably on a **phone screen** with minimal scrolling and no multi-tab juggling.
- [ ] **Offline-capable:** No runtime LLM calls or network dependencies are required to play or resolve the puzzle.

---

## 2. Structure & Difficulty (D31 / D10 aligned)

- [ ] **Card & concern counts** match the intended difficulty row in the difficulty table (Tutorial/Easy/Normal/Hard/Expert) or a clearly documented micro‑daily config (e.g., V5: 6 cards, 3 turns, 2 lies).
- [ ] **Resistance / target** and card power/strength are set so that **S2-style margin** is respected (e.g., total hand power ≥ resistance + margin for that tier).
- [ ] **At least 2 distinct winning lines** exist (different card combinations or orderings), not just permutations of a single line.
- [ ] **Max trap cards:** There is **no more than one true “trap” card** that is mechanically tempting but logically bad.
- [ ] **Refutation / mitigation**: Where counters or tax exist, there is either:
  - A refutation / mitigation tool, or  
  - A clearly winnable path that wins despite taking those hits.

---

## 3. Solvability, Fairness & Deducibility

- [ ] **Always winnable:** There exists at least one path that wins **without** relying on guessing or luck (no impossible seeds).
- [ ] **No forced MAJOR contradictions** on any winning path; players are never required to take a “you obviously lied” move to clear.
- [ ] **Mistakes are recoverable:** A small number of minor misplays (e.g., 1–2 MINOR contradictions, one wrong card) doesn’t auto‑lose the puzzle if the rest of the play is strong.
- [ ] **Every lie is explainable post‑hoc** in 1–2 sentences using only:
  - Known Facts, and  
  - Card claims / timing / locations, and  
  - The scenario pitch.  
  (You can literally write “This was a lie because Fact #2 and this claim can’t both be true.”)
- [ ] **Known Facts matter:** It is realistically impossible to play “well” while ignoring the Known Facts (e.g., you cannot reliably win by only reading strength/risk).
- [ ] **Turn 1 is not blind:** There is at least one **clearly safe opening** a careful player can justify from the Facts + the scenario (anchor card / safe testimony).
- [ ] **Lie patterns vary:** Across a week/pack, lies are **not always**:
  - the highest-strength cards,  
  - timeline contradictions only, or  
  - a single evidence type (e.g., DIGITAL).  
  At least some puzzles confound simple meta rules like “never play the strongest DIGITAL card.”

---

## 4. Mechanics Feel (Tax, Counters, KOA Flag/System Check)

- [ ] **KoA Tax (if present)** is simple to state (1 sentence) and consistently applied; players can predict when it will trigger.
- [ ] **Tax creates decisions:** In this puzzle, there is at least one line where taking the tax is **plausibly correct** (e.g., eating -2 for a strong, well-supported card), not just something players always avoid for free.
- [ ] **Counters / flags are visible enough:** In Full‑info modes, players can reason about counters/flags before committing; in micro‑daily mode, rules around KOA Flag/System Check are clearly stated and consistent.
- [ ] **KOA Flag (System Check) beat is tense but fair:** At the “keep on record / roll back” moment:
  - A thoughtful player can articulate why each choice is risky/safe, and  
  - The +2 / -4 vs -2 tradeoff feels meaningful, not random.
- [ ] **No hidden gotchas:** There are no surprising behaviors that violate the player’s mental model (e.g., counters secretly targeting random cards, tax applying in undocumented cases).

---

## 5. Information Design & UX

- [ ] **All necessary info is visible** at the moment of decision without digging (scenario, Known Facts, card attributes, basic rules on tax/counters/flag).
- [ ] **Contradiction-relevant elements** (time, location, state) are written unambiguously where they matter for logic (e.g., “phone browser” vs “laptop browser” if that distinction is used).
- [ ] **Error feedback is clear:** When a contradiction or penalty occurs, the UI/KOA explains **what happened and why** in simple language.
- [ ] **Post-run explanation is possible:** Designers can (and for harder puzzles, do) map each lie back to the facts it broke in one or two explicit text lines (for teaching mode / epilogue).
- [ ] **Session length feels contained:** There is no requirement to read large “case files” or multi-page logs to make reasonable decisions; the puzzle is a tight, focused slice.

---

## 6. KOA Voice & Narrative

- [ ] **KOA tone matches brief:** passive‑aggressive bureaucrat, forensic about trivial domestic events; never a judge, never a prosecutor, never a cop.
- [ ] **No courtroom language:** Banned words are respected in puzzle text and barks (no “objection,” “verdict,” “guilty,” “testimony” in the courtroom sense, etc.).
- [ ] **High-stakes beat framed as system check:** The mid‑run decision is framed as a **KOA flag / system check on your story**, with language like “logs,” “record,” “keep on file,” “roll back,” “turn this back on,” not legal metaphors.
- [ ] **Framing is about safety & access, not crime:** Scenarios and KOA lines talk about KOA being overprotective or cautious (locking things “for your own good”), not accusing you of crimes or moral failure.
- [ ] **KOA dialogue never solves the puzzle:** During play, KOA comments on axes (timeline, coherence, channel reliance) and tension, but never explicitly says “this card is a lie” or “you should play X next.”
- [ ] **Barks are short and skippable:** Under 2 sentences per beat, pass the screenshot/read-aloud/skip/personality tests.
- [ ] **Optional epilogue (if present) reinforces logic:** Any post-game explanation or epilogue:
  - Explains what actually happened, and  
  - Reinforces the same logical relationships (does not introduce new contradictions).

---

## 7. Variety & Weekly Experience

- [ ] Within a week/pack, the **six archetypes** (Trap, Scrutiny, Counter-heavy, Eat-the-contest, Tight margins, Corroboration) or equivalent variety are represented; puzzles don’t all feel like the same mold.
- [ ] Incident themes vary (e.g., printers, garage doors, drones, thermostat wars, suspicious packages) and reuse doesn’t feel like simple reskins.
- [ ] Difficulty is mixed across the week (some easier, some harder), not monotonically trivial or punishing.
- [ ] KOA’s lines avoid obvious repetition; recurring phrases are deliberate callbacks, not accidental reuse.

---

## 8. Meta, Progression & Reward

- [ ] Puzzle outcomes support **tiered results** (e.g., CLOSE / CLEARED / FLAWLESS) rather than binary win/lose, so better play is visibly rewarded.
- [ ] The scoring / tier system encourages **careful play**, not just quick win/lose churn.
- [ ] Near-miss feedback is either displayed or easily derivable (e.g., designers can surface “you were 1 point from a higher tier”).
- [ ] Streaks/daily challenges (if used) **do not** incentivize low-effort play or grinding; they sit on top of, not instead of, interesting puzzles.

---

## 9. Sanity Check: Would You Ship This?

Answer honestly:

- [ ] If you imagine this puzzle as **Day N in a live app**, would you be happy if it were someone’s **first ever** experience of the game?
- [ ] Would you be happy if it were someone’s **7th puzzle in a row** this week?
- [ ] Can you point to at least one **clear aha moment** (contradiction caught, system check decision, lie reveal) that feels satisfying rather than arbitrary?

If all the above are checked and you can articulate a couple of specific “good moments” in the puzzle, it’s very likely a solid, shippable entry. 
