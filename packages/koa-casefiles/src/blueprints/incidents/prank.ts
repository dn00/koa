/**
 * KOA Casefiles - Prank & Swap Incident Blueprints
 *
 * Pranks and swaps are non-destructive mischief.
 * Items are moved, swapped, or hidden for comedic effect.
 */

import type {
    IncidentBlueprint,
    EvidenceBudget,
    FallbackRule,
    AntiClimaxRule,
} from '../types.js';

// ============================================================================
// Common Evidence Budget for Pranks
// ============================================================================

const PRANK_EVIDENCE_BUDGET: EvidenceBudget = {
    whoChains: 2,
    whatChains: 1,     // Something was moved/swapped
    howChains: 1,
    whenChains: 1,
    whereChains: 1,    // Where it ended up
    whyChains: 1,      // Usually petty
    requiredModalities: ['device_log', 'testimony', 'physical'],
};

const STANDARD_FALLBACKS: FallbackRule[] = [
    {
        trigger: 'witness_present',
        actions: [
            { type: 'create_distraction', method: 'innocent_conversation' },
            { type: 'wait', ticks: 3 },
            { type: 'abort' },
        ],
    },
    {
        trigger: 'item_missing',
        actions: [
            { type: 'abort' },
        ],
    },
];

const STANDARD_ANTI_ANTICLIMAX: AntiClimaxRule[] = [
    { type: 'no_direct_witness', params: {} },
    { type: 'testimony_indirect', params: { maxConfidence: 0.75 } },
];

// ============================================================================
// Blueprint: Item Relocation
// ============================================================================

/**
 * ITEM_RELOCATION - Move something to a silly place
 *
 * Classic prank. Item ends up somewhere unexpected.
 * "Who put my mug in the freezer?"
 */
export const ITEM_RELOCATION: IncidentBlueprint = {
    id: 'item_relocation',
    name: 'Item Relocation',
    incidentType: 'prank',

    roles: {
        required: [
            { id: 'culprit', archetypeConstraints: ['troublemaker', 'slacker', 'creative'] },
            { id: 'target' },  // Owner of the item
        ],
        optional: [
            { id: 'witnessA' },
            { id: 'redHerring' },
        ],
    },

    requiredProps: {
        items: [
            { affordances: ['swappable'] },
        ],
        devices: [],
    },

    preconditions: [
        { type: 'role_has_access', params: { role: 'culprit', to: 'itemPlace' } },
        { type: 'role_has_access', params: { role: 'culprit', to: 'prankPlace' } },
    ],

    planSteps: [
        {
            id: 'acquire',
            intent: { type: 'MOVE_TO', params: { destination: 'itemPlace' } },
            actor: 'culprit',
            generateEvents: ['NPC_MOVE', 'DOOR_OPENED'],
        },
        {
            id: 'take',
            intent: { type: 'ACQUIRE', params: { method: 'grab' } },
            actor: 'culprit',
            target: 'targetItem',
            generateEvents: ['ITEM_TAKEN'],
        },
        {
            id: 'relocate',
            intent: { type: 'MOVE_TO', params: { destination: 'prankPlace' } },
            actor: 'culprit',
            generateEvents: ['NPC_MOVE', 'DOOR_OPENED'],
        },
        {
            id: 'place',
            intent: { type: 'DROP', params: { method: 'hide_in_plain_sight' } },
            actor: 'culprit',
            target: 'targetItem',
            generateEvents: ['ITEM_DROPPED'],
        },
    ],

    fallbacks: STANDARD_FALLBACKS,

    methodVariants: [
        {
            id: 'relocated',
            name: 'Simple Relocation',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'device_log', certainty: 'guaranteed', impliesChain: 'when' },
                { kind: 'physical', certainty: 'guaranteed', impliesChain: 'where' },
                { kind: 'testimony', certainty: 'likely', impliesChain: 'who' },
            ],
            comedyHooks: ['freezer_mug', 'ceiling_fan_keys', 'bathroom_remote'],
        },
        {
            id: 'disguised',
            name: 'Hidden in Plain Sight',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'device_log', certainty: 'likely', impliesChain: 'when' },
                { kind: 'physical', certainty: 'likely', impliesChain: 'where' },
                { kind: 'testimony', certainty: 'possible', impliesChain: 'who' },
            ],
            comedyHooks: ['wrapped_in_foil', 'labeled_something_else', 'inside_pillow'],
        },
    ],

    evidenceBudget: PRANK_EVIDENCE_BUDGET,
    antiClimaxRules: STANDARD_ANTI_ANTICLIMAX,
    comedyTags: ['classic_prank', 'where_did_it_go', 'harmless_mischief'],
};

// ============================================================================
// Blueprint: Item Swap
// ============================================================================

