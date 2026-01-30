# KOA Mini — UI Component Specification

**Purpose:** Define the platform-agnostic UI components required to implement KOA Mini. This document describes *what* components are needed and their responsibilities, not *how* to implement them in any specific framework.

**Last Updated:** 2026-01-29
**Related docs:**
- `_process/context/koa-mini-spec.md` — full KOA Mini design spec
- `_process/v5-design/visual-design-spec.md` — visual design language

---

## 1. Component Overview

KOA Mini requires approximately 18 distinct UI components organized across three main screens:

1. **Game Screen** — where players read, inspect, and pick cards
2. **Verdict Screen** — where results are revealed and explained
3. **Share Screen** — compact artifact for social sharing

Plus supporting components for tutorial, settings, and long-term progression.

---

## 2. Game Screen Components

### 2.1 ScenarioHeader

**Purpose:** Display the incident context — what KOA locked/throttled and why.

| Property | Type | Description |
|----------|------|-------------|
| text | string | 1-2 sentence scenario description |

**Behavior:**
- Static display, no interactions
- Should be visually distinct from facts (e.g., different background or typography)

**Example content:**
> "The printer ran at 3 AM, so I paused print jobs until I'm sure this wasn't you sleepwalking."

---

### 2.2 KnownFactsList

**Purpose:** Display the 3-5 guaranteed-true facts that anchor the puzzle.

| Property | Type | Description |
|----------|------|-------------|
| facts | string[] | Array of fact statements (3-5 items) |

**Behavior:**
- Static list display
- Each fact should be clearly numbered or bulleted
- Facts are reference material — player consults these when evaluating cards

**Example content:**
- You told KOA you were in bed by 11pm
- Your phone was on the charger in the bedroom from 10:30pm onward
- The kitchen motion sensor logged no activity until 2:47am

---

### 2.3 EvidenceCard

**Purpose:** Display a single piece of evidence the player can select.

| Property | Type | Description |
|----------|------|-------------|
| id | string | Unique card identifier |
| label | string | Short display name |
| evidenceType | enum | DIGITAL, SENSOR, TESTIMONY, PHYSICAL |
| location | string | Where the evidence comes from |
| time | string | When the evidence was recorded |
| claim | string | What the card asserts |
| state | enum | default, selected, played, disabled |

**Mini vs Expert mode:**

| Field | Mini | Expert |
|-------|------|--------|
| Label | ✓ | ✓ |
| Type | ✓ | ✓ |
| Location | ✓ | ✓ |
| Time | ✓ | ✓ |
| Claim | ✓ | ✓ |
| Strength | ✗ | ✓ (as icon) |

**Why hide strength in Mini?**
- Mini's invariant is "no numeric UI" — strength is a numeric mechanic
- Showing strength creates meta-gaming ("always/never pick high-strength cards")
- Puzzles should be solved by reading claims against Known Facts, not optimizing stats
- Keeps cards compact and scannable for 2-4 minute phone sessions

**States:**
- `default` — available for selection
- `selected` — currently highlighted (pre-confirmation if applicable)
- `played` — already played, shown in Story Strip
- `disabled` — not selectable (already played or locked)

**Behavior:**
- Tap/click triggers selection
- Visual feedback on state change
- Type displayed as badge or icon with consistent color coding
- In Expert mode only: strength displayed as icon (e.g., 1-3 pips or bars)

**Type badge colors (suggested):**
- DIGITAL — blue
- SENSOR — green
- TESTIMONY — orange
- PHYSICAL — purple

---

### 2.4 CardGrid

**Purpose:** Container displaying all 6 evidence cards for selection.

| Property | Type | Description |
|----------|------|-------------|
| cards | EvidenceCard[] | Array of 6 cards |
| playedCardIds | string[] | IDs of already-played cards |
| onCardSelect | callback | Handler when card is selected |

**Layout:**
- 2×3 grid (preferred for phone portrait)
- Alternative: horizontal scroll if screen width is constrained

**Behavior:**
- Manages card selection state
- Disables/dims already-played cards
- Triggers card play animation when selection confirmed

