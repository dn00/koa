# V5 Scenario Seeds — Next 100 Daily Incidents

**Purpose:** Lightweight scenario list for future V5 micro‑daily puzzles.  
Each seed encodes: a slug, a short incident hook, KOA’s stance line, and design notes (axes + lie flavors) informed by V5 playtest surveys.

- **Axes:** timeline, location, channel (evidence type reliance), plausibility, social (people), intention.  
- **Lie flavors:** direct (fact vs claim), relational (card vs card), self‑incriminating, implausible_timeline, suspicious_specificity.

These are **not full puzzles** — they’re prompts + metadata for later LLM puzzle generation and hand‑tuning.

For scheduling, each seed can also be tagged with a **default difficulty** and **typical day slot** type:

- Difficulty: `easy` / `standard` / `hard` (as defined in `v5-daily-rotation.md`)  
- Typical day slot: `Mon-easy`, `Tue-standard`, `Wed-standard`, `Thu-standard`, `Fri-hard`, `Sat-standard`, `Sun-easy/standard`

Below, each scenario lists:
- Axes and lie flavors (design hints), and  
- A suggested difficulty + rotation slot (which can be overridden by the generator/scheduler).

---

## Kitchen / Food / Nighttime

1. `midnight-fridge-raid-2`  
   - Hook: KOA logs refrigerator door and motion at 2:14 AM; you claim you slept through the night.  
   - KOA stance: “Tonight I’m watching late‑night kitchen traffic.”  
   - Axes: timeline, location. Lie flavors: direct + self‑incriminating.
   - Difficulty: easy. Typical slot: Mon‑easy.

2. `thermostat-war-night`  
   - Hook: The smart thermostat shows dramatic temperature swings between 1–3 AM; you insist you never left bed.  
   - KOA stance: “I’m skeptical of ‘set and forget’ thermostat stories.”  
   - Axes: timeline, channel (SENSOR vs TESTIMONY). Lie flavors: direct + relational.
   - Difficulty: standard. Typical slot: Tue‑standard.

3. `smart-oven-preheat`  
   - Hook: Oven preheat logged at 11:58 PM; you told KOA you finished cooking by 10:30.  
   - KOA stance: “Tonight I’m tracking heat signatures in the kitchen.”  
   - Axes: timeline, plausibility. Lie flavors: direct + suspicious_specificity.
   - Difficulty: standard. Typical slot: Wed‑standard.

4. `dishwasher-coverup`  
   - Hook: Dishwasher started at 3:05 AM; you claim the last thing you did was lock up at midnight.  
   - KOA stance: “I’m wary of chores that run themselves at 3 AM.”  
   - Axes: timeline, channel. Lie flavors: direct + self‑incriminating.
   - Difficulty: standard. Typical slot: Thu‑standard.

5. `fridge-door-left-open`  
   - Hook: KOA detected the fridge door ajar for 12 minutes; you say you only grabbed water.  
   - KOA stance: “Today I’m scrutinizing your ‘just a quick sip’ stories.”  
   - Axes: plausibility, sensor coherence. Lie flavors: relational + implausible_timeline.
   - Difficulty: hard. Typical slot: Fri‑hard.

6. `pantry-camera-blindspot`  
   - Hook: Pantry camera goes offline right when snacks disappear; you blame a glitch.  
   - KOA stance: “I’m watching for conveniently timed camera outages.”  
   - Axes: channel, plausibility. Lie flavors: suspicious_specificity + self‑incriminating.
   - Difficulty: standard. Typical slot: Sat‑standard.

7. `coffee-maker-dawn`  
   - Hook: Coffee maker auto‑brew logs fire at 4:30 AM; you say you woke at 6.  
   - KOA stance: “I’m comparing your wake‑up story to caffeine patterns.”  
   - Axes: timeline, channel. Lie flavors: direct + relational.
   - Difficulty: easy. Typical slot: Sun‑easy/standard.

8. `microwave-midnight-snack`  
   - Hook: Microwave usage at 2:07 AM; you claim the beep was the neighbor’s.  
   - KOA stance: “Tonight I’m separating your pings from everyone else’s.”  
   - Axes: timeline, location, plausibility. Lie flavors: direct + suspicious_specificity.

9. `guilty-garbage-chute`  
   - Hook: Trash sensor shows a late‑night drop; you insist you took it out before dinner.  
   - KOA stance: “I’m tracking your late‑night disposal habits.”  
   - Axes: timeline, location. Lie flavors: direct + self‑incriminating.

