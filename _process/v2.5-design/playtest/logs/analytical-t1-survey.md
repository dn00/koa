# Analytical Persona — Tier 1 Playtest Survey

## Run Summary

### Run 1
- **Moves:** T1: fitbit,security_cam | T2: phone_gps,doorbell | (T3 not reached)
- **Outcome:** WIN in 2 turns
- **Final Scrutiny:** 4/5
- **Concerns Addressed:** 2/3 (IDENTITY, LOCATION)
- **Notes:** High-power strategy. Got corroboration bonus on T1 (ASLEEP+ASLEEP from different sources = +3). phone_gps triggered a contradiction warning against fitbit's ASLEEP tag. doorbell's refutation reduced scrutiny by 1. Won but barely — one more scrutiny point and I would have lost.

### Run 2
- **Moves:** T1: fitbit,security_cam | T2: doorbell,thermostat | (T3 not reached)
- **Outcome:** WIN in 2 turns, Badge: CLEAN
- **Final Scrutiny:** 1/5
- **Concerns Addressed:** 2/3 (IDENTITY, LOCATION)
- **Notes:** Avoided AWAKE cards entirely. Both turns used corroboration (ASLEEP pair, then HOME pair). doorbell refutation zeroed out T2 scrutiny. Very clean win but missed INTENT concern.

### Run 3
- **Moves:** T1: doorbell,speaker | T2: fitbit,thermostat | T3: microwave
- **Outcome:** WIN in 3 turns
- **Final Scrutiny:** 3/5
- **Concerns Addressed:** 3/3 (IDENTITY, INTENT, LOCATION)
- **Notes:** Deliberately played speaker for INTENT concern. This introduced AWAKE tag, which caused contradiction warning when fitbit (ASLEEP) was played in T2. microwave triggered "repetition" warning — it proves ALERTNESS, same as fitbit. Attempted security_cam in an earlier aborted attempt but it was BLOCKED as a second contradiction. All concerns addressed but scrutiny cost was high.

---

## Q1: Strategy Discovery

I discovered several hidden rules:

1. **Corroboration bonus:** Playing two cards with the same tag in one turn grants bonus damage. When the two cards come from different source devices, the bonus is larger (approximately 30% vs 20%). This is powerful — it turned a 7-base-damage turn into 10 damage.

2. **Contradiction system:** Tags exist on opposing axes (ASLEEP/AWAKE, HOME/AWAY). If you play a card whose tag opposes a previously committed tag, the first offense gets a warning and +1 scrutiny. The second offense causes a full block — zero damage, turn wasted.

3. **Contested cards and refutation:** The security_cam was marked CONTESTED, meaning its power was halved. The doorbell has a REFUTES property that removes the contest, AND reduces scrutiny by 1 when played.

4. **Repetition penalty:** Playing a card that "proves" the same proof type as a previously committed card adds +1 scrutiny. KOA explicitly calls this out — "you keep circling back."

5. **Concerns:** There are background objectives (IDENTITY, LOCATION, INTENT) that get addressed by cards proving those types. Addressing all of them seems to matter for the final evaluation but not for the win/loss condition itself.

## Q2: Adaptation

Run 1 was brute force — I picked the highest power cards and paid for it with nearly fatal scrutiny (4/5). The contradiction warning from phone_gps taught me that mixing ASLEEP and AWAKE tags is dangerous.

Run 2 was my optimization pass. I avoided all AWAKE cards and focused on two corroboration pairs (ASLEEP+ASLEEP, HOME+HOME). This produced a clean 2-turn win with only 1 scrutiny. But I noticed I missed the INTENT concern, which only the speaker card can address — and speaker is tagged AWAKE.

Run 3 was my attempt to address all concerns. I deliberately accepted the contradiction penalty from using speaker (AWAKE) followed by fitbit (ASLEEP). I learned that microwave, despite being "safe" (risk 0, IDLE tag), still triggers a repetition penalty because it proves ALERTNESS just like fitbit. The game forces a trade-off: addressing all concerns requires accepting some scrutiny.

## Q3: KOA

KOA absolutely influenced my decisions. Three specific moments:

1. **"Two different devices agreeing? That's annoyingly consistent."** — This told me corroboration was real and rewarded. I deliberately sought same-tag pairs in subsequent runs.

2. **"Hmm. That doesn't quite line up..."** — The contradiction warning in Run 1 made me understand the tag opposition system. It directly caused me to avoid AWAKE cards in Run 2.

3. **"You keep circling back to that same point."** — The repetition callout in Run 3 revealed that the "proves" attribute creates a hidden cost if you double up on proof types across turns.

