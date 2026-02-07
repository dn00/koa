/**
 * PROJECT PARANOIA: THE MOTHER INTERFACE (v1.0)
 *
 * "Access request acknowledged. Mag-locks engaged. Containment protocols active."
 */

import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import fs from 'fs';
import path from 'path';

// Core imports preserved for CLI argument parsing helpers if needed, but Engine handles most
import { MotherEngine, type SaveData, type EngineLogEntry } from './kernel/engine.js';
import type { NPCId, PlaceId, DoorId } from './core/types.js';
import {
    formatCrewLine,
    formatBiometricLine,
    formatThreatLine,
    formatLedgerEntries,
    formatActiveDoubtsDisplay,
    formatDayRecap,
    perceiveStation,
    perceiveAllCrew,
    perceiveThreats,
    getAllBiometrics,
    formatMeter
} from './kernel/perception.js';
import { TICKS_PER_DAY } from './core/time.js';
import { CONFIG } from './config.js';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// CLI Presentation Layer
class MotherCLI {
    private engine: MotherEngine;
    private running = true;
    private savePath: string;

    constructor(engine: MotherEngine, savePath: string) {
        this.engine = engine;
        this.savePath = savePath;
    }

    // Process new logs from the engine and print them
    public flushLogs() {
        const newLogs = this.engine.logs.filter(l => Number(l.id) > this.lastLogId);
        for (const log of newLogs) {
            this.printLog(log);
            this.lastLogId = Number(log.id);
        }
    }

    private lastLogId = 0;