---

### 2.5 StoryStrip

**Purpose:** Display the cards played so far in order.

| Property | Type | Description |
|----------|------|-------------|
| playedCards | EvidenceCard[] | Cards played (0-3) |

**Layout:**
- Horizontal strip, typically at top or bottom of screen
- Shows 1-3 cards in play order (left to right)

**Behavior:**
- Cards animate into this strip when played
- Each card shows condensed view (label + type icon minimum; no strength in Mini)
- No interaction (cards cannot be unplayed)

---

### 2.6 ProgressIndicator

**Purpose:** Show current step in the 3-pick sequence.

| Property | Type | Description |
|----------|------|-------------|
| currentStep | number | 1, 2, or 3 |
| totalSteps | number | Always 3 for Mini |

**Display formats (choose one):**
- Text: "Step 1 of 3"
- Dots: ● ○ ○
- Progress bar: 33% filled

**Behavior:**
- Updates after each card is played
- Read-only, no interaction

---

### 2.7 KoaBarkBubble

**Purpose:** Display KOA's reactive commentary after each card pick.

| Property | Type | Description |
|----------|------|-------------|
| text | string | Bark content |
| barkType | enum | opening, midrun, result |
| tone | enum | neutral, suspicious, impressed, escalating |

**Behavior:**
- Appears after each card is played
- May animate in (fade, slide, typewriter effect)
- Auto-dismisses or dismissed on next action
- Should feel conversational, like KOA is speaking

**Visual considerations:**
- Speech bubble or card-like container
- Optional KOA avatar/icon
- Tone may affect styling (color accent, icon)

---

### 2.8 SystemCheckBeat

**Purpose:** Heightened dramatic moment after card 2.

| Property | Type | Description |
|----------|------|-------------|
| text | string | KOA's system check line |

**Behavior:**
- Special variant of KoaBarkBubble
- Appears specifically after second card
- May have distinct visual treatment (warning color, animation)
- Substitutes for explicit KOA Flag decision in full V5

**Example content:**
> "This last claim doesn't quite match my logs. If it's wrong, your whole story leans the wrong way."

---

## 3. Verdict Screen Components

### 3.1 TierBadge

**Purpose:** Display the final result tier prominently.

| Property | Type | Description |
|----------|------|-------------|
| tier | enum | BUSTED, CLOSE, CLEARED, FLAWLESS |

**Visual treatment:**

| Tier | Color | Icon/Symbol |
|------|-------|-------------|
| BUSTED | Red | 🔴 or ✗ |
| CLOSE | Yellow/Amber | 🟡 or ~ |
| CLEARED | Green | 🟢 or ✓ |
| FLAWLESS | Gold | 🌟 or ★ |

**Behavior:**
- Large, prominent display
- May animate on reveal
- Central focus of verdict screen

---

### 3.2 VerdictLine

**Purpose:** Display KOA's final quip about the result.

| Property | Type | Description |
|----------|------|-------------|
| text | string | KOA's verdict commentary |
| tier | enum | Tier for styling context |

**Example content by tier:**
- FLAWLESS: "I hate to admit it, but that was airtight."
- CLEARED: "Fine. I'll turn it back on. But I'm watching."
- CLOSE: "That was shaky. You got lucky."
- BUSTED: "Nice try. The printer stays off."

---

### 3.3 PlayedCardsSummary

**Purpose:** Show the 3 played cards with truth/lie status revealed.

| Property | Type | Description |
|----------|------|-------------|
| cards | EvidenceCard[] | The 3 played cards |
| lieCardIds | string[] | IDs of cards that were lies |

**Display:**
- Each card shown with overlay indicator:
  - Truth: ✅ or green checkmark
  - Lie: ❌ or red X
- Cards should remain recognizable (label + type visible; strength shown only in Expert)

**Behavior:**
- Lie cards may have additional visual treatment (red border, strikethrough)
- Reveal may be animated (flip, fade-in of markers)

---

### 3.4 ContradictionBlock

**Purpose:** Explain why lies were lies, mapping to Known Facts.

