# Task 018: Avatar Expression as Game Mechanic

**Status:** backlog
**Assignee:** -
**Blocked By:** 012 (KOA Avatar)
**Phase:** Polish
**Complexity:** M

---

## Objective

Make KOA's avatar expression a meaningful game mechanic that reflects **engagement level**, not **judgment**. The player learns to "read" KOA as a character, not as a hint system.

---

## Design Principles (Nintendo-Inspired)

1. **Everything reacts** — Every card played gets a visible KOA response
2. **Characters feel alive** — KOA is thinking, not displaying UI
3. **Teach through play** — Player learns to read KOA over multiple puzzles
4. **Earned "aha"** — Expression adds tension, not answers
5. **Juicy & satisfying** — Animations make every moment feel good
6. **Clear communication** — Expression is readable, not confusing
7. **One more try** — Failure reveals what went wrong, invites retry

---

## Core Rule

**Expression shows ENGAGEMENT, not JUDGMENT.**

| Expression Shows | Expression Does NOT Show |
|------------------|--------------------------|
| "I'm paying attention" | "That's wrong" |
| "This is interesting" | "That's the lie" |
| "Let me think about this" | "You're losing" |

KOA is **processing evidence**, not **evaluating your case**.

---

## Expression Inputs

### 1. Card Strength (1-5)

Higher strength = KOA pays more attention.

| Strength | Engagement Level |
|----------|------------------|
| 5 | High — KOA locks on, leans forward |
| 4 | Medium-High — KOA attentive, focused |
| 3 | Medium — KOA neutral, processing |
| 2 | Low — KOA less interested |
| 1 | Minimal — KOA dismissive |

### 2. Turn Number (1-3)

Stakes escalate each turn.

| Turn | Baseline Intensity |
|------|-------------------|
| 1 | Relaxed, observing — "Let's see what you have" |
| 2 | Alert, evaluating — Objection is coming |
| 3 | Intense, decisive — Final judgment mode |

### 3. Game Phase

| Phase | Expression Mode |
|-------|-----------------|
| Card Play | Engagement-based (no judgment) |
| Objection | Challenging, skeptical |
| Verdict | Judgment revealed (smug/grudging) |
| Lie Reveal | Gotcha moment |

---

## Expression States

### During Card Play (Engagement Only)

```
BORED
  Trigger: Low-strength card (1-2)
  Visual: Eyes half-lidded, leaning back, slow blink
  Bark tone: "Noted." / "If you say so."

ATTENTIVE
  Trigger: Medium-strength card (3)
  Visual: Eyes open, neutral posture, steady gaze
  Bark tone: "Go on..." / "I'm listening."

FOCUSED
  Trigger: High-strength card (4-5)
  Visual: Eyes locked on, slight lean forward, minimal blink
  Bark tone: "Interesting." / "Tell me more about that."

PROCESSING
  Trigger: After any card (brief transition)
  Visual: Eyes dart slightly, head tilts, pause
  Duration: 0.5-1 second before bark
```

### During Objection

```
CHALLENGING
  Visual: Eyebrow raised, direct stare, slight lean forward
  Bark tone: "Are you sure about that?" / "Standing by this?"

WAITING
  Visual: Still, patient, intense eye contact
  Context: Waiting for player's stand-by/withdraw choice
```

### During Verdict (Judgment Revealed)

```
GRUDGING (Player won)
  Visual: Eyes narrow, slight head shake, reluctant posture
  Bark tone: "...Fine. I suppose that checks out."

IMPRESSED (Player won flawlessly)
  Visual: Eyebrows up briefly, surprised, then annoyed
  Bark tone: "Annoyingly consistent."

SATISFIED (Player lost)
  Visual: Relaxed, knowing look
  Bark tone: "Your case had holes. I have time."

SMUG (Player caught in lie)
  Visual: Slight smile, leaning back, comfortable
  Bark tone: "USB at 3:04. But the job came via cloud. Math."
```

---

## Expression Combination Logic

