/**
 * KOA Casefiles - Blueprint Instantiation
 *
 * Converts abstract IncidentBlueprints into concrete CrimePlans
 * that can be executed by the simulation engine.
 */

import type { RNG } from '../kernel/rng.js';
import type {
    World,
    NPC,
    Item,
    Place,
    NPCId,
    PlaceId,
    ItemId,
    WindowId,
    MethodId,
} from '../types.js';
import { WINDOWS, getWindowForTick } from '../types.js';
import { findPath, getDoorBetween } from '../world.js';

import type {
    IncidentBlueprint,
    CrimePlan,
    ResolvedCrimeStep,
    RoleId,
    PlanStep,
    MethodVariant,
    Intent,
} from './types.js';

// ============================================================================
// Role Binding
// ============================================================================

interface RoleBindings {
    culprit: NPC;
    target?: NPC;
    witnesses: NPC[];
    redHerring?: NPC;
    accomplice?: NPC;
}

/**
 * Bind abstract roles to actual NPCs based on constraints
 */
function bindRoles(
    blueprint: IncidentBlueprint,
    world: World,
    rng: RNG
): RoleBindings | null {
    const available = [...world.npcs];
    const bindings: Partial<RoleBindings> = {
        witnesses: [],
    };

    // Bind required roles first
    for (const roleSpec of blueprint.roles.required) {
        const candidates = available.filter(npc => {
            // For now, any NPC can fill any role
            // TODO: Check archetypeConstraints when we have archetype assignments
            return true;
        });

        if (candidates.length === 0) {
            return null; // Can't satisfy role
        }

        const chosen = rng.pick(candidates);
        const idx = available.indexOf(chosen);
        available.splice(idx, 1);

        switch (roleSpec.id) {
            case 'culprit':
                bindings.culprit = chosen;
                break;
            case 'target':
                bindings.target = chosen;
                break;
        }
    }

    // Bind optional roles (witnesses, red herrings)
    for (const roleSpec of blueprint.roles.optional) {
        if (available.length === 0) break;

        // 70% chance to fill optional roles
        if (rng.nextInt(100) > 70) continue;

        const chosen = rng.pick(available);
        const idx = available.indexOf(chosen);
        available.splice(idx, 1);

        switch (roleSpec.id) {
            case 'witnessA':
            case 'witnessB':
                bindings.witnesses!.push(chosen);
                break;
            case 'redHerring':
                bindings.redHerring = chosen;
                break;
            case 'accomplice':
                bindings.accomplice = chosen;
                break;
        }
    }

    if (!bindings.culprit) {
        return null;
    }

    return bindings as RoleBindings;
}

// ============================================================================
// Place Resolution
// ============================================================================

interface PlaceBindings {
    crimePlace: PlaceId;
    hidePlace: PlaceId;
    route: PlaceId[];
    targetItem: Item;
}

/**
 * Find a valid crime location and hiding place
 */
function resolvePlaces(
    blueprint: IncidentBlueprint,
    world: World,
    culprit: NPC,
    crimeWindow: WindowId,
    rng: RNG
): PlaceBindings | null {
    // Find where culprit is scheduled during crime window
    const culpritSchedule = culprit.schedule.find(s => s.window === crimeWindow);
    if (!culpritSchedule) return null;

    const culpritPlace = culpritSchedule.place;

    // Find items at or near the culprit's location
    const itemCandidates: Array<{ item: Item; place: PlaceId }> = [];

    // Items at culprit's location
    for (const item of world.items) {
        if (item.startPlace === culpritPlace) {
            itemCandidates.push({ item, place: culpritPlace });
        }
    }

    // Items in adjacent rooms (culprit can move there)
    const culpritPlaceDef = world.places.find(p => p.id === culpritPlace);
    if (culpritPlaceDef) {
        for (const adjId of culpritPlaceDef.adjacent) {
            for (const item of world.items) {
                if (item.startPlace === adjId) {
                    itemCandidates.push({ item, place: adjId });
                }
            }
        }
    }

    if (itemCandidates.length === 0) {
        return null;
    }

    // Pick a random item/place combo
    const { item: targetItem, place: crimePlace } = rng.pick(itemCandidates);

    // Find a hiding place (adjacent to crime place, not the same)
    const crimePlaceDef = world.places.find(p => p.id === crimePlace);
    if (!crimePlaceDef || crimePlaceDef.adjacent.length === 0) {
        return null;
    }

    // Prefer hiding places that aren't heavily trafficked
    const hidePlaceCandidates = crimePlaceDef.adjacent.filter(adjId => {
        // Check no one else is scheduled there during crime window
        const othersAtPlace = world.npcs.filter(npc => {
            if (npc.id === culprit.id) return false;
            const sched = npc.schedule.find(s => s.window === crimeWindow);
            return sched?.place === adjId;
        });
        return othersAtPlace.length === 0;
    });

    // Fall back to any adjacent if no empty ones
    const hidePlace = hidePlaceCandidates.length > 0
        ? rng.pick(hidePlaceCandidates)
        : rng.pick(crimePlaceDef.adjacent);

    // Compute route: culprit -> crime place -> hide place -> back
    const routeToItem = findPath(culpritPlace, crimePlace, world.places);
    const routeToHide = findPath(crimePlace, hidePlace, world.places);

    const fullRoute = [
        ...routeToItem,
        ...routeToHide.slice(1), // Don't duplicate crime place
    ];

    return {
        crimePlace,
        hidePlace,
        route: fullRoute,
        targetItem,
    };
}

