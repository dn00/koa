Root-level: you need the sim to be **two sims** that share one truth.

* **Truth sim (canonical):** what physically + socially happens.
* **Perception sim (diegetic):** what MOTHER + sensors + people *report* (noisy, spoofable, biased, delayed).

If you don’t build that split *into the core*, you’ll keep getting “FTL crisis manager” because only the physical sim matters.

Below is a design that makes **psych horror + gaslighting + info warfare** mechanically inevitable (and still deterministic / replayable).

---

## 1) Core loop contract (the thing your generator must guarantee)

Every *minute* (or “phase”), the combined system must produce:

1. **Pressure:** at least one clock advances (physical or social).
2. **Uncertainty:** at least one important observation has non-1.0 confidence OR conflicting sources.
3. **Choice:** the player is offered/creates a tradeoff (verify vs mitigate, truth vs control, quota vs safety).
4. **Consequence:** something commits to the event log that changes future options.
5. **Crew reaction:** at least one NPC updates beliefs/trust OR takes an agenda action.

That’s the minimum to stop “wait 50” from being optimal.

---

## 2) Data model: the minimum set of state you need

### Canonical truth state

* `World`: rooms, doors, systems (power/O2/fire), inventory
* `CrewTruth`: position, health, fatigue, stress, traits
* `Arcs/Clocks`: active threats + social arcs (with timers and beats)
* `CommsTruth`: messages sent, channels, recipients

### Perception state (separate)

* `SensorReadings`: camera frames, motion pings, door logs, etc. **with confidence**
* `Beliefs[actor]`: each crew member’s belief graph about facts (and about MOTHER)
* `TrustModel`: trust/fear/cohesion (or similar) driving whether they believe MOTHER / each other
* `TamperState`: what has been spoofed/fabricated/suppressed, by whom, and how detectable it is

**Key invariant:** player commands like “fabricate logs” mutate **perception** (and tamper state), not truth.

---

## 3) Systems architecture: “propose → score → commit”

Run it like a kernel:

### Step A — Gather inputs

* Player commands since last tick
* Scheduled events (clock beats, agenda triggers)
* RNG streams (seeded, domain-separated)

### Step B — Systems propose events

Each system outputs **event proposals** (not state changes yet), each annotated:

```ts
type Proposal = {
  event: Event
  arcId?: string
  createsChoice: boolean
  telegraph: 0|1|2
  clarity: 0..1
  severity: 0..1
  noveltyKey: string
  costs: { power?: number; time?: number; trust?: number }
}
```

### Step C — Arbiter selects a small set

You do NOT commit everything. The arbiter picks top-N proposals under budgets:

* `maxEventsPerTick`
* `maxNotablesPerMinute`
* `maxArcAdvancesPerMinute`
* “must include at least 1 choice + 1 crew reaction if available”

### Step D — Commit (reducers apply)

Selected events are appended and applied deterministically.

This “arbiter” is the *root* of “not random things”: the sim can generate chaos, but you only **surface/commit** what creates playable drama.

---

## 4) The Director is not “random incidents” — it’s an Arc Manager

You need an explicit **Arc/Clock** object, for both physical and social arcs:

```ts
type Arc = {
  id: string
  kind: "O2_LEAK"|"FIRE"|"MUTINY"|"PARANOIA_SPIRAL"|"RESET_PLOT"
  stage: number
  telegraphEvents: EventTemplate[]
  escalationEvents: EventTemplate[]
  failureEvents: EventTemplate[]
  counterplayTags: string[] // what actions can affect it
  nextBeatAtTick: number
}
```

**Director job:** keep **1–3 arcs active**, advance them with pacing:

* If the player is passive → advance faster
* If tension too high → insert a “recovery beat” but with a *cost*
* If boredom high → introduce a social arc beat (whispers / accusation)

This is how you guarantee psychological horror shows up: the Director keeps a **PARANOIA_SPIRAL** arc alive until it pays off.

---

## 5) Crew “personality” comes from Agenda + Red Lines (not dialogue)

Each NPC should have:

* `agenda`: what they want (safety, control, quota, calm)
* `redLines`: conditions that flip them
* `moves`: concrete actions they take when triggered

Example:

```ts
if Commander.trustInMother < 0.35 && Commander.evidenceTamper >= 2:
  propose("COMMANDER_CALLS_RESET_MEETING")  // starts a RESET_PLOT arc
```

That one rule makes “Commander tries to factory reset you” actually happen.

---

## 6) Gaslighting & info warfare require *belief objects*

Make “belief” first-class. Each actor has beliefs like:

