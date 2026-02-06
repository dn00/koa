import { CONFIG } from '../../config.js';
import type { KernelState, SimEvent, SensorReading } from '../types.js';
import type { NPCId } from '../../core/types.js';
import { clamp } from '../utils.js';
import { topicToSubject } from './comms.js';

// Calculate overall crew suspicion of MOTHER (0-100)
export function calculateCrewSuspicion(state: KernelState): number {
    const beliefs = state.perception.beliefs;
    const aliveCrew = Object.values(state.truth.crew).filter(c => c.alive);
    if (aliveCrew.length === 0) return 0;

    let totalSuspicion = 0;
    for (const crew of aliveCrew) {
        const belief = beliefs[crew.id];
        if (!belief) continue;

        // Tamper evidence (0-100) → 0-40 points
        const tamperScore = (belief.tamperEvidence / 100) * 40;

        // Distrust (1 - motherReliable) → 0-35 points
        const distrustScore = (1 - belief.motherReliable) * 35;

        // mother_rogue rumor (0-1) → 0-25 points
        const rumorScore = (belief.rumors['mother_rogue'] ?? 0) * 25;

        totalSuspicion += tamperScore + distrustScore + rumorScore;
    }

    return Math.round(totalSuspicion / aliveCrew.length);
}

// EVENT-DRIVEN SUSPICION: Apply suspicion change to all living crew
// Positive values increase suspicion (bad for MOTHER), negative values decrease it
export function applySuspicionChange(state: KernelState, amount: number, reason: string, detail: string = '') {
    // ALWAYS write ledger entry first (even for zero-delta — player sees "nothing happened")
    state.perception.suspicionLedger.push({
        tick: state.truth.tick,
        delta: amount,
        reason,
        detail,
    });

    // Cap at 100 entries
    if (state.perception.suspicionLedger.length > 100) {
        state.perception.suspicionLedger.shift();
    }

    if (amount === 0) return;

    const beliefs = state.perception.beliefs;
    for (const npc of Object.values(state.truth.crew)) {
        if (!npc.alive) continue;
        const belief = beliefs[npc.id];
        if (!belief) continue;

        if (amount > 0) {
            // Suspicion rises: reduce motherReliable and/or bump tamperEvidence
            // Convert suspicion points to motherReliable reduction (rough scale: 10 suspicion ≈ -0.05 reliable)
            belief.motherReliable = clamp(belief.motherReliable - (amount / 200), 0, 1);
            // Also bump tamperEvidence slightly for large suspicion gains
            if (amount >= 8) {
                belief.tamperEvidence = clamp(belief.tamperEvidence + Math.floor(amount / 2), 0, 100);
            }
        } else {
            // Suspicion falls: increase motherReliable
            belief.motherReliable = clamp(belief.motherReliable - (amount / 200), 0, 1);
        }
    }
}

let eventOrdinal = 0;

