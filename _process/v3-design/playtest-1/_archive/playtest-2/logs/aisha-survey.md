# Aisha — Playtest Log & Survey
## Player Profile: 30, software engineer, chess.com 1600, Hearthstone Legend, ex-competitive MTG

---

# THINK-ALOUD LOGS

## Puzzle 1: "The Power Outage" — Target: 5

**Opening Analysis:**
Hint says one lie claims something after 11 PM. After-11 PM cards: fitbit (11:45), breaker_log (11:15), motion_base (11:30). One of those three is a lie. The other lie is among: doorbell (7 PM), wifi_log (8:30 PM), thermostat (9 PM).

Strategy: I decided to probe breaker_log (Str 5) on T1. Highest strength card — if truth, +5 and I nearly hit target. If lie, I learn early. High-variance play. In hindsight: terrible risk management.

**T1: breaker_log (Str 5)**
> YOU: "The breaker got reset at 11:15 — the smart panel logged it. That wasn't me. It reset itself."
> KOA VERDICT: LIE. Score: -5.
> KOA: "Manually reset at 11:15 PM? The breaker was never touched. Nice try."
> REACTIVE HINT: "The breaker log is a fake. One down — the other lie? It's not after 11 PM. Check your earlier alibis."

Post-T1: Now I know the other lie is pre-11 PM (among doorbell, wifi_log, thermostat). All remaining post-11 PM cards are safe. But at -5, even playing two confirmed truths (motion_base 4 + fitbit 3 = 7) only gets me to 2. Irrecoverable. The -5 penalty from a high-strength lie is fatal.

**T2: motion_base (Str 4) — TRUTH. Score: -1.**
**T3: fitbit (Str 3) — TRUTH. Score: 2.**

**Final: 2/5. BUSTED.**
> KOA: "The basement has more stories than a library. And half of them don't check out."
> Lies: breaker_log (HINT LIE), wifi_log (STEALTH LIE).

**Post-mortem:** Catastrophic mistake playing a Str-5 suspected card on T1. No recovery path exists from -5 in this puzzle. Lesson: NEVER play high-strength cards you aren't confident about. The downside is non-recoverable. EV doesn't matter if variance kills you.

---

## Puzzle 2: "The Thermostat War" — Target: 7

**Opening Analysis:**
Hint: one lie is from a living room sensor, the other isn't. LR cards: light_lr(5), motion_lr(4), temp_lr(3). Non-LR: phone(1), smartwatch(3), doorbell(4).

Applied P1 lesson: play low-strength card on T1 to minimize downside and gather info.

**T1: phone (Str 1)**
> YOU: "My phone was dead to the world after 12:30. Zero screen time. I wasn't up scrolling — I was sleeping."
> KOA VERDICT: TRUTH. Score: +1.
> REACTIVE HINT: "Phone was off. Great. But something you were wearing tells a different story."

Post-T1: "Something you were wearing" = smartwatch. KOA is flagging smartwatch as the non-LR lie. This means doorbell(4) is safe. One of {light_lr, motion_lr, temp_lr} is still the LR lie — unknown which.

**T2: doorbell (Str 4) — TRUTH. Score: 5.**
**T3: light_lr (Str 5) — TRUTH. Score: 10.**

**Final: 10/7. FLAWLESS. 0 lies played.**
> KOA: "Your alibis are airtight. The cat remains a suspect. The cat has no comment."
> Lies: smartwatch (STEALTH LIE), motion_lr (HINT LIE).

**Post-mortem:** Reactive hint was incredibly specific — directly identified the non-LR lie. T3 was a 2/3 gamble on which LR card was safe; got lucky picking light_lr over motion_lr. Strategy was sound but T3 still had irreducible variance.

---

## Puzzle 3: "The Hot Tub Incident" — Target: 8

**Opening Analysis:**
Hint: "One lie flat-out denies something happened — protests too much. The other is subtler."

Hypothesis: spa_pump(5) "protests too much" — it denies the pump ran, but the deck is flooded with hot tub water. That's the most blatant contradiction. water_meter(3) is "subtler" — claims baseline usage but there's obviously excess water. If correct, safe cards: fitbit(2), thermostat(3), smart_lock(4), motion_hall(5).

