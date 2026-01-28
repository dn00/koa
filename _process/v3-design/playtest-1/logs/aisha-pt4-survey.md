# Aisha — Playtest 4: "The Thermostat War"

## Playthrough

### Reading the Scenario

First game. Let me understand the system before I do anything. 6 cards, 2 lies, 3 turns. Scoring: truth = +strength, lie = -(strength-1). Target 7. Let me map the math first.

Available strengths: 1, 3, 3, 4, 4, 5. I pick 3 of 6.

To hit 7 with all truths: 5+3+3=11, 5+4+3=12, 5+4+4=13, 4+4+3=11, 4+3+3=10, 3+3+4=10. Every combination of 3 truths reaches 7 unless phone(1) is involved: 1+3+3=7, 1+4+3=8, 1+4+4=9, 1+5+3=9, 1+5+4=10. Even with phone, all hit 7. So if I play 3 truths, I clear regardless. The game is purely about avoiding lies.

If I hit one lie: truth + truth + lie = (a + b) - (c - 1). Worst case: hit a str-5 lie: +a +b -4. If the other two truths are str 1 and str 3: 1+3-4=0. Best case for absorbing a lie: hit str-1 lie = 0 penalty.

Key insight: phone (str 1) as a lie costs 0. That's a free probe slot. I'm noting that.

### Reading the Hint

"One of the lies is trying too hard to explain why nothing happened. The other one isn't."

Ok. Two lies. One is "trying too hard to explain why nothing happened" — overexplaining an absence. The other "isn't" — either understated, or not about explaining absence at all.

Let me categorize every card by how hard it's "trying":

| Card | Claim Summary | "Trying too hard"? |
|------|--------------|-------------------|
| phone (1) | Zero screen time after 12:30 | Simple statement. Not trying hard. |
| smartwatch (4) | Unbroken light sleep at 2:15 | States a data point. Moderate. |
| hallway_cam (4) | No one walked to living room | Simple negative. Not trying hard. |
| light_lr (5) | Zero light events, room COMPLETELY dark | Emphatic. "No lamps, no phone screens, nothing. Nobody was in there." Three negations stacked. Medium-high effort. |
| motion_lr (3) | No motion events logged | "No motion, no presence, no one." Triple negation again. But the claim itself is straightforward. |
| temp_lr (3) | No manual override, system ran scheduled program | This one actively provides an alternative explanation. It's not just saying "nothing happened" — it's saying "here's WHY nothing happened." That's trying too hard. |

The "trying too hard" lie: **temp_lr** is the strongest candidate. It's literally explaining away the exact accusation (thermostat changed) with a cover story (scheduled program). That reads like a lie constructing a narrative.

Second strongest: **light_lr** — emphatic triple-negation. But "trying too hard" feels more like narrative construction than emphasis.

The "not trying too hard" lie: Could be anything that's low-key. phone (str 1) is the most low-key card in the set. smartwatch is a single data point. hallway_cam is a simple negative.

From a game design perspective — if phone is a lie, it costs 0 points. That's a wasted lie from a challenge standpoint. So I'd expect the lies to have meaningful strength. That suggests the lies are probably str 3+ cards.

Working theory: **temp_lr** (trying too hard) and one of {smartwatch, motion_lr} (not trying too hard). Let me look closer.

motion_lr: "no motion events logged during overnight hours." This is a living room sensor claiming no motion... but someone DID change the thermostat. If someone was physically in the living room, the motion sensor should have fired. This card being a lie makes narrative sense. But is it "trying too hard"? The narration says "no motion, no presence, no one was in the living room" — that's emphatic. But compared to temp_lr's alternative-explanation structure, it's less "trying too hard" and more "protesting too much."

smartwatch: "unbroken light sleep at 2:15 AM." This is a personal device alibi. It's the only card that directly alibis ME (not the room). If this is a lie, it means I wasn't actually sleeping. It's stated simply — not trying too hard at all.

Hmm. If I map this against the hint: temp_lr = trying too hard lie, smartwatch = not trying too hard lie. That would mean one lie is in the living room and one is personal. Interesting split.

But I could also read it as: motion_lr = trying too hard (triple negation about nothing happening), phone = not trying too hard. Though phone being a lie at str 1 feels like a design waste.

I'll go with: temp_lr and smartwatch as my primary suspects. motion_lr as an alternate for temp_lr.

### Turn 1 Decision

Strategy: I want to (a) score points and (b) get maximum information from the reactive hint. The briefing says my T1 choice determines what KOA reveals, and playing a card "KOA is watching" gives better info.

KOA cares about the thermostat and the living room. Playing a living room card should trigger a more specific reactive hint.

I also want to test my theory. If I play a card I believe is truth, I bank points. If I play a suspected lie, I get confirmation but lose points.

**EV analysis for T1:**

