/**
 * KOA Casefiles - Topology Generator
 *
 * Generates concrete house layouts from TopologyFamily patterns.
 * Each family defines rules; this generator produces valid instances.
 */

import type { RNG } from '../../kernel/rng.js';
import type { DeviceType, Place, Device } from '../../types.js';
import type {
    TopologyFamily,
    TopologyId,
    PlaceTemplate,
    PlaceType,
    GeneratedTopology,
    GeneratedPlace,
    PlaceConnection,
    GeneratedDevice,
} from '../types.js';
import { TOPOLOGY_FAMILIES, getAllTopologyFamilies } from './families.js';

// ============================================================================
// Place ID Generation
// ============================================================================

function makePlaceId(name: string, index: number): string {
    const base = name.toLowerCase().replace(/\s+/g, '_');
    return index > 0 ? `${base}_${index + 1}` : base;
}

function makeDeviceId(type: DeviceType, place: string, connectsTo?: string): string {
    if (connectsTo) {
        // Sort alphabetically to ensure consistent naming regardless of direction
        const [a, b] = [place, connectsTo].sort();
        return `${type}_${a}_${b}`;
    }
    return `${type}_${place}`;
}

// ============================================================================
// Place Generation
// ============================================================================

interface PlaceSelection {
    template: PlaceTemplate;
    instances: number;
}

/**
 * Select which places to include based on family templates
 */
function selectPlaces(family: TopologyFamily, rng: RNG): PlaceSelection[] {
    const selections: PlaceSelection[] = [];

    // First, add all required places
    for (const template of family.placeTemplates) {
        if (template.required) {
            selections.push({ template, instances: 1 });
        }
    }

    // Calculate current count
    let currentCount = selections.reduce((sum, s) => sum + s.instances, 0);

    // Add optional places until we reach target count
    const targetCount = rng.nextInt(family.placeCount.max - family.placeCount.min + 1) + family.placeCount.min;
    const optionalTemplates = family.placeTemplates.filter(t => !t.required);

    while (currentCount < targetCount && optionalTemplates.length > 0) {
        // Pick a random optional template
        const template = rng.pick(optionalTemplates);

        // Check if we can add another instance
        const existing = selections.find(s => s.template.name === template.name);
        if (existing) {
            if (existing.instances < template.maxCount) {
                existing.instances++;
                currentCount++;
            }
        } else {
            selections.push({ template, instances: 1 });
            currentCount++;
        }

        // Remove template if maxed out
        const updated = selections.find(s => s.template.name === template.name);
        if (updated && updated.instances >= template.maxCount) {
            const idx = optionalTemplates.indexOf(template);
            if (idx >= 0) optionalTemplates.splice(idx, 1);
        }
    }

    return selections;
}

/**
 * Generate concrete places from selections
 */
function generatePlaces(selections: PlaceSelection[]): GeneratedPlace[] {
    const places: GeneratedPlace[] = [];
    const nameCounts = new Map<string, number>();

    for (const selection of selections) {
        for (let i = 0; i < selection.instances; i++) {
            const count = nameCounts.get(selection.template.name) ?? 0;
            nameCounts.set(selection.template.name, count + 1);

            places.push({
                id: makePlaceId(selection.template.name, count),
                name: count > 0
                    ? `${selection.template.name} ${count + 1}`
                    : selection.template.name,
                type: selection.template.type,
                templateId: selection.template.name,
            });
        }
    }

    return places;
}

// ============================================================================
// Connection Generation
// ============================================================================

/**
 * Generate connections based on topology family rules
 */
function generateConnections(
    family: TopologyFamily,
    places: GeneratedPlace[],
    rng: RNG
): PlaceConnection[] {
    switch (family.id) {
        case 'hub_spokes':
            return generateHubSpokeConnections(places, rng);
        case 'loop':
            return generateLoopConnections(places, rng);
        case 'gated_wing':
            return generateGatedWingConnections(places, rng);
        case 'split_level':
            return generateSplitLevelConnections(places, rng);
        case 'open_plan':
            return generateOpenPlanConnections(places, rng);
        default:
            return generateHubSpokeConnections(places, rng);
    }
}

