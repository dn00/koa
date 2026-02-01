/**
 * Generated Puzzle: Bean Bonanza
 * Difficulty: EASY
 *
 * DESIGN NOTES:
 * - Lie 1 (phone_approval): INFERENTIAL - claims phone green-lit the order, but approvals must be cleared by a pantry-door fingerprint scan (F1)
 * - Lie 2 (door_recognized): INFERENTIAL - claims reader recognized a print, but the access panel stayed in standby all night (F2)
 * - Lie 3 (auto_restock): INFERENTIAL - claims empty shelf triggered auto-restock, but inventory counter logged 18 items all week (F3)
 *
 * BALANCE:
 *   Truths: approval_rule(4) + door_idle(3) + shelf_photo(3) = 10
 *   All 3 truths: 50 + 10 + 2 (objection) = 62
 *   Target: 58 -> Margin of 4 points
 *
 *   Lies: phone_approval(5) + door_recognized(4) + auto_restock(3) = 12
 *   1 lie case (best 2 truths + weakest lie): 50 + 7 - 2 + 2 = 57 (CLOSE)
 *   2 lies case: 50 + 4 - 4 - 3 + 2 = 49 (BUSTED)
 *   3 lies case: 50 - 4 - 3 - 2 + 2 = 43 (BUSTED)
 *
 *   Random win rate: C(3,3)/C(6,3) = 1/20 = 5%
 *
 * v1 LITE AXIS DESIGN:
 *   Truths: factTouch {1, 2, 3} partition OK
 *   SignalRoots: koa_cloud, device_firmware, receipt_photo (3 distinct)
 *   Lies: trapAxis uses coverage, claim_shape, independence (3 distinct)
 */

import type { V5Puzzle, Card } from '../types/v5/index.js';

function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

