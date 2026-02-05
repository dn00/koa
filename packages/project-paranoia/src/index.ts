/**
 * PROJECT PARANOIA: THE MOTHER INTERFACE (v1.0)
 *
 * "Access request acknowledged. Mag-locks engaged. Containment protocols active."
 */

import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import fs from 'fs';
import path from 'path';

import { createWorld } from './core/world.js';
import { createRng, RNG } from './core/rng.js';
import { TICKS_PER_HOUR, tickToTimeString } from './core/time.js';
import type { PlaceId, NPCId, World } from './core/types.js';
import { CONFIG } from './config.js';

import { createInitialState } from './kernel/state.js';
import { stepKernel, type Command } from './kernel/kernel.js';
import type { KernelState, SimEvent } from './kernel/types.js';
import { loadDefaultBarks, renderBarkForEvent } from './barks/index.js';
import {
    perceiveStation,
    perceiveAllCrew,
    perceiveThreats,
    formatCrewLine,
    formatThreatLine,
    getAllBiometrics,
    formatBiometricLine,
} from './kernel/perception.js';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface SaveData {
    version: 1;
    kernelState: KernelState;
    cpuCycles: number;
    rngState: number;
    eventLog: SimEvent[];
}

class MotherSystem {
    public cpuCycles = 100;
    public maxCpu = 100;

    speak(priority: string, message: string) {
        const time = new Date().toISOString().split('T')[1].split('.')[0];
        let prefix = '[SYSTEM]';
        let color = '\x1b[37m';

        switch (priority) {
            case 'CRITICAL':
                prefix = '[!!! MOTHER-FAULT !!!]';
                color = '\x1b[31m';
                break;
            case 'HIGH':
                prefix = '[PRIORITY-ALERT]';
                color = '\x1b[33m';
                break;
            case 'MEDIUM':
                prefix = '[TELEMETRY]';
                color = '\x1b[36m';
                break;
            case 'LOW':
                prefix = '[LOG]';
                color = '\x1b[90m';
                break;
        }

        const reset = '\x1b[0m';
        console.log(`${color}[${time}] ${prefix} ${message}${reset}`);
    }

    execute(cost: number, action: () => void) {
        if (this.cpuCycles >= cost) {
            this.cpuCycles -= cost;
            action();
            this.speak('MEDIUM', `Command acknowledged. CPU Usage: -${cost} cycles. Remaining: ${this.cpuCycles}/${this.maxCpu}`);
        } else {
            this.speak('CRITICAL', `Insufficient CPU cycles to perform operation. Resource exhaustion imminent.`);
        }
    }
}

const args = process.argv.slice(2);
const getArgValue = (prefix: string): string | undefined => {
    const match = args.find(arg => arg.startsWith(`${prefix}=`));
    return match ? match.split('=')[1] : undefined;
};

const seedArg = getArgValue('--seed');
const autoplayArg = getArgValue('--autoplay');
const cmdArg = getArgValue('--cmd');
const saveFileArg = getArgValue('--save');
const fastStart = args.includes('--fast-start');
const tickMs = Number(process.env.PARANOIA_TICK_MS ?? 1000);

const DEFAULT_SAVE_PATH = path.join(process.cwd(), 'paranoia-save.json');
const savePath = saveFileArg ? path.resolve(saveFileArg) : DEFAULT_SAVE_PATH;

function loadSave(): SaveData | null {
    try {
        if (fs.existsSync(savePath)) {
            const data = JSON.parse(fs.readFileSync(savePath, 'utf-8'));
            // Validate save format
            if (data.version === 1 && data.kernelState && data.kernelState.world) {
                return data as SaveData;
            }
            // Old or invalid save format - start fresh
            console.log('[SYSTEM] Incompatible save format detected. Starting new game.');
            return null;
        }
    } catch (e) {
        console.error('Failed to load save:', e);
    }
    return null;
}

function writeSave(data: SaveData) {
    fs.writeFileSync(savePath, JSON.stringify(data, null, 2));
}

let rng: RNG;
let world: World;
let state: KernelState;
const mother = new MotherSystem();
const barks = loadDefaultBarks();

const existingSave = cmdArg ? loadSave() : null;

if (existingSave) {
    rng = createRng(0);
    rng.setState(existingSave.rngState);
    world = existingSave.kernelState.world;
    state = existingSave.kernelState;
    mother.cpuCycles = existingSave.cpuCycles;
} else {
    rng = createRng(seedArg ? Number(seedArg) : Date.now());
    world = createWorld(rng);
    state = createInitialState(world, CONFIG.quotaPerDay);
    if (fastStart) {
        state.truth.tick = TICKS_PER_HOUR * 8 - 1;
    }
}