```typescript
type EngagementLevel = 'BORED' | 'ATTENTIVE' | 'FOCUSED';
type Intensity = 'RELAXED' | 'ALERT' | 'INTENSE';
type Phase = 'CARD_PLAY' | 'OBJECTION' | 'VERDICT';

function getExpression(
  cardStrength: number,
  turn: number,
  phase: Phase,
  verdictResult?: 'won' | 'lost' | 'lie_caught'
): Expression {

  if (phase === 'VERDICT') {
    // Judgment revealed
    if (verdictResult === 'won') return 'GRUDGING';
    if (verdictResult === 'lie_caught') return 'SMUG';
    return 'SATISFIED';
  }

  if (phase === 'OBJECTION') {
    return 'CHALLENGING';
  }

  // During card play: engagement only
  const engagement = strengthToEngagement(cardStrength);
  const intensity = turnToIntensity(turn);

  return combineExpression(engagement, intensity);
}

function strengthToEngagement(strength: number): EngagementLevel {
  if (strength >= 4) return 'FOCUSED';
  if (strength >= 3) return 'ATTENTIVE';
  return 'BORED';
}

function turnToIntensity(turn: number): Intensity {
  if (turn === 3) return 'INTENSE';
  if (turn === 2) return 'ALERT';
  return 'RELAXED';
}
```

---

## Visual Specifications

### Eye States

| State | Eyelid Position | Pupil Behavior | Blink Rate |
|-------|-----------------|----------------|------------|
| BORED | Half-closed | Slow drift | Slow |
| ATTENTIVE | Normal | Steady | Normal |
| FOCUSED | Wide | Locked on | Minimal |
| PROCESSING | Normal | Darting | Paused |

### Posture States

| State | Head Position | Lean | Shoulders |
|-------|---------------|------|-----------|
| RELAXED | Neutral | Back | Dropped |
| ALERT | Slight tilt | Neutral | Level |
| INTENSE | Forward | Forward | Raised |

### Transition Timing

| Transition | Duration | Easing |
|------------|----------|--------|
| Engagement change | 300ms | ease-out |
| Turn escalation | 500ms | ease-in-out |
| To verdict | 800ms | dramatic pause, then ease-in |
| Processing flicker | 100-200ms | linear |

---

## What KOA Does NOT Do (Until Verdict)

These expressions are **banned during card play**:

| Expression | Why Banned |
|------------|------------|
| Smile / approval nod | Signals "you're right" |
| Frown / disapproval | Signals "you're wrong" |
| Smirk / smug look | Signals "caught you" |
| Head shake | Direct judgment |
| Eye roll | Implies mistake |

These are reserved for **verdict phase only**.

---

## Player Learning Curve

**First few puzzles:**
- Player notices KOA reacts differently to cards
- "KOA seemed more interested in that one"

**After 5-10 puzzles:**
- Player intuits: "High-strength cards get attention"
- Player learns KOA's personality (sarcastic, skeptical)

**Mastery:**
- Player reads KOA's engagement as part of the experience
- Expression adds tension without solving puzzle
- Winning against focused KOA feels earned

---

## Integration with Existing Systems

### Bark Selection

Expression state can influence bark selection:

```typescript
function selectBark(
  cardId: string,
  expression: Expression,
  barks: string[]
): string {
  // If multiple barks available, pick one that matches intensity
  // FOCUSED might get the more intense bark variant
  // BORED might get the dismissive variant
}
```

### Avatar Component Props

```typescript
interface KoaAvatarProps {
  expression: Expression;
  isSpeaking: boolean;
  transitionDuration?: number;
}
```

---

## Acceptance Criteria

### AC-1: Strength Affects Expression
- **Given:** Player plays a strength-5 card
- **When:** Card is transmitted
- **Then:** KOA expression shifts to FOCUSED before bark

### AC-2: Turn Affects Baseline
- **Given:** Game is on Turn 3
- **When:** Any card is played
- **Then:** KOA's baseline intensity is INTENSE

### AC-3: No Judgment During Play
- **Given:** Player plays a lie
- **When:** Card is transmitted
- **Then:** KOA expression is engagement-based (FOCUSED if high strength)
- **And:** No smug/disapproving expression until verdict

### AC-4: Judgment at Verdict
- **Given:** Game ends, player caught in lie
- **When:** Verdict screen displays
- **Then:** KOA expression shifts to SMUG
- **And:** liesRevealed bark plays

### AC-5: Transitions Feel Smooth
- **Given:** Any expression change
- **When:** State updates
- **Then:** Animation is smooth (300-800ms based on context)

---

## Definition of Done

- [ ] Avatar responds to card strength with engagement levels
- [ ] Avatar responds to turn number with intensity levels
- [ ] No judgment expressions during card play phase
- [ ] Judgment expressions appear at verdict
- [ ] Transitions are smooth and timed appropriately
- [ ] Player cannot deduce truth/lie from expression during play
- [ ] Expression feels like KOA thinking, not UI feedback

---

## Dependencies

- Task 012: KOA Avatar (base component)
- Game state must expose: current turn, last played card strength, game phase

---

## Log

### Change Log
- 2026-01-30 [Design] Created expression mechanic spec

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-30 | - | backlog | Design | Created |
