/**
 * KOA Casefiles - Sabotage Incident Blueprints
 *
 * Sabotage incidents involve damaging, disabling, or ruining something.
 * No theft - the goal is destruction or disruption.
 */

import type {
    IncidentBlueprint,
    EvidenceBudget,
    FallbackRule,
    AntiClimaxRule,
} from '../types.js';

// ============================================================================
// Common Evidence Budget for Sabotage
// ============================================================================

const SABOTAGE_EVIDENCE_BUDGET: EvidenceBudget = {
    whoChains: 2,
    whatChains: 1,     // Something is broken/ruined
    howChains: 1,      // Method of sabotage
    whenChains: 1,
    whereChains: 1,
    whyChains: 1,      // Motive (often revenge/rivalry)
    requiredModalities: ['device_log', 'physical', 'testimony'],
};

const STANDARD_FALLBACKS: FallbackRule[] = [
    {
        trigger: 'witness_present',
        actions: [
            { type: 'wait', ticks: 5 },
            { type: 'create_distraction', method: 'fake_errand' },
            { type: 'abort' },
        ],
    },
    {
        trigger: 'door_locked',
        actions: [
            { type: 'wait', ticks: 3 },
            { type: 'abort' },
        ],
    },
];

const STANDARD_ANTI_ANTICLIMAX: AntiClimaxRule[] = [
    { type: 'no_direct_witness', params: {} },
    { type: 'testimony_indirect', params: { maxConfidence: 0.7 } },
];

// ============================================================================
// Blueprint: Device Sabotage
// ============================================================================

/**
 * DEVICE_SABOTAGE - Mess with smart home devices
 *
 * Culprit tampers with a device to cause problems.
 * Ironic: sabotaging the devices that track them.
 */
export const DEVICE_SABOTAGE: IncidentBlueprint = {
    id: 'device_sabotage',
    name: 'Device Sabotage',
    incidentType: 'sabotage',

    roles: {
        required: [
            { id: 'culprit', archetypeConstraints: ['techie', 'troublemaker'] },
            { id: 'target' },  // Owner/user of the device
        ],
        optional: [
            { id: 'witnessA' },
        ],
    },

    requiredProps: {
        items: [],
        devices: [
            { type: 'motion_sensor', mustExist: true },
        ],
    },

    preconditions: [
        { type: 'role_has_access', params: { role: 'culprit', to: 'crimePlace' } },
        { type: 'device_exists', params: { type: 'motion_sensor', in: 'crimePlace' } },
    ],

    planSteps: [
        {
            id: 'approach',
            intent: { type: 'MOVE_TO', params: { destination: 'crimePlace' } },
            actor: 'culprit',
            target: 'crimePlace',
            generateEvents: ['NPC_MOVE', 'DOOR_OPENED', 'MOTION_DETECTED'],
        },
        {
            id: 'tamper',
            intent: { type: 'TAMPER', params: { action: 'disable' } },
            actor: 'culprit',
            target: 'targetDevice',
            generateEvents: ['DEVICE_TAMPERED'],
        },
        {
            id: 'retreat',
            intent: { type: 'MOVE_TO', params: { destination: 'alibiPlace' } },
            actor: 'culprit',
            generateEvents: ['NPC_MOVE'],
        },
    ],

    fallbacks: STANDARD_FALLBACKS,

    methodVariants: [
        {
            id: 'unplugged',
            name: 'Simple Unplug',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'device_log', certainty: 'guaranteed', impliesChain: 'when' },
                { kind: 'physical', certainty: 'guaranteed', impliesChain: 'how' },
                { kind: 'testimony', certainty: 'likely', impliesChain: 'who' },
            ],
            comedyHooks: ['pretended_accident', 'blamed_power_surge'],
        },
        {
            id: 'reprogrammed',
            name: 'Settings Tampering',
            requiredConditions: [
                { type: 'npc_trait', params: { archetype: 'techie' } },
            ],
            evidenceSignature: [
                { kind: 'device_log', certainty: 'guaranteed', impliesChain: 'when' },
                { kind: 'device_log', certainty: 'likely', impliesChain: 'who' },
            ],
            comedyHooks: ['over_complicated', 'left_debug_mode_on'],
        },
        {
            id: 'broke',
            name: 'Physical Damage',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'physical', certainty: 'guaranteed', impliesChain: 'how' },
                { kind: 'device_log', certainty: 'guaranteed', impliesChain: 'when' },
                { kind: 'testimony', certainty: 'likely', impliesChain: 'who' },
            ],
            comedyHooks: ['obvious_rage', 'unconvincing_accident_story'],
        },
    ],

    evidenceBudget: SABOTAGE_EVIDENCE_BUDGET,
    antiClimaxRules: STANDARD_ANTI_ANTICLIMAX,
    comedyTags: ['tech_revenge', 'smart_home_rebellion'],
};