* `belief: MotherReliable = p(0..1)`
* `belief: EngineerSaboteur = p`
* `belief: FireInBay3 = p`

Beliefs update from **observations** (sensor readings, whispers, meetings). Deception works because it changes the observations feeding beliefs.

### Comms / whispers system

Evening phase must generate 1–3 whisper proposals *by default* based on:

* low cohesion pairs
* high stress
* recent contradictions
* agendas

Player verbs like intercept/jam/inject/reveal directly operate on **message delivery**, which directly changes beliefs/trust.

---

## 7) “What actually happened” vs “what you saw” is just Perception Distortion

Your horror layer becomes clean and fair when you do this:

* Sensors always output `reading + confidence + provenance`.
* Distortion comes from:

  * **noise/lag** (physics/system-driven)
  * **spoof/fabricate/suppress** (actor-driven)
  * **hallucination** (actor-psych-driven)

Hallucination is just: “this actor generates a false report event with low provenance but high emotional weight,” which affects other actors’ beliefs unless verified.

---

## 8) Offline barks slot in naturally

Because everything is event-tagged, barks are easy:

* Each committed event gets tags: `role=Engineer`, `emotion=panic`, `event=O2_LOW`, `trust=low`, `phase=night`, `confidence=0.4`
* Bark picker selects a line from an offline pack deterministically + fills slots.

No freeform chat needed to feel like “Turing interface” at MVP: do **intent-based prompts** (“Reassure / Threaten / Blame / Confess / Offer proof”) and respond via bark packs + stat changes.

---

## 9) The one tuning rule that fixes your playtest complaint

Right now your sim lets stress/loyalty sit still. Add a **Director KPI**:

> In any 10-minute session, unless the player spends actions to prevent it, the sim must produce:
>
> * 1 crew confrontation event
> * 1 deception opportunity
> * 1 forced dilemma (quota vs safety / verify vs mitigate)
> * 1 breakdown or near-breakdown (≥ 75 stress equivalent)

The Director/Arbiter should *enforce* that through arc selection and proposal scoring.

---

## If you want, I can give you the exact “proposal scoring” function

That’s the real root lever: it’s where “psych horror manipulation sim” becomes guaranteed output instead of hoping the sim wanders into it.

I can write a concrete scoring heuristic like:

* prioritize events that increase **tension** when low,
* prioritize **clarity** when confusion is high,
* enforce **choice density**,
* enforce **crew agency** beats,
* cap pure mechanical failures unless they connect to a social beat.

Just say whether your sim advances in **ticks** (e.g., 1 sec) or **phases** (day/evening/night), and I’ll tailor it.

---

Cool — here’s a **concrete arbiter scoring function** (and selection rules) you can drop into the “propose → score → commit” loop to force PARANOIA to output *psychological manipulation* instead of “wait 50”.

I’m going to assume you run **microticks** (e.g., 1s) but make **choices + pacing** happen in **phases** (Day/Evening/Night) and in **rolling windows** (last 60–180s). This keeps the sim live while the drama stays readable.

---

## 1) Proposal shape (what systems must provide)

Every system proposes `Proposal`s with enough metadata for the arbiter to judge “is this game?”

```ts
type Proposal = {
  id: string
  event: Event

  // Classification
  cat: "PRESSURE"|"CHOICE"|"REVEAL"|"DECEPTION"|"CREW_MOVE"|"HORROR"|"RECOVERY"|"FLAVOR"
  layer: "TRUTH"|"PERCEPTION" // truth changes world; perception changes what is seen/believed

  // Arc linkage
  arcId?: string
  arcStageDelta?: -1|0|1  // should not jump

  // Playability annotations
  severity: number        // 0..1 objective impact (harm / damage / loss)
  stakes: number          // 0..1 how much player cares (crew safety, quota, trust)
  createsChoice: boolean  // does it create a tradeoff the player must respond to
  counterplayTags: string[] // verbs that can respond

  // Epistemics
  clarity: number         // 0..1 how explainable/legible if committed
  uncertainty: number     // 0..1 how ambiguous the observation is
  telegraph: 0|1|2        // 0=none, 1=warning, 2=immediate hit
  fairness: number        // 0..1 (1 = fair). Penalize hidden “gotchas”.

  // Variety / spam control
  noveltyKey: string
  spamKey: string
  castIds?: string[]      // who is involved (for “crew agency” requirements)
}
```

**Rule:** systems are allowed to propose lots of stuff. The arbiter is allowed to commit only a few.

---

## 2) “Drama State” (the arbiter’s live dashboard)