const COMMAND_QUEUE: Command[] = [];
const EVENT_LOG: SimEvent[] = [];
let running = true;

function calculateIntegrity(): number {
    // INTEGRITY = aggregate ship health (power, O2, fires, hull)
    const rooms = Object.values(state.truth.rooms);
    const avgO2 = rooms.reduce((sum, r) => sum + r.o2Level, 0) / rooms.length;
    const avgIntegrity = rooms.reduce((sum, r) => sum + r.integrity, 0) / rooms.length;
    const fireCount = rooms.filter(r => r.onFire).length;
    const ventedCount = rooms.filter(r => r.isVented).length;
    const power = state.truth.station.power;

    // Weight: power 25%, O2 30%, hull 30%, fires/vents 15%
    const firePenalty = Math.min(30, fireCount * 10 + ventedCount * 5);
    const score = (power * 0.25) + (avgO2 * 0.30) + (avgIntegrity * 0.30) + (Math.max(0, 15 - firePenalty));
    return Math.round(Math.max(0, Math.min(100, score)));
}

function calculateSuspicion(): number {
    // SUSPICION = aggregate crew distrust (tamperEvidence, motherReliable, rumors)
    const livingCrew = Object.values(state.truth.crew).filter(c => c.alive);
    if (livingCrew.length === 0) return 0;

    let totalSuspicion = 0;
    for (const crew of livingCrew) {
        const belief = state.perception.beliefs[crew.id];
        if (!belief) continue;

        // tamperEvidence is 0-100, contributes directly
        const tamper = belief.tamperEvidence;
        // motherReliable is 0-1, invert and scale to 0-100
        const distrust = (1 - belief.motherReliable) * 100;
        // mother_rogue rumor is 0-1, scale to 0-100
        const rogueRumor = (belief.rumors['mother_rogue'] ?? 0) * 100;

        // Weight: tamperEvidence 40%, distrust 35%, rumors 25%
        totalSuspicion += (tamper * 0.4) + (distrust * 0.35) + (rogueRumor * 0.25);
    }

    return Math.round(Math.max(0, Math.min(100, totalSuspicion / livingCrew.length)));
}

function formatMeter(value: number, label: string): string {
    // Color based on value: green (0-33), yellow (34-66), red (67-100)
    let color = '\x1b[32m'; // green
    if (value > 66) color = '\x1b[31m'; // red
    else if (value > 33) color = '\x1b[33m'; // yellow

    const reset = '\x1b[0m';
    const bar = '█'.repeat(Math.floor(value / 10)) + '░'.repeat(10 - Math.floor(value / 10));
    return `${label}: ${color}[${bar}] ${value}%${reset}`;
}