- **light_lr (str 5, suspected truth):** If truth: +5, need 2 more in 2 turns, trivial. If lie: -4, need 11 in 2 turns, impossible. High variance but I'm fairly confident it's truth. It's a living room card so should trigger a good reactive hint.
- **hallway_cam (str 4, suspected truth):** +4 if truth, -3 if lie. Not living room — might get a less useful hint.
- **temp_lr (str 3, suspected lie):** If lie: -2, need 9 in 2 turns (max possible: 5+4=9, exactly). Risky but possible if I then play perfectly. If truth: +3, need 4 more. Probes my theory directly. Living room card.
- **phone (str 1, suspected truth):** Free probe (0 cost if lie, +1 if truth). But +1 is almost nothing, and I'm fairly sure it's truth, so I learn little.

Playing light_lr is the strongest move. High confidence it's truth, high score, living room card for a good hint. Let me go.

### Turn 1: Playing light_lr

**Play: light_lr (str 5, LIVING_ROOM, 1:45 AM, LIGHT_SENSOR)**

**KOA Verdict:** TRUTH
> "Zero light events. The living room was dark and honest. KOA approves."

Score: 5/7.

**Reactive Hint:** "The light sensor is honest. But not every sensor in this house is — and I'm not just talking about the living room."

Ok. Let me parse that. "Not every sensor in this house is [honest]" — so at least one sensor is a lie. "And I'm not just talking about the living room" — there's a lying sensor OUTSIDE the living room too.

Sensor cards: light_lr (TRUTH, confirmed), motion_lr (LIVING_ROOM, MOTION_SENSOR), temp_lr (LIVING_ROOM, TEMP_SENSOR), smartwatch (BEDROOM, SMARTWATCH — is that a "sensor"?). Also phone (PHONE) — not really a sensor. hallway_cam (SECURITY_CAM) — camera, arguably a sensor.

"Not just talking about the living room" means at least one lie is outside the living room. But "not every sensor" means at least one sensor lies. Combined: one lie is a sensor outside the living room.

Sensors outside the living room: smartwatch (BEDROOM), hallway_cam (HALLWAY). One of those is a lie.

And the hint says "not just" — implying there IS also something in the living room. So the structure is: one lie in the living room (sensor) + one lie outside the living room (sensor).

Living room sensors remaining: motion_lr, temp_lr. One of those is a lie.
Outside sensors: smartwatch, hallway_cam. One of those is a lie.

Cross-referencing with the opening hint: "one lie is trying too hard to explain why nothing happened" — that's the living room lie (temp_lr or motion_lr). "The other isn't" — that's the outside lie (smartwatch or hallway_cam).

temp_lr tries harder to explain than motion_lr. smartwatch is more understated than hallway_cam. So: temp_lr + smartwatch is my strongest read.

But wait — let me reconsider. motion_lr claims no motion in the living room where someone physically changed a thermostat. That's narratively the most obviously false. And temp_lr claims no manual override, actively explaining it away. Both are strong lie candidates.

For the outside lie: smartwatch says "unbroken light sleep" — simple, not trying hard. hallway_cam says "no one walked past" — also simple. Hmm.

I'll stick with temp_lr + smartwatch. But I want to play safe for T2.

### Turn 2 Decision

Score: 5. Need 2 more. I need to play truths.

Cards remaining: phone (1), smartwatch (4), hallway_cam (4), motion_lr (3), temp_lr (3).

My suspects: temp_lr and smartwatch are lies. If I avoid both, I should play from {phone, hallway_cam, motion_lr}.

But wait — what if I'm wrong about which living room sensor is the lie? If motion_lr is the lie instead of temp_lr, and I play motion_lr, I lose 2 and sit at 3, needing 4 more from one card. Only hallway_cam (4) or smartwatch (4) could do it, but if smartwatch is a lie that's -3, dead. Risky.

Safest plays: **hallway_cam** (str 4, outside living room, I think it's truth) or **phone** (str 1, near-zero risk).

If I play hallway_cam and it's truth: 5+4=9. Already cleared with one turn to spare. I could play anything T3 for FLAWLESS attempt.

If hallway_cam is the outside lie: 5-3=2. Need 5+ from T3. Only light_lr already played. Bad.

But my read is that the outside lie is smartwatch, not hallway_cam. Confidence: ~70%. The hint said one lie "isn't trying too hard" — hallway_cam's claim is simple but it's a camera with footage, which feels verifiable, not fabricated. Smartwatch sleep data is easier to fabricate.

I'll play **hallway_cam**.

### Turn 2: Playing hallway_cam

**Play: hallway_cam (str 4, HALLWAY, 12:30 AM, SECURITY_CAM)**

**KOA Verdict:** TRUTH
> "Hallway camera is clean. Nobody walked past. But someone still got to that thermostat."

Score: 5 + 4 = 9. Target 7. Already cleared!

Now T3 is a FLAWLESS attempt. I need to play a truth. Remaining: phone (1), smartwatch (4), motion_lr (3), temp_lr (3).

### Turn 3 Decision

I believe smartwatch and temp_lr are lies, and motion_lr are lies. Wait — I have two suspect lies remaining: smartwatch and temp_lr. And I think motion_lr might be truth (or it could be the living room lie instead of temp_lr).

Let me re-examine. The reactive hint said one lie is in the living room (sensor), one outside. I'm sure of that structure. So exactly one of {motion_lr, temp_lr} is a lie, and exactly one of {smartwatch} is a lie (since hallway_cam is confirmed truth, and phone is... well, phone isn't really a sensor, but the hint said "sensor").

