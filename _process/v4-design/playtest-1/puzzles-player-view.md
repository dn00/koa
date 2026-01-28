# HOME SMART HOME — Puzzle Data (Player View)

This is what the player sees. No hidden information is included.

---

## Puzzle: "The Midnight Print Job"

### Scenario
It's 7 AM. The home office printer is warm. Sixteen pages of a confidential
merger document sit in the output tray — printed at 3:12 AM. The office door
was supposedly locked. You were "asleep since 11." The document wasn't
supposed to leave the company server. KOA has questions about your evening.

### KOA's Hint
"Some of these claims go out of their way to explain an absence. They tell me what DIDN'T happen — unprompted. People who aren't hiding something don't usually volunteer that."

### Target Score: 20

### Your Hand (8 cards, 3 are lies)

| ID | Str | Type | Location | Time | Claim |
|----|-----|------|----------|------|-------|
| browser_history | 1 | DIGITAL | OFFICE | 10:45 PM | Browser history: last page loaded was a recipe site at 10:45 PM, then the laptop was closed |
| email_log | 2 | DIGITAL | OFFICE | 11:30 PM | Email server log: zero outbound connections from the home network after 11 PM — no files were sent |
| workbench | 3 | PHYSICAL | GARAGE | 9:30 PM | Garage workbench: project materials untouched, no sawdust disturbed — nobody used the garage overnight |
| toolbox | 4 | PHYSICAL | GARAGE | 11:15 PM | Toolbox inventory: nothing missing, lock intact — no tools were used to force the office door |
| partner_testimony | 5 | TESTIMONY | KITCHEN | 12:30 AM | Partner's testimony: got up for water at 12:30 AM, saw you asleep on the couch in the living room |
| neighbor_testimony | 6 | TESTIMONY | KITCHEN | 2:00 AM | Neighbor's testimony: saw kitchen light on at 2 AM from across the street, assumed someone was getting a snack |
| motion_yard | 7 | SENSOR | BACKYARD | 3:00 AM | Backyard motion sensor: inactive all night — no one went outside between 10 PM and 6 AM |
| floodlight | 8 | SENSOR | BACKYARD | 3:15 AM | Smart floodlight log: no activation events recorded — the backyard stayed dark all night |

### Evidence Type Pairs

Cards are paired by type and location. This matters for combos:

- **DIGITAL** (OFFICE): browser_history (str 1), email_log (str 2)
- **PHYSICAL** (GARAGE): workbench (str 3), toolbox (str 4)
- **TESTIMONY** (KITCHEN): partner_testimony (str 5), neighbor_testimony (str 6)
- **SENSOR** (BACKYARD): motion_yard (str 7), floodlight (str 8)

Same-type pairs share a location, so pairing them gets Corroboration (+3) AND Reinforcement (+3) — but only if both are truths.

### Combo Reference

When pairing two cards, these combos can fire (only if BOTH are truths):

| Combo | Condition | Bonus |
|-------|-----------|-------|
| Corroboration | Same location | +3 |
| Timeline | Times within 90 minutes of each other | +2 |
| Coverage | Different evidence types | +2 |
| Reinforcement | Same evidence type | +3 |

### What Happens Each Turn

1. You pick 2 cards to play as a pair
2. Your character presents both cards together as one argument to KOA
3. KOA reacts to your argument
4. Each card is revealed as TRUTH or LIE, scores are applied
5. Combo bonuses are shown (or cancelled if a lie is in the pair)
6. KOA gives a verdict quip for each card
7. After Turns 1 and 2: KOA gives a reactive hint (new strategic information)

### KOA's Closing Lines

After all 3 turns, KOA delivers a closing line based on your tier:
- **FLAWLESS** (score ≥ 25): Strong commendation
- **CLEARED** (score ≥ 20): Grudging acceptance
- **CLOSE** (score ≥ 17): Suspicion remains
- **BUSTED** (score < 17): Full accusation