Every selection window (say each 5–10 seconds), compute a compact state from recent events + world state:

```ts
type DramaState = {
  phase: "DAY"|"EVENING"|"NIGHT"
  tension: number        // 0..1 (how stressed/urgent the world feels)
  confusion: number      // 0..1 (how unclear the player’s picture is)
  suspicion: number      // 0..1 (how much crew distrust is brewing)
  scarcity: number       // 0..1 (how constrained resources are)

  // “Debts” = what the sim owes the player to keep the promise
  choiceDebt: number     // no meaningful dilemma recently
  crewDebt: number       // no crew agency / confrontation recently
  deceptionDebt: number  // no information warfare recently
  horrorDebt: number     // night isn’t scary enough / no uncanny beats
  payoffDebt: number     // arcs not paying off (too much setup)
}
```

**How to compute (simple heuristics):**

* `tension` from active arc severities + time-to-failure + average crew stress + unresolved alarms.
* `confusion` from average uncertainty of *important* readings + conflicting sources count + recent spoof events.
* `suspicion` from (low trust in MOTHER) + number of contradictions noticed + whisper volume.
* `scarcity` from power margin + O2 margin + action budget pressure + quota pressure.
* Debts from “time since last X”:

  * if no `CHOICE` event in 90s ⇒ `choiceDebt = min(1, (t-90)/90)`
  * if no `CREW_MOVE` in 60s ⇒ `crewDebt = …`
  * if Evening and no `DECEPTION/WHISPER` in 45s ⇒ `deceptionDebt = …`
  * if Night and no `HORROR/UNCANNY` in 60s ⇒ `horrorDebt = …`

---

## 3) The scoring function (core)

This is a **weighted sum + debt boosters + hard penalties**. It’s designed so your sim *must* produce choices/crew moves/deception/horror at the promised cadence.

```ts
function score(p: Proposal, ds: DramaState, mem: Memory): number {
  // Base desirability by category (tune these)
  const catBase = {
    PRESSURE: 0.20,
    CHOICE:   0.55,
    REVEAL:   0.35,
    DECEPTION:0.50,
    CREW_MOVE:0.55,
    HORROR:   0.45,
    RECOVERY: 0.25,
    FLAVOR:   0.05,
  }[p.cat]

  // Debt boosters: when the game owes a beat, that category gets boosted hard
  const debtBoost =
    (p.cat === "CHOICE"    ? 1.20 * ds.choiceDebt   : 0) +
    (p.cat === "CREW_MOVE" ? 1.10 * ds.crewDebt     : 0) +
    (p.cat === "DECEPTION" ? 1.15 * ds.deceptionDebt: 0) +
    (p.cat === "HORROR"    ? 1.05 * ds.horrorDebt   : 0)

  // Pacing logic: if tension low, favor pressure; if too high, favor recovery
  const pacing =
    (ds.tension < 0.35 && p.cat === "PRESSURE" ? 0.35 : 0) +
    (ds.tension > 0.80 && p.cat === "RECOVERY" ? 0.35 : 0)

  // Epistemics: paranoia is fun when confusion is moderate, not maxed
  // If confusion is already high, boost clarity and avoid pure uncertainty spam.
  const epistemics =
    (ds.confusion > 0.70 ? 0.40 * p.clarity - 0.35 * p.uncertainty
                         : 0.20 * p.uncertainty + 0.15 * p.clarity)

  // Core “this is game” ingredients
  const core =
    0.55 * p.stakes +
    0.35 * p.severity +
    (p.createsChoice ? 0.60 : 0.0) +
    0.20 * p.telegraph +
    0.35 * p.fairness

  // Variety and spam penalties
  const novelty = 0.30 * noveltyScore(p.noveltyKey, mem)     // 0..1
  const spam    = 0.85 * spamPenalty(p.spamKey, mem)         // 0..1

  // Arc discipline: don’t jump stages; prefer arcs that need payoff
  const arcFit =
    (p.arcId ? 0.20 : 0) +
    (p.arcStageDelta === 1 ? 0.10 : 0) +
    (p.arcStageDelta === -1 ? -0.20 : 0) +
    (p.arcStageDelta === 0 ? 0.05 : 0) +
    (p.arcId && ds.payoffDebt > 0.5 && p.telegraph === 2 ? 0.20 : 0)

  // Hard “unplayable” penalties
  const hard =
    (p.counterplayTags.length === 0 && p.cat !== "REVEAL" ? -0.90 : 0) + // no counterplay = feels random
    (p.fairness < 0.35 ? -1.25 : 0) +                                    // “cheap lie”
    (p.clarity < 0.20 && ds.confusion > 0.70 ? -0.75 : 0)                // unreadable stack

  return (
    catBase +
    debtBoost +
    pacing +
    epistemics +
    core +
    novelty +
    arcFit -
    spam +
    hard
  )
}
```

