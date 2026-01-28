# V5 Playtest-1 Survey Insights — Overall (LLM Personas)

Source: `_process/v5-design/playtest-1/logs/*.md`  
Personas: Literal, Suspicious, Methodical, Intuitive  
Puzzles: midnight-print, garage-door, midnight-drive, drone-order, midnight-print variants

This file synthesizes **all** major learnings from the LLM persona surveys: game design, UX, KOA, progression, and product/market. For puzzle-generation-specific rules, see `puzzle-gen-insights-from-playtests.md`.

---

## 1. Deduction Quality & Fairness

- Across personas, ratings for **“solving a puzzle, not guessing”** and **“win/loss felt earned, not lucky”** are consistently high (5–7).  
- Methodical, Suspicious, and Intuitive personas repeatedly point to:
  - Clean contradictions between **Known Facts and card claims** as their main deduction anchors.
  - Additional “harder” lies that require **cross-card or scenario-based reasoning** as desirable, especially for harder puzzles.
- Literal personas often treat Known Facts as context rather than tools; when they lose, they blame **missed contradictions**, not randomness.
- Players say they would stop playing if:
  - Lies feel **random or unfair** (not deducible from the provided facts and claims), or
  - Lie patterns become **predictable** (always high-strength, always timeline, always DIGITAL).

Implications:
- Maintain strict **deducibility**: every lie must be explainable post hoc via clear Fact/claim conflict(s).  
- Vary lie patterns (direct contradictions vs relational/self-incriminating/timeline) across puzzles to prevent formulaic solving.

---

## 2. Mechanics: Type Tax, Objection, Difficulty

**Type Tax**
- Universally understood and actively managed: players almost always sequence to **avoid tax** (e.g., TESTIMONY → DIGITAL → SENSOR).  
- In most runs, type tax is a **sequencing constraint** more than a deep strategic tradeoff; players rarely feel “forced” to eat -2 for a clearly superior card.

**Objection**
- Objection is repeatedly described as the **most tense, memorable moment**.  
- The +2 / -4 vs guaranteed -2 feels like a **real risk-reward fork**.  
- In the CLI playtests, revealing `wasLie` before objection removes real risk; players correctly call this out as undermining tension.

**Difficulty & Tiers**
- Difficulty is generally perceived as **fair**: target reachable but not trivial.  
- Many runs mention finishing **1 point shy of FLAWLESS**, and explicitly ask for:
  - A **“near miss” indicator** (e.g., “You were 1 point from FLAWLESS”) to heighten drama.  
- Players want **mixed difficulty**:
  - Some “tutorial-feel” puzzles with obvious contradictions.  
  - Some harder puzzles with subtler, purely relational lies and tighter targets.

Implications:
- Keep type tax as a light sequencing mechanic, but design some puzzles where optimal play **intentionally eats tax once** for a strong, well-supported truth.  
- In the real product, **hide `wasLie` until after objection** to preserve risk.  
- Consider adding:
  - A near-miss banner when a player is very close to a higher tier.  
  - Explicit difficulty labels or bands (easy/standard/hard) in content planning.

---

## 3. Personas: How They Really Play

**Methodical**
- Enumerates Known Facts, checks each card against them, categorizes SAFE / SUSPICIOUS / DANGEROUS, and sequences to avoid tax.  
- Often requests **harder puzzles** with relational lies and cross-card contradictions; finds puzzles with two direct contradictions “too clean.”

**Suspicious**
- Defaults to **“avoid strongest DIGITAL, avoid self-incriminating”** and is currently very effective with that heuristic.  
- This exposes a meta risk: if lies are frequently the strongest or the most conveniently exonerating DIGITAL cards, “never trust high-strength DIGITAL” becomes dominant.

**Intuitive**
- Plays by narrative and vibe but still references specific Fact–card conflicts when explaining choices.  
- Loves the emotional arc: intrigued → tense → vindicated; values KOA’s personality and the lie reveal.

**Literal**
- Understands rules, but treats Known Facts as flavor; often picks by strength and misses contradictions.  
- After losing, explicitly asks for **more explicit highlighting** (timestamps, locations, or mapping lies back to facts) to understand mistakes.

Implications:
- The design is working for Methodical/Suspicious/Intuitive; Literal personas highlight where **teaching and accessibility aids** could help.  
- To prevent Suspicious meta from dominating long-term, ensure some puzzles:
  - Place lies at **moderate strength**, and  
  - Make at least one high-strength DIGITAL card a clearly safe truth supported by multiple facts.

---

## 4. KOA & Narrative (Single Puzzle and Over Time)

- KOA is consistently recognized as a **real character**; the passive-aggressive smart home tone lands well.  
- Opening lines are frequently quoted as memorable; KOA is often called the game’s **“secret sauce.”**  
- However, players rarely use KOA lines for deduction; they rely primarily on Facts and card claims.
- Many players ask for **short epilogues** explaining what actually happened (e.g., “Who drove the car?” “What really happened with the garage door?”).
- Some suggest **ongoing KOA arcs**:
  - Seasonal KOA moods.  
  - KOA referencing past puzzles or the player’s habits.

Implications:
- Keep KOA as **flavor + axis spotlight**, not a solver:
  - Use dialogue axes (timeline, coherence, channel_reliance) to comment on patterns and tension.  
  - Avoid direct adjudication (“this card is a lie,” “play X next”).  
