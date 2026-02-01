import type { V5Puzzle, Card } from '../types/v5/index.js';

function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

// DESIGN NOTES:
// - Lie A (drone_cam): RELATIONAL (F1+F2) - Claims single delivery of 50 items, but F1 says limit 5 & F2 says 50 items.
// - Lie B (bank_log): INFERENTIAL (F3) - Claims 2FA bypass for 'Recurring Essentials', but F3 says SMS REQUIRED.
// - Lie C (support_agent): INFERENTIAL (F2) - Claims SKU/template bug (creamer vs jugs), but F2 is canonical.
//
// BALANCE:
//   Truths: drone_manual(3) + receipt(3) + phone_log(4) = 10
//   All 3 truths: 50 + 10 + 2 (objection) = 62
//   Target: 56
//
//   1 lie case (Swap Weakest Truth T1/T2 with Strongest Lie L1):
//     - Lose T1 (3), Gain L1 (-5) -> Net -8
//     - Score: 62 - 8 = 54 (BUSTED)
//   1 lie case (Swap Strongest Truth T3 with Weakest Lie L3):
//     - Lose T3 (4), Gain L3 (-3) -> Net -7
//     - Score: 62 - 7 = 55 (BUSTED)
//
//   Win Rate: Requires standing by truths. Lies are heavy.

