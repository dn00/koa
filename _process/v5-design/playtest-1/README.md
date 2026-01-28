# V5 Playtest 1

## Goals

1. Validate the micro-daily design (1 card/turn, type tax, objection)
2. Test if hidden truthiness creates real deduction (not guessing)
3. Check if KOA banter lands (Home AI theme)
4. Gather feedback on difficulty and session length

## Puzzles

- `midnight-print` — printer at 3 AM scenario
- `garage-door` — garage door at 2 AM scenario

## How to Play

### Interactive Mode
```bash
npx tsx scripts/play-v5.ts --puzzle midnight-print
```

### Agent Mode (JSON output)
```bash
npx tsx scripts/play-v5.ts --puzzle midnight-print --json --seed 12345 --state /tmp/game.json --pick browser_history
```

## Running Agent Playtests

```bash
npx tsx _process/v5-design/playtest-1/agent-playtest.ts --puzzle midnight-print --agents 5
```

This runs 5 different agent strategies and logs results to `logs/`.

## Survey

After playing, complete `survey.md` with honest reactions.

## Files

- `survey.md` — Human playtest survey
- `agent-playtest.ts` — Automated agent testing
- `logs/` — Playtest transcripts and results