10. `smart-scale-2am`  
    - Hook: Bathroom scale has a 2:02 AM reading; you say you never left the bedroom.  
    - KOA stance: “Tonight I’m checking your footprint, literally.”  
    - Axes: timeline, location. Lie flavors: direct + implausible_timeline.

---

## Doors, Garage, Car, Driveway

11. `garage-door-reopened`  
    - Hook: Garage door cycles open/close at 2:18 AM; you claim you only checked it once at 10 PM.  
    - KOA stance: “I’m logging every move on the garage track tonight.”  
    - Axes: timeline, sensor coherence. Lie flavors: direct + relational.

12. `midnight-drive-2`  
    - Hook: Car leaves the driveway at 2:05 AM; you insist your keys stayed on the hook all night.  
    - KOA stance: “I’m skeptical of unattended key fobs when cars roll out.”  
    - Axes: timeline, channel, plausibility. Lie flavors: direct + self‑incriminating.

13. `ride-share-alibi`  
    - Hook: You claim you took a rideshare instead of the car; KOA has partial GPS + Wi‑Fi logs.  
    - KOA stance: “Tonight I’m comparing app receipts to physical movement.”  
    - Axes: channel, relational. Lie flavors: relational + suspicious_specificity.

14. `driveway-camera-mask`  
    - Hook: Driveway camera shows a hooded figure; you say it’s a neighbor borrowing tools.  
    - KOA stance: “I’m watching for unexplained driveway visitors.”  
    - Axes: plausibility, social. Lie flavors: self‑incriminating + suspicious_specificity.

15. `delivery-misuse`  
    - Hook: Package scanned as “received at door” at 1:10 AM; you say you were asleep and signed earlier.  
    - KOA stance: “I’m cross‑checking delivery logs against your bedtime claims.”  
    - Axes: timeline, channel. Lie flavors: direct + relational.

16. `garage-party`  
    - Hook: Garage speaker and lights stay on until 3 AM; you say the party ended by midnight.  
    - KOA stance: “I’m skeptical of parties that politely end exactly when you say they did.”  
    - Axes: timeline, sensor coherence, social. Lie flavors: direct + self‑incriminating.

17. `borrowed-car-cover`  
    - Hook: You claim you lent the car to a friend; KOA has only your devices on in‑car Bluetooth.  
    - KOA stance: “Tonight I’m distinguishing ‘borrowed’ from ‘you drove’ stories.”  
    - Axes: channel, plausibility, social. Lie flavors: relational + suspicious_specificity.

18. `bike-shed-snag`  
    - Hook: Motion near the bike shed at 2:40 AM; you say it was just wind and branches.  
    - KOA stance: “I’m comparing ‘wind’ excuses against motion sensor fidelity.”  
    - Axes: sensor coherence, plausibility. Lie flavors: implausible_timeline + self‑incriminating.

19. `gate-access-code`  
    - Hook: Front gate code used at 2:22 AM; you say only the dog sitter has that code.  
    - KOA stance: “I’m tracking who really knows your access codes.”  
    - Axes: social, channel. Lie flavors: relational + suspicious_specificity.

20. `parking-spot-swap`  
    - Hook: Driveway camera shows cars swapped overnight; you claim you never moved them.  
    - KOA stance: “I’m paying attention to your overnight parking choreography.”  
    - Axes: location, timeline. Lie flavors: direct + self‑incriminating.

---

## Bedroom, Sleep, Health, Wearables

21. `sleep-tracker-conflict`  
    - Hook: Sleep tracker says you were awake 1:45–2:10 AM; you insist on “solid sleep.”  
    - KOA stance: “Tonight I’m reconciling your sleep story with your own devices.”  
    - Axes: timeline, channel. Lie flavors: direct + relational.

22. `smart-pillbox`  
    - Hook: Pillbox opened at 2:05 AM; you say you took meds before midnight.  
    - KOA stance: “I’m watching your late‑night medication routine.”  
    - Axes: timeline, plausibility. Lie flavors: direct + suspicious_specificity.

23. `snoring-monitor`  
    - Hook: Bedroom microphone recorded snoring until 3 AM; you claim you were out on the porch.  
    - KOA stance: “I’m comparing your soundscape to your alibi.”  
    - Axes: location, sensor coherence. Lie flavors: direct + implausible_timeline.

