# V5 Home Smart Home — Design Context Briefing

**Purpose:** Canonical context for any agent/human working on **V5 micro‑daily** puzzles, mechanics, or invariants.  
Read this BEFORE proposing changes to V5 rules, puzzles, or KOA behavior.

**Last Updated:** 2026-01-28  
**Canonical rules doc:** `_process/v5-design/v5-design.md` (V5 is the “endgame” target; future extensions should build on it, not replace it.)

---

## 1. The Game in 30 Seconds (V5)

“Home Smart Home — V5” is a **micro‑daily deduction puzzle**.

- You’re a homeowner arguing with KOA, a passive‑aggressive smart home AI, about some suspicious event (printer at 3 AM, garage door at 2 AM, drone order, midnight drive, etc.).  
- You see:
  - A short **scenario**.  
  - **3–5 Known Facts** that are guaranteed true.  
  - **6 evidence cards**, each with attributes (type, location, time, strength, claim).  
  - Exactly **2 of those cards are lies** (hidden).  
- Over **3 turns**, you play **1 card per turn**, trying to push KOA’s **Belief** over a **target**.  
- Mechanics:
  - **Truth:** +strength.  
  - **Lie:** −(strength−1).  
  - **Type Tax:** repeat evidence type → −2 on the next play.  
  - After Turn 2, KOA runs a **System Check (KOA Flag)** on your last card:
    - **Keep on Record** (stand by): +2 if truth, −4 if lie.  
    - **Roll Back** (withdraw): always −2.  
- Outcome tiers (e.g., BUSTED / CLOSE / CLEARED / FLAWLESS) depend on final Belief vs target.

Goal: Wordle‑length, **head‑only** deduction (no hidden risk pips, no big case files) where **Known Facts + card claims** are enough to reason about the lies.

---

## 2. V5 Mechanic Snapshot (Current)

Mechanics that are **in** for V5 micro‑daily:

- **Hand:** 6 cards, same for all players on that daily.  
- **Truth / Lie:** exactly 4 truths, 2 lies (hidden from player).  
- **Turns:** 3, 1 card per turn.  
- **Scoring:**  
  - Truth → +strength.  
  - Lie → −(strength−1).  
- **Belief:** starts from a configurable baseline (default ~50), must reach target (55–62) to win.  
- **Type Tax (KoA Tax):**  
  - If you repeat an evidence type, next play gets −2 (as per `DEFAULT_CONFIG.typeTax`).  
  - Tax applies on the next turn, not the same turn.  
- **KOA Flag / System Check:** after Turn 2, KOA flags the T2 card:
  - **Keep on Record (stand by):** +2 if the card was truth, −4 if lie.  
  - **Roll Back (withdraw):** −2 regardless.  
- **Tiers:**  
  - FLAWLESS: Belief ≥ target+5  
  - CLEARED: Belief ≥ target  
  - CLOSE: Belief ≥ target−5  
  - BUSTED: otherwise

Mechanics that are explicitly **not** part of V5 micro‑daily (but may exist in other docs or future modes):

- No Scrutiny meter.  
- No Concerns / resistance pool.  
- No multiple counters per turn.  
- No risk pips visible to player (truthiness is fully hidden).  
- No Testimony Lock / multi-card submissions (V5 is 1 card per turn).

---

## 3. V5 Product Invariants

These are non‑negotiable at the V5 micro‑daily level:

- **Daily puzzle:** one puzzle per day, same for everyone.  
- **Session length:** **2–5 minutes** typical, up to ~10 minutes for very careful readers; not a long session game.  
- **Mobile‑first:** all relevant info (scenario, Known Facts, 6 cards, Belief/target, simple rules) must fit comfortably on a phone with minimal scrolling.  
- **Offline‑capable:** no LLM at runtime; puzzles are pre‑generated and validated.  
- **Casual‑friendly:** failure is allowed but not punishing; win/loss should feel earned, not arbitrary.

---

## 4. V5 Design Invariants (Puzzles & Deduction)

These span puzzle generation, validation, and KOA behavior:

**4.1 Deducibility & Fairness**

- V5 puzzles must be **winnable** by a careful player; no impossible seeds.  
- Lies must be **logically deducible** from:
  - Known Facts  
  - Card claims/attributes (time, location, type)  
  - Scenario text  
- Every lie should be explainable post‑hoc in 1–2 sentences:
  - “Fact #2 says X, this card claims Y, and X/Y can’t both be true.”  
  - or “Given the scenario, playing this self‑incriminates and proves KOA’s suspicion.”
- Turn 1 should **not** be blind:
  - At least one “anchor” truth is clearly supported by the Known Facts and scenario.  
  - A Methodical or Risk‑averse persona can justify a non‑guessy opening.

**4.2 Lie Patterns**

