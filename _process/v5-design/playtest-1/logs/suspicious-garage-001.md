# V5 Playtest Survey

**Persona:** Suspicious
**Puzzle:** garage-door
**Seed:** 600
**Date:** 2026-01-28

---

## Part 1: Quick Reactions (answer in under 30 seconds each)

**QR1:** In one word, how did you feel after the puzzle?
Vindicated

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
**S17:** Sometimes the type tax was worth eating for a better card. **3** (didn't encounter this situation)
**S18:** The -2 penalty felt fair, not punishing. **6**

### Objection
**S19:** The objection after Turn 2 added tension. **5**
**S20:** Choosing stand/withdraw felt like a real decision. **4**
**S21:** I had enough information to make a good stand/withdraw choice. **6**
**S22:** The +2/-4 swing for standing by felt high-stakes. **6**

### Difficulty
**S23:** The puzzle felt like a fair challenge. **6**
**S24:** The win/loss felt earned (not lucky or unfair). **7**
**S25:** The target belief was reachable but not easy. **6**

### KOA (the Home AI character)
**S26:** KOA felt like a character, not just a game system. **5**
**S27:** KOA's lines were memorable or funny. **5**
**S28:** KOA felt like a passive-aggressive smart home AI (not a judge). **6**
**S29:** KOA's responses influenced my thinking. **3**
**S30:** I paid attention to what KOA said (not just the score). **5**

### Narration & Immersion
**S31:** Playing a card felt like presenting evidence. **6**
**S32:** The scenario made me care about the outcome beyond just winning. **5**
**S33:** I read the narration each time (not just skimmed for scores). **6**

### Achievement & Tiers
**S34:** Winning felt earned, not lucky. **7**
**S35:** I wanted FLAWLESS, not just CLEARED. **6**
**S36:** The tier system motivated me to play carefully. **6**
**S37:** The lie reveal at the end was satisfying (or educational if I lost). **7**

### Net Promoter Score
**S38:** On a scale of 0-10, how likely would you recommend this game to a friend? **7**

---

## Part 3: Comparisons

**C1:** Which of these games does this remind you of most? Pick one and explain why.
**Ace Attorney** - The core mechanic of presenting evidence to counter claims, with the tension of knowing some evidence might backfire, feels like a distilled version of the courtroom sequences. The objection mechanic reinforces this.

**C2:** What does this game do BETTER than the game you picked?
Respects my time. A full Ace Attorney sequence can take 30+ minutes. This is 3 cards, 5 minutes, done. The deduction is dense rather than padded.

**C3:** What does this game do WORSE than the game you picked?
Character development and narrative stakes. Ace Attorney makes you care about the defendant and witnesses. Here, the scenario is interesting but shallow - I'm just "me" with a garage door problem.

**C4:** Complete this sentence: "This game is basically ___ but with ___."
"This game is basically **Wordle** but with **logical deduction instead of letter elimination**."

---

## Part 4: Emotional Journey

Map your emotional state at each point (one word or short phrase):

**E1:** Reading the scenario: Intrigued
**E2:** Reading the Known Facts: Focused
**E3:** Looking at your 6 cards: Analytical
**E4:** Choosing Turn 1: Cautious
**E5:** Seeing the Truth/Lie reveal: Relieved
**E6:** Hearing KOA react: Amused
**E7:** Choosing Turn 2: Confident
**E8:** The Objection prompt: Tense
**E9:** Choosing stand/withdraw: Calculating
**E10:** Seeing objection result: Satisfied
**E11:** Choosing Turn 3: Deliberate
**E12:** Seeing final outcome and tier: Triumphant
**E13:** Reading the lie reveal: Vindicated

---

## Part 5: Key Moments

**K1:** What was the single moment that made you go "oh!" or "aha!"? If none, say "none."
When I noticed that `motion_garage` claimed "no movement detected overnight" but Known Fact #3 said "motion was detected near the garage around 2 AM." Direct contradiction. That was the "aha!" - I knew exactly which card to avoid.

**K2:** Was there a moment where a Known Fact helped you identify a lie? Describe it.
Yes, two moments:
1. Known Fact #2 ("phone showed no app activity after 11 PM") vs `garage_app` (claims phone triggered garage at 2:17 AM). Clear contradiction.
2. Known Fact #3 ("motion was detected near the garage around 2 AM") vs `motion_garage` (claims "no movement detected overnight"). Another clear contradiction.

**K3:** Did the type tax ever change which card you played? When?
Yes, on Turn 2. I had just played SENSOR (sleep_tracker). I considered `car_dashcam` (also SENSOR) but chose `neighbor_testimony` (TESTIMONY) partly to avoid the -2 penalty.

**K4:** What was the most satisfying moment?
Seeing the lie reveal at the end confirm that `garage_app` and `motion_garage` were the exact two cards I had flagged as suspicious. My paranoid reasoning was correct.

**K5:** What was the most frustrating moment?
None, really. Turn 3 was slightly stressful because I had to choose between `browser_history` and `car_dashcam`, and either being a lie would cost me the win. But the logical analysis resolved it.

**K6:** Did you ever feel like you were just guessing? When?
Briefly on Turn 3 when evaluating `car_dashcam`. The "no movement in garage interior" vs "motion detected near garage" felt ambiguous - these could both be true. I wasn't 100% sure if it was safe.

**K7:** Was there a KOA line that stuck with you? Quote it if you can.
"Mrs. Patterson's word holds. For now." - The "for now" adds nice menace. KOA is accepting my evidence but not conceding.

**K8:** Did you ever feel tricked by the DESIGN (not by the lies)? When?
No. The puzzle felt fair. The lies were logically identifiable, and the truths supported the Known Facts. No "gotcha" moments where valid reasoning led to wrong answers.

---

## Part 6: Strategy & Learning

**L1:** Describe your Turn 1 strategy. Why that card first?
I chose `sleep_tracker` because:
1. Moderate strength (3) - not greedy, not suspicious
2. SENSOR type - per my persona, more trustworthy than DIGITAL
3. No contradiction with any Known Fact
4. Establishes my alibi (in bed at 2 AM) without being "too convenient"

**L2:** How did you use the Known Facts? Walk through your reasoning.
I compared each card's claim against all four Known Facts:
- KF#1 (garage opened ~2:15 AM) - baseline context
- KF#2 (no phone activity after 11 PM) - used to flag `garage_app` as lie
- KF#3 (motion detected near garage ~2 AM) - used to flag `motion_garage` as lie
- KF#4 (car never left) - context, matched `car_dashcam`

Any card that directly contradicted a Known Fact was flagged as a probable lie.

**L3:** Did type tax affect your card order? How?
Yes. After playing SENSOR on Turn 1, I deliberately avoided SENSOR on Turn 2 to preserve the full strength value of my card. I chose TESTIMONY instead.

**L4:** How did you decide stand vs withdraw at the objection?
My persona says "almost always withdraw," but the exception is "weak card you're confident about." I played `neighbor_testimony` (strength 3, weak) and reasoned it was truth. The game confirmed this. So I stood by it - guaranteed +2 was better than -2.

**L5:** If you played again, what would you do differently?
Probably nothing major. Maybe I'd take more risks on high-strength cards if the logic strongly supports them. I almost avoided `browser_history` (strength 4) out of paranoia, but the logical evidence was clear.

**L6:** Do you think there's a "correct" strategy, or is it about reading each puzzle?
Reading each puzzle. The Known Facts define which cards are safe. A blanket "avoid high strength" strategy would miss good plays. The deduction has to be puzzle-specific.

---

## Part 7: Product & Market Fit

### Format
**M1:** Which format appeals to you more?
**(c) Both** - Daily puzzle for quick hits, multi-act story for deeper engagement.

**M2:** If this were a daily puzzle, how many days would you play?
**(d) As long as puzzles stay fresh** - If the scenarios and deduction stay interesting, I'd keep playing.

### Session Length
**M3:** How long did the puzzle FEEL like it took?
**(c) 5-10 minutes** - The reasoning took time, even though only 3 cards were played.

**M4:** Was that the right length?
**(b) Just right** - Enough depth to feel meaningful, short enough for daily play.

### Identity
**M5:** How would you describe this game to a friend in one sentence?
"A daily puzzle where you're interrogated by your sarcastic smart home AI and have to present evidence to prove you didn't do something suspicious."

**M6:** The game is described as "daily puzzle meets smart home interrogation." Does that feel accurate?
Yes, quite accurate. The smart home framing is distinctive, and the puzzle structure fits the daily format.

**M7:** What's the ONE thing this game needs to be great?
More variety in deduction patterns. This puzzle had straightforward contradictions (claim X, fact says not-X). I'd love puzzles where the lies are subtler - timing inconsistencies, impossible sequences, etc.

### Pricing & Monetization

**P1:** Would you pay for this game?
**(a) Yes, one-time purchase**

**P2:** If one-time purchase, what's the max you'd pay?
**(b) $2.99 - $4.99**

**P3:** If subscription, what's the max monthly price you'd pay?
**(a) $0.99/month**

**P4:** What would make a subscription worth it? (pick all that apply)
**(a) New puzzle every day**
**(c) Weekly story campaigns**
**(f) Ad-free experience**

**P5:** How does this compare to what you pay for similar games (Wordle NYT, puzzle apps)?
Comparable to NYT Games subscription tier. Wordle is free, but the NYT crossword bundle is ~$40/year. This would fit in that ecosystem.

**P6:** Would you pay MORE for a "season pass" (e.g., $9.99 for 3 months of daily puzzles)?
**(b) Maybe, depends on content** - Would need to see sustained quality and variety.

**P7:** What would make you STOP paying for a subscription?
Repetitive puzzle structures, predictable lie patterns, or scenarios that feel like reskins of previous ones.

---

## Part 8: Run Log

### Puzzle: garage-door

- Cards played (T1, T2, T3): sleep_tracker, neighbor_testimony, browser_history
- Type tax triggered: T1->T2? No (SENSOR -> TESTIMONY). T2->T3? No (TESTIMONY -> DIGITAL)
- Objection: stood on neighbor_testimony
- Final belief / target: 62 / 57
- Tier: FLAWLESS
- Cards left unplayed: car_dashcam, garage_app, motion_garage
- Which were lies: garage_app, motion_garage

One sentence - what did you learn?
Comparing card claims directly to Known Facts reliably identifies lies; the highest-strength cards were both lies, vindicating the suspicious approach.

---

## Part 9: Final Thoughts

**F1:** What would make you play this every day?
Fresh scenarios with different deduction challenges. Not just "smart home oops" variations - different incident types, different relationship dynamics with KOA, maybe escalating stakes.

**F2:** What would make you STOP playing after a week?
If every puzzle had the same structure: "two cards contradict Known Facts, play the other four." I'd want puzzles where the deduction is harder - partial contradictions, red herrings, cards that could be true OR false.

**F3:** If you could change ONE thing, what would it be?
Add "uncertain" cards - cards where even after analysis, you genuinely don't know if they're lies. Currently, careful analysis can identify both lies with high confidence. Some ambiguity would increase tension.

**F4:** Any other thoughts?
The Suspicious persona worked well for this puzzle. By avoiding high-strength cards and trusting logical analysis, I achieved FLAWLESS. But I wonder if other puzzles might punish this strategy - sometimes you NEED to take risks. The persona's "weakness" (missing safe high-strength plays) didn't hurt me here, but it might in harder puzzles.

The KOA character is good but could be pushed further. The passive-aggressive tone is there, but the lines feel a bit generic. More personality-specific reactions would help - maybe KOA has quirks, recurring phrases, or escalating frustration.

Overall: solid core loop. The deduction feels meaningful, the stakes are clear, and the outcome is satisfying. Ready for more scenarios.