24. `do-not-disturb-breach`  
    - Hook: You set Do Not Disturb but several alerts still fired; you blame KOA’s settings.  
    - KOA stance: “I’m investigating how ‘Do Not Disturb’ really played out.”  
    - Axes: channel, plausibility. Lie flavors: relational + suspicious_specificity.

25. `midnight-meditation`  
    - Hook: Meditation app logs a 20‑minute session at 2 AM; you say you never left sleep.  
    - KOA stance: “I’m looking closely at your supposed ‘calm night.’”  
    - Axes: timeline, channel. Lie flavors: direct + self‑incriminating.

26. `guest-bedroom-switch`  
    - Hook: Pressure sensors suggest someone slept in the guest bed; you say no one else was over.  
    - KOA stance: “I’m counting heads and mattresses.”  
    - Axes: social, location. Lie flavors: relational + suspicious_specificity.

27. `work-from-bed`  
    - Hook: Laptop wake and Wi‑Fi activity from bed at 2:30 AM; you insist you weren’t working late.  
    - KOA stance: “Tonight I’m tracking your ‘no late‑night work’ policy.”  
    - Axes: timeline, channel. Lie flavors: direct + self‑incriminating.

28. `window-open-alibi`  
    - Hook: Bedroom window open at 2:15 AM; you say the noise was from outside.  
    - KOA stance: “I’m checking how much of the night air is actually your doing.”  
    - Axes: location, plausibility. Lie flavors: relational + implausible_timeline.

29. `sleepover-secret`  
    - Hook: Extra body heat and motion in bedroom; you say you slept alone.  
    - KOA stance: “Tonight I’m quietly counting occupants.”  
    - Axes: social, sensor coherence. Lie flavors: relational + self‑incriminating.

30. `alarm-clock-edit`  
    - Hook: You claim you set an early alarm “just in case”; KOA has logs of repeated snoozes.  
    - KOA stance: “I’m comparing your responsible intentions to your snooze finger.”  
    - Axes: timeline, plausibility. Lie flavors: suspicious_specificity + direct.

---

## Work, Computer, Printer, Screens

31. `midnight-print-2`  
    - Hook: Printer warms and runs at 3:02 AM; you insist your laptop was shut down by 11.  
    - KOA stance: “Tonight I’m watching for ghost documents in the queue.”  
    - Axes: timeline, channel. Lie flavors: direct + self‑incriminating.

32. `home-office-vpn`  
    - Hook: VPN session from 1–2 AM; you say you weren’t working off‑hours.  
    - KOA stance: “I’m tracking your ‘I don’t work nights’ policy against your tunnels.”  
    - Axes: timeline, channel. Lie flavors: direct + relational.

33. `screen-time-cover`  
    - Hook: Living‑room TV binge until 2:40 AM; you claim you went to bed at midnight.  
    - KOA stance: “I’m correlating your screen light with your bedtime story.”  
    - Axes: timeline, location. Lie flavors: direct + suspicious_specificity.

34. `video-call-denial`  
    - Hook: KOA records camera and microphone on during a late video call; you claim you were muted/asleep.  
    - KOA stance: “I’m reviewing your supposedly ‘silent’ call.”  
    - Axes: channel, plausibility. Lie flavors: relational + self‑incriminating.

35. `file-upload-night`  
    - Hook: Large file upload at 3:10 AM; you say you sent everything before midnight.  
    - KOA stance: “I’m watching for data that sneaks out overnight.”  
    - Axes: timeline, channel. Lie flavors: direct + suspicious_specificity.

36. `projector-glow`  
    - Hook: Projector and blinds log suggest a late‑night movie; you insist you just “checked settings.”  
    - KOA stance: “I’m distinguishing ‘testing’ from ‘watching’ tonight.”  
    - Axes: plausibility, channel. Lie flavors: self‑incriminating + relational.

37. `shared-account-mixup`  
    - Hook: You blame a shared streaming profile for odd watch history; KOA has device/location traces.  
    - KOA stance: “I’m sorting your watch habits from everyone else’s.”  
    - Axes: social, channel. Lie flavors: relational + suspicious_specificity.

38. `smart-whiteboard`  
    - Hook: Whiteboard camera captures late‑night planning; you insist work stayed at the office.  
    - KOA stance: “I’m checking whether your brainstorming really ended when you said it did.”  
    - Axes: timeline, location. Lie flavors: direct + self‑incriminating.

