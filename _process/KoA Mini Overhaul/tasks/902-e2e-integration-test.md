# Task 902: E2E Integration Test for v1 Lite

**Status:** backlog
**Complexity:** L
**Depends On:** 901, 801
**Implements:** R9.2

---

## Objective

Create and run end-to-end integration tests that verify the complete v1 Lite game flow works correctly, including all outcome paths and edge cases.

---

## Context

### Relevant Files
- `packages/app-svelte/src/lib/stores/game.ts` — game store
- `packages/engine-core/src/packs/generated-puzzle.ts` — thermostat puzzle (Task 801)
- Test files in appropriate test directories

### Embedded Context

**Test scenarios to cover:**

```typescript
/**
 * E2E Test Scenarios for v1 Lite
 */

// Scenario 1: FLAWLESS path
// - Play 3 truths
// - Cover all facts
// - Diverse sources (no correlation)
// - Avoid concern (diversify on T3)
// Expected: FLAWLESS outcome, no ceiling explanation

// Scenario 2: CLEARED with concern hit
// - Play 3 truths
// - Cover all facts
// - Double down on concern (3-of-3)
// Expected: CLEARED outcome, ceiling explanation mentions concern

// Scenario 3: CLEARED with correlation
// - Play 3 truths
// - Cover all facts
// - All same signalRoot
// Expected: CLEARED outcome, ceiling explanation mentions correlation

// Scenario 4: CLEARED with both blockers
// - Play 3 truths
// - Cover all facts
// - Double down on concern AND same signalRoot
// Expected: CLEARED outcome, ceiling explanation mentions both

// Scenario 5: CLOSE
// - Play 2 truths, 1 lie
// - Some facts covered
// Expected: CLOSE outcome, no ceiling explanation

// Scenario 6: BUSTED
// - Play 2+ lies
// Expected: BUSTED outcome, no ceiling explanation

// Scenario 7: no_concern path
// - T1 + T2 trigger no_concern
// - T3 is any truth
// Expected: Shows "mixing sources" suspicion, FLAWLESS possible
```

**Test structure:**
```typescript
describe('v1 Lite Game Flow', () => {
  describe('Outcome: FLAWLESS', () => {
    it('should achieve FLAWLESS with 3 truths, no concern hit, no correlation', async () => {
      // Setup: Load thermostat puzzle
      // Act: Submit cards that diversify
      // Assert: outcome === 'flawless', no ceiling
    });
  });

  describe('Outcome: CLEARED', () => {
    it('should achieve CLEARED with concern hit', async () => {
      // Setup: Load puzzle
      // Act: Submit cards that double down on concern
      // Assert: outcome === 'cleared', ceilingBlocker === 'concern'
    });

    it('should achieve CLEARED with correlation', async () => {
      // Setup: Load puzzle
      // Act: Submit cards with same signalRoot
      // Assert: outcome === 'cleared', ceilingBlocker === 'correlation'
    });
  });

  describe('T2 Suspicion', () => {
    it('should show suspicion line after T2', async () => {
      // Setup: Load puzzle
      // Act: Submit T1, then T2
      // Assert: suspicionText is populated
    });

    it('should show no_concern line when sources mixed', async () => {
      // Setup: Load puzzle with diverse T1+T2
      // Act: Submit diverse cards
      // Assert: suspicionText.line contains "mixing"
    });
  });

  describe('Final Audit', () => {
    it('should display three axis lines', async () => {
      // Setup: Complete game
      // Act: Reach Final Audit phase
      // Assert: All three lines visible
    });
  });
});
```

**Test data requirements:**
- Thermostat puzzle must be fully tagged (Task 801)
- Need card combinations that trigger each scenario
- Document which cards to select for each test

**Manual testing checklist:**
```markdown
## Manual Test Checklist

### Setup
- [ ] Thermostat puzzle loaded
- [ ] All cards have v1 Lite tags

### FLAWLESS Path
- [ ] Select T1: [specific card]
- [ ] Select T2: [specific card] — verify suspicion shows
- [ ] Select T3: [specific card] — verify diversifies
- [ ] Verify Final Audit shows 3 checkmarks
- [ ] Verify Result shows FLAWLESS
- [ ] Verify no ceiling explanation

### CLEARED with Concern Hit Path
- [ ] Select T1: [specific card]
- [ ] Select T2: [specific card] — note the concern
- [ ] Select T3: [specific card] — verify doubles down
- [ ] Verify Final Audit shows concern warning
- [ ] Verify Result shows CLEARED
- [ ] Verify ceiling explanation mentions the dimension

### ... (more paths)
```

---

## Acceptance Criteria

### AC-1: FLAWLESS path tested <- R9.2
- **Given:** Test for FLAWLESS outcome
- **When:** Running test
- **Then:** Test passes with correct outcome and no ceiling

### AC-2: All CLEARED variants tested <- R9.2
- **Given:** Tests for concern, correlation, both blockers
- **When:** Running tests
- **Then:** All tests pass with correct ceiling explanations

### AC-3: CLOSE tested <- R9.2
- **Given:** Test for 2 truths + 1 lie selection
- **When:** Running test
- **Then:** Test passes with CLOSE outcome

### AC-4: BUSTED tested <- R9.2
- **Given:** Test for 0-1 truths selection
- **When:** Running test
- **Then:** Test passes with BUSTED outcome

### AC-5: Suspicion display tested <- R9.2
- **Given:** Tests for T2 suspicion
- **When:** Running tests
- **Then:** Suspicion text appears correctly for all concern types

### AC-6: Manual test checklist complete <- R9.2
- **Given:** Manual testing
- **When:** Following checklist
- **Then:** All items checked off

---

## Edge Cases

### EC-1: Overlap rule (same_system + independence)
- **Scenario:** Concern is same_system, independence would also warn
- **Expected:** Independence is informational only, no double penalty

### EC-2: Timing edge cases
- **Scenario:** Animation timing varies
- **Expected:** Tests use appropriate waits/assertions

### EC-3: Store state persistence
- **Scenario:** Page refresh mid-game
- **Expected:** Document expected behavior (lose progress?)

---

## Error Cases

### ERR-1: Test flakiness
- **When:** Animation timing causes test to fail intermittently
- **Then:** Add appropriate waits, document flaky tests
- **Error Message:** "Element not found" / "Assertion timeout"

### ERR-2: Puzzle data missing fields
- **When:** Task 801 not complete
- **Then:** Tests fail with type errors
- **Error Message:** "Property 'factTouch' is undefined"

---

## Scope

**In Scope:**
- E2E tests for all outcome paths
- Tests for suspicion display
- Tests for Final Audit display
- Manual test checklist
- Document test card combinations

**Out of Scope:**
- Unit tests for individual functions (covered in earlier tasks)
- Performance testing
- Accessibility testing
- Mobile-specific testing

---

## Implementation Hints

1. Use Playwright or Cypress for E2E tests
2. Create test utilities for card selection
3. Document exact card IDs to use for each scenario
4. Add data-testid attributes to key elements
5. Consider snapshot testing for visual regression
6. Run tests against thermostat puzzle only (known data)

---

## Log

### Planning Notes
**Context:** Verify complete v1 Lite integration
**Decisions:** Both automated and manual testing
