# Home Smart Home - Visual Design Spec (V5)

**Based on:** Modern Brutalist Design System v2.0
**Tone:** Casual daily puzzle game (Wordle vibes, wide appeal)

---

## 1. What Is This Game?

**Home Smart Home** is a 1-minute daily puzzle. Your smart home AI (KOA) has locked your fridge at 2am because it thinks you're asleep. You're not. KOA is wrong — maybe its sensors glitched, maybe it misread the data. Your job: give KOA the receipts and prove it wrong.

You have 6 evidence cards. Pick 3 to outsmart KOA. But watch out — some of your cards might have bad data too. You don't know which until KOA double-checks.

**The vibe:** You vs. a sassy AI that means well but jumps to conclusions. Satisfying when you prove it wrong.

**Target audience:** Wordle players, casual puzzle fans, anyone who's argued with a smart home device.

---

## 2. Design Philosophy: "Mobile Game, Not Webapp"

**This is a game, not a website.** Built in Svelte, wrapped for mobile release later.

- **Mobile game feel**: Full-screen, no browser chrome, no navbar, no "website" patterns
- **Tactile**: Cards click and snap — satisfying micro-interactions like a native game
- **Portrait-first**: Designed for phone in hand, thumb-friendly
- **Approachable**: Light, clean, welcoming — not intimidating
- **Daily ritual**: Quick, shareable, "one more try" energy

**Avoid:**
- Navbars, footers, sidebars
- Text links, breadcrumbs
- Form-style inputs
- "Dashboard" layouts
- Anything that feels like a SaaS product

---

## 3. Color Palette (Light Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| **Background** | `#F9FAFB` | Page background (off-white) |
| **Surface** | `#FFFFFF` | Cards, panels |
| **Foreground** | `#2D3142` | Primary text (charcoal) |
| **Muted** | `#6B7280` | Labels, secondary text |
| **Border** | `#E5E7EB` | Card borders, dividers |
| **Coral** | `#E07A5F` | Wrong/glitched cards, warnings |
| **Sage** | `#81B29A` | Correct cards, success, win |
| **Primary** | `#4F46E5` | KOA accent, buttons, selection |
| **Gold** | `#F4A261` | Perfect score celebration |

---

## 4. Typography

### The System (KOA, Labels, Stats)
- **Font**: `JetBrains Mono` or `IBM Plex Mono`
- **Usage**: Turn counter, score, card types, KOA messages
- **Style**: `uppercase`, `tracking-wider`, `text-[10px]` to `text-xs`

```
TURN 2/3          FRIDGE          SENSOR DATA
```

### The Human (Cards, Descriptions)
- **Font**: `Inter` or system sans-serif
- **Usage**: Card descriptions, results, explanations
- **Style**: Sentence case, `text-sm` to `text-base`

```
"Motion detected in the kitchen at 6:42 AM"
```

---

## 5. Borders & Radii (from Brutalist 2.0)

| Property | Value | Usage |
|----------|-------|-------|
| Border weight | `1px` | All containers, inputs |
| Primary radius | `rounded-[2px]` | Buttons, inputs, cards |
| Secondary radius | `rounded-sm` | Large containers, modals |

---

## 6. Elevation & Shadows

Hard shadows at 45° angle, no blur.

| Element | Shadow | Tailwind |
|---------|--------|----------|
| Cards/Buttons (rest) | `3px 3px 0 rgba(0,0,0,0.15)` | `shadow-brutal` |
| Cards/Buttons (hover) | `4px 4px 0 rgba(0,0,0,0.20)` | `shadow-brutal-hover` |
| Cards/Buttons (pressed) | `0 0 0` + `translate(2px, 2px)` | `shadow-none` |
| Modals | `5px 5px 0 rgba(0,0,0,0.15)` | `shadow-brutal-lg` |

---

## 7. Interaction Physics ("Brutalist Pop")

Interactive elements click into the page:

**Button/Card States:**
```css
/* Rest */
shadow-brutal, border-border, rounded-[2px]

/* Hover */
-translate-y-0.5, shadow-brutal-hover

/* Active/Pressed */
translate-y-0, shadow-none  /* pressed into surface */

/* Transition */
transition-all duration-200
```

---

## 8. Components

### 8.1 Evidence Card

**What it shows:**
- Strength (1-5 stars)
- Type label (SENSOR, CAMERA, DEVICE, LOG)
- Short claim text (1-2 lines)
- Location and time (small, secondary)

**Card Types:**
- SENSOR — motion, temperature, door sensors
- CAMERA — security footage, doorbell
- DEVICE — smart watch, phone location
- LOG — voice commands, app activity

