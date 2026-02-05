/**
 * KOA Casefiles - Theft Incident Blueprints
 *
 * Theft incidents involve taking an item and hiding/removing it.
 * Multiple method variants create different evidence patterns.
 */

import type {
    IncidentBlueprint,
    MethodVariant,
    PlanStep,
    FallbackRule,
    EvidenceBudget,
    AntiClimaxRule,
} from '../types.js';

// ============================================================================
// Common Evidence Budget for Theft
// ============================================================================

const THEFT_EVIDENCE_BUDGET: EvidenceBudget = {
    whoChains: 2,      // Need 2 independent ways to identify culprit
    whatChains: 1,     // Item is missing
    howChains: 1,      // Method of acquisition
    whenChains: 1,     // Time window
    whereChains: 1,    // Crime location + hide location
    whyChains: 1,      // Motive
    requiredModalities: ['device_log', 'testimony', 'physical'],
};

// ============================================================================
// Common Fallback Rules
// ============================================================================

const STANDARD_FALLBACKS: FallbackRule[] = [
    {
        trigger: 'witness_present',
        actions: [
            { type: 'wait', ticks: 5 },
            { type: 'create_distraction', method: 'noise_other_room' },
            { type: 'abort' },
        ],
    },
    {
        trigger: 'door_locked',
        actions: [
            { type: 'wait', ticks: 3 },
            { type: 'alternate_route', via: { type: 'transition' } },
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

// ============================================================================
// Anti-Anticlimax Rules
// ============================================================================

const STANDARD_ANTI_ANTICLIMAX: AntiClimaxRule[] = [
    { type: 'no_direct_witness', params: {} },
    { type: 'testimony_indirect', params: { maxConfidence: 0.7 } },
];

// ============================================================================
// Blueprint: Quick Snatch
// ============================================================================

/**
 * QUICK_SNATCH - Fast grab-and-go theft
 *
 * Culprit moves to item location, grabs it, hides it elsewhere.
 * Simple but leaves clear movement trail.
 */
export const QUICK_SNATCH: IncidentBlueprint = {
    id: 'quick_snatch',
    name: 'Quick Snatch',
    incidentType: 'theft',

    roles: {
        required: [
            { id: 'culprit' },
            { id: 'target' },  // Owner of the item
        ],
        optional: [
            { id: 'witnessA', archetypeConstraints: ['nosy', 'paranoid', 'insomniac'] },
            { id: 'redHerring', archetypeConstraints: ['troublemaker', 'secretive'] },
        ],
    },

    requiredProps: {
        items: [{ category: 'collectible', affordances: ['valuable'] }],
        devices: [{ type: 'door_sensor', mustExist: true }],
    },

    preconditions: [
        { type: 'role_has_access', params: { role: 'culprit', to: 'crimePlace' } },
        { type: 'item_in_place', params: { item: 'target', place: 'crimePlace' } },
        { type: 'npc_schedule_gap', params: { role: 'culprit', duration: 10 } },
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
            id: 'acquire',
            intent: { type: 'ACQUIRE', params: { method: 'grab' } },
            actor: 'culprit',
            target: 'targetItem',
            generateEvents: ['ITEM_TAKEN'],
        },
        {
            id: 'retreat',
            intent: { type: 'MOVE_TO', params: { destination: 'hidePlace' } },
            actor: 'culprit',
            target: 'hidePlace',
            generateEvents: ['NPC_MOVE', 'DOOR_OPENED'],
        },
        {
            id: 'hide',
            intent: { type: 'HIDE', params: { method: 'conceal' } },
            actor: 'culprit',
            target: 'targetItem',
            generateEvents: ['ITEM_HIDDEN'],
        },
    ],

    fallbacks: STANDARD_FALLBACKS,

    methodVariants: [
        {
            id: 'grabbed',
            name: 'Quick Grab',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'device_log', certainty: 'guaranteed', impliesChain: 'when' },
                { kind: 'physical', certainty: 'guaranteed', impliesChain: 'where' },
                { kind: 'testimony', certainty: 'likely', impliesChain: 'who' },
            ],
            comedyHooks: ['fumbled_grab', 'obvious_haste'],
        },
        {
            id: 'pocketed',
            name: 'Smooth Pocket',
            requiredConditions: [
                { type: 'item_property', params: { size: 'small' } },
            ],
            evidenceSignature: [
                { kind: 'device_log', certainty: 'guaranteed', impliesChain: 'when' },
                { kind: 'physical', certainty: 'likely', impliesChain: 'where' },
                { kind: 'testimony', certainty: 'possible', impliesChain: 'who' },
            ],
            comedyHooks: ['suspicious_bulge', 'fell_out_of_pocket'],
        },
        {
            id: 'smuggled',
            name: 'Bag Smuggle',
            requiredConditions: [
                { type: 'npc_trait', params: { has: 'carries_bag' } },
            ],
            evidenceSignature: [
                { kind: 'device_log', certainty: 'guaranteed', impliesChain: 'when' },
                { kind: 'physical', certainty: 'possible', impliesChain: 'where' },
                { kind: 'testimony', certainty: 'likely', impliesChain: 'who' },
            ],
            comedyHooks: ['suspiciously_heavy_bag', 'bag_contents_shifted'],
        },
    ],

    evidenceBudget: THEFT_EVIDENCE_BUDGET,
    antiClimaxRules: STANDARD_ANTI_ANTICLIMAX,
    comedyTags: ['petty_theft', 'household_drama'],
};