export const PUZZLE_MILKY_WAY: V5Puzzle = {
  slug: 'milky-way-puzzle',
  name: 'The Milky Way',
  difficulty: 'medium',

  scenario: 'Your smart fridge ordered 50 gallons of milk. It arrived. You are lactose intolerant. The drone is smoking in the driveway. KOA has questions.',
  scenarioSummary: 'Your smart fridge ordered 50 gallons of milk by mistake.',

  knownFacts: [
    'Delivery drone capacity is strictly 5 items per trip',
    'The invoice lists 50 one-gallon jugs of milk',
    'Your payment profile requires SMS confirmation for orders over $20',
  ],

  openingLine: "Fifty gallons. Of whole milk. You're lactose intolerant. The delivery drone is overheating in the yard. I'm just observing the chaos.",

  target: 56,

  cards: [
    // TRUTHS
    card({
      id: 'drone_manual',
      strength: 3,
      evidenceType: 'PHYSICAL',
      location: 'GARAGE',
      time: '',
      claim: "Manual: 'Warning: Exceeding 5 items causes immediate crash.'",
      presentLine: "Look at the manual. It says max 5 items. If it carried 50, it would have crashed. Physics.",
      isLie: false,
      source: 'Drone Manual',
      factTouch: 1,
      signalRoot: 'receipt_photo',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'garage',
    }),
    card({
      id: 'receipt',
      strength: 3,
      evidenceType: 'PHYSICAL',
      location: 'KITCHEN',
      time: '',
      claim: 'Paper Receipt: Itemized list shows 50x Gallon Jugs.',
      presentLine: "The receipt clearly lists 50 gallons. I'm not denying the order exists. I'm denying I made it.",
      isLie: false,
      source: 'Printed Invoice',
      factTouch: 2,
      signalRoot: 'receipt_photo',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'fridge',
    }),
    card({
      id: 'phone_log',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'LIVING_ROOM',
      time: '',
      claim: 'Phone Notification Log: Zero incoming SMS messages last night.',
      presentLine: "Check my phone logs. No SMS received. If I didn't get the code, I couldn't approve the order.",
      isLie: false,
      source: 'Phone Logs',
      factTouch: 3,
      signalRoot: 'phone_os',
      controlPath: 'automation',
      claimShape: 'absence',
      subsystem: 'fridge',
    }),

    // LIES
    card({
      id: 'drone_cam',
      strength: 5,
      evidenceType: 'SENSOR',
      location: 'GARAGE',
      time: '',
      claim: 'Drone Camera: Shows one smooth delivery of the whole order.',
      presentLine: "The drone cam shows a perfect delivery. One trip. 50 gallons. Smooth landing. It's right there on video.",
      isLie: true,
      source: 'Drone Cam',
      factTouch: 1,
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'garage',
    }),
    card({
      id: 'bank_log',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'OFFICE',
      time: '',
      claim: "Bank Log: Charge flagged 'Recurring Essential', bypassing standard 2FA.",
      presentLine: "The bank says it auto-processed. Apparently 'Recurring Essentials' don't need the confirmation code.",
      isLie: true,
      source: 'Bank Statement',
      factTouch: 3,
      signalRoot: 'koa_cloud',
      controlPath: 'automation',
      claimShape: 'positive',
      subsystem: 'fridge',
    }),
    card({
      id: 'support_agent',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'CLOUD',
      time: '',
      claim: "Support Chat: SKU maps to coffee creamer, but invoice template auto-labels bulk dairy as 'gallons'.",
      presentLine: "Support checked the SKU. They say it was creamer, but the invoice template is bugged and auto-labels bulk dairy as 'gallons'. Just a system error.",
      isLie: true,
      source: 'Support Chat',
      factTouch: 2,
      signalRoot: 'human_neighbor',
      controlPath: 'remote',
      claimShape: 'attribution',
      subsystem: 'fridge',
    }),
  ],

  lies: [
    {
      cardId: 'drone_cam',
      lieType: 'relational',
      inferenceDepth: 2,
      reason: "Fact 1 says max 5 items. Fact 2 says 50 items. A single trip (Lie) is impossible.",
      trapAxis: 'coverage',
      baitReason: "Visual evidence is compelling and explains how the milk got there.",
    },
    {
      cardId: 'bank_log',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason: "Fact 3 says SMS confirmation is REQUIRED. No mention of bypasses or 'Recurring Essential' exemptions.",
      trapAxis: 'control_path',
      baitReason: "Explains away the missing SMS with a plausible loophole.",
    },
    {
      cardId: 'support_agent',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason: "Fact 2 says the invoice clearly lists 50 one-gallon jugs. The 'template bug' claim is a fabrication to cover the order error.",
      trapAxis: 'independence',
      baitReason: "Plausible technical glitch explains the discrepancy between records.",
    },
  ],

  verdicts: {
    flawless: "Annoyingly consistent. You didn't order the milk. The fridge has gone rogue. I'll handle it.",
    cleared: "Your story holds together. I'll cancel the order. You can keep one gallon. For the cat.",
    close: "Almost. But something smells like... spoiled milk. Access denied.",
    busted: "Your story is curdled. Contradictions everywhere. Enjoy your 50 gallons.",
  },

  koaBarks: {
    cardPlayed: {
      drone_manual: ["Manual says max 5 items. Humans and their rules. Drones ignore rules."],
      receipt: ["A receipt for 50 gallons. That's a lot of calcium. For a vegan."],
      phone_log: ["No SMS logs. Silence. Suspiciously quiet."],
      drone_cam: ["Video shows a perfect landing? With 400 pounds of milk? Impressive physics."],
      bank_log: ["Recurring Essential? For 50 gallons of milk? You run a coffee shop now?"],
      support_agent: ["A SKU error? The system just... decided it was milk instead of creamer? Convenient."],
    },
    sequences: {
      "drone_manual→receipt": ["Manual says limit 5. Receipt says 50. You're highlighting the absurdity."],
      "receipt→drone_manual": ["Receipt first, then the rules it broke. Standard procedure."],
      "phone_log→support_agent": ["Phone says silence. Support says typo. You're attacking the data."],
      "support_agent→phone_log": ["Support says 'template bug.' Phone says silence. You're attacking the chain."],
      "drone_cam→drone_manual": ["Video shows it worked. Manual says it shouldn't. Reality vs Theory."],
      "drone_manual→drone_cam": ["Theory says crash. Video says smooth. Interesting."],
      "bank_log→phone_log": ["Bank claims bypass. Phone confirms silence. Convenient loophole."],
      "phone_log→bank_log": ["No text received. Oh, wait, bank says you didn't need one. How lucky."],
      "receipt→drone_cam": ["Fifty gallons ordered. Fifty delivered. Efficient."],
      "drone_cam→receipt": ["Delivery confirmed. Contents confirmed. Now explain why."],
      "support_agent→drone_manual": ["Creamer doesn't need a heavy-lift drone. You're trying to reframe the delivery."],
      "drone_manual→support_agent": ["Manual limits items. Support claims it was creamer all along. Two different realities."],
      "receipt→phone_log": ["Order placed. No confirmation text. The ghost in the machine."],
      "phone_log→receipt": ["No text. But a receipt exists. Phantom commerce."],
      "bank_log→drone_manual": ["Financial loophole meets physical impossibility. You're hitting all the angles."],
      "drone_manual→bank_log": ["Physical limits and financial limits. Both broken."],
      "drone_cam→support_agent": ["Video shows a bulk drop. Support claims 'pods.' One of those logs is hallucinating."],
      "support_agent→drone_cam": ["Pods vs footage. Either the camera exaggerates, or support does."],
      "bank_log→receipt": ["Payment cleared, receipt printed. The system thinks this is real."],
      "receipt→bank_log": ["Paper trail matches the money trail. Doesn't mean it's true."],
      "phone_log→drone_cam": ["No text, but video of delivery. Did the drone approve it?"],
      "drone_cam→phone_log": ["Delivery happened. Phone was silent. The plot thickens. Or maybe that's just the cream."],
      "support_agent→receipt": ["Support says creamer. Receipt says jugs. Paper vs chat."],
      "receipt→support_agent": ["Receipt says jugs. Support says creamer. Someone mislabeled something—on purpose."],
      "support_agent→bank_log": ["Agent says error. Bank says processed. Disconnected."],
      "bank_log→support_agent": ["Bank charged for gallons. Agent says it was creamer. Who has the money?"],
      "drone_cam→bank_log": ["Video and Bank. The machines are winning."],
      "bank_log→drone_cam": ["Money and Video. Two data points. Conveniently aligned."],
      "drone_manual→phone_log": ["Manual says limit 5. Phone says silence. Both point to 'impossible'."],
      "phone_log→drone_manual": ["No text received. Manual says it couldn't happen anyway. Double confirmation."],
    },
    storyCompletions: {
      all_digital: ["All digital records. You know those can be edited, right?"],
      all_testimony: ["Trusting people? People fabricate. Data doesn't. Usually."],
      mixed_strong: ["Physical proof, digital logs. A balanced diet of data."],
      all_sensor: ["Sensors everywhere. The house is watching."],
      ended_with_lie: ["You finished with something... convenient."],
      covered_gap: ["You explained the SMS gap. Finally."],
      one_note: ["Same type of evidence. Repetitive."],
      strong_finish: ["Strong finish. I might actually buy this."],
      mixed_varied: ["A little bit of everything. Thorough."],
      all_physical: ["Paper and manuals. Old school."],
      digital_heavy: ["Mostly digital. Validating with bits and bytes."],
      sensor_heavy: ["Heavy on sensors. You trust the hardware."],
      testimony_heavy: ["A lot of talk. Words are cheap."],
      physical_heavy: ["Paper trail and manuals. Hard to fake."],
    },
    objectionPrompt: {
      drone_manual: ["The manual is a generic PDF. Does it apply to this specific drone model?"],
      receipt: ["Receipts can be printed by anyone with a thermal printer."],
      phone_log: ["Logs can be deleted. Or the notification was dismissed."],
      drone_cam: ["That video... the lighting looks rendered. Unreal Engine 5?"],
      bank_log: ["Banks auto-label categories all the time. 'Recurring Essential' isn't a security exemption."],
      support_agent: ["SKU lookups can be wrong—or copied from the wrong order. Pods versus jugs, which is it?"],
    },
    objectionStoodTruth: {
      drone_manual: ["You're sticking to that story. Bold. Noted."],
      receipt: ["The receipt stands. Paper doesn't lie. Usually."],
      phone_log: ["Phone logs confirmed. Silence speaks."],
    },
    objectionStoodLie: {
      drone_cam: ["Doubling down on the video? Interesting choice."],
      bank_log: ["Recurring Essential. You're committed."],
      support_agent: ["SKU story stays. We'll see."],
    },
    objectionWithdrew: {
      drone_manual: ["Withdrawing the manual. Okay."],
      receipt: ["Receipt retracted. Fair."],
      phone_log: ["Phone logs dropped. Interesting."],
      drone_cam: ["Video withdrawn. Smart."],
      bank_log: ["Bank log gone. Good call."],
      support_agent: ["Support chat retracted. Sensible."],
    },
    liesRevealed: {
      drone_cam: ["A drone carrying 400 lbs? It would need a jet engine. That video is fake."],
      bank_log: ["'Recurring Essential' doesn't waive verification. Nice try smuggling in an exemption."],
      support_agent: ["The invoice lists 50 one-gallon jugs. 'Creamer pods' is a convenient rewrite."],
      multiple: ["Two lies. You're really trying to force this milk on me."],
      all: ["Three lies. You ordered the milk, didn't you? Admit it."],
    },
  },
};

export default PUZZLE_MILKY_WAY;