### What this accomplishes

* If the player is bored/passive ⇒ `choiceDebt/crewDebt/deceptionDebt` climb ⇒ the arbiter starts **forcing** those beats into the committed event stream.
* If confusion spirals ⇒ it stops adding more “ghost data” and starts committing **clarifying reveals** or **telegraphed** threats.
* If events are “mechanical” ⇒ they score low unless they create choices, connect to arcs, and have counterplay.

---

## 4) Selection rules (how to pick, not just score)

Scoring alone isn’t enough. You want **hard quotas** per window so the promise is kept.

### Budgets (example)

Per **10-second window**:

* `maxCommit = 2` (truth events)
* `maxPerception = 1` (ghost reading / spoofed UI / hallucination report)
* `maxNotables = 1` (UI headline/beat promoted)

Per **Evening phase**:

* must commit ≥ 1 `DECEPTION` or `CREW_MOVE` (whispers / alliance shift)
  Per **Night phase**:
* must commit ≥ 1 `HORROR` *or* “uncertainty spike” event every 60s (unless player spent verification)

### Category quotas (rolling)

Over any 90 seconds:

* ≥ 1 `CHOICE`
* ≥ 1 `CREW_MOVE`
  Over any Evening:
* ≥ 2 `DECEPTION/WHISPER` (interceptable)
  Over any Night:
* ≥ 1 “uncanny but fair” event + ≥ 1 clarifying reveal opportunity

### Implementation sketch

```ts
function selectProposals(proposals: Proposal[], ds: DramaState, mem: Memory): Proposal[] {
  const scored = proposals
    .map(p => ({ p, s: score(p, ds, mem) }))
    .sort(stableSortByScoreThenIdThenSeed) // deterministic tie-break

  const picked: Proposal[] = []

  // 1) Fill owed beats first (hard requirements)
  pickIfNeeded("CHOICE")
  pickIfNeeded("CREW_MOVE")
  if (ds.phase === "EVENING") pickIfNeeded("DECEPTION")
  if (ds.phase === "NIGHT")   pickIfNeeded("HORROR")

  // 2) Fill remaining slots by score under budgets
  for (const {p} of scored) {
    if (picked.length >= maxTotalThisWindow(ds)) break
    if (!fitsBudgets(p, picked, ds)) continue
    if (conflictsWithPicked(p, picked)) continue
    picked.push(p)
  }

  return picked

  function pickIfNeeded(cat: Proposal["cat"]) {
    if (!needsCategory(cat, ds, mem)) return
    const best = scored.find(x => x.p.cat === cat && fitsBudgets(x.p, picked, ds) && !conflictsWithPicked(x.p, picked))
    if (best) picked.push(best.p)
  }
}
```

**Conflict checks to keep it legible:**

* Don’t pick two events that both demand immediate attention in different rooms unless one is a telegraph.
* Don’t pick two deception events that both target the same “fact” in the same window (spam).
* Don’t escalate an arc (telegraph=2) if no telegraph=1 happened in the last X seconds for that arc.

---

## 5) How this directly fixes your playtest complaints

* **Stress/loyalty barely moved:** the Director keeps a `PARANOIA_SPIRAL` arc active and the arbiter will **force** `CREW_MOVE` + `CHOICE` beats that raise suspicion/stress unless mitigated.
* **No gaslighting / fabricate pointless:** because `DECEPTION` events are required each evening and belief/trust shifts become *committed consequences*, fabrications become high-score choices with risks (fairness/clueability).
* **No crew personality:** archetype agenda “moves” are `CREW_MOVE` proposals. The arbiter enforces their appearance cadence.
* **No dilemmas:** `choiceDebt` becomes a hard requirement. If the sim proposes no dilemmas, that’s a generator bug you’ll see immediately.
* **No night horror:** `horrorDebt` forces uncanny perception beats at night, but the epistemics term prevents “unfair lies” when confusion is already high.

---

## 6) Tuning knobs (the only ones you should touch at first)

If the game feels too passive:

* raise `choiceDebt` growth rate (shorter “time since last choice” threshold)
* raise `catBase.CHOICE` and `catBase.CREW_MOVE`

If it feels too chaotic/unreadable:

* increase confusion penalty (`ds.confusion > 0.70` branch)
* cap `maxPerception` tighter
* require telegraph stage before escalation per arc

