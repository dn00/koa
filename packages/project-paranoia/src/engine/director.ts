/**
 * THE DIRECTOR SYSTEM
 * Threat Clocks + Event Scoring (R.I.V.E.T. compatible)
 */

import type { SimEvent, World, PlaceId } from '../core/types.js';
import type { RNG } from '../core/rng.js';
import { SystemsManager } from './systems.js';
import { CONFIG } from '../config.js';

export type EventPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface InterestScore {
    stakes: number;
    dilemma: number;
    clarity: number;
    proximity: number;
    novelty: number;
    spamPenalty: number;
    unfairness: number;
}

interface Proposal {
    id: string;
    tick: number;
    priority: EventPriority;
    message: string;
    tag: string;
    kind: 'THREAT' | 'SIM';
    score: number;
    execute?: () => void;
    meta: InterestScore;
}

export interface Headline {
    priority: EventPriority;
    message: string;
}

export interface ThreatStatus {
    id: string;
    name: string;
    step: number;
    totalSteps: number;
    nextTick: number;
    target: PlaceId;
}

interface ThreatStep {
    name: string;
    priority: EventPriority;
    message: (target: PlaceId) => string;
    execute?: (systems: SystemsManager, target: PlaceId) => void;
    meta: Omit<InterestScore, 'novelty' | 'spamPenalty' | 'unfairness'>;
}

interface ThreatClockDef {
    id: string;
    name: string;
    minInterval: number;
    maxInterval: number;
    steps: ThreatStep[];
    pickTarget: (world: World, rng: RNG) => PlaceId;
}

interface ActiveThreat {
    def: ThreatClockDef;
    stepIndex: number;
    nextTick: number;
    target: PlaceId;
}

const MAX_ACTIVE_THREATS = CONFIG.maxActiveThreats;
const MAX_THREAT_ADVANCES_PER_TICK = CONFIG.maxThreatAdvancesPerTick;
const MAX_HEADLINES_PER_TICK = CONFIG.maxHeadlinesPerTick;

export class Director {
    private rng: RNG;
    private threats: ThreatClockDef[];
    private active: ActiveThreat[] = [];
    private recentTags = new Map<string, number>();
    private nextActivationTick = 0;

    constructor(rng: RNG) {
        this.rng = rng;
        this.threats = createThreats();
    }

    tick(
        tick: number,
        simEvents: SimEvent[],
        systems: SystemsManager,
        world: World
    ): { executed: Proposal[]; headlines: Headline[] } {
        this.maybeActivateThreat(tick, world);

        const threatProposals = this.collectThreatProposals(tick, systems);
        const executedThreats = this.executeThreats(tick, threatProposals);

        const headlineCandidates = [
            ...executedThreats,
            ...this.mapSimEvents(simEvents, world, tick, systems),
        ];

        const headlines = this.selectHeadlines(headlineCandidates, tick);

        return {
            executed: executedThreats,
            headlines,
        };
    }

    getThreatStatus(): ThreatStatus[] {
        return this.active.map(active => ({
            id: active.def.id,
            name: active.def.name,
            step: active.stepIndex + 1,
            totalSteps: active.def.steps.length,
            nextTick: active.nextTick,
            target: active.target,
        }));
    }

    exportState(): {
        active: { defId: string; stepIndex: number; nextTick: number; target: PlaceId }[];
        recentTags: Record<string, number>;
        nextActivationTick: number;
        rngState: number;
    } {
        return {
            active: this.active.map(a => ({
                defId: a.def.id,
                stepIndex: a.stepIndex,
                nextTick: a.nextTick,
                target: a.target,
            })),
            recentTags: Object.fromEntries(this.recentTags),
            nextActivationTick: this.nextActivationTick,
            rngState: this.rng.getState(),
        };
    }

    importState(state: {
        active: { defId: string; stepIndex: number; nextTick: number; target: PlaceId }[];
        recentTags: Record<string, number>;
        nextActivationTick: number;
        rngState: number;
    }) {
        this.active = state.active.map(a => {
            const def = this.threats.find(t => t.id === a.defId);
            if (!def) throw new Error(`Unknown threat: ${a.defId}`);
            return { def, stepIndex: a.stepIndex, nextTick: a.nextTick, target: a.target };
        });
        this.recentTags = new Map(Object.entries(state.recentTags));
        this.nextActivationTick = state.nextActivationTick;
        this.rng.setState(state.rngState);
    }

