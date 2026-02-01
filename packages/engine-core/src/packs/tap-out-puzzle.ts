/**
 * Generated Puzzle: Tap Out
 * Difficulty: MEDIUM
 * Scenario: #12 - Keg Stand (Quantity archetype)
 *
 * DESIGN NOTES:
 * - Lie 1 (regulator_fail): INFERENTIAL - claims CO2 catastrophic failure, but 47 normal pours logged
 * - Lie 2 (responsible_night): RELATIONAL - claims "3-4 beers each", but 11 gal / 2 people = 45 beers each
 * - Lie 3 (dave_left_early): INFERENTIAL - claims friend left at halftime, but motion shows 2 people until 3:47 AM
 *
 * RELATIONAL VERIFICATION for Lie 2:
 * - Fact 1 alone? No - pour count doesn't tell us consumption per person
 * - Fact 2 alone? No - 11 gallons consumed, but how many people?
 * - Fact 3 alone? No - 2 people there, but how much did they drink?
 * - Need F2 + F3: 11 gal / 2 people = 5.5 gal each = ~45 beers. "3-4 beers" is a massive lie.
 *
 * BALANCE:
 *   Truths: tap_log(4) + keg_fresh(3) + dave_stayed(3) = 10
 *   All 3 truths: 50 + 10 + 2 (objection) = 62
 *   Target: 58 → Margin of 4 points
 *
 *   Lies: regulator_fail(5) + responsible_night(4) + dave_left_early(3) = 12
 *   1 lie case (str 3): 50 + 7 - 2 + 2 = 57 (CLOSE)
 *   1 lie case (str 4): 50 + 7 - 3 + 2 = 56 (CLOSE)
 *   1 lie case (str 5): 50 + 7 - 4 + 2 = 55 (CLOSE)
 *   2 lies case: 50 + 4 - 2 - 3 + 2 = 51 (BUSTED)
 *   3 lies case: 50 - 2 - 3 - 4 + 2 = 43 (BUSTED)
 *
 * v1 LITE AXIS DESIGN:
 *   Truths: factTouch {1, 2, 3} partition
 *   SignalRoots: device_firmware, device_firmware, human_partner (diverse)
 *   Lies: trapAxis uses coverage, claim_shape, independence
 */

import type { V5Puzzle, Card } from '../types/v5/index.js';

function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

