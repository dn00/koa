import type { WindowId } from './types.js';

export const TICKS_PER_HOUR = 10;
export const HOURS_PER_DAY = 24;
export const TICKS_PER_DAY = TICKS_PER_HOUR * HOURS_PER_DAY;

export function getWindowForTick(tick: number): WindowId {
    const dayTick = tick % TICKS_PER_DAY;
    const hour = Math.floor(dayTick / TICKS_PER_HOUR);

    if (hour >= 6 && hour < 8) return 'W1'; // Pre-shift
    if (hour >= 8 && hour < 18) return 'W2'; // Shift
    if (hour >= 18 && hour < 22) return 'W3'; // Evening
    return 'W4'; // Night
}