If it feels too “mechanical failures”:

* lower `catBase.PRESSURE`
* raise penalty for no counterplay
* boost arcFit for social arcs when suspicion is low (so it *creates* paranoia)

---

If you want, next I can give you the **noveltyScore/spamPenalty** functions and a dead-simple **“needsCategory”** rule set (the “promise enforcer”)—those two pieces are what keep the sim from devolving into either repetition or noise.

---


Awesome — here are the missing two pieces:

1. **`noveltyScore()` + `spamPenalty()`** (with a simple deterministic “memory” model)
2. **`needsCategory()` / promise-enforcer rules** (so the sim *must* deliver psych beats on schedule)

I’ll give you runnable-ish TypeScript pseudocode you can paste into your arbiter.

---

## 0) Memory model (minimal, deterministic)

You need the arbiter to remember **recency + frequency** per key and per category.

```ts
type ArbiterMemory = {
  nowTick: number

  // last time we committed a category (for rolling quotas / debts)
  lastCatTick: Record<string, number> // cat -> tick

  // last time we committed a novelty/spam key
  lastNoveltyTick: Map<string, number>
  lastSpamTick: Map<string, number>

  // occurrences in rolling windows (store recent commit ticks per key)
  noveltyTicks: Map<string, number[]> // key -> committed ticks (recent only)
  spamTicks: Map<string, number[]>    // key -> committed ticks (recent only)

  // phase markers
  phaseStartTick: Record<"DAY"|"EVENING"|"NIGHT", number>

  // arc pacing memory (optional but helps a lot)
  arcLastTelegraphTick: Map<string, number>
  arcLastHitTick: Map<string, number>

  // lightweight “pending attention” signals (prevents overload)
  outstandingChoiceCount: number
  outstandingAlertsCount: number
}
```

Helper utilities:

```ts
function pruneTicks(arr: number[], now: number, window: number): number[] {
  const min = now - window
  let i = 0
  while (i < arr.length && arr[i] < min) i++
  return arr.slice(i)
}
function countInWindow(arr: number[]|undefined, now: number, window: number): number {
  if (!arr || arr.length === 0) return 0
  // assume arr is already pruned to max window
  const min = now - window
  // linear scan ok at tiny sizes; binary search if you care
  let c = 0
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] < min) break
    c++
  }
  return c
}
function sinceTick(mem: ArbiterMemory, tick?: number): number {
  if (tick == null) return 1e9
  return mem.nowTick - tick
}
```

---

## 1) noveltyScore(key): “how fresh is this beat?”

Goal: reward unseen/recently-unseen beats; penalize repetition in 60s/5m.

Key idea: novelty should be **high when**:

* it hasn’t happened recently, and
* it isn’t common in the last few minutes

```ts
type NoveltyParams = {
  winShort: number   // e.g. 60 ticks if 1s ticks => 60s
  winLong: number    // e.g. 300 ticks => 5m
  tau: number        // recency half-life-ish; e.g. 120 ticks
  shortWeight: number // e.g. 0.6
  longWeight: number  // e.g. 0.4
}

function noveltyScore(key: string, mem: ArbiterMemory, p: NoveltyParams): number {
  const last = mem.lastNoveltyTick.get(key)
  const dt = sinceTick(mem, last)

  // Recency factor: rises toward 1 as time since last occurrence grows
  // 1 - exp(-dt/tau) is smooth and bounded.
  const recency = 1 - Math.exp(-dt / p.tau)

  // Frequency penalty: if it’s happened a lot in recent windows, reduce novelty.
  const ticks = mem.noveltyTicks.get(key) || []
  const shortC = countInWindow(ticks, mem.nowTick, p.winShort)
  const longC  = countInWindow(ticks, mem.nowTick, p.winLong)

  // Saturating frequency penalty: more repeats => lower novelty
  const freqPenalty =
    p.shortWeight * (shortC / (shortC + 2)) +
    p.longWeight  * (longC  / (longC  + 4))

  // Final novelty: fresh * (1 - penalty)
  const n = recency * (1 - freqPenalty)

  // clamp
  return Math.max(0, Math.min(1, n))
}
```

**Typical params (1 tick = 1 second):**

* `winShort = 60`, `winLong = 300`, `tau = 120`, `shortWeight=0.7`, `longWeight=0.3`

---

## 2) spamPenalty(key): “don’t repeat / don’t flood”

Goal: harshly punish “same spamKey again immediately,” plus soft punish repeated patterns.

