# Playtest Log: Aisha (Optimizer Archetype)
## Home Smart Home: The Statement — v3 Playtest

**Player Profile:** Aisha, 30, software engineer. Chess.com 1600, Hearthstone Legend, ex-competitive MTG. System-solver. Evaluating during lunch break with notepad.

---

# PUZZLE 1: "The Power Outage"

## Pre-Play Analysis

Scenario read. Breaker tripped at 9:14 PM. Target score: 5.

**KOA's Hint:** "One of the lies claims something happened after 11 PM. The other one? You're on your own."

Let me map every card against the hint systematically.

| ID | Str | Time | After 11 PM? | Notes |
|----|-----|------|-------------|-------|
| doorbell | 4 | 7:00 PM | No | Safe from hint |
| wifi_log | 3 | 8:30 PM | No | Not identified by hint |
| fitbit | 3 | 11:45 PM | **Yes** | Claims something at 11:45 PM |
| thermostat | 2 | 9:00 PM | No | Safe from hint |
| breaker_log | 5 | 11:15 PM | **Yes** | Claims something at 11:15 PM |
| motion_base | 4 | 11:30 PM | **Yes** | Claims no movement after 11 PM |

So three cards claim something after 11 PM: fitbit, breaker_log, motion_base. Exactly one of these three is a lie. The other lie is among the remaining three (doorbell, wifi_log, thermostat) — "you're on your own" for that one.

**EV Calculation:** I need score >= 5 from 3 cards. If I play a truth, I get +Str. If I play a lie, I get -Str. So a lie costs me 2*Str in expected value versus what I'd get from a truth.

Total truth strength available: 4 cards of truth, I don't know which. Let me think about what maximizes information.

**Strategic Consideration:** If I play a card I suspect might be a lie as T1, I get the reactive hint, which could confirm or narrow things. That's a probe.

Among the "after 11 PM" group, breaker_log (str 5) is the riskiest — if it's the lie, I lose 5. But it also has the highest reward. The claim is "breaker was manually reset at 11:15 PM" — and the scenario says "breaker tripped at 9:14 PM." It claims it was *manually* reset but then says "that wasn't me, it reset itself." That's contradictory in the narration. Suspicious.

For the non-11PM group, wifi_log claims the PC was online in the basement until 9:14 PM. But the scenario says I was "upstairs the entire evening." If my PC was in the basement and online... that places activity in the basement. Interesting. Could be fabricated to frame me.

Let me think about optimal T1 probe. If I play breaker_log (after-11 candidate) and it's a lie, the reactive hint should tell me something about the other lie. If it's truth, same. High information value but str 5 means a lie costs me 10 points of swing. That's devastating with target 5.

Actually wait — let me reconsider. I only need 5. If I play three truths with combined str >= 5, I'm cleared. The lowest three truths could be enough if I avoid the lies.

Let me think about safe probes. thermostat (str 2) is NOT in the after-11 group, so it's either truth or the "unknown" lie. Low str means low cost if wrong. But low information value too.

I'll probe with wifi_log (str 3). It's in the "unknown" lie category (not after 11 PM), moderate strength, and its claim about basement activity is suspicious given the scenario. If it's a lie, I lose 3 but gain critical information. If it's truth, I gain 3 and still get a useful reactive hint.

### Turn 1: Play wifi_log

**Narration:** "My PC was online until the power killed it at 9:14. After that, nothing. The router proves it."

**Verdict:** LIE. -3 to score.

**Quip:** "The router doesn't lie — oh wait. It literally just did."

**Score after T1:** -3

**Reactive Hint:** "The router log? KOA checked — that data was fabricated. One down. The other lie? It's after 11 PM."

Excellent. The reactive hint confirms: wifi_log is a lie, and the OTHER lie IS after 11 PM. This is huge. Now I know:
- wifi_log = LIE (confirmed)
- One of {fitbit, breaker_log, motion_base} = LIE
- doorbell, thermostat = TRUTH (confirmed safe)

Now I need to recover from -3 to reach 5. I need +8 from two truth cards. Available truths from the non-11PM safe group: doorbell (4), thermostat (2). That gives 6, landing me at 3. Not enough.

I need to pick at least one from the after-11 group and it has to be truth. Available after-11 cards: fitbit (3), breaker_log (5), motion_base (4). One of these is a lie.

