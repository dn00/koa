# Puzzle Generation Insights from V5 Playtest-1 Logs

Source: `_process/v5-design/playtest-1/logs/*`, using LLM persona runs (Literal, Suspicious, Methodical, Intuitive) on `midnight-print` and `garage-door`.

This document captures practical rules for LLM puzzle generators that are **not obvious from the archetype spec alone**, but emerge from how different personas actually play.

---

## 1. Always Include One Clean Direct-Contradiction Lie

Pattern from logs:
- Players’ main “aha” moments consistently come from **simple, legible contradictions** between a Known Fact and a card claim (e.g., “in bed by 11 PM” vs email at 11:30 PM).
- Methodical and Suspicious personas explicitly cite these as their key deduction anchors.

Generation rule:
- In addition to the formal requirement “at least one direct-contradiction lie,” ensure:
  - The contradiction can be stated in one short sentence.
  - The conflicting Known Fact is **clearly phrased and easy to remember**.
  - The offending card has **non-trivial strength (4–5)** so it is tempting.
  - The **claim text is unambiguous** where it matters (e.g., specify `phone browser` vs `laptop browser` if that distinction is used for deduction).

LLM prompt hint:
- “Create one lie whose claim directly conflicts with a single Known Fact in a way a careful reader can explain in one sentence.”

---

## 2. Make the Second Lie Require Synthesis

Pattern from logs:
- Players now ask for “harder” puzzles where at least one lie requires **cross-referencing cards or reading the scenario**, not just scanning Known Facts.
- Methodical persona for `garage-door` notes the puzzle felt slightly “too clean” because both lies were simple contradictions.

Generation rule:
- The **second lie** should not be catchable by a single fact-check. It should require at least one of:
  - Combining two card claims (relational contradiction).
  - Understanding that the card is **self-incriminating** given the scenario (it proves your guilt).
  - Noticing a physically impossible timeline given multiple facts.

LLM prompt hint:
- “Design the second lie so that catching it requires comparing at least two claims or a claim + the scenario, not just reading one Known Fact.”

---

## 3. Ensure Turn 1 Is Not Blind

Pattern from logs:
- Methodical and Suspicious personas describe **confident, reasoned Turn 1 choices**, not coin flips.
- Their reasoning almost always relies on a **SAFE “anchor” truth** that aligns tightly with Known Facts.

Generation rule:
- For each puzzle, ensure **at least one truth** is:
  - Directly and obviously supported by one or more Known Facts.
  - Plausible and non-self-incriminating given the scenario.
- A methodical player should be able to say: “This card is my safest opening because it matches Fact X and doesn’t introduce new risk.”

LLM prompt hint:
- “Include at least one clearly safe ‘anchor’ card that a careful player can justify as a non-guessy Turn 1 play using the Known Facts.”

---

## 4. Make Type Tax a Real Tradeoff, Not Just a Free Avoidance Rule

Pattern from logs:
- Players routinely avoid type tax by just spreading types (TESTIMONY → DIGITAL → SENSOR).
- Very few report situations where **eating the -2 tax was clearly worth it**; type tax mostly affects sequencing, not true tradeoffs.

Generation rule:
- Intentionally include at least one puzzle pattern where:
  - The **EV-best line** eats type tax once for a strong, well-supported truth.
  - The obvious tax-avoiding line scores slightly worse (e.g., 1–2 points off best).
- At the same time, keep some lines where avoiding tax is optimal, so it doesn’t become “always eat the tax.”

LLM prompt hint:
- “Design card strengths and types so that in at least one plausible optimal play line, the best move is to accept a -2 type tax penalty for a strong, well-supported truth card.”

---

## 5. Design for a Strong Lie-Reveal “Aha” Moment

Pattern from logs:
- K1/K4 answers repeatedly cite the **lie reveal** as the most satisfying moment, especially when it:
  - Confirms a deduction they had already made, or
  - Clearly explains a subtle contradiction they missed.

Generation rule:
- For each lie, ensure that the verdict / reveal can:
  - Explicitly state **why** it was a lie in 1–2 short lines.
  - Teach or reinforce a deduction pattern (e.g., timeline consistency, self-incrimination).
- Avoid lies whose reveal boils down to “because the author says so” with no explainable logic.

LLM prompt hint:
- “When you define lie reasons, phrase them so that a player could say: ‘I should have seen that, because Fact X + Claim Y can’t both be true.’”

