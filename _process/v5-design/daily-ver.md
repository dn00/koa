Below is a **complete, build-ready spec** for the **Daily Puzzle** mode of the redesign (the “micro-trial” version). It’s written as a contract: what the player sees, what the engine does, what the generator must output, and what your validator must enforce.

---

# KOA TRIALS — Daily Puzzle Spec v1

## 0) Product intent

A daily puzzle is a **seeded 3-hearing incident** (2–5 minutes) where the player convinces KoA to grant an override (“Access Granted”) by presenting **credible diagnostic artifacts** under scrutiny. No typing required; only card/choice inputs.

Daily must be:

* **fair** (Turn 1 not blind)
* **learnable** (≤5 “in-head” rules)
* **replayable** (multiple near-optimal lines + optional personal loadouts)
* **spoiler-safe shareable**

---

## 1) Player-facing loop

### Run length

**3 Hearings** (Turn 1–3)

### Turn structure (each hearing)

1. **KoA stance reminder** (1 line, axis framing)
2. Player action:

   * **submit 1 Evidence card** *(required)*
   * optionally **play 1 Tactic card** *(if Personal Daily is enabled; Standard Daily may disable tactics or use a fixed mini-kit)*
3. Engine resolves:

   * update Belief/Scrutiny
   * apply counters/pressure
   * KoA reacts (slot-based bark)
4. After Hearing 2: **The Objection** (mandatory dramatic beat)

### Win / lose

* You “win” if after Hearing 3: **Belief ≥ Threshold**
* You always get a **Verdict Tier** + **Share Card**, even if you “lose.”

---

## 2) The only two public meters (keep it clean)

### Belief (progress)

* Range: 0–100
* Win target: **Threshold** (default 70, tuned per difficulty)

### Scrutiny (danger)

* Range: 0–10
* Represents how aggressively KoA punishes patterns and triggers counters.
* Scrutiny is visible (bar + small “why” tooltip list of recent causes).

> Design principle: **Visible risk ≠ visible truth.** Scrutiny is about KoA behavior, not “this card is a lie.”

---

## 3) Cards

## 3.1 Evidence cards (generated daily)

Daily case provides **8 Evidence** cards. Player will play 3 (one per hearing) and leave 5 unused.

Evidence cards are *not* the player’s deck.

**Visible fields**

* id
* claim (1 sentence)
* attributes: `type`, `location`, `time`, `source`
* strength (1–10)
* risk pips (1–3) = *scrutiny propensity* (NOT “lie probability”)

**Hidden fields (for engine + validation)**

* truthiness tag: `TRUTH | LIE | SHAKEY_TRUTH` (optional middle state for spicy days)
* axis tags: e.g. `timeline`, `coherence`, `channel`, `plausibility`
* contradiction edges (graph): links to other evidence and/or “Known Facts”

### Known Facts (no case file)

At top of daily, show **3–5 Known Facts** bullets. These are the “public record.”
Evidence may:

* corroborate facts
* contradict facts
* be orthogonal

This is what makes Turn 1 reasoned without a dossier.

---

## 3.2 Tactic cards (player collection, optional in Daily)

Tactics are how you add deckbuilding later without rewriting daily.

Daily has two modes:

### Standard Daily (fairness-first)

* Everyone gets the same **Fixed Mini-Kit** of 3 tactics (or tactics disabled).
* Leaderboard uses this mode.

### Personal Daily (progression)

* Player chooses a **Loadout of 5 tactics** from collection.
* Each hearing: offered **2 random tactics from loadout**, choose up to 1 to play.

**Tactic categories (keep to 3)**

1. **Signal** (get information at a cost)
2. **Control** (change how scoring/scrutiny applies)
3. **Protect** (mitigate punishment / bank value)

---

## 4) Scoring model (minimal, legible)

### 4.1 Evidence resolution

When you submit an Evidence card:

* If TRUTH: add **+strength** to Belief
* If LIE: add **-(strength-1)** to Belief
* If SHAKEY_TRUTH: add **+(strength-2)**, but increases Scrutiny more (optional)

### 4.2 Scrutiny changes

Scrutiny increases by:

* evidence risk pips (base)
* pattern triggers (KoA counters)
* certain tactics (signal is “expensive”)

Scrutiny decreases by:

* protective tactics
* “variety” / “corroboration” patterns (if you want, later)

### 4.3 Tempo rule (kills “always play safe”)