// ============================================================================
// Blueprint: Recipe Sabotage
// ============================================================================

/**
 * RECIPE_SABOTAGE - Ruin someone's cooking/baking
 *
 * Classic cozy mystery fare. Swap ingredients, adjust settings.
 * High comedy potential.
 */
export const RECIPE_SABOTAGE: IncidentBlueprint = {
    id: 'recipe_sabotage',
    name: 'Recipe Sabotage',
    incidentType: 'sabotage',

    roles: {
        required: [
            { id: 'culprit' },
            { id: 'target' },  // The cook
        ],
        optional: [
            { id: 'witnessA', archetypeConstraints: ['nosy', 'early_bird'] },
            { id: 'redHerring', archetypeConstraints: ['slacker', 'troublemaker'] },
        ],
    },

    requiredProps: {
        items: [
            { category: 'food', affordances: ['swappable'] },
        ],
        devices: [],
    },

    preconditions: [
        { type: 'role_has_access', params: { role: 'culprit', to: 'kitchen' } },
        { type: 'item_in_place', params: { category: 'food', place: 'kitchen' } },
    ],

    planSteps: [
        {
            id: 'approach',
            intent: { type: 'MOVE_TO', params: { destination: 'kitchen' } },
            actor: 'culprit',
            target: 'kitchen',
            generateEvents: ['NPC_MOVE', 'DOOR_OPENED'],
        },
        {
            id: 'sabotage',
            intent: { type: 'SWAP', params: { action: 'swap_ingredient' } },
            actor: 'culprit',
            target: 'targetItem',
            generateEvents: ['ITEM_SWAPPED'],
        },
        {
            id: 'retreat',
            intent: { type: 'MOVE_TO', params: { destination: 'alibiPlace' } },
            actor: 'culprit',
            generateEvents: ['NPC_MOVE'],
        },
    ],

    fallbacks: [
        {
            trigger: 'witness_present',
            actions: [
                { type: 'create_distraction', method: 'fake_question' },
                { type: 'wait', ticks: 3 },
                { type: 'abort' },
            ],
        },
        ...STANDARD_FALLBACKS,
    ],

    methodVariants: [
        {
            id: 'swapped',
            name: 'Ingredient Swap',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'physical', certainty: 'guaranteed', impliesChain: 'how' },
                { kind: 'device_log', certainty: 'likely', impliesChain: 'when' },
                { kind: 'testimony', certainty: 'likely', impliesChain: 'who' },
            ],
            comedyHooks: ['salt_sugar_classic', 'wrong_spice'],
        },
        {
            id: 'reprogrammed',
            name: 'Oven Tampering',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'device_log', certainty: 'guaranteed', impliesChain: 'when' },
                { kind: 'device_log', certainty: 'likely', impliesChain: 'how' },
            ],
            comedyHooks: ['changed_temperature', 'turned_off_timer'],
        },
        {
            id: 'broke',
            name: 'Equipment Sabotage',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'physical', certainty: 'guaranteed', impliesChain: 'how' },
                { kind: 'testimony', certainty: 'likely', impliesChain: 'who' },
            ],
            comedyHooks: ['mixer_malfunction', 'hidden_utensil'],
        },
    ],

    evidenceBudget: SABOTAGE_EVIDENCE_BUDGET,
    antiClimaxRules: STANDARD_ANTI_ANTICLIMAX,
    comedyTags: ['bake_off_drama', 'kitchen_warfare', 'petty_revenge'],
};

