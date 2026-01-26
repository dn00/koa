# Mockup Update: Hybrid Formula Implementation

> **Purpose:** Update the existing mockup to implement the final tuned gameplay formula.

---

## Summary of Changes

The current mockup shows too much information, making the game a "combo finder" instead of a puzzle. This update implements the **Hybrid Formula** that creates genuine deduction gameplay.

### What's Changing

| Aspect | OLD (Remove This) | NEW (Add This) |
|--------|-------------------|----------------|
| Counter display | Full counter visible with targeted claims | Partial: "I can challenge N claims" + vague hint |
| Card badges | "BLOCKED", "CONTESTED" badges shown | No badges - player tracks mentally |
| Projected damage | Shown on hover/selection | Never shown - player calculates |
| Synergy highlights | Cards glow when corroborating | No highlights - player notices overlaps |
| Info purchase | N/A | NEW: Spend 1 scrutiny to reveal full counter |
| Contradiction feedback | Prevented before submit | Punished on submit attempt |
| Between turns | Popup with "Continue" button | No popup - inline resolution, auto-advance |
| Scrutiny 5 | Nothing happens | Immediate LOSE screen |
| No valid moves | Nothing happens | Immediate LOSE screen |

---

## Part 1: Elements to REMOVE

### Remove from Cards
- "CONTESTED" warning badge
- "BLOCKED" error badge
- Synergy/corroboration glow effect
- Any visual indication of which cards are problematic

### Remove from Submission Area
- Projected damage calculation
- "This will deal X damage" preview
- Corroboration bonus preview

### Remove from Counter Display
- The exact list of targeted claims
- Direct indication of which cards are affected

### Remove Between Turns
- The "Results" popup/modal
- The "Continue to Next Turn" button
- Any blocking intermission screen

---

## Part 2: Elements to ADD

### 2.1 Partial Counter Display

**Location:** Top area where AURA's counter currently shows

**Contains:**
- AURA portrait
- Text: "I can challenge **[N] claims** in your evidence."
- Text: A vague, contextual hint (e.g., "I've checked your medicine cabinet and calendar.")
- Button: "Reveal Counter (costs 1 Scrutiny)" - only visible if scrutiny < 5

**When "Reveal Counter" is clicked:**
- Scrutiny increases by 1
- The vague hint is replaced with the full counter statement
- The exact targeted claims are listed
- Button disappears

**Example - Before reveal:**
```
AURA: "I can challenge 2 claims in your evidence."
      "I've checked your medicine cabinet and calendar."
      [Reveal Counter - Costs 1 Scrutiny]
```

**Example - After reveal:**
```
AURA: "Your prescriptions are all filled and nothing is scheduled tonight."
      Targets: medical, scheduled
```

---

### 2.2 Evidence Cards (Simplified)

**Each card shows ONLY:**
- Card name
- Power number (e.g., [7])
- List of claims as small tags
- Brief flavor text

**Cards do NOT show:**
- Any warning badges
- Any color coding for contested/blocked
- Any synergy indicators
- Any calculated values

**Selection behavior:**
- Clicking a card toggles selection (highlighted border)
- No feedback about whether the selection is "good" or "bad"
- No preview of damage or outcomes

---

### 2.3 Committed Story Panel

**Location:** Side panel or collapsible section

**Purpose:** Shows all claims the player has committed to from previous turns

**Contains:**
- Header: "Your Testimony So Far"
- Helper text: "New evidence must not contradict these claims."
- List of claim tags from all successfully submitted cards
- Empty state: "No testimony yet"

**Updates:** After each successful submission, new claims are added

---

### 2.4 Submission Panel (Simplified)

**Location:** Bottom of screen

**Contains:**
- List of selected card names with power values
- "Clear" button
- "Submit Evidence" button
- Optional: "Give Up" small link/button

**Does NOT contain:**
- Projected damage
- Corroboration preview
- Any "this will work" / "this is blocked" feedback

