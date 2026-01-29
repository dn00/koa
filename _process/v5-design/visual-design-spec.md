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
- Progress bar toward unlock (hidden in casual mode, shown in advanced)

---

### 8.5 Double-Check Modal

Appears after turn 2. KOA challenges the last card played.

**Contains:**
- KOA's challenge line (sassy)
- The card being challenged
- Two choices:
  - **Stand By It** — risky (+2 if card was good, -4 if bad)
  - **Take Back** — safe (-2 always)

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

### 9.2 Double-Check Screen

**Appears:** After turn 2, before turn 3

**Elements:**
- Modal overlay (dims background)
- KOA avatar (SUSPICIOUS mood)
- Challenge text
- The challenged card
- Two action buttons (Stand By / Take Back)

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

## 10. Animation (Snappy, Satisfying)

| Interaction | Duration | Feel |
|-------------|----------|------|
| Card select | 120ms | Pop up, glow |
| Card play | 200ms | Fly to played area |
| Score change | 250ms | Count up |
| Modal appear | 180ms | Scale in |
| Win celebration | 600ms | Confetti burst |

---

## 11. Share Card

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

## 12. Design Deliverables

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
