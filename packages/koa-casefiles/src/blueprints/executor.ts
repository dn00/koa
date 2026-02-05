/**
 * KOA Casefiles - Crime Plan Executor
 *
 * Converts a CrimePlan into actual SimEvents that get added to the event log.
 */

import type { RNG } from '../kernel/rng.js';
import { computeEventId } from '../kernel/canonical.js';
import type {
    World,
    SimEvent,
    EventType,
    NPCId,
    PlaceId,
    ItemId,
    DeviceId,
} from '../types.js';
import { getWindowForTick } from '../types.js';
import { getDoorBetween, findPath } from '../world.js';

import type {
    CrimePlan,
    ResolvedCrimeStep,
    IntentType,
} from './types.js';

// ============================================================================
// Event Generation
// ============================================================================

let eventOrdinal = 0;

export function resetEventOrdinal(): void {
    eventOrdinal = 0;
}

export function setEventOrdinal(value: number): void {
    eventOrdinal = value;
}

function createEvent(
    tick: number,
    type: EventType,
    fields: Partial<SimEvent>
): SimEvent {
    const event: SimEvent = {
        id: '',
        tick,
        window: getWindowForTick(tick),
        type,
        ...fields,
    };

    event.id = computeEventId({
        tick,
        ordinal: eventOrdinal++,
        type,
        ...fields,
    });

    return event;
}

// ============================================================================
// Intent Execution
// ============================================================================

interface ExecutionContext {
    world: World;
    plan: CrimePlan;
    currentPlace: Map<NPCId, PlaceId>;
    rng: RNG;
}

/**
 * Execute a single plan step and return generated events
 */
function executeStep(
    step: ResolvedCrimeStep,
    ctx: ExecutionContext
): SimEvent[] {
    const events: SimEvent[] = [];
    const { world, plan } = ctx;

    switch (step.intent.type) {
        case 'MOVE_TO':
            events.push(...executeMoveIntent(step, ctx));
            break;

        case 'ACQUIRE':
            events.push(...executeAcquireIntent(step, ctx));
            break;

        case 'HIDE':
            events.push(...executeHideIntent(step, ctx));
            break;

        case 'DROP':
            events.push(...executeDropIntent(step, ctx));
            break;

        case 'SWAP':
            events.push(...executeSwapIntent(step, ctx));
            break;

        case 'TAMPER':
            events.push(...executeTamperIntent(step, ctx));
            break;

        case 'WAIT':
            // No events for waiting
            break;

        case 'OBSERVE':
            // Observation doesn't generate events (passive)
            break;

        case 'DISTRACT':
            events.push(...executeDistractIntent(step, ctx));
            break;

        case 'SPOOF':
            events.push(...executeSpoofIntent(step, ctx));
            break;
    }

    return events;
}

/**
 * Execute MOVE_TO intent - generates door and movement events
 */
function executeMoveIntent(
    step: ResolvedCrimeStep,
    ctx: ExecutionContext
): SimEvent[] {
    const events: SimEvent[] = [];
    const { world } = ctx;

    const currentPlace = ctx.currentPlace.get(step.actor) ?? 'living';
    const targetPlace = step.place;

    if (currentPlace === targetPlace) {
        return events; // Already there
    }

    const path = findPath(currentPlace, targetPlace, world.places);
    let tick = step.tick;

    for (let i = 0; i < path.length - 1; i++) {
        const from = path[i];
        const to = path[i + 1];

        // Door open
        const door = getDoorBetween(from, to, world.devices);
        if (door) {
            events.push(createEvent(tick, 'DOOR_OPENED', {
                actor: step.actor,
                place: from,
                toPlace: to,
                target: door.id,
            }));
            tick += 1;
        }

        // Move
        events.push(createEvent(tick, 'NPC_MOVE', {
            actor: step.actor,
            fromPlace: from,
            toPlace: to,
            place: to,
        }));

        // Motion sensor
        const motionSensor = world.devices.find(d =>
            d.type === 'motion_sensor' && d.place === to
        );
        if (motionSensor) {
            events.push(createEvent(tick, 'MOTION_DETECTED', {
                actor: step.actor,
                place: to,
                target: motionSensor.id,
            }));
        }

        tick += 1;

        // Door close
        if (door) {
            events.push(createEvent(tick, 'DOOR_CLOSED', {
                actor: step.actor,
                place: to,
                fromPlace: from,
                target: door.id,
            }));
            tick += 1;
        }
    }

    // Update current place
    ctx.currentPlace.set(step.actor, targetPlace);

    return events;
}

/**
 * Execute ACQUIRE intent - take an item
 */
function executeAcquireIntent(
    step: ResolvedCrimeStep,
    ctx: ExecutionContext
): SimEvent[] {
    const { plan } = ctx;
    const method = step.intent.params.method as string ?? 'grabbed';

    return [
        createEvent(step.tick, 'ITEM_TAKEN', {
            actor: step.actor,
            place: step.place,
            target: plan.targetItem,
            data: { method },
        }),
    ];
}

