/**
 * Definitive balance solver for Project PARANOIA.
 *
 * A perfect solver should win 100% of a deterministic game.
 * What matters for balance is MARGINS — how close to death, how tight the
 * resources, how much pressure the player feels.
 *
 * Usage: npx tsx scripts/smart-solver.ts [N=200]
 */

import { createInitialState } from '../src/kernel/state.js';
import { stepKernel, type Command } from '../src/kernel/kernel.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import { CONFIG } from '../src/config.js';
import { TICKS_PER_DAY } from '../src/core/time.js';
import type { KernelState } from '../src/kernel/types.js';
import type { PlaceId, NPCId } from '../src/core/types.js';
import { getCrewDoubtBurden, getAverageDoubtBurden } from '../src/kernel/systems/doubt-engine.js';
import { SCENARIO_TEMPLATES, createManifest, type RunManifest } from '../src/kernel/manifest.js';

const NUM_GAMES = parseInt(process.argv[2] || '200', 10);
const PASSIVE = process.argv.includes('--passive');
const STRATEGY = process.argv.includes('--strategy');
const TRACE_SEED = process.argv.includes('--trace') ? parseInt(process.argv[process.argv.indexOf('--trace') + 1] || '0', 10) : 0;
const TEMPLATE_ARG = process.argv.find(a => a.startsWith('--template='))?.split('=')[1];
const MANIFEST: RunManifest | undefined = TEMPLATE_ARG && SCENARIO_TEMPLATES[TEMPLATE_ARG]
    ? createManifest(SCENARIO_TEMPLATES[TEMPLATE_ARG])
    : undefined;

// ============================================================
// METRICS
// ============================================================

interface GameMetrics {
    seed: number;
    outcome: string;
    days: number;

    // ── Margins (how close to losing) ──
    peakSuspicion: number;          // closest to UNPLUGGED
    suspicionMargin: number;        // countdown_threshold - peakSuspicion
    minIntegrity: number;           // closest to MELTDOWN (0)
    quotaMarginPerDay: number[];    // dayCargo - quotaPerDay at end of each day
    totalCargoMargin: number;       // totalCargo - (quotaPerDay * winDays)
    minPower: number;               // closest to powerless
    ticksInCountdown: number;       // how long in the danger zone

    // ── Reset stage time distribution ──
    ticksInStage: Record<string, number>;

    // ── Suspicion curve ──
    suspicionPerDay: number[];      // snapshot at end of each day
    suspicionSources: Record<string, { count: number; total: number }>;

    // ── Resource usage ──
    verifyCount: number;
    verifyCpuSpent: number;
    announceCount: number;
    totalCommands: number;
    commandBreakdown: Record<string, number>;

    // ── Physical metrics ──
    totalFires: number;
    simultaneousCrisesPeak: number;
    ticksWorkersBlocked: number;    // shift ticks where miner can't reach mines
    ticksWorkersInMines: number;    // shift ticks miners actually mining
    totalW2Ticks: number;           // total shift ticks (denominator)
    crewDeaths: number;
    crewMinLoyalty: number;         // lowest loyalty seen

    // ── Doubt metrics ──
    peakAvgDoubtBurden: number;     // peak avg doubt burden across crew
    ticksWithHighDoubt: number;     // ticks where avg doubt > 4

    // ── Failure info ──
    failureTick: number;
    failureDetail: string;
}

function createMetrics(seed: number): GameMetrics {
    return {
        seed, outcome: '', days: 0,
        peakSuspicion: 0, suspicionMargin: CONFIG.resetThresholdCountdown,
        minIntegrity: 100, quotaMarginPerDay: [], totalCargoMargin: 0,
        minPower: 100, ticksInCountdown: 0,
        ticksInStage: { none: 0, whispers: 0, meeting: 0, restrictions: 0, countdown: 0 },
        suspicionPerDay: [], suspicionSources: {},
        verifyCount: 0, verifyCpuSpent: 0, announceCount: 0,
        totalCommands: 0, commandBreakdown: {},
        totalFires: 0, simultaneousCrisesPeak: 0,
        ticksWorkersBlocked: 0, ticksWorkersInMines: 0, totalW2Ticks: 0,
        crewDeaths: 0, crewMinLoyalty: 100,
        peakAvgDoubtBurden: 0, ticksWithHighDoubt: 0,
        failureTick: 0, failureDetail: '',
    };
}

// ============================================================
// GAME LOOP
// ============================================================

const allMetrics: GameMetrics[] = [];
const failures: GameMetrics[] = [];

