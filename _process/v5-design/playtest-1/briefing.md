# V5 Playtest Briefing

You are playtesting a micro-daily puzzle game called **Home Smart Home**.

## The Setup

You live in a smart home monitored by KOA, a passive-aggressive home AI. Something suspicious happened (you'll be told what). KOA thinks you did it. You need to convince KOA you didn't.

You have **6 evidence cards** in your hand. You'll play **3 of them** across 3 turns. Your goal is to reach the **target Belief** score to win.

**The catch:** 2 of your 6 cards are lies. You don't know which ones. If you play a lie, it hurts your score instead of helping.

## What You See

Each card shows:
- **id** — A short name (e.g., `browser_history`)
- **strength** — How much it affects Belief (higher = bigger swing)
- **type** — Evidence category (DIGITAL, SENSOR, TESTIMONY, PHYSICAL)
- **claim** — What you're asserting to KOA

You also receive **Known Facts** — things that are established true. Use these to reason about which cards might be lies. A lie often contradicts a Known Fact or doesn't fit the timeline.

## Scoring

- **Truth:** +strength to Belief
- **Lie:** -(strength - 1) to Belief

Example: A strength-4 truth gives +4. A strength-4 lie gives -3.

## Type Tax

If you play the same evidence **type** as your previous card:
- **This card** gets **-2 Belief** penalty (applied immediately)

Example: T1 you play DIGITAL. T2 you play DIGITAL again. The T2 card gets -2 penalty.

This creates sequencing decisions. Sometimes the penalty is worth it, sometimes not.

## Objection (after Turn 2)

After your second card, KOA challenges it:
- **Stand by:** If it was truth → +2 Belief. If it was lie → -4 Belief.
- **Withdraw:** -2 Belief regardless.

This tests your confidence in the card you just played.

## Win Conditions

| Tier | Requirement |
|------|-------------|
| FLAWLESS | Belief ≥ target + 5 |
| CLEARED | Belief ≥ target |
| CLOSE | Belief < target (but close) |
| BUSTED | Belief far below target |

FLAWLESS and CLEARED = win. CLOSE and BUSTED = loss.

## Your Task

1. Read the scenario and Known Facts carefully
2. Look at your 6 cards
3. Reason about which cards might be lies based on Known Facts
4. Choose which 3 cards to play and in what order
5. Decide stand/withdraw at the objection
6. Try to reach the target Belief

## How to Think

- **Compare claims to Known Facts.** Does this card's claim fit the facts?
- **Watch for contradictions.** If a fact says X, and a card claims not-X, that card is likely a lie.
- **Consider strength.** High-strength lies hurt more. But high-strength truths help more.
- **Plan your types.** Avoid same-type back-to-back unless the card is worth the -2.
- **Trust your reasoning** at the objection. If you reasoned it was true, stand by it.

## CRITICAL RESTRICTIONS

**DO NOT:**
- Read any `.ts` files (scripts/, src/, etc.)
- Read puzzle definition files
- Read game engine source code
- Look at any file that might reveal which cards are lies
- Use Grep or Glob to search the codebase

**YOU MAY ONLY:**
- Read your persona file
- Read this briefing
- Read the survey template (after playing)
- Use the CLI commands below to play the game

This is a scientific playtest. If you read source code, the results are invalid.

## What You See During Play

- Scenario and Known Facts (from CLI JSON on first turn)
- Your cards (id, strength, type, location, time, claim)
- Game state (belief, target, turn results)
- You CANNOT see which cards are lies — that's what you're trying to deduce

## How to Play (CLI)

You play via command line. A state file tracks your game.

**Get initial state (see your hand, scenario, Known Facts):**
```
npx tsx scripts/play-v5.ts --puzzle [PUZZLE] --json --state [STATE_FILE] --seed [SEED]
```

**Play a card:**
```
npx tsx scripts/play-v5.ts --puzzle [PUZZLE] --json --state [STATE_FILE] --seed [SEED] --pick [CARD_ID]
```

**Handle objection (after Turn 2):**
```
npx tsx scripts/play-v5.ts --puzzle [PUZZLE] --json --state [STATE_FILE] --seed [SEED] --objection stand
```
or `--objection withdraw`

The JSON output tells you:
- `hand` — your remaining cards (id, strength, type, location, time, claim)
- `belief` — current score
- `target` — score needed to win
- `lastAction.wasLie` — whether your last card was truth or lie
- `objectionPending` — whether you need to stand/withdraw
- `gameOver` — whether the game is complete
- `scenario`, `knownFacts`, `openingLine` — puzzle context (on first turn)

## After Playing

When the game ends (`gameOver: true`), you must:
1. Read the survey at `_process/v5-design/playtest-1/survey.md`
2. Fill it out based on your experience
3. Save your completed survey to `_process/v5-design/playtest-1/logs/[persona]-[puzzle]-[run].md`

Be honest in your survey responses. We need real feedback, not polite answers.

Good luck. KOA is watching.
