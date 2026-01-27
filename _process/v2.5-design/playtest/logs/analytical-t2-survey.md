# Post-Game Survey — Analytical Persona (Tier 2)

## Run Summary

### Run 1: doorbell -> fitbit,security_cam
- **Moves:** T1: doorbell | T2: fitbit,security_cam | (T3 not needed)
- **Outcome:** WIN in 2 turns
- **Final Scrutiny:** 1/5
- **Concerns Addressed:** 1/3 (IDENTITY only)
- **Badge:** CLEAN
- **Notes:** Opened with doorbell to refute the counter on security_cam. Then paired fitbit+security_cam (both ASLEEP, different sources) for corroboration bonus. 9 base + 3 corroboration = 12 damage. Total 15 damage vs 14 resistance. Efficient win but only addressed 1 concern.

### Run 2: fitbit -> phone_gps,thermostat -> speaker
- **Moves:** T1: fitbit | T2: phone_gps,thermostat | T3: speaker (BLOCKED)
- **Outcome:** LOSS (ran out of turns)
- **Final Scrutiny:** 3/5
- **Concerns Addressed:** 1/3 (LOCATION only)
- **Notes:** Deliberately tested the contradiction mechanic. Fitbit is ASLEEP; phone_gps is AWAKE. KOA gave a warning on T2 ("doesn't quite line up") and added +1 scrutiny. phone_gps also brought risk:2 and the contradiction added +1, so T2 cost +3 scrutiny total. Then on T3, speaker (also AWAKE) was outright BLOCKED because this was the second contradiction. The first contradiction is a warning; the second is a hard reject. The block did not consume the turn, but I had no more moves to try. Critical discovery: once you get one contradiction warning, ALL cards with opposing tags are permanently locked out.

### Run 3: doorbell,thermostat -> fitbit,security_cam
- **Moves:** T1: doorbell,thermostat | T2: fitbit,security_cam | (T3 not needed)
- **Outcome:** WIN in 2 turns
- **Final Scrutiny:** 1/5
- **Concerns Addressed:** 2/3 (IDENTITY, LOCATION)
- **Badge:** CLEAN
- **Notes:** Paired doorbell+thermostat (both HOME) for corroboration. 6 base + 2 corroboration = 8 damage. Doorbell refuted counter_alibi AND the refutation canceled out the risk:1 scrutiny, so T1 added 0 scrutiny. T2 same as Run 1: fitbit+security_cam for 12 damage. Total 20 damage. This was the best run — more concerns addressed, same low scrutiny. The HOME corroboration only got +20% (not +30%) because doorbell and thermostat have different sources but the bonus check is per-tag... wait, they DO have different sources (smart_doorbell vs smart_thermostat). So 6 * 0.30 = 1.8, ceil = 2. That is 30%. Confirmed: two cards with the same tag from different device sources get 30% instead of 20%.

---

## Hypotheses

### H1: Tag Conflict System (Graduated Contradictions)
**Confirmed.** Tags exist in opposing pairs: ASLEEP/AWAKE, HOME/AWAY, IDLE/ACTIVE, ALONE/ACCOMPANIED. If you play a card whose tag opposes a previously committed tag, this is a "contradiction."
- **First contradiction:** Warning. KOA says "doesn't quite line up." +1 extra scrutiny is added. The card still resolves and deals damage.
- **Second contradiction:** Hard block. The entire turn is rejected — 0 damage, 0 scrutiny, turn is NOT consumed. But you are stuck if you have no non-contradicting cards left. This is what killed Run 2.

### H2: Corroboration Bonus (Same Tag, Same Turn)
**Confirmed.** Playing two cards with the same tag in one turn triggers a corroboration bonus on the base damage.
- Same tag, same source: +20% bonus (ceil).
- Same tag, different sources: +30% bonus (ceil). KOA acknowledges this with "Two different devices agreeing."

### H3: Contested Cards and Refutation
**Confirmed.** The security_cam is "contested" by counter_alibi, which halves its power (ceil(5*0.5) = 3). The doorbell card has REFUTES:counter_alibi, which permanently removes the contest. Refutation also reduces scrutiny added that turn by 1, effectively canceling the doorbell's own risk:1. This makes doorbell a zero-net-scrutiny play when it refutes.

### H4: Repetition Risk
**Not directly triggered in my runs**, but I can infer: if you play a card that proves a proof type already committed (e.g., two LOCATION provers across turns), you get +1 extra scrutiny. phone_gps and thermostat both prove LOCATION, but I played them in the same turn in Run 2, so they were committed simultaneously. I suspect repetition only fires across turns — same-turn duplicates count as corroboration instead.