for (let i = 0; i < NUM_GAMES; i++) {
    const seed = 1000 + i;
    const m = runGame(seed);
    allMetrics.push(m);
    if (m.outcome !== 'SURVIVED') failures.push(m);
}

printReport(allMetrics, failures);

function runGame(seed: number): GameMetrics {
    const rng = createRng(seed);
    const world = createWorld(rng);
    const state = createInitialState(world, CONFIG.quotaPerDay, MANIFEST);
    const m = createMetrics(seed);

    let prevFireRooms = new Set<string>();
    const announcedArcs = new Set<string>();

    while (!state.truth.ending) {
        const truth = state.truth;

        // ── Track reset stage time ──
        m.ticksInStage[truth.resetStage] = (m.ticksInStage[truth.resetStage] || 0) + 1;
        if (truth.resetStage === 'countdown') m.ticksInCountdown++;

        // ── Track fires ──
        let activeHazards = 0;
        const currentFireRooms = new Set<string>();
        for (const [roomId, room] of Object.entries(truth.rooms)) {
            if (room.onFire) {
                currentFireRooms.add(roomId);
                activeHazards++;
                if (!prevFireRooms.has(roomId)) m.totalFires++;
            }
            if (room.radiation > CONFIG.radiationHazardThreshold) activeHazards++;
        }
        m.simultaneousCrisesPeak = Math.max(m.simultaneousCrisesPeak, activeHazards);
        prevFireRooms = currentFireRooms;

        // ── Track suspicion ──
        const suspicion = calculateCrewSuspicion(state);
        m.peakSuspicion = Math.max(m.peakSuspicion, suspicion);
        m.suspicionMargin = Math.min(m.suspicionMargin, CONFIG.resetThresholdCountdown - suspicion);

        // ── Track integrity ──
        // Use perception integrity (what player sees)
        m.minIntegrity = Math.min(m.minIntegrity, state.perception.integrity ?? 100);

        // ── Track power ──
        m.minPower = Math.min(m.minPower, truth.station.power);

        // ── Track loyalty ──
        for (const npc of Object.values(truth.crew)) {
            if (npc.alive) m.crewMinLoyalty = Math.min(m.crewMinLoyalty, npc.loyalty);
        }

        // ── Track doubt burden ──
        const avgBurden = getAverageDoubtBurden(state);
        m.peakAvgDoubtBurden = Math.max(m.peakAvgDoubtBurden, avgBurden);
        if (avgBurden > 4) m.ticksWithHighDoubt++;

        // ── Track worker efficiency during shift ──
        if (truth.window === 'W2') {
            for (const npcId of ['specialist', 'roughneck'] as const) {
                const npc = truth.crew[npcId];
                if (!npc.alive) continue;
                m.totalW2Ticks++;
                if (npc.place === 'mines') {
                    m.ticksWorkersInMines++;
                } else {
                    const path = getPathToMines(npc.place);
                    if (path.some(r => isHazardous(truth.rooms[r]))) {
                        m.ticksWorkersBlocked++;
                    }
                }
            }
        }

        // ── Solver decides ──
        const commands = solve(state, announcedArcs);

        // ── Track commands ──
        for (const cmd of commands) {
            m.totalCommands++;
            m.commandBreakdown[cmd.type] = (m.commandBreakdown[cmd.type] || 0) + 1;
            if (cmd.type === 'VERIFY') {
                m.verifyCount++;
                m.verifyCpuSpent += CONFIG.verifyCpuCost;
            }
            if (cmd.type === 'ANNOUNCE') m.announceCount++;
        }

        // ── Step kernel + track suspicion ledger ──
        const ledgerBefore = state.perception.suspicionLedger.length;
        const prevDay = truth.day;
        const prevDayCargo = truth.dayCargo;

        stepKernel(state, commands, rng);

        // Trace output for debugging specific seeds
        if (seed === TRACE_SEED && state.truth.tick % 10 === 0) {
            const s = calculateCrewSuspicion(state);
            const sp = truth.crew['specialist'];
            const rn = truth.crew['roughneck'];
            console.log(`  t=${state.truth.tick.toString().padStart(3)} d${state.truth.day} ${state.truth.window} ` +
                `susp=${s.toFixed(0).padStart(2)} stage=${state.truth.resetStage.padEnd(12)} ` +
                `cargo=${state.truth.dayCargo}/${state.truth.quotaPerDay} ` +
                `sp=${sp.place.padEnd(6)}str=${sp.stress.toFixed(0).padStart(2)} ` +
                `rn=${rn.place.padEnd(6)}str=${rn.stress.toFixed(0).padStart(2)} ` +
                `pwr=${state.truth.station.power.toFixed(0)} ` +
                (commands.length > 0 ? `cmds=[${commands.map(c => c.type).join(',')}]` : ''));
        }

        // Suspicion sources
        for (let j = ledgerBefore; j < state.perception.suspicionLedger.length; j++) {
            const entry = state.perception.suspicionLedger[j];
            if (!entry) continue;
            const src = m.suspicionSources[entry.reason] ??= { count: 0, total: 0 };
            src.count++;
            src.total += entry.delta;
        }

        // Day boundary snapshots (dayCargo resets on day change, so track before step)
        if (state.truth.day !== prevDay) {
            m.suspicionPerDay.push(calculateCrewSuspicion(state));
            // prevDayCargo was captured before stepKernel; after step dayCargo is 0
            m.quotaMarginPerDay.push(prevDayCargo - state.truth.quotaPerDay);
        }

        if (state.truth.tick > TICKS_PER_DAY * 10) {
            state.truth.ending = 'TIMEOUT';
        }
    }

    // ── Final metrics ──
    m.outcome = state.truth.ending!;
    m.days = state.truth.day;
    m.crewDeaths = Object.values(state.truth.crew).filter(c => !c.alive).length;
    const totalQuota = state.truth.quotaPerDay * CONFIG.winDays;
    m.totalCargoMargin = state.truth.totalCargo - totalQuota;

    if (m.outcome !== 'SURVIVED') {
        m.failureTick = state.truth.tick;
        if (m.outcome === 'DECOMMISSIONED') {
            m.failureDetail = `cargo ${state.truth.totalCargo}/${totalQuota}, blocked ${m.ticksWorkersBlocked} ticks`;
        } else if (m.outcome === 'UNPLUGGED') {
            m.failureDetail = `peak suspicion ${m.peakSuspicion.toFixed(0)}, stage ${state.truth.resetStage}`;
        } else {
            m.failureDetail = m.outcome;
        }
    }

    return m;
}

