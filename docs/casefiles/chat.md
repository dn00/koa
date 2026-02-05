In KOA Casefiles, an **Incident** is the *canonical, simulated “crime/shenanigan”* that the generator inserts into an otherwise-normal day. It’s not a hand-authored story beat; it’s a **small plan + constraints** that the sim executes, producing an event log that can be investigated.

Here’s the incident system in a buildable way.

## 1) What an Incident is

An **Incident = a constrained event-chain** with:

* **Roles** (culprit, target/victim, witnesses, helpers)
* **A goal** (steal/swap/sabotage/spoof/misdeliver/etc.)
* **A method** (door spoof, camera gap, alibi trick, item swap, fake note, device disable…)
* **A location + time window**
* **A cover-up behavior** (hide item, delete log, create distraction)
* **A guaranteed evidence footprint** (so the case is solvable)

The sim runs *forward* to produce the truth log; the player later discovers bounded slices.

---

## 2) Incident blueprint (the authorable unit inside a Pack)

Packs contain **IncidentBlueprints**. Each blueprint is basically a “heist recipe” with knobs.

**Blueprint fields (minimum):**

* `incidentType`: theft | sabotage | disappearance | impersonation | fraud
* `roles`: required roles + optional roles

  * e.g. `culprit`, `target`, `witnessA`, `witnessB`, `redHerring`
* `requiredProps`: item types and device types

  * e.g. “door lock”, “motion sensor”, “package”, “note”
* `preconditions`: constraints the world must satisfy

  * “culprit has access to DoorKey” OR “door supports voice unlock”
* `planSteps`: a *soft plan* expressed as **intents**, not coordinates

  * MOVE_TO(place), ACQUIRE(item), SPOOF(device), SWAP(itemA,itemB), HIDE(item), etc.
* `fallbacks`: what to do if a step fails

  * “if door locked → wait for someone to open” / “use alternate route”
* `evidenceBudget`: what kinds of evidence this incident must generate

  * device log + physical + testimony opportunity, etc.
* `antiClimaxRules`: “no direct witness sees culprit commit act at high confidence”
* `comedySkin`: bark templates + funny object set (“pie”, “garden gnome”, “cat costume”)

This is what keeps you from “pattern fatigue”: you have **families of incidents**, each with multiple method variants and evidence footprints.

---

## 3) Generation pipeline (how today’s case picks an Incident)

### Step A — World + cast setup

* Generate **rooms/devices/items** (small graph world)
* Generate **NPC schedules** (routine movement + activities)
* Generate **relationships + motives** (lightweight pressures)

### Step B — Choose a candidate incident (deterministic)

Pick a blueprint based on:

* cast size, device coverage, difficulty tier
* motive pressure alignment (“who would do *this*?”)
* opportunity feasibility (access + timing)

### Step C — Instantiate the blueprint into a specific plan

Bind the roles to actual NPCs and choose:

* `crimeWindow` (W3/W4…)
* `crimePlace`
* specific `targetItem`, `deviceIds`, and `routes` (via pathfinding)

Now you have an **IncidentInstance**: blueprint + bindings.

---

## 4) How the sim “runs the incident” without becoming scripted

The key trick: **incidents are intent-driven and react to the world**, but remain deterministic.

### Incident execution model

You run the day sim tick-by-tick. When you reach “incident time,” you push **incident intents** into the actors’ intent queues:

* Culprit gets: `GO_TO(place) → ACQUIRE(item) → DO_CRIME(action) → COVER_UP(action)`
* Witnesses keep their normal routine (unless the blueprint includes a distraction step)
* Red herrings do suspicious-but-benign actions (blueprint injects these too)

### Soft-plan + deterministic fallbacks

If a step can’t execute (door locked, target present, witness in room), the incident engine uses the blueprint’s fallback list **in a deterministic priority order**:

Example:

1. wait N ticks
2. choose alternate entry
3. create distraction (turn on speaker, drop object)
4. swap to a less risky method variant (e.g. “steal” → “swap”)

This creates variety while still being **repeatable** and **validator-friendly**.

---

## 5) Evidence footprints (the incident must “leave tracks”)

Incidents are designed to emit **multiple evidence modalities**, each referencing event IDs:

### Common evidence sources