### H5: The phone_gps Trap
phone_gps is a decoy. Highest power (5) but AWAKE tag contradicts fitbit/security_cam (ASLEEP), risk:2 is the highest in the deck, and proves LOCATION which thermostat already covers at risk:0. It exists to tempt greedy players. The "why was your phone on?" flavor text is the tell.

### H6: Optimal Line
The best strategy I found: doorbell+thermostat (T1), then fitbit+security_cam (T2). This yields 20 total damage (8+12), 1 total scrutiny, 2/3 concerns addressed, and wins in 2 turns with CLEAN badge. To get FLAWLESS (scrutiny<=1 AND all 3 concerns), you would need to also address INTENT, which requires the speaker card (AWAKE, risk:1). But speaker contradicts the ASLEEP cards. You could play speaker BEFORE any ASLEEP cards, accepting 1 scrutiny, then play ASLEEP cards — but that would trigger a contradiction warning (+1 more). Total scrutiny would be risk:1 (speaker) + contradiction:1 + risk:1 (doorbell) = 3, which blocks FLAWLESS. I believe FLAWLESS may be impossible in this puzzle if INTENT requires the AWAKE speaker.

---

## Q1: Strategy Discovery
I discovered three key systems: (1) tag-based contradictions with a graduated penalty — first is a warning with extra scrutiny, second is a hard block; (2) corroboration bonuses when pairing same-tag cards, with a higher bonus for different device sources; (3) the refutation mechanic that removes contested status AND reduces scrutiny. The game rewards careful card ordering — refute before playing contested cards, pair same-tag cards together, and avoid mixing opposing tags across turns.

## Q2: Adaptation
Run 1 was my "safe baseline" — I isolated the refutation play then paired ASLEEP cards. It worked. Run 2 was a deliberate experiment: I wanted to see what happens when you contradict yourself. I learned that the first contradiction is survivable but the second is fatal. The speaker block in Run 2 was the critical moment — it proved that the system tracks ALL previously committed tags, not just the most recent turn. Run 3 applied everything: I front-loaded doorbell+thermostat for HOME corroboration and free refutation, then used the uncontested security_cam with fitbit. More damage, more concerns, same scrutiny.

## Q3: KOA
KOA's responses were useful signals. "That doesn't quite line up" in Run 2 confirmed my contradiction hypothesis immediately. "Two different devices agreeing? That's annoyingly consistent" in Runs 1 and 3 confirmed the source diversity bonus. "Fine. That checks out. I'll drop that line of questioning" confirmed refutation worked. KOA felt more like a well-designed feedback system than a character — the dialogue is functional first, personality second. But the personality makes the feedback memorable. I could reconstruct the game state from KOA's words alone, which is good design.

## Q4: Enjoyment
4/5. The puzzle has genuine depth despite its small card count. The interaction between tags, sources, proofs, and counters creates a multi-axis optimization problem. The phone_gps trap is well-crafted — it punishes naive "pick highest power" play. I would rate it 5/5 if there were more viable paths to victory and if FLAWLESS were achievable.

## Q5: Replay
Yes. The mechanics support interesting puzzles. I would want to see: (a) a puzzle where contradictions are unavoidable and you must choose which one to take, (b) a puzzle with multiple counters requiring sequenced refutations, (c) a puzzle where the FLAWLESS badge is achievable but requires a non-obvious card ordering. The current puzzle has one dominant strategy — I want one where the decision tree branches more.

## Q6: Confusion
The [CONTESTED] marker disappeared from security_cam after I played doorbell in Run 1, which was initially confusing — I expected to see "no longer contested" or similar feedback. The scrutiny display only shows the aggregate, which is deliberate ambiguity, but I would appreciate a breakdown on hover or post-game recap. Also, "concerns addressed" feels disconnected from the win condition — you can win with 1/3 concerns addressed (Run 1), so what do concerns actually do? They seem to only affect badges.

## Q7: Memorable Moment
The speaker block in Run 2, Turn 3. I had committed ASLEEP (fitbit, T1) and then AWAKE (phone_gps, T2, with warning). When I tried speaker (also AWAKE), KOA flatly rejected it: "That directly contradicts what you already showed me." The turn was not consumed, but I was out of moves — every remaining option either contradicted or was already used. Watching my strategy collapse because of accumulated contradictions was the most educational moment across all three runs. It proved the system is tracking state across the entire game, not just per-turn.

## Q8: Difficulty
(b) About right. The puzzle is solvable on the first attempt if you read the cards carefully and avoid the phone_gps trap. But it rewards deeper analysis — finding the optimal path (Run 3 vs Run 1) requires understanding corroboration, refutation timing, and scrutiny budgets. The difficulty is in optimization, not survival.

## Q9: What You'd Tell a Friend
"It's a card puzzle where you're building an alibi from smart home devices, but the game tracks whether your evidence contradicts itself — so you have to think about what story your cards tell together, not just how powerful they are individually."