/**
 * Hub & Spokes: Central hub connects to all other rooms
 */
function generateHubSpokeConnections(places: GeneratedPlace[], rng: RNG): PlaceConnection[] {
    const connections: PlaceConnection[] = [];

    // Find the hub (first social place, typically living room)
    const hub = places.find(p => p.type === 'social') ?? places[0];
    const spokes = places.filter(p => p.id !== hub.id);

    // Connect all spokes to hub
    for (const spoke of spokes) {
        connections.push({
            from: hub.id,
            to: spoke.id,
            hasDoor: true,
        });
    }

    // Optionally add a few cross-connections for variety
    if (spokes.length >= 3 && rng.next() < 0.5) {
        const [a, b] = rng.shuffle(spokes).slice(0, 2);
        connections.push({
            from: a.id,
            to: b.id,
            hasDoor: true,
        });
    }

    return connections;
}

/**
 * Loop: Circular connectivity with no dead ends
 */
function generateLoopConnections(places: GeneratedPlace[], rng: RNG): PlaceConnection[] {
    const connections: PlaceConnection[] = [];

    // Shuffle for variety, but keep a valid loop
    const shuffled = rng.shuffle([...places]);

    // Create the main loop
    for (let i = 0; i < shuffled.length; i++) {
        const from = shuffled[i];
        const to = shuffled[(i + 1) % shuffled.length];
        connections.push({
            from: from.id,
            to: to.id,
            hasDoor: true,
        });
    }

    return connections;
}

/**
 * Gated Wing: Two sections with a hallway bridge
 */
function generateGatedWingConnections(places: GeneratedPlace[], rng: RNG): PlaceConnection[] {
    const connections: PlaceConnection[] = [];

    // Find the hallway (transition type)
    const hallway = places.find(p => p.type === 'transition');

    // Split into public (social) and private (private/functional) wings
    const publicWing = places.filter(p => p.type === 'social');
    const privateWing = places.filter(p => p.type === 'private' || p.type === 'functional');

    // Connect public wing rooms to each other
    if (publicWing.length >= 2) {
        for (let i = 0; i < publicWing.length - 1; i++) {
            connections.push({
                from: publicWing[i].id,
                to: publicWing[i + 1].id,
                hasDoor: true,
            });
        }
    }

    // Connect private wing rooms to each other
    if (privateWing.length >= 2) {
        for (let i = 0; i < privateWing.length - 1; i++) {
            connections.push({
                from: privateWing[i].id,
                to: privateWing[i + 1].id,
                hasDoor: true,
            });
        }
    }

    // Connect hallway to both wings (if hallway exists)
    if (hallway) {
        // Connect to last public room and first private room
        if (publicWing.length > 0) {
            connections.push({
                from: hallway.id,
                to: publicWing[publicWing.length - 1].id,
                hasDoor: true,
            });
        }
        if (privateWing.length > 0) {
            connections.push({
                from: hallway.id,
                to: privateWing[0].id,
                hasDoor: true,
            });
        }
    } else {
        // No hallway - direct connection between wings
        if (publicWing.length > 0 && privateWing.length > 0) {
            connections.push({
                from: publicWing[publicWing.length - 1].id,
                to: privateWing[0].id,
                hasDoor: true,
            });
        }
    }

    return connections;
}

/**
 * Split Level: Two floors connected by stairs
 */
