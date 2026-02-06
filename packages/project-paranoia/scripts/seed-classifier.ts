/**
 * Seed Classifier for Project PARANOIA.
 *
 * Profiles seeds by running both smart and passive simulations,
 * then classifies difficulty tier and scores quality on 5 axes:
 *   Tension, Agency, Pacing, Variety, Drama
 *
 * Usage: npx tsx scripts/seed-classifier.ts [N=500] [--json] [--top=10]
 */

import { createInitialState } from '../src/kernel/state.js';
import { stepKernel, type Command } from '../src/kernel/kernel.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import { CONFIG } from '../src/config.js';
import { TICKS_PER_DAY } from '../src/core/time.js';
import type { KernelState, ArcKind } from '../src/kernel/types.js';
import type { PlaceId, NPCId } from '../src/core/types.js';
import { getCrewDoubtBurden, getAverageDoubtBurden } from '../src/kernel/systems/doubt-engine.js';

const NUM_SEEDS = parseInt(process.argv[2] || '500', 10);
const JSON_OUTPUT = process.argv.includes('--json');
const TOP_N = parseInt(
    (process.argv.find(a => a.startsWith('--top='))?.split('=')[1]) ?? '10',
    10,
);

// ============================================================
// TYPES
// ============================================================

type DifficultyTier = 'easy' | 'medium' | 'hard';

interface CrisisEvent {
    kind: ArcKind;
    day: number;
    target: PlaceId;
}

interface SimProfile {
    outcome: string;
    peakSuspicion: number;
    suspicionMargin: number;
    cargoMargin: number;
    ticksInStage: Record<string, number>;
    crewDeaths: number;
    crewInjuries: number;
    ticksInCountdown: number;
}

interface SeedProfile {
    seed: number;
    tier: DifficultyTier;

    passive: SimProfile;
    smart: SimProfile;

    // Crisis profile (from passive — represents the "natural" seed character)
    crisisTypes: ArcKind[];
    crisisCount: number;
    crisisPerDay: number[];
    primaryThreat: ArcKind | 'none';
    constraintType: 'suspicion' | 'quota' | 'integrity' | 'balanced';

    // Quality score
    score: SeedScore;
}

interface SeedScore {
    total: number;       // 0-100
    tension: number;     // 0-20
    agency: number;      // 0-20
    pacing: number;      // 0-20
    variety: number;     // 0-20
    drama: number;       // 0-20
}

// ============================================================
// SIMULATION RUNNER
// ============================================================

function runSim(seed: number, passive: boolean): { profile: SimProfile; crises: CrisisEvent[] } {
    const rng = createRng(seed);
    const world = createWorld(rng);
    const state = createInitialState(world, CONFIG.quotaPerDay);

    const crises: CrisisEvent[] = [];
    const seenArcIds = new Set<string>();
    let crewInjuries = 0;

    const ticksInStage: Record<string, number> = {
        none: 0, whispers: 0, meeting: 0, restrictions: 0, countdown: 0,
    };
    let peakSuspicion = 0;
    let ticksInCountdown = 0;
    let minIntegrity = 100;

    while (!state.truth.ending) {
        const truth = state.truth;

        // Track reset stage time
        ticksInStage[truth.resetStage] = (ticksInStage[truth.resetStage] || 0) + 1;
        if (truth.resetStage === 'countdown') ticksInCountdown++;

        // Track suspicion
        const suspicion = calcSuspicion(state);
        peakSuspicion = Math.max(peakSuspicion, suspicion);

        // Track integrity
        minIntegrity = Math.min(minIntegrity, state.perception.integrity ?? 100);

        // Track new arcs (crisis events)
        for (const arc of truth.arcs) {
            if (!seenArcIds.has(arc.id)) {
                seenArcIds.add(arc.id);
                crises.push({
                    kind: arc.kind,
                    day: truth.day,
                    target: arc.target,
                });
            }
        }

        // Track injuries via events (check health decreases)
        // Simplified: count NPC_DAMAGE events from the step

        const commands = passive ? [] : solve(state);
        const prevHealth: Record<string, number> = {};
        for (const [id, npc] of Object.entries(truth.crew)) {
            if (npc.alive) prevHealth[id] = npc.hp;
        }

        stepKernel(state, commands, rng);

        // Count injuries
        for (const [id, npc] of Object.entries(state.truth.crew)) {
            const prev = prevHealth[id];
            if (prev !== undefined && npc.hp < prev) crewInjuries++;
        }

        if (state.truth.tick > TICKS_PER_DAY * 10) {
            state.truth.ending = 'TIMEOUT';
        }
    }

    const totalQuota = CONFIG.quotaPerDay * CONFIG.winDays;
    const profile: SimProfile = {
        outcome: state.truth.ending!,
        peakSuspicion,
        suspicionMargin: CONFIG.resetThresholdCountdown - peakSuspicion,
        cargoMargin: state.truth.totalCargo - totalQuota,
        ticksInStage,
        crewDeaths: Object.values(state.truth.crew).filter(c => !c.alive).length,
        crewInjuries,
        ticksInCountdown,
    };

    return { profile, crises };
}

