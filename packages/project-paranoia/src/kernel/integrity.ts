import type { RoomSystemState } from '../engine/systems.js';

/**
 * Calculate station integrity using worst-room penalty blend.
 * A single failing room drags the score down visibly.
 *
 * Per-room health = (o2 + hull integrity) / 2, with penalties for fire/venting.
 * Final score = power * 0.1 + (avg * 0.4 + worst * 0.6) * 0.9
 */
export function calculateIntegrity(rooms: RoomSystemState[], power: number): number {
    if (rooms.length === 0) return 0;

    const healths = rooms.map(r => {
        let hp = (r.o2Level + r.integrity) / 2;
        if (r.onFire) hp -= 25;
        if (r.isVented) hp -= 15;
        return Math.max(0, hp);
    });

    const avg = healths.reduce((s, h) => s + h, 0) / healths.length;
    const worst = Math.min(...healths);

    // Blend: worst room pulls score down heavily
    const blended = avg * 0.4 + worst * 0.6;

    // Power is a small factor
    const score = power * 0.1 + blended * 0.9;

    return Math.round(Math.max(0, Math.min(100, score)));
}