| Property | Type | Description |
|----------|------|-------------|
| explanations | Contradiction[] | Array of 1-2 explanations |

**Contradiction structure:**
```
{
  cardLabel: string      // e.g., "email_draft"
  factReference: string  // e.g., "Fact #2"
  explanation: string    // e.g., "You claimed to be in bed by 11"
}
```

**Display:**
- Bullet list or card-based layout
- Format: "`card` contradicted `fact` (detail)"
- Limit to 1-2 key contradictions for clarity

**Example:**
> - `email_draft` contradicted Fact #2 (your "in bed by 11" claim)
> - `printer_queue` proved my suspicion — that job came from your laptop at 3 AM

---

### 3.5 ShareButton

**Purpose:** Trigger generation and sharing of result artifact.

| Property | Type | Description |
|----------|------|-------------|
| onShare | callback | Handler to generate/share artifact |

**Behavior:**
- Opens native share sheet, copies to clipboard, or shows ShareCard
- Should not reveal spoilers about specific cards/lies

---

## 4. Share Artifact Components

### 4.1 ShareCard

**Purpose:** Compact, spoiler-light visual for social sharing.

| Property | Type | Description |
|----------|------|-------------|
| dayNumber | number | Puzzle day (e.g., 37) |
| cardResults | boolean[] | [true, true, false] = ✅ ✅ ❌ |
| tier | enum | Result tier |
| koaQuote | string | Short KOA line |

**Display format:**
```
KOA Mini — Day 37
Cards: ✅ ✅ ❌
Result: CLEARED
"I'm still suspicious of your thermostat."
```

**Considerations:**
- No card names or incident details (spoiler-free)
- Suitable for text-only or image export
- Compact enough for tweets/messages

---

## 5. Tutorial Components

### 5.1 TutorialOverlay

**Purpose:** Highlight UI areas and guide new players through Day 0.

| Property | Type | Description |
|----------|------|-------------|
| targetElement | ref | Element to highlight |
| instructionText | string | What to explain |
| step | number | Current tutorial step |
| totalSteps | number | Total tutorial steps |
| onNext | callback | Advance tutorial |
| onSkip | callback | Skip tutorial |

**Behavior:**
- Dims/masks everything except target element
- Shows instruction text near target
- "Next" or tap-to-continue progression
- Optional "Skip tutorial" escape hatch

---

### 5.2 TutorialCardHighlight

**Purpose:** Visually emphasize specific cards during tutorial.

| Property | Type | Description |
|----------|------|-------------|
| cardId | string | Card to highlight |
| highlightType | enum | safe, dangerous, neutral |

**Visual treatment:**
- `safe`: Green glow/border, encouraging
- `dangerous`: Red glow/border, warning
- `neutral`: Generic attention highlight

---

## 6. Settings & Mode Components

### 6.1 ModeToggle

**Purpose:** Switch between Mini and Expert (V5 Advanced) view.

| Property | Type | Description |
|----------|------|-------------|
| currentMode | enum | mini, expert |
| onChange | callback | Handler for mode change |
| isUnlocked | boolean | Whether Expert is available |

**Behavior:**
- Toggle or segmented control
- Expert mode may be locked until milestone reached
- KOA may introduce Expert mode in-character

---

### 6.2 ExpertViewOverlay (V5 Advanced only)

**Purpose:** Additional UI elements shown only in Expert mode.

**Contains:**
- **BeliefBar**: Numeric progress bar (0-100 or similar)
- **TypeTaxIndicator**: Shows when type tax is active
- **KoaFlagButtons**: Stand-by / Withdraw choice after card 2
- **StrengthIndicator**: Pips/bars on each EvidenceCard (1-3 scale)

**Note:** These components are NOT shown in Mini mode. They exist for V5 Advanced integration. The StrengthIndicator is rendered as part of EvidenceCard but only when Expert mode is active.

---

## 7. Long-Term Progression Components

### 7.1 LongTermCommentaryBanner

**Purpose:** Display KOA's observations about player patterns over multiple days.

