# HOME SMART HOME — First Playthrough

## Rio's Session: "The Thermostat War"

---

*Sits down at desk. Cracks knuckles. Opens the game.*

Alright. New puzzle game. Let's see what we're working with.

*Reads scenario.*

August, $412 energy bill, thermostat cranked to 85 at 2 AM, cat blamed, cat has no thumbs. I'm the suspect. Cool premise. Let's get into the mechanics.

*Reads rules carefully.*

Six alibi cards, two are lies. Pick three across three turns. Truth gives +strength, lie gives -(strength - 1). Target is 7. After T1 I get a reactive hint. This is a constraint satisfaction problem with imperfect information. I like it already.

*Reads KOA's opening hint.*

"One of the lies is trying too hard to explain why nothing happened. The other one isn't."

OK. So this partitions the two lies into two behavioral classes. One lie is an "over-explainer" — it's covering something up with too much detail. The other is more subtle, more casual. That's useful. Let me apply it.

*Studies the six cards systematically.*

Let me lay out the decision space:

| ID | Str | Lie penalty | Location | What it claims |
|----|-----|------------|----------|----------------|
| phone | 1 | 0 | BEDROOM | Zero screen time after 12:30 |
| smartwatch | 4 | -3 | BEDROOM | Unbroken light sleep at 2:15 |
| hallway_cam | 4 | -3 | HALLWAY | No one walked toward living room after 12:30 |
| light_lr | 5 | -4 | LIVING_ROOM | Room stayed completely dark all night |
| motion_lr | 3 | -2 | LIVING_ROOM | No motion events during overnight hours |
| temp_lr | 3 | -2 | LIVING_ROOM | No manual override — scheduled program only |

Target is 7. Maximum possible score is 5+4+4 = 13 if I pick the three highest-strength truths. Minimum to clear is 7. FLAWLESS requires 7+ with zero lies.

Now. The hint says one lie is "trying too hard to explain why nothing happened." Let me rank cards by how hard they're "trying":

- **temp_lr**: "No manual override detected — the system ran its scheduled program." This is literally explaining away the specific suspicious event (thermostat going to 85). It's directly addressing the accusation with a specific alternative explanation. This screams "trying too hard."
- **motion_lr**: "No motion events logged during overnight hours." This is also very "nothing happened here, move along." But it's more generic — just asserting absence.
- **light_lr**: "Zero light events — the room stayed completely dark." Similar to motion. Asserting absence.
- **smartwatch**: "Unbroken light sleep at 2:15 AM." This is claiming I was asleep. It's providing a personal alibi, not explaining a device reading.
- **hallway_cam**: "No one walked toward the living room after 12:30." Factual assertion about the path.
- **phone**: "Zero screen time from 12:30 AM onward." Minimal claim. Strength 1.

So the "trying too hard" lie is most likely **temp_lr** — it's the only card that provides a specific alternative explanation for the suspicious event. Everyone else is just saying "nothing happened" or "I was asleep." Temp is saying "yes, the thermostat changed, but it was the scheduled program." That's the cover story.

The other lie "isn't trying too hard." So it's more casual, blending in. Could be any of the simpler claims. The smartwatch is interesting — "unbroken light sleep" is a clean, confident claim. Not over-explaining. But it's giving me a personal alibi for 2:15 AM, which is suspiciously close to the time of the incident. The phone is str 1 and barely claims anything — low value as a lie from a design perspective. Hallway_cam is a strong factual claim but not over-explaining.

Let me think about this from a puzzle design angle. Two lies, two truths I need to play, target 7. The designer wants this to be solvable but not trivially. If both lies were obvious, there's no puzzle. If both were invisible, there's no deduction. The hint partitions them — one is detectable by tone, the other requires the reactive hint or more analysis.

**My working hypothesis: temp_lr (hint lie, over-explains) and smartwatch (stealth lie, casual).**