- Add an optional **epilogue** per puzzle (1–3 sentences) revealed after lie reveal, explaining what truly happened and how the facts fit.  
- Plan for light **KOA progression** over weeks: mood shifts, recurring themes, occasional callbacks to past play.

---

## 5. Learning, Hints, and Teaching Moments

- Many players specifically want to **learn from mistakes**, not just be told win/loss:
  - “Show exactly which Known Fact each lie contradicted.”  
  - “Highlight when a card’s claim directly contradicts a Known Fact (maybe only after the game).”
- There’s appetite for **post-game explanation**:
  - How each lie could/should have been caught.  
  - Why a strong, tempting card was actually a trap.
- A suggested mechanic: **“confidence marking”** — before playing, flag cards you believe are lies and get rewarded if correct, emphasizing deduction over safe play.

Implications:
- Add an optional **teaching layer** after each puzzle:
  - Map each lie to the specific Known Facts it contradicts.  
  - Briefly explain any relational/self-incriminating logic.  
- Keep the base game invariant (KOA doesn’t adjudicate during play), but expose a **hint/teach mode** that strengthens KOA’s role as post-game tutor for players who want it.

---

## 6. Progression, Variety, and Structure

- A dominant theme: players will keep playing **“as long as puzzles stay fresh.”**  
- They explicitly call out reasons they’d stop:
  - Repetitive scenarios.  
  - Predictable lie patterns (e.g., “highest strength is always a lie,” “always timeline contradictions”).  
  - Lies that feel random or not deducible.
- Desired progression features:
  - **Mixed difficulty** across days, including explicit harder puzzles.  
  - Occasional **“hard mode”** puzzles with subtler lies.  
  - **Streaks, daily challenges, weekly campaigns** to create a sense of ongoing structure.

Implications:
- In content planning:
  - Vary incident types (printers, garage doors, thermostats, cameras, drones, etc.).  
  - Rotate which evidence types and lie patterns are risky.  
  - Intentionally design easy/standard/hard profiles and schedule them.
- Consider lightweight meta:
  - Streak tracking.  
  - “Hard puzzle days” or weekly themed packs.  
  - Seasonal KOA personality shifts.

---

## 7. Product, Market, and Monetization

**Format & Platform**
- Strong preference for **daily puzzle** format; many also like the idea of **campaign weeks** layered on top.  
- Expected channels: **mobile app store** and **web browser**; preferred device is overwhelmingly **phone**.

**Session Length**
- Most runs report **2–5 minutes** of felt playtime (occasionally 5–10 with careful reading).  
- This is widely viewed as **“just right”** for daily play.

**Willingness to Pay**
- One-time purchase:
  - Most responses cluster at **$2.99–$4.99** as a fair price.  
- Subscription:
  - Acceptable range: **$0.99–$1.99/month**.  
  - Justified only if it includes:
    - New puzzle every day.  
    - Periodic story campaigns.  
    - Ad-free experience.
- Season pass:
  - Some willingness to pay **$9.99 for 3 months**, but only if pitched as a **season of curated content**, not generic access.

**Why They’d Stop Paying**
- Repetitive or stale scenarios.  
- Lie patterns that become formulaic.  
- Puzzles feeling unfair or random.  
- KOA dialogue becoming repetitive.

Implications:
- Position the game as a **Wordle-like daily deduction puzzle** with optional story seasons.  
- Monetize primarily as:
  - Low-friction one-time purchase, or  
  - Low-cost sub/season pass tied clearly to daily content + campaigns + no ads.  
- Anchor retention strategy on **content freshness + deducibility**, not just streak mechanics.

---

## 8. Social & Shareability

- Sharing likelihood is moderate (~4–5/7): players will share **specific moments**, not routine results.  
- What they want to share:
  - Funny or sharp KOA lines.  
  - Wild lie reveals (“the strongest card was a lie”).  
  - Particularly clever deductions they’re proud of.  
  - Occasionally a great FLAWLESS run.

Implications:
- Design social surfaces around **moments**, not just scores:
  - Shareable KOA quotes.  
  - “Look at this contradiction” snapshots.  
  - “Today’s lie reveal” scenes.

---

## 9. Summary: High-Level Design Invariants From Surveys

Across all personas and puzzles, the surveys reinforce a few core invariants:

- **Deducible, not random:** Every lie must be discoverable from Known Facts + claims; randomness is a deal-breaker.  
- **Varied but fair:** Lie patterns, incidents, and difficulty must vary to prevent formulaic play, while staying logically fair.  
- **KOA as flavor + tutor (optional):** KOA should frame, react, and (optionally) teach, but never adjudicate in real time or override mechanics.  
- **Daily fit:** 2–5 minute puzzles, phone-first, daily cadence, with freshness and occasional campaigns.  
- **Learning loop:** Players want to understand *why* they were right or wrong; post-game explanations and lie–fact mapping are valuable.  
- **Meta without grind:** Streaks, hard days, and near-miss feedback add excitement, but the game’s core value is in daily deduction, not grinding numbers.

These survey-derived invariants should guide both **game evolution** and **LLM-driven content generation/QA**, alongside the formal archetype spec and validator. 

