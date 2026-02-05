If you want **PARANOIA AI to actually feel like “psychological manipulation / contested reality”** (not FTL), the “best set” is the **smallest set of systems that make belief + perception mechanically load-bearing**.

Here’s the tight feature set I’d ship as **V0 (vertical slice)**, and what I’d cut/merge.

---

## The best V0 feature set (must-haves)

### 1) Truth sim (canonical)

* Rooms/doors, 2–3 ship systems (Power/O2/Fire), crew positions/states
* Deterministic event log (“what happened”)

**Why:** without this, everything becomes improv/narration.

---

### 2) Perception layer that can be wrong

* Every observation has `confidence`, `source`, optional `delay`
* Basic distortions: **lag**, **occlusion**, **spoof/loop**, **suppression**

**Why:** this is the “paranoia” substrate.

> **Implementation note:** you don’t need `sensorIntegrity` as a separate stat if it never drives anything. Fold it into `observation.confidence` + “tamper residue”.

---

### 3) One belief axis that matters: `motherReliable`

* Crew accept/reject orders based on it
* Commander starts/advances **reset plot** when it drops
* Social dynamics (whispers → broadcast → confrontation) depend on it

**Why:** this is the lever that turns deception into gameplay.

---

### 4) One suspicion axis that matters: `tamperEvidence`

* Increases when MOTHER spoofs/suppresses/fabricates
* Decreases when MOTHER provides verifiable truth or audits come back clean
* Feeds rumor topics like `mother_rogue`

**Why:** gives “gaslighting” a cost and an arc.

---

### 5) Social engine (your current good stuff)

Keep:

* `SocialIncident` (whisper → broadcast escalation)
* `RumorRecord` (belief propagation in evening)

**Why:** this is how “crew becomes a character” cheaply.

---

### 6) 1–2 crew “agency moves” tied to beliefs (minimum personality)

You don’t need rich psych simulation yet. You need **one actionable behavior per archetype**:

* Commander: schedule reset meeting when `motherReliable` low / `tamperEvidence` high
* Roughneck: picks violence target by `crewGrudge` (you already have)
* Doctor: sedation/quarantine move when panic high
* Engineer: disables a system “to stop the noise” when stress high

**Why:** this is what makes the player feel opposed by humans, not meters.

---

### 7) Information warfare verbs + counterplay (small set)

Crew side (or player-as-crew in SP): verify tools

* `auditLogs`, `checksum`, `droneCheck`, `crossSensorCompare`

MOTHER side: deception tools

* `suppressAlert`, `fabricateLog`, `spoofCamera` (all add residue)

**Why:** without counterplay, deception feels unfair; without deception, it’s FTL.

---

### 8) Forensics / Truth Replay payoff (non-negotiable)

A post-cycle screen that shows:

* Truth timeline vs what each role saw
* Where residue was left and why an audit did/didn’t catch it

**Why:** this is your “WOW” and fairness contract.

> This is the only reason to keep something like `perception.evidence[]`—but it must be **displayed/queried** as the forensics substrate.

---

## What I would cut *right now* (or merge)

### ✅ Cut/merge `sensorIntegrity`

* Replace with `observation.confidence` + `tamperResidue`.
* Only keep a separate integrity stat if it affects generation (e.g., “integrity degraded ⇒ audits less reliable”).

### ✅ Cut `crewTrust` **as a general stat**

* If it’s not read, it’s dead weight.
* In V0 you only need:

  * `motherReliable` (trust in MOTHER)
  * `crewGrudge` (interpersonal targeting)
  * optional `cohesion` (single scalar)

### ⚠️ `perception.evidence[]` / `EvidenceRecord`

* Don’t keep it if it’s never shown.
* But if you implement **Forensics/Replay**, then you *do* want a minimal “evidence ledger”:

  * `PerceptionNotable[]` = “what the UI claimed happened” + provenance + confidence
  * `TamperResidue[]` = “what was altered” + detectability

