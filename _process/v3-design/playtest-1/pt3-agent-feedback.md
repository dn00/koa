# Playtest 3 — Agent Feedback & Suggestions

Collected from all 5 agent surveys. Organized by theme.

---

## What Would Make Them Play Every Day (F1)

**Sarah:** Funny scenarios with KOA lines I want to share. If every puzzle has a "the cat has no comment" moment, I'm playing daily.

**Marcus:** Puzzles that feel genuinely different from each other — new scenarios, new hint structures, new deduction challenges. If each day's puzzle requires a fresh approach rather than pattern-matching from yesterday, I'll keep coming back.

**Jen:** Funny scenarios and KOA being unhinged. If every day's puzzle has writing this good, I'm in. Also if my friends are playing and we can compare results.

**David:** Consistently good writing and scenarios. If every puzzle has a premise as funny as "the cat weighs six pounds and does not have opposable thumbs" and a deduction that feels real, I'll play daily. Also, a lightweight streak system (not punitive, just a counter) would add a reason to come back.

**Aisha:** Consistently novel deduction structures. If each day's puzzle requires a different analytical approach — different hint types, different information cascades, occasionally subverted expectations — I'll keep coming back. Also, a stats page showing my FLAWLESS rate.

---

## What Would Make Them Stop (F2)

**Sarah:** Repetitive scenarios or KOA lines that feel generated/generic. If the personality dips, the game is just a math puzzle with extra steps.

**Marcus:** Repetitive hint structures. If I start recognizing "oh, this is the same type of hint as Tuesday" and can solve on autopilot, the depth evaporates.

**Jen:** If the scenarios get repetitive or the hints stay too vague to actually use. If I get BUSTED three days in a row and don't understand why, I'm deleting the app.

**David:** Repetitive puzzle structures, bland scenarios, or the deduction becoming trivially easy once you learn the hint patterns. If I can solve every puzzle on Turn 1 after a week because the hints always work the same way, it's over.

**Aisha:** Repetitive puzzle templates. If after 5 days I can pattern-match "the lie is always the card that matches the most hint keywords" or "always play the lowest-strength card T1," the game is solved and I'm done. Also, if the reactive hints are frequently useless, the T1 decision loses its strategic tension.

---

## One Thing They'd Change (F3)

**Sarah:** Make the share card INCREDIBLE. It should show your tier, KOA's best line, and the scenario name in a visually sharp format. That's the viral loop. The game is already fun — the share experience needs to match.

**Marcus:** Add a post-game breakdown showing the full hint logic — which cards the opening hint was referring to, what each reactive hint would have told you. Let me see the puzzle's complete solution space. That would make me want to replay in my head and share with friends.

**Jen:** Make the reactive hint after Turn 1 more useful regardless of which card you play. I played doorbell and got basically nothing helpful. It should feel like new information every time, not just flavor.

**David:** Make the reactive hint after Turn 1 more consistently impactful. I happened to get the vague one, and it was the weakest moment of the experience. If every Turn 1 choice leads to a reactive hint that genuinely changes your thinking for Turns 2-3, the deduction loop is complete.

**Aisha:** Make the reactive hint system more transparent. Tell the player upfront: "your Turn 1 choice determines what KOA reveals next." This turns T1 into a deliberate information-buying decision rather than a play-and-hope-for-useful-intel situation.

---

## Open Feedback (F4)

**Sarah:** This is genuinely one of the more charming puzzle games I've tried. The interrogation framing is clever, KOA's voice is consistent and funny, and the hint system creates a real arc across three turns — you go from uncertain to informed. The only risk is whether the writing can stay this good across dozens of puzzles. If it can, this has real Wordle-level daily habit potential. Also: please let me see which cards were the lies after the game ends. I want to confirm my theories! That post-game reveal is satisfying even when you win.

**Marcus:** The writing is strong. KOA's voice is the game's personality and it works — dry, slightly judgmental, occasionally funny. The scenario framing (thermostat war, cat blamed) gives each puzzle a micro-narrative that justifies the deduction without overcomplicating it. I'm impressed for a first session. Looking forward to tomorrow.