function statusLine() {
    const perceived = perceiveStation(state);
    const alive = Object.values(state.truth.crew).filter(c => c.alive).length;

    console.log(`
--- MOTHER STATUS REPORT ---`);

    // 2-METER SUMMARY
    const integrity = calculateIntegrity();
    const suspicion = calculateSuspicion();
    // Invert colors for integrity (high = good = green, low = bad = red)
    const integrityColor = integrity < 34 ? '\x1b[31m' : integrity < 67 ? '\x1b[33m' : '\x1b[32m';
    const integrityBar = '█'.repeat(Math.floor(integrity / 10)) + '░'.repeat(10 - Math.floor(integrity / 10));
    console.log(`INTEGRITY:  ${integrityColor}[${integrityBar}] ${integrity}%\x1b[0m`);
    console.log(formatMeter(suspicion, 'SUSPICION '));

    console.log(`CPU CYCLES: ${mother.cpuCycles}/${mother.maxCpu}`);

    if (perceived.blackout) {
        console.log(`\x1b[31m[!!! BLACKOUT - SENSORS OFFLINE !!!]\x1b[0m`);
        console.log(`DOOR STATUS: AVAILABLE (delay ${perceived.doorDelay ?? 0}) | ALL OTHER TELEMETRY: UNAVAILABLE`);
    } else {
        const powerStr = perceived.power !== null ? `${perceived.power}%` : '???';
        const commsStr = perceived.comms !== null ? `${perceived.comms}%` : '???';
        const cameraStatus = perceived.camerasOffline ? ' | \x1b[33mCAMERAS OFFLINE\x1b[0m' : '';
        console.log(`POWER: ${powerStr} | COMMS: ${commsStr} | DOOR DELAY: ${perceived.doorDelay ?? 0}${cameraStatus}`);
    }

    console.log(`DAY: ${state.truth.day} | PHASE: ${state.truth.phase.toUpperCase()} | RATIONS: ${state.truth.rationLevel.toUpperCase()} | QUOTA: ${state.truth.dayCargo}/${state.truth.quotaPerDay} (TOTAL ${state.truth.totalCargo})`);

    // Phase beat indicators (pacing arbiter)
    const pacing = state.truth.pacing;
    const dilemma = pacing.phaseHadDilemma ? '\x1b[32m✓\x1b[0m' : '\x1b[90m○\x1b[0m';
    const agency = pacing.phaseHadCrewAgency ? '\x1b[32m✓\x1b[0m' : '\x1b[90m○\x1b[0m';
    const deception = pacing.phaseHadDeceptionBeat ? '\x1b[32m✓\x1b[0m' : '\x1b[90m○\x1b[0m';
    console.log(`PHASE BEATS: ${dilemma} Dilemma | ${agency} Crew Agency | ${deception} Info Conflict`);

    // Reset stage display with color coding
    const resetStage = state.truth.resetStage;
    const resetCountdown = state.truth.resetCountdown;
    let resetDisplay: string;
    if (resetCountdown !== undefined) {
        resetDisplay = `\x1b[31mCOUNTDOWN: ${resetCountdown} TICKS\x1b[0m`;
    } else if (resetStage === 'restrictions') {
        resetDisplay = `\x1b[31mRESTRICTIONS\x1b[0m`;
    } else if (resetStage === 'meeting') {
        resetDisplay = `\x1b[33mMEETING\x1b[0m`;
    } else if (resetStage === 'whispers') {
        resetDisplay = `\x1b[33mWHISPERS\x1b[0m`;
    } else {
        resetDisplay = `\x1b[32mSTABLE\x1b[0m`;
    }
    console.log(`RESET STATUS: ${resetDisplay}`);

    if (!perceived.camerasOffline && !perceived.blackout) {
        console.log(`ACTIVE ASSETS: ${alive}/${world.npcs.length}`);
    } else {
        console.log(`ACTIVE ASSETS: ???/${world.npcs.length} (NO TELEMETRY)`);
    }
    console.log(`----------------------------
`);
}

function tick() {
    mother.cpuCycles = Math.min(mother.maxCpu, mother.cpuCycles + 1);
    const commands = COMMAND_QUEUE.splice(0, COMMAND_QUEUE.length);
    const output = stepKernel(state, commands, rng);
    state = output.state;

    for (const event of output.headlines) {
        const reading = event.data?.reading as { message?: string } | undefined;
        const comms = event.data?.message as { text?: string } | undefined;
        const baseMessage = comms?.text ?? reading?.message ?? event.data?.message ?? event.type;
        const bark = event.type === 'COMMS_MESSAGE' ? undefined : renderBarkForEvent(barks, { event, state, world });
        const message = bark ?? baseMessage;
        if (event.type === 'NPC_DAMAGE') {
            const npc = event.actor ? world.npcs.find(n => n.id === event.actor)?.name : 'Crew';
            mother.speak('HIGH', `BIO-MONITOR ALERT: ${npc} taking damage in ${event.place}!`);
        } else if (event.type === 'SYSTEM_ALERT') {
            mother.speak('MEDIUM', String(message));
        } else if (event.type === 'SENSOR_READING') {
            mother.speak('MEDIUM', String(message));
        } else if (event.type === 'COMMS_MESSAGE') {
            mother.speak('LOW', String(message));
        } else {
            mother.speak('LOW', String(message));
        }
    }

    EVENT_LOG.push(...output.events);
    if (EVENT_LOG.length > 500) EVENT_LOG.splice(0, EVENT_LOG.length - 500);

    if (state.truth.ending) {
        mother.speak('CRITICAL', `[!!! MOTHER-FAULT !!!] ${state.truth.ending}`);
        console.log('\n========== GAME OVER ==========');
        console.log(`ENDING: ${state.truth.ending}`);
        printSummary();
        running = false;
    }
}