// ============================================================================
// Blueprint: Event Sabotage
// ============================================================================

/**
 * EVENT_SABOTAGE - Ruin a planned event/gathering
 *
 * Culprit disrupts party, meeting, or special occasion.
 * Multiple sabotage points possible.
 */
export const EVENT_SABOTAGE: IncidentBlueprint = {
    id: 'event_sabotage',
    name: 'Event Sabotage',
    incidentType: 'sabotage',

    roles: {
        required: [
            { id: 'culprit' },
            { id: 'target' },  // Event organizer
        ],
        optional: [
            { id: 'witnessA' },
            { id: 'witnessB' },
            { id: 'accomplice' },
        ],
    },

    requiredProps: {
        items: [
            { category: 'decoration', affordances: ['fragile'] },
        ],
        devices: [
            { type: 'motion_sensor', mustExist: false },
        ],
    },

    preconditions: [
        { type: 'role_has_access', params: { role: 'culprit', to: 'eventPlace' } },
    ],

    planSteps: [
        {
            id: 'approach',
            intent: { type: 'MOVE_TO', params: { destination: 'eventPlace' } },
            actor: 'culprit',
            target: 'eventPlace',
            generateEvents: ['NPC_MOVE'],
        },
        {
            id: 'sabotage',
            intent: { type: 'TAMPER', params: { target: 'eventSetup' } },
            actor: 'culprit',
            generateEvents: ['ITEM_SWAPPED', 'DEVICE_TAMPERED'],
        },
        {
            id: 'cover',
            intent: { type: 'MOVE_TO', params: { destination: 'crowdPlace' } },
            actor: 'culprit',
            generateEvents: ['NPC_MOVE'],
        },
    ],

    fallbacks: STANDARD_FALLBACKS,

    methodVariants: [
        {
            id: 'broke',
            name: 'Decoration Destruction',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'physical', certainty: 'guaranteed', impliesChain: 'how' },
                { kind: 'testimony', certainty: 'likely', impliesChain: 'who' },
            ],
            comedyHooks: ['balloon_massacre', 'banner_incident'],
        },
        {
            id: 'unplugged',
            name: 'Sound/Light Sabotage',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'device_log', certainty: 'guaranteed', impliesChain: 'when' },
                { kind: 'testimony', certainty: 'likely', impliesChain: 'who' },
            ],
            comedyHooks: ['playlist_swap', 'disco_malfunction'],
        },
        {
            id: 'reprogrammed',
            name: 'Schedule Chaos',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'device_log', certainty: 'likely', impliesChain: 'when' },
                { kind: 'testimony', certainty: 'guaranteed', impliesChain: 'how' },
            ],
            comedyHooks: ['sent_wrong_time', 'cancelled_catering'],
        },
    ],

    evidenceBudget: SABOTAGE_EVIDENCE_BUDGET,
    antiClimaxRules: STANDARD_ANTI_ANTICLIMAX,
    comedyTags: ['party_pooper', 'event_drama', 'social_warfare'],
};

// ============================================================================
// Registry
// ============================================================================

export const SABOTAGE_BLUEPRINTS: IncidentBlueprint[] = [
    DEVICE_SABOTAGE,
    RECIPE_SABOTAGE,
    EVENT_SABOTAGE,
];

export function getSabotageBlueprint(id: string): IncidentBlueprint | undefined {
    return SABOTAGE_BLUEPRINTS.find(b => b.id === id);
}