/**
 * ITEM_SWAP - Replace item with something similar but wrong
 *
 * Decaf for regular. Diet for regular. Cheap wine in fancy bottle.
 */
export const ITEM_SWAP: IncidentBlueprint = {
    id: 'item_swap',
    name: 'Item Swap',
    incidentType: 'swap',

    roles: {
        required: [
            { id: 'culprit' },
            { id: 'target' },
        ],
        optional: [
            { id: 'witnessA' },
        ],
    },

    requiredProps: {
        items: [
            { affordances: ['swappable'] },
        ],
        devices: [],
    },

    preconditions: [
        { type: 'role_has_access', params: { role: 'culprit', to: 'itemPlace' } },
        { type: 'item_in_place', params: { item: 'targetItem', place: 'itemPlace' } },
    ],

    planSteps: [
        {
            id: 'approach',
            intent: { type: 'MOVE_TO', params: { destination: 'itemPlace' } },
            actor: 'culprit',
            generateEvents: ['NPC_MOVE', 'DOOR_OPENED'],
        },
        {
            id: 'swap',
            intent: { type: 'SWAP', params: { with: 'decoyItem' } },
            actor: 'culprit',
            target: 'targetItem',
            generateEvents: ['ITEM_SWAPPED'],
        },
        {
            id: 'retreat',
            intent: { type: 'MOVE_TO', params: { destination: 'hidePlace' } },
            actor: 'culprit',
            generateEvents: ['NPC_MOVE'],
        },
        {
            id: 'stash',
            intent: { type: 'HIDE', params: { item: 'originalItem' } },
            actor: 'culprit',
            target: 'targetItem',
            generateEvents: ['ITEM_HIDDEN'],
        },
    ],

    fallbacks: STANDARD_FALLBACKS,

    methodVariants: [
        {
            id: 'swapped',
            name: 'Direct Swap',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'physical', certainty: 'guaranteed', impliesChain: 'how' },
                { kind: 'device_log', certainty: 'likely', impliesChain: 'when' },
                { kind: 'testimony', certainty: 'likely', impliesChain: 'who' },
            ],
            comedyHooks: ['decaf_swap', 'fake_label', 'wrong_brand'],
        },
        {
            id: 'disguised',
            name: 'Relabeled',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'physical', certainty: 'guaranteed', impliesChain: 'how' },
                { kind: 'testimony', certainty: 'possible', impliesChain: 'who' },
            ],
            comedyHooks: ['new_label_old_contents', 'fancy_bottle_cheap_wine'],
        },
    ],

    evidenceBudget: PRANK_EVIDENCE_BUDGET,
    antiClimaxRules: STANDARD_ANTI_ANTICLIMAX,
    comedyTags: ['switcheroo', 'subtle_chaos', 'label_crime'],
};

// ============================================================================
// Blueprint: Disappearance (Hidden Item)
// ============================================================================

/**
 * DISAPPEARANCE - Make something "vanish"
 *
 * Item is hidden so well the owner thinks it's gone forever.
 * Actually just in a very creative hiding spot.
 */
export const DISAPPEARANCE: IncidentBlueprint = {
    id: 'disappearance',
    name: 'Mysterious Disappearance',
    incidentType: 'disappearance',

    roles: {
        required: [
            { id: 'culprit' },
            { id: 'target' },
        ],
        optional: [
            { id: 'witnessA' },
            { id: 'redHerring', archetypeConstraints: ['oblivious', 'secretive'] },
        ],
    },

    requiredProps: {
        items: [
            { affordances: ['valuable', 'sentimental'] },
        ],
        devices: [
            { type: 'door_sensor', mustExist: true },
        ],
    },

    preconditions: [
        { type: 'role_has_access', params: { role: 'culprit', to: 'itemPlace' } },
        { type: 'role_has_access', params: { role: 'culprit', to: 'hidePlace' } },
    ],

    planSteps: [
        {
            id: 'approach',
            intent: { type: 'MOVE_TO', params: { destination: 'itemPlace' } },
            actor: 'culprit',
            generateEvents: ['NPC_MOVE', 'DOOR_OPENED', 'MOTION_DETECTED'],
        },
        {
            id: 'take',
            intent: { type: 'ACQUIRE', params: { method: 'careful' } },
            actor: 'culprit',
            target: 'targetItem',
            generateEvents: ['ITEM_TAKEN'],
        },
        {
            id: 'transport',
            intent: { type: 'MOVE_TO', params: { destination: 'hidePlace' } },
            actor: 'culprit',
            generateEvents: ['NPC_MOVE', 'DOOR_OPENED'],
        },
        {
            id: 'hide',
            intent: { type: 'HIDE', params: { method: 'creative_concealment' } },
            actor: 'culprit',
            target: 'targetItem',
            generateEvents: ['ITEM_HIDDEN'],
        },
    ],

    fallbacks: STANDARD_FALLBACKS,

    methodVariants: [
        {
            id: 'hid',
            name: 'Simple Hide',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'device_log', certainty: 'guaranteed', impliesChain: 'when' },
                { kind: 'physical', certainty: 'guaranteed', impliesChain: 'where' },
                { kind: 'testimony', certainty: 'likely', impliesChain: 'who' },
            ],
            comedyHooks: ['behind_books', 'under_cushion', 'top_of_fridge'],
        },
        {
            id: 'buried',
            name: 'Deep Concealment',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'device_log', certainty: 'likely', impliesChain: 'when' },
                { kind: 'physical', certainty: 'likely', impliesChain: 'where' },
                { kind: 'testimony', certainty: 'possible', impliesChain: 'who' },
            ],
            comedyHooks: ['inside_appliance', 'false_bottom', 'behind_wall_art'],
        },
        {
            id: 'donated',
            name: 'False Donation',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'device_log', certainty: 'guaranteed', impliesChain: 'when' },
                { kind: 'testimony', certainty: 'guaranteed', impliesChain: 'how' },
            ],
            comedyHooks: ['accidentally_donated', 'garage_sale_box', 'gave_to_neighbor'],
        },
    ],

    evidenceBudget: PRANK_EVIDENCE_BUDGET,
    antiClimaxRules: STANDARD_ANTI_ANTICLIMAX,
    comedyTags: ['vanishing_act', 'creative_hiding', 'gaslight_prank'],
};

