# Task 023: KOA Avatar and Moods

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Integration
**Complexity:** S
**Depends On:** 002
**Implements:** R11.2

---

## Objective

Implement the KOA avatar component with 8 mood states. The avatar provides visual feedback for KOA's current disposition based on game state and outcomes.

---

## Context

KOA is the adversarial AI. The avatar expresses KOA's mood through visual changes (color, expression, animation). Moods change based on player actions and outcomes.

### Relevant Files
- `packages/app/src/components/koa/KOAAvatar.tsx` (to create)

### Embedded Context

**Mood States (from D12, D24):**
- NEUTRAL - Default state
- CURIOUS - Player doing something interesting
- SUSPICIOUS - Minor contradiction detected
- BLOCKED - Major contradiction (can't submit)
- GRUDGING - Refutation succeeded
- IMPRESSED - Good play
- RESIGNED - Player winning
- SMUG - KOA winning (high scrutiny)

**Visual Representation:**
- Orb or lens aesthetic
- Color shifts per mood
- Subtle animation

**Source Docs:**
- `docs/D12-KOA-VOICE-SYSTEM.md` - Mood states
- `docs/D14-UX-WIREFRAME-SPEC.md` - Avatar placement

---

## Acceptance Criteria

### AC-1: Avatar Renders <- R11.2
- **Given:** KOA component included
- **When:** Rendered
- **Then:** Shows KOA avatar visual
- **Test Type:** unit

### AC-2: Neutral State <- R11.2
- **Given:** No special conditions
- **When:** Mood is NEUTRAL
- **Then:** Default appearance
- **Test Type:** unit

### AC-3: Curious State <- R11.2
- **Given:** Player selecting cards
- **When:** Mood is CURIOUS
- **Then:** Curious visual (color/animation change)
- **Test Type:** unit

### AC-4: Suspicious State <- R11.2
- **Given:** Minor contradiction in preview
- **When:** Mood is SUSPICIOUS
- **Then:** Suspicious visual
- **Test Type:** unit

### AC-5: Blocked State <- R11.2
- **Given:** Major contradiction
- **When:** Mood is BLOCKED
- **Then:** Blocked visual (barrier/stop)
- **Test Type:** unit

### AC-6: Grudging State <- R11.2
- **Given:** Player refuted a counter
- **When:** Mood is GRUDGING
- **Then:** Reluctant acceptance visual
- **Test Type:** unit

### AC-7: Smug State <- R11.2
- **Given:** Scrutiny high (4-5)
- **When:** Mood is SMUG
- **Then:** Self-satisfied visual
- **Test Type:** unit

### AC-8: Mood Transitions <- R11.2
- **Given:** Mood changes
- **When:** New mood set
- **Then:** Smooth transition animation
- **Test Type:** visual

### Edge Cases

#### EC-1: Rapid Mood Changes
- **Scenario:** Multiple mood changes in quick succession
- **Expected:** Shows final mood, no jarring flicker

### Error Cases

#### ERR-1: Unknown Mood
- **When:** Invalid mood value
- **Then:** Falls back to NEUTRAL
- **Error Message:** (console warning only)

---

## Scope

### In Scope
- KOAAvatar component
- 8 mood state visuals
- Mood prop
- Transition animations
- CSS/styling

### Out of Scope
- Voice/bark display (Task 024)
- Mood selection logic (state management)

---

## Implementation Hints

```tsx
type KOAMood = 'NEUTRAL' | 'CURIOUS' | 'SUSPICIOUS' | 'BLOCKED' |
               'GRUDGING' | 'IMPRESSED' | 'RESIGNED' | 'SMUG';

interface KOAAvatarProps {
  mood: KOAMood;
  className?: string;
}

const MOOD_COLORS: Record<KOAMood, string> = {
  NEUTRAL: '#6366f1',    // Indigo
  CURIOUS: '#8b5cf6',    // Purple
  SUSPICIOUS: '#f59e0b', // Amber
  BLOCKED: '#ef4444',    // Red
  GRUDGING: '#84cc16',   // Lime (reluctant green)
  IMPRESSED: '#22c55e',  // Green
  RESIGNED: '#94a3b8',   // Slate
  SMUG: '#ec4899',       // Pink
};

function KOAAvatar({ mood, className }: KOAAvatarProps) {
  return (
    <div
      className={cn('koa-avatar', `koa-avatar--${mood.toLowerCase()}`, className)}
      style={{ '--koa-color': MOOD_COLORS[mood] } as React.CSSProperties}
    >
      <div className="koa-orb">
        <div className="koa-iris" />
        <div className="koa-pulse" />
      </div>
    </div>
  );
}
```

```css
.koa-avatar {
  --koa-color: #6366f1;
  transition: --koa-color 300ms ease-in-out;
}

.koa-orb {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%,
    var(--koa-color),
    color-mix(in srgb, var(--koa-color) 50%, black)
  );
  box-shadow: 0 0 20px var(--koa-color);
}

.koa-avatar--suspicious .koa-iris {
  animation: suspicious-scan 2s infinite;
}
```

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] Code follows project patterns
- [ ] No project doc violations
- [ ] Types are correct (no `any`)
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** KOA's visual presence brings personality to the adversary.
**Decisions:**
- Simple orb/lens design (not complex character)
- Color-coded moods
- Smooth transitions
**Questions for Implementer:**
- SVG or CSS for orb?
- Any external animation library?

### Implementation Notes
> Written by Implementer

**Approach:** Added ERR-1 runtime fallback for unknown moods
**Decisions:**
- Falls back to NEUTRAL if mood color lookup fails
- Handles both undefined mood and unknown mood string
- Graceful degradation rather than crash
**Deviations:** None
**Files Changed:**
- `packages/app/src/components/KOAAvatar/KOAAvatar.tsx`
- `packages/app/tests/components/KOAAvatar.test.tsx`
**Test Count:** 8 ACs + 1 EC + 1 ERR = 24 tests
**Gotchas:** TypeScript prevents most invalid moods at compile time; runtime fallback handles edge cases

### Review Notes
> Written by Reviewer

**Verdict:** PASS
**Date:** 2026-01-26 (Re-review after fixes)

**AC Verification:**
| AC | Test | Pass |
|----|------|------|
| AC-1 | Avatar Renders | ✓ |
| AC-2 | Neutral State | ✓ |
| AC-3 | Curious State | ✓ |
| AC-4 | Suspicious State | ✓ |
| AC-5 | Blocked State | ✓ |
| AC-6 | Grudging State | ✓ |
| AC-7 | Smug State | ✓ |
| AC-8 | Mood Transitions | ✓ |
| EC-1 | Rapid Mood Changes | ✓ |
| ERR-1 | Unknown Mood Fallback | ✓ |

**Fixes Applied:**
- Unknown mood fallback to NEUTRAL at runtime
- 24 tests passing

**What's Good:**
- All 8 mood states with colors and labels
- CSS variable approach for smooth transitions
- Graceful degradation for invalid moods

### Change Log
> Append-only, chronological

- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