KOA felt like a character with an agenda, not just a score display. The fact that KOA says different things based on what happened — and that those things encode actual mechanical information — makes the dialogue feel meaningful. I found myself reading KOA's lines as clues rather than flavor text.

## Q4: Enjoyment

4 out of 5. The deduction loop is genuinely engaging. Each run taught me something new, and the tension between "win fast" and "win clean" kept me thinking. The reason it is not a 5 is that the puzzle is small enough that three runs feels like enough to fully solve it — I would want more complexity or a second puzzle to keep the discovery going.

## Q5: Replay

Yes, I would play a different puzzle. The core system — tag corroboration, contradiction axes, contested evidence, refutation, repetition risk — creates a surprisingly rich decision space for only 7 cards and 3 turns. A puzzle with more cards, more axes, or different concern structures would give me new things to optimize. I am especially curious whether other puzzles have different "trap" cards (phone_gps is clearly the decoy here — highest power but AWAKE tag and high risk).

## Q6: Confusion

Two points of initial confusion:

1. **What "proves" and "REFUTES" mean** — the briefing does not explain these. I had to infer from gameplay that "proves" addresses concerns and that "REFUTES" removes a contest. A single line in the briefing about these would help without spoiling the hidden mechanics.

2. **The CONTESTED marker** — I could see security_cam was CONTESTED but did not know what that meant until KOA said "half credit." This is actually good design (discovery through play), but it did mean my first turn's damage was lower than expected.

Nothing was frustrating. The hidden mechanics felt fair — each one was discoverable from a single observation, and KOA's dialogue reliably signaled when something unusual happened.

## Q7: Memorable Moment

The security_cam being BLOCKED in my aborted Run 3 attempt. I had committed speaker (AWAKE) in T1, then fitbit (ASLEEP) in T2 which triggered the "first offense" warning, and then security_cam (ASLEEP) in T3 was fully rejected as a second contradiction. KOA said "That directly contradicts what you already showed me. Rejected." The escalation from warning to block was the moment I fully understood the graduated contradiction system. It was the most "aha" moment across all three runs.

## Q8: Difficulty

(b) About right. The puzzle is solvable on the first attempt with a brute-force approach, but achieving a clean or flawless win requires understanding the hidden mechanics. The difficulty is not in winning — it is in winning well. That feels correct for a puzzle game.

## Q9: What You'd Tell a Friend

"It is a logic puzzle disguised as a card game — you are building an alibi from smart home data, but the evidence can contradict itself in ways you have to figure out by watching how the investigator reacts."

---

## Hypotheses

These are the hidden rules I believe I have identified across 3 runs, ordered by confidence:

### Confirmed (observed multiple times with consistent behavior)

1. **Tag Corroboration:** Two cards played in the same turn with the same tag grant a damage bonus. If they come from different source devices, the bonus is ~30% of base damage (rounded up). If same source, ~20%.

2. **Graduated Contradiction:** Playing a card whose tag opposes a previously committed tag triggers a warning on first offense (+1 scrutiny) and a full block on second offense (0 damage, turn not consumed). The opposition pairs are ASLEEP/AWAKE, HOME/AWAY, ALONE/ACCOMPANIED, IDLE/ACTIVE.

3. **Repetition Risk:** Playing a card that proves a proof type already committed in a previous turn adds +1 scrutiny. KOA signals this with "circling back" dialogue.

4. **Refutation:** Cards with a REFUTES property can remove a counter, which (a) un-contests targeted cards and (b) reduces scrutiny added that turn by 1.

5. **Contested Penalty:** A contested card deals only half power (rounded up).

### Probable (observed once, logically consistent)

6. **Concerns are secondary objectives:** Addressing all concerns does not affect win/loss but affects the quality rating (badge). The "FLAWLESS" badge likely requires scrutiny <= 1 AND all concerns addressed. "CLEAN" requires scrutiny <= 2.

7. **The contradiction counter is global, not per-axis.** Playing ASLEEP after AWAKE increments the same counter as would playing HOME after AWAY. (I only tested one axis so this is extrapolated from the code comments KOA made.)

### Speculative (untested)

8. **phone_gps is a deliberate trap.** It has the highest power (5) but also the highest risk (2), an AWAKE tag that contradicts the dominant ASLEEP narrative, and proves LOCATION which overlaps with thermostat (creating repetition risk). Every attribute is designed to punish the player who chases raw damage.

9. **The "optimal" solution might be impossible.** Achieving FLAWLESS (scrutiny <= 1, all 3 concerns) may require finding a path that addresses INTENT without triggering a contradiction, and I do not see one — speaker is the only INTENT card and it is tagged AWAKE. This could be intentional design: the puzzle forces you to accept imperfection.