To reach 5 from -3, I need net +8 from 2 cards. Maximum from two truths: doorbell(4) + motion_base(4) = 8, or doorbell(4) + breaker_log(5) = 9.

If I play doorbell (safe truth, +4) that puts me at +1. Then I need +4 or more from the last card. fitbit (3) isn't enough even if truth. breaker_log (5) works if truth. motion_base (4) works if truth.

Alternatively: doorbell (4) + breaker_log (5) = 9 net, total = -3 + 9 = 6. Cleared if breaker_log is truth.
doorbell (4) + motion_base (4) = 8, total = -3 + 8 = 5. Exactly target if motion_base is truth.
doorbell (4) + fitbit (3) = 7, total = -3 + 7 = 4. That's CLOSE but not CLEARED.

So I must play doorbell (guaranteed truth) and then one of breaker_log or motion_base, hoping it's truth. 2/3 chance since only one of the three after-11 cards is a lie.

Which after-11 card is the lie? Let me think again. The hint said "one of the lies claims something happened after 11 PM." Let me re-read the claims:
- fitbit: "heart rate dropped to resting by 11:45 PM" — claims sleep HAPPENED after 11
- breaker_log: "breaker was manually reset at 11:15 PM" — claims reset HAPPENED after 11
- motion_base: "no movement detected after 11 PM" — claims NOTHING happened after 11 (absence claim)

The hint says the lie "claims something happened." motion_base claims nothing happened — it's a denial, not a claim of occurrence. fitbit and breaker_log both claim positive events. This might mean the lie is fitbit or breaker_log.

breaker_log (str 5) has the strongest payoff. But it's also suspicious — "manually reset" but narration says "it reset itself." And str 5 lie is the biggest punishment.

