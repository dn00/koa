# David's Playtest Log — Home Smart Home: The Statement (V3)

**Player:** David, 41, project manager
**Setting:** Dentist waiting room, phone, ~10 minutes
**Date:** 2026-01-27

---

## PUZZLE 1: "The Power Outage"

**Target Score: 5**

### Reading the Scenario & Hint

Alright. Breaker tripped at 9:14 PM, house went dark, gaming PC died mid-match. I say I was upstairs the whole time. Classic setup — I'm the suspect, and I need to prove I wasn't in the basement.

KOA's hint: *"One of the lies claims something happened after 11 PM. The other one? You're on your own."*

OK. So one lie is after 11 PM. Let me look at the cards by time:

- doorbell: 7:00 PM
- wifi_log: 8:30 PM
- thermostat: 9:00 PM
- breaker_log: 11:15 PM — **AFTER 11 PM**
- motion_base: 11:30 PM — **AFTER 11 PM**
- fitbit: 11:45 PM — **AFTER 11 PM**

Three cards are after 11 PM: breaker_log, motion_base, fitbit. One of those is a lie. The other lie is NOT after 11 PM (or is it? The hint says one of the lies "claims something happened after 11 PM" — so exactly one lie is post-11 PM). That means the other lie is from doorbell, wifi_log, or thermostat.

This is like Clue meets Wordle. The hint narrows the space but doesn't solve it. I like that — it's a real constraint I can work with.

**Safe-first strategy:** I want to play cards I'm most confident are truths. The three pre-11 PM cards have one lie among them. The three post-11 PM cards have one lie among them. So 2 out of 3 in each group are safe. Not great odds either way.

But wait — thermostat is only strength 2. Even if it's a lie, I only lose 2. Low risk. And doorbell at strength 4 feels solid — doorbell cams are hard to fake narratively. Let me start safe.

### Turn 1: Playing `doorbell` (Str 4)

Reasoning: Strength 4, earliest timestamp (7 PM), and it's a doorbell cam — feels like a solid alibi. It's pre-11 PM, so there's a 1-in-3 chance it's a lie, but the narrative feels trustworthy. Safe opener.

**YOU:** "I got home at 7. Check the doorbell cam — nobody else came in after me. It was just me all night."

**KOA Verdict:** TRUTH. +4. Running score: **4**.

**KOA Quip:** "Doorbell cam doesn't lie. Unlike some of these other devices."

**Reactive Hint:** "Front door checks out. But something in the basement feels off — and not just the breaker."

### Post-T1 Think-Aloud

OK. Doorbell is truth. Score is 4, I need 5. So I need at least +1 net from my next two cards.

The reactive hint says "something in the basement feels off." Basement cards are: wifi_log (basement, 8:30 PM) and breaker_log (basement, 11:15 PM). Motion_base is also basement at 11:30 PM... wait, the hint said "not just the breaker." That's pointing at the breaker AND something else in the basement.

So the hint is telling me the basement has problems. breaker_log is basement + after 11 PM — that fits the "after 11 PM" lie from the opening hint. And wifi_log is basement + pre-11 PM — that could be the other lie.

This is... actually really good deduction. The reactive hint layered on the opening hint is giving me real information. I'm narrowing it down.

If breaker_log (str 5) and wifi_log (str 3) are both lies, I need to avoid both. That leaves me with fitbit (3), thermostat (2), and motion_base (4) as likely truths.

I need 1 more point minimum. Even thermostat (str 2) gets me to 6. Let me play it safe.

### Turn 2: Playing `thermostat` (Str 2)

Reasoning: Low strength, pre-11 PM group but I suspect wifi_log is the pre-11 lie (basement connection from the reactive hint). Thermostat is bedroom, not basement. Should be safe.

**YOU:** "The thermostat went to night mode at 9. Nobody touched it after. I was in bed."

**KOA Verdict:** TRUTH. +2. Running score: **6**.

**KOA Quip:** "Thermostat checks out. The bedroom was cozy and honest."

### Post-T2 Think-Aloud

Score is 6, target is 5. I'm already CLEARED. Now the question is: do I go for FLAWLESS (no lies played) or do I risk it?

I need to avoid lies. I'm fairly confident breaker_log and wifi_log are the lies based on my deduction. So motion_base (str 4) or fitbit (str 3) should both be safe. Let me play motion_base for the bigger payoff — go big for the finish.

