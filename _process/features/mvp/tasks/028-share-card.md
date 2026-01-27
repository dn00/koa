# Task 028: Share Card

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Content and Polish
**Complexity:** S
**Depends On:** 020
**Implements:** R13.1, R13.2

---

## Objective

Implement Wordle-style share card generation for completed dailies. Players can copy/share their results without spoiling the puzzle.

---

## Context

Sharing results drives social engagement. The share card shows date, win/loss, and key metrics without revealing strategy.

### Relevant Files
- `packages/app/src/components/share/ShareCard.tsx` (to create)
- `packages/app/src/services/share.ts` (to create)

### Embedded Context

**Share Card Content (from D24):**
- Date
- Win/Loss result
- Turns used
- Score/metrics
- No spoilers (don't reveal cards or strategy)

**Example Share Format:**
```
Home Smart Home #127
ACCESS GRANTED

Turns: 4/6
Concerns: 3/3
Scrutiny: 1/5

[grid of emoji indicating turns]
```

**Source Docs:**
- `docs/D24-VERTICAL-SLICE-DOD-MVP.md` - Share card

---

## Acceptance Criteria

### AC-1: Generate Share Text <- R13.1
- **Given:** Completed run
- **When:** generateShareText(run) called
- **Then:** Returns formatted share string
- **Test Type:** unit

### AC-2: Includes Date <- R13.2
- **Given:** Share text generated
- **When:** Text examined
- **Then:** Contains daily date or number
- **Test Type:** unit

### AC-3: Includes Result <- R13.2
- **Given:** Share text generated
- **When:** Text examined
- **Then:** Contains ACCESS GRANTED or ACCESS DENIED
- **Test Type:** unit

### AC-4: Includes Turns <- R13.2
- **Given:** Share text generated
- **When:** Text examined
- **Then:** Contains turns used/total
- **Test Type:** unit

### AC-5: Includes Score <- R13.2
- **Given:** Share text generated
- **When:** Text examined
- **Then:** Contains concerns addressed, scrutiny
- **Test Type:** unit

### AC-6: Copy to Clipboard <- R13.1
- **Given:** Share text
- **When:** Copy button tapped
- **Then:** Text copied to clipboard
- **Test Type:** integration

### AC-7: Share API <- R13.1
- **Given:** Device supports Web Share API
- **When:** Share button tapped
- **Then:** Native share sheet opens
- **Test Type:** integration

### AC-8: No Spoilers <- R13.1
- **Given:** Share text generated
- **When:** Text examined
- **Then:** Does not reveal specific cards or strategy
- **Test Type:** unit

### Edge Cases

#### EC-1: Share API Not Supported
- **Scenario:** Browser doesn't support Web Share
- **Expected:** Fallback to copy-only

#### EC-2: Perfect Run
- **Scenario:** No contradictions, all counters refuted
- **Expected:** Special indicator in share text

### Error Cases

#### ERR-1: Copy Failed
- **When:** Clipboard API fails
- **Then:** Show fallback (select text manually)
- **Error Message:** "Couldn't copy. Please select and copy manually."

---

## Scope

### In Scope
- `generateShareText(run: CompletedRun): string`
- ShareCard component
- Copy to clipboard
- Web Share API integration
- Fallback for unsupported browsers

### Out of Scope
- Image generation
- Social media specific formatting
- Deep links

---

## Implementation Hints

```typescript
interface ShareData {
  dailyNumber: number;
  date: string;
  result: 'WIN' | 'LOSS';
  turnsUsed: number;
  totalTurns: number;
  concernsAddressed: number;
  totalConcerns: number;
  scrutiny: number;
  countersRefuted: number;
}

export function generateShareText(data: ShareData): string {
  const resultEmoji = data.result === 'WIN' ? '✅' : '❌';
  const turnGrid = generateTurnGrid(data);

  return `Home Smart Home #${data.dailyNumber}
${resultEmoji} ${data.result === 'WIN' ? 'ACCESS GRANTED' : 'ACCESS DENIED'}

Turns: ${data.turnsUsed}/${data.totalTurns}
Concerns: ${data.concernsAddressed}/${data.totalConcerns}
Scrutiny: ${data.scrutiny}/5

${turnGrid}`;
}

function generateTurnGrid(data: ShareData): string {
  // Create grid of squares/emoji representing turns
  const filled = '🟩'.repeat(data.turnsUsed);
  const empty = '⬜'.repeat(data.totalTurns - data.turnsUsed);
  return filled + empty;
}

export async function shareResult(text: string): Promise<void> {
  if (navigator.share) {
    await navigator.share({
      title: 'Home Smart Home',
      text,
    });
  } else {
    await navigator.clipboard.writeText(text);
  }
}
```

```tsx
function ShareCard({ run }: { run: CompletedRun }) {
  const shareText = useMemo(() => generateShareText(run), [run]);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await shareResult(shareText);
      setCopied(true);
    } catch (e) {
      // Fallback handled in shareResult
    }
  };

  return (
    <div className="share-card">
      <pre className="share-preview">{shareText}</pre>
      <button onClick={handleShare}>
        {navigator.share ? 'Share' : 'Copy'}
      </button>
      {copied && <span>Copied!</span>}
    </div>
  );
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

**Context:** Social sharing drives organic growth.
**Decisions:**
- Text-based (like Wordle)
- No spoilers
- Clipboard fallback
**Questions for Implementer:**
- Emoji grid style?
- Include streak in share?

### Implementation Notes
> Written by Implementer

**Approach:**
**Decisions:**
**Deviations:**
**Files Changed:**
**Gotchas:**

### Review Notes
> Written by Reviewer

**Verdict:**
**AC Verification:**
| AC | Test | Pass |
|----|------|------|
| AC-1 | | |
| AC-2 | | |
| AC-3 | | |
| AC-4 | | |
| AC-5 | | |
| AC-6 | | |
| AC-7 | | |
| AC-8 | | |
**Issues:**
**Suggestions:**

### Change Log
> Append-only, chronological

- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