export function updateBeliefs(state: KernelState, events: SimEvent[]) {
    const beliefs = state.perception.beliefs;
    for (const event of events) {
        if (event.type === 'SENSOR_READING') {
            const reading = event.data?.reading as SensorReading | undefined;
            if (!reading) continue;

            const confidence = clamp(reading.confidence, 0, 1);
            const lowConf = confidence < 0.5;
            const highConf = confidence >= 0.8;

            for (const npc of Object.values(state.truth.crew)) {
                if (!npc.alive) continue;
                const belief = beliefs[npc.id];
                if (!belief) continue;

                if (reading.source === 'sensor' && highConf) {
                    belief.motherReliable = clamp(belief.motherReliable + 0.01, 0, 1);
                }
                if (reading.source === 'system' && lowConf) {
                    belief.motherReliable = clamp(belief.motherReliable - 0.02, 0, 1);
                    belief.tamperEvidence = clamp(belief.tamperEvidence + 1, 0, 100);
                }
                if (reading.hallucination) {
                    belief.motherReliable = clamp(belief.motherReliable - 0.005, 0, 1);
                }
            }

            // DEAD WEIGHT: crewTrust modified but never read for decisions
            // if (reading.source === 'crew' && event.actor) {
            //     const actor = event.actor as NPCId;
            //     for (const npc of Object.values(state.truth.crew)) {
            //         if (!npc.alive) continue;
            //         const belief = beliefs[npc.id];
            //         if (!belief) continue;
            //         const trust = belief.crewTrust[actor] ?? 0.5;
            //         const delta = reading.hallucination ? -0.03 : (highConf ? 0.02 : -0.01);
            //         belief.crewTrust[actor] = clamp(trust + delta, 0, 1);
            //     }
            // }

            if (reading.target) {
                for (const npc of Object.values(state.truth.crew)) {
                    if (!npc.alive) continue;
                    const belief = beliefs[npc.id];
                    if (!belief) continue;
                    // const trust = belief.crewTrust[reading.target] ?? 0.5; // DEAD WEIGHT
                    // belief.crewTrust[reading.target] = clamp(trust - 0.04, 0, 1); // DEAD WEIGHT
                    belief.crewGrudge[reading.target] = clamp((belief.crewGrudge[reading.target] ?? 0) + 2, 0, 100);
                }
            }
        }

        if (event.type === 'COMMS_MESSAGE') {
            const message = event.data?.message as any;
            if (!message) continue;
            if (message.kind === 'order') continue;
            const topic = String(message.topic ?? '');
            const targets: NPCId[] = [];
            if (message.kind === 'broadcast' && message.place) {
                for (const npc of Object.values(state.truth.crew)) {
                    if (!npc.alive) continue;
                    if (npc.place === message.place) targets.push(npc.id);
                }
            } else if (message.to && message.to !== 'PLAYER') {
                targets.push(message.to as NPCId);
            }

            for (const receiver of targets) {
                const belief = beliefs[receiver];
                if (!belief) continue;
                belief.rumors[topic] = clamp((belief.rumors[topic] ?? 0) + 0.25, 0, 1);
                if (topic === 'mother_rogue') {
                    belief.motherReliable = clamp(belief.motherReliable - 0.05, 0, 1);
                    belief.tamperEvidence = clamp(belief.tamperEvidence + 3, 0, 100);
                }
                const subject = topicToSubject(topic);
                if (subject) {
                    // belief.crewTrust[subject] = clamp((belief.crewTrust[subject] ?? 0.5) - CONFIG.whisperTrustImpact / 100, 0, 1); // DEAD WEIGHT
                    belief.crewGrudge[subject] = clamp((belief.crewGrudge[subject] ?? 0) + CONFIG.whisperGrudgeImpact, 0, 100);
                }
            }

            if (message.from && message.from !== 'PLAYER' && message.from !== 'SYSTEM') {
                state.perception.rumors.push({
                    id: `${state.truth.tick}-rumor-${eventOrdinal++}`,
                    tick: state.truth.tick,
                    topic,
                    subject: topicToSubject(topic) ?? undefined,
                    source: message.from as NPCId,
                    strength: 0.5,
                    place: message.place,
                });
            }
        }

        if (event.type === 'TAMPER_SUPPRESS' || event.type === 'TAMPER_SPOOF' || event.type === 'TAMPER_FABRICATE') {
            for (const npc of Object.values(state.truth.crew)) {
                if (!npc.alive) continue;
                const belief = beliefs[npc.id];
                if (!belief) continue;
                belief.tamperEvidence = clamp(belief.tamperEvidence + CONFIG.tamperEvidenceGain, 0, 100);
            }
        }

        if (event.type === 'NPC_DAMAGE') {
            const victim = event.actor as NPCId | undefined;
            const attacker = event.data?.attacker as NPCId | undefined;
            if (victim && attacker) {
                const belief = beliefs[victim];
                if (belief) {
                    belief.crewGrudge[attacker] = clamp((belief.crewGrudge[attacker] ?? 0) + 10, 0, 100);
                    // belief.crewTrust[attacker] = clamp((belief.crewTrust[attacker] ?? 0.5) - 0.15, 0, 1); // DEAD WEIGHT
                }
            }
        }
    }

    // Apply belief shifts to truth loyalty/paranoia (soft coupling)
    for (const npc of Object.values(state.truth.crew)) {
        if (!npc.alive) continue;
        const belief = beliefs[npc.id];
        if (!belief) continue;
        if (belief.motherReliable < 0.45) npc.loyalty = clamp(npc.loyalty - 1, 0, 100);
        if (belief.motherReliable > 0.85) npc.loyalty = clamp(npc.loyalty + 1, 0, 100);
        if (belief.motherReliable < 0.35) npc.paranoia = clamp(npc.paranoia + 1, 0, 100);
        if (belief.tamperEvidence > CONFIG.tamperEvidenceThreshold) {
            npc.loyalty = clamp(npc.loyalty - 2, 0, 100);
            npc.paranoia = clamp(npc.paranoia + 1, 0, 100);
            belief.rumors['mother_rogue'] = clamp(Math.max(belief.rumors['mother_rogue'] ?? 0, 0.5), 0, 1);
        }
    }

    // Rumor propagation (evening only)
    if (state.truth.phase === 'evening') {
        const recentRumors = state.perception.rumors.filter(r => state.truth.tick - r.tick <= 10);
        for (const rumor of recentRumors) {
            const place = rumor.place;
            if (!place) continue;
            const listeners = Object.values(state.truth.crew).filter(c => c.alive && c.place === place && c.id !== rumor.source);
            for (const listener of listeners) {
                const belief = beliefs[listener.id];
                if (!belief) continue;
                belief.rumors[rumor.topic] = clamp((belief.rumors[rumor.topic] ?? 0) + rumor.strength * 0.2, 0, 1);
            }
        }
    }

    if (state.perception.rumors.length > 200) {
        state.perception.rumors.splice(0, state.perception.rumors.length - 200);
    }

    // Decay tamper evidence and rumors
    for (const npc of Object.values(state.truth.crew)) {
        if (!npc.alive) continue;
        const belief = beliefs[npc.id];
        if (!belief) continue;
        belief.tamperEvidence = clamp(belief.tamperEvidence - CONFIG.tamperEvidenceDecay, 0, 100);
        for (const key of Object.keys(belief.rumors)) {
            belief.rumors[key] = clamp(belief.rumors[key] - CONFIG.rumorDecay, 0, 1);
        }
    }

    // Natural suspicion drift - DISABLED (event-driven suspicion now)
    // Kept for reference but drift amount is 0 in config
    if (CONFIG.suspicionDriftAmount > 0 && state.truth.tick % CONFIG.suspicionDriftInterval === 0) {
        for (const npc of Object.values(state.truth.crew)) {
            if (!npc.alive) continue;
            const belief = beliefs[npc.id];
            if (!belief) continue;
            // Paranoid crew drift faster, calm crew drift slower
            const driftMultiplier = 1 + (npc.paranoia / 100);
            belief.motherReliable = clamp(belief.motherReliable - CONFIG.suspicionDriftAmount * driftMultiplier, 0, 1);
        }
    }

    // Trust recovery - if MOTHER hasn't tampered, trust slowly rebuilds
    if (state.truth.tick % CONFIG.trustRecoveryInterval === 0) {
        for (const npc of Object.values(state.truth.crew)) {
            if (!npc.alive) continue;
            const belief = beliefs[npc.id];
            if (!belief) continue;
            // Only recover trust if tamperEvidence is low (no recent tampering detected)
            if (belief.tamperEvidence < 10) {
                belief.motherReliable = clamp(belief.motherReliable + CONFIG.trustRecoveryAmount, 0, 1);
            }
        }
    }
}