export const PUZZLE_TAP_OUT: V5Puzzle = {
  slug: 'tap-out',
  name: 'Tap Out',
  difficulty: 'medium',

  scenario: `Your basement kegerator achieved peak efficiency last night: entire CO2 tank emptied, 11 gallons of craft IPA gone flat, and your CO2 alarm woke three neighbors at 3:47 AM. It was supposed to be a "chill game night." KOA has disabled your beverage systems until you explain how two adults murdered a half-barrel.`,
  scenarioSummary: 'Your kegerator emptied 11 gallons of beer overnight.',

  knownFacts: [
    'Kegerator logged 47 pour events between 10 PM and 3 AM, each drawing normal CO2',
    'Smart keg scale: weight dropped from 15.2 gallons at 9 PM to 3.8 gallons at 3:47 AM',
    'Basement motion sensor: exactly 2 heat signatures detected continuously until 3:47 AM',
  ],

  openingLine: `47 pours. 11 gallons. Two people. One night. Your kegerator is filing for emotional damages. I ran the math. Several times. The math is judgmental.`,

  target: 58,

  cards: [
    // ══════════════════════════════════════════════════════════════════
    // TRUTHS (3) — strengths: 3, 3, 4
    // ══════════════════════════════════════════════════════════════════

    // T1 ANCHOR: tap_log
    // Safe because: confirms normal operation, aligns with fact about 47 pours
    card({
      id: 'tap_log',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'BASEMENT',
      time: '',
      claim: 'Smart tap logged 47 successful pours with normal pressure readings.',
      presentLine: "Every pour was normal pressure. No spikes, no failures, no malfunctions. The kegerator worked perfectly. That's... that's not helping me, is it.",
      isLie: false,
      source: 'Smart Tap Log',
      factTouch: 1,
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'beverage',
    }),

    card({
      id: 'keg_fresh',
      strength: 3,
      evidenceType: 'PHYSICAL',
      location: 'BASEMENT',
      time: '',
      claim: 'Keg receipt shows it was tapped yesterday for the championship.',
      presentLine: "We just tapped it for the championship game. Fresh keg. Full keg. It was supposed to last the month. The MONTH.",
      isLie: false,
      source: 'Keg Receipt',
      factTouch: 2,
      signalRoot: 'receipt_photo',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'beverage',
    }),

    card({
      id: 'dave_stayed',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'BASEMENT',
      time: '',
      claim: 'Dave confirms he stayed for the whole game and overtime.',
      presentLine: "Dave was there the whole time. Both of us. Watching the game. The very long game. With overtime. And... a lot of beer breaks.",
      isLie: false,
      source: 'Dave',
      factTouch: 3,
      signalRoot: 'human_partner',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'beverage',
    }),

    // ══════════════════════════════════════════════════════════════════
    // LIES (3) — strengths: 3, 4, 5
    // ══════════════════════════════════════════════════════════════════

    // INFERENTIAL: regulator_fail
    // Fact 1 alone catches it: 47 normal pours = no catastrophic failure
    card({
      id: 'regulator_fail',
      strength: 5,
      evidenceType: 'SENSOR',
      location: 'BASEMENT',
      time: '',
      claim: 'CO2 regulator shows pressure spike consistent with valve failure.',
      presentLine: "The regulator must have failed. Dumped everything at once. That's why the tank's empty. Equipment malfunction. Not human malfunction.",
      isLie: true,
      source: 'Pressure Gauge',
      factTouch: 1,
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'attribution',
      subsystem: 'beverage',
    }),

    // RELATIONAL: responsible_night
    // Needs Fact 2 (11 gal consumed) + Fact 3 (2 people) to catch
    card({
      id: 'responsible_night',
      strength: 4,
      evidenceType: 'TESTIMONY',
      location: 'BASEMENT',
      time: '',
      claim: 'We each had 3-4 beers. Very responsible evening.',
      presentLine: "We paced ourselves. 3-4 beers each, max. Responsible adults watching the game. The CO2 issue is separate from our very moderate consumption.",
      isLie: true,
      source: 'Self-Report',
      factTouch: 2,
      signalRoot: 'human_self',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'beverage',
    }),

    // INFERENTIAL: dave_left_early
    // Fact 3 alone catches it: 2 heat signatures until 3:47 AM
    card({
      id: 'dave_left_early',
      strength: 3,
      evidenceType: 'DIGITAL',
      location: 'BASEMENT',
      time: '',
      claim: 'Router log shows Dave\'s phone disconnected at 10:32 PM.',
      presentLine: "Check the router. Dave's phone dropped off the network at 10:32. Halftime. He left. I went to bed soon after. Whatever happened after that wasn't us.",
      isLie: true,
      source: 'Router Log',
      factTouch: 3,
      signalRoot: 'router_net',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'network',
    }),
  ],

  lies: [
    {
      cardId: 'regulator_fail',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason: 'Fact 1 states 47 pours with normal CO2 draw each. A regulator failure would show abnormal pressure, not 47 successful pours.',
      trapAxis: 'coverage',
      baitReason: 'Equipment failure is a blameless explanation that protects human dignity.',
    },
    {
      cardId: 'responsible_night',
      lieType: 'relational',
      inferenceDepth: 2,
      reason: 'Fact 2 says 11.4 gallons consumed. Fact 3 says exactly 2 people present. 11.4 gal / 2 = 5.7 gallons each = ~45 beers. "3-4 beers" is false by a factor of 10.',
      trapAxis: 'claim_shape',
      baitReason: 'Claiming responsibility feels virtuous and diverts attention from the quantity.',
    },
    {
      cardId: 'dave_left_early',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason: 'Fact 3 states 2 heat signatures continuously until 3:47 AM. Dave\'s phone may have disconnected, but his body stayed. Motion sensors see heat, not WiFi.',
      trapAxis: 'independence',
      baitReason: 'Router logs feel authoritative, and blaming Dave\'s exit explains the late-night damage.',
    },
  ],

  verdicts: {
    flawless: `47 pours. 11 gallons. Two adults. One night. The math is disgusting but consistent. I'm not your doctor. I'm not your sponsor. Access restored. Hydrate.`,
    cleared: `Your story adds up. The beer doesn't. But that's between you, Dave, and your livers. Beverage systems unlocked.`,
    close: `Almost had me. But something doesn't pour right. Your story has foam but no body.`,
    busted: `Regulator failure that logged 47 normal pours. Moderate drinking that emptied a half-barrel. A friend who left but never left. Your story is flatter than the beer.`,
  },

  koaBarks: {
    cardPlayed: {
      tap_log: [`47 perfect pours. The kegerator worked flawlessly. The humans, less so.`],
      keg_fresh: [`Fresh keg yesterday. Empty keg today. That's called commitment. Or a problem.`],
      dave_stayed: [`Dave was there. Both of you. Together. For several gallons.`],
      regulator_fail: [`Regulator failure. The equipment is at fault. Very convenient scapegoat.`],
      responsible_night: [`3-4 beers each. Responsible adults. The keg scale disagrees violently.`],
      dave_left_early: [`Router says Dave disconnected at halftime. Motion sensor says two people stayed. Curious.`],
    },

    sequences: {
      // tap_log → others
      'tap_log→keg_fresh': [`Perfect pours from a brand new keg. You got your money's worth. All of it. In one night.`],
      'tap_log→dave_stayed': [`The system logged every pour. Dave saw every pour. This is a well-documented bender.`],
      'tap_log→regulator_fail': [`47 flawless pours, then the regulator failed? That's a very patient malfunction.`],
      'tap_log→responsible_night': [`47 pours split two ways. "Responsible" is doing a lot of heavy lifting here.`],
      'tap_log→dave_left_early': [`Every pour logged until 3 AM. Dave's phone left at halftime. Who was pouring after midnight?`],

      // keg_fresh → others
      'keg_fresh→tap_log': [`New keg, logged pours. A paper trail of foam.`],
      'keg_fresh→dave_stayed': [`Fresh keg, full witness. Dave watched it go from full to funeral.`],
      'keg_fresh→regulator_fail': [`Brand new keg, convenient equipment failure. The keg didn't stand a chance.`],
      'keg_fresh→responsible_night': [`15 gallons yesterday. 3.8 gallons now. "Responsible" math is fascinating.`],
      'keg_fresh→dave_left_early': [`Fresh keg for the championship. Dave's phone bounced at halftime. Who finished the job?`],

      // dave_stayed → others
      'dave_stayed→tap_log': [`Dave confirms the marathon. The tap confirms the scoreboard.`],
      'dave_stayed→keg_fresh': [`Dave saw the fresh keg. Dave saw the empty keg. Dave has seen things.`],
      'dave_stayed→regulator_fail': [`Dave was there all night. But somehow missed the regulator explosion?`],
      'dave_stayed→responsible_night': [`Dave agrees he stayed. Dave agrees 3-4 beers each. Dave is a generous friend.`],
      'dave_stayed→dave_left_early': [`Dave says he stayed. Router says he left. Dave's phone is a liar or Dave is.`],

      // regulator_fail → others
      'regulator_fail→tap_log': [`Equipment failure, yet 47 successful pours. That's a very selective malfunction.`],
      'regulator_fail→keg_fresh': [`Regulator failed on a brand new keg. Bad luck. Or convenient timing.`],
      'regulator_fail→dave_stayed': [`The regulator failed, but Dave saw nothing? He was there. With working eyes.`],
      'regulator_fail→responsible_night': [`Equipment failure AND responsible drinking? Seems like overkill on the excuses.`],
      'regulator_fail→dave_left_early': [`Regulator blew up. Dave wasn't there to see it. Convenient absence.`],

      // responsible_night → others
      'responsible_night→tap_log': [`3-4 beers each, you said. The tap logged 47. I'm seeing a discrepancy.`],
      'responsible_night→keg_fresh': [`Responsible drinking from a keg you emptied overnight. Definitions vary, I suppose.`],
      'responsible_night→dave_stayed': [`Both responsible. Both present. Both somehow consumed 45 beers each. Responsibly.`],
      'responsible_night→regulator_fail': [`Responsible drinking plus regulator failure. Double-layered excuse. Foam on foam.`],
      'responsible_night→dave_left_early': [`Responsible night, but Dave left early? Who was responsible for the second half of the keg?`],

      // dave_left_early → others
      'dave_left_early→tap_log': [`Router says Dave left at halftime. Tap says pours continued until 3 AM. Solo mission?`],
      'dave_left_early→keg_fresh': [`Dave disconnected at 10:32. Keg emptied by 3:47. You finished 8 gallons alone?`],
      'dave_left_early→dave_stayed': [`Router says Dave's phone left. Dave says he stayed. Someone's network is confused.`],
      'dave_left_early→regulator_fail': [`Dave's WiFi dropped, then the regulator failed. Convenient exit before chaos.`],
      'dave_left_early→responsible_night': [`Dave's phone left early. You stayed responsible. Responsible for the whole keg.`],
    },

    storyCompletions: {
      all_digital: [`All digital logs. The machines are testifying. Against you.`],
      all_sensor: [`Sensors and gauges. The basement is making a statement.`],
      all_testimony: [`Witnesses everywhere. Dave's here. You're here. Lots of talking, less drinking accountability.`],
      all_physical: [`Physical evidence. Receipts and gauges. The hangover is also evidence.`],
      digital_heavy: [`Logs and firmware. Your night is well-documented. Too well.`],
      sensor_heavy: [`Sensors tracked everything. Weight, motion, pressure. They saw it all.`],
      testimony_heavy: [`Human witnesses. Self-reports. Everyone agrees. Suspiciously.`],
      physical_heavy: [`Receipts and readings. Paper trail meets beer trail.`],
      mixed_strong: [`Varied sources. A complete picture of the carnage. Processing.`],
      mixed_varied: [`Different angles on the same disaster. Triangulating the hangover.`],
    },

    objectionPrompt: {
      tap_log: [`47 pours logged. All normal. Standing by this flawless performance?`],
      keg_fresh: [`Fresh keg yesterday, gutted today. This is your receipt?`],
      dave_stayed: [`Dave stayed the whole time. Both of you. Together. Confirm?`],
      regulator_fail: [`Regulator failure dumped the CO2. But logged 47 normal pours. Sure?`],
      responsible_night: [`3-4 beers each. The keg lost 11 gallons. Still sticking with "responsible"?`],
      dave_left_early: [`Router says Dave disconnected at halftime. Motion says 2 people until 3:47 AM. Sure about that?`],
    },

    objectionStoodTruth: {
      tap_log: [`Tap log verified. 47 pours. Normal pressure. The system worked perfectly.`],
      keg_fresh: [`Receipt confirmed. Fresh keg. Your enthusiasm was... thorough.`],
      dave_stayed: [`Dave's presence confirmed. Two people. The whole night. Noted.`],
    },

    objectionStoodLie: {
      regulator_fail: [`Regulator failure? But 47 pours logged, each with normal CO2 draw. A failure would show abnormal readings. It didn't. This failure didn't happen.`],
      responsible_night: [`3-4 beers each? The keg lost 11.4 gallons. Two people. That's 5.7 gallons per person. About 45 beers each. "Responsible" isn't the word I'd use.`],
      dave_left_early: [`Router says Dave disconnected? Maybe his phone died. The motion sensor says 2 warm bodies until 3:47 AM. Dave was there. Phone or no phone.`],
    },

    objectionWithdrew: {
      tap_log: [`Tap log withdrawn. Maybe the pours weren't normal?`],
      keg_fresh: [`Receipt dropped. Maybe it wasn't that fresh.`],
      dave_stayed: [`Dave's presence rescinded. Maybe he was a hologram.`],
      regulator_fail: [`Regulator theory abandoned. Back to human error.`],
      responsible_night: [`"Responsible" claim retracted. Acknowledging the situation.`],
      dave_left_early: [`Router log dropped. Maybe Dave just turned off his WiFi.`],
    },

    liesRevealed: {
      regulator_fail: [`Regulator failure? The tap logged 47 successful pours with normal pressure. A failure leaves evidence. Yours left none. Because it didn't happen.`],
      responsible_night: [`3-4 beers each? I have a keg that lost 11.4 gallons. I have motion data showing 2 people. That's 45 beers per person. "Responsible" is not the word.`],
      dave_left_early: [`Dave's phone disconnected at halftime? Cool. The motion sensor still saw 2 human-shaped heat sources until 3:47 AM. WiFi off. Dave still there. Still drinking.`],
      multiple: [`Two stories that don't hold beer. Equipment failure that wasn't. Drinking claims that don't add up. Your night has holes.`],
      all: [`Regulator worked fine. "3-4 beers" was 45. Dave never left. Every excuse was foam. The only truth is the empty keg.`],
    },
  },

  epilogue: `The championship game went to triple overtime. Six hours of football. 47 legitimate pours. Two adults who should have known better. The CO2 alarm was triggered by the empty tank valve, not any malfunction. KOA has unlocked the kegerator but enabled a mandatory hydration reminder every third pour. Your liver sent a thank-you note.`,
};

export default PUZZLE_TAP_OUT;