Actually — is "phone" a sensor? The hint said "not every sensor in this house." Phone's source is PHONE. Not a sensor. Smartwatch source is SMARTWATCH — arguably a sensor (it has biometric sensors). Hallway_cam is SECURITY_CAM — confirmed truth.

So the outside lie is smartwatch. That leaves one living room lie: motion_lr or temp_lr.

For FLAWLESS, I need to play a truth. Safe plays:
- **phone (str 1):** I'm very confident this is truth. It's not a sensor, the hint structure doesn't implicate it.
- **motion_lr (str 3):** Could be the living room lie. 50/50 between this and temp_lr.
- **temp_lr (str 3):** Could be the living room lie. 50/50.

phone is the safe play. +1 point, guaranteed (near-certain) truth. Score becomes 10. FLAWLESS.

Playing motion_lr or temp_lr is a coinflip for +3 or -2. If I'm wrong, score goes to 7 — still CLEARED but not FLAWLESS.

I came here to prove mastery, not gamble. **phone** is the correct play. It's low EV but near-zero risk.

Actually wait. Let me reconsider my read. The opening hint: "one of the lies is trying too hard to explain why nothing happened." temp_lr provides an alternative explanation ("scheduled program") — that's trying too hard. motion_lr just says "no motion logged" — that's a flat denial, not trying too hard. So temp_lr is the "trying too hard" lie, motion_lr is truth.

If I'm right, I could play motion_lr for +3 (score 12, FLAWLESS). But if I'm wrong, -2 (score 7, CLEARED).

EV of motion_lr: if 75% truth: 0.75(3) + 0.25(-2) = 2.25 - 0.5 = 1.75
EV of phone: ~100% truth: 1.0

motion_lr has higher EV but variance. For FLAWLESS, phone guarantees it (assuming phone is truth). I'll take the guarantee.

### Turn 3: Playing phone

**Play: phone (str 1, BEDROOM, 1:00 AM, PHONE)**

**KOA Verdict:** TRUTH
> "Phone was off. KOA respects a good night's sleep. Allegedly."

**Final Score: 5 + 4 + 1 = 10. Target 7. Zero lies played.**

**Tier: FLAWLESS**
> "Your alibis are airtight. The cat remains a suspect. The cat has no comment."

### Post-Game Analysis

Unplayed lies: smartwatch (str 4, lie) and one of {motion_lr, temp_lr}. I never confirmed which living room sensor was the lie. My theory was temp_lr, but without playing either I can't verify. I played conservatively on T3 and it paid off — FLAWLESS.

The decision tree worked: T1 high-confidence high-value (light_lr), T2 medium-confidence high-value (hallway_cam), T3 low-risk lock (phone). The reactive hint after T1 was the key — it told me the lie structure split between living room and outside, which let me avoid smartwatch on T2.

### Reaction

Solid puzzle. The hint system created a genuine deduction chain: opening hint narrowed the "flavor" of lies, my T1 play unlocked structural information about lie locations, and I could triangulate from there. Playing phone T3 was the rational lock but felt anticlimactic — I wanted to test my temp_lr theory. The EV math made the conservative line correct, which is how it should work in a skill game. I want to see if future puzzles make the safe line less obvious.

---

## Survey

### Part 1 — Quick Reaction (QR)

**QR1. What was the first thing you felt when you finished the puzzle?**
Satisfaction from executing the correct line. I identified the information structure, played accordingly, and locked FLAWLESS without gambling. The reactive hint was the pivot point — it converted a vague opening hint into actionable deduction.

**QR2. Did the puzzle feel fair?**
Yes. The information was sufficient to deduce a safe path. The opening hint was vague but the reactive hint gave concrete structural info. I never felt I was guessing — even my T3 "safe" play was a calculated choice, not desperation.

**QR3. Would you play tomorrow's puzzle?**
Yes. I want to see if the deduction structure varies or if "play high-confidence truth T1 → get reactive hint → solve" is always the dominant line. One puzzle isn't enough to evaluate depth.

### Part 2 — Scenario & Narrative (S1–S5)

**S1. The scenario (the thermostat, the cat, the accusation) made me want to engage with the puzzle.**
Rating: 5
The scenario is well-constructed — specific, humorous, and gives a clear physical event to reason about. The cat detail is a nice touch. It's not why I play (I'd engage with abstract logic too) but it didn't hurt and it helped me map claims to physical plausibility.

**S2. KOA's opening hint helped me start thinking about which cards might be lies.**
Rating: 5
"One lie is trying too hard to explain why nothing happened" immediately gave me a filter to apply to all 6 cards. I sorted cards by how "effortful" their explanations were. It didn't solve the puzzle but it narrowed the space, which is exactly what an opening hint should do.

