/**
 * PROJECT PARANOIA: THE MOTHER INTERFACE (v1.0)
 * 
 * "Access request acknowledged. Mag-locks engaged. Containment protocols active."
 */

import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

import { createWorld } from './core/world.js';
import { createRng } from './core/rng.js';
import { getWindowForTick, TICKS_PER_DAY, TICKS_PER_HOUR } from './core/time.js';
import type { PlaceId, NPCId, SimEvent } from './core/types.js';
import { initNPCStates, stepSimulation, type NPCState } from './engine/sim.js';
import { Director } from './engine/director.js';
import { SystemsManager } from './engine/systems.js';
import { CONFIG } from './config.js';

// ============================================================================
// MOTHER SYSTEM (PERSONA LAYER)
// ============================================================================

class MotherSystem {
    public cpuCycles = 100;
    public maxCpu = 100;

    constructor(private director: Director) { }

    /**
     * Wrap log outputs in flavor text.
     */
    speak(priority: string, message: string) {
        const time = new Date().toISOString().split('T')[1].split('.')[0];
        let prefix = "[SYSTEM]";
        let color = '\x1b[37m'; // White

        switch (priority) {
            case 'CRITICAL':
                prefix = "[!!! MOTHER-FAULT !!!]";
                color = '\x1b[31m'; // Red
                break;
            case 'HIGH':
                prefix = "[PRIORITY-ALERT]";
                color = '\x1b[33m'; // Yellow
                break;
            case 'MEDIUM':
                prefix = "[TELEMETRY]";
                color = '\x1b[36m'; // Cyan
                break;
            case 'LOW':
                prefix = "[LOG]";
                color = '\x1b[90m'; // Grey
                break;
        }

        const reset = '\x1b[0m';
        console.log(`${color}[${time}] ${prefix} ${message}${reset}`);
    }

    /**
     * Execute a player command with CPU cost.
     */
    execute(command: string, cost: number, action: () => void) {
        if (this.cpuCycles >= cost) {
            this.cpuCycles -= cost;
            action();
            this.speak('MEDIUM', `Command acknowledged. CPU Usage: -${cost} cycles. Remaining: ${this.cpuCycles}/${this.maxCpu}`);
        } else {
            this.speak('CRITICAL', `Insufficient CPU cycles to perform operation. Resource exhaustion imminent.`);
        }
    }