// ============================================================
// SOLVER (same as smart-solver.ts)
// ============================================================

function solve(state: KernelState): Command[] {
    const commands: Command[] = [];
    const truth = state.truth;
    const suspicion = calcSuspicion(state);

    // VERIFY when beneficial
    const ticksSinceVerify = truth.tick - truth.lastVerifyTick;
    const canVerify = ticksSinceVerify >= CONFIG.verifyCooldown && truth.station.power >= CONFIG.verifyCpuCost;
    const avgDoubtBurden = getAverageDoubtBurden(state);
    if (canVerify && (suspicion > 25 || avgDoubtBurden > 4)) {
        commands.push({ type: 'VERIFY' });
    }

    // Hazard management
    for (const [roomId, room] of Object.entries(truth.rooms)) {
        if (room.onFire && !room.isVented) {
            const occupants = Object.values(truth.crew).filter(c => c.alive && c.place === roomId);
            if (occupants.length === 0) {
                commands.push({ type: 'VENT', place: roomId as PlaceId });
            } else {
                const urgent = room.temperature > 180 || room.o2Level < 30;
                if (urgent) {
                    commands.push({ type: 'VENT', place: roomId as PlaceId });
                } else {
                    for (const occ of occupants) {
                        if (willOrderBeAccepted(state, occ.id)) {
                            const safeRoom = findSafeRoom(state, occ.id);
                            if (safeRoom) {
                                commands.push({ type: 'ORDER', target: occ.id, intent: 'move', place: safeRoom });
                            }
                        }
                    }
                }
            }
        }
        if (room.isVented && !room.onFire && room.o2Level < 15) {
            commands.push({ type: 'SEAL', place: roomId as PlaceId });
        }
    }

    // O2 recovery for path rooms
    const specialist = truth.crew['specialist'];
    const roughneck = truth.crew['roughneck'];
    for (const [roomId, room] of Object.entries(truth.rooms)) {
        if (!room.isVented && !room.onFire && room.o2Level < 25) {
            for (const worker of [specialist, roughneck]) {
                if (!worker.alive) continue;
                if (getPathToMines(worker.place).includes(roomId as PlaceId)) {
                    if (truth.station.power >= 50) {
                        commands.push({ type: 'PURGE_AIR' });
                    }
                    break;
                }
            }
        }
    }

    // Order workers to mines
    if (truth.window === 'W2' || truth.window === 'W3') {
        for (const npcId of ['specialist', 'roughneck'] as const) {
            const npc = truth.crew[npcId];
            if (!npc.alive || npc.place === 'mines') continue;
            if (!willOrderBeAccepted(state, npcId)) continue;
            const burden = getCrewDoubtBurden(state, npcId);
            if (burden > CONFIG.doubtBurdenMineThreshold) continue;
            const path = getPathToMines(npc.place);
            if (path.some(r => isHazardous(truth.rooms[r]))) continue;
            commands.push({ type: 'ORDER', target: npcId, intent: 'move', place: 'mines' });
        }
    }

    // Deduplicate
    const seen = new Set<string>();
    return commands.filter(cmd => {
        const key = JSON.stringify(cmd);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// ============================================================
// CLASSIFICATION + SCORING
// ============================================================

function classifyTier(passive: SimProfile): DifficultyTier {
    if (passive.outcome === 'SURVIVED') {
        // Easy if never hit restrictions, medium if did
        const hitRestrictions = (passive.ticksInStage['restrictions'] || 0) > 0;
        const hitCountdown = (passive.ticksInStage['countdown'] || 0) > 0;
        if (hitCountdown || hitRestrictions) return 'medium';
        return 'easy';
    }
    // Passive died
    return 'hard';
}

function identifyPrimaryThreat(crises: CrisisEvent[]): ArcKind | 'none' {
    if (crises.length === 0) return 'none';
    const counts: Partial<Record<ArcKind, number>> = {};
    for (const c of crises) {
        counts[c.kind] = (counts[c.kind] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as ArcKind;
}

function identifyConstraint(passive: SimProfile): SeedProfile['constraintType'] {
    if (passive.outcome === 'UNPLUGGED') return 'suspicion';
    if (passive.outcome === 'DECOMMISSIONED') return 'quota';
    if (passive.outcome === 'MELTDOWN') return 'integrity';

    // Survived — what was tightest?
    const suspTightness = passive.suspicionMargin;
    const cargoTightness = passive.cargoMargin;

    if (suspTightness < 10 && cargoTightness < 3) return 'balanced';
    if (suspTightness < cargoTightness) return 'suspicion';
    if (cargoTightness < 3) return 'quota';
    return 'balanced';
}

function scoreSeed(
    passive: SimProfile,
    smart: SimProfile,
    crises: CrisisEvent[],
    tier: DifficultyTier,
): SeedScore {
    // --- Tension (0-20) ---
    // Best tension: smart peak suspicion 35-55 (dangerous but survivable)
    let tension = 0;
    const smartPeak = smart.peakSuspicion;
    if (smartPeak >= 35 && smartPeak <= 55) {
        tension = 20; // sweet spot
    } else if (smartPeak >= 25 && smartPeak < 35) {
        tension = 10 + Math.round((smartPeak - 25) / 10 * 10); // 10-20
    } else if (smartPeak > 55 && smartPeak <= 68) {
        tension = 20 - Math.round((smartPeak - 55) / 13 * 10); // 20-10
    } else if (smartPeak < 25) {
        tension = Math.round(smartPeak / 25 * 10); // 0-10
    } else {
        tension = 5; // past countdown threshold, too dangerous
    }
    tension = Math.max(0, Math.min(20, tension));

    // --- Agency (0-20) ---
    // How much do player commands matter?
    let agency = 0;
    const smartWon = smart.outcome === 'SURVIVED';
    const passiveWon = passive.outcome === 'SURVIVED';

    if (smartWon && !passiveWon) {
        agency = 20; // player input is the difference between life and death
    } else if (smartWon && passiveWon) {
        // Both survived — compare margins
        const marginDiff = smart.suspicionMargin - passive.suspicionMargin;
        agency = Math.min(15, Math.max(0, Math.round(marginDiff / 2)));
        // Bonus if smart had way better cargo margin
        if (smart.cargoMargin > passive.cargoMargin + 5) agency = Math.min(20, agency + 3);
    } else if (!smartWon) {
        agency = 0; // even smart solver can't win, bad seed
    }

    // --- Pacing (0-20) ---
    // Even crisis distribution across days = good pacing
    const maxDays = CONFIG.winDays;
    const crisesPerDay = Array.from({ length: maxDays }, (_, d) =>
        crises.filter(c => c.day === d + 1).length
    );
    const totalCrises = crises.length;

    let pacing = 0;
    if (totalCrises === 0) {
        pacing = 5; // no crises = boring but playable
    } else {
        const idealPerDay = totalCrises / maxDays;
        let deviationSum = 0;
        for (const count of crisesPerDay) {
            deviationSum += Math.abs(count - idealPerDay);
        }
        // Normalize: 0 deviation = 15 points, high deviation = 0
        const maxDeviation = totalCrises; // worst case: all in one day
        const deviationRatio = deviationSum / Math.max(1, maxDeviation);
        pacing = Math.round(15 * (1 - deviationRatio));

        // Bonus: crises in every day (+5)
        const daysWithCrises = crisesPerDay.filter(c => c > 0).length;
        if (daysWithCrises === maxDays) pacing += 5;
        else if (daysWithCrises >= 2) pacing += 2;
    }
    pacing = Math.max(0, Math.min(20, pacing));

    // --- Variety (0-20) ---
    const uniqueKinds = new Set(crises.map(c => c.kind));
    const kindCount = uniqueKinds.size;
    // 6 possible kinds: air_scrubber, power_surge, ghost_signal, fire_outbreak, radiation_leak, solar_flare
    let variety = 0;
    if (kindCount >= 5) variety = 20;
    else if (kindCount === 4) variety = 16;
    else if (kindCount === 3) variety = 12;
    else if (kindCount === 2) variety = 8;
    else if (kindCount === 1) variety = 4;
    // 0 crises = 0 variety

    // --- Drama (0-20) ---
    let drama = 0;
    // Near-miss suspicion (smart): within 10 of countdown
    if (smart.suspicionMargin <= 10) drama += 6;
    else if (smart.suspicionMargin <= 15) drama += 3;
    // Near-miss cargo
    if (smart.cargoMargin <= 2 && smart.outcome === 'SURVIVED') drama += 5;
    else if (smart.cargoMargin <= 5 && smart.outcome === 'SURVIVED') drama += 2;
    // Crew injuries (tension-builders)
    drama += Math.min(5, smart.crewInjuries * 2);
    // Entered countdown but survived
    if (smart.ticksInCountdown > 0 && smart.outcome === 'SURVIVED') drama += 7;
    // Crew death but still survived
    if (smart.crewDeaths > 0 && smart.outcome === 'SURVIVED') drama += 4;
    drama = Math.max(0, Math.min(20, drama));

    const total = tension + agency + pacing + variety + drama;
    return { total, tension, agency, pacing, variety, drama };
}

// ============================================================
// MAIN LOOP
// ============================================================

const profiles: SeedProfile[] = [];

for (let i = 0; i < NUM_SEEDS; i++) {
    const seed = 1000 + i;

    const passiveRun = runSim(seed, true);
    const smartRun = runSim(seed, false);

    const crises = passiveRun.crises; // use passive crises as "natural" seed character
    const tier = classifyTier(passiveRun.profile);
    const primaryThreat = identifyPrimaryThreat(crises);
    const constraintType = identifyConstraint(passiveRun.profile);
    const score = scoreSeed(passiveRun.profile, smartRun.profile, crises, tier);

    const crisesPerDay = Array.from({ length: CONFIG.winDays }, (_, d) =>
        crises.filter(c => c.day === d + 1).length
    );

    profiles.push({
        seed,
        tier,
        passive: passiveRun.profile,
        smart: smartRun.profile,
        crisisTypes: [...new Set(crises.map(c => c.kind))],
        crisisCount: crises.length,
        crisisPerDay: crisesPerDay,
        primaryThreat,
        constraintType,
        score,
    });
}

// ============================================================
// OUTPUT
// ============================================================

if (JSON_OUTPUT) {
    // Machine-readable catalog
    const catalog = {
        generated: new Date().toISOString(),
        seedCount: NUM_SEEDS,
        seedRange: { start: 1000, end: 1000 + NUM_SEEDS - 1 },
        config: {
            resetThresholdCountdown: CONFIG.resetThresholdCountdown,
            verifyCooldown: CONFIG.verifyCooldown,
            quotaPerDay: CONFIG.quotaPerDay,
            winDays: CONFIG.winDays,
        },
        tiers: {
            easy: profiles.filter(p => p.tier === 'easy').sort((a, b) => b.score.total - a.score.total),
            medium: profiles.filter(p => p.tier === 'medium').sort((a, b) => b.score.total - a.score.total),
            hard: profiles.filter(p => p.tier === 'hard').sort((a, b) => b.score.total - a.score.total),
        },
    };
    console.log(JSON.stringify(catalog, null, 2));
} else {
    printReport(profiles);
}

function printReport(all: SeedProfile[]) {
    const easy = all.filter(p => p.tier === 'easy');
    const medium = all.filter(p => p.tier === 'medium');
    const hard = all.filter(p => p.tier === 'hard');

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`  SEED CLASSIFIER — ${all.length} seeds profiled`);
    console.log(`${'═'.repeat(70)}`);

    // Tier distribution
    console.log(`\n  TIER DISTRIBUTION`);
    console.log(`  ${'─'.repeat(50)}`);
    console.log(`  Easy:   ${easy.length.toString().padStart(4)} (${pct(easy.length, all.length)})`);
    console.log(`  Medium: ${medium.length.toString().padStart(4)} (${pct(medium.length, all.length)})`);
    console.log(`  Hard:   ${hard.length.toString().padStart(4)} (${pct(hard.length, all.length)})`);

    // Constraint types
    const constraints: Record<string, number> = {};
    for (const p of all) constraints[p.constraintType] = (constraints[p.constraintType] || 0) + 1;
    console.log(`\n  CONSTRAINT DISTRIBUTION`);
    console.log(`  ${'─'.repeat(50)}`);
    for (const [type, count] of Object.entries(constraints).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${type.padEnd(15)} ${count.toString().padStart(4)} (${pct(count, all.length)})`);
    }

    // Primary threat distribution
    const threats: Record<string, number> = {};
    for (const p of all) threats[p.primaryThreat] = (threats[p.primaryThreat] || 0) + 1;
    console.log(`\n  PRIMARY THREAT DISTRIBUTION`);
    console.log(`  ${'─'.repeat(50)}`);
    for (const [type, count] of Object.entries(threats).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${type.padEnd(18)} ${count.toString().padStart(4)} (${pct(count, all.length)})`);
    }

    // Score stats per tier
    for (const [label, seeds] of [['EASY', easy], ['MEDIUM', medium], ['HARD', hard]] as const) {
        if (seeds.length === 0) continue;
        console.log(`\n  ${'─'.repeat(70)}`);
        console.log(`  ${label} TIER — ${seeds.length} seeds`);
        console.log(`  ${'─'.repeat(70)}`);

        const scores = seeds.map(s => s.score);
        console.log(`  Score:    min ${Math.min(...scores.map(s => s.total)).toString().padStart(3)}  avg ${avg(scores.map(s => s.total)).toFixed(0).padStart(3)}  max ${Math.max(...scores.map(s => s.total)).toString().padStart(3)}`);
        console.log(`  Tension:  avg ${avg(scores.map(s => s.tension)).toFixed(1).padStart(5)}/20`);
        console.log(`  Agency:   avg ${avg(scores.map(s => s.agency)).toFixed(1).padStart(5)}/20`);
        console.log(`  Pacing:   avg ${avg(scores.map(s => s.pacing)).toFixed(1).padStart(5)}/20`);
        console.log(`  Variety:  avg ${avg(scores.map(s => s.variety)).toFixed(1).padStart(5)}/20`);
        console.log(`  Drama:    avg ${avg(scores.map(s => s.drama)).toFixed(1).padStart(5)}/20`);

        // Smart solver stats for this tier
        const smartWins = seeds.filter(s => s.smart.outcome === 'SURVIVED').length;
        const passiveWins = seeds.filter(s => s.passive.outcome === 'SURVIVED').length;
        console.log(`  Smart win: ${pct(smartWins, seeds.length)}  Passive win: ${pct(passiveWins, seeds.length)}`);

        // Top seeds
        const sorted = [...seeds].sort((a, b) => b.score.total - a.score.total);
        console.log(`\n  TOP ${Math.min(TOP_N, sorted.length)} SEEDS:`);
        console.log(`  ${'seed'.padEnd(6)} ${'score'.padStart(5)} ${'T'.padStart(3)} ${'A'.padStart(3)} ${'P'.padStart(3)} ${'V'.padStart(3)} ${'D'.padStart(3)}  ${'primary threat'.padEnd(16)} ${'constraint'.padEnd(12)} crises  smartMargin`);
        for (const p of sorted.slice(0, TOP_N)) {
            const s = p.score;
            console.log(
                `  ${p.seed.toString().padEnd(6)} ` +
                `${s.total.toString().padStart(5)} ` +
                `${s.tension.toString().padStart(3)} ` +
                `${s.agency.toString().padStart(3)} ` +
                `${s.pacing.toString().padStart(3)} ` +
                `${s.variety.toString().padStart(3)} ` +
                `${s.drama.toString().padStart(3)}  ` +
                `${p.primaryThreat.padEnd(16)} ` +
                `${p.constraintType.padEnd(12)} ` +
                `${p.crisisCount.toString().padStart(2)}(${p.crisisPerDay.join('/')})  ` +
                `susp ${p.smart.suspicionMargin.toFixed(0).padStart(3)} cargo ${p.smart.cargoMargin.toString().padStart(3)}`
            );
        }
    }

    console.log(`\n${'═'.repeat(70)}\n`);
}

// ============================================================
// HELPERS
// ============================================================

function calcSuspicion(state: KernelState): number {
    const alive = Object.values(state.truth.crew).filter(c => c.alive);
    if (alive.length === 0) return 0;
    let total = 0;
    for (const npc of alive) {
        const b = state.perception.beliefs[npc.id as NPCId];
        if (!b) continue;
        total += (b.tamperEvidence / 100) * 40 + (1 - b.motherReliable) * 35 + (b.rumors['mother_rogue'] ?? 0) * 25;
    }
    return total / alive.length;
}

function willOrderBeAccepted(state: KernelState, npcId: NPCId): boolean {
    const crew = state.truth.crew[npcId];
    if (!crew?.alive) return false;
    const b = state.perception.beliefs[npcId];
    const baseTrust = ((b?.motherReliable ?? 0.7) * 100 + crew.loyalty) / 2;
    const doubtPenalty = getCrewDoubtBurden(state, npcId) * CONFIG.doubtBurdenOrderPenalty;
    const trust = baseTrust - doubtPenalty;
    let threshold = CONFIG.orderAcceptThreshold;
    switch (state.truth.resetStage) {
        case 'whispers': threshold += CONFIG.resetWhispersOrderPenalty; break;
        case 'meeting': threshold += CONFIG.resetMeetingOrderPenalty; break;
        case 'restrictions': threshold += CONFIG.resetRestrictionsOrderPenalty; break;
        case 'countdown': threshold += CONFIG.resetCountdownOrderPenalty; break;
    }
    return trust >= threshold;
}

function getPathToMines(from: PlaceId): PlaceId[] {
    const paths: Record<string, PlaceId[]> = {
        dorms: ['mess', 'bridge', 'core', 'engineering', 'cargo', 'mines'],
        mess: ['bridge', 'core', 'engineering', 'cargo', 'mines'],
        medbay: ['mess', 'bridge', 'core', 'engineering', 'cargo', 'mines'],
        bridge: ['core', 'engineering', 'cargo', 'mines'],
        core: ['engineering', 'cargo', 'mines'],
        engineering: ['cargo', 'mines'],
        cargo: ['mines'],
        mines: [],
        airlock_a: ['cargo', 'mines'],
        airlock_b: ['cargo', 'mines'],
    };
    return paths[from] || [];
}

function isHazardous(room: { o2Level: number; temperature: number; radiation: number; isVented: boolean; onFire: boolean }): boolean {
    return room.onFire || room.isVented || room.o2Level < 25 || room.temperature > 45 || room.radiation > CONFIG.radiationHazardThreshold;
}

function findSafeRoom(state: KernelState, _npcId: NPCId): PlaceId | null {
    const preferredRooms: PlaceId[] = ['mess', 'cargo', 'dorms', 'medbay'];
    for (const roomId of preferredRooms) {
        const room = state.truth.rooms[roomId];
        if (room && !isHazardous(room)) return roomId;
    }
    return null;
}

function avg(arr: number[]): number { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0; }
function pct(count: number, total: number): string { return `${((count / total) * 100).toFixed(1)}%`; }