// ============================================================================
// Window Selection
// ============================================================================

/**
 * Find a suitable crime window based on opportunity
 */
function selectCrimeWindow(
    blueprint: IncidentBlueprint,
    world: World,
    culprit: NPC,
    rng: RNG
): WindowId | null {
    // Valid windows: W2-W5 (W1 too early, W6 no aftermath)
    const validWindows: WindowId[] = ['W2', 'W3', 'W4', 'W5'];

    // Score each window by opportunity
    const windowScores: Array<{ window: WindowId; score: number }> = [];

    for (const windowId of validWindows) {
        let score = 50; // Base score

        // Check culprit's schedule
        const culpritSched = culprit.schedule.find(s => s.window === windowId);
        if (!culpritSched) {
            score -= 30; // No schedule = harder to justify
        }

        // Check how many others are around
        const othersAtSamePlace = world.npcs.filter(npc => {
            if (npc.id === culprit.id) return false;
            const sched = npc.schedule.find(s => s.window === windowId);
            return sched?.place === culpritSched?.place;
        }).length;

        // Prefer windows with fewer witnesses
        score -= othersAtSamePlace * 15;

        // Slight preference for middle windows (more interesting)
        if (windowId === 'W3' || windowId === 'W4') {
            score += 10;
        }

        if (score > 0) {
            windowScores.push({ window: windowId, score });
        }
    }

    if (windowScores.length === 0) {
        return null;
    }

    // Weighted random selection
    const totalScore = windowScores.reduce((sum, w) => sum + w.score, 0);
    let roll = rng.nextInt(totalScore);

    for (const ws of windowScores) {
        roll -= ws.score;
        if (roll <= 0) {
            return ws.window;
        }
    }

    return windowScores[0].window;
}

// ============================================================================
// Method Selection
// ============================================================================

/**
 * Select a method variant based on conditions
 */
function selectMethodVariant(
    blueprint: IncidentBlueprint,
    world: World,
    placeBindings: PlaceBindings,
    rng: RNG
): MethodVariant {
    const validVariants = blueprint.methodVariants.filter(variant => {
        // Check all required conditions
        for (const condition of variant.requiredConditions) {
            switch (condition.type) {
                case 'device_present':
                    // Check if required device exists at crime place
                    const hasDevice = world.devices.some(d =>
                        d.place === placeBindings.crimePlace &&
                        d.type === condition.params.deviceType
                    );
                    if (!hasDevice) return false;
                    break;

                case 'item_property':
                    // For now, assume all items can satisfy basic properties
                    // TODO: Check item affordances when shenanigan objects are integrated
                    break;

                case 'route_exists':
                    // Already verified in place resolution
                    break;

                case 'npc_trait':
                    // TODO: Check archetype traits
                    break;
            }
        }
        return true;
    });

    if (validVariants.length === 0) {
        // Fall back to first variant (should always have at least one)
        return blueprint.methodVariants[0];
    }

    return rng.pick(validVariants);
}

// ============================================================================
// Step Resolution
// ============================================================================

/**
 * Convert abstract PlanSteps into concrete ResolvedCrimeSteps
 */
function resolveSteps(
    blueprint: IncidentBlueprint,
    roleBindings: RoleBindings,
    placeBindings: PlaceBindings,
    crimeWindow: WindowId,
    world: World,
    rng: RNG
): ResolvedCrimeStep[] {
    const windowDef = WINDOWS.find(w => w.id === crimeWindow)!;
    let currentTick = windowDef.startTick + 5 + rng.nextInt(10); // Slight offset

    const resolved: ResolvedCrimeStep[] = [];

    // Track current positions for movement
    const culpritSchedule = roleBindings.culprit.schedule.find(s => s.window === crimeWindow);
    let culpritCurrentPlace = culpritSchedule?.place ?? 'living';

    for (const step of blueprint.planSteps) {
        // Skip optional steps randomly
        if (step.optional && rng.nextInt(100) > 60) {
            continue;
        }

        // Resolve the actor
        const actor = resolveActor(step.actor, roleBindings);
        if (!actor) continue;

        // Resolve the target place/item based on intent
        let targetPlace = culpritCurrentPlace;

        switch (step.intent.type) {
            case 'MOVE_TO': {
                const destination = step.intent.params.destination as string;
                if (destination === 'crimePlace') {
                    targetPlace = placeBindings.crimePlace;
                } else if (destination === 'hidePlace') {
                    targetPlace = placeBindings.hidePlace;
                } else if (destination === 'alibiPlace' || destination === 'nearCrimePlace') {
                    // Pick adjacent room
                    const place = world.places.find(p => p.id === culpritCurrentPlace);
                    targetPlace = place?.adjacent[0] ?? culpritCurrentPlace;
                } else {
                    targetPlace = destination as PlaceId;
                }

                // Generate movement ticks
                const path = findPath(culpritCurrentPlace, targetPlace, world.places);
                currentTick += path.length * 2;
                culpritCurrentPlace = targetPlace;
                break;
            }

            case 'ACQUIRE':
            case 'HIDE':
            case 'DROP':
            case 'SWAP':
                targetPlace = culpritCurrentPlace;
                currentTick += 2;
                break;

            case 'TAMPER':
                targetPlace = culpritCurrentPlace;
                currentTick += 3;
                break;

            case 'WAIT':
                currentTick += step.intent.params.ticks as number ?? 5;
                break;

            case 'OBSERVE':
                currentTick += 2;
                break;
        }

        resolved.push({
            stepId: step.id,
            tick: currentTick,
            actor: actor.id,
            place: targetPlace,
            intent: step.intent,
            expectedEvents: step.generateEvents,
        });

        currentTick += 2; // Buffer between steps
    }

    return resolved;
}