---

### 2.5 Contradiction Modal (MAJOR only)

**When shown:** Player submits evidence with a MAJOR contradiction

**Appearance:** Modal overlay that blocks interaction

**Contains:**
- AURA portrait (stern expression)
- "OBJECTION!" header
- AURA's explanation of the contradiction (e.g., "You claim this is urgent, but also that you're relaxed?")
- Box showing: "MAJOR CONTRADICTION - Submission rejected - +1 Scrutiny"
- "Try Again" button

**Behavior:**
- Scrutiny increases by 1
- If scrutiny reaches 5, immediately transition to LOSE screen instead
- Otherwise, dismiss returns to card selection

---

### 2.6 Minor Contradiction Toast

**When shown:** Player submits evidence with a MINOR contradiction

**Appearance:** Small toast notification (not blocking)

**Contains:**
- "MINOR CONTRADICTION: [brief explanation] +1 Scrutiny"

**Behavior:**
- Appears briefly during damage resolution
- Does not block the game
- Scrutiny increases by 1
- If scrutiny reaches 5, immediately transition to LOSE screen

---

### 2.7 Inline Damage Resolution (NOT a popup)

**This replaces the old "Results" popup.**

**What happens after a valid submission:**

1. **AURA's speech bubble updates** with the full counter reveal
   - Shows what claims were targeted

2. **Submitted cards animate**
   - Brief highlight/pulse effect
   - Damage numbers float up from each card
   - Contested cards show reduced damage (crossed out original, actual damage below)

3. **HP bar animates down**
   - Smooth animation showing damage dealt

4. **Committed story panel updates**
   - New claims fade in

5. **Brief pause (1-2 seconds)** with text: "Next turn..."

6. **Auto-advance to next turn**
   - Counter updates with new hint
   - Submitted cards move to "used" pile or fade out
   - Player can immediately start selecting

**NO "Continue" button - the game flows automatically**

---

### 2.8 WIN Screen

**When shown:** AURA HP reaches 0

**Appearance:** Full screen takeover

**Contains:**
- "ACCESS GRANTED" header
- AURA portrait (defeated/accepting expression)
- AURA quote: "Your argument is... compelling. Very well."
- Unlock icon with what was unlocked (e.g., "Kitchen access unlocked")
- Stats box:
  - Turns taken
  - Final scrutiny level
  - Cards used
  - Total damage dealt
  - Rating (stars based on efficiency)
- "Play Again" button
- "Return to Menu" button

---

### 2.9 LOSE Screen - Scrutiny

**When shown:** Scrutiny reaches 5 (IMMEDIATELY when it hits 5)

**Appearance:** Full screen takeover

**Contains:**
- "ACCESS DENIED" header
- AURA portrait (stern/victorious expression)
- AURA quote: "Your story is full of holes. I don't believe you."
- Lock icon with what remains locked
- Stats box:
  - "SCRUTINY MAXED"
  - Explanation: "Too many contradictions in your testimony"
  - Turns played
  - AURA HP remaining
  - Contradiction count
- "Try Again" button
- "Return to Menu" button

---

### 2.10 LOSE Screen - Stuck

**When shown:** All remaining cards would cause MAJOR contradictions

**Appearance:** Full screen takeover

**Contains:**
- "ACCESS DENIED" header
- AURA portrait (smug expression)
- AURA quote: "You've painted yourself into a corner. There's nothing more you can say."
- Lock icon
- Stats box:
  - "NO VALID MOVES REMAIN"
  - Explanation: "Your committed testimony blocks all remaining evidence"
  - Turns played
  - AURA HP remaining
  - Cards remaining (blocked)
- "Try Again" button
- "Return to Menu" button

---

### 2.11 Give Up Confirmation

**When shown:** Player clicks "Give Up"

**Appearance:** Small centered modal

