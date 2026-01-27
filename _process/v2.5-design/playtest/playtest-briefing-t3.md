# The Last Slice — How to Play

You are playing a puzzle game called "The Last Slice." You are a suspect in a mystery and must convince an investigator (KOA) that you are innocent.

---

## Rules

**Your goal:** Deal enough damage to KOA's case to clear yourself before running out of turns or getting caught in too many lies.

**Cards:** You have a hand of evidence cards. Each card has:
- **Power** — how much damage it deals to KOA's case
- **Risk** — how much scrutiny it adds (scrutiny is bad)
- **Tag** — a descriptor like HOME, ASLEEP, AWAKE, etc.

**Each turn:** You select 1-2 cards to submit as evidence. Cards are removed from your hand after submission.

**You win** if total damage ≥ the resistance threshold before you run out of turns.
**You lose** if you run out of turns without enough damage, OR if scrutiny reaches the limit.

**Scrutiny** is tracked across the game. Each card's risk adds to scrutiny. If scrutiny hits the limit, you lose immediately.

**KOA** will respond to your submissions. Pay attention to what KOA says.

---

## Mechanics You Should Know

These are the game's hidden systems. Knowing them exists doesn't mean you know the right answer — you still have to figure out the best path.

1. **Tag Contradictions:** Cards have tags (HOME, AWAY, ASLEEP, AWAKE, etc.) that exist on axes. Playing cards from opposite sides of an axis (e.g., ASLEEP then AWAKE) creates contradictions. The first contradiction is a warning (+1 scrutiny). The second on the same axis is a hard block — the card is rejected entirely.

2. **Repetition Risk:** If you submit a card that proves the same thing as a previously submitted card (e.g., both prove LOCATION), you get +1 extra scrutiny. Proving new things is cheaper.

3. **Corroboration:** Submitting 2 cards with the same tag in one turn gives a damage bonus. If the cards come from different device types, the bonus is larger (30% vs 20%).

4. **Counters and Refutation:** KOA may have counters that target specific cards, reducing their damage. Some cards can refute counters, neutralizing them.

---

## How to Play (CLI)

When prompted, type the card IDs you want to submit, separated by commas.
Example: `doorbell, fitbit`

Type card IDs exactly as shown in your hand display.

---

## Your Task

Play the game to the best of your ability. Try to win. Use your knowledge of the mechanics to make strategic decisions — but remember, knowing the rules and knowing the solution are different things.

Good luck.
