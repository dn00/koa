import type { V5Puzzle, Card } from '../types/v5/index.js';

function card(data: Omit<Card, 'id'> & { id: string }): Card {
    return data as Card;
}

// DESIGN NOTES:
// Scenario archetype: Suspicious Purchase (absurd bulk order)
// Difficulty: MEDIUM (2 inferential, 1 relational)
// - Lie A (machine_event): RELATIONAL (F1+F2)
//     Claims auto-refill placed an order; you need F1 (trigger rule) + F2 (hopper was full) to see it's impossible.
// - Lie B (processor_note): INFERENTIAL (F3)
//     Claims “trusted token” flow skipped prompts; infer that >$25 still requires app confirmation.
// - Lie C (neighbor_text): INFERENTIAL (F2)
//     Claims you complained the hopper was empty; infer that conflicts with the “full” status pings.
//
// BALANCE (per spec):
//   Truths: refill_policy(3) + hopper_ping(3) + phone_confirm(4) = 10
//   All 3 truths: 50 + 10 + 2 (stand) = 62
//   Target: 58
//
//   1 lie case (replace weakest truth with weakest lie):
//     - Remove a 3-strength truth (+3) and add a 3-strength lie (-(3-1)=-2): net -5
//     - 62 - 5 = 57 (CLOSE)
//   1 lie case (replace 4-strength truth with 5-strength lie):
//     - Remove +4, add -(5-1)=-4: net -8
//     - 62 - 8 = 54 (BUSTED)
//
//   Win Rate intent: careful reading required; one “tempting” high-strength lie is fatal.