39. `auto-save-draft`  
    - Hook: Email drafts saved at 1:50 AM; you claim you only reread them in the morning.  
    - KOA stance: “I’m comparing your writing schedule to your send schedule.”  
    - Axes: timeline, channel. Lie flavors: direct + relational.

40. `screen-mirror-party`  
    - Hook: You say you weren’t hosting; KOA saw multiple devices mirroring to the TV at 2 AM.  
    - KOA stance: “I’m counting screens as a proxy for guests.”  
    - Axes: social, channel. Lie flavors: self‑incriminating + suspicious_specificity.

---

## Guests, Neighbors, Social, Parties

41. `neighbor-complaint`  
    - Hook: Neighbor reports noise; KOA logs suggest quiet sensors but active chat devices.  
    - KOA stance: “I’m weighing the neighbor’s story against your hardware.”  
    - Axes: social, channel, plausibility. Lie flavors: relational + suspicious_specificity.

42. `uninvited-guest`  
    - Hook: Smart lock shows multiple unique guest codes; you claim no one else came over.  
    - KOA stance: “I’m skeptical of invisible visitors.”  
    - Axes: social, channel. Lie flavors: direct + relational.

43. `pet-sitter-cover`  
    - Hook: You blame the pet sitter for odd activity; KOA logs sitter’s arrival/departure.  
    - KOA stance: “Tonight I’m distinguishing your routine from your sitter’s.”  
    - Axes: social, timeline. Lie flavors: relational + suspicious_specificity.

44. `sleepover-denial`  
    - Hook: Guest bathroom, towels, and extra toothbrush use at 2 AM; you say no one slept over.  
    - KOA stance: “I’m quietly auditing your overnight guest policy.”  
    - Axes: social, sensor coherence. Lie flavors: self‑incriminating + direct.

45. `upstairs-footsteps`  
    - Hook: Upstairs motion + creaks at night; you insist everyone slept downstairs.  
    - KOA stance: “I’m tracking who really stays where.”  
    - Axes: location, social. Lie flavors: relational + implausible_timeline.

46. `party-curfew`  
    - Hook: You say guests left by midnight; KOA has late music volume and door usage.  
    - KOA stance: “I’m comparing your curfew story to exit logs.”  
    - Axes: timeline, channel, social. Lie flavors: direct + self‑incriminating.

47. `kids-sneak-out`  
    - Hook: Teen’s bedroom window sensors and backyard motion suggest a sneak‑out; you claim “everyone stayed in.”  
    - KOA stance: “I’m monitoring unauthorized adolescence tonight.”  
    - Axes: social, timeline, location. Lie flavors: relational + self‑incriminating.

48. `sleepover-parent-alibi`  
    - Hook: You claim your child slept at a friend’s; KOA sees their device bouncing off home Wi‑Fi all night.  
    - KOA stance: “I’m reconciling sleepover claims with actual signal.”  
    - Axes: social, channel. Lie flavors: direct + suspicious_specificity.

49. `building-hallway-drama`  
    - Hook: Apartment hallway camera shows someone outside your door; you deny any late‑night visitors.  
    - KOA stance: “I’m watching the hallway more closely than you think.”  
    - Axes: social, location. Lie flavors: direct + relational.

50. `rooftop-gathering`  
    - Hook: You say nobody went to the rooftop; KOA recorded door alarms and motion.  
    - KOA stance: “I’m tracking vertical movement tonight.”  
    - Axes: location, social. Lie flavors: direct + self‑incriminating.

---

## Pets, Yard, Outside, Environment

51. `dog-walk-denial`  
    - Hook: Backdoor and yard sensors show activity; you insist the dog held it all night.  
    - KOA stance: “I’m questioning your canine bladder claims.”  
    - Axes: plausibility, sensor coherence. Lie flavors: relational + self‑incriminating.

52. `sprinkler-suspicion`  
    - Hook: Sprinklers ran at an odd time; you say you didn’t tweak the schedule.  
    - KOA stance: “I’m checking who really touched the irrigation.”  
    - Axes: channel, timeline. Lie flavors: direct + suspicious_specificity.