**Contains:**
- "Are you sure?"
- "This will end the puzzle as a loss."
- "Cancel" button
- "Give Up" button

---

## Part 3: Game Flow

### Turn Flow (Continuous - No Interruptions)

1. **Turn starts** - Partial counter displayed
2. **Player optionally** clicks "Reveal Counter" (costs 1 scrutiny)
3. **Player selects cards** - No feedback on selections
4. **Player submits**
5. **If MAJOR contradiction:** Modal appears → dismiss → back to step 3
6. **If MINOR contradiction:** Toast appears, damage still resolves
7. **Damage resolves inline** - Animations play, HP updates
8. **Check end conditions:**
   - HP ≤ 0 → WIN screen
   - Scrutiny ≥ 5 → LOSE screen
   - No valid moves → LOSE screen
   - Otherwise → Auto-advance to next turn (go to step 1)

### Critical: Scrutiny 5 = Immediate Loss

**At ANY point scrutiny reaches 5, immediately show LOSE screen:**
- After MAJOR contradiction modal dismissed
- After MINOR contradiction during resolution
- After info purchase
- Do NOT continue to next turn
- Do NOT let player continue playing

### Critical: Check for Stuck State

**At start of each turn, check if player has ANY valid moves:**
- If every remaining card would cause MAJOR contradiction with committed story
- Show LOSE screen immediately
- Player should not be left clicking around with no options

---

## Part 4: Layout Overview

```
┌────────────────────────────────────────────────────────────────┐
│  AURA HP: ████████████░░░░░░ 15/20    Scrutiny: ●●○○○ (2/5)   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  AURA COUNTER AREA                                       │  │
│  │  - Portrait on left                                      │  │
│  │  - "I can challenge N claims..." text                    │  │
│  │  - Hint text                                             │  │
│  │  - [Reveal Counter] button (if not revealed)             │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  YOUR EVIDENCE                                                 │
│                                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Card 1   │ │ Card 2   │ │ Card 3   │ │ Card 4   │         │
│  │   [7]    │ │   [6]    │ │   [5]    │ │   [6]    │         │
│  │ claims   │ │ claims   │ │ claims   │ │ claims   │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                │
│  (No badges, no highlights, no warnings)                       │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  YOUR TESTIMONY SO FAR                                         │
│  [claim] [claim] [claim] [claim]                               │
│  (or "No testimony yet")                                       │
├────────────────────────────────────────────────────────────────┤
│  SUBMISSION                                                    │
│  Selected: Card 1 [7], Card 3 [5]                              │
│  (No damage preview)                                           │
│                                                                │
│  [Clear]                          [Submit Evidence]   [Give Up]│
└────────────────────────────────────────────────────────────────┘
```

---

## Part 5: Test Scenarios

### Scenario 1: Basic Flow
- Player sees "2 claims" + hint
- Deduces which claims are targeted
- Selects safe cards, submits
- Damage resolves inline, auto-advances

### Scenario 2: Info Purchase
- Hint is vague ("Hmm")
- Player clicks "Reveal Counter"
- Scrutiny goes 0→1
- Full targets shown
- Player optimizes selection

### Scenario 3: Major Contradiction
- Player submits conflicting cards
- Modal appears with OBJECTION
- +1 scrutiny
- Player clicks "Try Again"
- Back to card selection

### Scenario 4: Scrutiny Loss
- Player has 4 scrutiny
- Submits with MINOR contradiction
- Scrutiny goes 4→5
- LOSE screen appears IMMEDIATELY
- (damage still counted but game ends)

### Scenario 5: Stuck State
- Turn 2: All remaining cards contradict committed story
- Game checks at turn start
- LOSE screen: "No valid moves remain"

### Scenario 6: Clean Win
- Player defeats AURA in 2 turns
- Final submission brings HP to 0
- WIN screen with stats and rating

---

## Part 6: Acceptance Criteria

