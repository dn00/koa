
import { createWorld } from '../core/world.js';
import { createRng, RNG } from '../core/rng.js';
import { TICKS_PER_HOUR, TICKS_PER_DAY } from '../core/time.js';
import type { PlaceId, NPCId, DoorId, World } from '../core/types.js';
import { CONFIG } from '../config.js';
import { createInitialState } from './state.js';
import { stepKernel, type Command } from './kernel.js';
import type { KernelState, SimEvent } from './types.js';
import { SCENARIO_TEMPLATES, createManifest } from './manifest.js';
import { calculateIntegrity as calcIntegrity } from './integrity.js';
import { getAdjustedCpuCost } from './commands.js';
import { loadDefaultBarks, renderBarkForEvent, type Bark } from '../barks/index.js';
import {
    perceiveStation,
    perceiveAllCrew,
    perceiveThreats,
    formatCrewLine,
    formatThreatLine,
    getAllBiometrics,
    formatBiometricLine
} from './perception.js';


export interface MotherOptions {
    seed?: number;
    saveData?: SaveData;
    templateId?: string;
    fastStart?: boolean;
}

export interface SaveData {
    version: 1;
    kernelState: KernelState;
    cpuCycles: number;
    rngState: number;
    eventLog: SimEvent[];
}

export interface EngineLogEntry {
    id: string;
    timestamp: string;
    source: 'SYSTEM' | 'MOTHER' | 'BIO' | 'ALERT' | 'COMMS';
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    severity?: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
    metadata?: {
        type: 'ROOM' | 'CREW';
        id: string;
    };
}

export class MotherEngine {
    public rng: RNG;
    public world: World;
    public state: KernelState;
    public cpuCycles = 100;
    public maxCpu = 100;
    public eventLog: SimEvent[] = [];
    public logs: EngineLogEntry[] = [];
    private barks: Bark[];

    // Day recap tracking
    private lastTrackedDay: number;
    private dayStartSuspicion: number;

    constructor(options: MotherOptions = {}) {
        this.barks = loadDefaultBarks();

        if (options.saveData) {
            this.rng = createRng(0);
            this.rng.setState(options.saveData.rngState);
            this.world = options.saveData.kernelState.world;
            this.state = options.saveData.kernelState;
            this.cpuCycles = options.saveData.cpuCycles;
            this.eventLog = [...options.saveData.eventLog];
        } else {
            this.rng = createRng(options.seed ?? Date.now());
            this.world = createWorld(this.rng);
            const template = options.templateId ? SCENARIO_TEMPLATES[options.templateId] : undefined;
            const manifest = template ? createManifest(template) : undefined;
            this.state = createInitialState(this.world, CONFIG.quotaPerDay, manifest);
            if (options.fastStart) {
                this.state.truth.tick = TICKS_PER_HOUR * 8 - 1;
            }
        }

        this.lastTrackedDay = this.state.truth.day;
        this.dayStartSuspicion = this.calculateSuspicion();

        // Initial boot log
        if (!options.saveData) {
            this.log('SYSTEM', 'MOTHER OS v4.3.0 INITIALIZED', 'success');
            this.log('MOTHER', 'Access request acknowledged. Mag-locks engaged. Containment protocols active.', 'info');
        } else {
            this.log('SYSTEM', 'MOTHER OS v4.3.0 - SESSION RESTORED', 'success');
        }
    }