// ============================================================================
// Blueprint: Opportunistic Theft
// ============================================================================

/**
 * OPPORTUNISTIC_THEFT - Takes advantage of a distraction
 *
 * Culprit waits for or creates a distraction, then strikes.
 * Harder to pin down timing due to chaos.
 */
export const OPPORTUNISTIC_THEFT: IncidentBlueprint = {
    id: 'opportunistic_theft',
    name: 'Opportunistic Theft',
    incidentType: 'theft',

    roles: {
        required: [
            { id: 'culprit' },
            { id: 'target' },
        ],
        optional: [
            { id: 'distractor', archetypeConstraints: ['troublemaker', 'social_butterfly'] },
            { id: 'witnessA' },
        ],
    },

    requiredProps: {
        items: [{ affordances: ['valuable', 'sentimental'] }],
        devices: [{ type: 'motion_sensor', mustExist: true }],
    },

    preconditions: [
        { type: 'role_has_access', params: { role: 'culprit', to: 'crimePlace' } },
        { type: 'visibility_low', params: { place: 'crimePlace' } },
    ],

    planSteps: [
        {
            id: 'position',
            intent: { type: 'MOVE_TO', params: { destination: 'nearCrimePlace' } },
            actor: 'culprit',
            target: 'crimePlace',
            generateEvents: ['NPC_MOVE'],
        },
        {
            id: 'wait_distraction',
            intent: { type: 'WAIT', params: { condition: 'distraction_active' } },
            actor: 'culprit',
            generateEvents: [],
            optional: true,
        },
        {
            id: 'strike',
            intent: { type: 'MOVE_TO', params: { destination: 'crimePlace' } },
            actor: 'culprit',
            target: 'crimePlace',
            generateEvents: ['NPC_MOVE', 'DOOR_OPENED'],
        },
        {
            id: 'acquire',
            intent: { type: 'ACQUIRE', params: { method: 'quick' } },
            actor: 'culprit',
            target: 'targetItem',
            generateEvents: ['ITEM_TAKEN'],
        },
        {
            id: 'escape',
            intent: { type: 'MOVE_TO', params: { destination: 'hidePlace' } },
            actor: 'culprit',
            target: 'hidePlace',
            generateEvents: ['NPC_MOVE'],
        },
        {
            id: 'hide',
            intent: { type: 'HIDE', params: { method: 'stash' } },
            actor: 'culprit',
            target: 'targetItem',
            generateEvents: ['ITEM_HIDDEN'],
        },
    ],

    fallbacks: [
        ...STANDARD_FALLBACKS,
        {
            trigger: 'timeout',
            actions: [
                { type: 'create_distraction', method: 'trigger_speaker' },
                { type: 'wait', ticks: 2 },
            ],
        },
    ],

    methodVariants: [
        {
            id: 'grabbed',
            name: 'Distraction Grab',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'device_log', certainty: 'guaranteed', impliesChain: 'when' },
                { kind: 'testimony', certainty: 'likely', impliesChain: 'who' },
            ],
            comedyHooks: ['perfectly_timed', 'suspicious_absence_during_chaos'],
        },
        {
            id: 'pocketed',
            name: 'Chaos Pocket',
            requiredConditions: [
                { type: 'item_property', params: { size: 'small' } },
            ],
            evidenceSignature: [
                { kind: 'device_log', certainty: 'likely', impliesChain: 'when' },
                { kind: 'testimony', certainty: 'possible', impliesChain: 'who' },
            ],
            comedyHooks: ['too_calm_during_chaos', 'wrong_pocket'],
        },
    ],

    evidenceBudget: THEFT_EVIDENCE_BUDGET,
    antiClimaxRules: STANDARD_ANTI_ANTICLIMAX,
    comedyTags: ['opportunistic', 'chaos_exploitation'],
};

