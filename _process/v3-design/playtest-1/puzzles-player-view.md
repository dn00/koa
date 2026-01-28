# HOME SMART HOME — Puzzle Data (Player View)

This is what the player sees. No hidden information is included.

---

## Puzzle 1: "The Power Outage"

### Scenario
The breaker tripped at 9:14 PM. The whole house went dark for eleven minutes.
Your gaming PC — mid-ranked-match — did not survive. Someone was in the basement.
You say you were upstairs the entire evening. KOA has questions.

### KOA's Hint
"One of the lies claims something happened after 11 PM. The other one? You're on your own."

### Target Score: 5

### Your Hand (6 cards, 2 are lies)

| ID | Str | Location | Time | Source | Claim |
|----|-----|----------|------|--------|-------|
| doorbell | 4 | FRONT_DOOR | 7:00 PM | DOORBELL | Doorbell cam: you arrived home at 7 PM, no one else entered |
| wifi_log | 3 | BASEMENT | 8:30 PM | ROUTER | Router log: your gaming PC was online in the basement until 9:14 PM — then nothing |
| fitbit | 3 | BEDROOM | 11:45 PM | FITBIT | Fitbit: heart rate dropped to resting by 11:45 PM — you were asleep |
| thermostat | 2 | BEDROOM | 9:00 PM | THERMOSTAT | Thermostat: bedroom set to night mode at 9 PM, no adjustments after |
| breaker_log | 5 | BASEMENT | 11:15 PM | SMART_BREAKER | Smart breaker log: breaker was manually reset from the panel at 11:15 PM |
| motion_base | 4 | BASEMENT | 11:30 PM | MOTION_SENSOR | Basement motion sensor: all-clear, no movement detected after 11 PM |

### Narrations (what your character says when playing each card)

- **doorbell:** "I got home at 7. Check the doorbell cam — nobody else came in after me. It was just me all night."
- **wifi_log:** "My PC was online until the power killed it at 9:14. After that, nothing. The router proves it."
- **fitbit:** "Check my Fitbit. Heart rate dropped to resting by 11:45. I was asleep. End of story."
- **thermostat:** "The thermostat went to night mode at 9. Nobody touched it after. I was in bed."
- **breaker_log:** "The breaker got reset at 11:15 — the smart panel logged it. That wasn't me. It reset itself."
- **motion_base:** "The basement sensor says all-clear. No movement after 11. Nobody went down there."

### KOA's Reactive Hints (shown after Turn 1, depends on which card you played)

- **doorbell:** "Front door is clean. KOA is still thinking about the rest."
- **wifi_log:** "The router log? KOA checked — that data was fabricated. One down. The other lie? It's after 11 PM."
- **fitbit:** "Your sleep data is clean. But someone was awake — and they left traces in more than one room."
- **thermostat:** "Bedroom checks out. But this house has more rooms than you'd like."
- **breaker_log:** "The breaker log is a fake. One down — the other lie? It's not after 11 PM. Check your earlier alibis."
- **motion_base:** "The basement sensor is honest. But not everything that claims to be from down there is."

### KOA's Verdict Quips (what KOA says after revealing Truth or Lie)

| Card | If TRUTH | If LIE |
|------|----------|--------|
| doorbell | "Doorbell cam doesn't lie. Unlike some of these other devices." | "The doorbell? You faked your own arrival time? Bold." |
| wifi_log | "Router logs are boring. Boring is good. Boring means honest." | "The router doesn't lie — oh wait. It literally just did." |
| fitbit | "Your heart rate says innocent. KOA accepts this. Grudgingly." | "Fitbit says you were sleeping? Your fitbit is a liar." |
| thermostat | "Thermostat checks out. The bedroom was cozy and honest." | "Night mode at 9 PM, no adjustments? KOA has adjustments. To your credibility." |
| breaker_log | "The breaker log holds up. Someone's telling the truth down there." | "Manually reset at 11:15 PM? The breaker was never touched. Nice try." |
| motion_base | "Basement was quiet. Good. That's one less room KOA has to worry about." | "All-clear in the basement? The basement DISAGREES. Loudly." |

### KOA's Closing Lines

- **FLAWLESS:** "Every alibi checks out. Not a single lie. Your gaming PC died for nothing. Go back to bed."
- **CLEARED:** "Fine. Your story holds. But someone was in that basement — and the breaker didn't trip itself."
- **CLOSE:** "Almost convincing. Almost. The basement still has questions."
- **BUSTED:** "The basement has more stories than a library. And half of them don't check out."

---

