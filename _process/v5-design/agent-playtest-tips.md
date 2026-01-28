Yes—if you’re using a headless playtest engine (especially with LLM agents), you want it to do **three jobs**:

1. **reproducible evaluation** (same seed ⇒ same transcript)
2. **mechanic diagnostics** (why did it feel blind / why did it get solved)
3. **content pipeline gating** (reject bad dailies automatically)

Here are the highest-leverage tips.

---

## 1) Make the harness determinism-first

Even if the *game* is deterministic, your *test* can accidentally be noisy.

* Log **seed**, **puzzle slug**, **flags**, **agent version**, and **full action log**.
* Produce a **single JSON artifact per run**: inputs → actions → per-turn deltas → final verdict.
* Any “banter” selection should be deterministic (no `Math.random()` in runtime text if it’s part of what agents see).

Why: without this, you can’t tell if a change improved the game or just changed sampling noise.

---

## 2) Separate “perfect information” vs “player information” evaluation

You need two evaluators:

### A) Oracle solver (perfect info)

Used for content QA:

* enumerate / search best lines given ground truth (lies known)
* yields: optimal score, optimal line count, “how many near-optimal lines exist”

### B) Player-model solver (limited info)

Used for fun/feel QA:

* the agent only sees what a human sees (cards, stance, hint, previous reveals/tells)
* evaluates: *does Turn 1 have any rational basis?*

If Oracle says “great puzzle” but Player-model says “blind T1,” your info flow is broken—not your scoring.

---

## 3) Instrument the game like a systems designer

Per turn, log a structured breakdown:

* chosen cards
* base score
* combos fired + why
* pressure applied + why
* objection result (if any)
* reveal outcomes (truth/lie)
* KOA tells shown (axis tags)

Then compute diagnostics like:

* **T1 regret**: (best possible given info at T1) − (chosen line expected value)
* **EV gap** between top 3 candidate moves at each turn (if huge, decision is sharp; if tiny, it’s mushy)
* **policy convergence**: do most agents pick the same opening? (your report shows yes)

This tells you *what* is going wrong: lack of signal, dominant heuristic, or flat decision landscape.

---

## 4) Add “signal quality” metrics for hints/tells (so they don’t become an oracle)

You want a hint to provide *orientation*, not the solution.

Practical way to measure:

* Compute how much the opening hint reduces the oracle search space.

  * Example: compare best achievable score distribution **with hint** vs **without hint**, under a player-model that uses the hint.
* Track whether hint correlates with “avoid these specific cards.”

  * If your hint effectively points at specific IDs/features that always map to lies, you’ll get formulaic play.

Goal: hint should change *strategy archetype* (“play for coverage vs reinforcement”), not identify lies.

---

## 5) Build a small “agent zoo” to avoid overfitting

If you only test with one LLM prompt, you’ll tune to that prompt.

Have 4–6 cheap baselines:

* random
* greedy immediate score
* greedy expected value (assume lie probability priors)
* risk-averse (maximize worst-case)
* pattern-seeker (overweights narrative coherence)
* “combo hunter” (your current failure mode)

If **all** of them call T1 blind, it’s real. If only combo-hunter fails, you’ve got a balance issue.

---

## 6) Gate dailies with hard accept/reject rules

Before publishing a daily, auto-check:

* **Win-rate band** under player-model agents (e.g., 25–45% for “standard,” 10–20% for “hard”)
* **No dominant opening**: top opening pick frequency < X% across the agent zoo
* **Non-trivial near-optimality**: at least N distinct lines within 1–2 points of best (replayability)
* **Order matters** (if pressure is on): order variance > threshold
* **No dead mechanics**: type echo triggers in at least some viable lines (or don’t enable it)

This is how you scale content with LLM generation without shipping junk.

---

## 7) Make the engine output “why it was fun/boring” summaries

After each run, generate a short structured postmortem (not prose):

* `blindness_score` (T1 EV spread + regret)
* `dominant_policy_detected` (bool + description)
* `mechanics_used` (which combos/pressure rules actually mattered)
* `difficulty_class` (easy/standard/hard)
* `replayability_index` (near-optimal line count + entropy)

This becomes your daily ops dashboard.