### Turn 3: Playing `motion_base` (Str 4)

Reasoning: I believe the basement lies are breaker_log and wifi_log based on the hints. motion_base is basement but it's the motion sensor, not the breaker or router. The reactive hint said something in the basement "feels off" and pointed at the breaker — motion_base should be clean.

**YOU:** "The basement sensor says all-clear. No movement after 11. Nobody went down there."

**KOA Verdict:** TRUTH. +4. Running score: **10**.

**KOA Quip:** "Basement was quiet. Good. That's one less room KOA has to worry about."

### Final Outcome

**Final Score: 10 / Target: 5**
**Lies Played: 0**
**Tier: FLAWLESS**

**KOA Closing Line:** "Every alibi checks out. Not a single lie. Your gaming PC died for nothing. Go back to bed."

**Lie Reveal:**
- breaker_log (str 5): LIE — "Manually reset at 11:15 PM? The breaker was never touched. Nice try."
- wifi_log (str 3): LIE — "The router doesn't lie — oh wait. It literally just did."

### Post-Puzzle Reflection

OK. That felt *real*. The hint system actually works — the opening hint gave me a time-based constraint, the reactive hint gave me a location-based constraint, and together they narrowed the field enough that I could deduce with confidence. I wasn't guessing. I was solving.

This is way better than I expected from a mobile game. The deduction has actual depth. "Clue meets Wordle" — yeah, that's exactly what this is.

---

## PUZZLE 2: "The Thermostat War"

**Target Score: 7**

### Reading the Scenario & Hint

$412 energy bill, someone cranked the thermostat to 85 at 2 AM, the cat has been blamed. This is funny. I like the personality here.

KOA's hint: *"One of the lies is from a sensor in the living room. The other one isn't."*

Living room cards: light_lr (str 5), motion_lr (str 4), temp_lr (str 3). One of these three is a lie. The other lie is NOT in the living room — so it's from phone (1), smartwatch (3), or doorbell (4).

Target is 7. That's high — I need to be strategic. Maximum possible is 3 truths adding up. If I pick all truths, I need at least 7 from 3 cards. The available strengths are 1, 3, 4, 5, 4, 3.

Let me think about safe picks. Non-living-room cards: phone (1), smartwatch (3), doorbell (4). One of these is a lie. Living room: light_lr (5), motion_lr (4), temp_lr (3). One of these is a lie.

To hit 7, I need high-value truths. If I pick one from each group that I'm confident in, plus a third...

Phone (str 1) is almost certainly safe — who would make a strength-1 card a lie? Low payoff for the game design. But it only gives me 1 point. Still, it's the safest possible play.

Actually wait — from a design perspective, making the str 1 card a lie would be cruel and pointless. It's probably truth. Let me use it to gather info.

Hmm, but I need 7 points from 3 cards. If I play phone (1), I need 6 from my other two. That means I'd need like 5+4 or 4+3... risky. Let me think differently.

Doorbell (str 4, front door) — not living room. Feels safe as a non-living-room truth. Two-thirds chance it's truth.

Let me start with doorbell. It's strong enough to matter and feels narratively solid.

### Turn 1: Playing `doorbell` (Str 4)

Reasoning: Strength 4, not in living room, and doorbell cams have been reliable in my experience (P1 doorbell was truth too). Good opening.

**YOU:** "The hallway was empty after 12:30. Doorbell cam saw nothing. Nobody walked to the living room."

**KOA Verdict:** TRUTH. +4. Running score: **4**.

**KOA Quip:** "Empty hallway. Nobody came in. Which means whoever did this was already here."

**Reactive Hint:** "Nobody came in. So whoever did this was already here — and maybe closer to you than you think."

### Post-T1 Think-Aloud

Score 4, need 7. I need at least +3 net from the next two turns. That means I need two truths, preferably mid-to-high strength.

The reactive hint says "closer to you than you think." That's pointing at personal devices — things on my person. The non-living-room remaining suspects are phone (bedroom) and smartwatch (bedroom). "Closer to you" — something I was wearing? The smartwatch?

If smartwatch is the non-living-room lie, then phone is safe (but only str 1). And one living room sensor is a lie.

For the living room, the opening hint says one is a lie. light_lr (5), motion_lr (4), temp_lr (3). I need to figure out which. The hint doesn't give me more info yet.