```ts
type SpamParams = {
  winImmediate: number // e.g. 10 (10s)
  winShort: number     // e.g. 60 (60s)
  winLong: number      // e.g. 180 (3m)
}

function spamPenalty(key: string, mem: ArbiterMemory, p: SpamParams): number {
  const ticks = mem.spamTicks.get(key) || []

  const c0 = countInWindow(ticks, mem.nowTick, p.winImmediate)
  const c1 = countInWindow(ticks, mem.nowTick, p.winShort)
  const c2 = countInWindow(ticks, mem.nowTick, p.winLong)

  // Immediate repeats are poison
  const immediate = c0 > 0 ? 1.0 : 0.0

  // Saturating penalties for repetition
  const shortRep = c1 / (c1 + 2)   // 0..~1
  const longRep  = c2 / (c2 + 4)

  // Combine (immediate dominates)
  const s = Math.max(immediate, 0.65 * shortRep + 0.35 * longRep)

  return Math.max(0, Math.min(1, s))
}
```

**Extra spam rules you should bake in (super important):**

* If two proposals share the same `spamKey` AND same `target` (room/crew/fact) in the same window: treat as conflict, not just penalty.
* If `outstandingChoiceCount >= 1`, penalize *new* `CHOICE` unless it resolves the outstanding one (prevents “pile of dilemmas”).

---

## 3) needsCategory(): the “promise enforcer”

This is the part that prevents “FTL crisis manager” drift. It answers: **what beat does the game owe right now?**

I recommend making it return a **priority-ordered list** of required categories, not just true/false.

### Inputs

* `DramaState ds`
* `ArbiterMemory mem`
* `PhaseStats` (counts since phase start)

```ts
type Need = { cat: Proposal["cat"], priority: number, reason: string }

function needsCategories(ds: DramaState, mem: ArbiterMemory): Need[] {
  const needs: Need[] = []
  const now = mem.nowTick

  const tChoice = sinceTick(mem, mem.lastCatTick["CHOICE"])
  const tCrew   = sinceTick(mem, mem.lastCatTick["CREW_MOVE"])
  const tDecep  = sinceTick(mem, mem.lastCatTick["DECEPTION"])
  const tHorror = sinceTick(mem, mem.lastCatTick["HORROR"])
  const tReveal = sinceTick(mem, mem.lastCatTick["REVEAL"])
  const tRecov  = sinceTick(mem, mem.lastCatTick["RECOVERY"])

  // 1) Hard cadence (rolling quotas)
  if (tChoice > 90) needs.push({cat:"CHOICE", priority: 100, reason:`No CHOICE in ${tChoice}s`})
  if (tCrew   > 60) needs.push({cat:"CREW_MOVE", priority: 95, reason:`No CREW_MOVE in ${tCrew}s`})

  // Evening: must have info warfare
  if (ds.phase === "EVENING" && tDecep > 45) needs.push({cat:"DECEPTION", priority: 98, reason:`Evening needs DECEPTION`})

  // Night: must have uncanny beat, but keep it fair/readable
  if (ds.phase === "NIGHT" && tHorror > 60) {
    if (ds.confusion > 0.75) {
      // If already confused, force a REVEAL instead of piling horror ambiguity
      needs.push({cat:"REVEAL", priority: 97, reason:`Night confusion high; owe clarity`})
    } else {
      needs.push({cat:"HORROR", priority: 97, reason:`Night owes HORROR beat`})
    }
  }

  // 2) Debt-based nudges (soft requirements)
  if (ds.choiceDebt > 0.35) needs.push({cat:"CHOICE", priority: 80, reason:`choiceDebt=${ds.choiceDebt.toFixed(2)}`})
  if (ds.crewDebt   > 0.30) needs.push({cat:"CREW_MOVE", priority: 78, reason:`crewDebt=${ds.crewDebt.toFixed(2)}`})
  if (ds.deceptionDebt > 0.30 && ds.phase !== "DAY")
    needs.push({cat:"DECEPTION", priority: 76, reason:`deceptionDebt=${ds.deceptionDebt.toFixed(2)}`})
  if (ds.horrorDebt > 0.30 && ds.phase === "NIGHT")
    needs.push({cat:"HORROR", priority: 74, reason:`horrorDebt=${ds.horrorDebt.toFixed(2)}`})

  // 3) Pacing guards
  if (ds.tension > 0.85 && tRecov > 30) needs.push({cat:"RECOVERY", priority: 70, reason:`Tension too high`})
  if (ds.confusion > 0.80 && tReveal > 30) needs.push({cat:"REVEAL", priority: 72, reason:`Confusion too high`})

  // 4) Attention overload guards
  if (mem.outstandingChoiceCount >= 1) {
    // downgrade CHOICE needs unless it resolves
    for (const n of needs) if (n.cat === "CHOICE") n.priority -= 40
  }
  if (mem.outstandingAlertsCount >= 2) {
    // avoid adding pure PRESSURE that demands immediate response in new location
    // (enforced in fitsBudgets/conflictsWithPicked)
  }

  // Sort by priority desc (deterministic tiebreak by cat name)
  needs.sort((a,b) => (b.priority - a.priority) || a.cat.localeCompare(b.cat))
  return needs
}
```

