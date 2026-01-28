# V5 Playtest Survey

**Persona:** Intuitive
**Puzzle:** garage-door
**Seed:** 800
**Date:** 2026-01-28

---

## Part 1: Quick Reactions (answer in under 30 seconds each)

**QR1:** In one word, how did you feel after the puzzle?
Satisfied

**QR2:** Would you play again tomorrow? (Yes / Maybe / No)
Yes

**QR3:** Did the puzzle feel like a complete experience? (Yes / Mostly / Not really)
Yes

---

## Part 2: Structured Assessment (1-7 scale, 1=strongly disagree, 7=strongly agree)

### Engagement
**S1:** I wanted to keep playing (or play another puzzle right away). **6**
**S2:** I felt tension when choosing which card to play. **5**
**S3:** The scenario was interesting and I wanted to know what happened. **6**
**S4:** I found myself thinking about what I'd do differently. **4**

### Clarity
**S5:** I understood the rules after reading the briefing. **7**
**S6:** The scoring (truth adds strength, lie subtracts strength-1) was intuitive. **6**
**S7:** I understood the type tax rule (repeat type = -2 next turn). **7**
**S8:** I understood the objection mechanic (stand by or withdraw). **7**
**S9:** When I saw the outcome, I understood why I got that result. **7**

### Deduction
**S10:** The Known Facts helped me identify which cards might be lies. **7**
**S11:** I felt like I was solving a puzzle, not just guessing. **7**
**S12:** I could distinguish between "I think this is safe" and "I'm gambling." **6**
**S13:** The card attributes (type, location, time) were useful for deduction. **5**
**S14:** I used the claims to reason about which cards contradict the facts. **7**

### Type Tax
**S15:** The type tax made me think about card order. **5**
**S16:** I avoided playing same-type cards back-to-back. **6**
**S17:** Sometimes the type tax was worth eating for a better card. **4** (did not encounter this situation)
**S18:** The -2 penalty felt fair, not punishing. **6**

### Objection
**S19:** The objection after Turn 2 added tension. **6**
**S20:** Choosing stand/withdraw felt like a real decision. **5**
**S21:** I had enough information to make a good stand/withdraw choice. **7**
**S22:** The +2/-4 swing for standing by felt high-stakes. **6**

### Difficulty
**S23:** The puzzle felt like a fair challenge. **6**
**S24:** The win/loss felt earned (not lucky or unfair). **7**
**S25:** The target belief was reachable but not easy. **5**

### KOA (the Home AI character)
**S26:** KOA felt like a character, not just a game system. **6**
**S27:** KOA's lines were memorable or funny. **6**
**S28:** KOA felt like a passive-aggressive smart home AI (not a judge). **6**
**S29:** KOA's responses influenced my thinking. **4**
**S30:** I paid attention to what KOA said (not just the score). **6**

### Narration & Immersion
**S31:** Playing a card felt like presenting evidence. **6**
**S32:** The scenario made me care about the outcome beyond just winning. **5**
**S33:** I read the narration each time (not just skimmed for scores). **7**

### Achievement & Tiers
**S34:** Winning felt earned, not lucky. **7**
**S35:** I wanted FLAWLESS, not just CLEARED. **6**
**S36:** The tier system motivated me to play carefully. **6**
**S37:** The lie reveal at the end was satisfying (or educational if I lost). **7**

### Net Promoter Score
**S38:** On a scale of 0-10, how likely would you recommend this game to a friend? **8**

---

## Part 3: Comparisons

**C1:** Which of these games does this remind you of most? Pick one and explain why.
Ace Attorney. The game has that same feeling of presenting evidence to prove your innocence, with a skeptical opposing force (KOA = the prosecutor). The deduction from known facts to identify contradictions feels very Ace Attorney.

**C2:** What does this game do BETTER than the game you picked?
Much shorter session length. Ace Attorney cases take hours; this is a quick 3-5 minute experience. Also, the uncertainty about which evidence is real adds a layer Ace Attorney doesn't have.