Let me think about the narrative. The thermostat was cranked at 2 AM. temp_lr claims it was a scheduled program — that directly addresses the crime. motion_lr claims no presence in the living room — that also directly denies the crime. light_lr says no lights were on — less directly relevant.

Cards that "protest too much" or directly deny the crime are often suspicious... but that's meta-reasoning, not in-game logic.

OK, I think smartwatch might be the non-living-room lie based on "closer to you." For the living room, I'll gamble on light_lr (str 5) being truth — it's the highest value and the hint hasn't pointed at it specifically.

Actually, let me be more methodical. I need 3+ more points. If I play light_lr (5) and it's truth, I'm at 9 and my third card doesn't even matter much. If it's the lie, I'm at -1 and in deep trouble.

Safe play: temp_lr (str 3). If truth, I'm at 7 — exactly target. Then T3 is gravy.

### Turn 2: Playing `light_lr` (Str 5)

Reasoning: I'm going to take a calculated risk. I think the living room lie is more likely motion_lr (which directly denies anyone being present — the most suspicious claim). light_lr just says no lamps were on, which is less of a direct denial. And I need the points. If I play safe with temp_lr (3) I'm at 7 exact but have no margin.

Actually... no. Let me reconsider. I'm a methodical player. The safe play is temp_lr. But 5 points from light_lr is very tempting...

You know what, I'll go with light_lr. Sometimes you have to trust your read. Motion_lr is the one that flatly denies anyone was in the room — that feels like the lie. Light_lr is just about lamps.

**YOU:** "The living room was dark all night. Light sensor confirms it — no lamps, no screens, no one in there."

**KOA Verdict:** TRUTH. +5. Running score: **9**.

**KOA Quip:** "No lamps. The living room was dark and honest. KOA approves."

### Post-T2 Think-Aloud

Score 9, target 7. Already CLEARED. Now for T3 — I want FLAWLESS. I need to avoid lies. I think the lies are smartwatch and motion_lr. Let me play something safe.

Remaining: phone (1), smartwatch (3), motion_lr (4), temp_lr (3).

I believe smartwatch and motion_lr are lies. So phone and temp_lr should be truths. Phone is str 1, temp_lr is str 3. Either works for FLAWLESS. Let me play temp_lr for more points.

### Turn 3: Playing `temp_lr` (Str 3)

Reasoning: I believe the lies are smartwatch (personal device, "closer to you") and motion_lr (living room sensor that flatly denies presence). temp_lr should be safe.

**YOU:** "The thermostat change was scheduled. It's a program — it does that. Nobody got up to crank it to 85."

**KOA Verdict:** TRUTH. +3. Running score: **12**.

**KOA Quip:** "Scheduled program. Boring. Trustworthy. KOA accepts."

### Final Outcome

**Final Score: 12 / Target: 7**
**Lies Played: 0**
**Tier: FLAWLESS**

**KOA Closing Line:** "Your alibis are airtight. The cat remains a suspect. The cat has no comment."

**Lie Reveal:**
- motion_lr (str 4): LIE — "No presence detected? KOA detected LIES. The motion sensor is a fraud."
- smartwatch (str 3): LIE — "Light sleep at 2:15? Your watch begs to differ. So does KOA."

### Post-Puzzle Reflection

Two for two FLAWLESS. The hint system is really working — the opening hint gives a category constraint, the reactive hint points in a direction, and together with the card narratives I can triangulate. The "closer to you" reactive hint was the clincher — I read it as smartwatch immediately.

The cat line at the end got me. That's good writing. KOA has personality without being annoying.

Target 7 was noticeably harder to think about — higher stakes, had to be more aggressive with card selection. Good difficulty progression.

---

## PUZZLE 3: "The Hot Tub Incident"

**Target Score: 8**

### Reading the Scenario & Hint

Hot tub ran all night, deck flooded, $2,200 damage. No timer on the hot tub. I claim I was in bed. These scenarios are escalating nicely — the stakes feel real and absurd at the same time.

KOA's hint: *"One of the lies flat-out denies something happened. It protests too much. The other one? Subtler."*

This is a different kind of hint — it's about the NATURE of the claim, not location or time. More abstract. Harder. I like it.

Let me look at the cards:

- fitbit (2): REM sleep from 1-5 AM — claims I was asleep
- thermostat (3): hallway temp steady, doors closed — claims no one opened back door
- water_meter (3): baseline water usage — claims no extra water was used
- spa_pump (5): jets confirmed OFF — **flat-out denies the hot tub was on**
- smart_lock (4): zero unlock events on back door — claims door stayed shut
- motion_hall (5): no movement toward back of house — claims no one walked that way

"Flat-out denies something happened" and "protests too much" — that's spa_pump. It literally says "hot tub jets confirmed OFF" when the deck is underwater. That's protesting too much. That feels like a lie.

The "subtler" one is harder. It's not a flat denial — it's a record that doesn't quite add up. water_meter claiming baseline usage when the deck is flooded? That's suspicious too — but it's "subtler" because it's just a number, not a flat denial.

Or maybe thermostat — claiming all doors were closed (temp held steady) while the back door was obviously opened at some point?

Hmm. Target is 8. I need to be very aggressive. Available strengths: 2, 3, 3, 5, 4, 5. To get 8 from 3 truths, I need 5+4+3 at minimum (12) or 5+5+anything... wait no, if I play a lie it SUBTRACTS. So I need to get 8 net.

If I play two str-5 truths (spa_pump and motion_hall) plus a str-3 truth, that's 13. But I think spa_pump is a lie — so that would be -5 + 5 + 3 = 3. Bad.

OK so I should avoid spa_pump. If spa_pump (5) is a lie, my available truths max at: motion_hall (5), smart_lock (4), thermostat (3), water_meter (3), fitbit (2). But one more is also a lie (the "subtle" one).

If water_meter is the subtle lie: remaining truths are motion_hall (5), smart_lock (4), thermostat (3), fitbit (2). Best 3: 5+4+3 = 12. That clears 8 easily.

If thermostat is the subtle lie: remaining truths are motion_hall (5), smart_lock (4), water_meter (3), fitbit (2). Best 3: 5+4+3 = 12. Also fine.

Either way, motion_hall (5) and smart_lock (4) seem like safe bets — they're not "flat denials" and not "subtle records." Let me start with one of those.

### Turn 1: Playing `smart_lock` (Str 4)

Reasoning: smart_lock claims zero unlock events on the back door. It's not "protesting too much" — it's a factual log. It's not the spa pump (flat denial) and it's not a utility meter (subtle). Feels safe. Str 4 is a solid opener.

**YOU:** "The back door didn't open once. Zero unlock events from 10 PM to 6 AM. Nobody went outside. Period."

**KOA Verdict:** TRUTH. +4. Running score: **4**.

**KOA Quip:** "Zero unlocks. The back door stayed shut. So how did someone get to the deck...?"

**Reactive Hint:** "The lock is honest. Nobody used the door. But the damage happened anyway — and one device is lying about the evidence."

### Post-T1 Think-Aloud

Score 4, need 8. I need +4 net from two more cards. That means two truths adding up to 4+, or one big truth that absorbs a small lie.

The reactive hint says "one device is lying about the evidence." Evidence of what? The water damage. That points at water_meter or spa_pump — devices that would record evidence of the hot tub running. This confirms my spa_pump suspicion.

"Lying about the evidence" — spa_pump says jets were OFF (lying about direct evidence) and water_meter says baseline usage (lying about water evidence). Both are "lying about evidence."

But the opening hint already told me the "flat denial" one — that's spa_pump. The reactive hint is reinforcing that. The "subtler" lie is still ambiguous between water_meter and thermostat.

I need to play motion_hall (5) — it's my biggest safe card. If truth, I'm at 9 and already CLEARED.

### Turn 2: Playing `motion_hall` (Str 5)

Reasoning: motion_hall is hallway, not a utility sensor, not a flat denial. It's a motion sensor that says no one walked toward the back of the house. It doesn't "protest too much" — it's just reporting no motion. Should be truth. And at str 5, it puts me over target.

**YOU:** "The hallway sensor didn't pick up anything. No one walked toward the back of the house. Not me, not anyone."

**KOA Verdict:** TRUTH. +5. Running score: **9**.

**KOA Quip:** "No hallway movement. Clean. But the deck didn't flood itself."

### Post-T2 Think-Aloud

Score 9, target 8. CLEARED already. For FLAWLESS, I need to avoid the subtle lie on T3.

Remaining cards: fitbit (2), thermostat (3), water_meter (3), spa_pump (5).

