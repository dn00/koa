Absolutely — if the banter has to be **the thing that sells the game**, you want a system that’s:

* **natural cadence** (call/response, escalation, callbacks)
* **mechanically grounded** (KoA reacts to *patterns* and *stakes*, not random jokes)
* **content-scalable** (no O(n²) pair scripts)
* **fail-closed** (no hint leaks, no “this card is a lie” before reveal)

Below is a **build-ready banter system** that does that, and *still lets cards have LLM-generated dialogue*.

---

## Banter System v1: Two-layer dialogue (Library + Card-Specific)

### Layer A — Slot/Tag Library (KoA’s “structural” lines)

Used for: opening stance, mid-turn barks, pressure callouts, objection prompts, end verdict.

**Why:** gives consistent cadence, avoids leakage, and stays deterministic.

### Layer B — Card-specific LLM dialogue (YOU + KOA quips)

Used for: *what you say when you play a card* + *KoA’s verdict quip after the reveal*.

**Why:** this is where the “wow / natural / specific” comes from.

This combination is the sweet spot: **LLM gives flavor and specificity**, **library enforces pacing + safety**.

---

## The cadence (what happens each hearing)

Each hearing should feel like a tiny scene:

1. **YOU (card presentLine)** — 1 sentence (optional 2nd)
2. **KOA (pre-reveal bark)** — 1 sentence, ambiguous (library)
3. **SYSTEM reveal** — Truth/Lie + points
4. **KOA (post-reveal quip)** — 1 sentence, specific to that card (LLM-generated)

That’s “talking back and forth” without being long.

After Hearing 2:

* **Flag scene** (2–4 lines total) where KoA quotes your *statement beat* and asks whether to keep it on record or roll it back.

---

## What the LLM must generate per card

### EvidenceCard dialogue payload (minimum)

For each card, generate:

* `presentLine` (YOU)
* `supportLine` (optional)
* `koaQuipTruth` (KOA, after reveal if truth)
* `koaQuipLie` (KOA, after reveal if lie)

**Important:** KoA quips can be sharp and specific, because the reveal has happened.
But they must **not reference** any *unplayed* cards.

### Suggested schema

```ts
type CardDialogue = {
  presentLine: string;        // YOU line, 1 sentence
  supportLine?: string;       // optional 2nd sentence
  koaQuipTruth: string;       // KOA after reveal if TRUTH
  koaQuipLie: string;         // KOA after reveal if LIE
  callbackNoun?: string;      // short phrase used for later callbacks ("router reboot")
};
```

---

## KoA Library (slot/tag driven)

### Slots you actually need for daily

* `OPENING_STANCE`
* `PRE_REVEAL_BARK` (after each play, before reveal)
* `PATTERN_CALLOUT` (if your one “Tax” rule triggers, or whatever pressure you keep)
* `FLAG_PROMPT`
* `FLAG_RESOLVE`
* `FINAL_VERDICT`

### Tags (keep small, reusable)

* `axis`: `timeline | channel | plausibility | coherence`
* `valence`: `neutral | suspicious | approving`
* `intensity`: `1 | 2 | 3`
* `event`: `big_gain | big_loss | repeat_type | objection | close_call`

### Deterministic selection

`line = pick(slot, tags, seed)`
So two people with same seed get the same KoA vibe.

---

## Statement Stitcher (the “lawyer energy” without pair scripts)

Maintain 2–3 “beats” that KoA can quote later.

```ts
type StatementSoFar = {
  beats: string[];          // max 3
  dominantAxes: Axis[];     // derived from played cards
  lastCallbackNouns: string[]; // recent 1–2 for KoA callbacks
};
```

### Update rule

After each play:

* add one beat derived from the card’s `presentLine` + a link phrase
* compress if >3 beats

### Link phrase library (global, small)

Examples:

* “Which lines up with the timeline.”
* “And it explains the gap.”
* “That’s the physical side. Now the digital.”

This gives continuity without O(n²) bespoke pair narration.

---

## Safety: hard rules to prevent hint leaks

### 1) Pre-reveal KoA lines must be **non-committal**

**Banlist** (pre-reveal only): “false”, “lie”, “fabricated”, “not true”, “that’s wrong”, “you’re lying”, “I don’t buy it” (too direct).

Pre-reveal is allowed to be suspicious, but must be explainable by ≥2 hypotheses:

* weak axis fit
* overused type
* high strength “too clean”
* internal coherence concerns

### 2) Post-reveal quips can confirm truth/lie, but must be local

Allowed: “That timestamp doesn’t match the record.”
Not allowed: “And the kitchen photo is also fake.” (references unplayed)

### 3) No unique attribute pinpointing in library lines

Library lines must never mention:

* specific location names
* exact times
* card IDs
* single-card-identifying details

Card-specific quips can mention those details **only after reveal**.

### 4) Fail-closed validator

Run a deterministic validator that rejects puzzles if dialogue violates:

* pre-reveal banlist
* references to unplayed evidence
* prescriptive advice (“Next time play…”)
* accidental solution leakage (“Only one of these can be true…”)

---

## Making it *really* good (the “natural” part)

### KoA voice bible (enforced)

* short sentences
* interrupts (“—” and “…”)
* skeptical but funny, not mean
* repeats player’s wording sometimes (callbacks)
* escalation curve across 3 hearings:

  * H1: dismissive/neutral
  * H2: sharper + Objection setup
  * H3: decisive verdict energy

### Micro-structure that creates cadence

* **Call → doubt → reveal → punchline** every turn
* A single recurring motif per day (“You keep leaning on logs.”)
* One “signature line” per puzzle (opening or verdict) to make shares memorable

---

## Example (one hearing, showing the cadence)

**YOU (presentLine):** “Router logs show a reboot at 10:41. That explains the camera gap.”
**KOA (pre-reveal bark):** “Mm. A tidy explanation. Tidy explanations worry me.”
**REVEAL:** TRUTH +9
**KOA (post-reveal quip):** “Fine. That timestamp is real—and it *does* buy you a gap.”

That reads like a conversation, but is mechanically safe.

---

## Optional upgrade (if you want even more “back-and-forth”)

Add **one** of these, not both:

1. **KoA “interrupt” line** only on big deltas (±8+): one extra sentence.
2. **Player “reframe” supportLine** only when Objection is coming (H2): makes the Objection hit harder.

---

## Implementation note (important)

If you want card-specific KOA lines **and** determinism:

* Generate `koaQuipTruth` and `koaQuipLie` upfront in the daily bundle
* Store them in the puzzle JSON (so runtime doesn’t call LLM)
* Pick deterministic variants if you allow 2–3 options per quip

---

If you tell me which mechanics you’re keeping in the simplified build (just **repeat-type tax + objection**, or also **tempo/scrutiny**), I’ll give you the exact **tag mapping rules** (how to set `axis/valence/intensity/event` from game state) so KoA’s barks always match what the player *just did* and feel unnervingly “alive.”