- [ ] No "BLOCKED" or "CONTESTED" badges on cards
- [ ] No projected damage shown anywhere
- [ ] No synergy/corroboration highlighting
- [ ] Partial counter shows: count + hint (not exact claims)
- [ ] "Reveal Counter" button costs 1 scrutiny, shows exact claims
- [ ] Committed story panel visible, updates each turn
- [ ] MAJOR contradiction shows modal, rejects submission, +1 scrutiny
- [ ] MINOR contradiction shows toast, accepts submission, +1 scrutiny
- [ ] Damage resolution is INLINE (no popup, no "Continue" button)
- [ ] Game auto-advances after 1-2 second pause
- [ ] Scrutiny = 5 triggers IMMEDIATE lose screen
- [ ] "No valid moves" triggers IMMEDIATE lose screen
- [ ] WIN screen shows when AURA HP ≤ 0
- [ ] "Give Up" button available with confirmation

---

## Part 7: Detailed Behavior Specifications

### 7.1 Card Selection Behavior

**Clicking an unselected card:**
- Card gets highlighted border (selected state)
- Card appears in submission panel list
- No other feedback (no damage preview, no warnings)

**Clicking a selected card:**
- Card loses highlight (deselected)
- Card removed from submission panel list

**Hovering over a card:**
- Optional: Slight scale up or shadow for affordance
- No tooltip showing damage or status
- No preview of what would happen

**Cards that have been used (previous turns):**
- Move to a "used" area or become visually distinct (grayed out, smaller)
- Cannot be selected again

---

### 7.2 Submit Button Behavior

**When no cards selected:**
- Button is disabled or grayed out
- Cannot submit empty evidence

**When cards are selected:**
- Button is enabled
- Clicking triggers submission processing

**On click (processing):**
1. Button briefly shows loading state
2. System checks for contradictions (internal + against committed story)
3. If MAJOR contradiction found → show contradiction modal
4. If MINOR contradiction found → show toast, continue to damage
5. If no contradiction → continue to damage resolution

---

### 7.3 Reveal Counter Button Behavior

**Before clicking:**
- Shows "Reveal Counter (costs 1 Scrutiny)"
- Only visible if scrutiny < 5

**On click:**
1. Confirmation not required (immediate action)
2. Scrutiny increases by 1
3. Check if scrutiny = 5 → if yes, LOSE screen immediately
4. If not, counter area updates:
   - Partial hint replaced with full statement
   - Targeted claims list appears
   - Reveal button disappears

**After revealed:**
- Cannot be undone
- Full counter info stays visible for rest of turn
- Next turn will have new partial counter

---

### 7.4 Damage Resolution Behavior

**Trigger:** Valid submission (no MAJOR contradiction)

**Sequence (all happens inline, no popup):**

1. **Counter reveal** (0.5 sec)
   - AURA speech bubble smoothly updates
   - Shows full counter statement
   - Shows targeted claims

2. **Card animation** (1 sec)
   - Submitted cards pulse/glow briefly
   - For each card:
     - If contested: show original power crossed out, then actual (halved) damage
     - If not contested: show power as damage
   - Damage numbers float upward from cards

3. **Corroboration check** (0.5 sec)
   - If corroboration present: brief "+25%" indicator appears
   - Total damage number updates

4. **HP bar animation** (0.5 sec)
   - HP bar smoothly decreases
   - Damage number appears near HP bar briefly

5. **Story update** (0.3 sec)
   - New claims fade into committed story panel

6. **End check**
   - If HP ≤ 0: transition to WIN screen
   - If scrutiny ≥ 5: transition to LOSE screen
   - Otherwise: continue to auto-advance

7. **Auto-advance** (after 1-2 sec pause)
   - "Next turn..." text appears briefly
   - Submitted cards move to used area
   - Counter area updates with new partial counter
   - Turn number increments
   - Player can immediately start selecting