## Puzzle 2: "The Thermostat War"

### Scenario
It's August. The energy bill just hit $412. Someone cranked the thermostat to 85°F at 2 AM.
The cat has been blamed. The cat weighs six pounds and does not have opposable thumbs.
You were "sleeping." KOA would like a word.

### KOA's Hint
"One of the lies is trying too hard to explain why nothing happened. The other one isn't."

### Target Score: 7

### Your Hand (6 cards, 2 are lies)

| ID | Str | Location | Time | Source | Claim |
|----|-----|----------|------|--------|-------|
| phone | 1 | BEDROOM | 1:00 AM | PHONE | Phone screen time: zero activity from 12:30 AM onward |
| smartwatch | 3 | BEDROOM | 2:15 AM | SMARTWATCH | Smartwatch: sleep tracking shows unbroken light sleep at 2:15 AM |
| doorbell | 4 | FRONT_DOOR | 12:30 AM | DOORBELL | Doorbell cam: front hallway empty, no one passed after 12:30 AM |
| light_lr | 5 | LIVING_ROOM | 1:45 AM | LIGHT_SENSOR | Living room light sensor: ambient light unchanged — no one turned on a lamp |
| motion_lr | 4 | LIVING_ROOM | 2:00 AM | MOTION_SENSOR | Living room motion sensor: no presence detected between 1 AM and 3 AM |
| temp_lr | 3 | LIVING_ROOM | 1:50 AM | TEMP_SENSOR | Living room temp sensor: thermostat adjustment came from the scheduled program, not manual input |

### Narrations

- **phone:** "My phone was dead to the world after 12:30. Zero screen time. I wasn't up scrolling — I was sleeping."
- **smartwatch:** "My watch tracked my sleep. Unbroken light sleep at 2:15 AM. I didn't get up. I didn't touch the thermostat."
- **doorbell:** "The hallway was empty after 12:30. Doorbell cam saw nothing. Nobody walked to the living room."
- **light_lr:** "The living room was dark all night. Light sensor confirms it — no lamps, no screens, no one in there."
- **motion_lr:** "The motion sensor in the living room saw nothing between 1 and 3 AM. The room was empty. Ask the sensor."
- **temp_lr:** "The thermostat change was scheduled. It's a program — it does that. Nobody got up to crank it to 85."

### KOA's Reactive Hints

- **phone:** "Phone was off. Noted. KOA has other things to think about tonight."
- **smartwatch:** "Sleep tracking data? Fabricated. One lie found. The other? It's a sensor in the living room."
- **doorbell:** "Nobody came in. So whoever did this was already here. Interesting night."
- **light_lr:** "The light sensor is honest. But not every sensor in this house is — and I'm not just talking about the living room."
- **motion_lr:** "The motion sensor lied. One down. The other lie? It's not in the living room. Check what was on your person."
- **temp_lr:** "The temp sensor is clean. One living room device cleared — but KOA suspects something personal is off."

### KOA's Verdict Quips

| Card | If TRUTH | If LIE |
|------|----------|--------|
| phone | "Phone was off. KOA respects a good night's sleep. Allegedly." | "Zero screen time? KOA checked. That was a lie. Put the phone down." |
| smartwatch | "Unbroken sleep. Your wrist doesn't lie. Unlike some rooms in this house." | "Light sleep at 2:15? Your watch begs to differ. So does KOA." |
| doorbell | "Empty hallway. Nobody came in. Which means whoever did this was already here." | "The doorbell cam lied? That's a first. Usually it just judges your delivery habits." |
| light_lr | "No lamps. The living room was dark and honest. KOA approves." | "Ambient light unchanged? Someone was in there with the lights OFF. Sneaky. Wrong, but sneaky." |
| motion_lr | "No motion in the living room. Good. Clean. KOA likes clean." | "No presence detected? KOA detected LIES. The motion sensor is a fraud." |
| temp_lr | "Scheduled program. Boring. Trustworthy. KOA accepts." | "A scheduled program set itself to 85 at 2 AM. KOA is not an idiot." |

### KOA's Closing Lines

- **FLAWLESS:** "Your alibis are airtight. The cat remains a suspect. The cat has no comment."
- **CLEARED:** "Fine. Your sleep data checks out. But KOA is adjusting the thermostat back to 72. Permanently."
- **CLOSE:** "Your story has holes. The living room has questions. And something personal doesn't add up."
- **BUSTED:** "$412. Six pounds of cat. Zero credibility. KOA is turning off the heat entirely."

---

## Puzzle 3: "The Hot Tub Incident"