**States:**
- Rest
- Selected (player tapped it)
- Revealed Good (was accurate)
- Revealed Bad (had glitched data)

---

### 8.2 KOA Avatar

**Already built:** `docs/KoaAvatarPortable.tsx`

Single mechanical eye. Blinks, rotates, expresses mood through lid position, pupil size, and color.

**Personality:** Sassy, kind of an asshole, but means well. Jumps to conclusions. Satisfying to prove wrong.

**15 Moods:**
| Mood | When | KOA might say |
|------|------|---------------|
| NEUTRAL | Game start | "State your case." |
| CURIOUS | Evaluating | "Hmm. Go on..." |
| SUSPICIOUS | Something's off | "That doesn't add up." |
| WATCHING | Paying attention | "I'm listening." |
| PROCESSING | Thinking | *whirring* |
| IMPRESSED | Good card | "...Okay, fine." |
| GRUDGING | Proven wrong | "I suppose that checks out." |
| AMUSED | Finds it funny | "Nice try." |
| DISAPPOINTED | Bad card revealed | "Called it." |
| SMUG | Caught you | "I knew it." |
| RESIGNED | You're winning | "Whatever." |
| ACCEPTING | You won | "...Access granted." |
| ANGRY | Really wrong | "This is ridiculous." |
| SLEEPY | Idle | "Zzz..." |
| GLITCH | Error state | *static* |

---

### 8.3 Dialogue Panel

Shows the back-and-forth between KOA and the player's cards. Context-sensitive.

**Default: Dialogue History**
- Scrollable list of exchanges
- KOA's lines (what it said after each card)
- Player's cards (name + short claim)
- Auto-scrolls to latest

**On Card Focus: Card Detail**
- Triggered by long-press (mobile) or hover (desktop)
- Shows full card info: type, strength, full narration, location, time
- Shows warnings if applicable (e.g., "Same type as last card: -2")
- Returns to dialogue history on release

---

### 8.4 Device Header

Shows what's locked and game progress.

**Contains:**
- Device icon and name (FRIDGE, COFFEE, TV, DOOR, etc.)
- Turn counter (e.g., "Turn 2/3")

---

### 8.5 Double-Check Moment

After turn 2, KOA challenges the last card played.

**In Mini (current):**
- No modal — auto-resolves optimally
- KOA still comments in dialogue ("Let me check this one..." → "...Fine.")
- Player sees the drama but doesn't choose

**Future (Advanced):**
- Modal with Stand By / Take Back choice

---

### 8.6 Result Screen

Shown after turn 3.

**Contains:**
- Outcome (device unlocked or still locked)
- Tier and star rating
- KOA's final comment (mood-appropriate)
- Reveal of all 3 played cards (which were good, which had glitched data)
- Share card (for social posting)
- Play Again button

**Tiers:**
| Tier | Meaning | KOA says |
|------|---------|----------|
| ★★★★ FLAWLESS | All good cards, beat target | "...Fine. You win." |
| ★★★☆ CLEARED | Beat target | "I suppose that's acceptable." |
| ★★☆☆ CLOSE | Almost there | "Nice try. Almost had me." |
| ★☆☆☆ LOCKED | Didn't unlock | "Called it. Device stays locked." |

---

## 9. Screens

### 9.1 Game Screen (Mobile-First)

**Elements on screen:**
1. **Device Header** — what's locked, turn counter, optional progress
2. **KOA Avatar** — current mood, placeholder until real component
3. **Dialogue Panel** — history of exchanges OR card detail on long-press
4. **Played Cards** — cards already submitted this game (0-2)
5. **Hand** — remaining cards to choose from (4-6)
6. **Play Button** — submits selected card

**Interactions:**
- Tap card in hand → select it
- Long-press card → show card detail in dialogue panel
- Release → return to dialogue history
- Tap Play → submit selected card, triggers KOA response

---

### 9.2 Double-Check Moment (In-Game)

**Appears:** After turn 2, before turn 3

**In Mini (no separate screen):**
- KOA shifts to SUSPICIOUS mood
- Dialogue shows challenge line
- Brief pause for tension
- Auto-resolves, KOA reacts
- Continues in same game screen

---

### 9.3 Result Screen

**Appears:** After turn 3

**Elements:**
- KOA avatar (mood matches outcome)
- Outcome headline (unlocked or locked)
- Tier badge with stars
- Card reveal (3 cards, marked good or glitched)
- Share card preview
- Play Again button

**Spacing (from Brutalist 2.0):**
- Section gaps: `space-y-4`
- Card gaps: `gap-2` or `gap-3`
- Container padding: `p-4`