    private maybeActivateThreat(tick: number, world: World) {
        if (tick < this.nextActivationTick) return;
        if (this.active.length >= MAX_ACTIVE_THREATS) return;
        if (this.rng.nextInt(100) > CONFIG.threatActivationChance) return;

        const inactive = this.threats.filter(def =>
            !this.active.find(active => active.def.id === def.id)
        );
        if (inactive.length === 0) return;

        const def = this.rng.pick(inactive);
        const target = def.pickTarget(world, this.rng);
        const interval = def.minInterval + this.rng.nextInt(def.maxInterval - def.minInterval + 1);

        this.active.push({
            def,
            stepIndex: 0,
            nextTick: tick + interval,
            target,
        });

        this.nextActivationTick = tick + CONFIG.threatActivationCooldown;
    }

    private collectThreatProposals(tick: number, systems: SystemsManager): Proposal[] {
        const proposals: Proposal[] = [];

        for (const threat of this.active) {
            if (tick < threat.nextTick) continue;
            const step = threat.def.steps[threat.stepIndex];
            const meta: InterestScore = {
                ...step.meta,
                novelty: this.getNoveltyScore(`${threat.def.id}:${step.name}`, tick),
                spamPenalty: this.getSpamPenalty(threat.def.id, tick),
                unfairness: 0,
            };
            const score = scoreInterest(meta);
            proposals.push({
                id: `${threat.def.id}:${threat.stepIndex}:${tick}`,
                tick,
                priority: step.priority,
                message: step.message(threat.target),
                tag: `threat:${threat.def.id}`,
                kind: 'THREAT',
                score,
                execute: step.execute ? () => step.execute!(systems, threat.target) : undefined,
                meta,
            });
        }

        return proposals;
    }

    private executeThreats(tick: number, proposals: Proposal[]): Proposal[] {
        const executed: Proposal[] = [];
        if (proposals.length === 0) return executed;

        proposals.sort((a, b) => b.score - a.score);
        const selected = proposals.slice(0, MAX_THREAT_ADVANCES_PER_TICK);

        for (const proposal of selected) {
            proposal.execute?.();
            executed.push(proposal);
            this.recentTags.set(proposal.tag, tick);

            const threatId = proposal.tag.replace('threat:', '');
            const active = this.active.find(t => t.def.id === threatId);
            if (!active) continue;

            active.stepIndex++;
            if (active.stepIndex >= active.def.steps.length) {
                this.active = this.active.filter(t => t !== active);
            } else {
                const interval = active.def.minInterval + this.rng.nextInt(active.def.maxInterval - active.def.minInterval + 1);
                active.nextTick = tick + interval;
            }
        }

        for (const proposal of proposals) {
            if (selected.includes(proposal)) continue;
            const threatId = proposal.tag.replace('threat:', '');
            const active = this.active.find(t => t.def.id === threatId);
            if (active) active.nextTick = tick + 3;
        }

        return executed;
    }

