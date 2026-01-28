# David's Playtest Log & Survey

## Puzzle 1: "The Power Outage" (Target: 5)

**Reading the scenario:** Okay, breaker tripped at 9:14 PM, gaming PC died mid-match -- ouch, I feel that. Someone was in the basement but I claim I was upstairs all evening. Classic setup.

**Reading the hint:** "One of the lies claims something happened after 11 PM. The other one? You're on your own." So I need to look at cards that reference events after 11 PM. Let me scan... fitbit (11:45 PM), breaker_log (11:15 PM), motion_base (11:30 PM). Three cards are after 11 PM. One of those three is a lie. The other lie is somewhere in the earlier cards -- doorbell (7 PM), wifi_log (8:30 PM), thermostat (9 PM).

**Looking at the hand:** Six cards, strengths ranging from 2 to 5. I need 5 total from 3 plays. Playing safe means picking cards I'm confident are truths. The hint tells me one lie is after 11 PM, so I should be cautious there. But it also means some after-11 cards ARE true.

**Turn 1 strategy:** I want something safe. The doorbell at 7 PM, strength 4 -- it's before 11 PM, so it COULD be the "on your own" lie, but a doorbell cam showing arrival feels like a baseline fact. It's the kind of evidence that grounds a story. I'll start safe.

**T1: doorbell (Str 4)**
> YOU: "I got home at 7. Check the doorbell cam -- nobody else came in after me. It was just me all night."
> VERDICT: TRUTH. +4. Score: 4/5.
> KOA: "Front door checks out. But something in the basement feels off -- and not just the breaker."

Interesting. KOA is pointing me toward the basement. Multiple cards reference the basement: wifi_log, breaker_log, motion_base. The hint says one lie is after 11 PM. breaker_log is 11:15 PM (after 11, basement). motion_base is 11:30 PM (after 11, basement). wifi_log is 8:30 PM (before 11, basement).

I need just 1 more point to clear. The thermostat is strength 2, bedroom, 9 PM -- feels safe, low risk. But honestly, I'm thinking about this more carefully. The breaker_log at strength 5 is tempting but it's after 11 PM AND basement -- KOA just flagged the basement. That screams lie. motion_base is also after 11 and basement but KOA said "not just the breaker" which might mean the breaker specifically is suspicious.

**T2: thermostat (Str 2)**
> YOU: "The thermostat went to night mode at 9. Nobody touched it after. I was in bed."
> VERDICT: TRUTH. +2. Score: 6/5.

I've cleared! Score is 6 with one turn left. I could go for FLAWLESS if I pick another truth. Let me think... I've already hit target. For FLAWLESS I need 0 lies played. I've played 2 truths. If I pick a truth, that's FLAWLESS.

The remaining cards: wifi_log (3, basement, 8:30 PM), fitbit (3, bedroom, 11:45 PM), breaker_log (5, basement, 11:15 PM), motion_base (4, basement, 11:30 PM).

The hint says one lie is after 11 PM. Three of these four are after 11. The breaker_log feels like the hint lie -- KOA even flagged the basement and the breaker. So I'd guess breaker_log is the after-11 lie. The other lie is "on my own" to find, and it's NOT after 11 -- so it could be wifi_log (8:30 PM). Actually, wifi_log is the only remaining card before 11 PM, and the hint said the second lie ISN'T after 11... that means wifi_log could very well be it.

So the two lies might be breaker_log and wifi_log. That leaves fitbit and motion_base as truths. I'll play fitbit -- bedroom, 11:45 PM. Even though it's after 11, if breaker_log is the after-11 lie, fitbit should be safe.

**T3: fitbit (Str 3)**
> YOU: "Check my Fitbit. Heart rate dropped to resting by 11:45. I was asleep. End of story."
> VERDICT: TRUTH. +3. Score: 9/5.

**Final Score: 9. Target: 5. Tier: FLAWLESS (reached target, 0 lies played).**