**T1: thermostat (Str 3)**
> YOU: "The hallway held at 71 all night. If someone opened the back door, you'd see a temp drop. You don't."
> KOA VERDICT: TRUTH. Score: +3.
> REACTIVE HINT: "Hallway temp held steady. But temperature isn't the only utility KOA's watching."

Post-T1: "Utility" — KOA is pointing at water_meter. Confirms my hypothesis. Both lies identified with high confidence now.

**T2: motion_hall (Str 5) — TRUTH. Score: 8.**
**T3: smart_lock (Str 4) — TRUTH. Score: 12.**

**Final: 12/8. FLAWLESS. 0 lies played.**
> KOA: "Every alibi checks out. You told nothing but the truth. $2,200 in damages, though. KOA is billing you anyway."
> Lies: spa_pump (HINT LIE), water_meter (STEALTH LIE).

**Post-mortem:** Perfect read. Opening hint + scenario logic identified both lies before playing. Reactive hint confirmed. No gambling required. The puzzle becomes much more solvable once you learn to read the hints structurally rather than just informationally.

---

## Summary: P1 BUSTED (2/5), P2 FLAWLESS (10/7), P3 FLAWLESS (12/8)

---

# SURVEY

## Part 1: Quick Reactions

**QR1:** Punished.
**QR2:** Satisfied.
**QR3:** Yes.
**QR4:** Yes, clearly.
**QR5:** P3 — I could apply everything I'd learned and execute a clean read from the hint alone.

## Part 2: Structured Assessment (1-7)

**S1:** 6 — The learning curve kept me engaged; I wanted to apply P1 lessons.
**S2:** 6 — Especially T3 when you're committing with incomplete info.
**S3:** 4 — I cared about the system, not the narrative. The scenarios are fine as flavor.
**S4:** 7 — After P1 I immediately redesigned my entire approach.
**S5:** 4 — I was deliberate, not lost-in-flow. This is a thinking game.
**S6:** 6 — Clear enough, though "reach the target" could specify >= vs exactly.
**S7:** 5 — P1's hint was clear about the after-11-PM lie. P3's was more interpretive.
**S8:** 7 — Completely intuitive. Truth adds, lie subtracts. Simple.
**S9:** 7 — P1 loss was entirely my fault. I played a high-variance card on T1.
**S10:** 6 — Verdict feedback is binary and immediate. Good.
**S11:** 6 — The hints reliably partition the card pool. Very useful once you learn to read them structurally.
**S12:** 7 — P2's reactive hint literally identified the lie by description. Game-changing.
**S13:** 6 — It's deduction with some irreducible variance. More puzzle than guess, but not fully solvable.
**S14:** 7 — After P1, I always knew which plays were confirmed safe vs. gambles.
**S15:** 6 — Location was the primary axis for hint interpretation. Time mattered in P1. Source was less useful.
**S16:** 7 — By P3 I had a full flowchart: parse hint, hypothesize, low-strength probe, confirm, execute.
**S17:** 5 — Fair in hindsight. Punishing if you don't respect variance on T1.
**S18:** 3 — P3 was actually easiest because the hint + scenario logic were most transparent.
**S19:** 4 — Difficulty didn't increase linearly. P1 was hardest because I hadn't learned the meta. P3 was easiest despite higher target.
**S20:** 7 — P1 was entirely my mistake. No complaints.
**S21:** 2 — The game rewarded careful play. No punishment for reasonable strategy.
**S22:** 5 — KOA has personality but I treated it as a system, not a character.
**S23:** 5 — "The cat has no comment" was good. Most lines are functional.
**S24:** 4 — I appreciated the reactive hints as info, not as banter.
**S25:** 6 — KOA's hints directly informed card selection.
**S26:** 6 — Every word from KOA is potential signal. Of course I paid attention.
**S27:** 3 — I wanted to solve the system, not beat a character.
**S28:** 3 — The narration is flavor. I processed it for clue content, not immersion.
**S29:** 5 — Mechanically, yes — you're asserting a claim. It works thematically.
**S30:** 5 — Structurally, yes. Emotionally, I experienced it as an optimization puzzle.
**S31:** 3 — I cared about the score and tier, not who was in the basement.
**S32:** 5 — I read narrations looking for logical inconsistencies with the scenario.
**S33:** 7 — P2 and P3 wins felt earned. P1 loss felt earned too.
**S34:** 7 — FLAWLESS is the only acceptable outcome once you know the system.
**S35:** 6 — The tier system creates clear optimization targets.
**S36:** 7 — Lie reveal is the most important learning moment. It's where you validate your model.
**S37:** 7 — Absolutely. Understanding which cards were lies is how you improve.
**S38:** 7