function generateSplitLevelConnections(places: GeneratedPlace[], rng: RNG): PlaceConnection[] {
    const connections: PlaceConnection[] = [];

    // Find stairs (transition type)
    const stairs = places.find(p => p.type === 'transition');

    // Split into lower (social/functional) and upper (private) levels
    const lowerLevel = places.filter(p => p.type === 'social' || (p.type === 'functional' && p.templateId === 'Garage'));
    const upperLevel = places.filter(p => p.type === 'private' || (p.type === 'functional' && p.templateId !== 'Garage'));

    // Connect lower level rooms
    if (lowerLevel.length >= 2) {
        for (let i = 0; i < lowerLevel.length - 1; i++) {
            connections.push({
                from: lowerLevel[i].id,
                to: lowerLevel[i + 1].id,
                hasDoor: true,
            });
        }
    }

    // Connect upper level rooms
    if (upperLevel.length >= 2) {
        for (let i = 0; i < upperLevel.length - 1; i++) {
            connections.push({
                from: upperLevel[i].id,
                to: upperLevel[i + 1].id,
                hasDoor: true,
            });
        }
    }

    // Connect stairs to both levels
    if (stairs) {
        if (lowerLevel.length > 0) {
            connections.push({
                from: stairs.id,
                to: lowerLevel[0].id,
                hasDoor: false, // Stairs don't have doors
            });
        }
        if (upperLevel.length > 0) {
            connections.push({
                from: stairs.id,
                to: upperLevel[0].id,
                hasDoor: false,
            });
        }
    }

    return connections;
}

/**
 * Open Plan: Highly connected with few barriers
 */
function generateOpenPlanConnections(places: GeneratedPlace[], rng: RNG): PlaceConnection[] {
    const connections: PlaceConnection[] = [];

    // Find the great room (main social space)
    const core = places.find(p => p.templateId === 'Great Room') ?? places.find(p => p.type === 'social');

    if (!core) {
        // Fallback to hub-spoke
        return generateHubSpokeConnections(places, rng);
    }

    // Connect everything to the core
    for (const place of places) {
        if (place.id !== core.id) {
            connections.push({
                from: core.id,
                to: place.id,
                hasDoor: place.type === 'private', // Only private rooms have doors
            });
        }
    }

    // Kitchen connects to core without door (open plan)
    const kitchen = places.find(p => p.templateId === 'Kitchen');
    if (kitchen) {
        const existingConnection = connections.find(
            c => (c.from === core.id && c.to === kitchen.id) ||
                (c.from === kitchen.id && c.to === core.id)
        );
        if (existingConnection) {
            existingConnection.hasDoor = false;
        }
    }

    return connections;
}

// ============================================================================
// Device Generation
// ============================================================================

/**
 * Generate devices based on family strategy and connections
 */
function generateDevices(
    family: TopologyFamily,
    places: GeneratedPlace[],
    connections: PlaceConnection[],
    rng: RNG
): GeneratedDevice[] {
    const devices: GeneratedDevice[] = [];
    const strategy = family.deviceStrategy;

    // Door sensors based on coverage
    const doorsToMonitor = Math.ceil(connections.filter(c => c.hasDoor).length * strategy.doorSensorCoverage);
    const doorConnections = rng.shuffle(connections.filter(c => c.hasDoor)).slice(0, doorsToMonitor);

    for (const conn of doorConnections) {
        const deviceId = makeDeviceId('door_sensor', conn.from, conn.to);
        devices.push({
            id: deviceId,
            type: 'door_sensor',
            place: conn.from,
            connectsTo: conn.to,
        });

        // Update connection with sensor ID
        conn.doorSensorId = deviceId;
    }

    // Motion sensors based on placement strategy
    const motionPlaces = selectMotionSensorPlaces(family, places, connections, rng);
    for (const place of motionPlaces) {
        devices.push({
            id: makeDeviceId('motion_sensor', place.id),
            type: 'motion_sensor',
            place: place.id,
        });
    }

    // Add typical devices from place templates
    for (const place of places) {
        const template = family.placeTemplates.find(t => t.name === place.templateId);
        if (template) {
            for (const deviceType of template.typicalDevices) {
                // Skip if we already have this type in this place
                const existing = devices.find(d => d.type === deviceType && d.place === place.id);
                if (!existing && deviceType !== 'door_sensor') {
                    devices.push({
                        id: makeDeviceId(deviceType, place.id),
                        type: deviceType,
                        place: place.id,
                    });
                }
            }
        }
    }

    return devices;
}