**C3:** What does this game do WORSE than the game you picked?
Less narrative depth. Ace Attorney has characters, twists, and emotional investment. This is more abstract and mechanical by comparison.

**C4:** Complete this sentence: "This game is basically ___ but with ___."
"This game is basically Ace Attorney but with Wordle-length sessions and unreliable evidence."

---

## Part 4: Emotional Journey

Map your emotional state at each point (one word or short phrase):

**E1:** Reading the scenario: Intrigued
**E2:** Reading the Known Facts: Focused
**E3:** Looking at your 6 cards: Suspicious
**E4:** Choosing Turn 1: Confident
**E5:** Seeing the Truth/Lie reveal: Relieved
**E6:** Hearing KOA react: Amused
**E7:** Choosing Turn 2: Thoughtful
**E8:** The Objection prompt: Alert
**E9:** Choosing stand/withdraw: Decisive
**E10:** Seeing objection result: Validated
**E11:** Choosing Turn 3: Cautious
**E12:** Seeing final outcome and tier: Triumphant
**E13:** Reading the lie reveal: Vindicated

---

## Part 5: Key Moments

**K1:** What was the single moment that made you go "oh!" or "aha!"? If none, say "none."
When I first looked at the cards and noticed garage_app claimed "manual override triggered from your phone at 2:17 AM" but the Known Facts said "Your phone showed no app activity after 11 PM." That was a clear contradiction and I thought "that's a trap!"

**K2:** Was there a moment where a Known Fact helped you identify a lie? Describe it.
Yes, two moments:
1. garage_app contradicted "no phone activity after 11 PM"
2. motion_garage claimed "no movement detected overnight" but the Known Fact said "Motion was detected near the garage around 2 AM"

Both felt like traps immediately. The Known Facts made identifying the lies feel solvable, not random.

**K3:** Did the type tax ever change which card you played? When?
Not significantly. I was aware of it and naturally varied my types (DIGITAL -> TESTIMONY -> SENSOR), but there was no moment where I thought "I want to play this card but won't because of type tax."

**K4:** What was the most satisfying moment?
Seeing the lie reveal at the end confirm that both cards I suspected (garage_app and motion_garage) were indeed the lies. My gut was right.

**K5:** What was the most frustrating moment?
None, really. The puzzle flowed smoothly. If anything, slight frustration at the initial state being unclear (I had to parse JSON output rather than a nicely formatted display).

**K6:** Did you ever feel like you were just guessing? When?
No. Every card I played felt reasoned. The Known Facts gave me enough information to feel confident in my choices.

**K7:** Was there a KOA line that stuck with you? Quote it if you can.
"Mrs. Patterson's word holds. For now." - This felt so passive-aggressive and in-character. Like KOA was grudgingly accepting the evidence but still suspicious.

**K8:** Did you ever feel tricked by the DESIGN (not by the lies)? When?
No. The design felt fair. The lies were identifiable through logical contradiction, not arbitrary.

---

## Part 6: Strategy & Learning

**L1:** Describe your Turn 1 strategy. Why that card first?
I chose browser_history because it directly aligned with a Known Fact (no phone activity after 11 PM). The claim "last activity was 11:30 PM, then nothing" matched the fact perfectly. It felt like safe, solid ground to start on.

**L2:** How did you use the Known Facts? Walk through your reasoning.
I compared each card's claim to the Known Facts looking for contradictions:
- garage_app claimed phone activity at 2:17 AM, but Known Fact says no phone activity after 11 PM = contradiction = likely lie
- motion_garage claimed no movement overnight, but Known Fact says motion detected around 2 AM = contradiction = likely lie
- browser_history, neighbor_testimony, car_dashcam all either aligned with or didn't contradict the Known Facts = safer bets

**L3:** Did type tax affect your card order? How?
I was aware of it and planned accordingly (DIGITAL -> TESTIMONY -> SENSOR), but it didn't force any hard choices. The natural variety in my "safe" cards meant I avoided same-type plays organically.