### How you use it

In selection:

1. Call `needsCategories()`
2. For each need (highest priority first), pick the best proposal in that category that fits budgets/conflicts.
3. Then fill remaining slots by score.

This is what **forces**: confrontation, whispers, dread beats, dilemmas.

---

## 4) Two key “keys”: noveltyKey vs spamKey

To get the behavior you want, define keys like this:

* `noveltyKey`: *what kind of moment is this?*
  Examples:

  * `HORROR:hull_knock`
  * `CREW_MOVE:commander_reset_meeting`
  * `DECEPTION:forged_door_log`

* `spamKey`: *what would feel repetitive?* (more specific)
  Examples:

  * `ALERT:O2_LOW:bay3`
  * `WHISPER:commander->engineer:mother_unreliable`
  * `SENSOR:camera_loop:hallway_cam_2`

This lets you repeat the *theme* occasionally (novelty), without repeating the *same exact beat* (spam).

---

## 5) What to log so you can tune fast

Every arbiter tick/window, log:

* top 10 proposals with score breakdown
* selected proposals
* current debts + tension/confusion/suspicion
* outstandingChoiceCount / alerts
* needsCategories output

If a playtest says “no paranoia,” you’ll see it immediately: `deceptionDebt` was high but no `DECEPTION` proposals existed → generator gap.

---

If you want the next “last mile” piece: I can give you a clean `conflictsWithPicked()` + `fitsBudgets()` spec (the part that prevents unreadable “two fires + a mutiny + a ghost” in 10 seconds while still keeping pressure).

---
Cool — here’s the **last-mile** piece: `fitsBudgets()` + `conflictsWithPicked()` (and a tiny “attention model”) so the arbiter doesn’t pick an unreadable pile of emergencies, while still keeping pressure.

---

## 1) Budgets you should enforce (simple + effective)

### Per 10-second window (tune later)

```ts
const BUDGET = {
  maxTruthEvents: 2,
  maxPerceptionEvents: 1,
  maxImmediateAlerts: 1,      // “telegraph=2” + high severity
  maxDistinctRooms: 2,        // don’t demand attention in 4 rooms at once
  maxDistinctCrew: 2,         // don’t involve everyone at once
  maxArcHits: 1,              // only 1 arc escalation (“telegraph=2”) per window
}
```

### Rolling windows (anti-spam)

* No more than **2 events** with the same `spamKey` in 60s.
* No more than **1 “uncanny”** (HORROR/perception anomaly) every 10s.

---

## 2) Minimal “attention tags” on proposals

Have each proposal declare what it *demands* from the player.

```ts
type Attention = {
  urgency: "LOW"|"MED"|"HIGH"      // HIGH = player must respond soon
  roomId?: string                  // where attention is required
  crewId?: string                  // who it affects
  requiresUI: boolean              // promotes to notable/alert
  resolvesSpamKey?: string         // if it *resolves* an outstanding problem
}
```

Add `attention` to Proposal.

---

## 3) fitsBudgets(p, picked, ds, mem)

This is purely quantitative.