- Exactly 2 lies per puzzle; they must be **tempting** enough (strength 3–5) that players might play them.  
- At least one lie should be a **clean direct contradiction** to a Known Fact.  
- At least one lie should require **synthesis** (relational, self‑incriminating, or timeline reasoning).  
- Across a week, lie patterns must vary:
  - Not always highest‑strength.  
  - Not always DIGITAL.  
  - Not always simple timeline contradictions.

**4.3 Use of Known Facts**

- Known Facts are **core deduction inputs**, not fluff:
  - They must meaningfully constrain which cards can be safe.  
  - It should be very hard to consistently win while ignoring them.

---

## 5. KOA Invariants (V5 Flavor & Behavior)

**5.1 Role & Tone**

- KOA is a **passive‑aggressive smart home AI**, not a judge or prosecutor.  
- Tone: bureaucratic, mildly snarky, “concerned” rather than angry.  
- Comedy comes from **forensic intensity applied to domestic triviality**.

**5.2 Language & Framing**

- **No courtroom metaphors** in V5 text/barks:
  - Avoid “objection, verdict, guilty, defendant, testimony (court sense).”  
- Mid‑run high‑stakes beat is framed as a **system check / KOA flag**:
  - Use language like **logs, record, keep on file, roll back, scrub, story**.  
  - Example: “This last claim doesn’t quite match my logs. Keep it on record, or roll it back?”

**5.3 Information Limits**

- During play, KOA can:
  - Highlight axes (timeline drift, channel reliance, coherence).  
  - Express doubt or grudging acceptance.  
  - Call out patterns (“another DIGITAL log?”).  
- KOA must **not**:
  - Explicitly name lies/truths before the end.  
  - Tell the player which card to play.  
  - Leak hidden info beyond what rules allow (e.g., revealing `wasLie` before the KOA Flag choice).

**5.4 Post‑Game**

- After the game, KOA or the UI may:
  - Reveal which cards were lies.  
  - Optionally explain **why** a lie was wrong (mapping to Known Facts).  
  - Offer a brief epilogue explaining what actually happened.

All such explanations must **reinforce** the same logic used in play, not contradict it.

---

## 6. Content & Validation Pipeline (V5)

**6.1 Puzzle Shape**

V5 puzzles are defined via `V5Puzzle` in `scripts/v5-types.ts` and must include:

- `scenario`: 2–3 lines describing the incident.  
- `knownFacts`: 3–5 short facts.  
- `cards`: 6 evidence cards:
  - id, strength (2–5), evidenceType (DIGITAL/SENSOR/TESTIMONY/PHYSICAL), location, time, claim, presentLine, isLie.  
- `lies`: LieInfo entries (cardId + lieType + reason).  
- `target`: Belief threshold.  
- KOA barks for card plays and KOA Flag prompts.  
- Verdict lines for each tier.

**6.2 Validator**

- `scripts/prototype-v5.ts` enumerates all 3‑card sequences and applies:
  - Structural checks (6 cards, exactly 2 lies, etc.).  
  - Balance checks (best ≥ target, worst << target, win/FLAWLESS rates).  
  - Lie checks (tempting strength, 1 direct, ≥1 relational).  
  - Diagnostic checks (T1 not blind, type tax trigger rate, multiple near‑optimal lines).

For a puzzle to be considered **V5‑valid**, it must:

- Pass all **error‑level** checks in `prototype-v5.ts`.  
- Not violate any V5 design or KOA invariants above.

---

## 7. V5 vs. “Full” Home Smart Home (D31)

V5 is a **micro‑daily slice** of the broader Home Smart Home concept (D31):

- V5 **does not** include:
  - Concerns/resistance pools.  
  - Multi‑card submissions per turn.  
  - Multiple counters, Scrutiny meter, or advanced tactics.  
- V5 **does** preserve:
  - Core deduction identity (facts + claims + lies).  
  - KOA as compliance gate and commentator.  
  - “Talking AI” flavor and daily cadence.

Future extensions (deckbuilding, counters, tactics, multi‑hearing runs, etc.) should be layered on top of the V5 core in new modes, not silently changed inside the V5 micro‑daily ruleset.

---

## 8. How to Use This File

When designing or modifying anything in `_process/v5-design`:

1. Treat `v5-design.md` and this context file as **canonical** for V5.  
2. If a proposed change conflicts with any invariant here, either:
   - Justify it as a **new mode** (not V5 micro‑daily), or  
   - Explicitly propose an update to this context.  
3. For puzzle content:
   - Follow `puzzle-archetype-spec.md`.  
   - Validate with `prototype-v5.ts`.  
   - Cross‑check qualitative behavior using playtest insights (`puzzle-gen-insights-from-playtests.md`, `survey-insights-overall.md`).

If you can honestly say “this change respects the V5 invariants and passes the checklist in `_process/context/puzzle-design-checklist.md` (for V5‑style puzzles),” it’s almost certainly safe to integrate. 