## Part 3: Comparisons

**C1:** Poker. The core mechanic is risk management under partial information, with deduction layered on top. You're reading signals, managing variance, and choosing bet sizes (card strength).
**C2:** The hint system gives you deductive structure that poker lacks — you can reason, not just read.
**C3:** Poker has deeper decision trees, opponent modeling, and long-run EV convergence. This is a 3-turn game with limited replay variance per puzzle.
**C4:** "This game is basically Poker but with alibi cards and a detective narrator."

## Part 4: Emotional Journey

**E1:** Parsing for structure.
**E2:** Mapping hint to card attributes.
**E3:** Calculating EV per slot.
**E4:** Hypothesis testing.
**E5:** Scanning for logical inconsistencies.
**E6:** Data point received.
**E7:** Constraint narrowed.
**E8:** Executing on information.
**E9:** Committing with residual uncertainty.
**E10:** Validation (or invalidation) of model.
**E11:** Ground truth — most valuable moment.
**E12:** Would share FLAWLESS results.

## Part 5: Key Moments

**K1:** Realizing after P1 that playing a Str-5 suspected lie on T1 creates an irrecoverable state. That's the meta insight — the game is asymmetric. Downside of lies is proportional to strength, and you can't recover from a high-strength T1 lie.
**K2:** P2, reactive hint said "something you were wearing" — immediately ruled out smartwatch and confirmed doorbell safe.
**K3:** P3 FLAWLESS with a clean read from the opening hint alone. Full system mastery.
**K4:** P1, realizing at -5 that no combination of remaining cards could reach target. The game was over after T1.
**K5:** P2 T3 — choosing between three LR cards when I only knew one was a lie but not which. 1/3 chance of failure with no further info. Irreducible randomness.
**K6:** "The basement has more stories than a library. And half of them don't check out." — good BUSTED line. Memorable.
**K7:** No. The design is fair. Losses were my fault.
**K8:** Whether the reactive hint's specificity is consistent. P2's hint was very direct ("something you were wearing"). P1 and P3 were more ambient. I'd want to know if hint specificity follows a rule.

## Part 6: Strategy & Learning

**L1:** P1: played highest-strength card as a "probe" — wrong. P2: played lowest-strength card (Str 1) to minimize downside. P3: played mid-strength card I was confident was truth. Strategy evolved from "probe with impact" to "probe safely, confirm, then execute."
**L2:** Used it to partition cards into two groups (one containing each lie). This is the foundation of all deduction in the game.
**L3:** Yes. P2's reactive hint identified the non-LR lie by description, letting me play doorbell with certainty on T2. P3's confirmed my water_meter hypothesis.
**L4:** Lies tend to be the cards that most directly contradict the scenario's physical evidence. The "stealth" lie is the one that quietly doesn't match (wifi_log claiming basement PC activity when you said you were upstairs; smartwatch claiming sleep during the incident; water_meter showing baseline during a flood). The "hint" lie is the bold denial.
**L5:** P1: play thermostat(2) on T1 instead of breaker_log(5). Use the reactive hint to narrow the pre-11 PM lie. Then play two confirmed high-strength truths. Would likely CLEAR or FLAWLESS.
**L6:** There's a correct strategic framework (minimize T1 downside, use hints to partition, play confirmed truths). Individual puzzles require reading the hint and scenario, so it's not purely mechanical. But the meta-strategy is stable.

## Part 7: Product & Market Fit