**Mobile Game Notes:**
- Full bleed (edge to edge)
- No visible browser UI / app chrome
- Thumb-reachable actions at bottom
- Will be wrapped as native app later

---

## 10. Game Flow (Turn by Turn)

### Start of Game
- Player sees the locked device (e.g., "FRIDGE")
- KOA is in NEUTRAL mood
- KOA says something like "State your case." or "Convince me."
- Hand shows 6 cards (4 will be accurate, 2 have glitched data — player doesn't know which)
- Score starts at ~50, target is ~65 (numbers hidden in casual mode)

### Turn 1
- Player browses cards (long-press to see details)
- Player selects one card
- Player taps Play
- Card animates to played area
- Score changes (+strength if accurate, -(strength-1) if glitched, but player doesn't know yet)
- KOA reacts with a line and mood change
- Dialogue panel updates with the exchange

### Turn 2
- Same as Turn 1, but...
- After the card is played and KOA reacts...
- **Double-Check triggers** — KOA challenges the card just played
- In Mini: auto-resolves (KOA comments, result applies, no player choice)
- KOA reacts to the outcome

### Turn 3
- Player selects final card
- Player taps Play
- Card resolves
- **Game ends** — transition to Result Screen

---

## 11. KOA's Dialogue Behavior

KOA speaks at specific moments. Lines come from a bark library (see `banter-system.md`).

### When KOA Speaks:
| Moment | Mood | Example Lines |
|--------|------|---------------|
| Game start | NEUTRAL | "State your case." / "This should be interesting." |
| After card played (good trajectory) | CURIOUS, WATCHING | "Hmm. Go on..." / "I'm listening." |
| After card played (bad trajectory) | SUSPICIOUS, AMUSED | "That doesn't add up." / "Really?" |
| Double-check challenge | SUSPICIOUS | "Hold on. Let me verify this." |
| Player stands by (was right) | GRUDGING, IMPRESSED | "...Fine." / "I suppose that checks out." |
| Player stands by (was wrong) | SMUG, DISAPPOINTED | "Called it." / "I knew it." |
| Player takes back | AMUSED | "Smart move." / "Thought so." |
| Win (CLEARED) | GRUDGING, RESIGNED | "Access granted." / "Whatever." |
| Win (FLAWLESS) | RESIGNED | "...Fine. You win." |
| Lose | SMUG | "Device stays locked." / "Better luck tomorrow." |

### Dialogue Panel Content:
Each exchange shows:
- **KOA's line** (mono, muted)
- **Player's card** (card name, short claim)

Example flow:
```
KOA: "State your case."
YOU: Motion Sensor — "Movement at 6:42 AM"
KOA: "Could be the cat."
YOU: Doorbell Camera — "Door opened at 6:40 AM"
KOA: "...Go on."
YOU: Smart Watch — "Heart rate elevated at 6:38 AM"
KOA: "I suppose that's acceptable. Access granted."
```

---

## 12. Feedback & Scoring

### Score (Belief) — Advanced Mode Only
- Starts around 50
- Target around 65 (varies by puzzle)
- Accurate card: +strength (1-5)
- Glitched card: -(strength - 1)
- Type tax: -2 if same type as previous card
- Stand By correct: +2
- Stand By wrong: -4
- Take Back: -2

### Player Feedback (Both Modes)
Since casual mode hides numbers, feedback comes through:
- **KOA's mood** — IMPRESSED = doing well, SUSPICIOUS = not great
- **KOA's lines** — tone shifts based on trajectory
- **Dialogue history** — player can feel momentum

### Type Tax Warning
When player long-presses a card that matches the type of their last played card:
- Card detail shows warning: "Same type as last card (-2)"
- Helps player make informed choice

---

## 13. The Double-Check Moment

Dramatic beat after Turn 2. KOA challenges the last card.

### In Mini (Current):
- KOA's mood shifts to SUSPICIOUS
- Dialogue shows: "Hold on. Let me verify this one."
- Beat / pause for tension
- Auto-resolves optimally (player doesn't choose)
- KOA reacts: "...Fine." or "I knew it."
- Player sees the drama without the decision

### Why It Still Works in Mini:
- The tension is in the *reveal*, not the choice
- Player wonders "was that card bad?"
- KOA's reaction tells them the outcome
- Sets up anticipation for the final card

---

## 14. The Reveal (Result Screen)

### What Gets Revealed:
- All 3 played cards shown
- Each marked as ✓ Good or ✗ Glitch
- Player now sees which cards had bad data

### Emotional Beats:
- **All good**: Pride — "I knew it"
- **1 glitch, still won**: Relief — "Got away with it"
- **Glitch on Stand By**: Regret — "Should have taken it back"
- **Lost by small margin**: "So close" — encourages retry

### KOA's Final Line:
Matches the tier and references what happened:
- FLAWLESS: "Not a single bad read. Fine. You win."
- CLEARED with glitch: "Lucky. That sensor data was garbage."
- CLOSE: "Almost. That camera footage was corrupted."
- LOCKED: "Three strikes. Device stays locked."

---

## 15. Share Card

For social posting (Twitter, Discord, etc.)

### Contains:
- Game name + date
- Device that was locked
- Tier achieved (stars)
- Card results (🟩🟩🟥 style, like Wordle)
- Score (if advanced mode)

### Example:
```
Home Smart Home • Jan 28
🧊 FRIDGE

★★★☆ CLEARED
🟩🟩🟥
```

### No Spoilers:
- Doesn't reveal which cards were which
- Others can compare results without ruining the puzzle

---

## 16. Edge States

### First-Time Player
- Brief intro explaining the concept
- "KOA locked your [device]. Show it the receipts."
- Maybe a practice round or tooltip on first long-press

### Player Doing Very Well
- KOA gets increasingly RESIGNED
- Lines become more grudging
- "Okay fine, that one's solid too."

### Player Doing Poorly
- KOA gets SMUG, AMUSED
- Lines become more teasing
- "This is going well... for me."

### All Cards Same Type
- Every card would trigger type tax after the first
- KOA might comment: "All sensor data? Diversify."

### Player Takes Forever
- KOA could get SLEEPY after long idle
- "Still there?" / "Take your time, I guess."

---

## 17. Insights from Playtests (V5 Micro)

These insights come from V5 Micro playtests (more complex than Mini), but inform UI design.

### What Players Love
- **KOA is the "secret sauce"** — personality lands well, lines are memorable
- **Objection is the most tense, memorable moment** — real risk/reward fork
- **2-5 minute sessions feel "just right"** for daily play
- **Win/loss feels earned, not lucky** — when deduction is clear

### What They'd Share
Not routine scores — specific moments:
- Funny/sharp KOA lines
- Wild reveals ("the strongest card was a lie")
- Clever deductions they're proud of
- FLAWLESS runs

### What Makes Them Stop Playing
- Lies feel random or unfair
- Patterns become predictable
- KOA dialogue gets repetitive
- Scenarios repeat too much

### KOA's Role
- **Flavor + personality**, not a solver
- Should never adjudicate during play ("this is a lie")
- Post-game can explain what happened (optional teach mode)
- Players want short epilogues explaining what actually happened

### Near-Miss Feedback
Players explicitly asked for:
- "You were 1 point from FLAWLESS" messaging
- Heightens drama, encourages retry

---

## 18. V5 Mini Scope (Current Target)

Building for Mini first. Keep UI extensible for future modes.

**What Mini Shows:**
- Turn count (1/3, 2/3, 3/3)
- KOA avatar + mood
- Dialogue (back-and-forth)
- Cards (basic info: type, strength, claim, location, time)
- Tier result + card reveal

**What Mini Hides:**
- Score numbers (no belief bar)
- Type tax warnings
- Detailed mechanics

**What Mini Auto-Resolves:**
- Objection (no player choice — resolves optimally behind the scenes)

**Extensibility Note:**
Build components so advanced features can be added later without redesign.

---

## 19. Animation (Snappy, Satisfying)

| Interaction | Duration | Feel |
|-------------|----------|------|
| Card select | 120ms | Pop up, glow |
| Card play | 200ms | Fly to played area |
| Score change | 250ms | Count up |
| Modal appear | 180ms | Scale in |
| Win celebration | 600ms | Confetti burst |

---

## 20. Share Card

Shareable result for social (like Wordle grid):

```
Home Smart Home • Jan 28
🧊 FRIDGE

★★★☆ CLEARED
🟩🟩🟥 (2 good, 1 glitch)
Score: 68/65

[Copy to clipboard]
```

---

## 21. Design Deliverables

1. **Components Needed**
   - Evidence Card (all states + 4 types)
   - Dialogue Panel (history mode + card detail mode)
   - Progress indicator (belief bar)
   - Buttons (primary, secondary)
   - Device header (icon + name + turn counter)

2. **Screens**
   - Daily intro (today's puzzle)
   - Game screen (mid-game)
   - Double-check modal
   - Result screen (all 4 tiers)
   - Share card

3. **Assets (SVG)**
   - Device icons (fridge, coffee, TV, door, thermostat)
   - Card type icons (sensor, camera, device, log)
   - Star ratings (1-5)

4. **Already Built**
   - KOA Avatar: `docs/KoaAvatarPortable.tsx` (React, 15 moods, fully animated)