---

## 6. Keep KOA Dialogue Flavorful but Non-Solving

Pattern from logs:
- Players like KOA’s tone (opening line is often quoted) but report that:
  - KOA’s lines rarely drive deduction (“KOA’s responses influenced my thinking: 3/7”).
  - They lean on facts and card claims, not KOA, to find lies.

Generation rule:
- KOA barks should:
  - Echo axes like *timeline, coherence, channel_reliance* without stating “this is a lie”.
  - Provide emotional feedback and theme, not direct hints about truth/lie.
- If KOA ever **fully explains** a contradiction, treat that as a rare payoff, not a routine hint.

LLM prompt hint:
- “Write KOA reactions that reference what the player just played (timeline, consistency, channel, etc.) but never explicitly state that a card is a lie or tell the player what to play next.”

---

## 7. Content Variety Is Critical for Longevity

Pattern from logs:
- Multiple personas say they would play “as long as puzzles stay fresh” and ask for:
  - More scenario variety (different suspicious incidents).
  - Different lie patterns (not always the same kind of contradiction).

Generation rule:
- Across a **set of puzzles**, vary:
  - Incident type (printer, garage, thermostat, cameras, smart speakers, etc.).
  - Which evidence types are “dangerous” (not always DIGITAL).
  - Which lie patterns appear (direct vs relational vs self-incriminating, etc.).

LLM prompt hint:
- “When generating a batch of puzzles, avoid repeating the same scenario template or the same lie pattern more than a couple of times. Rotate which evidence types and lie flavors are risky.”

---

## 8. Break Simple Meta-Strategies (e.g., “Always Avoid High Strength”)

Pattern from logs:
- Suspicious personas often succeed by **refusing to play the highest-strength cards**, since lies are frequently the strongest DIGITAL evidence.
- Several runs comment that this worked well here, but might become predictable if lie strengths always sit at the top.

Generation rule:
- Across puzzles, sometimes:
  - Place at least one lie at **moderate strength (3–4)** while a high-strength card is actually a safe truth.
  - Make a high-strength truth clearly supported by Known Facts, so avoiding it is a mistake.
- The goal is to ensure “always avoid high strength” is **sometimes punished**, not a dominant long-term policy.

LLM prompt hint:
- “Do not always assign lies to the highest-strength cards. In some puzzles, make a high-strength card a well-supported truth and hide a lie at a more moderate strength so that blindly avoiding high strength can backfire.”

---

## 9. Add a Simple Epilogue / Resolution Hook

Pattern from logs:
- Several players say they **don’t know who actually did it** or what exactly happened, even after the lie reveal, and explicitly ask for a short explanation.
- Example: midnight-drive run wants a brief “who drove the car?” epilogue.

Generation rule:
- For each puzzle, consider adding a **1–3 sentence epilogue** (not shown until after the lie reveal) that:
  - States what actually happened in-world, and
  - Connects that outcome to at least one Known Fact + card claim.
- This is optional per-puzzle content, but when present, it should **reinforce the deduction model**, not contradict it.

LLM prompt hint:
- “After you define the puzzle, write a 1–3 sentence epilogue that explains who actually did the suspicious thing and how the final truth/lie configuration makes sense, without introducing new contradictions.”

---

## 10. Plan for Mixed Difficulty (Including a “Hard Mode” Feel)

Pattern from logs:
- Methodical and Intuitive personas explicitly ask for **harder puzzles**:
  - More subtle lies that don’t directly contradict Known Facts.
  - Cross-card-only contradictions that expose persona weaknesses.
- Many runs say they would play “as long as puzzles stay fresh,” especially if there’s a sense of **escalation or hard mode**.

Generation rule:
- When generating a **set** of puzzles, deliberately vary:
  - How many lies are “clean contradictions” vs “synthesis-only” per puzzle.
  - How tight the target is relative to the best all-truth line.
- Consider tagging puzzles with a simple difficulty label (e.g., `easy`, `standard`, `hard`) based on:
  - How many lies are purely relational/self-incriminating.
  - How narrow the margin between target and best line is.

LLM prompt hint:
- “Generate a mix of `easy`, `standard`, and `hard` puzzles. For hard puzzles, ensure at least one lie can only be detected by cross-referencing cards, and keep the target close enough to the best line that players must find near-optimal play to win.”
