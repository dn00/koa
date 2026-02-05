/**
 * KOA Casefiles - Topology Families
 *
 * Defines house layout patterns that create different investigation dynamics.
 * Each topology affects pathfinding, device coverage, and witness opportunities.
 */

import type {
    TopologyFamily,
    TopologyId,
    PlaceTemplate,
    DevicePlacementStrategy,
    ConnectivityRule,
} from '../types.js';

// ============================================================================
// Topology Family Definitions
// ============================================================================

/**
 * Hub + Spokes - Central living area with radiating rooms
 *
 * Classic layout. Living room is the hub connecting all other rooms.
 * High traffic through center, easy to observe comings/goings.
 *
 * ASCII:
 *     Bed  Kitchen
 *       \   /
 *        Living --- Office
 *       /
 *    Garage
 */
export const HUB_SPOKES: TopologyFamily = {
    id: 'hub_spokes',
    name: 'Hub & Spokes',
    description: 'Central living area with radiating rooms. High visibility in the hub.',

    placeCount: { min: 5, max: 7 },

    connectivityRules: [
        { type: 'hub_required', params: { hubType: 'social' } },
        { type: 'must_connect', params: { from: 'all', to: 'hub' } },
    ],

    deviceStrategy: {
        doorSensorCoverage: 0.8,
        motionSensorPlacement: 'hub',
        cameraPlacement: 'entrance',
    },

    placeTemplates: [
        { type: 'social', name: 'Living Room', required: true, maxCount: 1, typicalDevices: ['motion_sensor'] },
        { type: 'social', name: 'Kitchen', required: true, maxCount: 1, typicalDevices: ['motion_sensor'] },
        { type: 'private', name: 'Bedroom', required: true, maxCount: 2, typicalDevices: [] },
        { type: 'private', name: 'Office', required: false, maxCount: 1, typicalDevices: ['wifi_presence'] },
        { type: 'functional', name: 'Garage', required: false, maxCount: 1, typicalDevices: ['door_sensor'] },
        { type: 'functional', name: 'Bathroom', required: false, maxCount: 1, typicalDevices: [] },
    ],

    expectedDiameter: 2,
    chokepointCount: 1,  // The hub itself
};

/**
 * Loop - Circular floor plan with no dead ends
 *
 * Every room connects to at least 2 others. Multiple paths between
 * any two points. Harder to pin down exact routes.
 *
 * ASCII:
 *    Kitchen --- Living --- Bedroom
 *       |                     |
 *    Bathroom ------------- Office
 */
export const LOOP: TopologyFamily = {
    id: 'loop',
    name: 'Loop Apartment',
    description: 'Circular layout with no dead ends. Multiple paths between rooms.',

    placeCount: { min: 5, max: 6 },

    connectivityRules: [
        { type: 'loop_required', params: { minLoopSize: 4 } },
        { type: 'cannot_connect', params: { rule: 'no_spokes' } },
    ],

    deviceStrategy: {
        doorSensorCoverage: 0.6,
        motionSensorPlacement: 'chokepoints',
        cameraPlacement: 'entrance',
    },

    placeTemplates: [
        { type: 'social', name: 'Living Room', required: true, maxCount: 1, typicalDevices: ['motion_sensor'] },
        { type: 'social', name: 'Kitchen', required: true, maxCount: 1, typicalDevices: [] },
        { type: 'private', name: 'Bedroom', required: true, maxCount: 1, typicalDevices: [] },
        { type: 'private', name: 'Office', required: true, maxCount: 1, typicalDevices: ['wifi_presence'] },
        { type: 'functional', name: 'Bathroom', required: false, maxCount: 1, typicalDevices: [] },
    ],

    expectedDiameter: 3,
    chokepointCount: 0,  // No single chokepoint
};

/**
 * Gated Wing - Two sections connected by a single passage
 *
 * Public wing (social) and private wing (bedrooms/office) with
 * one chokepoint between them. Easy to track wing-to-wing movement.
 *
 * ASCII:
 *    [Public Wing]          [Private Wing]
 *    Kitchen---Living===Hall===Bedroom---Office
 *                                 |
 *                              Bathroom
 */
export const GATED_WING: TopologyFamily = {
    id: 'gated_wing',
    name: 'Gated Wing',
    description: 'Two sections connected by a single hallway chokepoint.',

    placeCount: { min: 6, max: 8 },

    connectivityRules: [
        { type: 'must_connect', params: { rule: 'single_bridge_between_wings' } },
        { type: 'cannot_connect', params: { rule: 'no_cross_wing_direct' } },
    ],

    deviceStrategy: {
        doorSensorCoverage: 0.9,
        motionSensorPlacement: 'chokepoints',
        cameraPlacement: 'entrance',
    },

    placeTemplates: [
        // Public wing
        { type: 'social', name: 'Living Room', required: true, maxCount: 1, typicalDevices: ['motion_sensor'] },
        { type: 'social', name: 'Kitchen', required: true, maxCount: 1, typicalDevices: [] },
        { type: 'social', name: 'Dining Room', required: false, maxCount: 1, typicalDevices: [] },
        // Transition
        { type: 'transition', name: 'Hallway', required: true, maxCount: 1, typicalDevices: ['motion_sensor', 'door_sensor'] },
        // Private wing
        { type: 'private', name: 'Bedroom', required: true, maxCount: 2, typicalDevices: [] },
        { type: 'private', name: 'Office', required: false, maxCount: 1, typicalDevices: ['wifi_presence'] },
        { type: 'functional', name: 'Bathroom', required: false, maxCount: 1, typicalDevices: [] },
    ],

    expectedDiameter: 4,
    chokepointCount: 1,  // The hallway bridge
};