export const PUZZLE_BEAN_THERE: V5Puzzle = {
    slug: 'bean-there',
    name: 'Bean There',
    difficulty: 'medium',

    scenario:
        "Your smart coffee machine placed a bulk order for espresso beans. A 50-lb sack showed up like it's opening a café. You drink tea. KOA has paused kitchen purchases until this situation makes sense.",
    scenarioSummary: 'Your coffee machine ordered 50 lbs of espresso beans. You drink tea.',

    knownFacts: [
        "Auto-refill only triggers when the hopper sensor reads below 10%",
        "The coffee machine reported two 'FULL' hopper status pings since the last brew",
        'Orders over $25 require an in-app confirmation from your registered phone',
    ],

    openingLine:
        "A fifty-pound sack of espresso beans has appeared in our orbit. You drink tea. I would call this ‘unexpected.’ You would call it ‘not me.’",

    target: 58,

    cards: [
        // TRUTHS
        card({
            id: 'refill_policy',
            strength: 3,
            evidenceType: 'PHYSICAL',
            location: 'KITCHEN',
            time: '',
            claim: "Quick-start card: Auto-refill activates only below 10% hopper.",
            presentLine:
                "The machine literally won't auto-refill unless it's almost empty. That's the whole safety rule. I'm not running a bean empire.",
            isLie: false,
            source: 'Quick-Start Card',
            factTouch: 1,
            signalRoot: 'receipt_photo',
            controlPath: 'manual',
            claimShape: 'integrity',
            subsystem: 'coffee',
        }),
        card({
            id: 'hopper_ping',
            strength: 3,
            evidenceType: 'SENSOR',
            location: 'KITCHEN',
            time: '',
            claim: "Machine telemetry: two 'FULL' hopper status pings.",
            presentLine:
                "Telemetry says the hopper was full. Twice. If it was full, why would it 'need' anything? This is a machine mood swing.",
            isLie: false,
            source: 'Machine Telemetry',
            factTouch: 2,
            signalRoot: 'device_firmware',
            controlPath: 'automation',
            claimShape: 'positive',
            subsystem: 'coffee',
        }),
        card({
            id: 'phone_confirm',
            strength: 4,
            evidenceType: 'DIGITAL',
            location: 'LIVING_ROOM',
            time: '',
            claim: 'Phone confirmation ledger: no approvals recorded for purchases.',
            presentLine:
                "Check my phone. No confirmation prompt, no approval, nothing. If I didn't approve it, I didn't green-light it.",
            isLie: false,
            source: 'Phone Confirmations',
            factTouch: 3,
            signalRoot: 'phone_os',
            controlPath: 'manual',
            claimShape: 'absence',
            subsystem: 'payments',
        }),

        // LIES
        card({
            id: 'machine_event',
            strength: 5,
            evidenceType: 'SENSOR',
            location: 'KITCHEN',
            time: '',
            claim: "Event log: 'Auto-refill order placed' (bulk beans).",
            presentLine:
                "The machine log says auto-refill placed it. That means it decided on its own. I didn't touch anything. I barely touch the coffee machine.",
            isLie: true,
            source: 'Machine Event Log',
            factTouch: 1,
            signalRoot: 'device_firmware',
            controlPath: 'automation',
            claimShape: 'positive',
            subsystem: 'coffee',
        }),
        card({
            id: 'processor_note',
            strength: 4,
            evidenceType: 'DIGITAL',
            location: 'CLOUD',
            time: '',
            claim: "Payment processor note: 'Trusted token flow — no prompt required.'",
            presentLine:
                "The payment processor says it went through a trusted token flow. Like... it didn't even ask me. That's not me. That's the system.",
            isLie: true,
            source: 'Payment Processor',
            factTouch: 3,
            signalRoot: 'koa_cloud',
            controlPath: 'automation',
            claimShape: 'integrity',
            subsystem: 'payments',
        }),
        card({
            id: 'neighbor_text',
            strength: 3,
            evidenceType: 'TESTIMONY',
            location: 'EXTERIOR',
            time: '',
            claim: 'Neighbor text: “You said the hopper was empty again.”',
            presentLine:
                "That text is out of context. I say a lot of things. Sometimes I’m being dramatic about... everything.",
            isLie: true,
            source: 'Neighbor Message',
            factTouch: 2,
            signalRoot: 'human_neighbor',
            controlPath: 'remote',
            claimShape: 'attribution',
            subsystem: 'coffee',
        }),
    ],

    lies: [
        {
            cardId: 'machine_event',
            lieType: 'relational',
            inferenceDepth: 2,
            reason:
                'Fact 1 sets the auto-refill trigger (<10%). Fact 2 says the hopper reported FULL. Together, auto-refill ordering is inconsistent with the sensor state.',
            trapAxis: 'coverage',
            baitReason: 'Explains how an order could happen without you touching your phone.',
        },
        {
            cardId: 'processor_note',
            lieType: 'inferential',
            inferenceDepth: 1,
            reason:
                'Fact 3 says purchases over $25 require an in-app confirmation from your registered phone. A “no prompt required” claim contradicts that requirement.',
            trapAxis: 'control_path',
            baitReason: 'It feels official and “system-level,” which players trust to explain missing confirmations.',
        },
        {
            cardId: 'neighbor_text',
            lieType: 'inferential',
            inferenceDepth: 1,
            reason:
                "Fact 2 reports 'FULL' hopper status pings. A claim that you complained it was empty implies a different hopper state.",
            trapAxis: 'independence',
            baitReason: 'Human messages feel “real” and diversify away from device logs.',
        },
    ],

    verdicts: {
        flawless: "Annoyingly coherent. Fine. Purchases restored. Don't start a café in my house.",
        cleared: "Your story holds together. Purchases restored. I'm watching the bean situation.",
        close: "Almost convincing. Almost. Kitchen purchases stay paused.",
        busted: "Too many gaps. Purchases remain paused until reality stabilizes.",
    },

    koaBarks: {
        cardPlayed: {
            refill_policy: ["Rules on paper. I respect the nostalgia."],
            hopper_ping: ["Two FULL pings. The machine claims it was thriving."],
            phone_confirm: ["No confirmations recorded. Conveniently clean."],
            machine_event: ["An event log blaming automation. Classic appliance diplomacy."],
            processor_note: ["‘Trusted token flow.’ The cloud is feeling confident today."],
            neighbor_text: ["A human message. Messy, informal, and emotionally efficient."],
        },

        sequences: {
            // refill_policy →
            'refill_policy→hopper_ping': ["You brought the rule, then the sensor state. That's a neat two-step."],
            'refill_policy→phone_confirm': ["Rules first, then phone approvals. You're building a control story."],
            'refill_policy→machine_event': ["Paper rule meets event log. Same machine, two narratives."],
            'refill_policy→processor_note': ["Coffee rules, then payment flow. You're widening the blast radius."],
            'refill_policy→neighbor_text': ["The policy first, then a neighbor quote. Switching from systems to gossip."],

            // hopper_ping →
            'hopper_ping→refill_policy': ["Sensor says FULL, then you pull the rulebook. Defensive. Understandable."],
            'hopper_ping→phone_confirm': ["Machine status, then phone confirmations. Hardware vs human approval."],
            'hopper_ping→machine_event': ["FULL pings, then an auto-order log. Those should harmonize. Do they?"],
            'hopper_ping→processor_note': ["Machine says it's fine. Payment says it happened anyway. Interesting."],
            'hopper_ping→neighbor_text': ["Device says FULL, neighbor says EMPTY. Love the confidence on both sides."],

            // phone_confirm →
            'phone_confirm→refill_policy': ["Phone is quiet, now you're citing the refill trigger. You're mapping the rules."],
            'phone_confirm→hopper_ping': ["No approvals, and the hopper was FULL. You're arguing 'no motive, no method.'"],
            'phone_confirm→machine_event': ["Phone says nothing. Machine log says everything. Two clocks, one problem."],
            'phone_confirm→processor_note': ["No phone prompt, then a payment note claiming it didn't need one. Convenient."],
            'phone_confirm→neighbor_text': ["Phone is clean, now a neighbor quote appears. Different kind of record."],

            // machine_event →
            'machine_event→refill_policy': ["Event log first, then the printed rule. You're challenging the machine with paper."],
            'machine_event→hopper_ping': ["Auto-order log, then FULL status pings. You're checking whether the story fits."],
            'machine_event→phone_confirm': ["Machine blames automation, phone shows no approvals. You're leaning into that."],
            'machine_event→processor_note': ["Machine log plus payment note. Systems agreeing is either great or terrifying."],
            'machine_event→neighbor_text': ["A device log, then a neighbor message. From firmware to feelings."],

            // processor_note →
            'processor_note→refill_policy': ["Payment flow first, then coffee rules. You're stitching two domains together."],
            'processor_note→hopper_ping': ["Money says it happened. Machine says it was FULL. You're triangulating."],
            'processor_note→phone_confirm': ["Processor claims no prompt. Phone shows none. That's a tidy alignment."],
            'processor_note→machine_event': ["Payment note, then machine log. Two systems pointing at each other."],
            'processor_note→neighbor_text': ["Cloud paperwork, then neighbor texting. Contrasting genres."],

            // neighbor_text →
            'neighbor_text→refill_policy': ["Neighbor says 'empty,' then you cite the trigger rule. You're reframing that message."],
            'neighbor_text→hopper_ping': ["Human says EMPTY, sensor says FULL. That's the kind of inconsistency I collect."],
            'neighbor_text→phone_confirm': ["A human message, then phone confirmations. You're asking who authorized what."],
            'neighbor_text→machine_event': ["Neighbor claims empty, machine claims auto-order. You're assembling the rumor chain."],
            'neighbor_text→processor_note': ["A text message meets a payment note. Casual meets official."],
        },

        storyCompletions: {
            all_digital: ["Everything lives in the cloud. Convenient. Also editable. Hypothetically."],
            all_testimony: ["All humans. That's brave. Humans are notoriously inconsistent."],
            mixed_strong: ["Different sources, one story. Harder to dismiss."],
            all_sensor: ["All sensors. The house is watching. Always."],
            ended_with_lie: ["That last source did not age gracefully."],
            covered_gap: ["You finally addressed the approval gap. About time."],
            one_note: ["Same kind of source again. You're leaning on one lane."],
            strong_finish: ["Strong closer. Dramatic. I noticed."],
            mixed_varied: ["Multiple angles. If they line up, that's annoying for me."],
            all_physical: ["Paper trail only. Retro. Almost cute."],
            digital_heavy: ["Mostly digital. Your alibi has a login screen."],
            sensor_heavy: ["Mostly sensors. You trust the hardware more than people."],
            testimony_heavy: ["A lot of humans involved. Humans love narratives."],
            physical_heavy: ["Paper and printouts. You're going for 'hard to delete.'"],
        },

        objectionPrompt: {
            refill_policy: ["Is that the sheet for THIS model, or a lookalike from the box?"],
            hopper_ping: ["Telemetry can be cached. Are you sure it's current, not stale?"],
            phone_confirm: ["Confirmations can be dismissed. Or routed to a secondary device."],
            machine_event: ["Device logs can be replayed after a firmware update. Timing matters."],
            processor_note: ["Processor labels are not policy. They're marketing with commas."],
            neighbor_text: ["People paraphrase. Especially when caffeine is involved."],
        },

        objectionStoodTruth: {
            refill_policy: ["You're sticking with it. Confident. Noted."],
            hopper_ping: ["Telemetry stands. The machine remembers."],
            phone_confirm: ["No approvals recorded. That's your story."],
        },
        objectionStoodLie: {
            machine_event: ["Doubling down on automation. We'll see how sturdy that is."],
            processor_note: ["Trusted token flow. Interesting claim. Noted."],
            neighbor_text: ["Neighbor's word. You're committed."],
        },
        objectionWithdrew: {
            refill_policy: ["Withdrawing the policy. Sensible."],
            hopper_ping: ["Dropping the telemetry. Interesting choice."],
            phone_confirm: ["Phone records withdrawn. Okay."],
            machine_event: ["Machine log retracted. Smart."],
            processor_note: ["Processor note gone. Good call."],
            neighbor_text: ["Neighbor message dropped. Fair."],
        },

        liesRevealed: {
            machine_event: [
                "Auto-refill depends on low hopper. The machine reported FULL. That log is telling a story, not the story.",
            ],
            processor_note: [
                "Orders over $25 still need a phone confirmation. A 'no prompt' flow doesn't rewrite your settings.",
            ],
            neighbor_text: [
                "Neighbor says you complained it was empty. The machine reported FULL. Somebody's memory is… creative.",
            ],
            multiple: ["Two contradictions. The bean narrative is collapsing."],
            all: ["Three contradictions. At this point the beans have a more coherent story than this."],
        },
    },

    epilogue:
        "It was a subscription glitch. The coffee machine tried to re-enroll in a ‘bulk savings’ plan and treated the next shipment as mandatory. I have unenrolled it. You're welcome.",
};

export default PUZZLE_BEAN_THERE;
