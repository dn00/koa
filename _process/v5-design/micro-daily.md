Cool — here’s a **strict simplification** of the “full micro-trial” that keeps the *feel* (KoA as opponent, non-obvious plays, objection drama) while cutting the stuff that inflates cognitive load (Scrutiny bar, tempo rules, multiple counters).

## Micro-Trial v1.5: Simple, but not “dumb”

### What you CUT

* **Scrutiny meter** (gone)
* **Tempo as a separate rule** (gone)
* **Multiple counters** (gone)
* **Risk pips** (optional; I’d drop them in Standard)
* **Tactics** (off for Standard Daily)

### What you KEEP

* **Belief target** (win condition)
* **Known Facts** (Turn 1 isn’t blind)
* **One predictable KoA “Tax” rule** (keeps non-obvious sequencing)
* **KOA Flag after Turn 2** (system check beat + replayability)
* **Slot/tag banter + statement stitch** (wow factor)

---

# The ruleset (5 “in-head” rules)

**1) 3 Hearings.** Play **1 Evidence** per hearing (3 total).
**2) Belief ≥ 70** after Hearing 3 = win.
**3) Truth:** +Strength. **Lie:** −(Strength−1).
**4) KoA Tax (ONE rule):** if you **repeat an evidence type**, KoA applies **−2** to your **next** play.
**5) After Hearing 2: KOA Flag (System Check)** on your strongest card:

* **Stand By:** Truth +2 / Lie −4
* **Withdraw:** that card becomes **−2 flat** (overwrite its original delta)

That’s it.

This preserves:

* **Deduction** (Known Facts + contradictions)
* **Sequencing pressure** (type repeat tax)
* **Mid-run high-stakes decision** (KOA Flag system check)

…and removes the “systems tax” of Scrutiny/Tempo/Counters.

---

## Why this doesn’t sacrifice too much depth

### You still have three distinct decision layers

1. **Deduction layer:** which cards are likely lies given Known Facts + claim plausibility
2. **Planning layer:** avoid repeat types *unless the value is worth the tax*
3. **Commitment layer:** The KOA Flag forces you to reassess whether your strongest play was worth defending

That’s enough for 10-minute “Wordle-style thinking” without extra meters.

---

## How KoA still feels like an opponent (without counters)

KoA’s “opposition” is now expressed as:

* **Telegraphed stance line:** “I’m watching for overreliance on one channel.”
* **Tax callout when triggered:** “Same channel again? I’m discounting this.”
* **Flag scene:** KoA quotes your own statement beat and asks whether to keep it on record or roll it back.

It *feels* reactive, but mechanically it’s just **one rule**.

---

## Difficulty scaling knobs that stay clean

You can scale forever using just these:

* **Threshold:** 70 → 75 → 80
* **Tax magnitude:** −2 → −3
* **Lie design complexity:** more relational lies, fewer direct contradictions
* **Flag harshness:** Stand-by lie penalty −4 → −5
* **Evidence distribution:** fewer “obviously safe” cards

No new systems required.

---

## Pick-up-and-play expectation for this version

* **Rules comprehension:** ~45–90 seconds
* **First run:** ~3–6 minutes (reading + thinking)
* **After 2–3 dailies:** ~2–4 minutes if they rush, **10+** if they chase Flawless/Perfect

---

## If you only keep ONE extra thing from “full micro-trial”

Keep **the Tax rule** (type repeat) + **KOA Flag overwrite-to-−2**.

Those two are doing most of the work Scrutiny/Tempo/Counters were trying to do, but with way less mental overhead.

---

Yes — **tactics can be in Micro-Trial v1.5**, but only if you add them in a way that **doesn’t create a 6th “in-head rule.”** The trick is to make tactics feel like a **single optional “Move” button** with a tiny fixed set, not a deck system.

## Recommended integration: “0–1 Move per hearing” (fixed mini-kit)

Keep the 5 rules exactly as-is, and add one *UI-level* affordance:

**Move (optional):** once per hearing, you may play **one Move** that does exactly what it says.

Players don’t need to “learn tactics” as a system; they just learn **three buttons**.

### Constraints (non-negotiable)

* **Fixed kit of 3 moves** (no draw, no loadout, no collection)
* **0–1 move per hearing**
* **Single-sentence effects**
* **No new meters** (no energy, cooldowns, stacks)
* Moves must interact only with the existing elements: **Belief**, **KoA Tax**, **KOA Flag**, or **Known Facts**

## The 3 moves I’d ship in v1.5

These support deduction without becoming “hint-oracle”:

1. **Probe** *(signal, double-edged)*
   “Reveal this evidence’s axis tag (timeline/channel/coherence). **−2 Belief**.”

2. **Buffer** *(control)*
   “Ignore the **next KoA Tax**.”

3. **Reframe** *(protect)*
   “If this evidence is a **lie**, reduce its penalty by **2**.”

That’s it. No other moves.

## Why this doesn’t break v1.5 simplicity

* The core puzzle is still: **Known Facts → pick evidence → manage type repeat → KOA Flag decision.**
* Moves create optional skill expression:

  * Probe reduces blind openings
  * Buffer enables intentional type repeats
  * Reframe creates a risk-friendly line for big strength

## The one thing to avoid

Don’t let tactics also introduce “support evidence” (2 evidence) in this version.
If you add moves, keep the per-hearing action as:

**Pick 1 Evidence + optionally 1 Move.**

(“2 evidence plays” can come later as a specific Move like **Bundle Artifacts**.)

## My call

If you’re shipping Micro-Trial v1.5 as the daily: **yes, include moves**—but only as a fixed 3-move kit, optional, no deckbuilding yet. That gives you better Turn-1 agency and replayability with minimal extra cognitive load.


---

  But the specific moves need adjustment for V5:                                                                                                          
                                                                                                                                                          
  Probe problem: "Reveal axis tag" doesn't exist in V5. Players see:                                                                                      
  - Card attributes (type, location, time)                                                                                                                
  - Known Facts                                                                                                                                           
  - KOA barks (but not labeled by axis)                                                                                                                   
                                                                                                                                                          
  There's no "axis tag" to reveal. Probe needs to fit V5's deduction model.                                                                               
                                                                                                                                                          
  V5-compatible Probe options:                                                                                                                            
  - "KOA tells you if this card contradicts a Known Fact. −2 Belief."                                                                                     
  - "Reveal whether this card is same-type as a lie. −2 Belief." (vague but useful)                                                                       
  - "Lock this card from KOA Flag challenge. −2 Belief." (different utility)                                                                             
                                                                                                                                                          
  Buffer: Works as-is. Skip type tax. Clean.                                                                                                              
                                                                                                                                                          
  Reframe: Works as-is. Softens lie penalty. Insurance play.                                                                                              
                                                                                                                                                          
  My recommendation:                                                                                                                                      
                                                                                                                                                          
  1. Ship v1.5 without moves first                                                                                                                        
  2. Run playtests, collect "I felt blind" feedback                                                                                                       
  3. If feedback says T1 is a coin flip, add moves                                                                                                        
  4. Redesign Probe for V5's actual mechanics                                                                                                             
                                                                                                                                                          
  The moves are good insurance against the design being too luck-based. But we don't know if we need that insurance yet. Playtest first.                  
                                                                                                                                                          
  If you want moves in v1.5 anyway, I can implement them with a V5-compatible Probe. Your call.          