/**
 * Split Level - Vertical layers with limited stair access
 *
 * Upstairs/downstairs with 1-2 stairways. Vertical movement is
 * highly observable. Good for "who went upstairs when?" puzzles.
 *
 * ASCII:
 *    [Upper Level]
 *    Bedroom---Office---Bathroom
 *              |
 *           [Stairs]
 *              |
 *    Kitchen---Living---Garage
 *    [Lower Level]
 */
export const SPLIT_LEVEL: TopologyFamily = {
    id: 'split_level',
    name: 'Split Level',
    description: 'Two floors connected by stairs. Vertical movement is observable.',

    placeCount: { min: 6, max: 8 },

    connectivityRules: [
        { type: 'must_connect', params: { rule: 'stair_connects_levels' } },
        { type: 'cannot_connect', params: { rule: 'no_cross_level_direct' } },
    ],

    deviceStrategy: {
        doorSensorCoverage: 0.7,
        motionSensorPlacement: 'chokepoints',  // Stairs
        cameraPlacement: 'entrance',
    },

    placeTemplates: [
        // Lower level
        { type: 'social', name: 'Living Room', required: true, maxCount: 1, typicalDevices: ['motion_sensor'] },
        { type: 'social', name: 'Kitchen', required: true, maxCount: 1, typicalDevices: [] },
        { type: 'functional', name: 'Garage', required: false, maxCount: 1, typicalDevices: ['door_sensor'] },
        // Transition
        { type: 'transition', name: 'Stairs', required: true, maxCount: 2, typicalDevices: ['motion_sensor'] },
        // Upper level
        { type: 'private', name: 'Bedroom', required: true, maxCount: 2, typicalDevices: [] },
        { type: 'private', name: 'Office', required: false, maxCount: 1, typicalDevices: ['wifi_presence'] },
        { type: 'functional', name: 'Bathroom', required: false, maxCount: 1, typicalDevices: [] },
    ],

    expectedDiameter: 4,
    chokepointCount: 2,  // Stairways
};

/**
 * Open Plan - Few walls, high visibility
 *
 * Large open spaces with minimal separation. Anyone in the main
 * area can potentially observe most activities. Hard to sneak.
 *
 * ASCII:
 *    +-----------------------+
 *    | Kitchen  Living  Den  |---Bedroom
 *    |    (open floor)       |---Office
 *    +-----------------------+
 */
export const OPEN_PLAN: TopologyFamily = {
    id: 'open_plan',
    name: 'Open Plan',
    description: 'Large open spaces with high visibility. Hard to move unobserved.',

    placeCount: { min: 4, max: 6 },

    connectivityRules: [
        { type: 'must_connect', params: { rule: 'open_core_connected' } },
    ],

    deviceStrategy: {
        doorSensorCoverage: 0.5,  // Fewer internal doors
        motionSensorPlacement: 'perimeter',
        cameraPlacement: 'entrance',
    },

    placeTemplates: [
        // Open core (treated as one space for connectivity, but sub-zones)
        { type: 'social', name: 'Great Room', required: true, maxCount: 1, typicalDevices: ['motion_sensor'] },
        { type: 'social', name: 'Kitchen', required: true, maxCount: 1, typicalDevices: [] },
        // Private rooms off the core
        { type: 'private', name: 'Bedroom', required: true, maxCount: 2, typicalDevices: [] },
        { type: 'private', name: 'Office', required: false, maxCount: 1, typicalDevices: ['wifi_presence'] },
        { type: 'functional', name: 'Bathroom', required: false, maxCount: 1, typicalDevices: [] },
    ],

    expectedDiameter: 2,
    chokepointCount: 0,  // Open visibility instead
};

// ============================================================================
// Registry
// ============================================================================

export const TOPOLOGY_FAMILIES: Record<TopologyId, TopologyFamily> = {
    hub_spokes: HUB_SPOKES,
    loop: LOOP,
    gated_wing: GATED_WING,
    split_level: SPLIT_LEVEL,
    open_plan: OPEN_PLAN,
};

export function getTopologyFamily(id: TopologyId): TopologyFamily {
    const family = TOPOLOGY_FAMILIES[id];
    if (!family) {
        throw new Error(`Unknown topology family: ${id}`);
    }
    return family;
}

export function getAllTopologyFamilies(): TopologyFamily[] {
    return Object.values(TOPOLOGY_FAMILIES);
}