| Property | Type | Description |
|----------|------|-------------|
| text | string | KOA's long-term observation |
| isPositive | boolean | Affects styling |

**Behavior:**
- Appears at session start or after verdict
- Dismissible
- Optional, not every session

**Example content:**
> "You've started catching most timeline lies. I'm… reluctantly impressed."

---

## 8. Component Hierarchy (Updated for Mockup)

Based on the React mockup (`mockups/mockup-brutalist.zip`), the hierarchy is:

```
ReadingPhase (EvidenceComparisonView)
├── LockoutHeader (scenario)
├── FactsList
└── InstructionsPanel

PickingPhase (Main Game)
├── HeroKoaAvatar (top, centered, large)
├── ChatHistory (scrollable, chronological)
│   ├── KoaMessageBubble (left-aligned)
│   │   └── Typewriter (for latest message)
│   └── PlayerMessageBubble (right-aligned)
│       └── EvidenceCard (details variant)
├── [DimLayer] (when popup active)
├── [CardPreviewPopup]
│   ├── DataLogPanel
│   └── CardPreviewPanel
└── BottomPanel
    ├── ActionBar
    │   ├── StoryStrip
    │   ├── SystemLogsButton → IncidentLogModal
    │   └── PlayButton
    ├── CardGrid (3×2 or 6×1)
    │   └── EvidenceCard (icon variant, ×6)
    └── [ExpertViewOverlay] (Advanced only)

VerdictPhase
├── TierBadge
├── VerdictLine
├── PlayedCardsSummary
│   └── EvidenceCard (×3, with lie markers)
├── ContradictionBlock
└── ShareButton

SharePhase
└── ShareCard
```

**Z-layer pattern:**
- z-10: Main content (avatar, chat, grid)
- z-20: Floating controls (back button, expert overlay)
- z-40: Dim layer (when popup active)
- z-50: Bottom panel (card grid, action bar)
- z-60: Popups (DataLog, CardPreview, IncidentLogModal)

---

## 9. State Management Considerations

The game requires tracking:

| State | Scope | Description |
|-------|-------|-------------|
| puzzleData | session | Current puzzle (scenario, facts, cards, lies) |
| playedCards | session | Ordered list of played card IDs (0-3) |
| currentStep | session | 1, 2, or 3 |
| gamePhase | session | reading, picking, verdict |
| barkQueue | session | Pending KOA barks to display |
| tutorialStep | session | Current tutorial step (Day 0) |
| playerMode | persistent | mini or expert |
| dayNumber | persistent | Current puzzle day |
| playerStats | persistent | Historical performance for long-term barks |

---

## 10. Animation Considerations

Key moments requiring animation:

1. **Card selection** — visual feedback on tap
2. **Card play** — card moves from grid to Story Strip
3. **Bark appearance** — KoaBarkBubble enters
4. **Step transition** — progress indicator updates
5. **Verdict reveal** — TierBadge appears with impact
6. **Lie reveal** — markers appear on PlayedCardsSummary
7. **Share card generation** — optional transition to share view

All animations should be:
- Fast enough for 2-4 minute session pacing
- Skippable or non-blocking where possible
- Consistent with overall visual language

---

## 11. Accessibility Considerations

- All cards must have text alternatives (not icon-only)
- Color coding (type badges, tier) must have secondary indicators (icons, text)
- Tap targets should meet minimum size guidelines (44×44pt recommended)
- KOA barks should be screen-reader compatible
- Progress should be announced for assistive technology

---

## 12. Summary

| Category | Component Count |
|----------|-----------------|
| Game Screen | 8 |
| Verdict Screen | 5 |
| Share | 1 |
| Tutorial | 2 |
| Settings/Mode | 2 |
| Long-term | 1 |
| **Total** | **19** |

This component set is sufficient to implement KOA Mini as specified. Expert View (V5 Advanced) adds 4 additional UI elements (BeliefBar, TypeTaxIndicator, KoaFlagButtons, StrengthIndicator) but shares all base components with Mini. The key difference in shared components is that EvidenceCard hides the strength field in Mini mode.