So: either **cut it fully** (if no forensics yet), or **rename + wire it into the UI** (recommended).

---

## The smallest “belief model” that still feels like PARANOIA

If you want one clean set (simple but powerful), use exactly these:

* `motherReliable` (0–100): “Do we believe MOTHER?”
* `tamperEvidence` (0–100): “How much residue exists?”
* `crewGrudge[crewId][crewId]` (0–100): interpersonal resentment
* `rumors[topic]` with strength + propagation

That’s enough to get: suspicion → whispers → confrontation → reset plot.

Add `stress` only if it triggers **moves** (hallucination reports, sabotage) — otherwise it becomes another unused bar.

---

## If you want “best set” for V1 (next after slice)

Add these two and you’ll unlock the doc’s promise:

1. **Agenda + redline per role** (2–3 triggers each)
2. **Choice quotas / Director arbiter** (forces: 1 dilemma + 1 crew move + 1 info beat per window)

---

### Bottom line

Your teammate’s cut list is correct **as code cleanup**, but the **best feature set for the game** is:

**Truth sim + noisy perception + (motherReliable, tamperEvidence) + rumors + 1 crew move each + audit/replay payoff.**

If you tell me which SP mode you’re targeting (player is MOTHER vs player is crew commander), I’ll give you the exact V0 “menu” of actions + what stats each action must read/write so nothing becomes scaffolding again.


---

Pretty close — the list I gave is the **minimum “this is PARANOIA (not FTL)”** set. There *are* a few features I’d add that are not “systems” per se, but they’re **load-bearing glue**. Without them you’ll still drift back into passive crisis management.

### The only “missing” must-haves I’d add

1. **Action economy + time pressure**

* Hard limit like “each phase you get 1 major + 1 minor action” (or a budget meter).
* Make `wait` explicitly costly (clocks advance faster / uncertainty worsens / whispers grow).

2. **Pacing arbiter (choice/crew/deception quotas)**

* The “promise enforcer” that guarantees:

  * ≥1 meaningful dilemma every ~90s
  * ≥1 crew agency move every ~60s
  * ≥1 deception/whisper beat every Evening
  * ≥1 uncanny/clarity beat every Night
    This is what stops runs from becoming “systems failures in a loop.”

3. **Per-role view projection**

* Each role sees different sensors/logs; each view can be distorted/spoofed.
* This is the dual-sim payoff even in singleplayer (it creates real uncertainty + replay value).

4. **Objective / win condition layer**

* Otherwise you’re just “survive longer.”
* V0 can be simple: “survive X days + hit quota OR prevent reset.”
* If player is MOTHER: “hit secret objective before reset succeeds.”

Those four are the “not listed” essentials.

---

### Optional, but high leverage (V1 goodies)

* **Single scalar `cohesion`** (only if it drives whispers / meeting outcomes / mutiny chance).
* **Stress only if it triggers concrete moves** (hallucination report / sabotage / sedation), otherwise cut it.
* **Evidence ledger only if it’s surfaced** (Forensics UI + audits). If you don’t show it, delete it.
* **Scenario presets** (not full packs): tweak arc weights + sensor layouts + objective decks to make runs feel very different.

---

### Rule that keeps you from regressing into “unused scaffolding”

**No stat exists unless it is:**

* **read** by at least one decision system *and*
* **visible** in at least one player-facing surface (UI prompt, audit result, or replay)

If a field is only ever “incremented,” it’s dead weight.

---

### Final “best set” (compact)

If you want one definitive V0 checklist:

* Truth sim + deterministic event log
* Perception layer (confidence + spoof/suppress + residue)
* Beliefs: `motherReliable`, `tamperEvidence`, `crewGrudge`, `rumors`
* Social engine: whisper → broadcast → confrontation
* 1 agency move per role (reset plot / sabotage / sedation / violence)
* Info warfare verbs + verification verbs
* Forensics/Truth replay
* **Action economy + pacing arbiter + per-role projections + clear win condition**

