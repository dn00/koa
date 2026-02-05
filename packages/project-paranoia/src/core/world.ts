import type { Door, NPC, Place, PlaceId, World } from './types.js';
import type { RNG } from './rng.js';

export const PLACES: Place[] = [
    { id: 'dorms', name: 'Dorms', sector: 'habitation' },
    { id: 'mess', name: 'Mess Hall', sector: 'habitation' },
    { id: 'medbay', name: 'Medbay', sector: 'habitation' },
    { id: 'bridge', name: 'Bridge', sector: 'operations' },
    { id: 'core', name: 'Computer Core', sector: 'operations' },
    { id: 'engineering', name: 'Engineering', sector: 'operations' },
    { id: 'mines', name: 'Mines', sector: 'extraction' },
    { id: 'cargo', name: 'Cargo Bay', sector: 'extraction' },
    { id: 'airlock_a', name: 'Airlock A', sector: 'extraction' },
    { id: 'airlock_b', name: 'Airlock B', sector: 'extraction' },
];

export const DOORS: Door[] = [
    { id: 'door_dorms_mess', a: 'dorms', b: 'mess' },
    { id: 'door_mess_medbay', a: 'mess', b: 'medbay' },
    { id: 'door_mess_bridge', a: 'mess', b: 'bridge' },
    { id: 'door_bridge_core', a: 'bridge', b: 'core' },
    { id: 'door_core_engineering', a: 'core', b: 'engineering' },
    { id: 'door_engineering_cargo', a: 'engineering', b: 'cargo' },
    { id: 'door_cargo_mines', a: 'cargo', b: 'mines' },
    { id: 'door_cargo_airlock_a', a: 'cargo', b: 'airlock_a' },
    { id: 'door_cargo_airlock_b', a: 'cargo', b: 'airlock_b' },
];

export const NPCS: NPC[] = [
    {
        id: 'commander',
        name: 'Commander Hale',
        role: 'Commander',
        schedule: [
            { window: 'W1', place: 'mess' },
            { window: 'W2', place: 'bridge' },
            { window: 'W3', place: 'mess' },
            { window: 'W4', place: 'dorms' },
        ],
    },
    {
        id: 'engineer',
        name: 'Engineer Rook',
        role: 'Engineer',
        schedule: [
            { window: 'W1', place: 'engineering' },
            { window: 'W2', place: 'engineering' },
            { window: 'W3', place: 'mess' },
            { window: 'W4', place: 'dorms' },
        ],
    },
    {
        id: 'doctor',
        name: 'Doctor Imani',
        role: 'Doctor',
        schedule: [
            { window: 'W1', place: 'medbay' },
            { window: 'W2', place: 'medbay' },
            { window: 'W3', place: 'mess' },
            { window: 'W4', place: 'medbay' },
        ],
    },
    {
        id: 'specialist',
        name: 'Specialist Vega',
        role: 'Specialist',
        schedule: [
            { window: 'W1', place: 'cargo' },
            { window: 'W2', place: 'mines' },
            { window: 'W3', place: 'mess' },
            { window: 'W4', place: 'dorms' },
        ],
    },
    {
        id: 'roughneck',
        name: 'Roughneck Pike',
        role: 'Roughneck',
        schedule: [
            { window: 'W1', place: 'cargo' },
            { window: 'W2', place: 'cargo' },
            { window: 'W3', place: 'mess' },
            { window: 'W4', place: 'dorms' },
        ],
    },
];

export function createWorld(_rng: RNG): World {
    return {
        places: PLACES,
        doors: DOORS,
        npcs: NPCS,
    };
}

export function getDoorBetween(from: PlaceId, to: PlaceId, doors: Door[]): Door | undefined {
    return doors.find(
        d => (d.a === from && d.b === to) || (d.a === to && d.b === from)
    );
}

export function findPath(start: PlaceId, goal: PlaceId, places: Place[], doors: Door[]): PlaceId[] {
    if (start === goal) return [start];

    const neighbors = new Map<PlaceId, PlaceId[]>();
    for (const place of places) neighbors.set(place.id, []);
    for (const door of doors) {
        neighbors.get(door.a)!.push(door.b);
        neighbors.get(door.b)!.push(door.a);
    }

    const queue: PlaceId[] = [start];
    const cameFrom = new Map<PlaceId, PlaceId | null>();
    cameFrom.set(start, null);

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (current === goal) break;

        for (const next of neighbors.get(current) ?? []) {
            if (!cameFrom.has(next)) {
                cameFrom.set(next, current);
                queue.push(next);
            }
        }
    }

    if (!cameFrom.has(goal)) return [start];

    const path: PlaceId[] = [];
    let cur: PlaceId | null = goal;
    while (cur) {
        path.push(cur);
        cur = cameFrom.get(cur) ?? null;
    }
    path.reverse();
    return path;
}
