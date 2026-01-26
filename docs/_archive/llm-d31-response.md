Net: this **does** make sense, and it has real “meaning” in the game-design sense. D31 explicitly fixes the prior failure mode (“inventory checking”) by moving the puzzle from *static matching* to *adversarial sequencing under visible constraints*—AURA is now an opponent who plays counter-evidence, and the player wins by planning the order of testimony and refutations, not by simply possessing the right tags. 

## Why this is not “gap-filling”

Each added mechanism creates a distinct decision (and each maps cleanly to the fiction of cross-examination):

* **Visible counter-evidence + preview** creates *deduction and planning*: you can see what AURA will challenge before committing, so your choice is “what do I submit now, knowing what she’ll play?”  
* **Refutations** create *trade-offs and tempo*: they cost turn bandwidth but unlock full value (and now, retroactive value), which makes sequencing meaningfully tactical rather than cosmetic.  
* **Soft contradictions** add *forgiveness without removing logic*: minor contradictions let novices continue while still imposing a cost (scrutiny), aligning with your invariants around “mistakes recoverable” and “failure is learnable.”  
* **Multiple paths + comfortable margins** are explicitly designed to avoid “only one right answer” and “math gotcha” losses.  

So no, this is not “adding stuff to add stuff.” The mechanics are doing work: they create *mid-game decisions* (your explicit goal after D30 was “not solved-at-glance”).  

## The strongest part

The “AURA plays one counter per turn” rule is the key that prevents the game from collapsing back into static hand-analysis. It makes sequencing and baiting real (and the preview step makes it fair).  

## Critical fixes before you treat D31 as locked

There are a few spec-level inconsistencies that will create confusion or “unfair-feeling” moments if you implement literally:

1. **Audit: loss vs. penalty loop conflict**

* Win/Lose says you lose when “scrutiny reached 5.” 
* Scrutiny section says scrutiny 5 triggers an **AUDIT** (heal resistance, quarantine a card, reset scrutiny). 
  Pick one. My recommendation: *audit is a penalty state, not immediate loss*, and you only lose on (a) turns exhausted, or (b) a second audit / “audit escalation” threshold.

2. **Rounding inconsistency (player-favoring vs. code)**

* Damage code uses `Math.floor(baseDamage * 1.25)`. 
* Resolved decisions say corroboration rounding should “Round UP to favor the player.” 
  Align this (use `ceil` or specify a deterministic rounding policy globally).

3. **Counter effect type not fully implemented in damage**
   Counters have `effect: 'CONTEST' | 'BLOCK'` (0% vs 50%), but the damage calculation shown only applies a 50% penalty and doesn’t branch on `BLOCK`.  
   You should explicitly implement: `BLOCK => 0 damage and does not satisfy concerns`.

4. **Counter selection order needs to be explicitly defined (and surfaced)**
   Right now it’s “first applicable” across submission order and counter list order. 
   That can be a feature (skill: baiting), but only if the UI makes ordering legible and consistent. If you don’t want ordering exploits, have AURA pick the *strongest applicable* counter deterministically (e.g., BLOCK > CONTEST; or max prevented damage).

## One design risk to watch

If too many puzzles reduce to “play evidence → play its refutation” as an obvious two-step, the game can drift back toward a rote checklist.

Your own rules already mitigate this (multiple paths, brute-force viability on easier modes, max 1 trap, visible counters).  
To keep depth, ensure a healthy mix of puzzles where:

* **Refuting is optional** (you can accept contest and still win, but with worse score). 
* **Refuting later is valuable** (retroactive restore creates timing decisions). 
* **Corroboration competes with safety** (the best power combo might flirt with MINOR contradictions/scrutiny).  

## Bottom line

This foundation is coherent, thematic, and meaningfully puzzle-like. It matches your stated invariants (skill expression, aha moments, no hidden gotchas, multiple solutions, not solved-at-glance). 

If you fix the few internal contradictions (audit, rounding, BLOCK handling, counter ordering), D31 is strong enough to build a prototype and start human playtests without worrying you’re “filling gaps with stuff.”