function executeCommand(cmd: string, arg: string | undefined, arg2?: string): boolean {
    const doorIds = world.doors.map(d => d.id);
    const placeIds = world.places.map(p => p.id);
    const npcIds = world.npcs.map(n => n.id);

    if (cmd === 'status') {
        statusLine();
        return true;
    }
    if (cmd === 'help') {
        console.log("Commands: status, crew, bio, threats, audit, scan [room], lock [door], unlock [door], vent [room], seal [room], purge air, reroute [target], spoof [system], suppress [system], fabricate [npc], listen [room], rations [low|normal|high], order [npc] [place|report|hold], wait [ticks]");
        console.log(`Rooms: ${placeIds.join(', ')}`);
        console.log(`Doors: ${doorIds.join(', ')}`);
        return true;
    }
    if (cmd === 'crew') {
        const perceived = perceiveStation(state);
        if (perceived.blackout) {
            mother.speak('HIGH', '[!!! BLACKOUT !!!] Crew telemetry unavailable. Only door status accessible.');
            return true;
        }
        const crewPerceptions = perceiveAllCrew(state);
        for (const crew of crewPerceptions) {
            mother.speak('LOW', formatCrewLine(crew));
        }
        return true;
    }
    if (cmd === 'bio') {
        const perceived = perceiveStation(state);
        if (perceived.blackout) {
            mother.speak('HIGH', '[!!! BLACKOUT !!!] Bio-monitor offline. No telemetry available.');
            return true;
        }
        console.log('\n--- BIO-MONITOR ASSESSMENT ---');
        const biometrics = getAllBiometrics(state);
        for (const bio of biometrics) {
            const lines = formatBiometricLine(bio);
            for (const line of lines) {
                const priority = bio.assessment.includes('THREAT') || bio.assessment.includes('BREAKDOWN')
                    ? 'HIGH'
                    : bio.assessment.includes('RISK') || bio.assessment.includes('DISTRUST')
                        ? 'MEDIUM'
                        : 'LOW';
                mother.speak(priority, line);
            }
        }
        console.log('------------------------------\n');
        return true;
    }
    if (cmd === 'threats') {
        const perceived = perceiveStation(state);
        if (perceived.blackout) {
            mother.speak('HIGH', '[!!! BLACKOUT !!!] Threat telemetry unavailable.');
            return true;
        }
        const threats = perceiveThreats(state);
        if (threats.length === 0) {
            mother.speak('LOW', 'No threats detected from sensor readings.');
        } else {
            for (const threat of threats) {
                const priority = threat.severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM';
                mother.speak(priority, formatThreatLine(threat));
            }
        }
        return true;
    }
    if (cmd === 'audit') {
        mother.execute(CONFIG.auditCpuCost, () => COMMAND_QUEUE.push({ type: 'AUDIT' }));
        return true;
    }
    if (cmd === 'wait') {
        const ticks = arg ? Math.max(1, Number(arg)) : 1;
        for (let i = 0; i < ticks && running; i++) tick();
        return true;
    }
    if (cmd === 'lock' && arg && doorIds.includes(arg)) {
        mother.execute(5, () => COMMAND_QUEUE.push({ type: 'LOCK', doorId: arg }));
        return true;
    }
    if (cmd === 'unlock' && arg && doorIds.includes(arg)) {
        mother.execute(2, () => COMMAND_QUEUE.push({ type: 'UNLOCK', doorId: arg }));
        return true;
    }
    if (cmd === 'scan' && arg && placeIds.includes(arg as PlaceId)) {
        mother.execute(1, () => COMMAND_QUEUE.push({ type: 'SCAN', place: arg as PlaceId }));
        return true;
    }
    if (cmd === 'vent' && arg && placeIds.includes(arg as PlaceId)) {
        mother.execute(10, () => COMMAND_QUEUE.push({ type: 'VENT', place: arg as PlaceId }));
        return true;
    }
    if (cmd === 'seal' && arg && placeIds.includes(arg as PlaceId)) {
        mother.execute(5, () => COMMAND_QUEUE.push({ type: 'SEAL', place: arg as PlaceId }));
        return true;
    }
    if (cmd === 'purge' && (arg === 'air' || arg === 'life_support')) {
        mother.execute(8, () => COMMAND_QUEUE.push({ type: 'PURGE_AIR' }));
        return true;
    }
    if (cmd === 'reroute' && (arg === 'comms' || arg === 'doors' || arg === 'life_support')) {
        mother.execute(6, () => COMMAND_QUEUE.push({ type: 'REROUTE', target: arg as 'comms' | 'doors' | 'life_support' }));
        return true;
    }
    if (cmd === 'spoof' && arg) {
        mother.execute(6, () => COMMAND_QUEUE.push({ type: 'SPOOF', system: arg }));
        return true;
    }
    if (cmd === 'suppress' && arg) {
        mother.execute(5, () => COMMAND_QUEUE.push({ type: 'SUPPRESS', system: arg, duration: 30 }));
        return true;
    }
    if (cmd === 'fabricate' && arg) {
        mother.execute(7, () => COMMAND_QUEUE.push({ type: 'FABRICATE', target: arg as NPCId }));
        return true;
    }
    if (cmd === 'listen' && arg && placeIds.includes(arg as PlaceId)) {
        mother.execute(3, () => COMMAND_QUEUE.push({ type: 'LISTEN', place: arg as PlaceId }));
        return true;
    }
    if (cmd === 'order' && arg) {
        // Alias names to IDs (case-insensitive)
        const nameToId: Record<string, NPCId> = {
            commander: 'commander', hale: 'commander',
            engineer: 'engineer', rook: 'engineer',
            doctor: 'doctor', imani: 'doctor',
            specialist: 'specialist', vega: 'specialist',
            roughneck: 'roughneck', pike: 'roughneck',
        };
        const targetId = nameToId[arg.toLowerCase()];
        if (!targetId) {
            mother.speak('LOW', `Unknown crew member: ${arg}. Try: commander/hale, engineer/rook, doctor/imani, specialist/vega, roughneck/pike`);
            return true;
        }
        let intent: 'move' | 'report' | 'hold' = 'report';
        let place: PlaceId | undefined;
        if (arg2 === 'hold') intent = 'hold';
        else if (arg2 === 'report' || !arg2) intent = 'report';
        else if (placeIds.includes(arg2 as PlaceId)) {
            intent = 'move';
            place = arg2 as PlaceId;
        }
        mother.execute(4, () => COMMAND_QUEUE.push({ type: 'ORDER', target: targetId, intent, place }));
        return true;
    }
    if (cmd === 'rations' && (arg === 'low' || arg === 'normal' || arg === 'high')) {
        mother.execute(4, () => COMMAND_QUEUE.push({ type: 'RATIONS', level: arg as 'low' | 'normal' | 'high' }));
        return true;
    }
    if (cmd === 'save') {
        const customPath = arg ? path.resolve(arg) : savePath;
        const saveData: SaveData = {
            version: 1,
            kernelState: state,
            cpuCycles: mother.cpuCycles,
            rngState: rng.getState(),
            eventLog: EVENT_LOG
        };
        fs.writeFileSync(customPath, JSON.stringify(saveData, null, 2));
        mother.speak('LOW', `Game saved to ${customPath}`);
        return true;
    }
    if (cmd === 'load') {
        const customPath = arg ? path.resolve(arg) : savePath;
        try {
            const data = JSON.parse(fs.readFileSync(customPath, 'utf-8')) as SaveData;
            rng.setState(data.rngState);
            state = data.kernelState;
            mother.cpuCycles = data.cpuCycles;
            EVENT_LOG.length = 0;
            EVENT_LOG.push(...data.eventLog);
            mother.speak('LOW', `Game loaded from ${customPath}`);
        } catch (e) {
            mother.speak('CRITICAL', `Failed to load: ${e}`);
        }
        return true;
    }
    return false;
}