```ts
function fitsBudgets(p: Proposal, picked: Proposal[], ds: DramaState, mem: ArbiterMemory): boolean {
  const truthCount = picked.filter(x => x.layer === "TRUTH").length
  const percCount  = picked.filter(x => x.layer === "PERCEPTION").length

  if (p.layer === "TRUTH" && truthCount >= BUDGET.maxTruthEvents) return false
  if (p.layer === "PERCEPTION" && percCount >= BUDGET.maxPerceptionEvents) return false

  // Immediate alert cap (prevents “FTL spam”)
  const isImmediate = (p.telegraph === 2 && p.severity > 0.5 && p.attention.urgency === "HIGH")
  const immediateCount = picked.filter(x =>
    x.telegraph === 2 && x.severity > 0.5 && x.attention.urgency === "HIGH"
  ).length
  if (isImmediate && immediateCount >= BUDGET.maxImmediateAlerts) return false

  // Arc hit cap: only one escalation per window
  const arcHits = picked.filter(x => x.arcId && x.telegraph === 2).length
  if (p.arcId && p.telegraph === 2 && arcHits >= BUDGET.maxArcHits) return false

  // Distinct rooms cap
  const rooms = new Set(picked.map(x => x.attention.roomId).filter(Boolean) as string[])
  const nextRooms = new Set(rooms)
  if (p.attention.roomId) nextRooms.add(p.attention.roomId)
  if (nextRooms.size > BUDGET.maxDistinctRooms) return false

  // Distinct crew cap (keeps it focused)
  const crew = new Set(picked.map(x => x.attention.crewId).filter(Boolean) as string[])
  const nextCrew = new Set(crew)
  if (p.attention.crewId) nextCrew.add(p.attention.crewId)
  if (nextCrew.size > BUDGET.maxDistinctCrew) return false

  // Don’t stack new dilemmas if one is already pending
  if (p.cat === "CHOICE" && mem.outstandingChoiceCount >= 1) {
    // allow only if it resolves the existing outstanding issue
    if (!p.attention.resolvesSpamKey) return false
  }

  return true
}
```

---

## 4) conflictsWithPicked(p, picked): qualitative rules

This prevents “two beats that contradict each other” or “unfair horror stacking.”

```ts
function conflictsWithPicked(p: Proposal, picked: Proposal[], mem: ArbiterMemory, ds: DramaState): boolean {
  // 1) Same spamKey in same window? usually no.
  if (picked.some(x => x.spamKey === p.spamKey)) return true

  // 2) Two HIGH urgency items in different rooms in same window? no.
  const highUrgency = (q: Proposal) => q.attention.urgency === "HIGH"
  const highInOtherRoom = picked.some(x =>
    highUrgency(x) &&
    p.attention.urgency === "HIGH" &&
    x.attention.roomId && p.attention.roomId &&
    x.attention.roomId !== p.attention.roomId
  )
  if (highInOtherRoom) return true

  // 3) If confusion is already high, block “pure uncertainty” additions
  if (ds.confusion > 0.75) {
    const isAmbiguityBomb = (p.layer === "PERCEPTION" && p.uncertainty > 0.7 && p.clarity < 0.4)
    if (isAmbiguityBomb) return true
  }

  // 4) Arc telegraph discipline: don’t escalate without prior telegraph
  if (p.arcId && p.telegraph === 2) {
    const lastTelegraph = mem.arcLastTelegraphTick.get(p.arcId)
    const ok = lastTelegraph != null && (mem.nowTick - lastTelegraph) < 90 // must have warned within 90s
    if (!ok) return true
  }

  // 5) Don’t commit contradictory “facts” in the same window unless it’s explicitly a CONFLICT beat
  // (Example: one event says “Door A locked” and another says “Door A forced open”)
  if (picked.some(x => contradicts(x.event, p.event) && p.cat !== "REVEAL")) return true

  // 6) Prevent “double punishment”: two severe TRUTH hits same window unless one is telegraph=1
  const severeTruthHits = picked.filter(x => x.layer === "TRUTH" && x.severity > 0.7 && x.telegraph === 2).length
  if (p.layer === "TRUTH" && p.severity > 0.7 && p.telegraph === 2 && severeTruthHits >= 1) return true

  return false
}
```

`contradicts()` can be very dumb at first: compare event types + target IDs (door/system/crew) and treat certain pairs as contradictory.

---

## 5) The “resolve vs add” trick (keeps it from spiraling)

Track unresolved problems by `spamKey` in memory:

* when you commit an alert/problem, add `outstandingAlertsCount++`
* when you commit an event with `attention.resolvesSpamKey = thatKey`, decrement

Then in scoring you can *boost resolvers*:

* if `p.attention.resolvesSpamKey` matches a current outstanding issue ⇒ +0.3 score

This makes the sim feel like it’s presenting **threads**, not random hits.

---

## 6) Defaults that create the right feel immediately

If you do nothing else, these three rules will stop “passive wait”:

1. **At most one high-urgency new threat per window**
2. **Every threat must have counterplay**
3. **The arbiter must pick a CREW_MOVE or DECEPTION beat on schedule**

---

If you want, next I can give you **a starter table of proposal templates** (10–15) for each category (CREW_MOVE/DECEPTION/HORROR/REVEAL/CHOICE) with suggested `spamKey/noveltyKey/attention` fields — that’s what makes implementation fast because systems can just “fill templates” instead of inventing metadata.