**S3. The card narrations (the italicized story text) helped me evaluate whether a card was truthful or a lie.**
Rating: 5
The narrations were critical. The difference between "no motion logged" and "no manual override — the system ran its scheduled program" is only visible in the narration text. Without narrations, the claims column alone wouldn't support the "trying too hard" distinction. Good design.

**S4. KOA felt like a character, not just a game system.**
Rating: 4
KOA has personality — "KOA is not an idiot," "KOA respects a good night's sleep. Allegedly." It's a character. But I wasn't evaluating it as a character, I was evaluating the information content of its statements. The personality is gravy, not the meal.

**S5. The overall story of this puzzle (scenario + cards + KOA) felt cohesive.**
Rating: 6
Everything fits: the scenario is about the thermostat, the cards are sensors and devices in the house, the lies are about the specific event. No card felt out of place. The physical layout (bedroom → hallway → living room) creates a spatial logic that supports deduction. Well-integrated.

### Part 3 — Hint & Deduction (S6–S14)

**S6. KOA's opening hint gave me a useful starting point (even if I didn't fully understand it right away).**
Rating: 5
It was useful but not decisive. "Trying too hard" is interpretive — I had to read all 6 narrations and compare their rhetorical effort levels. It narrowed my suspects but didn't isolate them. Good calibration for a starting hint.

**S7. The reactive hint (after Turn 1) gave me new, useful information that changed or confirmed my thinking.**
Rating: 7
This was the game-changer. "Not every sensor in this house is [honest] — and I'm not just talking about the living room" gave me the structural split: one lie inside living room, one outside. Combined with confirmed truth on light_lr, I could map the lie space precisely. This hint was excellent.

**S8. I felt like I was deducing, not guessing.**
Rating: 6
T1 was partly a guess (high-confidence but unconfirmed), T2 was deduction (reactive hint narrowed the field), T3 was pure calculation (play the safe lock). The deduction arc improved over turns, which is ideal. I never felt I was blindly guessing.

**S9. The number of lies (2 out of 6) felt right — enough to create doubt without being overwhelming.**
Rating: 6
2/6 is 33%. With 3 plays, you're picking from the 4 truths — 4C3/6C3 = 4/20 = 20% chance of all truths if random. But you're not random, you have hints. The ratio creates enough uncertainty that hints matter but don't trivialize. Good balance.

**S10. I felt I had enough information to make meaningful choices (not too much, not too little).**
Rating: 6
After the reactive hint, I had strong structural information. Before it, I had interpretive guidance. The information curve was well-paced — enough to act on but not enough to solve trivially.

**S11. The difference between the opening hint and the reactive hint felt like a meaningful progression.**
Rating: 7
Absolutely. Opening hint: vague, interpretive, about content/tone. Reactive hint: specific, structural, about card locations. The progression from "think about what lies sound like" to "here's where the lies are" is a clean information escalation. This is the best design element I've seen so far.

**S12. I could trace a logical path from the hints to my final choices.**
Rating: 6
Opening hint → temp_lr is "trying too hard" → play light_lr to test living room + get hint → reactive hint confirms lie split (LR + outside) → hallway_cam is safe outside play → phone locks FLAWLESS. Every step followed from the previous. Clean chain.

**S13. I felt smart when I figured something out from the hints.**
Rating: 5
Parsing the reactive hint's "not just talking about the living room" to mean "one lie inside LR, one outside" was satisfying. It felt like extracting structured data from natural language, which is my bread and butter.

**S14. There were moments where I wasn't sure what to do — and that uncertainty felt productive, not frustrating.**
Rating: 5
T3 was the main uncertainty: play phone (safe) or motion_lr (theory test). The uncertainty was about risk tolerance, not information deficit. That's productive — I had enough info to evaluate the tradeoff. Slightly anticlimactic that the rational play was the boring one.

### Part 4 — Scoring & Risk (S15–S21)

**S15. I understood how scoring worked (truth = +strength, lie = −(strength−1)).**
Rating: 6
Clear formula. I computed penalties for all strengths before playing. The (str-1) penalty rather than full strength is a nice touch — it means str-1 lies are free, which creates a strategic "free probe" option.

**S16. The target score felt achievable.**
Rating: 6
Target 7 with available strengths {1,3,3,4,4,5} — any 3 truths hit 7+. The target is generous, which means the game is about FLAWLESS vs CLEARED, not about survival. That's the right difficulty for a first puzzle.

**S17. I thought about card strength when choosing what to play.**
Rating: 7
Constantly. T1: play str 5 because high payoff + high confidence. T2: play str 4 hallway_cam. T3: play str 1 phone to lock safely. Strength drove every decision alongside lie probability.

**S18. Playing a lie felt costly but not devastating.**
Rating: 5
I didn't play a lie, but I calculated: str-3 lie = -2, which from my position (score 9) would drop me to 7 = still CLEARED. str-4 lie (smartwatch) = -3, dropping to 6 = CLOSE. So the penalty structure is graduated. A lie isn't instant death but it threatens your tier. Feels right.

