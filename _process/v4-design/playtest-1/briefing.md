# HOME SMART HOME — "The Statement" (V4 Pair Play) — Player Briefing

**Home Smart Home is a daily puzzle game** — like Wordle, you get one new puzzle each day. Each puzzle is a self-contained 5-10 minute experience. Today is your first day.

You are a suspect. KOA — your home's AI system — has detected something suspicious. You need to prove your innocence by building a convincing alibi.

---

## How It Works

You have **8 alibi cards**. Each card is a piece of smart home evidence — a sensor log, a testimony, a digital record, a physical trace. Each card has:

- **Strength** (1-8): How convincing the evidence is
- **Evidence Type**: DIGITAL, PHYSICAL, TESTIMONY, or SENSOR
- **Location**: Where the evidence comes from
- **Time**: When the event was recorded
- **Claim**: What the evidence says happened

**The catch:** 3 of your 8 cards are **lies** — fabricated evidence that looks real. You don't know which ones.

---

## The Game

1. KOA presents a scenario and gives you a **hint** about the lies
2. You see your 8 cards with all attributes visible
3. You play **3 turns**. Each turn, you play a **pair of 2 cards** — presenting them together as one combined argument
4. After each pair, KOA reacts to your argument, then reveals whether each card was **TRUTH** or **LIE**
5. After Turn 1 and Turn 2, KOA gives you a **reactive hint** — new information based on what you played
6. You leave 2 cards unplayed

**Key constraint:** You have 3 lies and can only leave 2 cards out. You are **forced to play at least 1 lie**. The question is: which lies do you dodge, and how do you minimize the damage from the one you must play?

---

## Scoring

- **Truth cards** ADD their strength to your score
- **Lie cards** SUBTRACT **(strength - 1)** from your score — even a lie has some truth in it
- You need to reach the **target score** to be cleared

---

## Combo Bonuses

When you play a pair of 2 cards, **combo bonuses** can fire — but ONLY if **both cards in the pair are truths**. If either card is a lie, all combos for that pair are cancelled.

| Combo | Condition | Bonus |
|-------|-----------|-------|
| Corroboration | Same location | +3 |
| Timeline | Times within 90 minutes | +2 |
| Coverage | Different evidence types | +2 |
| Reinforcement | Same evidence type | +3 |

Multiple combos can fire on the same pair. A pair of same-type, same-location truths with adjacent times could earn +3 +3 +2 = +8 bonus.

**This is the core risk/reward:** Pairing cards that share attributes gives you combo bonuses — but if one of them is a lie, you get nothing AND eat the penalty. The cards that combo best might include a lie.

---

## Tiers

| Tier | Condition |
|------|-----------|
| FLAWLESS | Score ≥ target + 5 |
| CLEARED | Score ≥ target |
| CLOSE | Score ≥ target - 3 |
| BUSTED | Score < target - 3 |

---

## Tips

- Use KOA's opening **hint** to think about which cards might be lies
- **Pair strategically:** Cards with matching attributes can earn combo bonuses, but a lie in the pair cancels everything
- Leave out the cards you suspect are lies — you can dodge 2 of the 3
- The **reactive hint** after Turns 1 and 2 gives you new information — use it
- A lie costs **(strength - 1)** points. A high-strength lie is devastating; a low-strength lie is manageable. If you must play a lie, try to make it a weak one
- **Pairing 2 lies together** contains the damage to one turn — the other two turns can earn full combos

---

## What You'll See

When you play a pair, your character presents both cards as one combined argument to KOA. Then KOA reacts to your argument before revealing the truth.

Example:
```
YOU: "My partner saw me asleep on the couch around twelve-thirty. And the
hallway camera shows nobody walked past it. I was in bed. Check the footage."

KOA: "A witness and a camera. Two systems telling the same story. That's
harder to fake."

[partner_testimony] -> TRUTH (+5)
[hallway_cam] -> TRUTH (+4)

COMBOS:
  Corroboration +3 (Same location: HALLWAY)
  Coverage +2 (Different types: TESTIMONY + SENSOR)
Pair total: +14
```

---

*Session structure, puzzle assignments, think-aloud instructions, and survey are provided separately in the playtest prompt.*