> KOA: "Every alibi checks out. Not a single lie. Your gaming PC died for nothing. Go back to bed."

**Lie Reveal:** wifi_log (Str 3, stealth lie) and breaker_log (Str 5, hint lie) were the lies.

Ha -- I called it! The wifi_log was fabricated router data and the breaker_log was the obvious after-11 lie. That felt good. Reminds me of those moments in Professor Layton where you piece together the logic and it just clicks. The hint system is clever -- it constrains the problem space without solving it for you.

---

## Puzzle 2: "The Thermostat War" (Target: 7)

**Reading the scenario:** August, $412 energy bill, thermostat cranked to 85 at 2 AM. The cat has been blamed. The cat weighs six pounds. That's funny -- good writing. KOA wants a word. Target is 7, that's higher. Pressure's on.

**Reading the hint:** "One of the lies is from a sensor in the living room. The other one isn't." Okay, so which cards are living room sensors? light_lr (living room, light sensor), motion_lr (living room, motion sensor), temp_lr (living room, temp sensor). One of those three is a lie. The other lie is NOT in the living room -- so it's among phone (bedroom), smartwatch (bedroom), doorbell (front door).

**Looking at the hand:** Target is 7 from 3 cards. I need to be more aggressive with card strength here. Strengths: phone(1), smartwatch(3), doorbell(4), light_lr(5), motion_lr(4), temp_lr(3). If I play all truths, I need at least 7. Phone at 1 is too weak to waste a turn on unless I'm sure everything else is risky.

**T1 strategy:** The doorbell at strength 4, front door, 12:30 AM. It's NOT in the living room, and it feels like a grounding card -- same archetype as Puzzle 1's doorbell. Doorbell cams feel reliable in this game's logic. Let me go with that.

**T1: doorbell (Str 4)**
> YOU: "The hallway was empty after 12:30. Doorbell cam saw nothing. Nobody walked to the living room."
> VERDICT: TRUTH. +4. Score: 4/7.
> KOA: "Nobody came in. So whoever did this was already here -- and maybe closer to you than you think."

"Closer to you" -- that's pointing at the bedroom devices. The non-living-room lie might be something personal, on my person. Phone or smartwatch. Phone is strength 1, smartwatch is strength 3. If the smartwatch is the lie, that's -3. Risky.

I need 3 more points from 2 cards. I should play a living room card I'm confident about. light_lr at strength 5 -- if it's truth, I clear immediately. The hint says one lie IS in the living room. Light sensor says "ambient light unchanged." That feels like a solid, passive measurement. But the motion sensor says "no presence detected" which directly contradicts someone walking to the thermostat at 2 AM... if someone DID go to the living room, the motion sensor would have to lie about it. That feels like the living room lie -- it "protests too much" in a way.

Wait, that was Puzzle 3's hint language. Let me stay focused. One living room lie. motion_lr claims no one was there between 1-3 AM, but someone changed the thermostat at 2 AM -- that's suspicious. I'll bet motion_lr is the living room lie.

**T2: light_lr (Str 5)**
> YOU: "The living room was dark all night. Light sensor confirms it -- no lamps, no screens, no one in there."
> VERDICT: TRUTH. +5. Score: 9/7.

Cleared! Now for Turn 3 and a shot at FLAWLESS. Remaining: phone(1), smartwatch(3), motion_lr(4), temp_lr(3). KOA hinted the non-living-room lie is "close to me." Smartwatch is on my wrist, bedroom, 2:15 AM -- right when the thermostat was changed. Sleep tracking showing "unbroken light sleep" at exactly the time of the crime? That's suspiciously convenient. Phone shows zero activity from 12:30 -- that's more passive, less defensive.

I think smartwatch is the non-living-room lie. So temp_lr should be safe. Strength 3, truth would put me at 12.

