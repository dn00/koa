import { DOORS } from '@aura/project-paranoia';
import type { Door } from '@aura/project-paranoia';

export type DoorInfo = {
  doorId: string;
  otherRoom: string;
};

/** Returns doors connected to a given room, with the "other side" room id. */
export function getDoorsForRoom(roomId: string): DoorInfo[] {
  return DOORS
    .filter((d: Door) => d.a === roomId || d.b === roomId)
    .map((d: Door) => ({
      doorId: d.id,
      otherRoom: d.a === roomId ? d.b : d.a,
    }));
}

export const TARGETABLE_SYSTEMS = ['comms', 'doors', 'life_support', 'power', 'sensors'] as const;
export type TargetableSystem = typeof TARGETABLE_SYSTEMS[number];

export const REROUTE_TARGETS = ['comms', 'doors', 'life_support'] as const;
export type RerouteTarget = typeof REROUTE_TARGETS[number];

export const ORDER_INTENTS = ['move', 'report', 'hold'] as const;
export type OrderIntent = typeof ORDER_INTENTS[number];

export const RATION_LEVELS = ['low', 'normal', 'high'] as const;
export type RationLevel = typeof RATION_LEVELS[number];