Each hearing has a minimum Belief gain expectation:

* Hearing 1: need at least **+6**
* Hearing 2: at least **+6**
* Hearing 3: no tempo gate (final)

If you fail tempo in H1 or H2:

* KoA applies **Tempo Penalty**: +2 Scrutiny immediately OR -3 Belief (pick one globally)

This single rule prevents “play only low-risk low-strength” dominance.

---

## 5) KoA opponent model (pressure without complexity)

KoA has **Stance of the Day**:

* 1–2 watched axes (ex: `channel_reliance`, `timeline_drift`)
* a counter profile (what gets punished)

### Counter triggers (examples)

Keep it to **2 counters** in Daily v1:

1. **Channel Reliance**

* Trigger: play same `type` twice across H1/H2
* Effect: +1 Scrutiny and a suspicion bark

2. **Rehearsed Strength**

* Trigger: play a high-strength card while Scrutiny already high (e.g., strength ≥9 and Scrutiny ≥6)
* Effect: immediate -2 Belief (or +2 Scrutiny), plus bark

These are learnable and create I3 “non-obvious optimum” moments.

---

## 6) KOA Flag / System Check (the dramatic beat)

After Hearing 2, KoA flags your **highest-strength submitted evidence** so far for review.

Player chooses:

* **Keep on Record** (stand by)

  * if challenged evidence TRUTH: +2 Belief
  * if LIE: -4 Belief
* **Roll Back** (withdraw)

  * always: -2 Belief, -2 Scrutiny

This does two things:

* adds a meaningful mid-run commitment decision
* creates replayability via different risk profiles

---

## 7) Dialogue system (V5)

### Slots (Daily)

1. `OPENING_SIGNATURE` (optional 1 per puzzle)
2. `OPENING_STANCE` (axis framing)
3. `AFTER_HEARING_REACTION` (after each hearing)
4. `PRESSURE_CALLOUT` (only if a counter/tempo hits)
5. `FLAG_PROMPT`
6. `FLAG_RESOLVE`
7. `FINAL_VERDICT`

### Tags

* axis: `timeline | coherence | channel | plausibility | tempo`
* valence: `praise | neutral | suspicion | warning`
* intensity: `1|2|3`
* event: `tempo_fail | counter_trigger | big_gain | big_loss | stand_by_truth | stand_by_lie | withdraw`

### Selection

`line = library.pick(slot, tags, seed)`

**Hard banlist** for dialogue (to prevent hint leaks)

* no card ids
* no unique attribute references that point to a single card (“the kitchen one at 10:41”)
* no prescriptions (“next time play…”)
* no certainty on truth (“that’s false”) except in the KOA Flag resolution *after* player commits, and only if that card was actually a lie

---

## 8) Share card (spoiler-safe)

Share string includes:

* daily title
* mode (Standard/Personal)
* hearing icons:

  * ✓ = truth played
  * ✗ = lie played
  * ⚠ = tempo/counter triggered
  * ! = objection event
* tier + Belief/Threshold
* one KoA verdict quip

No lie IDs, no unplayed reveal.

Example:
`✓ ⚠ ✓ ! ✗ — CLOSE (68/70)`

---

## 9) Difficulty modes (still “daily,” still same case)

### Standard

* Threshold: 70
* Tempo: on
* Counters: 2
* Scrutiny cap: 10

### Hard (subscriber)

* Threshold: 75–80
* Tempo stricter OR penalty harsher
* Counters: 3 (adds “timeline drift”)
* Objection penalty worse for standing by a lie

Same evidence set; just different KoA posture.

---

## 10) Generator contract (LLM output + deterministic validation)

### LLM must output

* scenario (2 lines)
* 3–5 Known Facts
* 8 Evidence cards (claims + attributes + strength + risk pips)
* hidden truthiness tags
* hidden contradiction edges (graph)
* stance of the day (watched axes)
* optional signature opening line

### Deterministic validator must enforce (ship gates)

1. **No-blind Turn 1**

   * using only Known Facts + stance + visible attributes, there must be >1 rationally distinct opener (not all equivalent EV)
2. **Non-obvious optimum**

   * “always pick risk-1” cannot dominate across simulated policies because tempo/counters punish it
3. **Double-edged tells**

   * KOA reactions must be explainable by ≥2 hypotheses (lie vs axis trigger, etc.)
