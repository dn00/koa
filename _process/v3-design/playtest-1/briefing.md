# HOME SMART HOME — "The Statement" — Player Briefing

**Home Smart Home is a daily puzzle game** — like Wordle, you get one new puzzle each day. Each puzzle is a self-contained 3-5 minute experience. Today is your first day.

You are a suspect. KOA — your home's AI system — has detected something suspicious. You need to prove your innocence.

---

## How It Works

You have **6 alibi cards**. Each card is a piece of smart home evidence — a doorbell recording, a sensor log, a fitness tracker reading. Each card has:

- **Strength** (1-5): How convincing the evidence is
- **Location**: Where the device is (BEDROOM, BASEMENT, LIVING_ROOM, etc.)
- **Time**: When the event was recorded
- **Source**: Which device produced the evidence
- **Claim**: What the evidence says happened

**The catch:** 2 of your 6 cards are **lies** — fabricated evidence that looks real. You don't know which ones.

---

## The Game

1. KOA presents a scenario and gives you a **hint** about the lies (e.g., what they have in common)
2. You see your 6 cards with all attributes visible
3. You play **1 card per turn** for **3 turns**
4. After each play, KOA reveals whether your card was **TRUTH** or **LIE**
5. After Turn 1, KOA gives you a **reactive hint** based on what you played — this is new information

---

## Scoring

- **Truth cards** ADD their strength to your score
- **Lie cards** SUBTRACT **(strength - 1)** from your score — even a lie has some truth in it
- You need to reach the **target score** to be cleared

---

## Tiers

| Tier | Condition |
|------|-----------|
| FLAWLESS | Reached target with 0 lies played |
| CLEARED | Reached target (may have played a lie) |
| CLOSE | Within 2 points of target |
| BUSTED | Below target by more than 2 |

---

## Tips

- Use KOA's opening **hint** to think about which cards might be lies
- **Your Turn 1 choice determines what KOA reveals.** Play a card KOA is watching — she'll tell you more. Play it safe — she might not.
- The reactive hint gives you NEW information to help with Turns 2 and 3
- A lie costs you **(strength - 1)** points, not the full strength — so a risky probe won't always end your run

---

## What You'll See

When you play a card, your character "speaks" — narrating the evidence to KOA in their own words. Then KOA responds with a verdict and commentary.

Example:
```
YOU: "The garage was locked all night. Check the smart lock — nobody opened it."

[garage_lock] -> TRUTH
Score: +3 -> 3

KOA: "Locked tight. Good. But locks aren't the only way in."
```

---

*Session structure, puzzle assignments, think-aloud instructions, and survey are provided separately in the playtest prompt.*