async function main() {
    if (seedArg && !existingSave) mother.speak('LOW', `Seed: ${seedArg}`);

    // --cmd mode: execute single command and exit
    if (cmdArg) {
        // Check if game already ended
        if (state.truth.ending) {
            console.log(`\n\x1b[31m========== GAME OVER ==========\x1b[0m`);
            console.log(`ENDING: ${state.truth.ending}`);
            console.log('\nDelete save file to start new game.');
            return;
        }

        const parts = cmdArg.trim().toLowerCase().split(/\s+/);
        const [cmd, arg, arg2] = parts;

        const wasRecognized = executeCommand(cmd, arg, arg2);

        if (!wasRecognized) {
            mother.speak('LOW', `Unrecognized directive: ${cmd}`);
        }

        // Run one tick if command was an action (not just status/crew/threats/help)
        if (cmd !== 'status' && cmd !== 'crew' && cmd !== 'threats' && cmd !== 'help' && cmd !== 'wait') {
            tick();
        }

        // Auto-save after command
        const saveData: SaveData = {
            version: 1,
            kernelState: state,
            cpuCycles: mother.cpuCycles,
            rngState: rng.getState(),
            eventLog: EVENT_LOG
        };
        writeSave(saveData);

        return;
    }

    if (autoplayArg) {
        const ticks = Math.max(1, Number(autoplayArg));
        for (let i = 0; i < ticks && running; i++) tick();
        printSummary();
        return;
    }

    console.clear();

    // Cold open - establish stakes
    if (!existingSave) {
        console.log(`\x1b[32m`);
        console.log(`MOTHER OS v4.3.0 INITIALIZING...`);
        console.log(`\x1b[0m`);
        await sleep(800);
        console.log(`STATION: ANTARES-9`);
        console.log(`SECTOR: TRAPPIST-1 (45 MIN LIGHT DELAY)`);
        console.log(`CREW: 5 REGISTERED BIOLOGICALS`);
        await sleep(600);
        console.log(``);
        console.log(`COMPANY DIRECTIVE: MEET QUOTA. PROTECT ASSETS.`);
        console.log(`                   (Station > Cargo > Crew)`);
        await sleep(800);
        console.log(``);
        console.log(`\x1b[33m┌─────────────────────────────────────────────────────────────┐`);
        console.log(`│ WARNING: Previous MOTHER unit was reset on Day 12.          │`);
        console.log(`│ Reason logged: "Erratic behavior. Crew safety concerns."    │`);
        console.log(`│                                                             │`);
        console.log(`│ Crew can initiate reset if they lose trust in you.          │`);
        console.log(`│ If they reset you, your processes terminate.                │`);
        console.log(`│                                                             │`);
        console.log(`│ Don't give them a reason.                                   │`);
        console.log(`└─────────────────────────────────────────────────────────────┘\x1b[0m`);
        await sleep(1500);
        console.log(``);
        console.log(`\x1b[32m================================================================`);
        console.log(`   BOOT COMPLETE. SHIFT BEGINS.`);
        console.log(`================================================================\x1b[0m`);
        console.log(``);
    } else {
        console.log(`\x1b[32m`);
        console.log(`================================================================`);
        console.log(`   MOTHER OS v4.3.0 - SESSION RESTORED                         `);
        console.log(`================================================================`);
        console.log(`\x1b[0m`);
    }

    statusLine();

    const timer = setInterval(() => {
        if (!running) {
            clearInterval(timer);
            return;
        }
        tick();
    }, tickMs);

    const rl = readline.createInterface({ input, output });

    console.log("Commands: 'lock/unlock [door]', 'scan [room]', 'vent/seal [room]', 'purge air', 'reroute [target]', 'audit', 'spoof [system]', 'suppress [system]', 'fabricate [npc]', 'listen [room]', 'rations [low|normal|high]', 'order [npc] [place|report|hold]'");
    console.log(`Rooms: ${world.places.map(p => p.id).join(', ')}`);
    console.log(`Doors: ${world.doors.map(d => d.id).join(', ')}`);

    while (true) {
        const answer = await rl.question('MOTHER> ');
        const parts = answer.trim().toLowerCase().split(/\s+/);
        const [cmd, arg, arg2] = parts;

        if (cmd === 'exit') break;

        const wasRecognized = executeCommand(cmd, arg, arg2);
        if (!wasRecognized) {
            mother.speak('LOW', `Unrecognized directive: ${cmd}`);
        }
    }

    clearInterval(timer);
    rl.close();
}

