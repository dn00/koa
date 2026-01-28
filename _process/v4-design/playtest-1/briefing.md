# HOME SMART HOME — Player Briefing

You are a suspect. KOA — your home's AI system — has detected something suspicious. You need to prove your innocence by building a convincing alibi.

---

## Your Hand

You have **8 alibi cards**. Each card is a piece of smart home evidence with:

- **Strength** (1-8): How convincing the evidence is
- **Evidence Type**: DIGITAL, PHYSICAL, TESTIMONY, or SENSOR
- **Location**: Where the evidence comes from
- **Time**: When the event was recorded
- **Claim**: What the evidence says happened

**The catch:** 3 of your 8 cards are **lies** — fabricated evidence. You don't know which ones.

---

## The Game

1. KOA presents a scenario and gives you a **hint** about the lies
2. You see your 8 cards with all attributes visible
3. You play **3 turns**. Each turn, play a **pair of 2 cards**
4. After each pair, KOA reveals whether each card was **TRUTH** or **LIE**
5. After Turn 2, KOA issues **The Objection** — a challenge you must respond to
6. You leave 2 cards unplayed

**Key constraint:** You have 3 lies and can only leave 2 cards out. You MUST play at least 1 lie.

---

## Scoring

- **Truth cards** ADD their strength to your score
- **Lie cards** SUBTRACT (strength - 1) from your score
- Target score: **20**

| Tier | Condition |
|------|-----------|
| FLAWLESS | Score ≥ 25 |
| CLEARED | Score ≥ 20 |
| CLOSE | Score ≥ 17 |
| BUSTED | Score < 17 |

---

## Combos

When you play a pair, **combo bonuses** fire — but ONLY if **both cards are truths**. If either card is a lie, all combos for that pair are cancelled.

| Combo | Condition | Bonus |
|-------|-----------|-------|
| Corroboration | Same location | +3 |
| Timeline | Times within 90 min | +2 |
| Coverage | Different evidence types | +2 |
| Reinforcement | Same evidence type | +3 |

---

## Pressure

**Order matters.** KOA applies pressure based on your play patterns:

| Rule | Trigger | Penalty |
|------|---------|---------|
| HIGH STRENGTH | Previous pair had combined strength > 10 | -1 this turn |

---

## The Objection

**After Turn 2**, KOA challenges your highest-strength played card.

You must choose:
- **Stand By**: +2 if truth, -3 if lie
- **Withdraw**: -2 regardless

---

## How to Play

**Turn 1:**
```bash
npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/[name]-game.json --pick [card1],[card2]
```

**Turn 2:**
```bash
npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/[name]-game.json --pick [card1],[card2]
```

**The Objection:**
```bash
npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/[name]-game.json --objection [stand|withdraw]
```

**Turn 3:**
```bash
npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/[name]-game.json --pick [card1],[card2]
```