**T3: temp_lr (Str 3)**
> YOU: "The thermostat change was scheduled. It's a program -- it does that. Nobody got up to crank it to 85."
> VERDICT: TRUTH. +3. Score: 12/7.

**Final Score: 12. Target: 7. Tier: FLAWLESS (reached target, 0 lies played).**

> KOA: "Your alibis are airtight. The cat remains a suspect. The cat has no comment."

**Lie Reveal:** smartwatch (Str 3, stealth lie) and motion_lr (Str 4, hint lie) were the lies.

Two for two on FLAWLESS. The hint structure is really clicking for me now. You get one lie's "zone" from the hint, use KOA's reactive comment to triangulate the second, and play conservatively around both. This reminds me of Clue but compressed -- you're not eliminating over 45 minutes, you're doing it in 3 moves. That's elegant.

---

## Puzzle 3: "The Hot Tub Incident" (Target: 8)

**Reading the scenario:** 6 AM, deck flooded, hot tub cover off, $2,200 in damage. I was "in bed the whole time." Target is 8 -- that's the highest yet. I need serious strength from my 3 picks, and all truths.

**Reading the hint:** "One of the lies flat-out denies something happened. It protests too much. The other one? Subtler." Okay, this is different from the previous hints -- it's about the TONE of the claim, not location or time. Let me look at each card's claim:

- fitbit: "REM sleep continuously from 1-5 AM" -- states a positive, doesn't deny anything
- thermostat: "hallway temp held steady" -- states a fact, implies doors stayed closed
- water_meter: "baseline 0.2 gal/hr" -- states normal usage, denies a spike... subtle denial?
- spa_pump: "NO pump activation recorded after 10 PM" -- flat-out denial. "No activation." The deck is flooded and the pump says it never turned on? That protests too much.
- smart_lock: "ZERO unlock events" -- also a flat denial, but...
- motion_hall: "NO movement detected" -- another denial.

Hmm, multiple cards deny things. But "protests too much" -- the spa_pump is directly relevant to the hot tub flooding and it's saying "wasn't me, never turned on." That's the loudest protest. The deck is flooded and the pump claims innocence? That's the "protests too much" lie.

The "subtler" lie -- water_meter claims baseline usage all night, but the tub overflowed, which means water was running. The meter quietly says everything was normal. That's subtle -- it's not denying loudly, it's just... presenting false data.

So my guess: spa_pump (hint lie, protests too much) and water_meter (stealth lie, subtle).

**Looking at the hand:** Target 8 from 3 cards. Strengths: fitbit(2), thermostat(3), water_meter(3), spa_pump(5), smart_lock(4), motion_hall(5). If I avoid the two lies, my best truths are motion_hall(5) + smart_lock(4) + thermostat(3) = 12, or motion_hall(5) + smart_lock(4) + fitbit(2) = 11. I need at least 8.

**T1: smart_lock (Str 4)**
> YOU: "The back door didn't open once. Zero unlock events from 10 PM to 6 AM. Nobody went outside. Period."
> VERDICT: TRUTH. +4. Score: 4/8.
> KOA: "The lock is honest. Nobody used the door. But the damage happened anyway -- and one device is lying about the evidence."

Good -- lock confirmed. KOA says "one device is lying about the evidence." Evidence of what? Water damage. That points at water_meter or spa_pump -- devices that would show evidence of water/pump activity. This reinforces my theory.

**T2: motion_hall (Str 5)**
> YOU: "The hallway sensor didn't pick up anything. No one walked toward the back of the house. Not me, not anyone."
> VERDICT: TRUTH. +5. Score: 9/8.

Cleared with one turn left! I need a truth for FLAWLESS. Remaining: fitbit(2), thermostat(3), water_meter(3), spa_pump(5). I believe water_meter and spa_pump are lies. So fitbit or thermostat should be safe.

**T3: thermostat (Str 3)**
> YOU: "The hallway held at 71 all night. If someone opened the back door, you'd see a temp drop. You don't."
> VERDICT: TRUTH. +3. Score: 12/8.