    private printLog(log: EngineLogEntry) {
        const reset = '\x1b[0m';
        let color = '\x1b[37m';
        let prefix = '[LOG]';

        switch (log.severity) {
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

        // Override based on source
        if (log.source === 'BIO') color = '\x1b[36m'; // Cyan
        if (log.source === 'ALERT') { color = '\x1b[33m'; prefix = '[ALERT]'; }

        console.log(`${color}[${log.timestamp}] ${prefix} ${log.message}${reset}`);
    }

    public statusLine() {
        const state = this.engine.state;
        const perceived = perceiveStation(state);
        const alive = Object.values(state.truth.crew).filter(c => c.alive).length;

        console.log(`\n--- MOTHER STATUS REPORT ---`);

        const integrity = this.engine.integrity;
        const suspicion = this.engine.suspicion;

        const integrityColor = integrity < 34 ? '\x1b[31m' : integrity < 67 ? '\x1b[33m' : '\x1b[32m';
        const integrityBar = '█'.repeat(Math.floor(integrity / 10)) + '░'.repeat(10 - Math.floor(integrity / 10));
        console.log(`INTEGRITY:  ${integrityColor}[${integrityBar}] ${integrity}%\x1b[0m`);
        console.log(formatMeter(suspicion, 'SUSPICION '));

        const ledgerLines = formatLedgerEntries(state.perception.suspicionLedger, 5);
        if (ledgerLines.length > 0) {
            console.log('Recent changes:');
            for (const line of ledgerLines) console.log(line);
        }

        const doubtLines = formatActiveDoubtsDisplay(state.perception.activeDoubts, state.truth.tick);
        if (doubtLines.length > 0) {
            console.log('Active doubts:');
            for (const line of doubtLines) console.log(line);
        }

        console.log(`CPU CYCLES: ${this.engine.cpuCycles}/${this.engine.maxCpu}`);

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

        const pacing = state.truth.pacing;
        const dilemma = pacing.phaseHadDilemma ? '\x1b[32m✓\x1b[0m' : '\x1b[90m○\x1b[0m';
        const agency = pacing.phaseHadCrewAgency ? '\x1b[32m✓\x1b[0m' : '\x1b[90m○\x1b[0m';
        const deception = pacing.phaseHadDeceptionBeat ? '\x1b[32m✓\x1b[0m' : '\x1b[90m○\x1b[0m';
        console.log(`PHASE BEATS: ${dilemma} Dilemma | ${agency} Crew Agency | ${deception} Info Conflict`);

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

        const ticksSinceVerify = state.truth.tick - state.truth.lastVerifyTick;
        const verifyRemaining = CONFIG.verifyCooldown - ticksSinceVerify;
        if (verifyRemaining <= 0) {
            console.log(`VERIFY: \x1b[32mREADY\x1b[0m`);
        } else {
            console.log(`VERIFY: \x1b[33mRECALIBRATING (${verifyRemaining} ticks)\x1b[0m`);
        }

        if (!perceived.camerasOffline && !perceived.blackout) {
            console.log(`ACTIVE ASSETS: ${alive}/${this.engine.world.npcs.length}`);
        } else {
            console.log(`ACTIVE ASSETS: ???/${this.engine.world.npcs.length} (NO TELEMETRY)`);
        }
        console.log(`----------------------------\n`);
    }

    public async executeLoop(tickMs: number) {
        // Initial flush
        this.flushLogs();
        this.statusLine();

        const timer = setInterval(() => {
            if (!this.running) {
                clearInterval(timer);
                return;
            }
            this.engine.tick();
            this.flushLogs();
            if (this.engine.state.truth.ending) {
                this.printSummary();
                this.running = false;
            }
        }, tickMs);

        const rl = readline.createInterface({ input, output });

        console.log("Commands: 'lock/unlock [door]', 'scan [room]', 'vent/seal [room]', 'purge air', 'reroute [target]', 'audit', 'verify', 'spoof [system]', 'suppress [system]', 'fabricate [npc]', 'alert [system]', 'announce [system]', 'downplay [system]', 'listen [room]', 'rations [low|normal|high]', 'order [npc] [place|report|hold]'");
        console.log(`Rooms: ${this.engine.world.places.map(p => p.id).join(', ')}`);
        console.log(`Doors: ${this.engine.world.doors.map(d => d.id).join(', ')}`);

        while (this.running) {
            const answer = await rl.question('MOTHER> ');
            const parts = answer.trim().toLowerCase().split(/\s+/);
            const [cmd, arg, arg2] = parts;

            if (cmd === 'exit') break;

            this.executeCommand(cmd, arg, arg2);
            this.flushLogs(); // Flush implicit logs from command ack
        }

        clearInterval(timer);
        rl.close();
    }

    public executeCommand(cmd: string, arg: string | undefined, arg2?: string): boolean {
        const { state, world } = this.engine;
        const doorIds = world.doors.map(d => d.id);
        const placeIds = world.places.map(p => p.id);

        if (cmd === 'status') {
            this.statusLine();
            return true;
        }
        if (cmd === 'help') {
            console.log("Commands: status, crew, bio, threats, audit, verify, scan [room], lock [door], unlock [door], vent [room], seal [room], purge air, reroute [target], spoof [system], suppress [system], fabricate [npc], alert [system], announce [system], downplay [system], listen [room], rations [low|normal|high], order [npc] [place|report|hold], wait [ticks]");
            return true;
        }
        if (cmd === 'crew') {
            const perceived = perceiveStation(state);
            if (perceived.blackout) {
                console.log('\x1b[33m[!!! BLACKOUT !!!] Crew telemetry unavailable. Only door status accessible.\x1b[0m');
                return true;
            }
            const crewPerceptions = perceiveAllCrew(state);
            for (const crew of crewPerceptions) {
                console.log(formatCrewLine(crew));
            }
            return true;
        }
        if (cmd === 'bio') {
            const perceived = perceiveStation(state);
            if (perceived.blackout) {
                console.log('\x1b[33m[!!! BLACKOUT !!!] Bio-monitor offline. No telemetry available.\x1b[0m');
                return true;
            }
            console.log('\n--- BIO-MONITOR ASSESSMENT ---');
            const biometrics = getAllBiometrics(state);
            for (const bio of biometrics) {
                const lines = formatBiometricLine(bio);
                for (const line of lines) {
                    // Simple coloring based on content
                    const color = bio.assessment.includes('THREAT') ? '\x1b[31m' : '\x1b[36m';
                    console.log(`${color}${line}\x1b[0m`);
                }
            }
            console.log('------------------------------\n');
            return true;
        }
        if (cmd === 'threats') {
            const perceived = perceiveStation(state);
            if (perceived.blackout) {
                console.log('\x1b[33m[!!! BLACKOUT !!!] Threat telemetry unavailable.\x1b[0m');
                return true;
            }
            const threats = perceiveThreats(state);
            if (threats.length === 0) {
                console.log('No threats detected from sensor readings.');
            } else {
                for (const threat of threats) {
                    console.log(formatThreatLine(threat));
                }
            }
            return true;
        }

        // Actions delegated to Engine
        if (cmd === 'audit') {
            return this.engine.executeWithCost(CONFIG.auditCpuCost, () => this.engine.dispatch({ type: 'AUDIT' }));
        }

        if (cmd === 'verify') {
            return this.engine.executeWithCost(CONFIG.verifyCpuCost, () => this.engine.dispatch({ type: 'VERIFY' }));
        }

        if (cmd === 'wait') {
            const ticks = arg ? Math.max(1, Number(arg)) : 1;
            for (let i = 0; i < ticks && this.running; i++) this.engine.tick();
            return true;
        }

        if (cmd === 'lock' && arg && doorIds.includes(arg as DoorId)) {
            return this.engine.executeWithCost(5, () => this.engine.dispatch({ type: 'LOCK', doorId: arg as DoorId }));
        }

        if (cmd === 'unlock' && arg && doorIds.includes(arg as DoorId)) {
            return this.engine.executeWithCost(2, () => this.engine.dispatch({ type: 'UNLOCK', doorId: arg as DoorId }));
        }

        if (cmd === 'scan' && arg && placeIds.includes(arg as PlaceId)) {
            return this.engine.executeWithCost(1, () => this.engine.dispatch({ type: 'SCAN', place: arg as PlaceId }));
        }

        if (cmd === 'vent' && arg && placeIds.includes(arg as PlaceId)) {
            return this.engine.executeWithCost(10, () => this.engine.dispatch({ type: 'VENT', place: arg as PlaceId }));
        }

        if (cmd === 'seal' && arg && placeIds.includes(arg as PlaceId)) {
            return this.engine.executeWithCost(5, () => this.engine.dispatch({ type: 'SEAL', place: arg as PlaceId }));
        }

        if (cmd === 'purge' && (arg === 'air' || arg === 'life_support')) {
            return this.engine.executeWithCost(8, () => this.engine.dispatch({ type: 'PURGE_AIR' }));
        }

        if (cmd === 'reroute' && (arg === 'comms' || arg === 'doors' || arg === 'life_support')) {
            return this.engine.executeWithCost(6, () => this.engine.dispatch({ type: 'REROUTE', target: arg as any }));
        }

        if (cmd === 'spoof' && arg) {
            return this.engine.executeWithCost(6, () => this.engine.dispatch({ type: 'SPOOF', system: arg }));
        }

        if (cmd === 'suppress' && arg) {
            return this.engine.executeWithCost(5, () => this.engine.dispatch({ type: 'SUPPRESS', system: arg, duration: 30 }));
        }

        if (cmd === 'fabricate' && arg) {
            return this.engine.executeWithCost(7, () => this.engine.dispatch({ type: 'FABRICATE', target: arg as NPCId }));
        }

        if (cmd === 'alert' && arg) {
            return this.engine.executeWithCost(3, () => this.engine.dispatch({ type: 'ALERT', system: arg }));
        }

        if (cmd === 'announce') {
            if (!arg) { console.log('Usage: announce <system>'); return true; }
            return this.engine.executeWithCost(4, () => this.engine.dispatch({ type: 'ANNOUNCE', system: arg }));
        }

        if (cmd === 'downplay') {
            if (!arg) { console.log('Usage: downplay <system>'); return true; }
            return this.engine.executeWithCost(2, () => this.engine.dispatch({ type: 'DOWNPLAY', system: arg }));
        }

        if (cmd === 'listen' && arg && placeIds.includes(arg as PlaceId)) {
            return this.engine.executeWithCost(3, () => this.engine.dispatch({ type: 'LISTEN', place: arg as PlaceId }));
        }

        if (cmd === 'order' && arg) {
            const nameToId: Record<string, NPCId> = {
                commander: 'commander', hale: 'commander',
                engineer: 'engineer', rook: 'engineer',
                doctor: 'doctor', imani: 'doctor',
                specialist: 'specialist', vega: 'specialist',
                roughneck: 'roughneck', pike: 'roughneck',
            };
            const targetId = nameToId[arg.toLowerCase()];
            if (!targetId) {
                console.log(`Unknown crew member: ${arg}.`);
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
            return this.engine.executeWithCost(4, () => this.engine.dispatch({ type: 'ORDER', target: targetId, intent, place }));
        }

        if (cmd === 'rations' && (arg === 'low' || arg === 'normal' || arg === 'high')) {
            return this.engine.executeWithCost(4, () => this.engine.dispatch({ type: 'RATIONS', level: arg as any }));
        }

        if (cmd === 'save') {
            const customPath = arg ? path.resolve(arg) : this.savePath;
            const data = this.engine.getSerializeData();
            fs.writeFileSync(customPath, JSON.stringify(data, null, 2));
            console.log(`Game saved to ${customPath}`);
            return true;
        }

        if (cmd === 'load') {
            const customPath = arg ? path.resolve(arg) : this.savePath;
            try {
                const data = JSON.parse(fs.readFileSync(customPath, 'utf-8')) as SaveData;
                this.engine = new MotherEngine({ saveData: data });
                console.log(`Game loaded from ${customPath}`);
                this.flushLogs();
            } catch (e) {
                console.log(`Failed to load: ${e}`);
            }
            return true;
        }

        console.log(`Unrecognized directive: ${cmd}`);
        return false;
    }

    public printSummary() {
        const state = this.engine.state;
        const alive = Object.values(state.truth.crew).filter(c => c.alive).length;
        console.log(`\n=== SIM SUMMARY ===`);
        console.log(`DAY: ${state.truth.day} | QUOTA: ${state.truth.dayCargo}/${state.truth.quotaPerDay} | TOTAL: ${state.truth.totalCargo}`);
        console.log(`PHASE: ${state.truth.phase.toUpperCase()}`);
        console.log(`CREW: ${alive}/${this.engine.world.npcs.length}`);
        console.log(`ENDING: ${state.truth.ending ?? 'NONE'}`);
        console.log(`RESET STAGE: ${state.truth.resetStage} | COUNTDOWN: ${state.truth.resetCountdown ?? 'NONE'}`);
        console.log(`ACTIVE ARCS: ${state.truth.arcs.length}`);
    }
}

// MAIN ENTRY POINT
const args = process.argv.slice(2);
const getArgValue = (prefix: string): string | undefined => {
    const match = args.find(arg => arg.startsWith(`${prefix}=`));
    return match ? match.split('=')[1] : undefined;
};

const seedArg = getArgValue('--seed');
const autoplayArg = getArgValue('--autoplay');
const cmdArg = getArgValue('--cmd');
const saveFileArg = getArgValue('--save');
const templateArg = getArgValue('--template');
const fastStart = args.includes('--fast-start');
const tickMs = Number(process.env.PARANOIA_TICK_MS ?? 1000);

const DEFAULT_SAVE_PATH = path.join(process.cwd(), 'paranoia-save.json');
const savePath = saveFileArg ? path.resolve(saveFileArg) : DEFAULT_SAVE_PATH;

function loadSave(): SaveData | null {
    try {
        if (fs.existsSync(savePath)) {
            const data = JSON.parse(fs.readFileSync(savePath, 'utf-8'));
            if (data.version === 1 && data.kernelState && data.kernelState.world) {
                return data as SaveData;
            }
            console.log('[SYSTEM] Incompatible save format detected. Starting new game.');
            return null;
        }
    } catch (e) {
        console.error('Failed to load save:', e);
    }
    return null;
}

// Write helper for immediate save in cmd mode
function writeSave(data: SaveData) {
    fs.writeFileSync(savePath, JSON.stringify(data, null, 2));
}

async function main() {
    const existingSave = cmdArg ? loadSave() : null;

    // Initialize Engine
    const engine = new MotherEngine({
        seed: seedArg ? Number(seedArg) : undefined,
        saveData: existingSave ?? undefined,
        templateId: templateArg,
        fastStart
    });

    const cli = new MotherCLI(engine, savePath);

    if (seedArg && !existingSave) console.log(`[LOG] Seed: ${seedArg}`);

    // CMD MODE (Single Command)
    if (cmdArg) {
        if (engine.state.truth.ending) {
            console.log(`\n\x1b[31m========== GAME OVER ==========\x1b[0m`);
            console.log(`ENDING: ${engine.state.truth.ending}`);
            console.log('\nDelete save file to start new game.');
            return;
        }

        const parts = cmdArg.trim().toLowerCase().split(/\s+/);
        const [cmd, arg, arg2] = parts;

        cli.executeCommand(cmd, arg, arg2);

        // Run one tick if command was an action
        // List of instant checks that don't tick:
        const instantCmds = ['status', 'crew', 'threats', 'help', 'wait', 'save', 'load', 'bio'];
        if (!instantCmds.includes(cmd)) {
            engine.tick();
            cli.flushLogs();
        }

        writeSave(engine.getSerializeData());
        return;
    }

    // AUTOPLAY MODE
    if (autoplayArg) {
        const ticks = Math.max(1, Number(autoplayArg));
        for (let i = 0; i < ticks; i++) {
            engine.tick();
            if (engine.state.truth.ending) break;
        }
        cli.printSummary();
        return;
    }

    // INTERACTIVE MODE
    console.clear();

    // Cold open if new game
    if (!existingSave) {
        // Just print initial logs that engine generated
        cli.flushLogs();

        console.log(`\x1b[33m┌─────────────────────────────────────────────────────────────┐`);
        console.log(`│ WARNING: Previous MOTHER unit was reset on Day 12.          │`);
        console.log(`│ ...                                                         │`);
        console.log(`└─────────────────────────────────────────────────────────────┘\x1b[0m`);

        await sleep(1000);
        console.log(`\n\x1b[32mBOOT COMPLETE. SHIFT BEGINS.\x1b[0m\n`);
    } else {
        cli.flushLogs();
    }

    await cli.executeLoop(tickMs);
}

main();