**S19. I felt tension about whether to play a high-strength card or play it safe.**
Rating: 5
T1 had real tension: light_lr (str 5) is huge if truth but catastrophic if lie. I was confident but not certain. T3 had the opposite tension: phone (str 1) is safe but boring vs motion_lr (str 3) which tests my theory. The tension existed but my analytical approach resolved it quickly.

**S20. The FLAWLESS / CLEARED / CLOSE / BUSTED tiers motivated me to take risks (or play carefully).**
Rating: 6
FLAWLESS was my explicit goal. It drove T3: I could have played motion_lr to test my theory and "learn more," but FLAWLESS motivated the safe play. The tier system creates clear performance targets beyond just "pass/fail."

**S21. I'd rather go for FLAWLESS than play it safe for CLEARED.**
Rating: 6
Yes — but note that I went for FLAWLESS BY playing it safe. The phone play was the conservative path TO FLAWLESS. If the safe play and FLAWLESS aligned, great. If they conflicted (e.g., I needed to play a risky card to reach target), I'd evaluate the EV. FLAWLESS is the goal but not at any cost.

### Part 5 — Cognitive Load & Pacing (S22–S26)

**S22. The puzzle had the right amount of information to process.**
Rating: 6
6 cards × 5 attributes + 2 hints + scoring formula. Manageable. I could hold the full state in my head (with notes). Adding more cards or attributes might push it past comfortable, but this felt calibrated.

**S23. Three turns felt like the right number of moves.**
Rating: 6
T1: probe/score, T2: informed play, T3: lock/gamble. Three acts. Adding a T4 would dilute the tension. Removing T1 would eliminate the reactive hint arc. Three is correct.

**S24. I didn't feel lost or confused during the puzzle.**
Rating: 6
I understood the system immediately. The only ambiguity was interpreting "trying too hard" from the opening hint, which is intended ambiguity, not confusion.

**S25. The card attributes (Location, Time, Source) were useful for my reasoning.**
Rating: 5
Location was critical — the living room / bedroom / hallway split mapped directly to the reactive hint. Source mattered for "sensor" classification. Time was less useful — all times are overnight, close together. The attributes aren't decorative but not all equally weighted.

**S26. I could hold the puzzle state in my head (or felt comfortable tracking it).**
Rating: 5
I used notes. 6 cards with 5 attributes each is too much for pure working memory. But with a notepad, it was comfortable. The game should expect players to take notes or provide an in-game tracking UI.

### Part 6 — Turn Structure & Reactive Hints (S27–S31)

**S27. Playing a card and seeing TRUTH/LIE felt satisfying.**
Rating: 5
Binary reveal is clean. The verdict quips add flavor. Each reveal updates my model. Not "exciting" per se but satisfying in an information-theoretic way.

**S28. The reactive hint after Turn 1 felt like a reward for my choice.**
Rating: 6
"Reward" is the right word. Playing a living room card triggered a hint about sensor honesty across the house. I felt rewarded for choosing a relevant card — the hint quality seemed proportional to my choice quality. That's excellent game feel.

**S29. I adjusted my plan after seeing the reactive hint.**
Rating: 6
Before the hint, I suspected temp_lr + smartwatch. After the hint confirmed the LR/outside split, I confirmed smartwatch was likely the outside lie and reinforced my living room suspicion. It refined my plan more than it changed it, but it gave me confidence to commit.

**S30. I understood why KOA gave me the hint she did (it felt connected to my Turn 1 choice).**
Rating: 6
I played a living room light sensor. KOA responded about sensor honesty and the living room. Clear causal connection. The hint felt responsive, not random.

**S31. The turn-by-turn flow (play → reveal → hint → play → reveal → play → reveal) felt natural.**
Rating: 6
Good pacing. Each phase serves a purpose: play (decide), reveal (learn), hint (reframe). The flow creates an information arc. No phase felt superfluous.

### Part 7 — Outcome & Emotional Response (S32–S35)

**S32. My outcome felt earned, not lucky.**
Rating: 6
I deduced the safe path through hint analysis and EV calculation. I never coinflipped. FLAWLESS feels earned — I correctly identified the lie structure and played around it.

**S33. After finishing, I wanted to understand what I missed or could have done differently.**
Rating: 5
I want to know which living room sensor was the lie. I'm 70% on temp_lr but I never confirmed. I also want to know if playing a non-living-room card T1 gives a weaker reactive hint — that would validate my T1 strategy.

**S34. I would play this puzzle format again tomorrow.**
Rating: 6
Yes, but with a caveat: I need to see variance in puzzle structure. If every puzzle is "play safe T1, get structural hint, play safe T2-T3," the game is solved. I need puzzles where the safe line isn't obvious.