### Scenario
It's 6 AM. The back deck is flooded — two inches of standing water, hot tub cover off.
The water damage estimate is $2,200. You were "in bed the whole time."
Someone was out there. KOA is not amused.

### KOA's Hint
"One of the lies flat-out denies something happened. It protests too much. The other one? Subtler."

### Target Score: 8

### Your Hand (6 cards, 2 are lies)

| ID | Str | Location | Time | Source | Claim |
|----|-----|----------|------|--------|-------|
| fitbit | 2 | BEDROOM | 3:15 AM | FITBIT | Fitbit: REM sleep cycle logged continuously from 1 AM to 5 AM |
| thermostat | 3 | HALLWAY | 1:00 AM | THERMOSTAT | Thermostat: hallway temp held steady at 71°F — consistent with all doors closed |
| water_meter | 3 | UTILITY | 3:30 AM | WATER_METER | Water meter: baseline 0.2 gal/hr recorded through the night |
| spa_pump | 5 | DECK | 3:00 AM | SMART_PUMP | Smart pump log: no pump activation recorded after scheduled shutdown at 10 PM |
| smart_lock | 4 | BACK_DOOR | 2:45 AM | SMART_LOCK | Back door smart lock: zero unlock events recorded between 10 PM and 6 AM |
| motion_hall | 5 | HALLWAY | 3:10 AM | MOTION_SENSOR | Hallway motion sensor: no movement detected toward back of house overnight |

### Narrations

- **fitbit:** "I was in REM sleep from 1 to 5 AM. Four straight hours. My Fitbit logged every cycle. I didn't move."
- **thermostat:** "The hallway held at 71 all night. If someone opened the back door, you'd see a temp drop. You don't."
- **water_meter:** "The water meter shows 0.2 gallons per hour all night. That's baseline. If the tub was running, you'd see a spike. There's no spike."
- **spa_pump:** "The pump shut down at 10 PM on schedule. No activations after that. Whatever happened on the deck, the pump didn't see it."
- **smart_lock:** "The back door didn't open once. Zero unlock events from 10 PM to 6 AM. Nobody went outside. Period."
- **motion_hall:** "The hallway sensor didn't pick up anything. No one walked toward the back of the house. Not me, not anyone."

### KOA's Reactive Hints

- **fitbit:** "REM sleep confirmed. But KOA isn't done with this house yet. Not even close."
- **thermostat:** "Hallway temp held steady. Good for you. KOA's still looking at the bigger picture."
- **water_meter:** "Baseline water usage? With a flooded deck? KOA doesn't buy it. One lie found — and someone on that deck is protesting too loudly."
- **spa_pump:** "No pump activity after 10 PM? The deck says otherwise. One lie found — the other isn't a denial. It's a record that quietly doesn't add up."
- **smart_lock:** "The lock is honest. Nobody used the door. But the damage happened anyway — and one device is lying about the evidence."
- **motion_hall:** "No movement in the hallway. Noted. But the real question isn't who walked — it's what the utilities recorded."

### KOA's Verdict Quips

| Card | If TRUTH | If LIE |
|------|----------|--------|
| fitbit | "REM cycles don't lie. You were asleep. The hot tub was not." | "REM sleep from 1 to 5? Your fitbit just perjured itself." |
| thermostat | "Doors stayed closed, temp held steady. Your hallway is innocent. Your deck is not." | "All doors closed, 71 degrees? Then explain the flood. KOA will wait." |
| water_meter | "Baseline water usage. Consistent. Honest. Unlike your back deck." | "0.2 gallons per hour? The deck is underwater. Math isn't your strong suit." |
| spa_pump | "Pump log checks out. No activations after 10 PM. Someone else isn't telling the truth." | "No pump activation after 10 PM? The flooded deck would like a word. So would KOA." |
| smart_lock | "Zero unlocks. The back door stayed shut. So how did someone get to the deck...?" | "Zero unlock events? The back door is lying. Someone went outside. KOA knows." |
| motion_hall | "No hallway movement. Clean. But the deck didn't flood itself." | "No movement toward the back of the house? KOA disagrees. Someone walked." |

### KOA's Closing Lines

- **FLAWLESS:** "Every alibi checks out. You told nothing but the truth. $2,200 in damages, though. KOA is billing you anyway."
- **CLEARED:** "Your story holds. But someone turned on that hot tub, and KOA doesn't forget."
- **CLOSE:** "Almost. But 'almost' doesn't fix the deck. KOA is watching."
- **BUSTED:** "The deck is underwater. One device said everything was fine. The flood disagrees."
