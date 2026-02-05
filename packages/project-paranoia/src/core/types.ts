export type WindowId = 'W1' | 'W2' | 'W3' | 'W4';

export const PLACE_IDS = [
    'dorms',
    'mess',
    'medbay',
    'bridge',
    'core',
    'engineering',
    'mines',
    'cargo',
    'airlock_a',
    'airlock_b',
] as const;

export type PlaceId = typeof PLACE_IDS[number];

export type DoorId = `door_${PlaceId}_${PlaceId}`;

export interface Place {
    id: PlaceId;
    name: string;
    sector: 'habitation' | 'operations' | 'extraction';
}

export interface Door {
    id: DoorId;
    a: PlaceId;
    b: PlaceId;
    locked?: boolean;
}

export type NPCId = 'commander' | 'engineer' | 'doctor' | 'specialist' | 'roughneck';

export interface NPCScheduleEntry {
    window: WindowId;
    place: PlaceId;
}

export interface NPC {
    id: NPCId;
    name: string;
    role: string;
    schedule: NPCScheduleEntry[];
}

export interface World {
    places: Place[];
    doors: Door[];
    npcs: NPC[];
}

export type EventType =
    | 'NPC_MOVE'
    | 'DOOR_OPENED'
    | 'DOOR_CLOSED'
    | 'NPC_DAMAGE'
    | 'NPC_DEATH'
    | 'CARGO_YIELD'
    | 'SYSTEM_ACTION'
    | 'SYSTEM_ALERT';

export interface SimEvent {
    id: string;
    tick: number;
    window: WindowId;
    type: EventType;
    actor?: NPCId;
    place?: PlaceId;
    fromPlace?: PlaceId;
    toPlace?: PlaceId;
    target?: string;
    data?: Record<string, unknown>;
}