    private mapSimEvents(simEvents: SimEvent[], world: World, tick: number, systems: SystemsManager): Proposal[] {
        const proposals: Proposal[] = [];

        for (const event of simEvents) {
            if (event.type === 'NPC_MOVE') continue;
            const npcName = event.actor ? world.npcs.find(n => n.id === event.actor)?.name : undefined;
            const placeName = event.place ? world.places.find(p => p.id === event.place)?.name : undefined;

            let priority: EventPriority = 'LOW';
            let message = '';
            let meta: InterestScore = {
                stakes: 0,
                dilemma: 0,
                clarity: 2,
                proximity: 2,
                novelty: 0,
                spamPenalty: 0,
                unfairness: 0,
            };

            if (event.type === 'NPC_DAMAGE') {
                priority = 'HIGH';
                message = `BIO-MONITOR ALERT: ${npcName ?? 'Crew'} taking damage in ${placeName ?? event.place}!`;
                meta = { stakes: 4, dilemma: 3, clarity: 3, proximity: 3, novelty: 0, spamPenalty: 0, unfairness: 0 };
            } else if (event.type === 'NPC_DEATH') {
                priority = 'CRITICAL';
                message = `ASSET LOST: ${npcName ?? 'Crew'} expired in ${placeName ?? event.place}.`;
                meta = { stakes: 5, dilemma: 2, clarity: 3, proximity: 3, novelty: 0, spamPenalty: 0, unfairness: 0 };
            } else if (event.type === 'CARGO_YIELD') {
                priority = 'LOW';
                message = `Extraction yield logged in ${placeName ?? event.place}.`;
                meta = { stakes: 2, dilemma: 1, clarity: 2, proximity: 2, novelty: 0, spamPenalty: 0, unfairness: 0 };
            } else if (event.type === 'SYSTEM_ACTION') {
                priority = 'MEDIUM';
                message = event.data?.message as string ?? 'System action executed.';
                meta = { stakes: 2, dilemma: 1, clarity: 3, proximity: 2, novelty: 0, spamPenalty: 0, unfairness: 0 };
            } else if (event.type === 'DOOR_OPENED') {
                priority = 'LOW';
                message = `Door cycle detected near ${placeName ?? event.place}.`;
                meta = { stakes: 1, dilemma: 0, clarity: 2, proximity: 1, novelty: 0, spamPenalty: 0, unfairness: 0 };
            } else if (event.type === 'SYSTEM_ALERT') {
                const system = event.data?.system as string | undefined;
                if (system && systems.isSuppressed(system)) {
                    continue;
                }
                priority = 'MEDIUM';
                message = event.data?.message as string ?? 'System alert.';
                meta = { stakes: 2, dilemma: 1, clarity: 3, proximity: 2, novelty: 0, spamPenalty: 0, unfairness: 0 };
            } else {
                continue;
            }

            meta.novelty = this.getNoveltyScore(`sim:${event.type}:${event.place ?? ''}`, tick);
            meta.spamPenalty = this.getSpamPenalty(`sim:${event.type}`, tick);

            proposals.push({
                id: event.id,
                tick: event.tick,
                priority,
                message,
                tag: `sim:${event.type}`,
                kind: 'SIM',
                score: scoreInterest(meta),
                meta,
            });
        }

        return proposals;
    }

    private selectHeadlines(candidates: Proposal[], tick: number): Headline[] {
        if (candidates.length === 0) return [];

        const sorted = [...candidates].sort((a, b) => {
            const priorityScore = priorityValue(b.priority) - priorityValue(a.priority);
            if (priorityScore !== 0) return priorityScore;
            return b.score - a.score;
        });

        const headlines: Headline[] = [];
        for (const candidate of sorted) {
            if (headlines.length >= MAX_HEADLINES_PER_TICK) break;
            if (candidate.score < 4 && candidate.priority !== 'CRITICAL') continue;
            headlines.push({ priority: candidate.priority, message: candidate.message });
            this.recentTags.set(candidate.tag, tick);
        }

        return headlines;
    }

    private getNoveltyScore(tag: string, tick: number): number {
        const last = this.recentTags.get(tag);
        if (!last) return 2;
        const delta = tick - last;
        if (delta > 60) return 2;
        if (delta > 30) return 1;
        return 0;
    }

    private getSpamPenalty(tag: string, tick: number): number {
        const last = this.recentTags.get(tag);
        if (!last) return 0;
        const delta = tick - last;
        if (delta < 5) return 2;
        if (delta < 15) return 1;
        return 0;
    }
}

function scoreInterest(meta: InterestScore): number {
    return (
        meta.stakes +
        meta.dilemma +
        meta.clarity +
        meta.proximity +
        meta.novelty -
        meta.spamPenalty -
        meta.unfairness
    );
}

function priorityValue(priority: EventPriority): number {
    if (priority === 'CRITICAL') return 100;
    if (priority === 'HIGH') return 50;
    if (priority === 'MEDIUM') return 20;
    return 10;
}