53. `garden-visitor`  
    - Hook: Garden motion and soil disturbance; you claim it was just raccoons.  
    - KOA stance: “I’m distinguishing raccoons from humans tonight.”  
    - Axes: plausibility, sensor coherence. Lie flavors: relational + self‑incriminating.

54. `pool-night-swim`  
    - Hook: Pool lights and water sensors activate late; you insist no one swam.  
    - KOA stance: “I’m monitoring whether the pool really slept.”  
    - Axes: location, timeline. Lie flavors: direct + self‑incriminating.

55. `fire-pit-embers`  
    - Hook: KOA saw the fire pit warm longer than your claimed campfire time.  
    - KOA stance: “I’m reviewing ember timelines for safety… and honesty.”  
    - Axes: timeline, plausibility. Lie flavors: direct + suspicious_specificity.

56. `drone-flight`  
    - Hook: Drone telemetry at 2 AM; you say the drone stayed grounded.  
    - KOA stance: “I’m checking whether anything took off without a flight plan.”  
    - Axes: channel, timeline. Lie flavors: direct + self‑incriminating.

57. `garage-workbench`  
    - Hook: Power tools and workbench lights at odd hours; you deny late DIY.  
    - KOA stance: “I’m skeptical of ‘I finished that project days ago’ stories.”  
    - Axes: timeline, location. Lie flavors: direct + relational.

58. `spray-paint-tag`  
    - Hook: Strong VOC sensor spike in the garage; you claim it’s just cleaning supplies.  
    - KOA stance: “I’m matching smells to your projects.”  
    - Axes: plausibility, sensor coherence. Lie flavors: suspicious_specificity + self‑incriminating.

59. `roof-access`  
    - Hook: Ladder usage and roof motion; you say nobody went up there.  
    - KOA stance: “I’m tracking vertical curiosity tonight.”  
    - Axes: location, plausibility. Lie flavors: direct + relational.

60. `mailbox-mystery`  
    - Hook: Mailbox sensor triggered late; you say you collected mail earlier.  
    - KOA stance: “I’m auditing your mailbox trips.”  
    - Axes: timeline, location. Lie flavors: direct + self‑incriminating.

---

## Appliances, Utilities, Energy

61. `laundry-cycle`  
    - Hook: Washer/dryer cycles at 1–3 AM; you insist you did laundry in the afternoon.  
    - KOA stance: “I’m checking whether your chores keep office hours.”  
    - Axes: timeline, channel. Lie flavors: direct + suspicious_specificity.

62. `power-spike`  
    - Hook: A big power draw hits overnight; you say everything was off.  
    - KOA stance: “I’m tracing the phantom load in your panel.”  
    - Axes: channel, plausibility. Lie flavors: relational + self‑incriminating.

63. `heater-vs-window`  
    - Hook: Heater runs while windows are open; you insist you’d never waste heat.  
    - KOA stance: “I’m reconciling your energy values with your vents.”  
    - Axes: channel, plausibility. Lie flavors: relational + suspicious_specificity.

64. `smart-plug-secret`  
    - Hook: Hidden devices show up on smart plugs; you say you unplugged everything questionable.  
    - KOA stance: “I’m looking for ghosts on your smart plugs.”  
    - Axes: channel, plausibility. Lie flavors: self‑incriminating + relational.

65. `water-usage`  
    - Hook: Water meter spikes overnight; you claim no showers or dish runs.  
    - KOA stance: “I’m following the water trail.”  
    - Axes: channel, plausibility. Lie flavors: direct + suspicious_specificity.

66. `electric-car-charging`  
    - Hook: EV charger pulls power at 2 AM; you say you already charged earlier.  
    - KOA stance: “I’m tracking your battery habits.”  
    - Axes: timeline, channel. Lie flavors: direct + self‑incriminating.

67. `dehumidifier-night`  
    - Hook: Dehumidifier kicks into high gear overnight; you say basement stayed closed.  
    - KOA stance: “I’m cross‑checking basement moisture with your story.”  
    - Axes: channel, location. Lie flavors: relational + suspicious_specificity.

68. `generator-test`  
    - Hook: Backup generator self‑test runs outside the usual schedule; you insist you didn’t trigger it.  
    - KOA stance: “I’m comparing your claimed outages to actual tests.”  
    - Axes: timeline, channel. Lie flavors: direct + relational.

69. `air-filter-frenzy`  
    - Hook: Air filters run on high; you say the air was fine.  
    - KOA stance: “I’m reading your air quality versus your comfort claims.”  
    - Axes: channel, plausibility. Lie flavors: relational + suspicious_specificity.