**S35. The puzzle difficulty felt right for a daily game.**
Rating: 5
Slightly easy. I FLAWLESS'd on first attempt with a safe line. A daily puzzle should have a FLAWLESS rate of maybe 20-30% for experienced players. This felt closer to 50%+. But it's my first puzzle — maybe I was lucky, or maybe early puzzles should be easier.

### Part 8 — Comparisons & Context (C1–C4)

**C1. What other games or puzzles did this remind you of? Why?**
Wordle (daily puzzle, information narrowing per guess), Clue (deduction from partial reveals), Mastermind (hypothesis testing with feedback). The reactive hint system is unique though — it's like Wordle if the game gave you a different type of clue depending on which word you guessed first. That's a genuinely novel mechanic.

**C2. Did anything about this puzzle feel new or different from similar games?**
The reactive hint is new. Most deduction games give you the same feedback format regardless of your input. Here, my T1 choice shaped the information I received, which meant my strategy had a meta-layer: choose T1 not just for points but for information quality. That's a real strategic dimension I haven't seen in daily puzzles.

**C3. If this game were on your phone, would you open it daily?**
Probably. It's fast enough for a lunch break (10-15 minutes with analysis), has clear mastery tiers, and the reactive hint mechanic means each puzzle plays differently based on your T1 choice. I'd need to see 5+ puzzles to be sure the depth holds, but the foundation is there.

**C4. What's one thing you'd change to make it better?**
Show me the full solution after I finish. I want to know which cards were lies and verify my theory. A post-game reveal would massively increase the learning loop and make me more engaged for tomorrow's puzzle. Right now I'm guessing about temp_lr vs motion_lr and I'll never know if I was right.

### Part 9 — Emotional Arc (E1–E12)

**E1. When you first saw the scenario, what did you feel?**
Mild interest. The cat detail made me smirk. But I was already focused on the mechanical structure — counting cards, checking strengths, computing target feasibility.

**E2. When you read KOA's opening hint, what did you feel?**
Engaged. The hint gave me an analytical task: categorize cards by "trying too hard." This is my kind of puzzle — linguistic analysis mapped to logical structure.

**E3. When you were choosing your Turn 1 card, what did you feel?**
Controlled tension. I knew T1 was the most uncertain play (no reactive hint yet). The EV calculation was clear but the downside of light_lr being a lie (losing 4 points) was real. Confident but alert.

**E4. When you saw the Turn 1 result (TRUTH/LIE), what did you feel?**
Relief and confirmation. +5 banked, theory intact, living room intel incoming. My model was correct so far.

**E5. When you read the reactive hint, what did you feel?**
Excitement. "Not just talking about the living room" was a structural revelation. I could feel the puzzle's solution space collapsing. This is the dopamine hit — extracting signal from ambiguity.

**E6. When you were choosing your Turn 2 card, what did you feel?**
Confidence. The reactive hint gave me enough to identify hallway_cam as safe. Less tension than T1 because I had more information.

**E7. When you saw the Turn 2 result, what did you feel?**
Satisfaction. 9 points, already cleared. Now I'm playing for FLAWLESS. The pressure shifted from "survive" to "optimize."

**E8. When you were choosing your Turn 3 card, what did you feel?**
Mild frustration. The rational play (phone, str 1) was boring. I wanted to test my temp_lr theory by playing motion_lr, but the EV math said phone. Doing the right thing felt less interesting than doing the risky thing.

**E9. When you saw the Turn 3 result, what did you feel?**
Quiet satisfaction. FLAWLESS achieved. But the phone reveal was anticlimactic — I already knew phone was truth. The moment lacked drama.

**E10. When you saw your final tier, what did you feel?**
Accomplished. FLAWLESS on first attempt. Clean execution. But a small voice says "was it too easy?" I want a puzzle that makes me sweat.

**E11. When you read KOA's closing line, what did you feel?**
Amused. "The cat has no comment." Good punchline. KOA's personality is well-calibrated — dry, authoritative, slightly absurd.

**E12. Looking back on the whole experience, what's the dominant emotion?**
Analytical satisfaction. I found the optimal line and executed it. The reactive hint mechanic elevated what could have been a flat probability exercise into a genuine deduction chain. I'm cautiously optimistic about the game's depth.

### Part 9b — KOA Perception (K1–K8)

**K1. KOA felt like she was paying attention to what I did.**
Rating: 6
The reactive hint was clearly responsive to my T1 choice. KOA acknowledged the specific card I played and gave contextually relevant information. Not a canned response.

**K2. KOA's personality came through in the hints and responses.**
Rating: 5
"KOA approves." "KOA respects a good night's sleep. Allegedly." Dry, surveillance-state humor. Consistent voice. It's there but I'm not here for personality — I'm here for information.

**K3. KOA's hints felt like they came from a character who knew the truth and was choosing what to reveal.**
Rating: 6
Yes. The reactive hint felt curated — KOA chose to tell me about sensors specifically, and chose to broaden the scope beyond the living room. It felt like a deliberate breadcrumb, not a mechanical output.

