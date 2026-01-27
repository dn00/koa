# Analytical T3 Playtest Survey

## Run Summary

- **Run 1:** doorbell → fitbit,security_cam → (game won in 2 turns). **WIN**, scrutiny 1/5, concerns 1/3, Badge: CLEAN
- **Run 2:** doorbell,thermostat → fitbit,speaker → (game won in 2 turns). **WIN**, scrutiny 2/5, concerns 3/3, Badge: CLEAN
- **Run 3:** phone_gps,speaker → fitbit,security_cam (BLOCKED) → doorbell → (game won in 2 effective turns). **WIN**, scrutiny 3/5, concerns 3/3, no badge

---

## Q1: Strategy Discovery

The central tension is between the ASLEEP/AWAKE axis. The "safe" cards (fitbit, security_cam) are ASLEEP-tagged, while the concern-addressing INTENT card (speaker) and the high-power decoy (phone_gps) are AWAKE-tagged. You cannot freely mix both sides without paying contradiction costs.

Key rules I confirmed through play:
- **Corroboration with source diversity** is extremely powerful. Fitbit + security_cam (both ASLEEP, different device types) yields a 30% bonus, turning 9 base damage into 12. Similarly, doorbell + thermostat (both HOME, different sources) turns 6 into 8.
- **Refutation zeroes out risk.** Doorbell's risk:1 is perfectly cancelled by its counter_alibi refutation (-1 scrutiny), making it effectively risk-free AND unlocking security_cam's full power.
- **The graduated contradiction system** means playing one ASLEEP card after AWAKE costs +1 scrutiny (warning), but a second ASLEEP card gets blocked entirely. This makes the AWAKE path and ASLEEP path nearly mutually exclusive.
- **FLAWLESS is impossible** with all 3 concerns addressed. INTENT requires speaker (AWAKE, risk 1), and any ASLEEP card after that triggers a contradiction. The minimum scrutiny for 3/3 concerns is 2.

## Q2: Adaptation

Run 1 was a raw damage optimization — doorbell to refute, then fitbit+security_cam for the massive corroboration hit. It won easily but only addressed 1/3 concerns.

Run 2 shifted to concern coverage. I realized doorbell+thermostat could corroborate on HOME while addressing two concerns, then fitbit+speaker could address INTENT despite the contradiction cost. The trade-off was scrutiny 2 instead of 1, but all concerns addressed.

Run 3 was a deliberate stress test of the "decoy" path. I wanted to see what happens when you lean into AWAKE cards. The phone_gps+speaker corroboration was strong (11 damage) but burned 3 scrutiny immediately. Then trying ASLEEP cards afterward got hard-blocked — confirming that the AWAKE-first path permanently locks you out of ASLEEP corroboration. The doorbell alone was enough to finish, but the scrutiny cost was ugly.

## Q3: KOA

KOA felt more like a character than a system, but the dialogue was transparently tied to game states. "Two different devices agreeing? That's annoyingly consistent" is a good corroboration callout. "I'll let it slide... this time" on the contradiction warning was clear enough to parse as a mechanical signal.

The most interesting KOA moment was Run 3's ending: "You got through. But I'm watching you." versus Run 1/2's "frustratingly solid." The tone shift communicated that scrutiny 3 was a narrow, ugly win compared to scrutiny 1-2. That narrative feedback reinforced the mechanical outcome.

KOA did not change my decisions mid-game since I pre-planned all moves, but if I were playing blind, the refutation dialogue ("I'll drop that line of questioning") would be a strong signal to play doorbell before security_cam.

## Q4: Enjoyment

**4/5.** The puzzle has genuine depth. The ASLEEP/AWAKE axis creates a real dilemma, and the interaction between refutation timing, corroboration, and concern coverage makes the optimization space interesting. It lost a point because with full T3 knowledge, the optimal path was solvable before playing — the puzzle rewards analysis over experimentation. A blind player would likely rate this 5/5.

## Q5: Replay

Yes. The mechanic interactions (corroboration, contradiction axes, refutation, repetition risk) create a rich enough system that a different card layout would produce entirely different optimization problems. I would be especially interested in a puzzle where FLAWLESS is achievable but requires a non-obvious path — this puzzle's impossibility of FLAWLESS with 3/3 concerns is interesting but slightly disappointing once you prove it.

## Q6: Confusion

Nothing was confusing with T3 knowledge. One minor friction point: when the blocked turn happened in Run 3, I had pre-committed my third move (doorbell) but the game consumed my second input line as a retry for turn 2. The runner script handled it, but a human player typing moves might be confused about whether a blocked turn "counts." The "(Turn not consumed — try different cards)" message is clear enough, but the UX could be smoother.

The corroboration bonus calculation (20% vs 30%) rounding up is hard to predict mentally. I had to trace the code to confirm ceil(6*0.3)=2 vs ceil(6*0.2)=2 — at low base damage, the diversity bonus barely matters.

## Q7: Memorable Moment

The hard block in Run 3. Playing fitbit+security_cam after committing AWAKE and getting the flat rejection — "That directly contradicts what you already showed me. Rejected." — was the most informative moment across all three runs. It crystallized that the AWAKE/ASLEEP axis is not a soft penalty but a hard gate after the first warning. That single moment taught me more about the puzzle's design intent than the two successful runs combined.

## Q8: Difficulty

**(a) Too easy** — but with an asterisk. With full T3 knowledge, winning is trivial (doorbell → fitbit+security_cam solves it in 2 turns). The real challenge is optimizing for badge + concerns, which is genuinely interesting. The difficulty is in the metagame (what constitutes the "best" win), not in winning itself. For a T1 or T2 player, this would be (b) about right.

## Q9: What You'd Tell a Friend

"It's a logic puzzle disguised as a card game — you're picking evidence to prove your alibi, but the evidence contradicts itself in ways you have to navigate around, and the real challenge is winning cleanly rather than just winning."