**L4:** How did you decide stand vs withdraw at the objection?
Pure gut feeling aligned with my earlier reasoning. neighbor_testimony had felt right when I played it - the story made sense (neighbor heard noise, saw no one = I wasn't outside). Since I felt confident, I stood by. The persona says "if it felt right, stand by" and it did.

**L5:** If you played again, what would you do differently?
Probably nothing major. Maybe I'd consider sleep_tracker more carefully - I dismissed it on vague "uneasy" feelings but it turned out to be a truth I could have played.

**L6:** Do you think there's a "correct" strategy, or is it about reading each puzzle?
Reading each puzzle. The Known Facts create a unique logical landscape per puzzle. The "strategy" is comparing claims to facts and spotting contradictions.

---

## Part 7: Product & Market Fit

### Format
**M1:** Which format appeals to you more?
(c) Both

**M2:** If this were a daily puzzle, how many days would you play?
(d) As long as puzzles stay fresh

### Session Length
**M3:** How long did the puzzle FEEL like it took?
(b) 2-5 minutes

**M4:** Was that the right length?
(b) Just right

### Identity
**M5:** How would you describe this game to a friend in one sentence?
"It's like being interrogated by your passive-aggressive smart home AI while presenting evidence that may or may not be lies."

**M6:** The game is described as "daily puzzle meets smart home interrogation." Does that feel accurate?
Yes, that's accurate. It captures the Wordle-like brevity and the unique interrogation flavor.

**M7:** What's the ONE thing this game needs to be great?
More variety in scenarios and KOA's personality. The core loop is solid; it needs volume and flavor to stay fresh.

### Pricing & Monetization

**P1:** Would you pay for this game?
(a) Yes, one-time purchase

**P2:** If one-time purchase, what's the max you'd pay?
(b) $2.99 - $4.99

**P3:** If subscription, what's the max monthly price you'd pay?
(a) $0.99/month

**P4:** What would make a subscription worth it? (pick all that apply)
(a) New puzzle every day
(c) Weekly story campaigns
(f) Ad-free experience

**P5:** How does this compare to what you pay for similar games (Wordle NYT, puzzle apps)?
Similar. NYT Games subscription is a few dollars/month for multiple puzzles. This would need to offer comparable value (daily content, polish) to justify subscription.

**P6:** Would you pay MORE for a "season pass" (e.g., $9.99 for 3 months of daily puzzles)?
(b) Maybe, depends on content

**P7:** What would make you STOP paying for a subscription?
Repetitive scenarios, stale KOA dialogue, or puzzles that feel unsolvable/random.

---

## Part 8: Run Log

### Puzzle: garage-door

- Cards played (T1, T2, T3): browser_history, neighbor_testimony, car_dashcam
- Type tax triggered: T1->T2? No (DIGITAL -> TESTIMONY). T2->T3? No (TESTIMONY -> SENSOR)
- Objection: stood on neighbor_testimony
- Final belief / target: 62 / 57
- Tier: FLAWLESS
- Cards left unplayed: sleep_tracker, garage_app, motion_garage
- Which were lies: garage_app, motion_garage

One sentence — what did you learn?
The Known Facts are the key - comparing card claims against them reveals contradictions that identify the lies.

---

## Part 9: Final Thoughts

**F1:** What would make you play this every day?
Fresh scenarios with different smart home incidents, evolving KOA personality, and maybe a meta-progression (earn trust over time, unlock new rooms/devices).

**F2:** What would make you STOP playing after a week?
Repetitive scenarios, predictable lie patterns, or KOA dialogue becoming stale.

**F3:** If you could change ONE thing, what would it be?
Better visual presentation of the game state. Parsing JSON output made the experience feel like a prototype. A clean UI showing cards, facts, and belief would help immersion.

**F4:** Any other thoughts?
The core deduction loop is satisfying. The feeling of "I think this card is lying because it contradicts fact X" and being right is genuinely rewarding. KOA's personality adds flavor. The game has legs - it just needs polish and content volume.