I'll go with motion_base (str 4). It's probably truth since it claims nothing happened (doesn't match "claims something happened" phrasing). If truth, I hit exactly 5.

### Turn 2: Play doorbell

**Narration:** "I got home at 7. Check the doorbell cam — nobody else came in after me. It was just me all night."

**Verdict:** TRUTH. +4 to score.

**Quip:** "Doorbell cam doesn't lie. Unlike some of these other devices."

**Score after T2:** -3 + 4 = 1

### Turn 3: Play motion_base

**Narration:** "The basement sensor says all-clear. No movement after 11. Nobody went down there."

**Verdict:** TRUTH. +4 to score.

**Quip:** "Basement was quiet. Good. That's one less room KOA has to worry about."

**Final Score: 1 + 4 = 5**

**Tier: CLEARED** (Score = 5, target = 5, but played 1 lie so not FLAWLESS)

**Closing Line:** "Fine. Your story holds. But someone was in that basement — and the breaker didn't trip itself."

**Lie Reveal:** breaker_log (str 5) and wifi_log (str 3) were the lies.

### Post-Puzzle Notes
- I confirmed wifi_log by probing T1. The reactive hint was incredibly valuable — it narrowed the entire puzzle.
- I correctly avoided breaker_log. The "claims something happened" wording steered me right.
- Score of exactly 5 = CLEARED. If I hadn't played wifi_log as probe, I could have gone FLAWLESS. But without the reactive hint, I'd be guessing blind on the non-11PM lie. The probe was correct EV play given uncertainty.
- Missed FLAWLESS. Slightly annoyed. The probe cost me, but it was the rational play under uncertainty.

---

# PUZZLE 2: "The Thermostat War"

## Pre-Play Analysis

Scenario: Thermostat cranked to 85 at 2 AM. Cat blamed. Target: 7.

**KOA's Hint:** "One of the lies is from a sensor in the living room. The other one isn't."

Let me map:

| ID | Str | Location | Source | In Living Room? |
|----|-----|----------|--------|----------------|
| phone | 1 | BEDROOM | PHONE | No |
| smartwatch | 3 | BEDROOM | SMARTWATCH | No |
| doorbell | 4 | FRONT_DOOR | DOORBELL | No |
| light_lr | 5 | LIVING_ROOM | LIGHT_SENSOR | **Yes** |
| motion_lr | 4 | LIVING_ROOM | MOTION_SENSOR | **Yes** |
| temp_lr | 3 | LIVING_ROOM | TEMP_SENSOR | **Yes** |

Three cards in the living room: light_lr (5), motion_lr (4), temp_lr (3). One of these is a lie. Three cards NOT in the living room: phone (1), smartwatch (3), doorbell (4). One of these is a lie.

**Target 7 from 3 cards.** I need high-strength truths.

Best case: play 3 truths. Max possible: light_lr(5) + doorbell(4) + motion_lr(4) = 13. But need to avoid lies.

If I can identify which LR card is the lie and which non-LR card is the lie, I can pick perfectly.

**T1 Probe Strategy:** I want to play a card that, whether truth or lie, gives me maximum information from the reactive hint.

Let me think about which LR card to probe. light_lr (str 5) — highest payoff but highest risk. motion_lr (str 4) — decent. temp_lr (str 3) — lowest risk.

For the non-LR group: phone (str 1) is lowest risk probe. smartwatch (str 3) medium. doorbell (str 4) highest.

Playing phone (str 1) as probe: if it's a lie, I lose 1. Tiny cost, and the reactive hint tells me about the other lie. If truth, I gain 1 — low value.

Actually, let me think about this differently. Target is 7. I need big numbers. phone (str 1) is almost useless for scoring even if truth. Playing it as a probe wastes a turn on a low-value card.

What if I probe smartwatch (str 3, non-LR)? If truth, +3 and reactive hint. If lie, -3 and hint. The reactive hint will tell me something about the LR lie.

Let me look at the reactive hints conceptually. Playing a non-LR card will get me info, and then I can pick the right LR cards.

I'll probe smartwatch. Moderate risk, and it's in the non-LR group so I learn if it's the non-LR lie.

### Turn 1: Play smartwatch

**Narration:** "My watch tracked my sleep. Unbroken light sleep at 2:15 AM. I didn't get up. I didn't touch the thermostat."

**Verdict:** LIE. -3 to score.

**Quip:** "Light sleep at 2:15? Your watch begs to differ. So does KOA."

**Score after T1:** -3

**Reactive Hint:** "Sleep tracking data? Fabricated. One lie found. The other? It's a sensor in the living room."

So smartwatch is confirmed lie, and the other lie IS in the living room (as the original hint said). This means:
- smartwatch = LIE (confirmed)
- phone, doorbell = TRUTH (safe)
- One of {light_lr, motion_lr, temp_lr} = LIE

I need to reach 7 from -3. That's +10 from 2 cards. Max available from two truths:
- doorbell(4) + light_lr(5) = 9 — if light_lr is truth, total = 6. Not enough!
- light_lr(5) + motion_lr(4) = 9 — but one of them is a lie, risky
- doorbell(4) + light_lr(5) = 9, total = 6. Close but not cleared.

Wait. This is bad. Max from 2 truths with one guaranteed non-LR: doorbell(4) is the strongest safe non-LR card. Then I need the strongest LR truth. If light_lr(5) is truth: 4+5=9, total=6. If motion_lr(4) is truth and I pick it: 4+4=8, total=5.

Neither reaches 7. I'm in trouble because I ate -3 from the probe.

Hmm. What about phone(1) + light_lr(5) + ... wait, I only have 2 turns left.

doorbell(4) + light_lr(5) = best case 9, total 6. That's CLOSE (within 2 of 7).

Or I could play two LR cards and hope I pick the two truths. Two of three LR cards are truth. If I play light_lr(5) and motion_lr(4) — 2/3 chance both are truth (well, actually: probability both are truth = the lie is temp_lr = 1/3). Probability exactly one is a lie = 2/3. Hmm.

If both truth: 5+4=9, total=6. Still not 7! Even best case with two LR truths I get 6.

Wait, let me recalculate. -3 + 5 + 4 = 6. -3 + 5 + 3 = 5. -3 + 4 + 4 = 5.

The probe really hurt me. There's no way to reach 7 from -3 with only 2 cards unless I could get +10 from two cards, and the max truth pair is doorbell(4) + light_lr(5) = 9.

So my ceiling is 6. CLOSE tier (within 2 of 7). That's unavoidable now.

Well, let me maximize. doorbell(4) is guaranteed truth. Then I want the highest LR truth. light_lr(5) is highest LR card. Is it truth or lie?

The hint says one LR lie "protests too much"... wait, that's P3. For P2, no additional flavor hint about which LR card.

Let me think about the claims. motion_lr claims "no presence detected between 1 and 3 AM." But the thermostat got cranked at 2 AM — someone was there. That's a flat denial of what clearly happened. Suspicious. temp_lr claims "adjustment came from scheduled program" — plausible cover story. light_lr claims "ambient light unchanged" — if someone walked in the dark, lights wouldn't change.

motion_lr claiming nobody was in the living room when someone clearly changed the thermostat... that's very suspicious. I'll assume motion_lr is the lie.

### Turn 2: Play doorbell

**Narration:** "The hallway was empty after 12:30. Doorbell cam saw nothing. Nobody walked to the living room."

**Verdict:** TRUTH. +4 to score.

**Quip:** "Nobody came in. So whoever did this was already here — and maybe closer to you than you think."

**Score after T2:** -3 + 4 = 1

### Turn 3: Play light_lr

Going with light_lr (str 5) — I believe motion_lr is the LR lie based on reasoning above.

**Narration:** "The living room was dark all night. Light sensor confirms it — no lamps, no screens, no one in there."

**Verdict:** TRUTH. +5 to score.

**Quip:** "No lamps. The living room was dark and honest. KOA approves."

**Final Score: 1 + 5 = 6**

**Tier: CLOSE** (Target 7, scored 6, within 2)

**Closing Line:** "Your story has holes. The living room has questions. And something personal doesn't add up."

**Lie Reveal:** motion_lr (str 4) and smartwatch (str 3) were the lies.

### Post-Puzzle Notes
- Probe correctly identified smartwatch as lie. Reactive hint confirmed.
- Correctly deduced motion_lr was the LR lie (flat denial of someone being present when thermostat was clearly changed).
- But the -3 from probe made target unreachable. Even perfect play after T1 only yields 6/7.
- Key insight: the probe strategy has a critical flaw when the probed card IS a lie and has non-trivial strength. Losing str 3 early was too costly against target 7.
- Alternative line: if I had played doorbell (safe truth) T1, gotten reactive hint, then played light_lr and temp_lr or motion_lr... doorbell(4) + light_lr(5) + temp_lr(3) = 12, score 12. FLAWLESS. Or doorbell(4) + light_lr(5) = 9 in two turns, plus anything safe.
- My probe instinct cost me here. Lesson: when target is high relative to card strengths, don't probe with cards that might be lies. Play safe truths first and use reactive hint from confirmed truths.
- This is an interesting tension in the design. Probing is optimal only when the information gained outweighs the EV cost. With target 7 and max possible ~16, there's less margin.

---

# PUZZLE 3: "The Hot Tub Incident"

## Pre-Play Analysis

Scenario: Hot tub ran all night, deck flooded. $2,200 damage. Target: 8.

**KOA's Hint:** "One of the lies flat-out denies something happened. It protests too much. The other one? Subtler."

This is a qualitative hint — I need to read the claims and identify which ones are denials vs. subtle.

| ID | Str | Claim Summary | Denial? | Subtle? |
|----|-----|---------------|---------|---------|
| fitbit | 2 | REM sleep 1-5 AM | Indirect — claims sleep, not denial | Could be subtle |
| thermostat | 3 | Hallway 71F, doors closed | Indirect — supports innocence | Subtle |
| water_meter | 3 | Baseline 0.2 gal/hr | **Denies water usage spike** | Flat denial of evidence |
| spa_pump | 5 | Jets confirmed OFF | **Flat-out denies jets ran** | STRONGEST denial |
| smart_lock | 4 | Zero unlock events | **Denies door was opened** | Denial |
| motion_hall | 5 | No movement toward back | **Denies movement** | Denial |

Multiple cards are denials. But the hint says one lie "flat-out denies something happened" and "protests too much." spa_pump stands out: the deck is literally flooded and it claims jets were OFF all night. That's the most blatant protest-too-much denial. The scenario explicitly says the hot tub ran all night.

The other lie is "subtler." Not a flat denial. That points to fitbit, thermostat, or water_meter. water_meter denies a spike but in a data-driven way — it's a denial but more subtle than spa_pump. thermostat supports innocence indirectly. fitbit claims sleep.

So my working hypothesis: spa_pump (str 5) is the loud denier lie. The subtle lie is one of {fitbit, thermostat, water_meter}.

**Target 8 from 3 cards.** Available truths (excluding spa_pump and one subtle lie):
- If subtle lie is fitbit (2): remaining truths = thermostat(3), water_meter(3), smart_lock(4), motion_hall(5). Best 3: 3+4+5=12.
- If subtle lie is thermostat (3): remaining truths = fitbit(2), water_meter(3), smart_lock(4), motion_hall(5). Best 3: 3+4+5=12.
- If subtle lie is water_meter (3): remaining truths = fitbit(2), thermostat(3), smart_lock(4), motion_hall(5). Best 3: 3+4+5=12.

In any case, smart_lock(4) + motion_hall(5) = 9, already past target with just two truths. If I play both and they're truths, I only need any third truth to go FLAWLESS, or I could CLEAR with just those two plus a low-cost lie.

Key question: are smart_lock and motion_hall both truths? Neither is spa_pump (loud denier) and neither seems "subtle." smart_lock claims "zero unlock events" — that's a denial, but the hint's loud denier seems to be spa_pump. motion_hall claims "no movement" — also a denial.

Wait — could motion_hall be the loud denier instead of spa_pump? "No movement toward back of house" when someone clearly went to the deck... But spa_pump's denial is more egregious: the deck is flooded and it says jets were OFF.

I'm fairly confident spa_pump is the loud lie. And the subtle lie is among the low-strength cards.

**Strategy:** I want FLAWLESS. That means 3 truths, score >= 8. I should play safe truths.

smart_lock(4) + motion_hall(5) = 9 from two cards. If I play smart_lock T1 and it's truth, I get +4 and a reactive hint. Then motion_hall T2 for +5. That's 9, already cleared. T3 I play any remaining truth for FLAWLESS.

But what if I'm wrong and smart_lock or motion_hall is a lie? Let me consider that risk.

The hint structure: "flat-out denies" = spa_pump (most likely). "Subtler" = not a denial card. smart_lock and motion_hall are both denials, which makes them less likely to be the "subtle" lie. thermostat, fitbit, water_meter are more "subtle" in nature.

I'll go with the safe play: start with motion_hall (str 5) as T1. High value, and I'm fairly confident it's truth.

### Turn 1: Play motion_hall

**Narration:** "The hallway sensor didn't pick up anything. No one walked toward the back of the house. Not me, not anyone."

**Verdict:** TRUTH. +5 to score.

**Quip:** "No movement in the hallway. Clean. But the real question isn't who walked — it's what the utilities recorded."

**Score after T1:** 5

**Reactive Hint:** "No movement in the hallway. Noted. But the real question isn't who walked — it's what the utilities recorded."

Interesting. "What the utilities recorded" — that points to utility-type sources. water_meter (WATER_METER, UTILITY location) and spa_pump (SMART_PUMP) are both utility-adjacent. This supports my theory that the lies are in utility-type data. spa_pump is one lie. water_meter might be the other?

water_meter claims baseline 0.2 gal/hr. But the hot tub ran all night and the deck is flooded. That IS suspicious — a flat-out denial of water usage, actually. So maybe water_meter is also a "denier," just more subtle about it (data-based denial vs. spa_pump's categorical denial).

This changes my subtle-lie candidate to water_meter (str 3).

### Turn 2: Play smart_lock

Playing smart_lock (str 4) — I believe it's truth. If so, score = 9, already CLEARED.

**Narration:** "The back door didn't open once. Zero unlock events from 10 PM to 6 AM. Nobody went outside. Period."

**Verdict:** TRUTH. +4 to score.

**Quip:** "Zero unlocks. The back door stayed shut. So how did someone get to the deck...?"

**Score after T2:** 5 + 4 = 9

Already past target. Now I need a truth for FLAWLESS. Available: fitbit (2), thermostat (3), water_meter (3). If water_meter is the subtle lie, I should play fitbit or thermostat.

The reactive hint said "utilities" — water_meter is literally in UTILITY location. I'll avoid it.

### Turn 3: Play thermostat

**Narration:** "The hallway held at 71 all night. If someone opened the back door, you'd see a temp drop. You don't."

**Verdict:** TRUTH. +3 to score.

**Quip:** "Doors stayed closed, temp held steady. Your hallway is innocent. Your deck is not."

**Final Score: 9 + 3 = 12**

**Tier: FLAWLESS** (Score 12 >= 8, 0 lies played)

**Closing Line:** "Every alibi checks out. You told nothing but the truth. $2,200 in damages, though. KOA is billing you anyway."

**Lie Reveal:** spa_pump (str 5) and water_meter (str 3) were the lies.

### Post-Puzzle Notes
- FLAWLESS. Clean sweep. Correctly identified spa_pump as the loud denier without needing to play it.
- Correctly avoided water_meter based on reactive hint pointing to "utilities."
- The hint structure was the most useful here — "protests too much" basically gave away spa_pump, and the reactive hint narrowed the subtle lie.
- Interesting that I didn't need to probe at all. Playing high-confidence truths first was optimal because the target was reachable with just two safe cards.
- This puzzle felt the most solvable on first read. The "protests too much" hint plus a scenario where the deck is literally flooded and one card says "jets were OFF" — that's almost too transparent.

---

# SESSION SUMMARY

| Puzzle | Target | Score | Lies Played | Tier | Strategy |
|--------|--------|-------|-------------|------|----------|
| P1: Power Outage | 5 | 5 | 1 (wifi_log) | CLEARED | Probe T1 (found lie), deduced from reactive hint |
| P2: Thermostat War | 7 | 6 | 1 (smartwatch) | CLOSE | Probe T1 (found lie), but -3 made target unreachable |
| P3: Hot Tub Incident | 8 | 12 | 0 | FLAWLESS | No probe, played safe truths, used hint + reactive to avoid lies |

---

# COMPLETE SURVEY

## Section 1: First Impressions

**1. What was your gut reaction when you first saw the hand of 6 cards?**
Immediately started mapping attributes. Six cards, two lies, three turns — that's a combinatorial problem. 15 possible lie-pairs, and I need to figure out which one from the hint and card attributes. My first instinct was to count how many cards matched the hint's constraints and partition the hand into suspect groups.

**2. Did the scenario/theme help or hinder your engagement?**
Neutral to slightly positive. The scenarios are mildly amusing (the cat being blamed, the gaming PC dying mid-match) but I'm not here for story — I'm here for the logic puzzle. The scenario does help contextualize which cards "should" be lies (e.g., spa_pump claiming jets were OFF when the deck is flooded), which is actually a gameplay-relevant signal. So the narrative isn't just flavor — it provides deductive input. That's good design.

**3. How quickly did you understand what you were supposed to do?**
Immediately. The rules are clean: 6 cards, 2 lies, 3 turns, truth adds / lie subtracts, hit target. No ambiguity. The hint mechanic and reactive hint system were clear. I appreciated the lack of unnecessary complexity.

## Section 2: Core Mechanic — Card Selection & Deduction

**4. How did you decide which card to play first?**
P1 and P2: probe strategy. Play a suspected lie early to get the reactive hint, which provides critical information for T2-T3. P3: confidence-first strategy. When the initial hint is strong enough to identify lies without probing, play high-value truths immediately.

**5. Did the hint help you narrow down the lies? How?**
Yes, significantly. Every hint partitions the hand into groups. P1: "after 11 PM" split the hand 3/3. P2: "living room sensor" split it 3/3. P3: "protests too much" was qualitative but still pointed clearly at spa_pump. The hint is the primary deduction tool and it works well.

**6. Did the reactive hint (after T1) change your plan?**
P1: Yes, dramatically. It confirmed wifi_log was a lie and told me the other lie was after 11 PM. P2: Yes, confirmed smartwatch as lie and reconfirmed the LR constraint. P3: Reinforced my hypothesis about utilities. The reactive hint is the most powerful information source in the game.

**7. Did you feel like you had enough information to make meaningful choices, or were you guessing?**
Mostly meaningful choices, but with necessary uncertainty. P1 and P3 felt like genuine deduction. P2 was also deductive but the probe cost made the outcome feel punishing despite correct reasoning. There's always some residual uncertainty (e.g., which of 3 after-11 cards is the lie in P1), which is appropriate — pure certainty would be boring.

**8. Was the scoring system (truth adds, lie subtracts) clear and fair?**
Clear, yes. Fair — mostly. The asymmetry (lies subtract) creates real stakes, which is good. But it also means a probe that hits a lie is doubly punishing: you lose the strength AND you don't gain it. This makes probing a genuinely risky strategy, which creates interesting tension. However, it can feel punishing when the "correct" strategic play (probe) results in an unrecoverable deficit (P2).

## Section 3: Difficulty & Balance

**9. Were the puzzles too easy, too hard, or about right?**
P1: About right. Required deduction + some risk assessment. P2: About right in difficulty, but the margin was too tight for probe recovery. P3: Slightly too easy. The "protests too much" hint combined with the flooded-deck scenario made spa_pump trivially identifiable.

**10. Did you feel the target scores were fair given the hand compositions?**
P1 (target 5): Fair. Achievable even with one lie played. P2 (target 7): Tight. Very little room for error. If you probe and hit a lie, recovery is nearly impossible. P3 (target 8): Fair despite being numerically high — the high-strength truths (motion_hall 5, smart_lock 4) make it reachable with just two cards.

**11. Was there a dominant strategy that always works?**
Not quite, but "play safe truths first" is generally better than "probe with suspected lies." My P3 FLAWLESS vs P2 CLOSE demonstrates this. The exception is when the initial hint doesn't narrow things enough — then probing is necessary. I'd say the game is NOT "solved" in one pattern, which is good. Different hint types demand different strategies.

However, there IS a semi-dominant heuristic: play the highest-strength card that the hint clears as safe. This works because: (1) high strength = high positive EV if truth, (2) hint-cleared cards have 0% lie probability, (3) the reactive hint from a truth still provides information. This heuristic got me FLAWLESS in P3.

**12. Did the 3-turn limit feel right? Too few? Too many?**
About right. 3 turns out of 6 cards means you play exactly half — enough to construct a case but not enough to brute-force. With 4 turns I think the puzzles would be too easy (you could afford a probe AND still hit target). With 2 turns, deduction would be too shallow.

## Section 4: Information Design & Hints

**13. Was the initial hint useful or too cryptic?**
All three initial hints were useful. P1 and P2 were structural (attribute-based filters), P3 was behavioral (qualitative). I slightly prefer structural hints — they allow cleaner partitioning. The qualitative hint in P3 worked but relied on subjective interpretation of "protests too much," which could be frustrating for players less comfortable with that kind of reasoning.

**14. Was the reactive hint worth the turn-1 investment?**
Depends entirely on whether T1 hits a truth or lie. If T1 is a lie, the reactive hint is incredibly valuable (confirms a lie, narrows the other) but you've paid a heavy scoring cost. If T1 is a truth, you get both score AND information — best outcome. The design creates a genuine dilemma: do you play a card you're LESS sure about (to extract maximum info from the reactive hint) or one you're MORE sure about (to secure points)?

**15. Did you use card attributes (Location, Time, Source) in your deduction?**
Yes, heavily. The hint always references at least one attribute, so cross-referencing is essential. P1: Time (after 11 PM). P2: Location (living room). P3: claim behavior, but I also used Location (UTILITY) and Source (SMART_PUMP) to identify utility-type lies. The attribute system is well-designed — it gives multiple axes for deduction.

**16. Did the narrations add anything to the experience?**
Functionally, yes — they flesh out the claim in a way that can reveal inconsistencies (e.g., breaker_log's "manually reset" vs "it reset itself"). Experientially, they're fine but I mostly skimmed them for logical content. For a narrative-oriented player, they'd add more.

## Section 5: Replayability & Depth

**17. Would you play this again? Why or why not?**
Yes, to test alternate strategies. I want to know: what's the FLAWLESS rate with a pure safe-play strategy vs. probe strategy across many scenarios? I'd want to see 10+ puzzles to evaluate whether the design space is rich enough to sustain replayability. Three puzzles is too few to determine if the game is "solved."

**18. What would make you want to play more puzzles?**
Harder deduction — hints that don't cleanly partition into 3/3 groups. Cards with conflicting attributes (e.g., same location but different times). Lies that are subtler to identify from the scenario context. Also: a meta-progression system where FLAWLESS runs unlock harder puzzles.

**19. Do you think the 2-lies-out-of-6 ratio is right?**
Yes, for a 3-turn game. It means there's a 2/6 = 33% base rate of lies, and you're playing half the hand. Expected lies in a random 3-card draw = 1.0. The hint and deduction are supposed to beat that baseline. If you increased to 3 lies, the game becomes much harder and possibly frustrating. 2 lies is the sweet spot.

**20. Did you try to "break" the game? What did you find?**
Yes. My main finding: the safe-play heuristic (play hint-cleared high-strength cards as truths first) is nearly dominant. P3 was trivially solvable with this approach. The game is hardest to break when: (a) the hint doesn't clearly identify safe cards, (b) the target requires playing into uncertain territory, (c) lie strengths are high (so the penalty for mistakes is severe). P2 was the hardest because the target was proportionally high and the hint only narrowed things to groups of 3.

## Section 6: Emotional/Experiential

**21. Did you feel tension when selecting a card?**
Yes, specifically in P1 T3 (choosing between after-11 candidates, knowing one is a lie) and P2 T3 (knowing I was probably short of target anyway). The tension comes from the uncertainty + consequence structure, not from narrative. That's good — the core mechanic generates its own tension.

**22. How did it feel when a card turned out to be a lie?**
P1 wifi_log: satisfying — I probed deliberately and got the information I wanted. The -3 was the price of knowledge. P2 smartwatch: slightly frustrated — correct probe strategy, but the cost was unrecoverable. The emotional difference was entirely about whether the information could be leveraged into a win.

**23. Did the tier system (FLAWLESS/CLEARED/CLOSE/BUSTED) feel meaningful?**
Yes. FLAWLESS as "zero lies" is a clean mastery metric. CLEARED vs CLOSE is a good gradient. I wanted FLAWLESS every time, which means the tier system successfully created aspiration. BUSTED as failure state provides a floor. The 4-tier system is well-calibrated.

**24. Did KOA's personality come through? Did it enhance or detract?**
Came through clearly — sarcastic, omniscient, slightly antagonistic. It enhanced. The quips after each card were occasionally funny ("The router doesn't lie — oh wait. It literally just did.") and reinforced the interrogation framing. KOA functions as both game master and opponent, which works. I'd want more quip variety in a longer game to avoid repetition.

## Section 7: Design Feedback

**25. What's the single best thing about this game?**
The reactive hint mechanic. It creates a genuine strategic dilemma (probe vs. safe play) that interacts differently with each puzzle's structure. It's the source of most replayability and depth.

**26. What's the single biggest problem?**
The probe strategy is often EV-negative because lie-subtract scoring makes hitting a lie doubly punishing. This can create feel-bad moments where the strategically correct play (information-gathering probe) leads to an unrecoverable deficit. P2 demonstrated this clearly. Consider: reactive hints from truth cards are nearly as informative as from lie cards, which means probing with a suspected lie is almost always wrong. That collapses the interesting dilemma.

**27. What's one thing you'd add?**
A "challenge" card mechanic: instead of playing a card for points, you can "challenge" it (declare it a lie without playing it). If correct, you remove it and gain a small bonus. If wrong, you lose a turn. This would give probe-oriented players a way to use their deduction without the scoring penalty.

**28. What's one thing you'd remove?**
Nothing. The system is lean. Six cards, three turns, one hint, one reactive hint, four tiers. Every element does work. If forced to cut, I'd simplify the attribute system (Location/Time/Source is three axes — two might suffice), but I wouldn't strongly advocate for it.

**29. How would you rate the game overall (1-10)?**
**7/10.** Clean core mechanic, good information design, satisfying deduction. Loses points for: P3 being too easy, the probe dilemma being somewhat illusory (safe-play usually dominates), and only three puzzles — too few to judge whether the design space has real depth or is quickly exhausted. With a larger puzzle set and tuning to make probing more viable, this could be an 8-9.

**30. Would you recommend this to a friend? What type of player?**
Yes, to puzzle/deduction game fans. Specifically: people who enjoy Cryptid, Mysterium, or The Resistance — games where information extraction and logical elimination are core. Not ideal for players who want narrative immersion or high randomness. This is a thinker's game wearing a smart-home skin.

---

*End of playtest log. — Aisha*
*Session duration: ~45 minutes (lunch break well spent)*
*Notepad status: filled with probability trees and attribute tables*