**Final Score: 12. Target: 8. Tier: FLAWLESS (reached target, 0 lies played).**

> KOA: "Every alibi checks out. You told nothing but the truth. $2,200 in damages, though. KOA is billing you anyway."

**Lie Reveal:** water_meter (Str 3, stealth lie) and spa_pump (Str 5, hint lie) were the lies.

Three for three FLAWLESS. That last one felt the most earned -- the hint was about tone rather than metadata, so I had to actually READ the claims and think about what "protests too much" means. That's a step up in design sophistication. Reminds me of Ace Attorney where you have to spot the contradiction in testimony, not just check a box.

---

Alright. Three puzzles done, sitting here in the waiting room, and I actually wish there was a fourth. That hasn't happened with a mobile game in years. Let me fill out this survey.

---

# SURVEY RESPONSES

## Part 1: Quick Reactions

**QR1:** Satisfied
**QR2:** Impressed
**QR3:** Yes
**QR4:** Yes, clearly
**QR5:** P3. The hint about tone ("protests too much") required reading the actual claims, not just scanning metadata.

## Part 2: Structured Assessment (1-7)

**S1:** 6 -- I genuinely wanted to see the next scenario after each one.
**S2:** 5 -- Tension was there, especially on Turn 3 when going for FLAWLESS.
**S3:** 6 -- The scenarios are charming. The cat line got me.
**S4:** 4 -- I didn't lose, so this is hypothetical. But I can see how a loss would gnaw at me.
**S5:** 5 -- For a waiting room game, yes. It held my attention fully.
**S6:** 6 -- Rules were clear. Truth adds, lie subtracts, 3 turns from 6 cards.
**S7:** 6 -- The hint structure clicked quickly: one lie is flagged, one you find yourself.
**S8:** 7 -- Totally intuitive. No confusion.
**S9:** 5 -- Didn't lose, but the feedback made it clear why a lie would hurt.
**S10:** 6 -- The reactive hint after T1 was consistently useful.
**S11:** 6 -- The opening hint immediately let me partition cards into risk categories.
**S12:** 6 -- KOA's reactive hints helped me confirm or adjust my read on the second lie.
**S13:** 7 -- Absolutely solving a puzzle. The deduction is real.
**S14:** 6 -- Clear distinction between "safe play" and "gambling."
**S15:** 6 -- Location and time were critical for matching against hint constraints.
**S16:** 7 -- By P3 I had a system: read hint, partition cards, play safe T1, use reactive hint, close out.
**S17:** 7 -- Very fair. The hint made it approachable.
**S18:** 5 -- Slightly harder. The hint was more abstract (tone vs. metadata).
**S19:** 6 -- Good ramp. P1 teaches, P2 reinforces, P3 challenges.
**S20:** 6 -- The information is there if you read carefully.
**S21:** 2 -- No, the game felt fair throughout.
**S22:** 5 -- KOA has personality. The quips land.
**S23:** 6 -- "The cat has no comment" is great.
**S24:** 5 -- It's more one-directional, but the lines are good.
**S25:** 5 -- KOA's reactive hints directly influenced my T2/T3 choices.
**S26:** 6 -- Every word from KOA carries deductive weight.
**S27:** 4 -- Less adversarial, more collaborative puzzle-solving feel.
**S28:** 5 -- The narrations add flavor and help you evaluate claims.
**S29:** 5 -- There's a performative quality to it. You're presenting evidence.
**S30:** 5 -- Lite interrogation. More puzzle than courtroom drama.
**S31:** 5 -- The scenarios are relatable enough to care.
**S32:** 6 -- Yes, the narrations contain deductive clues.
**S33:** 7 -- FLAWLESS felt earned every time. The logic was sound.
**S34:** 7 -- Once I got FLAWLESS on P1, I was chasing it every time.
**S35:** 6 -- The tier system is a good motivator.
**S36:** 6 -- Confirming my lie guesses was satisfying.
**S37:** 6 -- I wanted to know if my reasoning was right, not just my score.
**S38:** 8