**M1:** Daily puzzle.
**M2:** Month+ — as long as puzzles have varied hint structures and don't become formulaic.
**M3:** $1-2.
**M4:** Daily puzzles and hard mode (maybe 3 lies, or no opening hint).
**M5:** Tolerable.
**M6:** Phone app.
**M7:** Only FLAWLESS or funny KOA.
**M8:** "It's a 3-minute deduction puzzle with real risk management — like Wordle but with bluffing."
**M9:** 2-5 min.
**M10:** Just right.
**M11:** Lunch.
**M12:** Streak and new story.
**M13:** Yes, after solving.
**M14:** Friends only.
**M15:** "A 3-turn deduction game where you play alibi cards to prove your innocence, but two of them are lies that blow up your score."
**M16:** Partially accurate. The "comic strip" part undersells the deduction mechanics. It's more "daily puzzle meets interrogation sim."
**M17:** Puzzle variety that prevents the meta-strategy from becoming rote. Vary hint structures, number of lies, or add mechanics like "one card is ambiguous — could be truth or lie depending on another card."
**M18:** The difficulty scaling is inverted — P1 felt hardest (learning tax), P3 felt easiest (highest target but most readable hints). Consider making later puzzles harder by making hints more ambiguous or adding a third lie.

## Part 8: Run Log

### Puzzle 1: "The Power Outage"
- **Cards:** T1: breaker_log, T2: motion_base, T3: fitbit
- **Verdicts:** LIE, TRUTH, TRUTH
- **Score/Target:** 2/5
- **Tier:** BUSTED
- **Hint usage:** Used opening hint to identify after-11-PM group. Played INTO the suspected group to probe — wrong approach.
- **Reactive hint help:** Yes — confirmed other lie was pre-11 PM. But damage was done.
- **Learned:** Never play high-strength suspected cards on T1. Downside from Str-5 lie is irrecoverable.

### Puzzle 2: "The Thermostat War"
- **Cards:** T1: phone, T2: doorbell, T3: light_lr
- **Verdicts:** TRUTH, TRUTH, TRUTH
- **Score/Target:** 10/7
- **Tier:** FLAWLESS
- **Hint usage:** Partitioned cards into LR vs non-LR groups. Played lowest-strength non-LR card on T1.
- **Reactive hint help:** Yes — "something you were wearing" identified smartwatch as the non-LR lie. Confirmed doorbell safe for T2.
- **Learned:** Low-strength T1 probe + reactive hint can identify one lie cleanly. Remaining 1-in-3 gamble on the other group is acceptable risk.

### Puzzle 3: "The Hot Tub Incident"
- **Cards:** T1: thermostat, T2: motion_hall, T3: smart_lock
- **Verdicts:** TRUTH, TRUTH, TRUTH
- **Score/Target:** 12/8
- **Tier:** FLAWLESS
- **Hint usage:** "Protests too much" = spa_pump (denying pump activation despite flood). "Subtler" = water_meter (baseline claim contradicts physical evidence). Both lies identified from hint + scenario logic alone.
- **Reactive hint help:** Confirmed water_meter suspicion ("utility KOA's watching"). Validation, not discovery.
- **Learned:** When you understand the hint grammar and can read the scenario for contradictions, both lies can be identified before playing. The game rewards literacy in its own system.

## Part 9: Final Thoughts

**F1:** Fresh hint structures that prevent pattern-matching from trivializing the deduction. A hard mode. Streak tracking. Seeing solve-rate stats after completing each puzzle.
**F2:** If every puzzle uses the same hint format (one lie is [location], the other isn't) and the "protests too much" lie is always the highest-strength card in the suspect group. Formulaic = solved = boring.
**F3:** Add a mechanic for the stealth lie. Right now the opening hint addresses one lie and the reactive hint often addresses the other. By P3 I could identify both lies before T1. The stealth lie needs to be stealthier — maybe the reactive hint shouldn't directly point at it. Force the player to reason from the scenario more.
**F4:** The core loop is strong. 3 turns is the right length — enough for a decision arc, short enough for daily play. The risk/reward tension from lie strength is the best mechanic. The main risk is solvability — once a player learns the hint grammar (which took me exactly one puzzle), the deduction becomes systematic. You need to keep evolving the puzzle structures or competitive players will optimize the fun out of it within a week. Consider: variable lie counts (1-3), conditional lies (truth if played alone, lie if played after another specific card), or hints that mislead. The bones are excellent. Don't let the meta calcify.