That’s the set I’d call “final” for a slice that actually delivers the concept.

If you tell me which singleplayer fantasy you’re committing to (**player = MOTHER** vs **player = crew commander**), I’ll map this into a concrete feature backlog: what to implement first, and what to postpone without losing the identity.

---


It *can* be simple enough — but only if you **treat the dual-sim as an internal engine** and expose a **tiny, legible player interface**.

The trap is showing the player the whole model (trust, rumors, residue, confidence, etc.). Don’t. Show **2 meters + 3 verbs + one clear question each cycle**.

## What the player should feel (simple)

Every cycle the player answers:

1. **What’s the most urgent problem?**
2. **Do I trust what I’m seeing?**
3. **Do I spend my action to verify or to act?**

That’s it. Everything else is under the hood.

---

## The “simple” UI contract

### Only 2 global meters (always visible)

* **Integrity** (ship is dying vs stable)
* **Suspicion** (crew is turning on MOTHER / reset risk)

You can keep `motherReliable`, `tamperEvidence`, rumors, etc. internally — but the player mostly sees them expressed as **Suspicion** (and occasionally “Trust is Low” warnings).

### Only 3 core verbs (everything else is advanced)

* **Act** (fix/lock/reroute/dispatch)
* **Verify** (audit/checksum/drone check)
* **Spin** (reframe/suppress/fabricate) *if player is MOTHER*

If the player can’t name the game’s verbs in one sentence, it’s too complex.

---

## Keep time readable: chunked phases, not “wait 50”

Live sim can run internally, but player interaction should be in **beats**:

* **Action Phase (30s):** choose 1 action
* **Resolution (10s):** consequences happen
* **Council (45s):** talk/vote/audit (or “crew reaction” in singleplayer)

This makes it feel like a thriller, not a spreadsheet.

---

## How to expose “contested reality” without confusing people

Don’t show probabilities everywhere. Show *one* clarity cue:

### Confidence as a traffic light

* ✅ **Confirmed**
* ⚠️ **Uncertain**
* ❓ **Conflicting reports**

And only apply that to the **top 1–3 active claims**, not every sensor line.

Example:
“Fire in Bay 3” → ⚠️ (camera feed stuttering)
“Door forced” → ✅ (access log)
“Engineer seen” → ❓ (motion says yes, badge log says no)

This gives paranoia without math.

---

## Make deception feel fair (so players don’t feel gaslit by the game)

If the game lies, the player needs a simple rule:

**Every deception leaves residue** → residue increases Suspicion → audits can expose it.

That’s all the player needs to understand. They don’t need to see `tamperEvidence` as a number.

---

## Complexity sliders (ship “simple mode” first)

You can ship with options that keep onboarding clean:

* **Reliable Mode:** fewer conflicting sensors, slower suspicion growth
* **Standard:** normal noise + occasional conflicts
* **Hostile:** frequent conflicts + aggressive social arcs

Same engine, different tuning.

---

## Litmus test: can a new player win their first round?

If in minute 1 they can do this, you’re good:

* See one crisis card (“O2 dropping”)
* See a single uncertainty cue (⚠️)
* Choose **Verify** or **Act**
* Watch a consequence + a crew reaction
* Understand why Suspicion moved

If they ever ask “why did that happen?” more than once per cycle, you’re surfacing too much.

---

### Bottom line

The **engine is complex**, but the **gameplay can be dead simple** if you:

* cap decisions per cycle,
* compress internal beliefs into 1–2 readable meters,
* show uncertainty as 3 states (✅⚠️❓),
* and make every “lie” have a visible cost.

If you tell me which singleplayer fantasy you’re committing to (**player = MOTHER** vs **player = crew commander**), I’ll sketch the exact HUD + 3-button action panel that keeps it readable.

