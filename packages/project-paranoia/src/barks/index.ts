import type { KernelState, SimEvent } from '../kernel/types.js';
import type { World } from '../core/types.js';
// @ts-ignore - Importing JSON directly
import baseBarks from '../../assets/barks/base.json';

export interface Bark {
    id: string;
    tags: Record<string, string>;
    text: string;
}

export interface BarkContext {
    event: SimEvent;
    state: KernelState;
    world: World;
}

let cachedBarks: Bark[] | null = null;

export function loadDefaultBarks(): Bark[] {
    if (cachedBarks) return cachedBarks;
    // Cast the import to Bark[]
    cachedBarks = baseBarks as Bark[];
    return cachedBarks;
}

export function renderBarkForEvent(barks: Bark[], context: BarkContext): string | undefined {
    const { event, state, world } = context;
    const tags: Record<string, string> = {
        event: event.type,
        phase: state.truth.phase,
    };

    if (event.actor && typeof event.actor === 'string') {
        tags.actor = event.actor;
        const npc = world.npcs.find(n => n.id === event.actor);
        if (npc) tags.role = npc.id;
    }
    if (event.place) tags.place = event.place;
    const system = String(event.data?.system ?? '');
    if (system) tags.system = system;

    const candidates = barks.filter(bark => matchesTags(bark.tags, tags));
    if (candidates.length === 0) return undefined;

    const pickIndex = hashString(event.id) % candidates.length;
    const chosen = candidates[pickIndex];
    return interpolate(chosen.text, tags);
}

function matchesTags(barkTags: Record<string, string>, contextTags: Record<string, string>): boolean {
    for (const [key, value] of Object.entries(barkTags)) {
        if (!contextTags[key]) return false;
        if (contextTags[key] !== value) return false;
    }
    return true;
}

function interpolate(text: string, tags: Record<string, string>): string {
    return text.replace(/\{(\w+)\}/g, (_match, key: string) => tags[key] ?? '');
}

function hashString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash;
}