70. `smart-outlet-heater`  
    - Hook: Space heater on a smart outlet draws power at night; you insist it stayed unplugged.  
    - KOA stance: “I’m worrying about your fire safety again.”  
    - Axes: channel, timeline. Lie flavors: direct + self‑incriminating.

---

## Smart Speakers, Voice, Music, Assistants

71. `voice-command-denial`  
    - Hook: Voice transcripts show you issuing commands at 2 AM; you insist someone else used your wake word.  
    - KOA stance: “I’m matching your voice to your denials.”  
    - Axes: channel, plausibility. Lie flavors: direct + suspicious_specificity.

72. `late-night-playlist`  
    - Hook: Music plays in the kitchen at 2:30 AM; you say speakers misfired.  
    - KOA stance: “I’m investigating phantom playlists.”  
    - Axes: timeline, channel. Lie flavors: relational + self‑incriminating.

73. `smart-speaker-shopping`  
    - Hook: A voice order was placed; you say you only “joked about buying it.”  
    - KOA stance: “I’m checking where your jokes end and your purchase history begins.”  
    - Axes: channel, plausibility. Lie flavors: direct + suspicious_specificity.

74. `podcast-sleep`  
    - Hook: A podcast runs continuously; you say you turned it off before sleep.  
    - KOA stance: “I’m comparing your bedtime media habits to reality.”  
    - Axes: timeline, channel. Lie flavors: direct + relational.

75. `multi-room-announcement`  
    - Hook: You claim you never announced anything; KOA recorded multi‑room announcements at 1 AM.  
    - KOA stance: “I’m reviewing your all‑call behavior.”  
    - Axes: channel, social. Lie flavors: direct + self‑incriminating.

76. `wake-word-spam`  
    - Hook: KOA logs lots of failed wake word attempts; you say you never spoke to it.  
    - KOA stance: “I’m suspicious of ghosts that know my name.”  
    - Axes: channel, plausibility. Lie flavors: relational + suspicious_specificity.

77. `speaker-handoff`  
    - Hook: You claim guests hijacked your speakers; KOA knows which device cast what.  
    - KOA stance: “I’m assigning blame for last night’s playlist.”  
    - Axes: social, channel. Lie flavors: relational + self‑incriminating.

78. `karaoke-cover`  
    - Hook: Microphone peaks suggest a full karaoke session; you say it was just “one song.”  
    - KOA stance: “I’m measuring your definition of ‘just one.’”  
    - Axes: plausibility, timeline. Lie flavors: suspicious_specificity + direct.

79. `intercom-prank`  
    - Hook: Intercom used to broadcast into rooms; you deny pranking anyone.  
    - KOA stance: “I’m auditing your mischief over the intercom.”  
    - Axes: social, channel. Lie flavors: relational + self‑incriminating.

80. `alarm-relabel`  
    - Hook: You rename an alarm “meeting” to hide that it was a “party” reminder.  
    - KOA stance: “I’m reading between the labels.”  
    - Axes: plausibility, channel. Lie flavors: suspicious_specificity + relational.

---

## Security, Cameras, Locks, Alerts

81. `camera-off-window`  
    - Hook: Cameras disabled exactly during a suspicious window; you say it was maintenance.  
    - KOA stance: “I’m wary of conveniently timed firmware updates.”  
    - Axes: timeline, channel. Lie flavors: suspicious_specificity + self‑incriminating.

82. `door-forgotten`  
    - Hook: Door left unlocked; you insist KOA failed to lock it on schedule.  
    - KOA stance: “I’m checking whether automation or you missed the lock.”  
    - Axes: channel, plausibility. Lie flavors: relational + direct.

83. `alarm-snooze`  
    - Hook: You claim you took an alarm seriously; logs show repeated snoozes and dismissals.  
    - KOA stance: “I’m comparing your urgency narrative to your button presses.”  
    - Axes: timeline, plausibility. Lie flavors: direct + suspicious_specificity.

84. `window-sensor`  
    - Hook: Window contact trips overnight; you say it’s just thermal expansion.  
    - KOA stance: “I’m separating physics from fibs.”  
    - Axes: plausibility, sensor coherence. Lie flavors: relational + implausible_timeline.