4. **Multiple near-optimal lines**

   * at least N lines within 1–2 Belief of best
5. **Share safety**

   * share output never leaks solution

---

## 11) Onboarding (fast)

First run ladder:

1. Training daily: tempo off, counters off, objection off
2. Normal daily: tempo on, counters on, objection on

Rules text on one screen (6 bullets max).

---

# Defaults I recommend for v1 shipping

* **1 evidence per hearing** (not 2) for daily speed + clarity
* Standard Daily uses either **no tactics** or a fixed mini-kit of 3
* Personal Daily adds loadout (5 tactics) later as progression


--


Yes in spirit (KoA slot-barks + Objection beat), but **not fully** in the way we discussed for “lawyer energy” — the spec as written needs one explicit layer:

* **YOU narration per play**
* **Cumulative stitched statement**
* **KoA responds to that statement**, not just the mechanics

Here’s the missing piece, cleanly integrated into Daily v1 without exploding authoring.

---

## Add this to the Daily spec: “Statement Stitcher” banter loop

### What the player hears each hearing

Per hearing you output:

1. **YOU (presenting evidence)** — 1–2 lines
2. **KOA (reacting)** — 1 line (slot/tag library)
3. (Optional) **KOA Pressure Callout** — 1 short line if a trigger fired

That’s the back-and-forth.

---

## Evidence card fields (add 2)

Each Evidence card has:

* `claim` (the artifact’s content)
* `presentLine` (what YOU say when submitting it)
* `supportLine` (optional second sentence for extra flavor / clarity)

Example:

* claim: “Router logs show reboot at 10:41 PM.”
* presentLine: “The router rebooted at 10:41. That’s a known failure mode.”
* supportLine: “If the network was down, those camera gaps stop looking suspicious.”

These are generated per puzzle (O(n) = 8 lines).

---

## Cumulative narration (the “lawyer energy”)

Maintain a `StatementSoFar` with 2–3 “beats” (not a wall of text).

### Data model

* `beats: string[]` (max 3)
* `dominantAxes: Axis[]` (for KoA to react to)
* `stanceConflicts: Axis[]` (for double-edged barks)

### On each hearing:

* Append 1 beat derived from the evidence’s axis tags.
* If >3 beats, compress (drop oldest or merge via template).

### Output example across 3 hearings

**H1 YOU:** “The router rebooted at 10:41. That explains the camera gap.”
**KOA:** “Convenient explanation. Keep going.”

**H2 YOU:** “Door lock logs show no exit after 10:30. The timeline holds.”
**KOA:** “You’re building a story. I’m watching for gaps.”

**H3 YOU:** “And the device health report shows the sensor drift started yesterday.”
**KOA:** “That’s… annoyingly coherent.”

This feels like constructing an argument, even with 1 card per turn.

---

## “Link Phrases” library (small, global, reusable)

Instead of pair narrations, you keep a library of 30–60 connective templates keyed by tag relations:

* `reinforce_axis` (“Which supports the timeline…”)
* `cover_new_axis` (“And separately…”)
* `resolve_contradiction` (“That would be a problem—unless…”)
* `admit_uncertainty` (“I can’t prove motive, but I can prove location.”)

Engine picks one based on:

* last axis vs new axis
* whether contradiction edges are implicated
* current scrutiny

This gives you the “combined argument” feel **without O(n²)**.

---

## KoA reaction tags should reference the *statement*, not the card

Update your dialogue tags:

* `axis` comes from (a) the played evidence and (b) the current `StatementSoFar`
* `event` includes `story_coherence_rising`, `overfit_single_axis`, `tempo_stall`, etc.

So KoA barks like:

* “You keep steering back to the network.”
* “Your timeline’s tight… too tight.”

Still no card IDs. Still no spoilers.

---

## Objection becomes even better with narration

When objection triggers, KoA quotes *your beat*:

* “You said: ‘The timeline holds.’ Do you stand by that?”

Now “Stand By” feels like you’re defending your story, not just clicking a button.

---

## Net effect on content workload

* Per puzzle: **8 presentLines** + optional 8 supportLines + 1 signature opening line
* Global library: ~60 KoA barks per slot, plus ~40 link phrases
  No pair narrations. No combinatorial explosion.

---

If you want, I’ll paste the **exact schema additions** (Card fields + StatementSoFar + LinkPhrase tables + dialogue tag rules) so you can drop it into the generator and test engine immediately.
