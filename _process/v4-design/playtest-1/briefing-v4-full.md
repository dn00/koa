# HOME SMART HOME — V4 Full Mode Briefing

*This supplements the base briefing with the advanced systems.*

---

## New System: Stance

KOA has a **stance** that shifts combo values. Today's stance is **NEUTRAL**:

| Combo | Condition | Bonus |
|-------|-----------|-------|
| Corroboration | Same location | +3 |
| Timeline | Times within 90 min | +2 |
| Coverage | Different evidence types | +2 |
| Reinforcement | Same evidence type | +3 |

Other stances (SKEPTIC, TRADITIONALIST) shift these values. The stance is announced at the start.

---

## New System: Pressure

**Order matters.** KOA applies pressure based on your play patterns:

| Rule | Trigger | Penalty |
|------|---------|---------|
| HIGH STRENGTH | Previous pair had combined strength > 10 | -1 this turn |
| TYPE ECHO | You play an evidence type you used in a previous turn | -1 per card |

Example: If T1 you play str 5 + str 6 (total 11), T2 gets HIGH STRENGTH penalty (-1). If T1 you play TESTIMONY + TESTIMONY, then T2 you play another TESTIMONY card, that card triggers TYPE ECHO (-1).

---

## New System: The Objection

**After Turn 2**, KOA challenges one of your played cards — specifically, the highest-strength card you've played so far.

You must choose:
- **Stand By**: If the card is a truth, +2 points. If it's a lie, -3 points.
- **Withdraw**: -2 points regardless.

---

## How to Play (Engine Commands)

You'll use the command line to play. The game state is saved between turns.

**Turn 1:**
```bash
npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/[your-name]-game.json --pick [card1],[card2]
```

**Turn 2:**
```bash
npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/[your-name]-game.json --pick [card3],[card4]
```

**After T2 — The Objection:**
```bash
npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/[your-name]-game.json --objection stand
# OR
npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/[your-name]-game.json --objection withdraw
```

**Turn 3:**
```bash
npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/[your-name]-game.json --pick [card5],[card6]
```

---

## What You'll See

Each turn shows:
- Your current score and cards remaining
- Your hand with all card attributes
- After you pick: the narration, truth/lie reveal, combos, pressure penalties (if any)
- After T1/T2: a reactive tell from KOA
- After T2: The Objection prompt

The final turn shows the complete outcome, lie reveal, and share card.