**Jen:** The writing is genuinely the star here. KOA's personality, the scenario setup, the player narrations — that's what makes this feel different from other puzzle games. Protect the writing at all costs. Also the cat line needs to be shareable as like a card or image because I WILL be posting that.

**David:** This is the best mobile puzzle game I've tried in a long time. It respects my intelligence, it's well-written, and it's the right length. The KOA character is a genuine differentiator — most puzzle games have zero personality, and this one has a voice. I'm keeping the app. My dentist appointment is next and I'm already thinking about tomorrow's puzzle. That's the sign of a good daily game.

**Aisha:** Solid first impression. The hint parsing is genuine deduction, not a word puzzle wearing a logic hat. The scoring math creates real tension between information gathering and risk management. The framing (AI home system interrogation) is a smart theme for the mechanics. I'm cautiously optimistic, but one puzzle is one data point. Ask me again after day 7.

---

## Feature Requests (compiled)

### Share & Social
- Share card with KOA's best line + tier + scenario name (Sarah, Jen)
- Visual share format for group chats / social media (Sarah, Jen)
- Compare results with friends like Wordle (Jen)

### Post-Game
- Lie reveal after every game, win or lose (Sarah)
- Full post-game breakdown: which cards the hint referred to, what every reactive hint would have said (Marcus, Aisha)
- Show the puzzle's complete solution space (Marcus)

### Progression & Retention
- Lightweight streak counter (David)
- Stats page — FLAWLESS rate, win rate (Aisha)
- Not punitive streaks like Duolingo (Jen)

### Puzzle Variety
- Different hint structures day to day (Marcus, David, Aisha)
- Different deduction mechanics — varying lie counts, card mechanics, information flows (Aisha)
- Occasionally subverted expectations (Aisha)
- New characters beyond KOA (none explicitly requested, but implied by "variety")

### Reactive Hint System
- Make vague hints more useful / always give actionable info (Jen, David)
- Tell players upfront that T1 choice affects hint quality (Aisha)
- Counter-argument: the vague/specific split IS the design — don't collapse it (implicit from Marcus's positive experience with specific hint)

### UX
- Shorter tutorial / quicker onboarding for first-timers (Sarah)
- Don't interrupt KOA's closing line with ads (Jen, David)

---

## Design Tensions Surfaced

### 1. Vague hints: Feature or bug?
- **Jen/David** want reactive hints to always be useful → collapse vague/specific distinction
- **Marcus** found the specific hint decisive and satisfying → the distinction creates value
- **Aisha** wants the system to be transparent → tell players T1 determines hint quality
- **Resolution needed:** Is the vague hint a punishment (for safe play) or a failure (of the hint system)?

### 2. Puzzle depth vs. accessibility
- **Casual agents** (Sarah, Jen) won on vibes + risk management — didn't need deep deduction
- **Analytical agents** (Marcus, Aisha) want puzzles that can't be solved on vibes alone
- **Both groups** got FLAWLESS → the puzzle isn't challenging either group enough
- **Aisha's warning:** "If the deduction structures vary meaningfully day to day, this goes up. If every puzzle is 'parse a hint, avoid the obvious trap,' it drops fast."

### 3. Information vs. entertainment
- **Sarah/Jen** value KOA's personality and narration above the puzzle mechanics
- **Marcus/Aisha** value the deduction system and hint design above the writing
- **David** appreciates both equally — "this is like Clue meets Wordle"
- **Implication:** The game needs to serve both audiences. KOA's writing is table stakes for casual retention. Puzzle depth is table stakes for analytical retention.

### 4. Probing tension (the core design gap)
- **Aisha identified the structural problem:** "I cannot afford to play a lie of strength 3 or higher and still CLEAR"
- **Marcus probed successfully** but only because temp_lr is truth — he'd have been screwed if it were a lie
- **David's learning:** "Playing a safe, non-suspicious card first gives you points but may sacrifice information; the riskier Turn 1 play might give you a better reactive hint"
- **Nobody chose risk over safety** when the stakes were clear
- **This is the central finding:** The probe-vs-protect tradeoff exists in theory but is dominated by safe play in practice because the math doesn't support probing