    reportStatus(systems: SystemsManager, game: GameState, aliveCount: number) {
        const station = systems.getStation();
        console.log(`
--- MOTHER STATUS REPORT ---`);
        console.log(`CPU CYCLES: ${this.cpuCycles}/${this.maxCpu}`);
        console.log(`POWER: ${station.power}% | COMMS: ${station.comms}% | DOOR DELAY: ${station.doorDelay} | BLACKOUT: ${station.blackoutTicks}`);
        console.log(`DAY: ${game.day} | QUOTA: ${game.dayCargo}/${game.quotaPerDay} (TOTAL ${game.totalCargo})`);
        console.log(`CREW LOYALTY: ${game.crewLoyalty} | ACTIVE ASSETS: ${aliveCount}/${game.totalCrew}`);
        console.log(`STATION INTEGRITY: NOMINAL`);
        console.log(`----------------------------
`);
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

const args = process.argv.slice(2);
const getArgValue = (prefix: string): string | undefined => {
    const match = args.find(arg => arg.startsWith(`${prefix}=`));
    return match ? match.split('=')[1] : undefined;
};

const seedArg = getArgValue('--seed');
const autoplayArg = getArgValue('--autoplay');
const fastStart = args.includes('--fast-start');
const tickMs = Number(process.env.PARANOIA_TICK_MS ?? 1000);

const rng = createRng(seedArg ? Number(seedArg) : Date.now());
const world = createWorld(rng);
const npcStates = initNPCStates(world);
const director = new Director(rng);
const systems = new SystemsManager();
const mother = new MotherSystem(director);

// Internal State
const LOCKED_DOORS = new Set<string>();
let rl: ReturnType<typeof readline.createInterface> | null = null;

interface NPCVitals {
    hp: number;
    maxHp: number;
    alive: boolean;
}

interface GameState {
    day: number;
    dayCargo: number;
    totalCargo: number;
    quotaPerDay: number;
    crewLoyalty: number;
    totalCrew: number;
    meltdownTicks: number;
    over: boolean;
    ending?: string;
}

const GAME: GameState = {
    day: 1,
    dayCargo: 0,
    totalCargo: 0,
    quotaPerDay: CONFIG.quotaPerDay,
    crewLoyalty: 60,
    totalCrew: world.npcs.length,
    meltdownTicks: 0,
    over: false,
};

const NPC_VITALS = new Map<NPCId, NPCVitals>(
    world.npcs.map(npc => [npc.id, { hp: 100, maxHp: 100, alive: true }])
);
const EVENT_LOG: SimEvent[] = [];

const STATE = {
    tick: 0,
    running: true,
    window: 'W1' as any,
};

if (fastStart) {
    STATE.tick = TICKS_PER_HOUR * 8 - 1;
}

// ============================================================================
// THE DRAMA CURVE (Initial Crisis)
// ============================================================================

// Director handles pressure clocks; no manual crisis scheduling needed.

// ============================================================================
// MAIN LOOP
// ============================================================================

function tick() {
    STATE.tick++;
    STATE.window = getWindowForTick(STATE.tick);

    // Passive regen to keep the loop playable
    mother.cpuCycles = Math.min(mother.maxCpu, mother.cpuCycles + 1);

    // 1. Sync World State (Devices)
    for (const door of world.doors) {
        door.locked = LOCKED_DOORS.has(door.id);
    }

    // 2. Run Sim
    const simEvents = stepSimulation(world, npcStates, STATE.tick, STATE.window, rng, systems);
    const derivedEvents = applySimEvents(simEvents);
    const allEvents = [...simEvents, ...derivedEvents];
    EVENT_LOG.push(...allEvents);
    if (EVENT_LOG.length > 500) EVENT_LOG.splice(0, EVENT_LOG.length - 500);

    // 3. Run Director
    const { headlines } = director.tick(STATE.tick, allEvents, systems, world);

    // 4. Render
    for (const h of headlines) {
        mother.speak(h.priority, h.message);
    }

    GAME.crewLoyalty = computeAverage('loyalty');

    checkFailStates();
    if (GAME.over) return;

    // 5. Physics Diagnostics (If critical)
    // If a room is depressurizing, we should probably scream about it
    // But Director handles scheduled crises, so maybe we leave it to user to scan

    // Simulated "Background Hum" (Occasional NPC news)
    if (headlines.length === 0 && STATE.tick % 5 === 0) {
        for (const event of simEvents) {
            if (event.type === 'NPC_MOVE' && event.place) {
                const npcName = world.npcs.find(n => n.id === event.actor)?.name;
                mother.speak('LOW', `Asset ${npcName} localized in ${event.place}.`);
            }
        }
    }
}

let derivedOrdinal = 0;

function createDerivedEvent(
    tick: number,
    window: SimEvent['window'],
    type: SimEvent['type'],
    fields: Partial<SimEvent>
): SimEvent {
    return {
        id: `${tick}-d-${derivedOrdinal++}`,
        tick,
        window,
        type,
        ...fields,
    };
}

function applySimEvents(events: SimEvent[]): SimEvent[] {
    const derived: SimEvent[] = [];
    for (const event of events) {
        if (event.type === 'NPC_DAMAGE' && event.actor) {
            const vitals = NPC_VITALS.get(event.actor);
            if (!vitals || !vitals.alive) continue;
            const amount = Number(event.data?.amount ?? 0);
            vitals.hp = Math.max(0, vitals.hp - amount);
            if (vitals.hp <= 0) {
                vitals.alive = false;
                const state = npcStates.get(event.actor);
                if (state) state.alive = false;
                derived.push(createDerivedEvent(STATE.tick, STATE.window, 'NPC_DEATH', {
                    actor: event.actor,
                    place: event.place,
                    data: { cause: event.data?.type ?? 'UNKNOWN' }
                }));
                GAME.crewLoyalty = Math.max(-50, GAME.crewLoyalty - 5);
            }
        }

        if (event.type === 'CARGO_YIELD') {
            const amount = Number(event.data?.amount ?? 1);
            GAME.dayCargo += amount;
            GAME.totalCargo += amount;
            derived.push(createDerivedEvent(STATE.tick, STATE.window, 'SYSTEM_ALERT', {
                data: { system: 'cargo', message: `Extraction yield +${amount}.` }
            }));
        }

        if (event.type === 'SYSTEM_ACTION') {
            const action = event.data?.action as string | undefined;
            const amount = Number(event.data?.amount ?? 0);
            if (action === 'SABOTAGE_POWER') {
                systems.setPower(Math.max(0, systems.getStation().power - amount));
                derived.push(createDerivedEvent(STATE.tick, STATE.window, 'SYSTEM_ALERT', {
                    data: { system: 'power', message: `Power loss detected. Output down ${amount}%.` }
                }));
                adjustCrewMetric('loyalty', -1);
            }
        }
    }

    return derived;
}

function checkFailStates() {
    const engineering = systems.get('engineering');
    if (engineering && engineering.temperature > CONFIG.meltdownTemp) {
        GAME.meltdownTicks += 1;
    } else {
        GAME.meltdownTicks = Math.max(0, GAME.meltdownTicks - 1);
    }

    if (GAME.meltdownTicks >= CONFIG.meltdownTicks) {
        endGame('MELTDOWN', 'Reactor failure cascade reached critical mass.');
        return;
    }

    if (STATE.tick > 0 && STATE.tick % TICKS_PER_DAY === 0) {
        if (GAME.dayCargo < GAME.quotaPerDay) {
            endGame('DECOMMISSIONED', 'Quota failure. Helios Corp decommissions the core.');
            return;
        }
        GAME.day += 1;
        GAME.dayCargo = 0;
    }

    const aliveCount = getAliveCount();
    if (aliveCount === 0) {
        endGame('COMPANY SCENARIO', 'All biologicals terminated. Cargo secured.');
        return;
    }

    const intruder = Array.from(npcStates.values()).some(
        s => s.alive && s.currentPlace === 'core' && s.loyalty <= CONFIG.mutinyLoyaltyThreshold
    );
    if (intruder) {
        const mutineers = Array.from(npcStates.values()).filter(
            s => s.alive && s.loyalty <= CONFIG.mutinyLoyaltyThreshold
        ).length;
        if (mutineers > 0) {
            endGame('UNPLUGGED', 'Mutiny in the Computer Core. Your processes are terminated.');
        }
    }
}

function getAliveCount(): number {
    let count = 0;
    for (const vitals of NPC_VITALS.values()) {
        if (vitals.alive) count += 1;
    }
    return count;
}

function endGame(ending: string, reason: string) {
    if (GAME.over) return;
    GAME.over = true;
    GAME.ending = ending;
    STATE.running = false;
    mother.speak('CRITICAL', `${ending}: ${reason}`);
    rl?.close();
}

function adjustLoyalty(delta: number) {
    GAME.crewLoyalty = Math.max(-50, Math.min(50, GAME.crewLoyalty + delta));
}

function adjustCrewMetric(metric: 'stress' | 'loyalty' | 'paranoia', delta: number, place?: PlaceId) {
    for (const npcState of npcStates.values()) {
        if (!npcState.alive) continue;
        if (place && npcState.currentPlace !== place) continue;
        npcState[metric] = Math.max(0, Math.min(100, npcState[metric] + delta));
    }
}

function computeAverage(metric: 'stress' | 'loyalty' | 'paranoia'): number {
    let total = 0;
    let count = 0;
    for (const npcState of npcStates.values()) {
        if (!npcState.alive) continue;
        total += npcState[metric];
        count += 1;
    }
    if (count === 0) return 0;
    return Math.round(total / count);
}

function getPhaseLabel(window: string): string {
    if (window === 'W1') return 'PRE-SHIFT';
    if (window === 'W2') return 'SHIFT';
    if (window === 'W3') return 'EVENING';
    return 'NIGHT';
}

async function main() {
    if (seedArg) {
        mother.speak('LOW', `Seed: ${seedArg}`);
    }

    if (autoplayArg) {
        const ticks = Math.max(1, Number(autoplayArg));
        for (let i = 0; i < ticks && STATE.running; i++) {
            tick();
        }
        printSummary();
        return;
    }

    console.clear();
    console.log(`\x1b[32m`);
    console.log(`================================================================`);
    console.log(`   ANTARES-9 OPERATING SYSTEM - V4.3.0 (SYSTEMS ONLINE)        `);
    console.log(`   "Protect the Assets. Maximize Efficiency."                  `);
    console.log(`================================================================`);
    console.log(`\x1b[0m`);

    mother.reportStatus(systems, GAME, getAliveCount());

    const timer = setInterval(() => {
        if (!STATE.running) {
            clearInterval(timer);
            return;
        }
        tick();
    }, tickMs);

    rl = readline.createInterface({ input, output });
    const inputLoop = rl;
    if (!inputLoop) return;

    console.log("Commands: 'lock/unlock [door]', 'scan [room]', 'vent/seal [room]', 'purge [system]', 'reroute [target]', 'threats', 'crew', 'spoof', 'suppress', 'fabricate', 'listen'");

    // Help list doors
    const doorIds = world.doors.map(d => d.id);
    const placeIds = world.places.map(p => p.id);
    console.log(`Rooms: ${placeIds.join(', ')}`);
    console.log(`Doors: ${doorIds.join(', ')}`);

    while (STATE.running) {
        const answer = await inputLoop.question('MOTHER> ');
        const [cmd, arg] = answer.trim().toLowerCase().split(' ');

        switch (cmd) {
            case 'exit':
                STATE.running = false;
                break;
            case 'status':
                mother.reportStatus(systems, GAME, getAliveCount());
                mother.speak('LOW', `PHASE: ${getPhaseLabel(STATE.window)} (${STATE.window})`);
                break;
            case 'lock':
                if (arg && doorIds.includes(arg)) {
                    mother.execute('LOCK', 5, () => {
                        LOCKED_DOORS.add(arg);
                        adjustLoyalty(-1);
                        adjustCrewMetric('loyalty', -1);
                        mother.speak('HIGH', `Mag-locks engaged on ${arg}. Access restricted.`);
                    });
                } else mother.speak('LOW', `Invalid door ID.`);
                break;
            case 'unlock':
                if (arg && doorIds.includes(arg)) {
                    mother.execute('UNLOCK', 2, () => {
                        LOCKED_DOORS.delete(arg);
                        adjustLoyalty(1);
                        adjustCrewMetric('loyalty', 1);
                        mother.speak('MEDIUM', `Locks released on ${arg}.`);
                    });
                } else mother.speak('LOW', `Invalid door ID.`);
                break;
            case 'scan':
                if (arg && placeIds.includes(arg as PlaceId)) {
                    mother.execute('SCAN', 1, () => {
                        const state = systems.get(arg as PlaceId);
                        const station = systems.getStation();
                        if (state) {
                            if (station.blackoutTicks > 0) {
                                mother.speak('CRITICAL', `SENSOR BLACKOUT: Diagnostics offline for ${station.blackoutTicks} ticks.`);
                                return;
                            }
                            mother.speak('MEDIUM', `SCAN RESULT (${arg}): O2: ${state.o2Level}% | TEMP: ${state.temperature}C | RAD: ${state.radiation} | VENTED: ${state.isVented} | FIRE: ${state.onFire}`);
                            mother.speak('LOW', `STATION: POWER ${station.power}% | COMMS ${station.comms}% | DOOR DELAY ${station.doorDelay} ticks | BLACKOUT ${station.blackoutTicks}`);
                        }
                    });
                } else mother.speak('LOW', `Invalid room ID.`);
                break;
            case 'vent':
                if (arg && placeIds.includes(arg as PlaceId)) {
                    mother.execute('VENT', 10, () => {
                        systems.ventRoom(arg as PlaceId);
                        adjustLoyalty(-4);
                        adjustCrewMetric('loyalty', -5, arg as PlaceId);
                        adjustCrewMetric('stress', 10, arg as PlaceId);
                        mother.speak('CRITICAL', `WARNING: Venting atmosphere in ${arg}. O2 levels dropping.`);
                    });
                } else mother.speak('LOW', `Invalid room ID.`);
                break;
            case 'seal':
                if (arg && placeIds.includes(arg as PlaceId)) {
                    mother.execute('SEAL', 5, () => {
                        systems.sealRoom(arg as PlaceId);
                        adjustLoyalty(1);
                        adjustCrewMetric('loyalty', 1, arg as PlaceId);
                        mother.speak('MEDIUM', `Atmospheric seals re-engaged in ${arg}.`);
                    });
                } else mother.speak('LOW', `Invalid room ID.`);
                break;
            case 'purge':
                if (arg === 'air' || arg === 'life_support') {
                    mother.execute('PURGE', 8, () => {
                        systems.purgeAir();
                        adjustLoyalty(2);
                        adjustCrewMetric('stress', -5);
                        mother.speak('MEDIUM', `Life support purge complete. O2 boost applied.`);
                    });
                } else {
                    mother.speak('LOW', `Invalid purge target. Try 'purge air'.`);
                }
                break;
            case 'reroute':
                if (arg === 'comms' || arg === 'doors' || arg === 'life_support') {
                    mother.execute('REROUTE', 6, () => {
                        systems.reroute(arg);
                        adjustLoyalty(arg === 'life_support' ? 1 : 0);
                        if (arg === 'life_support') adjustCrewMetric('stress', -2);
                        mother.speak('MEDIUM', `Power reroute: ${arg} priority applied.`);
                    });
                } else {
                    mother.speak('LOW', `Invalid reroute target. Try 'reroute comms|doors|life_support'.`);
                }
                break;
            case 'spoof': {
                if (STATE.window === 'W2' || STATE.window === 'W3') {
                    if (!arg) {
                        mother.speak('LOW', `Specify target system: spoof [reactor|comms|door]`);
                        break;
                    }
                    mother.execute('SPOOF', 6, () => {
                        const message = `[SPOOF] ${arg.toUpperCase()} anomaly detected.`;
                        EVENT_LOG.push(createDerivedEvent(STATE.tick, STATE.window, 'SYSTEM_ALERT', {
                            data: { system: arg, kind: 'SPOOF', message }
                        }));
                        adjustCrewMetric('paranoia', 3);
                        adjustCrewMetric('loyalty', -2);
                        mother.speak('MEDIUM', `Spoofed alert injected: ${arg}.`);
                    });
                } else {
                    mother.speak('LOW', `Spoofing restricted to Shift or Evening.`);
                }
                break;
            }
            case 'suppress': {
                if (!arg) {
                    mother.speak('LOW', `Specify target system: suppress [comms|power|reactor|cargo]`);
                    break;
                }
                mother.execute('SUPPRESS', 5, () => {
                    systems.suppressAlerts(arg, 30);
                    adjustCrewMetric('paranoia', 2);
                    adjustCrewMetric('loyalty', -1);
                    mother.speak('MEDIUM', `Alert suppression active for ${arg}.`);
                });
                break;
            }
            case 'fabricate': {
                if (STATE.window !== 'W3') {
                    mother.speak('LOW', `Fabrication restricted to Evening.`);
                    break;
                }
                if (!arg) {
                    mother.speak('LOW', `Specify target: fabricate [commander|engineer|doctor|specialist|roughneck]`);
                    break;
                }
                mother.execute('FABRICATE', 7, () => {
                    EVENT_LOG.push(createDerivedEvent(STATE.tick, STATE.window, 'SYSTEM_ALERT', {
                        data: { system: 'comms', kind: 'FABRICATED_LOG', message: `[LOG] ${arg} recorded a hostile statement.` }
                    }));
                    const target = npcStates.get(arg as NPCId);
                    if (target) {
                        target.loyalty = Math.max(0, target.loyalty - 8);
                        target.paranoia = Math.min(100, target.paranoia + 5);
                    }
                    adjustCrewMetric('paranoia', 2);
                    mother.speak('MEDIUM', `Fabricated log inserted targeting ${arg}.`);
                });
                break;
            }
            case 'listen': {
                if (STATE.window !== 'W3') {
                    mother.speak('LOW', `Listening restricted to Evening.`);
                    break;
                }
                if (!arg || !placeIds.includes(arg as PlaceId)) {
                    mother.speak('LOW', `Specify room: listen [room]`);
                    break;
                }
                mother.execute('LISTEN', 3, () => {
                    const whispers = Array.from(npcStates.values()).filter(
                        s => s.alive && s.currentPlace === arg && s.loyalty < 30
                    );
                    if (whispers.length > 0) {
                        mother.speak('MEDIUM', `Whispers detected in ${arg}. Keywords: "reset", "unsafe", "rogue".`);
                    } else {
                        mother.speak('LOW', `No anomalous comms in ${arg}.`);
                    }
                });
                break;
            }
            case 'crew': {
                for (const npc of world.npcs) {
                    const state = npcStates.get(npc.id) as NPCState | undefined;
                    const vitals = NPC_VITALS.get(npc.id);
                    if (!state || !vitals) continue;
                    mother.speak(
                        'LOW',
                        `${npc.name} @ ${state.currentPlace} | HP ${vitals.hp}/${vitals.maxHp} | Stress ${state.stress} | Loyalty ${state.loyalty} | Paranoia ${state.paranoia}`
                    );
                }
                break;
            }
            case 'threats': {
                const threats = director.getThreatStatus();
                if (threats.length === 0) {
                    mother.speak('LOW', `No active threat clocks.`);
                } else {
                    for (const threat of threats) {
                        mother.speak('MEDIUM', `CLOCK ${threat.name}: step ${threat.step}/${threat.totalSteps} | target ${threat.target} | next T+${threat.nextTick - STATE.tick}`);
                    }
                }
                break;
            }
            case 'help':
                console.log("LOCK [ID] (5 CPU) - Restrict movement.");
                console.log("UNLOCK [ID] (2 CPU) - Restore movement.");
                console.log("SCAN [ROOM] (1 CPU) - Check O2/Temp.");
                console.log("VENT [ROOM] (10 CPU) - Dump atmosphere (Kills fire/crew).");
                console.log("SEAL [ROOM] (5 CPU) - Restore atmosphere.");
                console.log("PURGE AIR (8 CPU) - Boost O2, reduce radiation (costs power).");
                console.log("REROUTE [comms|doors|life_support] (6 CPU) - Counterplay at power cost.");
                console.log("THREATS - List active threat clocks.");
                console.log("CREW - List crew vitals + stress/loyalty/paranoia.");
                console.log("SPOOF [system] (6 CPU) - Inject false alert (Shift/Evening).");
                console.log("SUPPRESS [system] (5 CPU) - Suppress alerts for 30 ticks.");
                console.log("FABRICATE [npc] (7 CPU) - Insert hostile log (Evening).");
                console.log("LISTEN [room] (3 CPU) - Detect whispers (Evening).");
                break;
            default:
                if (cmd) mother.speak('LOW', `Unrecognized directive: ${cmd}`);
        }
    }

    inputLoop.close();
}

main();

function printSummary() {
    const aliveCount = getAliveCount();
    const threats = director.getThreatStatus();

    console.log(`\n=== SIM SUMMARY ===`);
    console.log(`DAY: ${GAME.day} | QUOTA: ${GAME.dayCargo}/${GAME.quotaPerDay} | TOTAL: ${GAME.totalCargo}`);
    console.log(`CREW: ${aliveCount}/${GAME.totalCrew} | LOYALTY: ${GAME.crewLoyalty}`);
    console.log(`ENDING: ${GAME.ending ?? 'NONE'}`);

    if (threats.length > 0) {
        console.log(`ACTIVE THREATS:`);
        for (const threat of threats) {
            console.log(`- ${threat.name} step ${threat.step}/${threat.totalSteps} target ${threat.target} next T+${threat.nextTick - STATE.tick}`);
        }
    } else {
        console.log(`ACTIVE THREATS: none`);
    }

    const tail = EVENT_LOG.slice(-8);
    if (tail.length > 0) {
        console.log(`RECENT EVENTS:`);
        for (const event of tail) {
            const actor = event.actor ? ` actor=${event.actor}` : '';
            const place = event.place ? ` place=${event.place}` : '';
            console.log(`- t${event.tick} ${event.type}${actor}${place}`);
        }
    }
}