## Part 3: Comparisons

**C1:** Clue meets Ace Attorney. The deduction from Clue, the "spot the contradiction" from Ace Attorney.
**C2:** Speed. This distills the deduction loop into 3 minutes instead of 30-60. No downtime.
**C3:** Depth of interaction. Ace Attorney lets you press witnesses, cross-examine. Here you're selecting from a fixed hand.
**C4:** "This game is basically Clue but with a detective AI narrator and only three moves."

## Part 4: Emotional Journey

**E1:** Intrigued -- good setup
**E2:** Focused -- immediately parsing
**E3:** Analytical -- sorting by risk
**E4:** Confident -- safe pick
**E5:** Immersed -- adds texture
**E6:** Relieved
**E7:** Sharpened -- refining theory
**E8:** Calculated
**E9:** Deliberate
**E10:** Satisfied
**E11:** Validated
**E12:** Would share a FLAWLESS

## Part 5: Key Moments

**K1:** Puzzle 3 -- realizing "protests too much" meant the spa pump denying activation while the deck was literally flooded. The hint was about reading the claim's tone, not just metadata. That was the "aha."
**K2:** Puzzle 1 -- KOA's reactive hint ("something in the basement feels off -- and not just the breaker") made me more confident breaker_log was the after-11 lie and steered me away from it.
**K3:** Getting FLAWLESS on P3 after correctly identifying both lies through tone analysis.
**K4:** Nothing was truly frustrating. The closest was P3's higher target making me do math on whether my remaining safe cards could even reach 8.
**K5:** Not really. The hint always gave me enough to start partitioning. Turn 1 is the "least informed" but playing safe mitigates that.
**K6:** "The cat remains a suspect. The cat has no comment."
**K7:** No. The design felt honest throughout.
**K8:** Nothing was confusing, but I could see how the "stealth lie" concept might frustrate less analytical players who don't process the hint carefully.

## Part 6: Strategy & Learning

**L1:** Turn 1 was always "play the safest card I can identify." In P1 and P2 that was the doorbell (grounding evidence, not flagged by hint). In P3 I went with the smart lock. My T1 strategy didn't change -- safe first, always.
**L2:** I used the opening hint to immediately split cards into "possibly flagged lie" and "probably safe" buckets. Then I picked T1 from the safe bucket.
**L3:** Yes. In every puzzle, the reactive hint either confirmed my suspicion about the hint lie or pointed me toward the stealth lie. P1: KOA flagged the basement/breaker, confirming breaker_log as the hint lie. P2: "closer to you" pointed at personal devices (smartwatch).
**L4:** Yes -- the lies tend to be the cards that directly contradict the scenario's core event. The pump says it never ran (but the deck flooded). The motion sensor says no one was there (but the thermostat was changed). The lies "cover up" the crime.
**L5:** I'd be more aggressive with high-strength truth cards to maximize score margins. Though FLAWLESS already means I played optimally.
**L6:** There's a correct strategic framework (partition by hint, play safe T1, use reactive hint for T2-T3), but each puzzle requires reading the specific claims. It's framework + reading comprehension.

## Part 7: Product & Market Fit