Why smartwatch? Because (a) the hint says the other lie "isn't" trying too hard, and smartwatch is a clean, confident claim that doesn't over-explain; (b) smartwatch is at 2:15 AM — the exact window of the thermostat event — but presents itself as unassailable sleep data; (c) from a puzzle design perspective, having one lie in each location cluster (BEDROOM + LIVING_ROOM) creates a better decision space.

But I'm not certain. Let me think about EV.

**Turn 1 Strategy — Information vs. Points:**

T1 is special because it triggers the reactive hint. I want to maximize information gain. But I also need to accumulate points.

Let me consider each card's T1 EV:

If I play a card I think is a truth, I get points AND I potentially get a reactive hint. The question is: which truth gives me the most useful reactive hint?

I don't know the reactive hints yet — they depend on the game's design. But intuitively, playing a card that's in the "interesting zone" should elicit a more informative response from KOA than playing something safe and boring.

**Option A: Play light_lr (str 5) on T1.** If truth (which I believe), I get 5 points — only 2 away from target with 2 turns left. Massive headroom. Any truth on T2 clears. But is this the most informative T1? Light sensor is a strong, simple claim. KOA might just confirm and move on.

**Option B: Play hallway_cam (str 4) on T1.** The briefing says "play a card KOA is watching — she'll tell you more." The hallway cam covers the only path to the living room. That's a structurally important claim. If KOA is "watching" anything, it's the movement path. This might get me a juicier reactive hint.

**Option C: Play smartwatch (str 4) on T1 as a probe.** If I suspect it's a lie, playing it on T1 costs me 3 points but I get a confirmed lie + reactive hint. That collapses the search space: I know one lie, the hint might tell me the other. But -3 on T1 means I need 10 points from T2+T3 to hit 7... max from two cards is 5+4=9. So T1 lie means 9-3=6. I can't reach 7. Wait: -3 + best remaining = -3 + 5 + 4 = 6. That's CLOSE, not CLEARED.

Actually wait. Lie penalty is -(strength-1). Smartwatch str 4, lie penalty is -(4-1) = -3. So if smartwatch is a lie on T1: -3. Then T2+T3 max is light_lr(5) + hallway_cam(4) = 9. Total: -3 + 9 = 6. That's 1 short of 7. CLOSE tier. Not good enough.