**K4. KOA felt fair — not trying to trick me or mislead me.**
Rating: 6
Both hints were truthful and helpful. The opening hint was vague but not misleading. The reactive hint was specific and accurate. KOA is an ally with a personality, not an adversary.

**K5. I wanted to hear what KOA had to say after each turn.**
Rating: 5
I wanted the information, yes. The personality was a bonus. After T2 I specifically wanted a verdict to confirm my score. After T1 I was hungry for the reactive hint.

**K6. KOA made the puzzle feel more like a conversation than a test.**
Rating: 4
It's still fundamentally a test — I'm proving innocence through optimal card selection. KOA's personality softens the edges but I experienced it as a logic puzzle with flavor text, not a dialogue.

**K7. KOA's closing line added to the experience.**
Rating: 5
"The cat has no comment" is a good button. It rewards FLAWLESS with humor, closing the narrative loop. It didn't change my evaluation of the game but it ended the session on a positive note.

**K8. I'd describe KOA to a friend as... (complete the sentence)**
"...the Duolingo owl if it ran a surveillance state. It has opinions about your alibi and it will judge you, but it's fundamentally trying to help you solve the puzzle."

### Part 9c — Lies & Discovery (L1–L6)

**L1. I felt like I could distinguish lies from truths using the information available.**
Rating: 5
After the reactive hint, I could eliminate most cards. Before the reactive hint, I had informed suspicions but not certainty. The game gives enough info to narrow, not to perfectly solve (without risk). Good calibration.

**L2. The lies felt "real" — like they could plausibly be true, not obviously fake.**
Rating: 6
I never played a lie so I can only evaluate from the outside. The cards I suspected (smartwatch, temp_lr) both had plausible claims — sleep tracking data and scheduled thermostat programs are real things. Nothing screamed "obviously fake" from claim text alone. Good lie design.

**L3. When a card was revealed as TRUTH, I trusted the reveal.**
Rating: 7
No reason to doubt the game's feedback. TRUTH means TRUTH. The system is transparent about its binary outcomes.

**L4. When a card was revealed as LIE (if applicable), it felt like a moment of discovery.**
Rating: N/A
I didn't play a lie. Can't evaluate.

**L5. The lies felt well-designed — neither too obvious nor impossible to detect.**
Rating: 5
Again, I didn't catch the lies directly. But the hint system made them detectable without making them trivial. The "trying too hard" framing required close reading, not just pattern matching. That's good difficulty design.

**L6. I wanted to know WHY a card was a lie (the narrative reason).**
Rating: 4
Mildly curious. I care more about whether my deduction model was correct than about narrative justification. But a post-game "here's what actually happened" would be welcome for completeness.

### Part 9d — Meta & Mastery (M1–M18)

**M1. I think about the puzzle in terms of information value per turn.**
Rating: 7
This is literally how I played. T1 was an information investment (play a card that triggers a good reactive hint). T2-T3 were information exploitation (use the hint to play truths). Information per turn is the core strategic metric.

**M2. I was thinking about the "meta" — what patterns does this game reward?**
Rating: 7
Immediately. "Is there a dominant T1 strategy? Does playing living room cards always give better hints? Is phone always a free probe?" I was already building a meta-model from one game.

**M3. I considered playing a card I suspected was a lie, just to get information.**
Rating: 5
Yes — I considered playing temp_lr T1 as a lie probe. str-3 lie = -2 penalty, and I'd confirm my theory plus get a reactive hint. I rejected it because light_lr's EV was higher, but the probe strategy is clearly viable.

**M4. I think the optimal strategy is discoverable but not obvious.**
Rating: 5
On this puzzle, the optimal line was fairly apparent after the reactive hint. But I suspect puzzle-to-puzzle variance changes this. The reactive hint mechanic means optimal play depends on hint quality, which depends on puzzle design. One puzzle isn't enough to evaluate.

**M5. I want to see how different puzzles challenge different strategies.**
Rating: 7
This is critical. If every puzzle has the same structure (opening hint about tone, reactive hint about location), players will develop a fixed algorithm. The game needs puzzles where the reactive hint is less specific, or where the opening hint is more structural, to keep the meta evolving.

**M6. I think FLAWLESS requires skill, not luck.**
Rating: 5
On this puzzle, FLAWLESS required correct hint interpretation and EV-optimal play. The T3 phone play was a skill choice (choosing guaranteed lock over risky theory test). But I could argue the same result was achievable with moderate luck and less analysis. One puzzle sample.

**M7. The game rewards careful reading over quick pattern matching.**
Rating: 6
The "trying too hard" hint required reading narrations, not just scanning attributes. You can't solve this with a spreadsheet alone — you need to engage with the text. That's unusual for a logic puzzle and I think it's a strength.

**M8. I felt there was a "puzzle within the puzzle" — layers to unpack.**
Rating: 5
Layer 1: which cards are lies? Layer 2: what should I play T1 to maximize reactive hint value? Layer 3: how do I sequence T2-T3 for FLAWLESS? Multiple optimization layers, though they're more sequential than nested.