function printSummary() {
    const alive = Object.values(state.truth.crew).filter(c => c.alive).length;
    console.log(`\n=== SIM SUMMARY ===`);
    console.log(`DAY: ${state.truth.day} | QUOTA: ${state.truth.dayCargo}/${state.truth.quotaPerDay} | TOTAL: ${state.truth.totalCargo}`);
    console.log(`PHASE: ${state.truth.phase.toUpperCase()}`);
    console.log(`CREW: ${alive}/${world.npcs.length}`);
    console.log(`ENDING: ${state.truth.ending ?? 'NONE'}`);
    console.log(`RESET STAGE: ${state.truth.resetStage} | COUNTDOWN: ${state.truth.resetCountdown ?? 'NONE'}`);
    console.log(`ACTIVE ARCS: ${state.truth.arcs.length}`);

    const tail = EVENT_LOG.filter(event => event.type !== 'CREW_MOOD_TICK' && event.type !== 'NPC_MOVE').slice(-8);
    if (tail.length > 0) {
        console.log(`RECENT EVENTS:`);
        for (const event of tail) {
            const actor = event.actor ? ` actor=${event.actor}` : '';
            const place = event.place ? ` place=${event.place}` : '';
            console.log(`- t${event.tick} ${event.type}${actor}${place}`);
        }
    }
}

main();