    public tick() {
        this.cpuCycles = Math.min(this.maxCpu, this.cpuCycles + 1);

        // We need to flush the command queue. In existing code, COMMAND_QUEUE was global. 
        // We'll process any pending commands here if we had a queue, but for now dispatch() executes immediately/pushes to kernel.
        // Actually stepKernel takes commands.
        // We need a queue in the engine.
        const commandsToExecute = this.commandQueue.splice(0, this.commandQueue.length);

        const output = stepKernel(this.state, commandsToExecute, this.rng);
        this.state = output.state;

        for (const event of output.headlines) {
            const reading = event.data?.reading as { message?: string } | undefined;
            const comms = event.data?.message as { text?: string } | undefined;
            const baseMessage = comms?.text ?? reading?.message ?? event.data?.message ?? event.type;
            const bark = event.type === 'COMMS_MESSAGE' ? undefined : renderBarkForEvent(this.barks, { event, state: this.state, world: this.world });
            const message = bark ?? baseMessage;

            if (event.type === 'NPC_DAMAGE') {
                const npcId = event.actor;
                const npc = npcId ? this.world.npcs.find(n => n.id === npcId)?.name : 'Crew';
                this.log('BIO', `BIO-MONITOR ALERT: ${npc} taking damage in ${event.place}!`, 'warning', 'HIGH', npcId ? { type: 'CREW', id: npcId } : undefined);
            } else if (event.type === 'SYSTEM_ALERT') {
                this.log('ALERT', String(message), 'warning', 'MEDIUM');
            } else if (event.type === 'SENSOR_READING') {
                this.log('MOTHER', String(message), 'info', 'MEDIUM');
            } else if (event.type === 'COMMS_MESSAGE') {
                this.log('COMMS', String(message), 'info', 'LOW');
            } else {
                this.log('MOTHER', String(message), 'info', 'LOW');
            }
        }

        this.eventLog.push(...output.events);
        if (this.eventLog.length > 500) this.eventLog.splice(0, this.eventLog.length - 500);

        // Day recap logic could go here, but avoiding console logs.
        if (this.state.truth.day !== this.lastTrackedDay) {
            // New day logic
            const endSuspicion = this.calculateSuspicion();
            this.log('SYSTEM', `DAY ${this.lastTrackedDay} COMPLETE. SUSPICION DELTA: ${Math.round(endSuspicion - this.dayStartSuspicion)}%`, 'info');
            this.lastTrackedDay = this.state.truth.day;
            this.dayStartSuspicion = endSuspicion;
        }

        if (this.state.truth.ending) {
            this.log('SYSTEM', `GAME OVER. ENDING: ${this.state.truth.ending}`, 'error', 'CRITICAL');
        }
    }

    private commandQueue: Command[] = [];

    public dispatch(command: Command) {
        this.commandQueue.push(command);
    }

    // Helper to calculate cost and execute if affordable
    public executeWithCost(cost: number, action: () => void, failureMsg: string = 'Insufficient CPU cycles.') {
        const adjustedCost = getAdjustedCpuCost(cost, this.state.truth.resetStage);
        if (this.cpuCycles >= adjustedCost) {
            this.cpuCycles -= adjustedCost;
            action();
            this.log('MOTHER', `Command acknowledged. CPU Usage: -${adjustedCost} cycles.`, 'info');
            return true;
        } else {
            this.log('MOTHER', `${failureMsg} (Need ${adjustedCost}, Have ${this.cpuCycles})`, 'error', 'CRITICAL');
            return false;
        }
    }

    private logCounter = 0;

    private log(
        source: EngineLogEntry['source'],
        message: string,
        type: EngineLogEntry['type'] = 'info',
        severity: EngineLogEntry['severity'] = 'LOW',
        metadata?: EngineLogEntry['metadata']
    ) {
        // Format timestamp HH:MM:SS based on real time for now, or sim time?
        // Sim time is tick based. Let's use sim time roughly? Or just real time as per original.
        // Original used new Date().
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });

        this.logs.push({
            id: String(++this.logCounter),
            timestamp: time,
            source,
            message,
            type,
            severity,
            metadata
        });

        // Keep logs manageable
        if (this.logs.length > 200) this.logs.shift();
    }

    // --- Accessors for UI ---

    public get integrity(): number {
        const rooms = Object.values(this.state.truth.rooms);
        return calcIntegrity(rooms, this.state.truth.station.power);
    }

    public get suspicion(): number {
        return this.calculateSuspicion();
    }

    // Expose calculateSuspicion publicly or mimic private logic
    public calculateSuspicion(): number {
        const livingCrew = Object.values(this.state.truth.crew).filter(c => c.alive);
        if (livingCrew.length === 0) return 0;

        let totalSuspicion = 0;
        for (const crew of livingCrew) {
            const belief = this.state.perception.beliefs[crew.id];
            if (!belief) continue;

            const tamper = belief.tamperEvidence;
            const distrust = (1 - belief.motherReliable) * 100;
            const rogueRumor = (belief.rumors['mother_rogue'] ?? 0) * 100;

            // Weigh: tamperEvidence 40%, distrust 35%, rumors 25% (as per index.ts)
            totalSuspicion += (tamper * 0.4) + (distrust * 0.35) + (rogueRumor * 0.25);
        }

        return Math.round(Math.max(0, Math.min(100, totalSuspicion / livingCrew.length)));
    }

    public getSerializeData(): SaveData {
        return {
            version: 1,
            kernelState: this.state,
            cpuCycles: this.cpuCycles,
            rngState: this.rng.getState(),
            eventLog: this.eventLog
        };
    }
}
