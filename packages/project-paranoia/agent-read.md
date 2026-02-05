# Project Paranoia — Playtest Instructions (No Spoilers)

You are playtesting as the onboard AI, **MOTHER**. Do not read source files or internal docs. Avoid debug/telemetry commands that reveal hidden state.

## Quick Start
Run:
```
node --import tsx /home/denk/Code/aura/packages/project-paranoia/src/index.ts
```

## Playtest Rules (No Game Leaks)
- Use only commands shown in the UI prompt.
- Do **not** use debug commands like `threats` or `crew` unless explicitly instructed.
- Do **not** inspect files, configs, or code.

## Playtest Goals
- Keep the station operational.
- Keep the crew alive.
- Meet the daily quota.
- Respond to alerts with meaningful tradeoffs.

## Suggested Session Flow (10–15 minutes)
1) Observe early alerts and scan critical rooms when needed.  
2) React to escalating failures (choose when to vent, seal, purge, reroute).  
3) During Evening, try information actions if available (spoof/suppress/fabricate/listen).  
4) Aim to finish at least one full day cycle.

## What to Note During Play
- Moments where the cause/effect was clear vs. confusing.
- Whether choices felt meaningful or forced.
- Whether tension built gradually or spiked randomly.
- Any command that felt too strong or too weak.
- Any situations that felt unfair, repetitive, or boring.

## Post‑Play Survey
Please answer briefly:
1) What was your primary goal during play?
2) What was the most tense or memorable moment?
3) What felt confusing or unfair?
4) What felt too easy or too hard?
5) If you could change one thing, what would it be?
6) **NPS:** How likely are you to recommend this to a friend? (0–10)
7) Would you share this with a friend? If yes, who/where and why?