**M1:** Daily puzzle
**M2:** Month+ -- if the scenarios stay fresh and the hint styles vary
**M3:** $1-2 upfront, or free with optional $1-2/mo for extra puzzles
**M4:** Daily puzzles and new hint types/mechanics
**M5:** Tolerable -- but they'd better be between puzzles, not mid-puzzle
**M6:** Phone app
**M7:** Only FLAWLESS or funny KOA lines
**M8:** If I got a FLAWLESS and the KOA closing line was funny enough to screenshot
**M9:** 2-5 min per puzzle
**M10:** Just right
**M11:** Waiting rooms, commutes, lunch break
**M12:** Streak and new story
**M13:** Yes, after I finish -- I'd want to compare reasoning
**M14:** Friends only
**M15:** "It's a 3-minute deduction game where an AI interrogates your alibi and you have to figure out which evidence is fake."
**M16:** Partially accurate. The "comic strip" part undersells the deduction. It's more "daily puzzle meets interrogation scene."
**M17:** Variety in hint types. If hints always follow the same structure (one flagged, one hidden), the meta-strategy becomes rote. Introduce hints that work differently -- partial information, misdirection, conditional clues.
**M18:** Nothing broken. The game is clean and well-designed. My only note: the stealth lie felt somewhat identifiable through scenario logic alone (the claim that contradicts the crime). If that pattern holds, experienced players will always spot both lies. You need stealth lies that are plausible contradictions, not just obvious cover-ups.

## Part 8: Run Log

### Puzzle 1: The Power Outage
- **Cards played:** T1: doorbell, T2: thermostat, T3: fitbit
- **Verdicts:** Truth (+4), Truth (+2), Truth (+3)
- **Final score/target:** 9/5
- **Tier:** FLAWLESS
- **Did you use the hint? How?** Yes. Identified 3 after-11 PM cards (fitbit, breaker_log, motion_base), knew one was a lie. Avoided breaker_log (most suspicious).
- **Did the reactive hint help? How?** Yes. KOA flagged the basement and breaker specifically, confirming breaker_log as the hint lie.
- **One sentence:** The hint partitions the problem; the reactive hint narrows it further. Play safe T1, then exploit information.

### Puzzle 2: The Thermostat War
- **Cards played:** T1: doorbell, T2: light_lr, T3: temp_lr
- **Verdicts:** Truth (+4), Truth (+5), Truth (+3)
- **Final score/target:** 12/7
- **Tier:** FLAWLESS
- **Did you use the hint? How?** Yes. Identified 3 living room sensors, knew one was a lie. Suspected motion_lr (its claim directly contradicts the crime).
- **Did the reactive hint help? How?** Yes. "Closer to you" confirmed the non-LR lie was a personal device (smartwatch).
- **One sentence:** The stealth lie follows a pattern -- it's the device whose truthful reading would disprove the crime.

### Puzzle 3: The Hot Tub Incident
- **Cards played:** T1: smart_lock, T2: motion_hall, T3: thermostat
- **Verdicts:** Truth (+4), Truth (+5), Truth (+3)
- **Final score/target:** 12/8
- **Tier:** FLAWLESS
- **Did you use the hint? How?** Yes. "Protests too much" = spa_pump flatly denying activation while the deck is flooded. "Subtler" = water_meter quietly showing baseline when water clearly ran.
- **Did the reactive hint help? How?** Yes. KOA confirmed "one device is lying about the evidence," reinforcing that utility/water devices were suspect.
- **One sentence:** Tone-based hints are more engaging than metadata-based ones -- they require reading the claims, not just scanning attributes.

## Part 9: Final Thoughts

**F1:** Fresh scenarios with varied hint mechanics. The core loop is strong -- the variable is whether hints stay interesting or become formulaic.
**F2:** If I can predict the lie structure without reading the hint. If the meta-game becomes "just avoid the card that contradicts the crime," the puzzle collapses.
**F3:** Add a "press" mechanic -- let me spend my Turn 1 to interrogate a card instead of playing it, getting a truthful yes/no about one attribute. Sacrifice a turn for information. That adds a strategic layer.
**F4:** This is the best mobile puzzle design I've seen in years. It respects the player's intelligence and time simultaneously. The 3-turn structure is perfectly scoped for a waiting room. The writing has personality without being try-hard. If you can keep the hint design varied and the stealth lies less pattern-dependent, this has real staying power. I'd play this daily. And I don't say that about phone games anymore.
