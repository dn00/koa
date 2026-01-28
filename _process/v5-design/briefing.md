# HOME SMART HOME — Player Briefing

You are a suspect. KOA — your home's AI system — has detected something suspicious. You need to prove your innocence by building a convincing alibi.

---

## Your Hand

You have **8 evidence cards**. You'll play 6 and leave 2 unplayed. Each card is a piece of smart home data with:

- **Strength** (1-5): How convincing the evidence is
- **Risk** (1-3 pips): How shaky the evidence looks to KOA
- **Type**: DIGITAL, PHYSICAL, TESTIMONY, or SENSOR
- **Location**: Where the evidence comes from
- **Time**: When the event was recorded
- **Claim**: What the evidence says happened

**Risk levels:**
- ⚠ (1 pip): Solid — KOA accepts this
- ⚠⚠ (2 pips): Shaky — might contradict something
- ⚠⚠⚠ (3 pips): Suspicious — likely contradicts KOA's knowledge

---

## The Game

1. KOA announces her **stance** — what she's suspicious about today
2. You see your 6 cards with all attributes visible (including risk)
3. You play **3 turns**. Each turn, submit **2 cards**
4. You have **one tactic** to use once during the game
5. After each turn, KOA reacts and your **Belief meter** updates
6. After Turn 2, KOA runs a **System Check** on your last card
7. Target: Push KOA's Belief to **70** or higher

---

## Belief

Your goal is to raise KOA's Belief in your alibi.

- **Low-risk cards** (1 pip): Add their strength to Belief
- **Medium-risk cards** (2 pips): Add strength, but may trigger doubt (-2)
- **High-risk cards** (3 pips): Trigger contradiction — subtract strength from Belief

When you submit a pair:
- Both cards' effects apply
- If both are low-risk and share an attribute (location, type, or time window), you get a **+2 Corroboration bonus**

---

## Today's Tactic

Each day, everyone gets the same tactic. Use it **once** at any turn.

| Tactic | Effect |
|--------|--------|
| **Probe** | Before submitting, reveal whether one card would contradict |
| **Bolster** | Double your Belief gain this turn (but double loss if contradiction) |
| **Deflect** | Cancel one contradiction penalty this turn |

---

## KOA System Check (Flag)

**After Turn 2**, KOA flags one of your submitted cards for review.

You must choose:
- **Keep on Record** (stand by): +3 Belief if it was low-risk, -5 if it contradicted
- **Roll Back** (withdraw): -2 Belief regardless

---

## Verdict Tiers

| Tier | Belief |
|------|--------|
| FLAWLESS | ≥ 85 |
| CLEARED | ≥ 70 |
| CLOSE | ≥ 55 |
| BUSTED | < 55 |

---

## How to Play

**Turn 1:**
```bash
npx tsx scripts/play-v5.ts --puzzle [slug] --state /tmp/[name]-game.json --pick [card1],[card2]
```

**Turn 2:**
```bash
npx tsx scripts/play-v5.ts --puzzle [slug] --state /tmp/[name]-game.json --pick [card1],[card2]
```

**Use Tactic (optional, any turn):**
```bash
npx tsx scripts/play-v5.ts --puzzle [slug] --state /tmp/[name]-game.json --tactic [probe|bolster|deflect] --target [card_id]
```

**System Check (KOA Flag):**
```bash
npx tsx scripts/play-v5.ts --puzzle [slug] --state /tmp/[name]-game.json --objection [stand|withdraw]
```

**Turn 3:**
```bash
npx tsx scripts/play-v5.ts --puzzle [slug] --state /tmp/[name]-game.json --pick [card1],[card2]
```