/**
 * Execute HIDE intent - conceal an item
 */
function executeHideIntent(
    step: ResolvedCrimeStep,
    ctx: ExecutionContext
): SimEvent[] {
    const { plan } = ctx;
    const method = step.intent.params.method as string ?? 'hidden';

    return [
        createEvent(step.tick, 'ITEM_HIDDEN', {
            actor: step.actor,
            place: step.place,
            target: plan.targetItem,
            data: { method },
        }),
    ];
}

/**
 * Execute DROP intent - leave an item somewhere
 */
function executeDropIntent(
    step: ResolvedCrimeStep,
    ctx: ExecutionContext
): SimEvent[] {
    const { plan } = ctx;
    const method = step.intent.params.method as string ?? 'dropped';

    return [
        createEvent(step.tick, 'ITEM_DROPPED', {
            actor: step.actor,
            place: step.place,
            target: plan.targetItem,
            data: { method },
        }),
    ];
}

/**
 * Execute SWAP intent - replace item with something else
 */
function executeSwapIntent(
    step: ResolvedCrimeStep,
    ctx: ExecutionContext
): SimEvent[] {
    const { plan } = ctx;
    const withItem = step.intent.params.with as string ?? 'decoy';

    return [
        createEvent(step.tick, 'ITEM_SWAPPED', {
            actor: step.actor,
            place: step.place,
            target: plan.targetItem,
            data: { swappedWith: withItem },
        }),
    ];
}

/**
 * Execute TAMPER intent - mess with a device
 */
function executeTamperIntent(
    step: ResolvedCrimeStep,
    ctx: ExecutionContext
): SimEvent[] {
    const { world } = ctx;
    const action = step.intent.params.action as string ?? 'disabled';

    // Find a device at this location to tamper with
    const device = world.devices.find(d => d.place === step.place);
    if (!device) {
        return [];
    }

    return [
        createEvent(step.tick, 'DEVICE_TAMPERED', {
            actor: step.actor,
            place: step.place,
            target: device.id,
            data: { action },
        }),
    ];
}

/**
 * Execute DISTRACT intent - create a diversion
 */
function executeDistractIntent(
    step: ResolvedCrimeStep,
    ctx: ExecutionContext
): SimEvent[] {
    const method = step.intent.params.method as string ?? 'noise';

    // Distraction could trigger various events
    return [
        createEvent(step.tick, 'ACTIVITY_STARTED', {
            actor: step.actor,
            place: step.place,
            data: {
                activity: 'distraction',
                description: `Created a distraction: ${method}`,
            },
        }),
    ];
}

/**
 * Execute SPOOF intent - fake a device signal
 */
function executeSpoofIntent(
    step: ResolvedCrimeStep,
    ctx: ExecutionContext
): SimEvent[] {
    const { world } = ctx;
    const deviceType = step.intent.params.device as string;

    // Find the target device
    const device = world.devices.find(d =>
        d.place === step.place &&
        (deviceType ? d.type === deviceType : true)
    );

    if (!device) {
        return [];
    }

    return [
        createEvent(step.tick, 'DEVICE_TAMPERED', {
            actor: step.actor,
            place: step.place,
            target: device.id,
            data: { action: 'spoofed', spoofType: deviceType },
        }),
    ];
}

// ============================================================================
// Main Executor
// ============================================================================

/**
 * Execute a crime plan and return all generated events
 */
export function executeCrimePlan(
    plan: CrimePlan,
    world: World,
    rng: RNG
): SimEvent[] {
    const events: SimEvent[] = [];

    // Initialize context
    const ctx: ExecutionContext = {
        world,
        plan,
        currentPlace: new Map(),
        rng,
    };

    // Set initial positions from schedules
    for (const npc of world.npcs) {
        const scheduled = npc.schedule.find(s => s.window === plan.crimeWindow);
        ctx.currentPlace.set(npc.id, scheduled?.place ?? 'living');
    }

    // Execute each resolved step
    for (const step of plan.resolvedSteps) {
        const stepEvents = executeStep(step, ctx);
        events.push(...stepEvents);
    }

    // Sort by tick
    events.sort((a, b) => a.tick - b.tick);

    return events;
}

/**
 * Execute crime plan and return config for CaseConfig
 */
export function executeCrimePlanWithConfig(
    plan: CrimePlan,
    world: World,
    rng: RNG
): {
    events: SimEvent[];
    config: {
        culpritId: NPCId;
        targetItem: ItemId;
        crimeWindow: string;
        crimePlace: PlaceId;
        hiddenPlace: PlaceId;
    };
} {
    const events = executeCrimePlan(plan, world, rng);

    return {
        events,
        config: {
            culpritId: plan.culprit,
            targetItem: plan.targetItem,
            crimeWindow: plan.crimeWindow,
            crimePlace: plan.crimePlace,
            hiddenPlace: plan.hidePlace,
        },
    };
}