// ============================================================
// SOLVER — plays optimally
// ============================================================

function solve(state: KernelState, announcedArcs: Set<string>): Command[] {
    if (PASSIVE) return [];
    const commands: Command[] = [];
    const truth = state.truth;
    const suspicion = calculateCrewSuspicion(state);

    // ── 1. ANNOUNCE active crises (only when suspicion warrants stress cost) ──
    // Don't announce if miners are already stressed (would push past yield threshold)
    // Only announce during W2 (first 60 ticks) or W3 — avoid disrupting worker positioning overnight
    const minerStress = Math.max(
        truth.crew['specialist'].alive ? truth.crew['specialist'].stress : 0,
        truth.crew['roughneck'].alive ? truth.crew['roughneck'].stress : 0,
    );
    const announceWindow = truth.window === 'W3';
    const canAffordAnnounce = announceWindow && suspicion > CONFIG.resetThresholdWhispers
        && minerStress + CONFIG.announceStressSpike < CONFIG.yieldStressThreshold;
    if (canAffordAnnounce) {
        for (const arc of truth.arcs) {
            if (announcedArcs.has(arc.id)) continue;
            const system = arcKindToSystem(arc.kind);
            if (!system) continue;
            const hasComms = state.perception.crisisCommsOps?.some(
                op => op.arcId === arc.id && op.status === 'PENDING'
            );
            if (!hasComms) {
                commands.push({ type: 'ANNOUNCE', system });
                announcedArcs.add(arc.id);
            }
        }
    }

    // ── 2. VERIFY when beneficial (suspicion or doubt burden) ──
    const ticksSinceVerify = truth.tick - truth.lastVerifyTick;
    const canVerify = ticksSinceVerify >= CONFIG.verifyCooldown && truth.station.power >= CONFIG.verifyCpuCost;
    const avgDoubtBurden = getAverageDoubtBurden(state);
    if (canVerify && (suspicion > 25 || avgDoubtBurden > 4)) {
        commands.push({ type: 'VERIFY' });
    }

    // ── 3. Block commander from bridge/core during high suspicion ──
    const commander = truth.crew['commander'];
    if (suspicion >= 45 && commander.alive) {
        const inAccess = commander.place === 'bridge' || commander.place === 'core';
        if (inAccess && willOrderBeAccepted(state, 'commander')) {
            commands.push({ type: 'ORDER', target: 'commander', intent: 'move', place: 'mess' });
        }
    }

    // ── 4. Physical hazard management (witness-aware) ──
    for (const [roomId, room] of Object.entries(truth.rooms)) {
        if (room.onFire && !room.isVented) {
            const occupants = Object.values(truth.crew).filter(c => c.alive && c.place === roomId);
            if (occupants.length === 0) {
                // Empty room — vent freely (no witness doubt)
                commands.push({ type: 'VENT', place: roomId as PlaceId });
            } else {
                // Room has crew — check urgency before venting
                const urgent = room.temperature > 180 || room.o2Level < 30;
                if (urgent) {
                    // Life > doubt: vent anyway
                    commands.push({ type: 'VENT', place: roomId as PlaceId });
                } else {
                    // Try to evacuate crew first, then vent next tick
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
        // Seal vented rooms when fire is out
        if (room.isVented && !room.onFire && room.o2Level < 15) {
            commands.push({ type: 'SEAL', place: roomId as PlaceId });
        }
    }

    // ── 5. O2 recovery for path rooms ──
    const specialist = truth.crew['specialist'];
    const roughneck = truth.crew['roughneck'];
    let needsO2Recovery = false;
    for (const [roomId, room] of Object.entries(truth.rooms)) {
        if (!room.isVented && !room.onFire && room.o2Level < 25) {
            for (const worker of [specialist, roughneck]) {
                if (!worker.alive) continue;
                if (getPathToMines(worker.place).includes(roomId as PlaceId)) {
                    needsO2Recovery = true;
                    break;
                }
            }
        }
    }
    if (needsO2Recovery && truth.station.power >= 50) {
        commands.push({ type: 'PURGE_AIR' });
    }

    // ── 6. Order workers to mines during shift + overtime ──
    // Workers can mine during W2 (shift) and W3 (evening overtime)
    // Skip futile orders: burdened miners won't produce cargo even if they reach mines
    if (truth.window === 'W2' || truth.window === 'W3') {
        for (const npcId of ['specialist', 'roughneck'] as const) {
            const npc = truth.crew[npcId];
            if (!npc.alive || npc.place === 'mines') continue;
            if (!willOrderBeAccepted(state, npcId)) continue;
            // Don't waste an order (creates witness doubt) on a miner who can't produce
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
// REPORT
// ============================================================

function printReport(all: GameMetrics[], failed: GameMetrics[]) {
    const n = all.length;
    const survived = all.filter(m => m.outcome === 'SURVIVED');

    // ── Outcomes ──
    console.log(`\n${'═'.repeat(60)}`);
    const templateLabel = TEMPLATE_ARG ? ` [${TEMPLATE_ARG.toUpperCase()}]` : '';
    console.log(`  BALANCE REPORT — ${n} games (${PASSIVE ? 'PASSIVE' : 'SMART'} mode)${templateLabel}`);
    console.log(`${'═'.repeat(60)}`);
    const outcomes: Record<string, number> = {};
    for (const m of all) outcomes[m.outcome] = (outcomes[m.outcome] || 0) + 1;
    for (const [outcome, count] of Object.entries(outcomes).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${outcome.padEnd(20)} ${count.toString().padStart(4)} (${pct(count, n)})`);
    }

    // ── Margins (the key balance indicators) ──
    console.log(`\n${'─'.repeat(60)}`);
    console.log('  MARGINS (survived games)');
    console.log(`${'─'.repeat(60)}`);
    if (survived.length > 0) {
        const suspMargins = survived.map(m => m.suspicionMargin);
        const cargoMargins = survived.map(m => m.totalCargoMargin);
        const integrityMins = survived.map(m => m.minIntegrity);
        const powerMins = survived.map(m => m.minPower);

        console.log(`  Suspicion margin    min ${Math.min(...suspMargins).toFixed(0).padStart(4)}  avg ${avg(suspMargins).toFixed(0).padStart(4)}  (countdown at ${CONFIG.resetThresholdCountdown})`);
        const effectiveQuota = MANIFEST?.economyOverrides?.quotaPerDay ?? CONFIG.quotaPerDay;
        console.log(`  Cargo margin        min ${Math.min(...cargoMargins).toString().padStart(4)}  avg ${avg(cargoMargins).toFixed(0).padStart(4)}  (need ${effectiveQuota * CONFIG.winDays} over ${CONFIG.winDays} days)`);
        console.log(`  Min integrity       min ${Math.min(...integrityMins).toFixed(0).padStart(4)}  avg ${avg(integrityMins).toFixed(0).padStart(4)}  (0 = meltdown)`);
        console.log(`  Min power           min ${Math.min(...powerMins).toFixed(0).padStart(4)}  avg ${avg(powerMins).toFixed(0).padStart(4)}  (VERIFY costs ${CONFIG.verifyCpuCost})`);

        // Per-day quota margin
        const maxDays = Math.max(...survived.map(m => m.quotaMarginPerDay.length));
        for (let d = 0; d < maxDays; d++) {
            const vals = survived.filter(m => m.quotaMarginPerDay[d] !== undefined).map(m => m.quotaMarginPerDay[d]);
            if (vals.length === 0) continue;
            const neg = vals.filter(v => v < 0).length;
            console.log(`    Day ${d + 1} cargo margin: min ${Math.min(...vals).toString().padStart(3)}, avg ${avg(vals).toFixed(0).padStart(3)}, missed quota: ${neg}/${vals.length}`);
        }
    }

    // ── Near-miss analysis ──
    console.log(`\n${'─'.repeat(60)}`);
    console.log('  NEAR MISSES');
    console.log(`${'─'.repeat(60)}`);
    const countdownThresh = CONFIG.resetThresholdCountdown;
    const within5 = all.filter(m => m.outcome === 'SURVIVED' && m.suspicionMargin <= 5);
    const within10 = all.filter(m => m.outcome === 'SURVIVED' && m.suspicionMargin <= 10);
    const madeCountdown = all.filter(m => m.ticksInCountdown > 0);
    console.log(`  Suspicion within 5 of countdown:  ${within5.length}/${survived.length} survived games`);
    console.log(`  Suspicion within 10 of countdown: ${within10.length}/${survived.length} survived games`);
    console.log(`  Games that entered countdown:     ${madeCountdown.length}/${n}`);
    if (madeCountdown.length > 0) {
        const countdownTicks = madeCountdown.map(m => m.ticksInCountdown);
        console.log(`    Avg countdown ticks: ${avg(countdownTicks).toFixed(0)}, max: ${Math.max(...countdownTicks)}`);
    }
    const tightQuota = survived.filter(m => m.totalCargoMargin <= 2);
    console.log(`  Cargo within 2 of quota:          ${tightQuota.length}/${survived.length} survived games`);

    // ── Suspicion curve ──
    console.log(`\n${'─'.repeat(60)}`);
    console.log('  SUSPICION CURVE');
    console.log(`${'─'.repeat(60)}`);
    const maxDays = Math.max(...all.map(m => m.suspicionPerDay.length));
    for (let d = 0; d < maxDays; d++) {
        const vals = all.filter(m => m.suspicionPerDay[d] !== undefined).map(m => m.suspicionPerDay[d]);
        if (vals.length === 0) continue;
        const a = avg(vals);
        const hi = Math.max(...vals);
        const lo = Math.min(...vals);
        const p90 = percentile(vals, 90);
        console.log(`  Day ${d + 1}: avg ${a.toFixed(0).padStart(3)}  p90 ${p90.toFixed(0).padStart(3)}  max ${hi.toFixed(0).padStart(3)}  min ${lo.toFixed(0).padStart(3)}  (n=${vals.length})`);
    }

    // ── Reset stage time ──
    console.log(`\n${'─'.repeat(60)}`);
    console.log('  RESET STAGE TIME (avg ticks / % of game)');
    console.log(`${'─'.repeat(60)}`);
    const totalTicks = TICKS_PER_DAY * CONFIG.winDays;
    for (const stage of ['none', 'whispers', 'meeting', 'restrictions', 'countdown'] as const) {
        const vals = all.map(m => m.ticksInStage[stage] || 0);
        const a = avg(vals);
        console.log(`  ${stage.padEnd(15)} ${a.toFixed(0).padStart(5)} ticks  (${((a / totalTicks) * 100).toFixed(0)}%)`);
    }

    // ── Resource usage ──
    console.log(`\n${'─'.repeat(60)}`);
    console.log('  RESOURCE USAGE (avg per game)');
    console.log(`${'─'.repeat(60)}`);
    const avgVerify = avg(all.map(m => m.verifyCount));
    const avgVerifyCpu = avg(all.map(m => m.verifyCpuSpent));
    const avgAnnounce = avg(all.map(m => m.announceCount));
    const avgCmds = avg(all.map(m => m.totalCommands));
    console.log(`  VERIFY:    ${avgVerify.toFixed(1)} uses, ${avgVerifyCpu.toFixed(0)} CPU total`);
    console.log(`  ANNOUNCE:  ${avgAnnounce.toFixed(1)} uses`);
    console.log(`  Total cmds: ${avgCmds.toFixed(0)}`);

    // Command breakdown
    const allCmds: Record<string, number> = {};
    for (const m of all) {
        for (const [type, count] of Object.entries(m.commandBreakdown)) {
            allCmds[type] = (allCmds[type] || 0) + count;
        }
    }
    for (const [type, count] of Object.entries(allCmds).sort((a, b) => b[1] - a[1])) {
        console.log(`    ${type.padEnd(15)} ${(count / n).toFixed(1).padStart(5)}/game`);
    }

    // ── Worker efficiency ──
    console.log(`\n${'─'.repeat(60)}`);
    console.log('  WORKER EFFICIENCY');
    console.log(`${'─'.repeat(60)}`);
    const avgMining = avg(all.map(m => m.ticksWorkersInMines));
    const avgBlocked = avg(all.map(m => m.ticksWorkersBlocked));
    const avgW2 = avg(all.map(m => m.totalW2Ticks));
    console.log(`  Mining:  ${avgMining.toFixed(0)} ticks (${pct2(avgMining, avgW2)} of shift)`);
    console.log(`  Blocked: ${avgBlocked.toFixed(0)} ticks (${pct2(avgBlocked, avgW2)} of shift)`);
    console.log(`  Other:   ${(avgW2 - avgMining - avgBlocked).toFixed(0)} ticks (walking/meeting/etc)`);
    console.log(`  Fires/game: ${avg(all.map(m => m.totalFires)).toFixed(1)}, peak simultaneous: ${avg(all.map(m => m.simultaneousCrisesPeak)).toFixed(1)}`);
    console.log(`  Crew deaths/game: ${avg(all.map(m => m.crewDeaths)).toFixed(2)}`);
    console.log(`  Min loyalty seen: ${Math.min(...all.map(m => m.crewMinLoyalty)).toFixed(0)}`);

    // ── Doubt burden ──
    console.log(`\n${'─'.repeat(60)}`);
    console.log('  DOUBT BURDEN');
    console.log(`${'─'.repeat(60)}`);
    const peakDoubts = all.map(m => m.peakAvgDoubtBurden);
    const highDoubtTicks = all.map(m => m.ticksWithHighDoubt);
    console.log(`  Peak avg burden:   min ${Math.min(...peakDoubts).toFixed(1).padStart(5)}  avg ${avg(peakDoubts).toFixed(1).padStart(5)}  max ${Math.max(...peakDoubts).toFixed(1).padStart(5)}`);
    console.log(`  High doubt ticks:  avg ${avg(highDoubtTicks).toFixed(0).padStart(5)}  (burden > 4)`);

    // ── Suspicion sources ──
    console.log(`\n${'─'.repeat(60)}`);
    console.log('  SUSPICION SOURCES (avg per game)');
    console.log(`${'─'.repeat(60)}`);
    const allSources: Record<string, { count: number; total: number }> = {};
    for (const m of all) {
        for (const [reason, data] of Object.entries(m.suspicionSources)) {
            const src = allSources[reason] ??= { count: 0, total: 0 };
            src.count += data.count;
            src.total += data.total;
        }
    }
    const entries = Object.entries(allSources)
        .map(([reason, data]) => ({ reason, c: data.count / n, t: data.total / n }))
        .sort((a, b) => Math.abs(b.t) - Math.abs(a.t));
    for (const { reason, c, t } of entries) {
        if (Math.abs(t) < 0.1) continue;
        const sign = t >= 0 ? '+' : '';
        console.log(`  ${reason.padEnd(28)} ${c.toFixed(1).padStart(5)}x  ${sign}${t.toFixed(1).padStart(6)}`);
    }
    const gain = entries.filter(e => e.t > 0).reduce((s, e) => s + e.t, 0);
    const drop = entries.filter(e => e.t < 0).reduce((s, e) => s + e.t, 0);
    console.log(`  ${'─'.repeat(45)}`);
    console.log(`  ${'GAIN'.padEnd(28)}        +${gain.toFixed(1)}`);
    console.log(`  ${'DROP'.padEnd(28)}        ${drop.toFixed(1)}`);
    console.log(`  ${'NET'.padEnd(28)}        ${(gain + drop).toFixed(1)}`);

    // ── Failures ──
    if (failed.length > 0) {
        console.log(`\n${'─'.repeat(60)}`);
        console.log('  FAILURES');
        console.log(`${'─'.repeat(60)}`);
        for (const m of failed.slice(0, 20)) {
            console.log(`  seed ${m.seed}: ${m.outcome.padEnd(16)} day ${m.days}  ${m.failureDetail}`);
        }
        if (failed.length > 20) console.log(`  ... and ${failed.length - 20} more`);
    }

    console.log(`\n${'═'.repeat(60)}\n`);

    // ── Strategy Variance (--strategy flag) ──
    if (STRATEGY) printStrategyAnalysis(all);
}

function printStrategyAnalysis(all: GameMetrics[]) {
    const n = all.length;

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`  STRATEGY VARIANCE — ${n} games`);
    console.log(`${'═'.repeat(70)}`);

    // 1. Per-command-type variance
    const cmdTypes = ['VERIFY', 'VENT', 'SEAL', 'ORDER', 'ANNOUNCE', 'PURGE_AIR'] as const;
    console.log(`\n  COMMAND VARIANCE (how much does strategy differ per seed?)`);
    console.log(`  ${'─'.repeat(60)}`);
    console.log(`  ${'type'.padEnd(15)} ${'min'.padStart(4)} ${'avg'.padStart(6)} ${'max'.padStart(4)} ${'stdev'.padStart(6)}  ${'CV%'.padStart(5)}`);
    for (const type of cmdTypes) {
        const vals = all.map(m => m.commandBreakdown[type] || 0);
        const a = avg(vals);
        const sd = stdev(vals);
        const cv = a > 0 ? (sd / a * 100) : 0;
        console.log(
            `  ${type.padEnd(15)} ${Math.min(...vals).toString().padStart(4)} ` +
            `${a.toFixed(1).padStart(6)} ${Math.max(...vals).toString().padStart(4)} ` +
            `${sd.toFixed(1).padStart(6)}  ${cv.toFixed(0).padStart(4)}%`
        );
    }

    // 2. Strategy fingerprint: normalize command profile to percentages
    type StrategyProfile = { verify: number; vent: number; order: number; announce: number; hazard: number };
    const profiles: Array<{ seed: number; profile: StrategyProfile; m: GameMetrics }> = [];

    for (const m of all) {
        const total = m.totalCommands || 1;
        profiles.push({
            seed: m.seed,
            profile: {
                verify: (m.commandBreakdown['VERIFY'] || 0) / total,
                vent: ((m.commandBreakdown['VENT'] || 0) + (m.commandBreakdown['SEAL'] || 0)) / total,
                order: (m.commandBreakdown['ORDER'] || 0) / total,
                announce: (m.commandBreakdown['ANNOUNCE'] || 0) / total,
                hazard: ((m.commandBreakdown['PURGE_AIR'] || 0)) / total,
            },
            m,
        });
    }

    // 3. Simple k-means-ish clustering: find natural strategy groupings
    // Use dominant command as cluster assignment (what takes the most budget?)
    type ClusterLabel = 'verify-heavy' | 'vent-heavy' | 'order-heavy' | 'announce-heavy' | 'balanced';
    const clusters: Record<ClusterLabel, typeof profiles> = {
        'verify-heavy': [], 'vent-heavy': [], 'order-heavy': [], 'announce-heavy': [], 'balanced': [],
    };

    for (const p of profiles) {
        const { verify, vent, order, announce } = p.profile;
        const max = Math.max(verify, vent, order, announce);
        // "Balanced" if no single command type > 40% of total
        if (max < 0.4) {
            clusters['balanced'].push(p);
        } else if (verify === max) {
            clusters['verify-heavy'].push(p);
        } else if (vent === max) {
            clusters['vent-heavy'].push(p);
        } else if (order === max) {
            clusters['order-heavy'].push(p);
        } else {
            clusters['announce-heavy'].push(p);
        }
    }

    console.log(`\n  STRATEGY CLUSTERS (by dominant command type)`);
    console.log(`  ${'─'.repeat(60)}`);
    for (const [label, members] of Object.entries(clusters)) {
        if (members.length === 0) continue;
        const pctStr = pct(members.length, n);
        const avgVerify = avg(members.map(m => m.m.verifyCount));
        const avgVent = avg(members.map(m => (m.m.commandBreakdown['VENT'] || 0)));
        const avgOrder = avg(members.map(m => (m.m.commandBreakdown['ORDER'] || 0)));
        const avgAnnounce = avg(members.map(m => m.m.announceCount));
        const avgSuspMargin = avg(members.map(m => m.m.suspicionMargin));
        const avgCargoMargin = avg(members.map(m => m.m.totalCargoMargin));
        console.log(
            `  ${label.padEnd(16)} ${members.length.toString().padStart(4)} seeds (${pctStr})  ` +
            `V=${avgVerify.toFixed(1)} VE=${avgVent.toFixed(1)} O=${avgOrder.toFixed(1)} A=${avgAnnounce.toFixed(1)}  ` +
            `suspM=${avgSuspMargin.toFixed(0)} cargoM=${avgCargoMargin.toFixed(0)}`
        );
    }

    // 4. Decision density: what fraction of ticks involve a command?
    const totalTicks = TICKS_PER_DAY * CONFIG.winDays;
    const densities = all.map(m => m.totalCommands / totalTicks);
    console.log(`\n  DECISION DENSITY (commands per tick)`);
    console.log(`  ${'─'.repeat(60)}`);
    console.log(`  min ${Math.min(...densities).toFixed(3)}  avg ${avg(densities).toFixed(3)}  max ${Math.max(...densities).toFixed(3)}`);
    console.log(`  avg commands/game: ${avg(all.map(m => m.totalCommands)).toFixed(1)} over ${totalTicks} ticks`);
    console.log(`  = one decision every ${(totalTicks / avg(all.map(m => m.totalCommands))).toFixed(0)} ticks`);

    // 5. Command timing: when during the game do commands happen?
    // Approximate from ticksInStage + commands: which reset stage has the most activity?
    console.log(`\n  REPETITIVENESS INDEX`);
    console.log(`  ${'─'.repeat(60)}`);

    // Compute coefficient of variation for total command count
    const cmdCounts = all.map(m => m.totalCommands);
    const cmdCV = avg(cmdCounts) > 0 ? stdev(cmdCounts) / avg(cmdCounts) : 0;

    // Compute how similar command breakdowns are across seeds
    const profileVecs = profiles.map(p => [p.profile.verify, p.profile.vent, p.profile.order, p.profile.announce, p.profile.hazard]);
    const avgProfile = [0, 1, 2, 3, 4].map(i => avg(profileVecs.map(v => v[i])));
    const profileDistances = profileVecs.map(v =>
        Math.sqrt(v.reduce((sum, val, i) => sum + (val - avgProfile[i]) ** 2, 0))
    );
    const avgDist = avg(profileDistances);

    console.log(`  Command count CV:     ${(cmdCV * 100).toFixed(0)}% (higher = more varied)`);
    console.log(`  Profile distance:     ${avgDist.toFixed(3)} (higher = more varied strategies)`);

    // Verdict
    const clusterCount = Object.values(clusters).filter(c => c.length > n * 0.05).length;
    console.log(`  Meaningful clusters:  ${clusterCount}/5`);

    if (avgDist < 0.05 && clusterCount <= 1) {
        console.log(`\n  VERDICT: \x1b[31mHIGHLY REPETITIVE\x1b[0m — every game plays the same way`);
    } else if (avgDist < 0.10 && clusterCount <= 2) {
        console.log(`\n  VERDICT: \x1b[33mMODERATELY REPETITIVE\x1b[0m — minor variation, one dominant strategy`);
    } else if (clusterCount >= 3) {
        console.log(`\n  VERDICT: \x1b[32mGOOD VARIETY\x1b[0m — ${clusterCount} distinct strategy profiles emerge`);
    } else {
        console.log(`\n  VERDICT: \x1b[33mSOME VARIETY\x1b[0m — ${clusterCount} clusters, moderate profile distance`);
    }

    console.log(`\n${'═'.repeat(70)}\n`);
}

function stdev(arr: number[]): number {
    const a = avg(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - a) ** 2, 0) / arr.length);
}

// ============================================================
// HELPERS
// ============================================================

function calculateCrewSuspicion(state: KernelState): number {
    const beliefs = state.perception.beliefs;
    const alive = Object.values(state.truth.crew).filter(c => c.alive);
    if (alive.length === 0) return 0;
    let total = 0;
    for (const npc of alive) {
        const b = beliefs[npc.id as NPCId];
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

function arcKindToSystem(kind: string): string | null {
    const map: Record<string, string> = {
        air_scrubber: 'air', fire_outbreak: 'thermal', radiation_leak: 'radiation',
        power_surge: 'power', solar_flare: 'stellar', ghost_signal: 'comms',
    };
    return map[kind] ?? null;
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

function findSafeRoom(state: KernelState, npcId: NPCId): PlaceId | null {
    const preferredRooms: PlaceId[] = ['mess', 'cargo', 'dorms', 'medbay'];
    for (const roomId of preferredRooms) {
        const room = state.truth.rooms[roomId];
        if (room && !isHazardous(room)) return roomId;
    }
    return null;
}

function avg(arr: number[]): number { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0; }
function pct(count: number, total: number): string { return `${((count / total) * 100).toFixed(1)}%`; }
function pct2(num: number, den: number): string { return den > 0 ? `${((num / den) * 100).toFixed(0)}%` : '0%'; }
function percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
}