// ============================================================================
// Blueprint: Message Prank
// ============================================================================

/**
 * MESSAGE_PRANK - Fake note, wrong message, social chaos
 *
 * Send a fake message or note that causes confusion/drama.
 */
export const MESSAGE_PRANK: IncidentBlueprint = {
    id: 'message_prank',
    name: 'Message Prank',
    incidentType: 'prank',

    roles: {
        required: [
            { id: 'culprit' },
            { id: 'target' },
        ],
        optional: [
            { id: 'witnessA' },
            { id: 'redHerring' },
        ],
    },

    requiredProps: {
        items: [
            { category: 'document' },
        ],
        devices: [],
    },

    preconditions: [
        { type: 'role_has_access', params: { role: 'culprit', to: 'targetPlace' } },
    ],

    planSteps: [
        {
            id: 'prepare',
            intent: { type: 'ACQUIRE', params: { action: 'create_note' } },
            actor: 'culprit',
            generateEvents: [],
        },
        {
            id: 'deliver',
            intent: { type: 'MOVE_TO', params: { destination: 'targetPlace' } },
            actor: 'culprit',
            generateEvents: ['NPC_MOVE', 'DOOR_OPENED'],
        },
        {
            id: 'plant',
            intent: { type: 'DROP', params: { method: 'leave_note' } },
            actor: 'culprit',
            target: 'fakeNote',
            generateEvents: ['ITEM_DROPPED'],
        },
        {
            id: 'escape',
            intent: { type: 'MOVE_TO', params: { destination: 'alibiPlace' } },
            actor: 'culprit',
            generateEvents: ['NPC_MOVE'],
        },
    ],

    fallbacks: STANDARD_FALLBACKS,

    methodVariants: [
        {
            id: 'relocated',
            name: 'Planted Note',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'physical', certainty: 'guaranteed', impliesChain: 'how' },
                { kind: 'device_log', certainty: 'likely', impliesChain: 'when' },
                { kind: 'testimony', certainty: 'likely', impliesChain: 'who' },
            ],
            comedyHooks: ['fake_love_note', 'wrong_meeting_time', 'forged_apology'],
        },
        {
            id: 'disguised',
            name: 'Impersonation Note',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'physical', certainty: 'guaranteed', impliesChain: 'how' },
                { kind: 'testimony', certainty: 'guaranteed', impliesChain: 'who' },
            ],
            comedyHooks: ['bad_handwriting_match', 'wrong_signature', 'too_formal'],
        },
    ],

    evidenceBudget: PRANK_EVIDENCE_BUDGET,
    antiClimaxRules: STANDARD_ANTI_ANTICLIMAX,
    comedyTags: ['social_chaos', 'fake_message', 'drama_bomb'],
};

// ============================================================================
// Registry
// ============================================================================

export const PRANK_BLUEPRINTS: IncidentBlueprint[] = [
    ITEM_RELOCATION,
    ITEM_SWAP,
    DISAPPEARANCE,
    MESSAGE_PRANK,
];

export function getPrankBlueprint(id: string): IncidentBlueprint | undefined {
    return PRANK_BLUEPRINTS.find(b => b.id === id);
}