I'm confident spa_pump is a lie. The subtle lie is either water_meter or thermostat.

"Subtler" — water_meter claims 0.2 gal/hr baseline. If the tub ran all night, that number is flatly wrong, but it's presented as just a boring meter reading. That's subtle — it's a quiet lie dressed up as routine data.

Thermostat claims hallway temp held at 71. If someone opened the back door, temp would drop... but maybe they went through a different way? The smart lock says the door didn't open (truth), so maybe the thermostat IS telling the truth — the door really didn't open (the hot tub was turned on remotely or left running from earlier?).

Actually, the smart lock is truth — the back door stayed locked. So the thermostat reading of "doors closed, 71 degrees" is consistent with the smart lock truth. That makes thermostat more likely to be truth.

water_meter claiming baseline when the deck is flooded — that's the subtle lie. A number that looks routine but is actually fabricated.

I'll play fitbit (str 2) for the safe close. It's only strength 2 and it's about my sleep, not about evidence. Minimal risk.

### Turn 3: Playing `fitbit` (Str 2)

Reasoning: fitbit (str 2) is the safest remaining card. It's about my sleep, not about the hot tub evidence. Even if somehow wrong, -2 only brings me to 7 which is still CLOSE. But I don't think it's a lie — the hint framework points at spa_pump and water_meter.

**YOU:** "I was in REM sleep from 1 to 5 AM. Four straight hours. My Fitbit logged every cycle. I didn't move."

**KOA Verdict:** TRUTH. +2. Running score: **11**.

**KOA Quip:** "REM cycles don't lie. You were asleep. The hot tub was not."

### Final Outcome

**Final Score: 11 / Target: 8**
**Lies Played: 0**
**Tier: FLAWLESS**

**KOA Closing Line:** "Every alibi checks out. You told nothing but the truth. $2,200 in damages, though. KOA is billing you anyway."

**Lie Reveal:**
- spa_pump (str 5): LIE — "Jets confirmed OFF? The flooded deck would like a word. So would KOA."
- water_meter (str 3): LIE — "0.2 gallons per hour? The deck is underwater. Math isn't your strong suit."

### Post-Puzzle Reflection

Three for three FLAWLESS. But this one was the hardest to think through — the hint was more abstract ("protests too much" vs "subtler") and required narrative reasoning, not just filtering by time or location. I had to actually read the claims and think about what kind of lie each card was telling. That's a real difficulty progression.

The confirmation from the smart lock truth feeding into my thermostat reasoning — that's emergent deduction. The game didn't hand that to me; I figured it out by cross-referencing. That's the kind of thing that makes a puzzle game feel alive.

I'm genuinely impressed. This is not a time-waster. This is a real puzzle game that respects my time and my intelligence. Ten minutes, three puzzles, real deduction, good writing. On my phone in a dentist waiting room. That's exactly what I've been missing.

---

# V3 Playtest Survey

Complete this AFTER all 3 puzzles. Be honest — we need real reactions, not polite ones.

---

## Part 1: Quick Reactions (answer in under 30 seconds each)

**QR1:** In one word, how did you feel after Puzzle 1?
Satisfied.

**QR2:** In one word, how did you feel after Puzzle 3?
Impressed.

**QR3:** Would you play again right now? (Yes / Maybe / No)
Yes.

**QR4:** Did you feel like you got better from P1 to P3? (Yes, clearly / A little / Not really / Got worse)
Yes, clearly.

**QR5:** Which puzzle was your favorite? (P1 / P2 / P3) Why, in one sentence?
P3 — the hint required narrative reasoning, not just filtering, and the cross-referencing between card truths felt like genuine detective work.

---

## Part 2: Structured Assessment (1-7 scale, 1=strongly disagree, 7=strongly agree)

### Engagement
**S1:** I wanted to keep playing after each puzzle. **6**
**S2:** I felt tension when choosing which card to play. **5**
**S3:** The scenarios were interesting and I wanted to know what happened. **6**
**S4:** I found myself thinking about what I'd do differently after a loss. **3** (didn't lose, but I can see how losses would be instructive)
**S5:** I lost track of time while playing. **5**