What if I probe with phone (str 1)? Lie penalty is 0. If phone is a lie (I don't think it is), I lose 0 points. If truth, I gain 1. Either way, low stakes. But phone has the lowest information value — the narration says "my phone was dead, I wasn't scrolling." Very simple claim. KOA might not give an interesting reactive hint.

Hmm. The game tips say: "Play a card KOA is watching — she'll tell you more." This suggests some cards are more "watched" than others. What is KOA watching? The thermostat event happened in the living room at 2 AM. KOA is probably watching living room cards and cards near that timeframe.

**Decision: I'll play hallway_cam on T1.**

Here's my reasoning:
1. I believe hallway_cam is a truth (it doesn't match either lie profile — it's not over-explaining, and it's not a personal device lie).
2. Str 4 gives me solid points.
3. The hallway cam covers the only path to the living room — this is a structurally critical claim. KOA should have something interesting to say about it.
4. If truth: 4 points, good reactive hint, then I play light_lr (5) on T2 for 9 total, already cleared.

Let's go.

---

### TURN 1

**Play: hallway_cam (str 4)**

"The hallway camera covers the only path to the living room. Nobody walked past it. Check the footage — I was in bed."

*Commits. Waits.*

**VERDICT: TRUTH**

**Score: 4/7**

**KOA:** "The hallway was empty. Noted. So whoever changed the thermostat didn't walk past the camera. Or did they."

Interesting. "Or did they." KOA is casting doubt — not on the camera's honesty (it's confirmed truth), but on the implication. The hallway was empty, BUT someone still changed the thermostat. So either there's another path to the living room, or... hmm. Actually, from a puzzle perspective, this reactive hint is more flavor than actionable. It doesn't directly identify a lie or narrow the field.

The tips said KOA tells you more if you play a card she's watching. This hint is atmospheric but not as surgical as I'd hoped. Maybe the living room cards or personal device cards would have yielded sharper hints.

OK. I have 4 points, need 3 more. Remaining cards: phone(1), smartwatch(4), light_lr(5), motion_lr(3), temp_lr(3).

My hypothesis is still: temp_lr and smartwatch are lies.

If I play light_lr (str 5) on T2 and it's truth, I'm at 9. Then T3 is just gravy — I could play phone(1) to be totally safe and get FLAWLESS at 10.

But if light_lr is a lie (I don't think so), penalty is -4, score goes to 0. That's catastrophic. Let me check: does light_lr match either lie profile?

"Zero light events — the room stayed completely dark." This is a blunt assertion of absence. It's not "trying too hard to explain" — it's just saying "nothing." And the other lie "isn't trying too hard" — but light_lr isn't trying too hard either, it's just flat. My hypothesis has the lies as temp_lr and smartwatch, and I'm fairly confident light_lr is clean.

The scenario says someone cranked the thermostat at 2 AM. Light_lr says the room was dark. Someone could absolutely change a thermostat in the dark — thermostats often have their own backlight. So light_lr being true is consistent with the crime having happened. That's a good sign — truths should be consistent with the scenario.

Motion_lr says "no motion events." If someone WAS in the living room at 2 AM, the motion sensor should have detected them. So motion_lr being a lie makes sense — someone WAS there, and the sensor's claim of no motion is the cover-up. This reinforces my model.

### TURN 2

**Play: light_lr (str 5)**

"The light sensor says the living room was pitch black all night. No lamps, no phone screens, nothing. Nobody was in there."

*Commits.*

**VERDICT: TRUTH**

**Score: 9/7**

KOA says: "The light sensor is honest. But not every sensor in this house is — and I'm not just talking about the living room."

NOW we're talking. This is a high-information verdict quip. Let me parse it:

1. "Not every sensor in this house is honest" — there's at least one lying sensor.
2. "Not just talking about the living room" — there's a lying sensor OUTSIDE the living room.

Sensors in the game: smartwatch (BEDROOM), motion_lr (LIVING_ROOM), temp_lr (LIVING_ROOM), light_lr (just cleared). Phone and hallway_cam are device/camera, arguably not "sensors" in the same way — though this is debatable.

Wait, the source types: PHONE, SMARTWATCH, SECURITY_CAM, LIGHT_SENSOR, MOTION_SENSOR, TEMP_SENSOR. The "sensors" are light_lr, motion_lr, temp_lr, and arguably smartwatch. Phone and hallway_cam have different source types.

KOA says a sensor outside the living room is dishonest. The only sensor-type device outside the living room is **smartwatch** (BEDROOM, source: SMARTWATCH). This confirms my hypothesis. Smartwatch is a lie.

And "not every sensor in this house is honest" implies at least one sensor in the living room is also lying. Light_lr is cleared. So it's motion_lr or temp_lr (or both). But there are exactly 2 lies total, one is smartwatch, so exactly one of {motion_lr, temp_lr} is the other lie.

Going back to the opening hint: "one lie is trying too hard to explain why nothing happened." Between motion_lr ("no motion events") and temp_lr ("no manual override — scheduled program"), temp_lr is the over-explainer. So the "trying too hard" lie is temp_lr, and the stealth lie is smartwatch.

Wait, but that means motion_lr is truth. Let me sanity-check: motion sensor says no motion in the living room overnight. But we know someone changed the thermostat at 2 AM. If the motion sensor is telling the truth, no one was physically present. But the thermostat WAS changed... unless it was done remotely (phone app?). The phone card says zero screen time — if phone is truth, the phone wasn't used. So if motion_lr is truth, how was the thermostat changed? Unless... the cat?

Actually, the scenario says the cat was blamed and has no opposable thumbs. So the cat defense doesn't work. Unless the thermostat change really was the scheduled program — but I tagged temp_lr as a lie. Hmm.

Wait. If temp_lr is a lie, then the thermostat WAS manually overridden (the lie is claiming it wasn't). If motion_lr is truth, no one was physically in the room. That's contradictory — you'd need someone in the room for a manual override.

Unless "manual override" can be done remotely. Like from a phone app. But phone says zero screen time (truth). From a smartwatch app? Smartwatch is a lie — so maybe I WAS awake at 2:15, and I used the smartwatch or some other method to change the thermostat remotely without being in the living room.

Actually, this is overthinking the narrative. The puzzle is a constraint game, not a physics simulation. Let me focus on the scoring.

I'm at 9/7. Already CLEARED. For FLAWLESS I need zero lies. Remaining cards: phone(1), smartwatch(4), motion_lr(3), temp_lr(3).

I'm confident smartwatch is a lie. I believe temp_lr is the other lie (over-explainer). That means phone and motion_lr are truths.

Playing phone (str 1) is the absolute safest play: I'm 99% sure it's truth, and even if it's a lie, penalty is 0 (str 1 - 1 = 0), so my score stays at 9. Literally zero risk.

Playing motion_lr (str 3) is my other "truth" candidate. If correct, score goes to 12. If wrong (it's actually the lie, not temp_lr), penalty is -2, score goes to 7. Still CLEARED.

So motion_lr has higher upside (12 vs 10) and the downside (7) still clears. The EV of motion_lr assuming 80% truth = 0.8(3) + 0.2(-2) = 2.4 - 0.4 = 2.0. EV of phone assuming 95% truth = 0.95(1) + 0.05(0) = 0.95.

But wait — I already have 9. Both options clear. The question is FLAWLESS vs not. If motion_lr is truth: FLAWLESS at 12. If lie: CLEARED at 7 (one lie played). Phone: almost certainly FLAWLESS at 10.

How confident am I that temp_lr (not motion_lr) is the over-explaining lie? "No manual override — the system ran its scheduled program" vs "no motion events logged." Temp_lr provides a specific alternative explanation. Motion_lr just says nothing happened. Temp_lr is "trying too hard." My confidence is maybe 75% that temp_lr is the lie (making motion_lr truth).

For FLAWLESS:
- Phone route: ~95% chance of FLAWLESS
- Motion_lr route: ~75% chance of FLAWLESS, 25% chance of CLEARED

I'm a speedrunner. I optimize. But I also value certainty over marginal gains. FLAWLESS is the goal, and phone guarantees it with near-certainty. The extra 2 points from motion_lr don't change the tier.

### TURN 3

**Play: phone (str 1)**

"My phone was dead to the world after 12:30. Zero screen time. I wasn't up scrolling — I was sleeping."

*Commits.*

**VERDICT: TRUTH**

**Score: 10/7**

KOA says: "Phone was off. Noted. KOA has other things to think about tonight."

Clean. Expected. Moving on.

---

## FINAL RESULT

**Score: 10/7**
**Lies played: 0**
**Tier: FLAWLESS**

KOA's closing line: **"Your alibis are airtight. The cat remains a suspect. The cat has no comment."**

---

## Post-Puzzle Reaction

Good puzzle. The opening hint partitioned the lie space into two behavioral classes, and the T2 verdict quip from light_lr was the key that cracked it — "not every sensor is honest, not just the living room" essentially confirmed smartwatch as a lie and narrowed the living room lie to motion_lr or temp_lr. My T1 play of hallway_cam was solid for points but yielded a low-information reactive hint. In hindsight, playing a living room sensor on T1 would have given me sharper information earlier. The real decision in this puzzle was concentrated at T1 (which card to probe) — by T2 the deduction was nearly complete, and T3 was a formality.

---

# V3 PLAYTEST SURVEY

## Part 1: Quick Reactions

**QR1:** Satisfied. Clean solve, optimal line identified by T2.

**QR2:** Yes — I want to see if other puzzles have the same deductive structure or if this was unusually clean.

**QR3:** Partially. The opening hint ("one tries too hard, the other doesn't") gave me a useful partition but wasn't precise enough to act on alone. The real info came from the T2 verdict quip.

---

## Part 2: Structured Assessment

### Engagement
**S1:** 5 — The deductive structure is interesting and I want to see if it holds across puzzles. One session isn't enough to know if there's real depth.
**S2:** 4 — T1 had genuine tension because I was choosing between information-gathering and point-scoring. T2 and T3 were increasingly determined.
**S3:** 5 — The thermostat scenario was well-constructed. The alibis were logically interconnected, which made the deduction feel grounded.
**S4:** 4 — I mentally replayed the counterfactual: what if I'd played a living room sensor on T1 and gotten a more targeted reactive hint?
**S5:** 2 — It was a few minutes. Engaging but not time-distorting.

### Clarity
**S6:** 6 — Rules are clean. Scoring is transparent. Card layout is clear. I understood everything on first read.
**S7:** 5 — "One tries too hard, the other doesn't" is a well-structured hint. It partitions the lie space. Slightly ambiguous in application (multiple cards could be "trying too hard") but that's the puzzle.
**S8:** 7 — Crystal clear. Truth = +str, lie = -(str-1). I can calculate exact EVs immediately.
**S9:** 7 — 10/7, zero lies, FLAWLESS. The math is unambiguous.
**S10:** 5 — The light_lr verdict quip was very informative. The hallway_cam reactive hint was more atmospheric. The value of the T1 hint seems to depend heavily on which card you play.

### Deduction
**S11:** 5 — The opening hint let me identify temp_lr as the "trying too hard" lie with moderate confidence, and I suspected smartwatch as the stealth lie. Not certain, but I had a working model.
**S12:** 5 — The light_lr verdict quip ("not every sensor... not just the living room") confirmed smartwatch as a lie. But this was the T2 quip, not the T1 reactive hint. My T1 choice (hallway_cam) gave me a less useful hint.
**S13:** 6 — Real deduction. The opening hint gave a behavioral partition, the verdict quips gave location constraints, and I could triangulate. This isn't brute force.
**S14:** 5 — By T2 I was confident in the lie identities. T1 was more probabilistic.
**S15:** 6 — Location was critical. The "not just the living room" hint only works because cards are location-tagged. Source type (SENSOR vs CAM vs PHONE) was also key for interpreting "not every sensor."

### Difficulty
**S16:** 6 — The puzzle was solvable through deduction with a margin for error. The 3-of-6 selection means you can avoid both lies, and the hints give enough signal.
**S17:** 5 — I earned it through correct deduction, but the margin was generous. Playing phone on T3 was zero-risk.
**S18:** 3 — Not truly stuck. The closest was T1 when I had to choose between information-gathering and points with incomplete data.

### KOA
**S19:** 5 — KOA has a consistent voice: dry, knowing, slightly adversarial. Works well as an interrogator.
**S20:** 5 — "The cat has no comment" is good. The hallway cam hint ("Or did they.") was evocative. Nothing made me laugh out loud, but the tone is consistently sharp.
**S21:** 5 — KOA's responses feel contextual, not generic. The light_lr quip referenced specific game state (other sensors, other rooms).
**S22:** 5 — The light_lr quip directly shaped my T3 decision. The hallway_cam reactive hint was less actionable.
**S23:** 5 — KOA's text was concise and informative. I read every word because every word might contain a clue.
**S24:** 3 — It felt more like a referee than an adversary. KOA confirms/denies and gives hints. The "adversarial" framing is surface-level — mechanically, KOA is cooperative (giving you information to help you solve it).

### Narration & Immersion
**S25:** 4 — The narrations add flavor but I was primarily focused on the mechanical claims (what data does this card assert?). The narrative framing is a nice wrapper.
**S26:** 4 — It has an evidence-presentation feel, but the core mechanic is card selection under uncertainty. The "presenting your case" framing is cosmetic.
**S27:** 4 — Light interrogation. More of a deduction game with interrogation flavor.
**S28:** 4 — I cared about the score and tier, not the narrative outcome. The scenario is fun but doesn't drive my decisions.
**S29:** 4 — I read them for potential clues, not for immersion. The narrations are functional — they help me assess which cards "try too hard."

### Achievement & Tiers
**S30:** 5 — FLAWLESS required identifying both lies and avoiding them. That feels earned, even though the final turn was trivially safe.
**S31:** 5 — Once I was at 9/7 after T2, FLAWLESS became the clear objective. It changed T3 from "maximize points" to "minimize risk."
**S32:** 5 — The tier system creates clear optimization targets. FLAWLESS vs CLEARED is a meaningful distinction.
**S33:** 5 — I want to confirm my hypothesis. Were the lies smartwatch and temp_lr? Or smartwatch and motion_lr? Knowing matters for evaluating my deduction.
**S34:** 5 — I'd immediately check whether my mental model was correct.

### Net Promoter Score
**S35:** 6 — Solid puzzle with genuine deductive structure. I'd recommend it to puzzle-game friends with the caveat that I need to see more puzzles to know if the depth is consistent. One puzzle could be a fluke.

---

## Part 3: Comparisons & Open-Ended

**C1:** The deduction mechanic reminds me of **Cryptid** (the board game) — you're testing hypotheses by making moves that reveal information, and the puzzle collapses once you identify the right constraints. The daily format is obviously Wordle-adjacent.

**C2:** The information-reveal structure is more interesting than Wordle. In Wordle, every guess gives you the same type of information (letter positions). Here, different T1 choices yield qualitatively different reactive hints, which means T1 is a genuine decision with strategic implications. That's better design.

**C3:** The skill ceiling might be low. Once you understand the hint system, every puzzle could reduce to: (1) use opening hint to form hypothesis, (2) play a safe-ish truth to get the reactive hint, (3) use the reactive hint to confirm, (4) play remaining truths. If that algorithm always works, the puzzle lacks depth. I need more puzzles to tell.

**C4:** "A daily deduction puzzle where you test alibis against a snarky AI detective. Three turns, two lies to avoid, and each move reveals more information. It's Wordle meets Cryptid with interrogation flavor."

---

## Part 4: Emotional Journey

**E1:** Engaged — parsing the rules, mapping the decision space. This has a clean structure.
**E2:** Analytical — "one tries too hard, the other doesn't" partitions the lie space. Good. Let me count which cards match.
**E3:** Calculating — mapping all six cards against the hint, estimating lie probabilities, computing EVs.
**E4:** Strategic — choosing hallway_cam for T1 because I think it balances points with information gain from the reactive hint.
**E5:** Focused — narration is flavor, I'm looking at the mechanical claim.
**E6:** Confirmed — truth, 4 points. Good. The reactive hint is... atmospheric. Less informative than I wanted.
**E7:** Mildly disappointed — "or did they" is evocative but doesn't narrow the lie space. I expected more signal from T1.
**E8:** Confident — light_lr is almost certainly truth, str 5, this should lock the game.
**E9:** Locked in — 9/7, I've cleared. The light_lr verdict quip gives me strong data: smartwatch is likely the non-living-room lie.
**E10:** Calm — phone is zero-risk. This is a formality.
**E11:** Satisfied — FLAWLESS, clean solve, deduction was correct.
**E12:** Curious — I want to know if temp_lr or motion_lr was the second lie. My model says temp_lr but I'm only ~75% confident.

---

## Part 5: Key Moments

**K1:** The light_lr T2 verdict quip: "not every sensor in this house is honest — and I'm not just talking about the living room." This was the constraint that collapsed the problem. It identified the lie category (sensor), the lie location (not just living room = bedroom), and the specific card (smartwatch is the only bedroom sensor).

**K2:** Yes. Before T2, I was ~65% on smartwatch being a lie. After the quip, I was ~95%. It didn't change my T2 play (I was already playing light_lr) but it fully determined my T3 strategy.

**K3:** The moment the light_lr quip landed and I realized the puzzle was solved. That's the satisfying "click" — when the constraints snap together.

**K4:** The T1 reactive hint was underwhelming. "The hallway was empty. Or did they." Feels like flavor text, not a deductive clue. I chose hallway_cam hoping for sharp info and got atmosphere. Slightly frustrating.

**K5:** Not really stuck. The opening hint gave me a working hypothesis from the start. The question was always confidence level, not direction.

**K6:** "The cat remains a suspect. The cat has no comment." Dry and well-timed.

**K7:** No. The puzzle felt fair throughout. The information flow was well-paced (even if my T1 choice yielded a weaker hint than it could have).

**K8:** Nothing truly confused me. The only ambiguity was whether "sensor" in KOA's quip included the smartwatch. I decided it did based on source type (SMARTWATCH), but someone might interpret "sensor" as only LIGHT_SENSOR, MOTION_SENSOR, TEMP_SENSOR.

---

## Part 6: Strategy & Learning

**L1:** Form a hypothesis from the opening hint, then play a card I'm confident is truth on T1 (preferring one that might yield an informative reactive hint). Use the reactive hint to confirm or update my model. Play high-strength truths on T2-T3.

**L2:** I used the opening hint to tag temp_lr as the "over-explainer" lie. I used source type and location to identify smartwatch as the "stealth" lie. The narrative content ("no manual override — scheduled program") was my primary signal for the over-explainer classification.

**L3:** The T2 verdict quip from light_lr was more useful than the T1 reactive hint from hallway_cam. This suggests card choice for T1 matters not just for points but for the quality of information you receive. Next time, I'd choose T1 more deliberately to optimize reactive hint quality.

**L4:** I'd consider playing a card I'm LESS certain about on T1 — even a suspected lie — to get the reactive hint to either confirm or refute my model. Phone (str 1, lie penalty 0) is a candidate for a zero-cost T1 probe. Or I'd pick a living room card to see if KOA gives more specific living-room-related info.

**L5:** "Use T1 for information, not just points" seems like a generalizable principle. The reactive hint is the most valuable game mechanic, and your T1 choice determines its content. Optimizing T1 for hint quality might matter more than optimizing for strength.

**L6:** Three puzzles minimum. The deduction structure seems sound but I need to see if the hint system stays solvable-but-not-trivial across different scenarios. One puzzle could be well-tuned by accident.

---

## Part 7: Product & Market Fit

**M1:** (b) One per day is right for the format. The deduction is a single puzzle, not a grindable system. Daily cadence preserves the "figure it out" tension.

**M2:** (c) $1-2 one-time, or free with tasteful ads. The game isn't deep enough (yet) to justify a subscription. But I'd pay for quality-of-life features like detailed post-game analysis showing all lie identities and optimal play.

**M3:** (b) Tolerable if non-intrusive. Never between turns. Only post-game.

**M4:** (a) Phone. This is a 3-minute puzzle. Mobile-first.

**M5:** (c) Only if the result is interesting — FLAWLESS with a good KOA line, or a spectacular failure. Middling results aren't shareable.

**M6:** (b) 2-5 minutes. About right. Maybe slightly short — I could handle a 4th turn or more complex deduction.

**M7:** (b) Just right, leaning slightly short.

**M8:** (c) Waiting / killing time, (d) Unwinding, (e) Procrastinating.

**M9:** (c) Saw it mentioned in a gaming community or review.

**M10:** "Daily deduction puzzle where you're a suspect proving your innocence to a snarky AI. Three turns, six cards, two lies — figure out which alibis are fake before you play them."

**M11:** Post-game analysis showing: which cards were lies, what the optimal play was, and what each reactive hint would have been for different T1 choices. Puzzle-game optimizers want to explore the full decision tree after solving.

**M12:** The reactive hint quality varies dramatically by T1 choice, but the player has no way to predict which cards yield better hints. This could feel unfair if someone picks a "boring" T1 and gets a useless hint. Consider making the reactive hint informative regardless of T1 choice, or telegraphing which cards KOA is "watching."

**M13:** 25-34 demographic, daily puzzle enjoyers who graduated from Wordle to something meatier.

**M14:** The AI detective personality. Nobody else has that. Deduction games exist, daily puzzles exist, but the interrogation framing with a consistent AI character is distinctive.

**M15:** Content pipeline. Can the team produce consistently clever scenarios and well-tuned puzzles at daily cadence? The writing quality and puzzle balance are load-bearing.

**M16:** Streaks and post-game analysis. Show me my solve history, my FLAWLESS rate, and the decision tree for each puzzle. Optimizers will engage deeply if you give them data to analyze.

**M17:** Yes — a weekly "hard mode" with 3 lies instead of 2 (or 4 turns but higher target) would add a difficulty tier for experienced players.

**M18:** 7/10 confident. The core loop works. The risk is content sustainability and skill ceiling. If puzzles start feeling samey or the optimal algorithm becomes rote, engagement drops.

---

## Part 8: Run Log

### Puzzle: "The Thermostat War"
- **Cards played:** T1: hallway_cam (str 4), T2: light_lr (str 5), T3: phone (str 1)
- **Verdicts:** T1: Truth, T2: Truth, T3: Truth
- **Final score / target:** 10/7
- **Tier:** FLAWLESS
- **Did you use the opening hint?** Yes. "One tries too hard" led me to tag temp_lr as a lie and influenced my avoidance of it. Also helped me profile smartwatch as the "stealth" lie.
- **Did the reactive hint help?** The T1 reactive hint (hallway_cam) was low-information — atmospheric but not actionable. The T2 verdict quip (light_lr) was the real game-changer, identifying a non-living-room sensor as dishonest.
- **Lie identification accuracy:** I correctly identified smartwatch as a lie. I suspected temp_lr as the second lie (the "over-explainer") — I'd want post-game confirmation to know if I was right. [Note: if motion_lr was actually the second lie, my behavioral analysis was wrong but my avoidance strategy still worked.]
- **One sentence:** T1 is the real decision point — it determines both your point trajectory and the quality of information you receive, and optimizing for hint quality may be more important than optimizing for strength.

---

## Part 9: Final Thoughts

**F1:** Puzzles where the T1 choice genuinely matters — where different T1 plays lead to meaningfully different information paths. If every reactive hint is equally informative, T1 reduces to "play your safest high-strength card." If some T1 choices unlock sharper hints, there's real strategic depth in the T1 decision.

**F2:** Algorithm convergence. If the optimal play pattern is always "identify the over-explainer from the opening hint, play a safe truth on T1, use the reactive hint to confirm, clean up" — then the puzzle becomes rote after a few days. The deduction needs to stay genuinely uncertain to maintain engagement.

**F3:** Show the full decision tree post-game. After I finish, reveal: which cards were lies, what every reactive hint would have been for every possible T1, what the optimal play sequence was. This turns a 3-minute puzzle into a 10-minute analysis session for players like me. That's where the depth lives.

**F4:** The core mechanic is sound: imperfect information + sequential revelation + risk/reward scoring creates genuine decisions. The KOA personality elevates what could be a dry logic puzzle into something with character. My main question is whether the design space is large enough to sustain daily puzzles without the deduction becoming formulaic. The opening hint + reactive hint system is the key innovation — it creates an information arc across three turns that feels like actual investigation. If the team can vary the hint structures (sometimes the opening hint is precise, sometimes vague; sometimes the reactive hint is a bombshell, sometimes a nudge), the puzzle stays fresh. Right now, I see potential. I need a week of puzzles to know if it's realized.