// ============================================================================
// Blueprint: Premeditated Theft
// ============================================================================

/**
 * PREMEDITATED_THEFT - Carefully planned heist
 *
 * Culprit scouts location, picks optimal time, executes cleanly.
 * Leaves minimal evidence but has preparation traces.
 */
export const PREMEDITATED_THEFT: IncidentBlueprint = {
    id: 'premeditated_theft',
    name: 'Premeditated Theft',
    incidentType: 'theft',

    roles: {
        required: [
            { id: 'culprit', archetypeConstraints: ['techie', 'paranoid', 'secretive'] },
            { id: 'target' },
        ],
        optional: [
            { id: 'witnessA' },
            { id: 'witnessB' },
        ],
    },

    requiredProps: {
        items: [{ affordances: ['valuable'] }],
        devices: [
            { type: 'door_sensor', mustExist: true },
            { type: 'motion_sensor', mustExist: false },  // May be tampered
        ],
    },

    preconditions: [
        { type: 'role_has_access', params: { role: 'culprit', to: 'crimePlace' } },
        { type: 'npc_schedule_gap', params: { role: 'culprit', duration: 15 } },
    ],

    planSteps: [
        // Scouting phase (earlier in day)
        {
            id: 'scout',
            intent: { type: 'OBSERVE', params: { target: 'crimePlace' } },
            actor: 'culprit',
            target: 'crimePlace',
            generateEvents: ['NPC_MOVE'],
            optional: true,
        },
        // Optional: tamper with devices
        {
            id: 'tamper',
            intent: { type: 'TAMPER', params: { device: 'motion_sensor' } },
            actor: 'culprit',
            generateEvents: ['DEVICE_TAMPERED'],
            optional: true,
        },
        // Execution
        {
            id: 'approach',
            intent: { type: 'MOVE_TO', params: { destination: 'crimePlace' } },
            actor: 'culprit',
            target: 'crimePlace',
            generateEvents: ['NPC_MOVE', 'DOOR_OPENED'],
        },
        {
            id: 'acquire',
            intent: { type: 'ACQUIRE', params: { method: 'careful' } },
            actor: 'culprit',
            target: 'targetItem',
            generateEvents: ['ITEM_TAKEN'],
        },
        {
            id: 'retreat',
            intent: { type: 'MOVE_TO', params: { destination: 'hidePlace' } },
            actor: 'culprit',
            target: 'hidePlace',
            generateEvents: ['NPC_MOVE', 'DOOR_OPENED'],
        },
        {
            id: 'hide',
            intent: { type: 'HIDE', params: { method: 'secure' } },
            actor: 'culprit',
            target: 'targetItem',
            generateEvents: ['ITEM_HIDDEN'],
        },
    ],

    fallbacks: [
        {
            trigger: 'witness_present',
            actions: [
                { type: 'wait', ticks: 10 },  // More patient
                { type: 'abort' },
            ],
        },
        {
            trigger: 'device_active',
            actions: [
                { type: 'swap_method', to: 'smuggled' },
            ],
        },
        ...STANDARD_FALLBACKS,
    ],

    methodVariants: [
        {
            id: 'grabbed',
            name: 'Clean Extraction',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'device_log', certainty: 'likely', impliesChain: 'when' },
                { kind: 'physical', certainty: 'guaranteed', impliesChain: 'where' },
                { kind: 'testimony', certainty: 'possible', impliesChain: 'who' },
            ],
            comedyHooks: ['over_prepared', 'unnecessary_gadgets'],
        },
        {
            id: 'smuggled',
            name: 'Concealed Transport',
            requiredConditions: [],
            evidenceSignature: [
                { kind: 'device_log', certainty: 'possible', impliesChain: 'when' },
                { kind: 'physical', certainty: 'likely', impliesChain: 'where' },
            ],
            comedyHooks: ['elaborate_container', 'decoy_bag'],
        },
    ],

    evidenceBudget: {
        ...THEFT_EVIDENCE_BUDGET,
        whoChains: 2,  // Harder but still solvable
    },
    antiClimaxRules: STANDARD_ANTI_ANTICLIMAX,
    comedyTags: ['heist_vibes', 'over_engineered'],
};

// ============================================================================
// Registry
// ============================================================================

export const THEFT_BLUEPRINTS: IncidentBlueprint[] = [
    QUICK_SNATCH,
    OPPORTUNISTIC_THEFT,
    PREMEDITATED_THEFT,
];

export function getTheftBlueprint(id: string): IncidentBlueprint | undefined {
    return THEFT_BLUEPRINTS.find(b => b.id === id);
}
