# V5 Agent Briefing — The Midnight Print Job

You are playtesting "Home Smart Home" — a daily puzzle game where you convince a smart home AI (KOA) that you're innocent.

---

## Scenario

7:03 AM. The home office printer is still warm.
Sixteen pages of a VERY confidential merger document sit in the output tray.
Printed at 3:12 AM. From YOUR laptop. While you were "definitely asleep."

KOA's status light turns red.

**Your goal:** Present evidence to raise KOA's Belief meter from 50 to 70.

---

## Rules

### Evidence Cards
You have 6 evidence cards. You must play exactly 3 (one per turn), leaving 3 unplayed.

Each card has:
- **Strength**: How much Belief it's worth if solid (1-5)
- **Risk**: Visible pips showing reliability
  - ⚠ (risk 1): Solid evidence → +strength Belief
  - ⚠⚠ (risk 2): Shaky evidence → +strength -2 Belief (net: strength-2)
  - ⚠⚠⚠ (risk 3): Contradiction → -(strength-1) Belief (negative!)

### Turns
- Turn 1: Play one card
- Turn 2: Play one card → SCRUTINY follows
- Turn 3: Play one card → Final verdict

### Scrutiny (after Turn 2)
KOA challenges your last played card. You must:
- **Stand by**: If card is solid/shaky, +3 Belief. If contradiction, -5 Belief.
- **Withdraw**: -2 Belief regardless.

### Tactic (One-time Use)
Today's tactic: **Probe**
- Reveal if one card would contradict before playing it.
- Use once per game.

### Winning
- FLAWLESS: Belief ≥ 85
- CLEARED: Belief ≥ 70 (target)
- CLOSE: Belief ≥ 55
- BUSTED: Belief < 55

---

## Your Evidence

| ID | Risk | Str | Type | Location | Time | Claim |
|----|------|-----|------|----------|------|-------|
| browser_history | ⚠ | 4 | DIGITAL | OFFICE | 10:45 PM | Browser history shows Netflix streaming until 10:45 PM |
| smart_lock | ⚠ | 5 | SENSOR | FRONT_DOOR | 9:30 PM | Smart lock: front door locked at 9:30 PM, no unlock until 7 AM |
| partner_testimony | ⚠⚠ | 4 | TESTIMONY | BEDROOM | 11:00 PM | Partner confirms you were in bed by 11 PM |
| motion_hallway | ⚠⚠ | 3 | SENSOR | HALLWAY | 2:30 AM | Hallway motion sensor triggered at 2:30 AM — bathroom trip |
| email_draft | ⚠⚠⚠ | 4 | DIGITAL | OFFICE | 11:30 PM | Email draft saved at 11:30 PM shows late-night work activity |
| printer_queue | ⚠⚠⚠ | 3 | DIGITAL | OFFICE | 3:00 AM | Printer queue shows document sent from your laptop at 3 AM |

---

## Strategy Notes

1. **Risk 3 cards (⚠⚠⚠) are dangerous** — they contradict and cost you points.
2. **Risk 1 cards (⚠) are safest** — full strength, no penalty.
3. **Scrutiny is a gamble** — standing by a solid card gives +3, but standing by a contradiction gives -5.
4. **Use Probe wisely** — it can reveal if a risky card would contradict.

---

## Commands

To play, output JSON actions:

```json
{"action": "pick", "cardId": "browser_history"}
```

For tactic:
```json
{"action": "tactic", "type": "probe", "target": "email_draft"}
```

For scrutiny:
```json
{"action": "scrutiny", "choice": "stand"}
```
or
```json
{"action": "scrutiny", "choice": "withdraw"}
```

---

## Your Task

Play through the puzzle. After each action, you'll receive game state in JSON.

Report your reasoning for each decision. At the end, evaluate:
1. Was the puzzle solvable? (Can you reach 70 without contradictions?)
2. Did you feel informed or blind?
3. Were any cards "obviously safe" or "obviously dangerous"?
4. Rate difficulty: too easy / just right / too hard