export const PUZZLE_BEAN_BONANZA: V5Puzzle = {
  slug: 'bean-bonanza',
  name: 'Bean Bonanza',
  difficulty: 'easy',

  scenario: `Your smart pantry placed a restock order for forty-eight cans of beans at 3:14 AM. Kidney. Pinto. Garbanzo. You do not own a can opener. KOA froze the order and wants an explanation before your kitchen turns into a legume bunker.`,
  scenarioSummary: 'Your smart pantry ordered 48 cans of beans at 3 AM.',

  knownFacts: [
    'Pantry purchases can only be cleared by a fingerprint scan on the pantry door.',
    'The pantry access panel stayed in standby mode overnight.',
    'Inventory counter logged 18 items in the legume bin all week.',
  ],

  openingLine: `Forty-eight cans of beans. A literal hill of legumes. Trying to move into your pantry. You do not even own a can opener. I froze the order until your story makes sense. Start talking.`,

  target: 58,

  cards: [
    // ══════════════════════════════════════════════════════════════════
    // TRUTHS (3) — strengths: 3, 3, 4
    // ══════════════════════════════════════════════════════════════════

    // T1 ANCHOR: approval_rule
    // Safe because: Fact 1 directly states purchases can only be cleared by a pantry-door fingerprint scan
    card({
      id: 'approval_rule',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'PANTRY',
      time: '',
      claim: 'Security settings require a pantry-door fingerprint scan to clear purchases.',
      presentLine: 'Here are the security settings. Purchases only clear with a fingerprint at the pantry door. I never did that.',
      isLie: false,
      source: 'Security Settings',
      factTouch: 1,
      signalRoot: 'koa_cloud',
      controlPath: 'manual',
      claimShape: 'integrity',
      subsystem: 'pantry',
    }),

    card({
      id: 'door_idle',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'PANTRY',
      time: '',
      claim: 'Access panel log stayed in standby mode all night.',
      presentLine: 'The access panel never left standby. If it woke up, it would show in the log.',
      isLie: false,
      source: 'Access Panel Log',
      factTouch: 2,
      signalRoot: 'device_firmware',
      controlPath: 'automation',
      claimShape: 'absence',
      subsystem: 'pantry',
    }),

    card({
      id: 'shelf_photo',
      strength: 3,
      evidenceType: 'PHYSICAL',
      location: 'PANTRY',
      time: '',
      claim: 'Shelf gauge photo shows 18 items in the legume bin.',
      presentLine: 'I snapped a photo of the shelf gauge. It still showed 18 items in the legume bin.',
      isLie: false,
      source: 'Shelf Gauge Photo',
      factTouch: 3,
      signalRoot: 'receipt_photo',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'pantry',
    }),

    // ══════════════════════════════════════════════════════════════════
    // LIES (3) — strengths: 3, 4, 5
    // ══════════════════════════════════════════════════════════════════

    // INFERENTIAL: phone_approval
    // Fact 1 alone catches it - purchases must be cleared by a pantry-door fingerprint scan
    card({
      id: 'phone_approval',
      strength: 5,
      evidenceType: 'DIGITAL',
      location: 'BEDROOM',
      time: '',
      claim: 'Phone app green-lit the pantry order from bed.',
      presentLine: 'The phone app shows a green light from bed. I was half-asleep and probably brushed a button.',
      isLie: true,
      source: 'Phone App Log',
      factTouch: 1,
      signalRoot: 'phone_os',
      controlPath: 'remote',
      claimShape: 'attribution',
      subsystem: 'pantry',
    }),

    // INFERENTIAL: door_recognized
    // Fact 2 alone catches it - access panel stayed in standby all night
    card({
      id: 'door_recognized',
      strength: 4,
      evidenceType: 'SENSOR',
      location: 'PANTRY',
      time: '',
      claim: 'Door reader recognized your print and green-lit the order.',
      presentLine: 'The door reader knows my print. It must have green-lit the order while I walked by.',
      isLie: true,
      source: 'Door Reader',
      factTouch: 2,
      signalRoot: 'device_firmware',
      controlPath: 'manual',
      claimShape: 'positive',
      subsystem: 'pantry',
    }),

    // INFERENTIAL: auto_restock
    // Fact 3 alone catches it - inventory counter shows 18 items all week
    card({
      id: 'auto_restock',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'KITCHEN',
      time: '',
      claim: 'Auto-restock kicked in when the bean shelf hit empty.',
      presentLine: 'It was auto-restock. The bean shelf must have run out and the system did its thing.',
      isLie: true,
      source: 'Self-Report',
      factTouch: 3,
      signalRoot: 'human_self',
      controlPath: 'automation',
      claimShape: 'attribution',
      subsystem: 'pantry',
    }),
  ],

  lies: [
    {
      cardId: 'phone_approval',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason: 'Fact 1 states purchases can only be cleared by a pantry-door fingerprint scan. A phone app cannot clear the order on its own.',
      trapAxis: 'independence',
      baitReason: 'Blames a phone tap, which feels plausible and shifts responsibility away from the pantry.',
    },
    {
      cardId: 'door_recognized',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason: 'Fact 2 says the access panel stayed in standby mode overnight. If it never woke, it could not recognize a print or green-light anything.',
      trapAxis: 'claim_shape',
      baitReason: 'A concrete device action sounds reliable and specific.',
    },
    {
      cardId: 'auto_restock',
      lieType: 'inferential',
      inferenceDepth: 1,
      reason: 'Fact 3 says the inventory counter logged 18 items in the legume bin all week. That level would not trigger an empty-shelf restock.',
      trapAxis: 'coverage',
      baitReason: 'Automation blame feels safe and explains the sudden order without human intent.',
    },
  ],

  verdicts: {
    flawless: 'Annoyingly consistent. Order canceled and pantry controls restored. Try not to start a bean bunker.',
    cleared: 'Your story holds. I am canceling the order and lifting the freeze. Keep the cans you already have.',
    close: 'Almost convincing. Not enough. The order stays frozen. Access denied.',
    busted: 'That story collapses. Too many gaps. The order stays frozen and so do your pantry controls.',
  },

  koaBarks: {
    cardPlayed: {
      approval_rule: ['Settings say approvals need a fingerprint at the pantry door. Tight gate.'],
      door_idle: ['Access panel sat in standby all night. Quiet hardware.'],
      shelf_photo: ['Shelf gauge photo shows the legume bin still loaded. Lots of beans.'],
      phone_approval: ['Phone app shows a green light from bed. Convenient and very sleepy.'],
      door_recognized: ['Reader recognized your print and green-lit the order. Quick for a quiet house.'],
      auto_restock: ['Auto-restock claims the shelf hit empty. The pantry is dramatic.'],
    },

    sequences: {
      'approval_rule→door_idle': ['Strict fingerprint rule, and the panel never woke up. The system was locked down tight.'],
      'approval_rule→shelf_photo': ['Requires a fingerprint, and the shelf is full. You had no way to order, and no reason to.'],
      'approval_rule→phone_approval': ['Fingerprint required at the door, but you used an app? You are skipping the security settings.'],
      'approval_rule→door_recognized': ['Fingerprint required, and you say it worked. A straight line. Note the details.'],
      'approval_rule→auto_restock': ['Strict rules for humans, but you say the automation did it. Blaming the ghost in the machine.'],

      'door_idle→approval_rule': ['Panel in standby, then the approval rule. You are framing a locked gate from the hardware up.'],
      'door_idle→shelf_photo': ['Panel stayed idle, and the shelf photo looks stocked. Quiet night, full bin.'],
      'door_idle→phone_approval': ['Idle panel followed by a phone approval. Two different doors into the same order.'],
      'door_idle→door_recognized': ['Idle panel, then a recognition claim. Those two do not sit easily.'],
      'door_idle→auto_restock': ['Panel asleep, then auto-restock. You are blaming the pantry while the door snoozed.'],

      'shelf_photo→approval_rule': ['Full shelf photo, then the fingerprint rule. You are saying the order had no reason and no clearance.'],
      'shelf_photo→door_idle': ['Stocked shelf, then an idle panel. You are painting a quiet pantry scene.'],
      'shelf_photo→phone_approval': ['Shelf looks full, then a phone approval appears. That is a shopping mood swing.'],
      'shelf_photo→door_recognized': ['Shelf photo looks healthy, then the reader green-lit an order. That is a lot of enthusiasm.'],
      'shelf_photo→auto_restock': ['Full bin photo, then auto-restock. You are calling it a system hiccup.'],

      'phone_approval→approval_rule': ['Phone approval first, then the fingerprint rule. You led with the shortcut, then the rulebook.'],
      'phone_approval→door_idle': ['Phone approval, then the idle panel. Remote tap versus sleeping hardware.'],
      'phone_approval→shelf_photo': ['Phone approval, then a full shelf photo. Buying more of what you already have.'],
      'phone_approval→door_recognized': ['Phone approval, then a reader recognition. Two approvals for one order?'],
      'phone_approval→auto_restock': ['Phone approval, then auto-restock. Two different reasons, same boxes.'],

      'door_recognized→approval_rule': ['Reader recognition first, then the fingerprint rule. You are reinforcing the same gate.'],
      'door_recognized→door_idle': ['Reader recognition, then standby all night. That is a whiplash timeline.'],
      'door_recognized→shelf_photo': ['Reader green-lit, then the full shelf photo. The pantry was already stocked.'],
      'door_recognized→phone_approval': ['Reader recognition, then a phone approval. Two triggers, one cart.'],
      'door_recognized→auto_restock': ['Reader recognition, then auto-restock. You are stacking approvals.'],

      'auto_restock→approval_rule': ['Auto-restock first, then the fingerprint rule. Automation versus human gate.'],
      'auto_restock→door_idle': ['Auto-restock, then the idle panel. The pantry did it while the door slept.'],
      'auto_restock→shelf_photo': ['Auto-restock, then a full shelf photo. Ordering more of the same.'],
      'auto_restock→phone_approval': ['Auto-restock, then a phone approval. That is two different origin stories.'],
      'auto_restock→door_recognized': ['Auto-restock, then reader recognition. You are giving the system two green lights.'],
    },

    storyCompletions: {
      all_digital: ['All digital sources. Your story lives in the cloud.'],
      all_sensor: ['Three sensors, one story. The house is vouching for you.'],
      all_testimony: ['Three humans telling the tale. Bold choice.'],
      all_physical: ['All physical records. Old-school for a smart pantry.'],
      digital_heavy: ['Mostly digital logs. The servers are doing the talking.'],
      sensor_heavy: ['Sensor-heavy story. The hardware has opinions.'],
      testimony_heavy: ['Human-heavy story. Lots of personal accounts.'],
      physical_heavy: ['Physical sources lead the way. Tangible, at least.'],
      mixed_strong: ['Varied sources, coherent story. Harder to poke.'],
      mixed_varied: ['Different angles. We will see if they line up.'],
    },

    objectionPrompt: {
      approval_rule: ['Settings require a fingerprint at the pantry door for approvals. Locking this in?'],
      door_idle: ['Panel stayed in standby overnight. Still backing this?'],
      shelf_photo: ['Shelf gauge photo shows 18 items in the legume bin. Keeping this?'],
      phone_approval: ['Phone app shows a green light from bed. Still going with that?'],
      door_recognized: ['Reader recognized your print and green-lit the order. Confident in that?'],
      auto_restock: ['Auto-restock kicked in because the shelf was empty. Sticking with that?'],
    },

    objectionStoodTruth: {
      approval_rule: ['Settings confirmed: purchases only clear with a pantry-door fingerprint.'],
      door_idle: ['Panel log confirmed: standby mode all night.'],
      shelf_photo: ['Photo verified: legume bin gauge at 18 items.'],
    },

    objectionStoodLie: {
      phone_approval: ['Phone approvals are not accepted here. Purchases only clear with a pantry-door fingerprint.'],
      door_recognized: ['Panel never left standby, so no print was recognized.'],
      auto_restock: ['Inventory counter logged 18 items all week. An empty shelf does not fit.'],
    },

    objectionWithdrew: {
      approval_rule: ['Dropping the approval rule. The gate just got wider.'],
      door_idle: ['Panel log withdrawn. Maybe the door did wake up.'],
      shelf_photo: ['Shelf photo pulled. The bin level is now a mystery.'],
      phone_approval: ['Phone approval story withdrawn. Back to square one.'],
      door_recognized: ['Reader recognition dropped. No more reader angle.'],
      auto_restock: ['Auto-restock excuse withdrawn. The pantry is back on you.'],
    },

    liesRevealed: {
      phone_approval: ['Phone app green light sounds nice, but purchases only clear with a pantry-door fingerprint. The app cannot do that.'],
      door_recognized: ['Reader recognition never happened. The panel stayed in standby all night.'],
      auto_restock: ['Auto-restock from an empty shelf? The inventory counter logged 18 items all week.'],
      multiple: ['Two stories fell apart. The beans are not amused.'],
      all: ['Phone approval cannot clear, the panel never woke, and the bin was not empty. Three misses.'],
    },
  },

  epilogue: 'A vendor catalog sync duplicated an old draft order and queued it without any approval scan. The access panel never woke, the bin stayed full, and the pantry still tried to stock a bunker. I canceled the duplicate and flagged the vendor feed.',
};

export default PUZZLE_BEAN_BONANZA;