/**
 * Select places for motion sensors based on strategy
 */
function selectMotionSensorPlaces(
    family: TopologyFamily,
    places: GeneratedPlace[],
    connections: PlaceConnection[],
    rng: RNG
): GeneratedPlace[] {
    const strategy = family.deviceStrategy.motionSensorPlacement;

    switch (strategy) {
        case 'hub': {
            // Place in the most connected room
            const connectionCounts = new Map<string, number>();
            for (const conn of connections) {
                connectionCounts.set(conn.from, (connectionCounts.get(conn.from) ?? 0) + 1);
                connectionCounts.set(conn.to, (connectionCounts.get(conn.to) ?? 0) + 1);
            }
            const sorted = places.sort((a, b) =>
                (connectionCounts.get(b.id) ?? 0) - (connectionCounts.get(a.id) ?? 0)
            );
            return sorted.slice(0, 1);
        }

        case 'chokepoints': {
            // Place in transition areas and high-traffic social spaces
            return places.filter(p =>
                p.type === 'transition' ||
                (p.type === 'social' && p.templateId === 'Living Room')
            ).slice(0, 2);
        }

        case 'perimeter': {
            // Place near entrances/exits
            const functional = places.filter(p => p.type === 'functional');
            return functional.length > 0 ? functional.slice(0, 1) : places.slice(0, 1);
        }

        case 'random':
        default: {
            // Random placement
            return rng.shuffle([...places]).slice(0, 1);
        }
    }
}

// ============================================================================
// Main Generator
// ============================================================================

/**
 * Generate a complete topology from a family definition
 */
export function generateTopology(
    family: TopologyFamily,
    rng: RNG
): GeneratedTopology {
    // 1. Select and generate places
    const selections = selectPlaces(family, rng);
    const places = generatePlaces(selections);

    // 2. Generate connections
    const connections = generateConnections(family, places, rng);

    // 3. Generate devices
    const devices = generateDevices(family, places, connections, rng);

    return {
        familyId: family.id,
        places,
        connections,
        devices,
    };
}

/**
 * Generate a topology from a random family
 */
export function generateRandomTopology(rng: RNG): GeneratedTopology {
    const families = getAllTopologyFamilies();
    const family = rng.pick(families);
    return generateTopology(family, rng);
}

/**
 * Generate a topology from a specific family ID
 */
export function generateTopologyById(id: TopologyId, rng: RNG): GeneratedTopology {
    const family = TOPOLOGY_FAMILIES[id];
    if (!family) {
        throw new Error(`Unknown topology family: ${id}`);
    }
    return generateTopology(family, rng);
}

// ============================================================================
// Conversion to World Types
// ============================================================================

/**
 * Convert GeneratedTopology to World-compatible Place[]
 */
export function topologyToPlaces(topology: GeneratedTopology): Place[] {
    // Build adjacency from connections
    const adjacencyMap = new Map<string, Set<string>>();

    for (const place of topology.places) {
        adjacencyMap.set(place.id, new Set());
    }

    for (const conn of topology.connections) {
        adjacencyMap.get(conn.from)?.add(conn.to);
        adjacencyMap.get(conn.to)?.add(conn.from);
    }

    return topology.places.map(gp => ({
        id: gp.id,
        name: gp.name,
        adjacent: Array.from(adjacencyMap.get(gp.id) ?? []),
    }));
}

/**
 * Convert GeneratedTopology to World-compatible Device[]
 */
export function topologyToDevices(topology: GeneratedTopology): Device[] {
    return topology.devices.map(gd => ({
        id: gd.id,
        type: gd.type,
        place: gd.place,
        connectsTo: gd.connectsTo,
    }));
}

/**
 * Convert GeneratedTopology to World-compatible places and devices
 */
export function topologyToWorld(topology: GeneratedTopology): {
    places: Place[];
    devices: Device[];
} {
    return {
        places: topologyToPlaces(topology),
        devices: topologyToDevices(topology),
    };
}