### Clarity
**S6:** I understood the rules after reading the briefing. **7**
**S7:** I understood what KOA's opening hint was telling me. **6**
**S8:** The scoring (truth adds, lie subtracts) was intuitive. **7**
**S9:** When I lost, I understood why. **N/A** (didn't lose)
**S10:** The feedback after each turn helped me make better decisions. **7**

### Deduction
**S11:** The opening hint helped me identify which cards might be lies. **6**
**S12:** The reactive hint after Turn 1 changed how I played Turns 2-3. **6**
**S13:** I felt like I was solving a puzzle, not just guessing. **7**
**S14:** I could distinguish between "I know this is safe" and "I'm gambling" when playing a card. **6**
**S15:** The card attributes (location, time, source) were useful for deduction, not just decoration. **7**
**S16:** By Puzzle 3, I had a strategy for how to approach the hint. **7**

### Difficulty
**S17:** Puzzle 1 felt like a fair challenge. **6**
**S18:** Puzzle 3 felt harder than Puzzle 1. **6**
**S19:** The difficulty progression across puzzles felt right. **6**
**S20:** When I lost, it felt like MY mistake (not the game being unfair). **N/A** (didn't lose)
**S21:** The game punished me for playing in a reasonable way. (reverse-scored) **2**

### KOA (the investigator character)
**S22:** KOA felt like a real character, not just a game system. **6**
**S23:** KOA's lines were memorable or funny. **6**
**S24:** I enjoyed the back-and-forth with KOA. **5**
**S25:** KOA's responses influenced my decisions. **5**
**S26:** I paid attention to what KOA said (not just the score). **7**
**S27:** I wanted to "beat" KOA — it felt personal. **4**

### Narration & Immersion
**S28:** The player narration ("YOU: ...") added to the experience. **5**
**S29:** Playing a card felt like making a statement, not just selecting an option. **6**
**S30:** The game felt like an interrogation scene. **6**
**S31:** The scenario made me care about the outcome beyond just winning. **5**
**S32:** I read the full narration each time (not just the card ID and score). **7**

### Achievement & Tiers
**S33:** Winning felt earned, not lucky. **7**
**S34:** I wanted FLAWLESS, not just CLEARED. **6**
**S35:** The tier system (FLAWLESS/CLEARED/CLOSE/BUSTED) motivated me to play carefully. **6**
**S36:** The lie reveal at the end was satisfying (or educational if I lost). **6**
**S37:** I cared about which specific cards were lies, not just my score. **7**

### Net Promoter Score
**S38:** On a scale of 0-10, how likely would you recommend this game to a friend? **8**

---

## Part 3: Comparisons & Open-Ended

**C1:** Which of these games does this remind you of most?
Clue / Cluedo — but compressed into a single hand. The deduction loop is the same: you have partial information and you're eliminating possibilities. But it also has a Wordle energy — the daily-puzzle, short-session, "did you get it today?" feel.

**C2:** What does this game do BETTER than Clue?
Respects my time. Clue takes 45 minutes and half of it is rolling dice and walking around a board. This gives me the deduction core in 3 minutes. Also, the narrative layer is better — I'm not just matching cards to rooms, I'm reading alibis and deciding what sounds like a lie.

**C3:** What does this game do WORSE than Clue?
Social interaction. Clue is a group game — the deduction involves reading other players, asking questions, watching who asks what. This is solo. The KOA character helps, but it's not the same as playing against a real person.

**C4:** Complete this sentence: "This game is basically **Clue** but with **Wordle's time commitment and a lie detector instead of a murder weapon.**"

---

## Part 4: Emotional Journey

**E1:** Reading the scenario for the first time: Intrigued — good setup, relatable stakes.
**E2:** Reading KOA's opening hint: Focused — this is the puzzle, let me work it.
**E3:** Looking at your hand of 6 cards: Analytical — scanning for patterns, bucketing by hint criteria.
**E4:** Choosing your Turn 1 card: Cautious confidence — safe pick, gathering intel.
**E5:** Hearing your character "speak" the narration: Entertained — adds texture, makes it feel like a scene.
**E6:** Getting the Turn 1 verdict from KOA: Relief — confirmed my read.
**E7:** Hearing the reactive hint: Energized — new information, time to narrow it down.
**E8:** Choosing Turn 2: Purposeful — I have a theory, testing it.
**E9:** Choosing Turn 3: Confident — I've figured it out, going for FLAWLESS.
**E10:** Seeing the final outcome and tier: Proud — earned, not lucky.
**E11:** Reading the lie reveal: Validating — confirms my reasoning was sound.
**E12:** Seeing the share card: Mild interest — I'd share if a friend played too.

---

## Part 5: Key Moments

**K1:** P1, after playing doorbell and getting the reactive hint about "something in the basement feels off." That was the moment the hint system clicked — the opening hint gave me time, the reactive hint gave me location, and suddenly I had real constraints to work with. That was the "oh, this is actually good" moment.

**K2:** P2, the reactive hint "closer to you than you think" after playing doorbell. I immediately thought "smartwatch" — something on my person. That shifted my mental model of who was lying from a room-based theory to a device-based theory.

**K3:** P3, cross-referencing smart_lock (truth) with thermostat to conclude thermostat was likely honest too. Emergent deduction that the game didn't hand me — I derived it from the logical relationship between two cards.

**K4:** No real frustration. The closest was P3's opening hint being more abstract — "protests too much" is subjective. I could see a less experienced player not knowing what to do with that.

**K5:** Not once, actually. Every turn I had at least partial information. T1 was always the least informed, but even then I could make a safe-first pick based on the opening hint.

**K6:** "The cat remains a suspect. The cat has no comment." Genuinely funny. Good writing.

**K7:** No. The design felt fair throughout. The hints gave real information, the deduction was legitimate, and the lies made narrative sense.

**K8:** Nothing was truly confusing. The most complex moment was P3's hint about "protests too much" vs "subtler" — it required a different kind of thinking. But that's difficulty, not confusion.

---

## Part 6: Strategy & Learning

**L1:** T1 strategy: always play a card I'm most confident is truth, ideally with decent strength. P1 I picked the earliest timestamp (doorbell). P2 same card for the same reason. P3 I picked smart_lock because it didn't fit either lie profile from the hint. Strategy refined from "earliest = safest" to "least suspicious per hint = safest."

**L2:** Opening hint usage — P1: "one lie after 11 PM" let me split the hand into two groups and know each group had exactly one lie. P2: "one lie in the living room" same split. P3: hint was about claim TYPE not location/time, so I had to read each card's claim and judge which one "protested too much." Each puzzle required the hint to be parsed differently.

**L3:** Yes, absolutely. P1's reactive hint ("something in the basement feels off") narrowed the non-11PM lie to a basement card, which combined with the opening hint basically solved the puzzle. P2's reactive hint ("closer to you") pointed at personal devices. The reactive hint was the single most useful piece of information each puzzle.

**L4:** Yes — lies tend to be the cards that most directly deny the crime happened. The spa pump saying "jets OFF" when the deck is flooded. The motion sensor saying "no one was there" when someone clearly was. The higher-strength lies are the bold denials; the lower-strength lies are the quiet fabrications.

**L5:** I went 3/3 FLAWLESS, so honestly I'm not sure what I'd change. Maybe I'd try playing a suspected lie on T1 just to see how the reactive hint responds — use it as a diagnostic tool rather than always playing safe.

**L6:** There's a correct general approach — safe-first T1 to extract the reactive hint, then use combined hint information to navigate T2-T3. But within that framework, each puzzle requires its own reading. It's strategy + puzzle-specific deduction.

---

## Part 7: Product & Market Fit

### Format Preference
**M1:** (c) Both — daily puzzles plus a story mode. The daily puzzle is the hook, but a connected story mode would keep me coming back for longer.

**M2:** (d) As long as puzzles stay fresh. The variety in hint types across these 3 puzzles suggests there's design space. If hint types repeat too often, I'd drop off after 2 weeks.

### Monetization
**M3:** (d) I'd pay $3-5 one-time. This has craft. It respects my time. That's worth a few bucks.

**M4:** (a) New daily puzzles and (e) Story campaigns. Content is king.

**M5:** (c) Would ruin the experience. The interrogation atmosphere is everything — an ad between puzzles would shatter it.

### Distribution
**M6:** (a) Phone (iOS/Android app). This is a waiting room game, a commute game. It needs to be on my phone.

**M7:** (b) Only if I got FLAWLESS or a funny KOA line.

**M8:** "It's a 3-minute detective puzzle that actually makes you think. Like Wordle but you're in an interrogation room." That's what I'd say. The pitch is the time-to-depth ratio.

### Session Length
**M9:** (b) 2-5 minutes per puzzle.

**M10:** (b) Just right. Three puzzles fit perfectly in a 10-minute wait.

### Retention & Habit
**M11:** (c) Waiting / killing time, (a) Morning routine.

**M12:** (d) New story content dropped, (b) Friend shared their result.

### Competitive & Social
**M13:** (a) Yes, after I've played — like Wordle comparisons.

**M14:** (d) Only among friends, not global.

### Identity
**M15:** "A 3-minute detective puzzle where you pick alibis and an AI investigator catches your lies."

**M16:** "Daily puzzle meets comic strip" is close but undersells the deduction. It's more "daily puzzle meets interrogation scene." The comic strip part implies passive reading — this is active reasoning. The puzzle IS the interaction with KOA, not just the scenario dressing.

**M17:** Variety in hint types. These 3 puzzles each had a different hint structure (time-based, location-based, claim-type-based). If the game ships with 50 puzzles that all use location hints, the deduction becomes formulaic. The hint design IS the game — it needs to stay surprising.

**M18:** No. Honestly, nothing felt broken. The closest concern is that I went 3/3 FLAWLESS — is the game too easy for methodical players? Or did I just get lucky that my reasoning happened to be correct? Hard to tell from 3 puzzles. I'd want to see how a streak of 10-20 puzzles feels before calling it.

---

## Part 8: Run Log

### Puzzle 1: "The Power Outage"
- Cards played (T1, T2, T3): doorbell, thermostat, motion_base
- Verdicts (Truth/Lie per turn): Truth, Truth, Truth
- Final score / target: 10 / 5
- Tier: FLAWLESS
- Did you use the hint? How? Yes — split cards into pre/post-11PM groups, knew one lie was in each.
- Did the reactive hint help? How? Yes — "basement feels off" narrowed the pre-11PM lie to wifi_log (basement card).
- One sentence: The layered hint system (opening + reactive) creates genuine deduction, not guessing.

### Puzzle 2: "The Thermostat War"
- Cards played (T1, T2, T3): doorbell, light_lr, temp_lr
- Verdicts (Truth/Lie per turn): Truth, Truth, Truth
- Final score / target: 12 / 7
- Tier: FLAWLESS
- Did you use the hint? How? Yes — split into living room vs non-living room, knew one lie in each group.
- Did the reactive hint help? How? Yes — "closer to you than you think" pointed at smartwatch as the personal-device lie.
- One sentence: Higher target forced riskier card selection, and the reactive hint was essential to managing that risk.

### Puzzle 3: "The Hot Tub Incident"
- Cards played (T1, T2, T3): smart_lock, motion_hall, fitbit
- Verdicts (Truth/Lie per turn): Truth, Truth, Truth
- Final score / target: 11 / 8
- Tier: FLAWLESS
- Did you use the hint? How? Yes — "protests too much" = spa_pump (flat denial of jets), "subtler" = water_meter (fake baseline reading).
- Did the reactive hint help? How? Yes — "one device is lying about the evidence" confirmed the lies were evidence-related devices (spa_pump, water_meter), not personal or structural.
- One sentence: The shift from categorical hints to narrative-reasoning hints created real difficulty progression.

---

## Part 9: Final Thoughts

**F1:** What would make you play this every day?
A new puzzle every morning with a different scenario and a different hint type. Make it part of my coffee routine. Keep the hint design surprising — that's where the depth lives.

**F2:** What would make you STOP playing after a week?
Repetitive hint structures. If every puzzle is "one lie is in room X, the other isn't," I'll solve the formula and get bored. Also, if the scenarios stop being funny or relatable. The gaming PC dying and the cat being blamed — that's what makes me care.

**F3:** If you could change ONE thing about this game, what would it be?
Add a "replay with different hand" option. Same scenario, same lies, but different card selection order and maybe a harder target. Let me try again without the safety net of my first reactive hint.

**F4:** Any other thoughts, reactions, or feedback?
This is the first mobile game in years that made me feel like I was actually thinking. Not tapping. Not scrolling. Thinking. The deduction is real, the writing has personality, and the time commitment is perfect. I deleted three apps this month. I would not delete this one. My one concern is sustainability — can the puzzle design stay this good at scale? These three puzzles each had a distinct flavor. If the daily puzzles maintain that variety, this could be a genuine daily habit. If they converge to a formula, it'll last two weeks. The design challenge is the hint system, not the scenarios.