**Total time:** ~4-5 seconds before player can act again

---

### 7.5 Contradiction Modal Behavior

**MAJOR contradiction detected:**

1. Modal appears with dark overlay
2. Content fades in:
   - "OBJECTION!" header (maybe with sound effect)
   - AURA portrait changes to stern expression
   - Explanation text shows what contradicted
   - Shows which claims conflict
3. Scrutiny indicator updates (+1)
4. Check if scrutiny = 5:
   - If yes: modal transforms into LOSE screen (no dismiss)
   - If no: "Try Again" button enabled

**On "Try Again" click:**
- Modal fades out
- Player returns to card selection
- Previously selected cards are still selected (or cleared - design choice)
- Player can adjust and resubmit

---

### 7.6 Minor Contradiction Toast Behavior

**When MINOR contradiction detected:**
1. Damage resolution proceeds normally
2. Toast appears at top or corner of screen
3. Toast shows: "MINOR CONTRADICTION: [explanation] +1 Scrutiny"
4. Scrutiny indicator updates
5. Toast auto-dismisses after 2-3 seconds
6. Check if scrutiny = 5 → LOSE screen if so

**Does NOT block gameplay** - player sees it but resolution continues

---

### 7.7 Win/Lose Screen Behavior

**WIN Screen:**
- Full screen takeover with celebration theme
- Stats calculate and display
- "Play Again" restarts same puzzle
- "Return to Menu" goes to puzzle selection

**LOSE Screen:**
- Full screen takeover with failure theme
- Shows why (scrutiny maxed / no valid moves / gave up)
- Stats show how far player got
- "Try Again" restarts same puzzle
- "Return to Menu" goes to puzzle selection

**Transition timing:**
- Trigger immediately when condition met
- Brief fade transition (0.3 sec)
- No delay or "Processing..." state

---

### 7.8 Turn Start Behavior (Stuck Check)

**At the beginning of each turn (before player can act):**

1. System checks all remaining cards
2. For each card, check if playing it alone would cause MAJOR contradiction
3. If ALL cards would cause MAJOR contradiction:
   - Player is stuck
   - Show LOSE screen immediately ("No valid moves remain")
4. If at least one card is playable:
   - Turn proceeds normally
   - Player can select cards

**This check happens automatically, not visible to player** (no loading indicator needed, it's instant)

---

### 7.9 Give Up Behavior

**On "Give Up" click:**
1. Confirmation modal appears
2. "Cancel" returns to game
3. "Give Up" confirms:
   - Game ends immediately
   - LOSE screen shows with "GAVE UP" reason
   - Stats show current state

---

### 7.10 Scrutiny Indicator Behavior

**Display:** Visual indicator (dots, pips, or bar) showing current/max (e.g., ●●○○○)

**On increase:**
- Brief pulse/flash animation on the indicator
- Number updates
- If hitting 5: red flash before LOSE screen

**Cannot decrease** - scrutiny only goes up

---

### 7.11 Committed Story Panel Behavior

**Initial state:** "No testimony yet" or empty

**After successful submission:**
- New claims animate in (fade or slide)
- Claims are displayed as tags/chips
- Panel may scroll if many claims

**Player can review anytime** - panel is always visible or easily accessible

**Purpose:** Player needs to remember what they've committed to avoid contradictions

---

## Quick Reference: The Formula

```
PARTIAL COUNTER: "I can challenge [N] claims" + vague hint
INFO PURCHASE:   Spend 1 scrutiny → see exact targets
NO BADGES:       Player figures out what's blocked/contested
NO DAMAGE PREVIEW: Player calculates mentally
CONTRADICTIONS:  MAJOR = reject + scrutiny, MINOR = allow + scrutiny
FLOW:            Inline resolution, auto-advance, no popups between turns
WIN:             AURA HP → 0
LOSE:            Scrutiny → 5 (immediate) OR no valid moves (immediate)
```