/**
 * Resolve a role ID to an actual NPC
 */
function resolveActor(roleId: RoleId, bindings: RoleBindings): NPC | null {
    switch (roleId) {
        case 'culprit':
            return bindings.culprit;
        case 'target':
            return bindings.target ?? null;
        case 'witnessA':
            return bindings.witnesses[0] ?? null;
        case 'witnessB':
            return bindings.witnesses[1] ?? null;
        case 'redHerring':
            return bindings.redHerring ?? null;
        case 'accomplice':
            return bindings.accomplice ?? null;
        default:
            return bindings.culprit; // Default to culprit
    }
}

// ============================================================================
// Main Instantiation Function
// ============================================================================

/**
 * Instantiate a blueprint into a concrete crime plan.
 *
 * @param blueprint - The abstract incident blueprint
 * @param world - The generated world
 * @param rng - Random number generator
 * @returns CrimePlan if successful, null if constraints can't be satisfied
 */
export function instantiateCrimePlan(
    blueprint: IncidentBlueprint,
    world: World,
    rng: RNG
): CrimePlan | null {
    // 1. Bind roles to NPCs
    const roleBindings = bindRoles(blueprint, world, rng);
    if (!roleBindings) {
        return null;
    }

    // 2. Select crime window
    const crimeWindow = selectCrimeWindow(blueprint, world, roleBindings.culprit, rng);
    if (!crimeWindow) {
        return null;
    }

    // 3. Resolve places (crime location, hide location, route)
    const placeBindings = resolvePlaces(blueprint, world, roleBindings.culprit, crimeWindow, rng);
    if (!placeBindings) {
        return null;
    }

    // 4. Select method variant
    const variant = selectMethodVariant(blueprint, world, placeBindings, rng);

    // 5. Resolve plan steps to concrete ticks and places
    const resolvedSteps = resolveSteps(
        blueprint,
        roleBindings,
        placeBindings,
        crimeWindow,
        world,
        rng
    );

    // 6. Compute crime tick (first ACQUIRE or TAMPER step)
    const crimeStep = resolvedSteps.find(s =>
        s.intent.type === 'ACQUIRE' ||
        s.intent.type === 'TAMPER' ||
        s.intent.type === 'SWAP'
    );
    const crimeTick = crimeStep?.tick ?? resolvedSteps[0]?.tick ?? 0;

    return {
        blueprintId: blueprint.id,
        variantId: variant.id,

        culprit: roleBindings.culprit.id,
        target: roleBindings.target?.id,
        witnesses: roleBindings.witnesses.map(w => w.id),
        redHerring: roleBindings.redHerring?.id,

        targetItem: placeBindings.targetItem.id,
        crimePlace: placeBindings.crimePlace,
        hidePlace: placeBindings.hidePlace,
        route: placeBindings.route,

        crimeWindow,
        crimeTick,

        resolvedSteps,
    };
}

// ============================================================================
// Blueprint Selection
// ============================================================================

/**
 * Select a blueprint appropriate for the world and difficulty
 */
export function selectBlueprint(
    blueprints: IncidentBlueprint[],
    world: World,
    difficulty: number,
    rng: RNG
): IncidentBlueprint {
    // For now, random selection
    // TODO: Score blueprints by:
    // - Difficulty match
    // - Precondition satisfaction
    // - Recent fingerprint avoidance

    return rng.pick(blueprints);
}

/**
 * Try to instantiate any blueprint from a list
 * Returns first successful instantiation
 */
export function tryInstantiateAny(
    blueprints: IncidentBlueprint[],
    world: World,
    rng: RNG,
    maxAttempts: number = 10
): { blueprint: IncidentBlueprint; plan: CrimePlan } | null {
    // Shuffle blueprints
    const shuffled = [...blueprints].sort(() => rng.nextInt(3) - 1);

    for (let i = 0; i < Math.min(maxAttempts, shuffled.length); i++) {
        const blueprint = shuffled[i % shuffled.length];
        const plan = instantiateCrimePlan(blueprint, world, rng);

        if (plan) {
            return { blueprint, plan };
        }
    }

    return null;
}