**M9. After finishing, I feel like I understand the game's system better.**
Rating: 6
I understand the T1→hint→T2-T3 arc. I understand the EV math. I understand that card choice T1 shapes the information landscape. One more puzzle would confirm whether these patterns generalize.

**M10. I'd want to compare my approach with other players.**
Rating: 5
Mildly. I'd be curious whether other players found different safe lines or interpreted the hints differently. But I'm more interested in solving future puzzles than relitigating this one.

**M11. I think the game could sustain my interest over weeks.**
Rating: 5
Conditional on puzzle variety. If the reactive hint mechanic produces genuinely different information landscapes per puzzle, yes. If it converges to a formula, no. The foundation is solid but longevity depends on content design.

**M12. I was thinking about what I'd do differently on a replay.**
Rating: 4
Not much. My line was clean. I might play motion_lr T3 instead of phone to test my theory, accepting CLEARED if wrong. That's the only alternative worth considering.

**M13. The game has enough strategic depth to be interesting long-term.**
Rating: 5
Promising but unproven. The reactive hint mechanic is the key differentiator. If each puzzle's hint tree is unique and non-formulaic, the depth is real. One puzzle can't answer this.

**M14. I noticed things that might be consistent "rules" or patterns across puzzles.**
Rating: 3
First puzzle — no cross-puzzle data yet. I noticed that the reactive hint was location-specific, which might be a pattern. I noticed the "trying too hard" language, which might recur. But I'm speculating without data.

**M15. I was already theorizing about the designers' intent (e.g., "they put both lies in the same location to mislead").**
Rating: 6
Constantly. "Did they split lies across locations to create a structural deduction?" "Is phone str-1 designed as a free probe by intent?" "Is the target deliberately easy to shift focus to FLAWLESS?" I was modeling the designer as much as the puzzle.

**M16. I felt there was a "correct" way to approach this puzzle, and I found it (or got close).**
Rating: 6
T1 light_lr → T2 hallway_cam → T3 phone feels like the intended optimal line. High-value safe plays, living room T1 for best reactive hint. I'm fairly confident I found the main line.

**M17. I'd be interested in a harder variant (more lies, fewer turns, or less information).**
Rating: 6
Yes. 3 lies out of 8 cards, same 3 turns. Or a reactive hint that's ambiguous rather than structural. Or a target that requires playing a suspected lie to reach. The current difficulty is a good onboarding point but I want escalation.

**M18. This puzzle made me want to "solve the game" (figure out the meta, not just this puzzle).**
Rating: 7
Absolutely. I'm already thinking about dominant strategies, hint type distributions, and whether the game can prevent formulaic play. This is the highest compliment I can give a game system — I want to understand it at a structural level.

### Run Log

| Turn | Card Played | Str | Predicted | Actual | Score After | Notes |
|------|-------------|-----|-----------|--------|-------------|-------|
| 1 | light_lr | 5 | TRUTH | TRUTH | 5 | High-value safe play. Living room for reactive hint. |
| 2 | hallway_cam | 4 | TRUTH | TRUTH | 9 | Reactive hint confirmed outside lies ≠ hallway_cam. |
| 3 | phone | 1 | TRUTH | TRUTH | 10 | Safe lock for FLAWLESS. Low value but zero risk. |

**Final Score:** 10
**Target:** 7
**Lies Played:** 0
**Tier:** FLAWLESS
**Opening Hint Used:** Yes — categorized cards by "trying too hard" to narrow lie suspects.
**Reactive Hint Used:** Yes — identified lie location structure (1 LR + 1 outside), confirmed safe plays.

### Part 10 — Final Open-Ended (F1–F4)

**F1. What was the most interesting decision you made, and why?**
T1: choosing light_lr over other options. It was the highest-stakes moment — no reactive hint yet, highest strength card, living room for hint optimization. The decision combined scoring EV, lie probability, and information value. Every subsequent decision flowed from this one.

**F2. What was the most confusing or frustrating moment?**
T3 card selection. Not confusing — I knew phone was safe. Frustrating because the optimal play was boring. I wanted to test whether temp_lr or motion_lr was the living room lie, but the EV math said "don't." The game punished curiosity at that point, which felt slightly off for a deduction game.

**F3. If you could ask the designer one question, what would it be?**
"How do you prevent the game from being solved by a fixed algorithm? Specifically: if playing a high-confidence living room card T1 always yields the best reactive hint, doesn't that become the dominant strategy regardless of puzzle content?"

**F4. Any other thoughts?**
The reactive hint mechanic is the game's core innovation and its biggest risk. If hints are too specific (like this one), experienced players will always achieve FLAWLESS. If hints are too vague, the game becomes a coinflip. The design challenge is calibrating hint informativeness per puzzle to maintain a ~25% FLAWLESS rate for skilled players. I'd also strongly recommend a post-game solution reveal — showing which cards were lies and why would close the learning loop and increase retention. Right now I don't know if my temp_lr theory was right, which is an itch I can't scratch.