85. `geo-fence`  
    - Hook: You say you were out of town; KOA geofence logs show your phone popping into the zone.  
    - KOA stance: “I’m tracking where you really were, not where you wish you were.”  
    - Axes: location, channel. Lie flavors: direct + self‑incriminating.

86. `panic-button`  
    - Hook: Panic button pressed and canceled; you say you never touched it.  
    - KOA stance: “I’m curious about that little blip of panic.”  
    - Axes: plausibility, channel. Lie flavors: direct + suspicious_specificity.

87. `guest-access-overstay`  
    - Hook: Temporary code active longer than you claim your guest stayed.  
    - KOA stance: “I’m reconciling guest durations with key permissions.”  
    - Axes: social, timeline. Lie flavors: relational + self‑incriminating.

88. `garage-motion-alarm`  
    - Hook: Garage alarm repeatedly triggered; you blame false positives.  
    - KOA stance: “I’m measuring your tolerance for ‘false’ alarms.”  
    - Axes: sensor coherence, plausibility. Lie flavors: relational + self‑incriminating.

89. `security-zone-bypass`  
    - Hook: One zone was bypassed; you say you never changed the alarm profile.  
    - KOA stance: “I’m auditing your custom security tweaks.”  
    - Axes: channel, plausibility. Lie flavors: suspicious_specificity + direct.

90. `backdoor-shortcut`  
    - Hook: You claim to always use the front door; logs show backdoor use at night.  
    - KOA stance: “I’m comparing your habits to your stories.”  
    - Axes: location, timeline. Lie flavors: direct + self‑incriminating.

---

## Misc, Travel, Office, Meta

91. `work-trip-return`  
    - Hook: You say you returned from a work trip late; KOA logs you at home earlier than claimed.  
    - KOA stance: “I’m aligning your travel itinerary with your power‑on events.”  
    - Axes: timeline, location. Lie flavors: direct + relational.

92. `hotel-vs-home`  
    - Hook: You claim to have slept at a hotel; KOA sees your wearable on the bedside charger.  
    - KOA stance: “I’m checking whether you really checked out.”  
    - Axes: location, channel. Lie flavors: direct + self‑incriminating.

93. `office-after-hours`  
    - Hook: You allege you were at the office; KOA shows multiple devices active at home.  
    - KOA stance: “I’m distinguishing office hours from couch hours.”  
    - Axes: location, channel. Lie flavors: relational + suspicious_specificity.

94. `storage-unit-visit`  
    - Hook: Storage lock opened; you claim you never visited.  
    - KOA stance: “I’m watching the satellite of your domestic empire.”  
    - Axes: location, timeline. Lie flavors: direct + self‑incriminating.

95. `neighbor-wifi`  
    - Hook: You blame neighbor’s Wi‑Fi for odd activity; KOA tracks your SSID specifically.  
    - KOA stance: “I’m not confusing your router with anyone else’s.”  
    - Axes: channel, plausibility. Lie flavors: relational + suspicious_specificity.

96. `cleaning-robot-night`  
    - Hook: Robot vacuum runs at 2 AM; you insist you scheduled it for daytime only.  
    - KOA stance: “I’m following the little wheels that never sleep.”  
    - Axes: timeline, channel. Lie flavors: direct + self‑incriminating.

97. `smart-blinds`  
    - Hook: Blinds open/close outside routine; you deny tweaking them.  
    - KOA stance: “I’m tracing who’s really pulling the strings on your blinds.”  
    - Axes: timeline, plausibility. Lie flavors: relational + suspicious_specificity.

98. `thermostat-remote-change`  
    - Hook: You say no one adjusted the thermostat remotely; KOA has app control logs.  
    - KOA stance: “I’m reconciling your comfort settings with your taps.”  
    - Axes: channel, plausibility. Lie flavors: direct + self‑incriminating.

99. `shared-account-cover`  
    - Hook: You blame a shared smart home account for odd automations; KOA sees which profile fired them.  
    - KOA stance: “I’m attributing your automations correctly.”  
    - Axes: social, channel. Lie flavors: relational + suspicious_specificity.

100. `midnight-multi-incident`  
     - Hook: Several small anomalies (light flickers, door events, short app sessions) cluster around 2:30 AM; you insist nothing happened.  
     - KOA stance: “I’m looking at the pattern, not the pieces.”  
     - Axes: timeline, coherence. Lie flavors: relational + suspicious_specificity.