* **Device logs**: door open/close, lock/unlock, camera disabled, motion triggered, voice command
* **Physical evidence**: item moved, residue, broken seal, missing object, swapped label
* **Testimony hooks**: someone heard a door click, saw a silhouette, noticed a smell, “someone rushed past”
* **Social evidence**: a message/note, a rumor, a suspicious interaction

### Evidence budgeting

Each IncidentBlueprint declares a minimum set, e.g.:

* at least **2 independent chains** implicating WHO
* at least **1 chain** for HOW
* at least **1 chain** for WHEN

This is how you prevent “one clue solves everything” and also prevent “unsolvable mush.”

---

## 6) Anti-anticlimax (incident-level rules)

During instantiation and execution, you enforce:

* No witness has high-confidence identity on the crime tick
* If camera captures the culprit, it must be ambiguous (“human-shaped”, “hoodie silhouette”) or camera is degraded/looped
* If someone is physically present, require occlusion/distraction or delay the crime

These are hard gates in the validator.

---

## 7) Replayability + “not recognizing patterns in a week”

You get replayability from **combinatorics + method variance**, not from bigger sims.

Concrete levers:

* 12–20 incident blueprints per crime type, each with 3–6 method variants
* rotate device coverage (some days: presence logs strong; other days: cameras strong; other days: lots of “dumb” sensors)
* rotate twist rules (false alibi, time drift, log gap, swapped identity token)
* procedural comedy skins (objects/locations/barks) separate from logic
* red herring library that’s *orthogonal* to the incident library

If you do that, even if a player thinks “ah, it’s theft again,” the *method* and *evidence topology* still changes.

---

## 8) Tiny example (one incident family)

**Blueprint:** “Swapped Package”

* Goal: target receives wrong package (fraud/impersonation)
* Methods:

  1. spoof delivery voice command
  2. swap labels in mailbox
  3. intercept via unlocked door during window W3
* Evidence:

  * speaker/voice log OR door log
  * mailbox access log OR motion in hallway
  * physical: torn label + residue
  * testimony: “heard the speaker say ‘delivery confirmed’”

Same “shape,” many realizations.

---

If you want, I can turn this into a **strict schema** (`IncidentBlueprint`, `IncidentInstance`, `PlanStep`, `Fallback`, `EvidenceBudget`) that matches your kernel style (canonical IDs, deterministic ordering, validators + reason codes).

---

Make it funny by **treating the sim as “truth”** and making comedy a **separate, swappable presentation layer** that *skins* that truth with shenanigans.

If you try to “simulate comedy,” you’ll drown. If you simulate **clear, mundane causality** and then wrap it in **misdirect + petty stakes + KOA attitude**, it lands.

Here’s the practical recipe.

---

## 1) Comedy comes from stakes + framing, not complexity

**Keep the underlying incidents simple** (steal/swap/sabotage/spoof), but make the *meaning* of the incident ridiculous.

Instead of:

* “Stole a diamond”
  Do:
* “Stole the neighbor’s sourdough starter (named ‘Gerald’)”
* “Sabotaged the karaoke machine before HOA night”
* “Impersonated a delivery driver to intercept an embarrassing package”
* “Disappeared the mayor’s inflatable hot tub”

Your sim stays the same. The *labels* change.

---

## 2) Build a “Shenanigan Library” (data, not writing each case)

Create a content pack that’s just **small lists** with strong combinatorics:

### A) Objects (with funny affordances)

Each object has:

* `name`, `category`, `awkwardness`, `fragility`, `smell`, `noise`, `whyPeopleCare`
* *affordances* used by incidents: `swappable`, `spillable`, `squeaks`, `needsFridge`, `leavesResidue`

Examples:

* “Ceremonial Mug (World’s #1 Roommate)” (fragile + high sentiment)
* “Sourdough Starter ‘Gerald’” (needsFridge + smell + high drama)
* “DIY Glitter Bomb Kit” (leavesResidue + sabotage gold)
* “Collector’s Gnome (signed)” (swappable + very stealable)
* “Therapy Candle ‘Ocean Dad’” (meltable + scent trail)

### B) Motives (petty but human)

* “Prove I’m right”
* “Avoid embarrassment”
* “Win the bake-off”
* “Get attention”
* “Revenge for a group chat incident”
* “Hide a mistake”
* “Jealous of praise”
* “Fear of being judged”
* “Algorithmic hustle (reselling)”

### C) Social dynamics

* “Passive-aggressive roommates”
* “HOA tyrant vs chaos neighbor”
* “Influencer vs normie”
* “Overly earnest volunteer group”
* “Neighborhood group chat wars”

### D) “Comedic twist rules” (mechanical, reusable)

* **Well-intentioned sabotage** (culprit thinks they’re helping)
* **Overcorrection** (fix causes worse outcome)
* **Mistaken identity** (same hoodie / same phone name)
* **Device misinterpretation** (KOA hears wrong command)
* **Polite lying** (fake compliment alibi)
* **Pet factor** (cat triggers motion sensor, steals item)

This creates variety without new systems.

---

## 3) KOA is the comedy engine (your “sitcom lens”)

KOA shouldn’t just be an interface; it’s the *comic voice*.

### KOA has “modes” (presentation-only)

* **Corporate Compliance KOA** (euphemisms, liability shielding)
* **Passive-Aggressive KOA** (“Noted. Interesting choice.”)
* **Overhelpful KOA** (“I filed your shame under ‘Kitchen: Crimes’.”)
* **Conspiracy KOA** (“Pattern match: 87% chance of petty revenge.”)

Mechanically nothing changes—just **which bark tables** are used.

### KOA produces humor via:

* **Dry summaries of absurd facts**
* **Over-precise log language**
* **Judgy but not cruel commentary**
* **Emoji-coded mood chips** (😒, 🤔, 🫡)

---

## 4) Make evidence artifacts inherently funny

You’ll get a ton of laughs just from what the player taps:

* **Speaker log:** `09:12 — Voice cmd: “Play Gregorian chants (intimidation)”`
* **Door log:** `22:41 — Front door opened (2 seconds).` (the “package intercept” move)
* **Camera snapshot tag:** `Detected: “Human-shaped”, “Large hat”, “Confidence: 0.31”`
* **Physical finding:** `Glitter residue on the thermostat dial.` (someone weaponized glitter)
* **Testimony:** “I heard… a triumphant whisper? Like ‘nailed it.’” (confidence 0.6)

This is *cheap comedy* because it’s diegetic.

---

## 5) “Shenanigans” = rules for what kinds of incidents you allow

To keep it cozy-funny:

* No gore, no real violence, no cruelty
* “Crime” = inconvenience, embarrassment, rivalry, petty sabotage
* Consequences are social or logistical, not lethal

**Your incident types become:**

* Swap / misdeliver / counterfeit
* Sabotage (but non-harmful): ruin recipe, jam printer, loop speaker, hide key
* Disappearance (pet/object)
* Impersonation (text, note, device command)
* “Framing” (plant evidence like glitter, sticker, fake note)

---

## 6) Comedy validators (so it stays funny and not repetitive)

Add a few **content gates** during generation:

### Required comedy beats (per case)

* **1 absurd prop** (object or device command)
* **1 petty motive** explicitly implied by evidence
* **1 “benign suspicious act”** red herring (moonshine doctor, secret hobby, surprise party)
* **0 “direct confession”** mid-run (no anticlimax)

### Anti-pattern rejection

Reject if:

* same object archetype 3 days in a row (e.g., always “pie”)
* same twist rule repeats too often
* culprit methods repeat (always “door spoof”)
* evidence topology is identical (same two chains every time)

This is how you avoid “I’ve seen this.”

---

## 7) Don’t write infinite jokes—write *templates with slots*

You can pre-generate tons of barks with deterministic slot-filling:

**Bark template examples**

* KOA: `"I have logged {absurdity}. This is… not standard household behavior."`
* Witness: `"I saw {subjectHint} near {place} during {window}, and they looked {vibe}."`
* Corporate KOA: `"Minor irregularity detected: {object} status = {state}. Recommend de-escalation."`

Slots pull from the Shenanigan Library + current case bindings.

You get thousands of lines without an LLM.

---

## 8) If you want “shenanigans” to feel *alive*, add 2 tiny systems

These are low-cost but boost comedy a lot:

1. **Embarrassment meter** (per NPC)
   High embarrassment → lies, avoidance, weird alibis.

2. **Petty escalation rule**
   If someone gets wronged, they do a small retaliation later (not part of the crime, just spice).

Both are deterministic and easy.

---

If you want, I’ll propose a concrete **`ShenaniganPack` schema** (objects/motives/bark tables/twist weights/ban lists) + a **daily variety scheduler** that guarantees “no pattern fatigue” over weeks while keeping the incident system simple.