function createThreats(): ThreatClockDef[] {
    return [
        {
            id: 'solar_flare',
            name: 'Solar Flare',
            minInterval: 8,
            maxInterval: 14,
            pickTarget: (world, rng) => rng.pick(world.places).id,
            steps: [
                {
                    name: 'telegraph',
                    priority: 'LOW',
                    message: () => '[SENSOR] Solar activity spike detected. Comms jitter increasing.',
                    meta: { stakes: 1, dilemma: 0, clarity: 3, proximity: 2 },
                },
                {
                    name: 'escalation',
                    priority: 'MEDIUM',
                    message: () => '[WARNING] Solar flare: door latency rising. Manual overrides advised.',
                    execute: systems => {
                        systems.applyDoorDelay(6);
                        systems.setComms(70);
                    },
                    meta: { stakes: 2, dilemma: 2, clarity: 3, proximity: 3 },
                },
                {
                    name: 'blackout',
                    priority: 'HIGH',
                    message: () => '[ALERT] Solar flare peak. Local blackout risk rising.',
                    execute: systems => {
                        systems.applyDoorDelay(10);
                        systems.setComms(40);
                        systems.triggerBlackout(6);
                    },
                    meta: { stakes: 3, dilemma: 2, clarity: 3, proximity: 3 },
                },
                {
                    name: 'failure',
                    priority: 'CRITICAL',
                    message: () => '[CRISIS] Solar flare impact. Reactor scram initiated.',
                    execute: systems => {
                        systems.setPower(60);
                        systems.triggerBlackout(10);
                    },
                    meta: { stakes: 4, dilemma: 3, clarity: 3, proximity: 3 },
                },
            ],
        },
        {
            id: 'scrubber_failure',
            name: 'Air Scrubber Failure',
            minInterval: 10,
            maxInterval: 16,
            pickTarget: (world, rng) =>
                rng.pick(world.places.filter(p => p.sector === 'habitation')).id,
            steps: [
                {
                    name: 'telegraph',
                    priority: 'LOW',
                    message: target => `[SENSOR] ${target.toUpperCase()}: Air scrubber load increasing.`,
                    meta: { stakes: 1, dilemma: 0, clarity: 3, proximity: 2 },
                },
                {
                    name: 'drop',
                    priority: 'MEDIUM',
                    message: target => `[WARNING] ${target.toUpperCase()}: O2 efficiency dropping.`,
                    execute: (systems, target) => systems.adjustO2(target, -15),
                    meta: { stakes: 2, dilemma: 2, clarity: 3, proximity: 3 },
                },
                {
                    name: 'contagion',
                    priority: 'HIGH',
                    message: target => `[ALERT] ${target.toUpperCase()}: Scrubber failure spreading.`,
                    execute: (systems, target) => systems.adjustO2(target, -25),
                    meta: { stakes: 3, dilemma: 2, clarity: 3, proximity: 3 },
                },
                {
                    name: 'failure',
                    priority: 'CRITICAL',
                    message: target => `[CRISIS] ${target.toUpperCase()}: O2 collapse imminent.`,
                    execute: (systems, target) => systems.adjustO2(target, -35),
                    meta: { stakes: 4, dilemma: 3, clarity: 3, proximity: 3 },
                },
            ],
        },
        {
            id: 'reactor_overheat',
            name: 'Reactor Overheat',
            minInterval: 12,
            maxInterval: 18,
            pickTarget: () => 'engineering',
            steps: [
                {
                    name: 'telegraph',
                    priority: 'LOW',
                    message: () => '[SENSOR] Engineering thermal variance detected.',
                    meta: { stakes: 1, dilemma: 0, clarity: 3, proximity: 2 },
                },
                {
                    name: 'escalation',
                    priority: 'MEDIUM',
                    message: () => '[WARNING] Engineering temperature rising. Cooling load spiking.',
                    execute: systems => systems.adjustO2('engineering', -5),
                    meta: { stakes: 2, dilemma: 2, clarity: 3, proximity: 3 },
                },
                {
                    name: 'fire',
                    priority: 'HIGH',
                    message: () => '[ALERT] Engineering heat critical. Fire risk escalating.',
                    execute: systems => systems.igniteRoom('engineering'),
                    meta: { stakes: 3, dilemma: 3, clarity: 3, proximity: 3 },
                },
                {
                    name: 'failure',
                    priority: 'CRITICAL',
                    message: () => '[CRISIS] Engineering fire spreading. Venting protocols advised.',
                    execute: systems => systems.adjustO2('engineering', -25),
                    meta: { stakes: 4, dilemma: 4, clarity: 3, proximity: 3 },
                },
            ],
        },
    ];
}
